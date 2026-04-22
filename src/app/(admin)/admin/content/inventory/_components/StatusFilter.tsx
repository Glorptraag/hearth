'use client';

const STATUSES = ['planned', 'briefed', 'created', 'reviewed', 'active', 'archived'] as const;

interface Props {
  counts: Record<string, number>;
  active: Set<string>;
  onToggle: (status: string) => void;
}

export default function StatusFilter({ counts, active, onToggle }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((s) => {
        const count = counts[s] ?? 0;
        const isActive = active.has(s);
        return (
          <button
            key={s}
            type="button"
            onClick={() => onToggle(s)}
            className={`px-3 py-1.5 rounded-[6px] border text-xs font-sans font-semibold uppercase tracking-wider transition-colors duration-200 ${
              isActive
                ? 'border-ember text-ember bg-ember-glow'
                : 'border-border-subtle text-text-secondary bg-transparent hover:border-border-medium'
            }`}
          >
            {s} ({count})
          </button>
        );
      })}
    </div>
  );
}
