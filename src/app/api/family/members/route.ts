import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { familyMembers } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { parseBody, routeHandler } from '@/lib/api-helpers';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['editor', 'viewer']).default('editor'),
});

const removeMemberSchema = z.object({
  memberId: z.string().min(1),
});

export const GET = routeHandler(async () => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const members = await db
    .select({
      id: familyMembers.id,
      email: familyMembers.email,
      role: familyMembers.role,
      status: familyMembers.status,
      joinedAt: familyMembers.joinedAt,
      invitedAt: familyMembers.invitedAt,
    })
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, family.id),
        // Exclude removed members
      )
    );

  const active = members.filter((m) => m.status !== 'removed');

  return NextResponse.json({
    members: active,
    ownerEmail: null, // Clerk manages the owner identity
  });
}, { route: 'GET /api/family/members' });

export const POST = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  // Only the family owner can invite
  if (family.clerkUserId !== userId) {
    return NextResponse.json({ error: 'Only the family owner can invite members' }, { status: 403 });
  }

  const result = await parseBody(request, inviteSchema);
  if ('error' in result) return result.error;
  const { email, role } = result.data;

  // Check if already invited or active
  const existing = await db.query.familyMembers.findFirst({
    where: and(
      eq(familyMembers.familyId, family.id),
      eq(familyMembers.email, email)
    ),
  });

  if (existing && existing.status !== 'removed') {
    return NextResponse.json(
      { error: 'This email has already been invited' },
      { status: 409 }
    );
  }

  const token = randomBytes(32).toString('hex');

  if (existing && existing.status === 'removed') {
    // Re-invite a previously removed member
    await db
      .update(familyMembers)
      .set({
        role,
        status: 'invited',
        inviteToken: token,
        invitedAt: new Date(),
        clerkUserId: null,
        joinedAt: null,
      })
      .where(eq(familyMembers.id, existing.id));

    return NextResponse.json({ invited: true, token });
  }

  await db.insert(familyMembers).values({
    familyId: family.id,
    email,
    role,
    status: 'invited',
    inviteToken: token,
  });

  return NextResponse.json({ invited: true, token });
}, { route: 'POST /api/family/members' });

export const DELETE = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  if (family.clerkUserId !== userId) {
    return NextResponse.json({ error: 'Only the family owner can remove members' }, { status: 403 });
  }

  const deleteResult = await parseBody(request, removeMemberSchema);
  if ('error' in deleteResult) return deleteResult.error;
  const { memberId } = deleteResult.data;

  await db
    .update(familyMembers)
    .set({ status: 'removed' })
    .where(
      and(eq(familyMembers.id, memberId), eq(familyMembers.familyId, family.id))
    );

  return NextResponse.json({ removed: true });
}, { route: 'DELETE /api/family/members' });
