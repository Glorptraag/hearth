'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ALL_THREADS,
  ORDERED_DOMAINS,
  TIER_GLYPH,
  TIER_LABEL,
  THREADS_BY_ID,
  buildDLOs,
  domainColor,
  threadCurrentTier,
  type LearnerSnapshot,
  type SynthDLO,
  type Tier,
  type ThreadNode,
} from './topology';

type DLO = SynthDLO;

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

  return (
    <tr
      className={`cursor-pointer border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors duration-[var(--motion-quick)] ${isGhostish ? 'ghost' : ''}`}
      onClick={() => onDrillDown(thread)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDrillDown(thread); } }}
    >
      <td className="p-md align-middle">
        <span className="block font-serif text-base font-semibold text-text-primary">{thread.name}</span>
        <span className="mt-[2px] block font-sans text-[0.7rem] tracking-[0.04em] text-text-muted">{thread.id}</span>
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

  return (
    <div>
      {depth >= 2 && <FilterBar filters={filters} onChange={setFilters} />}

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-panel">
        <table className="cap-table w-full border-collapse">
          <thead>
            <tr>
              <th onClick={onHeader('name')} className="cursor-pointer select-none p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle bg-surface-panel sticky top-0 hover:text-text-secondary">Thread{sortArrow('name')}</th>
              {depth === 1 && (
                <th className="col-domain-col cursor-default p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle bg-surface-panel sticky top-0 hidden min-[900px]:table-cell">Domain</th>
              )}
              <th onClick={onHeader('tier')} className="cursor-pointer select-none p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle bg-surface-panel sticky top-0 hover:text-text-secondary">Tier{sortArrow('tier')}</th>
              <th onClick={onHeader('obs')} className="cursor-pointer select-none p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle bg-surface-panel sticky top-0 hover:text-text-secondary">Observations{sortArrow('obs')}</th>
              <th onClick={onHeader('last')} className="col-last cursor-pointer select-none p-md text-left font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted border-b border-border-subtle bg-surface-panel sticky top-0 hover:text-text-secondary hidden min-[900px]:table-cell">Last activity{sortArrow('last')}</th>
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
                      className="cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); onDomainTap?.(domain.key); }}
                      role="button"
                    >
                      <td colSpan={7} className="p-lg pr-md bg-surface-body border-b border-border-subtle">
                        <span className="inline-flex items-center gap-sm font-serif text-[1.05rem] font-semibold text-text-primary">
                          <span className="inline-block h-[10px] w-[10px] rounded-full" style={{ background: domain.color }} />
                          {domain.label}
                        </span>
                        <span className="ml-sm font-sans text-[0.75rem] text-text-muted">
                          {domainThreads.length} threads · {active} active · {ghosts} opening up
                        </span>
                        <span className="float-right font-sans text-[0.75rem] text-ember">
                          Drill into {domain.short.toLowerCase()} →
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
  snap, threadId, onDrillDown,
}: { snap: LearnerSnapshot; threadId: string; onDrillDown: (d: DLO) => void }) {
  const thread = THREADS_BY_ID[threadId];
  const dlos = useMemo(() => buildDLOs(threadId, snap), [threadId, snap]);

  if (!thread) return null;
  const approaching = snap.badges.find((b) => b.thread === threadId && b.status === 'approaching');

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-panel">
      <div className="bg-surface-raised px-lg py-md font-serif italic text-text-secondary">
        <em>{thread.name}</em> · {dlos.length} discrete learning objectives. Each glows when{' '}
        {snap.name} has demonstrated it.
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
            Plan a check-in →
          </Link>
        </div>
      )}
      {dlos.map((dlo) => {
        const tierColor = dlo.tier === 'demonstrating' ? 'var(--color-sage)' : dlo.tier === 'developing' ? 'var(--color-child-amber)' : 'var(--color-text-muted)';
        const statusChip =
          dlo.status === 'confirmed' ? 'bg-sage-muted text-sage-text' :
          dlo.status === 'emerging' ? 'bg-ember-glow text-ember' :
          'text-text-muted bg-surface-hover';
        return (
          <button
            key={dlo.id}
            type="button"
            onClick={() => onDrillDown(dlo)}
            className="grid w-full grid-cols-[48px_1fr_200px_120px] items-center gap-md px-lg py-md text-left border-t border-border-subtle first:border-t-0 hover:bg-surface-hover transition-colors duration-[var(--motion-quick)]"
          >
            <span className="inline-flex justify-center text-[1.6rem] leading-none" style={{ color: tierColor }}>{dlo.glyph}</span>
            <div>
              <div className="font-serif text-base font-medium text-text-primary">{dlo.descriptor}</div>
              <div className="mt-[2px] font-sans text-[0.75rem] text-text-muted">
                {dlo.tierLabel} tier · {dlo.badgeLevel} badge · {dlo.id}
              </div>
            </div>
            <div>
              <span className={`inline-block rounded-sm px-sm py-[4px] font-sans text-[0.75rem] uppercase tracking-[0.05em] ${statusChip}`}>
                {dlo.status === 'confirmed' ? 'Confirmed' : dlo.status === 'emerging' ? 'Emerging' : 'Not yet observed'}
              </span>
            </div>
            <div className="text-right font-sans text-[0.78rem] text-text-muted">→ moments</div>
          </button>
        );
      })}
    </div>
  );
}

/* ----- Depth 4 : moments table ----- */
export function TableMoments({
  snap, dlo,
}: { snap: LearnerSnapshot; dlo: DLO }) {
  const [entries, setEntries] = useState<EvidenceEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Reset stale data when the dependency changes; fresh fetch resolves into the same setter.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(null);
    fetch(`/api/entries?learnerId=${snap.id}&limit=500`)
      .then((r) => r.json())
      .then((data: EvidenceEntry[]) => {
        if (cancelled) return;
        const filtered = (Array.isArray(data) ? data : []).filter((e) =>
          e.aiEnrichment?.capability_threads?.some(
            (ct) => ct.thread_id === dlo.thread && ct.confidence >= 0.5,
          ),
        );
        setEntries(filtered.sort((a, b) => b.dateOccurred.localeCompare(a.dateOccurred)));
      })
      .catch(() => { if (!cancelled) setEntries([]); });
    return () => { cancelled = true; };
  }, [snap.id, dlo.thread]);

  if (entries === null) {
    return (
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-panel p-lg">
        <p className="font-sans text-sm text-text-muted">Loading moments…</p>
      </div>
    );
  }

  if (entries.length === 0) {
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
          {entries.map((m) => {
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
