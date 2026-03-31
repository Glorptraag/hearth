'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { differenceInYears } from 'date-fns';

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

interface DashboardClientProps {
  familyName: string;
  snapshot: SnapshotData;
  recentEntries: LearningEntry[];
  todayPlanner: PlannerItem[];
  learners: Learner[];
  todayEntryCount: number;
  basePath?: string;
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
  todayPlannerCount: number
): { heading: string; message: string } {
  const firstName = familyName.replace(/ Family$/, '');

  if (timeOfDay === 'evening') {
    if (todayEntryCount > 0) {
      return {
        heading: `A gentle close to the day, <strong>${firstName}</strong>.`,
        message: `Today brought ${todayEntryCount} logged moment${todayEntryCount > 1 ? 's' : ''} of learning. The ${firstName} hearth has been busy with quiet discoveries.`,
      };
    }
    return {
      heading: `Good evening, <strong>${firstName}</strong>.`,
      message: "Quiet day. That\u2019s okay \u2014 every day counts. What did you notice today?",
    };
  }

  if (timeOfDay === 'morning') {
    if (todayPlannerCount > 0) {
      return {
        heading: `Good morning, <strong>${firstName}</strong>.`,
        message: `You have ${todayPlannerCount} session${todayPlannerCount > 1 ? 's' : ''} planned for today. What will the day bring?`,
      };
    }
    return {
      heading: `Good morning, <strong>${firstName}</strong>.`,
      message: "What will today\u2019s learning look like?",
    };
  }

  // afternoon
  if (todayEntryCount === 0) {
    return {
      heading: `Good afternoon, <strong>${firstName}</strong>.`,
      message: "Nothing logged yet today \u2014 capture what you\u2019ve been up to.",
    };
  }
  return {
    heading: `Good afternoon, <strong>${firstName}</strong>.`,
    message: `${todayEntryCount} session${todayEntryCount > 1 ? 's' : ''} logged today. Keep it up!`,
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

const COLOUR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  rose: {
    bg: 'linear-gradient(135deg, rgba(249,168,212,0.15), rgba(249,168,212,0.08))',
    border: 'rgba(249,168,212,0.2)',
    text: 'rgb(249,168,212)',
  },
  blue: {
    bg: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(96,165,250,0.08))',
    border: 'rgba(96,165,250,0.2)',
    text: 'rgb(96,165,250)',
  },
  sage: {
    bg: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(74,222,128,0.08))',
    border: 'rgba(74,222,128,0.2)',
    text: 'rgb(74,222,128)',
  },
  amber: {
    bg: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.08))',
    border: 'rgba(251,191,36,0.2)',
    text: 'rgb(251,191,36)',
  },
};

function getColours(token: string | null) {
  return COLOUR_MAP[token ?? 'rose'] ?? COLOUR_MAP.rose;
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
}: DashboardClientProps) {
  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const timeLabel = useMemo(() => getTimeLabel(), []);
  const { heading, message } = useMemo(
    () => getGreetingMessage(timeOfDay, familyName, todayEntryCount, todayPlanner.length),
    [timeOfDay, familyName, todayEntryCount, todayPlanner.length]
  );

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
          <h1
            className="font-serif text-[2.25rem] font-normal leading-[1.3] text-text-primary mb-lg [&_strong]:font-bold [&_strong]:text-ember"
            dangerouslySetInnerHTML={{ __html: heading }}
          />
          <p className="font-serif text-[1.15rem] leading-[1.7] text-text-secondary max-w-[560px]">
            {message}
          </p>
        </div>

        {/* Empty state — new family */}
        {!hasEntries && (
          <div className="mb-3xl flex flex-col items-center gap-md rounded-[16px] border border-border-subtle bg-surface-panel px-lg py-xl text-center shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
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
              href={`${basePath}/log`}
              className="rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-ember-hover"
            >
              Log your first session
            </Link>
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
                const colours = getColours(l.colourToken);
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
                    className="flex flex-col items-center transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[4px]"
                  >
                    <div
                      className="flex h-[72px] w-[72px] items-center justify-center rounded-full mb-md text-[2rem] border transition-all duration-[400ms]"
                      style={{
                        background: colours.bg,
                        borderColor: colours.border,
                        color: colours.text,
                      }}
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
                  {todayPlanner.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                    >
                      <h3 className="font-serif text-[1.1rem] font-semibold text-text-primary">
                        {item.title}
                      </h3>
                      {item.status && (
                        <p className="font-sans text-[0.85rem] text-text-secondary mt-sm">
                          Status: {item.status}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {todayPlanner.length > 0 && (() => {
                  const uniqueSubjects = Array.from(
                    new Set(todayPlanner.flatMap((e) => e.subjects ?? []))
                  ).sort();
                  return uniqueSubjects.length > 0 ? (
                    <div className="mt-lg">
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">
                        Today's subjects
                      </p>
                      <div className="flex gap-[4px] flex-wrap">
                        {uniqueSubjects.map((sub) => (
                          <span
                            key={sub}
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
                      className="group relative flex flex-col rounded-[16px] border border-dashed border-text-muted p-xl transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-ember hover:bg-ember-glow"
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
          className="flex items-center justify-center gap-md w-full px-lg py-lg bg-ember text-text-inverse rounded-[10px] font-sans text-[0.95rem] font-semibold transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_4px_16px_rgba(217,123,58,0.3),var(--shadow-glow)] hover:bg-ember-hover hover:-translate-y-[2px] hover:shadow-[0_6px_24px_rgba(217,123,58,0.4),0_0_32px_rgba(217,123,58,0.2)] mb-2xl"
        >
          <span className="text-lg">✏️</span>
          Log a Moment
        </Link>

        {/* Hearth Voice */}
        {snapshot.hearthVoice && (
          <div className="relative rounded-[16px] border border-border-medium bg-[linear-gradient(135deg,var(--color-surface-raised),var(--color-surface-panel))] p-xl mb-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="absolute left-xl right-xl top-[-1px] h-[2px] bg-[linear-gradient(90deg,transparent,var(--color-ember),transparent)] opacity-60" />
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-ember-glow mb-md shadow-[0_0_12px_rgba(217,123,58,0.2)]">
              <span className="text-sm text-ember">🔥</span>
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
            <div className="rounded-[16px] border border-border-subtle bg-surface-raised p-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
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
          <div className="mt-auto rounded-[10px] border-l-[3px] border-l-sage-muted bg-[rgba(74,222,128,0.08)] p-lg">
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
    <div className="group relative overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer hover:-translate-y-[2px] hover:border-border-medium hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(217,123,58,0.08)]">
      {/* Ember top-line on hover */}
      <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,var(--color-ember),transparent)] opacity-0 transition-opacity duration-[400ms] group-hover:opacity-100" />

      {/* Meta: child avatar + time */}
      <div className="flex items-center gap-sm mb-md">
        {isTogether ? (
          <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-ember-glow text-[10px] text-ember">
            👥
          </div>
        ) : entryLearners.length === 1 ? (
          <div
            className="flex h-[24px] w-[24px] items-center justify-center rounded-full text-[10px]"
            style={{
              background: getColours(entryLearners[0].colourToken).bg,
              color: getColours(entryLearners[0].colourToken).text,
            }}
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
