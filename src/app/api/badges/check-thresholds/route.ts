import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  badgeDefinitions,
  badgeAwards,
  familyIntelligenceSnapshots,
  learners,
} from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, or, isNull } from 'drizzle-orm';

const checkSchema = z.object({
  learnerId: z.string().uuid(),
});

type ActiveThread = {
  thread_id: string;
  observation_count: number;
  suggested_tier: string;
  last_evidence_date: string;
};

type SnapshotData = {
  children?: Record<string, { active_threads?: ActiveThread[] }>;
};

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const body = await request.json();
  const parsed = checkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { learnerId } = parsed.data;

  const learner = await db.query.learners.findFirst({
    where: and(
      eq(learners.id, learnerId),
      eq(learners.familyId, family.id)
    ),
  });

  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  const badges = await db.query.badgeDefinitions.findMany({
    where: or(
      eq(badgeDefinitions.familyId, family.id),
      isNull(badgeDefinitions.familyId)
    ),
  });

  const awards = await db.query.badgeAwards.findMany({
    where: eq(badgeAwards.learnerId, learnerId),
  });

  const awardedBadgeIds = new Set(awards.map((a) => a.badgeDefinitionId));

  // Read thread observation counts from the snapshot instead of the deprecated capabilityObservations table
  const snapshot = await db.query.familyIntelligenceSnapshots.findFirst({
    where: eq(familyIntelligenceSnapshots.familyId, family.id),
  });

  const threadCounts: Record<string, number> = {};
  if (snapshot) {
    const data = snapshot.snapshotData as SnapshotData;
    const activeThreads = data?.children?.[learnerId]?.active_threads ?? [];
    for (const thread of activeThreads) {
      threadCounts[thread.thread_id] = thread.observation_count;
    }
  }

  const crossedThreshold: string[] = [];

  for (const badge of badges) {
    if (awardedBadgeIds.has(badge.id)) continue;
    if (!badge.capabilityThreadIds?.length) continue;

    const totalObservations = badge.capabilityThreadIds.reduce(
      (sum, threadId) => sum + (threadCounts[threadId] ?? 0),
      0
    );

    if (totalObservations >= (badge.observationThreshold ?? 3)) {
      crossedThreshold.push(badge.id);
    }
  }

  return NextResponse.json({ badgeIds: crossedThreshold });
}
