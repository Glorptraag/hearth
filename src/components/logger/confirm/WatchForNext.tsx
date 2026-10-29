'use client';

import { useEffect, useState } from 'react';
import { Eye } from '@/components/icons';
import type { WatchForLine } from '@/lib/watch/compose';
import { confirmCopy } from './confirmCopy';

export type WatchForNextProps = {
  learnerId: string;
  dloId: string;
  threadName: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
};

/** Per-page cache so un-confirming and re-confirming a chip doesn't refetch. */
const cache = new Map<string, Promise<WatchForLine | null>>();

/** Test-only: forget cached lines between tests. */
export function __resetWatchForCache(): void {
  cache.clear();
}

function loadLine(learnerId: string, dloId: string, fetchImpl: typeof fetch): Promise<WatchForLine | null> {
  const key = `${learnerId}:${dloId}`;
  let pending = cache.get(key);
  if (!pending) {
    const qs = new URLSearchParams({ learner: learnerId, dlo: dloId });
    pending = fetchImpl(`/api/watch-for?${qs.toString()}`)
      .then(async (res) => {
        if (!res.ok) return null;
        const body = (await res.json()) as { items?: WatchForLine[] };
        return body.items?.find((i) => i.dloId === dloId) ?? null;
      })
      .catch(() => null);
    // A failed read isn't cached, so a later confirm can try again.
    pending.then((line) => {
      if (!line) cache.delete(key);
    });
    cache.set(key, pending);
  }
  return pending;
}

/**
 * "Watch for next" under a confirmed chip (W4.4; D-HC-5, D-LP-8). The look-for
 * is the DLO's authored, human-confirmed note and the how line is the family
 * tradition's confirmed `watchHow` — composed server-side by
 * `src/lib/watch/compose.ts`, zero model calls. With no confirmed note the
 * server returns nothing and this renders nothing: never generated.
 */
export function WatchForNext({ learnerId, dloId, threadName, fetchImpl = fetch }: WatchForNextProps) {
  const [line, setLine] = useState<WatchForLine | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadLine(learnerId, dloId, fetchImpl).then((l) => {
      if (!cancelled) setLine(l);
    });
    return () => {
      cancelled = true;
    };
  }, [learnerId, dloId, fetchImpl]);

  if (!line) return null;

  return (
    <aside
      aria-label={confirmCopy.watchFor.label(threadName)}
      className="hearth-reveal flex flex-col gap-xs rounded-md border border-border-subtle bg-surface-raised p-md"
    >
      <span className="inline-flex items-center gap-xs font-sans text-[11px] uppercase tracking-[0.08em] text-text-muted">
        <Eye size={14} aria-hidden="true" />
        {confirmCopy.watchFor.overline(threadName)}
      </span>
      <p className="body-serif text-[1rem] leading-relaxed text-text-primary">{line.lookFor}</p>
      {line.how && <p className="body-serif text-[0.95rem] leading-relaxed text-text-secondary">{line.how}</p>}
    </aside>
  );
}
