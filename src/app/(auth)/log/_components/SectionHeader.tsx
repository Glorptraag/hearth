import { Check } from '@/components/icons';

/**
 * Section chrome for the Logger form — the numbered step indicator, its header
 * row, and the completeness ring shown in the save bar. Extracted verbatim from
 * log/page.tsx; these are pure presentational components with no Logger state.
 */

export function SectionIndicator({ number, done }: { number: number; done: boolean }) {
  return (
    <div
      className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full font-sans text-[0.6875rem] font-semibold transition duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
        done ? 'bg-ember border border-ember text-text-inverse' : 'bg-surface-raised border border-border-subtle text-text-muted'
      }`}
    >
      {done ? <Check size={14} aria-hidden="true" /> : number}
    </div>
  );
}

export function SectionHeader({ number, done, label, optional }: { number: number; done: boolean; label: string; optional?: string }) {
  return (
    <div className="flex items-center gap-sm mb-md">
      <SectionIndicator number={number} done={done} />
      <span className={`font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.08em] transition-colors duration-[var(--motion-quick)] ${done ? 'text-text-secondary' : 'text-text-muted'}`}>
        {label}
      </span>
      {optional && (
        <span className="ml-auto font-sans text-[0.625rem] text-text-muted opacity-60">{optional}</span>
      )}
    </div>
  );
}

/**
 * The save-bar completeness ring. This is *wayfinding, not a grade* (UX
 * compendium UC-L-13): it tells the parent when they're allowed to leave, not
 * how good a parent they are. So once the entry is saveable (`ready`) the ring
 * turns sage and shows a ✓ rather than a number — readiness, not worth — and
 * the raw percentage only shows while the entry is still being built. The
 * `aria-valuetext` carries the readiness phrase so screen readers hear
 * "Ready to save" / the next action, never a bare "55".
 */
export function CompletenessRing({
  score,
  ready = false,
  valueText,
}: {
  score: number;
  ready?: boolean;
  valueText?: string;
}) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = ready ? 'var(--color-sage)' : 'var(--color-ember)';

  return (
    <div className="relative h-10 w-10">
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={valueText ?? (ready ? 'Ready to save' : `${score}% there`)}
        aria-label="Entry readiness"
      >
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-border-subtle)" strokeWidth="3" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          className="transition duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
        />
        {!ready && (
          <text
            x="20"
            y="20"
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-text-primary)"
            fontSize="10"
            fontFamily="var(--font-sans)"
            fontWeight="600"
          >
            {score}
          </text>
        )}
      </svg>
      {ready && (
        <Check
          size={18}
          className="absolute inset-0 m-auto"
          style={{ color: 'var(--color-sage)' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
