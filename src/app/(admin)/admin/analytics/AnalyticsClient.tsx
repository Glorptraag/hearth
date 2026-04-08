'use client';

import { useState, useEffect, useCallback } from 'react';
import PackAdoptionFunnel from './_components/PackAdoptionFunnel';
import ActivityHeatMap from './_components/ActivityHeatMap';
import ThreadCoverageChart from './_components/ThreadCoverageChart';

type Tab = 'pack-adoption' | 'activity-heat' | 'abandonment' | 'thread-coverage';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'pack-adoption', label: 'Pack Adoption', emoji: '📦' },
  { id: 'activity-heat', label: 'Activity Heat', emoji: '🔥' },
  { id: 'abandonment', label: 'Abandonment', emoji: '📉' },
  { id: 'thread-coverage', label: 'Thread Coverage', emoji: '🧵' },
];

export default function AnalyticsClient() {
  const [activeTab, setActiveTab] = useState<Tab>('pack-adoption');
  const [packId, setPackId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  return (
    <div className="p-lg">
      {/* Header */}
      <div className="mb-lg">
        <h1 className="font-serif text-xl font-semibold text-text-primary mb-xs">Content Analytics</h1>
        <p className="font-sans text-sm text-text-muted">
          Monthly review — which content is working, which needs attention.
        </p>
        <div className="mt-sm rounded-md border border-border-subtle bg-surface-raised px-md py-sm inline-flex items-center gap-xs">
          <span className="text-sm" aria-hidden="true">⚠️</span>
          <span className="font-sans text-xs text-text-muted">
            Phase C tool — metrics are most useful with 20+ active families.
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-xs mb-lg border-b border-border-subtle pb-xs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-xs rounded-md px-md py-sm font-sans text-[0.8rem] font-medium transition-all duration-200 border ${
              activeTab === tab.id
                ? 'border-border-medium bg-surface-raised text-ember'
                : 'border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary'
            }`}
          >
            <span className="text-sm" aria-hidden="true">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-surface-panel rounded-lg border border-border-subtle shadow-soft p-lg">
        {activeTab === 'pack-adoption' && (
          <PackAdoptionTab packId={packId} setPackId={setPackId} />
        )}
        {activeTab === 'activity-heat' && (
          <ActivityHeatTab moduleId={moduleId} setModuleId={setModuleId} />
        )}
        {activeTab === 'abandonment' && (
          <AbandonmentTab moduleId={moduleId} setModuleId={setModuleId} />
        )}
        {activeTab === 'thread-coverage' && (
          <ThreadCoverageTab
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
          />
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-lg">
      <h2 className="font-serif text-base font-semibold text-text-primary mb-xs">{title}</h2>
      <p className="font-sans text-sm text-text-muted">{description}</p>
    </div>
  );
}

function IdInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mb-lg">
      <label className="block font-sans text-xs font-semibold text-text-muted uppercase tracking-wider mb-xs">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full max-w-[420px] rounded-md border border-border-subtle bg-surface-body px-md py-sm font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:border-ember focus:outline-none transition-colors duration-200"
      />
    </div>
  );
}

function PackAdoptionTab({
  packId,
  setPackId,
}: {
  packId: string;
  setPackId: (v: string) => void;
}) {
  return (
    <>
      <SectionHeader
        title="Pack Adoption Funnel"
        description="For each pack: families who added → started → engaged. Tracks content uptake."
      />
      <IdInput
        label="Sanity Pack ID"
        value={packId}
        onChange={setPackId}
        placeholder="e.g. drafts.abc123 or published.xyz456"
      />
      {packId ? (
        <PackAdoptionFunnel packId={packId} />
      ) : (
        <EmptyPrompt message="Enter a Sanity pack ID above to see its adoption funnel" />
      )}
    </>
  );
}

function ActivityHeatTab({
  moduleId,
  setModuleId,
}: {
  moduleId: string;
  setModuleId: (v: string) => void;
}) {
  return (
    <>
      <SectionHeader
        title="Activity Heat Map"
        description="Times logged per stage within a module. Hot stages are bread-and-butter; cold stages may need review."
      />
      <IdInput
        label="Sanity Module ID"
        value={moduleId}
        onChange={setModuleId}
        placeholder="e.g. drafts.abc123 or published.xyz456"
      />
      {moduleId ? (
        <ActivityHeatMap moduleId={moduleId} />
      ) : (
        <EmptyPrompt message="Enter a Sanity module ID above to see its activity heat map" />
      )}
    </>
  );
}

function AbandonmentTab({
  moduleId,
  setModuleId,
}: {
  moduleId: string;
  setModuleId: (v: string) => void;
}) {
  const [submittedId, setSubmittedId] = useState('');

  return (
    <>
      <SectionHeader
        title="Module Abandonment"
        description="Where do families stop in a module? Cliff drops indicate content problems."
      />
      <IdInput
        label="Sanity Module ID"
        value={moduleId}
        onChange={setModuleId}
        placeholder="e.g. drafts.abc123 or published.xyz456"
      />
      {moduleId !== submittedId && moduleId && (
        <button
          onClick={() => setSubmittedId(moduleId)}
          className="mb-lg rounded-md bg-ember px-md py-sm font-sans text-[0.8rem] font-semibold text-text-inverse hover:bg-ember-hover transition-all duration-200"
        >
          Load
        </button>
      )}
      {submittedId ? (
        <AbandonmentChart moduleId={submittedId} />
      ) : (
        <EmptyPrompt message="Enter a Sanity module ID and click Load to see abandonment data" />
      )}
    </>
  );
}

function AbandonmentChart({ moduleId }: { moduleId: string }) {
  const [data, setData] = useState<
    Array<{ stageNumber: number | null; familyCount: number | null; dropOff: number | null; suppressed: boolean }> | null
  >(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setData(null);
    try {
      const r = await fetch(`/api/admin/analytics/abandonment?moduleId=${encodeURIComponent(moduleId)}`);
      const d = await r.json();
      setData(d.stages ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="py-xl text-center font-sans text-sm text-text-muted">Loading...</div>;
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-xl gap-sm">
        <span className="text-2xl" aria-hidden="true">📉</span>
        <p className="font-sans text-sm text-text-muted">Waiting for usage data</p>
        <p className="font-sans text-xs text-text-muted/60">Module abandonment appears once families log sessions</p>
      </div>
    );
  }

  return (
    <div className="space-y-xs">
      {data.map((stage, i) => {
        const max = data.find((s) => s.familyCount !== null)?.familyCount ?? 1;
        const pct = stage.familyCount !== null && max > 0 ? (stage.familyCount / max) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-md">
            <span className="font-sans text-xs text-text-muted w-[60px] shrink-0">
              Stage {stage.stageNumber}
            </span>
            <div className="flex-1 h-6 rounded-sm bg-surface-raised overflow-hidden">
              {stage.suppressed ? (
                <div className="h-full flex items-center px-sm">
                  <span className="font-sans text-xs text-text-muted/50">Insufficient data</span>
                </div>
              ) : (
                <div
                  className="h-full rounded-sm transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{ width: `${pct}%`, background: 'rgba(217,123,58,0.7)' }}
                />
              )}
            </div>
            <span className="font-serif text-sm font-semibold text-text-primary w-[40px] text-right shrink-0">
              {stage.suppressed ? '—' : stage.familyCount}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ThreadCoverageTab({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
}: {
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
}) {
  return (
    <>
      <SectionHeader
        title="Capability Thread Coverage"
        description="Which capability threads accumulate the most observations? Cold threads may indicate content gaps."
      />
      <div className="flex gap-md mb-lg flex-wrap">
        <div>
          <label className="block font-sans text-xs font-semibold text-text-muted uppercase tracking-wider mb-xs">
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-border-subtle bg-surface-body px-md py-sm font-sans text-sm text-text-primary focus:border-ember focus:outline-none transition-colors duration-200"
          />
        </div>
        <div>
          <label className="block font-sans text-xs font-semibold text-text-muted uppercase tracking-wider mb-xs">
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-border-subtle bg-surface-body px-md py-sm font-sans text-sm text-text-primary focus:border-ember focus:outline-none transition-colors duration-200"
          />
        </div>
      </div>
      <ThreadCoverageChart dateFrom={dateFrom || undefined} dateTo={dateTo || undefined} />
    </>
  );
}

function EmptyPrompt({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-xl gap-sm rounded-md border border-border-subtle bg-surface-body">
      <span className="font-sans text-sm text-text-muted">{message}</span>
    </div>
  );
}
