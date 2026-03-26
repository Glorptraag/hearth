'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import SummaryCard from '@/components/dashboard/SummaryCard';
import RecentEntryCard from '@/components/dashboard/RecentEntryCard';
import PlannerStrip from '@/components/dashboard/PlannerStrip';

interface Learner {
  id: string;
  name: string;
  colourToken: string | null;
}

interface LearningEntry {
  id: string;
  title: string;
  description: string | null;
  dateOccurred: string;
  subjects: string[] | null;
  learnerIds: string[] | null;
}

interface PlannerItem {
  id: string;
  title: string | null;
  status: string | null;
  moduleId: string | null;
}

interface SnapshotData {
  activityStreak?: number;
  lastLogDate?: string;
  weeklyThreadCoverage?: number;
  activeModulesCount?: number;
}

interface DashboardClientProps {
  familyName: string;
  snapshot: SnapshotData;
  recentEntries: LearningEntry[];
  todayPlanner: PlannerItem[];
  learners: Learner[];
  todayEntryCount: number;
}

type TimeOfDay = 'morning' | 'afternoon' | 'evening';

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'evening';
}

function getGreeting(timeOfDay: TimeOfDay, familyName: string): string {
  const display = familyName.endsWith(' Family') ? familyName : `${familyName} Family`;
  switch (timeOfDay) {
    case 'morning':
      return `Good morning, ${display}`;
    case 'afternoon':
      return `Good afternoon, ${display}`;
    case 'evening':
      return `Good evening, ${display}`;
  }
}

function getSubheading(
  timeOfDay: TimeOfDay,
  todayEntryCount: number,
  todayPlannerCount: number
): string {
  if (timeOfDay === 'morning') {
    if (todayPlannerCount > 0)
      return `You have ${todayPlannerCount} session${todayPlannerCount > 1 ? 's' : ''} planned for today.`;
    return "What will today's learning look like?";
  }
  if (timeOfDay === 'afternoon') {
    if (todayEntryCount === 0) return "Nothing logged yet today \u2014 capture what you've been up to.";
    return `${todayEntryCount} session${todayEntryCount > 1 ? 's' : ''} logged today. Keep it up!`;
  }
  // evening
  if (todayEntryCount > 0)
    return `You logged ${todayEntryCount} session${todayEntryCount > 1 ? 's' : ''} today. Lovely work.`;
  return "Quiet day. That\u2019s okay \u2014 every day counts.";
}

export default function DashboardClient({
  familyName,
  snapshot,
  recentEntries,
  todayPlanner,
  learners,
  todayEntryCount,
}: DashboardClientProps) {
  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const greeting = useMemo(() => getGreeting(timeOfDay, familyName), [timeOfDay, familyName]);
  const subheading = useMemo(
    () => getSubheading(timeOfDay, todayEntryCount, todayPlanner.length),
    [timeOfDay, todayEntryCount, todayPlanner.length]
  );

  const streak = snapshot.activityStreak ?? 0;
  const coverage = snapshot.weeklyThreadCoverage ?? 0;
  const activeModules = snapshot.activeModulesCount ?? 0;

  const hasEntries = recentEntries.length > 0;

  return (
    <div className="mx-auto max-w-2xl px-md py-xl">
      {/* Greeting */}
      <div className="mb-xl">
        <h1 className="font-serif text-2xl font-semibold leading-snug text-text-primary">
          {greeting}
        </h1>
        <p className="mt-xs font-sans text-sm text-text-secondary">{subheading}</p>
      </div>

      {/* Empty state — new family */}
      {!hasEntries && (
        <div className="mb-xl flex flex-col items-center gap-md rounded-[16px] border border-border-subtle bg-surface-panel px-lg py-xl text-center shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <span className="text-4xl">🌱</span>
          <div>
            <h2 className="font-serif text-xl font-semibold text-text-primary">
              Your learning journey starts here
            </h2>
            <p className="mt-xs font-sans text-sm text-text-secondary">
              Log your first session and Hearth will begin building a picture of your family&rsquo;s learning.
            </p>
          </div>
          <Link
            href="/log"
            className="rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-ember-hover"
          >
            Log your first session
          </Link>
        </div>
      )}

      {/* Summary cards */}
      <div className="mb-xl grid grid-cols-3 gap-sm">
        <SummaryCard
          emoji="🔥"
          label="Day streak"
          value={streak}
          subtext={streak > 0 ? 'Keep going' : 'Start today'}
          highlight={streak > 0}
        />
        <SummaryCard
          emoji="🧵"
          label="Coverage"
          value={`${coverage}%`}
          subtext="This week"
        />
        <SummaryCard
          emoji="📦"
          label="Modules"
          value={activeModules}
          subtext="Active"
        />
      </div>

      {/* Planner strip — morning or always visible */}
      <div className="mb-xl">
        <PlannerStrip items={todayPlanner} />
      </div>

      {/* Recent entries */}
      {hasEntries && (
        <div className="flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
              Recent Learning
            </h2>
            <Link
              href="/our-story/portfolio"
              className="font-sans text-xs font-semibold text-ember transition-colors duration-200 hover:text-ember-hover"
            >
              View all →
            </Link>
          </div>
          {recentEntries.map((entry) => (
            <RecentEntryCard key={entry.id} entry={entry} learners={learners} />
          ))}
        </div>
      )}

      {/* Evening CTA — log today if not yet done */}
      {timeOfDay === 'afternoon' && todayEntryCount === 0 && (
        <div className="mt-xl flex items-center justify-between rounded-[10px] border border-ember/20 bg-ember-glow px-md py-sm">
          <p className="font-sans text-sm text-text-secondary">
            What did you learn today?
          </p>
          <Link
            href="/log"
            className="rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 hover:bg-ember-hover"
          >
            Log session
          </Link>
        </div>
      )}
    </div>
  );
}
