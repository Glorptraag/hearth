import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { apiError, routeHandler } from '@/lib/api-helpers';
import { requireHearthMember } from '@/lib/auth/hearth-helpers';
import {
  hearths, hearthMemberships, hearthSessions, sessionEvidence,
  suggestedObservations, sessionReflections, families,
} from '@/lib/db/schema';
import { eq, and, desc, count, inArray } from 'drizzle-orm';

export const GET = routeHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: hearthId } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const result = await requireHearthMember(userId, hearthId);
  if ('error' in result) return result.error;

  // Load sessions first (needed for batch queries)
  const sessions = await db
    .select()
    .from(hearthSessions)
    .where(and(
      eq(hearthSessions.hearthId, hearthId),
      eq(hearthSessions.status, 'completed'),
    ))
    .orderBy(desc(hearthSessions.date));

  const sessionIds = sessions.map(s => s.id);

  // Load member count, observation count, hearth, and session-dependent data in parallel
  const [
    [memberCountRow],
    [observationCountRow],
    hearth,
    allEvidence,
    allReflections,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(hearthMemberships)
      .where(and(
        eq(hearthMemberships.hearthId, hearthId),
        eq(hearthMemberships.status, 'active'),
      )),
    sessionIds.length > 0
      ? db
          .select({ value: count() })
          .from(suggestedObservations)
          .where(inArray(suggestedObservations.sessionId, sessionIds))
      : Promise.resolve([{ value: 0 }]),
    db.query.hearths.findFirst({ where: eq(hearths.id, hearthId) }),
    sessionIds.length > 0
      ? db.select().from(sessionEvidence).where(inArray(sessionEvidence.sessionId, sessionIds))
      : Promise.resolve([]),
    sessionIds.length > 0
      ? db.select().from(sessionReflections).where(inArray(sessionReflections.sessionId, sessionIds))
      : Promise.resolve([]),
  ]);

  const memberCount = Number(memberCountRow?.value ?? 0);
  const observationCount = Number(observationCountRow?.value ?? 0);

  // Load family names for reflections
  const familyIds = [...new Set(allReflections.map(r => r.familyId))];
  const familyRecords = familyIds.length > 0
    ? await db.select({ id: families.id, familyName: families.familyName }).from(families).where(inArray(families.id, familyIds))
    : [];
  const familyMap = new Map(familyRecords.map(f => [f.id, f.familyName]));

  // Build stats
  const stats = {
    sessions: sessions.length,
    families: memberCount,
    sharedPhotos: allEvidence.length,
    crossFamilyObservations: observationCount,
  };

  // Build timeline
  const timeline = sessions.map(session => ({
    session: {
      id: session.id,
      title: session.title,
      date: session.date,
      description: session.description,
      photoCount: allEvidence.filter(e => e.sessionId === session.id).length,
    },
    reflections: allReflections
      .filter(r => r.sessionId === session.id)
      .map(r => ({
        familyName: familyMap.get(r.familyId) ?? 'Unknown',
        text: r.reflectionText,
        createdAt: r.createdAt,
      })),
  }));

  // Build gallery (recent evidence, limit 12)
  const gallery = allEvidence
    .sort((a, b) => (b.uploadedAt?.getTime() ?? 0) - (a.uploadedAt?.getTime() ?? 0))
    .slice(0, 12)
    .map(e => {
      const session = sessions.find(s => s.id === e.sessionId);
      return {
        id: e.id,
        fileUrl: e.fileUrl,
        fileType: e.fileType,
        caption: e.caption,
        sessionTitle: session?.title ?? '',
      };
    });

  // Extract cached narrative from hearth settings
  const settings = (hearth?.settings ?? {}) as { narrative?: { text: string; generatedAt: string } };
  const narrative = settings.narrative?.text ?? null;

  return NextResponse.json({ narrative, stats, timeline, gallery });
}, { route: 'GET /api/hearths/[id]/our-story' });
