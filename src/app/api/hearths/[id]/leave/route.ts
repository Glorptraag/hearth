import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { apiError, routeHandler } from '@/lib/api-helpers';
import { requireHearthMember } from '@/lib/auth/hearth-helpers';
import { hearthMemberships } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';

export const POST = routeHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const { id: hearthId } = await params;

  const authResult = await requireHearthMember(userId, hearthId);
  if ('error' in authResult) return authResult.error;
  const { family, membership } = authResult;

  if (membership.role === 'coordinator') {
    const [{ value }] = await db
      .select({ value: count() })
      .from(hearthMemberships)
      .where(
        and(
          eq(hearthMemberships.hearthId, hearthId),
          eq(hearthMemberships.role, 'coordinator'),
          eq(hearthMemberships.status, 'active')
        )
      );

    if (value === 1) {
      return apiError(
        'Cannot leave — you are the only coordinator. Promote another member first.',
        400
      );
    }
  }

  await db
    .update(hearthMemberships)
    .set({ status: 'left', leftAt: new Date() })
    .where(
      and(
        eq(hearthMemberships.hearthId, hearthId),
        eq(hearthMemberships.familyId, family.id)
      )
    );

  return NextResponse.json({ success: true });
}, { route: 'POST /api/hearths/[id]/leave' });
