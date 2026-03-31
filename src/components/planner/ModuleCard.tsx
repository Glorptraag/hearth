interface Learner {
  id: string;
  name: string;
  colourToken: string | null;
}

interface ModuleCardProps {
  entry: {
    id: string;
    title: string | null;
    status: string | null;
    moduleId: string | null;
    learnerIds: string[] | null;
    subjects: string[] | null;
  };
  learners: Learner[];
  isReadOnly?: boolean;
  onToggle: (id: string, currentStatus: string | null) => void;
  onDelete: (id: string) => void;
}

const COLOUR_DOT: Record<string, string> = {
  rose: 'bg-child-rose',
  blue: 'bg-child-blue',
  sage: 'bg-child-sage',
  violet: 'bg-child-violet',
  amber: 'bg-amber-400',
};

const SUBJECT_CHIP: Record<string, string> = {
  english:      'bg-domain-english/15 text-domain-english',
  mathematics:  'bg-domain-mathematics/15 text-domain-mathematics',
  science:      'bg-domain-science/15 text-domain-science',
  hass:         'bg-domain-hass/15 text-domain-hass',
  arts:         'bg-domain-arts/15 text-domain-arts',
  technologies: 'bg-domain-technologies/15 text-domain-technologies',
  hpe:          'bg-domain-hpe/15 text-domain-hpe',
  languages:    'bg-domain-languages/15 text-domain-languages',
};

const SUBJECT_LABELS: Record<string, string> = {
  english: 'English',
  mathematics: 'Maths',
  science: 'Science',
  hass: 'HASS',
  arts: 'Arts',
  technologies: 'Tech',
  hpe: 'HPE',
  languages: 'Lang',
};

export default function ModuleCard({
  entry,
  learners,
  isReadOnly = false,
  onToggle,
  onDelete,
}: ModuleCardProps) {
  const entryLearners = learners.filter((l) => entry.learnerIds?.includes(l.id));
  const isComplete = entry.status === 'completed';
  const primarySubject = entry.subjects?.[0] ?? null;

  return (
    <div
      className={`group relative flex flex-col gap-xs rounded-md border overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isComplete
          ? 'border-border-subtle bg-[linear-gradient(135deg,rgba(74,222,128,0.04),transparent)] opacity-55'
          : 'border-border-subtle bg-surface-raised hover:border-border-medium hover:shadow-[var(--shadow-soft)] hover:-translate-y-[1px]'
      }`}
    >
      {/* Ember top-line on hover */}
      {!isComplete && (
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,var(--color-ember),transparent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      )}

      <div className="p-sm pt-[6px]">
        {/* Subject chip */}
        {primarySubject && (
          <span className={`inline-block rounded-full px-[5px] py-[1px] font-sans text-[9px] font-semibold mb-[3px] ${SUBJECT_CHIP[primarySubject] ?? 'bg-surface-hover text-text-muted'}`}>
            {SUBJECT_LABELS[primarySubject] ?? primarySubject}
          </span>
        )}

        {/* Delete button */}
        {!isReadOnly && (
          <button
            onClick={() => onDelete(entry.id)}
            className="absolute right-xs top-xs hidden h-4 w-4 items-center justify-center rounded font-sans text-[10px] text-text-muted transition-colors hover:text-red-400 group-hover:flex"
            aria-label="Remove"
          >
            ✕
          </button>
        )}

        {/* Status dot + title */}
        <button
          onClick={() => !isReadOnly && onToggle(entry.id, entry.status)}
          disabled={isReadOnly}
          className="flex items-start gap-xs text-left w-full"
        >
          <span
            className={`mt-[3px] h-[8px] w-[8px] flex-shrink-0 rounded-full transition-colors ${
              isComplete
                ? 'bg-sage'
                : entry.status === 'in_progress'
                  ? 'bg-ember'
                  : 'border border-border-medium bg-transparent'
            }`}
          />
          <span
            className={`font-sans text-[0.6875rem] font-medium leading-snug ${
              isComplete ? 'text-text-muted line-through' : 'text-text-primary'
            }`}
          >
            {entry.title ?? 'Untitled'}
          </span>
        </button>

        {/* Learner dots */}
        {entryLearners.length > 0 && (
          <div className="flex gap-xs pl-[12px] mt-xs">
            {entryLearners.map((l) => (
              <span
                key={l.id}
                className={`h-[6px] w-[6px] rounded-full ${COLOUR_DOT[l.colourToken ?? ''] ?? 'bg-surface-hover'}`}
                title={l.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
