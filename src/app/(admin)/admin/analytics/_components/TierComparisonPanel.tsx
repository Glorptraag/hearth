'use client';

import { useEffect, useState, useCallback } from 'react';
import { Compass } from '@/components/icons';

type Tier = 'emerging' | 'developing' | 'demonstrating';
type Delta = 'higher' | 'lower' | 'same';

interface TierThreshold {
  minDeclaredOrAsserted: number;
  minInferredDistinctDays: number;
}

interface ThreadRow {
  threadId: string;
  threadName: string;
  observationCount: number;
  observationSources: { inferred: number; declared: number };
  override: Tier | null;
  countTier: Tier;
  derivedTier: Tier | null;
  delta: Delta;
  statusReached: Record<Tier, boolean>;
}

interface LearnerRow {
  learnerId: string;
  learnerName: string;
  familyId: string;
  familyName: string;
  threads: ThreadRow[];
}

interface ComparisonResponse {
  bar: Record<Tier, TierThreshold>;
  learners: LearnerRow[];
  summary: { total: number; higher: number; lower: number; same: number; countInflated: number };
  learnerCount: number;
  generatedAt: string;
}

const TIER_LABEL: Record<Tier, string> = {
  emerging: 'Emerging',
  developing: 'Developing',
  demonstrating: 'Demonstrating',
};

export default function TierComparisonPanel() {
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Inputs (committed → query). familyId optional; the bar knobs are the D-OS4
  // levers Drew tunes against this comparison (C2).
  const [familyId, setFamilyId] = useState('');
  const [demDeclared, setDemDeclared] = useState(1);
  const [demDays, setDemDays] = useState(2);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (familyId.trim()) params.set('familyId', familyId.trim());
      params.set('demDeclared', String(demDeclared));
      params.set('demDays', String(demDays));
      const r = await fetch(`/api/admin/analytics/tier-comparison?${params}`);
      if (!r.ok) throw new Error('fetch failed');
      setData((await r.json()) as ComparisonResponse);
    } catch {
      setData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [familyId, demDeclared, demDays]);

  useEffect(() => {
    // Fetch-on-mount data hydration; setState calls inside load are gated on completion.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const learnersWithThreads = data?.learners.filter((l) => l.threads.length > 0) ?? [];

  return (
    <div>
      {/* Controls */}
      <div className="mb-lg flex flex-wrap items-end gap-md">
        <div>
          <label className="mb-xs block font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
            Family ID (optional)
          </label>
          <input
            type="text"
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            placeholder="all families"
            className="w-full max-w-[320px] rounded-md border border-border-subtle bg-surface-body px-md py-sm font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:border-ember focus:outline-none transition-colors duration-[var(--motion-quick)]"
          />
        </div>
        <BarKnob label="Demonstrating — declared/asserted ≥" value={demDeclared} onChange={setDemDeclared} />
        <BarKnob label="…or inferred distinct days ≥" value={demDays} onChange={setDemDays} />
        <button
          onClick={load}
          className="rounded-md bg-ember px-md py-sm font-sans text-[0.8rem] font-semibold text-text-inverse hover:bg-ember-hover transition duration-[var(--motion-quick)]"
        >
          Apply bar
        </button>
      </div>

      <p className="mb-lg font-sans text-xs text-text-muted/70 max-w-[680px]">
        Count-based tier is today&apos;s production ladder (≥8 demonstrating / ≥4 developing, parent
        override lower-only). Derived tier comes from accumulated DLO evidence under the bar above —
        the WS-4 honesty model. <span className="text-rose-text">Lower</span> means the count-based
        tier over-claims; this is meaningful only once the A2/A3 backfills populate DLO data.
      </p>

      {loading && <p className="font-sans text-sm text-text-muted">Loading…</p>}
      {!loading && error && <p className="font-sans text-sm text-rose-text">Failed to load data.</p>}

      {!loading && data && !error && (
        <div className="space-y-lg">
          {/* Summary */}
          <div className="flex flex-wrap gap-lg">
            <Stat label="Comparisons" value={data.summary.total.toLocaleString()} />
            <Stat label="Derived lower" value={data.summary.lower.toLocaleString()} tone="rose" note="count over-claims" />
            <Stat label="Derived higher" value={data.summary.higher.toLocaleString()} tone="sage" />
            <Stat label="Same" value={data.summary.same.toLocaleString()} />
            <Stat
              label="Count-inflated"
              value={data.summary.countInflated.toLocaleString()}
              tone="rose"
              note="count ≥ developing, DLO has nothing"
            />
            <Stat label="Learners" value={data.learnerCount.toLocaleString()} />
          </div>

          {learnersWithThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-xl gap-sm">
              <span className="inline-flex text-text-secondary" aria-hidden="true"><Compass size={22} /></span>
              <p className="font-sans text-sm text-text-muted">No thread evidence yet</p>
              <p className="font-sans text-xs text-text-muted/60">
                Comparisons appear once entries log threads and the DLO backfills (A2/A3) run
              </p>
            </div>
          ) : (
            learnersWithThreads.map((learner) => (
              <LearnerTable key={learner.learnerId} learner={learner} />
            ))
          )}

          <p className="font-sans text-[0.7rem] text-text-muted/60">
            Generated {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

function LearnerTable({ learner }: { learner: LearnerRow }) {
  return (
    <div>
      <p className="mb-sm font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
        {learner.learnerName}
        <span className="ml-sm font-normal normal-case tracking-normal text-text-muted/60">
          {learner.familyName}
        </span>
      </p>
      <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-panel">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Thread</Th>
              <Th align="right">Observations</Th>
              <Th>Count-based</Th>
              <Th>DLO-derived</Th>
              <Th>Delta</Th>
            </tr>
          </thead>
          <tbody>
            {learner.threads.map((t) => (
              <tr
                key={t.threadId}
                className="border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors duration-[var(--motion-quick)]"
              >
                <td className="p-md align-top">
                  <span className="font-sans text-sm text-text-primary">{t.threadName}</span>
                  <span className="ml-sm font-mono text-[0.7rem] text-text-muted">{t.threadId}</span>
                </td>
                <td className="p-md align-top text-right">
                  <span className="font-serif text-sm font-semibold text-text-primary">{t.observationCount}</span>
                  <span className="ml-xs font-sans text-[0.65rem] text-text-muted/70">
                    {t.observationSources.inferred}i / {t.observationSources.declared}d
                  </span>
                </td>
                <td className="p-md align-top">
                  <TierPill tier={t.countTier} />
                  {t.override && (
                    <span className="ml-xs font-sans text-[0.65rem] text-amber-text" title="parent override (lower-only)">
                      override
                    </span>
                  )}
                </td>
                <td className="p-md align-top">
                  <TierPill tier={t.derivedTier} />
                </td>
                <td className="p-md align-top">
                  <DeltaBadge delta={t.delta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`p-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function TierPill({ tier }: { tier: Tier | null }) {
  if (tier === null) {
    return <span className="font-sans text-xs text-text-muted/60 italic">no evidence</span>;
  }
  return (
    <span className="inline-flex items-center rounded-sm border border-border-subtle bg-surface-raised px-sm py-[2px] font-sans text-[0.7rem] font-medium text-text-secondary">
      {TIER_LABEL[tier]}
    </span>
  );
}

function DeltaBadge({ delta }: { delta: Delta }) {
  if (delta === 'same') {
    return <span className="font-sans text-xs text-text-muted/50">—</span>;
  }
  const isLower = delta === 'lower';
  return (
    <span
      className={`inline-flex items-center rounded-sm px-sm py-[2px] font-sans text-[0.7rem] font-semibold ${
        isLower ? 'bg-rose-muted text-rose-text' : 'bg-sage-muted text-sage-text'
      }`}
    >
      {isLower ? '▼ lower' : '▲ higher'}
    </span>
  );
}

function BarKnob({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-xs block font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
        className="w-[80px] rounded-md border border-border-subtle bg-surface-body px-md py-sm font-sans text-sm text-text-primary focus:border-ember focus:outline-none transition-colors duration-[var(--motion-quick)]"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  note?: string;
  tone?: 'neutral' | 'sage' | 'rose';
}) {
  const valueTone =
    tone === 'sage' ? 'text-sage-text' : tone === 'rose' ? 'text-rose-text' : 'text-text-primary';
  return (
    <div className="rounded-md border border-border-subtle bg-surface-raised px-md py-sm min-w-[120px]">
      <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-wider text-text-muted mb-xs">
        {label}
      </p>
      <p className={`font-serif text-xl font-semibold ${valueTone}`}>{value}</p>
      {note && <p className="font-sans text-[0.65rem] text-text-muted/70 mt-[2px]">{note}</p>}
    </div>
  );
}
