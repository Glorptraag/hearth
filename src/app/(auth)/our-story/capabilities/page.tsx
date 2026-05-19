'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConstellationRoute, buildSnapshotFromApi } from './_constellation/ConstellationRoute';
import {
  indexDLOsByThread,
  type ActiveThreadRow,
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
  const [dlosByThread, setDlosByThread] = useState<Record<string, SanityDLO[]>>({});
  const [dloStateById, setDloStateById] = useState<Record<string, 'not-started' | 'emerging' | 'confirmed'>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/learners')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLearners(data);
          setSelectedLearnerId(data[0].id);
        }
        setLoading(false);
      });
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
    // Clear stale rows from the previous learner so the constellation doesn't
    // briefly paint that learner's progress under the new learner's name.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveThreads([]);
    setDloStateById({});
    fetch(`/api/capabilities/${selectedLearnerId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setActiveThreads(Array.isArray(data) ? (data as ActiveThreadRow[]) : []);
      });
    fetch(`/api/capabilities/${selectedLearnerId}/dlo-status`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setDloStateById(
          data && typeof data === 'object' && !Array.isArray(data)
            ? (data as Record<string, 'not-started' | 'emerging' | 'confirmed'>)
            : {},
        );
      })
      .catch(() => { /* honest not-started everywhere on failure */ });
    return () => { cancelled = true; };
  }, [selectedLearnerId]);

  const learner = learners.find((l) => l.id === selectedLearnerId) ?? null;
  const snap: LearnerSnapshot | null = useMemo(
    () => (learner ? buildSnapshotFromApi(learner, activeThreads) : null),
    [learner, activeThreads],
  );

  // Explicit parent confirmation — the only writer for per-DLO state until
  // the deferred enrichment/confidence keystone lands. Optimistic; reverts
  // the single key on failure so the constellation never lies about state.
  const setDloState = useCallback(
    (dloId: string, next: 'not-started' | 'emerging' | 'confirmed') => {
      if (!selectedLearnerId) return;
      const learnerId = selectedLearnerId;
      let prev: 'not-started' | 'emerging' | 'confirmed' | undefined;
      setDloStateById((cur) => {
        prev = cur[dloId];
        return { ...cur, [dloId]: next };
      });
      fetch(`/api/capabilities/${learnerId}/dlo-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dloId, state: next }),
      })
        .then((r) => {
          if (r.ok) return;
          setDloStateById((cur) => {
            const reverted = { ...cur };
            if (prev === undefined) delete reverted[dloId];
            else reverted[dloId] = prev;
            return reverted;
          });
        })
        .catch(() => {
          setDloStateById((cur) => {
            const reverted = { ...cur };
            if (prev === undefined) delete reverted[dloId];
            else reverted[dloId] = prev;
            return reverted;
          });
        });
    },
    [selectedLearnerId],
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
        dloStateById={dloStateById}
        onSetDloState={setDloState}
        onSelectLearner={setSelectedLearnerId}
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
