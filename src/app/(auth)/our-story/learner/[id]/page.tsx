import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import {
  learners,
  learningEntries,
  capabilityObservations,
  badgeAwards,
  badgeDefinitions,
} from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq, desc, gte } from 'drizzle-orm';
import { subDays, format, startOfMonth } from 'date-fns';
import LearnerProfileClient from './LearnerProfileClient';

// Maps threadId prefixes → display domain metadata
const DOMAIN_MAP: Array<{
  key: string;
  domain: string;
  emoji: string;
  colorClass: string;
}> = [
  { key: 'english', domain: 'English', emoji: '📖', colorClass: 'bg-domain-english' },
  { key: 'math', domain: 'Mathematics', emoji: '🔢', colorClass: 'bg-domain-mathematics' },
  { key: 'science', domain: 'Science', emoji: '🔬', colorClass: 'bg-domain-science' },
  { key: 'hass', domain: 'Humanities', emoji: '🌍', colorClass: 'bg-domain-hass' },
  { key: 'arts', domain: 'Arts', emoji: '🎨', colorClass: 'bg-domain-arts' },
  { key: 'tech', domain: 'Technologies', emoji: '💻', colorClass: 'bg-domain-technologies' },
  { key: 'hpe', domain: 'HPE', emoji: '🏃', colorClass: 'bg-domain-hpe' },
  { key: 'lang', domain: 'Languages', emoji: '🗣️', colorClass: 'bg-domain-languages' },
];

type Params = { params: Promise<{ id: string }> };

export default async function LearnerProfilePage({ params }: Params) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const family = await getFamilyByClerkId(userId);
  if (!family) redirect('/onboarding');

  const { id } = await params;

  const learner = await db.query.learners.findFirst({
    where: and(eq(learners.id, id), eq(learners.familyId, family.id)),
  });
  if (!learner) notFound();

  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const thirtyDaysAgo = format(subDays(now, 30), 'yyyy-MM-dd');

  const [allEntries, observations, awards] = await Promise.all([
    db
      .select()
      .from(learningEntries)
      .where(
        and(
          eq(learningEntries.familyId, family.id),
          gte(learningEntries.dateOccurred, thirtyDaysAgo)
        )
      )
      .orderBy(desc(learningEntries.dateOccurred))
      .limit(50),
    db
      .select()
      .from(capabilityObservations)
      .where(eq(capabilityObservations.learnerId, id)),
    db
      .select({
        id: badgeAwards.id,
        badgeTitle: badgeDefinitions.title,
        badgeEmoji: badgeDefinitions.emoji,
        awardedAt: badgeAwards.awardedAt,
        notes: badgeAwards.notes,
      })
      .from(badgeAwards)
      .innerJoin(badgeDefinitions, eq(badgeAwards.badgeDefinitionId, badgeDefinitions.id))
      .where(eq(badgeAwards.learnerId, id)),
  ]);

  // Filter entries where this learner is included
  const learnerEntries = allEntries.filter((e) =>
    e.learnerIds?.map(String).includes(id)
  );

  const monthEntries = learnerEntries.filter(
    (e) => e.dateOccurred >= monthStart
  );

  // Build capability domain aggregates
  const threadCounts: Record<string, number> = {};
  for (const obs of observations) {
    const t = obs.threadId.toLowerCase();
    threadCounts[t] = (threadCounts[t] ?? 0) + 1;
  }

  const domainCounts: Record<string, number> = {};
  for (const [threadId, count] of Object.entries(threadCounts)) {
    const match = DOMAIN_MAP.find((d) => threadId.includes(d.key));
    const key = match?.key ?? 'general';
    domainCounts[key] = (domainCounts[key] ?? 0) + count;
  }

  const capabilityDomains = DOMAIN_MAP.filter(
    (d) => (domainCounts[d.key] ?? 0) > 0
  ).map((d) => ({
    domain: d.domain,
    emoji: d.emoji,
    count: domainCounts[d.key] ?? 0,
    colorClass: d.colorClass,
  }));

  // Simple streak: count consecutive days with entries ending today
  const entryDates = new Set(learnerEntries.map((e) => e.dateOccurred));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = format(subDays(now, i), 'yyyy-MM-dd');
    if (entryDates.has(d)) streak++;
    else if (i > 0) break;
  }

  return (
    <LearnerProfileClient
      learner={{
        id: learner.id,
        name: learner.name,
        colourToken: learner.colourToken ?? null,
      }}
      stats={{
        entriesThisMonth: monthEntries.length,
        activeStreak: streak,
        capabilitiesCount: observations.length,
        badgesCount: awards.length,
      }}
      capabilityDomains={capabilityDomains}
      recentEntries={learnerEntries.slice(0, 10).map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description ?? null,
        dateOccurred: e.dateOccurred,
        subjects: e.subjects ?? null,
      }))}
      badges={awards}
    />
  );
}
