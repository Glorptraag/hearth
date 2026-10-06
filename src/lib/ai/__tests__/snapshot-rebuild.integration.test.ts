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
import { familyIntelligenceSnapshots, familyLibrary, learningEntries } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { createFamily, createLearner, createEntry, createDloLink } from '@/test/db-factories';
import { rebuildSnapshot } from '../snapshot-rebuild';
import { generateMonthlyNarrative } from '../generate-monthly-narrative';
import { upsertParentAssertion } from '../dlo-persistence';
import { GET as getCapabilities } from '@/app/api/capabilities/[learnerId]/route';
import { TEST_FAMILY_ID, TEST_USER_ID } from '../../../../vitest.setup';
import type { SnapshotData, ChildSnapshot } from '@/types/snapshot';

// ─── Module mocks ────────────────────────────────────────────────────────────

// File-level client mock so tests can inspect the scoring query's `packIds`
// param. The lazy proxies in the real module re-bind `fetch` per access (the
// bound copy has no `.mock`), and the setup's per-test clearing wipes
// `createClient.mock.results` — so a plain object with a hoisted vi.fn is the
// only reliable capture point. All three exports are required (routes 500 if
// `sanityServerClient` is missing from a partial mock).
const { serverFetchMock } = vi.hoisted(() => ({
  // Parameterised signature (matches client.fetch(query, params)) so
  // `mock.calls` rows are destructurable — a zero-arg vi.fn types calls as
  // empty tuples and `[, params]` fails tsc (TS2493).
  serverFetchMock: vi.fn(async (_query: string, _params?: Record<string, unknown>) => [] as unknown[]),
}));
vi.mock('@/lib/sanity/client', () => ({
  sanityClient: { fetch: vi.fn(async () => []) },
  sanityWriteClient: { fetch: vi.fn(async () => []) },
  sanityServerClient: { fetch: serverFetchMock },
}));

vi.mock('../sanity-thread-cache', () => ({
  getCachedThreads: vi.fn(async () => new Map([
    ['L1', { title: 'Oral Communication', dlos: [], dlos_total: 3 }],
    ['M1', { title: 'Number Sense',       dlos: [], dlos_total: 3 }],
    ['S1', { title: 'Scientific Inquiry', dlos: [], dlos_total: 3 }],
  ])),
}));

// Mock only the Haiku call; keep the pure narrativeSignature so the rebuild's
// reuse logic runs for real.
vi.mock('../generate-monthly-narrative', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../generate-monthly-narrative')>();
  return { ...actual, generateMonthlyNarrative: vi.fn(async () => '') };
});

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

/** Every `{ packIds }` param passed to the mocked server client's fetch. */
function scoringPackIds(): string[][] {
  return serverFetchMock.mock.calls
    .map(([, params]) => (params as { packIds?: string[] } | undefined)?.packIds)
    .filter((ids): ids is string[] => Array.isArray(ids));
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
    const body = (await res.json()) as {
      activeThreads: Array<Record<string, unknown>>;
      gapAnalysis: { underserved_subjects: string[]; suggested_focus_threads: string[] };
      curriculumCoverage: Record<string, unknown>;
    };

    // T3: the Explore view's data rides along on the same response.
    expect(Array.isArray(body.gapAnalysis?.underserved_subjects)).toBe(true);
    expect(body.curriculumCoverage).toBeTypeOf('object');

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
    // reads to render the confirm control as "Confirmed" across reloads, and the
    // assertion lands the DLO at its authored (demonstrating) tier. (The thread
    // itself only appears in active_threads once it also has a logged entry —
    // the thread-tier lift from a declared/asserted link is covered separately
    // by the "declared demonstrating" case above.)
    expect(body.dloStatus['dlo.L1.demonstrating']?.asserted_by_parent).toBe(true);
    expect(body.dloStatus['dlo.L1.demonstrating']?.status).toBe('demonstrating');
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

describe('INTEGRATION: rebuildSnapshot — monthly narrative reuse', () => {
  const thisMonth = `${new Date().toISOString().slice(0, 7)}-10`;
  const enriched = (thread: string) => ({
    status: 'enriched' as const,
    capability_threads: [{ thread_id: thread, confidence: 0.9 }],
  });

  it('reuses the prior narrative without an LLM call when its inputs are unchanged', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    await createEntry(db, {
      familyId: family.id, learnerIds: [learner.id], status: 'complete',
      dateOccurred: thisMonth, aiEnrichment: enriched('L1'),
    });

    vi.mocked(generateMonthlyNarrative).mockClear();
    vi.mocked(generateMonthlyNarrative).mockResolvedValue('A steady month of stories.');
    await rebuildSnapshot(family.id, 'manual');
    expect(generateMonthlyNarrative).toHaveBeenCalledTimes(1);

    const first = (await getSnapshot(family.id))!.children[learner.id] as ChildSnapshot;
    expect(first.monthly_narrative).toBe('A steady month of stories.');
    expect(first.monthly_narrative_signature).toMatch(/^[0-9a-f]{16}$/);
    expect(first.monthly_narrative_generated_at).toBeTruthy();

    // A dashboard-triggered rebuild with nothing new: same text, zero calls.
    vi.mocked(generateMonthlyNarrative).mockClear();
    await rebuildSnapshot(family.id, 'user_dashboard');
    expect(generateMonthlyNarrative).not.toHaveBeenCalled();

    const second = (await getSnapshot(family.id))!.children[learner.id] as ChildSnapshot;
    expect(second.monthly_narrative).toBe('A steady month of stories.');
    expect(second.monthly_narrative_signature).toBe(first.monthly_narrative_signature);
    expect(second.monthly_narrative_generated_at).toBe(first.monthly_narrative_generated_at);
  });

  it('regenerates when a new entry changes the inputs', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    await createEntry(db, {
      familyId: family.id, learnerIds: [learner.id], status: 'complete',
      dateOccurred: thisMonth, aiEnrichment: enriched('L1'),
    });
    vi.mocked(generateMonthlyNarrative).mockResolvedValue('First version.');
    await rebuildSnapshot(family.id, 'manual');
    const before = (await getSnapshot(family.id))!.children[learner.id] as ChildSnapshot;

    await createEntry(db, {
      familyId: family.id, learnerIds: [learner.id], status: 'complete',
      dateOccurred: thisMonth, title: 'Bridge building', aiEnrichment: enriched('M6'),
    });
    vi.mocked(generateMonthlyNarrative).mockClear();
    vi.mocked(generateMonthlyNarrative).mockResolvedValue('Second version.');
    await rebuildSnapshot(family.id, 'entry_saved');
    expect(generateMonthlyNarrative).toHaveBeenCalledTimes(1);

    const after = (await getSnapshot(family.id))!.children[learner.id] as ChildSnapshot;
    expect(after.monthly_narrative).toBe('Second version.');
    expect(after.monthly_narrative_signature).not.toBe(before.monthly_narrative_signature);
  });

  it("a sibling's save does not regenerate an unchanged child's narrative", async () => {
    const family = await createFamily(db);
    const a = await createLearner(db, { familyId: family.id, name: 'Ada' });
    const b = await createLearner(db, { familyId: family.id, name: 'Ben' });
    await createEntry(db, { familyId: family.id, learnerIds: [a.id], status: 'complete', dateOccurred: thisMonth, aiEnrichment: enriched('L1') });
    await createEntry(db, { familyId: family.id, learnerIds: [b.id], status: 'complete', dateOccurred: thisMonth, aiEnrichment: enriched('M1') });

    vi.mocked(generateMonthlyNarrative).mockClear();
    vi.mocked(generateMonthlyNarrative).mockImplementation(async (input) => `${input.childName}'s month.`);
    await rebuildSnapshot(family.id, 'manual');
    expect(generateMonthlyNarrative).toHaveBeenCalledTimes(2);

    // Only Ada logs something new.
    await createEntry(db, { familyId: family.id, learnerIds: [a.id], status: 'complete', dateOccurred: thisMonth, title: 'Poem', aiEnrichment: enriched('L7') });
    vi.mocked(generateMonthlyNarrative).mockClear();
    await rebuildSnapshot(family.id, 'entry_saved');
    expect(generateMonthlyNarrative).toHaveBeenCalledTimes(1);
    expect(vi.mocked(generateMonthlyNarrative).mock.calls[0][0].childName).toBe('Ada');

    const snap = (await getSnapshot(family.id))!;
    expect((snap.children[b.id] as ChildSnapshot).monthly_narrative).toBe("Ben's month.");
  });

  it('a settings_change rebuild keeps the existing narrative instead of wiping it', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    await createEntry(db, { familyId: family.id, learnerIds: [learner.id], status: 'complete', dateOccurred: thisMonth, aiEnrichment: enriched('L1') });
    vi.mocked(generateMonthlyNarrative).mockResolvedValue('Kept across a settings change.');
    await rebuildSnapshot(family.id, 'manual');

    vi.mocked(generateMonthlyNarrative).mockClear();
    await rebuildSnapshot(family.id, 'settings_change');
    expect(generateMonthlyNarrative).not.toHaveBeenCalled();
    const child = (await getSnapshot(family.id))!.children[learner.id] as ChildSnapshot;
    expect(child.monthly_narrative).toBe('Kept across a settings change.');
  });

  it("keeps this month's prior text when generation fails, and retries next time", async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    await createEntry(db, { familyId: family.id, learnerIds: [learner.id], status: 'complete', dateOccurred: thisMonth, aiEnrichment: enriched('L1') });
    vi.mocked(generateMonthlyNarrative).mockResolvedValue('Good text.');
    await rebuildSnapshot(family.id, 'manual');
    const good = (await getSnapshot(family.id))!.children[learner.id] as ChildSnapshot;

    // New input (another entry) but the API fails (returns '').
    await createEntry(db, { familyId: family.id, learnerIds: [learner.id], status: 'complete', dateOccurred: thisMonth, title: 'Map making', aiEnrichment: enriched('H3') });
    vi.mocked(generateMonthlyNarrative).mockResolvedValue('');
    await rebuildSnapshot(family.id, 'entry_saved');
    const degraded = (await getSnapshot(family.id))!.children[learner.id] as ChildSnapshot;
    expect(degraded.monthly_narrative).toBe('Good text.');
    // Signature left stale on purpose so the next generating rebuild retries.
    expect(degraded.monthly_narrative_signature).toBe(good.monthly_narrative_signature);

    vi.mocked(generateMonthlyNarrative).mockClear();
    vi.mocked(generateMonthlyNarrative).mockResolvedValue('Recovered text.');
    await rebuildSnapshot(family.id, 'user_dashboard');
    expect(generateMonthlyNarrative).toHaveBeenCalledTimes(1);
    expect(((await getSnapshot(family.id))!.children[learner.id] as ChildSnapshot).monthly_narrative).toBe('Recovered text.');
  });
});

describe('INTEGRATION: rebuildSnapshot — library_change incremental fast-path', () => {
  // A current-month entry so the FULL rebuild generates a monthly narrative —
  // letting us prove the incremental path specifically skips that LLM call.
  const thisMonth = `${new Date().toISOString().slice(0, 7)}-15`;

  it('reuses prior children and skips the monthly-narrative LLM call on a library_change', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    await createEntry(db, {
      familyId: family.id,
      learnerIds: [learner.id],
      status: 'complete',
      dateOccurred: thisMonth,
      aiEnrichment: {
        status: 'enriched',
        capability_threads: [{ thread_id: 'L1', confidence: 0.9 }],
      },
    });

    // Full rebuild establishes the per-child snapshot AND runs the narrative.
    vi.mocked(generateMonthlyNarrative).mockClear();
    await rebuildSnapshot(family.id, 'manual');
    expect(generateMonthlyNarrative).toHaveBeenCalled();

    const full = await getSnapshot(family.id);
    expect(full).not.toBeNull();
    const childrenAfterFull = full!.children;
    expect(Object.keys(childrenAfterFull)).toContain(learner.id);

    // Incremental path: must NOT re-run the LLM narrative, and must reuse the
    // entry-derived children verbatim.
    vi.mocked(generateMonthlyNarrative).mockClear();
    await rebuildSnapshot(family.id, 'library_change');
    expect(generateMonthlyNarrative).not.toHaveBeenCalled();

    const incremental = await getSnapshot(family.id);
    expect(incremental).not.toBeNull();
    expect(incremental!.children).toEqual(childrenAfterFull);
    expect((incremental as SnapshotData & { rebuild_trigger?: string }).rebuild_trigger).toBe('library_change');
  });

  it('excludes soft-deleted library rows from active count and recommendation scoring (full rebuild)', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    await createEntry(db, {
      familyId: family.id,
      learnerIds: [learner.id],
      status: 'complete',
      dateOccurred: thisMonth,
      aiEnrichment: { status: 'enriched', capability_threads: [{ thread_id: 'L1', confidence: 0.9 }] },
    });
    // One active pack; one soft-removed pack; one soft-removed module.
    await db.insert(familyLibrary).values([
      { familyId: family.id, sanityPackId: 'pack-active-sd1', sanityModuleId: null },
      { familyId: family.id, sanityPackId: 'pack-removed-sd1', sanityModuleId: null, removedAt: new Date() },
      { familyId: family.id, sanityPackId: null, sanityModuleId: 'mod-removed-sd1', removedAt: new Date() },
    ]);

    await rebuildSnapshot(family.id, 'manual');

    const snapshot = await getSnapshot(family.id);
    expect((snapshot as SnapshotData & { activeModulesCount?: number }).activeModulesCount).toBe(1);

    // The recommendation scoring query must only see the ACTIVE pack — a
    // removed pack driving recommendations was the live bug this pins.
    const scoringPackIdCalls = scoringPackIds();
    const forThisFamily = scoringPackIdCalls.filter((ids) => ids.includes('pack-active-sd1') || ids.includes('pack-removed-sd1'));
    expect(forThisFamily.length).toBeGreaterThan(0);
    for (const ids of forThisFamily) {
      expect(ids).toEqual(['pack-active-sd1']);
    }
  });

  it('the library_change fast-path also excludes soft-deleted rows (the removal-triggered rebuild)', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    await createEntry(db, {
      familyId: family.id,
      learnerIds: [learner.id],
      status: 'complete',
      dateOccurred: thisMonth,
      aiEnrichment: { status: 'enriched', capability_threads: [{ thread_id: 'L1', confidence: 0.9 }] },
    });
    // Full rebuild first so the fast-path has prior children to reuse.
    await rebuildSnapshot(family.id, 'manual');

    // The family removes one of two packs — exactly what DELETE /api/library/[id]
    // does before it fires rebuildSnapshot('library_change').
    await db.insert(familyLibrary).values([
      { familyId: family.id, sanityPackId: 'pack-active-sd2', sanityModuleId: null },
      { familyId: family.id, sanityPackId: 'pack-removed-sd2', sanityModuleId: null, removedAt: new Date() },
    ]);

    await rebuildSnapshot(family.id, 'library_change');

    const snapshot = await getSnapshot(family.id);
    expect((snapshot as SnapshotData & { activeModulesCount?: number }).activeModulesCount).toBe(1);

    const forThisFamily = scoringPackIds().filter((ids) => ids.includes('pack-active-sd2') || ids.includes('pack-removed-sd2'));
    expect(forThisFamily.length).toBeGreaterThan(0);
    for (const ids of forThisFamily) {
      expect(ids).toEqual(['pack-active-sd2']);
    }
  });

  it('falls back to a full rebuild when no prior snapshot exists', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    await createEntry(db, {
      familyId: family.id,
      learnerIds: [learner.id],
      status: 'complete',
      dateOccurred: thisMonth,
      aiEnrichment: {
        status: 'enriched',
        capability_threads: [{ thread_id: 'M1', confidence: 0.9 }],
      },
    });

    // No prior snapshot → the fast-path defers to a full rebuild so the children
    // block is created in the first place.
    await rebuildSnapshot(family.id, 'library_change');

    const snapshot = await getSnapshot(family.id);
    expect(snapshot).not.toBeNull();
    expect(Object.keys(snapshot!.children)).toContain(learner.id);
  });
});
