import { after, NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { learningEntries } from '@/lib/db/schema';
import { getFamilyByClerkId, checkWritePermission } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import { SUBJECTS, ENTRY_SOURCES, ENTRY_STATUSES } from '@/types';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { attachEvidence } from '@/lib/evidence-db';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';
import { enrichEntry } from '@/lib/ai/enrich';
import { trackServer } from '@/lib/analytics/posthog-server';

/** Order-insensitive set equality for string[] columns (subjects / learnerIds). */
function sameStringSet(a: string[] | null | undefined, b: string[] | null | undefined): boolean {
  const sa = new Set(a ?? []);
  const sb = new Set(b ?? []);
  if (sa.size !== sb.size) return false;
  for (const x of sa) if (!sb.has(x)) return false;
  return true;
}

// Snapshot rebuild (fired in `after()` on mutating handlers) makes an Anthropic
// call per child — give the serverless instance room past the response.
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

export const GET = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { id } = await params;

  const entry = await db.query.learningEntries.findFirst({
    where: and(
      eq(learningEntries.id, id),
      eq(learningEntries.familyId, family.id)
    ),
  });

  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Attach caption-carrying learning_entry_evidence rows (read side of the
  // evidenceUrls dual-write); the portfolio prefers these over evidenceUrls.
  const [withEvidence] = await attachEvidence([entry]);
  return NextResponse.json(withEvidence);
}, { route: 'GET /api/entries/[id]' });

const updateEntrySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dateOccurred: z.string().optional(),
  subjects: z.array(z.enum(SUBJECTS)).optional(),
  learnerIds: z.array(z.string().uuid()).optional(),
  engagementPerLearner: z.record(z.string(), z.number().min(1).max(4)).optional(),
  discoveriesPerLearner: z.record(z.string(), z.string()).optional(),
  // NOTE: evidenceUrls is deliberately NOT accepted here. The create path
  // (POST /api/entries) dual-writes evidence to both learning_entries.evidenceUrls
  // and the caption-carrying learning_entry_evidence table (via writeEntryEvidence
  // + deriveEvidenceRows). PATCH was never given that dual-write, so accepting
  // evidenceUrls here would update the legacy column while leaving the new table
  // stale — a silent desync the moment an "edit evidence/captions" UI lands.
  // No caller PATCHes evidence today. Before re-adding this field, mirror the
  // change into learning_entry_evidence (delete + re-insert through the same
  // writeEntryEvidence path) — see src/lib/evidence-db.ts.
  source: z.enum(ENTRY_SOURCES).optional(),
  status: z.enum(ENTRY_STATUSES).optional(),
  workSampleCandidate: z.boolean().optional(),
  // Source-attach fields. Normally write-once at create-time, but the
  // Logger's retrospective "attach to module" flow (workstream F) needs to
  // back-fill these onto an already-saved entry. The narrow PATCH-write
  // path is acceptable; other source fields stay create-only.
  sourceModuleId: z.string().optional(),
  sourceActivityIds: z.array(z.string()).optional(),
  sourceApproachId: z.string().optional(),
});

export const PATCH = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions to modify entries' }, { status: writeCheck.statusCode });
  }

  const { id } = await params;

  const existing = await db.query.learningEntries.findFirst({
    where: and(
      eq(learningEntries.id, id),
      eq(learningEntries.familyId, family.id)
    ),
  });

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await parseBody(request, updateEntrySchema);
  if ('error' in result) return result.error;
  const parsed = result;
  const data = parsed.data;

  // A subject/learner edit invalidates this entry's OWN enrichment: its
  // capability_threads / curriculum_descriptors were inferred from the original
  // subject + learner context, so the stored map is now stale. A snapshot
  // rebuild alone only re-aggregates existing enrichments — it can't fix the
  // entry's own mapping. So when an enriched (complete) entry's subjects or
  // learners actually change, re-run enrichment (which then feeds a fresh
  // rebuild). Drafts are never enriched, so they only need the plain rebuild.
  const subjectsChanged = 'subjects' in data && !sameStringSet(existing.subjects, data.subjects);
  const learnersChanged = 'learnerIds' in data && !sameStringSet(existing.learnerIds, data.learnerIds);
  const nowComplete = (data.status ?? existing.status) === 'complete';
  const needsReenrich = nowComplete && (subjectsChanged || learnersChanged);

  const [updated] = await db
    .update(learningEntries)
    .set({
      ...data,
      updatedAt: new Date(),
      // Flip to pending up front so the portfolio's enrichment affordance shows
      // "reading…" immediately rather than the stale map.
      ...(needsReenrich
        ? { aiEnrichment: { status: 'pending' as const, startedAt: new Date().toISOString() } }
        : {}),
    })
    .where(
      and(
        eq(learningEntries.id, id),
        eq(learningEntries.familyId, family.id)
      )
    )
    .returning();

  // Rebuild the Family Intelligence Snapshot only when a field the snapshot
  // derives from changed. The snapshot's active_threads / subject counts come
  // from complete entries grouped by learnerIds (see snapshot-rebuild.ts), and
  // the monthly narrative buckets by dateOccurred — so a status/learner/subject/
  // date edit can orphan or shift those aggregates. Skip the rebuild for cheap
  // toggles (e.g. workSampleCandidate) so a portfolio star-tap doesn't fire an
  // Anthropic call. `after()` keeps the serverless instance alive past the
  // response (a bare promise gets killed when NextResponse returns).
  const affectsSnapshot =
    'status' in data || 'learnerIds' in data || 'subjects' in data || 'dateOccurred' in data;

  if (needsReenrich) {
    after(async () => {
      try {
        await enrichEntry({ entryId: id, familyId: family.id });
        await rebuildSnapshot(family.id, 'entry_saved').catch(() => {});
        trackServer('entry_enrich_retried', userId, { trigger: 'edit', status: 'ok' }, { familyId: family.id });
      } catch (err) {
        console.error('[entries/PATCH] re-enrich error:', err);
        // Don't leave the card stuck on "reading…" — mark it failed so the
        // portfolio's recovery affordance can offer a retry.
        await db
          .update(learningEntries)
          .set({ aiEnrichment: { status: 'failed' as const, error: 'enrichment failed' }, updatedAt: new Date() })
          .where(and(eq(learningEntries.id, id), eq(learningEntries.familyId, family.id)))
          .catch(() => {});
        trackServer('entry_enrich_retried', userId, { trigger: 'edit', status: 'error' }, { familyId: family.id });
      }
    });
  } else if (affectsSnapshot) {
    after(async () => {
      try {
        await rebuildSnapshot(family.id, 'entry_saved');
      } catch (err) {
        console.error('[entries/PATCH] snapshot rebuild error:', err);
      }
    });
  }

  return NextResponse.json(updated);
}, { route: 'PATCH /api/entries/[id]' });

export const DELETE = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions to delete entries' }, { status: writeCheck.statusCode });
  }

  const { id } = await params;

  const existing = await db.query.learningEntries.findFirst({
    where: and(
      eq(learningEntries.id, id),
      eq(learningEntries.familyId, family.id)
    ),
  });

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft entries can be deleted' },
      { status: 400 }
    );
  }

  await db
    .delete(learningEntries)
    .where(
      and(
        eq(learningEntries.id, id),
        eq(learningEntries.familyId, family.id)
      )
    );

  // Removing an entry can change what the snapshot aggregates, so refresh it —
  // otherwise capability-thread chips outlive the entries that produced them.
  // `after()` keeps the instance alive past the response for the Anthropic call.
  after(async () => {
    try {
      await rebuildSnapshot(family.id, 'entry_saved');
    } catch (err) {
      console.error('[entries/DELETE] snapshot rebuild error:', err);
    }
  });

  return NextResponse.json({ success: true });
}, { route: 'DELETE /api/entries/[id]' });
