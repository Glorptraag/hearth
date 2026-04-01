import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { badgeAwards, badgeDefinitions, learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const learnerId = request.nextUrl.searchParams.get('learnerId');
  if (!learnerId) {
    return NextResponse.json({ error: 'learnerId required' }, { status: 400 });
  }

  const includeArchived = request.nextUrl.searchParams.get('includeArchived') === 'true';

  const learner = await db.query.learners.findFirst({
    where: and(eq(learners.id, learnerId), eq(learners.familyId, family.id)),
  });
  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  const whereClause = includeArchived
    ? eq(badgeAwards.learnerId, learnerId)
    : and(eq(badgeAwards.learnerId, learnerId), isNull(badgeAwards.retractedAt));

  const awards = await db
    .select({
      id: badgeAwards.id,
      awardedAt: badgeAwards.awardedAt,
      awardedBy: badgeAwards.awardedBy,
      notes: badgeAwards.notes,
      retractedAt: badgeAwards.retractedAt,
      badgeTitle: badgeDefinitions.title,
      badgeEmoji: badgeDefinitions.emoji,
      badgeDescription: badgeDefinitions.description,
    })
    .from(badgeAwards)
    .innerJoin(badgeDefinitions, eq(badgeAwards.badgeDefinitionId, badgeDefinitions.id))
    .where(whereClause);

  return NextResponse.json(awards);
}
