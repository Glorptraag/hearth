'use client';

import { useState, useMemo, useEffect } from 'react';
import { sanityClient } from '@/lib/sanity/client';
import { PACK_MATERIALS_QUERY } from '@/lib/sanity/queries';
import { MaterialItemRow } from './MaterialItemRow';
import { PrintSheet } from './PrintSheet';
import type { PrintableItem, PrintSelection, PrintBundleResponse } from './types';
import { isPrintableAssetKind, fetchPrintBundle, type AssetKind } from './types';

interface PackMaterialsData {
  _id: string;
  title: string;
  modules: Array<{
    _id: string;
    title: string;
    approaches: Array<{
      activities: Array<{
        _id: string;
        title: string;
        assets?: Array<{
          _key: string;
          role: string;
          notes?: string;
          asset: {
            _id: string;
            title: string;
            slug?: { current: string };
            kind: string;
            pageCount?: number;
            description?: string;
            printGuidance?: string;
            ageBand?: string;
            status: string;
            thumbnailUrl?: string;
          };
        }>;
        commonsTexts?: Array<{
          _key: string;
          role: string;
          presentationMode?: string;
          notes?: string;
          text: {
            _id: string;
            title: string;
            slug?: { current: string };
            kind: string;
            tradition?: string;
            estimatedReadAloudMinutes?: number;
            length?: string;
            source?: string;
            status: string;
          };
        }>;
      }>;
    }>;
  }>;
}

type FilterKind = 'all' | 'print' | 'read' | 'audio';

const FILTER_CHIPS: { label: string; value: FilterKind }[] = [
  { label: 'All', value: 'all' },
  { label: 'Print', value: 'print' },
  { label: 'Read', value: 'read' },
  { label: 'Audio', value: 'audio' },
];

interface ModuleGroup {
  moduleId: string;
  moduleTitle: string;
  items: PrintableItem[];
}

interface PackMaterialsListProps {
  packId: string;
  packTitle: string;
  inLibrary: boolean;
  onBack: () => void;
}

export function PackMaterialsList({ packId, packTitle, inLibrary, onBack }: PackMaterialsListProps) {
  const [data, setData] = useState<PackMaterialsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKind>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPrintSheet, setShowPrintSheet] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function fetchMaterials() {
      setLoading(true);
      try {
        const result = await sanityClient.fetch<PackMaterialsData>(PACK_MATERIALS_QUERY, { packId });
        if (!cancelled) setData(result);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMaterials();
    return () => { cancelled = true; };
  }, [packId]);

  // Flatten pack data into module groups of PrintableItems
  const moduleGroups = useMemo<ModuleGroup[]>(() => {
    if (!data?.modules) return [];

    const groups: ModuleGroup[] = [];
    const seenIds = new Set<string>();

    for (const mod of data.modules) {
      const items: PrintableItem[] = [];

      for (const approach of mod.approaches ?? []) {
        for (const activity of approach.activities ?? []) {
          for (const ref of activity.assets ?? []) {
            if (!ref.asset || seenIds.has(ref.asset._id)) continue;
            seenIds.add(ref.asset._id);
            items.push({
              id: ref.asset._id,
              kind: 'asset',
              assetKind: ref.asset.kind as AssetKind,
              title: ref.asset.title,
              thumbnailUrl: ref.asset.thumbnailUrl ?? null,
              pageCount: ref.asset.pageCount ?? 0,
              description: ref.asset.description,
              role: ref.role as PrintableItem['role'],
              isPrintable: isPrintableAssetKind(ref.asset.kind as AssetKind),
              module: { id: mod._id, title: mod.title },
              activity: { id: activity._id, title: activity.title },
            });
          }
          for (const ref of activity.commonsTexts ?? []) {
            if (!ref.text || seenIds.has(ref.text._id)) continue;
            seenIds.add(ref.text._id);
            items.push({
              id: ref.text._id,
              kind: 'commonsText',
              commonsKind: ref.text.kind as PrintableItem['commonsKind'],
              title: ref.text.title,
              thumbnailUrl: null,
              pageCount: ref.text.estimatedReadAloudMinutes ?? 0,
              role: ref.role as PrintableItem['role'],
              isPrintable: true,
              module: { id: mod._id, title: mod.title },
              activity: { id: activity._id, title: activity.title },
            });
          }
        }
      }

      if (items.length > 0) {
        groups.push({ moduleId: mod._id, moduleTitle: mod.title, items });
      }
    }

    return groups;
  }, [data]);

  // Apply filter
  const filteredGroups = useMemo(() => {
    if (filter === 'all') return moduleGroups;
    return moduleGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (filter === 'print') return item.kind === 'asset' && item.assetKind !== 'audio';
          if (filter === 'read') return item.kind === 'commonsText';
          if (filter === 'audio') return item.assetKind === 'audio';
          return true;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [moduleGroups, filter]);

  const totalItems = filteredGroups.reduce((sum, g) => sum + g.items.length, 0);

  function toggleModule(moduleId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function toggleSelect(id: string, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleSelectAll() {
    const allPrintableIds = filteredGroups
      .flatMap((g) => g.items)
      .filter((i) => i.isPrintable)
      .map((i) => i.id);
    const allSelected = allPrintableIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allPrintableIds));
    }
  }

  async function handleDownload(item: PrintableItem) {
    const endpoint = item.kind === 'asset'
      ? `/api/assets/download?id=${item.id}`
      : `/api/commons/render?id=${item.id}`;
    window.open(endpoint, '_blank');
  }

  // Build PrintSheet groups from selected items
  const printSheetGroups = useMemo(() => {
    const selectedItems = filteredGroups
      .flatMap((g) => g.items)
      .filter((i) => selectedIds.has(i.id) && i.isPrintable);

    // Group by module
    const byModule = new Map<string, PrintableItem[]>();
    for (const item of selectedItems) {
      const key = item.module?.title ?? 'Other';
      if (!byModule.has(key)) byModule.set(key, []);
      byModule.get(key)!.push(item);
    }

    return Array.from(byModule.entries()).map(([label, items]) => ({
      label,
      items,
    }));
  }, [filteredGroups, selectedIds]);

  async function handlePrintGenerate(selection: PrintSelection): Promise<PrintBundleResponse> {
    const allItems = filteredGroups.flatMap((g) => g.items);
    const items = selection.itemIds
      .map((id) => allItems.find((i) => i.id === id))
      .filter(Boolean)
      .map((i) => ({ id: i!.id, kind: i!.kind }));

    return fetchPrintBundle(items, {
      copies: selection.copies,
      combine: selection.combine,
      coverTitle: packTitle,
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-md px-xl pt-lg pb-md border-b border-border-subtle">
          <button onClick={onBack} className="font-sans text-sm text-text-secondary hover:text-ember transition-colors duration-200">
            ← Back
          </button>
          <h3 className="font-serif text-lg font-semibold text-text-primary">{packTitle}</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-sans text-sm text-text-muted animate-pulse">Loading materials…</p>
        </div>
      </div>
    );
  }

  if (!data || totalItems === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-md px-xl pt-lg pb-md border-b border-border-subtle">
          <button onClick={onBack} className="font-sans text-sm text-text-secondary hover:text-ember transition-colors duration-200">
            ← Back
          </button>
          <h3 className="font-serif text-lg font-semibold text-text-primary">{packTitle}</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-lg">
          <span className="text-4xl mb-md" aria-hidden="true">📦</span>
          <p className="font-serif text-sm text-text-secondary">No materials included in this pack yet.</p>
        </div>
      </div>
    );
  }

  const allPrintableIds = filteredGroups.flatMap((g) => g.items).filter((i) => i.isPrintable).map((i) => i.id);
  const allSelected = allPrintableIds.length > 0 && allPrintableIds.every((id) => selectedIds.has(id));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-xl pt-lg pb-md border-b border-border-subtle">
        <div className="flex items-center gap-md mb-sm">
          <button onClick={onBack} className="font-sans text-sm text-text-secondary hover:text-ember transition-colors duration-200">
            ← Back
          </button>
          <h3 className="font-serif text-lg font-semibold text-text-primary flex-1 truncate">{packTitle}</h3>
        </div>
        <p className="font-sans text-[0.72rem] text-text-muted mb-md">
          {totalItems} material{totalItems !== 1 ? 's' : ''}
        </p>

        {/* Filter chips */}
        <div className="flex gap-xs">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setFilter(chip.value)}
              className={`font-sans text-[0.72rem] font-semibold px-2.5 py-1 rounded-full border transition-all duration-200 ${
                filter === chip.value
                  ? 'bg-ember text-text-inverse border-ember'
                  : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Module groups */}
      <div className="flex-1 overflow-y-auto px-xl py-lg space-y-lg">
        {inLibrary && selectedIds.size === 0 && (
          <div className="flex items-center justify-between">
            <button
              onClick={handleSelectAll}
              className="font-sans text-[0.72rem] font-medium text-ember hover:text-ember/80 transition-colors duration-200"
            >
              {allSelected ? 'Deselect all' : 'Select all for printing'}
            </button>
          </div>
        )}

        {filteredGroups.map((group) => {
          const isCollapsed = collapsed.has(group.moduleId);
          return (
            <div key={group.moduleId}>
              <button
                onClick={() => toggleModule(group.moduleId)}
                className="w-full flex items-center gap-sm mb-sm group"
              >
                <span className="font-sans text-[0.68rem] text-text-muted transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted group-hover:text-text-secondary transition-colors duration-200">
                  {group.moduleTitle}
                </p>
                <span className="font-sans text-[10px] text-text-muted">
                  ({group.items.length})
                </span>
              </button>

              {!isCollapsed && (
                <div className="space-y-xs">
                  {group.items.map((item) => (
                    <MaterialItemRow
                      key={item.id}
                      item={item}
                      compact
                      selectable={inLibrary}
                      selected={selectedIds.has(item.id)}
                      onSelect={toggleSelect}
                      onDownload={inLibrary ? handleDownload : undefined}
                      disabled={!inLibrary}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer: print selected */}
      {inLibrary && selectedIds.size > 0 && (
        <div className="px-xl py-md border-t border-border-subtle bg-surface-panel">
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
          title={`Print from ${packTitle}`}
          groups={printSheetGroups}
          defaultCopies={1}
          onClose={() => setShowPrintSheet(false)}
          onGenerate={handlePrintGenerate}
        />
      )}
    </div>
  );
}
