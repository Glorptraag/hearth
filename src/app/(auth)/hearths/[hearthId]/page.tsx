import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { hearths, hearthSessions, learners } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import {
  getHearthMembership,
  sanitizeMembersForExposure,
} from '@/lib/auth/hearth-helpers';
import HearthHomeClient from '@/components/hearth/HearthHomeClient';

export default async function HearthHomePage({
  params,
}: {
  params: Promise<{ hearthId: string }>;
}) {
  const { hearthId } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const family = await getFamilyByClerkId(userId);
  if (!family) redirect('/onboarding');

  const membership = await getHearthMembership(family.id, hearthId);
  if (!membership) redirect('/dashboard');

  const [hearth, sessions, members, familyLearners] = await Promise.all([
    db.query.hearths.findFirst({ where: eq(hearths.id, hearthId) }),
    db
      .select()
      .from(hearthSessions)
      .where(eq(hearthSessions.hearthId, hearthId))
      .orderBy(desc(hearthSessions.date)),
    sanitizeMembersForExposure(hearthId),
    db.select().from(learners).where(eq(learners.familyId, family.id)),
  ]);

  if (!hearth) redirect('/dashboard');

  const today = new Date().toISOString().split('T')[0];

  const upcoming = sessions
    .filter((s) => s.status === 'upcoming' && s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const recent = sessions
    .filter((s) => s.status !== 'upcoming')
    .slice(0, 10);

  const totalChildrenCount = members.reduce(
    (sum, m) => sum + m.children.length,
    0
  );

  return (
    <HearthHomeClient
      hearth={{
        id: hearth.id,
        name: hearth.name,
        description: hearth.description ?? null,
        location: hearth.location ?? null,
      }}
      role={membership.role}
      familyId={family.id}
      upcoming={upcoming.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description ?? null,
        date: s.date,
        timeStart: s.timeStart ?? null,
        timeEnd: s.timeEnd ?? null,
        location: s.location ?? null,
        status: s.status,
        facilitatorFamilyId: s.facilitatorFamilyId,
      }))}
      recent={recent.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description ?? null,
        date: s.date,
        timeStart: s.timeStart ?? null,
        timeEnd: s.timeEnd ?? null,
        location: s.location ?? null,
        status: s.status,
        facilitatorFamilyId: s.facilitatorFamilyId,
      }))}
      members={members.map((m) => ({
        familyId: m.familyId,
        familyName: m.familyName,
        role: m.role,
        joinedAt: m.joinedAt?.toISOString() ?? null,
        consentCrossObservation: m.consentCrossObservation,
        consentEvidenceSharing: m.consentEvidenceSharing,
        children: m.children,
      }))}
      memberCount={members.length}
      totalChildrenCount={totalChildrenCount}
      sessionCount={sessions.length}
      familyLearners={familyLearners.map((l) => ({
        id: l.id,
        name: l.name,
        colourToken: l.colourToken ?? null,
      }))}
    />
  );
}
