import { SectionHeader } from './SectionHeader';
import { DURATION_OPTIONS, WHERE_OPTIONS } from './loggerConstants';

type WhenValue = 'today' | 'yesterday' | 'earlier';

interface WhenWhereSectionProps {
  done: boolean;
  whenDate: WhenValue;
  onWhenDateChange: (value: WhenValue) => void;
  duration: string | null;
  onDurationChange: (value: string | null) => void;
  location: string | null;
  onLocationChange: (value: string | null) => void;
}

/**
 * Logger Section 4 — "When & Where". Three chip groups: when (today/
 * yesterday/earlier), duration, and location. Duration and location toggle
 * off when re-tapped. Extracted verbatim from log/page.tsx; pure
 * presentational, state lifted to the page.
 */
export function WhenWhereSection({
  done,
  whenDate,
  onWhenDateChange,
  duration,
  onDurationChange,
  location,
  onLocationChange,
}: WhenWhereSectionProps) {
  return (
    <section>
      <SectionHeader number={4} done={done} label="When & Where" />
      <div className="flex flex-wrap gap-md">
        {/* When */}
        <div className="flex-1 min-w-[140px]">
          <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">When</p>
          <div className="flex flex-wrap gap-xs">
            {(['today', 'yesterday', 'earlier'] as const).map((w) => (
              <button
                key={w}
                onClick={() => onWhenDateChange(w)}
                className={`hearth-press min-h-[36px] rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium whitespace-nowrap ${
                  whenDate === w
                    ? 'bg-ember-glow border border-ember text-text-primary'
                    : 'bg-surface-body border border-border-subtle text-text-muted hover:border-border-medium hover:text-text-secondary'
                }`}
              >
                {w.charAt(0).toUpperCase() + w.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="flex-1 min-w-[140px]">
          <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Duration</p>
          <div className="flex flex-wrap gap-xs">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => onDurationChange(duration === d ? null : d)}
                className={`hearth-press min-h-[36px] rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium whitespace-nowrap ${
                  duration === d
                    ? 'bg-ember-glow border border-ember text-text-primary'
                    : 'bg-surface-body border border-border-subtle text-text-muted hover:border-border-medium hover:text-text-secondary'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Where */}
        <div className="flex-1 min-w-[140px]">
          <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Where</p>
          <div className="flex flex-wrap gap-xs">
            {WHERE_OPTIONS.map((w) => (
              <button
                key={w.key}
                onClick={() => onLocationChange(location === w.key ? null : w.key)}
                className={`hearth-press min-h-[36px] rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium whitespace-nowrap ${
                  location === w.key
                    ? 'bg-ember-glow border border-ember text-text-primary'
                    : 'bg-surface-body border border-border-subtle text-text-muted hover:border-border-medium hover:text-text-secondary'
                }`}
              >
                <span className="inline-flex items-center gap-xs"><w.Icon size={14} aria-hidden="true" /> {w.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
