import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { familyIntelligenceSnapshots } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';

export const GET = routeHandler(async () => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const snapshot = await db.query.familyIntelligenceSnapshots.findFirst({
    where: eq(familyIntelligenceSnapshots.familyId, family.id),
  });

  if (!snapshot) {
    return NextResponse.json({ snapshotData: {}, snapshotVersion: 0 });
  }

  return NextResponse.json(snapshot);
}, { route: 'GET /api/snapshot' });
