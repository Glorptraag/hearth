import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { plannerEntries, learningEntries } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';
import {
  triggerPauseAck,
  triggerLogInvitation,
  triggerPrepReminder,
} from '@/lib/notifications/triggers';

const triggerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('pause_ack'),
    entryId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('log_invitation'),
    moduleTitle: z.string().optional(),
    reason: z.enum(['session_complete', 'end_of_day']),
  }),
  z.object({
    type: z.literal('prep_reminder'),
    plannerEntryId: z.string().uuid(),
  }),
]);

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const body = await request.json();
  const parsed = triggerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  let created = false;

  switch (data.type) {
    case 'pause_ack': {
      const entry = await db.query.learningEntries.findFirst({
        where: and(
          eq(learningEntries.id, data.entryId),
          eq(learningEntries.familyId, family.id)
        ),
      });
      if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      created = await triggerPauseAck(family.id, { id: entry.id, title: entry.title });
      break;
    }
    case 'log_invitation': {
      created = await triggerLogInvitation(family.id, {
        moduleTitle: data.moduleTitle,
        reason: data.reason,
      });
      break;
    }
    case 'prep_reminder': {
      const pe = await db.query.plannerEntries.findFirst({
        where: and(
          eq(plannerEntries.id, data.plannerEntryId),
          eq(plannerEntries.familyId, family.id)
        ),
      });
      if (!pe) return NextResponse.json({ error: 'Planner entry not found' }, { status: 404 });
      created = await triggerPrepReminder(family.id, {
        moduleTitle: pe.title ?? 'Planned activity',
        moduleId: pe.moduleId ?? '',
        session: pe.session ?? 'morning',
      });
      break;
    }
  }

  return NextResponse.json({ created });
}
