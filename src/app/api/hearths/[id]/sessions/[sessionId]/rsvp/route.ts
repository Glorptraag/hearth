import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiError, parseBody } from '@/lib/api-helpers';
import { sessionAttendance } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireSessionAccess } from '@/lib/auth/hearth-helpers';

const rsvpSchema = z.object({
  rsvpStatus: z.enum(['attending', 'declined']),
  learnerIds: z.array(z.string().uuid()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id, sessionId } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const result = await requireSessionAccess(userId, id, sessionId);
  if ('error' in result) return result.error;
  const { family } = result;

  const bodyResult = await parseBody(request, rsvpSchema);
  if ('error' in bodyResult) return bodyResult.error;
  const { rsvpStatus, learnerIds } = bodyResult.data;

  const existing = await db.query.sessionAttendance.findFirst({
    where: and(
      eq(sessionAttendance.sessionId, sessionId),
      eq(sessionAttendance.familyId, family.id)
    ),
  });

  let record;
  if (existing) {
    [record] = await db
      .update(sessionAttendance)
      .set({ rsvpStatus, learnerIds })
      .where(eq(sessionAttendance.id, existing.id))
      .returning();
  } else {
    [record] = await db
      .insert(sessionAttendance)
      .values({ sessionId, familyId: family.id, rsvpStatus, learnerIds })
      .returning();
  }

  return NextResponse.json(record);
}
