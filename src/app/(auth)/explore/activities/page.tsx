'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sanityClient } from '@/lib/sanity/client';
import { LIBRARY_MODULES_QUERY } from '@/lib/sanity/queries';

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

const DURATION_FILTERS = [
  { label: 'Quick (<15 min)', value: 'quick', test: (m: Module) => (m.duration?.max ?? 99) < 15 },
  { label: 'Medium (15–30)', value: 'medium', test: (m: Module) => { const max = m.duration?.max ?? 0; return max >= 15 && max <= 30; } },
  { label: 'Long (30+)', value: 'long', test: (m: Module) => (m.duration?.min ?? 0) >= 30 },
] as const;

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
      className="group relative text-left bg-surface-panel rounded-[16px] p-lg border border-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden hover:translate-y-[-2px] hover:border-border-medium hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(217,123,58,0.08)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] w-full flex flex-col h-full relative"
    >
      <div className={`absolute inset-0 rounded-[inherit] bg-gradient-to-b ${SUBJECT_GRADIENT[primarySubject] ?? 'from-transparent to-transparent'} pointer-events-none`} />

      <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,var(--color-ember),transparent)] opacity-0 transition-opacity duration-[400ms] group-hover:opacity-100" />

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
          <div className="h-5 w-5 rounded-full bg-surface-hover border border-border-subtle flex items-center justify-center shrink-0">
            <span className="font-sans text-[9px] text-text-muted">H</span>
          </div>
          <span className="font-sans text-[11px] text-text-muted truncate">Hearth</span>
          <span className="ml-auto rounded-full bg-sage/15 px-xs py-[1px] font-sans text-[9px] font-semibold text-sage">✓ Verified</span>
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-md"
      onClick={onClose}
    >
      <div
        className="bg-surface-panel w-full sm:max-w-[680px] rounded-t-[16px] sm:rounded-[24px] border border-border-subtle shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(217,123,58,0.08)] p-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border-medium rounded-full mx-auto mb-lg sm:hidden" />

        <h2 className="font-serif text-xl font-semibold text-text-primary mb-sm leading-snug">
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
  const [modules, setModules] = useState<Module[]>([]);
  const [packIds, setPackIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [libraryOnly, setLibraryOnly] = useState(false);
  const [previewModule, setPreviewModule] = useState<Module | null>(null);
  const [, setPlannerSaving] = useState(false);
  const [plannerSuccess, setPlannerSuccess] = useState<string | null>(null);

  const loadModules = useCallback(async () => {
    try {
      const libraryRes = await fetch('/api/library');
      if (!libraryRes.ok) return;
      const library: { sanityPackId: string }[] = await libraryRes.json();
      const ids = library.map((r) => r.sanityPackId);
      setPackIds(ids);

      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      const packs: { _id: string; modules: Module[] | null }[] = await sanityClient.fetch(
        LIBRARY_MODULES_QUERY,
        { packIds: ids }
      );

      const allModules = packs.flatMap((p) => (p.modules ?? []).map((m) => ({ ...m, packId: p._id })));
      setModules(allModules);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadModules(); }, [loadModules]);

  const filtered = useMemo(() => {
    let result = modules;

    if (libraryOnly) {
      result = result.filter((m) => packIds.includes(m.packId ?? ''));
    }

    if (subjectFilter !== 'all') {
      result = result.filter((m) => m.subjects?.includes(subjectFilter));
    }

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'newest') {
      result = [...result].reverse();
    }

    return result;
  }, [modules, packIds, libraryOnly, subjectFilter, sortBy]);

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
    try {
      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId }),
      });
      loadModules();
    } catch (err) {
      console.error('Failed to add to library', err);
    }
  };

  return (
    <div className="min-h-screen bg-surface-body">
      {/* Header */}
      <div className="max-w-[1280px] mx-auto px-md lg:px-lg pt-xl pb-lg">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ember mb-xs">
          Your Library
        </p>
        <h1 className="font-serif text-2xl font-semibold text-text-primary">
          Explore Modules
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

          {/* Sort select (right-aligned) */}
          <div className="flex justify-end">
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
          <div className="text-center py-3xl">
            {modules.length === 0 ? (
              <>
                <p className="text-4xl mb-md">📚</p>
                <h2 className="font-serif text-xl font-semibold text-text-primary mb-sm">
                  Your library is empty
                </h2>
                <p className="font-serif text-text-secondary mb-lg">
                  Add packs from the Marketplace to start exploring.
                </p>
                <button
                  onClick={() => router.push('/explore/marketplace')}
                  className="bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition-all duration-200"
                >
                  Browse Marketplace
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-md py-2xl text-center">
                <span className="text-4xl">🔍</span>
                <p className="font-serif text-lg font-semibold text-text-primary">No activities found</p>
                <p className="font-serif text-sm text-text-secondary">Try a different subject or clear the filter.</p>
                <button
                  onClick={() => setSubjectFilter('all')}
                  className="font-sans text-sm text-ember hover:underline"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
            {filtered.map((m) => (
              <ModuleCard
                key={m._id}
                module={m}
                onPreview={setPreviewModule}
                isInLibrary={packIds.includes(m.packId ?? '')}
                onAddToLibrary={handleAddToLibrary}
              />
            ))}
          </div>
        )}
      </div>

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
