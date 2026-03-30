import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { badgeDefinitions } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, or, isNull } from 'drizzle-orm';
import { SEED_BADGES } from '@/lib/seed-badges';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { id } = await params;

  // Check seed badges first
  const seedBadge = SEED_BADGES.find((b) => b.id === id);
  if (seedBadge) {
    return NextResponse.json({
      id: seedBadge.id,
      title: seedBadge.name,
      emoji: seedBadge.emoji,
      capabilityThreadIds: [seedBadge.threadId],
      threadName: seedBadge.threadName,
      observationThreshold: seedBadge.requiredObservations,
      assessmentQuestions: seedBadge.assessmentQuestions,
      source: 'seed',
    });
  }

  // Check database badges
  const badge = await db.query.badgeDefinitions.findFirst({
    where: and(
      eq(badgeDefinitions.id, id),
      or(eq(badgeDefinitions.familyId, family.id), isNull(badgeDefinitions.familyId))
    ),
  });

  if (!badge) return NextResponse.json({ error: 'Badge not found' }, { status: 404 });

  // For DB badges, generate assessment questions from indicator statements
  const assessmentQuestions = (badge.indicatorStatements ?? []).map((stmt, i) => ({
    id: `q${i + 1}`,
    question: stmt,
  }));

  return NextResponse.json({
    ...badge,
    assessmentQuestions,
    source: 'database',
  });
}
