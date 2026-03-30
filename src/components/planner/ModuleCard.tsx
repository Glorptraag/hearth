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

export default function ModuleCard({
  entry,
  learners,
  isReadOnly = false,
  onToggle,
  onDelete,
}: ModuleCardProps) {
  const entryLearners = learners.filter((l) => entry.learnerIds?.includes(l.id));
  const isComplete = entry.status === 'completed';

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
