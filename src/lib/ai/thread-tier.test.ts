import { describe, it, expect } from 'vitest';
import {
  countBasedTier,
  deriveThreadTierFromDlos,
  parseDloId,
  tierRank,
  tierDelta,
  DEFAULT_DOS4_BAR,
  COUNT_TIER_THRESHOLDS,
  TIER_ORDER,
  type SourceCountsByTier,
  type TierEvidence,
  type ThreadTierBar,
} from './thread-tier';

function evidence(over: Partial<TierEvidence> = {}): TierEvidence {
  return { declared: 0, asserted: 0, inferred: 0, inferredDistinctDays: 0, ...over };
}

describe('parseDloId', () => {
  it('splits dlo.{thread}.{tier} into thread + tier', () => {
    expect(parseDloId('dlo.L1.demonstrating')).toEqual({ threadId: 'L1', tier: 'demonstrating' });
    expect(parseDloId('dlo.PS3.emerging')).toEqual({ threadId: 'PS3', tier: 'emerging' });
    expect(parseDloId('dlo.EF8.developing')).toEqual({ threadId: 'EF8', tier: 'developing' });
  });

  it('rejects malformed or non-tier ids', () => {
    expect(parseDloId('L1.demonstrating')).toBeNull();
    expect(parseDloId('dlo.L1')).toBeNull();
    expect(parseDloId('dlo.L1.mastered')).toBeNull();
    expect(parseDloId('dlo..emerging')).toBeNull();
    expect(parseDloId('')).toBeNull();
  });
});

describe('countBasedTier', () => {
  it('applies the production ladder (≥8 / ≥4 / else)', () => {
    expect(countBasedTier(0)).toBe('emerging');
    expect(countBasedTier(3)).toBe('emerging');
    expect(countBasedTier(COUNT_TIER_THRESHOLDS.developing)).toBe('developing');
    expect(countBasedTier(7)).toBe('developing');
    expect(countBasedTier(COUNT_TIER_THRESHOLDS.demonstrating)).toBe('demonstrating');
    expect(countBasedTier(50)).toBe('demonstrating');
  });

  it('lets a parent override LOWER the tier', () => {
    expect(countBasedTier(50, 'developing')).toBe('developing');
    expect(countBasedTier(50, 'emerging')).toBe('emerging');
  });

  it('never lets an override RAISE the tier', () => {
    expect(countBasedTier(0, 'demonstrating')).toBe('emerging');
    expect(countBasedTier(4, 'demonstrating')).toBe('developing');
  });

  it('ignores a null/undefined override', () => {
    expect(countBasedTier(8, null)).toBe('demonstrating');
    expect(countBasedTier(8, undefined)).toBe('demonstrating');
  });

  it('locks the canonical thresholds (snapshot-rebuild imports these — value lock)', () => {
    // snapshot-rebuild.ts now derives tier via countBasedTier rather than its own
    // inline ladder, so these are the single source of truth. This lock makes a
    // silent threshold change break a test instead of drifting the snapshot.
    expect(COUNT_TIER_THRESHOLDS).toEqual({ demonstrating: 8, developing: 4 });
    expect(countBasedTier(7)).toBe('developing'); // just under demonstrating
    expect(countBasedTier(3)).toBe('emerging'); // just under developing
  });
});

describe('tierRank', () => {
  it('ranks null below emerging', () => {
    expect(tierRank(null)).toBeLessThan(tierRank('emerging'));
    expect(tierRank('emerging')).toBeLessThan(tierRank('developing'));
    expect(tierRank('developing')).toBeLessThan(tierRank('demonstrating'));
  });
});

describe('deriveThreadTierFromDlos (default D-OS4 bar)', () => {
  const empty: SourceCountsByTier = {};

  it('returns null tier when there is no evidence', () => {
    const r = deriveThreadTierFromDlos({}, empty);
    expect(r.tier).toBeNull();
    expect(r.tierMet).toEqual({ emerging: false, developing: false, demonstrating: false });
  });

  it('credits demonstrating on ONE declared link', () => {
    const r = deriveThreadTierFromDlos(
      {},
      { demonstrating: evidence({ declared: 1 }) },
    );
    expect(r.tier).toBe('demonstrating');
    expect(r.tierMet.demonstrating).toBe(true);
  });

  it('credits demonstrating on ONE asserted link', () => {
    const r = deriveThreadTierFromDlos(
      {},
      { demonstrating: evidence({ asserted: 1 }) },
    );
    expect(r.tier).toBe('demonstrating');
  });

  it('does NOT credit demonstrating on a single inferred day', () => {
    const r = deriveThreadTierFromDlos(
      {},
      { demonstrating: evidence({ inferred: 3, inferredDistinctDays: 1 }) },
    );
    // ≥2 distinct days required for inferred-only demonstrating
    expect(r.tierMet.demonstrating).toBe(false);
    expect(r.tier).toBeNull();
  });

  it('credits demonstrating on ≥2 inferred DISTINCT days', () => {
    const r = deriveThreadTierFromDlos(
      {},
      { demonstrating: evidence({ inferred: 2, inferredDistinctDays: 2 }) },
    );
    expect(r.tier).toBe('demonstrating');
  });

  it('treats many inferred links on one day as insufficient for demonstrating', () => {
    const r = deriveThreadTierFromDlos(
      {},
      { demonstrating: evidence({ inferred: 9, inferredDistinctDays: 1 }) },
    );
    expect(r.tier).toBeNull();
  });

  it('returns the HIGHEST tier that clears the bar, skipping gaps', () => {
    // demonstrating clears via a declared link; developing/emerging have nothing.
    const r = deriveThreadTierFromDlos(
      {},
      { demonstrating: evidence({ declared: 1 }) },
    );
    expect(r.tier).toBe('demonstrating');
    expect(r.tierMet.developing).toBe(false);
    expect(r.tierMet.emerging).toBe(false);
  });

  it('credits developing on a single inferred day (lighter bar)', () => {
    const r = deriveThreadTierFromDlos(
      {},
      { developing: evidence({ inferred: 1, inferredDistinctDays: 1 }) },
    );
    expect(r.tier).toBe('developing');
  });

  it('reports statusReached independently of the bar', () => {
    const r = deriveThreadTierFromDlos(
      { 'dlo.L1.demonstrating': { status: 'demonstrating' } },
      {}, // no link-level provenance
    );
    expect(r.statusReached.demonstrating).toBe(true);
    // Bar is link-driven by default, so no fallback → tier stays null.
    expect(r.tier).toBeNull();
  });
});

describe('deriveThreadTierFromDlos (custom bars)', () => {
  it('honours a stricter demonstrating bar (≥2 declared)', () => {
    const strict: ThreadTierBar = {
      ...DEFAULT_DOS4_BAR,
      demonstrating: { minDeclaredOrAsserted: 2, minInferredDistinctDays: 3 },
    };
    expect(
      deriveThreadTierFromDlos({}, { demonstrating: evidence({ declared: 1 }) }, strict).tier,
    ).toBeNull();
    expect(
      deriveThreadTierFromDlos({}, { demonstrating: evidence({ declared: 2 }) }, strict).tier,
    ).toBe('demonstrating');
  });

  it('allowStatusFallback lets a reached status satisfy a tier without links', () => {
    const withFallback: ThreadTierBar = {
      emerging: { ...DEFAULT_DOS4_BAR.emerging, allowStatusFallback: true },
      developing: { ...DEFAULT_DOS4_BAR.developing, allowStatusFallback: true },
      demonstrating: { ...DEFAULT_DOS4_BAR.demonstrating, allowStatusFallback: true },
    };
    const r = deriveThreadTierFromDlos(
      { 'dlo.L1.developing': { status: 'developing' } },
      {},
      withFallback,
    );
    expect(r.tier).toBe('developing');
  });

  it('falls back only to the highest reached status', () => {
    const withFallback: ThreadTierBar = {
      emerging: { ...DEFAULT_DOS4_BAR.emerging, allowStatusFallback: true },
      developing: { ...DEFAULT_DOS4_BAR.developing, allowStatusFallback: true },
      demonstrating: { ...DEFAULT_DOS4_BAR.demonstrating, allowStatusFallback: true },
    };
    const r = deriveThreadTierFromDlos(
      {
        'dlo.L1.emerging': { status: 'emerging' },
        'dlo.L1.developing': { status: 'developing' },
      },
      {},
      withFallback,
    );
    expect(r.tier).toBe('developing');
  });
});

describe('tierDelta', () => {
  it('classifies derived vs count-based direction', () => {
    expect(tierDelta('demonstrating', 'emerging')).toBe('lower');
    expect(tierDelta('emerging', 'demonstrating')).toBe('higher');
    expect(tierDelta('developing', 'developing')).toBe('same');
  });

  it('treats null derived as lower than any count tier', () => {
    expect(tierDelta('emerging', null)).toBe('lower');
    expect(tierDelta('demonstrating', null)).toBe('lower');
  });
});

describe('TIER_ORDER', () => {
  it('is low → high', () => {
    expect(TIER_ORDER).toEqual(['emerging', 'developing', 'demonstrating']);
  });
});
