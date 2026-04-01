import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { badgeAssessmentLogs, learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, desc } from 'drizzle-orm';
import { resolveBadgeDefinitionId } from '@/lib/resolve-badge-id';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const params = request.nextUrl.searchParams;
  const badgeId = params.get('badgeId');
  const learnerId = params.get('learnerId');

  if (!badgeId || !learnerId) {
    return NextResponse.json({ error: 'badgeId and learnerId required' }, { status: 400 });
  }

  const learner = await db.query.learners.findFirst({
    where: and(eq(learners.id, learnerId), eq(learners.familyId, family.id)),
  });
  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  const definitionId = await resolveBadgeDefinitionId(badgeId, family.id);

  const logs = await db
    .select()
    .from(badgeAssessmentLogs)
    .where(
      and(
        eq(badgeAssessmentLogs.badgeDefinitionId, definitionId),
        eq(badgeAssessmentLogs.learnerId, learnerId)
      )
    )
    .orderBy(desc(badgeAssessmentLogs.assessedAt))
    .limit(10);

  return NextResponse.json(logs);
}
