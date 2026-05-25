import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { and, eq } from 'drizzle-orm';
import { addHours } from 'date-fns';
import { NOTIFICATION_STATES } from '@/types';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  state: z.enum(NOTIFICATION_STATES),
  snoozeHours: z.number().min(1).max(72).optional(),
});

export const PATCH = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { id } = await params;

  const existing = await db.query.notifications.findFirst({
    where: and(eq(notifications.id, id), eq(notifications.familyId, family.id)),
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await parseBody(request, patchSchema);
  if ('error' in result) return result.error;

  const updates: Record<string, unknown> = { state: result.data.state };

  if (result.data.state === 'snoozed') {
    const hours = result.data.snoozeHours ?? 4;
    updates.snoozedUntil = addHours(new Date(), hours);
  }

  const [updated] = await db
    .update(notifications)
    .set(updates)
    .where(and(eq(notifications.id, id), eq(notifications.familyId, family.id)))
    .returning();

  return NextResponse.json(updated);
}, { route: 'PATCH /api/notifications/[id]' });
