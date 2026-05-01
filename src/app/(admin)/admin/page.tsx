'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardData {
  topLine: {
    activeFamilies: number;
    totalLearners: number;
    entriesThisWeek: number;
    newFamiliesThisWeek: number;
  };
  invitations: {
    pending: number;
    redeemed: number;
    expiringSoon: number;
  };
  engagementPulse: Array<{ bucket: string; count: number }>;
  lastUpdated: string;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-lg border border-border-subtle bg-surface-raised p-md shadow-card">
      <div className="font-serif text-2xl font-bold text-text-primary">{value}</div>
      <div className="font-sans text-[0.7rem] font-medium text-text-muted uppercase tracking-wider mt-xs">
        {label}
      </div>
    </div>
  );
}

const BUCKET_LABELS: Record<string, string> = {
  '0-3': '0\u20133 days',
  '4-7': '4\u20137 days',
  '8-14': '8\u201314 days',
  '15-30': '15\u201330 days',
  '30+': '30+ days',
};

const BUCKET_COLORS: Record<string, string> = {
  '0-3': 'bg-sage',
  '4-7': 'bg-sage/70',
  '8-14': 'bg-text-muted',
  '15-30': 'bg-ember',
  '30+': 'bg-ember',
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ops/summary');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  // Fetch-on-mount data hydration; setState calls inside fetchData are gated on completion.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, []);

  if (loading || !data) {
    return (
      <div className="p-lg">
        <h1 className="font-serif text-xl font-semibold text-text-primary mb-md">
          Platform Operations
        </h1>
        <p className="font-sans text-sm text-text-muted">Loading metrics...</p>
      </div>
    );
  }

  const maxPulse = Math.max(...data.engagementPulse.map((b) => b.count), 1);
  const totalFamiliesInPulse = data.engagementPulse.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="p-lg max-w-[960px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-serif text-xl font-semibold text-text-primary">
          Platform Operations
        </h1>
        <div className="flex items-center gap-md">
          <span className="font-sans text-[0.7rem] text-text-muted">
            Updated {new Date(data.lastUpdated).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={fetchData}
            className="rounded-md border border-border-subtle px-sm py-xs font-sans text-[0.7rem] font-medium text-text-muted hover:text-text-primary hover:border-border-medium transition-all duration-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Row 1: Top-line metrics */}
      <div className="flex gap-md mb-lg">
        <MetricCard label="Families" value={data.topLine.activeFamilies} />
        <MetricCard label="Learners" value={data.topLine.totalLearners} />
        <MetricCard label="Entries this week" value={data.topLine.entriesThisWeek} />
        <MetricCard label="New this week" value={data.topLine.newFamiliesThisWeek} />
      </div>

      {/* Row 2: Invitation summary */}
      <div className="rounded-lg border border-border-subtle bg-surface-panel p-md mb-lg">
        <h2 className="font-sans text-[0.7rem] font-semibold text-text-muted uppercase tracking-wider mb-sm">
          Invitations
        </h2>
        <div className="flex items-center gap-lg">
          <Pill label="Pending" value={data.invitations.pending} />
          <Pill label="Redeemed" value={data.invitations.redeemed} accent />
          <Pill label="Expiring soon" value={data.invitations.expiringSoon} warn={data.invitations.expiringSoon > 0} />
          <Link
            href="/admin/invitations"
            className="ml-auto font-sans text-xs text-ember hover:text-ember-hover transition-colors duration-200"
          >
            View all &rarr;
          </Link>
        </div>
      </div>

      {/* Row 3: Engagement pulse */}
      <div className="rounded-lg border border-border-subtle bg-surface-panel p-md mb-lg">
        <h2 className="font-sans text-[0.7rem] font-semibold text-text-muted uppercase tracking-wider mb-md">
          Engagement Pulse
          <span className="ml-sm font-normal lowercase text-text-muted">
            (days since last entry)
          </span>
        </h2>

        {totalFamiliesInPulse === 0 ? (
          <p className="font-sans text-sm text-text-muted">No activity to track yet.</p>
        ) : (
          <div className="space-y-sm">
            {data.engagementPulse.map((b) => (
              <div key={b.bucket} className="flex items-center gap-md">
                <span className="w-[80px] font-sans text-xs text-text-muted text-right">
                  {BUCKET_LABELS[b.bucket] ?? b.bucket}
                </span>
                <div className="flex-1 h-[20px] rounded-[6px] bg-surface-body overflow-hidden">
                  <div
                    className={`h-full rounded-[6px] transition-all duration-200 ${BUCKET_COLORS[b.bucket] ?? 'bg-text-muted'}`}
                    style={{ width: `${Math.max((b.count / maxPulse) * 100, b.count > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="w-[40px] font-sans text-xs font-medium text-text-secondary text-right">
                  {b.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty state for zero families */}
      {data.topLine.activeFamilies === 0 && (
        <div className="rounded-lg border border-border-subtle bg-surface-panel p-lg text-center">
          <p className="font-sans text-sm text-text-muted">
            No families yet. The dashboard fills in as Hearth grows.
          </p>
        </div>
      )}
    </div>
  );
}

function Pill({ label, value, accent, warn }: { label: string; value: number; accent?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center gap-xs">
      <span className={`font-sans text-lg font-semibold ${warn ? 'text-ember' : accent ? 'text-sage' : 'text-text-primary'}`}>
        {value}
      </span>
      <span className="font-sans text-xs text-text-muted">{label}</span>
    </div>
  );
}
