/**
 * INTEGRATION: rebuildSnapshot aggregates declared + inferred threads.
 *
 * Seeds real DB rows (family / learner / entry) then calls rebuildSnapshot
 * directly and asserts on the persisted family_intelligence_snapshots row.
 *
 * Mocks everything except the DB:
 *   - getCachedThreads (Sanity thread metadata)
 *   - generateMonthlyNarrative (Haiku call)
 *   - sanityClient (recommendation queries)
 *   - notification triggers (side-effects)
 */
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { familyIntelligenceSnapshots, learningEntries } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { createFamily, createLearner, createEntry, createDloLink } from '@/test/db-factories';
import { rebuildSnapshot } from '../snapshot-rebuild';
import { upsertParentAssertion } from '../dlo-persistence';
import { GET as getCapabilities } from '@/app/api/capabilities/[learnerId]/route';
import { TEST_FAMILY_ID, TEST_USER_ID } from '../../../../vitest.setup';
import type { SnapshotData, ChildSnapshot } from '@/types/snapshot';

// ─── Module mocks ────────────────────────────────────────────────────────────

vi.mock('../sanity-thread-cache', () => ({
  getCachedThreads: vi.fn(async () => new Map([
    ['L1', { title: 'Oral Communication', dlos: [], dlos_total: 3 }],
    ['M1', { title: 'Number Sense',       dlos: [], dlos_total: 3 }],
    ['S1', { title: 'Scientific Inquiry', dlos: [], dlos_total: 3 }],
  ])),
}));

vi.mock('../generate-monthly-narrative', () => ({
  generateMonthlyNarrative: vi.fn(async () => ''),
}));

vi.mock('@/lib/notifications/triggers', () => ({
  triggerBadgeReady: vi.fn(async () => {}),
  triggerComplianceNudge: vi.fn(async () => {}),
  triggerStreakPrompt: vi.fn(async () => {}),
  triggerModuleNudge: vi.fn(async () => {}),
  triggerRecommendationsRefreshNotice: vi.fn(async () => {}),
  triggerConstellationHonestyNotice: vi.fn(async () => {}),
  cleanStaleNotifications: vi.fn(async () => {}),
}));

// upsertParentAssertion validates the DLO id against the published catalog
// (getValidDlos). snapshot-rebuild itself never calls it, so mocking is inert
// for the other cases here.
vi.mock('../dlo-cache', () => ({
  getValidDlos: vi.fn(async () => ({
    ids: new Set(['dlo.L1.emerging', 'dlo.L1.developing', 'dlo.L1.demonstrating']),
    tierById: new Map<string, 'emerging' | 'developing' | 'demonstrating'>([
      ['dlo.L1.emerging', 'emerging'],
      ['dlo.L1.developing', 'developing'],
      ['dlo.L1.demonstrating', 'demonstrating'],
    ]),
    descriptorById: new Map<string, string>(),
  })),
}));

// sanityClient already mocked globally in vitest.setup.ts but the
// recommendation queries return empty, which is fine for these tests.

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getSnapshot(familyId: string): Promise<SnapshotData | null> {
  const rows = await db
    .select()
    .from(familyIntelligenceSnapshots)
    .where(eq(familyIntelligenceSnapshots.familyId, familyId));
  return (rows[0]?.snapshotData as SnapshotData) ?? null;
}

function getActiveThreadIds(snapshot: SnapshotData, learnerId: string): string[] {
  const child = snapshot.children[learnerId] as ChildSnapshot | undefined;
  return child?.active_threads.map((t) => t.thread_id) ?? [];
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('INTEGRATION: rebuildSnapshot — declared thread aggregation', () => {
  it('includes a declared-only thread (no aiEnrichment) in active_threads', async () => {
    const family  = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });

    // Entry with only a declared threadLink (no AI enrichment)
    await createEntry(db, {
      familyId:   family.id,
      learnerIds: [learner.id],
      status:     'complete',
      threadLinks: [
        {
          threadId:  'capabilityThread.L1',
          stageBand: 'intermediate',
          tierAtTime: 'developing',
          confidence: 'confirmed',
          atomicLinks: [],
        },
      ],
      aiEnrichment: { status: 'enriched', capability_threads: [] },
    });

    await rebuildSnapshot(family.id, 'manual');

    const snapshot = await getSnapshot(family.id);
    expect(snapshot).not.toBeNull();

    const threadIds = getActiveThreadIds(snapshot!, learner.id);
    expect(threadIds).toContain('L1');
  });

  it('declared+inferred same thread counts as one observation', async () => {
    const family  = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });

    // Single entry where L1 is both inferred AND declared
    await createEntry(db, {
      familyId:   family.id,
      learnerIds: [learner.id],
      status:     'complete',
      aiEnrichment: {
        status: 'enriched',
        capability_threads: [{ thread_id: 'L1', confidence: 0.9 }],
      },
      threadLinks: [
        {
          threadId:  'capabilityThread.L1',
          stageBand: 'intermediate',
          tierAtTime: 'developing',
          confidence: 'confirmed',
          atomicLinks: [],
        },
      ],
    });

    await rebuildSnapshot(family.id, 'manual');

    const snapshot = await getSnapshot(family.id);
    expect(snapshot).not.toBeNull();

    const child = snapshot!.children[learner.id] as ChildSnapshot | undefined;
    const l1 = child?.active_threads.find((t) => t.thread_id === 'L1');
    expect(l1).toBeDefined();
    // Deduped — still 1 observation even though both sources claim L1
    expect(l1!.observation_count).toBe(1);
    // Source breakdown is tracked
    expect(l1!.source_counts).toEqual({ inferred: 1, declared: 1 });
  });

  it('declared-only thread has source_counts.declared=1, inferred=0', async () => {
    const family  = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });

    await createEntry(db, {
      familyId:   family.id,
      learnerIds: [learner.id],
      status:     'complete',
      aiEnrichment: { status: 'enriched', capability_threads: [] },
      threadLinks: [
        {
          threadId:  'capabilityThread.M1',
          stageBand: 'intermediate',
          tierAtTime: 'emerging',
          confidence: 'confirmed',
          atomicLinks: [],
        },
      ],
    });

    await rebuildSnapshot(family.id, 'manual');

    const snapshot = await getSnapshot(family.id);
    const child = snapshot!.children[learner.id] as ChildSnapshot | undefined;
    const m1 = child?.active_threads.find((t) => t.thread_id === 'M1');
    expect(m1).toBeDefined();
    expect(m1!.source_counts).toEqual({ inferred: 0, declared: 1 });
  });

  it('two separate entries each declaring the same thread count as 2 observations', async () => {
    const family  = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });

    const link = {
      threadId:  'capabilityThread.S1',
      stageBand: 'intermediate',
      tierAtTime: 'developing',
      confidence: 'confirmed',
      atomicLinks: [],
    };

    await createEntry(db, {
      familyId:   family.id,
      learnerIds: [learner.id],
      status:     'complete',
      dateOccurred: '2026-06-01',
      aiEnrichment: { status: 'enriched', capability_threads: [] },
      threadLinks: [link],
    });
    await createEntry(db, {
      familyId:   family.id,
      learnerIds: [learner.id],
      status:     'complete',
      dateOccurred: '2026-06-02',
      aiEnrichment: { status: 'enriched', capability_threads: [] },
      threadLinks: [link],
    });

    await rebuildSnapshot(family.id, 'manual');

    const snapshot = await getSnapshot(family.id);
    const child = snapshot!.children[learner.id] as ChildSnapshot | undefined;
    const s1 = child?.active_threads.find((t) => t.thread_id === 'S1');
    expect(s1).toBeDefined();
    expect(s1!.observation_count).toBe(2);
  });
});

describe('INTEGRATION: rebuildSnapshot — WS-4 DLO-evidence-derived tiers', () => {
  it('derives tier from DLO evidence and exposes no fabricated dlos fields through the capabilities API', async () => {
    // Signed-in owner of TEST_FAMILY_ID by default in the integration setup.
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });

    // L1: one observation + a DECLARED demonstrating link → demonstrating
    // (corroborated, clears the production bar).
    const l1Entry = await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      status: 'complete',
      aiEnrichment: { status: 'enriched', capability_threads: [{ thread_id: 'L1', confidence: 0.9 }] },
    });
    await createDloLink(db, {
      observationId: l1Entry.id,
      learnerId: learner.id,
      dloId: 'dlo.L1.demonstrating',
      tier: 'demonstrating',
      provenance: 'declared',
    });

    // M1: observations only, NO DLO evidence → 'unobserved' ("Not yet").
    await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      status: 'complete',
      aiEnrichment: { status: 'enriched', capability_threads: [{ thread_id: 'M1', confidence: 0.9 }] },
    });

    await rebuildSnapshot(TEST_FAMILY_ID, 'manual');

    // Read it back the way the parent does — through the capabilities API.
    const res = await getCapabilities(
      new NextRequest(`http://x/api/capabilities/${learner.id}`),
      { params: Promise.resolve({ learnerId: learner.id }) },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { activeThreads: Array<Record<string, unknown>> };

    const l1 = body.activeThreads.find((t) => t.thread_id === 'L1');
    const m1 = body.activeThreads.find((t) => t.thread_id === 'M1');
    expect(l1).toBeDefined();
    expect(m1).toBeDefined();

    // Tier is DLO-evidence-derived, not count-derived.
    expect(l1!.suggested_tier).toBe('demonstrating');
    expect(m1!.suggested_tier).toBe('unobserved');

    // Observation counts survive as a volume signal.
    expect(l1!.observation_count).toBe(1);

    // The fabricated counts are gone from the shape entirely.
    expect('dlos_confirmed' in l1!).toBe(false);
    expect('dlos_total' in l1!).toBe(false);
  });

  it('an inferred-only demonstrating link can NOT reach demonstrating (corroboration bar)', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });

    // Two inferred demonstrating links on DISTINCT days — would clear the old
    // proposed bar (≥2 inferred days) but the locked production bar requires a
    // declared/asserted link for demonstrating, so this stays "Not yet".
    for (const [i, date] of ['2026-06-01', '2026-06-02'].entries()) {
      const entry = await createEntry(db, {
        familyId: family.id,
        learnerIds: [learner.id],
        status: 'complete',
        dateOccurred: date,
        aiEnrichment: { status: 'enriched', capability_threads: [{ thread_id: 'S1', confidence: 0.9 }] },
      });
      await createDloLink(db, {
        observationId: entry.id,
        learnerId: learner.id,
        dloId: 'dlo.S1.demonstrating',
        tier: 'demonstrating',
        provenance: 'inferred',
        createdAt: new Date(`${date}T10:0${i}:00.000Z`),
      });
    }

    await rebuildSnapshot(family.id, 'manual');

    const rows = await db
      .select()
      .from(familyIntelligenceSnapshots)
      .where(eq(familyIntelligenceSnapshots.familyId, family.id));
    const snap = rows[0]?.snapshotData as SnapshotData;
    const child = snap.children[learner.id] as ChildSnapshot;
    const s1 = child.active_threads.find((t) => t.thread_id === 'S1');
    expect(s1).toBeDefined();
    expect(s1!.suggested_tier).toBe('unobserved');
  });

  it('surfaces a parent assertion as dlo_status.asserted_by_parent through the capabilities API (T2)', async () => {
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });

    // Parent confirms a DLO with NO backing entry — the real confirm-route path.
    const asserted = await upsertParentAssertion({
      learnerId: learner.id,
      dloId: 'dlo.L1.demonstrating',
      observedAt: new Date(),
    });
    expect(asserted).toEqual({ tier: 'demonstrating' });

    await rebuildSnapshot(TEST_FAMILY_ID, 'manual');

    const res = await getCapabilities(
      new NextRequest(`http://x/api/capabilities/${learner.id}`),
      { params: Promise.resolve({ learnerId: learner.id }) },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      activeThreads: Array<Record<string, unknown>>;
      dloStatus: Record<string, { status: string; asserted_by_parent?: boolean }>;
    };

    // The per-DLO status carries the parent-assertion flag the constellation
    // reads to render the confirm control as "Confirmed" across reloads.
    expect(body.dloStatus['dlo.L1.demonstrating']?.asserted_by_parent).toBe(true);
    expect(body.dloStatus['dlo.L1.demonstrating']?.status).toBe('demonstrating');

    // An asserted demonstrating link clears the production bar → L1 demonstrating.
    const l1 = body.activeThreads.find((t) => t.thread_id === 'L1');
    expect(l1?.suggested_tier).toBe('demonstrating');
  });
});

describe('INTEGRATION: rebuildSnapshot — milestone markers (P0-5)', () => {
  /** Read a family's entries oldest→newest with their milestone_flag. */
  async function entryFlags(familyId: string) {
    const rows = await db
      .select()
      .from(learningEntries)
      .where(eq(learningEntries.familyId, familyId))
      .orderBy(asc(learningEntries.dateOccurred));
    return rows.map((r) => ({
      date: r.dateOccurred,
      flag: (r.aiEnrichment as { milestone_flag?: boolean } | null)?.milestone_flag === true,
    }));
  }

  const l1Entry = (familyId: string, learnerId: string, dateOccurred: string) => ({
    familyId,
    learnerIds: [learnerId],
    status: 'complete' as const,
    dateOccurred,
    aiEnrichment: {
      status: 'enriched' as const,
      capability_threads: [{ thread_id: 'L1', confidence: 0.9 }],
    },
  });

  it('flags the entry that crosses the developing tier (4th L1 observation), not the earlier ones', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    for (const d of ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04']) {
      await createEntry(db, l1Entry(family.id, learner.id, d));
    }

    await rebuildSnapshot(family.id, 'manual');

    const flags = await entryFlags(family.id);
    expect(flags.map((f) => f.flag)).toEqual([false, false, false, true]);
  });

  it('flags no entry when the count never reaches a tier boundary (3 observations)', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    for (const d of ['2026-02-01', '2026-02-02', '2026-02-03']) {
      await createEntry(db, l1Entry(family.id, learner.id, d));
    }

    await rebuildSnapshot(family.id, 'manual');

    const flags = await entryFlags(family.id);
    expect(flags.every((f) => !f.flag)).toBe(true);
  });

  it('resets a stale milestone_flag:true on an entry that is no longer a crossing', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    // A lone L1 entry (count reaches 1 — no crossing) pre-stamped as a milestone.
    await createEntry(db, {
      familyId: family.id,
      learnerIds: [learner.id],
      status: 'complete',
      dateOccurred: '2026-03-01',
      aiEnrichment: {
        status: 'enriched',
        capability_threads: [{ thread_id: 'L1', confidence: 0.9 }],
        milestone_flag: true,
      },
    });

    await rebuildSnapshot(family.id, 'manual');

    const flags = await entryFlags(family.id);
    expect(flags).toHaveLength(1);
    expect(flags[0].flag).toBe(false); // reconciled back to false
  });
});
