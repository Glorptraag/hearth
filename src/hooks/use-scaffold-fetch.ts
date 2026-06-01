'use client';

import { useEffect, useRef, useState } from 'react';

/** Scaffold session payload returned by `/api/scaffolds/[id]`. */
export type ScaffoldData = {
  session: {
    id: string;
    title: string;
    description: string | null;
    date: string;
    location: string | null;
    sharedRecord: string | null;
    hearthId: string;
    hearthName: string | null;
  };
  evidence: Array<{
    id: string;
    fileUrl: string;
    fileType: string | null;
    caption: string | null;
  }>;
  observations: Array<{
    id: string;
    observationText: string;
    targetLearnerId: string;
    evidenceIds: string[];
  }>;
  attendingLearnerIds: string[];
};

export type UseScaffoldFetchArgs = {
  /** The scaffold session id, typically from the `scaffold` query param. */
  scaffoldSessionId: string | null;
  /**
   * Called once with the loaded scaffold so the caller can pre-fill its form
   * state (description, location, selected learners). Captured into a ref so
   * identity stability isn't required.
   */
  onLoad: (data: ScaffoldData) => void;
};

/**
 * Fetches a Hearth-session scaffold and surfaces it as state. Extracted from
 * `app/(auth)/log/page.tsx`. When a scaffold loads, `onLoad` fires exactly
 * once so the caller can pre-fill form fields from the session.
 *
 * Behaviour preserved verbatim:
 *  - no-op when `scaffoldSessionId` is null/empty;
 *  - non-OK responses and JSON-parse errors are swallowed;
 *  - re-fetches if `scaffoldSessionId` changes (per the original deps array).
 */
export function useScaffoldFetch({
  scaffoldSessionId,
  onLoad,
}: UseScaffoldFetchArgs): ScaffoldData | null {
  const [scaffoldData, setScaffoldData] = useState<ScaffoldData | null>(null);

  const onLoadRef = useRef(onLoad);
  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  useEffect(() => {
    if (!scaffoldSessionId) return;
    let cancelled = false;
    fetch(`/api/scaffolds/${scaffoldSessionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ScaffoldData | null) => {
        if (cancelled || !data) return;
        setScaffoldData(data);
        onLoadRef.current(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [scaffoldSessionId]);

  return scaffoldData;
}
