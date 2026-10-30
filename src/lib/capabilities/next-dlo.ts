/**
 * "Has the child shown this objective yet?" and "which objective is next?" —
 * shared by the constellation (client) and the Dashboard watch-for (server).
 * Pure, client-safe. Moved out of the constellation's topology.ts (HC-1c, G29)
 * so the frontier can be computed on the server too.
 *
 * A DLO is `dlo.<THREAD>.<tier>`. The learner's `learner_dlo_status.status`
 * for that DLO is reached when it is at or above the DLO's own tier.
 */
import type { ObservationTier } from '@/types/capability-universe';

/**
 * Rank of a status for "how far along" comparisons. Accepts both the stored
 * `learner_dlo_status.status` values and the constellation's render status
 * (`confirmed` = demonstrating). Unknown values rank as not started.
 */
export const DLO_STATUS_RANK: Record<string, number> = {
  'not-started': 0,
  emerging: 1,
  developing: 2,
  demonstrating: 3,
  confirmed: 3,
};

export const DLO_TIER_RANK: Record<ObservationTier, number> = {
  emerging: 1,
  developing: 2,
  demonstrating: 3,
};

export function statusRank(status: string | null | undefined): number {
  return DLO_STATUS_RANK[status ?? ''] ?? 0;
}

/** True when a learner status for a DLO is at or above that DLO's tier. */
export function isDloReached(status: string | null | undefined, tier: ObservationTier): boolean {
  return statusRank(status) >= DLO_TIER_RANK[tier];
}

/**
 * The next objective worth watching for: the first DLO in tier order whose
 * learner status has not yet reached its own tier. Returns null when every
 * DLO is at or above its tier (the thread is fully evidenced) or the list
 * is empty. Callers pass a thread's DLOs in tier order.
 */
export function nextDloToWatch<T extends { tier: ObservationTier; status: string }>(dlos: readonly T[]): T | null {
  for (const d of dlos) {
    if (!isDloReached(d.status, d.tier)) return d;
  }
  return null;
}
