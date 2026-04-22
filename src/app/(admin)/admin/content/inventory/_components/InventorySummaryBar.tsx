'use client';

const STATUS_COLORS: Record<string, string> = {
  active: 'text-sage',
  reviewed: 'text-sage/70',
  created: 'text-ember',
  briefed: 'text-text-secondary',
  planned: 'text-text-muted',
  archived: 'text-text-muted/60',
};

const DISPLAY_ORDER = ['active', 'reviewed', 'created', 'briefed', 'planned', 'archived'];

interface Props {
  counts: Record<string, number>;
}

export default function InventorySummaryBar({ counts }: Props) {
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="flex items-center gap-3 font-sans text-xs text-text-muted">
      <span className="font-semibold text-text-primary">{total} total</span>
      <span className="text-border-subtle">|</span>
      {DISPLAY_ORDER.map((s) => {
        const n = counts[s];
        if (!n) return null;
        return (
          <span key={s}>
            <span className={STATUS_COLORS[s] ?? 'text-text-muted'}>{n}</span>{' '}
            {s}
          </span>
        );
      })}
    </div>
  );
}
