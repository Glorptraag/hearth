import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiError, parseBody } from '@/lib/api-helpers';
import { hearthSessions } from '@/lib/db/schema';
import { eq, and, gte, ne, desc, asc } from 'drizzle-orm';
import { requireHearthMember, requireHearthCoordinator } from '@/lib/auth/hearth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const result = await requireHearthMember(userId, id);
  if ('error' in result) return result.error;

  const today = new Date().toISOString().split('T')[0];

  const upcoming = await db
    .select()
    .from(hearthSessions)
    .where(
      and(
        eq(hearthSessions.hearthId, id),
        eq(hearthSessions.status, 'upcoming'),
        gte(hearthSessions.date, today)
      )
    )
    .orderBy(asc(hearthSessions.date));

  const recent = await db
    .select()
    .from(hearthSessions)
    .where(
      and(
        eq(hearthSessions.hearthId, id),
        ne(hearthSessions.status, 'upcoming')
      )
    )
    .orderBy(desc(hearthSessions.date))
    .limit(10);

  return NextResponse.json({ upcoming, recent });
}

const createSessionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  date: z.string(),
  timeStart: z.string().optional(),
  timeEnd: z.string().optional(),
  location: z.string().optional(),
  facilitatorFamilyId: z.string().uuid().optional(),
  moduleReference: z.string().optional(),
  activityReference: z.string().optional(),
  prepNotes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const result = await requireHearthCoordinator(userId, id);
  if ('error' in result) return result.error;
  const { family } = result;

  const bodyResult = await parseBody(request, createSessionSchema);
  if ('error' in bodyResult) return bodyResult.error;
  const { data } = bodyResult;

  const [session] = await db
    .insert(hearthSessions)
    .values({
      hearthId: id,
      title: data.title,
      description: data.description,
      date: data.date,
      timeStart: data.timeStart,
      timeEnd: data.timeEnd,
      location: data.location,
      facilitatorFamilyId: data.facilitatorFamilyId ?? family.id,
      facilitatorUserId: userId,
      status: 'upcoming',
      moduleReference: data.moduleReference,
      activityReference: data.activityReference,
      prepNotes: data.prepNotes,
    })
    .returning();

  return NextResponse.json(session, { status: 201 });
}
