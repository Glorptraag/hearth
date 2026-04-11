'use client';

import { type PrintableItem, getItemEmoji } from './types';

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
  const emoji = getItemEmoji(item);
  const isAudio = item.assetKind === 'audio';
  const isCommons = item.kind === 'commonsText';
  const roleLabel = ROLE_LABELS[item.role];

  return (
    <div
      className={`flex items-center gap-md p-md rounded-[10px] border border-border-subtle transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        disabled ? 'opacity-50' : 'bg-surface-raised hover:bg-surface-hover cursor-pointer'
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

      {/* Thumbnail / emoji */}
      {item.thumbnailUrl ? (
        <div className="shrink-0 w-10 h-10 rounded-[6px] bg-surface-panel border border-border-subtle overflow-hidden">
          <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="shrink-0 w-10 h-10 rounded-[6px] bg-surface-panel border border-border-subtle flex items-center justify-center text-lg">
          {emoji}
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
              className="font-sans text-[0.72rem] font-medium text-ember hover:text-ember/80 transition-colors duration-200 whitespace-nowrap"
              aria-label={`Open reader for ${item.title}`}
            >
              Open reader →
            </button>
          )}
          {!isAudio && onDownload && (
            <button
              onClick={(e) => { e.stopPropagation(); onDownload(item); }}
              className="p-1.5 text-text-muted hover:text-text-primary transition-colors duration-200"
              aria-label={`Download ${item.title}`}
            >
              ↓
            </button>
          )}
          {!isAudio && onPrint && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrint(item); }}
              className="p-1.5 text-text-muted hover:text-text-primary transition-colors duration-200"
              aria-label={`Print ${item.title}`}
            >
              🖨
            </button>
          )}
          {isAudio && (
            <span className="font-sans text-[0.68rem] text-text-muted">Coming soon</span>
          )}
        </div>
      )}
    </div>
  );
}
