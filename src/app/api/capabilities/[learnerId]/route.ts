import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { capabilityObservations, learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';

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

  const observations = await db.query.capabilityObservations.findMany({
    where: eq(capabilityObservations.learnerId, learnerId),
    orderBy: capabilityObservations.observedAt,
  });

  const grouped: Record<string, typeof observations> = {};
  for (const obs of observations) {
    if (!grouped[obs.threadId]) grouped[obs.threadId] = [];
    grouped[obs.threadId].push(obs);
  }

  return NextResponse.json(grouped);
}
