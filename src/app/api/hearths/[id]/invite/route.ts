import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-helpers';
import { hearthInvites } from '@/lib/db/schema';
import { requireHearthCoordinator } from '@/lib/auth/hearth-helpers';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const result = await requireHearthCoordinator(userId, id);
  if ('error' in result) return result.error;
  const { family } = result;

  const code = randomBytes(4).toString('hex');
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await db.insert(hearthInvites).values({
    hearthId: id,
    invitedByFamilyId: family.id,
    code,
    expiresAt,
  });

  return NextResponse.json(
    { code, expiresAt, joinUrl: '/hearths/join/' + code },
    { status: 201 }
  );
}
