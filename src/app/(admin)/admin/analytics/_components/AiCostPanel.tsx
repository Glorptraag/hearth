'use client';

import { useEffect, useState, useCallback } from 'react';

interface DayRow {
  day: string;
  kind: 'draft' | 'full';
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  avgLatencyMs: number;
  retries: number;
  usd: number;
}

interface FamilyRow {
  familyId: string;
  kind: 'draft' | 'full';
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  usd: number;
}

interface KindTotals {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  usd: number;
}

interface CostResponse {
  days: number;
  daily: DayRow[];
  families: FamilyRow[];
  totals: { draft: KindTotals; full: KindTotals };
  pricing: Record<string, { input: number; output: number }>;
  generatedAt: string;
}

const WINDOW_OPTIONS = [
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
];

export default function AiCostPanel() {
  const [data, setData] = useState<CostResponse | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/analytics/ai-cost?days=${days}`);
      if (!r.ok) throw new Error('fetch failed');
      const d = (await r.json()) as CostResponse;
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    // Fetch-on-mount data hydration; setState calls inside load are gated on completion.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end gap-md">
        <div>
          <label className="mb-xs block font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
            Window
          </label>
          <div className="flex gap-xs">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => setDays(opt.days)}
                className={`rounded-md border px-md py-sm font-sans text-xs font-semibold transition-colors duration-200 ${
                  days === opt.days
                    ? 'border-ember bg-ember-glow text-ember'
                    : 'border-border-subtle text-text-secondary hover:border-border-medium hover:text-text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {data && Object.keys(data.pricing).length > 0 && (
          <PricingFootnote pricing={data.pricing} />
        )}
      </div>

      {loading && (
        <p className="py-xl text-center font-sans text-sm text-text-muted">Loading…</p>
      )}

      {!loading && !data && (
        <p className="py-xl text-center font-sans text-sm text-text-muted">
          No cost data available for the selected window.
        </p>
      )}

      {data && (
        <>
          {/* Period totals */}
          <div className="mb-xl grid grid-cols-1 gap-md sm:grid-cols-2">
            <TotalsCard label="Full enrichment" totals={data.totals.full} />
            <TotalsCard label="Draft insights" totals={data.totals.draft} />
          </div>

          {/* Daily trend (kind-split) */}
          <h3 className="mb-md font-serif text-base font-semibold text-text-primary">
            Daily spend (last {data.days} days)
          </h3>
          <DailyChart rows={data.daily} />

          {/* Top families */}
          <h3 className="mb-md mt-xl font-serif text-base font-semibold text-text-primary">
            Top families by spend (window total)
          </h3>
          <FamilyTable rows={data.families} />

          {/* Footnote */}
          <p className="mt-lg font-sans text-xs text-text-muted">
            Tip: if draft spend approaches $3/family/month, set{' '}
            <code className="rounded-sm bg-surface-raised px-xs py-[1px] font-mono text-[11px]">
              DRAFT_INSIGHTS_ENABLED=false
            </code>{' '}
            in Vercel — see <code>docs/incident-runbook.md §2</code>.
          </p>
        </>
      )}
    </div>
  );
}

function PricingFootnote({
  pricing,
}: {
  pricing: Record<string, { input: number; output: number }>;
}) {
  const entries = Object.entries(pricing).sort(([a], [b]) => a.localeCompare(b));
  return (
    <div className="font-sans text-xs text-text-muted">
      <span className="font-semibold">Pricing per model used in this window:</span>
      <ul className="mt-xs space-y-[2px]">
        {entries.map(([model, p]) => (
          <li key={model} className="flex flex-wrap gap-x-md">
            <code className="font-mono text-[10px] text-text-secondary">{model}</code>
            <span>
              ${p.input.toFixed(2)} / Mtok in · ${p.output.toFixed(2)} / Mtok out
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-xs">
        Update <code className="rounded-sm bg-surface-raised px-xs py-[1px] font-mono text-[10px]">PRICING_PER_MTOK</code>{' '}
        in <code className="rounded-sm bg-surface-raised px-xs py-[1px] font-mono text-[10px]">/api/admin/analytics/ai-cost</code> if Anthropic publishes new rates.
      </p>
    </div>
  );
}

function TotalsCard({ label, totals }: { label: string; totals: KindTotals }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-md">
      <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
        {label}
      </p>
      <p className="mt-xs font-serif text-2xl font-semibold text-text-primary">
        ${totals.usd.toFixed(2)}
      </p>
      <p className="mt-xs font-sans text-xs text-text-muted">
        {totals.calls.toLocaleString()} calls · {formatNum(totals.inputTokens)} in · {formatNum(totals.outputTokens)} out
      </p>
    </div>
  );
}

function DailyChart({ rows }: { rows: DayRow[] }) {
  // Collapse rows by day into { day, fullUsd, draftUsd } for the bar chart.
  const byDay = new Map<string, { full: number; draft: number; calls: number }>();
  for (const r of rows) {
    const slot = byDay.get(r.day) ?? { full: 0, draft: 0, calls: 0 };
    slot[r.kind] += r.usd;
    slot.calls += r.calls;
    byDay.set(r.day, slot);
  }
  const days = [...byDay.entries()]
    .map(([day, v]) => ({ day, ...v, total: v.full + v.draft }))
    .sort((a, b) => a.day.localeCompare(b.day));

  if (days.length === 0) {
    return (
      <p className="rounded-md border border-border-subtle bg-surface-body p-lg text-center font-sans text-sm text-text-muted">
        No pipeline activity in this window.
      </p>
    );
  }

  const max = Math.max(...days.map((d) => d.total), 0.01);

  return (
    <div className="space-y-xs">
      {days.map((d) => {
        const fullPct = (d.full / max) * 100;
        const draftPct = (d.draft / max) * 100;
        return (
          <div key={d.day} className="flex items-center gap-md">
            <span className="w-[88px] shrink-0 font-mono text-[11px] text-text-muted">
              {d.day.slice(0, 10)}
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-surface-raised">
              <div
                className="absolute inset-y-0 left-0 transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
                style={{ width: `${fullPct}%`, background: 'rgba(217,123,58,0.7)' }}
                title={`Full enrichment: $${d.full.toFixed(4)}`}
              />
              <div
                className="absolute inset-y-0 transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
                style={{
                  width: `${draftPct}%`,
                  left: `${fullPct}%`,
                  background: 'rgba(123,191,138,0.6)',
                }}
                title={`Draft insights: $${d.draft.toFixed(4)}`}
              />
            </div>
            <span className="w-[64px] shrink-0 text-right font-serif text-sm font-semibold text-text-primary">
              ${d.total.toFixed(2)}
            </span>
            <span className="w-[56px] shrink-0 text-right font-sans text-[11px] text-text-muted">
              {d.calls} call{d.calls === 1 ? '' : 's'}
            </span>
          </div>
        );
      })}
      <div className="mt-md flex items-center gap-md font-sans text-[11px] text-text-muted">
        <span className="flex items-center gap-xs">
          <span
            className="inline-block h-[10px] w-[10px] rounded-sm"
            style={{ background: 'rgba(217,123,58,0.7)' }}
            aria-hidden="true"
          />
          Full enrichment
        </span>
        <span className="flex items-center gap-xs">
          <span
            className="inline-block h-[10px] w-[10px] rounded-sm"
            style={{ background: 'rgba(123,191,138,0.6)' }}
            aria-hidden="true"
          />
          Draft insights
        </span>
      </div>
    </div>
  );
}

function FamilyTable({ rows }: { rows: FamilyRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-border-subtle bg-surface-body p-lg text-center font-sans text-sm text-text-muted">
        No per-family activity in this window.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border-subtle">
      <table className="w-full font-sans text-xs">
        <thead className="bg-surface-raised text-left">
          <tr>
            <th className="px-md py-sm font-semibold text-text-muted">Family ID</th>
            <th className="px-md py-sm font-semibold text-text-muted">Kind</th>
            <th className="px-md py-sm font-semibold text-text-muted">Model</th>
            <th className="px-md py-sm font-semibold text-text-muted text-right">Calls</th>
            <th className="px-md py-sm font-semibold text-text-muted text-right">Tokens (in/out)</th>
            <th className="px-md py-sm font-semibold text-text-muted text-right">Spend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={`${r.familyId}-${r.kind}-${r.model}-${i}`}
              className="border-t border-border-subtle"
            >
              <td className="px-md py-sm font-mono text-[11px] text-text-secondary">
                {r.familyId.slice(0, 8)}…
              </td>
              <td className="px-md py-sm">
                <span
                  className={`rounded-sm px-xs py-[1px] text-[10px] font-semibold uppercase ${
                    r.kind === 'draft'
                      ? 'bg-sage/20 text-sage'
                      : 'bg-ember-glow text-ember'
                  }`}
                >
                  {r.kind}
                </span>
              </td>
              <td className="px-md py-sm font-mono text-[11px] text-text-secondary">
                {r.model.replace(/-draft$/, '')}
              </td>
              <td className="px-md py-sm text-right text-text-primary">{r.calls}</td>
              <td className="px-md py-sm text-right text-text-secondary">
                {formatNum(r.inputTokens)} / {formatNum(r.outputTokens)}
              </td>
              <td className="px-md py-sm text-right font-semibold text-text-primary">
                ${r.usd.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}
