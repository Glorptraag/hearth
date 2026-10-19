'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConstellationRoute, buildSnapshotFromApi } from './_constellation/ConstellationRoute';
import {
  indexDLOsByThread,
  type ActiveThreadRow,
  type CurriculumCoverage,
  type DloStatusLite,
  type GapAnalysis,
  type LearnerSnapshot,
  type SanityDLO,
} from './_constellation/topology';
import { clientSanityRead } from '@/lib/sanity/client-read';
import EmptyState from '@/components/ui/EmptyState';
import { ArrowsClockwise, Sparkle } from '@/components/icons';

type Learner = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
};

// The DLO descriptor catalog (171 Sanity docs) is identical for every learner
// and changes only when content is re-authored; one fetch per browser session
// is plenty, and skipping it on the second visit removes a visible flash of
// "0 learning objectives" at depth 3.
const DLO_CATALOG_CACHE_KEY = 'hearth:dlo-catalog:v1';

function readCachedCatalog(): SanityDLO[] | null {
  try {
    const raw = sessionStorage.getItem(DLO_CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as SanityDLO[]) : null;
  } catch {
    return null;
  }
}

function writeCachedCatalog(rows: SanityDLO[]): void {
  try {
    if (rows.length > 0) sessionStorage.setItem(DLO_CATALOG_CACHE_KEY, JSON.stringify(rows));
  } catch {
    /* storage unavailable (private mode, quota) — the fetch still populated state */
  }
}

export default function CapabilitiesPage() {
  const searchParams = useSearchParams();
  // `?learner=` (or the hub's `?child=`) selects the child on arrival; without
  // it the page always opened on the first learner, so a parent who switched
  // child on the hub lost that choice one tap later.
  const requestedLearnerId = searchParams?.get('learner') ?? searchParams?.get('child') ?? null;
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [activeThreads, setActiveThreads] = useState<ActiveThreadRow[]>([]);
  const [dloStatus, setDloStatus] = useState<Record<string, DloStatusLite>>({});
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis>({ underserved_subjects: [], suggested_focus_threads: [] });
  const [curriculumCoverage, setCurriculumCoverage] = useState<CurriculumCoverage>({});
  // Seeded from the per-session catalog cache so the first paint of depth 3
  // already has descriptors; the effect below refreshes from the network.
  const [dlosByThread, setDlosByThread] = useState<Record<string, SanityDLO[]>>(() => {
    const cached = readCachedCatalog();
    return cached ? indexDLOsByThread(cached) : {};
  });
  const [loading, setLoading] = useState(true);
  // A fetch failure must be distinguishable from "nothing observed yet" — an
  // established family seeing the first-use zero-state because a request
  // failed reads as lost progress (the exact trust break the "not yet" copy
  // rules exist to avoid). Retryable via the nonces below.
  const [loadError, setLoadError] = useState(false);
  // A background refetch (post-DLO-confirm) that fails while data is already
  // on screen — distinct from loadError, which replaces the whole page. This
  // keeps the stale-but-real view and surfaces a small retryable notice
  // instead, so the rebuild's fate is never silent.
  const [refreshError, setRefreshError] = useState(false);
  const [learnersNonce, setLearnersNonce] = useState(0);
  // Bumped after a DLO confirm/clear to refetch the snapshot (the server rebuild
  // is fire-and-forget, so this is best-effort eventual consistency).
  const [reloadNonce, setReloadNonce] = useState(0);
  const prevLearnerRef = useRef<string | null>(null);
  // Whether the current learner has capability data on screen — a background
  // refetch failure (confirm-triggered reloadNonce) keeps the stale-but-real
  // view instead of flipping the whole page to an error.
  const hasDataRef = useRef(false);

  useEffect(() => {
    // Guarded: a 5xx must NOT crash the page via JSON-parse SyntaxError.
    // See incident 2026-05-25 (unrun migration 0016).
    fetch('/api/learners')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`learners ${r.status}`))))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLearners(data);
          const requested = requestedLearnerId && data.some((l: Learner) => l.id === requestedLearnerId)
            ? requestedLearnerId
            : null;
          setSelectedLearnerId((prev) => prev || requested || data[0].id);
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
    // requestedLearnerId is read once on arrival; later child switches are
    // in-page state, so a URL change must not re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnersNonce]);

  // DLO content is shared across learners — fetch once per session. A cached
  // copy renders immediately; the network copy refreshes it in the background.
  useEffect(() => {
    let cancelled = false;
    const hadCache = readCachedCatalog() !== null;
    // discreteLearningObjective uses dotted ids (dark to the tokenless browser
    // client) — read the DLO descriptor catalog through the authed proxy.
    clientSanityRead<SanityDLO[]>('allDlos')
      .then((rows) => {
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        // An empty network answer never wipes a cached catalog that is on screen.
        if (list.length > 0 || !hadCache) setDlosByThread(indexDLOsByThread(list));
        writeCachedCatalog(list);
      })
      .catch(() => { /* keep the cached catalog if we had one; depth 3 renders an empty state otherwise */ });
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
      hasDataRef.current = false;
      setActiveThreads([]);
      setDloStatus({});
      setGapAnalysis({ underserved_subjects: [], suggested_focus_threads: [] });
      setCurriculumCoverage({});
    }
    fetch(`/api/capabilities/${selectedLearnerId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`capabilities ${r.status}`))))
      .then((data) => {
        if (cancelled) return;
        hasDataRef.current = true;
        setLoadError(false);
        setRefreshError(false);
        // New shape: { activeThreads, dloStatus, gapAnalysis, curriculumCoverage }.
        // Old shape was a bare array.
        if (Array.isArray(data)) {
          setActiveThreads(data as ActiveThreadRow[]);
          setDloStatus({});
        } else {
          setActiveThreads(Array.isArray(data?.activeThreads) ? data.activeThreads : []);
          setDloStatus(data?.dloStatus ?? {});
          setGapAnalysis(
            data?.gapAnalysis ?? { underserved_subjects: [], suggested_focus_threads: [] },
          );
          setCurriculumCoverage(data?.curriculumCoverage ?? {});
        }
      })
      .catch(() => {
        if (cancelled) return;
        // With data already on screen (a confirm-triggered background refetch),
        // keep the stale-but-real view but say the rebuild may not have
        // persisted — a small retryable notice, not silence. With nothing on
        // screen yet, this failure would have rendered the first-use
        // zero-state — that path still gets the full-page retry instead.
        if (!hasDataRef.current) {
          setLoadError(true);
        } else {
          setRefreshError(true);
        }
      });
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

  if (loadError) {
    return (
      <div className="mx-auto max-w-[600px] px-md py-2xl">
        <EmptyState
          icon={ArrowsClockwise}
          heading="We couldn't load the constellation just now"
          body="Nothing is lost — every moment you've logged is safe. This looks like a connection hiccup."
          cta={{
            label: 'Try again',
            onClick: () => {
              setLoadError(false);
              if (learners.length === 0) {
                setLoading(true);
                setLearnersNonce((n) => n + 1);
              } else {
                setReloadNonce((n) => n + 1);
              }
            },
          }}
        />
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
      {refreshError && (
        <div className="mx-auto max-w-[1280px] px-md pt-md lg:px-xl">
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-between gap-sm rounded-md border border-border-subtle bg-surface-raised px-md py-sm"
          >
            <span className="inline-flex items-center gap-sm font-sans text-[11px] text-text-secondary">
              <span className="text-text-muted" aria-hidden="true"><ArrowsClockwise size={14} /></span>
              We couldn&rsquo;t refresh just now — nothing&rsquo;s lost, tap to try again.
            </span>
            <button
              type="button"
              onClick={() => {
                setRefreshError(false);
                setReloadNonce((n) => n + 1);
              }}
              className="shrink-0 font-sans text-[11px] font-semibold text-ember transition-colors duration-[var(--motion-quick)] hover:text-ember-hover"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      <ConstellationRoute
        learners={learners}
        learnerId={selectedLearnerId}
        snap={snap}
        dlosByThread={dlosByThread}
        onSelectLearner={setSelectedLearnerId}
        onDataChanged={() => setReloadNonce((n) => n + 1)}
        gapAnalysis={gapAnalysis}
        curriculumCoverage={curriculumCoverage}
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
