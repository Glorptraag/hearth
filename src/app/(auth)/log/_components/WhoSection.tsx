import { differenceInYears } from 'date-fns';
import { WatchForTodayStrip } from '@/components/logger/WatchForTodayStrip';
import { SectionHeader } from './SectionHeader';
import { CHILD_COLORS } from './childColors';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';
import type { SnapshotData } from '@/types/snapshot';

interface WhoSectionProps {
  learners: LearnerRecord[];
  selectedLearners: string[];
  onToggleLearner: (id: string) => void;
  togetherMode: boolean;
  onTogetherModeChange: (value: boolean) => void;
  snapshotData: SnapshotData | null;
  done: boolean;
}

const learnerAge = (l: LearnerRecord) =>
  l.dateOfBirth ? differenceInYears(new Date(), new Date(l.dateOfBirth)) : null;

/**
 * Logger Section 1 — "Who was learning?". The learner chip picker, the
 * "Learning together" toggle (shown once 2+ are selected), and the
 * WatchForTodayStrip below. Extracted verbatim from log/page.tsx; pure
 * presentational, all state lifted to the page.
 */
export function WhoSection({
  learners,
  selectedLearners,
  onToggleLearner,
  togetherMode,
  onTogetherModeChange,
  snapshotData,
  done,
}: WhoSectionProps) {
  return (
    <section>
      <SectionHeader number={1} done={done} label="Who was learning?" />
      <div className="flex flex-wrap gap-sm">
        {learners.map((learner) => {
          const selected = selectedLearners.includes(learner.id);
          const colors = CHILD_COLORS[learner.colourToken ?? 'rose'] ?? CHILD_COLORS.rose;
          const age = learnerAge(learner);
          return (
            <button
              key={learner.id}
              onClick={() => onToggleLearner(learner.id)}
              className={`flex items-center gap-sm rounded-full border-[1.5px] px-md py-sm font-sans text-[0.8125rem] font-medium transition-all duration-200 ease-[var(--ease-default)] select-none ${
                selected
                  ? `${colors.border} bg-ember-glow text-text-primary`
                  : 'border-border-subtle text-text-secondary hover:border-border-medium hover:text-text-primary'
              }`}
            >
              <span className="text-base">{learner.shapeIcon}</span>
              <span>{learner.name}{age !== null ? `, ${age}` : ''}</span>
            </button>
          );
        })}
      </div>
      {selectedLearners.length >= 2 && (
        <label className="mt-sm flex items-center gap-sm font-sans text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={togetherMode}
            onChange={(e) => onTogetherModeChange(e.target.checked)}
            className="accent-ember"
          />
          Learning together
        </label>
      )}
      {/* (b) WatchForTodayStrip — shown below children when selected */}
      {selectedLearners.length > 0 && (
        <div className="mt-md">
          <WatchForTodayStrip
            learners={learners
              .filter((l) => selectedLearners.includes(l.id))
              .map((l) => ({ id: l.id, name: l.name, colourToken: l.colourToken }))}
            snapshotData={snapshotData}
          />
        </div>
      )}
    </section>
  );
}
