'use client';

import { useEffect, useState } from 'react';

/**
 * Reactive `navigator.onLine` value. Updates on `online` / `offline` window
 * events. SSR-safe: returns `true` on the server (we cannot know the
 * connection state until the browser hydrates, and assuming online avoids
 * a flash-of-offline banner during hydration).
 *
 * Notes:
 * - `navigator.onLine` is a hint, not a guarantee. The browser may report
 *   online while DNS or a specific origin is unreachable. Use the hook to
 *   surface an indicator, not as a hard gate.
 * - Pair with explicit `fetch` failure handling — when a save throws but
 *   `navigator.onLine === true`, the failure is server-side, not network.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
