import { describe, it, expect } from 'vitest';
import { rankFrontier, selectWatchDlo, type DloStatusRow } from './select';

const row = (dloId: string, status: string): DloStatusRow => ({ dloId, status });

describe('selectWatchDlo (WF §3.3 frontier)', () => {
  it('returns null with no confirmed notes, even when the child has a frontier', () => {
    expect(
      selectWatchDlo({ statusRows: [row('dlo.M1.developing', 'not-started')], confirmedDloIds: [], prereqsByThread: {} }),
    ).toBeNull();
  });

  it('returns null for an empty input', () => {
    expect(selectWatchDlo({ statusRows: [], confirmedDloIds: [] })).toBeNull();
  });

  it('never picks a DLO without a confirmed note', () => {
    const pick = selectWatchDlo({
      // M1.developing is noticed (the strongest reason) but has no confirmed note.
      statusRows: [row('dlo.M1.emerging', 'emerging'), row('dlo.M1.developing', 'not-started')],
      confirmedDloIds: ['dlo.L1.emerging'],
      prereqsByThread: {},
    });
    expect(pick?.dloId).toBe('dlo.L1.emerging');
  });

  it('skips a DLO the child has already shown', () => {
    const picks = rankFrontier({
      statusRows: [row('dlo.M1.emerging', 'emerging'), row('dlo.M1.developing', 'developing')],
      confirmedDloIds: ['dlo.M1.emerging', 'dlo.M1.developing', 'dlo.M1.demonstrating'],
      prereqsByThread: {},
    });
    expect(picks.map((p) => p.dloId)).toEqual(['dlo.M1.demonstrating']);
  });

  it('a higher status counts as shown for a lower-tier DLO', () => {
    expect(
      selectWatchDlo({
        statusRows: [row('dlo.M1.emerging', 'demonstrating')],
        confirmedDloIds: ['dlo.M1.emerging'],
        prereqsByThread: {},
      }),
    ).toBeNull();
  });

  it('prefers a noticed DLO (one confirmation) over the next tier in an active thread', () => {
    const pick = selectWatchDlo({
      statusRows: [
        row('dlo.L1.emerging', 'emerging'), // L1 active, developing is next
        row('dlo.M1.emerging', 'emerging'),
        row('dlo.M1.developing', 'not-started'), // evidence, not yet at tier → noticed
      ],
      confirmedDloIds: ['dlo.L1.developing', 'dlo.M1.developing'],
      prereqsByThread: {},
    });
    expect(pick).toEqual({ dloId: 'dlo.M1.developing', threadId: 'M1', tier: 'developing', reason: 'noticed' });
  });

  it('prefers the next tier in an active thread over a fresh thread whose prerequisites are shown', () => {
    const picks = rankFrontier({
      statusRows: [row('dlo.L1.emerging', 'emerging')],
      confirmedDloIds: ['dlo.L3.emerging', 'dlo.L1.developing'],
      prereqsByThread: { L3: ['L1'] },
    });
    expect(picks.map((p) => [p.dloId, p.reason])).toEqual([
      ['dlo.L1.developing', 'active-thread'],
      ['dlo.L3.emerging', 'prereqs-shown'],
    ]);
  });

  it('in an active thread, only the next tier qualifies — not one further up', () => {
    const picks = rankFrontier({
      statusRows: [row('dlo.L1.emerging', 'emerging')],
      confirmedDloIds: ['dlo.L1.demonstrating'],
      prereqsByThread: {},
    });
    expect(picks).toEqual([]);
  });

  it('earlier tiers come first among active threads', () => {
    const picks = rankFrontier({
      statusRows: [row('dlo.L1.emerging', 'emerging'), row('dlo.L1.developing', 'developing'), row('dlo.M2.emerging', 'not-started')],
      confirmedDloIds: ['dlo.L1.demonstrating', 'dlo.M2.emerging'],
      // M2.emerging has a row → noticed; so check ordering among active-thread picks below.
      prereqsByThread: {},
    });
    expect(picks[0].reason).toBe('noticed');

    const active = rankFrontier({
      statusRows: [
        row('dlo.L1.emerging', 'emerging'),
        row('dlo.L1.developing', 'developing'),
        row('dlo.M2.demonstrating', 'not-started'),
        row('dlo.S1.emerging', 'developing'),
      ],
      confirmedDloIds: ['dlo.L1.demonstrating', 'dlo.S1.developing'],
      threadLogCounts14d: { S1: 9, L1: 0 },
      prereqsByThread: {},
    });
    // S1.developing is earlier than L1.demonstrating, so it wins despite S1 being logged more.
    expect(active.map((p) => p.dloId)).toEqual(['dlo.S1.developing', 'dlo.L1.demonstrating']);
  });

  it('a fresh thread needs every prerequisite thread to have something shown', () => {
    const picks = rankFrontier({
      statusRows: [row('dlo.L1.emerging', 'emerging'), row('dlo.L4.emerging', 'not-started')],
      confirmedDloIds: ['dlo.L3.emerging', 'dlo.L2.emerging'],
      prereqsByThread: { L3: ['L1', 'L4'] },
    });
    // L3 waits on L4; L2 has no prerequisites, so it is open.
    expect(picks.map((p) => p.dloId)).toEqual(['dlo.L2.emerging']);
  });

  it('a fresh thread only opens at its first tier', () => {
    expect(
      rankFrontier({ statusRows: [], confirmedDloIds: ['dlo.L2.developing'], prereqsByThread: {} }),
    ).toEqual([]);
  });

  it('breaks ties by the thread logged least in the last 14 days, then by id', () => {
    const input = {
      statusRows: [],
      confirmedDloIds: ['dlo.A1.emerging', 'dlo.B1.emerging', 'dlo.C1.emerging'],
      prereqsByThread: {},
    };
    expect(
      rankFrontier({ ...input, threadLogCounts14d: { A1: 5, B1: 1, C1: 3 } }).map((p) => p.threadId),
    ).toEqual(['B1', 'C1', 'A1']);
    expect(rankFrontier({ ...input, threadLogCounts14d: {} }).map((p) => p.threadId)).toEqual(['A1', 'B1', 'C1']);
  });

  it('excludes the H6-suppressed thread', () => {
    const pick = selectWatchDlo({
      statusRows: [row('dlo.H6.emerging', 'not-started')],
      confirmedDloIds: ['dlo.H6.emerging', 'dlo.H6.developing'],
      prereqsByThread: {},
    });
    expect(pick).toBeNull();
  });

  it('a suppressed prerequisite does not hold a thread back', () => {
    const pick = selectWatchDlo({ statusRows: [], confirmedDloIds: ['dlo.H7.emerging'], prereqsByThread: { H7: ['H6'] } });
    expect(pick?.dloId).toBe('dlo.H7.emerging');
  });

  it('ignores malformed ids', () => {
    expect(
      selectWatchDlo({ statusRows: [row('nope', 'emerging')], confirmedDloIds: ['nope', 'dlo.M1'], prereqsByThread: {} }),
    ).toBeNull();
  });

  it('uses the catalogue prerequisites by default', () => {
    // L3 (Reading Comprehension) has prerequisites in THREAD_CONNECTIONS; with nothing shown it stays closed.
    expect(selectWatchDlo({ statusRows: [], confirmedDloIds: ['dlo.L3.emerging'] })).toBeNull();
  });
});
