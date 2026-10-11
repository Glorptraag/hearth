'use client';

import { useEffect, useState, useCallback } from 'react';

interface ProvenanceRow {
  provenance: string;
  total: number;
  mismatches: number;
}

interface IntegrityResponse {
  days: number;
  byProvenance: ProvenanceRow[];
  total: number;
  mismatches: number;
  mismatchRate: number;
  generatedAt: string;
}

const PROVENANCE_LABEL: Record<string, string> = {
  inferred: 'Hearth noticed',
  declared: 'From a module',
  asserted: 'You confirmed',
};

const WINDOW_OPTIONS = [
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
];

export default function DloIntegrityPanel() {
  const [data, setData] = useState<IntegrityResponse | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/analytics/dlo-integrity?days=${days}`);
      if (!r.ok) throw new Error('fetch failed');
      const d = (await r.json()) as IntegrityResponse;
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
            {WINDOW_OPTIONS.map((o) => (
              <button
                key={o.days}
                onClick={() => setDays(o.days)}
                className={`rounded-md px-md py-sm font-sans text-[0.8rem] font-medium border transition duration-[var(--motion-quick)] ${
                  days === o.days
                    ? 'bg-surface-raised border-border-medium text-ember'
                    : 'bg-transparent border-border-subtle text-text-secondary hover:border-border-medium hover:text-text-primary'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <p className="font-sans text-sm text-text-muted">Loading…</p>
      )}

      {!loading && !data && (
        <p className="font-sans text-sm text-text-muted">Failed to load data.</p>
      )}

      {!loading && data && (
        <div className="space-y-lg">
          {/* Summary row */}
          <div className="flex flex-wrap gap-lg">
            <Stat label="Total links" value={data.total.toLocaleString()} />
            <Stat label="Mismatches" value={data.mismatches.toLocaleString()} />
            <Stat
              label="Mismatch rate"
              value={`${(data.mismatchRate * 100).toFixed(1)}%`}
              note="tier clamped to Sanity value"
            />
          </div>

          {/* Provenance breakdown */}
          {data.byProvenance.length > 0 && (
            <div>
              <p className="mb-sm font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
                Provenance breakdown
              </p>
              <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-panel">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle">
                        Provenance
                      </th>
                      <th className="p-md text-right font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle">
                        Links
                      </th>
                      <th className="p-md text-right font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle">
                        Mismatches
                      </th>
                      <th className="p-md text-right font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle">
                        Mismatch %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byProvenance.map((r) => {
                      const rate = r.total > 0 ? (r.mismatches / r.total) * 100 : 0;
                      return (
                        <tr
                          key={r.provenance}
                          className="border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors duration-[var(--motion-quick)]"
                        >
                          <td className="p-md align-top">
                            <span className="font-sans text-sm text-text-primary">
                              {PROVENANCE_LABEL[r.provenance] ?? r.provenance}
                            </span>
                            <span className="ml-sm font-sans text-[0.7rem] text-text-muted">
                              ({r.provenance})
                            </span>
                          </td>
                          <td className="p-md align-top text-right font-sans text-sm text-text-primary">
                            {r.total.toLocaleString()}
                          </td>
                          <td className="p-md align-top text-right font-sans text-sm text-text-muted">
                            {r.mismatches.toLocaleString()}
                          </td>
                          <td className="p-md align-top text-right font-sans text-sm text-text-muted">
                            {rate.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.byProvenance.length === 0 && (
            <p className="font-sans text-sm text-text-muted">
              No DLO links in the selected window.
            </p>
          )}

          <p className="font-sans text-[0.7rem] text-text-muted/60">
            Generated {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-raised px-md py-sm min-w-[120px]">
      <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-wider text-text-muted mb-xs">
        {label}
      </p>
      <p className="font-serif text-xl font-semibold text-text-primary">{value}</p>
      {note && (
        <p className="font-sans text-[0.65rem] text-text-muted/70 mt-[2px]">{note}</p>
      )}
    </div>
  );
}
