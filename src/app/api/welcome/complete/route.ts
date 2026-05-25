import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { families } from '@/lib/db/schema';
import { getOrCreateFamily } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';

export const POST = routeHandler(async () => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const familyName = user?.lastName?.trim()
    ? `${user.lastName.trim()} Family`
    : undefined;
  const family = await getOrCreateFamily(userId, familyName);

  await db
    .update(families)
    .set({ welcomeCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(families.id, family.id));

  return NextResponse.json({ success: true });
}, { route: 'POST /api/welcome/complete' });
