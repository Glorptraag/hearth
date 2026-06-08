/**
 * Write-time milestone detection for the Portfolio sage "Milestone" card.
 *
 * A milestone is the entry at which a learner crossed an achievement boundary:
 *  - a capability-tier leap: the entry that brings a thread's running
 *    observation count to 4 (emerging → developing) or 8 (developing →
 *    demonstrating).
 *  - a badge-threshold crossing: the entry that brings a badge's combined
 *    observation count (summed across its threads) to the badge's threshold.
 *
 * The thresholds and counting semantics MIRROR snapshot-rebuild.ts so a
 * milestone always corresponds to a tier/badge the snapshot actually shows:
 *  - tiers: count >= 4 → developing, >= 8 → demonstrating;
 *  - a badge's totalObs is the sum of its threads' per-entry counts;
 *  - every `capability_threads` entry counts once regardless of confidence
 *    (snapshot tier counts are unfiltered — unlike the Portfolio's >= 0.5
 *    *display* floor).
 *
 * Detection runs per child against that child's entries, so the crossing matches
 * that child's tier. Parent tier *overrides* (which can only lower a displayed
 * tier) are intentionally NOT applied — a milestone marks the raw evidence
 * crossing, not the possibly-lowered displayed tier. Award state is likewise
 * not consulted: the crossing entry is the achievement moment whether or not a
 * badge was later awarded.
 */

export type MilestoneReason =
  | { kind: 'tier_advance'; thread_id: string; tier: 'developing' | 'demonstrating' }
  | { kind: 'badge_ready'; badge_id: string };

export type MilestoneEntryInput = {
  id: string;
  /** 'yyyy-MM-dd' — primary chronological sort key (matches snapshot ordering). */
  dateOccurred: string;
  /** Tie-breaker for same-day entries; null tolerated (treated as epoch 0). */
  createdAt: Date | string | null;
  /** Capability thread ids mapped onto this entry (confidence-agnostic). */
  threadIds: string[];
};

export type MilestoneBadgeInput = {
  id: string;
  capabilityThreadIds: string[] | null;
  observationThreshold: number | null;
};

export const TIER_DEVELOPING_AT = 4;
export const TIER_DEMONSTRATING_AT = 8;
export const DEFAULT_BADGE_THRESHOLD = 5;

/**
 * Returns a map of entry id → the boundary crossing(s) that entry caused.
 * Entries not present in the map are not milestones.
 */
export function detectMilestoneEntries(
  entries: MilestoneEntryInput[],
  badges: MilestoneBadgeInput[],
): Map<string, MilestoneReason[]> {
  // A crossing belongs to the entry that first reaches the threshold, so we must
  // walk oldest → newest. Secondary sort by createdAt then id keeps same-day
  // entries deterministic across rebuilds.
  const ordered = [...entries].sort((a, b) => {
    if (a.dateOccurred !== b.dateOccurred) return a.dateOccurred < b.dateOccurred ? -1 : 1;
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (at !== bt) return at - bt;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const threadCount: Record<string, number> = {};
  const badgeCount: Record<string, number> = {};
  const result = new Map<string, MilestoneReason[]>();
  const mark = (id: string, reason: MilestoneReason) => {
    const list = result.get(id);
    if (list) list.push(reason);
    else result.set(id, [reason]);
  };

  for (const entry of ordered) {
    // An entry counts at most once per thread (mirrors snapshot's per-entry
    // increment), so a thread crosses at most one tier boundary per entry.
    const threadIds = [...new Set(entry.threadIds)];

    for (const tid of threadIds) {
      const after = (threadCount[tid] ?? 0) + 1;
      threadCount[tid] = after;
      if (after === TIER_DEVELOPING_AT) {
        mark(entry.id, { kind: 'tier_advance', thread_id: tid, tier: 'developing' });
      } else if (after === TIER_DEMONSTRATING_AT) {
        mark(entry.id, { kind: 'tier_advance', thread_id: tid, tier: 'demonstrating' });
      }
    }

    for (const badge of badges) {
      const badgeThreads = badge.capabilityThreadIds ?? [];
      if (badgeThreads.length === 0) continue;
      const delta = threadIds.filter((t) => badgeThreads.includes(t)).length;
      if (delta === 0) continue;
      const before = badgeCount[badge.id] ?? 0;
      const after = before + delta;
      badgeCount[badge.id] = after;
      const threshold = badge.observationThreshold ?? DEFAULT_BADGE_THRESHOLD;
      // `before < threshold && after >= threshold` (not ===) so an entry that
      // contributes several of the badge's threads still attributes the cross.
      if (before < threshold && after >= threshold) {
        mark(entry.id, { kind: 'badge_ready', badge_id: badge.id });
      }
    }
  }

  return result;
}
