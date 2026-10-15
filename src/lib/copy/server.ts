import 'server-only';
import { sanityFetch } from '@/lib/sanity/server-fetch';
import { SITE_COPY_QUERY } from '@/lib/sanity/queries';
import { normaliseSiteCopyRows, resolveCopy, type CopyOverrides } from './resolve';
import type { CopyBundle, CopySurface } from './defaults';

/**
 * Server-side site copy.
 *
 * `fetchCopyOverrides()` reads every published `siteCopy` document through the
 * tagged Next data cache (same {@link SANITY_CONTENT_TAG} the browse content
 * uses, so the existing Sanity publish webhook → `/api/revalidate/sanity`
 * makes a copy edit live within seconds; the 300s time-based revalidate is the
 * self-heal fallback).
 *
 * It NEVER throws. Missing Sanity env, a network failure, a malformed document
 * — all collapse to `{}` and the page renders the code defaults. Copy is a
 * cosmetic layer; it must not be able to take a route down.
 */
export async function fetchCopyOverrides(): Promise<CopyOverrides> {
  try {
    const rows = await sanityFetch<unknown>(SITE_COPY_QUERY);
    return normaliseSiteCopyRows(rows);
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[site-copy] falling back to code defaults:', err instanceof Error ? err.message : err);
    }
    return {};
  }
}

/** Resolve the live bundle for one surface (RSC / route handler use). */
export async function getCopy<S extends CopySurface>(surface: S): Promise<CopyBundle<S>> {
  return resolveCopy(surface, await fetchCopyOverrides());
}
