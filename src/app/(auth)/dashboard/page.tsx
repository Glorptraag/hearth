import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import {
  familyIntelligenceSnapshots,
  learningEntries,
  plannerEntries,
  learners,
} from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, desc } from 'drizzle-orm';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const family = await getFamilyByClerkId(userId);
  if (!family) redirect('/onboarding');

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

  const todayEntryCount = recentEntries.filter((e) => e.dateOccurred === today).length;

  const snapshotData = (snapshot?.snapshotData ?? {}) as {
    activityStreak?: number;
    lastLogDate?: string;
    weeklyThreadCoverage?: number;
    activeModulesCount?: number;
  };

  return (
    <DashboardClient
      familyName={family.familyName}
      snapshot={snapshotData}
      recentEntries={recentEntries.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description ?? null,
        dateOccurred: e.dateOccurred,
        subjects: e.subjects ?? null,
        learnerIds: e.learnerIds?.map(String) ?? null,
      }))}
      todayPlanner={todayPlanner.map((p) => ({
        id: p.id,
        title: p.title ?? null,
        status: p.status ?? null,
        moduleId: p.moduleId ?? null,
      }))}
      learners={familyLearners.map((l) => ({
        id: l.id,
        name: l.name,
        colourToken: l.colourToken ?? null,
      }))}
      todayEntryCount={todayEntryCount}
    />
  );
}
