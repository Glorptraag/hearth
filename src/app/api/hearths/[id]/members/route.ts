import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiError } from '@/lib/api-helpers';
import {
  requireHearthMember,
  sanitizeMembersForExposure,
} from '@/lib/auth/hearth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const { id: hearthId } = await params;

  const authResult = await requireHearthMember(userId, hearthId);
  if ('error' in authResult) return authResult.error;

  const members = await sanitizeMembersForExposure(hearthId);
  return NextResponse.json({ members });
}
