'use client';

import { useEffect } from 'react';

/**
 * Registers public/sw.js.
 *
 * Renders nothing. Mounted once from the root layout.
 *
 * Development is deliberately excluded — a service worker caching
 * /_next/static/ across HMR rebuilds produces stale-chunk errors that look
 * like application bugs.
 *
 * KILL SWITCH: set NEXT_PUBLIC_DISABLE_SW=1 and redeploy. A shipped service
 * worker outlives the deploy that shipped it, so "stop serving it" is not
 * enough to recover from a bad one — the flag actively unregisters any
 * installed worker and drops its caches on next load. See
 * docs/oncall-cheatsheet.md.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const disabled = process.env.NEXT_PUBLIC_DISABLE_SW === '1';

    if (disabled || process.env.NODE_ENV !== 'production') {
      void (async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
        if (disabled && 'caches' in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys.filter((k) => k.startsWith('hearth-')).map((k) => caches.delete(k)),
          );
        }
      })();
      return;
    }

    // Captured before registering: sw.js calls skipWaiting() on install, so a
    // first-ever install fires controllerchange immediately. Reloading then
    // would bounce the page on the parent's very first visit.
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloading = false;

    function onControllerChange() {
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    void navigator.serviceWorker.register('/sw.js').catch((err) => {
      // Registration failure must never break the app — it only costs offline.
      console.warn('[sw] registration failed', err);
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return null;
}
