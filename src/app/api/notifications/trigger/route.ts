import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { plannerEntries, learningEntries } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { parseBody } from '@/lib/api-helpers';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';
import { rateLimit } from '@/lib/rate-limit';
import {
  triggerDraftResume,
  triggerPauseAck,
  triggerLogInvitation,
  triggerPrepReminder,
} from '@/lib/notifications/triggers';

const triggerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('draft_resume'),
    draftTitle: z.string().optional(),
  }),
  z.object({
    type: z.literal('pause_ack'),
    entryId: z.string().uuid().optional(),
    moduleId: z.string().optional(),
    moduleTitle: z.string().optional(),
    title: z.string().optional(),
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

  const rl = rateLimit(`notif-trigger:${userId}`, { limit: 20, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const result = await parseBody(request, triggerSchema);
  if ('error' in result) return result.error;

  const data = result.data;
  let created = false;

  switch (data.type) {
    case 'draft_resume': {
      created = await triggerDraftResume(family.id, { title: data.draftTitle });
      break;
    }
    case 'pause_ack': {
      if (data.entryId) {
        const entry = await db.query.learningEntries.findFirst({
          where: and(
            eq(learningEntries.id, data.entryId),
            eq(learningEntries.familyId, family.id)
          ),
        });
        if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        created = await triggerPauseAck(family.id, { entryId: entry.id, title: entry.title });
      } else {
        created = await triggerPauseAck(family.id, {
          moduleId: data.moduleId,
          moduleTitle: data.moduleTitle,
          title: data.title,
        });
      }
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
