'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ChildSelector } from '@/components/ui/child-selector';
import { getThreadName } from '@/lib/capability-threads';
import { usePedagogy } from '@/hooks/use-pedagogy';

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
  capability_threads?: CapabilityThread[];
  curriculum_descriptors?: { code: string; confidence: number }[];
  subjects_detected?: string[];
  confidence?: number;
  milestone_flag?: boolean;
  suggested_thread?: string;
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
  status: string;
  createdAt: string;
};

type BadgeAward = {
  id: string;
  badgeTitle: string;
  badgeEmoji: string | null;
  badgeDescription: string | null;
  awardedAt: string;
};

type ActiveThread = {
  thread_id: string;
  observation_count: number;
  suggested_tier: string;
  last_evidence_date: string;
};

const SUBJECT_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  english: { label: 'English', emoji: '📚', color: 'bg-domain-english/20 text-domain-english' },
  mathematics: { label: 'Maths', emoji: '🔢', color: 'bg-domain-mathematics/20 text-domain-mathematics' },
  science: { label: 'Science', emoji: '🔬', color: 'bg-domain-science/20 text-domain-science' },
  hass: { label: 'HASS', emoji: '🌏', color: 'bg-domain-hass/20 text-domain-hass' },
  arts: { label: 'Arts', emoji: '🎨', color: 'bg-domain-arts/20 text-domain-arts' },
  technologies: { label: 'Tech', emoji: '⚙️', color: 'bg-domain-technologies/20 text-domain-technologies' },
  hpe: { label: 'HPE', emoji: '🏃', color: 'bg-domain-hpe/20 text-domain-hpe' },
  languages: { label: 'Languages', emoji: '🗣️', color: 'bg-domain-languages/20 text-domain-languages' },
};

const ENGAGEMENT_EMOJI: Record<number, string> = { 4: '😊', 3: '🙂', 2: '😐', 1: '😕' };

const DATE_FILTERS = [
  { key: 'month', label: 'This Month' },
  { key: 'last', label: 'Last Month' },
  { key: 'all', label: 'All Time' },
] as const;

export default function PortfolioPage() {
  const { vocab } = usePedagogy();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [badges, setBadges] = useState<BadgeAward[]>([]);
  const [threads, setThreads] = useState<ActiveThread[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'month' | 'last' | 'all'>('all');
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

  useEffect(() => {
    if (!selectedLearnerId) return;
    Promise.all([
      fetch(`/api/entries?learnerId=${selectedLearnerId}`).then((r) => r.json()),
      fetch(`/api/badges/awards?learnerId=${selectedLearnerId}`).then((r) => r.json()),
      fetch(`/api/capabilities/${selectedLearnerId}`).then((r) => r.json()),
      fetch('/api/snapshot').then((r) => r.json()).catch(() => ({})),
    ]).then(([e, b, t, snap]) => {
      setEntries(Array.isArray(e) ? e : []);
      setBadges(Array.isArray(b) ? b : []);
      setThreads(Array.isArray(t) ? t : []);
      const childSnap = snap?.snapshotData?.children?.[selectedLearnerId];
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
    }
    return result;
  }, [entries, subjectFilter, dateFilter]);

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
    if (entry.evidenceUrls && entry.evidenceUrls.length > 0) return 'evidence';
    if (entry.aiEnrichment?.milestone_flag === true) return 'milestone';
    return 'journey';
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

  const chronologicalEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => new Date(b.dateOccurred).getTime() - new Date(a.dateOccurred).getTime());
  }, [filteredEntries]);

  const toggleThread = (thread: string) => {
    setOpenThreads((prev) => {
      const next = new Set(prev);
      next.has(thread) ? next.delete(thread) : next.add(thread);
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
      <h1 className="font-serif text-2xl font-semibold text-text-primary mb-md">Learning Journey</h1>

      {/* Child selector */}
      <ChildSelector learners={learners} selectedId={selectedLearnerId} onChange={setSelectedLearnerId} />

      {/* Monthly summary */}
      <div className="relative mt-lg overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,var(--color-ember),transparent)] opacity-60" />
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-sm">{currentMonthName} Summary</p>
        {monthlySummary.count === 0 ? (
          <p className="font-serif text-sm text-text-muted italic">No entries yet this month</p>
        ) : (
          <>
            <div className="flex gap-xl mb-md">
              <div>
                <p className="font-sans text-2xl font-semibold text-ember">{monthlySummary.count}</p>
                <p className="font-sans text-xs text-text-muted">Entries</p>
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
            <div className="flex gap-xs">
              {DATE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setDateFilter(f.key)}
                  className={`rounded-full px-sm py-xs font-sans text-xs transition-all duration-200 min-h-[32px] ${
                    dateFilter === f.key
                      ? 'bg-ember text-text-inverse'
                      : 'border border-border-subtle text-text-secondary hover:border-border-medium'
                  }`}
                >
                  {f.label}
                </button>
              ))}
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
                  {cfg.emoji}
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
          {filteredEntries.length === 0 ? (
            <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
              <span className="text-2xl block mb-sm">📖</span>
              <p className="font-serif text-sm text-text-secondary">
                No entries yet. Head to the{' '}
                <Link href="/log" className="font-semibold text-ember hover:text-ember-hover transition-colors">
                  Logger
                </Link>{' '}
                to capture your first {vocab.sessionNoun}.
              </p>
            </div>
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
                            className="relative overflow-hidden rounded-[10px] border border-border-subtle bg-surface-panel shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:border-border-medium hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(217,123,58,0.08)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
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
                                    <div key={i} className="h-[48px] w-[48px] rounded-sm bg-surface-raised overflow-hidden">
                                      <img src={url} alt="" className="h-full w-full object-cover" />
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
                                      ✏️ Edit
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
                                <button className="mt-xs font-sans text-[11px] font-semibold text-sage hover:text-sage/80 transition-colors duration-200">
                                  ✓ Mark as HEU work sample
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
                    className="relative overflow-hidden rounded-[10px] border border-border-subtle bg-surface-panel shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:border-border-medium hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(217,123,58,0.08)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
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
                            <div key={i} className="h-[48px] w-[48px] rounded-sm bg-surface-raised overflow-hidden">
                              <img src={url} alt="" className="h-full w-full object-cover" />
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
                            <button
                              onClick={() => { setEditingId(entry.id); setEditTitle(entry.title); setEditDesc(entry.description ?? ''); }}
                              className="mt-xs font-sans text-[10px] text-text-muted hover:text-ember transition-colors duration-200"
                            >
                              ✏️ Edit
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
                        <button className="mt-xs font-sans text-[11px] font-semibold text-sage hover:text-sage/80 transition-colors duration-200">
                          ✓ Mark as HEU work sample
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Badge collection */}
          <div className="mt-xl">
            <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">Badges</h2>
            {badges.length === 0 ? (
              <div className="rounded-lg border border-border-subtle bg-surface-panel p-lg text-center">
                <p className="font-serif text-sm text-text-muted italic">
                  No badges earned yet — keep exploring!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sm">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="rounded-[16px] border border-border-subtle bg-surface-panel p-md shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:border-border-medium hover:translate-y-[-1px] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                  >
                    <span className="text-2xl">{badge.badgeEmoji}</span>
                    <h3 className="font-serif text-sm font-semibold text-text-primary mt-xs">
                      {badge.badgeTitle}
                    </h3>
                    <p className="font-sans text-[10px] text-text-muted mt-xs">
                      {format(new Date(badge.awardedAt), 'd MMM yyyy')}
                    </p>
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
              <p className="font-serif text-sm text-text-muted italic">No observations yet</p>
            ) : (
              <div className="space-y-sm">
                {sortedThreads.map((t) => (
                  <div
                    key={t.thread_id}
                    className="rounded-[10px] border border-border-subtle bg-surface-panel p-md hover:border-border-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
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
