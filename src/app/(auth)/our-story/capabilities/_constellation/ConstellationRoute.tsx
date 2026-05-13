'use client';

import './constellation.css';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChildSelector } from '@/components/ui/child-selector';
import {
  ALL_THREADS,
  ORDERED_DOMAINS,
  THREADS_BY_ID,
  buildDLOs,
  buildSnapshot,
  threadCurrentTier,
  type ActiveThreadRow,
  type LearnerSnapshot,
  type SynthDLO,
  type ThreadNode,
} from './topology';
import { TableThreads, TableDLOs, TableMoments } from './TableView';
import { GalleryDomains, GalleryThreads, GalleryDLOs, GalleryMoments } from './GalleryView';

type Learner = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
};

type ViewMode = 'table' | 'gallery';
type Depth = 1 | 2 | 3 | 4;
type Focus = { domain: string | null; thread: string | null; dlo: string | null };

function HearthVoiceCard({ snap }: { snap: LearnerSnapshot }) {
  const active = ALL_THREADS.filter((t) => snap.threadState[t.id] === 'active').length;
  const ghosts = ALL_THREADS.filter((t) => snap.threadState[t.id] === 'ghost').length;
  const demonstrating = ALL_THREADS.filter((t) => threadCurrentTier(t.id, snap) === 'demonstrating').length;

  return (
    <div className="relative mb-lg rounded-lg border border-border-subtle p-lg [background:linear-gradient(135deg,var(--color-surface-panel)_0%,var(--color-surface-raised)_100%)]">
      <span className="absolute inset-x-0 top-0 h-[2px] rounded-t-lg opacity-40 [background:linear-gradient(90deg,transparent,var(--color-ember),transparent)]" />
      <span className="inline-block h-[6px] w-[6px] rounded-full bg-ember shadow-[0_0_8px_var(--color-ember)] mr-sm align-middle" />
      <span className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ember">Hearth noticed</span>
      <p className="mt-sm max-w-[70ch] font-serif italic leading-relaxed text-text-secondary">
        {snap.name} is moving across <strong className="font-semibold text-text-primary">{active} {active === 1 ? 'thread' : 'threads'}</strong> right now,
        demonstrating {demonstrating} of them.
        {ghosts > 0 && (
          <>
            {' '}The {ghosts === 1 ? 'thread' : `${ghosts} threads`} opening up on the right edge of each band {ghosts === 1 ? 'is' : 'are'} where the prerequisites have started lining up — they tend to come on of their own accord when the foundations settle.
          </>
        )}
      </p>
    </div>
  );
}

function Stepper({
  depth, focus, onJump,
}: { depth: Depth; focus: Focus; onJump: (d: Depth) => void }) {
  const domainLabel = focus.domain ? ORDERED_DOMAINS.find((d) => d.key === focus.domain)?.label ?? null : null;
  const threadLabel = focus.thread ? THREADS_BY_ID[focus.thread]?.name ?? null : null;
  const dloLabel = focus.dlo
    ? buildDLOs(focus.thread ?? '', { /* tier-only access */
        id: '', name: '', colourToken: null, tierByThread: {}, observationsByThread: {},
        lastDateByThread: {}, threadState: {}, badges: [], dlosByThread: {},
      } as LearnerSnapshot).find((d) => d.id === focus.dlo)?.descriptor ?? null
    : null;

  const steps: Array<{ d: Depth; label: string; context: string | null; reachable: boolean }> = [
    { d: 1, label: 'Domains',              context: null,         reachable: true },
    { d: 2, label: 'Threads',              context: domainLabel,  reachable: !!focus.domain },
    { d: 3, label: 'Learning objectives',  context: threadLabel,  reachable: !!focus.thread },
    { d: 4, label: 'Moments',              context: dloLabel,     reachable: !!focus.dlo },
  ];

  return (
    <nav aria-label="Depth navigation" className="flex flex-wrap items-center gap-xs py-sm">
      {steps.map((s, i) => {
        if (s.d > depth && !s.reachable) return null;
        const isCurrent = depth === s.d;
        return (
          <div key={s.d} className="flex items-center gap-xs">
            {i > 0 && <span aria-hidden className="text-text-muted select-none">›</span>}
            <button
              type="button"
              aria-current={isCurrent ? 'page' : undefined}
              disabled={isCurrent}
              onClick={() => onJump(s.d)}
              className={`inline-flex items-center gap-xs rounded-full px-md py-xs font-sans text-[0.8rem] font-medium transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
                isCurrent
                  ? 'cursor-default bg-surface-raised text-text-primary border border-border-medium'
                  : 'cursor-pointer border border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              {s.label}
              {s.context && (
                <span className="ml-[2px] font-normal text-text-muted">
                  ({s.context.length > 24 ? `${s.context.slice(0, 22)}…` : s.context})
                </span>
              )}
            </button>
          </div>
        );
      })}
    </nav>
  );
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div role="radiogroup" aria-label="View mode"
         className="inline-flex gap-[2px] rounded-md border border-border-subtle bg-surface-panel p-[3px]">
      {([
        { id: 'table' as const, glyph: '☰', label: 'Table' },
        { id: 'gallery' as const, glyph: '✦', label: 'Gallery' },
      ]).map((v) => {
        const active = view === v.id;
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v.id)}
            className={`inline-flex items-center gap-[6px] rounded-[8px] px-md py-xs font-sans text-sm transition-colors duration-[var(--motion-quick)] ${
              active ? 'bg-ember text-text-inverse font-semibold' : 'bg-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <span aria-hidden>{v.glyph}</span>
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

function ContextLine({ snap, depth, focus }: { snap: LearnerSnapshot; depth: Depth; focus: Focus }) {
  let text = '';
  if (depth === 1) {
    text = `${ALL_THREADS.length} threads across ${ORDERED_DOMAINS.length} domains`;
  } else if (depth === 2 && focus.domain) {
    const dom = ORDERED_DOMAINS.find((d) => d.key === focus.domain);
    const n = ALL_THREADS.filter((t) => t.domain === focus.domain).length;
    text = `${dom?.label} · ${n} threads`;
  } else if (depth === 3 && focus.thread) {
    text = `${THREADS_BY_ID[focus.thread]?.name} · 3 learning objectives`;
  } else if (depth === 4 && focus.dlo && focus.thread) {
    const dlo = buildDLOs(focus.thread, snap).find((d) => d.id === focus.dlo);
    text = dlo?.descriptor ?? '';
  }
  return (
    <div className="font-sans text-[0.75rem] uppercase tracking-[0.06em] text-text-muted">
      {text}
    </div>
  );
}

export function ConstellationRoute({
  learners, learnerId, snap, onSelectLearner,
}: {
  learners: Learner[];
  learnerId: string;
  snap: LearnerSnapshot;
  onSelectLearner: (id: string) => void;
}) {
  const router = useRouter();
  const search = useSearchParams();

  const initialView: ViewMode = search.get('view') === 'gallery' ? 'gallery' : 'table';
  const initialDepth: Depth = (() => {
    const n = Number(search.get('d') ?? '1');
    return n === 2 || n === 3 || n === 4 ? (n as Depth) : 1;
  })();
  const initialFocus: Focus = (() => {
    const f = search.get('focus');
    if (!f) return { domain: null, thread: null, dlo: null };
    const parts = f.split('.');
    if (parts.length === 1) return { domain: parts[0], thread: null, dlo: null };
    const threadId = parts.slice(0, -1).join('.');
    const t = THREADS_BY_ID[threadId];
    if (t) {
      // could be ".e/.d/.m"
      if (parts[parts.length - 1].length === 1) {
        return { domain: t.domain, thread: threadId, dlo: f };
      }
    }
    const directThread = THREADS_BY_ID[f];
    if (directThread) return { domain: directThread.domain, thread: f, dlo: null };
    return { domain: f, thread: null, dlo: null };
  })();

  const [view, setView] = useState<ViewMode>(initialView);
  const [depth, setDepth] = useState<Depth>(initialDepth);
  const [focus, setFocus] = useState<Focus>(initialFocus);

  // Sync URL on changes
  useEffect(() => {
    const params = new URLSearchParams(search.toString());
    params.set('view', view);
    params.set('d', String(depth));
    if (depth === 1) params.delete('focus');
    else if (depth === 2 && focus.domain) params.set('focus', focus.domain);
    else if (depth === 3 && focus.thread) params.set('focus', focus.thread);
    else if (depth === 4 && focus.dlo) params.set('focus', focus.dlo);
    const qs = params.toString();
    router.replace(`/our-story/capabilities${qs ? `?${qs}` : ''}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, depth, focus]);

  const drillToDomain = (key: string) => { setFocus({ domain: key, thread: null, dlo: null }); setDepth(2); };
  const drillToThread = (t: ThreadNode) => { setFocus((f) => ({ ...f, domain: t.domain, thread: t.id, dlo: null })); setDepth(3); };
  const drillToDLO = (d: SynthDLO) => { setFocus((f) => ({ ...f, dlo: d.id })); setDepth(4); };

  const jump = (d: Depth) => {
    if (d > depth) return;
    if (d === 1) setFocus({ domain: null, thread: null, dlo: null });
    if (d === 2) setFocus((f) => ({ ...f, thread: null, dlo: null }));
    if (d === 3) setFocus((f) => ({ ...f, dlo: null }));
    setDepth(d);
  };

  const stageKey = `${view}-${depth}-${focus.domain ?? ''}-${focus.thread ?? ''}-${focus.dlo ?? ''}-${learnerId}`;

  const dloObj = useMemo<SynthDLO | null>(() => {
    if (!focus.thread || !focus.dlo) return null;
    return buildDLOs(focus.thread, snap).find((d) => d.id === focus.dlo) ?? null;
  }, [focus.thread, focus.dlo, snap]);

  return (
    <div className="cap-route mx-auto max-w-[1280px] px-md py-xl lg:px-xl lg:py-2xl">
      {/* Header */}
      <div className="mb-xl">
        <div className="flex flex-wrap items-end justify-between gap-md">
          <div>
            <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
              OUR STORY · CAPABILITIES
            </div>
            <h1 className="mt-xs font-serif text-[2rem] font-normal leading-[1.3] text-text-primary">
              {snap.name}&rsquo;s constellation
            </h1>
            <p className="mt-xs max-w-[60ch] font-serif italic text-text-secondary">
              A field of capability threads. Lit where {snap.name} has been observed, quietly waiting where they&rsquo;re heading.
            </p>
          </div>
        </div>
        <div className="mt-md">
          <ChildSelector learners={learners} selectedId={learnerId} onChange={onSelectLearner} />
        </div>
      </div>

      <Stepper depth={depth} focus={focus} onJump={jump} />

      <div className="mt-xs mb-lg flex flex-wrap items-center justify-between gap-md">
        <ContextLine snap={snap} depth={depth} focus={focus} />
        <ViewToggle view={view} onChange={setView} />
      </div>

      {depth === 1 && <HearthVoiceCard snap={snap} />}

      <div key={stageKey} className="cap-stage">
        {view === 'table' && depth === 1 && (
          <TableThreads snap={snap} depth={1} onDrillDown={drillToThread} onDomainTap={drillToDomain} />
        )}
        {view === 'table' && depth === 2 && focus.domain && (
          <TableThreads snap={snap} depth={2} focusDomain={focus.domain} onDrillDown={drillToThread} />
        )}
        {view === 'table' && depth === 3 && focus.thread && (
          <TableDLOs snap={snap} threadId={focus.thread} onDrillDown={drillToDLO} />
        )}
        {view === 'table' && depth === 4 && dloObj && (
          <TableMoments snap={snap} dlo={dloObj} />
        )}

        {view === 'gallery' && (
          <div className="cap-gallery rounded-lg border border-border-subtle p-xl min-h-[540px]">
            {depth === 1 && <GalleryDomains snap={snap} onDrill={drillToDomain} />}
            {depth === 2 && focus.domain && <GalleryThreads snap={snap} domainKey={focus.domain} onDrill={drillToThread} />}
            {depth === 3 && focus.thread && <GalleryDLOs snap={snap} threadId={focus.thread} onDrill={drillToDLO} />}
            {depth === 4 && dloObj && <GalleryMoments snap={snap} dlo={dloObj} />}
          </div>
        )}
      </div>

      {view === 'gallery' && (
        <div className="mt-md flex flex-wrap items-center gap-lg font-sans text-[0.75rem] text-text-muted">
          <span className="inline-flex items-center gap-[6px]">
            <span className="inline-block h-[14px] w-[14px] rounded-full bg-text-secondary" /> Active thread
          </span>
          <span className="inline-flex items-center gap-[6px]">
            <span className="inline-block h-[14px] w-[14px] rounded-full border-[1.5px] border-text-secondary" /> Opening up (ghost)
          </span>
          <span className="inline-flex items-center gap-[6px]">
            <span className="inline-block h-[14px] w-[14px] rounded-full border border-sage" /> Demonstrating tier (sage halo)
          </span>
          <span className="inline-flex items-center gap-[6px]">
            <span className="inline-block h-[1px] w-[14px] bg-text-secondary" /> Enables (within domain)
          </span>
        </div>
      )}
    </div>
  );
}

export function buildSnapshotFromApi(
  learner: Learner,
  rows: ActiveThreadRow[],
): LearnerSnapshot {
  return buildSnapshot(
    { id: learner.id, name: learner.name, colourToken: learner.colourToken },
    rows,
  );
}
