interface SummaryCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  emoji: string;
  highlight?: boolean;
}

export default function SummaryCard({
  label,
  value,
  subtext,
  emoji,
  highlight = false,
}: SummaryCardProps) {
  return (
    <div
      className={`flex flex-col gap-xs rounded-[10px] border p-md transition duration-[var(--motion-gentle)] ease-[var(--ease-default)] ${
        highlight
          ? 'border-border-medium bg-ember-glow'
          : 'border-border-subtle bg-surface-panel'
      }`}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <div className="mt-xs">
        <p
          className={`font-sans text-2xl font-semibold leading-none ${
            highlight ? 'text-ember' : 'text-text-primary'
          }`}
        >
          {value}
        </p>
        {subtext && (
          <p className="mt-xs font-sans text-xs text-text-muted">{subtext}</p>
        )}
      </div>
      <p className="font-sans text-xs font-medium uppercase tracking-[0.08em] text-text-muted">
        {label}
      </p>
    </div>
  );
}
