'use client';

import { useEffect, useState, useCallback } from 'react';

interface Cell {
  stageNumber: number | null;
  logCount: number | null;
  familyCount: number | null;
  suppressed: boolean;
}

interface Props {
  moduleId: string;
}

function heatColor(count: number, max: number): string {
  if (max === 0) return 'rgba(217,123,58,0.1)';
  const intensity = Math.max(0.1, count / max);
  return `rgba(217,123,58,${intensity})`;
}

export default function ActivityHeatMap({ moduleId }: Props) {
  const [cells, setCells] = useState<Cell[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setCells(null);
    setError(null);
    try {
      const r = await fetch(`/api/admin/analytics/activity-heat?moduleId=${encodeURIComponent(moduleId)}`);
      const d = await r.json();
      setCells(d.cells ?? []);
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div className="py-xl text-center font-sans text-sm text-text-muted">Loading...</div>;
  }

  if (error) {
    return <div className="py-xl text-center font-sans text-sm text-red-400">{error}</div>;
  }

  const hasData = cells && cells.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-xl gap-sm">
        <span className="text-2xl" aria-hidden="true">🔥</span>
        <p className="font-sans text-sm text-text-muted">Waiting for usage data</p>
        <p className="font-sans text-xs text-text-muted/60">Activity heat appears once families log sessions against this module</p>
      </div>
    );
  }

  const maxCount = Math.max(...cells.filter((c) => c.logCount !== null).map((c) => c.logCount ?? 0), 1);

  return (
    <div>
      <div className="grid gap-xs" style={{ gridTemplateColumns: `repeat(${Math.min(cells.length, 8)}, 1fr)` }}>
        {cells.map((cell, i) => (
          <div
            key={i}
            title={
              cell.suppressed
                ? 'Insufficient data'
                : `Stage ${cell.stageNumber}: ${cell.logCount} log${cell.logCount !== 1 ? 's' : ''} from ${cell.familyCount} famil${cell.familyCount !== 1 ? 'ies' : 'y'}`
            }
            className="relative rounded-md border border-border-subtle flex flex-col items-center justify-center p-sm gap-xs cursor-default transition-all duration-200 hover:border-border-medium"
            style={{
              background: cell.suppressed ? 'rgba(114,100,88,0.1)' : heatColor(cell.logCount ?? 0, maxCount),
              minHeight: 64,
            }}
          >
            <span className="font-sans text-[0.65rem] font-semibold text-text-muted uppercase tracking-wider">
              Stage {cell.stageNumber}
            </span>
            {cell.suppressed ? (
              <span className="font-sans text-xs text-text-muted/50 text-center leading-tight">
                Insufficient data
              </span>
            ) : (
              <>
                <span className="font-serif text-lg font-semibold text-text-primary">{cell.logCount}</span>
                <span className="font-sans text-[0.6rem] text-text-muted">
                  {cell.familyCount} {cell.familyCount === 1 ? 'family' : 'families'}
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-md flex items-center justify-end gap-xs">
        <span className="font-sans text-xs text-text-muted/60">Less</span>
        {[0.1, 0.3, 0.5, 0.7, 1].map((v) => (
          <div
            key={v}
            className="h-3 w-5 rounded-sm"
            style={{ background: `rgba(217,123,58,${v})` }}
          />
        ))}
        <span className="font-sans text-xs text-text-muted/60">More</span>
      </div>
    </div>
  );
}
