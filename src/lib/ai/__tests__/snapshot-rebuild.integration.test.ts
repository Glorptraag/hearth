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
import { db } from '@/lib/db';
import { familyIntelligenceSnapshots, learningEntries } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { rebuildSnapshot } from '../snapshot-rebuild';
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
  cleanStaleNotifications: vi.fn(async () => {}),
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
