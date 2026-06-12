/**
 * In-memory cache of valid DLO IDs from Sanity. Used at enrich-time to reject
 * hallucinated dlo_ids before they hit `observation_dlo_links`. 10-min TTL — the
 * DLO catalog only changes when Drew seeds new content, so a small staleness
 * window is fine.
 *
 * Returns the FULL set + a tier lookup + descriptor text keyed by id.
 * Descriptors are injected into the USER prompt (WS-3) so Haiku can assess
 * observations against the actual descriptor text, not a reconstructed id pattern.
 *
 * ALL_DLOS_QUERY filters to published status so drafts can't leak through enrichment.
 */
import { sanityClient } from '@/lib/sanity/client';

const DLO_IDS_QUERY = `*[_type == "discreteLearningObjective" && status == "published"]{ _id, tier, descriptor }`;

type DloRow = { _id: string; tier: 'emerging' | 'developing' | 'demonstrating'; descriptor?: string };

const CACHE_TTL = 10 * 60 * 1000;
let cached: {
  ids: Set<string>;
  tierById: Map<string, DloRow['tier']>;
  descriptorById: Map<string, string>;
} | null = null;
let cachedAt = 0;

export async function getValidDlos(): Promise<{
  ids: Set<string>;
  tierById: Map<string, DloRow['tier']>;
  descriptorById: Map<string, string>;
}> {
  if (cached && Date.now() - cachedAt < CACHE_TTL) return cached;
  try {
    const rows = await sanityClient.fetch<DloRow[]>(DLO_IDS_QUERY);
    const ids = new Set<string>();
    const tierById = new Map<string, DloRow['tier']>();
    const descriptorById = new Map<string, string>();
    for (const r of rows) {
      ids.add(r._id);
      tierById.set(r._id, r.tier);
      if (r.descriptor) descriptorById.set(r._id, r.descriptor);
    }
    cached = { ids, tierById, descriptorById };
    cachedAt = Date.now();
    return cached;
  } catch (err) {
    console.warn('[dlo-cache] Sanity fetch failed; returning empty set:', err);
    return { ids: new Set(), tierById: new Map(), descriptorById: new Map() };
  }
}

export function bustDloCache(): void {
  cached = null;
  cachedAt = 0;
}

/**
 * Prime the in-memory cache directly, bypassing Sanity. For tests and the
 * WS-3 eval harness only — production never calls this. Lets the eval feed
 * descriptors from an in-repo fixture so it measures prompt-level effects
 * without depending on the Sanity DLO seed (still parked behind a human gate).
 */
export function primeDloCache(data: {
  ids: Set<string>;
  tierById: Map<string, DloRow['tier']>;
  descriptorById: Map<string, string>;
}): void {
  cached = data;
  cachedAt = Date.now();
}
