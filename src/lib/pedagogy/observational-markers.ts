import { sanityClient } from '@/lib/sanity/client';
import {
  FRAMEWORK_BY_PEDAGOGY_KEY_QUERY,
  OBSERVATIONAL_MARKERS_QUERY,
} from '@/lib/sanity/queries';

export interface ObservationalMarker {
  _id: string;
  markerName: string;
  whatItIndicates: string;
  markersToLookFor: string[];
  tags: string[];
}

// Thread prefix → domain tags used to filter markers
const THREAD_PREFIX_DOMAINS: Record<string, string[]> = {
  EF: ['executive_function', 'attention', 'self_regulation'],
  PS: ['self_regulation', 'moral_reasoning'],
  L: ['oral_language', 'comprehension', 'reading'],
  M: ['number', 'operations'],
  S: ['scientific_observation', 'biology'],
  C: ['drawing'],
  P: ['fine_motor', 'gross_motor'],
};

// Multi-char prefixes must be checked before single-char ones
const PREFIX_CHECK_ORDER = ['EF', 'PS', 'L', 'M', 'S', 'C', 'P'];

function getDomainsForThread(threadId: string): string[] | null {
  for (const prefix of PREFIX_CHECK_ORDER) {
    if (threadId.startsWith(prefix) && threadId.slice(prefix.length).match(/^\d+$/)) {
      return THREAD_PREFIX_DOMAINS[prefix];
    }
  }
  return null;
}

const cache = new Map<string, ObservationalMarker[]>();

export async function getMarkersForThread(
  pedagogyKey: string,
  threadId: string,
): Promise<ObservationalMarker[]> {
  const domains = getDomainsForThread(threadId);
  if (!domains) return [];

  const cacheKey = `${pedagogyKey}:${threadId}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const framework = await sanityClient.fetch<{ _id: string; slug: string } | null>(
    FRAMEWORK_BY_PEDAGOGY_KEY_QUERY,
    { pedagogyKey },
  );

  if (!framework) {
    cache.set(cacheKey, []);
    return [];
  }

  const markers = await sanityClient.fetch<ObservationalMarker[]>(
    OBSERVATIONAL_MARKERS_QUERY,
    { frameworkId: framework._id },
  );

  const filtered = markers.filter(
    (m) => Array.isArray(m.tags) && m.tags.some((tag) => domains.includes(tag)),
  );

  cache.set(cacheKey, filtered);
  return filtered;
}
