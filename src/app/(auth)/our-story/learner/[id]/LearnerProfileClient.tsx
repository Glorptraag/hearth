'use client';

import { useRouter } from 'next/navigation';
import CapabilityBar from '@/components/learner/CapabilityBar';
import BadgeChip from '@/components/learner/BadgeChip';
import { formatDistanceToNow } from 'date-fns';

interface LearningEntry {
  id: string;
  title: string;
  description: string | null;
  dateOccurred: string;
  subjects: string[] | null;
}

interface CapabilityDomain {
  domain: string;
  emoji: string;
  count: number;
  colorClass: string;
}

interface BadgeAward {
  id: string;
  badgeTitle: string;
  badgeEmoji: string | null;
  awardedAt: Date | null;
  notes: string | null;
}

interface LearnerProfileClientProps {
  learner: {
    id: string;
    name: string;
    colourToken: string | null;
  };
  stats: {
    entriesThisMonth: number;
    activeStreak: number;
    capabilitiesCount: number;
    badgesCount: number;
  };
  capabilityDomains: CapabilityDomain[];
  recentEntries: LearningEntry[];
  badges: BadgeAward[];
}

const COLOUR_STYLES: Record<string, { chip: string; header: string; dot: string }> = {
  rose: {
    chip: 'bg-child-rose/20 text-child-rose',
    header: 'from-child-rose/10',
    dot: 'bg-child-rose',
  },
  blue: {
    chip: 'bg-child-blue/20 text-child-blue',
    header: 'from-child-blue/10',
    dot: 'bg-child-blue',
  },
  sage: {
    chip: 'bg-child-sage/20 text-child-sage',
    header: 'from-child-sage/10',
    dot: 'bg-child-sage',
  },
  violet: {
    chip: 'bg-child-violet/20 text-child-violet',
    header: 'from-child-violet/10',
    dot: 'bg-child-violet',
  },
  amber: {
    chip: 'bg-amber-400/20 text-amber-400',
    header: 'from-amber-400/10',
    dot: 'bg-amber-400',
  },
};

const SUBJECT_CHIP: Record<string, string> = {
  english: 'bg-domain-english/15 text-domain-english',
  mathematics: 'bg-domain-mathematics/15 text-domain-mathematics',
  science: 'bg-domain-science/15 text-domain-science',
  hass: 'bg-domain-hass/15 text-domain-hass',
  arts: 'bg-domain-arts/15 text-domain-arts',
  technologies: 'bg-domain-technologies/15 text-domain-technologies',
  hpe: 'bg-domain-hpe/15 text-domain-hpe',
  languages: 'bg-domain-languages/15 text-domain-languages',
};

export default function LearnerProfileClient({
  learner,
  stats,
  capabilityDomains,
  recentEntries,
  badges,
}: LearnerProfileClientProps) {
  const router = useRouter();
  const colour = COLOUR_STYLES[learner.colourToken ?? ''] ?? COLOUR_STYLES.rose;
  const maxCount = Math.max(...capabilityDomains.map((d) => d.count), 1);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className={`bg-gradient-to-b ${colour.header} to-transparent px-md pb-lg pt-xl`}>
        <button
          onClick={() => router.back()}
          className="mb-lg flex items-center gap-xs font-sans text-xs text-text-muted transition-colors hover:text-text-secondary"
        >
          ← Back
        </button>

        <div className="flex items-center gap-md">
          <div
            className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full ${colour.dot}`}
          >
            <span className="font-serif text-2xl font-semibold text-white/90">
              {learner.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-text-primary">
              {learner.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-md pb-xl">
        {/* Stats row */}
        <div className="mb-xl grid grid-cols-4 gap-sm">
          {[
            { label: 'This month', value: stats.entriesThisMonth, emoji: '📝' },
            { label: 'Day streak', value: stats.activeStreak, emoji: '🔥' },
            { label: 'Capabilities', value: stats.capabilitiesCount, emoji: '🧵' },
            { label: 'Badges', value: stats.badgesCount, emoji: '🏅' },
          ].map(({ label, value, emoji }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-xs rounded-[10px] border border-border-subtle bg-surface-panel py-sm"
            >
              <span className="text-lg">{emoji}</span>
              <p className="font-sans text-xl font-semibold text-text-primary">{value}</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.06em] text-text-muted">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Capability thread coverage */}
        {capabilityDomains.length > 0 && (
          <section className="mb-xl">
            <h2 className="mb-md font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
              Capability Coverage
            </h2>
            <div className="flex flex-col gap-md rounded-[10px] border border-border-subtle bg-surface-panel p-md">
              {capabilityDomains.map((d) => (
                <CapabilityBar
                  key={d.domain}
                  domain={d.domain}
                  emoji={d.emoji}
                  count={d.count}
                  maxCount={maxCount}
                  colorClass={d.colorClass}
                />
              ))}
            </div>
          </section>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <section className="mb-xl">
            <h2 className="mb-md font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
              Badges Earned
            </h2>
            <div className="grid grid-cols-3 gap-sm sm:grid-cols-4">
              {badges.map((b) => (
                <BadgeChip key={b.id} badge={b} />
              ))}
            </div>
          </section>
        )}

        {/* Recent entries */}
        <section>
          <h2 className="mb-md font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
            Recent Learning
          </h2>
          {recentEntries.length === 0 ? (
            <div className="rounded-[10px] border border-border-subtle bg-surface-panel px-md py-lg text-center">
              <p className="font-serif text-base text-text-secondary">
                No entries logged yet for {learner.name}.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-sm">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-xs rounded-[10px] border border-border-subtle bg-surface-panel p-md transition-all duration-[400ms] hover:border-border-medium hover:bg-surface-raised"
                >
                  <div className="flex items-start justify-between gap-sm">
                    <p className="font-serif text-base font-semibold text-text-primary">
                      {entry.title}
                    </p>
                    <span className="flex-shrink-0 font-sans text-[11px] text-text-muted">
                      {(() => {
                        try {
                          return formatDistanceToNow(new Date(entry.dateOccurred), {
                            addSuffix: true,
                          });
                        } catch {
                          return entry.dateOccurred;
                        }
                      })()}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="line-clamp-2 font-serif text-sm text-text-secondary">
                      {entry.description}
                    </p>
                  )}
                  {entry.subjects && entry.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-xs">
                      {entry.subjects.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className={`rounded-[6px] px-sm py-[2px] font-sans text-[10px] font-semibold uppercase tracking-[0.06em] ${
                            SUBJECT_CHIP[s] ?? 'bg-surface-raised text-text-muted'
                          }`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
