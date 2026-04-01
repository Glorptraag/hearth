import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import {
  plannerEntries,
  learners,
  familyIntelligenceSnapshots,
  familyLibrary,
} from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, gte, lte } from 'drizzle-orm';
import { addDays, startOfWeek, format } from 'date-fns';
import PlannerClient from './PlannerClient';

export default async function PlannerPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const family = await getFamilyByClerkId(userId);
  if (!family || !family.onboardingComplete) redirect('/onboarding');

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  const [weekEntries, familyLearners, snapshot, libraryItems] = await Promise.all([
    db
      .select()
      .from(plannerEntries)
      .where(
        and(
          eq(plannerEntries.familyId, family.id),
          gte(plannerEntries.date, weekStartStr),
          lte(plannerEntries.date, weekEndStr)
        )
      ),
    db
      .select()
      .from(learners)
      .where(eq(learners.familyId, family.id))
      .orderBy(learners.displayOrder),
    db.query.familyIntelligenceSnapshots.findFirst({
      where: eq(familyIntelligenceSnapshots.familyId, family.id),
    }),
    db
      .select({ id: familyLibrary.id })
      .from(familyLibrary)
      .where(eq(familyLibrary.familyId, family.id))
      .limit(1),
  ]);

  // Derive recommendations from snapshot gap analysis
  type ChildSnapshot = {
    name?: string;
    gap_analysis?: { underserved_subjects?: string[]; suggested_focus_threads?: string[] };
    recent_activity?: { subjects_this_week?: string[] };
  };

  const snapshotData = (snapshot?.snapshotData ?? {}) as {
    children?: Record<string, ChildSnapshot>;
    family?: { dashboard_summary?: { nudge_message?: string | null } };
  };

  const recommendations: Array<{ title: string; subject?: string; reason?: string }> = [];
  const childMap = snapshotData.children ?? {};

  for (const [, child] of Object.entries(childMap)) {
    const gaps = child.gap_analysis?.underserved_subjects ?? [];
    const recentSubjects = new Set(child.recent_activity?.subjects_this_week ?? []);

    for (const subject of gaps) {
      if (!recentSubjects.has(subject) && !recommendations.some((r) => r.subject === subject)) {
        const label = subject.charAt(0).toUpperCase() + subject.slice(1);
        recommendations.push({
          title: `${label} activity${child.name ? ` for ${child.name}` : ''}`,
          subject,
          reason: 'gap',
        });
      }
    }
  }

  // Add nudge-based recommendation
  const nudge = snapshotData.family?.dashboard_summary?.nudge_message;
  if (nudge && recommendations.length < 6) {
    recommendations.push({ title: nudge, reason: 'nudge' });
  }

  return (
    <PlannerClient
      initialEntries={weekEntries.map((e) => ({
        id: e.id,
        title: e.title ?? null,
        status: e.status ?? null,
        moduleId: e.moduleId ?? null,
        learnerIds: e.learnerIds?.map(String) ?? null,
        date: e.date,
        session: e.session ?? 'morning',
        subjects: e.subjects ?? null,
      }))}
      learners={familyLearners.map((l) => ({
        id: l.id,
        name: l.name,
        colourToken: l.colourToken ?? null,
      }))}
      recommendations={recommendations}
      today={todayStr}
      hasLibraryModules={libraryItems.length > 0}
    />
  );
}
