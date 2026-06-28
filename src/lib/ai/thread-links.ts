/**
 * Declarative thread-link extraction from activity metadata.
 *
 * When an entry carries `sourceActivityIds`, each activity in Sanity declares
 * the capability work it is built to develop. There are two declarative shapes:
 *
 *   - `capabilityTargets[]` (WS-6): { thread, tier } — the author-declared tier
 *     the activity targets. This is the source of truth for the tier.
 *   - `capabilityThreads[]` (legacy): a bare thread reference with no tier.
 *     Kept during the WS-6 migration; falls back to DEFAULT_TIER.
 *
 * We mirror them into `learning_entries.thread_links` with
 * `confidence: 'confirmed'` — the content author asserted these at publish
 * time, so they carry higher confidence than Haiku's inferred threads in
 * `aiEnrichment.capability_threads` (which stay `suggested`).
 *
 * Thread ids are normalised to the bare canonical code (e.g. "M1") at write
 * time; `entryThreadIds` (the only reader) normalises again, so either form is
 * safe, but bare keeps the stored shape consistent with enrich.ts. Stray/UUID
 * thread refs that aren't in the canonical 57-thread set are dropped here.
 *
 * Best-effort: any failure (Sanity hiccup, malformed metadata) logs and
 * returns []. Never throws — the entry insert must not fail because of
 * an enrichment auxiliary.
 *
 * See deepwork plan workstream E; WS-6 (capabilityTargets) per
 * .claude/plans/PLAN-outcomes-spine-phase2.md task D1.
 */

import { sanityServerClient } from '@/lib/sanity/client';
import type {
  ThreadObservationLink,
  ObservationTier,
  StageBandKey,
} from '@/types/capability-universe';
import { normalizeThreadId } from './thread-aggregation';

// Activities that declare a bare `capabilityThreads` ref carry no tier — this
// is the mid-band fallback until they're migrated to `capabilityTargets`.
// Activities aren't yet authored per stage band, so stageBand is also a
// default; snapshot consumers blend these with Haiku's per-entry signals.
const DEFAULT_TIER: ObservationTier = 'developing';
const DEFAULT_STAGE_BAND: StageBandKey = 'intermediate';

const VALID_TIERS = new Set<ObservationTier>(['emerging', 'developing', 'demonstrating']);
const TIER_RANK: Record<ObservationTier, number> = { emerging: 0, developing: 1, demonstrating: 2 };

interface ActivityWithThreads {
  _id: string;
  capabilityThreads?: Array<{ _id: string } | null> | null;
  capabilityTargets?: Array<{ tier?: string | null; thread?: { _id: string } | null } | null> | null;
}

/**
 * Pure: collapse a set of activity docs into one ThreadObservationLink per bare
 * thread code. `capabilityTargets` (explicit tier) take precedence over bare
 * `capabilityThreads` (DEFAULT_TIER). When several activities target the same
 * thread at different tiers, the highest declared tier wins.
 *
 * Exported for unit testing without a Sanity round-trip.
 */
export function buildThreadLinksFromActivityDocs(
  activities: ActivityWithThreads[] | null | undefined,
): ThreadObservationLink[] {
  const tierByThread = new Map<string, ObservationTier>();

  // Pass 1 — capabilityTargets carry the author-declared tier.
  for (const activity of activities ?? []) {
    for (const target of activity?.capabilityTargets ?? []) {
      const bare = target?.thread?._id ? normalizeThreadId(target.thread._id) : null;
      if (!bare) continue;
      const tier =
        target?.tier && VALID_TIERS.has(target.tier as ObservationTier)
          ? (target.tier as ObservationTier)
          : DEFAULT_TIER;
      const existing = tierByThread.get(bare);
      if (!existing || TIER_RANK[tier] > TIER_RANK[existing]) tierByThread.set(bare, tier);
    }
  }

  // Pass 2 — bare capabilityThreads, only for threads no target already covered.
  for (const activity of activities ?? []) {
    for (const thread of activity?.capabilityThreads ?? []) {
      const bare = thread?._id ? normalizeThreadId(thread._id) : null;
      if (!bare || tierByThread.has(bare)) continue;
      tierByThread.set(bare, DEFAULT_TIER);
    }
  }

  return [...tierByThread.entries()].map(([threadId, tier]) => ({
    threadId,
    stageBand: DEFAULT_STAGE_BAND,
    tierAtTime: tier,
    // Declarative: author asserted at publish time that this activity touches
    // this thread. Higher confidence than Haiku's text inference.
    confidence: 'confirmed',
    atomicLinks: [],
  }));
}

/**
 * Look up each activity in Sanity and produce a deduped ThreadObservationLink[]
 * keyed by bare thread code. Sanity-gated by `status == "published"` — drafts
 * are ignored.
 */
export async function buildThreadLinksFromActivities(
  activityIds: string[],
): Promise<ThreadObservationLink[]> {
  if (activityIds.length === 0) return [];

  try {
    // Sanity-gated per src/lib/sanity/queries.ts header.
    const activities = await sanityServerClient.fetch<ActivityWithThreads[]>(
      `*[_type == "activity" && _id in $ids && status == "published"]{
        _id,
        capabilityThreads[]->{ _id },
        capabilityTargets[]{ tier, thread->{ _id } }
      }`,
      { ids: activityIds },
    );

    return buildThreadLinksFromActivityDocs(activities);
  } catch (err) {
    console.error('[thread-links] sanity fetch failed', err);
    return [];
  }
}
