import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import {
  familyIntelligenceSnapshots,
  familySettings,
  learningEntries,
  plannerEntries,
  learners,
  hearthMemberships,
  hearths,
  hearthSessions,
  sessionAttendance,
} from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, desc, gte, inArray } from 'drizzle-orm';
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

  // Hearth memberships
  const familyMemberships = await db
    .select()
    .from(hearthMemberships)
    .where(and(eq(hearthMemberships.familyId, family.id), eq(hearthMemberships.status, 'active')));

  const hearthData = familyMemberships.length > 0
    ? await Promise.all(
        familyMemberships.map(async (membership) => {
          const [hearth, memberCount, nextSession] = await Promise.all([
            db.query.hearths.findFirst({ where: eq(hearths.id, membership.hearthId) }),
            db
              .select()
              .from(hearthMemberships)
              .where(and(eq(hearthMemberships.hearthId, membership.hearthId), eq(hearthMemberships.status, 'active')))
              .then((rows) => rows.length),
            db
              .select()
              .from(hearthSessions)
              .where(and(eq(hearthSessions.hearthId, membership.hearthId), gte(hearthSessions.date, today)))
              .orderBy(hearthSessions.date)
              .limit(1)
              .then((rows) => rows[0] ?? null),
          ]);
          if (!hearth) return null;

          const completedSessions = await db
            .select({ id: hearthSessions.id })
            .from(hearthSessions)
            .where(and(
              eq(hearthSessions.hearthId, hearth.id),
              eq(hearthSessions.status, 'completed')
            ));
          const completedIds = completedSessions.map(s => s.id);

          let pendingScaffoldCount = 0;
          if (completedIds.length > 0) {
            const attended = await db
              .select({ sessionId: sessionAttendance.sessionId })
              .from(sessionAttendance)
              .where(and(
                eq(sessionAttendance.familyId, family.id),
                inArray(sessionAttendance.sessionId, completedIds)
              ));
            const attendedIds = attended.map(a => a.sessionId);

            if (attendedIds.length > 0) {
              const logged = await db
                .select({ sourceSessionId: learningEntries.sourceSessionId })
                .from(learningEntries)
                .where(and(
                  eq(learningEntries.familyId, family.id),
                  eq(learningEntries.source, 'hearth_session'),
                  inArray(learningEntries.sourceSessionId, attendedIds)
                ));
              const loggedIds = new Set(logged.map(l => l.sourceSessionId).filter(Boolean));

              pendingScaffoldCount = attendedIds.filter(id => !loggedIds.has(id)).length;
            }
          }

          return {
            id: hearth.id,
            name: hearth.name,
            memberCount,
            nextSession: nextSession
              ? { id: nextSession.id, title: nextSession.title, date: nextSession.date }
              : null,
            pendingScaffoldCount,
          };
        })
      )
    : [];

  const hearthCards = hearthData.filter((h): h is NonNullable<typeof h> => h !== null);

  // Cascading dashboard state resolution
  type DashboardState = 'no-children' | 'no-entries' | 'returning-inactive' | 'active';
  let dashboardState: DashboardState = 'active';
  if (familyLearners.length === 0) {
    dashboardState = 'no-children';
  } else if (recentEntries.length === 0) {
    dashboardState = 'no-entries';
  } else {
    const latestDate = recentEntries[0].dateOccurred;
    const now = new Date();
    const daysSince = Math.floor(
      (now.getTime() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24)
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
        source: e.source,
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
      hearths={hearthCards}
    />
  );
}
