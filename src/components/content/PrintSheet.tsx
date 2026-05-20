'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { type PrintableItem, type PrintSelection, type PrintBundleResponse, getItemIcon } from './types';
import { X, WarningCircle } from '@/components/icons';

export interface PrintSheetGroup {
  label: string;
  items: PrintableItem[];
}

interface PrintSheetProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  groups: PrintSheetGroup[];
  defaultCopies: number;
  defaultCombine?: boolean;
  onClose: () => void;
  onGenerate: (selection: PrintSelection) => Promise<PrintBundleResponse>;
}

export function PrintSheet({
  isOpen,
  title,
  subtitle,
  groups,
  defaultCopies,
  defaultCombine = true,
  onClose,
  onGenerate,
}: PrintSheetProps) {
  const trapRef = useFocusTrap(isOpen);

  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const printableItems = useMemo(() => allItems.filter((i) => i.isPrintable), [allItems]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(allItems.filter((i) => i.isPrintable && i.role === 'core').map((i) => i.id));
  });
  const [copies, setCopies] = useState(defaultCopies);
  const [customCopies, setCustomCopies] = useState(false);
  const [combine, setCombine] = useState(defaultCombine);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when groups change
  useEffect(() => {
    // Reset selection + copy counts when the source groups change; expected setState-on-deps-change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIds(new Set(allItems.filter((i) => i.isPrintable && i.role === 'core').map((i) => i.id)));
    setCopies(defaultCopies);
  }, [allItems, defaultCopies]);

  const selectedItems = useMemo(
    () => printableItems.filter((i) => selectedIds.has(i.id)),
    [printableItems, selectedIds],
  );

  const totalPages = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.pageCount, 0),
    [selectedItems],
  );

  const toggleItem = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === printableItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(printableItems.map((i) => i.id)));
    }
  }, [selectedIds, printableItems]);

  const handleGenerate = useCallback(async (triggerPrint: boolean) => {
    if (selectedItems.length === 0) return;
    setGenerating(true);
    setError(null);

    try {
      const result = await onGenerate({
        itemIds: selectedItems.map((i) => i.id),
        copies,
        combine,
      });

      if (result.status === 'error') {
        setError(result.error ?? 'Failed to generate bundle');
        return;
      }

      if (result.url) {
        const filename = result.filename ?? 'hearth-materials.pdf';

        // Mobile: use Web Share API if available and user tapped download
        if (!triggerPrint && typeof navigator.share === 'function' && /Mobi|Android/i.test(navigator.userAgent)) {
          try {
            const res = await fetch(result.url);
            const blob = await res.blob();
            const file = new File([blob], filename, { type: 'application/pdf' });
            await navigator.share({ files: [file], title: filename });
            return;
          } catch {
            // Share cancelled or unsupported — fall through to download
          }
        }

        if (triggerPrint) {
          const printWindow = window.open(result.url, '_blank');
          if (printWindow) {
            setTimeout(() => printWindow.print(), 500);
          } else {
            setError('Popup blocked — please allow popups for this site, or use Download PDF instead.');
            return;
          }
        } else {
          const a = document.createElement('a');
          a.href = result.url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [selectedItems, copies, combine, onGenerate]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = original;
      };
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const allSelected = selectedIds.size === printableItems.length && printableItems.length > 0;
  const copiesOptions = defaultCopies <= 1 ? [] : Array.from({ length: Math.min(defaultCopies + 1, 5) }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-modal transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-sheet-title"
        className="relative z-10 w-full max-h-[85dvh] rounded-t-[16px] lg:rounded-[16px] lg:max-w-lg bg-surface-panel border border-border-subtle shadow-float flex flex-col transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-sm lg:hidden">
          <div className="w-10 h-1 rounded-full bg-border-subtle" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-lg pt-md pb-sm border-b border-border-subtle">
          <div>
            <h2 id="print-sheet-title" className="font-serif text-lg font-semibold text-text-primary">
              {title}
            </h2>
            {subtitle && (
              <p className="font-sans text-[0.8rem] text-text-muted mt-xs">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-sm text-text-muted hover:text-text-primary transition-colors duration-200"
            aria-label="Close"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-lg py-md border-b border-border-subtle space-y-md">
          {/* Copies selector */}
          {copiesOptions.length > 0 && (
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-sm">
                Copies
              </p>
              <div className="flex items-center gap-sm flex-wrap">
                {copiesOptions.map((n) => (
                  <button
                    key={n}
                    onClick={() => { setCopies(n); setCustomCopies(false); }}
                    className={`font-sans text-sm px-md py-xs rounded-[6px] border transition-colors duration-200 ${
                      copies === n && !customCopies
                        ? 'bg-ember text-text-inverse border-ember font-semibold'
                        : 'bg-transparent text-text-secondary border-border-subtle hover:border-border-medium'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setCustomCopies(true)}
                  className={`font-sans text-sm px-md py-xs rounded-[6px] border transition-colors duration-200 ${
                    customCopies
                      ? 'bg-ember text-text-inverse border-ember font-semibold'
                      : 'bg-transparent text-text-secondary border-border-subtle hover:border-border-medium'
                  }`}
                >
                  Custom
                </button>
                {customCopies && (
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    className="w-16 font-sans text-sm px-sm py-xs rounded-[6px] border border-border-subtle bg-surface-raised text-text-primary"
                  />
                )}
              </div>
            </div>
          )}

          {/* Combine toggle */}
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-sm">
              Format
            </p>
            <div className="space-y-xs">
              <label className="flex items-center gap-sm cursor-pointer">
                <input
                  type="radio"
                  checked={combine}
                  onChange={() => setCombine(true)}
                  className="accent-ember"
                />
                <span className="font-sans text-sm text-text-primary">Combine printables into single PDF</span>
              </label>
            </div>
          </div>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-lg py-md">
          {/* Select all */}
          <div className="flex items-center justify-between mb-md">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Included
            </p>
            <button
              onClick={toggleAll}
              className="font-sans text-[0.72rem] text-ember hover:text-ember/80 transition-colors duration-200"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          {groups.map((group) => (
            <div key={group.label} className="mb-lg">
              {groups.length > 1 && (
                <p className="font-sans text-[0.8rem] font-medium text-text-secondary mb-sm">
                  ▼ {group.label}
                </p>
              )}
              <div className="space-y-sm">
                {group.items.map((item) => {
                  const ItemIcon = getItemIcon(item);
                  const isAudio = !item.isPrintable;
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-sm p-sm rounded-[6px] cursor-pointer transition-colors duration-200 ${
                        isAudio ? 'opacity-50 cursor-default' : 'hover:bg-surface-hover'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={(e) => toggleItem(item.id, e.target.checked)}
                        disabled={isAudio}
                        className="shrink-0 w-4 h-4 rounded-[6px] accent-ember"
                      />
                      <span className="shrink-0 inline-flex text-text-secondary" aria-hidden="true"><ItemIcon size={16} /></span>
                      <span className="flex-1 min-w-0 font-serif text-sm text-text-primary truncate">
                        {item.title}
                      </span>
                      <span className="shrink-0 font-sans text-[0.72rem] text-text-muted">
                        {item.isPrintable ? `${item.pageCount}pg` : 'audio'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-lg py-md border-t border-border-subtle">
          {/* Live total */}
          <div className="mb-md">
            <p className="font-sans text-[0.8rem] text-text-secondary">
              {selectedItems.length} printable{selectedItems.length !== 1 ? 's' : ''} · {totalPages} page{totalPages !== 1 ? 's' : ''}
            </p>
            {copies > 1 && (
              <p className="font-sans text-[0.72rem] text-text-muted">
                Printing {copies} copies = {totalPages * copies} pages
              </p>
            )}
          </div>

          {/* Large bundle warning */}
          {totalPages * copies > 100 && (
            <p className="inline-flex items-center gap-xs font-sans text-[0.75rem] text-amber-status mb-sm">
              <WarningCircle size={14} aria-hidden="true" />
              Large bundle ({totalPages * copies} pages). Generation may take a moment.
            </p>
          )}

          {/* Error */}
          {error && (
            <p className="font-sans text-sm text-red-400 mb-sm">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-sm">
            <button
              onClick={() => handleGenerate(false)}
              disabled={generating || selectedItems.length === 0}
              className="flex-1 font-sans text-sm font-semibold px-md py-sm rounded-[10px] bg-ember text-text-inverse hover:bg-ember/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {generating ? 'Preparing...' : 'Download PDF'}
            </button>
            <button
              onClick={() => handleGenerate(true)}
              disabled={generating || selectedItems.length === 0}
              className="flex-1 font-sans text-sm font-semibold px-md py-sm rounded-[10px] bg-transparent text-ember border border-ember/30 hover:border-ember hover:bg-ember/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {generating ? 'Preparing...' : 'Print now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
