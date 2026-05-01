import { formatDistanceToNow } from 'date-fns';
import { Flame } from '@/components/icons';

interface Learner {
  id: string;
  name: string;
  colourToken: string | null;
}

interface RecentEntryCardProps {
  entry: {
    id: string;
    title: string;
    description: string | null;
    dateOccurred: string;
    subjects: string[] | null;
    learnerIds: string[] | null;
    source: string;
  };
  learners: Learner[];
}

const COLOUR_CHIP: Record<string, string> = {
  rose: 'bg-child-rose/20 text-child-rose',
  blue: 'bg-child-blue/20 text-child-blue',
  sage: 'bg-child-sage/20 text-child-sage',
  violet: 'bg-child-violet/20 text-child-violet',
  amber: 'bg-amber-status/20 text-amber-status',
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

export default function RecentEntryCard({ entry, learners }: RecentEntryCardProps) {
  const entryLearners = learners.filter((l) => entry.learnerIds?.includes(l.id));

  const dateLabel = (() => {
    try {
      return formatDistanceToNow(new Date(entry.dateOccurred), { addSuffix: true });
    } catch {
      return entry.dateOccurred;
    }
  })();

  return (
    <div className="flex flex-col gap-sm rounded-[10px] border border-border-subtle bg-surface-panel p-md transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:border-border-medium hover:bg-surface-raised">
      {/* Learner chips + timestamp */}
      <div className="flex items-center justify-between gap-sm">
        <div className="flex flex-wrap gap-xs">
          {entryLearners.map((l) => (
            <span
              key={l.id}
              className={`rounded-full px-sm py-[2px] font-sans text-[11px] font-semibold ${
                COLOUR_CHIP[l.colourToken ?? ''] ?? 'bg-surface-raised text-text-secondary'
              }`}
            >
              {l.name}
            </span>
          ))}
          {entryLearners.length === 0 && (
            <span className="rounded-full bg-surface-raised px-sm py-[2px] font-sans text-[11px] text-text-muted">
              Family
            </span>
          )}
        </div>
        <span className="font-sans text-[11px] text-text-muted">{dateLabel}</span>
      </div>

      {/* Title */}
      <div className="flex items-center gap-sm">
        <p className="font-serif text-base font-semibold leading-snug text-text-primary">
          {entry.title}
        </p>
        {entry.source === 'hearth_session' && (
          <span className="inline-flex items-center gap-xs px-2 py-0.5 bg-ember/[0.08] text-ember border border-ember/15 rounded-[6px] font-sans text-[0.65rem] font-medium">
            <Flame size={12} aria-hidden="true" /> From community
          </span>
        )}
      </div>

      {/* Description */}
      {entry.description && (
        <p className="line-clamp-2 font-serif text-sm text-text-secondary">
          {entry.description}
        </p>
      )}

      {/* Subject tags */}
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
  );
}
