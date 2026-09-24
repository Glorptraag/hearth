'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { evidenceSrc, entryPhotoEvidence, entryEvidence, type DisplayEvidence } from '@/lib/evidence';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ChildSelector } from '@/components/ui/child-selector';
import WorkSamplePill from '@/components/ui/WorkSamplePill';
import { getThreadName } from '@/lib/capability-threads';
import { groupEntriesByTopThread, topThreadId, THREAD_DISPLAY_CONFIDENCE_FLOOR } from '@/lib/portfolio/thread-grouping';
import { isSuppressedThread } from '@/lib/capability-alpha-suppression';
import { track } from '@/lib/analytics/posthog';
import { usePedagogy } from '@/hooks/use-pedagogy';
import {
  CalendarBlank, BookOpenText, Medal, Plant,
  MathOperations, Atom, Globe, Palette, Cpu, PersonSimpleRun, ChatsCircle,
  Flame, PencilSimple, Check, Sparkle, FilePdf,
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
  // Written at snapshot-rebuild time for entries that crossed a tier/badge
  // boundary; drives the sage "Milestone" card (see getCardType).
  milestone_flag?: boolean;
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
  // Caption-carrying evidence rows (read side of the evidenceUrls dual-write).
  // Prefer these via entryPhotoEvidence(); evidenceUrls is the legacy fallback.
  evidence?: { kind: string; content: string; caption: string | null }[] | null;
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

/**
 * The expanded card's "Evidence" section — renders every kind the parent
 * captured. Photos and (http) links are action affordances (sans, ember
 * anchors); quotes and notes are content the parent reads (serif). A link is
 * only clickable when it is an http(s) URL; a name-only "link" (or a bare label)
 * renders as plain text. Images are never rendered here — the collapsed card's
 * thumbnail grid is the only place photos are shown as `<Image>`. Audio
 * captures render as a native `<audio controls>` player (waveform/transcript
 * are a documented follow-on).
 */
function ExpandedEvidence({ items }: { items: DisplayEvidence[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Evidence</p>
      <div className="flex flex-col gap-sm">
        {items.map((item, i) => {
          if (item.kind === 'photo') {
            return (
              <a key={i} href={evidenceSrc(item.content)} target="_blank" rel="noopener noreferrer" className="font-sans text-xs text-ember underline truncate block">
                {item.caption ?? 'Photo'}
              </a>
            );
          }
          if (item.kind === 'link') {
            const label = item.caption || item.content;
            return /^https?:\/\//i.test(item.content) ? (
              <a key={i} href={item.content} target="_blank" rel="noopener noreferrer" className="font-sans text-xs text-ember underline truncate block">
                {label}
              </a>
            ) : (
              <p key={i} className="font-sans text-xs text-text-secondary truncate">{label}</p>
            );
          }
          if (item.kind === 'audio') {
            return (
              <div key={i} className="flex flex-col gap-xs">
                {item.caption && (
                  <span className="font-sans text-xs text-text-muted truncate">{item.caption}</span>
                )}
                <audio controls preload="none" src={evidenceSrc(item.content)} className="w-full max-w-[320px]">
                  <a href={evidenceSrc(item.content)} target="_blank" rel="noopener noreferrer" className="font-sans text-xs text-ember underline">
                    Play audio
                  </a>
                </audio>
              </div>
            );
          }
          if (item.kind === 'quote') {
            return (
              <p key={i} className="font-serif text-sm italic text-text-secondary leading-relaxed">
                &ldquo;{item.content}&rdquo;
              </p>
            );
          }
          // note (and any future text-bearing kind)
          return (
            <p key={i} className="font-serif text-sm text-text-secondary leading-relaxed">
              {item.content}
            </p>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The expanded-card body, shared by both Portfolio views (By Thread and
 * Timeline). Extracting it guarantees the two views expose the SAME actions —
 * the journey-observation callout, the honest "Generate now" recovery, the
 * "reading…" pending line, and a *functional* work-sample toggle. Previously the
 * Timeline button was a dead <span> and the Thread view lacked recovery/journey,
 * so the views silently diverged depending on which one the parent landed on.
 */
export function ExpandedCardBody({
  entry,
  learners,
  entriesFetchedAtMs,
  editing,
  onEdit,
  onCancelEdit,
  onSaved,
  onRetryEnrichment,
  onToggleWorkSample,
}: {
  entry: Entry;
  learners: Learner[];
  entriesFetchedAtMs: number;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: (updated: Entry) => void;
  onRetryEnrichment: () => void;
  onToggleWorkSample: () => void;
}) {
  return (
    <div className="border-t border-border-subtle px-md py-sm space-y-sm">
      {editing ? (
        <EntryEditForm
          entry={entry}
          learners={learners}
          onCancel={onCancelEdit}
          onSaved={onSaved}
        />
      ) : (
        <div>
          {entry.description && (
            <p className="font-serif text-sm leading-relaxed text-text-secondary">{entry.description}</p>
          )}
          {entry.aiEnrichment?.journey_observation && (
            <div className="mt-sm rounded-md bg-ember/10 border border-ember/20 px-md py-sm">
              <p className="inline-flex items-center gap-xs font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-ember mb-xs"><Sparkle size={12} aria-hidden="true" /> Growth observation</p>
              <p className="font-serif text-sm italic text-text-secondary leading-relaxed">{entry.aiEnrichment.journey_observation.text}</p>
              {/* cr-ai-content-framing — WORDING PENDING DREW SIGN-OFF, DO NOT SHIP AS-IS. See docs/batch-d/cr-ai-content-framing.md */}
              <p className="mt-xs font-sans text-[10px] text-text-muted leading-relaxed">An AI starting point, drawn from your entry.</p>
            </div>
          )}
          {(() => {
            // Honest + recoverable: surface a quiet affordance when enrichment
            // failed, or when a complete entry older than ~2 min still has no
            // enrichment (legacy / stuck). Never a red banner — never alarming.
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
                  onClick={onRetryEnrichment}
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
            onClick={onEdit}
            className="mt-xs font-sans text-[10px] text-text-muted hover:text-ember transition-colors duration-[var(--motion-quick)]"
          >
            <span className="inline-flex items-center gap-xs"><PencilSimple size={12} aria-hidden="true" /> Edit</span>
          </button>
        </div>
      )}
      <ExpandedEvidence items={entryEvidence(entry)} />
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
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWorkSample(); }}
          className={`font-sans text-[11px] font-semibold transition-colors duration-[var(--motion-quick)] ${
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
        {entry.sourceModuleId && (
          <a
            href={`/module/${entry.sourceModuleId}`}
            className="font-sans text-[11px] font-medium text-ember hover:text-ember/80 transition-colors duration-[var(--motion-quick)]"
          >
            <span className="inline-flex items-center gap-xs"><FilePdf size={12} aria-hidden="true" /> View activity materials</span>
          </a>
        )}
      </div>
    </div>
  );
}

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
  const [threadFilter, setThreadFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'month' | 'last' | 'all' | 'custom'>('all');
  const [customMonth, setCustomMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [openThreads, setOpenThreads] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'thread' | 'chronological'>('thread');
  const [monthlyNarrative, setMonthlyNarrative] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // EntryEditForm owns its own field state and the PATCH; the page only needs
  // to fold the saved result back into the list and close the editor.
  function applyEntryEdit(updated: Entry) {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setEditingId(null);
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
  }, [selectedLearnerId, subjectFilter, threadFilter]);

  // A thread filter is keyed by thread_id, which is meaningless once the learner
  // changes (the new child has different active threads) — clear it on switch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThreadFilter(null);
  }, [selectedLearnerId]);

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
    if (threadFilter) {
      // Match the "By Thread" grouping: an entry belongs to its single top
      // thread (highest-confidence at/above the floor), so filter on that.
      result = result.filter((e) => topThreadId(e.aiEnrichment?.capability_threads) === threadFilter);
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
  }, [entries, subjectFilter, threadFilter, dateFilter, customMonth]);

  const monthlySummary = useMemo(() => {
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEntries = entries.filter((e) => e.dateOccurred >= monthStart);
    const subjects = new Set(monthEntries.flatMap((e) => e.subjects ?? []));
    const monthThreadIds = new Set<string>();
    monthEntries.forEach((e) => {
      e.aiEnrichment?.capability_threads
        ?.filter((ct) => !isSuppressedThread(ct.thread_id))
        .filter((ct) => ct.confidence >= THREAD_DISPLAY_CONFIDENCE_FLOOR)
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

  // Group each entry under its highest-confidence capability thread (>= the
  // display floor), mapped to a thread name. The old `suggested_thread` field
  // was never written by enrichment, so every entry fell into "Uncategorized".
  const groupedAndSortedEntries = useMemo(
    () => groupEntriesByTopThread(filteredEntries),
    [filteredEntries]
  );

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
      <div className="mb-md flex flex-wrap items-start justify-between gap-md">
        <h1 className="font-serif text-2xl font-semibold text-text-primary">
          {vocab.sessionNoun === 'session' ? 'Learning Story' : `${vocab.learnerNoun.charAt(0).toUpperCase() + vocab.learnerNoun.slice(1)}'s Story`}
        </h1>
        {selectedLearnerId && entries.length > 0 && (
          <a
            href={`/api/portfolio/export?learnerId=${encodeURIComponent(selectedLearnerId)}`}
            onClick={() => track('portfolio_exported', { entries: entries.length, threads: sortedThreads.length })}
            className="inline-flex shrink-0 items-center gap-xs rounded-md border border-border-subtle px-md py-sm font-sans text-sm font-semibold text-text-secondary transition-colors duration-[var(--motion-quick)] hover:border-border-medium hover:text-text-primary"
          >
            <FilePdf size={16} aria-hidden /> Download PDF
          </a>
        )}
      </div>

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
                  className={`rounded-full px-sm py-xs font-sans text-xs transition-all duration-[var(--motion-quick)] min-h-[32px] ${
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
                  className="rounded-full border border-ember bg-ember/10 px-sm py-xs font-sans text-xs text-ember outline-none transition-all duration-[var(--motion-quick)] focus:shadow-focus min-h-[32px]"
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
                  className={`rounded-full px-sm py-xs font-sans text-xs transition-all duration-[var(--motion-quick)] min-h-[28px] ${
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
                className={`rounded-full border px-sm py-[3px] font-sans text-[11px] font-semibold transition-all duration-[var(--motion-quick)] ${
                  viewMode === v
                    ? 'border-ember bg-ember text-text-inverse'
                    : 'border-border-subtle bg-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                {v === 'thread' ? 'By Thread' : 'Timeline'}
              </button>
            ))}
          </div>

          {/* Capability threads — mobile horizontal scroll. Tapping a thread
              filters the feed to that thread (the desktop sidebar mirrors this). */}
          {sortedThreads.length > 0 && (
            <div className="lg:hidden flex gap-sm overflow-x-auto overscroll-x-contain pb-sm mb-md scrollbar-none" role="group" aria-label="Filter by capability thread">
              {sortedThreads.map((t) => {
                const active = threadFilter === t.thread_id;
                return (
                  <button
                    key={t.thread_id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setThreadFilter(active ? null : t.thread_id)}
                    className={`shrink-0 rounded-full border px-sm py-xs font-sans text-xs transition-colors duration-[var(--motion-quick)] ${
                      active
                        ? 'border-border-active bg-ember-glow text-ember'
                        : 'border-border-subtle text-text-secondary hover:border-border-medium'
                    }`}
                  >
                    {getThreadName(t.thread_id)} <span className={active ? 'text-ember' : 'text-text-muted'}>({t.observation_count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active thread-filter banner — shows the lens is engaged + how to clear it. */}
          {threadFilter && (
            <div className="mb-md flex items-center justify-between gap-sm rounded-[10px] border border-border-active bg-ember-glow px-md py-sm">
              <span className="font-sans text-xs text-ember">
                Showing only <strong className="font-semibold">{getThreadName(threadFilter)}</strong>
              </span>
              <button
                type="button"
                onClick={() => setThreadFilter(null)}
                className="font-sans text-xs font-semibold text-ember underline-offset-2 hover:underline"
              >
                Clear
              </button>
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
                  onClick={() => { setSubjectFilter(null); setThreadFilter(null); setDateFilter('all'); }}
                  className="inline-flex items-center font-sans text-sm font-semibold bg-ember text-text-inverse rounded-md px-md py-sm min-h-[44px] transition-all duration-[var(--motion-quick)] hover:opacity-90"
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
                  className="inline-flex items-center font-sans text-sm font-semibold bg-ember text-text-inverse rounded-md px-md py-sm min-h-[44px] transition-all duration-[var(--motion-quick)] hover:opacity-90"
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
                    className="flex w-full items-center justify-between px-md py-sm font-serif text-base font-semibold text-text-primary hover:bg-surface-hover transition-colors duration-[var(--motion-quick)]"
                  >
                    <span>{threadName}</span>
                    <span className={`font-sans text-[12px] text-text-muted transition-transform duration-[var(--motion-quick)] ${openThreads.has(threadName) ? 'rotate-180' : ''}`}>▾</span>
                  </button>

                  {/* Accordion content */}
                  {openThreads.has(threadName) && (
                    <div className="border-t border-border-subtle px-md py-sm space-y-sm">
                      {threadEntries.map((entry) => {
                        const isExpanded = expandedId === entry.id;
                        const engValue = entry.engagementPerLearner?.[selectedLearnerId];
                        const discovery = entry.discoveriesPerLearner?.[selectedLearnerId];
                        const entryThreads = (entry.aiEnrichment?.capability_threads ?? [])
                          .filter((ct) => ct.confidence >= THREAD_DISPLAY_CONFIDENCE_FLOOR);
                        const cardType = getCardType(entry);
                        const photos = entryPhotoEvidence(entry);

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
                              className="w-full text-left p-md hover:bg-surface-hover/50 transition-colors duration-[var(--motion-quick)]"
                            >
                              {/* Type badge and expand indicator */}
                              <div className="flex items-start justify-between gap-sm">
                                <div className="flex items-center gap-sm">
                                  <span className={`inline-block rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold ${CARD_TYPE_BADGE[cardType]}`}>
                                    {CARD_TYPE_LABEL[cardType]}
                                  </span>
                                  <span className={`font-sans text-[11px] text-text-muted transition-transform duration-[var(--motion-quick)] ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
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

                              {entry.workSampleCandidate && (
                                <div className="mt-sm">
                                  <WorkSamplePill size="sm" />
                                </div>
                              )}

                              {/* Discovery */}
                              {discovery && (
                                <p className="font-serif text-sm italic text-text-secondary mt-sm leading-relaxed">
                                  &ldquo;{discovery}&rdquo;
                                </p>
                              )}

                              {/* Evidence thumbnails — caption doubles as alt text */}
                              {photos.length > 0 && (
                                <div className="flex gap-xs mt-sm">
                                  {photos.slice(0, 3).map((p, i) => (
                                    <div key={i} className="relative h-[48px] w-[48px] rounded-sm bg-surface-raised overflow-hidden">
                                      <Image src={evidenceSrc(p.ref)} alt={p.caption ?? ''} title={p.caption ?? undefined} fill sizes="48px" className="object-cover" unoptimized />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </button>

                            {/* Expanded view */}
                            {isExpanded && (
                              <ExpandedCardBody
                                entry={entry}
                                learners={learners}
                                entriesFetchedAtMs={entriesFetchedAtMs}
                                editing={editingId === entry.id}
                                onEdit={() => setEditingId(entry.id)}
                                onCancelEdit={() => setEditingId(null)}
                                onSaved={applyEntryEdit}
                                onRetryEnrichment={() => retryEnrichment(entry.id)}
                                onToggleWorkSample={() => toggleWorkSampleCandidate(entry.id)}
                              />
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
                  .filter((ct) => !isSuppressedThread(ct.thread_id))
                  .filter((ct) => ct.confidence >= THREAD_DISPLAY_CONFIDENCE_FLOOR);
                const cardType = getCardType(entry);
                const photos = entryPhotoEvidence(entry);

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
                      className="w-full text-left p-md hover:bg-surface-hover/50 transition-colors duration-[var(--motion-quick)]"
                    >
                      {/* Type badge and expand indicator */}
                      <div className="flex items-start justify-between gap-sm">
                        <div className="flex items-center gap-sm">
                          <span className={`inline-block rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold ${CARD_TYPE_BADGE[cardType]}`}>
                            {CARD_TYPE_LABEL[cardType]}
                          </span>
                          <span className={`font-sans text-[11px] text-text-muted transition-transform duration-[var(--motion-quick)] ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
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

                      {entry.workSampleCandidate && (
                        <div className="mt-sm">
                          <WorkSamplePill size="sm" />
                        </div>
                      )}

                      {/* Discovery */}
                      {discovery && (
                        <p className="font-serif text-sm italic text-text-secondary mt-sm leading-relaxed">
                          &ldquo;{discovery}&rdquo;
                        </p>
                      )}

                      {/* Evidence thumbnails — caption doubles as alt text */}
                      {photos.length > 0 && (
                        <div className="flex gap-xs mt-sm">
                          {photos.slice(0, 3).map((p, i) => (
                            <div key={i} className="relative h-[48px] w-[48px] rounded-sm bg-surface-raised overflow-hidden">
                              <Image src={evidenceSrc(p.ref)} alt={p.caption ?? ''} title={p.caption ?? undefined} fill sizes="48px" className="object-cover" unoptimized />
                            </div>
                          ))}
                        </div>
                      )}
                    </button>

                    {/* Expanded view */}
                    {isExpanded && (
                      <ExpandedCardBody
                        entry={entry}
                        learners={learners}
                        entriesFetchedAtMs={entriesFetchedAtMs}
                        editing={editingId === entry.id}
                        onEdit={() => setEditingId(entry.id)}
                        onCancelEdit={() => setEditingId(null)}
                        onSaved={applyEntryEdit}
                        onRetryEnrichment={() => retryEnrichment(entry.id)}
                        onToggleWorkSample={() => toggleWorkSampleCandidate(entry.id)}
                      />
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
                className="font-sans text-sm text-text-secondary border border-border-subtle rounded-md px-lg py-sm hover:border-border-medium hover:text-text-primary transition-all duration-[var(--motion-quick)]"
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
                  Badges and capability milestones are earned through logged learning.
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
                            className="font-sans text-xs text-ember hover:underline transition-colors duration-[var(--motion-quick)]"
                          >
                            Restore
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRetract(badge.id)}
                          className="font-sans text-xs text-text-muted hover:text-red-400 transition-colors duration-[var(--motion-quick)]"
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
                {sortedThreads.map((t) => {
                  const active = threadFilter === t.thread_id;
                  return (
                    <button
                      key={t.thread_id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setThreadFilter(active ? null : t.thread_id)}
                      className={`block w-full rounded-[10px] border bg-surface-panel p-md text-left transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
                        active ? 'border-border-active' : 'border-border-subtle hover:border-border-medium'
                      }`}
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
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

const ENGAGEMENT_LEVELS = [4, 3, 2, 1] as const;

/**
 * Inline editor for a saved portfolio entry. Beyond the original title +
 * description, it exposes the high-value retrospective fields the backend PATCH
 * already accepts — when (date), subjects, and per-learner engagement — so a
 * mis-tagged moment can be corrected without re-logging it (BUG-04). Owns its
 * own field state; mounts fresh per entry and hands the merged result back via
 * onSaved (optimistic merge, mirroring the prior save path, so we don't depend
 * on the raw DB row shape matching the portfolio's Entry view-model).
 */
function EntryEditForm({
  entry,
  learners,
  onCancel,
  onSaved,
}: {
  entry: Entry;
  learners: Learner[];
  onCancel: () => void;
  onSaved: (updated: Entry) => void;
}) {
  const [title, setTitle] = useState(entry.title);
  const [description, setDescription] = useState(entry.description ?? '');
  const [dateOccurred, setDateOccurred] = useState((entry.dateOccurred ?? '').slice(0, 10));
  const [subjects, setSubjects] = useState<string[]>(entry.subjects ?? []);
  const [engagement, setEngagement] = useState<Record<string, number>>(entry.engagementPerLearner ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  // Learners this entry involves — prefer the stored learnerIds, fall back to
  // whoever already has an engagement score recorded.
  const entryLearnerIds =
    entry.learnerIds && entry.learnerIds.length > 0
      ? entry.learnerIds
      : Object.keys(entry.engagementPerLearner ?? {});

  const toggleSubject = (key: string) =>
    setSubjects((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));

  async function save() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return; // title is required server-side (z.string().min(1))
    setSaving(true);
    setError(false);
    try {
      // Omit an empty date — the column is non-null and '' is not a valid date.
      const body: Record<string, unknown> = {
        title: trimmedTitle,
        description,
        subjects,
        engagementPerLearner: engagement,
      };
      if (dateOccurred) body.dateOccurred = dateOccurred;
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      onSaved({
        ...entry,
        title: trimmedTitle,
        description,
        subjects,
        engagementPerLearner: engagement,
        ...(dateOccurred ? { dateOccurred } : {}),
      });
    } catch {
      // Network failure — keep the editor open and surface a retry hint rather
      // than letting the entry silently look saved.
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-md">
      <div className="space-y-xs">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border-subtle bg-surface-raised px-sm py-xs font-serif text-sm font-semibold text-text-primary focus:border-ember focus:outline-none"
          placeholder="Title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border-subtle bg-surface-raised px-sm py-xs font-serif text-sm text-text-secondary focus:border-ember focus:outline-none resize-none"
          placeholder="Description"
        />
      </div>

      {/* When */}
      <div>
        <p className="mb-xs font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">When</p>
        <input
          type="date"
          value={dateOccurred}
          onChange={(e) => setDateOccurred(e.target.value)}
          className="rounded-md border border-border-subtle bg-surface-raised px-sm py-xs font-sans text-xs text-text-primary focus:border-ember focus:outline-none"
        />
      </div>

      {/* Subjects */}
      <div>
        <p className="mb-xs font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">Subjects</p>
        <div className="flex flex-wrap gap-xs">
          {Object.entries(SUBJECT_CONFIG).map(([key, cfg]) => {
            const sel = subjects.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSubject(key)}
                aria-pressed={sel}
                className={`inline-flex min-h-[32px] items-center gap-xs rounded-full px-sm py-[3px] font-sans text-[10px] font-medium transition-all duration-[var(--motion-quick)] ${
                  sel ? `${cfg.color} border border-current` : 'border border-border-subtle text-text-muted hover:border-border-medium'
                }`}
              >
                <cfg.Icon size={12} aria-hidden="true" /> {cfg.label}
              </button>
            );
          })}
        </div>
        {entryLearnerIds.length > 1 && (
          <p className="mt-xs font-sans text-[11px] italic text-text-muted">
            This moment is logged for {entryLearnerIds.length} children — changing its subjects or
            who it&rsquo;s for re-reads it for all of them.
          </p>
        )}
      </div>

      {/* Engagement per learner */}
      {entryLearnerIds.length > 0 && (
        <div>
          <p className="mb-xs font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">Engagement</p>
          <div className="space-y-xs">
            {entryLearnerIds.map((lid) => {
              const learner = learners.find((l) => l.id === lid);
              return (
                <div key={lid} className="flex items-center gap-sm">
                  <span className="w-[84px] shrink-0 truncate font-sans text-xs text-text-secondary">
                    {learner?.name ?? 'Learner'}
                  </span>
                  <div className="flex gap-xs">
                    {ENGAGEMENT_LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEngagement((prev) => ({ ...prev, [lid]: level }))}
                        aria-label={`Engagement level ${level} for ${learner?.name ?? 'learner'}`}
                        aria-pressed={engagement[lid] === level}
                        className={`flex h-8 w-8 items-center justify-center rounded-md border text-base transition-all duration-[var(--motion-quick)] ${
                          engagement[lid] === level
                            ? 'border-ember bg-ember-glow'
                            : 'border-border-subtle opacity-60 hover:border-border-medium hover:opacity-100'
                        }`}
                      >
                        {ENGAGEMENT_EMOJI[level]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-sm pt-xs">
        <button
          onClick={save}
          disabled={saving || !title.trim()}
          className="font-sans text-xs font-semibold text-ember hover:text-ember-hover transition-colors duration-[var(--motion-quick)] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="font-sans text-xs text-text-muted hover:text-text-secondary transition-colors duration-[var(--motion-quick)]"
        >
          Cancel
        </button>
        {error && (
          <span role="status" className="font-sans text-xs text-red-400">
            Couldn&rsquo;t save — please try again.
          </span>
        )}
      </div>
    </div>
  );
}
