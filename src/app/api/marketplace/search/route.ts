import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { routeHandler } from '@/lib/api-helpers';
import { sanityClient } from '@/lib/sanity/client';

/**
 * GET /api/marketplace/search?q=...
 *
 * Full-text search across published packs + standalone modules.
 * Backed by Sanity GROQ's match operator on title / subjects / pack
 * description (good enough for the pilot's ~50 packs and ~100 modules;
 * Postgres FTS is overkill at this scale and adds a sync surface).
 *
 * Task 6.2.
 */

export interface MarketplaceSearchHit {
  kind: 'pack' | 'module';
  id: string;
  title: string;
  subjects: string[];
  description: string | null;
  /** Pack-only — pack-level availability. Modules inherit pack's. */
  availability?: string | null;
}

export interface MarketplaceSearchResponse {
  query: string;
  hits: MarketplaceSearchHit[];
}

const MAX_RESULTS = 30;

function tokensFromQuery(q: string): string[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9-]/g, ''))
    .filter((t) => t.length >= 2)
    .slice(0, 6);
}

export const GET = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const q = (request.nextUrl.searchParams.get('q') ?? '').trim();
  if (!q) {
    return NextResponse.json<MarketplaceSearchResponse>({ query: q, hits: [] });
  }

  const tokens = tokensFromQuery(q);
  if (tokens.length === 0) {
    return NextResponse.json<MarketplaceSearchResponse>({ query: q, hits: [] });
  }

  // Build a `match` clause per token (Sanity's text search semantics).
  // OR across token matches so single typos / partial matches still hit.
  // Wildcard suffix ('*') makes prefix matches work.
  const pattern = tokens.map((t) => `${t}*`).join(' ');

  const [packs, modules] = await Promise.all([
    sanityClient
      .fetch<
        Array<{
          _id: string;
          title: string;
          subjects: string[];
          description: string | null;
          availability: string | null;
        }>
      >(
        `*[_type == "pack" && status == "published" && (
          title match $pattern ||
          description match $pattern ||
          $pattern in subjects[]
        )][0...$limit]{
          _id, title, subjects, description, availability
        }`,
        { pattern, limit: MAX_RESULTS },
      )
      .catch(() => []),
    sanityClient
      .fetch<
        Array<{
          _id: string;
          title: string;
          subjects: string[];
          targetUnderstanding: string | null;
          availability: string | null;
        }>
      >(
        `*[_type == "module" && status == "published" && (
          title match $pattern ||
          targetUnderstanding match $pattern ||
          $pattern in subjects[]
        )][0...$limit]{
          _id, title, subjects, targetUnderstanding, availability
        }`,
        { pattern, limit: MAX_RESULTS },
      )
      .catch(() => []),
  ]);

  const hits: MarketplaceSearchHit[] = [
    ...packs.map((p) => ({
      kind: 'pack' as const,
      id: p._id,
      title: p.title,
      subjects: p.subjects ?? [],
      description: p.description ?? null,
      availability: p.availability ?? null,
    })),
    ...modules.map((m) => ({
      kind: 'module' as const,
      id: m._id,
      title: m.title,
      subjects: m.subjects ?? [],
      description: m.targetUnderstanding ?? null,
      availability: m.availability ?? null,
    })),
  ];

  return NextResponse.json<MarketplaceSearchResponse>({
    query: q,
    hits: hits.slice(0, MAX_RESULTS),
  });
}, { route: 'GET /api/marketplace/search' });
