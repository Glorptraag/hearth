/**
 * Milestone detection — the write-time signal that powers the Portfolio sage
 * "Milestone" card. A milestone is the entry that pushed a thread across a tier
 * boundary (4 → developing, 8 → demonstrating) or a badge past its threshold.
 */
import { describe, it, expect } from 'vitest';
import {
  detectMilestoneEntries,
  type MilestoneEntryInput,
  type MilestoneBadgeInput,
} from './milestone-detect';

// Helper: build N entries on the same thread, dated sequentially so the Nth is
// the one that crosses a boundary.
function threadEntries(threadId: string, n: number): MilestoneEntryInput[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `e${i + 1}`,
    dateOccurred: `2026-01-${String(i + 1).padStart(2, '0')}`,
    createdAt: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    threadIds: [threadId],
  }));
}

describe('detectMilestoneEntries — tier crossings', () => {
  it('attributes the developing leap to the 4th observation', () => {
    const result = detectMilestoneEntries(threadEntries('M1', 4), []);
    expect([...result.keys()]).toEqual(['e4']);
    expect(result.get('e4')).toEqual([{ kind: 'tier_advance', thread_id: 'M1', tier: 'developing' }]);
  });

  it('attributes both leaps — developing at 4, demonstrating at 8', () => {
    const result = detectMilestoneEntries(threadEntries('M1', 8), []);
    expect(result.get('e4')).toEqual([{ kind: 'tier_advance', thread_id: 'M1', tier: 'developing' }]);
    expect(result.get('e8')).toEqual([{ kind: 'tier_advance', thread_id: 'M1', tier: 'demonstrating' }]);
    expect(result.has('e5')).toBe(false);
  });

  it('marks no milestone below the first boundary', () => {
    const result = detectMilestoneEntries(threadEntries('M1', 3), []);
    expect(result.size).toBe(0);
  });

  it('counts each thread independently', () => {
    const entries: MilestoneEntryInput[] = [
      ...threadEntries('M1', 4),
      ...threadEntries('L3', 4).map((e, i) => ({ ...e, id: `l${i + 1}` })),
    ];
    const result = detectMilestoneEntries(entries, []);
    expect(result.get('e4')).toEqual([{ kind: 'tier_advance', thread_id: 'M1', tier: 'developing' }]);
    expect(result.get('l4')).toEqual([{ kind: 'tier_advance', thread_id: 'L3', tier: 'developing' }]);
  });

  it('attributes the crossing chronologically even when input is unordered', () => {
    const unordered = [...threadEntries('M1', 4)].reverse();
    const result = detectMilestoneEntries(unordered, []);
    expect([...result.keys()]).toEqual(['e4']);
  });

  it('treats a multi-thread entry as one observation per thread', () => {
    // Three priors on M1, then one entry mapping BOTH M1 and L3: M1 reaches 4.
    const entries: MilestoneEntryInput[] = [
      ...threadEntries('M1', 3),
      { id: 'combo', dateOccurred: '2026-01-09', createdAt: '2026-01-09T00:00:00Z', threadIds: ['M1', 'L3'] },
    ];
    const result = detectMilestoneEntries(entries, []);
    expect(result.get('combo')).toEqual([{ kind: 'tier_advance', thread_id: 'M1', tier: 'developing' }]);
  });

  it('ignores duplicate thread ids within a single entry', () => {
    const entries: MilestoneEntryInput[] = [
      ...threadEntries('M1', 3),
      { id: 'dup', dateOccurred: '2026-01-09', createdAt: '2026-01-09T00:00:00Z', threadIds: ['M1', 'M1'] },
    ];
    // dup only counts once → reaches 4 (developing), never 5.
    const result = detectMilestoneEntries(entries, []);
    expect(result.get('dup')).toEqual([{ kind: 'tier_advance', thread_id: 'M1', tier: 'developing' }]);
  });
});

describe('detectMilestoneEntries — badge crossings', () => {
  const badge: MilestoneBadgeInput = {
    id: 'badge-1',
    capabilityThreadIds: ['M1', 'M2'],
    observationThreshold: 5,
  };

  it('attributes the badge crossing to the entry that reaches the threshold', () => {
    // 3 × M1 then 2 × M2 → combined count hits 5 on the 5th entry.
    const entries: MilestoneEntryInput[] = [
      ...threadEntries('M1', 3),
      { id: 'm2a', dateOccurred: '2026-01-04', createdAt: '2026-01-04T00:00:00Z', threadIds: ['M2'] },
      { id: 'm2b', dateOccurred: '2026-01-05', createdAt: '2026-01-05T00:00:00Z', threadIds: ['M2'] },
    ];
    const result = detectMilestoneEntries(entries, [badge]);
    expect(result.get('m2b')).toContainEqual({ kind: 'badge_ready', badge_id: 'badge-1' });
    // No badge milestone before the 5th observation.
    expect(result.get('m2a')?.some((r) => r.kind === 'badge_ready')).toBeFalsy();
  });

  it('crosses on a multi-thread entry that jumps past the threshold', () => {
    // threshold 2; an entry mapping both badge threads jumps 0 → 2.
    const twoThreshold: MilestoneBadgeInput = { id: 'b2', capabilityThreadIds: ['M1', 'M2'], observationThreshold: 2 };
    const entries: MilestoneEntryInput[] = [
      { id: 'jump', dateOccurred: '2026-01-01', createdAt: '2026-01-01T00:00:00Z', threadIds: ['M1', 'M2'] },
    ];
    const result = detectMilestoneEntries(entries, [twoThreshold]);
    expect(result.get('jump')).toContainEqual({ kind: 'badge_ready', badge_id: 'b2' });
  });

  it('falls back to the default threshold when none is set', () => {
    const noThreshold: MilestoneBadgeInput = { id: 'b3', capabilityThreadIds: ['M1'], observationThreshold: null };
    const result = detectMilestoneEntries(threadEntries('M1', 5), [noThreshold]);
    // Default threshold is 5; the 5th entry crosses (and is also no tier leap).
    expect(result.get('e5')).toContainEqual({ kind: 'badge_ready', badge_id: 'b3' });
  });

  it('ignores badges with no threads', () => {
    const empty: MilestoneBadgeInput = { id: 'b4', capabilityThreadIds: [], observationThreshold: 1 };
    const result = detectMilestoneEntries(threadEntries('M1', 1), [empty]);
    expect(result.size).toBe(0);
  });

  it('can record both a tier leap and a badge crossing on the same entry', () => {
    // single-thread badge on M1 with threshold 4 → the 4th M1 entry is both a
    // developing tier leap AND the badge crossing.
    const m1Badge: MilestoneBadgeInput = { id: 'b5', capabilityThreadIds: ['M1'], observationThreshold: 4 };
    const result = detectMilestoneEntries(threadEntries('M1', 4), [m1Badge]);
    expect(result.get('e4')).toEqual([
      { kind: 'tier_advance', thread_id: 'M1', tier: 'developing' },
      { kind: 'badge_ready', badge_id: 'b5' },
    ]);
  });
});

describe('detectMilestoneEntries — edge cases', () => {
  it('returns an empty map for no entries', () => {
    expect(detectMilestoneEntries([], []).size).toBe(0);
  });

  it('ignores entries with no threads', () => {
    const entries: MilestoneEntryInput[] = [
      { id: 'a', dateOccurred: '2026-01-01', createdAt: null, threadIds: [] },
      { id: 'b', dateOccurred: '2026-01-02', createdAt: null, threadIds: [] },
    ];
    expect(detectMilestoneEntries(entries, []).size).toBe(0);
  });

  it('breaks same-day ties by createdAt then id deterministically', () => {
    // Four M1 entries all on the same day; the crossing must land on a stable
    // entry regardless of input order.
    const sameDay = (id: string, created: string): MilestoneEntryInput => ({
      id,
      dateOccurred: '2026-01-01',
      createdAt: created,
      threadIds: ['M1'],
    });
    const entries = [
      sameDay('d', '2026-01-01T04:00:00Z'),
      sameDay('a', '2026-01-01T01:00:00Z'),
      sameDay('c', '2026-01-01T03:00:00Z'),
      sameDay('b', '2026-01-01T02:00:00Z'),
    ];
    const result = detectMilestoneEntries(entries, []);
    // chronological by createdAt: a, b, c, d → 4th (developing) is 'd'.
    expect([...result.keys()]).toEqual(['d']);
  });
});
