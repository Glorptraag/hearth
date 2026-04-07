'use client';

import { useState, useEffect, useCallback } from 'react';

const RESOURCE_TYPES = [
  'all',
  'invitation',
  'content_draft',
  'pack',
  'family',
  'snapshot',
] as const;

interface AuditEntry {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: string;
  targetResource: string | null;
  targetId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  mfaSatisfied: boolean | null;
  createdAt: string | null;
}

function timeAgo(d: string | null): string {
  if (!d) return '\u2014';
  const now = Date.now();
  const then = new Date(d).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function absoluteTime(d: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AuditLogClient() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceType, setResourceType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (actionFilter) params.set('action', actionFilter);
    if (resourceType !== 'all') params.set('resource_type', resourceType);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    try {
      const res = await fetch(`/api/admin/audit-log?${params}`);
      const data = await res.json();
      setEntries(data.entries);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, resourceType, dateFrom, dateTo]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const pageCount = Math.ceil(total / 50);

  return (
    <div className="p-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-serif text-xl font-semibold text-text-primary">
          Audit Log
        </h1>
        <span className="font-sans text-xs text-text-muted">
          {total.toLocaleString()} event{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-md mb-md">
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          placeholder="Filter by action..."
          className="rounded-md border border-border-subtle bg-surface-body px-md py-xs font-sans text-sm text-text-primary placeholder:text-text-muted/50 focus:border-ember focus:outline-none transition-colors duration-200 w-[200px]"
        />
        <select
          value={resourceType}
          onChange={(e) => { setResourceType(e.target.value); setPage(1); }}
          className="rounded-md border border-border-subtle bg-surface-body px-md py-xs font-sans text-sm text-text-primary focus:border-ember focus:outline-none transition-colors duration-200"
        >
          {RESOURCE_TYPES.map((r) => (
            <option key={r} value={r}>
              {r === 'all' ? 'All resources' : r}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-xs">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-md border border-border-subtle bg-surface-body px-sm py-xs font-sans text-sm text-text-primary focus:border-ember focus:outline-none transition-colors duration-200"
          />
          <span className="font-sans text-xs text-text-muted">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-md border border-border-subtle bg-surface-body px-sm py-xs font-sans text-sm text-text-primary focus:border-ember focus:outline-none transition-colors duration-200"
          />
        </div>
        {(actionFilter || resourceType !== 'all' || dateFrom || dateTo) && (
          <button
            onClick={() => { setActionFilter(''); setResourceType('all'); setDateFrom(''); setDateTo(''); setPage(1); }}
            className="font-sans text-xs text-text-muted hover:text-text-secondary transition-colors duration-200"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-raised">
              <Th>Timestamp</Th>
              <Th>Admin</Th>
              <Th>Action</Th>
              <Th>Resource</Th>
              <Th>Target ID</Th>
              <Th>Reason</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-md py-lg text-center font-sans text-sm text-text-muted">
                  Loading...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-md py-xl text-center">
                  <p className="font-sans text-sm text-text-muted">
                    No audit events found.
                  </p>
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border-subtle hover:bg-surface-hover transition-colors duration-200"
                  style={{ height: '40px' }}
                >
                  <td className="px-md" title={absoluteTime(entry.createdAt)}>
                    <span className="font-sans text-xs text-text-muted">
                      {timeAgo(entry.createdAt)}
                    </span>
                  </td>
                  <td className="px-md">
                    <span className="font-sans text-xs text-text-secondary" title={entry.adminUserId}>
                      {entry.adminEmail}
                    </span>
                  </td>
                  <td className="px-md">
                    <span className="inline-flex rounded-[6px] border border-border-subtle bg-surface-raised px-1.5 py-px font-mono text-[0.65rem] text-text-primary">
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-md">
                    {entry.targetResource ? (
                      <span className="inline-flex rounded-[6px] border border-border-subtle bg-surface-raised px-1.5 py-px font-sans text-[0.65rem] text-text-secondary">
                        {entry.targetResource}
                      </span>
                    ) : (
                      <span className="font-sans text-xs text-text-muted">&mdash;</span>
                    )}
                  </td>
                  <td className="px-md">
                    {entry.targetId ? (
                      <span className="font-mono text-xs text-text-muted" title={entry.targetId}>
                        {entry.targetId.length > 12 ? `${entry.targetId.slice(0, 8)}\u2026` : entry.targetId}
                      </span>
                    ) : (
                      <span className="font-sans text-xs text-text-muted">&mdash;</span>
                    )}
                  </td>
                  <td className="px-md">
                    {entry.reason ? (
                      <span className="font-sans text-xs text-text-secondary">
                        {entry.reason}
                      </span>
                    ) : (
                      <span className="font-sans text-xs text-text-muted">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-md">
          <span className="font-sans text-xs text-text-muted">
            {total.toLocaleString()} event{total !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-xs">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-border-subtle px-sm py-xs font-sans text-xs text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors duration-200"
            >
              Prev
            </button>
            <span className="font-sans text-xs text-text-muted px-sm py-xs">
              {page} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              className="rounded-md border border-border-subtle px-sm py-xs font-sans text-xs text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors duration-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-md py-sm text-left font-sans text-[0.65rem] font-semibold text-text-muted uppercase tracking-wider">
      {children}
    </th>
  );
}
