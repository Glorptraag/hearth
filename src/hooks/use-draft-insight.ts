'use client';

import { useEffect, useRef, useState } from 'react';
import type { DraftInsight } from '@/lib/ai/draft-insight';

/**
 * Debounced Haiku draft-insight call. Client-side contract:
 *  - Waits 2s after the last keystroke before calling the API
 *  - Aborts any in-flight request when input changes
 *  - Caps at `maxCallsPerSession` calls per mount (default 20) to guarantee
 *    a runaway typing loop can't rack up cost
 *  - Skips calls while description length < 50 chars (let the keyword matcher
 *    do the work until there's enough signal)
 */
export function useDraftInsight(
  description: string,
  childNames: string[],
  options?: { enabled?: boolean; maxCallsPerSession?: number }
): {
  insight: DraftInsight | null;
  loading: boolean;
  callsUsed: number;
  capped: boolean;
} {
  const enabled = options?.enabled ?? true;
  const maxCalls = options?.maxCallsPerSession ?? 20;

  const [insight, setInsight] = useState<DraftInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [callsUsed, setCallsUsed] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const namesKey = childNames.join('|');

  useEffect(() => {
    if (!enabled) return;
    if (description.trim().length < 50) {
      // Reset insight when the draft becomes too short to coach on.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInsight(null);
      return;
    }
    if (callsUsed >= maxCalls) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch('/api/entries/draft-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, childNames }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as DraftInsight;
        if (!controller.signal.aborted) {
          setInsight(data);
          setCallsUsed((n) => n + 1);
        }
      } catch {
        // network or abort — silently fall back to keyword matcher
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, namesKey, enabled, maxCalls]);

  return {
    insight,
    loading,
    callsUsed,
    capped: callsUsed >= maxCalls,
  };
}
