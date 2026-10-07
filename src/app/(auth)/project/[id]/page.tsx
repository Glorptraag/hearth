'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PortableText } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { clientSanityRead } from '@/lib/sanity/client-read';
import { DOMAIN_CLASSES as SUBJECT_CLASSES, DOMAIN_LABELS as SUBJECT_LABELS } from '@/components/ui/DomainChip';
import {
  ArrowLeft,
  CalendarBlank,
  User,
  Check,
  Timer,
  Paperclip,
  ClipboardText,
  PencilLine,
  Binoculars,
} from '@/components/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Material {
  name: string;
  alternative?: string;
  required?: boolean;
}

interface Stage {
  _id: string;
  title: string;
  stageNumber: number;
  instructions?: PortableTextBlock[];
  materials?: Material[];
  estimatedDuration?: string;
  artifactDescription?: string;
  dependsOn?: string;
  status?: string;
}

interface Project {
  _id: string;
  title: string;
  description?: string;
  subjects?: string[];
  ageRange?: { min: number; max: number };
  duration?: string;
  stages?: Stage[];
  badges?: { _id: string; title: string; emoji?: string; criteriaSummary?: string }[];
  capabilityThreads?: { _id: string; title: string; domain: string }[];
  status?: string;
}

type View = 'overview' | 'stage';

const ptComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="font-serif text-sm leading-relaxed text-text-secondary mb-md">{children}</p>
    ),
  },
};

// ─── Stage progress (localStorage) ───────────────────────────────────────────

function getCompletedStages(projectId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(`hearth:project:${projectId}:completed`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function setCompletedStages(projectId: string, ids: Set<string>) {
  localStorage.setItem(`hearth:project:${projectId}:completed`, JSON.stringify([...ids]));
}

// ─── Overview screen ─────────────────────────────────────────────────────────

function ProjectOverview({
  project,
  completedIds,
  onStageSelect,
}: {
  project: Project;
  completedIds: Set<string>;
  onStageSelect: (idx: number) => void;
}) {
  const stages = project.stages ?? [];
  const completedCount = stages.filter((s) => completedIds.has(s._id)).length;
  const progressPct = stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0;

  // Find first incomplete stage
  const activeIdx = stages.findIndex((s) => !completedIds.has(s._id));

  return (
    <div className="min-h-screen bg-surface-body">
      {/* Hero */}
      <div
        className="relative px-xl py-2xl max-w-3xl mx-auto border-b border-border-subtle"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(158,143,184,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(217,123,58,0.06) 0%, transparent 50%)',
        }}
      >
        <a
          href="/explore/activities"
          className="inline-flex items-center gap-xs font-sans text-[0.85rem] font-medium text-text-secondary hover:text-text-primary transition-colors duration-[var(--motion-quick)] mb-lg"
        >
          <span className="inline-flex items-center gap-xs"><ArrowLeft size={14} aria-hidden="true" /> Explore</span>
        </a>

        <div className="inline-flex items-center gap-xs px-sm py-xs rounded-full font-sans text-[0.6875rem] font-semibold uppercase tracking-wider mb-md bg-child-violet/12 text-child-violet border border-child-violet/20"
        >
          <span>◆</span> Multi-Stage Project · {stages.length} Stages
        </div>

        <h1 className="font-serif text-[2.25rem] font-semibold text-text-primary leading-tight mb-sm">
          {project.title}
        </h1>
        {project.description && (
          <p className="font-serif text-lg italic text-text-secondary mb-lg max-w-[600px]">
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap gap-md mb-lg">
          {project.duration && (
            <span className="font-sans text-[0.8125rem] text-text-secondary flex items-center gap-xs"><CalendarBlank size={14} aria-hidden="true" /> {project.duration}</span>
          )}
          {project.ageRange && (
            <span className="font-sans text-[0.8125rem] text-text-secondary flex items-center gap-xs"><User size={14} aria-hidden="true" /> Ages {project.ageRange.min}–{project.ageRange.max}</span>
          )}
        </div>

        {(project.subjects ?? []).length > 0 && (
          <div className="flex flex-wrap gap-sm">
            {(project.subjects ?? []).map((s) => {
              const cls = SUBJECT_CLASSES[s] ?? 'bg-surface-raised text-text-secondary border-border-subtle';
              return (
                <span
                  key={s}
                  className={`px-sm py-xs rounded-[6px] font-sans text-[0.6875rem] font-medium tracking-wider border ${cls}`}
                >
                  {SUBJECT_LABELS[s] ?? s}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Stage Journey */}
      <div className="max-w-3xl mx-auto px-xl py-2xl">
        <div className="flex items-center justify-between mb-xl">
          <h2 className="font-serif text-[1.1rem] font-semibold text-text-primary">Project Stages</h2>
          <div className="flex items-center gap-sm font-sans text-xs text-text-muted">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Project progress: ${completedCount} of ${stages.length} stages complete`}
              style={{
                background: `conic-gradient(var(--color-ember) 0deg, var(--color-ember) ${progressPct * 3.6}deg, var(--color-surface-raised) ${progressPct * 3.6}deg)`,
              }}
            >
              <div className="w-5 h-5 rounded-full bg-surface-body flex items-center justify-center text-[0.5625rem] font-semibold text-ember">
                {completedCount}/{stages.length}
              </div>
            </div>
            <span>{completedCount} of {stages.length} complete</span>
          </div>
        </div>

        <div className="flex flex-col">
          {stages.map((stage, idx) => {
            const isCompleted = completedIds.has(stage._id);
            const isActive = idx === activeIdx;
            const isLocked = idx > activeIdx && activeIdx >= 0;

            return (
              <div key={stage._id}>
                <button
                  onClick={() => { if (!isLocked) onStageSelect(idx); }}
                  disabled={isLocked}
                  className={`w-full flex items-start gap-md rounded-lg border p-lg text-left transition duration-[var(--motion-gentle)] ease-[var(--ease-default)] ${
                    isCompleted
                      ? 'border-sage/20 bg-sage/5 hover:border-sage/30'
                      : isActive
                        ? 'border-ember/30 bg-ember-glow hover:border-ember/50'
                        : isLocked
                          ? 'border-border-subtle bg-surface-panel opacity-50 cursor-not-allowed'
                          : 'border-border-subtle bg-surface-panel hover:border-border-medium'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-sans text-sm font-semibold ${
                      isCompleted
                        ? 'bg-sage/20 text-sage'
                        : isActive
                          ? 'bg-ember/20 text-ember'
                          : 'bg-surface-raised text-text-muted'
                    }`}
                  >
                    {isCompleted ? <Check size={14} aria-hidden="true" /> : stage.stageNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base font-semibold text-text-primary mb-xs">
                      {stage.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-sm">
                      {stage.estimatedDuration && (
                        <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted"><Timer size={12} aria-hidden="true" /> {stage.estimatedDuration}</span>
                      )}
                      {isCompleted && stage.artifactDescription && (
                        <span className="inline-flex items-center gap-xs font-sans text-xs text-sage"><Check size={12} aria-hidden="true" /> {stage.artifactDescription}</span>
                      )}
                      {!isCompleted && stage.artifactDescription && (
                        <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted"><Paperclip size={12} aria-hidden="true" /> Produces: {stage.artifactDescription}</span>
                      )}
                    </div>
                    {stage.dependsOn && !isCompleted && (
                      <p className="mt-sm inline-flex items-center gap-xs font-sans text-xs text-text-muted">
                        <ClipboardText size={12} aria-hidden="true" /> {stage.dependsOn}
                      </p>
                    )}
                  </div>
                </button>
                {idx < stages.length - 1 && (
                  <div className="flex pl-[42px] h-8">
                    <div
                      className={`w-[2px] h-full ${isCompleted ? 'bg-gradient-to-b from-sage to-ember' : 'bg-surface-hover'}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Continue CTA */}
        {activeIdx >= 0 && (
          <div className="mt-xl text-center">
            <button
              onClick={() => onStageSelect(activeIdx)}
              className="hearth-press bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]"
            >
              Continue Stage {stages[activeIdx].stageNumber}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stage detail screen ─────────────────────────────────────────────────────

function StageDetail({
  project,
  stage,
  isCompleted,
  onBack,
  onComplete,
}: {
  project: Project;
  stage: Stage;
  isCompleted: boolean;
  onBack: () => void;
  onComplete: (artifactNote?: string) => void;
}) {
  const [materialsChecked, setMaterialsChecked] = useState<Record<string, boolean>>({});
  const [showCompletePrompt, setShowCompletePrompt] = useState(false);
  const [artifactNote, setArtifactNote] = useState('');
  const materials = stage.materials ?? [];
  const totalStages = project.stages?.length ?? 0;

  return (
    <div className="min-h-screen bg-surface-body">
      <div className="max-w-3xl mx-auto px-xl py-xl">
        {/* Back nav */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-xs font-sans text-[0.85rem] font-medium text-text-secondary hover:text-text-primary transition-colors duration-[var(--motion-quick)] mb-lg"
        >
          <span className="inline-flex items-center gap-xs"><ArrowLeft size={14} aria-hidden="true" /> {project.title}</span>
        </button>

        {/* Stage header */}
        <div className="mb-xl">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ember mb-sm">
            Stage {stage.stageNumber} of {totalStages}
          </p>
          <h1 className="font-serif text-2xl font-semibold text-text-primary leading-snug mb-sm">
            {stage.title}
          </h1>
          <div className="flex flex-wrap gap-md">
            {stage.estimatedDuration && (
              <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted"><Timer size={12} aria-hidden="true" /> {stage.estimatedDuration}</span>
            )}
            {stage.artifactDescription && (
              <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted"><Paperclip size={12} aria-hidden="true" /> {stage.artifactDescription}</span>
            )}
          </div>
        </div>

        {/* Dependency note */}
        {stage.dependsOn && (
          <div className="rounded-lg border border-border-subtle bg-surface-panel p-md mb-lg">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">Before you begin</p>
            <p className="font-serif text-sm text-text-secondary">{stage.dependsOn}</p>
          </div>
        )}

        {/* Materials checklist */}
        {materials.length > 0 && (
          <div className="rounded-lg border border-border-subtle bg-surface-panel p-lg mb-lg">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ember mb-md">Materials</p>
            <div className="space-y-sm">
              {materials.map((m, i) => {
                const key = `mat-${i}`;
                return (
                  <label key={key} className="flex items-start gap-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={materialsChecked[key] ?? false}
                      onChange={() => setMaterialsChecked((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className="hearth-checkbox mt-[3px] h-4 w-4 shrink-0"
                    />
                    <div>
                      <span className={`font-serif text-sm ${materialsChecked[key] ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                        {m.name}
                      </span>
                      {m.alternative && (
                        <span className="font-sans text-xs text-text-muted ml-sm">(or: {m.alternative})</span>
                      )}
                      {m.required === false && (
                        <span className="font-sans text-[0.65rem] text-text-muted ml-sm">optional</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Instructions */}
        {stage.instructions && stage.instructions.length > 0 && (
          <div className="mb-xl">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ember mb-md">Instructions</p>
            <PortableText value={stage.instructions} components={ptComponents} />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-sm">
          {isCompleted ? (
            <div className="text-center py-md">
              <span className="inline-flex items-center gap-xs font-sans text-sm text-sage font-semibold"><Check size={14} aria-hidden="true" /> Stage complete</span>
            </div>
          ) : showCompletePrompt ? (
            <div className="rounded-lg border border-border-subtle bg-surface-panel p-lg">
              {stage.artifactDescription && (
                <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ember mb-sm">
                  What did you create?
                </p>
              )}
              <p className="font-serif text-sm text-text-secondary mb-md">
                {stage.artifactDescription
                  ? `This stage produces: ${stage.artifactDescription}. Add a quick note about what was made.`
                  : 'Any notes about this stage before completing?'}
              </p>
              <textarea
                value={artifactNote}
                onChange={(e) => setArtifactNote(e.target.value)}
                placeholder="Brief note (optional)"
                rows={2}
                className="w-full bg-surface-raised border border-border-subtle rounded-md px-md py-sm font-serif text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium resize-none mb-md"
              />
              <div className="flex gap-sm">
                <button
                  onClick={() => onComplete(artifactNote || undefined)}
                  className="flex-1 bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition duration-[var(--motion-quick)]"
                >
                  <span className="inline-flex items-center gap-xs">Complete Stage <Check size={14} aria-hidden="true" /></span>
                </button>
                <button
                  onClick={() => setShowCompletePrompt(false)}
                  className="font-sans text-sm text-text-muted hover:text-text-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCompletePrompt(true)}
              className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition duration-[var(--motion-quick)]"
            >
              Mark Stage Complete
            </button>
          )}

          {/* Log entry link */}
          <Link
            href={`/log?source=project_stage&projectId=${project._id}&stageNumber=${stage.stageNumber}`}
            className="inline-flex items-center justify-center gap-xs w-full text-center bg-surface-panel text-text-primary font-sans font-semibold rounded-md px-md py-sm text-sm border border-border-medium hover:bg-surface-hover transition duration-[var(--motion-quick)]"
          >
            <PencilLine size={14} aria-hidden="true" /> Log This Stage
          </Link>

          <button
            onClick={onBack}
            className="w-full text-center bg-transparent text-text-secondary font-sans text-sm hover:text-text-primary transition-colors duration-[var(--motion-quick)]"
          >
            <span className="inline-flex items-center gap-xs"><ArrowLeft size={14} aria-hidden="true" /> Back to Overview</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('overview');
  const [selectedStageIdx, setSelectedStageIdx] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const fetchProject = useCallback(async () => {
    try {
      // project derefs capabilityThread (dotted id, dark to the tokenless
      // browser client) — read through the authed proxy.
      const data = await clientSanityRead<Project>('projectDetail', { id });
      setProject(data);
      if (data?._id) {
        setCompletedIds(getCompletedStages(data._id));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  function handleStageSelect(idx: number) {
    setSelectedStageIdx(idx);
    setView('stage');
    window.scrollTo(0, 0);
  }

  function handleComplete(artifactNote?: string) {
    if (!project?.stages) return;
    const stage = project.stages[selectedStageIdx];
    const next = new Set(completedIds);
    next.add(stage._id);
    setCompletedIds(next);
    setCompletedStages(project._id, next);
    // Store artifact note if provided
    if (artifactNote) {
      try {
        const key = `hearth:project:${project._id}:artifacts`;
        const existing = JSON.parse(localStorage.getItem(key) ?? '{}');
        existing[stage._id] = artifactNote;
        localStorage.setItem(key, JSON.stringify(existing));
      } catch { /* ignore */ }
    }
    setView('overview');
    window.scrollTo(0, 0);
  }

  if (loading) {
    return (
      <div className="px-md py-xl">
        <div className="hearth-skeleton space-y-md">
          <div className="h-8 bg-surface-raised rounded w-2/3" />
          <div className="h-4 bg-surface-raised rounded w-1/2" />
          <div className="h-32 bg-surface-raised rounded" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="px-md py-xl text-center">
        <span className="mb-md inline-flex justify-center text-text-secondary" aria-hidden="true">
          <Binoculars size={32} />
        </span>
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-sm">Project not found</h2>
        <p className="font-sans text-sm text-text-secondary mb-lg">This project may not exist or hasn&apos;t been published yet.</p>
        <button
          onClick={() => router.push('/explore/activities')}
          className="font-sans text-sm font-semibold px-md py-sm rounded-md border border-ember text-ember hover:bg-ember hover:text-text-inverse transition duration-[var(--motion-quick)]"
        >
          Browse Activities
        </button>
      </div>
    );
  }

  const stage = project.stages?.[selectedStageIdx];

  if (view === 'stage' && stage) {
    return (
      <StageDetail
        project={project}
        stage={stage}
        isCompleted={completedIds.has(stage._id)}
        onBack={() => { setView('overview'); window.scrollTo(0, 0); }}
        onComplete={handleComplete}
      />
    );
  }

  return (
    <ProjectOverview
      project={project}
      completedIds={completedIds}
      onStageSelect={handleStageSelect}
    />
  );
}
