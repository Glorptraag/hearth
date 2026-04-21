import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { learners, familyIntelligenceSnapshots } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import type { SnapshotActiveThread, SnapshotData } from '@/types/snapshot';

type Params = { params: Promise<{ learnerId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { learnerId } = await params;

  const learner = await db.query.learners.findFirst({
    where: and(
      eq(learners.id, learnerId),
      eq(learners.familyId, family.id)
    ),
  });

  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  const snapshot = await db.query.familyIntelligenceSnapshots.findFirst({
    where: eq(familyIntelligenceSnapshots.familyId, family.id),
  });

  if (!snapshot) return NextResponse.json([]);

  const data = snapshot.snapshotData as SnapshotData;
  const activeThreads: SnapshotActiveThread[] = data?.children?.[learnerId]?.active_threads ?? [];

  return NextResponse.json(activeThreads);
}
