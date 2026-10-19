'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { ArrowRight } from '@/components/icons';
import { DloConfirmButton } from './DloConfirmButton';
import {
  ALL_THREADS,
  ORDERED_DOMAINS,
  TIER_GLYPH,
  TIER_LABEL,
  THREADS_BY_ID,
  DLO_STATUS_LABEL,
  buildDLOs,
  domainColor,
  isNewlyLit,
  isRecentlyActive,
  nextDloToWatch,
  threadCurrentTier,
  type LearnerSnapshot,
  type SanityDLO,
  type SynthDLO,
  type Tier,
  type ThreadNode,
  type ThreadTrajectory,
} from './topology';

type DLO = SynthDLO;

/**
 * Trajectory as the rebuild reads it (4-week window split in two halves) —
 * computed for every active thread since WS-4 but never shown until now.
 */
const TRAJECTORY_LABEL: Record<ThreadTrajectory, { glyph: string; label: string; cls: string }> = {
  accelerating:  { glyph: '↗', label: 'Picking up',   cls: 'text-sage' },
  steady_growth: { glyph: '→', label: 'Steady',       cls: 'text-text-secondary' },
  plateau:       { glyph: '…', label: 'Quiet lately', cls: 'text-text-muted' },
  new:           { glyph: '✦', label: 'Just started', cls: 'text-ember' },
};

type EvidenceEntry = {
  id: string;
  title: string;
  description: string | null;
  dateOccurred: string;
  source: string;
  aiEnrichment: {
    capability_threads?: Array<{ thread_id: string; confidence: number }>;
  } | null;
};

const NOW = () => new Date();

function relTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const days = Math.round((NOW().getTime() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}

function tierClass(tier: Tier) { return `cap-tier-${tier}`; }

type Filters = {
  state: 'all' | 'active' | 'ghost' | 'badges';
  tier: Set<Exclude<Tier, 'unobserved'>>;
};

type SortKey = 'default' | 'name' | 'tier' | 'obs' | 'last';
type Sort = { key: SortKey; dir: 'asc' | 'desc' };

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-sm mb-md">
      <span className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted mr-xs">State</span>
      {([
        { id: 'all',    label: 'All threads' },
        { id: 'active', label: 'Active only' },
        { id: 'ghost',  label: 'Ghost (Opening Up)' },
        { id: 'badges', label: 'With badges' },
      ] as const).map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`cap-chip ${filters.state === opt.id ? 'active' : ''}`}
          onClick={() => onChange({ ...filters, state: opt.id })}
        >{opt.label}</button>
      ))}
      <span aria-hidden className="mx-xs h-5 w-px bg-border-subtle" />
      <span className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted mr-xs">Tier</span>
      {([
        { id: 'emerging' as const,      glyph: '○' },
        { id: 'developing' as const,    glyph: '◐' },
        { id: 'demonstrating' as const, glyph: '●' },
      ]).map((t) => (
        <button
          key={t.id}
          type="button"
          className={`cap-chip ${filters.tier.has(t.id) ? 'active' : ''}`}
          onClick={() => {
            const next = new Set(filters.tier);
            if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
            onChange({ ...filters, tier: next });
          }}
        >
          <span className={`text-base leading-none ${tierClass(t.id)}`} aria-hidden>{t.glyph}</span>
          {TIER_LABEL[t.id]}
        </button>
      ))}
    </div>
  );
}

function ThreadRow({
  thread, snap, showDomain, onDrillDown,
}: {
  thread: ThreadNode; snap: LearnerSnapshot; showDomain: boolean;
  onDrillDown: (t: ThreadNode) => void;
}) {
  const tier = threadCurrentTier(thread.id, snap);
  const obs = snap.observationsByThread[thread.id] ?? 0;
  const last = snap.lastDateByThread[thread.id];
  const state = snap.threadState[thread.id];
  const badge = snap.badges.find((b) => b.thread === thread.id);
  const domain = ORDERED_DOMAINS.find((d) => d.key === thread.domain);
  const isGhostish = state === 'ghost' || state === 'dormant';
  const pips = 5;
  const filled = Math.min(pips, Math.ceil(obs / 3));
  const newlyLit = isNewlyLit(snap, thread.id);
  const recent = isRecentlyActive(snap, thread.id);
  const trajectory = snap.trajectoryByThread[thread.id];
  const traj = trajectory && obs >= 3 ? TRAJECTORY_LABEL[trajectory] : null;

  return (
    <tr
      className={`cursor-pointer border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors duration-[var(--motion-quick)] ${isGhostish ? 'ghost' : ''}`}
      onClick={() => onDrillDown(thread)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDrillDown(thread); } }}
    >
      <td className="p-md align-middle">
        <span className="flex flex-wrap items-center gap-sm">
          <span className="font-serif text-base font-semibold text-text-primary">{thread.name}</span>
          {newlyLit && (
            <span className="rounded-full bg-ember-glow px-sm py-[1px] font-sans text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-ember">
              New
            </span>
          )}
          {!newlyLit && recent && (
            <span
              className="inline-block h-[6px] w-[6px] rounded-full bg-sage"
              aria-label="Active in the last week"
              title="Active in the last week"
            />
          )}
        </span>
        <span className="mt-[2px] block font-sans text-[0.7rem] tracking-[0.04em] text-text-muted">
          {thread.id}
          {/* Below 900px the Last-activity column is hidden — keep the one
              date a parent actually scans for next to the name. */}
          {last && <span className="min-[900px]:hidden"> · {relTime(last)}</span>}
        </span>
      </td>
      {showDomain && (
        <td className="col-domain-col p-md align-middle hidden min-[900px]:table-cell">
          <span className="inline-flex items-center gap-[6px] font-sans text-sm text-text-secondary">
            <span className="inline-block h-[10px] w-[10px] rounded-full" style={{ background: domain?.color }} />
            {domain?.short}
          </span>
        </td>
      )}
      <td className="p-md align-middle">
        <span className="flex items-center gap-[6px] font-sans">
          <span className={`text-[1.1rem] leading-none ${tierClass(tier)}`}>{TIER_GLYPH[tier]}</span>
          <span className="text-[0.78rem] text-text-muted">{TIER_LABEL[tier]}</span>
          {traj && (
            <span className={`ml-xs inline-flex items-center gap-[3px] text-[0.72rem] ${traj.cls}`} title={traj.label} aria-label={`Trajectory: ${traj.label}`}>
              <span aria-hidden="true">{traj.glyph}</span>
              <span className="hidden min-[600px]:inline">{traj.label}</span>
            </span>
          )}
        </span>
      </td>
      <td className="p-md align-middle">
        <span className="flex items-center gap-sm">
          <span className="inline-flex gap-[2px]" aria-label={`${obs} observations`}>
            {Array.from({ length: pips }).map((_, i) => (
              <span key={i} className={`h-[14px] w-[6px] rounded-[1px] ${i < filled ? 'bg-ember' : 'bg-surface-hover'}`} />
            ))}
          </span>
          <span className="min-w-[18px] font-sans text-sm text-text-secondary">{obs}</span>
        </span>
      </td>
      <td className="col-last p-md align-middle hidden min-[900px]:table-cell font-sans text-sm text-text-secondary">{relTime(last)}</td>
      <td className="col-badge-label p-md align-middle hidden min-[600px]:table-cell">
        <span className="flex items-center gap-[6px]">
          {badge ? (
            badge.status === 'approaching' ? (
              <>
                <span className="cap-badge-approaching relative inline-block h-[14px] w-[14px] rounded-full border-[1.5px] border-ember" />
                <span className="font-sans text-[0.72rem] text-text-muted">Approaching</span>
              </>
            ) : (
              <>
                <span className="inline-block h-[14px] w-[14px] rounded-full bg-ember shadow-[0_0_8px_var(--color-ember-glow)]" />
                <span className="font-sans text-[0.72rem] text-text-muted">
                  {(badge.level ?? '').charAt(0).toUpperCase() + (badge.level ?? '').slice(1)}
                </span>
              </>
            )
          ) : (
            <>
              <span className="inline-block h-[14px] w-[14px] rounded-full bg-surface-hover" />
              <span className="font-sans text-[0.72rem] text-text-muted">—</span>
            </>
          )}
        </span>
      </td>
      <td className="col-state p-md align-middle hidden min-[600px]:table-cell">
        <span className={`font-sans text-[0.75rem] uppercase tracking-[0.06em] ${state === 'ghost' ? 'text-ember' : state === 'active' ? 'text-text-secondary' : 'text-text-muted opacity-60'}`}>
          {state === 'ghost' ? 'Opening up' : state === 'active' ? 'Active' : 'Dormant'}
        </span>
      </td>
    </tr>
  );
}

function applyFilters(threads: ThreadNode[], snap: LearnerSnapshot, filters: Filters): ThreadNode[] {
  return threads.filter((t) => {
    const state = snap.threadState[t.id];
    const tier = threadCurrentTier(t.id, snap);
    if (filters.state === 'active' && state !== 'active') return false;
    if (filters.state === 'ghost' && state !== 'ghost') return false;
    if (filters.state === 'badges' && !snap.badges.some((b) => b.thread === t.id)) return false;
    if (tier !== 'unobserved' && filters.tier.size > 0 && !filters.tier.has(tier)) return false;
    return true;
  });
}

function sortThreads(threads: ThreadNode[], snap: LearnerSnapshot, sort: Sort): ThreadNode[] {
  if (sort.key === 'default') return threads;
  const order: Record<Tier, number> = { demonstrating: 3, developing: 2, emerging: 1, unobserved: 0 };
  const dir = sort.dir === 'asc' ? 1 : -1;
  const arr = [...threads];
  arr.sort((a, b) => {
    let va: number | string = '';
    let vb: number | string = '';
    if (sort.key === 'name') { va = a.name; vb = b.name; }
    else if (sort.key === 'tier') {
      va = order[threadCurrentTier(a.id, snap)];
      vb = order[threadCurrentTier(b.id, snap)];
    }
    else if (sort.key === 'obs') {
      va = snap.observationsByThread[a.id] ?? 0;
      vb = snap.observationsByThread[b.id] ?? 0;
    }
    else if (sort.key === 'last') {
      va = snap.lastDateByThread[a.id] ?? '';
      vb = snap.lastDateByThread[b.id] ?? '';
    }
    return va > vb ? dir : va < vb ? -dir : 0;
  });
  return arr;
}

/* ----- Depth 1 / 2 : threads table ----- */
export function TableThreads({
  snap, depth, focusDomain, onDrillDown, onDomainTap,
}: {
  snap: LearnerSnapshot;
  depth: 1 | 2;
  focusDomain?: string | null;
  onDrillDown: (t: ThreadNode) => void;
  onDomainTap?: (domainKey: string) => void;
}) {
  const [filters, setFilters] = useState<Filters>({
    state: 'all',
    tier: new Set(['emerging', 'developing', 'demonstrating']),
  });
  const [sort, setSort] = useState<Sort>({ key: 'default', dir: 'asc' });

  const onHeader = (key: SortKey) => () => {
    setSort((prev) => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: key === 'name' ? 'asc' : 'desc' });
  };

  const visibleDomains = depth === 1
    ? ORDERED_DOMAINS
    : ORDERED_DOMAINS.filter((d) => d.key === focusDomain);

  const sortArrow = (key: SortKey) => sort.key === key
    ? <span className="ml-1 text-[0.7em] text-ember">{sort.dir === 'asc' ? '▲' : '▼'}</span>
    : null;
  const ariaSort = (key: SortKey): 'ascending' | 'descending' | 'none' =>
    sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
  const headerKeys = (key: SortKey) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHeader(key)(); }
  };

  return (
    <div>
      {depth >= 2 && <FilterBar filters={filters} onChange={setFilters} />}

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-panel">
        <table className="cap-table w-full border-collapse">
          <thead>
            <tr>
              <th onClick={onHeader('name')} onKeyDown={headerKeys('name')} tabIndex={0} aria-sort={ariaSort('name')} className="cursor-pointer select-none p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle bg-surface-panel sticky top-0 hover:text-text-secondary">Thread{sortArrow('name')}</th>
              {depth === 1 && (
                <th className="col-domain-col cursor-default p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle bg-surface-panel sticky top-0 hidden min-[900px]:table-cell">Domain</th>
              )}
              <th onClick={onHeader('tier')} onKeyDown={headerKeys('tier')} tabIndex={0} aria-sort={ariaSort('tier')} className="cursor-pointer select-none p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle bg-surface-panel sticky top-0 hover:text-text-secondary">Tier{sortArrow('tier')}</th>
              <th onClick={onHeader('obs')} onKeyDown={headerKeys('obs')} tabIndex={0} aria-sort={ariaSort('obs')} className="cursor-pointer select-none p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle bg-surface-panel sticky top-0 hover:text-text-secondary">Observations{sortArrow('obs')}</th>
              <th onClick={onHeader('last')} onKeyDown={headerKeys('last')} tabIndex={0} aria-sort={ariaSort('last')} className="col-last cursor-pointer select-none p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle bg-surface-panel sticky top-0 hover:text-text-secondary hidden min-[900px]:table-cell">Last activity{sortArrow('last')}</th>
              <th className="col-badge-label p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle bg-surface-panel sticky top-0 hidden min-[600px]:table-cell">Badge</th>
              <th className="col-state p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle bg-surface-panel sticky top-0 hidden min-[600px]:table-cell">State</th>
            </tr>
          </thead>
          <tbody>
            {visibleDomains.map((domain) => {
              const domainThreads = ALL_THREADS.filter((t) => t.domain === domain.key);
              const filtered = applyFilters(domainThreads, snap, filters);
              const sorted = sortThreads(filtered, snap, sort);
              if (sorted.length === 0 && sort.key !== 'default' && depth === 1) return null;
              const active = domainThreads.filter((t) => snap.threadState[t.id] === 'active').length;
              const ghosts = domainThreads.filter((t) => snap.threadState[t.id] === 'ghost').length;
              return (
                <Fragment key={domain.key}>
                  {depth === 1 && (
                    <tr
                      className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember"
                      onClick={(e) => { e.stopPropagation(); onDomainTap?.(domain.key); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDomainTap?.(domain.key); } }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Drill into ${domain.label}`}
                    >
                      <td colSpan={7} className="p-lg pr-md bg-surface-body border-b border-border-subtle">
                        <span className="inline-flex items-center gap-sm font-serif text-[1.05rem] font-semibold text-text-primary">
                          <span className="inline-block h-[10px] w-[10px] rounded-full" style={{ background: domain.color }} />
                          {domain.label}
                        </span>
                        <span className="ml-sm font-sans text-[0.75rem] text-text-muted">
                          {domainThreads.length} threads · {active} active · {ghosts} opening up
                        </span>
                        <span className="float-right inline-flex items-center gap-xs font-sans text-[0.75rem] text-ember">
                          Drill into {domain.short.toLowerCase()} <ArrowRight size={14} aria-hidden="true" />
                        </span>
                      </td>
                    </tr>
                  )}
                  {sorted.map((t) => (
                    <ThreadRow
                      key={t.id}
                      thread={t}
                      snap={snap}
                      showDomain={depth === 1}
                      onDrillDown={onDrillDown}
                    />
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ----- Depth 3 : DLO list ----- */
export function TableDLOs({
  snap, threadId, dlosByThread, onDrillDown,
  confirmedDloIds, pendingDloIds, onConfirmDlo,
}: {
  snap: LearnerSnapshot;
  threadId: string;
  dlosByThread?: Record<string, SanityDLO[]>;
  onDrillDown: (d: DLO) => void;
  confirmedDloIds?: Set<string>;
  pendingDloIds?: Set<string>;
  onConfirmDlo?: (dloId: string, next: boolean) => void;
}) {
  const thread = THREADS_BY_ID[threadId];
  const dlos = useMemo(() => buildDLOs(threadId, snap, dlosByThread), [threadId, snap, dlosByThread]);
  // The first objective (in tier order) the child has not yet reached — the
  // concrete "what would the next tier look like" a parent can watch for.
  const watchNext = useMemo(() => nextDloToWatch(dlos), [dlos]);

  if (!thread) return null;
  const approaching = snap.badges.find((b) => b.thread === threadId && b.status === 'approaching');

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-panel">
      <div className="bg-surface-raised px-lg py-md font-serif italic text-text-secondary">
        <em>{thread.name}</em> · {dlos.length} discrete learning objectives. Each glows when{' '}
        {snap.name} has demonstrated it.
        {watchNext && (
          <span className="mt-xs block not-italic font-sans text-[0.78rem] text-text-muted">
            Next to watch for: <span className="text-text-secondary">{watchNext.descriptor}</span>
          </span>
        )}
      </div>
      {approaching && (
        <div className="flex items-center justify-between gap-md border-b border-border-subtle bg-ember-glow px-lg py-md">
          <div>
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ember">Badge approaching</p>
            <p className="font-serif text-sm italic text-text-secondary mt-xs">
              {snap.name} is close to the next badge for {thread.name}. A short, focused observation could tip it over.
            </p>
          </div>
          <Link
            href={`/log?source=check-in&thread=${encodeURIComponent(threadId)}&learner=${encodeURIComponent(snap.id)}`}
            className="shrink-0 rounded-md bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-colors duration-[var(--motion-quick)] hover:bg-ember-hover"
          >
            Plan a check-in
          </Link>
        </div>
      )}
      {dlos.map((dlo) => {
        const tierColor = dlo.tier === 'demonstrating' ? 'var(--color-sage)' : dlo.tier === 'developing' ? 'var(--color-child-amber)' : 'var(--color-text-muted)';
        // Four states, one per learner_dlo_status value. 'developing' used to
        // be collapsed into 'emerging' here, so the middle rung was invisible.
        const statusChip =
          dlo.status === 'confirmed' ? 'bg-sage-muted text-sage-text' :
          dlo.status === 'developing' ? 'bg-child-amber/15 text-child-amber' :
          dlo.status === 'emerging' ? 'bg-ember-glow text-ember' :
          'text-text-muted bg-surface-hover';
        const isNext = watchNext?.id === dlo.id;
        const confirmed = confirmedDloIds?.has(dlo.id) ?? false;
        const pending = pendingDloIds?.has(dlo.id) ?? false;
        return (
          <div
            key={dlo.id}
            className={`flex items-center gap-sm border-t border-border-subtle first:border-t-0 hover:bg-surface-hover transition-colors duration-[var(--motion-quick)] px-md py-sm sm:gap-md sm:px-lg sm:py-md ${isNext ? 'bg-ember/[0.04]' : ''}`}
          >
            <button
              type="button"
              onClick={() => onDrillDown(dlo)}
              className="flex min-w-0 flex-1 items-center gap-sm text-left sm:gap-md"
              aria-label={`${dlo.descriptor} — ${DLO_STATUS_LABEL[dlo.status]}${isNext ? ', next to watch for' : ''} — open moments`}
            >
              <span className="inline-flex w-[28px] shrink-0 justify-center text-[1.6rem] leading-none sm:w-[36px]" style={{ color: tierColor }}>{dlo.glyph}</span>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-base font-medium text-text-primary">{dlo.descriptor}</div>
                <div className="mt-[2px] flex flex-wrap items-center gap-x-sm gap-y-[2px] font-sans text-[0.75rem] text-text-muted">
                  <span>{dlo.tierLabel} tier · {dlo.badgeLevel} badge</span>
                  {/* Status is always visible — on phones as this compact chip,
                      since the wide chip on the right is hidden below sm. */}
                  <span className={`inline-block rounded-sm px-[6px] py-[1px] text-[0.65rem] uppercase tracking-[0.05em] sm:hidden ${statusChip}`}>
                    {DLO_STATUS_LABEL[dlo.status]}
                  </span>
                  {isNext && (
                    <span className="inline-flex items-center gap-[4px] rounded-full border border-ember/30 bg-ember-glow px-sm py-[1px] text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-ember">
                      Watch for this next
                    </span>
                  )}
                </div>
              </div>
              <span className={`hidden shrink-0 rounded-sm px-sm py-[4px] font-sans text-[0.75rem] uppercase tracking-[0.05em] sm:inline-block ${statusChip}`}>
                {DLO_STATUS_LABEL[dlo.status]}
              </span>
            </button>
            {onConfirmDlo && (
              <DloConfirmButton
                confirmed={confirmed}
                pending={pending}
                descriptor={dlo.descriptor}
                onToggle={() => onConfirmDlo(dlo.id, !confirmed)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ----- Depth 4 : moments table ----- */

/**
 * DLO-level evidence rows from /api/capabilities/[learnerId]/dlo-evidence.
 * These come from the post-Phase-2 observation_dlo_links table — one row per
 * (observation × dlo) with the tier the enrichment assigned and the parent-
 * facing rationale Haiku wrote.
 */
type DloEvidence = {
  /** null for a parent confirmation (an asserted link with no entry). */
  entryId: string | null;
  title: string;
  dateOccurred: string;
  source: string;
  tier: 'emerging' | 'developing' | 'demonstrating';
  confidence: number | null;
  rationale: string | null;
  provenance?: string | null;
};

const PROVENANCE_LABEL: Record<string, string> = {
  inferred:  'Hearth noticed',
  declared:  'From a module',
  asserted:  'You confirmed',
};

const TIER_BADGE: Record<DloEvidence['tier'], { label: string; cls: string }> = {
  emerging:      { label: 'Emerging',      cls: 'bg-surface-hover text-text-secondary' },
  developing:    { label: 'Developing',    cls: 'bg-ember-glow text-ember' },
  demonstrating: { label: 'Demonstrating', cls: 'bg-sage/10 text-sage' },
};

export function TableMoments({
  snap, dlo,
}: { snap: LearnerSnapshot; dlo: DLO }) {
  const [evidence, setEvidence] = useState<DloEvidence[] | null>(null);
  // Thread-level fallback for legacy entries logged before Phase 2 (which have
  // no observation_dlo_links rows). Once backfill ships this can be deleted.
  const [fallback, setFallback] = useState<EvidenceEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvidence(null);
    setFallback(null);

    // Guarded: a 5xx must not become `[]` via a JSON parse of an error body —
    // that read as "no moments yet" to an established family.
    fetch(`/api/capabilities/${snap.id}/dlo-evidence?dloId=${encodeURIComponent(dlo.id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`dlo-evidence ${r.status}`))))
      .then((data: { evidence?: DloEvidence[] }) => {
        if (cancelled) return;
        setEvidence(Array.isArray(data?.evidence) ? data.evidence : []);
      })
      .catch(() => { if (!cancelled) setEvidence([]); });

    // Fire the fallback in parallel so it's ready instantly if DLO returns empty.
    fetch(`/api/entries?learnerId=${snap.id}&limit=500`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`entries ${r.status}`))))
      .then((data: EvidenceEntry[]) => {
        if (cancelled) return;
        const filtered = (Array.isArray(data) ? data : []).filter((e) =>
          e.aiEnrichment?.capability_threads?.some(
            (ct) => ct.thread_id === dlo.thread && ct.confidence >= 0.5,
          ),
        );
        setFallback(filtered.sort((a, b) => b.dateOccurred.localeCompare(a.dateOccurred)));
      })
      .catch(() => { if (!cancelled) setFallback([]); });

    return () => { cancelled = true; };
  }, [snap.id, dlo.id, dlo.thread]);

  if (evidence === null) {
    return (
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-panel p-lg">
        <p className="font-sans text-sm text-text-muted">Loading moments…</p>
      </div>
    );
  }

  // Prefer DLO-precise evidence; only fall back to thread-level matches when
  // there are zero DLO links yet (pre-backfill, or learner not enriched).
  if (evidence.length > 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-panel">
        <table className="cap-table w-full border-collapse">
          <thead>
            <tr>
              <th className="p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle">Moment</th>
              <th className="p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle">Tier read</th>
              <th className="p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle">Why it counted</th>
              <th className="p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle">Source</th>
              <th className="p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((m, i) => {
              const badge = TIER_BADGE[m.tier] ?? TIER_BADGE.emerging;
              const isAssertion = m.entryId === null;
              return (
                <tr key={m.entryId ?? `assertion-${i}`} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors duration-[var(--motion-quick)]">
                  <td className="p-md align-top">
                    {isAssertion ? (
                      <span className="block font-serif text-[0.95rem] font-medium text-text-primary">{m.title}</span>
                    ) : (
                      <Link
                        href={`/our-story/portfolio#entry-${m.entryId}`}
                        className="block font-serif text-[0.95rem] font-medium text-text-primary hover:text-ember transition-colors duration-[var(--motion-quick)]"
                      >
                        {m.title}
                      </Link>
                    )}
                    <div className="font-sans text-[0.7rem] uppercase tracking-[0.06em] text-text-muted">
                      {m.dateOccurred} · {relTime(m.dateOccurred)}
                    </div>
                  </td>
                  <td className="p-md align-top">
                    <span className={`inline-block rounded-sm px-sm py-[2px] font-sans text-[0.72rem] font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-md align-top font-serif italic text-sm text-text-secondary max-w-[42ch]">
                    {m.rationale ?? <span className="not-italic text-text-muted">—</span>}
                  </td>
                  <td className="p-md align-top">
                    <span className="font-sans text-[0.72rem] text-text-muted">
                      {PROVENANCE_LABEL[m.provenance ?? 'inferred'] ?? 'Hearth noticed'}
                    </span>
                  </td>
                  <td className="p-md align-top font-sans text-sm text-text-muted">
                    {m.confidence != null ? `${Math.round(m.confidence * 100)}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // No DLO-precise evidence. Show the thread-level fallback so the screen
  // isn't empty for families whose entries pre-date Phase 2 enrichment.
  if (fallback === null) {
    return (
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-panel p-lg">
        <p className="font-sans text-sm text-text-muted">Loading moments…</p>
      </div>
    );
  }

  if (fallback.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-panel">
        <div className="bg-surface-raised px-lg py-md font-serif italic text-text-secondary">
          No moments yet for <em>{dlo.descriptor}</em>. Log a moment from the Logger and tag this thread.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-panel">
      <div className="bg-surface-raised px-lg py-sm font-sans text-[0.7rem] uppercase tracking-[0.06em] text-text-muted">
        Showing thread-level matches (this objective has no DLO-level evidence yet)
      </div>
      <table className="cap-table w-full border-collapse">
        <thead>
          <tr>
            <th className="p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle">Moment</th>
            <th className="p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle">Date</th>
            <th className="p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle">Source</th>
            <th className="p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {fallback.map((m) => {
            const isLogger = m.source !== 'module';
            const conf = m.aiEnrichment?.capability_threads?.find((c) => c.thread_id === dlo.thread)?.confidence ?? null;
            return (
              <tr key={m.id} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors duration-[var(--motion-quick)]">
                <td className="p-md align-middle">
                  <Link
                    href={`/our-story/portfolio#entry-${m.id}`}
                    className="block font-serif text-[0.95rem] font-medium text-text-primary hover:text-ember transition-colors duration-[var(--motion-quick)]"
                  >
                    {m.title}
                  </Link>
                  <div className="font-sans text-[0.7rem] uppercase tracking-[0.06em] text-text-muted">{relTime(m.dateOccurred)}</div>
                </td>
                <td className="p-md align-middle font-sans text-sm text-text-secondary">{m.dateOccurred}</td>
                <td className="p-md align-middle">
                  <span className={`inline-block rounded-sm px-sm py-[2px] font-sans text-[0.72rem] font-medium ${isLogger ? 'bg-ember-glow text-ember' : 'bg-surface-hover text-text-secondary'}`}>
                    {isLogger ? 'Logger' : 'Module'}
                  </span>
                </td>
                <td className="p-md align-middle font-sans text-sm text-text-muted">
                  {conf != null ? `${Math.round(conf * 100)}%` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { domainColor };
