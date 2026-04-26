'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MaterialItemRow } from './MaterialItemRow';
import { PrintSheet } from './PrintSheet';
import type { PrintableItem, PrintSelection, PrintBundleResponse, AssetKind } from './types';
import { isPrintableAssetKind, fetchPrintBundle } from './types';

type KindFilter = 'all' | 'print' | 'read' | 'audio';
type SortMode = 'alpha' | 'pack';

const KIND_CHIPS: { label: string; value: KindFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Print', value: 'print' },
  { label: 'Read', value: 'read' },
  { label: 'Audio', value: 'audio' },
];

interface MaterialsAsset {
  _id: string;
  title: string;
  slug?: { current: string };
  kind: string;
  pageCount?: number;
  description?: string;
  printGuidance?: string;
  ageBand?: string;
  status: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  role: string;
  packTitle: string;
  moduleTitle: string;
  activityTitle: string;
}

interface MaterialsCommonsText {
  _id: string;
  title: string;
  slug?: { current: string };
  kind: string;
  tradition?: string;
  estimatedReadAloudMinutes?: number;
  length?: string;
  source?: string;
  status: string;
  role: string;
  presentationMode?: string;
  packTitle: string;
  moduleTitle: string;
  activityTitle: string;
}

interface MaterialsResponse {
  assets: MaterialsAsset[];
  commonsTexts: MaterialsCommonsText[];
  totalPrintablePages: number;
}

interface LibraryPack {
  sanityPackId: string;
  title: string;
}

interface LibraryMaterialsTabProps {
  packs: LibraryPack[];
}

export function LibraryMaterialsTab({ packs }: LibraryMaterialsTabProps) {
  const [data, setData] = useState<MaterialsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [packFilter, setPackFilter] = useState<string>('');
  const [sortMode, setSortMode] = useState<SortMode>('alpha');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPrintSheet, setShowPrintSheet] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (packFilter) params.set('packId', packFilter);
      if (sortMode) params.set('sort', sortMode);
      const res = await fetch(`/api/library/materials?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [packFilter, sortMode]);

  useEffect(() => {
    // Fetch-on-deps-change data hydration; setState calls inside fetchMaterials are gated on completion.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMaterials();
  }, [fetchMaterials]);

  // Convert API response to PrintableItems
  const allItems = useMemo<PrintableItem[]>(() => {
    if (!data) return [];

    const items: PrintableItem[] = [];

    for (const asset of data.assets) {
      items.push({
        id: asset._id,
        kind: 'asset',
        assetKind: asset.kind as AssetKind,
        title: asset.title,
        thumbnailUrl: asset.thumbnailUrl ?? null,
        pageCount: asset.pageCount ?? 0,
        description: asset.description,
        role: asset.role as PrintableItem['role'],
        isPrintable: isPrintableAssetKind(asset.kind as AssetKind),
        module: { id: '', title: asset.moduleTitle },
      });
    }

    for (const text of data.commonsTexts) {
      items.push({
        id: text._id,
        kind: 'commonsText',
        commonsKind: text.kind as PrintableItem['commonsKind'],
        title: text.title,
        thumbnailUrl: null,
        pageCount: text.estimatedReadAloudMinutes ?? 0,
        role: text.role as PrintableItem['role'],
        isPrintable: true,
        module: { id: '', title: text.moduleTitle },
      });
    }

    return items;
  }, [data]);

  // Apply kind filter and search
  const filteredItems = useMemo(() => {
    let items = allItems;

    if (kindFilter === 'print') {
      items = items.filter((i) => i.kind === 'asset' && i.assetKind !== 'audio');
    } else if (kindFilter === 'read') {
      items = items.filter((i) => i.kind === 'commonsText');
    } else if (kindFilter === 'audio') {
      items = items.filter((i) => i.assetKind === 'audio');
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter((i) => i.title.toLowerCase().includes(q));
    }

    return items;
  }, [allItems, kindFilter, search]);

  function toggleSelect(id: string, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleSelectAll() {
    const printableIds = filteredItems.filter((i) => i.isPrintable).map((i) => i.id);
    const allSelected = printableIds.every((id) => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(printableIds));
  }

  function handleDownload(item: PrintableItem) {
    const endpoint = item.kind === 'asset'
      ? `/api/assets/download?id=${item.id}`
      : `/api/commons/render?id=${item.id}`;
    window.open(endpoint, '_blank');
  }

  // Print sheet groups (by module)
  const printSheetGroups = useMemo(() => {
    const selected = filteredItems.filter((i) => selectedIds.has(i.id) && i.isPrintable);
    const byModule = new Map<string, PrintableItem[]>();
    for (const item of selected) {
      const key = item.module?.title ?? 'Other';
      if (!byModule.has(key)) byModule.set(key, []);
      byModule.get(key)!.push(item);
    }
    return Array.from(byModule.entries()).map(([label, items]) => ({ label, items }));
  }, [filteredItems, selectedIds]);

  async function handlePrintGenerate(selection: PrintSelection): Promise<PrintBundleResponse> {
    const items = selection.itemIds
      .map((id) => allItems.find((i) => i.id === id))
      .filter(Boolean)
      .map((i) => ({ id: i!.id, kind: i!.kind }));

    return fetchPrintBundle(items, {
      copies: selection.copies,
      combine: selection.combine,
      coverTitle: 'Library Materials',
    });
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="font-sans text-sm text-text-muted animate-pulse">Loading materials…</p>
      </div>
    );
  }

  if (filteredItems.length === 0 && allItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-4xl mb-md" aria-hidden="true">📦</span>
        <h3 className="font-serif text-lg font-semibold text-text-primary mb-sm">
          No materials yet
        </h3>
        <p className="font-sans text-sm text-text-secondary max-w-xs">
          Materials from your library packs will appear here. Browse the marketplace to add packs.
        </p>
      </div>
    );
  }

  const printableIds = filteredItems.filter((i) => i.isPrintable).map((i) => i.id);
  const allSelected = printableIds.length > 0 && printableIds.every((id) => selectedIds.has(id));

  return (
    <div>
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-sm mb-lg">
        {/* Kind chips */}
        <div className="flex gap-xs">
          {KIND_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setKindFilter(chip.value)}
              className={`font-sans text-[0.72rem] font-semibold px-2.5 py-1 rounded-full border transition-all duration-200 ${
                kindFilter === chip.value
                  ? 'bg-ember text-text-inverse border-ember'
                  : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Pack filter */}
        {packs.length > 1 && (
          <select
            value={packFilter}
            onChange={(e) => setPackFilter(e.target.value)}
            className="font-sans text-[0.75rem] text-text-secondary bg-surface-panel border border-border-subtle rounded-[6px] px-sm py-xs focus:outline-none focus:border-border-medium"
          >
            <option value="">All packs</option>
            {packs.map((p) => (
              <option key={p.sanityPackId} value={p.sanityPackId}>{p.title}</option>
            ))}
          </select>
        )}

        {/* Sort */}
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="font-sans text-[0.75rem] text-text-secondary bg-surface-panel border border-border-subtle rounded-[6px] px-sm py-xs focus:outline-none focus:border-border-medium"
        >
          <option value="alpha">A–Z</option>
          <option value="pack">By Pack</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[120px]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials…"
            className="w-full bg-surface-panel border border-border-subtle rounded-[6px] px-sm py-xs font-sans text-[0.75rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium"
          />
        </div>
      </div>

      {/* Summary + select all */}
      <div className="flex items-center justify-between mb-md">
        <p className="font-sans text-[0.72rem] text-text-muted">
          {filteredItems.length} material{filteredItems.length !== 1 ? 's' : ''}
          {data?.totalPrintablePages ? ` · ${data.totalPrintablePages} printable pages` : ''}
        </p>
        <button
          onClick={handleSelectAll}
          className="font-sans text-[0.72rem] font-medium text-ember hover:text-ember/80 transition-colors duration-200"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-xs mb-lg">
        {filteredItems.map((item) => (
          <MaterialItemRow
            key={item.id}
            item={item}
            selectable
            selected={selectedIds.has(item.id)}
            onSelect={toggleSelect}
            onDownload={handleDownload}
          />
        ))}
      </div>

      {filteredItems.length > 0 && filteredItems.length < allItems.length && (
        <p className="text-center font-sans text-[0.72rem] text-text-muted mb-lg">
          Showing {filteredItems.length} of {allItems.length} materials
        </p>
      )}

      {/* Print footer */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-0 bg-surface-body border-t border-border-subtle px-md py-md -mx-md">
          <button
            onClick={() => setShowPrintSheet(true)}
            className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember/90 transition-all duration-200"
          >
            Print {selectedIds.size} selected item{selectedIds.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Print Sheet */}
      {showPrintSheet && (
        <PrintSheet
          isOpen={showPrintSheet}
          title="Print Library Materials"
          groups={printSheetGroups}
          defaultCopies={1}
          onClose={() => setShowPrintSheet(false)}
          onGenerate={handlePrintGenerate}
        />
      )}
    </div>
  );
}
