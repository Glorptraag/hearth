import { after, NextRequest, NextResponse } from 'next/server';

// Extend serverless lifetime so the `after()` enrichment callback has room
// to finish (Sanity context reads + Haiku call + two DB writebacks). Default
// is 10s on Hobby / 15s on Pro — too tight; this is the suspected cause of
// production-readiness-tracker #34 (Anthropic billed, no DB writeback).
export const maxDuration = 60;
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { learningEntries, moduleRuns, plannerEntries } from '@/lib/db/schema';
import { getFamilyByClerkId, checkWritePermission } from '@/lib/auth/helpers';
import { eq, and, gte, lte, desc, arrayContains } from 'drizzle-orm';
import { attachEvidence, writeEntryEvidence } from '@/lib/evidence-db';
import { SUBJECTS, ENTRY_SOURCES, ENTRY_STATUSES } from '@/types';
import { enrichEntry } from '@/lib/ai/enrich';
import { buildThreadLinksFromActivities } from '@/lib/ai/thread-links';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';
import { triggerDraftResume } from '@/lib/notifications/triggers';
import { rateLimit } from '@/lib/rate-limit';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { trackServer, hashForAnalytics } from '@/lib/analytics/posthog-server';

export const GET = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const params = request.nextUrl.searchParams;
  const learnerId = params.get('learnerId');
  const status = params.get('status');
  const startDate = params.get('startDate');
  const endDate = params.get('endDate');
  const limit = parseInt(params.get('limit') ?? '50', 10);
  const offset = parseInt(params.get('offset') ?? '0', 10);

  const conditions = [eq(learningEntries.familyId, family.id)];

  if (learnerId) {
    conditions.push(arrayContains(learningEntries.learnerIds, [learnerId]));
  }
  if (status) {
    conditions.push(eq(learningEntries.status, status));
  }
  if (startDate) {
    conditions.push(gte(learningEntries.dateOccurred, startDate));
  }
  if (endDate) {
    conditions.push(lte(learningEntries.dateOccurred, endDate));
  }

  const entries = await db
    .select()
    .from(learningEntries)
    .where(and(...conditions))
    .orderBy(desc(learningEntries.dateOccurred))
    .limit(limit)
    .offset(offset);

  // Attach learning_entry_evidence rows (caption-carrying read side of the
  // evidenceUrls dual-write). Consumers that only read evidenceUrls ignore it.
  return NextResponse.json(await attachEvidence(entries));
}, { route: 'GET /api/entries' });

const observationDetailSchema = z.object({
  detail: z.string(),
  durationMin: z.number().int().positive().optional(),
});

const createEntrySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dateOccurred: z.string().optional(),
  subjects: z.array(z.enum(SUBJECTS)).optional(),
  learnerIds: z.array(z.string().uuid()).optional(),
  engagementPerLearner: z.record(z.string(), z.number().min(1).max(4)).optional(),
  discoveriesPerLearner: z.record(z.string(), z.string()).optional(),
  evidenceUrls: z.array(z.string()).optional(),
  // Full-fidelity evidence rows for the learning_entry_evidence dual-write.
  // Mirrors evidenceUrls (photos) but carries captions the text[] can't hold.
  evidence: z
    .array(
      z.object({
        kind: z.enum(['photo', 'quote', 'note', 'link', 'audio']),
        content: z.string(),
        caption: z.string().optional(),
      }),
    )
    .optional(),
  source: z.enum(ENTRY_SOURCES).optional(),
  sourceModuleId: z.string().optional(),
  // The module_runs row this log closes out. Set by the runner's Log mode;
  // saving a complete entry for a sustained run marks the run finished (the
  // single writer of run completion — see /api/module-runs).
  moduleRunId: z.string().uuid().optional(),
  // Planner provenance: the planner_entries row the parent launched the runner
  // from (planner card title → /module/[id]?plannerEntryId=…).
  plannerEntryId: z.string().uuid().optional(),
  // Sanity activity IDs the family engaged with. Populated by the module
  // runner Log mode (and by the Logger attach-to-module flow via PATCH).
  // Drives per-activity capability mapping in thread_links.
  sourceActivityIds: z.array(z.string()).optional(),
  // Which approach (modality) was picked in the runner.
  sourceApproachId: z.string().optional(),
  sourceProjectId: z.string().optional(),
  sourceStageNumber: z.number().optional(),
  sourceSessionId: z.string().uuid().optional(),
  status: z.enum(ENTRY_STATUSES).optional(),
  observationDetails: z.record(z.string(), observationDetailSchema).optional(),
  // The Logger's structured capture context — observation chips, activity
  // type, where, how long. Read by the enrichment prompt and by pedagogy
  // retrieval. Bounded so a client can't stuff the row.
  loggerContext: z
    .object({
      activityType: z.string().max(40).nullable().optional(),
      observations: z.array(z.string().max(80)).max(30).optional(),
      location: z.string().max(40).nullable().optional(),
      duration: z.string().max(20).nullable().optional(),
    })
    .optional(),
  mode: z.enum(['guided', 'quick']).optional(),
});

export const POST = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit: 30 entries per minute per user (protects AI pipeline)
  const rl = rateLimit(`entries:${userId}`, { limit: 30, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  // Check write permission: only owner/editor can create entries (viewer is read-only)
  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions to create entries' }, { status: writeCheck.statusCode });
  }

  const result = await parseBody(request, createEntrySchema);
  if ('error' in result) return result.error;
  const parsed = result;

  // `evidence` is written to its own table (not a learning_entries column), so
  // it's pulled out of the spread below.
  const { mode, evidence: evidenceItems, ...entryData } = parsed.data;

  // A claimed run must be this family's — otherwise the FK would let one
  // family stamp its entries onto another family's run history.
  let claimedRun: typeof moduleRuns.$inferSelect | null = null;
  if (entryData.moduleRunId) {
    const [run] = await db
      .select()
      .from(moduleRuns)
      .where(and(eq(moduleRuns.id, entryData.moduleRunId), eq(moduleRuns.familyId, family.id)))
      .limit(1);
    if (!run) {
      return NextResponse.json({ error: 'moduleRunId does not reference your family\'s run' }, { status: 400 });
    }
    claimedRun = run;
  }

  // Same family guard for planner provenance.
  if (entryData.plannerEntryId) {
    const [plan] = await db
      .select({ id: plannerEntries.id })
      .from(plannerEntries)
      .where(and(eq(plannerEntries.id, entryData.plannerEntryId), eq(plannerEntries.familyId, family.id)))
      .limit(1);
    if (!plan) {
      return NextResponse.json({ error: 'plannerEntryId does not reference your family\'s planner entry' }, { status: 400 });
    }
  }

  // Log mode for telemetry (informational only — not gated server-side)
  if (mode) {
    console.log(JSON.stringify({ event: 'entry_save', mode, familyId: family.id }));
  }

  const willEnrich = parsed.data.status === 'complete';
  const [entry] = await db
    .insert(learningEntries)
    .values({
      familyId: family.id,
      ...entryData,
      // Seed enrichment with pending status so the Logger post-save surface
      // can distinguish "in flight" from "never ran" while the after() job
      // runs. Overwritten by enrichEntry on success / by the catch on failure.
      ...(willEnrich
        ? { aiEnrichment: { status: 'pending' as const, startedAt: new Date().toISOString() } }
        : {}),
    })
    .returning();

  // Dual-write the caption-carrying evidence rows. evidenceUrls is already
  // committed on the entry above, so this is best-effort (see evidence-db.ts).
  await writeEntryEvidence(entry.id, evidenceItems, entryData.evidenceUrls);

  // A complete log closes out a SUSTAINED run (open_ended runs — nature
  // journals, instrument practice — are long-lived and survive their logs).
  // Best-effort: a failed flip must never fail the save; the run would simply
  // read as stale later.
  if (claimedRun && willEnrich && claimedRun.sessionType === 'sustained'
    && (claimedRun.state === 'active' || claimedRun.state === 'paused')) {
    const now = new Date();
    await db
      .update(moduleRuns)
      .set({ state: 'finished', finishedAt: now, lastActiveAt: now, updatedAt: now })
      .where(eq(moduleRuns.id, claimedRun.id))
      .catch((err) => console.error('[entries/POST] run finish failed:', err));
  }

  // Async AI enrichment — does not block the response.
  // CRITICAL: wrap in `after()` so Vercel serverless keeps the function
  // instance alive past the response. A bare fire-and-forget Promise
  // (the old pattern) is killed the moment NextResponse returns —
  // entries land but never get enriched, with no error trace anywhere.
  if (willEnrich) {
    const enrichStart = Date.now();
    after(async () => {
      // Route-level tape was the diagnostic surface for tracker #34. Now
      // that the pipeline is healthy these gate on ENRICH_TAPE=1 so prod
      // logs stay quiet. enrichEntry() itself still logs a one-line summary
      // on success and full detail on failure.
      const TAPE = process.env.ENRICH_TAPE === '1';
      if (TAPE) console.log(`[enrich-tape] entryId=${entry.id} step=after-fired ts=${Date.now() - enrichStart}ms`);
      try {
        await enrichEntry({ entryId: entry.id, familyId: family.id });
        if (TAPE) console.log(`[enrich-tape] entryId=${entry.id} step=enrichEntry-done ts=${Date.now() - enrichStart}ms`);

        // Declarative thread mapping from activity metadata (workstream E).
        // Runs alongside Haiku's inferred capability_threads; the two layers
        // complement each other. Best-effort — never blocks snapshot.
        const activityIds = parsed.data.sourceActivityIds ?? [];
        if (activityIds.length > 0) {
          const threadLinks = await buildThreadLinksFromActivities(activityIds);
          if (threadLinks.length > 0) {
            await db
              .update(learningEntries)
              .set({ threadLinks, updatedAt: new Date() })
              .where(eq(learningEntries.id, entry.id))
              .catch((err) => console.error('[entries/POST] threadLinks write failed:', err));
          }
        }

        await rebuildSnapshot(family.id, 'entry_saved').catch(() => {});
        if (TAPE) console.log(`[enrich-tape] entryId=${entry.id} step=snapshot-done ts=${Date.now() - enrichStart}ms`);
        // Identify on Clerk userId so the event joins with client-side
        // events (entry_created, etc.) which identify the same way.
        trackServer('entry_enriched', userId, {
          duration_ms: Date.now() - enrichStart,
          status: 'ok',
          entry_id: hashForAnalytics(entry.id),
        }, { familyId: family.id });
      } catch (err) {
        console.error('[entries/POST] AI pipeline error:', err);
        // Mark the entry as failed so the post-save surface can render an
        // honest state instead of a green-checkmark-over-silent-failure.
        // Best-effort; never re-throw.
        try {
          await db
            .update(learningEntries)
            .set({
              aiEnrichment: {
                status: 'failed' as const,
                failedAt: new Date().toISOString(),
                error: err instanceof Error ? err.message.slice(0, 200) : 'enrichment failed',
              },
              updatedAt: new Date(),
            })
            .where(eq(learningEntries.id, entry.id));
        } catch (updateErr) {
          console.error('[entries/POST] failed to persist failed status:', updateErr);
        }
        trackServer('entry_enriched', userId, {
          duration_ms: Date.now() - enrichStart,
          status: 'error',
          entry_id: hashForAnalytics(entry.id),
        }, { familyId: family.id });
      }
    });
  } else {
    // Draft saved — schedule a gentle resume nudge (frequency-capped).
    // Also wrapped in `after()` for the same termination-safety reason.
    after(async () => {
      try {
        await triggerDraftResume(family.id, { title: entry.title });
      } catch (err) {
        console.error('[entries/POST] draft_resume notification error:', err);
      }
    });
  }

  return NextResponse.json(entry, { status: 201 });
}, { route: 'POST /api/entries' });
