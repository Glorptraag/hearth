import { describe, it, expect } from 'vitest';
import {
  ALL_THREADS,
  ORDERED_DOMAINS,
  THREADS_BY_ID,
  buildDLOs,
  buildSnapshot,
  deriveThreadStates,
  topoColumn,
  type ActiveThreadRow,
} from './topology';

describe('topology', () => {
  it('ALL_THREADS includes every domain', () => {
    const seenDomains = new Set(ALL_THREADS.map((t) => t.domain));
    for (const d of ORDERED_DOMAINS) {
      expect(seenDomains.has(d.key)).toBe(true);
    }
  });

  it('foundational threads have no prereqs', () => {
    for (const t of ALL_THREADS) {
      if (t.foundational) expect(t.prereqs).toHaveLength(0);
      else expect(t.prereqs.length).toBeGreaterThan(0);
    }
  });

  it('topoColumn places foundational nodes at column 0', () => {
    const literacy = ALL_THREADS.filter((t) => t.domain === 'literacy');
    const cols = topoColumn(literacy);
    const foundationCols = literacy.filter((t) => t.foundational).map((t) => cols[t.id]);
    expect(Math.min(...foundationCols)).toBe(0);
  });

  it('topoColumn places L3 (Reading Comprehension) downstream of L1', () => {
    const lit = ALL_THREADS.filter((t) => t.domain === 'literacy');
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

  it('buildDLOs derives 3 tier-stratified objectives with mechanical statuses', () => {
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
    const dlos = buildDLOs('L1', snap);
    expect(dlos).toHaveLength(3);
    expect(dlos[0].status).toBe('confirmed');     // emerging (rank 1 <= 1)
    expect(dlos[1].status).toBe('emerging');      // developing (rank 2 == 1+1, currentTier active)
    expect(dlos[2].status).toBe('not-started');   // demonstrating
  });

  it('THREADS_BY_ID resolves by id', () => {
    expect(THREADS_BY_ID['L1']?.name).toBe('Oral Communication');
  });
});
