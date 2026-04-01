import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, lte } from 'drizzle-orm';
import { NOTIFICATION_STATES } from '@/types';

export async function GET() {
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
}

const updateNotificationSchema = z.object({
  ids: z.array(z.string().uuid()),
  state: z.enum(NOTIFICATION_STATES),
});

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const body = await request.json();
  const parsed = updateNotificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = [];
  for (const id of parsed.data.ids) {
    const [result] = await db
      .update(notifications)
      .set({ state: parsed.data.state })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.familyId, family.id)
        )
      )
      .returning();

    if (result) updated.push(result);
  }

  return NextResponse.json(updated);
}
