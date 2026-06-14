/**
 * UNIT: declaredTargetsToDloIds — the pure mapping of declared (thread, tier)
 * targets to deterministic DLO ids, with validation and dedup. The DB-touching
 * opportunity / corroboration behaviour is covered in
 * dlo-opportunity.integration.test.ts.
 */
import { describe, it, expect } from 'vitest';
import { declaredTargetsToDloIds } from '../dlo-persistence';

const VALID = new Set([
  'dlo.M1.emerging',
  'dlo.M1.developing',
  'dlo.M1.demonstrating',
  'dlo.L3.developing',
]);

describe('declaredTargetsToDloIds', () => {
  it('builds dlo.{thread}.{tier} ids that exist in the catalog', () => {
    expect(
      declaredTargetsToDloIds([{ threadId: 'M1', tier: 'developing' }], VALID),
    ).toEqual([{ dloId: 'dlo.M1.developing', tier: 'developing' }]);
  });

  it('drops targets whose DLO is not in the published catalog', () => {
    // S1 has no seeded DLO in this fixture.
    expect(declaredTargetsToDloIds([{ threadId: 'S1', tier: 'developing' }], VALID)).toEqual([]);
  });

  it('dedups repeated (thread, tier) targets', () => {
    expect(
      declaredTargetsToDloIds(
        [
          { threadId: 'M1', tier: 'developing' },
          { threadId: 'M1', tier: 'developing' },
        ],
        VALID,
      ),
    ).toEqual([{ dloId: 'dlo.M1.developing', tier: 'developing' }]);
  });

  it('keeps distinct tiers of the same thread as separate DLOs', () => {
    const out = declaredTargetsToDloIds(
      [
        { threadId: 'M1', tier: 'emerging' },
        { threadId: 'M1', tier: 'demonstrating' },
      ],
      VALID,
    );
    expect(out.map((o) => o.dloId).sort()).toEqual(['dlo.M1.demonstrating', 'dlo.M1.emerging']);
  });

  it('skips malformed targets (no threadId, invalid tier)', () => {
    const out = declaredTargetsToDloIds(
      [
        // @ts-expect-error invalid tier shape — should be skipped, not throw
        { threadId: 'M1', tier: 'nonsense' },
        // @ts-expect-error missing threadId
        { tier: 'developing' },
        { threadId: 'L3', tier: 'developing' },
      ],
      VALID,
    );
    expect(out).toEqual([{ dloId: 'dlo.L3.developing', tier: 'developing' }]);
  });

  it('returns [] for empty / nullish input', () => {
    expect(declaredTargetsToDloIds([], VALID)).toEqual([]);
    expect(declaredTargetsToDloIds(null, VALID)).toEqual([]);
    expect(declaredTargetsToDloIds(undefined, VALID)).toEqual([]);
  });
});
