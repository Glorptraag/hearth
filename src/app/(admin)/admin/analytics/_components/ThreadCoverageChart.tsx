'use client';

import { useEffect, useState, useCallback } from 'react';
import { Compass } from '@/components/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ThreadRow {
  threadId: string;
  entryCount: number;
  familyCount: number;
}

interface Props {
  dateFrom?: string;
  dateTo?: string;
}

export default function ThreadCoverageChart({ dateFrom, dateTo }: Props) {
  const [threads, setThreads] = useState<ThreadRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setThreads(null);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const r = await fetch(`/api/admin/analytics/thread-coverage?${params}`);
      const d = await r.json();
      setThreads(d.threads ?? []);
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  // Fetch-on-mount data hydration; setState calls inside fetchData are gated on completion.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div className="py-xl text-center font-sans text-sm text-text-muted">Loading...</div>;
  }

  if (error) {
    return <div className="py-xl text-center font-sans text-sm text-red-400">{error}</div>;
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-xl gap-sm">
        <span className="inline-flex text-text-secondary" aria-hidden="true"><Compass size={22} /></span>
        <p className="font-sans text-sm text-text-muted">Waiting for usage data</p>
        <p className="font-sans text-xs text-text-muted/60">
          Thread coverage appears once AI enrichment runs on logged entries
        </p>
      </div>
    );
  }

  // Show top 20 for readability
  const chartData = threads.slice(0, 20).map((t) => ({
    threadId: t.threadId.replace(/^[a-z]+-/, '').slice(0, 20),
    fullId: t.threadId,
    entries: t.entryCount,
    families: t.familyCount,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 28)}>
        <BarChart data={chartData} layout="vertical" barSize={14} margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'var(--color-text-muted, #726458)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="threadId"
            width={120}
            tick={{ fill: 'var(--color-text-muted, #726458)', fontSize: 10, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
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
            formatter={(value) => [value as number, 'Log entries']}
            labelFormatter={(_label, payload) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const item = (payload as any)?.[0]?.payload;
              return item?.fullId ?? String(_label);
            }}
          />
          <Bar dataKey="entries" fill="rgba(217,123,58,0.7)" radius={[0, 4, 4, 0]} name="entries" />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-sm font-sans text-xs text-text-muted/60 text-center">
        Showing top {chartData.length} threads by entry count — buckets with fewer than 5 families suppressed
      </p>
    </div>
  );
}
