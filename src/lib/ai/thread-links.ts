/**
 * Declarative thread-link extraction from activity metadata.
 *
 * When an entry carries `sourceActivityIds`, each activity in Sanity may
 * have a `capabilityThreads[]` array. Those threads are *declarative* —
 * the content author asserted "this activity touches these threads" at
 * publish time. We mirror them into `learning_entries.thread_links` with
 * `confidence: 'confirmed'`, alongside Haiku's inferred threads in
 * `aiEnrichment.capability_threads` (which stay `suggested`).
 *
 * Downstream readers can later distinguish the two sources when ranking
 * capability evidence.
 *
 * Best-effort: any failure (Sanity hiccup, malformed metadata) logs and
 * returns []. Never throws — the entry insert must not fail because of
 * an enrichment auxiliary.
 *
 * See deepwork plan workstream E.
 */

import { sanityClient } from '@/lib/sanity/client';
import type {
  ThreadObservationLink,
  ObservationTier,
  StageBandKey,
} from '@/types/capability-universe';

// Activities don't yet declare their own tier/stageBand — defaults reflect
// "moderate engagement, mid-band" until we surface that authoring control.
// These values are read by snapshot consumers as starting estimates; the
// constellation visualiser blends them with Haiku's per-entry signals.
const DEFAULT_TIER: ObservationTier = 'developing';
const DEFAULT_STAGE_BAND: StageBandKey = 'intermediate';

interface ActivityWithThreads {
  _id: string;
  capabilityThreads?: Array<{ _id: string }>;
}

/**
 * Look up each activity in Sanity and produce a deduped ThreadObservationLink[]
 * keyed by thread _id. Sanity-gated by `status == "published"` — drafts
 * are ignored.
 */
export async function buildThreadLinksFromActivities(
  activityIds: string[],
): Promise<ThreadObservationLink[]> {
  if (activityIds.length === 0) return [];

  try {
    // Sanity-gated per src/lib/sanity/queries.ts header.
    const activities = await sanityClient.fetch<ActivityWithThreads[]>(
      `*[_type == "activity" && _id in $ids && status == "published"]{
        _id,
        capabilityThreads[]->{ _id }
      }`,
      { ids: activityIds },
    );

    const seenThreads = new Set<string>();
    const links: ThreadObservationLink[] = [];

    for (const activity of activities ?? []) {
      for (const thread of activity.capabilityThreads ?? []) {
        if (!thread?._id || seenThreads.has(thread._id)) continue;
        seenThreads.add(thread._id);
        links.push({
          threadId: thread._id,
          stageBand: DEFAULT_STAGE_BAND,
          tierAtTime: DEFAULT_TIER,
          // Declarative: author asserted at publish time that this activity
          // touches this thread. Higher confidence than Haiku's text inference.
          confidence: 'confirmed',
          atomicLinks: [],
        });
      }
    }

    return links;
  } catch (err) {
    console.error('[thread-links] sanity fetch failed', err);
    return [];
  }
}
