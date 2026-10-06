import { format, subDays } from 'date-fns';
import { SectionHeader } from './SectionHeader';
import { DURATION_OPTIONS, WHERE_OPTIONS } from './loggerConstants';

type WhenValue = 'today' | 'yesterday' | 'earlier';

/** How far back the inline picker reaches; older moments go through Batch log. */
export const EARLIER_MAX_DAYS_BACK = 30;

/** The date the picker opens on when "Earlier" is first chosen — the day
 *  before yesterday, since today and yesterday have their own chips. */
export function defaultEarlierDate(now: Date = new Date()): string {
  return format(subDays(now, 2), 'yyyy-MM-dd');
}

interface WhenWhereSectionProps {
  done: boolean;
  whenDate: WhenValue;
  onWhenDateChange: (value: WhenValue) => void;
  /** yyyy-MM-dd chosen for "Earlier"; null until the parent picks one. */
  earlierDate?: string | null;
  onEarlierDateChange?: (value: string) => void;
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
  earlierDate = null,
  onEarlierDateChange,
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
                type="button"
                aria-pressed={whenDate === w}
                onClick={() => {
                  onWhenDateChange(w);
                  // Seed the picker the first time "Earlier" is chosen so the
                  // saved date is always one the parent can see and change —
                  // never a hidden default.
                  if (w === 'earlier' && !earlierDate) onEarlierDateChange?.(defaultEarlierDate());
                }}
                className={`hearth-press min-h-[36px] rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
                  whenDate === w
                    ? 'bg-ember-glow border border-ember text-text-primary'
                    : 'bg-surface-body border border-border-subtle text-text-muted hover:border-border-medium hover:text-text-secondary'
                }`}
              >
                {w.charAt(0).toUpperCase() + w.slice(1)}
              </button>
            ))}
          </div>
          {whenDate === 'earlier' && (() => {
            const today = new Date();
            const max = format(today, 'yyyy-MM-dd');
            const min = format(subDays(today, EARLIER_MAX_DAYS_BACK), 'yyyy-MM-dd');
            return (
              <div className="mt-sm">
                <label htmlFor="log-earlier-date" className="sr-only">Date it happened</label>
                <input
                  id="log-earlier-date"
                  type="date"
                  value={earlierDate ?? defaultEarlierDate(today)}
                  min={min}
                  max={max}
                  onChange={(e) => { if (e.target.value) onEarlierDateChange?.(e.target.value); }}
                  className="min-h-[36px] w-full max-w-[200px] rounded-sm border border-border-subtle bg-surface-input px-sm py-xs font-sans text-[0.8rem] text-text-primary transition-[border-color] duration-[var(--motion-quick)] ease-[var(--ease-default)] focus:border-border-focus focus:outline-none"
                />
                <p className="mt-xs font-sans text-[0.7rem] text-text-muted">
                  Up to {EARLIER_MAX_DAYS_BACK} days back. For older moments, use Batch log.
                </p>
              </div>
            );
          })()}
        </div>

        {/* Duration */}
        <div className="flex-1 min-w-[140px]">
          <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Duration</p>
          <div className="flex flex-wrap gap-xs">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => onDurationChange(duration === d ? null : d)}
                className={`hearth-press min-h-[36px] rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
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
                className={`hearth-press min-h-[36px] rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
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
