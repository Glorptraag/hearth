import { SectionHeader } from './SectionHeader';
import { OBSERVATION_CATEGORIES, OBS_COLOR_CLASSES } from './loggerConstants';
import {
  ObservationChipDetail,
  DETAIL_CHIPS,
  type ChipDetailValue,
} from '@/components/logger/ObservationChipDetail';

interface ObserveSectionProps {
  done: boolean;
  label: string;
  observations: string[];
  observationDetails: Record<string, ChipDetailValue>;
  /** Toggle a chip on/off (the page also clears its detail when deselecting). */
  onToggleObservation: (chip: string) => void;
  onObservationDetailChange: (chip: string, value: ChipDetailValue) => void;
  /** Guided mode unlocks the per-chip detail editor for detail-bearing chips. */
  isGuided: boolean;
}

/**
 * Logger Section 5 — "What did you observe?". Chips grouped by lens
 * (Engagement / Social / Thinking / Emotional); in Guided mode a selected
 * detail-bearing chip reveals an ObservationChipDetail editor. Extracted
 * verbatim from log/page.tsx; pure presentational, state lifted to the page.
 */
export function ObserveSection({
  done,
  label,
  observations,
  observationDetails,
  onToggleObservation,
  onObservationDetailChange,
  isGuided,
}: ObserveSectionProps) {
  return (
    <section>
      <SectionHeader number={5} done={done} label={label} />
      <div className="space-y-md">
        {OBSERVATION_CATEGORIES.map((cat) => {
          const colorClasses = OBS_COLOR_CLASSES[cat.color] ?? OBS_COLOR_CLASSES['child-sage'];
          return (
            <div key={cat.label}>
              <div className="flex items-center gap-sm mb-sm">
                <div className={`h-[8px] w-[8px] rounded-full ${colorClasses.dot}`} />
                <span className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
                  {cat.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-xs">
                {cat.chips.map((chip) => {
                  const sel = observations.includes(chip);
                  return (
                    <div key={chip}>
                      <button
                        onClick={() => onToggleObservation(chip)}
                        className={`rounded-full px-sm py-xs font-sans text-xs transition-all duration-200 min-h-[32px] ${
                          sel
                            ? `${colorClasses.selectedBg} border ${colorClasses.selectedBorder} text-text-primary`
                            : 'border border-border-subtle text-text-secondary hover:border-border-medium'
                        }`}
                      >
                        {chip}
                      </button>
                      {isGuided && sel && DETAIL_CHIPS.has(chip) && (
                        <ObservationChipDetail
                          chip={chip}
                          value={observationDetails[chip] ?? { detail: '' }}
                          onChange={(val) => onObservationDetailChange(chip, val)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
