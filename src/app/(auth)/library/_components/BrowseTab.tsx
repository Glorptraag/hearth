'use client';

/**
 * Library Browse tab — expansive catalog of every module in the family's
 * owned packs + standalone library modules. Subject / age / modality /
 * sessionType filters. Sort by newest, alphabetical, or "relevance" (via
 * /api/snapshot/next which scores with pedagogyContext).
 *
 * Task 4.6 — replaces the function of /explore/activities (which Phase 5.1
 * will delete + redirect here).
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Play, CalendarBlank, MagnifyingGlass, Compass, Books, Sparkle } from '@/components/icons';
import type { LibraryModuleItem } from '@/app/api/library/modules/route';
import type { NextResponseBody as SnapshotNextResponse } from '@/app/api/snapshot/next/route';
import { track, hashForAnalytics } from '@/lib/analytics/posthog';

const SUBJECT_LABELS: Record<string, string> = {
  english: 'English',
  mathematics: 'Maths',
  science: 'Science',
  hass: 'HASS',
  arts: 'Arts',
  technologies: 'Tech',
  hpe: 'HPE',
  languages: 'Languages',
};

const SUBJECT_CHIP: Record<string, string> = {
  english: 'bg-domain-english/15 text-domain-english',
  mathematics: 'bg-domain-mathematics/15 text-domain-mathematics',
  science: 'bg-domain-science/15 text-domain-science',
  hass: 'bg-domain-hass/15 text-domain-hass',
  arts: 'bg-domain-arts/15 text-domain-arts',
  technologies: 'bg-domain-technologies/15 text-domain-technologies',
  hpe: 'bg-domain-hpe/15 text-domain-hpe',
  languages: 'bg-domain-languages/15 text-domain-languages',
};

const MODALITIES = [
  { value: 'kinesthetic', label: 'Kinesthetic' },
  { value: 'visual', label: 'Visual' },
  { value: 'auditory', label: 'Auditory' },
  { value: 'narrative', label: 'Narrative' },
  { value: 'social', label: 'Social' },
  { value: 'exploratory', label: 'Exploratory' },
] as const;

const AGE_BANDS = [
  { label: 'Under 6', min: 0, max: 5 },
  { label: '6–8', min: 6, max: 8 },
  { label: '9–11', min: 9, max: 11 },
  { label: '12+', min: 12, max: 99 },
] as const;

type SortMode = 'relevance' | 'newest' | 'alphabetical';

export function BrowseTab() {
  const [modules, setModules] = useState<LibraryModuleItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState('');
  const [subjects, setSubjects] = useState<Set<string>>(new Set());
  const [modalities, setModalities] = useState<Set<string>>(new Set());
  const [ageBandIdx, setAgeBandIdx] = useState<number | null>(null);
  const [sessionType, setSessionType] = useState<'sustained' | 'open_ended' | null>(null);
  const [sort, setSort] = useState<SortMode>('relevance');

  // Pedagogy-aware ranking (relevance sort). Carries rank + primary_reason for analytics.
  interface RelevanceEntry { rank: number; reason: string }
  const [relevanceOrder, setRelevanceOrder] = useState<Map<string, RelevanceEntry> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/library/modules');
        if (!res.ok) throw new Error('Failed to load library modules');
        const data = (await res.json()) as LibraryModuleItem[];
        if (!cancelled) setModules(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load modules');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Lazy-load relevance ordering when the user picks the Relevance sort.
  useEffect(() => {
    if (sort !== 'relevance' || relevanceOrder !== null) return;
    let cancelled = false;
    fetch('/api/snapshot/next?limit=50')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SnapshotNextResponse | null) => {
        if (cancelled || !data) return;
        const map = new Map<string, RelevanceEntry>();
        data.recommendations.forEach((r, i) =>
          map.set(r.module_id, { rank: i, reason: r.primary_reason }),
        );
        setRelevanceOrder(map);
      })
      .catch(() => {
        if (!cancelled) setRelevanceOrder(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, [sort, relevanceOrder]);

  const filtered = useMemo(() => {
    if (!modules) return [];
    const q = query.trim().toLowerCase();
    return modules.filter((m) => {
      if (q && !m.title.toLowerCase().includes(q) && !(m.targetUnderstanding ?? '').toLowerCase().includes(q)) {
        return false;
      }
      if (subjects.size > 0 && !m.subjects.some((s) => subjects.has(s))) return false;
      if (modalities.size > 0 && !m.modalities.some((mo) => modalities.has(mo))) return false;
      if (ageBandIdx != null) {
        const band = AGE_BANDS[ageBandIdx];
        if (m.ageRange) {
          // Overlap test: module's [min,max] overlaps band's [min,max].
          if (m.ageRange.max < band.min || m.ageRange.min > band.max) return false;
        }
      }
      if (sessionType && m.sessionType !== sessionType) return false;
      return true;
    });
  }, [modules, query, subjects, modalities, ageBandIdx, sessionType]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === 'alphabetical') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'newest') {
      // No createdAt on LibraryModuleItem yet — fall back to insertion order
      // (Sanity GROQ returns in document order by default). Alphabetical-style
      // tiebreak keeps the list stable.
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'relevance' && relevanceOrder) {
      // Modules in the snapshot/next response come first in scored order;
      // remainder fall back to alphabetical.
      list.sort((a, b) => {
        const ra = relevanceOrder.has(a.id) ? relevanceOrder.get(a.id)!.rank : Infinity;
        const rb = relevanceOrder.has(b.id) ? relevanceOrder.get(b.id)!.rank : Infinity;
        if (ra !== rb) return ra - rb;
        return a.title.localeCompare(b.title);
      });
    }
    return list;
  }, [filtered, sort, relevanceOrder]);

  const toggleSet = (current: Set<string>, value: string) => {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="font-sans text-sm text-text-muted hearth-pulse">Loading library…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="font-sans text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="mb-md inline-flex text-text-secondary" aria-hidden="true">
          <Books size={32} />
        </span>
        <h3 className="font-serif text-lg font-semibold text-text-primary mb-sm">
          Nothing in your library yet
        </h3>
        <p className="font-sans text-sm text-text-secondary mb-lg max-w-sm">
          Add packs from the Marketplace or build your own module to see the catalog here.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-sm">
          <Link
            href="/explore/marketplace"
            className="bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember/90 transition duration-[var(--motion-quick)]"
          >
            Explore Marketplace
          </Link>
          <Link
            href="/build/modules"
            className="border border-border-subtle text-text-secondary font-sans font-semibold rounded-md px-md py-sm text-sm hover:border-border-medium hover:text-text-primary transition duration-[var(--motion-quick)]"
          >
            Build your own
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-sm">
        <div className="flex-1 relative">
          <span className="absolute left-sm top-1/2 -translate-y-1/2 text-text-muted" aria-hidden>
            <MagnifyingGlass size={16} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules…"
            className="w-full bg-surface-panel border border-border-subtle rounded-md pl-9 pr-sm py-sm font-serif text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ember"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => {
            const next = e.target.value as SortMode;
            setSort(next);
            track('browse_sort_changed', { sort_mode: next });
          }}
          className="bg-surface-panel border border-border-subtle rounded-md px-sm py-sm font-sans text-sm text-text-secondary focus:outline-none focus:border-ember"
        >
          <option value="relevance">Sort: Relevance</option>
          <option value="alphabetical">Sort: A–Z</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>

      {/* Filters */}
      <div className="space-y-sm">
        <FilterRow label="Subjects">
          {Object.entries(SUBJECT_LABELS).map(([value, label]) => (
            <FilterChip
              key={value}
              active={subjects.has(value)}
              onClick={() => setSubjects(toggleSet(subjects, value))}
              className={subjects.has(value) ? SUBJECT_CHIP[value] : undefined}
            >
              {label}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="Modality">
          {MODALITIES.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={modalities.has(value)}
              onClick={() => setModalities(toggleSet(modalities, value))}
            >
              {label}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="Age">
          {AGE_BANDS.map((band, idx) => (
            <FilterChip
              key={band.label}
              active={ageBandIdx === idx}
              onClick={() => setAgeBandIdx(ageBandIdx === idx ? null : idx)}
            >
              {band.label}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="Format">
          <FilterChip
            active={sessionType === 'sustained'}
            onClick={() => setSessionType(sessionType === 'sustained' ? null : 'sustained')}
          >
            Sustained session
          </FilterChip>
          <FilterChip
            active={sessionType === 'open_ended'}
            onClick={() => setSessionType(sessionType === 'open_ended' ? null : 'open_ended')}
          >
            Open-ended
          </FilterChip>
        </FilterRow>
      </div>

      {/* Result count */}
      <p className="font-sans text-xs text-text-muted">
        {sorted.length} of {modules.length} module{modules.length === 1 ? '' : 's'}
      </p>

      {/* Result grid */}
      {sorted.length === 0 ? (
        <div className="py-12 text-center">
          <span className="mb-sm inline-flex text-text-muted" aria-hidden>
            <Compass size={24} />
          </span>
          <p className="font-sans text-sm text-text-muted">
            No modules match these filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          {sorted.map((m) => (
            <BrowseModuleCard
              key={m.id}
              module={m}
              relevanceEntry={sort === 'relevance' ? relevanceOrder?.get(m.id) ?? null : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-xs">
      <span className="font-sans text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <div className="flex flex-wrap gap-xs">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center font-sans text-xs px-sm py-xs rounded-full border transition duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
        active
          ? (className ?? 'bg-ember/15 text-ember border-ember/30')
          : 'border-border-subtle bg-transparent text-text-secondary hover:border-border-medium'
      }`}
    >
      {children}
    </button>
  );
}

function BrowseModuleCard({
  module: m,
  relevanceEntry,
}: {
  module: LibraryModuleItem;
  relevanceEntry: { rank: number; reason: string } | null;
}) {
  const addToToday = async () => {
    const today = new Date().toISOString().slice(0, 10);
    await fetch('/api/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: today,
        moduleId: m.id,
        title: m.title,
        subjects: m.subjects,
      }),
    }).catch(() => {
      // Silent failure for now — surface improvements in a future cycle.
    });
    if (relevanceEntry) {
      const hash = await hashForAnalytics(m.id);
      track('recommendation_accepted', {
        surface: 'library_browse',
        action: 'planned',
        reason: relevanceEntry.reason,
        module_id_hash: hash,
        rank: relevanceEntry.rank,
      });
    }
  };

  return (
    <div className="group relative bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card hover:border-border-medium hover:shadow-hover hover:-translate-y-[2px] transition duration-[var(--motion-gentle)] ease-[var(--ease-default)]">
      <div className="flex items-start justify-between gap-sm mb-xs">
        <h3 className="font-serif text-[1rem] font-semibold text-text-primary">
          {m.title}
        </h3>
        {m.isOwnBuilt && (
          <span className="inline-flex items-center gap-xs font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sage/15 text-sage border border-sage/30 shrink-0">
            <Sparkle size={10} aria-hidden="true" /> Yours
          </span>
        )}
      </div>
      {m.targetUnderstanding && (
        <p className="font-serif text-sm text-text-secondary line-clamp-2 mb-sm">
          {m.targetUnderstanding}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-xs mb-md">
        {m.subjects.slice(0, 3).map((s) => (
          <span
            key={s}
            className={`font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${SUBJECT_CHIP[s] ?? 'bg-surface-raised text-text-muted'}`}
          >
            {SUBJECT_LABELS[s] ?? s}
          </span>
        ))}
        {m.duration && (
          <span className="font-sans text-[0.7rem] text-text-muted">
            {m.duration.min}–{m.duration.max} min
          </span>
        )}
        {m.ageRange && (
          <span className="font-sans text-[0.7rem] text-text-muted">
            ages {m.ageRange.min}–{m.ageRange.max}
          </span>
        )}
        {m.sessionType === 'open_ended' && (
          <span className="font-sans text-[0.65rem] text-text-muted bg-surface-raised border border-border-subtle rounded-full px-1.5 py-0.5">
            Open-ended
          </span>
        )}
        {m.owningPack && (
          <span className="font-sans text-[0.65rem] text-text-muted bg-surface-raised border border-border-subtle rounded-full px-1.5 py-0.5 truncate max-w-[14ch]">
            {m.owningPack.title}
          </span>
        )}
      </div>
      <div className="flex gap-xs">
        <Link
          href={`/module/${m.id}`}
          onClick={() => {
            if (relevanceEntry) {
              void hashForAnalytics(m.id).then((hash) => {
                track('recommendation_accepted', {
                  surface: 'library_browse',
                  action: 'started',
                  reason: relevanceEntry.reason,
                  module_id_hash: hash,
                  rank: relevanceEntry.rank,
                });
              });
            }
          }}
          className="flex-1 inline-flex items-center justify-center gap-xs bg-ember text-text-inverse font-sans text-sm font-semibold rounded-md px-md py-sm hover:bg-ember/90 transition duration-[var(--motion-quick)] ease-[var(--ease-default)]"
        >
          <Play size={14} aria-hidden="true" /> Start Now
        </Link>
        <button
          onClick={addToToday}
          className="inline-flex items-center justify-center gap-xs border border-border-subtle text-text-secondary font-sans text-sm font-semibold rounded-md px-md py-sm hover:border-ember hover:text-text-primary transition duration-[var(--motion-quick)] ease-[var(--ease-default)]"
        >
          <CalendarBlank size={14} aria-hidden="true" /> Today
        </button>
      </div>
    </div>
  );
}
