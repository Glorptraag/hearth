'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PortableText } from '@portabletext/react';
import { sanityClient } from '@/lib/sanity/client';
import { MODULE_DETAIL_QUERY, OVERLAYS_BATCH_QUERY } from '@/lib/sanity/queries';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Material { name: string; alternative?: string; required: boolean }
interface Activity {
  _id: string;
  title: string;
  instructions?: unknown[];
  facilitatorGuidance?: { before?: string; during?: string; challenges?: string };
  materials?: Material[];
  duration?: { min: number; max: number };
  setting?: string;
  energyLevel?: string;
  observationPrompts?: string[];
  reflectionPrompts?: string[];
}
interface Approach {
  _id: string;
  title: string;
  modality?: string;
  activities?: Activity[];
}
interface Module {
  _id: string;
  title: string;
  targetUnderstanding: string;
  understandingIndicators?: { emerging?: string; developing?: string; demonstrating?: string };
  approaches?: Approach[];
  subjects?: string[];
}
interface Learner { id: string; name: string; colourToken?: string }

interface PedagogyLens {
  perspective?: string;
  facilitatorTips?: string;
  languageFrame?: string;
  watchFor?: string;
}
interface ActivityOverlay { activityId: string; lens: PedagogyLens }

type Mode = 'approach-pick' | 'prep' | 'facilitate' | 'log';

const MODALITY_EMOJI: Record<string, string> = {
  kinesthetic: '🤲',
  visual: '👁',
  auditory: '👂',
  narrative: '📖',
  social: '🤝',
  exploratory: '🔍',
};

const ENERGY_EMOJI: Record<string, string> = {
  calm: '🌿',
  moderate: '⚡',
  active: '🏃',
};

const SETTING_EMOJI: Record<string, string> = {
  indoor: '🏠',
  outdoor: '🌳',
  either: '🌐',
};

const ENGAGEMENT_EMOJI = ['😴', '🙂', '😊', '🌟'];

const PEDAGOGY_LABELS: Record<string, string> = {
  charlotte_mason: 'Charlotte Mason Lens',
  classical: 'Classical Lens',
  montessori: 'Montessori Lens',
  waldorf_steiner: 'Waldorf Lens',
  unschooling: 'Unschooling Lens',
  eclectic: 'Your Lens',
};

// ─── Portable text renderer ───────────────────────────────────────────────────

const ptComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-3 font-serif text-base leading-relaxed text-text-primary">{children}</p>
    ),
  },
};

// ─── Mode: Prep ───────────────────────────────────────────────────────────────

function PrepMode({
  module,
  approachIdx,
  onStart,
}: {
  module: Module;
  approachIdx: number;
  onStart: () => void;
}) {
  const approach = module.approaches?.[approachIdx];
  const activities = approach?.activities ?? [];
  const firstActivityMaterials = activities[0]?.materials ?? [];
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleCheck = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="px-md py-xl max-w-2xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-xl">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ember mb-sm">
          Prep
        </p>
        <h1 className="font-serif text-2xl font-semibold text-text-primary leading-snug mb-sm">
          {module.title}
        </h1>
        <p className="font-serif text-base italic text-text-secondary leading-relaxed">
          {module.targetUnderstanding}
        </p>
      </div>

      {/* Session overview */}
      {activities.length > 0 && (
        <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <h2 className="font-sans text-sm font-semibold text-text-secondary uppercase tracking-widest mb-md">
            Session Flow
          </h2>
          <div className="space-y-sm">
            {activities.map((act, i) => (
              <div key={act._id} className="flex items-start gap-sm">
                <span className="font-sans text-xs font-semibold text-ember mt-1 w-5 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <span className="font-serif text-sm font-semibold text-text-primary">
                    {act.title}
                  </span>
                  {act.duration && (
                    <span className="font-sans text-xs text-text-muted ml-sm">
                      {act.duration.min}–{act.duration.max} min
                    </span>
                  )}
                  <div className="flex gap-xs mt-xs">
                    {act.setting && (
                      <span className="font-sans text-xs text-text-muted">
                        {SETTING_EMOJI[act.setting]} {act.setting}
                      </span>
                    )}
                    {act.energyLevel && (
                      <span className="font-sans text-xs text-text-muted">
                        · {ENERGY_EMOJI[act.energyLevel]} {act.energyLevel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Materials checklist */}
      {firstActivityMaterials.length > 0 && (
        <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <h2 className="font-sans text-sm font-semibold text-text-secondary uppercase tracking-widest mb-md">
            Gather First — Materials for Activity 1
          </h2>
          <div className="space-y-sm">
            {firstActivityMaterials.map((mat, i) => {
              const key = `mat-${i}`;
              return (
                <button
                  key={key}
                  onClick={() => toggleCheck(key)}
                  className="flex items-center gap-sm w-full text-left group"
                >
                  <span
                    className={`w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-all duration-200 ${
                      checked[key]
                        ? 'bg-ember border-ember text-text-inverse'
                        : 'border-border-medium bg-transparent'
                    }`}
                  >
                    {checked[key] && <span className="text-xs">✓</span>}
                  </span>
                  <span
                    className={`font-serif text-sm transition-colors duration-200 ${
                      checked[key] ? 'text-text-muted line-through' : 'text-text-primary'
                    }`}
                  >
                    {mat.name}
                    {!mat.required && (
                      <span className="font-sans text-xs text-text-muted ml-xs">(optional)</span>
                    )}
                    {mat.alternative && (
                      <span className="font-sans text-xs text-text-muted ml-xs">
                        · alt: {mat.alternative}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={onStart}
        className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition-all duration-200 shadow-[0_0_20px_rgba(217,123,58,0.15)]"
      >
        Start Session →
      </button>
    </div>
  );
}

// ─── Mode: Facilitate ─────────────────────────────────────────────────────────

function FacilitateMode({
  module,
  approachIdx,
  overlays,
  pedagogy,
  onFinish,
}: {
  module: Module;
  approachIdx: number;
  overlays: ActivityOverlay[];
  pedagogy: string | null;
  onFinish: () => void;
}) {
  const activities = module.approaches?.[approachIdx]?.activities ?? [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const current = activities[currentIdx];
  const currentOverlay = overlays.find((o) => o.activityId === current?._id) ?? null;
  const isLast = currentIdx === activities.length - 1;

  if (!current) return null;

  return (
    <div className="px-md py-xl max-w-2xl mx-auto pb-32">
      {/* Progress dots */}
      <div className="flex items-center gap-xs mb-xl">
        {activities.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-200 ${
              i === currentIdx
                ? 'w-6 bg-ember'
                : i < currentIdx
                ? 'w-2 bg-ember/40'
                : 'w-2 bg-border-subtle'
            }`}
          />
        ))}
        <span className="font-sans text-xs text-text-muted ml-sm">
          {currentIdx + 1} of {activities.length}
        </span>
      </div>

      {/* Activity header */}
      <div className="mb-lg">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ember mb-xs">
          {module.approaches?.[approachIdx]?.title}
        </p>
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">
          {current.title}
        </h2>
        <div className="flex gap-sm flex-wrap">
          {current.duration && (
            <span className="font-sans text-xs text-text-muted bg-surface-raised rounded-full px-sm py-xs border border-border-subtle">
              ⏱ {current.duration.min}–{current.duration.max} min
            </span>
          )}
          {current.setting && (
            <span className="font-sans text-xs text-text-muted bg-surface-raised rounded-full px-sm py-xs border border-border-subtle">
              {SETTING_EMOJI[current.setting]} {current.setting}
            </span>
          )}
          {current.energyLevel && (
            <span className="font-sans text-xs text-text-muted bg-surface-raised rounded-full px-sm py-xs border border-border-subtle">
              {ENERGY_EMOJI[current.energyLevel]} {current.energyLevel}
            </span>
          )}
        </div>
      </div>

      {/* Instructions */}
      {current.instructions && current.instructions.length > 0 && (
        <div className="mb-lg bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <PortableText value={current.instructions as Parameters<typeof PortableText>[0]['value']} components={ptComponents} />
        </div>
      )}

      {/* Materials reminder */}
      {current.materials && current.materials.length > 0 && (
        <div className="mb-lg">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-sm">
            Materials
          </p>
          <div className="flex flex-wrap gap-xs">
            {current.materials.map((mat, i) => (
              <span
                key={i}
                className="font-sans text-xs text-text-secondary bg-surface-raised rounded-full px-sm py-xs border border-border-subtle"
              >
                {mat.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Observation prompts */}
      {current.observationPrompts && current.observationPrompts.length > 0 && (
        <div className="mb-lg space-y-xs">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-sm">
            Watch For
          </p>
          {current.observationPrompts.map((prompt, i) => (
            <div
              key={i}
              className="bg-surface-raised rounded-md px-md py-sm border border-border-subtle"
            >
              <p className="font-serif text-sm text-text-secondary italic">👁 {prompt}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pedagogy lens (collapsible, shown only when overlay exists) */}
      {currentOverlay && (
        <div className="mb-lg">
          <button
            onClick={() => setOverlayOpen((v) => !v)}
            className="flex items-center gap-xs font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-200 mb-sm"
          >
            <span>{overlayOpen ? '▾' : '▸'}</span>
            <span className="text-ember">✦</span>
            <span>{pedagogy ? (PEDAGOGY_LABELS[pedagogy] ?? 'Your Lens') : 'Pedagogy Lens'}</span>
          </button>
          {overlayOpen && (
            <div className="rounded-lg border border-border-medium bg-ember-glow p-lg space-y-md">
              {currentOverlay.lens.perspective && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    Perspective
                  </p>
                  <p className="font-serif text-sm leading-relaxed text-text-secondary">
                    {currentOverlay.lens.perspective}
                  </p>
                </div>
              )}
              {currentOverlay.lens.facilitatorTips && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    Tips for You
                  </p>
                  <p className="font-serif text-sm leading-relaxed text-text-secondary">
                    {currentOverlay.lens.facilitatorTips}
                  </p>
                </div>
              )}
              {currentOverlay.lens.languageFrame && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    Language
                  </p>
                  <p className="font-serif text-sm leading-relaxed text-text-secondary">
                    {currentOverlay.lens.languageFrame}
                  </p>
                </div>
              )}
              {currentOverlay.lens.watchFor && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    Watch For
                  </p>
                  <p className="font-serif text-sm leading-relaxed text-text-secondary">
                    {currentOverlay.lens.watchFor}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Facilitator guidance (collapsible) */}
      {current.facilitatorGuidance && (
        <div className="mb-lg">
          <button
            onClick={() => setGuidanceOpen((v) => !v)}
            className="flex items-center gap-xs font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-200 mb-sm"
          >
            <span>{guidanceOpen ? '▾' : '▸'}</span>
            <span>Facilitator Guidance</span>
          </button>
          {guidanceOpen && (
            <div className="bg-surface-raised rounded-lg border border-border-subtle p-lg space-y-md">
              {current.facilitatorGuidance.before && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    Before
                  </p>
                  <p className="font-serif text-sm text-text-secondary leading-relaxed">
                    {current.facilitatorGuidance.before}
                  </p>
                </div>
              )}
              {current.facilitatorGuidance.during && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    During
                  </p>
                  <p className="font-serif text-sm text-text-secondary leading-relaxed">
                    {current.facilitatorGuidance.during}
                  </p>
                </div>
              )}
              {current.facilitatorGuidance.challenges && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    If Challenges Arise
                  </p>
                  <p className="font-serif text-sm text-text-secondary leading-relaxed">
                    {current.facilitatorGuidance.challenges}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="fixed bottom-20 left-0 right-0 px-md pb-md bg-gradient-to-t from-surface-body via-surface-body/95 to-transparent pt-lg">
        {isLast ? (
          <button
            onClick={onFinish}
            className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition-all duration-200 shadow-[0_0_20px_rgba(217,123,58,0.15)]"
          >
            Finish & Log →
          </button>
        ) : (
          <button
            onClick={() => { setCurrentIdx((i) => i + 1); setGuidanceOpen(false); setOverlayOpen(false); }}
            className="w-full bg-surface-panel text-text-primary font-sans font-semibold rounded-md px-md py-sm text-sm border border-border-medium hover:bg-surface-hover transition-all duration-200"
          >
            Next Activity →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Mode: Log ────────────────────────────────────────────────────────────────

function LogMode({ module }: { module: Module }) {
  const router = useRouter();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>([]);
  const [engagement, setEngagement] = useState<Record<string, number>>({});
  const [discoveries, setDiscoveries] = useState<Record<string, string>>({});
  const [description, setDescription] = useState(`Completed ${module.title}`);
  const [activePrompts, setActivePrompts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Collect all observation prompts from all activities
  const allPrompts = Array.from(
    new Set(
      module.approaches?.flatMap((app) =>
        app.activities?.flatMap((act) => act.observationPrompts ?? []) ?? []
      ) ?? []
    )
  );

  useEffect(() => {
    fetch('/api/learners')
      .then((r) => r.json())
      .then((data: Learner[]) => {
        setLearners(data);
        if (data.length > 0) setSelectedLearnerIds([data[0].id]);
      })
      .catch(() => {});
  }, []);

  const toggleLearner = (id: string) =>
    setSelectedLearnerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const togglePrompt = (prompt: string) =>
    setActivePrompts((prev) =>
      prev.includes(prompt) ? prev.filter((p) => p !== prompt) : [...prev, prompt]
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        title: `Module: ${module.title}`,
        description: description + (activePrompts.length > 0 ? '\n\nObservations:\n' + activePrompts.map((p) => `• ${p}`).join('\n') : ''),
        dateOccurred: new Date().toISOString().split('T')[0],
        subjects: module.subjects,
        learnerIds: selectedLearnerIds,
        engagementPerLearner: engagement,
        discoveriesPerLearner: discoveries,
        source: 'module_log',
        sourceModuleId: module._id,
        status: 'complete',
      };
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push('/our-story/portfolio');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-md py-xl max-w-2xl mx-auto pb-32">
      <div className="mb-xl">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ember mb-sm">
          Log
        </p>
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">
          Capture this session
        </h2>
        <p className="font-serif text-sm text-text-secondary">
          A few moments to record what happened.
        </p>
      </div>

      {/* Child selector */}
      {learners.length > 0 && (
        <div className="mb-xl">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-sm">
            Who was learning?
          </p>
          <div className="flex flex-wrap gap-sm">
            {learners.map((l) => (
              <button
                key={l.id}
                onClick={() => toggleLearner(l.id)}
                className={`font-sans text-sm px-md py-sm rounded-full border transition-all duration-200 ${
                  selectedLearnerIds.includes(l.id)
                    ? 'bg-ember text-text-inverse border-ember'
                    : 'bg-transparent text-text-secondary border-border-subtle hover:border-border-medium'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Per-child engagement */}
      {selectedLearnerIds.length > 0 && (
        <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-md">
            Engagement
          </p>
          {selectedLearnerIds.map((lid) => {
            const learner = learners.find((l) => l.id === lid);
            return (
              <div key={lid} className="mb-md last:mb-0">
                <p className="font-serif text-sm text-text-primary mb-sm">{learner?.name}</p>
                <div className="flex gap-sm">
                  {ENGAGEMENT_EMOJI.map((emoji, i) => (
                    <button
                      key={i}
                      onClick={() => setEngagement((prev) => ({ ...prev, [lid]: i + 1 }))}
                      className={`text-2xl rounded-md p-xs transition-all duration-200 ${
                        engagement[lid] === i + 1
                          ? 'bg-ember-glow scale-110'
                          : 'opacity-40 hover:opacity-70'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-child discoveries */}
      {selectedLearnerIds.length > 0 && (
        <div className="mb-xl">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-sm">
            Discoveries
          </p>
          {selectedLearnerIds.map((lid) => {
            const learner = learners.find((l) => l.id === lid);
            return (
              <div key={lid} className="mb-sm">
                <label className="font-serif text-sm text-text-secondary mb-xs block">
                  {learner?.name}
                </label>
                <input
                  type="text"
                  placeholder="What did they discover or say?"
                  value={discoveries[lid] ?? ''}
                  onChange={(e) => setDiscoveries((prev) => ({ ...prev, [lid]: e.target.value }))}
                  className="w-full bg-surface-panel border border-border-subtle rounded-md px-md py-sm font-serif text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Description */}
      <div className="mb-xl">
        <label className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-sm block">
          Session Notes
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-surface-panel border border-border-subtle rounded-md px-md py-sm font-serif text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium resize-none"
        />
      </div>

      {/* Observation prompt chips */}
      {allPrompts.length > 0 && (
        <div className="mb-xl">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-sm">
            Observations Noted
          </p>
          <div className="flex flex-wrap gap-xs">
            {allPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => togglePrompt(prompt)}
                className={`font-sans text-xs px-sm py-xs rounded-full border transition-all duration-200 ${
                  activePrompts.includes(prompt)
                    ? 'bg-sage/20 text-sage border-sage/30'
                    : 'bg-transparent text-text-muted border-border-subtle hover:border-border-medium'
                }`}
              >
                {activePrompts.includes(prompt) ? '✓ ' : ''}
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || selectedLearnerIds.length === 0}
        className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition-all duration-200 shadow-[0_0_20px_rgba(217,123,58,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save to Portfolio →'}
      </button>
    </div>
  );
}

// ─── Mode: Approach pick ─────────────────────────────────────────────────────

function ApproachPickMode({
  module,
  onSelect,
}: {
  module: Module;
  onSelect: (idx: number) => void;
}) {
  const approaches = module.approaches ?? [];

  return (
    <div className="px-md py-xl max-w-2xl mx-auto">
      <div className="mb-xl">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ember mb-sm">
          Choose an approach
        </p>
        <h1 className="font-serif text-2xl font-semibold text-text-primary leading-snug mb-sm">
          {module.title}
        </h1>
        <p className="font-serif text-base italic text-text-secondary leading-relaxed">
          {module.targetUnderstanding}
        </p>
      </div>

      {approaches.length === 0 ? (
        <p className="font-serif text-sm text-text-muted">No approaches available for this module.</p>
      ) : (
        <div className="space-y-sm">
          {approaches.map((approach, idx) => {
            const actCount = approach.activities?.length ?? 0;
            return (
              <button
                key={approach._id}
                onClick={() => onSelect(idx)}
                className="flex w-full items-start gap-md rounded-lg border border-border-subtle bg-surface-panel p-lg text-left shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200 hover:border-border-medium hover:bg-surface-raised hover:-translate-y-[2px]"
              >
                <span className="mt-[2px] text-lg">
                  {MODALITY_EMOJI[approach.modality ?? ''] ?? '📌'}
                </span>
                <div className="flex-1">
                  <p className="font-serif text-base font-semibold text-text-primary">
                    {approach.title}
                  </p>
                  {approach.modality && (
                    <p className="mt-xs font-sans text-xs capitalize text-text-muted">
                      {approach.modality} · {actCount} {actCount === 1 ? 'activity' : 'activities'}
                    </p>
                  )}
                </div>
                <span className="mt-[3px] font-sans text-xs text-ember">→</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [mode, setMode] = useState<Mode>('approach-pick');
  const [selectedApproachIdx, setSelectedApproachIdx] = useState(0);
  const [overlays, setOverlays] = useState<ActivityOverlay[]>([]);
  const [pedagogy, setPedagogy] = useState<string | null>(null);

  const fetchModule = useCallback(async () => {
    try {
      const [mod, libraryRes, settingsRes] = await Promise.all([
        sanityClient.fetch(MODULE_DETAIL_QUERY, { id }),
        fetch('/api/library'),
        fetch('/api/settings'),
      ]);
      setModule(mod);

      if (libraryRes.ok) {
        const library: { sanityPackId: string }[] = await libraryRes.json();
        // For now check access via the library records — in Phase 5 we'll add pack membership check
        // Simple: if family has any library record, assume access (seed links them to the starter pack)
        setHasAccess(library.length > 0);
      }

      let resolvedPedagogy = 'eclectic';
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        resolvedPedagogy = settings.pedagogyPreference ?? 'eclectic';
        setPedagogy(resolvedPedagogy);
      }

      // Skip picker if only one approach — fetch overlays immediately
      if ((mod?.approaches?.length ?? 0) <= 1) {
        const activityIds: string[] = mod?.approaches?.[0]?.activities?.map((a: Activity) => a._id) ?? [];
        if (activityIds.length > 0) {
          const raw: { _id: string; activity: { _ref: string }; lens: PedagogyLens }[] =
            await sanityClient.fetch(OVERLAYS_BATCH_QUERY, { activityIds, framework: resolvedPedagogy });
          setOverlays(raw.map((o) => ({ activityId: o.activity._ref, lens: o.lens })));
        }
        setMode('prep');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleApproachSelect = useCallback(async (idx: number) => {
    setSelectedApproachIdx(idx);
    const activityIds: string[] = module?.approaches?.[idx]?.activities?.map((a) => a._id) ?? [];
    if (activityIds.length > 0 && pedagogy) {
      const raw: { _id: string; activity: { _ref: string }; lens: PedagogyLens }[] =
        await sanityClient.fetch(OVERLAYS_BATCH_QUERY, { activityIds, framework: pedagogy });
      setOverlays(raw.map((o) => ({ activityId: o.activity._ref, lens: o.lens })));
    } else {
      setOverlays([]);
    }
    setMode('prep');
  }, [module, pedagogy]);

  useEffect(() => { fetchModule(); }, [fetchModule]);

  if (loading) {
    return (
      <div className="px-md py-xl">
        <div className="animate-pulse space-y-md">
          <div className="h-6 bg-surface-raised rounded w-2/3" />
          <div className="h-4 bg-surface-raised rounded w-full" />
          <div className="h-4 bg-surface-raised rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="px-md py-xl">
        <p className="font-serif text-text-secondary">Module not found.</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="px-md py-xl max-w-2xl mx-auto text-center">
        <p className="text-4xl mb-md">🔒</p>
        <h1 className="font-serif text-xl font-semibold text-text-primary mb-sm">
          Not in your library yet
        </h1>
        <p className="font-serif text-text-secondary mb-lg">
          This module isn't in your library. Browse the Marketplace to add packs to your collection.
        </p>
        <button
          onClick={() => router.push('/explore/marketplace')}
          className="bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition-all duration-200"
        >
          Browse Marketplace
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mode tabs — hidden during approach selection */}
      {mode !== 'approach-pick' && (
        <div className="sticky top-0 z-10 bg-surface-body/95 border-b border-border-subtle px-md py-sm flex gap-lg">
          {(['prep', 'facilitate', 'log'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`font-sans text-sm font-semibold capitalize transition-colors duration-200 ${
                mode === m ? 'text-ember' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {m === 'prep' ? '📋 Prep' : m === 'facilitate' ? '▶ Go' : '✏️ Log'}
            </button>
          ))}
        </div>
      )}

      {mode === 'approach-pick' && (
        <ApproachPickMode module={module} onSelect={handleApproachSelect} />
      )}
      {mode === 'prep' && (
        <PrepMode module={module} approachIdx={selectedApproachIdx} onStart={() => setMode('facilitate')} />
      )}
      {mode === 'facilitate' && (
        <FacilitateMode
          module={module}
          approachIdx={selectedApproachIdx}
          overlays={overlays}
          pedagogy={pedagogy}
          onFinish={() => setMode('log')}
        />
      )}
      {mode === 'log' && <LogMode module={module} />}
    </>
  );
}
