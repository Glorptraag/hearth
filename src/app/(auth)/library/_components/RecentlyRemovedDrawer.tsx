'use client';

/**
 * Recently-Removed drawer — lists soft-deleted family_library rows with a
 * Restore button that POSTs to /api/library to clear removedAt.
 *
 * Task 4.7. Companion to soft-delete (4.2) + the LibraryClient surface (4.5).
 */
import { useEffect, useState } from 'react';
import { ArrowsClockwise, X } from '@/components/icons';
import { track } from '@/lib/analytics/posthog';

interface RemovedItem {
  rowId: string;
  id: string;
  title: string;
  kind: 'pack' | 'module';
  sanityPackId: string | null;
  sanityModuleId: string | null;
  addedAt: string | null;
  removedAt: string | null;
}

export function RecentlyRemovedDrawer({
  open,
  onClose,
  onRestored,
}: {
  open: boolean;
  onClose: () => void;
  onRestored?: () => void;
}) {
  const [items, setItems] = useState<RemovedItem[] | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch('/api/library?includeRemoved=true')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: RemovedItem[]) => {
        if (cancelled) return;
        setItems(data.filter((d) => d.removedAt !== null));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const restore = async (item: RemovedItem) => {
    setRestoring(item.rowId);
    try {
      const body = item.sanityPackId
        ? { sanityPackId: item.sanityPackId }
        : { sanityModuleId: item.sanityModuleId };
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        track('library_item_restored', { kind: item.kind });
        setItems((prev) => (prev ? prev.filter((p) => p.rowId !== item.rowId) : prev));
        onRestored?.();
      }
    } finally {
      setRestoring(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 backdrop-modal"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="removed-drawer-title"
        className="relative w-full max-w-md h-full bg-surface-panel border-l border-border-subtle shadow-float p-lg overflow-y-auto"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <div className="flex items-start justify-between mb-lg">
          <div>
            <h3
              id="removed-drawer-title"
              className="font-serif text-lg font-semibold text-text-primary"
            >
              Recently removed
            </h3>
            <p className="font-sans text-xs text-text-muted mt-xs">
              Soft-deleted from your library. Restore keeps the original add
              date and rowId so entries logged against this item still line up.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary min-h-[32px] min-w-[32px] flex items-center justify-center"
            aria-label="Close"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {items === null ? (
          <p className="font-sans text-sm text-text-muted animate-pulse">Loading…</p>
        ) : items.length === 0 ? (
          <p className="font-sans text-sm text-text-muted">
            Nothing recently removed.
          </p>
        ) : (
          <ul className="space-y-sm">
            {items.map((item) => (
              <li
                key={item.rowId}
                className="flex items-center gap-sm rounded-md border border-border-subtle bg-surface-raised p-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm text-text-primary truncate">
                    {item.title}
                  </p>
                  <p className="font-sans text-[0.65rem] text-text-muted uppercase tracking-wider">
                    {item.kind}
                    {item.removedAt && ' · removed '}
                    {item.removedAt && new Date(item.removedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => restore(item)}
                  disabled={restoring === item.rowId}
                  className="inline-flex items-center gap-xs bg-ember text-text-inverse font-sans text-xs font-semibold rounded-md px-sm py-xs hover:bg-ember/90 transition-all duration-200 disabled:opacity-50"
                >
                  <ArrowsClockwise size={12} aria-hidden="true" />
                  {restoring === item.rowId ? 'Restoring…' : 'Restore'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
