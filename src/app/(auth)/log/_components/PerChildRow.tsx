import { LEARNER_COLOUR_MAP } from '@/components/ui/LearnerAvatar';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';
import { FELT_LEVELS, type FeltLevel } from '@/lib/logger/notice';
import { noticeCopy } from './noticeCopy';

interface PerChildRowProps {
  learner: LearnerRecord;
  felt: FeltLevel | undefined;
  noticed: string;
  onFelt: (level: FeltLevel) => void;
  onNoticed: (text: string) => void;
}

/**
 * One row per selected child: how it felt (four chips, a radiogroup — tapping
 * the lit one sends the same level again and the reducer clears it) and a
 * single line for what they said, asked or noticed.
 */
export function PerChildRow({ learner, felt, noticed, onFelt, onNoticed }: PerChildRowProps) {
  const colour = LEARNER_COLOUR_MAP[learner.colourToken ?? 'rose'] ?? LEARNER_COLOUR_MAP.rose;
  const groupId = `felt-${learner.id}`;
  return (
    <section
      aria-labelledby={groupId}
      className="hearth-reveal rounded-md border border-border-subtle bg-surface-panel p-md"
    >
      <div className="mb-sm flex items-center gap-sm">
        <span className={`h-[10px] w-[10px] shrink-0 rounded-full ${colour.dot}`} aria-hidden="true" />
        <h3 id={groupId} className="heading font-serif text-[0.9375rem] font-semibold text-text-primary">
          {noticeCopy.felt(learner.name)}
        </h3>
      </div>

      <div role="radiogroup" aria-labelledby={groupId} className="flex flex-wrap gap-sm">
        {FELT_LEVELS.map(({ value, label }) => {
          const checked = felt === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onFelt(value)}
              className={`hearth-press min-h-[44px] rounded-full border-[1.5px] px-md py-sm font-sans text-[0.8125rem] font-medium ${
                checked
                  ? 'border-border-active bg-surface-raised text-text-primary'
                  : 'border-border-subtle text-text-secondary hover:border-border-medium hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <input
        type="text"
        value={noticed}
        onChange={(e) => onNoticed(e.target.value)}
        placeholder={noticeCopy.noticedPlaceholder(learner.name)}
        aria-label={noticeCopy.noticedLabel(learner.name)}
        className="mt-md w-full min-h-[44px] rounded-md border border-border-subtle bg-surface-input px-md py-sm font-serif text-[0.9375rem] text-text-primary leading-[1.6] placeholder:text-text-muted focus:border-ember focus:outline-none focus:shadow-focus transition-[border-color,box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-default)]"
      />
    </section>
  );
}
