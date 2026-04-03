import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticatedFamily } from '@/lib/api-helpers';
import {
  hearthSessions,
  sessionAttendance,
  suggestedObservations,
  learningEntries,
  hearths,
} from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function GET() {
  const result = await authenticatedFamily();
  if ('error' in result) return result.error;
  const { family } = result;

  const attendedSessions = await db
    .select({
      sessionId: sessionAttendance.sessionId,
      learnerIds: sessionAttendance.learnerIds,
    })
    .from(sessionAttendance)
    .where(eq(sessionAttendance.familyId, family.id));

  if (attendedSessions.length === 0) return NextResponse.json({ scaffolds: [] });

  const sessionIds = attendedSessions.map((a) => a.sessionId);

  const completedSessions = await db
    .select()
    .from(hearthSessions)
    .where(
      and(
        eq(hearthSessions.status, 'completed'),
        inArray(hearthSessions.id, sessionIds)
      )
    );

  if (completedSessions.length === 0) return NextResponse.json({ scaffolds: [] });

  const existingEntries = await db
    .select({ sourceSessionId: learningEntries.sourceSessionId })
    .from(learningEntries)
    .where(
      and(
        eq(learningEntries.familyId, family.id),
        eq(learningEntries.source, 'hearth_session')
      )
    );

  const loggedSessionIds = new Set(
    existingEntries.map((e) => e.sourceSessionId).filter(Boolean)
  );

  const pending = completedSessions.filter(
    (s) => sessionIds.includes(s.id) && !loggedSessionIds.has(s.id)
  );

  if (pending.length === 0) return NextResponse.json({ scaffolds: [] });

  const pendingHearthIds = [...new Set(pending.map((s) => s.hearthId))];
  const hearthRecords = await db
    .select({ id: hearths.id, name: hearths.name })
    .from(hearths)
    .where(inArray(hearths.id, pendingHearthIds));

  const hearthNameMap = new Map(hearthRecords.map((h) => [h.id, h.name]));

  const pendingSessionIds = pending.map((s) => s.id);
  const observations = await db
    .select({
      sessionId: suggestedObservations.sessionId,
    })
    .from(suggestedObservations)
    .where(
      and(
        inArray(suggestedObservations.sessionId, pendingSessionIds),
        eq(suggestedObservations.targetFamilyId, family.id),
        eq(suggestedObservations.status, 'pending')
      )
    );

  const observationCountMap = new Map<string, number>();
  for (const obs of observations) {
    observationCountMap.set(obs.sessionId, (observationCountMap.get(obs.sessionId) ?? 0) + 1);
  }

  const scaffolds = pending.map((s) => ({
    sessionId: s.id,
    title: s.title,
    date: s.date,
    hearthId: s.hearthId,
    hearthName: hearthNameMap.get(s.hearthId) ?? null,
    observationCount: observationCountMap.get(s.id) ?? 0,
    sharedRecord: s.sharedRecord ? s.sharedRecord.slice(0, 100) : null,
  }));

  return NextResponse.json({ scaffolds });
}
