import { sanityServerClient } from '@/lib/sanity/client';
import type { ShelfResource } from './types';

const CACHE_TTL_MS = 60_000;

const SHELF_RESOURCES_QUERY = `*[_type == "shelfResource" && status == "published" && !(_id in path("drafts.**"))] | order(title asc) {
  _id,
  title,
  publisher,
  slug,
  kind,
  aliases,
  lessonNumberRegex,
  levels[]{ name, aliases },
  ageBand,
  isUniversal,
  status
}`;

let cache: { at: number; resources: ShelfResource[] } | null = null;
let inflight: Promise<ShelfResource[]> | null = null;

export function clearShelfResourceCache(): void {
  cache = null;
  inflight = null;
}

export async function getShelfResources(): Promise<ShelfResource[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.resources;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const resources = (await sanityServerClient.fetch<ShelfResource[]>(SHELF_RESOURCES_QUERY)) ?? [];
      cache = { at: Date.now(), resources };
      return resources;
    } catch (error) {
      if (cache) return cache.resources;
      throw error;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
