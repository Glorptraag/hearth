import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { familyMembers, families } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { parseBody, routeHandler } from '@/lib/api-helpers';

const acceptSchema = z.object({
  token: z.string().min(1),
});

export const POST = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await parseBody(request, acceptSchema);
  if ('error' in result) return result.error;
  const { token } = result.data;

  const invite = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.inviteToken, token),
  });

  if (!invite || invite.status !== 'invited') {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
  }

  // Check the accepting user doesn't already own this family
  const family = await db.query.families.findFirst({
    where: eq(families.id, invite.familyId),
  });
  if (family?.clerkUserId === userId) {
    return NextResponse.json({ error: 'You already own this family' }, { status: 409 });
  }

  await db
    .update(familyMembers)
    .set({
      clerkUserId: userId,
      status: 'active',
      inviteToken: null,
      joinedAt: new Date(),
    })
    .where(eq(familyMembers.id, invite.id));

  return NextResponse.json({
    accepted: true,
    familyId: invite.familyId,
    familyName: family?.familyName ?? 'Family',
  });
}, { route: 'POST /api/family/invite' });
