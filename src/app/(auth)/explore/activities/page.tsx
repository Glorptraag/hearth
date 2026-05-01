'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sanityClient } from '@/lib/sanity/client';
import { ALL_MODULES_QUERY, ALL_PROJECTS_QUERY, DISCOVERY_OWN_MODULES_QUERY } from '@/lib/sanity/queries';
import EmptyState from '@/components/ui/EmptyState';
import { usePedagogy } from '@/hooks/use-pedagogy';
import { useFocusTrap } from '@/hooks/use-focus-trap';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Approach {
  _id: string;
  title: string;
  modality?: string;
  activityCount?: number;
}
interface Module {
  _id: string;
  title: string;
  targetUnderstanding?: string;
  subjects?: string[];
  ageRange?: { min: number; max: number };
  duration?: { min: number; max: number };
  approaches?: Approach[];
  packId?: string;
  isOwnBuilt?: boolean;
}
interface Pack {
  _id: string;
  title: string;
  description?: string;
  subjects?: string[];
  modules: Module[];
}

interface ProjectSummary {
  _id: string;
  title: string;
  description?: string;
  subjects?: string[];
  ageRange?: { min: number; max: number };
  duration?: string;
  stageCount: number;
  badges?: { _id: string; title: string; emoji?: string }[];
}

const SUBJECTS = [
  { label: 'English', value: 'english', color: 'text-[#6B8E9B] bg-[#6B8E9B]/10 border-[#6B8E9B]/20' },
  { label: 'Maths', value: 'mathematics', color: 'text-[#9B7B6B] bg-[#9B7B6B]/10 border-[#9B7B6B]/20' },
  { label: 'Science', value: 'science', color: 'text-[#7B9B6B] bg-[#7B9B6B]/10 border-[#7B9B6B]/20' },
  { label: 'HASS', value: 'hass', color: 'text-[#9B8B6B] bg-[#9B8B6B]/10 border-[#9B8B6B]/20' },
  { label: 'Arts', value: 'arts', color: 'text-[#8B6B9B] bg-[#8B6B9B]/10 border-[#8B6B9B]/20' },
  { label: 'Tech', value: 'technologies', color: 'text-[#6B7B9B] bg-[#6B7B9B]/10 border-[#6B7B9B]/20' },
  { label: 'HPE', value: 'hpe', color: 'text-[#9B6B7B] bg-[#9B6B7B]/10 border-[#9B6B7B]/20' },
  { label: 'Languages', value: 'languages', color: 'text-[#6B9B8B] bg-[#6B9B8B]/10 border-[#6B9B8B]/20' },
] as const;

const SUBJECT_COLOR_MAP = Object.fromEntries(SUBJECTS.map((s) => [s.value, s.color]));

const SUBJECT_GRADIENT: Record<string, string> = {
  english:      'from-[rgba(107,142,155,0.12)] to-transparent',
  mathematics:  'from-[rgba(155,123,107,0.12)] to-transparent',
  science:      'from-[rgba(107,142,107,0.12)] to-transparent',
  hass:         'from-[rgba(155,138,107,0.12)] to-transparent',
  arts:         'from-[rgba(155,107,138,0.12)] to-transparent',
  technologies: 'from-[rgba(107,130,155,0.12)] to-transparent',
  hpe:          'from-[rgba(107,155,130,0.12)] to-transparent',
  languages:    'from-[rgba(138,107,155,0.12)] to-transparent',
};


const MODALITY_EMOJI: Record<string, string> = {
  kinesthetic: '🤲',
  visual: '👁',
  auditory: '👂',
  narrative: '📖',
  social: '🤝',
  exploratory: '🔍',
};

// ─── Module Card ──────────────────────────────────────────────────────────────

function ModuleCard({ module, onPreview, isInLibrary, onAddToLibrary }: { module: Module; onPreview: (m: Module) => void; isInLibrary: boolean; onAddToLibrary: (moduleId: string) => void }) {
  const primarySubject = module.subjects?.[0] ?? '';

  return (
    <div
      className="group relative text-left bg-surface-panel rounded-[16px] p-lg border border-border-subtle shadow-card overflow-hidden hover:translate-y-[-2px] hover:border-border-medium hover:shadow-hover transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] w-full flex flex-col h-full relative"
    >
      <div className={`absolute inset-0 rounded-[inherit] bg-gradient-to-b ${SUBJECT_GRADIENT[primarySubject] ?? 'from-transparent to-transparent'} pointer-events-none`} />

      <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,var(--color-ember),transparent)] opacity-0 transition-opacity duration-[var(--motion-gentle)] group-hover:opacity-100" />

      <div className="relative z-10">
        <button
          onClick={() => onPreview(module)}
          className="text-left flex-1 w-full"
        >
          <h3 className="font-serif text-base font-semibold text-text-primary mb-sm leading-snug">
            {module.title}
          </h3>

          {/* Subjects */}
          {module.subjects && module.subjects.length > 0 && (
            <div className="flex flex-wrap gap-xs mb-sm">
              {module.subjects.map((s) => {
                const colorClass = SUBJECT_COLOR_MAP[s] ?? 'text-text-muted bg-surface-raised border-border-subtle';
                return (
                  <span
                    key={s}
                    className={`font-sans text-xs rounded-full px-sm py-xs border ${colorClass}`}
                  >
                    {s}
                  </span>
                );
              })}
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-md flex-wrap mt-auto mb-md">
            {module.ageRange && (
              <span className="font-sans text-xs text-text-muted">
                👶 {module.ageRange.min}–{module.ageRange.max} yrs
              </span>
            )}
            {module.duration && (
              <span className="font-sans text-xs text-text-muted">
                ⏱ {module.duration.min}–{module.duration.max} min
              </span>
            )}
            {module.approaches && (
              <span className="font-sans text-xs text-text-muted">
                {module.approaches.length} approach{module.approaches.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </button>

        {/* Creator row */}
        <div className="mt-sm flex items-center gap-xs">
          {module.isOwnBuilt ? (
            <>
              <div className="h-5 w-5 rounded-full bg-sage/15 border border-sage/30 flex items-center justify-center shrink-0">
                <span className="font-sans text-[9px] text-sage">✦</span>
              </div>
              <span className="font-sans text-[11px] text-text-muted truncate">You</span>
              <span className="ml-auto rounded-full bg-sage/15 border border-sage/30 px-xs py-[1px] font-sans text-[9px] font-semibold text-sage">✨ Created by you</span>
            </>
          ) : (
            <>
              <div className="h-5 w-5 rounded-full bg-surface-hover border border-border-subtle flex items-center justify-center shrink-0">
                <span className="font-sans text-[9px] text-text-muted">H</span>
              </div>
              <span className="font-sans text-[11px] text-text-muted truncate">Hearth</span>
              <span className="ml-auto rounded-full bg-sage/15 px-xs py-[1px] font-sans text-[9px] font-semibold text-sage">✓ Verified</span>
            </>
          )}
        </div>
      </div>

      {/* Action button */}
      <div className="relative z-10 mt-md">
        {isInLibrary ? (
          <button disabled className="rounded-md border border-sage/30 bg-sage/15 px-sm py-[4px] font-sans text-[11px] font-semibold text-sage cursor-not-allowed w-full">
            In Library
          </button>
        ) : (
          <button onClick={() => onAddToLibrary(module._id)} className="rounded-md bg-ember px-sm py-[4px] font-sans text-[11px] font-semibold text-text-inverse transition-all duration-200 hover:bg-ember-hover w-full">
            Add to Library
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({
  module,
  onClose,
  onStartNow,
  onAddToPlanner,
}: {
  module: Module;
  onClose: () => void;
  onStartNow: (id: string) => void;
  onAddToPlanner: (module: Module) => void;
}) {
  const trapRef = useFocusTrap(true);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-modal px-0 sm:px-md"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
        className="bg-surface-panel w-full sm:max-w-[680px] rounded-t-[16px] sm:rounded-[24px] border border-border-subtle shadow-float p-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border-medium rounded-full mx-auto mb-lg sm:hidden" />

        <h2 id="preview-modal-title" className="font-serif text-xl font-semibold text-text-primary mb-sm leading-snug">
          {module.title}
        </h2>
        {module.targetUnderstanding && (
          <p className="font-serif text-sm italic text-text-secondary mb-lg leading-relaxed">
            {module.targetUnderstanding}
          </p>
        )}

        {/* Subjects */}
        {module.subjects && module.subjects.length > 0 && (
          <div className="flex flex-wrap gap-xs mb-lg">
            {module.subjects.map((s) => {
              const colorClass = SUBJECT_COLOR_MAP[s] ?? 'text-text-muted bg-surface-raised border-border-subtle';
              return (
                <span key={s} className={`font-sans text-xs rounded-full px-sm py-xs border ${colorClass}`}>
                  {s}
                </span>
              );
            })}
          </div>
        )}

        {/* Approaches */}
        {module.approaches && module.approaches.length > 0 && (
          <div className="mb-lg">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-sm">
              Approaches
            </p>
            <div className="space-y-xs">
              {module.approaches.map((app) => (
                <div
                  key={app._id}
                  className="flex items-center justify-between bg-surface-raised rounded-md px-md py-sm border border-border-subtle"
                >
                  <span className="font-serif text-sm text-text-primary">{app.title}</span>
                  <div className="flex items-center gap-sm">
                    {app.modality && (
                      <span className="font-sans text-xs text-text-muted">
                        {MODALITY_EMOJI[app.modality] ?? ''} {app.modality}
                      </span>
                    )}
                    {app.activityCount !== undefined && (
                      <span className="font-sans text-xs text-text-muted">
                        {app.activityCount} acts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="flex gap-md flex-wrap mb-xl">
          {module.ageRange && (
            <span className="font-sans text-xs text-text-muted">
              👶 Ages {module.ageRange.min}–{module.ageRange.max}
            </span>
          )}
          {module.duration && (
            <span className="font-sans text-xs text-text-muted">
              ⏱ {module.duration.min}–{module.duration.max} min total
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-sm">
          <button
            onClick={() => onStartNow(module._id)}
            className="flex-1 bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition-all duration-200"
          >
            Start Now →
          </button>
          <button
            onClick={() => onAddToPlanner(module)}
            className="flex-1 bg-transparent border border-border-medium text-text-secondary font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-surface-hover transition-all duration-200"
          >
            + Planner
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExploreActivitiesPage() {
  const router = useRouter();
  const { pedagogy, vocab } = usePedagogy();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [packIds, setPackIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [libraryOnly, setLibraryOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'packs'>('packs');
  const [previewModule, setPreviewModule] = useState<Module | null>(null);
  const [, setPlannerSaving] = useState(false);
  const [plannerSuccess, setPlannerSuccess] = useState<string | null>(null);
  const [relevanceScores, setRelevanceScores] = useState<Map<string, { score: number; reason: string }>>(new Map());

  const loadModules = useCallback(async () => {
    try {
      const [libraryRes, familyRes, rawPacks, rawProjects] = await Promise.all([
        fetch('/api/library'),
        fetch('/api/family'),
        sanityClient.fetch<{ _id: string; title: string; description?: string; subjects?: string[]; modules: Module[] | null }[]>(ALL_MODULES_QUERY),
        sanityClient.fetch<ProjectSummary[]>(ALL_PROJECTS_QUERY),
      ]);

      let libraryPackIds: string[] = [];
      if (libraryRes.ok) {
        const library: Array<{ id: string; kind: 'pack' | 'module' }> = await libraryRes.json();
        libraryPackIds = library.filter((r) => r.kind === 'pack').map((r) => r.id);
        setPackIds(libraryPackIds);
      }

      setProjects(Array.isArray(rawProjects) ? rawProjects : []);

      const enrichedPacks: Pack[] = rawPacks.map((p) => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        subjects: p.subjects,
        modules: (p.modules ?? []).map((m) => ({ ...m, packId: p._id })),
      }));
      setPacks(enrichedPacks);

      let ownModules: Module[] = [];
      if (familyRes.ok) {
        const family = await familyRes.json();
        if (family?.id) {
          const raw = await sanityClient
            .fetch<Module[]>(DISCOVERY_OWN_MODULES_QUERY, { familyId: family.id })
            .catch(() => [] as Module[]);
          ownModules = (raw ?? []).map((m) => ({ ...m, isOwnBuilt: true }));
        }
      }

      const packNestedModules = enrichedPacks.flatMap((p) => p.modules);
      const seen = new Set<string>();
      const allModules: Module[] = [];
      for (const m of [...ownModules, ...packNestedModules]) {
        if (seen.has(m._id)) continue;
        seen.add(m._id);
        allModules.push(m);
      }
      setModules(allModules);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadModules(); }, [loadModules]);

  // Fetch snapshot recommendations for "Most relevant" sort
  useEffect(() => {
    fetch('/api/snapshot')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const recs = data?.snapshotData?.recommendations?.suggested_next;
        if (Array.isArray(recs)) {
          const map = new Map<string, { score: number; reason: string }>();
          for (const rec of recs) {
            if (rec.module_id) {
              map.set(rec.module_id, { score: rec.priority_score ?? 0, reason: rec.reason_text ?? '' });
            }
          }
          setRelevanceScores(map);
        }
      })
      .catch(() => {});
  }, []);

  const inLibrary = useCallback(
    (m: Module) => m.isOwnBuilt === true || packIds.includes(m.packId ?? ''),
    [packIds],
  );

  const filtered = useMemo(() => {
    let result = modules;

    if (libraryOnly) {
      result = result.filter(inLibrary);
    }

    if (subjectFilter !== 'all') {
      result = result.filter((m) => m.subjects?.includes(subjectFilter));
    }

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'newest') {
      result = [...result].reverse();
    } else if (sortBy === 'relevant') {
      result = [...result].sort((a, b) => {
        const sa = relevanceScores.get(a._id)?.score ?? -1;
        const sb = relevanceScores.get(b._id)?.score ?? -1;
        if (sb !== sa) return sb - sa;
        const aLib = inLibrary(a) ? 1 : 0;
        const bLib = inLibrary(b) ? 1 : 0;
        if (bLib !== aLib) return bLib - aLib;
        return a.title.localeCompare(b.title);
      });
    }

    return result;
  }, [modules, libraryOnly, subjectFilter, sortBy, relevanceScores, inLibrary]);

  const filteredPacks = useMemo(() => {
    return packs
      .map((pack) => {
        let mods = pack.modules;
        if (libraryOnly) mods = mods.filter((m) => packIds.includes(m.packId ?? ''));
        if (subjectFilter !== 'all') mods = mods.filter((m) => m.subjects?.includes(subjectFilter));
        if (sortBy === 'name') mods = [...mods].sort((a, b) => a.title.localeCompare(b.title));
        else if (sortBy === 'relevant') {
          mods = [...mods].sort((a, b) => {
            const sa = relevanceScores.get(a._id)?.score ?? -1;
            const sb = relevanceScores.get(b._id)?.score ?? -1;
            return sb - sa || a.title.localeCompare(b.title);
          });
        }
        return { ...pack, modules: mods };
      })
      .filter((p) => p.modules.length > 0);
  }, [packs, packIds, libraryOnly, subjectFilter, sortBy, relevanceScores]);

  const handleAddToPlanner = async (module: Module) => {
    setPlannerSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, title: module.title, moduleId: module._id }),
      });
      setPlannerSuccess(module.title);
      setPreviewModule(null);
      setTimeout(() => setPlannerSuccess(null), 3000);
    } finally {
      setPlannerSaving(false);
    }
  };

  const handleAddToLibrary = async (moduleId: string) => {
    const mod = modules.find((m) => m._id === moduleId);
    if (!mod || mod.isOwnBuilt || !mod.packId) return;

    try {
      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sanityPackId: mod.packId }),
      });
      const libraryRes = await fetch('/api/library');
      if (libraryRes.ok) {
        const library: Array<{ id: string; kind: 'pack' | 'module' }> = await libraryRes.json();
        setPackIds(library.filter((r) => r.kind === 'pack').map((r) => r.id));
      }
    } catch (err) {
      console.error('Failed to add to library', err);
    }
  };

  return (
    <div className="min-h-screen bg-surface-body">
      {/* Header */}
      <div className="max-w-[1280px] mx-auto px-md lg:px-lg pt-xl pb-lg">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ember mb-xs">
          Explore
        </p>
        <h1 className="font-serif text-2xl font-semibold text-text-primary">
          {pedagogy !== 'eclectic' ? `Find Your Next ${vocab.sessionNoun.charAt(0).toUpperCase() + vocab.sessionNoun.slice(1)}` : 'Explore Modules'}
        </h1>
      </div>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 bg-surface-body/95 border-b border-border-subtle px-md lg:px-lg py-md max-w-[1280px] mx-auto">
        <div className="flex flex-col gap-md">
          {/* My Library toggle */}
          <button
            onClick={() => setLibraryOnly((v) => !v)}
            className={`shrink-0 rounded-full border px-md py-[5px] font-sans text-[12px] font-semibold transition-all duration-200 w-fit ${
              libraryOnly
                ? 'border-sage bg-sage/15 text-sage'
                : 'border-border-subtle bg-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {libraryOnly ? '✓ My Library' : 'My Library'}
          </button>

          {/* Subject filter pills */}
          <div className="flex gap-xs overflow-x-auto pb-xs">
            <button
              onClick={() => setSubjectFilter('all')}
              className={`font-sans text-xs shrink-0 rounded-full px-sm py-[3px] border transition-all duration-200 ${
                subjectFilter === 'all'
                  ? 'bg-ember text-text-inverse border-ember'
                  : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium'
              }`}
            >
              All
            </button>
            {SUBJECTS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setSubjectFilter(value)}
                className={`font-sans text-xs shrink-0 rounded-full px-sm py-[3px] border transition-all duration-200 ${
                  subjectFilter === value
                    ? 'bg-ember text-text-inverse border-ember'
                    : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort + view toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-xs">
              {(['packs', 'grid'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`rounded-md px-sm py-[4px] font-sans text-xs font-semibold transition-all duration-200 ${
                    viewMode === v
                      ? 'bg-ember text-text-inverse'
                      : 'bg-surface-raised border border-border-subtle text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {v === 'packs' ? 'By Pack' : 'All Modules'}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-raised border border-border-subtle rounded-md px-md py-[8px] font-sans text-sm text-text-primary outline-none focus:border-ember transition-colors duration-200"
            >
              <option value="name">Name (A–Z)</option>
              <option value="newest">Newest first</option>
              <option value="relevant">Most relevant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-md lg:px-lg py-lg pb-32">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-surface-panel rounded-[16px] p-lg border border-border-subtle h-40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-3xl">
            {modules.length === 0 ? (
              <EmptyState
                emoji="📚"
                heading="No modules available yet"
                body="Browse the Marketplace to add packs with modules and activities."
                cta={{ label: 'Browse Marketplace', onClick: () => router.push('/explore/marketplace') }}
              />
            ) : (
              <EmptyState
                emoji="🔍"
                heading="No activities found"
                body="Try a different subject or clear the filter."
                cta={{ label: 'Clear filter', onClick: () => setSubjectFilter('all') }}
              />
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
            {filtered.map((m) => (
              <ModuleCard
                key={m._id}
                module={m}
                onPreview={setPreviewModule}
                isInLibrary={inLibrary(m)}
                onAddToLibrary={handleAddToLibrary}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-xl">
            {(() => {
              const ownBuilt = modules.filter((m) => {
                if (!m.isOwnBuilt) return false;
                if (subjectFilter !== 'all' && !m.subjects?.includes(subjectFilter)) return false;
                return true;
              });
              if (ownBuilt.length === 0) return null;
              return (
                <section>
                  <div className="relative rounded-[16px] border border-sage/30 bg-surface-panel p-lg mb-md overflow-hidden">
                    <div className="relative z-10 flex items-start justify-between gap-md">
                      <div>
                        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-sage mb-xs">
                          Your modules — {ownBuilt.length} module{ownBuilt.length !== 1 ? 's' : ''}
                        </p>
                        <h2 className="font-serif text-lg font-semibold text-text-primary leading-snug">
                          Built by you
                        </h2>
                        <p className="mt-xs font-serif text-sm text-text-secondary leading-relaxed">
                          Modules you&apos;ve built from the Build screen.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md pl-0 sm:pl-md">
                    {ownBuilt.map((m) => (
                      <ModuleCard
                        key={m._id}
                        module={m}
                        onPreview={setPreviewModule}
                        isInLibrary={true}
                        onAddToLibrary={handleAddToLibrary}
                      />
                    ))}
                  </div>
                </section>
              );
            })()}
            {filteredPacks.map((pack) => {
              const primarySubject = pack.subjects?.[0] ?? '';
              const isInLib = packIds.includes(pack._id);
              return (
                <section key={pack._id}>
                  {/* Pack hero */}
                  <div className={`relative rounded-[16px] border border-border-subtle bg-surface-panel p-lg mb-md overflow-hidden ${isInLib ? 'border-sage/30' : ''}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${SUBJECT_GRADIENT[primarySubject] ?? 'from-transparent to-transparent'} pointer-events-none`} />
                    <div className="relative z-10 flex items-start justify-between gap-md">
                      <div>
                        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
                          Pack — {pack.modules.length} module{pack.modules.length !== 1 ? 's' : ''}
                        </p>
                        <h2 className="font-serif text-lg font-semibold text-text-primary leading-snug">
                          {pack.title}
                        </h2>
                        {pack.description && (
                          <p className="mt-xs font-serif text-sm text-text-secondary leading-relaxed line-clamp-2">
                            {pack.description}
                          </p>
                        )}
                        {pack.subjects && pack.subjects.length > 0 && (
                          <div className="flex flex-wrap gap-xs mt-sm">
                            {pack.subjects.map((s) => {
                              const colorClass = SUBJECT_COLOR_MAP[s] ?? 'text-text-muted bg-surface-raised border-border-subtle';
                              return (
                                <span key={s} className={`font-sans text-[10px] rounded-full px-sm py-[1px] border ${colorClass}`}>
                                  {s}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {isInLib && (
                        <span className="shrink-0 rounded-full bg-sage/15 border border-sage/30 px-sm py-[2px] font-sans text-[10px] font-semibold text-sage">
                          In Library
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Pack modules */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md pl-0 sm:pl-md">
                    {pack.modules.map((m) => (
                      <ModuleCard
                        key={m._id}
                        module={m}
                        onPreview={setPreviewModule}
                        isInLibrary={isInLib}
                        onAddToLibrary={handleAddToLibrary}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Projects section */}
      {projects.length > 0 && (
        <div className="max-w-[1280px] mx-auto px-md lg:px-lg pb-lg">
          <div className="border-t border-border-subtle pt-xl mt-md">
            <div className="flex items-center gap-sm mb-lg">
              <span className="text-lg">◆</span>
              <h2 className="font-serif text-xl font-semibold text-text-primary">Multi-Stage Projects</h2>
              <span className="font-sans text-xs text-text-muted">{projects.length} available</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
              {projects.map((project) => {
                const primarySubject = project.subjects?.[0] ?? '';
                return (
                  <button
                    key={project._id}
                    onClick={() => router.push(`/project/${project._id}`)}
                    className="group relative text-left bg-surface-panel rounded-[16px] p-lg border border-border-subtle shadow-card overflow-hidden hover:translate-y-[-2px] hover:border-border-medium hover:shadow-hover transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
                  >
                    <div className={`absolute inset-0 rounded-[inherit] bg-gradient-to-b ${SUBJECT_GRADIENT[primarySubject] ?? 'from-transparent to-transparent'} pointer-events-none`} />
                    <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,rgba(158,143,184,0.6),var(--color-ember),transparent)] opacity-60" />

                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-xs px-sm py-[2px] rounded-full font-sans text-[10px] font-semibold uppercase tracking-wider mb-sm bg-child-violet/12 text-child-violet border border-child-violet/20"
                      >
                        ◆ {project.stageCount} Stages
                      </div>

                      <h3 className="font-serif text-base font-semibold text-text-primary mb-sm leading-snug">
                        {project.title}
                      </h3>

                      {project.description && (
                        <p className="font-serif text-sm text-text-secondary mb-md line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}

                      <div className="flex items-center gap-md flex-wrap">
                        {project.duration && (
                          <span className="font-sans text-xs text-text-muted">📅 {project.duration}</span>
                        )}
                        {project.ageRange && (
                          <span className="font-sans text-xs text-text-muted">👶 {project.ageRange.min}–{project.ageRange.max} yrs</span>
                        )}
                      </div>

                      {project.subjects && project.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-xs mt-sm">
                          {project.subjects.map((s) => {
                            const colorClass = SUBJECT_COLOR_MAP[s] ?? 'text-text-muted bg-surface-raised border-border-subtle';
                            return (
                              <span key={s} className={`font-sans text-xs rounded-full px-sm py-xs border ${colorClass}`}>
                                {s}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {project.badges && project.badges.length > 0 && (
                        <div className="mt-sm flex items-center gap-xs">
                          <span className="font-sans text-[10px] text-text-muted">🏅 {project.badges.length} badge{project.badges.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Planner success toast */}
      {plannerSuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-sage/20 border border-sage/30 text-sage font-sans text-sm rounded-full px-lg py-sm shadow-lg">
          ✓ Added to today&apos;s planner
        </div>
      )}

      {/* Preview modal */}
      {previewModule && (
        <PreviewModal
          module={previewModule}
          onClose={() => setPreviewModule(null)}
          onStartNow={(id) => router.push(`/module/${id}`)}
          onAddToPlanner={handleAddToPlanner}
        />
      )}
    </div>
  );
}
