import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiError, routeHandler } from '@/lib/api-helpers';
import {
  requireHearthMember,
  sanitizeMembersForExposure,
} from '@/lib/auth/hearth-helpers';

export const GET = routeHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const { id: hearthId } = await params;

  const authResult = await requireHearthMember(userId, hearthId);
  if ('error' in authResult) return authResult.error;

  const members = await sanitizeMembersForExposure(hearthId);
  return NextResponse.json({ members });
}, { route: 'GET /api/hearths/[id]/members' });
