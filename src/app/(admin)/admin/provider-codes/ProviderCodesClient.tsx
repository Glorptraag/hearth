'use client';

import { useState, useEffect, useCallback } from 'react';

interface ProviderCode {
  id: string;
  code: string;
  redeemedByFamilyId: string | null;
  redeemedAt: string | null;
  expiresAt: string | null;
  heuLabel: string | null;
  notes: string | null;
  createdByAdminId: string | null;
  createdAt: string;
}

const STATUS_FILTERS = ['all', 'unused', 'redeemed'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isExpired(c: ProviderCode): boolean {
  return !!c.expiresAt && new Date(c.expiresAt) < new Date();
}

function statusOf(c: ProviderCode): 'redeemed' | 'expired' | 'unused' {
  if (c.redeemedAt) return 'redeemed';
  if (isExpired(c)) return 'expired';
  return 'unused';
}

function StatusBadge({ code }: { code: ProviderCode }) {
  const s = statusOf(code);
  const styles: Record<typeof s, string> = {
    unused: 'bg-sage/15 text-sage border-sage/25',
    redeemed: 'bg-surface-raised text-text-muted border-border-subtle',
    expired: 'bg-red-900/20 text-red-400 border-red-900/30',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-[1px] font-sans text-[0.65rem] font-semibold uppercase tracking-wider ${styles[s]}`}>
      {s}
    </span>
  );
}

export default function ProviderCodesClient() {
  const [codes, setCodes] = useState<ProviderCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '50' });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/admin/provider-codes?${params}`);
      const data = await res.json();
      setCodes(data.codes ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  function handleCopy(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const pageCount = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="p-lg">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="font-serif text-xl font-semibold text-text-primary">Provider Codes</h1>
          <p className="font-sans text-[0.8rem] text-text-muted mt-xs">
            Discount codes redeemed by families at checkout. One row per code.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-md bg-ember px-md py-sm font-sans text-[0.8rem] font-semibold text-text-inverse hover:bg-ember-hover transition-all duration-200"
        >
          + New Codes
        </button>
      </div>

      <div className="flex items-center gap-md mb-md">
        <div className="flex gap-xs">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-[6px] px-sm py-xs font-sans text-[0.7rem] font-semibold uppercase tracking-wider transition-all duration-200 border ${
                statusFilter === s
                  ? 'border-border-medium bg-surface-raised text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border-subtle'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search code, HEU label, or notes…"
          className="ml-auto w-[300px] bg-surface-panel border border-border-subtle rounded-[6px] px-sm py-xs font-sans text-[0.8rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium transition-colors"
        />
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-panel overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-raised border-b border-border-subtle">
            <tr>
              <Th>Code</Th>
              <Th>Status</Th>
              <Th>HEU Label</Th>
              <Th>Expires</Th>
              <Th>Created</Th>
              <Th>Redeemed</Th>
              <Th>Notes</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-lg text-center font-sans text-[0.8rem] text-text-muted">Loading…</td></tr>
            ) : codes.length === 0 ? (
              <tr><td colSpan={7} className="p-lg text-center font-sans text-[0.8rem] text-text-muted">No codes match these filters.</td></tr>
            ) : (
              codes.map((c) => (
                <tr key={c.id} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-raised/50 transition-colors">
                  <Td>
                    <button
                      onClick={() => handleCopy(c.code, c.id)}
                      className="font-mono text-[0.8rem] text-text-primary hover:text-ember transition-colors"
                      title="Click to copy"
                    >
                      {c.code}
                      {copiedId === c.id && <span className="ml-xs font-sans text-[0.65rem] text-sage">copied</span>}
                    </button>
                  </Td>
                  <Td><StatusBadge code={c} /></Td>
                  <Td><span className="font-sans text-[0.8rem] text-text-secondary">{c.heuLabel ?? '—'}</span></Td>
                  <Td><span className="font-sans text-[0.8rem] text-text-secondary">{formatDate(c.expiresAt)}</span></Td>
                  <Td><span className="font-sans text-[0.8rem] text-text-muted">{formatDate(c.createdAt)}</span></Td>
                  <Td><span className="font-sans text-[0.8rem] text-text-muted">{formatDate(c.redeemedAt)}</span></Td>
                  <Td><span className="font-sans text-[0.8rem] text-text-muted truncate block max-w-[200px]">{c.notes ?? '—'}</span></Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-md">
          <p className="font-sans text-[0.75rem] text-text-muted">
            Showing page {page} of {pageCount} · {total} total
          </p>
          <div className="flex gap-xs">
            <PaginatorButton disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</PaginatorButton>
            <PaginatorButton disabled={page === pageCount} onClick={() => setPage((p) => p + 1)}>Next</PaginatorButton>
          </div>
        </div>
      )}

      {createOpen && (
        <CreateCodesModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); fetchCodes(); }}
        />
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-md py-sm font-sans text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-md py-sm">{children}</td>;
}

function PaginatorButton({
  children, disabled, onClick,
}: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-[6px] border border-border-subtle bg-surface-panel px-sm py-xs font-sans text-[0.75rem] font-medium text-text-secondary hover:border-border-medium hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {children}
    </button>
  );
}

function CreateCodesModal({
  onClose, onCreated,
}: { onClose: () => void; onCreated: (created: { id: string; code: string }[]) => void }) {
  const [count, setCount] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');
  const [heuLabel, setHeuLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; code: string }[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { count };
      if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();
      if (heuLabel.trim()) body.heuLabel = heuLabel.trim();
      if (notes.trim()) body.notes = notes.trim();
      const res = await fetch('/api/admin/provider-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError('Failed to create codes.');
        return;
      }
      const data = await res.json();
      setCreated(data.codes ?? []);
    } finally {
      setSubmitting(false);
    }
  }

  function copyAll() {
    if (!created) return;
    navigator.clipboard.writeText(created.map((c) => c.code).join('\n'));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-codes-title"
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-modal backdrop-blur-sm p-lg"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div className="w-full max-w-md rounded-[16px] bg-surface-panel border border-border-subtle shadow-float p-lg">
        <h2 id="create-codes-title" className="font-serif text-lg font-semibold text-text-primary mb-md">
          {created ? `Created ${created.length} code${created.length !== 1 ? 's' : ''}` : 'New Provider Codes'}
        </h2>

        {created ? (
          <>
            <div className="rounded-md border border-border-subtle bg-surface-raised p-sm max-h-[300px] overflow-y-auto mb-md">
              {created.map((c) => (
                <div key={c.id} className="font-mono text-[0.8rem] text-text-primary py-[2px]">{c.code}</div>
              ))}
            </div>
            <div className="flex justify-end gap-xs">
              <button
                onClick={copyAll}
                className="rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-sans text-[0.8rem] font-medium text-text-secondary hover:border-border-medium hover:text-text-primary transition-all"
              >
                Copy all
              </button>
              <button
                onClick={() => onCreated(created)}
                className="rounded-md bg-ember px-md py-sm font-sans text-[0.8rem] font-semibold text-text-inverse hover:bg-ember-hover transition-all"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-md">
            <Field label="How many codes?" htmlFor="count">
              <input
                id="count"
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                className="w-full bg-surface-input border border-border-subtle rounded-[6px] px-sm py-xs font-sans text-sm text-text-primary focus:outline-none focus:border-border-medium"
              />
              <p className="mt-xs font-sans text-[0.7rem] text-text-muted">Up to 100 at a time.</p>
            </Field>
            <Field label="Expires (optional)" htmlFor="expires">
              <input
                id="expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-surface-input border border-border-subtle rounded-[6px] px-sm py-xs font-sans text-sm text-text-primary focus:outline-none focus:border-border-medium"
              />
            </Field>
            <Field label="HEU label (optional)" htmlFor="heu">
              <input
                id="heu"
                type="text"
                value={heuLabel}
                onChange={(e) => setHeuLabel(e.target.value)}
                maxLength={120}
                placeholder="e.g. QLD-HEU-Brisbane-2026"
                className="w-full bg-surface-input border border-border-subtle rounded-[6px] px-sm py-xs font-sans text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium"
              />
              <p className="mt-xs font-sans text-[0.7rem] text-text-muted">Identifies which HEU office or program issued the code. Free-form.</p>
            </Field>
            <Field label="Notes (optional)" htmlFor="notes">
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full bg-surface-input border border-border-subtle rounded-[6px] px-sm py-xs font-sans text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium resize-none"
              />
            </Field>

            {error && (
              <p className="font-sans text-[0.8rem] text-red-400">{error}</p>
            )}

            <div className="flex justify-end gap-xs">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-sans text-[0.8rem] font-medium text-text-secondary hover:border-border-medium hover:text-text-primary disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-ember px-md py-sm font-sans text-[0.8rem] font-semibold text-text-inverse hover:bg-ember-hover disabled:opacity-50 transition-all"
              >
                {submitting ? 'Creating…' : `Create ${count}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block font-sans text-[0.75rem] font-semibold text-text-secondary mb-xs">
        {label}
      </label>
      {children}
    </div>
  );
}
