'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PackListTable from './_components/PackListTable';
import type { PackSummary } from '@/lib/content-qa/run';

export default function QAPackListClient() {
  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/qa/packs');
      const data = await res.json();
      setPacks(data.packs ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch-on-mount data hydration; setState calls inside fetchPacks are gated on completion.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchPacks(); }, [fetchPacks]);

  return (
    <div className="p-lg">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="font-serif text-xl font-semibold text-text-primary">
            Content QA
          </h1>
          <p className="font-sans text-xs text-text-muted mt-xs">
            Pack completeness and integrity diagnostics
          </p>
        </div>
        <Link
          href="/admin/content/qa/issues"
          className="rounded-md border border-border-subtle px-md py-sm font-sans text-[0.8rem] font-semibold text-text-secondary hover:text-text-primary hover:border-border-medium transition duration-[var(--motion-quick)]"
        >
          All Issues
        </Link>
      </div>

      <PackListTable packs={packs} loading={loading} />
    </div>
  );
}
