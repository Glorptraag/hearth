import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
  familyIntelligenceSnapshots,
  learningEntries,
  plannerEntries,
  learners,
} from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const today = new Date().toISOString().split('T')[0];

  const [snapshot, recentEntries, todayPlanner, familyLearners] = await Promise.all([
    db.query.familyIntelligenceSnapshots.findFirst({
      where: eq(familyIntelligenceSnapshots.familyId, family.id),
    }),
    db
      .select()
      .from(learningEntries)
      .where(eq(learningEntries.familyId, family.id))
      .orderBy(desc(learningEntries.dateOccurred), desc(learningEntries.createdAt))
      .limit(5),
    db
      .select()
      .from(plannerEntries)
      .where(and(eq(plannerEntries.familyId, family.id), eq(plannerEntries.date, today))),
    db
      .select()
      .from(learners)
      .where(eq(learners.familyId, family.id))
      .orderBy(learners.displayOrder),
  ]);

  const todayEntryCount = recentEntries.filter(
    (e) => e.dateOccurred === today
  ).length;

  return NextResponse.json({
    snapshot: snapshot?.snapshotData ?? {},
    recentEntries,
    todayPlanner,
    learners: familyLearners,
    familyName: family.familyName,
    todayEntryCount,
  });
}
