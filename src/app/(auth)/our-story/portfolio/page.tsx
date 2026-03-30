'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ChildSelector } from '@/components/ui/child-selector';
import { getThreadName } from '@/lib/capability-threads';

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
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [badges, setBadges] = useState<BadgeAward[]>([]);
  const [threads, setThreads] = useState<ActiveThread[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'month' | 'last' | 'all'>('all');
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

  useEffect(() => {
    if (!selectedLearnerId) return;
    Promise.all([
      fetch(`/api/entries?learnerId=${selectedLearnerId}`).then((r) => r.json()),
      fetch(`/api/badges/awards?learnerId=${selectedLearnerId}`).then((r) => r.json()),
      fetch(`/api/capabilities/${selectedLearnerId}`).then((r) => r.json()),
    ]).then(([e, b, t]) => {
      setEntries(Array.isArray(e) ? e : []);
      setBadges(Array.isArray(b) ? b : []);
      setThreads(Array.isArray(t) ? t : []);
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

  const currentMonthName = format(new Date(), 'MMMM');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4xl">
        <p className="font-sans text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-md py-lg">
      <h1 className="font-serif text-2xl font-semibold text-text-primary mb-md">Learning Journey</h1>

      {/* Child selector */}
      <ChildSelector learners={learners} selectedId={selectedLearnerId} onChange={setSelectedLearnerId} />

      {/* Monthly summary */}
      <div className="mt-lg rounded-lg border border-border-subtle bg-surface-raised p-xl shadow-[var(--shadow-soft)]">
        <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">{currentMonthName} Summary</h2>
        {monthlySummary.count === 0 ? (
          <p className="font-serif text-sm text-text-muted italic">No entries yet this month</p>
        ) : (
          <div className="flex gap-xl">
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
                to capture your first moment.
              </p>
            </div>
          ) : (
            <div className="space-y-sm">
              {filteredEntries.map((entry) => {
                const expanded = expandedEntry === entry.id;
                const engValue = entry.engagementPerLearner?.[selectedLearnerId];
                const discovery = entry.discoveriesPerLearner?.[selectedLearnerId];
                const entryThreads = (entry.aiEnrichment?.capability_threads ?? [])
                  .filter((ct) => ct.confidence >= 0.5);
                return (
                  <button
                    key={entry.id}
                    onClick={() => setExpandedEntry(expanded ? null : entry.id)}
                    className="w-full text-left rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-[var(--shadow-soft)] hover:border-border-medium hover:translate-y-[-1px] hover:shadow-[var(--shadow-warm)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                  >
                    <div className="flex items-start justify-between gap-sm">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-base font-semibold text-text-primary truncate">
                          {entry.title}
                        </h3>
                        <p className="font-sans text-xs text-text-muted mt-xs">
                          {format(new Date(entry.dateOccurred), 'd MMM yyyy')}
                        </p>
                      </div>
                      {engValue && (
                        <span className="text-lg shrink-0" title={`Engagement: ${engValue}`}>
                          {ENGAGEMENT_EMOJI[engValue]}
                        </span>
                      )}
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

                    {/* Expanded view */}
                    {expanded && entry.description && (
                      <div className="mt-md pt-md border-t border-border-subtle">
                        <p className="font-serif text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                          {entry.description}
                        </p>
                      </div>
                    )}
                  </button>
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-sm">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="rounded-lg border border-border-subtle bg-surface-panel p-md shadow-[var(--shadow-soft)]"
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
        <aside className="hidden lg:block lg:w-[280px] lg:shrink-0">
          <div className="sticky top-0">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary mb-md">
              Capability Threads
            </h3>
            {sortedThreads.length === 0 ? (
              <p className="font-serif text-sm text-text-muted italic">No observations yet</p>
            ) : (
              <div className="space-y-sm">
                {sortedThreads.map((t) => (
                  <div
                    key={t.thread_id}
                    className="rounded-md border border-border-subtle bg-surface-panel p-sm"
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
