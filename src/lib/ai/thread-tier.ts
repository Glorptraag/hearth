/**
 * Thread-tier derivation — count-based (today) vs DLO-evidence-based (WS-4).
 *
 * Two pure functions, no I/O, no LLM:
 *
 *   1. `countBasedTier` mirrors the production ladder in
 *      `src/lib/ai/snapshot-rebuild.ts` (≥8 demonstrating / ≥4 developing /
 *      else emerging, with a lower-only parent override). It is *replicated*
 *      here — not imported — so the admin tier-comparison tool can compute it
 *      standalone and so C1 changes nothing in the parent-facing snapshot
 *      pipeline. Keep `COUNT_TIER_THRESHOLDS` in lockstep with snapshot-rebuild.
 *
 *   2. `deriveThreadTierFromDlos` derives a thread's tier from its accumulated
 *      DLO evidence instead of raw observation counts — the WS-4 honesty model.
 *      The "demonstrating bar" (decision D-OS4) is a PARAMETER: the proposed
 *      default lives in `DEFAULT_DOS4_BAR`, but the caller passes whatever bar
 *      Drew is evaluating. This is the lib the C1 admin panel uses to show
 *      count-based vs derived tier side by side, and that C3 will later fold
 *      into the snapshot once D-OS4 is confirmed against real pilot data.
 *
 * Source data shapes mirror the DB:
 *   - `learner_dlo_status`        → `DloStatus` map, keyed by DLO id.
 *   - `observation_dlo_links`     → `SourceCountsByTier` (provenance + distinct
 *                                    inferred days, per tier).
 * DLO ids encode their thread and tier as `dlo.{threadId}.{tier}` (see
 * scripts/seed-dlos.ts) — `parseDloId` recovers both.
 */

import type { ObservationTier } from '@/types/capability-universe';

/** The three observable tiers, ranked low → high. */
export const TIER_ORDER: readonly ObservationTier[] = [
  'emerging',
  'developing',
  'demonstrating',
] as const;

const TIER_RANK: Record<ObservationTier, number> = {
  emerging: 0,
  developing: 1,
  demonstrating: 2,
};

/**
 * Numeric rank for ordering/delta maths. `null` (no evidence) ranks below
 * `emerging` so a thread with zero DLO evidence sorts beneath every tier.
 */
export function tierRank(tier: ObservationTier | null): number {
  return tier == null ? -1 : TIER_RANK[tier];
}

const TIERS = new Set<string>(TIER_ORDER);

function isTier(value: string): value is ObservationTier {
  return TIERS.has(value);
}

/**
 * Recover `{ threadId, tier }` from a seeded DLO id (`dlo.{threadId}.{tier}`).
 * The tier is the final dotted segment; the thread id is everything between
 * the `dlo.` prefix and that tier (thread codes carry no dots, e.g. `L1`,
 * `PS3`). Returns null for any id that does not match the shape or whose
 * trailing segment is not a valid tier.
 */
export function parseDloId(dloId: string): { threadId: string; tier: ObservationTier } | null {
  if (!dloId.startsWith('dlo.')) return null;
  const parts = dloId.split('.');
  if (parts.length < 3) return null;
  const tier = parts[parts.length - 1];
  if (!isTier(tier)) return null;
  const threadId = parts.slice(1, parts.length - 1).join('.');
  if (!threadId) return null;
  return { threadId, tier };
}

// ─── Count-based tier (current production behaviour) ───

/**
 * Observation-count thresholds for the count-based ladder. Mirrors
 * `src/lib/ai/snapshot-rebuild.ts` — a thread reaches `demonstrating` at
 * `demonstrating` observations, `developing` at `developing`, else `emerging`.
 */
export const COUNT_TIER_THRESHOLDS = { demonstrating: 8, developing: 4 } as const;

/**
 * Tier from raw observation count, with the production lower-only parent
 * override. An override can only *lower* the auto-derived tier, never raise it
 * (same rule as the snapshot rebuild).
 */
export function countBasedTier(
  observationCount: number,
  override?: ObservationTier | null,
): ObservationTier {
  let tier: ObservationTier =
    observationCount >= COUNT_TIER_THRESHOLDS.demonstrating
      ? 'demonstrating'
      : observationCount >= COUNT_TIER_THRESHOLDS.developing
        ? 'developing'
        : 'emerging';

  if (override && TIER_RANK[override] < TIER_RANK[tier]) tier = override;
  return tier;
}

// ─── DLO-evidence-based tier (WS-4) ───

/** Minimal slice of a `learner_dlo_status` row this derivation needs. */
export type DloStatus = { status: string };

/**
 * Per-tier DLO-link evidence for one (learner × thread), summarised from
 * `observation_dlo_links`. `declared` / `asserted` / `inferred` are link counts
 * by provenance; `inferredDistinctDays` is the number of distinct calendar days
 * carrying an inferred link (the D-OS4 "distinct days" signal — repeated
 * inference on a single day must not stack into a high tier).
 */
export interface TierEvidence {
  declared: number;
  asserted: number;
  inferred: number;
  inferredDistinctDays: number;
}

export type SourceCountsByTier = Partial<Record<ObservationTier, TierEvidence>>;

/**
 * Threshold for one tier. A tier clears the bar when EITHER clause holds:
 *   - `declared + asserted` links ≥ `minDeclaredOrAsserted`, OR
 *   - inferred links on distinct days ≥ `minInferredDistinctDays`.
 */
export interface TierThreshold {
  minDeclaredOrAsserted: number;
  minInferredDistinctDays: number;
  /**
   * When true, a reached `learner_dlo_status` for the tier satisfies it even
   * with no link-level provenance — a fallback for older/partial data where
   * status rows exist but `observation_dlo_links` provenance is absent. Default
   * false: the comparison is bar-driven so Drew can reason about it cleanly.
   */
  allowStatusFallback?: boolean;
}

export type ThreadTierBar = Record<ObservationTier, TierThreshold>;

/**
 * D-OS4 proposed default (adopted 2026-06-13 as the build target, pending
 * confirm/tune against the C1 real-data comparison before C3 locks it):
 *
 *   demonstrating = ≥1 declared/asserted link OR ≥2 inferred links on distinct days.
 *
 * `developing` / `emerging` carry a lighter single-piece-of-evidence bar so the
 * "highest tier with sufficient evidence" walk has a sensible floor. This is
 * only the default — the bar is a parameter the caller (and the admin panel)
 * overrides.
 */
export const DEFAULT_DOS4_BAR: ThreadTierBar = {
  demonstrating: { minDeclaredOrAsserted: 1, minInferredDistinctDays: 2 },
  developing: { minDeclaredOrAsserted: 1, minInferredDistinctDays: 1 },
  emerging: { minDeclaredOrAsserted: 1, minInferredDistinctDays: 1 },
};

/**
 * The LOCKED production bar (D-OS4, decided by Drew 2026-06-16 / decision C2 —
 * "TUNED-B") — this is what `snapshot-rebuild` derives parent-facing thread
 * tiers from. It is the one the constellation honours; `DEFAULT_DOS4_BAR` above
 * stays as the admin tier-comparison panel's tunable starting point.
 *
 *   emerging / developing = ≥1 declared/asserted OR ≥1 inferred distinct day
 *   demonstrating         = ≥1 declared/asserted ONLY — never inference alone
 *
 * `demonstrating` closes the inferred path entirely (`Infinity` distinct days =
 * unreachable by inference), so a thread can only read "demonstrating" when a
 * module declared the outcome or a parent asserted it — the corroboration bar
 * Bec's credibility ceiling needs. C2 confirmed this is identical to the
 * proposed default over current pilot data (nothing reaches demonstrating yet)
 * while permanently foreclosing inferred-only demonstrating as data grows.
 */
export const PRODUCTION_TIER_BAR: ThreadTierBar = {
  demonstrating: { minDeclaredOrAsserted: 1, minInferredDistinctDays: Infinity },
  developing: { minDeclaredOrAsserted: 1, minInferredDistinctDays: 1 },
  emerging: { minDeclaredOrAsserted: 1, minInferredDistinctDays: 1 },
};

export interface DerivedTierResult {
  /** Highest tier with sufficient DLO evidence, or null if none clears the bar. */
  tier: ObservationTier | null;
  /** Per-tier: did this tier clear the bar? */
  tierMet: Record<ObservationTier, boolean>;
  /** Per-tier: did `learner_dlo_status` reach this tier? (corroboration signal). */
  statusReached: Record<ObservationTier, boolean>;
}

function tierFlags(fn: (tier: ObservationTier) => boolean): Record<ObservationTier, boolean> {
  return {
    emerging: fn('emerging'),
    developing: fn('developing'),
    demonstrating: fn('demonstrating'),
  };
}

/**
 * Derive a thread's tier from its DLO evidence.
 *
 * @param dloStatuses  The learner's `learner_dlo_status` entries for this
 *   thread's DLOs, keyed by DLO id. Used for the per-tier `statusReached`
 *   corroboration signal (and the optional status fallback).
 * @param sourceCounts Per-tier link evidence (provenance + distinct inferred
 *   days) from `observation_dlo_links` for this (learner × thread).
 * @param bar          The D-OS4 thresholds. Defaults to `DEFAULT_DOS4_BAR`.
 *
 * A tier clears the bar per `TierThreshold` (declared/asserted OR inferred
 * distinct-day clause, plus the optional status fallback). The derived tier is
 * the *highest* tier that clears it — lower tiers need not independently clear
 * (a child demonstrating mastery has implicitly passed through), matching the
 * "highest tier with sufficient evidence" rule. Returns `null` when no tier
 * clears the bar.
 */
export function deriveThreadTierFromDlos(
  dloStatuses: Record<string, DloStatus>,
  sourceCounts: SourceCountsByTier,
  bar: ThreadTierBar = DEFAULT_DOS4_BAR,
): DerivedTierResult {
  const statusReached = tierFlags((tier) =>
    Object.values(dloStatuses).some((s) => s.status === tier),
  );

  const tierMet = tierFlags((tier) => {
    const ev = sourceCounts[tier];
    const threshold = bar[tier];
    const declaredOrAsserted = (ev?.declared ?? 0) + (ev?.asserted ?? 0);
    const meetsLinks =
      declaredOrAsserted >= threshold.minDeclaredOrAsserted ||
      (ev?.inferredDistinctDays ?? 0) >= threshold.minInferredDistinctDays;
    const meetsFallback = threshold.allowStatusFallback === true && statusReached[tier];
    return meetsLinks || meetsFallback;
  });

  let tier: ObservationTier | null = null;
  for (const t of TIER_ORDER) {
    if (tierMet[t]) tier = t; // walk low → high; keep the highest tier that clears the bar
  }

  return { tier, tierMet, statusReached };
}

/**
 * The parent-facing thread tier the constellation renders (WS-4): the
 * DLO-evidence-derived tier with the lower-only parent override applied.
 *
 * This is a PURE function of (dloStatuses, sourceCounts, override, bar). There
 * is deliberately NO observation-count parameter — a thread's rendered tier can
 * never be inflated by raw logging volume, only by accumulated DLO evidence.
 * Returns `null` ("Not yet") when no tier clears the bar. snapshot-rebuild calls
 * this so the snapshot and any other surface share one derivation.
 */
export function renderedThreadTier(
  dloStatuses: Record<string, DloStatus>,
  sourceCounts: SourceCountsByTier,
  override: ObservationTier | null | undefined,
  bar: ThreadTierBar = PRODUCTION_TIER_BAR,
): ObservationTier | null {
  const derived = deriveThreadTierFromDlos(dloStatuses, sourceCounts, bar).tier;
  // Lower-only: an override can pull a derived tier DOWN, never raise it, and
  // never lift a null ("Not yet") into a tier.
  if (override && derived && tierRank(override) < tierRank(derived)) return override;
  return derived;
}

/** Direction of the derived tier relative to the count-based tier. */
export type TierDeltaDirection = 'higher' | 'lower' | 'same';

export function tierDelta(
  countTier: ObservationTier,
  derivedTier: ObservationTier | null,
): TierDeltaDirection {
  const d = tierRank(derivedTier) - tierRank(countTier);
  if (d > 0) return 'higher';
  if (d < 0) return 'lower';
  return 'same';
}
