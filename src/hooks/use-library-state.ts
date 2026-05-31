'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Single source of truth for family library + entitlement state on any
 * client surface that needs to render the "Add to Library / In Library /
 * Owned / Get Pack" CTA. Mirrors the inline fetch in MarketplaceShell so
 * the marketplace card and the pack detail page can stay in lock-step.
 *
 * Used by:
 *   - src/components/pack/PackDetailCta.tsx (pack detail page)
 *   - src/app/(auth)/explore/marketplace/MarketplaceShell.tsx (planned)
 *
 * Errors are caught and reported via the returned `error` field so callers
 * can render a toast; the optimistic update is rolled back on failure.
 */
export interface LibraryState {
  libraryIds: Set<string>;
  ownedIds: Set<string>;
  loading: boolean;
  error: string | null;
  /** Optimistically add a pack to the library, POST /api/library, rollback on failure. */
  addToLibrary: (packId: string) => Promise<{ ok: boolean; status?: number }>;
  /** Refetch from server (e.g. after a Stripe checkout return). */
  refresh: () => Promise<void>;
}

export function useLibraryState(): LibraryState {
  const [libraryIds, setLibraryIds] = useState<Set<string>>(new Set());
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [libraryRes, entitlementsRes] = await Promise.all([
        fetch('/api/library'),
        fetch('/api/entitlements').catch(() => null),
      ]);
      if (libraryRes.ok) {
        const library: Array<{ id: string; kind: 'pack' | 'module' }> = await libraryRes.json();
        setLibraryIds(new Set(library.filter((l) => l.kind === 'pack').map((l) => l.id)));
      }
      if (entitlementsRes?.ok) {
        const owned: string[] = await entitlementsRes.json();
        setOwnedIds(new Set(owned));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount hydration; setState inside refresh is gated by request
    // completion (loading flag set/cleared inside refresh itself).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const addToLibrary = useCallback(async (packId: string) => {
    // Optimistic update — rollback on any non-2xx.
    setLibraryIds((prev) => new Set(prev).add(packId));
    setError(null);
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sanityPackId: packId }),
      });
      if (!res.ok) {
        setLibraryIds((prev) => {
          const next = new Set(prev);
          next.delete(packId);
          return next;
        });
        setError(`Couldn't add to library (${res.status})`);
        return { ok: false, status: res.status };
      }
      return { ok: true, status: res.status };
    } catch (err) {
      setLibraryIds((prev) => {
        const next = new Set(prev);
        next.delete(packId);
        return next;
      });
      setError(err instanceof Error ? err.message : 'Network error');
      return { ok: false };
    }
  }, []);

  return { libraryIds, ownedIds, loading, error, addToLibrary, refresh };
}
