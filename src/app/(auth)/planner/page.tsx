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
import { safeLoad } from '@/lib/server/safe-load';
import EmptyState from '@/components/ui/EmptyState';
import { Lifebuoy } from '@/components/icons';
import PlannerClient from './PlannerClient';

function PlannerErrorState() {
  return (
    <div className="mx-auto max-w-2xl px-lg py-2xl">
      <EmptyState
        icon={Lifebuoy}
        heading="Couldn't load your planner"
        body="Something went wrong on our side. Try again in a moment."
        cta={{ label: 'Refresh', href: '/planner' }}
      />
    </div>
  );
}

export default async function PlannerPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const familyResult = await safeLoad('planner', () => getFamilyByClerkId(userId));
  if (!familyResult.ok) return <PlannerErrorState />;
  const family = familyResult.data;
  if (!family || !family.onboardingComplete) redirect('/onboarding');

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  const result = await safeLoad('planner', async () => {
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
    return { weekEntries, familyLearners, snapshot, libraryItems };
  });

  if (!result.ok) return <PlannerErrorState />;
  const { weekEntries, familyLearners, snapshot, libraryItems } = result.data;

  // Read structured recommendations from snapshot (populated by scoring engine)
  type SnapshotRec = { module_title: string; primary_reason: string; reason_text: string };
  type ChildSnap = {
    name?: string;
    gap_analysis?: { underserved_subjects?: string[] };
    recent_activity?: { subjects_this_week?: string[] };
  };

  const snapshotData = (snapshot?.snapshotData ?? {}) as {
    children?: Record<string, ChildSnap>;
    family?: { dashboard_summary?: { nudge_message?: string | null } };
    recommendations?: { suggested_next?: SnapshotRec[]; subject_balance?: Record<string, string> };
  };

  const recommendations: Array<{ title: string; subject?: string; reason?: string }> = [];

  const scored = snapshotData.recommendations?.suggested_next ?? [];
  if (scored.length > 0) {
    // Use structured recommendations from scoring engine
    for (const rec of scored.slice(0, 6)) {
      recommendations.push({
        title: rec.reason_text || rec.module_title,
        reason: rec.primary_reason,
      });
    }
  } else {
    // Fallback: derive from gap analysis (pre-scoring-engine behavior)
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
