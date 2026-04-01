import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { families } from '@/lib/db/schema';
import { getOrCreateFamily } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getOrCreateFamily(userId);

  await db
    .update(families)
    .set({ welcomeCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(families.id, family.id));

  return NextResponse.json({ success: true });
}
