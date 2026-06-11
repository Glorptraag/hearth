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
import { familyIntelligenceSnapshots } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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
