'use client';

import { useEffect, useRef } from 'react';

type Opts = {
  /** Intersection ratio threshold (0–1) required before the dwell timer starts. Default 0.5. */
  threshold?: number;
  /** Milliseconds the element must remain in view with the tab visible before firing. Default 1000. */
  dwellMs?: number;
  /** When false the hook is dormant — useful for conditional instrumentation. Default true. */
  enabled?: boolean;
};

/**
 * Fires `callback` exactly once when all three conditions hold for `dwellMs`:
 *   1. The element pointed at by `ref` is ≥ `threshold` visible.
 *   2. The browser tab is visible (`document.visibilityState === 'visible'`).
 *   3. Neither condition has been interrupted since the timer started.
 *
 * Designed for "did the user actually read this?" instrumentation (e.g.
 * `enrichment_viewed`). The callback is captured in a ref so callers can pass
 * a new closure on every render without re-registering the observer.
 */
export function useViewedOnce(
  ref: React.RefObject<Element | null>,
  callback: () => void,
  { threshold = 0.5, dwellMs = 1000, enabled = true }: Opts = {},
): void {
  const firedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intersectingRef = useRef(false);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled || firedRef.current) return;
    const el = ref.current;
    if (!el) return;

    function startDwell() {
      if (firedRef.current || timerRef.current !== null) return;
      if (document.visibilityState !== 'visible') return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (!firedRef.current && document.visibilityState === 'visible') {
          firedRef.current = true;
          callbackRef.current();
        }
      }, dwellMs);
    }

    function stopDwell() {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        intersectingRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          startDwell();
        } else {
          stopDwell();
        }
      },
      { threshold },
    );

    function onVisibilityChange() {
      if (document.visibilityState !== 'visible') {
        stopDwell();
      } else if (intersectingRef.current) {
        startDwell();
      }
    }

    observer.observe(el);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      observer.disconnect();
      stopDwell();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [ref, enabled, threshold, dwellMs]);
}
