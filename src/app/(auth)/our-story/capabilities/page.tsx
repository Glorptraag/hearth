'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ConstellationRoute, buildSnapshotFromApi } from './_constellation/ConstellationRoute';
import {
  indexDLOsByThread,
  type ActiveThreadRow,
  type DloStatusLite,
  type LearnerSnapshot,
  type SanityDLO,
} from './_constellation/topology';
import { sanityClient } from '@/lib/sanity/client';
import { ALL_DLOS_QUERY } from '@/lib/sanity/queries';
import { Sparkle } from '@/components/icons';

type Learner = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
};

export default function CapabilitiesPage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [activeThreads, setActiveThreads] = useState<ActiveThreadRow[]>([]);
  const [dloStatus, setDloStatus] = useState<Record<string, DloStatusLite>>({});
  const [dlosByThread, setDlosByThread] = useState<Record<string, SanityDLO[]>>({});
  const [loading, setLoading] = useState(true);
  // Bumped after a DLO confirm/clear to refetch the snapshot (the server rebuild
  // is fire-and-forget, so this is best-effort eventual consistency).
  const [reloadNonce, setReloadNonce] = useState(0);
  const prevLearnerRef = useRef<string | null>(null);

  useEffect(() => {
    // Guarded: a 5xx must NOT crash the page via JSON-parse SyntaxError.
    // See incident 2026-05-25 (unrun migration 0016).
    fetch('/api/learners')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`learners ${r.status}`))))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLearners(data);
          setSelectedLearnerId(data[0].id);
        }
      })
      .catch(() => { /* degrade silently; capability view stays empty */ })
      .finally(() => setLoading(false));
  }, []);

  // DLO content is shared across learners — fetch once.
  useEffect(() => {
    let cancelled = false;
    sanityClient
      .fetch<SanityDLO[]>(ALL_DLOS_QUERY)
      .then((rows) => {
        if (cancelled) return;
        setDlosByThread(indexDLOsByThread(Array.isArray(rows) ? rows : []));
      })
      .catch(() => { /* fall back to placeholder descriptors in topology.ts */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedLearnerId) return;
    let cancelled = false;
    // Only blank the view when the learner actually changed — so a confirm
    // refetch (reloadNonce bump, same learner) doesn't flash the constellation
    // empty. On a real child switch, clear stale rows so we don't briefly paint
    // the previous learner's progress under the new name.
    if (prevLearnerRef.current !== selectedLearnerId) {
      prevLearnerRef.current = selectedLearnerId;
      setActiveThreads([]);
      setDloStatus({});
    }
    fetch(`/api/capabilities/${selectedLearnerId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`capabilities ${r.status}`))))
      .then((data) => {
        if (cancelled) return;
        // New shape: { activeThreads, dloStatus }. Old shape was a bare array.
        if (Array.isArray(data)) {
          setActiveThreads(data as ActiveThreadRow[]);
          setDloStatus({});
        } else {
          setActiveThreads(Array.isArray(data?.activeThreads) ? data.activeThreads : []);
          setDloStatus(data?.dloStatus ?? {});
        }
      })
      .catch(() => { /* leave threads/dloStatus empty on failure */ });
    return () => { cancelled = true; };
  }, [selectedLearnerId, reloadNonce]);

  const learner = learners.find((l) => l.id === selectedLearnerId) ?? null;
  const snap: LearnerSnapshot | null = useMemo(
    () => (learner ? buildSnapshotFromApi(learner, activeThreads, dloStatus) : null),
    [learner, activeThreads, dloStatus],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4xl">
        <p className="font-sans text-sm text-text-muted">Loading…</p>
      </div>
    );
  }

  if (!learner || !snap) {
    return (
      <div className="mx-auto max-w-[600px] px-md py-2xl">
        <p className="font-sans text-sm text-text-muted text-center">
          No learners found. Add a learner from Settings to see their capabilities.
        </p>
      </div>
    );
  }

  const totalObservations = Object.values(snap.observationsByThread).reduce((s, n) => s + n, 0);

  return (
    <>
      <ConstellationRoute
        learners={learners}
        learnerId={selectedLearnerId}
        snap={snap}
        dlosByThread={dlosByThread}
        onSelectLearner={setSelectedLearnerId}
        onDataChanged={() => setReloadNonce((n) => n + 1)}
      />
      {totalObservations === 0 && (
        <div className="mx-auto max-w-[1280px] px-md pb-2xl lg:px-xl">
          <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
            <span className="mx-auto mb-md inline-flex text-ember" aria-hidden="true">
              <Sparkle size={32} />
            </span>
            <h2 className="font-serif text-lg font-semibold text-text-primary mb-sm">
              Capabilities emerge from logging
            </h2>
            <p className="mx-auto mb-lg max-w-md font-serif text-sm leading-relaxed text-text-secondary">
              As you log learning moments, Hearth maps them to capability threads automatically.
              Each thread grows from emerging to demonstrating as evidence builds.
            </p>
            <a
              href="/log"
              className="inline-block rounded-md bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-colors duration-[var(--motion-quick)] hover:bg-ember-hover"
            >
              Log your first moment
            </a>
          </div>
        </div>
      )}
    </>
  );
}
