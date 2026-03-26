import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq } from 'drizzle-orm';
import { NOTIFICATION_STATES } from '@/types';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  state: z.enum(NOTIFICATION_STATES),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { id } = await params;

  const existing = await db.query.notifications.findFirst({
    where: and(eq(notifications.id, id), eq(notifications.familyId, family.id)),
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db
    .update(notifications)
    .set({ state: parsed.data.state })
    .where(and(eq(notifications.id, id), eq(notifications.familyId, family.id)))
    .returning();

  return NextResponse.json(updated);
}
