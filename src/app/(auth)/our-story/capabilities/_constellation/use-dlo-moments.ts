'use client';

import { useEffect, useState } from 'react';
import type { GraphMoment } from './graph-model';

type EvidenceRow = {
  entryId: string | null;
  title: string;
  dateOccurred: string;
  source: string;
  tier?: string | null;
  rationale?: string | null;
  provenance?: string | null;
};

type EntryRow = {
  id: string;
  title: string;
  dateOccurred: string;
  source: string;
  aiEnrichment: { capability_threads?: Array<{ thread_id: string; confidence: number }> } | null;
};

const asTier = (t: string | null | undefined): GraphMoment['tier'] =>
  t === 'emerging' || t === 'developing' || t === 'demonstrating' ? t : null;

/**
 * The moments that evidence one learning objective, newest first. DLO-level
 * evidence comes first; when an objective has none (entries logged before
 * observation_dlo_links existed) it falls back to thread-level matches and
 * marks them `threadLevel` so the surface can say so. `null` while loading;
 * `[]` on no moments or a failed fetch (a 5xx never parses as evidence).
 */
export function useDloMoments(
  learnerId: string,
  dlo: { id: string; thread: string } | null,
): GraphMoment[] | null {
  // Keyed by the objective they belong to, so switching objectives never
  // shows the previous one's moments while the next fetch is in flight.
  const [loaded, setLoaded] = useState<{ dloId: string; moments: GraphMoment[] } | null>(null);
  const dloId = dlo?.id ?? null;
  const threadId = dlo?.thread ?? null;

  useEffect(() => {
    if (!dloId || !threadId) return;
    let cancelled = false;
    const done = (ms: GraphMoment[]) => {
      if (!cancelled) setLoaded({ dloId, moments: [...ms].sort((a, b) => b.date.localeCompare(a.date)) });
    };

    fetch(`/api/capabilities/${learnerId}/dlo-evidence?dloId=${encodeURIComponent(dloId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`dlo-evidence ${r.status}`))))
      .then((data: { evidence?: EvidenceRow[] }) => {
        if (cancelled) return;
        const evidence = Array.isArray(data?.evidence) ? data.evidence : [];
        if (evidence.length > 0) {
          done(evidence.map((e, i) => ({
            id: e.entryId ?? `assertion-${i}`,
            entryId: e.entryId,
            title: e.title,
            date: e.dateOccurred,
            source: e.entryId === null || e.source === 'parent' ? 'parent' : e.source === 'module' ? 'module' : 'logger',
            tier: asTier(e.tier),
            rationale: e.rationale ?? null,
            provenance: e.provenance ?? null,
          })));
          return;
        }
        return fetch(`/api/entries?learnerId=${learnerId}&limit=500`)
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`entries ${r.status}`))))
          .then((entries: EntryRow[]) => {
            done((Array.isArray(entries) ? entries : [])
              .filter((e) => e.aiEnrichment?.capability_threads?.some((c) => c.thread_id === threadId && c.confidence >= 0.5))
              .map((e) => ({
                id: e.id,
                entryId: e.id,
                title: e.title,
                date: e.dateOccurred,
                source: e.source === 'module' ? 'module' : 'logger',
                tier: null,
                rationale: null,
                provenance: null,
                threadLevel: true,
              })));
          });
      })
      .catch(() => done([]));

    return () => { cancelled = true; };
  }, [learnerId, dloId, threadId]);

  return dloId && loaded?.dloId === dloId ? loaded.moments : null;
}
