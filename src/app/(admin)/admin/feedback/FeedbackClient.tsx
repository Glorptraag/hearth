'use client';

import { useState, useEffect, useCallback } from 'react';

interface FeedbackEntry {
  id: string;
  familyId: string;
  userId: string;
  category: 'bug' | 'idea' | 'confusion' | 'praise';
  message: string;
  route: string | null;
  createdAt: string;
}

const CATEGORY_GROUPS = [
  { label: 'All', value: '' },
  { label: 'Bugs', value: 'bug' },
  { label: 'Ideas', value: 'idea' },
  { label: 'Confusion', value: 'confusion' },
  { label: 'Praise', value: 'praise' },
];

const CATEGORY_STYLE: Record<FeedbackEntry['category'], string> = {
  bug: 'text-rose',
  idea: 'text-blue',
  confusion: 'text-violet',
  praise: 'text-sage',
};

export default function FeedbackClient() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const PAGE_SIZE = 50;

  const fetchEntries = useCallback(async (pageNum: number, category: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(pageNum * PAGE_SIZE),
      });
      if (category) params.set('category', category);
      const res = await fetch(`/api/admin/feedback?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setHasMore(data.entries.length === PAGE_SIZE);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount data hydration; setState calls inside fetchEntries are gated on completion.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEntries(page, filter);
  }, [fetchEntries, page, filter]);

  function handleFilterChange(value: string) {
    setFilter(value);
    setPage(0);
  }

  return (
    <div className="p-lg max-w-[960px]">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-serif text-xl font-semibold text-text-primary">
          Pilot Feedback
        </h1>
        <button
          onClick={() => fetchEntries(page, filter)}
          className="rounded-md border border-border-subtle px-sm py-xs font-sans text-[0.7rem] font-medium text-text-muted hover:text-text-primary hover:border-border-medium transition-all duration-200"
        >
          Refresh
        </button>
      </div>

      <p className="font-sans text-[0.7rem] text-text-muted mb-md">
        In-app submissions from families. Triage convention: transcribe into{' '}
        <span className="font-medium text-text-secondary">docs/hearth-research-log.md</span>,
        then file a regression test for any confirmed bug.
      </p>

      {/* Filters */}
      <div className="flex gap-xs mb-md flex-wrap">
        {CATEGORY_GROUPS.map((g) => (
          <button
            key={g.value}
            onClick={() => handleFilterChange(g.value)}
            className={`rounded-md px-sm py-xs font-sans text-[0.7rem] font-medium border transition-all duration-200 ${
              filter === g.value
                ? 'border-border-medium bg-surface-raised text-ember'
                : 'border-border-subtle text-text-muted hover:text-text-primary hover:border-border-medium'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {loading ? (
        <FeedbackSkeleton />
      ) : entries.length === 0 ? (
        <p className="font-sans text-sm text-text-muted">No feedback yet.</p>
      ) : (
        <div className="space-y-xs">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-border-subtle bg-surface-panel p-md"
            >
              <div className="flex items-start justify-between gap-md">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-sm flex-wrap">
                    <span className={`font-sans text-[0.7rem] font-semibold uppercase tracking-wider ${CATEGORY_STYLE[entry.category]}`}>
                      {entry.category}
                    </span>
                    {entry.route && (
                      <span className="rounded-[6px] bg-surface-raised px-1.5 py-px font-sans text-[0.6rem] font-medium text-text-muted">
                        {entry.route}
                      </span>
                    )}
                  </div>
                  <p className="font-serif text-[0.85rem] text-text-secondary mt-xs whitespace-pre-wrap break-words">
                    {entry.message}
                  </p>
                  <p className="font-sans text-[0.65rem] text-text-muted mt-xs">
                    family #{entry.familyId.slice(0, 8)}
                  </p>
                </div>
                <time className="font-sans text-[0.65rem] text-text-muted whitespace-nowrap">
                  {new Date(entry.createdAt).toLocaleString()}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && (entries.length > 0 || page > 0) && (
        <div className="flex items-center justify-between mt-md">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-md border border-border-subtle px-sm py-xs font-sans text-[0.7rem] font-medium text-text-muted hover:text-text-primary transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="font-sans text-[0.65rem] text-text-muted">
            Page {page + 1}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="rounded-md border border-border-subtle px-sm py-xs font-sans text-[0.7rem] font-medium text-text-muted hover:text-text-primary transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function FeedbackSkeleton() {
  return (
    <div className="space-y-xs">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border-subtle bg-surface-panel p-md animate-pulse"
        >
          <div className="flex items-start justify-between gap-md">
            <div className="flex-1">
              <div className="h-3 w-24 rounded bg-surface-raised mb-xs" />
              <div className="h-2.5 w-64 rounded bg-surface-raised" />
            </div>
            <div className="h-2.5 w-24 rounded bg-surface-raised" />
          </div>
        </div>
      ))}
    </div>
  );
}
