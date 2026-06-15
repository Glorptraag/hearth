import { differenceInYears } from 'date-fns';
import { WatchForTodayStrip } from '@/components/logger/WatchForTodayStrip';
import { UsersThree } from '@/components/icons';
import { SectionHeader } from './SectionHeader';
import { CHILD_COLORS } from './childColors';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';
import type { SnapshotData } from '@/types/snapshot';

interface WhoSectionProps {
  learners: LearnerRecord[];
  selectedLearners: string[];
  onToggleLearner: (id: string) => void;
  snapshotData: SnapshotData | null;
  done: boolean;
}

const learnerAge = (l: LearnerRecord) =>
  l.dateOfBirth ? differenceInYears(new Date(), new Date(l.dateOfBirth)) : null;

/**
 * Logger Section 1 — "Who was learning?". The learner chip picker, the
 * multi-child fan-out note (shown once 2+ are selected), and the
 * WatchForTodayStrip below. Extracted verbatim from log/page.tsx; pure
 * presentational, all state lifted to the page.
 *
 * The fan-out note replaced an inert "Learning together" checkbox (it set
 * state nothing read): a multi-child entry already fans out — each child gets
 * their own portfolio record with their own engagement + discovery. The note
 * makes that automatic behaviour legible at capture time (UX compendium
 * UC-L-03 friction; decision D-LPS-9).
 */
export function WhoSection({
  learners,
  selectedLearners,
  onToggleLearner,
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
        <div className="mt-sm flex items-start gap-sm rounded-md border border-border-subtle bg-surface-raised p-sm">
          <UsersThree size={16} className="mt-[1px] shrink-0 text-text-muted" aria-hidden="true" />
          <p className="font-sans text-xs leading-relaxed text-text-secondary">
            Saved to each child&rsquo;s portfolio — rate engagement and add notes for each below.
          </p>
        </div>
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
