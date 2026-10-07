'use client';

import { useState, useEffect, useCallback } from 'react';
import StatusPill from './_components/StatusPill';
import CreateInvitationModal from './_components/CreateInvitationModal';
import InvitationDetailPanel from './_components/InvitationDetailPanel';
import type { Invitation } from '@/types';

const STATUS_FILTERS = ['all', 'pending', 'redeemed', 'revoked', 'expired'] as const;

function timeAgo(d: Date | string | null): string {
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
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function truncateCode(code: string): string {
  const parts = code.split('-');
  if (parts.length <= 2) return code;
  return `${parts[0]}\u2026${parts[parts.length - 1]}`;
}

export default function InvitationsClient() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '50' });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/admin/invitations?${params}`);
      const data = await res.json();
      setInvitations(data.invitations);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  // Fetch-on-mount data hydration; setState calls inside fetchInvitations are gated on completion.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  function handleCopyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const pageCount = Math.ceil(total / 50);

  return (
    <div className="p-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-serif text-xl font-semibold text-text-primary">
          Invitations
        </h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-md bg-ember px-md py-sm font-sans text-[0.8rem] font-semibold text-text-inverse hover:bg-ember-hover transition duration-[var(--motion-quick)]"
        >
          + New Invitation
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-md mb-md">
        <div className="flex gap-xs">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-[6px] px-sm py-xs font-sans text-[0.7rem] font-semibold uppercase tracking-wider transition duration-[var(--motion-quick)] border ${
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
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search families, emails, sources..."
          className="flex-1 max-w-[300px] rounded-md border border-border-subtle bg-surface-body px-md py-xs font-sans text-sm text-text-primary placeholder:text-text-muted/50 focus:border-ember focus:outline-none transition-colors duration-[var(--motion-quick)]"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-raised">
              <Th>Family</Th>
              <Th>Email</Th>
              <Th>Source</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Expires</Th>
              <Th>Code</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-md py-lg text-center font-sans text-sm text-text-muted">
                  Loading...
                </td>
              </tr>
            ) : invitations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-md py-xl text-center">
                  <p className="font-sans text-sm text-text-muted mb-md">
                    No invitations yet. The first family that joins Hearth gets the first invitation.
                  </p>
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="rounded-md bg-ember px-md py-sm font-sans text-[0.8rem] font-semibold text-text-inverse hover:bg-ember-hover transition duration-[var(--motion-quick)]"
                  >
                    + New Invitation
                  </button>
                </td>
              </tr>
            ) : (
              invitations.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedId(inv.id)}
                  className="border-b border-border-subtle hover:bg-surface-hover cursor-pointer transition-colors duration-[var(--motion-quick)]"
                  style={{ height: 'var(--admin-row-height, 40px)' }}
                >
                  <td className="px-md font-sans text-sm font-medium text-text-primary">
                    {inv.intendedFamilyName}
                  </td>
                  <td className="px-md font-sans text-sm text-text-muted">
                    {inv.intendedPrimaryEmail || '\u2014'}
                  </td>
                  <td className="px-md">
                    {inv.sourceLabel ? (
                      <span className="inline-flex rounded-[6px] border border-border-subtle bg-surface-raised px-1.5 py-px font-sans text-[0.65rem] text-text-secondary">
                        {inv.sourceLabel}
                      </span>
                    ) : (
                      <span className="font-sans text-sm text-text-muted">\u2014</span>
                    )}
                  </td>
                  <td className="px-md">
                    <StatusPill status={inv.status} />
                  </td>
                  <td className="px-md font-sans text-xs text-text-muted">
                    {timeAgo(inv.createdAt)}
                  </td>
                  <td className="px-md font-sans text-xs text-text-muted">
                    {inv.expiresAt ? timeAgo(inv.expiresAt) : '\u2014'}
                  </td>
                  <td className="px-md">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCode(inv.code, inv.id);
                      }}
                      className="font-mono text-xs text-text-muted hover:text-ember transition-colors duration-[var(--motion-quick)]"
                      title={inv.code}
                    >
                      {copiedId === inv.id ? 'Copied!' : truncateCode(inv.code)}
                    </button>
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
            {total} invitation{total !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-xs">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-border-subtle px-sm py-xs font-sans text-xs text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors duration-[var(--motion-quick)]"
            >
              Prev
            </button>
            <span className="font-sans text-xs text-text-muted px-sm py-xs">
              {page} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              className="rounded-md border border-border-subtle px-sm py-xs font-sans text-xs text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors duration-[var(--motion-quick)]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateInvitationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchInvitations}
      />

      <InvitationDetailPanel
        invitationId={selectedId}
        onClose={() => setSelectedId(null)}
        onRevoked={() => { setSelectedId(null); fetchInvitations(); }}
      />
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
