import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';

export const PATCH = routeHandler(async () => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  await db
    .update(notifications)
    .set({ state: 'actioned' })
    .where(
      and(eq(notifications.familyId, family.id), eq(notifications.state, 'visible'))
    );

  return NextResponse.json({ success: true });
}, { route: 'PATCH /api/notifications/mark-all-read' });
