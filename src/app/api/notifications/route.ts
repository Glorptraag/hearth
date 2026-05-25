import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { eq, and, lte } from 'drizzle-orm';
import { NOTIFICATION_STATES } from '@/types';

export const GET = routeHandler(async () => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  // Re-queue snoozed notifications whose snooze period has expired
  await db
    .update(notifications)
    .set({ state: 'visible', snoozedUntil: null })
    .where(
      and(
        eq(notifications.familyId, family.id),
        eq(notifications.state, 'snoozed'),
        lte(notifications.snoozedUntil, new Date())
      )
    );

  const result = await db.query.notifications.findMany({
    where: and(
      eq(notifications.familyId, family.id),
      eq(notifications.state, 'visible')
    ),
    orderBy: notifications.createdAt,
  });

  return NextResponse.json(result);
}, { route: 'GET /api/notifications' });

const updateNotificationSchema = z.object({
  ids: z.array(z.string().uuid()),
  state: z.enum(NOTIFICATION_STATES),
});

export const PATCH = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const result = await parseBody(request, updateNotificationSchema);
  if ('error' in result) return result.error;

  const updated = [];
  for (const id of result.data.ids) {
    const [row] = await db
      .update(notifications)
      .set({ state: result.data.state })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.familyId, family.id)
        )
      )
      .returning();

    if (row) updated.push(row);
  }

  return NextResponse.json(updated);
}, { route: 'PATCH /api/notifications' });
