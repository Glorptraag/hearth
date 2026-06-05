'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { differenceInYears } from 'date-fns';
import { getPedagogyVocabulary, adaptGreeting } from '@/lib/pedagogy/adapter';
import EmptyState from '@/components/ui/EmptyState';
import HearthDashboardCard from '@/components/hearth/HearthDashboardCard';
import { LEARNER_COLOUR_MAP } from '@/components/ui/LearnerAvatar';
import { PackIndicators } from '@/components/ui/PackIndicators';
import { sanityClient } from '@/lib/sanity/client';
import { MODULE_INDICATORS_QUERY } from '@/lib/sanity/queries';
import { resolveIndicators, type Indicators, type Printables, type Materials, type AssetCounts } from '@/lib/sanity/pack-indicators';
import {
  HandWaving,
  Plant,
  Sun,
  PencilSimpleLine,
  Flame,
  UsersThree,
} from '@/components/icons';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Learner {
  id: string;
  name: string;
  colourToken: string | null;
  shapeIcon: string | null;
  dateOfBirth: string | null;
}

interface LearningEntry {
  id: string;
  title: string;
  description: string | null;
  dateOccurred: string;
  subjects: string[] | null;
  learnerIds: string[] | null;
  source: string;
}

interface PlannerItem {
  id: string;
  title: string | null;
  status: string | null;
  moduleId: string | null;
  subjects?: string[] | null;
}

interface SnapshotData {
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
}

type DashboardState = 'no-children' | 'no-entries' | 'returning-inactive' | 'active';

interface HearthItem {
  id: string;
  name: string;
  memberCount: number;
  nextSession: { id: string; title: string; date: string } | null;
  pendingScaffoldCount: number;
}

interface DashboardClientProps {
  familyName: string;
  snapshot: SnapshotData;
  recentEntries: LearningEntry[];
  todayPlanner: PlannerItem[];
  learners: Learner[];
  todayEntryCount: number;
  basePath?: string;
  pedagogy?: string;
  dashboardState?: DashboardState;
  hearths?: HearthItem[];
  hasMissingNarrative?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type TimeOfDay = 'morning' | 'afternoon' | 'evening';

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'evening';
}

function getTimeLabel(): string {
  const d = new Date();
  const day = d.toLocaleDateString('en-AU', { weekday: 'long' });
  const tod = getTimeOfDay();
  return `${day} ${tod}`;
}

function getGreetingMessage(
  timeOfDay: TimeOfDay,
  familyName: string,
  todayEntryCount: number,
  todayPlannerCount: number,
  learnerNames: string[],
  todaySubjects: string[]
): { heading: string; message: string } {
  // Show the family name exactly as the parent set it (onboarding stores the
  // preferred form, e.g. "Douglas Family"). Don't strip the "Family" suffix —
  // alpha testers expect "Good evening, Douglas Family", not "Douglas".
  const displayName = familyName.trim();
  const names = learnerNames.length === 1
    ? learnerNames[0]
    : learnerNames.length === 2
    ? `${learnerNames[0]} and ${learnerNames[1]}`
    : learnerNames.length > 2
    ? `${learnerNames[0]}, ${learnerNames[1]} and ${learnerNames.length - 2} more`
    : null;
  const subjectNote = todaySubjects.length > 0
    ? ` covering ${todaySubjects.slice(0, 2).join(' and ')}`
    : '';

  if (timeOfDay === 'evening') {
    if (todayEntryCount > 0) {
      return {
        heading: `A gentle close to the day, <strong>${displayName}</strong>.`,
        message: names
          ? `Today brought ${todayEntryCount} logged moment${todayEntryCount > 1 ? 's' : ''} for ${names}${subjectNote}. A good day\u2019s learning.`
          : `Today brought ${todayEntryCount} logged moment${todayEntryCount > 1 ? 's' : ''} of learning${subjectNote}. The ${displayName}’s hearth has been busy.`,
      };
    }
    return {
      heading: `Good evening, <strong>${displayName}</strong>.`,
      message: "Quiet day. That\u2019s okay \u2014 every day counts. What did you notice today?",
    };
  }

  if (timeOfDay === 'morning') {
    if (todayPlannerCount > 0) {
      return {
        heading: `Good morning, <strong>${displayName}</strong>.`,
        message: names
          ? `${todayPlannerCount} session${todayPlannerCount > 1 ? 's' : ''} planned for ${names} today${subjectNote}. What will the day bring?`
          : `You have ${todayPlannerCount} session${todayPlannerCount > 1 ? 's' : ''} planned${subjectNote}. What will the day bring?`,
      };
    }
    return {
      heading: `Good morning, <strong>${displayName}</strong>.`,
      message: names
        ? `Ready to learn with ${names} today. What will today look like?`
        : "What will today\u2019s learning look like?",
    };
  }

  // afternoon
  if (todayEntryCount === 0) {
    return {
      heading: `Good afternoon, <strong>${displayName}</strong>.`,
      message: names
        ? `Nothing logged for ${names} yet \u2014 capture what you\u2019ve been up to.`
        : "Nothing logged yet today \u2014 capture what you\u2019ve been up to.",
    };
  }
  return {
    heading: `Good afternoon, <strong>${displayName}</strong>.`,
    message: names
      ? `${todayEntryCount} session${todayEntryCount > 1 ? 's' : ''} logged for ${names} today${subjectNote}. Keep it up!`
      : `${todayEntryCount} session${todayEntryCount > 1 ? 's' : ''} logged today${subjectNote}. Keep it up!`,
  };
}

const SECTION_LABELS: Record<string, { title: string; subtitle: string }> = {
  morning:   { title: "TODAY'S SHAPE",    subtitle: 'Plan your day' },
  afternoon: { title: 'HAPPENING NOW',    subtitle: 'Sessions in progress' },
  evening:   { title: "TODAY'S MOMENTS",  subtitle: 'How did it go?' },
};

const SUBJECT_PIP: Record<string, string> = {
  english:      'bg-domain-english',
  mathematics:  'bg-domain-mathematics',
  science:      'bg-domain-science',
  hass:         'bg-domain-hass',
  arts:         'bg-domain-arts',
  technologies: 'bg-domain-technologies',
  hpe:          'bg-domain-hpe',
  languages:    'bg-domain-languages',
};

function getLearnerColour(token: string | null) {
  return LEARNER_COLOUR_MAP[token ?? 'rose'] ?? LEARNER_COLOUR_MAP.rose;
}

function getSubjectLabel(s: string): string {
  const labels: Record<string, string> = {
    english: 'English', mathematics: 'Maths', science: 'Science',
    hass: 'HASS', arts: 'Arts', technologies: 'Tech', hpe: 'HPE', languages: 'Languages',
  };
  return labels[s] ?? s;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardClient({
  familyName,
  snapshot,
  recentEntries,
  todayPlanner,
  learners,
  todayEntryCount,
  basePath = '',
  pedagogy = 'eclectic',
  dashboardState = 'active',
  hearths,
  hasMissingNarrative = false,
}: DashboardClientProps) {
  // Fire a debounced background snapshot rebuild when any child has a stale
  // monthly narrative. The endpoint itself enforces a 24h debounce so a
  // tab-thrash can't run up Anthropic spend.
  useEffect(() => {
    if (!hasMissingNarrative) return;
    fetch('/api/snapshots/rebuild', { method: 'POST' }).catch(() => {});
  }, [hasMissingNarrative]);

  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const timeLabel = useMemo(() => getTimeLabel(), []);
  const learnerNames = useMemo(() => learners.map((l) => l.name.split(' ')[0]), [learners]);
  const todaySubjects = useMemo(
    () => [...new Set(todayPlanner.flatMap((e) => e.subjects ?? []))],
    [todayPlanner]
  );
  const { heading, message } = useMemo(
    () => getGreetingMessage(timeOfDay, familyName, todayEntryCount, todayPlanner.length, learnerNames, todaySubjects),
    [timeOfDay, familyName, todayEntryCount, todayPlanner.length, learnerNames, todaySubjects]
  );

  const adaptedHeading = useMemo(
    () => pedagogy !== 'eclectic' ? adaptGreeting(pedagogy, learnerNames, { timeOfDay }) : null,
    [pedagogy, learnerNames, timeOfDay]
  );

  // Pack indicators for today's planner cards (compact — no state in marketplace-style context).
  const [moduleIndicators, setModuleIndicators] = useState<Map<string, Indicators>>(new Map());
  useEffect(() => {
    const moduleIds = [...new Set(todayPlanner.map((p) => p.moduleId).filter(Boolean))] as string[];
    if (moduleIds.length === 0) return;
    let cancelled = false;
    sanityClient
      .fetch<Array<{
        _id: string;
        printables?: Printables;
        materials?: Materials;
        assetCounts?: AssetCounts | null;
        owningPack?: {
          _id: string;
          printables?: Printables;
          materials?: Materials;
          assetCounts?: AssetCounts | null;
        } | null;
      }>>(MODULE_INDICATORS_QUERY, { ids: moduleIds })
      .then((rows) => {
        if (cancelled) return;
        const map = new Map<string, Indicators>();
        for (const row of rows) map.set(row._id, resolveIndicators(row.owningPack, row));
        setModuleIndicators(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [todayPlanner]);

  const todayEntries = recentEntries.filter(
    (e) => e.dateOccurred === new Date().toISOString().split('T')[0]
  );
  const hasEntries = recentEntries.length > 0;
  const weekStats = snapshot.weekStats;

  return (
    <div className="mx-auto max-w-6xl px-md py-xl lg:px-4xl lg:py-3xl lg:grid lg:grid-cols-[1fr_320px] lg:gap-xl">
      {/* ── Main column ── */}
      <div>
        {/* Time context */}
        <div className="animate-in delay-1 mb-sm flex items-center gap-sm font-sans text-[0.8rem] text-text-muted">
          <span className="h-[6px] w-[6px] rounded-full bg-ember shadow-[0_0_8px_var(--color-ember)] animate-[pulse_3s_ease-in-out_infinite]" />
          <span>{timeLabel}</span>
        </div>

        {/* Greeting */}
        <div className="animate-in delay-2 mb-3xl">
          <h1 className="font-serif text-[2.25rem] font-normal leading-[1.3] text-text-primary mb-lg [&_strong]:font-bold [&_strong]:text-ember">
            {adaptedHeading ?? <span dangerouslySetInnerHTML={{ __html: heading }} />}
          </h1>
          <p className="font-serif text-[1.15rem] leading-[1.7] text-text-secondary max-w-[560px]">
            {message}
          </p>
        </div>

        {/* Cascading empty states */}
        {dashboardState === 'no-children' && (
          <div className="mb-3xl">
            <EmptyState
              icon={HandWaving}
              heading="Welcome to Hearth"
              body="Let's set up your family. Who's learning at your hearth?"
              cta={{ label: 'Add your first learner', href: `${basePath}/settings` }}
            />
          </div>
        )}
        {dashboardState === 'no-entries' && (
          <div className="mb-3xl">
            <EmptyState
              icon={Plant}
              heading="Your hearth is ready"
              body="Start by logging something that happened today — even five minutes of play counts."
              cta={{ label: 'Log a moment', href: `${basePath}/log` }}
            />
          </div>
        )}
        {dashboardState === 'returning-inactive' && (
          <div className="mb-3xl rounded-[16px] border border-border-subtle bg-surface-panel px-lg py-lg shadow-card">
            <div className="flex items-center gap-md">
              <span className="inline-flex text-text-secondary" aria-hidden="true">
                <Sun size={32} />
              </span>
              <div>
                <p className="font-serif text-sm text-text-secondary">
                  It&rsquo;s been a few days. Learning has been happening &mdash; let&rsquo;s capture some of it.
                </p>
              </div>
              <Link
                href={`${basePath}/log`}
                className="ml-auto shrink-0 rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[var(--ease-default)] hover:bg-ember-hover"
              >
                Log a moment
              </Link>
            </div>
          </div>
        )}

        {/* Your Learners */}
        {learners.length > 0 && (
          <section className="animate-in delay-3 mb-3xl">
            <div className="flex items-center justify-between mb-lg">
              <h2 className="font-serif text-[1.1rem] font-semibold text-text-primary">
                Your Learners
              </h2>
              <Link
                href={`${basePath}/our-story`}
                className="font-sans text-[0.8rem] font-medium text-ember transition-colors duration-200 hover:text-ember-hover"
              >
                View all journeys →
              </Link>
            </div>
            <div className="flex gap-xl overflow-x-auto pb-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {learners.map((l) => {
                const colours = getLearnerColour(l.colourToken);
                const age = l.dateOfBirth
                  ? differenceInYears(new Date(), new Date(l.dateOfBirth))
                  : null;
                const recentEntry = recentEntries.find(
                  (e) => e.learnerIds?.includes(l.id)
                );
                return (
                  <Link
                    key={l.id}
                    href={`${basePath}/our-story/learner/${l.id}`}
                    className="flex flex-col items-center transition-transform duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:-translate-y-[4px]"
                  >
                    <div
                      className={`flex h-[72px] w-[72px] items-center justify-center rounded-full mb-md text-[2rem] border transition-all duration-[var(--motion-gentle)] ${colours.bg} ${colours.border} ${colours.text}`}
                    >
                      {l.shapeIcon ?? '🌟'}
                    </div>
                    <span className="font-serif text-base font-semibold text-text-primary mb-xs">
                      {l.name}
                    </span>
                    {age !== null && (
                      <span className="font-sans text-[0.75rem] text-text-muted mb-sm">
                        Age {age}
                      </span>
                    )}
                    {recentEntry && (
                      <span className="font-sans text-[0.75rem] text-text-secondary text-center max-w-[100px] leading-[1.4]">
                        {recentEntry.title.length > 30
                          ? recentEntry.title.slice(0, 30) + '…'
                          : recentEntry.title}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* My Hearths */}
        {hearths && hearths.length > 0 && (
          <section className="animate-in delay-3 mb-3xl">
            <div className="flex items-center justify-between mb-lg">
              <h2 className="font-serif text-lg font-semibold text-text-primary">My Hearths</h2>
              <Link
                href="/hearths"
                className="font-sans text-sm text-ember font-medium hover:text-ember-hover"
              >
                View all →
              </Link>
            </div>
            <div className="flex flex-col gap-lg">
              {hearths.map((h) => (
                <HearthDashboardCard key={h.id} {...h} />
              ))}
            </div>
          </section>
        )}

        {/* Today's Planner & Moments */}
        {(todayPlanner.length > 0 || hasEntries) && (
          <section className="animate-in delay-4 mb-3xl">
            {todayPlanner.length > 0 && (
              <div className="mb-3xl">
                <div className="flex items-center justify-between mb-lg">
                  <div>
                    <h2 className="font-serif text-[1.1rem] font-semibold text-text-primary">
                      {SECTION_LABELS[timeOfDay].title}
                    </h2>
                    <p className="font-sans text-[0.85rem] text-text-muted mt-xs">
                      {SECTION_LABELS[timeOfDay].subtitle}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
                  {todayPlanner.map((item) => {
                    const ind = item.moduleId ? moduleIndicators.get(item.moduleId) : undefined;
                    return (
                      <div
                        key={item.id}
                        className="rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-card transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
                      >
                        <div className="flex items-start justify-between gap-md">
                          <h3 className="font-serif text-[1.1rem] font-semibold text-text-primary">
                            {item.title}
                          </h3>
                          {ind && (
                            <PackIndicators
                              context="card-compact"
                              printables={ind.printables}
                              materials={ind.materials}
                              className="mt-[6px] shrink-0"
                            />
                          )}
                        </div>
                        {item.status && (
                          <p className="font-sans text-[0.85rem] text-text-secondary mt-sm">
                            Status: {item.status}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {todayPlanner.length > 0 && (() => {
                  const uniqueSubjects = Array.from(
                    new Set(todayPlanner.flatMap((e) => e.subjects ?? []))
                  ).sort();
                  return uniqueSubjects.length > 0 ? (
                    <div className="mt-lg">
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">
                        Today&apos;s subjects
                      </p>
                      <div className="flex gap-[4px] flex-wrap" role="list" aria-label="Today's subjects">
                        {uniqueSubjects.map((sub) => (
                          <span
                            key={sub}
                            role="listitem"
                            aria-label={getSubjectLabel(sub)}
                            className={`w-2 h-2 rounded-full ${SUBJECT_PIP[sub]}`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
            {hasEntries && (
              <div>
                <div className="flex items-center justify-between mb-lg">
                  <h2 className="font-serif text-[1.1rem] font-semibold text-text-primary">
                    {todayEntries.length > 0 ? "Today\u2019s Moments" : 'Recent Moments'}
                  </h2>
                  <Link
                    href={`${basePath}/our-story/portfolio`}
                    className="font-sans text-[0.8rem] font-medium text-ember transition-colors duration-200 hover:text-ember-hover"
                  >
                    See full timeline →
                  </Link>
                </div>
                  <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
                    {(todayEntries.length > 0 ? todayEntries : recentEntries.slice(0, 3)).map(
                      (entry) => (
                        <MomentCard
                          key={entry.id}
                          entry={entry}
                          learners={learners}
                        />
                      )
                    )}
                    {/* Add card */}
                    <Link
                      href={`${basePath}/log`}
                      className="group relative flex flex-col rounded-[16px] border border-dashed border-text-muted p-xl transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:border-ember hover:bg-ember-glow"
                    >
                      <span className="font-sans text-[0.75rem] text-text-muted mb-md">
                        Something we haven&rsquo;t captured?
                      </span>
                      <span className="font-serif text-[1.1rem] font-semibold text-text-muted mb-sm group-hover:text-text-primary transition-colors duration-200">
                        Add another moment
                      </span>
                      <span className="font-serif text-[0.95rem] text-text-muted leading-[1.6]">
                        Learning happens in small ways. What else did you notice today?
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </section>
          )}
      </div>

      {/* ── Right panel (desktop only) ── */}
      <aside className="hidden lg:flex lg:flex-col bg-surface-panel border-l border-border-subtle p-xl">
        {/* Quick Log */}
        <Link
          href={`${basePath}/log`}
          className="flex items-center justify-center gap-md w-full px-lg py-lg bg-ember text-text-inverse rounded-[10px] font-sans text-[0.95rem] font-semibold transition-all duration-200 ease-[var(--ease-default)] shadow-ember hover:bg-ember-hover hover:-translate-y-[2px] hover:shadow-ember-strong mb-2xl"
        >
          <PencilSimpleLine size={18} aria-hidden="true" />
          Log a Moment
        </Link>

        {/* Hearth Voice */}
        {snapshot.hearthVoice && (
          <div className="relative rounded-[16px] border border-border-medium bg-[linear-gradient(135deg,var(--color-surface-raised),var(--color-surface-panel))] p-xl mb-2xl shadow-inset-highlight">
            <div className="absolute left-xl right-xl top-[-1px] h-[2px] bg-[linear-gradient(90deg,transparent,var(--color-ember),transparent)] opacity-60" />
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-ember-glow mb-md shadow-[0_0_12px_rgba(217,123,58,0.2)]">
              <span className="text-ember" aria-hidden="true">
                <Flame size={16} />
              </span>
            </div>
            <p className="font-serif text-[0.95rem] italic leading-[1.65] text-text-secondary">
              &ldquo;{snapshot.hearthVoice}&rdquo;
            </p>
            <p className="mt-md font-sans text-[0.7rem] uppercase tracking-[0.05em] text-text-muted">
              &mdash; Pedagogical Insight
            </p>
          </div>
        )}

        {/* This Week */}
        {weekStats && (
          <div className="mb-2xl">
            <h3 className="font-serif text-base font-semibold text-text-primary mb-lg">
              This Week
            </h3>
            <div className="rounded-[16px] border border-border-subtle bg-surface-raised p-xl shadow-card">
              <WeekStat label="Moments logged" value={weekStats.momentsLogged ?? 0} />
              <WeekStat
                label="Collaborative activities"
                value={weekStats.collaborativeActivities ?? 0}
                positive
              />
              <WeekStat label="New capabilities" value={weekStats.newCapabilities ?? 0} />
              <WeekStat
                label="Evidence collected"
                value={`${weekStats.evidenceCollected ?? 0} items`}
                last
              />
            </div>
          </div>
        )}

        {/* Gentle Prompt */}
        {snapshot.recommendations && snapshot.recommendations.length > 0 && (
          <div className="rounded-[10px] border-l-[3px] border-l-sage-muted bg-[rgba(123,191,138,0.08)] p-lg mb-2xl">
            <p className="font-serif text-[0.9rem] leading-[1.6] text-text-secondary mb-md">
              {snapshot.recommendations[0].title}
            </p>
            <Link
              href={`${basePath}/explore/activities`}
              className="font-sans text-[0.8rem] font-medium text-sage hover:underline inline-flex items-center gap-xs"
            >
              See suggestions →
            </Link>
          </div>
        )}

        {/* Pedagogical Prompt */}
        {pedagogy !== 'eclectic' && (() => {
          const vocab = getPedagogyVocabulary(pedagogy);
          const prompts: Record<string, { prompt: string; tip: string }> = {
            charlotte_mason: {
              prompt: 'What living ideas captured attention today?',
              tip: 'Look for narration moments — when your child retells in their own words, learning is taking root.',
            },
            classical: {
              prompt: 'What was practised or memorised today?',
              tip: 'The grammar stage thrives on repetition and chanting. Even small daily drills compound over time.',
            },
            montessori: {
              prompt: 'What did the child choose to work on?',
              tip: 'Notice periods of deep concentration — these are signs the prepared environment is working.',
            },
            waldorf_steiner: {
              prompt: 'What stories or art shaped today\'s learning?',
              tip: 'Rhythm and beauty support the whole child. Trust the seasonal pace of the main lesson.',
            },
            unschooling: {
              prompt: 'What sparked curiosity today?',
              tip: 'Interest-led doesn\'t mean unintentional. Notice the threads your child keeps returning to.',
            },
          };
          const p = prompts[pedagogy];
          if (!p) return null;
          return (
            <div className="mt-auto rounded-[16px] border border-border-subtle bg-surface-raised p-lg">
              <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-sm">
                {vocab.tagline}
              </p>
              <p className="font-serif text-[0.9rem] leading-[1.6] text-text-secondary italic mb-md">
                &ldquo;{p.prompt}&rdquo;
              </p>
              <p className="font-serif text-[0.8rem] leading-[1.5] text-text-muted">
                {p.tip}
              </p>
            </div>
          );
        })()}
      </aside>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MomentCard({
  entry,
  learners,
}: {
  entry: LearningEntry;
  learners: Learner[];
}) {
  const entryLearners = learners.filter((l) =>
    entry.learnerIds?.includes(l.id)
  );
  const isTogether = entryLearners.length > 1;

  return (
    <div className="group relative overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-card transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] cursor-pointer hover:-translate-y-[2px] hover:border-border-medium hover:shadow-hover">
      {/* Ember top-line on hover */}
      <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,var(--color-ember),transparent)] opacity-0 transition-opacity duration-[var(--motion-gentle)] group-hover:opacity-100" />

      {/* Meta: child avatar + time */}
      <div className="flex items-center gap-sm mb-md">
        {isTogether ? (
          <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-ember-glow text-ember">
            <UsersThree size={14} />
          </div>
        ) : entryLearners.length === 1 ? (
          <div
            className={`flex h-[24px] w-[24px] items-center justify-center rounded-full text-[10px] ${getLearnerColour(entryLearners[0].colourToken).bg} ${getLearnerColour(entryLearners[0].colourToken).text}`}
          >
            {entryLearners[0].shapeIcon ?? '🌟'}
          </div>
        ) : null}
        <span className="font-sans text-[0.75rem] text-text-muted">
          {isTogether
            ? entryLearners.map((l) => l.name).join(' & ')
            : entryLearners[0]?.name ?? ''}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-serif text-[1.1rem] font-semibold text-text-primary mb-sm">
        {entry.title}
      </h3>

      {/* Description */}
      {entry.description && (
        <p className="font-serif text-[0.95rem] leading-[1.6] text-text-secondary line-clamp-2">
          {entry.description}
        </p>
      )}

      {/* Subject badges */}
      {entry.subjects && entry.subjects.length > 0 && (
        <div className="flex gap-sm mt-md flex-wrap">
          {entry.subjects.map((s) => (
            <span
              key={s}
              className="flex items-center gap-xs px-sm py-xs bg-surface-raised rounded-[6px] font-sans text-[0.7rem] text-text-secondary border border-border-subtle"
            >
              {getSubjectLabel(s)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function WeekStat({
  label,
  value,
  positive = false,
  last = false,
}: {
  label: string;
  value: string | number;
  positive?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-md ${
        last ? '' : 'border-b border-border-subtle'
      }`}
    >
      <span className="font-sans text-[0.85rem] text-text-secondary">{label}</span>
      <span
        className={`font-serif text-[1.1rem] font-semibold ${
          positive ? 'text-sage' : 'text-text-primary'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
