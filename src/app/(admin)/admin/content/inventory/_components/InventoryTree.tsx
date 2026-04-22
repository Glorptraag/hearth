'use client';

import { useState } from 'react';
import StatusBadge from './StatusBadge';

export interface InventoryItem {
  _id: string;
  title: string;
  slug?: string;
  status: string;
  _updatedAt?: string;
  modality?: string;
  modules?: InventoryItem[];
  approaches?: InventoryItem[];
  activities?: InventoryItem[];
}

type DocType = 'pack' | 'module' | 'approach' | 'activity';

const DOC_EMOJI: Record<DocType, string> = {
  pack: '\uD83D\uDCE6',     // 📦
  module: '\uD83D\uDCDA',   // 📚
  approach: '\uD83C\uDFAF', // 🎯
  activity: '\uD83D\uDCDD', // 📝
};

function getDocType(item: InventoryItem): DocType {
  if (item.modules) return 'pack';
  if (item.approaches) return 'module';
  if (item.activities) return 'approach';
  return 'activity';
}

function getChildren(item: InventoryItem): InventoryItem[] {
  return item.modules ?? item.approaches ?? item.activities ?? [];
}

function hasMatchingDescendant(item: InventoryItem, filters: Set<string>): boolean {
  if (filters.has(item.status)) return true;
  for (const child of getChildren(item)) {
    if (hasMatchingDescendant(child, filters)) return true;
  }
  return false;
}

interface TreeProps {
  items: InventoryItem[];
  filters: Set<string>;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

export default function InventoryTree({ items, filters, expandedIds, onToggleExpand }: TreeProps) {
  return (
    <div className="rounded-lg border border-border-subtle overflow-hidden">
      {items.length === 0 && (
        <div className="py-8 text-center text-text-muted text-sm font-sans">No content found.</div>
      )}
      {items.map((item, i) => (
        <TreeRow
          key={item._id}
          item={item}
          depth={0}
          isLast={i === items.length - 1}
          filters={filters}
          expandedIds={expandedIds}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </div>
  );
}

function TreeRow({
  item,
  depth,
  isLast,
  filters,
  expandedIds,
  onToggleExpand,
}: {
  item: InventoryItem;
  depth: number;
  isLast: boolean;
  filters: Set<string>;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}) {
  const hasFilters = filters.size > 0;
  if (hasFilters && !hasMatchingDescendant(item, filters)) return null;

  const docType = getDocType(item);
  const children = getChildren(item);
  const hasChildren = children.length > 0;
  const expanded = expandedIds.has(item._id);
  const indent = depth * 24;

  return (
    <>
      <div
        className={`flex items-center gap-sm px-md py-xs hover:bg-surface-hover transition-colors duration-200 ${
          !isLast ? 'border-b border-border-subtle' : ''
        }`}
        style={{ paddingLeft: `${16 + indent}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(item._id)}
            className="font-sans text-xs text-text-muted hover:text-text-primary w-4 text-center flex-shrink-0"
          >
            {expanded ? '\u25BE' : '\u25B8'}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <span className="text-sm flex-shrink-0">{DOC_EMOJI[docType]}</span>

        <span className="font-serif text-sm text-text-primary truncate flex-1">
          {item.title || '(untitled)'}
        </span>

        <StatusBadge status={item.status ?? 'planned'} />

        {item._updatedAt && (
          <span className="font-sans text-[0.6rem] text-text-muted flex-shrink-0 ml-1">
            {new Date(item._updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {expanded && hasChildren &&
        children.map((child, i) => (
          <TreeRow
            key={child._id}
            item={child}
            depth={depth + 1}
            isLast={i === children.length - 1 && isLast}
            filters={filters}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
          />
        ))}
    </>
  );
}
