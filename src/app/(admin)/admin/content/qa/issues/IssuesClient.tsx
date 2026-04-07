'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import IssueBrowser from '../_components/IssueBrowser';
import type { QAIssueFlat } from '@/lib/content-qa/run';

export default function IssuesClient() {
  const searchParams = useSearchParams();
  const initialPackId = searchParams.get('packId') ?? '';

  const [issues, setIssues] = useState<QAIssueFlat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    docType: '',
    packId: initialPackId,
    severity: '',
  });

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.docType) params.set('docType', filters.docType);
    if (filters.packId) params.set('packId', filters.packId);
    if (filters.severity) params.set('severity', filters.severity);

    try {
      const res = await fetch(`/api/admin/qa/issues?${params}`);
      const data = await res.json();
      setIssues(data.issues ?? []);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  function handleFilterChange(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="p-lg">
      <div className="flex items-center gap-sm mb-xs">
        <Link
          href="/admin/content/qa"
          className="font-sans text-xs text-text-muted hover:text-text-primary transition-colors duration-200"
        >
          QA
        </Link>
        <span className="font-sans text-xs text-text-muted">/</span>
        <span className="font-sans text-xs text-text-secondary">Issues</span>
      </div>

      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-serif text-xl font-semibold text-text-primary">
          Issue Browser
        </h1>
      </div>

      <IssueBrowser
        issues={issues}
        loading={loading}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}
