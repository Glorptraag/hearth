import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import {
  familyIntelligenceSnapshots,
  familySettings,
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
  if (!family || !family.onboardingComplete) redirect('/onboarding');

  const today = new Date().toISOString().split('T')[0];

  const [snapshot, recentEntries, todayPlanner, familyLearners, settings] = await Promise.all([
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
    db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, family.id),
    }),
  ]);

  const todayEntryCount = recentEntries.filter((e) => e.dateOccurred === today).length;
  const pedagogy = settings?.pedagogyPreference ?? 'eclectic';

  // Cascading dashboard state resolution
  type DashboardState = 'no-children' | 'no-entries' | 'returning-inactive' | 'active';
  let dashboardState: DashboardState = 'active';
  if (familyLearners.length === 0) {
    dashboardState = 'no-children';
  } else if (recentEntries.length === 0) {
    dashboardState = 'no-entries';
  } else {
    const latestDate = recentEntries[0].dateOccurred;
    const daysSince = Math.floor(
      (Date.now() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince > 7) dashboardState = 'returning-inactive';
  }

  const snapshotData = (snapshot?.snapshotData ?? {}) as {
    activityStreak?: number;
    lastLogDate?: string;
    weeklyThreadCoverage?: number;
    activeModulesCount?: number;
    hearthVoice?: string;
    weekStats?: {
      momentsLogged?: number;
      collaborativeActivities?: number;
      newCapabilities?: number;
      evidenceCollected?: number;
    };
    recommendations?: Array<{ title: string; subject?: string }>;
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
        shapeIcon: l.shapeIcon ?? null,
        dateOfBirth: l.dateOfBirth ?? null,
      }))}
      todayEntryCount={todayEntryCount}
      pedagogy={pedagogy}
      dashboardState={dashboardState}
    />
  );
}
