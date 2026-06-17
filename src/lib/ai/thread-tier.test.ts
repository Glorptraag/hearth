import { describe, it, expect } from 'vitest';
import {
  countBasedTier,
  deriveThreadTierFromDlos,
  renderedThreadTier,
  parseDloId,
  tierRank,
  tierDelta,
  DEFAULT_DOS4_BAR,
  PRODUCTION_TIER_BAR,
  COUNT_TIER_THRESHOLDS,
  TIER_ORDER,
  type DloStatus,
  type SourceCountsByTier,
  type TierEvidence,
  type ThreadTierBar,
} from './thread-tier';
import type { ObservationTier } from '@/types/capability-universe';

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

describe('PRODUCTION_TIER_BAR (locked D-OS4 / C2 = TUNED-B)', () => {
  it('reaches demonstrating ONLY via a declared/asserted link, never inference', () => {
    // One declared demonstrating link → demonstrating.
    expect(
      deriveThreadTierFromDlos({}, { demonstrating: evidence({ declared: 1 }) }, PRODUCTION_TIER_BAR).tier,
    ).toBe('demonstrating');
    // One asserted demonstrating link → demonstrating.
    expect(
      deriveThreadTierFromDlos({}, { demonstrating: evidence({ asserted: 1 }) }, PRODUCTION_TIER_BAR).tier,
    ).toBe('demonstrating');
    // Any volume of inferred-only links — even many on many distinct days —
    // can NEVER reach demonstrating under the production bar.
    expect(
      deriveThreadTierFromDlos({}, { demonstrating: evidence({ inferred: 99, inferredDistinctDays: 99 }) }, PRODUCTION_TIER_BAR).tier,
    ).toBeNull();
  });

  it('keeps emerging/developing reachable on a single inferred day (constellation stays alive)', () => {
    expect(
      deriveThreadTierFromDlos({}, { emerging: evidence({ inferred: 1, inferredDistinctDays: 1 }) }, PRODUCTION_TIER_BAR).tier,
    ).toBe('emerging');
    expect(
      deriveThreadTierFromDlos({}, { developing: evidence({ inferred: 1, inferredDistinctDays: 1 }) }, PRODUCTION_TIER_BAR).tier,
    ).toBe('developing');
  });
});

describe('renderedThreadTier — pure function of evidence + bar + override (no count path)', () => {
  const TIERS: ObservationTier[] = ['emerging', 'developing', 'demonstrating'];
  const OVERRIDES: Array<ObservationTier | null> = [null, 'emerging', 'developing', 'demonstrating'];

  // Evidence shapes spanning "no evidence", inferred-only at each tier, and a
  // corroborated (declared) link at each tier.
  const SHAPES: Array<{ label: string; sc: SourceCountsByTier; status?: Record<string, DloStatus> }> = [
    { label: 'none', sc: {} },
    { label: 'emerging inferred', sc: { emerging: evidence({ inferred: 1, inferredDistinctDays: 1 }) } },
    { label: 'developing inferred', sc: { developing: evidence({ inferred: 1, inferredDistinctDays: 1 }) } },
    { label: 'demonstrating inferred x3', sc: { demonstrating: evidence({ inferred: 3, inferredDistinctDays: 3 }) } },
    { label: 'demonstrating declared', sc: { demonstrating: evidence({ declared: 1 }) } },
    { label: 'developing declared', sc: { developing: evidence({ declared: 1 }) } },
  ];

  it('only ever returns a valid tier or null', () => {
    for (const shape of SHAPES) {
      for (const override of OVERRIDES) {
        const r = renderedThreadTier(shape.status ?? {}, shape.sc, override);
        expect([null, ...TIERS]).toContain(r);
      }
    }
  });

  it('override can only LOWER (never raise), and never lifts a null into a tier', () => {
    for (const shape of SHAPES) {
      const base = renderedThreadTier(shape.status ?? {}, shape.sc, null);
      for (const override of OVERRIDES) {
        const r = renderedThreadTier(shape.status ?? {}, shape.sc, override);
        // Result never ranks above the un-overridden derivation.
        expect(tierRank(r)).toBeLessThanOrEqual(tierRank(base));
        // A null derivation stays null whatever the override.
        if (base === null) expect(r).toBeNull();
        // When the override is strictly lower than a non-null derivation, it wins.
        if (base !== null && override && tierRank(override) < tierRank(base)) {
          expect(r).toBe(override);
        }
      }
    }
  });

  it('is deterministic — same inputs, same output', () => {
    for (const shape of SHAPES) {
      for (const override of OVERRIDES) {
        const a = renderedThreadTier(shape.status ?? {}, shape.sc, override);
        const b = renderedThreadTier(shape.status ?? {}, shape.sc, override);
        expect(a).toBe(b);
      }
    }
  });

  it('ignores observation volume entirely — evidence is the only tier source', () => {
    // No DLO evidence ⇒ "Not yet", regardless of how much was logged. The
    // function has no count parameter, so volume cannot enter the result.
    expect(renderedThreadTier({}, {}, null)).toBeNull();
    // A single corroborated link outranks any amount of raw logging.
    expect(renderedThreadTier({}, { demonstrating: evidence({ declared: 1 }) }, null)).toBe('demonstrating');
  });

  it('a reached learner_dlo_status alone does NOT set the tier (links are the bar)', () => {
    // status rows corroborate but don't satisfy the production bar (no fallback).
    const r = renderedThreadTier({ 'dlo.L1.demonstrating': { status: 'demonstrating' } }, {}, null);
    expect(r).toBeNull();
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
