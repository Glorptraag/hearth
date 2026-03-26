import { formatDistanceToNow } from 'date-fns';

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
  };
  learners: Learner[];
}

const COLOUR_CHIP: Record<string, string> = {
  rose: 'bg-child-rose/20 text-child-rose',
  blue: 'bg-child-blue/20 text-child-blue',
  sage: 'bg-child-sage/20 text-child-sage',
  violet: 'bg-child-violet/20 text-child-violet',
  amber: 'bg-amber-400/20 text-amber-400',
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
    <div className="flex flex-col gap-sm rounded-[10px] border border-border-subtle bg-surface-panel p-md transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-border-medium hover:bg-surface-raised">
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
      <p className="font-serif text-base font-semibold leading-snug text-text-primary">
        {entry.title}
      </p>

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
