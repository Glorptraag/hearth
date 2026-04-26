'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface FunnelStage {
  stage: string;
  count: number | null;
  raw: number | null;
}

interface Props {
  packId: string;
}

export default function PackAdoptionFunnel({ packId }: Props) {
  const [data, setData] = useState<FunnelStage[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setData(null);
    setError(null);
    try {
      const r = await fetch(`/api/admin/analytics/pack-adoption?packId=${encodeURIComponent(packId)}`);
      const d = await r.json();
      setData(d.funnel ?? []);
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [packId]);

  // Fetch-on-mount data hydration; setState calls inside fetchData are gated on completion.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div className="py-xl text-center font-sans text-sm text-text-muted">Loading...</div>;
  }

  if (error) {
    return <div className="py-xl text-center font-sans text-sm text-red-400">{error}</div>;
  }

  const hasData = data && data.some((d) => d.raw !== null && d.raw > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-xl gap-sm">
        <span className="text-2xl" aria-hidden="true">📊</span>
        <p className="font-sans text-sm text-text-muted">Waiting for usage data</p>
        <p className="font-sans text-xs text-text-muted/60">Pack adoption metrics appear once families begin logging</p>
      </div>
    );
  }

  const chartData = data
    .filter((d) => d.stage !== 'Completed')
    .map((d) => ({
      stage: d.stage,
      value: d.count ?? 0,
      suppressed: d.count === null && d.raw !== null && d.raw > 0,
    }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barSize={40}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="stage"
            tick={{ fill: 'var(--color-text-muted, #726458)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--color-text-muted, #726458)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface-panel, #1a1410)',
              border: '1px solid var(--color-border-subtle, #2a1f16)',
              borderRadius: 6,
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              color: 'var(--color-text-primary, #f5f0eb)',
            }}
            cursor={{ fill: 'rgba(217,123,58,0.06)' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.suppressed ? 'rgba(114,100,88,0.3)' : `rgba(217,123,58,${1 - index * 0.2})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {data.some((d) => d.count === null && d.raw !== null && d.raw > 0) && (
        <p className="mt-sm font-sans text-xs text-text-muted/60 text-center">
          Some buckets suppressed (fewer than 5 families)
        </p>
      )}

      <div className="mt-sm font-sans text-xs text-text-muted/50 text-center">
        Completed stage not yet trackable from current data model
      </div>
    </div>
  );
}
