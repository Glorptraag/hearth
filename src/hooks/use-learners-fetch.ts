'use client';

import { useCallback, useEffect, useState } from 'react';

/** Learner record shape returned by `/api/learners`. */
export type LearnerRecord = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
};

export type UseLearnersFetchReturn = {
  learners: LearnerRecord[];
  isLoading: boolean;
  /** True when the last fetch rejected, returned non-ok, or returned a non-array body. */
  failed: boolean;
  /** Re-run the fetch: `isLoading` flips back to true and `failed` resets. */
  reload: () => void;
};

/**
 * Fetches the family's learners from `/api/learners` on mount. Extracted from
 * `app/(auth)/log/page.tsx`.
 *
 * Guarded: a 5xx from `/api/learners` must NOT crash the Logger via a
 * JSON-parse SyntaxError (see incident 2026-05-25 — missing migration 0016).
 * On any error the hook resolves to an empty list with `failed: true` so the
 * consumer can render a retry affordance; it never throws.
 */
export function useLearnersFetch(): UseLearnersFetchReturn {
  const [learners, setLearners] = useState<LearnerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/learners')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`learners ${r.status}`))))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setLearners(data);
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        /* degrade to empty learners; consumer renders its failed state */
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setFailed(false);
    setAttempt((n) => n + 1);
  }, []);

  return { learners, isLoading, failed, reload };
}
