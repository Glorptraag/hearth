'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Module, Learner, QuickCaptureItem } from './types';
import { ENGAGEMENT_EMOJI } from './constants';
import { Camera, PencilSimple, X, Check } from '@/components/icons';
import { evidenceSrc } from '@/lib/evidence';

export default function LogMode({
  module,
  sessionElapsed,
  quickCaptures,
  onRemoveCapture,
  selectedApproachIdx,
  completedActivityIdxs,
  runId,
  plannerEntryId,
}: {
  module: Module;
  sessionElapsed?: number;
  quickCaptures?: QuickCaptureItem[];
  onRemoveCapture?: (timestamp: number) => void;
  // Index into module.approaches[] of the approach the parent picked.
  // Used to derive sourceApproachId and to look up activity IDs from
  // completedActivityIdxs.
  selectedApproachIdx?: number;
  // Indexes (into module.approaches[selectedApproachIdx].activities[]) of
  // activities the parent stepped through to completion in Facilitate mode.
  completedActivityIdxs?: number[];
  // Note: runId + plannerEntryId props documented below.
  // The module_runs row id for this session. Carried from FacilitateMode
  // via parent state; included in the entry POST body (task 2.8).
  runId?: string | null;
  // The planner_entries row id, if the parent launched this run from a
  // planner item. Read from ?plannerEntryId search param at page level and
  // included in the entry POST body so the planner ↔ logger loop closes.
  plannerEntryId?: string | null;
}) {
  const router = useRouter();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>([]);
  const [engagement, setEngagement] = useState<Record<string, number>>({});
  const [discoveries, setDiscoveries] = useState<Record<string, string>>({});
  const [understandingLevel, setUnderstandingLevel] = useState<Record<string, string>>({});
  const [description, setDescription] = useState(`Completed ${module.title}`);
  const [activePrompts, setActivePrompts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(1);

  const allPrompts = Array.from(
    new Set(
      module.approaches?.flatMap((app) =>
        app.activities?.flatMap((act) => act.observationPrompts ?? []) ?? []
      ) ?? []
    )
  );

  const reflectionPrompts = Array.from(
    new Set(
      module.approaches?.flatMap((app) =>
        app.activities?.flatMap((act) => act.reflectionPrompts ?? []) ?? []
      ) ?? []
    )
  );

  useEffect(() => {
    // Guarded: avoid SyntaxError on HTML 5xx (see incident 2026-05-25).
    // .catch was already here but it's safer to also skip the parse attempt.
    const jsonOrEmpty = <T,>(fallback: T) => (r: Response) =>
      r.ok ? (r.json() as Promise<T>) : Promise.resolve(fallback);
    Promise.all([
      fetch('/api/learners').then(jsonOrEmpty<Learner[]>([])).catch(() => [] as Learner[]),
      fetch(`/api/entries?status=complete&limit=100`)
        .then(jsonOrEmpty<{ sourceModuleId?: string }[]>([]))
        .catch(() => [] as { sourceModuleId?: string }[]),
    ]).then(([learnerData, entries]) => {
      const data = learnerData as Learner[];
      setLearners(data);
      if (data.length > 0) setSelectedLearnerIds([data[0].id]);

      const previousRuns = (entries as { sourceModuleId?: string }[]).filter(
        (e) => e.sourceModuleId === module._id
      );
      setAttemptNumber(previousRuns.length + 1);
    });
  }, [module._id]);

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
      const understandingSuffix = Object.entries(understandingLevel)
        .filter(([, v]) => v)
        .map(([lid, level]) => {
          const name = learners.find((l) => l.id === lid)?.name ?? '';
          return `${name}: ${level}`;
        })
        .join(', ');

      const captureNotes = (quickCaptures ?? [])
        .filter((c) => c.type === 'note')
        .map((c) => `[${c.activityTitle}] ${c.content}`)
        .join('\n');
      const evidenceUrls = (quickCaptures ?? [])
        .filter((c) => c.type === 'photo')
        .map((c) => c.content);

      const fullDescription = (captureNotes ? captureNotes + '\n\n' : '')
        + description
        + (activePrompts.length > 0 ? '\n\nObservations:\n' + activePrompts.map((p) => `• ${p}`).join('\n') : '')
        + (understandingSuffix ? `\n\nUnderstanding: ${understandingSuffix}` : '')
        + (sessionElapsed != null ? `\n\nSession duration: ${Math.floor(sessionElapsed / 60)}m ${sessionElapsed % 60}s` : '');

      // Collect activity IDs touched this session:
      //  - from quick captures (parent jotted a note while on this activity)
      //  - from completed step indexes (parent advanced past this activity)
      // Dedupe, preserve order seen.
      const activityIdSet = new Set<string>();
      for (const cap of quickCaptures ?? []) {
        if (cap.activityId) activityIdSet.add(cap.activityId);
      }
      const approach = selectedApproachIdx != null
        ? module.approaches?.[selectedApproachIdx]
        : undefined;
      for (const idx of completedActivityIdxs ?? []) {
        const act = approach?.activities?.[idx];
        if (act?._id) activityIdSet.add(act._id);
      }
      const sourceActivityIds = Array.from(activityIdSet);

      const body: Record<string, unknown> = {
        title: `Module: ${module.title}`,
        description: fullDescription,
        dateOccurred: new Date().toISOString().split('T')[0],
        subjects: module.subjects,
        learnerIds: selectedLearnerIds,
        engagementPerLearner: engagement,
        discoveriesPerLearner: discoveries,
        source: 'module_log',
        sourceModuleId: module._id,
        status: 'complete',
      };
      if (sourceActivityIds.length > 0) {
        body.sourceActivityIds = sourceActivityIds;
      }
      if (approach?._id) {
        body.sourceApproachId = approach._id;
      }
      if (evidenceUrls.length > 0) {
        body.evidenceUrls = evidenceUrls;
      }
      // Task 2.8: link the entry back to the module_runs row and (if the
      // parent launched this from a planner item) the planner_entries row.
      // Both are nullable FKs on learning_entries.
      if (runId) {
        body.moduleRunId = runId;
      }
      if (plannerEntryId) {
        body.plannerEntryId = plannerEntryId;
      }
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
          Log {attemptNumber > 1 ? `· Session ${attemptNumber}` : ''}
        </p>
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">
          {attemptNumber === 1
            ? 'Capture this session'
            : attemptNumber === 2
              ? 'What shifted this time?'
              : 'Deepening the understanding'}
        </h2>
        <p className="font-serif text-sm text-text-secondary">
          {attemptNumber === 1
            ? 'A few moments to record what happened.'
            : attemptNumber === 2
              ? 'Notice what changed since last time — new questions, deeper engagement, different approaches.'
              : 'Look for evidence of growing independence, richer language, or connections to other areas.'}
        </p>
      </div>

      {/* Session captures review */}
      {quickCaptures && quickCaptures.length > 0 && (
        <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card">
          <h2 className="font-sans text-sm font-semibold text-text-secondary uppercase tracking-widest mb-md">
            Session Captures
          </h2>
          <div className="space-y-sm">
            {quickCaptures.map((cap) => (
              <div key={cap.timestamp} className="flex items-start gap-sm bg-surface-raised rounded-md p-sm border border-border-subtle">
                <span className="shrink-0 inline-flex text-text-secondary" aria-hidden="true">
                  {cap.type === 'photo' ? <Camera size={16} /> : <PencilSimple size={16} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[11px] text-text-muted">{cap.activityTitle}</p>
                  {cap.type === 'photo' ? (
                    // Vercel Blob photo capture, intrinsic dimensions unknown
                    // and the layout uses max-h flow rather than a sized box —
                    // next/image's required width/height/fill don't fit here.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={evidenceSrc(cap.content)} alt="Capture" className="mt-xs rounded max-h-20 object-cover" />
                  ) : (
                    <p className="font-serif text-sm text-text-primary">{cap.content}</p>
                  )}
                </div>
                {onRemoveCapture && (
                  <button
                    onClick={() => onRemoveCapture(cap.timestamp)}
                    className="shrink-0 text-text-muted hover:text-red-400 transition-colors duration-200"
                    aria-label="Remove capture"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card">
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

      {/* Understanding level — per-child */}
      {module.understandingIndicators && selectedLearnerIds.length > 0 && (
        <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-md">
            Understanding Level
          </p>
          {selectedLearnerIds.map((lid) => {
            const learner = learners.find((l) => l.id === lid);
            return (
              <div key={lid} className="mb-md last:mb-0">
                <p className="font-serif text-sm text-text-primary mb-sm">{learner?.name}</p>
                <div className="flex gap-xs flex-wrap">
                  {([
                    { key: 'emerging', label: 'Emerging', badge: 'bg-amber-status/15 text-amber-status border-amber-status/30', desc: module.understandingIndicators!.emerging },
                    { key: 'developing', label: 'Developing', badge: 'bg-domain-science/15 text-domain-science border-domain-science/30', desc: module.understandingIndicators!.developing },
                    { key: 'demonstrating', label: 'Demonstrating', badge: 'bg-sage/15 text-sage border-sage/30', desc: module.understandingIndicators!.demonstrating },
                  ] as const).map(({ key, label, badge }) => (
                    <button
                      key={key}
                      onClick={() => setUnderstandingLevel((prev) => ({ ...prev, [lid]: prev[lid] === key ? '' : key }))}
                      className={`rounded-full px-sm py-[3px] font-sans text-[11px] font-medium border transition-all duration-200 ${
                        understandingLevel[lid] === key
                          ? badge
                          : 'bg-transparent border-border-subtle text-text-muted hover:border-border-medium'
                      }`}
                    >
                      {label}
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

      {/* Observation/reflection prompt chips — shifts on repeat sessions */}
      {(() => {
        const prompts = attemptNumber >= 2 && reflectionPrompts.length > 0
          ? reflectionPrompts
          : allPrompts;
        const label = attemptNumber >= 2 && reflectionPrompts.length > 0
          ? 'Reflections'
          : 'Observations Noted';
        return prompts.length > 0 ? (
          <div className="mb-xl">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-sm">
              {label}
            </p>
            <div className="flex flex-wrap gap-xs">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => togglePrompt(prompt)}
                  className={`font-sans text-xs px-sm py-xs rounded-full border transition-all duration-200 ${
                    activePrompts.includes(prompt)
                      ? 'bg-sage/20 text-sage border-sage/30'
                      : 'bg-transparent text-text-muted border-border-subtle hover:border-border-medium'
                  }`}
                >
                  {activePrompts.includes(prompt) && <Check size={12} className="inline mr-1" aria-hidden="true" />}
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || selectedLearnerIds.length === 0}
        className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition-all duration-200 shadow-ember disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save to Portfolio →'}
      </button>
    </div>
  );
}
