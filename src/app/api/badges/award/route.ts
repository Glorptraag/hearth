import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { badgeAwards, badgeAssessmentLogs, learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { parseBody } from '@/lib/api-helpers';
import { eq, and } from 'drizzle-orm';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';
import { resolveBadgeDefinitionId } from '@/lib/resolve-badge-id';

const awardSchema = z.object({
  badgeId: z.string(),
  learnerId: z.string().uuid(),
  responses: z.array(
    z.object({
      questionId: z.string(),
      response: z.enum(['yes', 'sometimes', 'not_yet']),
      note: z.string().optional(),
    })
  ),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const result = await parseBody(request, awardSchema);
  if ('error' in result) return result.error;

  const { badgeId, learnerId, responses } = result.data;

  const learner = await db.query.learners.findFirst({
    where: and(eq(learners.id, learnerId), eq(learners.familyId, family.id)),
  });
  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  const definitionId = await resolveBadgeDefinitionId(badgeId, family.id);

  const [award] = await db
    .insert(badgeAwards)
    .values({
      badgeDefinitionId: definitionId,
      learnerId,
      awardedBy: 'parent',
    })
    .returning();

  await db.insert(badgeAssessmentLogs).values({
    badgeDefinitionId: definitionId,
    learnerId,
    responses,
    outcome: 'awarded',
  });

  try {
    await rebuildSnapshot(family.id, 'manual');
  } catch {
    // Non-blocking
  }

  return NextResponse.json({ award }, { status: 201 });
}
