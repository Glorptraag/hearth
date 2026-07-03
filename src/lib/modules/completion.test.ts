import { describe, it, expect } from 'vitest';
import {
  markActivityVisited,
  visitedThrough,
  deriveSourceActivityIds,
  clampIndex,
  clampIndexList,
} from './completion';

describe('markActivityVisited', () => {
  it('adds the current activity to an empty set (one-and-done records that one)', () => {
    expect(markActivityVisited([], 0)).toEqual([0]);
  });

  it('keeps existing entries and adds the new one, sorted', () => {
    expect(markActivityVisited([0, 1], 2)).toEqual([0, 1, 2]);
  });

  it('marks only the jumped-to activity, never the skipped intermediates', () => {
    // Parent on activity 0 jumps straight to activity 3 via the sidebar.
    expect(markActivityVisited([0], 3)).toEqual([0, 3]);
  });

  it('is idempotent when the activity is already visited', () => {
    expect(markActivityVisited([0, 1, 2], 1)).toEqual([0, 1, 2]);
  });

  it('dedupes and sorts a messy incoming set', () => {
    expect(markActivityVisited([2, 0, 2], 1)).toEqual([0, 1, 2]);
  });

  it('ignores a negative index but still normalises the existing set', () => {
    expect(markActivityVisited([1, 0], -1)).toEqual([0, 1]);
  });
});

describe('visitedThrough', () => {
  it('returns 0..cursor inclusive for a resumed linear session', () => {
    expect(visitedThrough(2)).toEqual([0, 1, 2]);
  });

  it('returns just the first activity at cursor 0', () => {
    expect(visitedThrough(0)).toEqual([0]);
  });

  it('returns an empty set for a negative cursor', () => {
    expect(visitedThrough(-1)).toEqual([]);
  });
});

describe('deriveSourceActivityIds', () => {
  const activities = [
    { _id: 'act.a' },
    { _id: 'act.b' },
    { _id: 'act.c' },
    { _id: 'act.d' },
  ];

  it('records the single activity from a one-and-done session', () => {
    expect(
      deriveSourceActivityIds({ activities, completedActivityIdxs: [0], quickCaptures: [] }),
    ).toEqual(['act.a']);
  });

  it('records every activity of a full run, including the last', () => {
    expect(
      deriveSourceActivityIds({
        activities,
        completedActivityIdxs: [0, 1, 2, 3],
        quickCaptures: [],
      }),
    ).toEqual(['act.a', 'act.b', 'act.c', 'act.d']);
  });

  it('does not record activities skipped by a forward jump', () => {
    // Visited 0 then jumped to 3 — activities 1 and 2 must not appear.
    expect(
      deriveSourceActivityIds({ activities, completedActivityIdxs: [0, 3], quickCaptures: [] }),
    ).toEqual(['act.a', 'act.d']);
  });

  it('merges quick-capture activity ids and dedupes against completed indexes', () => {
    expect(
      deriveSourceActivityIds({
        activities,
        completedActivityIdxs: [1],
        quickCaptures: [{ activityId: 'act.b' }, { activityId: 'act.c' }],
      }),
    ).toEqual(['act.b', 'act.c']);
  });

  it('ignores captures with no activityId (legacy sessions)', () => {
    expect(
      deriveSourceActivityIds({
        activities,
        completedActivityIdxs: [0],
        quickCaptures: [{}, { activityId: 'act.b' }],
      }),
    ).toEqual(['act.b', 'act.a']);
  });

  it('skips out-of-range and missing activity indexes', () => {
    expect(
      deriveSourceActivityIds({ activities, completedActivityIdxs: [0, 99], quickCaptures: [] }),
    ).toEqual(['act.a']);
  });

  it('handles undefined activities and captures', () => {
    expect(
      deriveSourceActivityIds({
        activities: undefined,
        completedActivityIdxs: [0],
        quickCaptures: undefined,
      }),
    ).toEqual([]);
  });
});

describe('clampIndex / clampIndexList — restored-session clamping', () => {
  it('clamps an out-of-range restored cursor to the last activity', () => {
    expect(clampIndex(7, 3)).toBe(2);
  });

  it('leaves in-range indexes untouched', () => {
    expect(clampIndex(1, 3)).toBe(1);
    expect(clampIndex(2, 3)).toBe(2);
  });

  it('is a no-op against an empty/unknown activity list', () => {
    expect(clampIndex(5, 0)).toBe(5);
    expect(clampIndexList([0, 5], 0)).toEqual([0, 5]);
  });

  it('drops completed indexes that no longer map to an activity', () => {
    expect(clampIndexList([0, 1, 4, 9], 3)).toEqual([0, 1]);
  });

  it('returns the same reference when nothing is out of range (setState no-op)', () => {
    const idxs = [0, 1, 2];
    expect(clampIndexList(idxs, 3)).toBe(idxs);
  });
});
