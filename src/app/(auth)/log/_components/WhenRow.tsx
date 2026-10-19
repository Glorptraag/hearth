import { useState } from 'react';
import { dateForKind, resolveDateOccurred, todayIso, whenKindFor, type WhenKind } from '@/lib/logger/notice';
import { noticeCopy } from './noticeCopy';

interface WhenRowProps {
  dateOccurred: string | null;
  onChange: (dateOccurred: string | null) => void;
  now?: Date;
}

const SEGMENTS: ReadonlyArray<{ kind: WhenKind; label: string }> = [
  { kind: 'today', label: noticeCopy.today },
  { kind: 'yesterday', label: noticeCopy.yesterday },
  { kind: 'other', label: noticeCopy.anotherDay },
];

/**
 * "When?" — Today · Yesterday · Another day. The lit segment is derived from
 * the stored date (never stored itself); "Another day" reveals a native date
 * input capped at today. The only local state is whether the parent has opened
 * the picker without choosing yet, so it can show while the stored date is
 * still today. No hidden offsets.
 */
export function WhenRow({ dateOccurred, onChange, now = new Date() }: WhenRowProps) {
  const [picking, setPicking] = useState(false);
  const stored = whenKindFor(dateOccurred, now);
  const kind: WhenKind = stored === 'other' || picking ? 'other' : stored;
  const today = todayIso(now);

  const select = (next: WhenKind) => {
    setPicking(next === 'other');
    if (next === 'today') onChange(null);
    else if (next === 'yesterday') onChange(dateForKind('yesterday', now));
  };

  return (
    <section aria-labelledby="notice-when">
      <h2 id="notice-when" className="heading mb-sm font-serif text-base font-semibold text-text-primary">
        {noticeCopy.when}
      </h2>
      <div className="flex flex-wrap gap-sm">
        {SEGMENTS.map((seg) => {
          const lit = kind === seg.kind;
          return (
            <button
              key={seg.kind}
              type="button"
              aria-pressed={lit}
              onClick={() => select(seg.kind)}
              className={`hearth-press min-h-[44px] rounded-full border-[1.5px] px-md py-sm font-sans text-[0.8125rem] font-medium ${
                lit
                  ? 'border-border-active bg-surface-raised text-text-primary'
                  : 'border-border-subtle text-text-secondary hover:border-border-medium hover:text-text-primary'
              }`}
            >
              {seg.label}
            </button>
          );
        })}
      </div>
      {kind === 'other' && (
        <input
          type="date"
          max={today}
          value={resolveDateOccurred(dateOccurred, now)}
          onChange={(e) => onChange(e.target.value || null)}
          aria-label={noticeCopy.pickDate}
          className="hearth-reveal mt-sm block min-h-[44px] rounded-md border border-border-subtle bg-surface-input px-md py-sm font-sans text-sm text-text-primary focus:border-ember focus:outline-none focus:shadow-focus transition-[border-color,box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-default)]"
        />
      )}
    </section>
  );
}
