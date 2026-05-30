import 'server-only';
import { createClient, type SanityClient } from 'next-sanity';
import { ConfigError } from '@/lib/db';

/**
 * Server-only tagged Sanity reads.
 *
 * Browse content (packs, modules, activities, projects) is fetched here through
 * the Next.js data cache and tagged with {@link SANITY_CONTENT_TAG}. A Sanity
 * publish hits `POST /api/revalidate/sanity`, which expires that tag — the next
 * request re-reads from Sanity, so a publish is visible within seconds with no
 * deploy. `useCdn: false` means a cache miss reads the content lake directly
 * (never a stale CDN snapshot), so correctness never depends on Sanity's CDN
 * TTL; the Next cache absorbs latency between publishes.
 *
 * The {@link CONTENT_REVALIDATE_SECONDS} time-based fallback is deliberate: if
 * the Sanity webhook is ever unconfigured or fails, content still self-heals
 * within that window rather than freezing at first render. The webhook makes it
 * near-instant; this bounds the worst case.
 *
 * This is the server counterpart to the browser `sanityClient` in `./client`.
 * Use it from React Server Components / route handlers only — never from a
 * `'use client'` module (the import of `server-only` will hard-error there).
 */

export const SANITY_CONTENT_TAG = 'sanity:content';

// Self-heal window if the publish webhook is unconfigured or fails.
export const CONTENT_REVALIDATE_SECONDS = 300;

let _serverClient: SanityClient | null = null;

function getServerClient(): SanityClient {
  if (_serverClient) return _serverClient;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) {
    throw new ConfigError(
      'NEXT_PUBLIC_SANITY_PROJECT_ID is not set — the Sanity server client cannot connect. Check Vercel env vars / .env.local.'
    );
  }
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!dataset) {
    throw new ConfigError(
      'NEXT_PUBLIC_SANITY_DATASET is not set — the Sanity server client cannot connect. Check Vercel env vars / .env.local.'
    );
  }
  _serverClient = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: false,
  });
  return _serverClient;
}

export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  tags: string[] = [SANITY_CONTENT_TAG]
): Promise<T> {
  return getServerClient().fetch<T>(query, params, {
    next: { tags, revalidate: CONTENT_REVALIDATE_SECONDS },
  });
}
