import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { apiError, routeHandler } from '@/lib/api-helpers';
import { sessionEvidence } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getEvidenceSharingFamilyIds, requireSessionAccess } from '@/lib/auth/hearth-helpers';
import {
  HEARTH_EVIDENCE_TYPES,
  hearthEvidencePath,
  hearthEvidenceSrc,
  visibleHearthEvidence,
} from '@/lib/hearth-evidence';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export const POST = routeHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) => {
  const { id, sessionId } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const result = await requireSessionAccess(userId, id, sessionId);
  if ('error' in result) return result.error;
  const { family, membership } = result;

  // Uploading to a shared session is sharing; without consent we refuse
  // rather than store a photo no other family may see (src/lib/hearth-evidence.ts).
  if (!membership.consentEvidenceSharing) {
    return apiError('Your family hasn’t opted in to sharing session photos in this Hearth.', 403);
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return apiError('No file provided', 400);
  const ext = HEARTH_EVIDENCE_TYPES[file.type];
  if (!ext) return apiError('File type not allowed. Use JPEG, PNG, WebP, or HEIC.', 400);
  if (file.size > MAX_SIZE) return apiError('File too large. Maximum 5 MB.', 400);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('[hearth-evidence/upload] BLOB_READ_WRITE_TOKEN not set — session photo uploads disabled');
    return apiError('Photo uploads aren’t available right now. Please try again later.', 503);
  }

  const caption = formData.get('caption') as string | null;

  // Private only — no public fallback. These are children's photos shared
  // across families; if private storage fails the upload fails.
  const blob = await put(
    hearthEvidencePath({ hearthId: id, sessionId, familyId: family.id }, ext),
    file,
    { access: 'private', addRandomSuffix: true, contentType: file.type }
  );

  const [record] = await db
    .insert(sessionEvidence)
    .values({
      sessionId,
      uploadedByFamilyId: family.id,
      uploadedByUserId: userId,
      fileUrl: blob.pathname,
      fileType: file.type,
      caption,
    })
    .returning();

  return NextResponse.json(
    { ...record, fileUrl: hearthEvidenceSrc(id, record.fileUrl) },
    { status: 201 }
  );
}, { route: 'POST /api/hearths/[id]/sessions/[sessionId]/evidence' });

export const GET = routeHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) => {
  const { id, sessionId } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const result = await requireSessionAccess(userId, id, sessionId);
  if ('error' in result) return result.error;

  const [records, sharing] = await Promise.all([
    db.query.sessionEvidence.findMany({
      where: eq(sessionEvidence.sessionId, sessionId),
    }),
    getEvidenceSharingFamilyIds(id),
  ]);

  return NextResponse.json(visibleHearthEvidence(records, id, result.family.id, sharing));
}, { route: 'GET /api/hearths/[id]/sessions/[sessionId]/evidence' });
