import { NextRequest } from 'next/server';
import { get, type GetBlobResult } from '@vercel/blob';
import { authenticatedFamily, apiError, routeHandler } from '@/lib/api-helpers';
import { authorizeEvidenceRef } from '@/lib/evidence';

/**
 * Authenticated read proxy for evidence photos (children's photos).
 *
 * Evidence blobs are stored PRIVATE (see `POST /api/evidence/upload`). The
 * browser only ever holds a same-origin reference (`/api/evidence?ref=…`); the
 * real bytes are streamed through here, but only after:
 *   1. a Clerk session check (`authenticatedFamily`), and
 *   2. a family-ownership check — the owning family id is embedded in the blob
 *      pathname (`evidence/<familyId>/<file>`), so the path is the ACL.
 *
 * `Cache-Control: private` lets the parent's own browser cache the image while
 * keeping shared caches / CDNs from ever holding a child's photo.
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const result = await authenticatedFamily({ rateLimitKey: 'evidence-view', rateLimit: 240 });
  if ('error' in result) return result.error;
  const { family } = result;

  const ref = new URL(request.url).searchParams.get('ref');
  if (!ref) return apiError('Missing ref', 400);

  // Path-prefix authorisation. A 403 covers both "not yours" and "malformed"
  // so we never disclose which it was.
  const pathname = authorizeEvidenceRef(ref, family.id);
  if (!pathname) return apiError('Forbidden', 403);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Mirrors the upload route's graceful degradation when blob storage is
    // unconfigured for this environment.
    return apiError('Evidence storage is not available', 503);
  }

  // Prefer private access (current posture). Fall back to public for legacy
  // blobs or stores where private access isn't enabled. The blob URL is never
  // exposed to the client either way.
  let blob: GetBlobResult | null = null;
  try {
    blob = await get(pathname, { access: 'private' });
  } catch {
    blob = null;
  }
  if (!blob) {
    try {
      blob = await get(pathname, { access: 'public' });
    } catch {
      blob = null;
    }
  }
  if (!blob || blob.statusCode !== 200 || !blob.stream) return apiError('Not found', 404);

  return new Response(blob.stream, {
    headers: {
      'Content-Type': blob.blob.contentType,
      'Content-Length': String(blob.blob.size),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}, { route: 'GET /api/evidence' });
