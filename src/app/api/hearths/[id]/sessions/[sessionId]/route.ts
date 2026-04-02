import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiError, parseBody } from '@/lib/api-helpers';
import {
  hearthSessions,
  sessionAttendance,
  sessionEvidence,
  suggestedObservations,
  sessionReflections,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  requireHearthMember,
  requireHearthCoordinator,
} from '@/lib/auth/hearth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id, sessionId } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const result = await requireHearthMember(userId, id);
  if ('error' in result) return result.error;
  const { family } = result;

  const session = await db.query.hearthSessions.findFirst({
    where: and(eq(hearthSessions.id, sessionId), eq(hearthSessions.hearthId, id)),
  });
  if (!session) return apiError('Session not found', 404);

  const [evidence, attendance, reflections, observations] = await Promise.all([
    db
      .select()
      .from(sessionEvidence)
      .where(eq(sessionEvidence.sessionId, sessionId)),
    db
      .select()
      .from(sessionAttendance)
      .where(eq(sessionAttendance.sessionId, sessionId)),
    db
      .select()
      .from(sessionReflections)
      .where(eq(sessionReflections.sessionId, sessionId)),
    db
      .select()
      .from(suggestedObservations)
      .where(
        and(
          eq(suggestedObservations.sessionId, sessionId),
          eq(suggestedObservations.targetFamilyId, family.id)
        )
      ),
  ]);

  return NextResponse.json({ session, evidence, attendance, reflections, observations });
}

const patchSessionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  timeStart: z.string().optional(),
  timeEnd: z.string().optional(),
  location: z.string().optional(),
  prepNotes: z.string().optional(),
  sharedRecord: z.string().optional(),
  status: z.enum(['upcoming', 'completed', 'cancelled']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id, sessionId } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const memberResult = await requireHearthMember(userId, id);
  if ('error' in memberResult) return memberResult.error;
  const { family, membership } = memberResult;

  const bodyResult = await parseBody(request, patchSessionSchema);
  if ('error' in bodyResult) return bodyResult.error;
  const { data } = bodyResult;

  const session = await db.query.hearthSessions.findFirst({
    where: and(eq(hearthSessions.id, sessionId), eq(hearthSessions.hearthId, id)),
  });
  if (!session) return apiError('Session not found', 404);

  const isCoordinator = membership.role === 'coordinator';
  const isFacilitator = session.facilitatorFamilyId === family.id;
  const isCompletionUpdate = data.status === 'completed';

  if (isCompletionUpdate) {
    if (!isFacilitator && !isCoordinator) {
      return apiError('Only the session facilitator or a coordinator can mark a session complete', 403);
    }
  } else {
    if (!isCoordinator) {
      return apiError('Coordinator access required', 403);
    }
  }

  const updateValues: Record<string, unknown> = { ...data };
  if (data.status === 'completed') {
    updateValues.completedAt = new Date();
  }

  const [updated] = await db
    .update(hearthSessions)
    .set(updateValues)
    .where(and(eq(hearthSessions.id, sessionId), eq(hearthSessions.hearthId, id)))
    .returning();

  if (!updated) return apiError('Session not found', 404);

  return NextResponse.json(updated);
}
