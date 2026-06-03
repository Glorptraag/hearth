'use client';

import { useEffect, useState } from 'react';

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
};

/**
 * Fetches the family's learners from `/api/learners` on mount. Extracted from
 * `app/(auth)/log/page.tsx`.
 *
 * Guarded: a 5xx from `/api/learners` must NOT crash the Logger via a
 * JSON-parse SyntaxError (see incident 2026-05-25 — missing migration 0016).
 * On any error the hook resolves to an empty list and the consumer renders
 * its empty state.
 */
export function useLearnersFetch(): UseLearnersFetchReturn {
  const [learners, setLearners] = useState<LearnerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/learners')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`learners ${r.status}`))))
      .then((data) => {
        if (Array.isArray(data)) setLearners(data);
      })
      .catch(() => {
        /* degrade to empty learners; learner picker shows empty state */
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { learners, isLoading };
}
