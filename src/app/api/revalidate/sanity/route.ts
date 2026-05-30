import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { routeHandler } from '@/lib/api-helpers';
import { SANITY_CONTENT_TAG } from '@/lib/sanity/server-fetch';

/**
 * Sanity publish → cache invalidation.
 *
 * Configure a Sanity webhook (Studio → API → Webhooks) to POST here on
 * create/update/delete/publish of content document types, with header
 * `Authorization: Bearer <SANITY_WEBHOOK_SECRET>` and a projection that
 * includes `_type` and `_id`. On any content change we drop the coarse
 * {@link SANITY_CONTENT_TAG}, so the next request to any server-fetched browse
 * surface re-reads from Sanity — a publish is visible within seconds, no deploy.
 *
 * Pedagogy PKB types have their own pgvector-rebuild webhook at
 * `/api/pedagogy/sanity-webhook`; they are ignored here so the two endpoints
 * don't double-handle.
 */

const PKB_TYPES = new Set([
  'pedagogicalFramework',
  'pedagogyObservationalMarker',
  'pedagogyPracticePattern',
]);

export const POST = routeHandler(async (request: NextRequest) => {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Server misconfiguration: missing auth secret' },
      { status: 500 }
    );
  }
  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();
  const docType = payload?._type as string | undefined;

  if (docType && PKB_TYPES.has(docType)) {
    return NextResponse.json({ ok: true, action: 'ignored', type: docType });
  }

  // { expire: 0 } = immediate expiration, the documented pattern for
  // third-party webhooks that need the next request to see fresh data.
  revalidateTag(SANITY_CONTENT_TAG, { expire: 0 });
  return NextResponse.json({ ok: true, action: 'revalidated', tag: SANITY_CONTENT_TAG, type: docType ?? null });
}, { route: 'POST /api/revalidate/sanity' });
