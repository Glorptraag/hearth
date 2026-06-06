import { after, NextRequest, NextResponse } from 'next/server';

// Extend serverless lifetime so the `after()` enrichment callback has room
// to finish (Sanity context reads + Haiku call + two DB writebacks). Default
// is 10s on Hobby / 15s on Pro — too tight; this is the suspected cause of
// production-readiness-tracker #34 (Anthropic billed, no DB writeback).
export const maxDuration = 60;
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { learningEntries, learningEntryEvidence } from '@/lib/db/schema';
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
import { trackServer } from '@/lib/analytics/posthog-server';

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

const evidenceItemSchema = z.object({
  kind: z.enum(['photo', 'quote', 'note', 'link', 'audio']),
  content: z.string().min(1),
  caption: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
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
  // Structured evidence rows for the learning_entry_evidence dual-write.
  // Uses evidenceItemSchema so audio carries metadata (durationMs/mimeType)
  // and every kind can carry a caption the text[] can't hold. Photo URLs are
  // also dual-written into evidenceUrls for backward-compat (2-cycle window).
  evidence: z.array(evidenceItemSchema).optional(),
  source: z.enum(ENTRY_SOURCES).optional(),
  sourceModuleId: z.string().optional(),
  // Sanity activity IDs the family engaged with. Populated by the module
  // runner Log mode (and by the Logger attach-to-module flow via PATCH).
  // Drives per-activity capability mapping in thread_links.
  sourceActivityIds: z.array(z.string()).optional(),
  // Which approach (modality) was picked in the runner.
  sourceApproachId: z.string().optional(),
  sourceProjectId: z.string().optional(),
  sourceStageNumber: z.number().optional(),
  sourceSessionId: z.string().uuid().optional(),
  // Module run FK — set when entry originates from a Facilitate session.
  moduleRunId: z.string().uuid().optional(),
  // Planner entry FK — set when entry fulfils a planned activity.
  plannerEntryId: z.string().uuid().optional(),
  status: z.enum(ENTRY_STATUSES).optional(),
  observationDetails: z.record(z.string(), observationDetailSchema).optional(),
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

  // Log mode for telemetry (informational only — not gated server-side)
  if (mode) {
    console.log(JSON.stringify({ event: 'entry_save', mode, familyId: family.id }));
  }

  // Dual-write: when structured evidence is provided, populate legacy
  // evidenceUrls with photo URLs so existing reads keep working.
  // Cleanup target: drop once all reads migrate to learning_entry_evidence.
  if (evidenceItems?.length) {
    const photoUrls = evidenceItems.filter((e) => e.kind === 'photo').map((e) => e.content);
    if (photoUrls.length > 0) {
      entryData.evidenceUrls = [...(entryData.evidenceUrls ?? []), ...photoUrls];
    }
  }

  const willEnrich = parsed.data.status === 'complete';

  // Single transaction: insert entry → insert evidence rows.
  const { entry, evidenceRows } = await db.transaction(async (tx) => {
    const [insertedEntry] = await tx
      .insert(learningEntries)
      .values({
        familyId: family.id,
        ...entryData,
        ...(willEnrich
          ? { aiEnrichment: { status: 'pending' as const, startedAt: new Date().toISOString() } }
          : {}),
      })
      .returning();

    let insertedEvidence: typeof learningEntryEvidence.$inferSelect[] = [];
    if (evidenceItems?.length) {
      insertedEvidence = await tx
        .insert(learningEntryEvidence)
        .values(
          evidenceItems.map((e) => ({
            entryId: insertedEntry.id,
            kind: e.kind,
            content: e.content,
            caption: e.caption ?? null,
            metadata: e.metadata ?? {},
          }))
        )
        .returning();
    }

    return { entry: insertedEntry, evidenceRows: insertedEvidence };
  });

  // Dual-write the caption-carrying evidence rows. evidenceUrls is already
  // committed on the entry above, so this is best-effort (see evidence-db.ts).
  await writeEntryEvidence(entry.id, evidenceItems, entryData.evidenceUrls);

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

  return NextResponse.json({ ...entry, evidence: evidenceRows }, { status: 201 });
}, { route: 'POST /api/entries' });
