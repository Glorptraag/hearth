'use client';

import { useEffect, useState, useCallback } from 'react';
import InventoryTree from './_components/InventoryTree';
import type { InventoryItem } from './_components/InventoryTree';
import StatusFilter from './_components/StatusFilter';
import InventorySummaryBar from './_components/InventorySummaryBar';

interface InventoryData {
  packs: InventoryItem[];
  counts: Record<string, number>;
}

function collectAllIds(items: InventoryItem[]): string[] {
  const ids: string[] = [];
  function walk(list: InventoryItem[]) {
    for (const item of list) {
      ids.push(item._id);
      if (item.modules) walk(item.modules);
      if (item.approaches) walk(item.approaches);
      if (item.activities) walk(item.activities);
    }
  }
  walk(items);
  return ids;
}

export default function InventoryClient() {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/admin/content/inventory')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load inventory (${r.status})`);
        return r.json();
      })
      .then((d: InventoryData) => {
        setData(d);
        // Auto-expand packs on load
        setExpandedIds(new Set(d.packs.map((p) => p._id)));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleFilter = useCallback((status: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    if (!data) return;
    setExpandedIds(new Set(collectAllIds(data.packs)));
  }, [data]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-sans text-sm text-text-muted animate-pulse">Loading inventory...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-sans text-sm text-ember">{error}</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl font-semibold text-text-primary">Content Inventory</h1>
          <p className="font-sans text-xs text-text-muted mt-1">
            All packs, modules, approaches, and activities with workflow status.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-3 py-1.5 bg-transparent border border-border-subtle text-text-secondary font-sans text-xs rounded-[6px] hover:border-border-medium transition-colors"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-3 py-1.5 bg-transparent border border-border-subtle text-text-secondary font-sans text-xs rounded-[6px] hover:border-border-medium transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>

      <InventorySummaryBar counts={data.counts} />

      <StatusFilter
        counts={data.counts}
        active={activeFilters}
        onToggle={handleToggleFilter}
      />

      <InventoryTree
        items={data.packs}
        filters={activeFilters}
        expandedIds={expandedIds}
        onToggleExpand={handleToggleExpand}
      />
    </div>
  );
}
