import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { apiError, routeHandler } from '@/lib/api-helpers';
import { sessionEvidence } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireSessionAccess } from '@/lib/auth/hearth-helpers';

export const POST = routeHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) => {
  const { id, sessionId } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const result = await requireSessionAccess(userId, id, sessionId);
  if ('error' in result) return result.error;
  const { family } = result;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return apiError('No file provided', 400);
  if (!file.type.startsWith('image/')) return apiError('Only image files are supported', 400);

  const caption = formData.get('caption') as string | null;

  const blob = await put(
    'hearth-evidence/' + sessionId + '/' + Date.now() + '-' + file.name,
    file,
    { access: 'public' }
  );

  const [record] = await db
    .insert(sessionEvidence)
    .values({
      sessionId,
      uploadedByFamilyId: family.id,
      uploadedByUserId: userId,
      fileUrl: blob.url,
      fileType: file.type,
      caption,
    })
    .returning();

  return NextResponse.json(record, { status: 201 });
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

  const records = await db.query.sessionEvidence.findMany({
    where: eq(sessionEvidence.sessionId, sessionId),
  });

  return NextResponse.json(records);
}, { route: 'GET /api/hearths/[id]/sessions/[sessionId]/evidence' });
