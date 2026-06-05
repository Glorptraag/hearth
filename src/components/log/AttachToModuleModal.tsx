'use client';

import { useEffect, useState } from 'react';
import { X, MagnifyingGlass, Books } from '@/components/icons';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import type { LibraryModuleItem } from '@/app/api/library/modules/route';

/**
 * After a Logger save, ask the parent if the moment matches a module in
 * their library. Selecting one PATCHes `sourceModuleId` (and optionally
 * `sourceApproachId` / `sourceActivityIds`) onto the saved entry — the
 * narrow exception to the write-once source-field rule.
 *
 * Implements UC3 attach per the deepwork plan workstream F.
 */
export function AttachToModuleModal({
  entryId,
  onClose,
  onAttached,
}: {
  entryId: string;
  onClose: () => void;
  onAttached?: (moduleId: string) => void;
}) {
  const [modules, setModules] = useState<LibraryModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [attaching, setAttaching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useFocusTrap(true);

  useEffect(() => {
    fetch('/api/library/modules')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: LibraryModuleItem[]) => setModules(data))
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  }, []);

  // Esc-to-close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function attach(moduleId: string) {
    setAttaching(moduleId);
    setError(null);
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceModuleId: moduleId }),
      });
      if (!res.ok) {
        setError(`Couldn't attach (${res.status})`);
        return;
      }
      onAttached?.(moduleId);
      onClose();
    } catch {
      setError('Network error — please try again');
    } finally {
      setAttaching(null);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? modules.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.owningPack?.title.toLowerCase().includes(q) ||
          (m.targetUnderstanding ?? '').toLowerCase().includes(q),
      )
    : modules;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center backdrop-modal backdrop-blur-sm p-0 sm:p-lg"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="attach-modal-title"
        tabIndex={-1}
        className="relative w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden rounded-t-[24px] sm:rounded-[16px] bg-surface-panel border border-border-subtle shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-sm h-1 w-10 rounded-full bg-border-medium sm:hidden" />

        <div className="px-xl pt-lg pb-md border-b border-border-subtle">
          <div className="flex items-start justify-between gap-md mb-xs">
            <h2
              id="attach-modal-title"
              className="font-serif text-lg font-semibold text-text-primary leading-snug"
            >
              Was this from a module in your library?
            </h2>
            <button
              onClick={onClose}
              className="shrink-0 rounded-full border border-border-subtle p-xs text-text-muted hover:text-text-primary transition-colors duration-200"
              aria-label="Close"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
          <p className="font-serif text-sm text-text-secondary">
            Linking the entry lets the capability map credit the right
            threads. Skip if it wasn&apos;t a module session.
          </p>
        </div>

        <div className="px-xl pt-md pb-sm">
          <div className="relative">
            <span
              className="absolute left-sm top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              aria-hidden="true"
            >
              <MagnifyingGlass size={14} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules…"
              className="w-full bg-surface-raised border border-border-subtle rounded-md pl-[32px] pr-md py-xs font-sans text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium transition-colors duration-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-xl pb-md space-y-xs">
          {loading ? (
            <p className="font-sans text-sm text-text-muted py-md text-center animate-pulse">
              Loading your library…
            </p>
          ) : filtered.length === 0 ? (
            <div className="py-lg text-center">
              <span
                className="inline-flex text-text-secondary mb-sm"
                aria-hidden="true"
              >
                <Books size={28} />
              </span>
              <p className="font-serif text-sm text-text-secondary">
                {modules.length === 0
                  ? 'No modules in your library yet.'
                  : 'No matches.'}
              </p>
            </div>
          ) : (
            filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => attach(m.id)}
                disabled={attaching != null}
                className="w-full text-left bg-surface-raised border border-border-subtle rounded-md px-md py-sm hover:border-border-medium hover:bg-surface-panel transition-all duration-200 disabled:opacity-50"
              >
                <p className="font-serif text-sm font-semibold text-text-primary">
                  {m.title}
                </p>
                {m.owningPack && (
                  <p className="font-sans text-[11px] text-text-muted mt-[2px]">
                    {m.owningPack.title}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        {error && (
          <p className="px-xl pb-sm font-sans text-xs text-red-400">{error}</p>
        )}

        <div className="px-xl py-md border-t border-border-subtle">
          <button
            onClick={onClose}
            className="w-full font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-200 py-sm"
          >
            Skip — just a logged moment
          </button>
        </div>
        <div aria-hidden="true" className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </div>
  );
}
