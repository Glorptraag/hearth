import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiError, authenticatedFamily } from '@/lib/api-helpers';
import {
  hearthSessions,
  sessionAttendance,
  learningEntries,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
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

  await db.insert(learningEntries).values({
    familyId: family.id,
    title: session.title,
    source: 'hearth_session',
    sourceSessionId: sessionId,
    status: 'draft',
    description: 'Scaffold dismissed',
    dateOccurred: session.date,
  });

  return NextResponse.json({ success: true });
}
