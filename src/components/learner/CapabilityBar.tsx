interface CapabilityBarProps {
  domain: string;
  emoji: string;
  count: number;
  maxCount: number;
  colorClass: string;
}

export default function CapabilityBar({
  domain,
  emoji,
  count,
  maxCount,
  colorClass,
}: CapabilityBarProps) {
  const pct = maxCount > 0 ? Math.min(100, (count / maxCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-xs">
          <span className="text-sm" aria-hidden="true">{emoji}</span>
          <span className="font-sans text-xs font-semibold text-text-secondary">{domain}</span>
        </div>
        <span className="font-sans text-[11px] text-text-muted">
          {count} {count === 1 ? 'observation' : 'observations'}
        </span>
      </div>
      <div
        className="h-[6px] w-full overflow-hidden rounded-full bg-surface-raised"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${domain} progress: ${count} of ${maxCount} observations`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-[var(--motion-gentle)] ease-[var(--ease-default)] ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
