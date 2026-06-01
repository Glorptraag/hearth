'use client';

import { useEffect, useRef, useState } from 'react';
import type { CoachHint } from '@/lib/logger/coaching/types';

/** Minimum description length before the coach-hints fetch runs. */
const COACH_HINTS_MIN_CHARS = 20;
/** Debounce delay — 1.2 s of idle typing before a fetch. */
const COACH_HINTS_DEBOUNCE_MS = 1200;

export type UseCoachHintsArgs = {
  description: string;
  selectedLearners: string[];
  activityType: string | null;
  observations: string[];
};

/**
 * Debounced fetch for in-flight coaching hints. Extracted from
 * `app/(auth)/log/page.tsx`.
 *
 * Behaviour preserved verbatim:
 *  - returns an empty list while the description is shorter than 20 chars or
 *    no learner is selected;
 *  - debounces 1.2 s of idle typing before posting to `/api/logger/coach-hints`;
 *  - aborts the in-flight request when inputs change (or on unmount);
 *  - errors and non-OK responses are swallowed.
 */
export function useCoachHints({
  description,
  selectedLearners,
  activityType,
  observations,
}: UseCoachHintsArgs): CoachHint[] {
  const [coachHints, setCoachHints] = useState<CoachHint[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (description.length < COACH_HINTS_MIN_CHARS || selectedLearners.length === 0) {
      // Reset stale coach hints when input shrinks below threshold. Functional
      // setter returns the same reference when already empty — avoids
      // re-rendering (and re-running this effect) when a caller passes a
      // fresh empty array on each render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoachHints((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    const controller = new AbortController();
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/logger/coach-hints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            learnerIds: selectedLearners,
            activityType,
            description,
            observations,
          }),
          signal: controller.signal,
        });
        if (!controller.signal.aborted && res.ok) {
          const hints = (await res.json()) as CoachHint[];
          if (!controller.signal.aborted) setCoachHints(hints);
        }
      } catch {
        /* aborted or non-critical */
      }
    }, COACH_HINTS_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [description, activityType, selectedLearners, observations]);

  return coachHints;
}
