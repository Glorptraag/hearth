import { describe, it, expect } from 'vitest';
import {
  ALL_THREADS,
  ORDERED_DOMAINS,
  THREADS_BY_ID,
  buildDLOs,
  buildSnapshot,
  deriveThreadStates,
  indexDLOsByThread,
  threadIdFromRef,
  topoColumn,
  type ActiveThreadRow,
  type SanityDLO,
} from './topology';

describe('topology', () => {
  it('every thread maps to a known v2 domain', () => {
    const domainKeys = new Set(ORDERED_DOMAINS.map((d) => d.key));
    for (const t of ALL_THREADS) {
      expect(domainKeys.has(t.domain)).toBe(true);
    }
  });

  it('ORDERED_DOMAINS is the 15 v2 domains; Classical Languages & Theology are empty', () => {
    expect(ORDERED_DOMAINS).toHaveLength(15);
    const byKey = Object.fromEntries(ORDERED_DOMAINS.map((d) => [d.key, d]));
    expect(byKey['classicalLanguages']?.threadCount).toBe(0);
    expect(byKey['theologyScripture']?.threadCount).toBe(0);
    expect(byKey['languageLiteracy']?.threadCount).toBe(7);
  });

  it('foundational threads have no prereqs', () => {
    for (const t of ALL_THREADS) {
      if (t.foundational) expect(t.prereqs).toHaveLength(0);
      else expect(t.prereqs.length).toBeGreaterThan(0);
    }
  });

  it('topoColumn places foundational nodes at column 0', () => {
    const literacy = ALL_THREADS.filter((t) => t.domain === 'languageLiteracy');
    const cols = topoColumn(literacy);
    const foundationCols = literacy.filter((t) => t.foundational).map((t) => cols[t.id]);
    expect(Math.min(...foundationCols)).toBe(0);
  });

  it('topoColumn places L3 (Reading Comprehension) downstream of L1', () => {
    const lit = ALL_THREADS.filter((t) => t.domain === 'languageLiteracy');
    const cols = topoColumn(lit);
    expect(cols['L3']).toBeGreaterThan(cols['L1']);
  });

  it('deriveThreadStates marks ghosts when all prereqs are active', () => {
    // L3 has prereqs L1 and L4. If both have a tier, L5 (downstream of L3) becomes ghost when itself unobserved.
    const tier = {
      L1: 'developing' as const,
      L4: 'developing' as const,
      L3: 'emerging' as const,
    };
    const state = deriveThreadStates(tier);
    expect(state['L3']).toBe('active');
    expect(state['L5']).toBe('ghost'); // L5 prereq is L3; L3 active → L5 ghost
    expect(state['L1']).toBe('active');
  });

  it('deriveThreadStates marks dormant for threads whose prereqs are not active', () => {
    const state = deriveThreadStates({});
    // L1 is foundational so it's dormant (no prereqs to lean on, and no observations)
    expect(state['L1']).toBe('dormant');
    // L3's prereq L1 is dormant → L3 also dormant, not ghost
    expect(state['L3']).toBe('dormant');
  });

  it('buildSnapshot reflects observation counts and tier from API rows', () => {
    const rows: ActiveThreadRow[] = [
      {
        thread_id: 'L1',
        thread_name: 'Oral Communication',
        observation_count: 5,
        suggested_tier: 'developing',
        last_evidence_date: '2026-05-01',
        current_badge_level: null,
        next_badge: 'practising',
        next_badge_progress: 0.4,
        dlos_confirmed: 1,
        dlos_total: 3,
      },
    ];
    const snap = buildSnapshot({ id: 'x', name: 'Test', colourToken: 'rose' }, rows);
    expect(snap.tierByThread['L1']).toBe('developing');
    expect(snap.observationsByThread['L1']).toBe(5);
    expect(snap.threadState['L1']).toBe('active');
    expect(snap.dlosByThread['L1']).toEqual({ confirmed: 1, total: 3 });
  });

  it('threadIdFromRef strips the capabilityThread. prefix', () => {
    expect(threadIdFromRef('capabilityThread.L1')).toBe('L1');
    expect(threadIdFromRef('capabilityThread.EF8')).toBe('EF8');
    expect(threadIdFromRef('something-else')).toBe(null);
  });

  it('indexDLOsByThread groups Sanity DLOs by derived threadId', () => {
    const rows: SanityDLO[] = [
      { _id: 'dlo.L1.emerging', threadRef: 'capabilityThread.L1', tier: 'emerging', descriptor: 'A' },
      { _id: 'dlo.L1.developing', threadRef: 'capabilityThread.L1', tier: 'developing', descriptor: 'B' },
      { _id: 'dlo.M1.emerging', threadRef: 'capabilityThread.M1', tier: 'emerging', descriptor: 'C' },
      { _id: 'dlo.bad', threadRef: 'capabilityThread.', tier: 'emerging', descriptor: 'D' },
    ];
    const idx = indexDLOsByThread(rows);
    expect(idx['L1']?.length).toBe(2);
    expect(idx['M1']?.length).toBe(1);
    // Empty prefix produces an empty-string threadId; the helper still groups it,
    // which is fine — unknown threadIds won't match any consumer lookup.
  });

  it('buildDLOs resolves Sanity DLOs in tier order with no fabricated status', () => {
    const rows: ActiveThreadRow[] = [
      {
        thread_id: 'L1', thread_name: 'Oral Communication',
        observation_count: 9, suggested_tier: 'developing',
        last_evidence_date: '2026-05-01',
        current_badge_level: null, next_badge: null, next_badge_progress: 0,
        dlos_confirmed: 1, dlos_total: 3,
      },
    ];
    const snap = buildSnapshot({ id: 'x', name: 'Test', colourToken: null }, rows);
    const sanityByThread: Record<string, SanityDLO[]> = {
      L1: [
        { _id: 'dlo.L1.demonstrating', threadRef: 'capabilityThread.L1', tier: 'demonstrating', descriptor: 'Adapts register to audience' },
        { _id: 'dlo.L1.emerging', threadRef: 'capabilityThread.L1', tier: 'emerging', descriptor: 'Initiates a conversation' },
        { _id: 'dlo.L1.developing', threadRef: 'capabilityThread.L1', tier: 'developing', descriptor: 'Sustains back-and-forth' },
      ],
    };

    // dlos_confirmed:1 used to fabricate confirmed/emerging via tier-rank.
    // That arithmetic is gone — every DLO is an honest 'not-started' until a
    // genuine per-DLO persistence surface lands in a follow-up.
    const dlos = buildDLOs('L1', snap, sanityByThread);
    expect(dlos.map((d) => d.tier)).toEqual(['emerging', 'developing', 'demonstrating']);
    expect(dlos.map((d) => d.source)).toEqual(['sanity', 'sanity', 'sanity']);
    expect(dlos.every((d) => d.status === 'not-started')).toBe(true);
    expect(dlos[0].descriptor).toBe('Initiates a conversation');
  });

  it('buildDLOs supports n-DLOs-per-tier from Sanity without fabricating status', () => {
    const rows: ActiveThreadRow[] = [
      {
        thread_id: 'L1', thread_name: 'Oral Communication',
        observation_count: 1, suggested_tier: 'emerging',
        last_evidence_date: '2026-05-01',
        current_badge_level: null, next_badge: null, next_badge_progress: 0,
        dlos_confirmed: 0, dlos_total: 5,
      },
    ];
    const snap = buildSnapshot({ id: 'x', name: 'Test', colourToken: null }, rows);
    const sanityByThread: Record<string, SanityDLO[]> = {
      L1: [
        { _id: 'dlo.L1.emerging.a', threadRef: 'capabilityThread.L1', tier: 'emerging', descriptor: 'A' },
        { _id: 'dlo.L1.emerging.b', threadRef: 'capabilityThread.L1', tier: 'emerging', descriptor: 'B' },
        { _id: 'dlo.L1.developing', threadRef: 'capabilityThread.L1', tier: 'developing', descriptor: 'C' },
      ],
    };
    const dlos = buildDLOs('L1', snap, sanityByThread);
    expect(dlos).toHaveLength(3);
    expect(dlos.filter((d) => d.tier === 'emerging')).toHaveLength(2);
    expect(dlos.every((d) => d.status === 'not-started')).toBe(true);
  });

  it('buildDLOs falls back to placeholder descriptors when Sanity is empty for a thread', () => {
    const rows: ActiveThreadRow[] = [
      {
        thread_id: 'L1', thread_name: 'Oral Communication',
        observation_count: 0, suggested_tier: 'unobserved',
        last_evidence_date: '',
        current_badge_level: null, next_badge: null, next_badge_progress: 0,
        dlos_confirmed: 0, dlos_total: 3,
      },
    ];
    const snap = buildSnapshot({ id: 'x', name: 'Test', colourToken: null }, rows);
    const dlos = buildDLOs('L1', snap, {});
    expect(dlos).toHaveLength(3);
    expect(dlos.every((d) => d.source === 'placeholder')).toBe(true);
  });

  it('THREADS_BY_ID resolves by id', () => {
    expect(THREADS_BY_ID['L1']?.name).toBe('Oral Communication');
  });
});
