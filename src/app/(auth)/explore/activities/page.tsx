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

function ModuleCard({ module, onPreview }: { module: Module; onPreview: (m: Module) => void }) {
  return (
    <button
      onClick={() => onPreview(module)}
      className="text-left bg-surface-panel rounded-lg p-xl border border-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:translate-y-[-2px] hover:border-border-medium hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] w-full"
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
      <div className="flex items-center gap-md flex-wrap mt-auto">
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
        className="bg-surface-panel w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border-subtle shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-xl max-h-[85vh] overflow-y-auto"
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
  const [loading, setLoading] = useState(true);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [previewModule, setPreviewModule] = useState<Module | null>(null);
  const [, setPlannerSaving] = useState(false);
  const [plannerSuccess, setPlannerSuccess] = useState<string | null>(null);

  const loadModules = useCallback(async () => {
    try {
      const libraryRes = await fetch('/api/library');
      if (!libraryRes.ok) return;
      const library: { sanityPackId: string }[] = await libraryRes.json();
      const packIds = library.map((r) => r.sanityPackId);

      if (packIds.length === 0) {
        setLoading(false);
        return;
      }

      const packs: { modules: Module[] | null }[] = await sanityClient.fetch(
        LIBRARY_MODULES_QUERY,
        { packIds }
      );

      const allModules = packs.flatMap((p) => p.modules ?? []);
      setModules(allModules);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadModules(); }, [loadModules]);

  const toggleSubject = (s: string) =>
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const filtered = useMemo(() => {
    let result = modules;
    if (selectedSubjects.length > 0) {
      result = result.filter((m) =>
        selectedSubjects.some((s) => m.subjects?.includes(s))
      );
    }
    if (selectedDuration) {
      const durationFilter = DURATION_FILTERS.find((d) => d.value === selectedDuration);
      if (durationFilter) result = result.filter(durationFilter.test);
    }
    return result;
  }, [modules, selectedSubjects, selectedDuration]);

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

  return (
    <div className="min-h-screen bg-surface-body">
      {/* Header */}
      <div className="px-md pt-xl pb-lg">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ember mb-xs">
          Your Library
        </p>
        <h1 className="font-serif text-2xl font-semibold text-text-primary">
          Explore Modules
        </h1>
      </div>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 bg-surface-body/95 border-b border-border-subtle px-md pb-md pt-sm space-y-sm">
        {/* Subject chips */}
        <div className="flex gap-xs overflow-x-auto pb-xs">
          {SUBJECTS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => toggleSubject(value)}
              className={`font-sans text-xs shrink-0 rounded-full px-sm py-xs border transition-all duration-200 ${
                selectedSubjects.includes(value)
                  ? `${SUBJECT_COLOR_MAP[value]} border-opacity-50`
                  : 'text-text-muted border-border-subtle hover:border-border-medium bg-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Duration + results count */}
        <div className="flex items-center gap-sm flex-wrap">
          {DURATION_FILTERS.map((d) => (
            <button
              key={d.value}
              onClick={() =>
                setSelectedDuration((prev) => (prev === d.value ? null : d.value))
              }
              className={`font-sans text-xs rounded-full px-sm py-xs border transition-all duration-200 ${
                selectedDuration === d.value
                  ? 'bg-ember text-text-inverse border-ember'
                  : 'text-text-muted border-border-subtle hover:border-border-medium bg-transparent'
              }`}
            >
              {d.label}
            </button>
          ))}
          <span className="font-sans text-xs text-text-muted ml-auto">
            {filtered.length} module{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-md py-lg pb-32">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-surface-panel rounded-lg p-xl border border-border-subtle h-40" />
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
              <>
                <p className="text-4xl mb-md">🔍</p>
                <h2 className="font-serif text-lg font-semibold text-text-primary mb-sm">
                  No modules match
                </h2>
                <button
                  onClick={() => { setSelectedSubjects([]); setSelectedDuration(null); }}
                  className="font-sans text-sm text-ember underline"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {filtered.map((m) => (
              <ModuleCard key={m._id} module={m} onPreview={setPreviewModule} />
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
