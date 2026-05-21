/**
 * In-memory cache of valid DLO IDs from Sanity. Used at enrich-time to reject
 * hallucinated dlo_ids before they hit `observation_dlo_links`. 10-min TTL — the
 * DLO catalog only changes when Drew seeds new content, so a small staleness
 * window is fine.
 *
 * Returns the FULL set + a tier lookup. ALL_DLOS_QUERY filters to published
 * status so drafts can't leak through enrichment.
 */
import { sanityClient } from '@/lib/sanity/client';

const DLO_IDS_QUERY = `*[_type == "discreteLearningObjective" && status == "published"]{ _id, tier }`;

type DloRow = { _id: string; tier: 'emerging' | 'developing' | 'demonstrating' };

const CACHE_TTL = 10 * 60 * 1000;
let cached: { ids: Set<string>; tierById: Map<string, DloRow['tier']> } | null = null;
let cachedAt = 0;

export async function getValidDlos(): Promise<{
  ids: Set<string>;
  tierById: Map<string, DloRow['tier']>;
}> {
  if (cached && Date.now() - cachedAt < CACHE_TTL) return cached;
  try {
    const rows = await sanityClient.fetch<DloRow[]>(DLO_IDS_QUERY);
    const ids = new Set<string>();
    const tierById = new Map<string, DloRow['tier']>();
    for (const r of rows) {
      ids.add(r._id);
      tierById.set(r._id, r.tier);
    }
    cached = { ids, tierById };
    cachedAt = Date.now();
    return cached;
  } catch (err) {
    console.warn('[dlo-cache] Sanity fetch failed; returning empty set:', err);
    return { ids: new Set(), tierById: new Map() };
  }
}

export function bustDloCache(): void {
  cached = null;
  cachedAt = 0;
}
