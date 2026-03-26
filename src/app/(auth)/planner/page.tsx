import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import {
  plannerEntries,
  learners,
  familyIntelligenceSnapshots,
} from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, gte, lte } from 'drizzle-orm';
import { addDays, startOfWeek, format } from 'date-fns';
import PlannerClient from './PlannerClient';

export default async function PlannerPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const family = await getFamilyByClerkId(userId);
  if (!family) redirect('/onboarding');

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  const [weekEntries, familyLearners, snapshot] = await Promise.all([
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
  ]);

  const snapshotData = (snapshot?.snapshotData ?? {}) as {
    recommendations?: Array<{ title: string; subject?: string }>;
  };

  return (
    <PlannerClient
      initialEntries={weekEntries.map((e) => ({
        id: e.id,
        title: e.title ?? null,
        status: e.status ?? null,
        moduleId: e.moduleId ?? null,
        learnerIds: e.learnerIds?.map(String) ?? null,
        date: e.date,
      }))}
      learners={familyLearners.map((l) => ({
        id: l.id,
        name: l.name,
        colourToken: l.colourToken ?? null,
      }))}
      recommendations={snapshotData.recommendations ?? []}
      today={todayStr}
    />
  );
}
