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

function nextStatus(current: string | null): 'planned' | 'in_progress' | 'completed' {
  if (current === 'completed') return 'planned';
  if (current === 'in_progress') return 'completed';
  return 'in_progress';
}

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
      className={`group relative flex flex-col gap-xs rounded-[6px] border p-sm transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isComplete
          ? 'border-border-subtle bg-surface-body opacity-60'
          : 'border-border-subtle bg-surface-raised hover:border-border-medium'
      }`}
    >
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
        className="flex items-start gap-xs text-left"
      >
        <span
          className={`mt-[3px] h-2 w-2 flex-shrink-0 rounded-full transition-colors ${
            isComplete
              ? 'bg-sage'
              : entry.status === 'in_progress'
                ? 'bg-ember'
                : 'border border-border-medium bg-transparent'
          }`}
        />
        <span
          className={`font-sans text-xs leading-snug ${
            isComplete ? 'text-text-muted line-through' : 'text-text-primary'
          }`}
        >
          {entry.title ?? 'Untitled'}
        </span>
      </button>

      {/* Learner dots */}
      {entryLearners.length > 0 && (
        <div className="flex gap-xs pl-[12px]">
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
  );
}
