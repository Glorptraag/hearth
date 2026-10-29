/**
 * Choose a child's everyday watch-for DLO (WF §3.3 frontier; build plan HC-1c). Pure.
 *
 * Mapped to this repo (build plan §2/§3): a DLO is `dlo.<THREAD>.<tier>` and
 * the chain's "band" is the tier. Inputs are the child's `learner_dlo_status`
 * rows and the DLO ids whose `watchForNext` note is human-confirmed.
 *
 *   - "Shown" = the status has reached the DLO's own tier (the constellation's
 *     rule, `src/lib/capabilities/next-dlo.ts`).
 *   - "Noticed" (one confirmation) = there is evidence on the DLO (a status
 *     row exists) but it isn't shown yet — e.g. one developing link, where the
 *     tier bar needs two.
 *   - An "active" thread has evidence on any of its DLOs.
 *
 * Rules, in order:
 *   1. Only DLOs with a confirmed note are candidates — never pick one without.
 *   2. The H6-suppressed thread never reaches a parent surface.
 *   3. Drop DLOs the child has already shown.
 *   4. Prefer: noticed → the next tier in an active thread (earlier tiers
 *      first) → a DLO whose prerequisites are shown (earlier tiers in its own
 *      thread, and at least one shown DLO in each prerequisite thread).
 *      Anything else isn't on the frontier and is left out.
 *   5. Ties: the thread the family logged least in the last 14 days, then id.
 *
 * Not here yet (WF §3.3/§3.5): rotation after three carries (needs the
 * watch_fors table, HC-5) and the tradition `nextBias` tie-break.
 */
import type { ObservationTier } from '@/types/capability-universe';
import { parseDloId, TIER_ORDER } from '@/lib/ai/thread-tier';
import { isSuppressedThread } from '@/lib/capability-alpha-suppression';
import { THREAD_CONNECTIONS } from '@/lib/capability-threads';
import { DLO_TIER_RANK, isDloReached, nextDloToWatch } from '@/lib/capabilities/next-dlo';

export type DloStatusRow = { dloId: string; status: string };

export type FrontierReason = 'noticed' | 'active-thread' | 'prereqs-shown';

export type FrontierPick = {
  dloId: string;
  threadId: string;
  tier: ObservationTier;
  reason: FrontierReason;
};

export type SelectInput = {
  /** This child's learner_dlo_status rows. */
  statusRows: readonly DloStatusRow[];
  /** DLO ids with a confirmed watch-for note. */
  confirmedDloIds: Iterable<string>;
  /** Family log counts per thread id over the last 14 days. Missing = 0. */
  threadLogCounts14d?: Readonly<Record<string, number>>;
  /** Thread id → prerequisite thread ids. Defaults to THREAD_CONNECTIONS. */
  prereqsByThread?: Readonly<Record<string, readonly string[]>>;
};

const REASON_RANK: Record<FrontierReason, number> = { noticed: 0, 'active-thread': 1, 'prereqs-shown': 2 };

const DEFAULT_PREREQS: Record<string, string[]> = THREAD_CONNECTIONS.reduce(
  (acc, [from, to]) => {
    (acc[to] ||= []).push(from);
    return acc;
  },
  {} as Record<string, string[]>,
);

/** Every frontier candidate, best first. */
export function rankFrontier(input: SelectInput): FrontierPick[] {
  const prereqs = input.prereqsByThread ?? DEFAULT_PREREQS;
  const logs = input.threadLogCounts14d ?? {};

  const status = new Map<string, string>();
  const activeThreads = new Set<string>();
  const shownThreads = new Set<string>();
  for (const row of input.statusRows) {
    const parsed = parseDloId(row.dloId);
    if (!parsed) continue;
    status.set(row.dloId, row.status);
    activeThreads.add(parsed.threadId);
    if (isDloReached(row.status, parsed.tier)) shownThreads.add(parsed.threadId);
  }

  const isShown = (threadId: string, tier: ObservationTier) => {
    const s = status.get(`dlo.${threadId}.${tier}`);
    return s !== undefined && isDloReached(s, tier);
  };

  const picks: FrontierPick[] = [];
  const seen = new Set<string>();
  for (const dloId of input.confirmedDloIds) {
    if (seen.has(dloId)) continue;
    seen.add(dloId);
    const parsed = parseDloId(dloId);
    if (!parsed || isSuppressedThread(dloId)) continue;
    const { threadId, tier } = parsed;
    if (isShown(threadId, tier)) continue;

    let reason: FrontierReason | null = null;
    if (status.has(dloId)) {
      reason = 'noticed';
    } else if (activeThreads.has(threadId)) {
      const next = nextDloToWatch(
        TIER_ORDER.map((t) => ({ tier: t, status: status.get(`dlo.${threadId}.${t}`) ?? 'not-started' })),
      );
      if (next?.tier === tier) reason = 'active-thread';
    } else {
      const earlierShown = TIER_ORDER.filter((t) => DLO_TIER_RANK[t] < DLO_TIER_RANK[tier]).every((t) =>
        isShown(threadId, t),
      );
      const prereqsShown = (prereqs[threadId] ?? [])
        .filter((p) => !isSuppressedThread(p))
        .every((p) => shownThreads.has(p));
      if (earlierShown && prereqsShown) reason = 'prereqs-shown';
    }
    if (reason) picks.push({ dloId, threadId, tier, reason });
  }

  return picks.sort(
    (a, b) =>
      REASON_RANK[a.reason] - REASON_RANK[b.reason] ||
      (a.reason === 'active-thread' ? DLO_TIER_RANK[a.tier] - DLO_TIER_RANK[b.tier] : 0) ||
      (logs[a.threadId] ?? 0) - (logs[b.threadId] ?? 0) ||
      a.dloId.localeCompare(b.dloId),
  );
}

/** The child's top frontier DLO with a confirmed note, or null. */
export function selectWatchDlo(input: SelectInput): FrontierPick | null {
  return rankFrontier(input)[0] ?? null;
}
