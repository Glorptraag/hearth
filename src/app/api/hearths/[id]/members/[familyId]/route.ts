import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { apiError, routeHandler } from '@/lib/api-helpers';
import { requireHearthCoordinator } from '@/lib/auth/hearth-helpers';
import { hearthMemberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const DELETE = routeHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; familyId: string }> }
) => {
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const { id: hearthId, familyId } = await params;

  const authResult = await requireHearthCoordinator(userId, hearthId);
  if ('error' in authResult) return authResult.error;
  const { family } = authResult;

  if (familyId === family.id) {
    return apiError('Cannot remove yourself. Use the leave endpoint instead.', 400);
  }

  const target = await db.query.hearthMemberships.findFirst({
    where: and(
      eq(hearthMemberships.hearthId, hearthId),
      eq(hearthMemberships.familyId, familyId),
      eq(hearthMemberships.status, 'active')
    ),
  });

  if (!target) {
    return apiError('Member not found', 404);
  }

  await db
    .update(hearthMemberships)
    .set({ status: 'removed', leftAt: new Date() })
    .where(eq(hearthMemberships.id, target.id));

  return NextResponse.json({ success: true });
}, { route: 'DELETE /api/hearths/[id]/members/[familyId]' });
