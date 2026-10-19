import Link from 'next/link';
import { differenceInYears } from 'date-fns';
import { UsersThree } from '@/components/icons';
import { LEARNER_COLOUR_MAP } from '@/components/ui/LearnerAvatar';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';
import { noticeCopy } from './noticeCopy';

interface WhoRowProps {
  learners: LearnerRecord[];
  selected: string[];
  failed: boolean;
  onToggle: (id: string) => void;
  onReload: () => void;
}

const learnerAge = (l: LearnerRecord) =>
  l.dateOfBirth ? differenceInYears(new Date(), new Date(l.dateOfBirth)) : null;

/**
 * "Who was learning?" — one chip per child, lit in the child's own colour when
 * selected. Two or more selected shows the fan-out note (each child gets their
 * own story record). Failed and empty states are honest: retry, or go add a
 * child in Settings.
 */
export function WhoRow({ learners, selected, failed, onToggle, onReload }: WhoRowProps) {
  return (
    <section aria-labelledby="notice-who">
      <h2 id="notice-who" className="heading mb-sm font-serif text-base font-semibold text-text-primary">
        {noticeCopy.who}
      </h2>

      {failed ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-sm rounded-md border border-border-subtle bg-surface-raised p-md"
        >
          <p className="font-sans text-sm text-text-secondary">{noticeCopy.learnersFailed}</p>
          <button
            type="button"
            onClick={onReload}
            className="hearth-press min-h-[44px] rounded-sm border border-border-subtle bg-transparent px-md font-sans text-sm font-medium text-text-secondary hover:border-border-medium hover:text-text-primary"
          >
            {noticeCopy.learnersRetry}
          </button>
        </div>
      ) : learners.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-sm rounded-md border border-border-subtle bg-surface-raised p-md">
          <p className="font-sans text-sm text-text-secondary">{noticeCopy.noLearners}</p>
          <Link
            href="/settings"
            className="hearth-press inline-flex min-h-[44px] items-center rounded-sm border border-border-subtle px-md font-sans text-sm font-medium text-text-secondary hover:border-border-medium hover:text-text-primary"
          >
            {noticeCopy.noLearnersAction}
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-sm">
          {learners.map((learner) => {
            const isSelected = selected.includes(learner.id);
            const colour = LEARNER_COLOUR_MAP[learner.colourToken ?? 'rose'] ?? LEARNER_COLOUR_MAP.rose;
            const age = learnerAge(learner);
            return (
              <button
                key={learner.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(learner.id)}
                className={`hearth-press flex min-h-[44px] select-none items-center gap-sm rounded-full border-[1.5px] px-md py-sm font-sans text-[0.8125rem] font-medium ${
                  isSelected
                    ? `${colour.border} ${colour.bg} ${colour.text}`
                    : 'border-border-subtle text-text-secondary hover:border-border-medium hover:text-text-primary'
                }`}
              >
                {learner.shapeIcon && (
                  <span className="text-base" aria-hidden="true">
                    {learner.shapeIcon}
                  </span>
                )}
                <span>
                  {learner.name}
                  {age !== null ? `, ${age}` : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected.length >= 2 && (
        <div className="mt-sm flex items-start gap-sm rounded-md border border-border-subtle bg-surface-raised p-sm">
          <UsersThree size={16} className="mt-[1px] shrink-0 text-text-muted" aria-hidden="true" />
          <p className="font-sans text-xs leading-relaxed text-text-secondary">{noticeCopy.multiChildNote}</p>
        </div>
      )}
    </section>
  );
}
