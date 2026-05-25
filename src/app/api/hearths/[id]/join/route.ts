import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiError, authenticatedFamily, parseBody, routeHandler } from '@/lib/api-helpers';
import { hearthInvites, hearthMemberships, hearths } from '@/lib/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';

const joinSchema = z.object({
  code: z.string(),
  consentCrossObservation: z.boolean(),
  consentEvidenceSharing: z.boolean(),
});

export const POST = routeHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const auth = await authenticatedFamily();
  if ('error' in auth) return auth.error;
  const { family } = auth;

  const bodyResult = await parseBody(request, joinSchema);
  if ('error' in bodyResult) return bodyResult.error;
  const { data } = bodyResult;

  const invite = await db.query.hearthInvites.findFirst({
    where: and(
      eq(hearthInvites.code, data.code),
      eq(hearthInvites.hearthId, id),
      isNull(hearthInvites.usedByFamilyId),
      gt(hearthInvites.expiresAt, new Date())
    ),
  });

  if (!invite) return apiError('Invalid or expired invite code', 400);

  const existingMembership = await db.query.hearthMemberships.findFirst({
    where: and(
      eq(hearthMemberships.hearthId, id),
      eq(hearthMemberships.familyId, family.id),
      eq(hearthMemberships.status, 'active')
    ),
  });

  if (existingMembership) return apiError('Already a member of this hearth', 400);

  await db.insert(hearthMemberships).values({
    hearthId: id,
    familyId: family.id,
    role: 'member',
    status: 'active',
    consentCrossObservation: data.consentCrossObservation,
    consentEvidenceSharing: data.consentEvidenceSharing,
    invitedByFamilyId: invite.invitedByFamilyId,
  });

  await db
    .update(hearthInvites)
    .set({ usedByFamilyId: family.id, usedAt: new Date() })
    .where(eq(hearthInvites.id, invite.id));

  const hearth = await db.query.hearths.findFirst({
    where: eq(hearths.id, id),
  });

  return NextResponse.json(
    { hearthId: id, hearthName: hearth?.name ?? null, role: 'member' },
    { status: 201 }
  );
}, { route: 'POST /api/hearths/[id]/join' });
