'use client';

interface Bucket {
  key: string;
  label: string;
  count: number;
}

const BUCKET_COLORS: Record<string, string> = {
  lt5m:   'bg-sage',
  to60m:  'bg-sage/70',
  to24h:  'bg-text-muted',
  to7d:   'bg-ember',
  beyond: 'bg-ember',
};

interface Props {
  buckets: Bucket[];
  total: number;
}

export default function SnapshotAgeHistogram({ buckets, total }: Props) {
  const max = Math.max(...buckets.map((b) => b.count), 1);

  if (total === 0) {
    return (
      <p className="font-sans text-sm text-text-muted">No snapshots found.</p>
    );
  }

  return (
    <div className="space-y-sm">
      {buckets.map((b) => (
        <div key={b.key} className="flex items-center gap-md">
          <span className="w-[80px] font-sans text-xs text-text-muted text-right">
            {b.label}
          </span>
          <div className="flex-1 h-[20px] rounded-[6px] bg-surface-body overflow-hidden">
            <div
              className={`h-full rounded-[6px] transition-all duration-200 ${BUCKET_COLORS[b.key] ?? 'bg-text-muted'}`}
              style={{ width: `${Math.max((b.count / max) * 100, b.count > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="w-[40px] font-sans text-xs font-medium text-text-secondary text-right">
            {b.count}
          </span>
        </div>
      ))}
    </div>
  );
}
