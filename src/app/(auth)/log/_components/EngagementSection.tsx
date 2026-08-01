import { SectionHeader } from './SectionHeader';
import { CHILD_COLORS } from './childColors';
import { ENGAGEMENT_LEVELS } from './loggerConstants';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';

interface EngagementSectionProps {
  done: boolean;
  learners: LearnerRecord[];
  selectedLearners: string[];
  engagement: Record<string, number>;
  onEngagementChange: (id: string, value: number) => void;
}

const colorsFor = (colourToken: string | null | undefined) =>
  CHILD_COLORS[colourToken ?? 'rose'] ?? CHILD_COLORS.rose;

/**
 * Logger Section 3 — "How engaged were they?". A per-child row of 1–4 emoji
 * rating buttons (optional). Extracted verbatim from log/page.tsx; pure
 * presentational, state lifted to the page.
 */
export function EngagementSection({
  done,
  learners,
  selectedLearners,
  engagement,
  onEngagementChange,
}: EngagementSectionProps) {
  return (
    <section>
      <SectionHeader number={3} done={done} label="How engaged were they?" optional="Rate each child" />
      {selectedLearners.length === 0 ? (
        <p className="font-serif text-sm italic text-text-muted">
          Select children first
        </p>
      ) : (
        <div className="space-y-sm">
          {selectedLearners.map((id) => {
            const learner = learners.find((l) => l.id === id);
            if (!learner) return null;
            const colors = colorsFor(learner.colourToken);
            return (
              <div key={id} className={`flex items-center justify-between gap-md rounded-md border ${colors.border} ${colors.bg} px-md py-sm`}>
                <div className="flex items-center gap-sm">
                  <span className={`h-[10px] w-[10px] rounded-full ${colors.border.replace('border', 'bg')} shrink-0`} />
                  <span className="font-sans text-[0.875rem] font-semibold text-text-primary">{learner.name}</span>
                </div>
                <div className="flex gap-xs">
                  {ENGAGEMENT_LEVELS.map((level) => {
                    const selected = engagement[id] === level.value;
                    return (
                      <button
                        key={level.value}
                        onClick={() => onEngagementChange(id, level.value)}
                        title={level.label}
                        className={`flex h-[40px] w-[40px] items-center justify-center rounded-sm border-[1.5px] text-[1.125rem] transition-[background-color,border-color,opacity] duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
                          selected
                            ? `hearth-engagement-select ${colors.bg} ${colors.border} opacity-100`
                            : 'hearth-engagement-not-selected bg-surface-body border-border-subtle hover:opacity-100 hover:border-border-medium'
                        }`}
                      >
                        {level.emoji}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
