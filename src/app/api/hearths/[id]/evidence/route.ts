import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { get, type GetBlobResult } from '@vercel/blob';
import { apiError, routeHandler } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { canViewHearthEvidencePath, requireHearthMember } from '@/lib/auth/hearth-helpers';
import { parseHearthEvidenceRef } from '@/lib/hearth-evidence';

/**
 * Authenticated read proxy for Hearth session photos.
 *
 * Session photos are PRIVATE blobs under `hearth-evidence/<hearthId>/…` (see
 * `POST /api/hearths/[id]/sessions/[sessionId]/evidence`). Bytes stream only
 * after:
 *   1. the ref parses as a hearth-evidence pathname for THIS hearth,
 *   2. the caller's family is an active member of the hearth, and
 *   3. the photo exists on one of the hearth's sessions and its uploader is the
 *      caller or a family that consents to evidence sharing.
 * A hidden photo is a 404, so non-consenting families' uploads are not
 * disclosed. No public fallback: the bytes never leave private storage.
 */
export const GET = routeHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: hearthId } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const rl = rateLimit(`hearth-evidence-view:${userId}`, { limit: 240, windowMs: 60_000 });
  if (!rl.success) return apiError('Too many requests', 429);

  const ref = new URL(request.url).searchParams.get('ref');
  if (!ref) return apiError('Missing ref', 400);

  const parsed = parseHearthEvidenceRef(ref);
  if (!parsed || parsed.hearthId !== hearthId) return apiError('Forbidden', 403);

  const member = await requireHearthMember(userId, hearthId);
  if ('error' in member) return member.error;

  if (!(await canViewHearthEvidencePath(hearthId, parsed.pathname, member.family.id))) {
    return apiError('Not found', 404);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return apiError('Evidence storage is not available', 503);
  }

  let blob: GetBlobResult | null = null;
  try {
    blob = await get(parsed.pathname, { access: 'private' });
  } catch {
    blob = null;
  }
  if (!blob || blob.statusCode !== 200 || !blob.stream) return apiError('Not found', 404);

  return new Response(blob.stream, {
    headers: {
      'Content-Type': blob.blob.contentType,
      'Content-Length': String(blob.blob.size),
      // Short private cache: a family that leaves or withdraws consent stops
      // seeing photos within minutes, and shared caches never hold them.
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': 'sandbox',
    },
  });
}, { route: 'GET /api/hearths/[id]/evidence' });
