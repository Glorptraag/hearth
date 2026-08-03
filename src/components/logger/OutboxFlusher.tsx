'use client';

import { useEffect, useRef } from 'react';
import { flushOutbox, countQueued } from '@/lib/logger/outbox';
import { useToast } from '@/hooks/use-toast';

/**
 * Replays offline-queued Logger entries once the device is back online.
 *
 * Renders nothing. Mounted once inside the (auth) ToastProvider so a parent
 * gets told their offline work landed — silent sync would leave them unsure
 * whether an entry they wrote on a bushwalk actually exists.
 *
 * Three triggers, because none alone is reliable: `online` misses the case
 * where the app was closed while offline and reopened with a connection;
 * mount misses a reconnect during a long session; visibilitychange catches a
 * phone waking up on a different network. flushOutbox() coalesces concurrent
 * runs, so overlapping triggers cannot double-post.
 */
export default function OutboxFlusher() {
  const { toast } = useToast();
  // Ref, not state: the listeners below are registered once and must not be
  // re-bound every render. Kept current in an effect rather than during
  // render, which React forbids.
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  });

  useEffect(() => {
    let cancelled = false;

    async function flush() {
      if (cancelled) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      if ((await countQueued()) === 0) return;

      const { sent, dropped } = await flushOutbox();
      if (cancelled) return;

      if (sent > 0) {
        toastRef.current(
          sent === 1 ? 'Your offline entry synced.' : `${sent} offline entries synced.`,
          'info',
        );
      }
      if (dropped > 0) {
        // Say so rather than losing them quietly — the parent wrote these.
        toastRef.current(
          dropped === 1
            ? "One offline entry couldn't be saved and was discarded."
            : `${dropped} offline entries couldn't be saved and were discarded.`,
          'error',
        );
      }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') void flush();
    }

    void flush();
    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener('online', flush);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
