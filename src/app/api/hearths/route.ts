import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hearths, hearthMemberships, hearthSessions, sessionAttendance, learningEntries } from '@/lib/db/schema';
import { apiError, parseBody, authenticatedFamily } from '@/lib/api-helpers';
import { eq, and, gte, asc, count, inArray } from 'drizzle-orm';

export async function GET() {
  const result = await authenticatedFamily({ rateLimitKey: 'hearths' });
  if ('error' in result) return result.error;
  const { family } = result;

  const memberships = await db
    .select()
    .from(hearthMemberships)
    .where(
      and(
        eq(hearthMemberships.familyId, family.id),
        eq(hearthMemberships.status, 'active')
      )
    );

  const hearthList = await Promise.all(
    memberships.map(async (membership) => {
      const hearth = await db.query.hearths.findFirst({
        where: eq(hearths.id, membership.hearthId),
      });

      if (!hearth) return null;

      const [memberCountRow] = await db
        .select({ count: count() })
        .from(hearthMemberships)
        .where(
          and(
            eq(hearthMemberships.hearthId, hearth.id),
            eq(hearthMemberships.status, 'active')
          )
        );

      const today = new Date().toISOString().slice(0, 10);
      const nextSession = await db.query.hearthSessions.findFirst({
        where: and(
          eq(hearthSessions.hearthId, hearth.id),
          eq(hearthSessions.status, 'upcoming'),
          gte(hearthSessions.date, today)
        ),
        orderBy: [asc(hearthSessions.date)],
      });

      const completedSessions = await db
        .select({ id: hearthSessions.id })
        .from(hearthSessions)
        .where(and(
          eq(hearthSessions.hearthId, hearth.id),
          eq(hearthSessions.status, 'completed')
        ));
      const completedIds = completedSessions.map(s => s.id);

      let pendingScaffoldCount = 0;
      if (completedIds.length > 0) {
        const attended = await db
          .select({ sessionId: sessionAttendance.sessionId })
          .from(sessionAttendance)
          .where(and(
            eq(sessionAttendance.familyId, family.id),
            inArray(sessionAttendance.sessionId, completedIds)
          ));
        const attendedIds = attended.map(a => a.sessionId);

        if (attendedIds.length > 0) {
          const logged = await db
            .select({ sourceSessionId: learningEntries.sourceSessionId })
            .from(learningEntries)
            .where(and(
              eq(learningEntries.familyId, family.id),
              eq(learningEntries.source, 'hearth_session'),
              inArray(learningEntries.sourceSessionId, attendedIds)
            ));
          const loggedIds = new Set(logged.map(l => l.sourceSessionId).filter(Boolean));

          pendingScaffoldCount = attendedIds.filter(id => !loggedIds.has(id)).length;
        }
      }

      return {
        ...hearth,
        role: membership.role,
        memberCount: memberCountRow?.count ?? 0,
        nextSession: nextSession
          ? { id: nextSession.id, title: nextSession.title, date: nextSession.date }
          : null,
        pendingScaffoldCount,
      };
    })
  );

  return NextResponse.json({ hearths: hearthList.filter(Boolean) });
}

const createHearthSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  location: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const result = await authenticatedFamily({ rateLimitKey: 'hearths:create', rateLimit: 5 });
  if ('error' in result) return result.error;
  const { family } = result;

  const bodyResult = await parseBody(request, createHearthSchema);
  if ('error' in bodyResult) return bodyResult.error;
  const { data } = bodyResult;

  const [hearth] = await db
    .insert(hearths)
    .values({
      name: data.name,
      description: data.description,
      location: data.location,
      createdByFamilyId: family.id,
      status: 'active',
    })
    .returning();

  await db.insert(hearthMemberships).values({
    hearthId: hearth.id,
    familyId: family.id,
    role: 'coordinator',
    status: 'active',
    consentCrossObservation: true,
    consentEvidenceSharing: true,
  });

  return NextResponse.json(hearth, { status: 201 });
}
