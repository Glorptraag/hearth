import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiError, parseBody } from '@/lib/api-helpers';
import { suggestedObservations, hearthMemberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  requireSessionFacilitator,
  requireSessionAccess,
} from '@/lib/auth/hearth-helpers';

const submitObservationSchema = z.object({
  targetFamilyId: z.string().uuid(),
  targetLearnerId: z.string().uuid(),
  observationText: z.string().min(1).max(2000),
  evidenceIds: z.array(z.string().uuid()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id: hearthId, sessionId } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const result = await requireSessionFacilitator(userId, hearthId, sessionId);
  if ('error' in result) return result.error;
  const { family } = result;

  const bodyResult = await parseBody(request, submitObservationSchema);
  if ('error' in bodyResult) return bodyResult.error;
  const { data } = bodyResult;

  if (data.targetFamilyId === family.id) {
    return apiError('Cannot submit an observation about your own family', 400);
  }

  const targetMembership = await db.query.hearthMemberships.findFirst({
    where: and(
      eq(hearthMemberships.hearthId, hearthId),
      eq(hearthMemberships.familyId, data.targetFamilyId),
      eq(hearthMemberships.status, 'active')
    ),
  });

  if (!targetMembership) return apiError('Target family is not a member', 404);
  if (!targetMembership.consentCrossObservation) {
    return apiError('Target family has not consented to cross-family observations', 403);
  }

  const [observation] = await db
    .insert(suggestedObservations)
    .values({
      sessionId,
      observerFamilyId: family.id,
      observerUserId: userId,
      targetFamilyId: data.targetFamilyId,
      targetLearnerId: data.targetLearnerId,
      observationText: data.observationText,
      evidenceIds: data.evidenceIds ?? [],
      status: 'pending',
    })
    .returning();

  return NextResponse.json(observation, { status: 201 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id: hearthId, sessionId } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const result = await requireSessionAccess(userId, hearthId, sessionId);
  if ('error' in result) return result.error;
  const { family } = result;

  const observations = await db.query.suggestedObservations.findMany({
    where: and(
      eq(suggestedObservations.sessionId, sessionId),
      eq(suggestedObservations.targetFamilyId, family.id)
    ),
  });

  return NextResponse.json(observations);
}
