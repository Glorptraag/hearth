'use client';

import { useState, useCallback } from 'react';
import ReasonModal from './_components/ReasonModal';
import FamilyDetail from './_components/FamilyDetail';

interface SearchResult {
  id: string;
  familyName: string;
  clerkUserId: string;
  createdAt: string | null;
}

type SearchType = 'name' | 'email' | 'id';

const SEARCH_TYPES: { value: SearchType; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'id', label: 'ID' },
];

function timeAgo(d: string | null): string {
  if (!d) return '\u2014';
  const now = Date.now();
  const then = new Date(d).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 1) return 'today';
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export default function FamiliesClient() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('name');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  // Reason modal for viewing a family
  const [pendingFamilyId, setPendingFamilyId] = useState<string | null>(null);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);

  // Detail panel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [familyData, setFamilyData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: query.trim(), type: searchType });
      const res = await fetch(`/api/admin/families/search?${params}`);
      const data = await res.json();
      setResults(data.matches ?? []);
    } finally {
      setSearching(false);
    }
  }, [query, searchType]);

  function handleRowClick(familyId: string) {
    setPendingFamilyId(familyId);
    setReasonModalOpen(true);
  }

  async function handleReasonConfirm(reason: string) {
    if (!pendingFamilyId) return;
    setReasonModalOpen(false);
    setDetailLoading(true);
    setFamilyData(null);

    try {
      const res = await fetch(`/api/admin/families/${pendingFamilyId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Failed to load family');
      const data = await res.json();
      setFamilyData(data);
    } catch {
      setFamilyData(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleCloseDetail() {
    setFamilyData(null);
    setPendingFamilyId(null);
  }

  return (
    <div className="p-lg">
      {/* Header */}
      <div className="mb-lg">
        <h1 className="font-serif text-xl font-semibold text-text-primary mb-xs">
          Family Support
        </h1>
        <p className="font-sans text-sm text-text-muted">
          Audited lookup tool. Every search and view is logged with your reason.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-sm mb-lg">
        <div className="flex gap-xs">
          {SEARCH_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setSearchType(t.value)}
              className={`rounded-[6px] px-sm py-xs font-sans text-[0.7rem] font-semibold uppercase tracking-wider transition-all duration-[var(--motion-quick)] border ${
                searchType === t.value
                  ? 'border-border-medium bg-surface-raised text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border-subtle'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={
            searchType === 'id'
              ? 'Paste family UUID...'
              : searchType === 'email'
                ? 'Search by email...'
                : 'Search by family name...'
          }
          className="flex-1 max-w-[400px] rounded-md border border-border-subtle bg-surface-body px-md py-xs font-sans text-sm text-text-primary placeholder:text-text-muted/50 focus:border-ember focus:outline-none transition-colors duration-[var(--motion-quick)]"
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim() || searching}
          className="rounded-md bg-ember px-md py-xs font-sans text-[0.8rem] font-semibold text-text-inverse hover:bg-ember-hover disabled:opacity-50 transition-all duration-[var(--motion-quick)]"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results table */}
      {searched && (
        <div className="rounded-lg border border-border-subtle overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-raised">
                <Th>Family Name</Th>
                <Th>Clerk User ID</Th>
                <Th>Signup</Th>
              </tr>
            </thead>
            <tbody>
              {searching ? (
                <tr>
                  <td colSpan={3} className="px-md py-lg text-center font-sans text-sm text-text-muted">
                    Searching...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-md py-xl text-center font-sans text-sm text-text-muted">
                    No families found for this query.
                  </td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => handleRowClick(r.id)}
                    className="border-b border-border-subtle hover:bg-surface-hover cursor-pointer transition-colors duration-[var(--motion-quick)]"
                    style={{ height: 'var(--admin-row-height, 40px)' }}
                  >
                    <td className="px-md font-sans text-sm font-medium text-text-primary">
                      {r.familyName}
                    </td>
                    <td className="px-md font-mono text-xs text-text-muted">
                      {r.clerkUserId}
                    </td>
                    <td className="px-md font-sans text-xs text-text-muted">
                      {timeAgo(r.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Security notice */}
      {!searched && (
        <div className="rounded-lg border border-border-subtle bg-surface-body p-xl text-center">
          <p className="font-sans text-sm text-text-muted mb-xs">
            Search for a family to view their account details.
          </p>
          <p className="font-sans text-xs text-text-muted/70">
            All lookups require a reason and are permanently logged in the audit trail.
          </p>
        </div>
      )}

      {/* Reason Modal */}
      <ReasonModal
        open={reasonModalOpen}
        title="View Family Record"
        description="You are about to view a family record. This access will be logged with your reason."
        confirmLabel="View Family"
        onConfirm={handleReasonConfirm}
        onCancel={() => { setReasonModalOpen(false); setPendingFamilyId(null); }}
      />

      {/* Detail slide-over */}
      {(familyData || detailLoading) && (
        <FamilyDetail
          data={familyData}
          loading={detailLoading}
          onClose={handleCloseDetail}
        />
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
