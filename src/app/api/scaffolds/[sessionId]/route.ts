import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiError, authenticatedFamily } from '@/lib/api-helpers';
import {
  hearthSessions,
  sessionAttendance,
  sessionEvidence,
  suggestedObservations,
  hearths,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const result = await authenticatedFamily();
  if ('error' in result) return result.error;
  const { family } = result;

  const [session] = await db
    .select()
    .from(hearthSessions)
    .where(eq(hearthSessions.id, sessionId));

  if (!session) return apiError('Session not found', 404);
  if (session.status !== 'completed') return apiError('Session is not completed', 400);

  const [attendance] = await db
    .select()
    .from(sessionAttendance)
    .where(
      and(
        eq(sessionAttendance.sessionId, sessionId),
        eq(sessionAttendance.familyId, family.id)
      )
    );

  if (!attendance) return apiError('Forbidden', 403);

  const [evidenceRows, observationRows, hearthRecord] = await Promise.all([
    db
      .select({
        id: sessionEvidence.id,
        fileUrl: sessionEvidence.fileUrl,
        fileType: sessionEvidence.fileType,
        caption: sessionEvidence.caption,
      })
      .from(sessionEvidence)
      .where(eq(sessionEvidence.sessionId, sessionId)),

    db
      .select({
        id: suggestedObservations.id,
        observationText: suggestedObservations.observationText,
        targetLearnerId: suggestedObservations.targetLearnerId,
        evidenceIds: suggestedObservations.evidenceIds,
      })
      .from(suggestedObservations)
      .where(
        and(
          eq(suggestedObservations.sessionId, sessionId),
          eq(suggestedObservations.targetFamilyId, family.id),
          eq(suggestedObservations.status, 'pending')
        )
      ),

    db
      .select({ id: hearths.id, name: hearths.name })
      .from(hearths)
      .where(eq(hearths.id, session.hearthId))
      .then((rows) => rows[0] ?? null),
  ]);

  return NextResponse.json({
    session: {
      id: session.id,
      title: session.title,
      description: session.description,
      date: session.date,
      location: session.location,
      sharedRecord: session.sharedRecord,
      hearthId: session.hearthId,
      hearthName: hearthRecord?.name ?? null,
    },
    evidence: evidenceRows,
    observations: observationRows,
    attendingLearnerIds: attendance.learnerIds ?? [],
  });
}
