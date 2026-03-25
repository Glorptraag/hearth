import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  badgeDefinitions,
  badgeAwards,
  capabilityObservations,
  learners,
} from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, or, isNull } from 'drizzle-orm';

const checkSchema = z.object({
  learnerId: z.string().uuid(),
});

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

  const observations = await db.query.capabilityObservations.findMany({
    where: eq(capabilityObservations.learnerId, learnerId),
  });

  const threadCounts: Record<string, number> = {};
  for (const obs of observations) {
    threadCounts[obs.threadId] = (threadCounts[obs.threadId] ?? 0) + 1;
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
