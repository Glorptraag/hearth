import { Check } from '@/components/icons';

/**
 * Section chrome for the Logger form — the numbered step indicator, its header
 * row, and the completeness ring shown in the save bar. Extracted verbatim from
 * log/page.tsx; these are pure presentational components with no Logger state.
 */

export function SectionIndicator({ number, done }: { number: number; done: boolean }) {
  return (
    <div
      className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full font-sans text-[0.6875rem] font-semibold transition-all duration-200 ease-[var(--ease-default)] ${
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
      <span className={`font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.08em] transition-colors duration-200 ${done ? 'text-text-secondary' : 'text-text-muted'}`}>
        {label}
      </span>
      {optional && (
        <span className="ml-auto font-sans text-[0.625rem] text-text-muted opacity-60">{optional}</span>
      )}
    </div>
  );
}

export function CompletenessRing({ score }: { score: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 90 ? 'var(--color-sage)' : 'var(--color-ember)';

  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
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
        className="transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
      />
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
    </svg>
  );
}
