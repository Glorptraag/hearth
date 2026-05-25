import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { learners, familyIntelligenceSnapshots } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import type { SnapshotActiveThread, SnapshotData, DloStatusEntry } from '@/types/snapshot';
import { routeHandler } from '@/lib/api-helpers';

type Params = { params: Promise<{ learnerId: string }> };

export const GET = routeHandler(async (request: NextRequest, { params }: Params) => {
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

  if (!snapshot) return NextResponse.json({ activeThreads: [], dloStatus: {} });

  const data = snapshot.snapshotData as SnapshotData;
  const child = data?.children?.[learnerId];
  const activeThreads: SnapshotActiveThread[] = child?.active_threads ?? [];
  const dloStatus: Record<string, DloStatusEntry> = child?.dlo_status ?? {};

  return NextResponse.json({ activeThreads, dloStatus });
}, { route: 'GET /api/capabilities/[learnerId]' });
