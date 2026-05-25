'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ChildSelector } from '@/components/ui/child-selector';
import { getThreadName } from '@/lib/capability-threads';
import { usePedagogy } from '@/hooks/use-pedagogy';
import {
  CalendarBlank, BookOpenText, Medal, Plant,
  MathOperations, Atom, Globe, Palette, Cpu, PersonSimpleRun, ChatsCircle,
  Flame, PencilSimple, Check, Sparkle, Camera, FilePdf,
} from '@/components/icons';
import type { ComponentType as PortfolioComponentType } from 'react';

type PortfolioIconC = PortfolioComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

type CardType = 'evidence' | 'journey' | 'milestone';

const CARD_TYPE_BADGE: Record<CardType, string> = {
  evidence: 'bg-[#C4A882]/15 text-[#C4A882]',
  journey: 'bg-ember/15 text-ember',
  milestone: 'bg-sage/15 text-sage',
};

const CARD_TYPE_LABEL: Record<CardType, string> = {
  evidence: 'Evidence',
  journey: 'Journey',
  milestone: 'Milestone',
};

const CARD_TYPE_TOP: Record<CardType, string> = {
  evidence: 'bg-[#C4A882]',
  journey: 'bg-ember',
  milestone: 'bg-sage',
};

type Learner = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
};

type CapabilityThread = {
  thread_id: string;
  confidence: number;
};

type AiEnrichment = {
  status?: 'pending' | 'enriched' | 'failed';
  capability_threads?: CapabilityThread[];
  curriculum_descriptors?: { code: string; confidence: number }[];
  subjects_detected?: string[];
  confidence?: number;
  milestone_flag?: boolean;
  suggested_thread?: string;
  journey_observation?: {
    text: string;
    trigger: 'cross_domain' | 'independence' | 'metacognition' | 'transfer';
  } | null;
} | null;

type Entry = {
  id: string;
  title: string;
  description: string | null;
  dateOccurred: string;
  subjects: string[] | null;
  learnerIds: string[] | null;
  engagementPerLearner: Record<string, number> | null;
  discoveriesPerLearner: Record<string, string> | null;
  evidenceUrls: string[] | null;
  aiEnrichment: AiEnrichment;
  workSampleCandidate: boolean | null;
  status: string;
  createdAt: string;
  source: string;
  sourceModuleId: string | null;
};

type BadgeAward = {
  id: string;
  badgeTitle: string;
  badgeEmoji: string | null;
  badgeDescription: string | null;
  awardedAt: string;
  retractedAt: string | null;
};

type ActiveThread = {
  thread_id: string;
  observation_count: number;
  suggested_tier: string;
  last_evidence_date: string;
};

const SUBJECT_CONFIG: Record<string, { label: string; Icon: PortfolioIconC; color: string }> = {
  english:      { label: 'English',   Icon: BookOpenText,    color: 'bg-domain-english/20 text-domain-english' },
  mathematics:  { label: 'Maths',     Icon: MathOperations,  color: 'bg-domain-mathematics/20 text-domain-mathematics' },
  science:      { label: 'Science',   Icon: Atom,            color: 'bg-domain-science/20 text-domain-science' },
  hass:         { label: 'HASS',      Icon: Globe,           color: 'bg-domain-hass/20 text-domain-hass' },
  arts:         { label: 'Arts',      Icon: Palette,         color: 'bg-domain-arts/20 text-domain-arts' },
  technologies: { label: 'Tech',      Icon: Cpu,             color: 'bg-domain-technologies/20 text-domain-technologies' },
  hpe:          { label: 'HPE',       Icon: PersonSimpleRun, color: 'bg-domain-hpe/20 text-domain-hpe' },
  languages:    { label: 'Languages', Icon: ChatsCircle,     color: 'bg-domain-languages/20 text-domain-languages' },
};

const ENGAGEMENT_EMOJI: Record<number, string> = { 4: '😊', 3: '🙂', 2: '😐', 1: '😕' };

const DATE_FILTERS = [
  { key: 'month', label: 'This Month' },
  { key: 'last', label: 'Last Month' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Pick Month' },
] as const;

const PAGE_SIZE = 20;

export default function PortfolioPage() {
  const { vocab } = usePedagogy();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  // Pinned at fetch time so the render-path "looksStuck" check stays pure
  // (React Compiler flags Date.now() during render). Refreshed on each load.
  const [entriesFetchedAtMs, setEntriesFetchedAtMs] = useState<number>(0);
  const [badges, setBadges] = useState<BadgeAward[]>([]);
  const [threads, setThreads] = useState<ActiveThread[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'month' | 'last' | 'all' | 'custom'>('all');
  const [customMonth, setCustomMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [openThreads, setOpenThreads] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'thread' | 'chronological'>('thread');
  const [monthlyNarrative, setMonthlyNarrative] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  async function saveEntryEdit(id: string) {
    setSavingEdit(true);
    try {
      await fetch(`/api/entries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, description: editDesc }),
      });
      setEntries((prev) => prev.map((e) => e.id === id ? { ...e, title: editTitle, description: editDesc } : e));
      setEditingId(null);
    } finally {
      setSavingEdit(false);
    }
  }

  // Honest, repeatable enrichment retry — same Haiku service the save path
  // uses (see docs/hearth-logger-post-save-resolution-v1.md §2 Item 3).
  async function retryEnrichment(id: string) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, aiEnrichment: { ...(e.aiEnrichment ?? {}), status: 'pending' } } : e))
    );
    try {
      const res = await fetch(`/api/entries/${id}/enrich`, { method: 'POST' });
      if (!res.ok) throw new Error('retry failed');
      // Server runs the call in after(); poll for the terminal status.
      // Counter-bounded (not Date.now()) so React Compiler treats the loop
      // body as pure. 20 attempts × 1.5s = 30s budget.
      for (let attempt = 0; attempt < 20; attempt++) {
        await new Promise((r) => setTimeout(r, 1500));
        const refreshed = await fetch(`/api/entries/${id}`);
        if (!refreshed.ok) continue;
        const updated = (await refreshed.json()) as Entry;
        const status = updated.aiEnrichment?.status;
        setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
        if (status === 'enriched' || status === 'failed') break;
      }
    } catch {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, aiEnrichment: { ...(e.aiEnrichment ?? {}), status: 'failed' } } : e))
      );
    }
  }

  async function toggleWorkSampleCandidate(id: string) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    const newValue = !entry.workSampleCandidate;
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, workSampleCandidate: newValue } : e));
    await fetch(`/api/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workSampleCandidate: newValue }),
    });
  }

  async function handleRetract(id: string) {
    setBadges((prev) => prev.map((b) => b.id === id ? { ...b, retractedAt: new Date().toISOString() } : b));
    await fetch(`/api/badges/${id}/retract`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  }

  async function handleRestore(id: string) {
    setBadges((prev) => prev.map((b) => b.id === id ? { ...b, retractedAt: null } : b));
    await fetch(`/api/badges/${id}/retract`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restore: true }) });
  }

  useEffect(() => {
    // Guarded fetch: a 5xx from /api/learners (eg. unrun migration) would
    // otherwise throw SyntaxError on r.json() and white-screen the page.
    // See incident 2026-05-25 — migration 0016 left a missing column.
    fetch('/api/learners')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`learners ${r.status}`))))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLearners(data);
          setSelectedLearnerId(data[0].id);
        }
      })
      .catch(() => {
        // Degrade silently to empty learners; loading-end below releases the spinner.
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Reset pagination when learner or filter changes so the new view starts at the first page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(PAGE_SIZE);
  }, [selectedLearnerId, subjectFilter]);

  useEffect(() => {
    if (!selectedLearnerId) return;
    // Each fetch self-guards: a 5xx from any one endpoint must NOT crash the
    // whole page via JSON-parse SyntaxError. Failed fetches degrade to empty data.
    const jsonOr = <T,>(fallback: T) => (r: Response) =>
      r.ok ? (r.json() as Promise<T>) : Promise.resolve(fallback);
    Promise.all([
      fetch(`/api/entries?learnerId=${selectedLearnerId}`).then(jsonOr<unknown[]>([])).catch(() => []),
      fetch(`/api/badges/awards?learnerId=${selectedLearnerId}&includeArchived=true`)
        .then(jsonOr<unknown[]>([])).catch(() => []),
      fetch(`/api/capabilities/${selectedLearnerId}`).then(jsonOr<unknown>([])).catch(() => []),
      fetch('/api/snapshot').then(jsonOr<unknown>({})).catch(() => ({})),
    ]).then(([e, b, t, snap]) => {
      setEntries(Array.isArray(e) ? (e as Entry[]) : []);
      setEntriesFetchedAtMs(Date.now());
      setBadges(Array.isArray(b) ? (b as BadgeAward[]) : []);
      // /api/capabilities/[learnerId] returns { activeThreads, dloStatus };
      // accept the legacy bare-array shape too.
      const tt = t as { activeThreads?: unknown[] } | unknown[];
      const threadList = Array.isArray(tt)
        ? tt
        : Array.isArray((tt as { activeThreads?: unknown[] })?.activeThreads)
          ? (tt as { activeThreads: unknown[] }).activeThreads
          : [];
      setThreads(threadList as ActiveThread[]);
      const childSnap = (snap as { snapshotData?: { children?: Record<string, { monthly_narrative?: string }> } })
        ?.snapshotData?.children?.[selectedLearnerId];
      setMonthlyNarrative(childSnap?.monthly_narrative ?? '');
    });
  }, [selectedLearnerId]);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (subjectFilter) {
      result = result.filter((e) => e.subjects?.includes(subjectFilter));
    }
    if (dateFilter === 'month') {
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      result = result.filter((e) => e.dateOccurred >= start);
    } else if (dateFilter === 'last') {
      const start = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
      const end = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      result = result.filter((e) => e.dateOccurred >= start && e.dateOccurred < end);
    } else if (dateFilter === 'custom' && customMonth) {
      const start = `${customMonth}-01`;
      const [y, m] = customMonth.split('-').map(Number);
      const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
      result = result.filter((e) => e.dateOccurred >= start && e.dateOccurred < nextMonth);
    }
    return result;
  }, [entries, subjectFilter, dateFilter, customMonth]);

  const monthlySummary = useMemo(() => {
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEntries = entries.filter((e) => e.dateOccurred >= monthStart);
    const subjects = new Set(monthEntries.flatMap((e) => e.subjects ?? []));
    const monthThreadIds = new Set<string>();
    monthEntries.forEach((e) => {
      e.aiEnrichment?.capability_threads
        ?.filter((ct) => ct.confidence >= 0.5)
        .forEach((ct) => monthThreadIds.add(ct.thread_id));
    });
    return { count: monthEntries.length, subjects: subjects.size, threads: monthThreadIds.size };
  }, [entries]);

  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => b.observation_count - a.observation_count);
  }, [threads]);

  const getCardType = (entry: Entry): CardType => {
    if (entry.aiEnrichment?.milestone_flag === true) return 'milestone';
    if (entry.aiEnrichment?.journey_observation) return 'journey';
    return 'evidence';
  };

  const groupedAndSortedEntries = useMemo(() => {
    const grouped = new Map<string, Entry[]>();

    filteredEntries.forEach((entry) => {
      const threadName = entry.aiEnrichment?.suggested_thread || 'Uncategorized';
      if (!grouped.has(threadName)) {
        grouped.set(threadName, []);
      }
      grouped.get(threadName)!.push(entry);
    });

    const sorted = Array.from(grouped.entries()).sort((a, b) => b[1].length - a[1].length);
    return sorted;
  }, [filteredEntries]);

  const sortedChronological = useMemo(() => {
    return [...filteredEntries].sort((a, b) => new Date(b.dateOccurred).getTime() - new Date(a.dateOccurred).getTime());
  }, [filteredEntries]);

  const chronologicalEntries = useMemo(() => sortedChronological.slice(0, visibleCount), [sortedChronological, visibleCount]);

  const toggleThread = (thread: string) => {
    setOpenThreads((prev) => {
      const next = new Set(prev);
      if (next.has(thread)) { next.delete(thread); } else { next.add(thread); }
      return next;
    });
  };

  const currentMonthName = format(new Date(), 'MMMM');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4xl">
        <p className="font-sans text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-md py-xl lg:px-lg lg:py-2xl">
      <h1 className="font-serif text-2xl font-semibold text-text-primary mb-md">
        {vocab.sessionNoun === 'session' ? 'Learning Journey' : `${vocab.learnerNoun.charAt(0).toUpperCase() + vocab.learnerNoun.slice(1)}'s Journey`}
      </h1>

      {/* Child selector */}
      <ChildSelector learners={learners} selectedId={selectedLearnerId} onChange={setSelectedLearnerId} />

      {/* Monthly summary */}
      <div className="relative mt-lg overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-card">
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,var(--color-ember),transparent)] opacity-60" />
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-sm">{currentMonthName} Summary</p>
        {monthlySummary.count === 0 ? (
          <p className="font-serif text-sm text-text-muted italic">No {vocab.sessionNoun}s logged yet this month</p>
        ) : (
          <>
            <div className="flex gap-xl mb-md">
              <div>
                <p className="font-sans text-2xl font-semibold text-ember">{monthlySummary.count}</p>
                <p className="font-sans text-xs text-text-muted capitalize">{vocab.sessionNoun}s</p>
              </div>
              <div>
                <p className="font-sans text-2xl font-semibold text-text-primary">{monthlySummary.subjects}</p>
                <p className="font-sans text-xs text-text-muted">Subjects</p>
              </div>
              <div>
                <p className="font-sans text-2xl font-semibold text-text-primary">{monthlySummary.threads}</p>
                <p className="font-sans text-xs text-text-muted">Threads</p>
              </div>
            </div>
            {monthlyNarrative && (
              <p className="font-serif text-sm text-text-secondary leading-relaxed italic">
                {monthlyNarrative}
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-lg lg:flex lg:gap-lg">
        {/* Main feed */}
        <div className="flex-1">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-sm mb-md">
            {/* Date filter */}
            <div className="flex flex-wrap gap-xs">
              {DATE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setDateFilter(f.key); setVisibleCount(PAGE_SIZE); }}
                  className={`rounded-full px-sm py-xs font-sans text-xs transition-all duration-200 min-h-[32px] ${
                    dateFilter === f.key
                      ? 'bg-ember text-text-inverse'
                      : 'border border-border-subtle text-text-secondary hover:border-border-medium'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              {dateFilter === 'custom' && (
                <input
                  type="month"
                  value={customMonth}
                  onChange={(e) => { setCustomMonth(e.target.value); setVisibleCount(PAGE_SIZE); }}
                  className="rounded-full border border-ember bg-ember/10 px-sm py-xs font-sans text-xs text-ember outline-none transition-all duration-200 focus:shadow-focus min-h-[32px]"
                />
              )}
            </div>

            <div className="h-[16px] w-px bg-border-subtle" />

            {/* Subject filter */}
            <div className="flex flex-wrap gap-xs">
              {Object.entries(SUBJECT_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setSubjectFilter(subjectFilter === key ? null : key)}
                  className={`rounded-full px-sm py-xs font-sans text-xs transition-all duration-200 min-h-[28px] ${
                    subjectFilter === key
                      ? `${cfg.color} border border-current`
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <cfg.Icon size={14} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          {/* View mode toggle */}
          <div className="mb-md flex items-center justify-end gap-xs">
            {(['thread', 'chronological'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`rounded-full border px-sm py-[3px] font-sans text-[11px] font-semibold transition-all duration-200 ${
                  viewMode === v
                    ? 'border-ember bg-ember text-text-inverse'
                    : 'border-border-subtle bg-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                {v === 'thread' ? 'By Thread' : 'Timeline'}
              </button>
            ))}
          </div>

          {/* Capability threads — mobile horizontal scroll */}
          {sortedThreads.length > 0 && (
            <div className="lg:hidden flex gap-sm overflow-x-auto pb-sm mb-md scrollbar-none">
              {sortedThreads.map((t) => (
                <div
                  key={t.thread_id}
                  className="shrink-0 rounded-full border border-border-subtle px-sm py-xs font-sans text-xs text-text-secondary"
                >
                  {getThreadName(t.thread_id)} <span className="text-text-muted">({t.observation_count})</span>
                </div>
              ))}
            </div>
          )}

          {/* Entry cards */}
          {/* Early nudge */}
          {entries.length > 0 && entries.length <= 5 && (
            <p className="mb-md font-serif text-sm italic text-text-muted">
              You&rsquo;re building momentum &mdash; {entries.length} {vocab.sessionNoun}{entries.length !== 1 ? 's' : ''} and counting.
            </p>
          )}

          {filteredEntries.length === 0 ? (
            entries.length > 0 ? (
              /* Filtered-empty: data exists but current filters match nothing */
              <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
                <span className="mx-auto mb-md inline-flex text-text-secondary" aria-hidden="true">
                  <CalendarBlank size={32} />
                </span>
                <p className="font-serif text-base font-semibold text-text-primary mb-xs">Nothing logged this period</p>
                <p className="font-serif text-sm text-text-secondary mb-lg leading-relaxed">
                  Try a different month or clear your filters to see all moments.
                </p>
                <button
                  onClick={() => { setSubjectFilter(null); setDateFilter('all'); }}
                  className="inline-flex items-center font-sans text-sm font-semibold bg-ember text-text-inverse rounded-md px-md py-sm min-h-[44px] transition-all duration-200 hover:opacity-90"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              /* True empty: no entries at all */
              <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
                <span className="mx-auto mb-md inline-flex text-text-secondary" aria-hidden="true">
                  <BookOpenText size={32} />
                </span>
                <p className="font-serif text-base font-semibold text-text-primary mb-xs">Your story starts here</p>
                <p className="font-serif text-sm text-text-secondary mb-lg leading-relaxed">
                  Every {vocab.sessionNoun} you log becomes part of your learning story. Once you&apos;ve captured a few, they&apos;ll appear here as a portrait of your {vocab.learnerNoun}&apos;s {vocab.growthNoun}.
                </p>
                <Link
                  href="/log"
                  className="inline-flex items-center font-sans text-sm font-semibold bg-ember text-text-inverse rounded-md px-md py-sm min-h-[44px] transition-all duration-200 hover:opacity-90"
                >
                  Add your first log &rarr;
                </Link>
              </div>
            )
          ) : viewMode === 'thread' ? (
            /* Thread view — grouped by thread in accordions */
            <div className="space-y-md">
              {groupedAndSortedEntries.map(([threadName, threadEntries]) => (
                <div key={threadName} className="border border-border-subtle rounded-[10px] overflow-hidden bg-surface-panel">
                  {/* Accordion header */}
                  <button
                    onClick={() => toggleThread(threadName)}
                    className="flex w-full items-center justify-between px-md py-sm font-serif text-base font-semibold text-text-primary hover:bg-surface-hover transition-colors duration-200"
                  >
                    <span>{threadName}</span>
                    <span className={`font-sans text-[12px] text-text-muted transition-transform duration-200 ${openThreads.has(threadName) ? 'rotate-180' : ''}`}>▾</span>
                  </button>

                  {/* Accordion content */}
                  {openThreads.has(threadName) && (
                    <div className="border-t border-border-subtle px-md py-sm space-y-sm">
                      {threadEntries.map((entry) => {
                        const isExpanded = expandedId === entry.id;
                        const engValue = entry.engagementPerLearner?.[selectedLearnerId];
                        const discovery = entry.discoveriesPerLearner?.[selectedLearnerId];
                        const entryThreads = (entry.aiEnrichment?.capability_threads ?? [])
                          .filter((ct) => ct.confidence >= 0.5);
                        const cardType = getCardType(entry);

                        return (
                          <div
                            key={entry.id}
                            className="relative overflow-hidden rounded-[10px] border border-border-subtle bg-surface-panel shadow-card hover:border-border-medium hover:translate-y-[-2px] hover:shadow-hover transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
                          >
                            {/* Type-specific top line */}
                            <div className={`absolute left-0 right-0 top-0 h-[2px] ${CARD_TYPE_TOP[cardType]}`} />

                            {/* Clickable card header */}
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                              className="w-full text-left p-md hover:bg-surface-hover/50 transition-colors duration-200"
                            >
                              {/* Type badge and expand indicator */}
                              <div className="flex items-start justify-between gap-sm">
                                <div className="flex items-center gap-sm">
                                  <span className={`inline-block rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold ${CARD_TYPE_BADGE[cardType]}`}>
                                    {CARD_TYPE_LABEL[cardType]}
                                  </span>
                                  <span className={`font-sans text-[11px] text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                                </div>
                                {engValue && (
                                  <span className="text-lg shrink-0" title={`Engagement: ${engValue}`}>
                                    {ENGAGEMENT_EMOJI[engValue]}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-start justify-between gap-sm mt-sm">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-sm">
                                    <h3 className="font-serif text-base font-semibold text-text-primary truncate">
                                      {entry.title}
                                    </h3>
                                    {entry.source === 'hearth_session' && (
                                      <span className="inline-flex items-center gap-xs px-2 py-0.5 bg-ember/[0.08] text-ember border border-ember/15 rounded-[6px] font-sans text-[0.65rem] font-medium whitespace-nowrap">
                                        <span className="inline-flex items-center gap-xs"><Flame size={12} aria-hidden="true" /> From community</span>
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-sans text-xs text-text-muted mt-xs">
                                    {format(new Date(entry.dateOccurred), 'd MMM yyyy')}
                                  </p>
                                </div>
                              </div>

                              {/* Subject pills */}
                              {entry.subjects && entry.subjects.length > 0 && (
                                <div className="flex flex-wrap gap-xs mt-sm">
                                  {entry.subjects.map((s) => {
                                    const cfg = SUBJECT_CONFIG[s];
                                    if (!cfg) return null;
                                    return (
                                      <span
                                        key={s}
                                        className={`rounded-full px-sm py-[2px] font-sans text-[10px] font-medium ${cfg.color}`}
                                      >
                                        {cfg.label}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Capability thread tags from AI enrichment */}
                              {entryThreads.length > 0 && (
                                <div className="flex flex-wrap gap-xs mt-sm">
                                  {entryThreads.map((ct) => (
                                    <span
                                      key={ct.thread_id}
                                      className="rounded-full bg-surface-hover px-sm py-[2px] font-sans text-[10px] text-text-muted"
                                    >
                                      {getThreadName(ct.thread_id)}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Discovery */}
                              {discovery && (
                                <p className="font-serif text-sm italic text-text-secondary mt-sm leading-relaxed">
                                  &ldquo;{discovery}&rdquo;
                                </p>
                              )}

                              {/* Evidence thumbnails */}
                              {entry.evidenceUrls && entry.evidenceUrls.length > 0 && (
                                <div className="flex gap-xs mt-sm">
                                  {entry.evidenceUrls.slice(0, 3).map((url, i) => (
                                    <div key={i} className="relative h-[48px] w-[48px] rounded-sm bg-surface-raised overflow-hidden">
                                      <Image src={url} alt="" fill sizes="48px" className="object-cover" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </button>

                            {/* Expanded view */}
                            {isExpanded && (
                              <div className="border-t border-border-subtle px-md py-sm space-y-sm">
                                {/* Editable description */}
                                {editingId === entry.id ? (
                                  <div className="space-y-xs">
                                    <input
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      className="w-full rounded-md border border-border-subtle bg-surface-raised px-sm py-xs font-serif text-sm font-semibold text-text-primary focus:border-ember focus:outline-none"
                                      placeholder="Title"
                                    />
                                    <textarea
                                      value={editDesc}
                                      onChange={(e) => setEditDesc(e.target.value)}
                                      rows={3}
                                      className="w-full rounded-md border border-border-subtle bg-surface-raised px-sm py-xs font-serif text-sm text-text-secondary focus:border-ember focus:outline-none resize-none"
                                      placeholder="Description"
                                    />
                                    <div className="flex gap-xs">
                                      <button
                                        onClick={() => saveEntryEdit(entry.id)}
                                        disabled={savingEdit}
                                        className="font-sans text-xs font-semibold text-ember hover:text-ember-hover transition-colors duration-200 disabled:opacity-50"
                                      >
                                        {savingEdit ? 'Saving…' : 'Save'}
                                      </button>
                                      <button
                                        onClick={() => setEditingId(null)}
                                        className="font-sans text-xs text-text-muted hover:text-text-secondary transition-colors duration-200"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="group relative">
                                    {entry.description && (
                                      <p className="font-serif text-sm leading-relaxed text-text-secondary">{entry.description}</p>
                                    )}
                                    <button
                                      onClick={() => { setEditingId(entry.id); setEditTitle(entry.title); setEditDesc(entry.description ?? ''); }}
                                      className="mt-xs font-sans text-[10px] text-text-muted hover:text-ember transition-colors duration-200"
                                    >
                                      <span className="inline-flex items-center gap-xs"><PencilSimple size={12} aria-hidden="true" /> Edit</span>
                                    </button>
                                  </div>
                                )}
                                {entry.evidenceUrls && entry.evidenceUrls.length > 0 && (
                                  <div>
                                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Evidence</p>
                                    <div className="flex flex-col gap-xs">
                                      {entry.evidenceUrls.map((url, i) => (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="font-sans text-xs text-ember underline truncate block">
                                          {url}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {entry.engagementPerLearner && Object.keys(entry.engagementPerLearner).length > 0 && (
                                  <div>
                                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Engagement</p>
                                    <div className="flex gap-sm">
                                      {Object.entries(entry.engagementPerLearner).map(([learnerId, engLevel]) => {
                                        const learner = learners.find((l) => l.id === learnerId);
                                        return (
                                          <div key={learnerId} className="flex items-center gap-xs">
                                            <span className="text-sm">{ENGAGEMENT_EMOJI[engLevel as keyof typeof ENGAGEMENT_EMOJI]}</span>
                                            <span className="font-sans text-xs text-text-muted">{learner?.name || learnerId}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleWorkSampleCandidate(entry.id); }}
                                  className={`mt-xs font-sans text-[11px] font-semibold transition-colors duration-200 ${
                                    entry.workSampleCandidate
                                      ? 'text-sage hover:text-sage/80'
                                      : 'text-text-muted hover:text-sage'
                                  }`}
                                >
                                  <span className="inline-flex items-center gap-xs">
                                    <Check size={12} aria-hidden="true" />
                                    {entry.workSampleCandidate ? 'Work sample' : 'Mark as work sample'}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Chronological view — flat list sorted by date */
            <div className="space-y-sm">
              {chronologicalEntries.map((entry) => {
                const isExpanded = expandedId === entry.id;
                const engValue = entry.engagementPerLearner?.[selectedLearnerId];
                const discovery = entry.discoveriesPerLearner?.[selectedLearnerId];
                const entryThreads = (entry.aiEnrichment?.capability_threads ?? [])
                  .filter((ct) => ct.confidence >= 0.5);
                const cardType = getCardType(entry);

                return (
                  <div
                    key={entry.id}
                    className="relative overflow-hidden rounded-[10px] border border-border-subtle bg-surface-panel shadow-card hover:border-border-medium hover:translate-y-[-2px] hover:shadow-hover transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
                  >
                    {/* Type-specific top line */}
                    <div className={`absolute left-0 right-0 top-0 h-[2px] ${CARD_TYPE_TOP[cardType]}`} />

                    {/* Clickable card header */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="w-full text-left p-md hover:bg-surface-hover/50 transition-colors duration-200"
                    >
                      {/* Type badge and expand indicator */}
                      <div className="flex items-start justify-between gap-sm">
                        <div className="flex items-center gap-sm">
                          <span className={`inline-block rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold ${CARD_TYPE_BADGE[cardType]}`}>
                            {CARD_TYPE_LABEL[cardType]}
                          </span>
                          <span className={`font-sans text-[11px] text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                        </div>
                        {engValue && (
                          <span className="text-lg shrink-0" title={`Engagement: ${engValue}`}>
                            {ENGAGEMENT_EMOJI[engValue]}
                          </span>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-sm mt-sm">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif text-base font-semibold text-text-primary truncate">
                            {entry.title}
                          </h3>
                          <p className="font-sans text-xs text-text-muted mt-xs">
                            {format(new Date(entry.dateOccurred), 'd MMM yyyy')}
                          </p>
                        </div>
                      </div>

                      {/* Subject pills */}
                      {entry.subjects && entry.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-xs mt-sm">
                          {entry.subjects.map((s) => {
                            const cfg = SUBJECT_CONFIG[s];
                            if (!cfg) return null;
                            return (
                              <span
                                key={s}
                                className={`rounded-full px-sm py-[2px] font-sans text-[10px] font-medium ${cfg.color}`}
                              >
                                {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Capability thread tags from AI enrichment */}
                      {entryThreads.length > 0 && (
                        <div className="flex flex-wrap gap-xs mt-sm">
                          {entryThreads.map((ct) => (
                            <span
                              key={ct.thread_id}
                              className="rounded-full bg-surface-hover px-sm py-[2px] font-sans text-[10px] text-text-muted"
                            >
                              {getThreadName(ct.thread_id)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Discovery */}
                      {discovery && (
                        <p className="font-serif text-sm italic text-text-secondary mt-sm leading-relaxed">
                          &ldquo;{discovery}&rdquo;
                        </p>
                      )}

                      {/* Evidence thumbnails */}
                      {entry.evidenceUrls && entry.evidenceUrls.length > 0 && (
                        <div className="flex gap-xs mt-sm">
                          {entry.evidenceUrls.slice(0, 3).map((url, i) => (
                            <div key={i} className="relative h-[48px] w-[48px] rounded-sm bg-surface-raised overflow-hidden">
                              <Image src={url} alt="" fill sizes="48px" className="object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </button>

                    {/* Expanded view */}
                    {isExpanded && (
                      <div className="border-t border-border-subtle px-md py-sm space-y-sm">
                        {editingId === entry.id ? (
                          <div className="space-y-xs">
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full rounded-md border border-border-subtle bg-surface-raised px-sm py-xs font-serif text-sm font-semibold text-text-primary focus:border-ember focus:outline-none"
                              placeholder="Title"
                            />
                            <textarea
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              rows={3}
                              className="w-full rounded-md border border-border-subtle bg-surface-raised px-sm py-xs font-serif text-sm text-text-secondary focus:border-ember focus:outline-none resize-none"
                              placeholder="Description"
                            />
                            <div className="flex gap-xs">
                              <button onClick={() => saveEntryEdit(entry.id)} disabled={savingEdit} className="font-sans text-xs font-semibold text-ember hover:text-ember-hover transition-colors duration-200 disabled:opacity-50">
                                {savingEdit ? 'Saving…' : 'Save'}
                              </button>
                              <button onClick={() => setEditingId(null)} className="font-sans text-xs text-text-muted hover:text-text-secondary transition-colors duration-200">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {entry.description && (
                              <p className="font-serif text-sm leading-relaxed text-text-secondary">{entry.description}</p>
                            )}
                            {entry.aiEnrichment?.journey_observation && (
                              <div className="mt-sm rounded-md bg-ember/10 border border-ember/20 px-md py-sm">
                                <p className="inline-flex items-center gap-xs font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-ember mb-xs"><Sparkle size={12} aria-hidden="true" /> Journey Observation</p>
                                <p className="font-serif text-sm italic text-text-secondary leading-relaxed">{entry.aiEnrichment.journey_observation.text}</p>
                              </div>
                            )}
                            {(() => {
                              // Honest + recoverable: surface a quiet affordance when
                              // enrichment failed, or when a complete entry older than
                              // ~2 min still has no enrichment (legacy / stuck). Never
                              // a red banner — never alarming.
                              if (entry.status !== 'complete') return null;
                              const status = entry.aiEnrichment?.status;
                              const ageMs = entriesFetchedAtMs - new Date(entry.createdAt).getTime();
                              const looksStuck = !entry.aiEnrichment && ageMs > 2 * 60_000;
                              if (status !== 'failed' && !looksStuck) return null;
                              if (status === 'pending') return null;
                              return (
                                <div className="mt-sm flex items-center justify-between gap-sm rounded-md border border-border-subtle bg-surface-raised px-md py-sm">
                                  <p className="font-sans text-xs text-text-muted">
                                    Insights weren&rsquo;t generated for this moment.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => retryEnrichment(entry.id)}
                                    className="hearth-press inline-flex items-center justify-center rounded-md border border-border-subtle px-sm py-[4px] font-sans text-xs font-semibold text-text-secondary hover:border-border-medium hover:text-text-primary transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]"
                                  >
                                    Generate now
                                  </button>
                                </div>
                              );
                            })()}
                            {entry.aiEnrichment?.status === 'pending' && (
                              <p className="mt-sm font-sans text-xs text-text-muted">
                                Reading this moment&hellip;
                              </p>
                            )}
                            <button
                              onClick={() => { setEditingId(entry.id); setEditTitle(entry.title); setEditDesc(entry.description ?? ''); }}
                              className="mt-xs font-sans text-[10px] text-text-muted hover:text-ember transition-colors duration-200"
                            >
                              <span className="inline-flex items-center gap-xs"><PencilSimple size={12} aria-hidden="true" /> Edit</span>
                            </button>
                          </div>
                        )}
                        {entry.evidenceUrls && entry.evidenceUrls.length > 0 && (
                          <div>
                            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Evidence</p>
                            <div className="flex flex-col gap-xs">
                              {entry.evidenceUrls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="font-sans text-xs text-ember underline truncate block">
                                  {url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {entry.engagementPerLearner && Object.keys(entry.engagementPerLearner).length > 0 && (
                          <div>
                            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Engagement</p>
                            <div className="flex gap-sm">
                              {Object.entries(entry.engagementPerLearner).map(([learnerId, engLevel]) => {
                                const learner = learners.find((l) => l.id === learnerId);
                                return (
                                  <div key={learnerId} className="flex items-center gap-xs">
                                    <span className="text-sm">{ENGAGEMENT_EMOJI[engLevel as keyof typeof ENGAGEMENT_EMOJI]}</span>
                                    <span className="font-sans text-xs text-text-muted">{learner?.name || learnerId}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-md mt-xs">
                          <button className="font-sans text-[11px] font-semibold text-sage hover:text-sage/80 transition-colors duration-200">
                            <span className="inline-flex items-center gap-xs"><Check size={12} aria-hidden="true" /> Mark as work sample</span>
                          </button>
                          {entry.sourceModuleId && (
                            <a
                              href={`/module/${entry.sourceModuleId}`}
                              className="font-sans text-[11px] font-medium text-ember hover:text-ember/80 transition-colors duration-200"
                            >
                              <span className="inline-flex items-center gap-xs"><FilePdf size={12} aria-hidden="true" /> View activity materials</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Load earlier */}
          {visibleCount < sortedChronological.length && (
            <div className="mt-md text-center">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="font-sans text-sm text-text-secondary border border-border-subtle rounded-md px-lg py-sm hover:border-border-medium hover:text-text-primary transition-all duration-200"
              >
                Load earlier ({sortedChronological.length - visibleCount} more)
              </button>
            </div>
          )}

          {/* Badge collection */}
          <div className="mt-xl">
            <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">Badges</h2>
            {badges.filter((b) => !b.retractedAt).length === 0 && badges.filter((b) => b.retractedAt).length === 0 ? (
              <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
                <span className="mx-auto mb-md inline-flex text-text-secondary" aria-hidden="true">
                  <Medal size={32} />
                </span>
                <p className="font-serif text-base font-semibold text-text-primary mb-xs">Milestones will appear here</p>
                <p className="font-serif text-sm text-text-secondary leading-relaxed">
                  Badges and capability milestones are earned through logged learning. Keep going!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`rounded-[16px] border bg-surface-panel p-md shadow-card transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] ${badge.retractedAt ? 'border-border-subtle opacity-50' : 'border-border-subtle hover:border-border-medium hover:translate-y-[-1px]'}`}
                  >
                    <span className={`text-2xl ${badge.retractedAt ? 'grayscale' : ''}`}>{badge.badgeEmoji}</span>
                    <h3 className="font-serif text-sm font-semibold text-text-primary mt-xs">
                      {badge.badgeTitle}
                    </h3>
                    <p className="font-sans text-[10px] text-text-muted mt-xs">
                      {format(new Date(badge.awardedAt), 'd MMM yyyy')}
                    </p>
                    <div className="mt-sm flex items-center gap-sm">
                      {badge.retractedAt ? (
                        <>
                          <span className="font-sans text-xs text-text-muted italic">Archived</span>
                          <button
                            type="button"
                            onClick={() => handleRestore(badge.id)}
                            className="font-sans text-xs text-ember hover:underline transition-colors duration-200"
                          >
                            Restore
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRetract(badge.id)}
                          className="font-sans text-xs text-text-muted hover:text-red-400 transition-colors duration-200"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop sidebar — Capability threads from snapshot */}
        <aside className="hidden lg:block lg:w-[300px] lg:shrink-0">
          <div className="sticky top-xl">
            <h3 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-md">
              Capability Threads
            </h3>
            {sortedThreads.length === 0 ? (
              <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
                <span className="mx-auto mb-md inline-flex text-text-secondary" aria-hidden="true">
                  <Plant size={32} />
                </span>
                <p className="font-serif text-base font-semibold text-text-primary mb-xs">No evidence here yet</p>
                <p className="font-serif text-sm text-text-secondary leading-relaxed">
                  Keep logging — when you capture learning in this area, it&apos;ll show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-sm">
                {sortedThreads.map((t) => (
                  <div
                    key={t.thread_id}
                    className="rounded-[10px] border border-border-subtle bg-surface-panel p-md hover:border-border-medium transition-all duration-200 ease-[var(--ease-default)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-sm font-semibold text-text-primary">
                        {getThreadName(t.thread_id)}
                      </span>
                      <span className="font-sans text-xs text-text-muted">{t.observation_count}</span>
                    </div>
                    <span
                      className={`inline-block mt-xs rounded-full px-sm py-[2px] font-sans text-[10px] font-medium ${
                        t.suggested_tier === 'demonstrating'
                          ? 'bg-sage/15 text-sage'
                          : t.suggested_tier === 'developing'
                            ? 'bg-ember-glow text-ember'
                            : 'bg-surface-hover text-text-muted'
                      }`}
                    >
                      {t.suggested_tier}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
