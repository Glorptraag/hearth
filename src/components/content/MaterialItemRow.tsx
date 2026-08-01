'use client';

import { createElement } from 'react';
import Image from 'next/image';
import { type PrintableItem, getItemIcon } from './types';
import { ArrowRight, DownloadSimple, Printer } from '@/components/icons';

interface MaterialItemRowProps {
  item: PrintableItem;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onPreview?: (item: PrintableItem) => void;
  onDownload?: (item: PrintableItem) => void;
  onPrint?: (item: PrintableItem) => void;
  onOpenReader?: (item: PrintableItem) => void;
  compact?: boolean;
  disabled?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  core: '',
  optional: 'Optional',
  extension: 'Extension',
};

export function MaterialItemRow({
  item,
  selected,
  selectable,
  onSelect,
  onPreview,
  onDownload,
  onPrint,
  onOpenReader,
  compact,
  disabled,
}: MaterialItemRowProps) {
  const itemIcon = getItemIcon(item);
  const isAudio = item.assetKind === 'audio';
  const isCommons = item.kind === 'commonsText';
  const roleLabel = ROLE_LABELS[item.role];

  return (
    <div
      role="button"
      tabIndex={disabled ? undefined : 0}
      className={`flex items-center gap-md p-md rounded-[10px] border border-border-subtle transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
        disabled ? 'opacity-50' : 'bg-surface-raised hover:bg-surface-hover cursor-pointer focus-visible:outline-none focus-visible:shadow-focus'
      } ${selected ? 'border-ember/30 bg-ember/5' : ''} ${compact ? 'p-sm gap-sm' : ''}`}
      onClick={() => {
        if (selectable && onSelect) {
          onSelect(item.id, !selected);
        } else if (isCommons && onOpenReader) {
          onOpenReader(item);
        } else if (onPreview) {
          onPreview(item);
        }
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
    >
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect?.(item.id, e.target.checked)}
          disabled={disabled || isAudio}
          className="shrink-0 w-4 h-4 rounded-[6px] accent-ember"
          aria-label={`Select ${item.title}`}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Thumbnail / icon */}
      {item.thumbnailUrl ? (
        <div className="relative shrink-0 w-10 h-10 rounded-[6px] bg-surface-panel border border-border-subtle overflow-hidden">
          <Image src={item.thumbnailUrl} alt="" fill sizes="40px" className="object-cover" />
        </div>
      ) : (
        <div className="shrink-0 w-10 h-10 rounded-[6px] bg-surface-panel border border-border-subtle flex items-center justify-center text-text-secondary" aria-hidden="true">
          {createElement(itemIcon, { size: 22 })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-sm">
          <p className={`font-serif text-sm text-text-primary truncate ${compact ? 'text-[0.8rem]' : ''}`}>
            {item.title}
          </p>
          {roleLabel && (
            <span className="shrink-0 font-sans text-[10px] text-text-muted bg-surface-panel rounded-full px-1.5 py-[1px] border border-border-subtle">
              {roleLabel}
            </span>
          )}
        </div>
        <p className="font-sans text-[0.72rem] text-text-muted truncate">
          {isCommons
            ? `${item.commonsKind?.replace(/_/g, ' ') ?? 'reading'}${item.pageCount > 0 ? ` · ${item.pageCount} min read` : ''}`
            : `${item.assetKind?.replace(/_/g, ' ') ?? 'asset'}${item.pageCount > 0 ? ` · ${item.pageCount} pg` : ''}`}
          {item.module && ` · ${item.module.title}`}
        </p>
      </div>

      {/* Actions */}
      {!disabled && (
        <div className="shrink-0 flex items-center gap-xs">
          {isCommons && onOpenReader && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenReader(item); }}
              className="hearth-link-arrow font-sans text-[0.72rem] font-medium text-ember hover:text-ember-hover transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] whitespace-nowrap"
              aria-label={`Open reader for ${item.title}`}
            >
              Open reader <ArrowRight size={14} aria-hidden="true" />
            </button>
          )}
          {!isAudio && onDownload && (
            <button
              onClick={(e) => { e.stopPropagation(); onDownload(item); }}
              className="hit-target p-1.5 text-text-muted hover:text-text-primary transition-colors duration-[var(--motion-quick)]"
              aria-label={`Download ${item.title}`}
            >
              <DownloadSimple size={16} aria-hidden="true" />
            </button>
          )}
          {!isAudio && onPrint && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrint(item); }}
              className="hit-target p-1.5 text-text-muted hover:text-text-primary transition-colors duration-[var(--motion-quick)]"
              aria-label={`Print ${item.title}`}
            >
              <Printer size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
