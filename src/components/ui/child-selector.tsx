'use client';

import { differenceInYears } from 'date-fns';

type Learner = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
};

const COLOR_CLASSES: Record<string, { active: string; border: string }> = {
  rose: { active: 'text-child-rose', border: 'border-b-child-rose' },
  blue: { active: 'text-child-blue', border: 'border-b-child-blue' },
  sage: { active: 'text-child-sage', border: 'border-b-child-sage' },
  amber: { active: 'text-amber-status', border: 'border-b-amber-status' },
};

export function ChildSelector({
  learners,
  selectedId,
  onChange,
}: {
  learners: Learner[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-sm overflow-x-auto overscroll-x-contain scrollbar-none border-b border-border-subtle">
      {learners.map((learner) => {
        const active = learner.id === selectedId;
        const age = learner.dateOfBirth
          ? differenceInYears(new Date(), new Date(learner.dateOfBirth))
          : null;
        const colors = COLOR_CLASSES[learner.colourToken ?? ''] ?? COLOR_CLASSES.rose;

        return (
          <button
            key={learner.id}
            onClick={() => onChange(learner.id)}
            className={`flex items-center gap-xs px-md py-sm font-sans text-sm font-medium border-b-2 transition duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
              active
                ? `${colors.active} ${colors.border}`
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>{learner.shapeIcon}</span>
            <span>{learner.name}</span>
            {age !== null && (
              <span className="text-text-muted text-xs">({age})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
