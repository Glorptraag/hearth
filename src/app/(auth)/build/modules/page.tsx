'use client';

import { useState, useEffect, useRef, type ComponentType } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { ModuleDraftRecord, ModuleStep, Pathway, SharedEditData } from '@/lib/module-builder/types';
import { draftDisplayTitle, draftToEditData, normalizeToEditData } from '@/lib/module-builder/normalize';
import { buildModulePublishPayload, publishBlockers } from '@/lib/module-builder/publish-payload';
import {
  ArrowLeft, CaretRight, BookOpen, Wrench, SealQuestion, ClockCounterClockwise, Target,
  CheckCircle, Check, HouseLine, Tree, BabyCarriage, Timer, Sparkle,
  ClipboardText, MagicWand, PencilLine, Compass,
  Books, FilmReel, Toolbox, DeviceMobile, MapPin, MusicNote, Package,
  Palette, MagnifyingGlass, ChatsCircle, Flask, PencilSimpleLine, Brain,
  Eye, DiceFive, CookingPot, Atom, PersonSimpleRun,
} from '@/components/icons';

type IconC = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

type LabelItem = { id: string; Icon: ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>; label: string };

const RESOURCE_TYPES: ReadonlyArray<LabelItem> = [
  { id: 'book',  Icon: Books,        label: 'Book' },
  { id: 'video', Icon: FilmReel,     label: 'Video' },
  { id: 'kit',   Icon: Toolbox,      label: 'Kit' },
  { id: 'app',   Icon: DeviceMobile, label: 'App' },
  { id: 'place', Icon: MapPin,       label: 'Place' },
  { id: 'audio', Icon: MusicNote,    label: 'Audio' },
  { id: 'other', Icon: Package,      label: 'Other' },
];

const USAGE_INTENTS: ReadonlyArray<LabelItem> = [
  { id: 'read',     Icon: BookOpen,           label: 'Read / watch together' },
  { id: 'inspire',  Icon: Palette,            label: 'Inspiration for a project' },
  { id: 'explore',  Icon: MagnifyingGlass,    label: 'Explore a topic' },
  { id: 'discuss',  Icon: ChatsCircle,        label: 'Discuss and reflect' },
  { id: 'do',       Icon: Flask,              label: 'Do the activity / experiment' },
  { id: 'write',    Icon: PencilSimpleLine,   label: 'Writing / drawing starting point' },
  { id: 'memorise', Icon: Brain,              label: 'Memorise / learn by heart' },
];

const SUBJECT_TAGS = [
  'English', 'Mathematics', 'Science', 'HASS', 'Arts',
  'Technologies', 'HPE', 'Languages', 'Nature Study', 'Life Skills',
];

const AGE_RANGES = ['3–5', '5–7', '7–9', '9–11', '11–13', '13–15', '15+', 'All ages'];

const DURATION_OPTIONS = ['15 min', '30 min', '45 min', '1 hour', '1.5 hours', '2 hours', 'Half day'];
const SETTINGS = [
  { id: 'either', label: 'Either' },
  { id: 'indoor', label: 'Indoor' },
  { id: 'outdoor', label: 'Outdoor' },
];

const INVESTIGATION_TYPES: ReadonlyArray<LabelItem> = [
  { id: 'observe',  Icon: Eye,            label: 'Observe closely' },
  { id: 'test',     Icon: Flask,          label: 'Test it out' },
  { id: 'research', Icon: Books,          label: 'Look it up' },
  { id: 'ask',      Icon: ChatsCircle,    label: 'Ask an expert' },
  { id: 'visit',    Icon: MapPin,         label: 'Go somewhere' },
  { id: 'make',     Icon: Wrench,         label: 'Build or make' },
];

const TIERS = ['Emerging', 'Developing', 'Demonstrating'];

const ACTIVITY_PREFERENCES: ReadonlyArray<LabelItem> = [
  { id: 'outdoors',    Icon: Tree,             label: 'Outdoors' },
  { id: 'art',         Icon: Palette,          label: 'Art / craft' },
  { id: 'books',       Icon: Books,            label: 'Books' },
  { id: 'games',       Icon: DiceFive,         label: 'Games' },
  { id: 'cooking',     Icon: CookingPot,       label: 'Cooking' },
  { id: 'experiments', Icon: Atom,             label: 'Experiments' },
  { id: 'active',      Icon: PersonSimpleRun,  label: 'Active' },
  { id: 'discussion',  Icon: ChatsCircle,      label: 'Discussion' },
];

const CAPABILITY_THREADS = [
  { id: 'M1', domain: 'Mathematics', name: 'Number Sense & Place Value' },
  { id: 'M2', domain: 'Mathematics', name: 'Addition & Subtraction' },
  { id: 'M3', domain: 'Mathematics', name: 'Measurement Sense' },
  { id: 'M4', domain: 'Mathematics', name: 'Shape & Space' },
  { id: 'S1', domain: 'Science', name: 'Scientific Inquiry' },
  { id: 'S2', domain: 'Science', name: 'Scientific Observation' },
  { id: 'S3', domain: 'Science', name: 'Living Things & Habitats' },
  { id: 'L1', domain: 'Language & Literacy', name: 'Oral Communication' },
  { id: 'L2', domain: 'Language & Literacy', name: 'Reading Comprehension' },
  { id: 'L3', domain: 'Language & Literacy', name: 'Writing & Expression' },
  { id: 'EF1', domain: 'Executive Function', name: 'Planning & Organisation' },
  { id: 'EF2', domain: 'Executive Function', name: 'Self-Regulation' },
];

const PATHWAYS: ReadonlyArray<{ id: Pathway; Icon: IconC; label: string; name: string; hint: string; badge: string | null }> = [
  {
    id: 'material',
    Icon: BookOpen,
    label: '"I have a great resource"',
    name: 'Material-Anchored',
    hint: 'Build a module around a book, video, kit, or place',
    badge: null,
  },
  {
    id: 'process',
    Icon: Wrench,
    label: '"I know the steps"',
    name: 'Process',
    hint: 'You already know what to do — capture it as a reusable module',
    badge: null,
  },
  {
    id: 'inquiry',
    Icon: SealQuestion,
    label: '"I have a question to explore"',
    name: 'Inquiry',
    hint: 'Start with curiosity and design an investigation',
    badge: null,
  },
  {
    id: 'retrospective',
    Icon: ClockCounterClockwise,
    label: '"We\'ve already been doing this"',
    name: 'Retrospective Lift',
    hint: 'Turn logged activities into a structured module',
    badge: 'From your logs',
  },
];

const GOAL_PATHWAY: { id: Pathway; Icon: IconC; label: string; name: string; hint: string; badge: string | null } = {
  id: 'understanding',
  Icon: Target,
  label: '"I want to develop a skill area"',
  name: 'Goal-Forward',
  hint: 'Target a specific capability or learning gap',
  badge: null,
};

// ── Shared UI helpers ──────────────────────────────────────────────────────

function OLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-[0.7rem] font-semibold text-text-muted uppercase tracking-[0.1em] mb-sm">
      {children}
    </p>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'font-sans text-sm font-medium px-md py-xs rounded-md border min-h-[36px] transition duration-[var(--motion-quick)] ease-[var(--ease-default)]',
        active
          ? 'bg-ember text-text-inverse border-ember'
          : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function PathwayHeader({ Icon, name, subtitle, onBack }: { Icon: IconC; name: string; subtitle: string; onBack: () => void }) {
  return (
    <>
      <div className="flex items-center gap-sm">
        <button
          onClick={onBack}
          className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-[var(--motion-quick)]"
        >
          <span className="inline-flex items-center gap-xs"><ArrowLeft size={14} aria-hidden="true" /> Back</span>
        </button>
        <span className="text-text-muted font-sans text-sm">/</span>
        <span className="font-sans text-sm text-text-secondary">{name}</span>
      </div>
      <div>
        <h2 className="inline-flex items-center gap-sm font-serif text-xl font-semibold text-text-primary mb-xs">
          <Icon size={22} aria-hidden="true" /> {name}
        </h2>
        <p className="font-serif text-sm text-text-secondary">{subtitle}</p>
      </div>
    </>
  );
}

function QuickSettings({
  duration,
  setting,
  onDuration,
  onSetting,
}: {
  duration: string;
  setting: string;
  onDuration: (v: string) => void;
  onSetting: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-md">
      <div className="flex-1">
        <OLabel>Duration</OLabel>
        <select
          value={duration}
          onChange={(e) => onDuration(e.target.value)}
          className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary outline-none transition duration-[var(--motion-quick)] focus:border-ember"
        >
          <option value="">Select…</option>
          {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="flex-1">
        <OLabel>Setting</OLabel>
        <div className="flex flex-wrap gap-sm">
          {SETTINGS.map((s) => (
            <PillButton key={s.id} active={setting === s.id} onClick={() => onSetting(s.id)}>
              {s.label}
            </PillButton>
          ))}
        </div>
      </div>
    </div>
  );
}

function AiCompanionPanel({ hints }: { hints: string[] }) {
  return (
    <aside className="hidden lg:block sticky top-[120px]">
      <div className="bg-surface-raised rounded-lg border border-border-subtle p-lg">
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-md">
          Thinking with you
        </p>
        <div className="flex flex-col gap-sm">
          {hints.map((hint, i) => (
            <div key={i} className="bg-surface-panel rounded-md border border-border-subtle p-md">
              <p className="font-serif text-sm text-text-secondary">{hint}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function ModulePreviewCard({ title, subjects, approaches }: { title: string; subjects: string[]; approaches: { title: string; activities: { title: string }[] }[] }) {
  return (
    <div className="relative overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-card">
      <div className="absolute left-0 right-0 top-0 h-[2px] bg-ember opacity-70" />
      <div className="mb-sm flex flex-wrap gap-xs">
        {subjects.slice(0, 3).map((s) => (
          <span key={s} className="rounded-full bg-surface-raised px-sm py-[2px] font-sans text-[10px] font-semibold text-text-muted capitalize">{s}</span>
        ))}
      </div>
      <h3 className="font-serif text-lg font-semibold text-text-primary mb-xs">{title || 'Untitled Module'}</h3>
      <p className="font-sans text-xs text-text-muted mb-md">{approaches.length} approach{approaches.length !== 1 ? 'es' : ''} · {approaches.reduce((n, a) => n + (a.activities?.length ?? 0), 0)} activities</p>
      <div className="space-y-xs">
        {approaches.slice(0, 2).map((a, i) => (
          <div key={i} className="rounded-md bg-surface-raised px-md py-xs border border-border-subtle">
            <p className="font-serif text-sm text-text-secondary">{a.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SavedView({ outcome, onBack, preview }: { outcome: SaveOutcome; onBack: () => void; preview?: { title: string; subjects: string[]; approaches: { title: string; activities: { title: string }[] }[] } }) {
  const [showPreview, setShowPreview] = useState(false);
  const published = outcome === 'published';

  return (
    <div className="flex flex-col items-center gap-lg py-2xl text-center max-w-xl mx-auto">
      <span className={published ? 'inline-flex text-sage' : 'inline-flex text-text-secondary'} aria-hidden="true">
        {published ? <CheckCircle size={32} /> : <ClipboardText size={32} />}
      </span>
      <h2 className="font-serif text-xl font-semibold text-text-primary">
        {published ? 'Module published' : 'Draft saved'}
      </h2>
      {published ? (
        <p className="font-serif text-text-secondary">
          Your module has been saved and published to your family library. It&apos;s available to facilitate now.
        </p>
      ) : (
        <p className="font-serif text-text-secondary">
          Your draft is safe — it hasn&apos;t been published to your library yet. Pick it up any time under{' '}
          <strong>Continue where you left off</strong> on the builder home.
        </p>
      )}
      {published && (
        <Link
          href="/library"
          className="font-sans text-sm font-semibold text-ember hover:underline underline-offset-2 transition-colors duration-[var(--motion-quick)]"
        >
          View it in your library
        </Link>
      )}

      {preview && (
        <div className="w-full">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="font-sans text-sm text-ember hover:underline mb-md transition-colors"
          >
            {showPreview ? '▼ Hide preview' : '▶ Show preview'}
          </button>
          {showPreview && (
            <div className="text-left">
              <ModulePreviewCard {...preview} />
            </div>
          )}
        </div>
      )}

      <button
        onClick={onBack}
        className="font-sans text-sm font-semibold text-ember border border-ember rounded-md px-md py-sm min-h-[44px] transition duration-[var(--motion-quick)] ease-[var(--ease-default)]"
      >
        Back to pathways
      </button>
    </div>
  );
}

function FormActions({
  saving,
  onDraft,
  onContinue,
  continueLabel,
}: {
  saving: boolean;
  onDraft: () => void;
  onContinue: () => void;
  continueLabel?: string;
}) {
  return (
    <div className="flex gap-md pt-sm border-t border-border-subtle">
      <button
        type="button"
        onClick={onDraft}
        disabled={saving}
        className="flex-1 font-sans text-sm font-semibold text-ember border border-ember rounded-md min-h-[44px] px-lg transition duration-[var(--motion-quick)] disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save as draft'}
      </button>
      <button
        type="button"
        onClick={onContinue}
        disabled={saving}
        className="hearth-press flex-1 font-sans text-sm font-semibold text-text-inverse bg-ember rounded-md min-h-[44px] px-lg shadow-ember disabled:opacity-50"
      >
        {saving ? 'Saving…' : (continueLabel ?? 'Continue')}
      </button>
    </div>
  );
}

type SaveOutcome = 'draft' | 'published';

interface SaveDraftResult { ok: boolean; id: string | null }

async function saveDraft(
  pathway: string,
  draftData: unknown,
  status: 'draft' | 'complete',
  opts: { id?: string | null; enrich?: boolean } = {},
): Promise<SaveDraftResult> {
  try {
    const res = await fetch('/api/modules/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pathway,
        draftData,
        status,
        ...(opts.id ? { id: opts.id } : {}),
        ...(opts.enrich === undefined ? {} : { enrich: opts.enrich }),
      }),
    });
    if (!res.ok) return { ok: false, id: null };
    const draft = await res.json().catch(() => null);
    return { ok: true, id: draft?.id ?? null };
  } catch {
    return { ok: false, id: null };
  }
}

type PublishResult = { ok: true } | { ok: false; message: string };

async function publishEditData(data: SharedEditData): Promise<PublishResult> {
  const built = buildModulePublishPayload(data);
  if (!built.ok) {
    return { ok: false, message: `Still needed before this can publish: ${built.missing.join(', ')}.` };
  }
  try {
    const res = await fetch('/api/modules/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(built.payload),
    });
    if (!res.ok) {
      return { ok: false, message: 'Hearth couldn’t publish your module just now. Your work is safe — try again in a moment.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'You look offline. Your work is safe — try again once you’re back online.' };
  }
}

// ── Autosave (localStorage safety net for the editor) ─────────────────────

const AUTOSAVE_KEY = 'hearth:module-builder:autosave';

interface AutosaveSnapshot { form: SharedEditData; draftId: string | null; savedAt: number }

function readAutosave(): AutosaveSnapshot | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AutosaveSnapshot;
    if (!parsed || typeof parsed !== 'object' || !parsed.form || typeof parsed.form !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearAutosave() {
  try { localStorage.removeItem(AUTOSAVE_KEY); } catch { /* best-effort */ }
}

// ── Cross-Path Redirect Nudge ─────────────────────────────────────────────

const RESOURCE_KEYWORDS = ['book', 'video', 'kit', 'app', 'youtube', 'documentary', 'podcast', 'website', 'game', 'lego', 'minecraft'];
const QUESTION_KEYWORDS = ['why', 'how', 'what if', 'what would', 'wonder', 'curious', 'asked', 'question'];
const GOAL_KEYWORDS = ['want them to', 'learn to', 'get better at', 'develop', 'improve', 'skill', 'capability', 'goal'];
const PROCESS_KEYWORDS = ['steps', 'first we', 'then we', 'recipe', 'procedure', 'instructions', 'build', 'make', 'cook'];

type NudgeSuggestion = { pathway: Pathway; label: string; reason: string } | null;

function detectCrossPathNudge(currentPathway: Pathway, text: string): NudgeSuggestion {
  const lower = text.toLowerCase();
  if (!lower || lower.length < 15) return null;

  if (currentPathway !== 'material' && RESOURCE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { pathway: 'material', label: 'Material-Anchored', reason: 'Sounds like you have a resource in mind' };
  }
  if (currentPathway !== 'inquiry' && QUESTION_KEYWORDS.some((kw) => lower.includes(kw))) {
    const questionMarks = (text.match(/\?/g) || []).length;
    if (questionMarks > 0 || QUESTION_KEYWORDS.filter((kw) => lower.includes(kw)).length >= 2) {
      return { pathway: 'inquiry', label: 'Inquiry', reason: 'This sounds like a question to explore' };
    }
  }
  if (currentPathway !== 'understanding' && GOAL_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { pathway: 'understanding', label: 'Goal-Forward', reason: 'Sounds like a learning target' };
  }
  if (currentPathway !== 'process' && PROCESS_KEYWORDS.filter((kw) => lower.includes(kw)).length >= 2) {
    return { pathway: 'process', label: 'Process', reason: 'Sounds like you know the steps already' };
  }
  return null;
}

function CrossPathNudge({
  suggestion,
  onSwitch,
}: {
  suggestion: NudgeSuggestion;
  onSwitch: (pathway: Pathway) => void;
}) {
  if (!suggestion) return null;
  return (
    <div className="rounded-md border border-ember/20 bg-ember-glow/30 px-md py-sm flex items-center justify-between gap-md">
      <p className="font-sans text-xs text-text-secondary">
        <span className="text-ember font-semibold">Hmm —</span> {suggestion.reason}.{' '}
        <button
          type="button"
          onClick={() => onSwitch(suggestion.pathway)}
          className="text-ember font-semibold underline underline-offset-2 transition-colors hover:text-ember-hover"
        >
          Try {suggestion.label} pathway?
        </button>
      </p>
    </div>
  );
}

// ── Module Preview ───────────────────────────────────────────────────────

function ModulePreview({
  data,
  onBack,
  onPublish,
  saving,
  error,
}: {
  data: SharedEditData;
  onBack: () => void;
  onPublish: () => void;
  saving: boolean;
  error?: string | null;
}) {
  const provenanceType = data.provenance.type as string | undefined;
  const blockers = publishBlockers(data);

  return (
    <div className="flex flex-col gap-lg max-w-2xl mx-auto">
      <div className="flex items-center gap-sm">
        <button onClick={onBack} className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-[var(--motion-quick)]">
          <span className="inline-flex items-center gap-xs"><ArrowLeft size={14} aria-hidden="true" /> Back to editing</span>
        </button>
      </div>

      <div>
        <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ember mb-xs">
          Preview
        </p>
        <h2 className="font-serif text-xl font-semibold text-text-primary">
          Review before publishing
        </h2>
        <p className="font-serif text-sm text-text-secondary mt-xs">
          Publishing adds this module to your family library, ready to facilitate.
        </p>
      </div>

      {/* Module card preview */}
      <div className="bg-surface-panel rounded-lg border border-border-subtle shadow-card p-xl">
        <h3 className="font-serif text-lg font-semibold text-text-primary mb-sm">
          {data.title || 'Untitled module'}
        </h3>

        {data.targetUnderstanding && (
          <p className="font-serif text-sm italic text-text-secondary mb-md leading-relaxed">
            {data.targetUnderstanding}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-md mb-md">
          {data.subjects.length > 0 && (
            <div className="flex flex-wrap gap-xs">
              {data.subjects.map((s) => (
                <span key={s} className="font-sans text-xs rounded-full px-sm py-xs border border-border-subtle bg-surface-raised text-text-secondary">
                  {s}
                </span>
              ))}
            </div>
          )}
          {data.duration && (
            <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted"><Timer size={12} aria-hidden="true" /> {data.duration}</span>
          )}
          {data.setting && data.setting !== 'either' && (
            <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted">
              {data.setting === 'indoor' ? <HouseLine size={12} aria-hidden="true" /> : <Tree size={12} aria-hidden="true" />}
              {data.setting}
            </span>
          )}
          {data.ageRange && (
            <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted"><BabyCarriage size={12} aria-hidden="true" /> {data.ageRange}</span>
          )}
        </div>

        {/* Steps */}
        {data.steps.length > 0 && (
          <div className="mb-md">
            <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-sm">
              Steps ({data.steps.length})
            </p>
            <div className="flex flex-col gap-xs">
              {data.steps.map((step, idx) => (
                <div key={step.id} className="flex gap-sm bg-surface-raised rounded-md border border-border-subtle p-sm">
                  <span className="font-sans text-xs font-semibold text-text-muted shrink-0 mt-[2px]">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-text-primary font-semibold">{step.title}</p>
                    {step.instructions && (
                      <p className="font-serif text-sm text-text-secondary mt-xs leading-relaxed">{step.instructions}</p>
                    )}
                    {step.observationHint && (
                      <p className="font-sans text-xs text-text-muted italic mt-xs">Watch for: {step.observationHint}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Watch-for / Pivot */}
        <div className="flex flex-col sm:flex-row gap-md mb-md">
          {data.watchFor && (
            <div className="flex-1 bg-sage/5 rounded-md border border-sage/20 p-sm">
              <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-sage mb-xs">Watch for</p>
              <p className="font-serif text-sm text-text-secondary">{data.watchFor}</p>
            </div>
          )}
          {data.pivot && (
            <div className="flex-1 bg-ember-glow/20 rounded-md border border-ember/20 p-sm">
              <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ember mb-xs">Pivot</p>
              <p className="font-serif text-sm text-text-secondary">{data.pivot}</p>
            </div>
          )}
        </div>

        {/* Capabilities */}
        {data.capabilities.length > 0 && (
          <div className="mb-md">
            <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-sm">Capabilities</p>
            <div className="flex flex-wrap gap-sm">
              {data.capabilities.map((cap) => {
                const thread = CAPABILITY_THREADS.find((t) => t.id === cap.threadId);
                return (
                  <span key={cap.threadId} className="rounded-full bg-sage/10 border border-sage/30 px-sm py-[3px] font-sans text-xs text-sage">
                    {thread?.name ?? cap.threadId}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Provenance */}
        {provenanceType && (
          <div className="border-t border-border-subtle pt-sm mt-sm">
            <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
              Source: {PROVENANCE_LABELS[provenanceType] ?? provenanceType}
            </p>
          </div>
        )}

        {/* Publish blockers */}
        {blockers.length > 0 && (
          <div className="mt-md rounded-md border border-ember/20 bg-ember-glow/20 p-sm">
            <p className="font-sans text-xs text-text-secondary">
              <span className="text-ember font-semibold">Almost there:</span> this module still needs{' '}
              {blockers.join(', ')} before it can publish. Go back to editing to add{' '}
              {blockers.length === 1 ? 'it' : 'them'}, or save a draft from there and AI will suggest content for the blanks.
            </p>
          </div>
        )}
      </div>

      {error && <p className="font-sans text-sm text-red-400">{error}</p>}

      {/* Actions */}
      <div className="flex gap-md pt-sm border-t border-border-subtle">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 font-sans text-sm font-semibold text-ember border border-ember rounded-md min-h-[44px] px-lg transition duration-[var(--motion-quick)]"
        >
          <span className="inline-flex items-center gap-xs"><ArrowLeft size={14} aria-hidden="true" /> Edit</span>
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={saving || blockers.length > 0}
          className="flex-1 font-sans text-sm font-semibold text-text-inverse bg-ember rounded-md min-h-[44px] px-lg shadow-ember transition duration-[var(--motion-quick)] disabled:opacity-50"
        >
          {saving ? 'Publishing…' : 'Publish module'}
        </button>
      </div>
    </div>
  );
}

// ── Shared Editing View ───────────────────────────────────────────────────

const PROVENANCE_LABELS: Record<string, string> = {
  sourceResource: 'Source Resource',
  sourceQuestion: 'Driving Question',
  sourceLogs: 'Lifted from Logs',
  sourceGoal: 'Learning Target',
  sourceCapability: 'Capability Target',
};

function SharedEditView({
  initialData,
  initialDraftId = null,
  onBack,
  onSaved,
}: {
  initialData: SharedEditData;
  initialDraftId?: string | null;
  onBack: () => void;
  onSaved: (outcome: SaveOutcome) => void;
}) {
  const [form, setForm] = useState(initialData);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  // Debounced autosave: in-progress work survives navigating away even when
  // the parent never presses a save button. Cleared on save or publish. The
  // first run is skipped so merely opening the editor doesn't spawn a
  // recovery banner for content the parent never touched.
  const autosaveArmed = useRef(false);
  useEffect(() => {
    if (!autosaveArmed.current) { autosaveArmed.current = true; return; }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ form, draftId, savedAt: Date.now() }));
      } catch { /* storage unavailable — autosave is best-effort */ }
    }, 800);
    return () => clearTimeout(t);
  }, [form, draftId]);

  function addStep() {
    const id = `step-${Date.now()}`;
    setForm((f) => ({
      ...f,
      steps: [...f.steps, { id, title: `Step ${f.steps.length + 1}`, instructions: '', observationHint: '' }],
    }));
  }

  function updateStep(id: string, field: keyof ModuleStep, value: string) {
    setForm((f) => ({
      ...f,
      steps: f.steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  }

  function removeStep(id: string) {
    setForm((f) => ({
      ...f,
      steps: f.steps.filter((s) => s.id !== id),
    }));
  }

  function moveStep(idx: number, direction: -1 | 1) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= form.steps.length) return;
    setForm((f) => {
      const steps = [...f.steps];
      [steps[idx], steps[newIdx]] = [steps[newIdx], steps[idx]];
      return { ...f, steps };
    });
  }

  const toggleSubject = (s: string) =>
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s],
    }));

  const handleSaveDraft = async () => {
    if (!form.title.trim()) { setError('Module title is required.'); return; }
    setSaving(true); setError(null);
    // enrich: true — AI fills any blank fields on the stored draft so they're
    // waiting as suggestions when the parent resumes it.
    const res = await saveDraft(form.pathway, { ...form }, 'draft', { id: draftId, enrich: true });
    setSaving(false);
    if (res.ok) {
      if (res.id) setDraftId(res.id);
      clearAutosave();
      onSaved('draft');
    } else {
      setError('Your draft couldn’t be saved. Check your connection and try again — your work is still here.');
    }
  };

  const handlePublishFromPreview = async () => {
    setSaving(true); setError(null);
    const published = await publishEditData(form);
    if (!published.ok) {
      setSaving(false);
      setError(published.message);
      return; // stay in preview so the parent can retry or go back and fix
    }
    // Bookkeeping: mark the backing draft complete so it leaves the resume
    // list. The module is already live — never fail the publish UX on this.
    await saveDraft(form.pathway, { ...form }, 'complete', { id: draftId, enrich: false });
    clearAutosave();
    setSaving(false);
    onSaved('published');
  };

  if (previewing) {
    return (
      <ModulePreview
        data={form}
        onBack={() => { setError(null); setPreviewing(false); }}
        onPublish={handlePublishFromPreview}
        saving={saving}
        error={error}
      />
    );
  }

  const provenanceType = form.provenance.type as string | undefined;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <div className="flex items-center gap-sm">
          <button onClick={onBack} className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-[var(--motion-quick)]">
            <span className="inline-flex items-center gap-xs"><ArrowLeft size={14} aria-hidden="true" /> Back to entry</span>
          </button>
          <span className="text-text-muted font-sans text-sm">/</span>
          <span className="font-sans text-sm text-text-secondary">Edit module</span>
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">Shape your module</h2>
          <p className="font-serif text-sm text-text-secondary">
            Review and refine what Hearth has pre-populated. Edit anything — this is your module.
          </p>
        </div>

        {/* Provenance context */}
        {provenanceType && (
          <div className="bg-surface-raised/50 rounded-lg border border-border-subtle p-md">
            <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
              {PROVENANCE_LABELS[provenanceType] ?? 'Source'}
            </p>
            {provenanceType === 'sourceResource' && (
              <p className="font-serif text-sm text-text-secondary">
                {String(form.provenance.resourceType)} — {String(form.provenance.resourceName)}
                {form.provenance.excitement ? (
                  <span className="block mt-xs text-text-muted italic">&ldquo;{String(form.provenance.excitement)}&rdquo;</span>
                ) : null}
              </p>
            )}
            {provenanceType === 'sourceQuestion' && (
              <p className="font-serif text-sm text-text-secondary italic">&ldquo;{form.provenance.question as string}&rdquo;</p>
            )}
            {provenanceType === 'sourceLogs' && (
              <p className="font-serif text-sm text-text-secondary">
                Built from {(form.provenance.entryIds as string[])?.length ?? 0} logged entries in {form.provenance.subject as string}
              </p>
            )}
            {provenanceType === 'sourceGoal' && (
              <p className="font-serif text-sm text-text-secondary">{form.provenance.goal as string}</p>
            )}
            {provenanceType === 'sourceCapability' && (
              <p className="font-serif text-sm text-text-secondary">
                {form.provenance.threadName as string} — targeting {form.provenance.targetTier as string}
              </p>
            )}
          </div>
        )}

        {/* Module title */}
        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">Module title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Give this module a name"
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-base text-text-primary placeholder:text-text-muted outline-none transition duration-[var(--motion-quick)] focus:border-ember focus:shadow-focus"
          />
        </div>

        {/* Target understanding */}
        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
            What will they understand? <span className="text-ember">*</span>
          </label>
          <textarea
            value={form.targetUnderstanding}
            onChange={(e) => setForm((f) => ({ ...f, targetUnderstanding: e.target.value }))}
            placeholder="The key understanding this module develops — required for publishing."
            rows={2}
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition duration-[var(--motion-quick)] focus:border-ember focus:shadow-focus"
          />
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-sm">
            <OLabel>Steps</OLabel>
            <button
              type="button"
              onClick={addStep}
              className="font-sans text-xs font-semibold text-ember transition-colors hover:text-ember-hover"
            >
              + Add step
            </button>
          </div>

          {form.steps.length === 0 && (
            <div className="rounded-md border border-dashed border-border-subtle bg-surface-raised/30 p-md text-center">
              <p className="font-sans text-xs text-text-muted">No steps yet. Add one above, or save as a draft and AI will suggest some for you to review.</p>
            </div>
          )}

          <div className="flex flex-col gap-sm">
            {form.steps.map((step, idx) => (
              <div key={step.id} className="bg-surface-raised rounded-md border border-border-subtle p-sm">
                <div className="flex items-center justify-between mb-xs">
                  <div className="flex items-center gap-xs">
                    <button
                      type="button"
                      onClick={() => moveStep(idx, -1)}
                      disabled={idx === 0}
                      className="font-sans text-xs text-text-muted disabled:opacity-30 hover:text-text-secondary"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(idx, 1)}
                      disabled={idx === form.steps.length - 1}
                      className="font-sans text-xs text-text-muted disabled:opacity-30 hover:text-text-secondary"
                    >
                      ↓
                    </button>
                    <span className="font-sans text-[11px] font-semibold text-text-muted">{idx + 1}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStep(step.id)}
                    className="font-sans text-xs text-text-muted hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                  placeholder="Step title"
                  className="w-full bg-transparent border-b border-border-subtle mb-xs pb-xs font-sans text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-ember"
                />
                <textarea
                  value={step.instructions}
                  onChange={(e) => updateStep(step.id, 'instructions', e.target.value)}
                  placeholder="Instructions..."
                  rows={2}
                  className="w-full bg-transparent font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed"
                />
                <input
                  type="text"
                  value={step.observationHint}
                  onChange={(e) => updateStep(step.id, 'observationHint', e.target.value)}
                  placeholder="Watch for... (optional)"
                  className="w-full bg-transparent border-t border-border-subtle mt-xs pt-xs font-sans text-xs text-text-muted placeholder:text-text-muted outline-none focus:text-text-secondary"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Watch-for + Pivot */}
        <div className="flex flex-col sm:flex-row gap-md">
          <div className="flex-1">
            <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">Watch for</label>
            <textarea
              value={form.watchFor}
              onChange={(e) => setForm((f) => ({ ...f, watchFor: e.target.value }))}
              placeholder="What moments of understanding should you look for?"
              rows={2}
              className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition duration-[var(--motion-quick)] focus:border-ember"
            />
          </div>
          <div className="flex-1">
            <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">Pivot if needed</label>
            <textarea
              value={form.pivot}
              onChange={(e) => setForm((f) => ({ ...f, pivot: e.target.value }))}
              placeholder="If things go sideways, what's a good redirect?"
              rows={2}
              className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition duration-[var(--motion-quick)] focus:border-ember"
            />
          </div>
        </div>

        {/* Settings */}
        <QuickSettings
          duration={form.duration}
          setting={form.setting}
          onDuration={(v) => setForm((f) => ({ ...f, duration: v }))}
          onSetting={(v) => setForm((f) => ({ ...f, setting: v }))}
        />

        {/* Subjects */}
        <div>
          <OLabel>Subject areas</OLabel>
          <div className="flex flex-wrap gap-sm">
            {SUBJECT_TAGS.map((s) => (
              <PillButton key={s} active={form.subjects.includes(s)} onClick={() => toggleSubject(s)}>{s}</PillButton>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        {form.capabilities.length > 0 && (
          <div>
            <OLabel>Mapped capabilities</OLabel>
            <div className="flex flex-wrap gap-sm">
              {form.capabilities.map((cap) => {
                const thread = CAPABILITY_THREADS.find((t) => t.id === cap.threadId);
                return (
                  <span key={cap.threadId} className="rounded-full bg-sage/10 border border-sage/30 px-sm py-[3px] font-sans text-xs text-sage">
                    {thread?.name ?? cap.threadId} ({cap.confidence})
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="font-sans text-sm text-red-400">{error}</p>}

        <FormActions
          saving={saving}
          onDraft={handleSaveDraft}
          onContinue={() => {
            if (!form.title.trim()) { setError('Module title is required.'); return; }
            if (!form.targetUnderstanding.trim()) { setError('Target understanding is required before preview. What will the child understand?'); return; }
            setPreviewing(true);
          }}
          continueLabel="Preview & publish"
        />
      </div>

      <AiCompanionPanel hints={[
        'Save as a draft and AI quietly fills any blanks — review its suggestions when you pick the draft back up.',
        'Steps are optional in a draft, but a module needs at least one step before it can publish.',
        'Watch-for hints help you know when learning is happening.',
      ]} />
    </div>
  );
}

// ── Material-Anchored Pathway ──────────────────────────────────────────────

interface MaterialDraft {
  resourceType: string;
  resourceName: string;
  excitement: string;
  usageIntents: string[];
  ageRange: string;
  subjects: string[];
}

function MaterialPathwayForm({ onBack, onSwitchPathway }: { onBack: () => void; onSwitchPathway: (p: Pathway) => void }) {
  const [form, setForm] = useState<MaterialDraft>({
    resourceType: '',
    resourceName: '',
    excitement: '',
    usageIntents: [],
    ageRange: '',
    subjects: [],
  });
  const [saving, setSaving] = useState(false);
  const [savedOutcome, setSavedOutcome] = useState<SaveOutcome | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SharedEditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nudge = detectCrossPathNudge('material', form.excitement);

  const toggleSubject = (subject: string) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(subject)
        ? f.subjects.filter((s) => s !== subject)
        : [...f.subjects, subject],
    }));
  };

  const handleSave = async (status: 'draft' | 'complete') => {
    if (!form.resourceName.trim()) { setError('Resource name is required.'); return; }
    if (status === 'complete') {
      setEditing(normalizeToEditData('material', form as unknown as Record<string, unknown>));
      return;
    }
    setSaving(true); setError(null);
    const res = await saveDraft('material', form, status, { id: draftId });
    setSaving(false);
    if (res.ok) { if (res.id) setDraftId(res.id); setSavedOutcome('draft'); }
    else setError('Something went wrong. Please try again.');
  };

  if (savedOutcome) return <SavedView outcome={savedOutcome} onBack={onBack} />;
  if (editing) return <SharedEditView initialData={editing} initialDraftId={draftId} onBack={() => setEditing(null)} onSaved={setSavedOutcome} />;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <PathwayHeader Icon={BookOpen} name="Material-Anchored" subtitle="Start with what you have — a book, video, kit, place, or anything that sparked your interest." onBack={onBack} />

        <div>
          <OLabel>What type of resource?</OLabel>
          <div className="flex flex-wrap gap-sm">
            {RESOURCE_TYPES.map((rt) => (
              <PillButton key={rt.id} active={form.resourceType === rt.id} onClick={() => setForm((f) => ({ ...f, resourceType: rt.id }))}>
                <span className="inline-flex items-center gap-xs"><rt.Icon size={14} aria-hidden="true" /> {rt.label}</span>
              </PillButton>
            ))}
          </div>
        </div>

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">Resource name</label>
          <input
            type="text"
            value={form.resourceName}
            onChange={(e) => setForm((f) => ({ ...f, resourceName: e.target.value }))}
            placeholder="e.g. The Secret Garden, Planet Earth II, LEGO Mindstorms..."
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition duration-[var(--motion-quick)] focus:border-ember focus:shadow-focus"
          />
        </div>

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">What excites you about this?</label>
          <textarea
            value={form.excitement}
            onChange={(e) => setForm((f) => ({ ...f, excitement: e.target.value }))}
            placeholder="What drew you to this resource? What do you hope your learner will get from it?"
            rows={3}
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition duration-[var(--motion-quick)] focus:border-ember focus:shadow-focus"
          />
        </div>

        <div>
          <OLabel>How do you imagine using it?</OLabel>
          <p className="font-sans text-[11px] text-text-muted mb-sm -mt-xs">Pick 1–3 that feel right</p>
          <div className="flex flex-wrap gap-sm">
            {USAGE_INTENTS.map((intent) => (
              <PillButton
                key={intent.id}
                active={form.usageIntents.includes(intent.id)}
                onClick={() => setForm((f) => ({
                  ...f,
                  usageIntents: f.usageIntents.includes(intent.id)
                    ? f.usageIntents.filter((x) => x !== intent.id)
                    : f.usageIntents.length < 3 ? [...f.usageIntents, intent.id] : f.usageIntents,
                }))}
              >
                <span className="inline-flex items-center gap-xs"><intent.Icon size={14} aria-hidden="true" /> {intent.label}</span>
              </PillButton>
            ))}
          </div>
        </div>

        <div>
          <OLabel>Age range</OLabel>
          <div className="flex flex-wrap gap-sm">
            {AGE_RANGES.map((age) => (
              <PillButton key={age} active={form.ageRange === age} onClick={() => setForm((f) => ({ ...f, ageRange: age }))}>
                {age}
              </PillButton>
            ))}
          </div>
        </div>

        <div>
          <OLabel>Subject areas</OLabel>
          <div className="flex flex-wrap gap-sm">
            {SUBJECT_TAGS.map((subject) => (
              <PillButton key={subject} active={form.subjects.includes(subject)} onClick={() => toggleSubject(subject)}>
                {subject}
              </PillButton>
            ))}
          </div>
        </div>

        <CrossPathNudge suggestion={nudge} onSwitch={onSwitchPathway} />
        {error && <p className="font-sans text-sm text-red-400">{error}</p>}

        <FormActions saving={saving} onDraft={() => handleSave('draft')} onContinue={() => handleSave('complete')} />
      </div>

      <AiCompanionPanel hints={[
        'Start with what excites you. The curriculum will follow.',
        'Add subject areas to help Hearth surface related activities.',
        'You can save a draft and come back — nothing is lost.',
      ]} />
    </div>
  );
}

// ── Process Pathway ────────────────────────────────────────────────────────

interface ProcessDraft {
  activityName: string;
  whatHappens: string;
  duration: string;
  setting: string;
  hasProduct: boolean;
  productName: string;
  subjects: string[];
  ageRange: string;
}

function ProcessPathwayForm({ onBack, onSwitchPathway }: { onBack: () => void; onSwitchPathway: (p: Pathway) => void }) {
  const [form, setForm] = useState<ProcessDraft>({
    activityName: '',
    whatHappens: '',
    duration: '',
    setting: 'either',
    hasProduct: false,
    productName: '',
    subjects: [],
    ageRange: '',
  });
  const [saving, setSaving] = useState(false);
  const [savedOutcome, setSavedOutcome] = useState<SaveOutcome | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SharedEditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nudge = detectCrossPathNudge('process', form.whatHappens);
  const showResourceNudge = /\b(book|read|watch|video|documentary|podcast|resource)\b/i.test(form.activityName);

  const toggleSubject = (s: string) =>
    setForm((f) => ({ ...f, subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s] }));

  const handleSave = async (status: 'draft' | 'complete') => {
    if (!form.activityName.trim()) { setError('Activity name is required.'); return; }
    if (status === 'complete') {
      setEditing(normalizeToEditData('process', form as unknown as Record<string, unknown>));
      return;
    }
    setSaving(true); setError(null);
    const res = await saveDraft('process', form, status, { id: draftId });
    setSaving(false);
    if (res.ok) { if (res.id) setDraftId(res.id); setSavedOutcome('draft'); }
    else setError('Something went wrong. Please try again.');
  };

  if (savedOutcome) {
    const preview = {
      title: form.activityName,
      subjects: form.subjects,
      approaches: [{ title: 'Process', activities: [{ title: form.activityName }] }],
    };
    return <SavedView outcome={savedOutcome} onBack={onBack} preview={preview} />;
  }
  if (editing) return <SharedEditView initialData={editing} initialDraftId={draftId} onBack={() => setEditing(null)} onSaved={setSavedOutcome} />;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <PathwayHeader Icon={Wrench} name="Process" subtitle="You already know what to do — capture it as a reusable module." onBack={onBack} />

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">Activity name</label>
          <input
            type="text"
            value={form.activityName}
            onChange={(e) => setForm((f) => ({ ...f, activityName: e.target.value }))}
            placeholder="e.g. Building a birdhouse, Sourdough bread, Nature journalling..."
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition duration-[var(--motion-quick)] focus:border-ember focus:shadow-focus"
          />
        </div>

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">What happens in this activity?</label>
          <textarea
            value={form.whatHappens}
            onChange={(e) => setForm((f) => ({ ...f, whatHappens: e.target.value }))}
            placeholder="Describe what you do, step by step or in broad strokes. The learning spine will emerge from this."
            rows={4}
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition duration-[var(--motion-quick)] focus:border-ember focus:shadow-focus"
          />
        </div>

        <QuickSettings
          duration={form.duration}
          setting={form.setting}
          onDuration={(v) => setForm((f) => ({ ...f, duration: v }))}
          onSetting={(v) => setForm((f) => ({ ...f, setting: v }))}
        />

        {/* Finished product toggle */}
        <div>
          <div className="flex items-center gap-md">
            <OLabel>Is there a finished product?</OLabel>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, hasProduct: !f.hasProduct }))}
              className={`hit-target relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors duration-[var(--motion-quick)] ${
                form.hasProduct ? 'bg-ember border-ember' : 'bg-surface-hover border-border-medium'
              }`}
              role="switch"
              aria-checked={form.hasProduct}
            >
              <span
                className={`hearth-switch-knob pointer-events-none inline-block h-4 w-4 rounded-full bg-text-primary shadow ring-0 mt-[1px] ${
                  form.hasProduct ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {form.hasProduct && (
            <input
              type="text"
              value={form.productName}
              onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
              placeholder="e.g. A painted birdhouse, a loaf of bread..."
              className="mt-sm w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition duration-[var(--motion-quick)] focus:border-ember"
            />
          )}
        </div>

        <div>
          <OLabel>Subject areas</OLabel>
          <div className="flex flex-wrap gap-sm">
            {SUBJECT_TAGS.map((s) => (
              <PillButton key={s} active={form.subjects.includes(s)} onClick={() => toggleSubject(s)}>{s}</PillButton>
            ))}
          </div>
        </div>

        <div>
          <OLabel>Age range</OLabel>
          <div className="flex flex-wrap gap-sm">
            {AGE_RANGES.map((age) => (
              <PillButton key={age} active={form.ageRange === age} onClick={() => setForm((f) => ({ ...f, ageRange: age }))}>{age}</PillButton>
            ))}
          </div>
        </div>

        {showResourceNudge && (
          <div className="mt-sm rounded-md border border-border-subtle bg-surface-raised px-md py-sm flex items-center justify-between gap-md">
            <p className="font-serif text-sm text-text-secondary italic">
              Sounds like a resource — try the <strong>Inquiry pathway</strong> for resource-led learning.
            </p>
            <button
              onClick={() => onSwitchPathway('inquiry')}
              className="shrink-0 font-sans text-xs text-ember hover:underline"
            >
              Switch
            </button>
          </div>
        )}

        <CrossPathNudge suggestion={nudge} onSwitch={onSwitchPathway} />
        {error && <p className="font-sans text-sm text-red-400">{error}</p>}

        <FormActions saving={saving} onDraft={() => handleSave('draft')} onContinue={() => handleSave('complete')} continueLabel="Capture the steps" />
      </div>

      <AiCompanionPanel hints={[
        'Describe what happens first. We\'ll surface the learning in it.',
        'Even simple activities teach — don\'t undersell what you already do.',
        'Add a finished product if there\'s something to show at the end.',
      ]} />
    </div>
  );
}

// ── Inquiry Pathway ────────────────────────────────────────────────────────

interface InquiryDraft {
  question: string;
  priorKnowledge: string;
  investigationTypes: string[];
  duration: string;
  setting: string;
  subjects: string[];
}

function InquiryPathwayForm({ onBack, onSwitchPathway }: { onBack: () => void; onSwitchPathway: (p: Pathway) => void }) {
  const [form, setForm] = useState<InquiryDraft>({
    question: '',
    priorKnowledge: '',
    investigationTypes: [],
    duration: '',
    setting: 'either',
    subjects: [],
  });
  const [saving, setSaving] = useState(false);
  const [savedOutcome, setSavedOutcome] = useState<SaveOutcome | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SharedEditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nudge = detectCrossPathNudge('inquiry', form.question + ' ' + form.priorKnowledge);
  const showGoalNudge = form.question.length < 10 && form.priorKnowledge.length > 50;

  const toggleType = (id: string) =>
    setForm((f) => ({ ...f, investigationTypes: f.investigationTypes.includes(id) ? f.investigationTypes.filter((x) => x !== id) : [...f.investigationTypes, id] }));

  const toggleSubject = (s: string) =>
    setForm((f) => ({ ...f, subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s] }));

  const handleSave = async (status: 'draft' | 'complete') => {
    if (!form.question.trim()) { setError('The question is required.'); return; }
    if (status === 'complete') {
      setEditing(normalizeToEditData('inquiry', form as unknown as Record<string, unknown>));
      return;
    }
    setSaving(true); setError(null);
    const res = await saveDraft('inquiry', form, status, { id: draftId });
    setSaving(false);
    if (res.ok) { if (res.id) setDraftId(res.id); setSavedOutcome('draft'); }
    else setError('Something went wrong. Please try again.');
  };

  if (savedOutcome) {
    const preview = {
      title: form.question,
      subjects: form.subjects,
      approaches: [{ title: 'Inquiry', activities: [{ title: form.question }] }],
    };
    return <SavedView outcome={savedOutcome} onBack={onBack} preview={preview} />;
  }
  if (editing) return <SharedEditView initialData={editing} initialDraftId={draftId} onBack={() => setEditing(null)} onSaved={setSavedOutcome} />;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <PathwayHeader Icon={SealQuestion} name="Inquiry" subtitle="Start with curiosity and design an investigation." onBack={onBack} />

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
            The question
          </label>
          <input
            type="text"
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            placeholder="e.g. Why do leaves change colour in autumn?"
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-base text-text-primary placeholder:text-text-muted outline-none transition duration-[var(--motion-quick)] focus:border-ember focus:shadow-focus"
          />
          <p className="font-sans text-[11px] text-text-muted mt-xs">Use their exact words if you remember them</p>
        </div>

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
            What do you already know or think about this?
          </label>
          <textarea
            value={form.priorKnowledge}
            onChange={(e) => setForm((f) => ({ ...f, priorKnowledge: e.target.value }))}
            placeholder="Starting from what you know helps shape the exploration — even guesses count."
            rows={3}
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition duration-[var(--motion-quick)] focus:border-ember focus:shadow-focus"
          />
        </div>

        <div>
          <OLabel>How might you explore this?</OLabel>
          <p className="font-sans text-[11px] text-text-muted mb-sm -mt-xs">Pick 1 or 2 that feel right</p>
          <div className="flex flex-wrap gap-sm">
            {INVESTIGATION_TYPES.map((it) => (
              <PillButton key={it.id} active={form.investigationTypes.includes(it.id)} onClick={() => toggleType(it.id)}>
                <span className="inline-flex items-center gap-xs"><it.Icon size={14} aria-hidden="true" /> {it.label}</span>
              </PillButton>
            ))}
          </div>
        </div>

        <div>
          <OLabel>Subject areas</OLabel>
          <div className="flex flex-wrap gap-sm">
            {SUBJECT_TAGS.map((s) => (
              <PillButton key={s} active={form.subjects.includes(s)} onClick={() => toggleSubject(s)}>{s}</PillButton>
            ))}
          </div>
        </div>

        <QuickSettings
          duration={form.duration}
          setting={form.setting}
          onDuration={(v) => setForm((f) => ({ ...f, duration: v }))}
          onSetting={(v) => setForm((f) => ({ ...f, setting: v }))}
        />

        {showGoalNudge && (
          <div className="mt-sm rounded-md border border-border-subtle bg-surface-raised px-md py-sm flex items-center justify-between gap-md">
            <p className="font-serif text-sm text-text-secondary italic">
              Lots of prior knowledge — this might work well as a <strong>Goal-Forward</strong> module instead.
            </p>
            <button
              onClick={() => onSwitchPathway('understanding')}
              className="shrink-0 font-sans text-xs text-ember hover:underline"
            >
              Switch
            </button>
          </div>
        )}

        <CrossPathNudge suggestion={nudge} onSwitch={onSwitchPathway} />
        {error && <p className="font-sans text-sm text-red-400">{error}</p>}

        <FormActions saving={saving} onDraft={() => handleSave('draft')} onContinue={() => handleSave('complete')} continueLabel="Plan the exploration" />
      </div>

      <AiCompanionPanel hints={[
        'The question is the whole module. Let it be messy.',
        'Prior knowledge shapes everything — what they think is the starting line.',
        'Pick investigation types that match your energy, not what\'s "educational".',
      ]} />
    </div>
  );
}

// ── Retrospective Lift Pathway ─────────────────────────────────────────────

type LogEntry = {
  id: string;
  title: string;
  dateOccurred: string;
  subjects: string[] | null;
  status: string;
};

type Pattern = {
  subject: string;
  entries: LogEntry[];
  earliest: string;
  latest: string;
};

function RetrospectiveLiftPathwayForm({ onBack }: { onBack: () => void }) {
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [moduleName, setModuleName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedOutcome, setSavedOutcome] = useState<SaveOutcome | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SharedEditData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/entries')
      .then((r) => r.json())
      .then((data: LogEntry[]) => {
        if (!Array.isArray(data)) { setLoadingEntries(false); return; }
        const published = data.filter((e) => e.status !== 'draft');
        const groups: Record<string, LogEntry[]> = {};
        published.forEach((e) => {
          (e.subjects ?? []).forEach((s) => {
            if (!groups[s]) groups[s] = [];
            groups[s].push(e);
          });
        });
        const found = Object.entries(groups)
          .filter(([, es]) => es.length >= 2)
          .sort(([, a], [, b]) => b.length - a.length)
          .slice(0, 4)
          .map(([subject, es]) => {
            const sorted = [...es].sort((a, b) => a.dateOccurred.localeCompare(b.dateOccurred));
            return {
              subject,
              entries: sorted,
              earliest: sorted[0].dateOccurred,
              latest: sorted[sorted.length - 1].dateOccurred,
            };
          });
        setPatterns(found);
        setLoadingEntries(false);
      })
      .catch(() => setLoadingEntries(false));
  }, []);

  const handleSave = async (status: 'draft' | 'complete') => {
    if (!selectedPattern) { setError('Select a pattern to lift.'); return; }
    const draftData = {
      subject: selectedPattern.subject,
      entryIds: selectedPattern.entries.map((e) => e.id),
      moduleName: moduleName || selectedPattern.subject,
    };
    if (status === 'complete') {
      setEditing(normalizeToEditData('retrospective', draftData as unknown as Record<string, unknown>));
      return;
    }
    setSaving(true); setError(null);
    const res = await saveDraft('retrospective', draftData, status, { id: draftId });
    setSaving(false);
    if (res.ok) { if (res.id) setDraftId(res.id); setSavedOutcome('draft'); }
    else setError('Something went wrong. Please try again.');
  };

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

  if (savedOutcome) return <SavedView outcome={savedOutcome} onBack={onBack} />;
  if (editing) return <SharedEditView initialData={editing} initialDraftId={draftId} onBack={() => setEditing(null)} onSaved={setSavedOutcome} />;

  return (
    <div className="flex flex-col gap-lg">
      <PathwayHeader Icon={ClockCounterClockwise} name="Retrospective Lift" subtitle="We'll find patterns in your logs and turn them into a reusable module." onBack={onBack} />

      {loadingEntries ? (
        <p className="font-sans text-sm text-text-muted hearth-pulse">Looking through your logs…</p>
      ) : patterns.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
          <span className="mb-md inline-flex justify-center text-text-secondary" aria-hidden="true">
            <ClipboardText size={32} />
          </span>
          <p className="font-serif text-base font-semibold text-text-primary mb-xs">No patterns yet</p>
          <p className="font-serif text-sm text-text-secondary">
            Log at least 2 activities in the same subject area and we&apos;ll spot the pattern for you.
          </p>
        </div>
      ) : (
        <>
          <div>
            <OLabel>Patterns spotted in your logs</OLabel>
            <div className="flex flex-col gap-sm">
              {patterns.map((pattern) => {
                const active = selectedPattern?.subject === pattern.subject;
                return (
                  <button
                    key={pattern.subject}
                    type="button"
                    onClick={() => { setSelectedPattern(pattern); setModuleName(pattern.subject); }}
                    className={[
                      'flex items-start gap-md rounded-lg border p-md text-left transition duration-[var(--motion-quick)]',
                      active
                        ? 'border-ember/40 bg-ember-glow'
                        : 'border-border-subtle bg-surface-raised hover:border-border-medium',
                    ].join(' ')}
                  >
                    <span className={`mt-xs h-[10px] w-[10px] flex-shrink-0 rounded-full ${active ? 'bg-ember' : 'bg-border-medium'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-base font-semibold text-text-primary">{pattern.subject}</p>
                      <p className="font-sans text-xs text-text-muted mt-[2px]">
                        {pattern.entries.length} logs · {formatDate(pattern.earliest)} – {formatDate(pattern.latest)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedPattern && (
            <>
              <div>
                <OLabel>Matching entries</OLabel>
                <div className="rounded-lg border border-border-subtle bg-surface-raised divide-y divide-border-subtle overflow-hidden">
                  {selectedPattern.entries.map((e) => (
                    <div key={e.id} className="flex items-center gap-sm px-md py-sm">
                      <span className="font-sans text-[10px] text-text-muted w-[56px] flex-shrink-0">{formatDate(e.dateOccurred)}</span>
                      <span className="font-serif text-sm text-text-primary flex-1 truncate">{e.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
                  What would you call this module? <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  placeholder={selectedPattern.subject}
                  className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition duration-[var(--motion-quick)] focus:border-ember"
                />
              </div>

              {error && <p className="font-sans text-sm text-red-400">{error}</p>}

              <FormActions saving={saving} onDraft={() => handleSave('draft')} onContinue={() => handleSave('complete')} continueLabel="Review the evidence" />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Goal-Forward Pathway ───────────────────────────────────────────────────

type GoalMode = 'aspiration' | 'capability';

interface GoalForwardDraft {
  mode: GoalMode;
  goal: string;
  successLooksLike: string;
  duration: string;
  setting: string;
  threadId: string;
  threadName: string;
  tier: string;
  preferences: string[];
}

function GoalForwardPathwayForm({ onBack, onSwitchPathway }: { onBack: () => void; onSwitchPathway: (p: Pathway) => void }) {
  const [mode, setMode] = useState<GoalMode>('aspiration');
  const [form, setForm] = useState<GoalForwardDraft>({
    mode: 'aspiration',
    goal: '',
    successLooksLike: '',
    duration: '',
    setting: 'either',
    threadId: '',
    threadName: '',
    tier: '',
    preferences: [],
  });
  const [threadSearch, setThreadSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedOutcome, setSavedOutcome] = useState<SaveOutcome | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SharedEditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skeletons, setSkeletons] = useState<import('@/lib/sanity/queries').SkeletonRecord[] | null>(null);
  const [loadingSkeletons, setLoadingSkeletons] = useState(false);
  const nudge = detectCrossPathNudge('understanding', form.goal + ' ' + form.successLooksLike);

  const togglePref = (id: string) =>
    setForm((f) => ({ ...f, preferences: f.preferences.includes(id) ? f.preferences.filter((x) => x !== id) : [...f.preferences, id] }));

  const filteredThreads = threadSearch.trim()
    ? CAPABILITY_THREADS.filter((t) => t.name.toLowerCase().includes(threadSearch.toLowerCase()) || t.domain.toLowerCase().includes(threadSearch.toLowerCase()))
    : CAPABILITY_THREADS;

  const threadsByDomain = filteredThreads.reduce<Record<string, typeof CAPABILITY_THREADS>>((acc, t) => {
    if (!acc[t.domain]) acc[t.domain] = [];
    acc[t.domain].push(t);
    return acc;
  }, {});

  const handleSave = async (status: 'draft' | 'complete') => {
    if (mode === 'aspiration' && !form.goal.trim()) { setError('Describe your learning goal.'); return; }
    if (mode === 'capability' && (!form.threadId || !form.tier)) { setError('Select a capability thread and a tier.'); return; }
    if (status === 'complete') {
      if (mode === 'capability') {
        setLoadingSkeletons(true);
        try {
          const threadCapDomain: Record<string, string> = {
            M1: 'mathematical', M2: 'mathematical', M3: 'mathematical', M4: 'mathematical', M5: 'mathematical',
            S1: 'scientific', S2: 'scientific', S3: 'scientific',
            L1: 'language', L2: 'language', L3: 'language', L4: 'language', L5: 'language',
            EF1: 'executive_function', EF2: 'executive_function',
            P1: 'physical', P2: 'physical',
            C1: 'creative', C2: 'creative', C3: 'creative',
          };
          const domain = threadCapDomain[form.threadId] ?? 'mathematical';
          const pref = form.preferences[0] ?? 'any';
          const res = await fetch(`/api/skeletons?threadId=${form.threadId}&domain=${domain}&tier=${form.tier?.toLowerCase()}&pref=${pref}`);
          const data = await res.json();
          setSkeletons(Array.isArray(data) ? data : []);
        } catch {
          setSkeletons([]);
        } finally {
          setLoadingSkeletons(false);
        }
        return;
      }
      setEditing(normalizeToEditData('understanding', { ...form, mode } as unknown as Record<string, unknown>));
      return;
    }
    setSaving(true); setError(null);
    const res = await saveDraft('understanding', { ...form, mode }, status, { id: draftId });
    setSaving(false);
    if (res.ok) { if (res.id) setDraftId(res.id); setSavedOutcome('draft'); }
    else setError('Something went wrong. Please try again.');
  };

  if (savedOutcome) return <SavedView outcome={savedOutcome} onBack={onBack} />;
  if (editing) return <SharedEditView initialData={editing} initialDraftId={draftId} onBack={() => setEditing(null)} onSaved={setSavedOutcome} />;

  if (mode === 'capability' && skeletons !== null) {
    return (
      <div className="flex flex-col gap-lg">
        <div className="flex items-center gap-sm">
          <button
            onClick={() => setSkeletons(null)}
            className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-[var(--motion-quick)]"
          >
            <span className="inline-flex items-center gap-xs"><ArrowLeft size={14} aria-hidden="true" /> Back</span>
          </button>
        </div>
        <div>
          <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">
            Choose a starting point
          </h2>
          <p className="font-serif text-sm text-text-secondary">
            These are pre-built ideas for {form.threadName} · {form.tier}. Pick one and we&apos;ll pre-fill the editor.
          </p>
        </div>

        {loadingSkeletons ? (
          <p className="font-sans text-sm text-text-muted hearth-pulse">Finding ideas for you…</p>
        ) : skeletons.length === 0 ? (
          <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
            <span className="mb-md inline-flex justify-center text-ember" aria-hidden="true">
              <MagicWand size={32} />
            </span>
            <p className="font-serif text-base font-semibold text-text-primary mb-xs">No pre-built ideas yet</p>
            <p className="font-serif text-sm text-text-secondary mb-lg">We&apos;re still building the library. Start from scratch — the editor will still help you structure the learning.</p>
            <button
              onClick={() => {
                setEditing(normalizeToEditData('understanding', { ...form, mode } as unknown as Record<string, unknown>));
              }}
              className="hearth-press font-sans text-sm font-semibold bg-ember text-text-inverse rounded-md px-md py-sm min-h-[44px]"
            >
              Start from scratch
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-md">
            {skeletons.map((skeleton) => (
              <button
                key={skeleton._id}
                type="button"
                onClick={() => {
                  const editData = normalizeToEditData('understanding', { ...form, mode } as unknown as Record<string, unknown>);
                  editData.title = skeleton.title;
                  editData.targetUnderstanding = skeleton.suggestedUnderstanding;
                  editData.steps = skeleton.suggestedSteps.map((s, i) => ({
                    id: `step-${i}`,
                    title: s.title,
                    instructions: s.instructions,
                    observationHint: s.observationHint,
                  }));
                  editData.materials = skeleton.suggestedMaterials.map((m) => m.name);
                  setEditing(editData);
                }}
                className="bg-surface-panel rounded-lg border border-border-subtle p-lg text-left transition duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:border-border-medium hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:translate-y-[-1px]"
              >
                <div className="flex items-start justify-between gap-sm mb-sm">
                  <h3 className="font-serif text-base font-semibold text-text-primary">{skeleton.title}</h3>
                  {skeleton.confidence === 'curated' && (
                    <span className="inline-flex items-center gap-xs font-sans text-[10px] font-semibold bg-sage/10 text-sage border border-sage/20 px-xs py-[2px] rounded-full flex-shrink-0">
                      <Check size={10} aria-hidden="true" /> Curated
                    </span>
                  )}
                </div>
                <p className="font-serif text-sm text-text-secondary mb-md leading-relaxed">{skeleton.description}</p>
                <div className="flex flex-wrap gap-xs">
                  {skeleton.estimatedDuration && (
                    <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted"><Timer size={12} aria-hidden="true" /> {skeleton.estimatedDuration} min</span>
                  )}
                  {skeleton.setting && skeleton.setting !== 'either' && (
                    <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted">
                      {skeleton.setting === 'indoor' ? <HouseLine size={12} aria-hidden="true" /> : <Tree size={12} aria-hidden="true" />}
                      {skeleton.setting}
                    </span>
                  )}
                  <span className="font-sans text-xs text-text-muted">{skeleton.suggestedSteps.length} steps</span>
                </div>
              </button>
            ))}

            <button
              onClick={() => setEditing(normalizeToEditData('understanding', { ...form, mode } as unknown as Record<string, unknown>))}
              className="font-sans text-sm text-text-muted hover:text-text-secondary text-center underline underline-offset-2 transition-colors duration-[var(--motion-quick)]"
            >
              Start from scratch instead
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <PathwayHeader Icon={Target} name="Goal-Forward" subtitle="Target a specific capability or learning gap." onBack={onBack} />

        {/* Mode switcher */}
        <div className="flex gap-xs rounded-lg border border-border-subtle bg-surface-raised p-xs">
          {(['aspiration', 'capability'] as GoalMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setForm((f) => ({ ...f, mode: m })); }}
              className={[
                'flex-1 rounded-md py-sm font-sans text-sm font-semibold transition duration-[var(--motion-quick)]',
                mode === m
                  ? 'bg-ember text-text-inverse shadow-[0_2px_8px_rgba(217,123,58,0.3)]'
                  : 'text-text-muted hover:text-text-secondary',
              ].join(' ')}
            >
              {m === 'aspiration'
                ? <span className="inline-flex items-center gap-xs"><PencilLine size={14} aria-hidden="true" /> I have a goal</span>
                : <span className="inline-flex items-center gap-xs"><Compass size={14} aria-hidden="true" /> I have a thread</span>}
            </button>
          ))}
        </div>

        {mode === 'aspiration' && (
          <>
            <div>
              <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
                What do you want them to learn or get better at?
              </label>
              <textarea
                value={form.goal}
                onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                placeholder="e.g. I want them to get more confident with fractions, or understand how ecosystems work…"
                rows={3}
                className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition duration-[var(--motion-quick)] focus:border-ember focus:shadow-focus"
              />
            </div>

            <div>
              <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
                What would it look like if they were getting it? <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={form.successLooksLike}
                onChange={(e) => setForm((f) => ({ ...f, successLooksLike: e.target.value }))}
                placeholder="e.g. They'd start noticing fractions in everyday life, or confidently explain how one living thing affects another…"
                rows={2}
                className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition duration-[var(--motion-quick)] focus:border-ember"
              />
            </div>

            <QuickSettings
              duration={form.duration}
              setting={form.setting}
              onDuration={(v) => setForm((f) => ({ ...f, duration: v }))}
              onSetting={(v) => setForm((f) => ({ ...f, setting: v }))}
            />
          </>
        )}

        {mode === 'capability' && (
          <>
            <div>
              <OLabel>Which capability thread?</OLabel>
              <input
                type="text"
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                placeholder="Search e.g. fractions, reading, science…"
                className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition duration-[var(--motion-quick)] focus:border-ember mb-sm"
              />
              <div className="rounded-lg border border-border-subtle bg-surface-raised overflow-hidden divide-y divide-border-subtle max-h-[280px] overflow-y-auto">
                {Object.entries(threadsByDomain).map(([domain, threads]) => (
                  <div key={domain}>
                    <p className="font-sans text-[10px] font-semibold text-text-muted uppercase tracking-[0.1em] px-md py-xs bg-surface-body/50">
                      {domain}
                    </p>
                    {threads.map((t) => {
                      const active = form.threadId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, threadId: t.id, threadName: t.name }))}
                          className={[
                            'w-full flex items-center gap-sm px-md py-sm text-left transition-colors duration-[var(--motion-quick)]',
                            active ? 'bg-ember-glow text-ember' : 'hover:bg-surface-hover text-text-primary',
                          ].join(' ')}
                        >
                          <span className={`h-[8px] w-[8px] flex-shrink-0 rounded-full ${active ? 'bg-ember' : 'bg-border-medium'}`} />
                          <span className="font-serif text-sm">{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {form.threadId && (
              <>
                <div>
                  <OLabel>Where are they now?</OLabel>
                  <div className="flex flex-wrap gap-sm">
                    {TIERS.map((tier) => (
                      <PillButton key={tier} active={form.tier === tier} onClick={() => setForm((f) => ({ ...f, tier }))}>
                        {tier}
                      </PillButton>
                    ))}
                  </div>
                </div>

                <div>
                  <OLabel>What does your family enjoy?</OLabel>
                  <div className="flex flex-wrap gap-sm">
                    {ACTIVITY_PREFERENCES.map((p) => (
                      <PillButton key={p.id} active={form.preferences.includes(p.id)} onClick={() => togglePref(p.id)}>
                        <span className="inline-flex items-center gap-xs"><p.Icon size={14} aria-hidden="true" /> {p.label}</span>
                      </PillButton>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <CrossPathNudge suggestion={nudge} onSwitch={onSwitchPathway} />
        {error && <p className="font-sans text-sm text-red-400">{error}</p>}

        <FormActions
          saving={saving}
          onDraft={() => handleSave('draft')}
          onContinue={() => handleSave('complete')}
          continueLabel={mode === 'capability' ? 'See suggested modules' : 'Build the module'}
        />
      </div>

      <AiCompanionPanel hints={
        mode === 'aspiration'
          ? [
              'A loose goal is fine — we\'ll help sharpen it into a module.',
              'Describing what success looks like helps us suggest the right activities.',
              'You don\'t need to know the curriculum. Just describe the learning.',
            ]
          : [
              'Threads come from the Australian Curriculum — but you pick them in plain language.',
              'Tier helps us pitch the difficulty right.',
              'Preferences match the activity to your family\'s style.',
            ]
      } />
    </div>
  );
}

// ── Entry selector ─────────────────────────────────────────────────────────

const PATHWAY_NAMES: Record<Pathway, string> = {
  material: 'Material-Anchored',
  process: 'Process',
  inquiry: 'Inquiry',
  retrospective: 'Retrospective Lift',
  understanding: 'Goal-Forward',
};

const VALID_PATHWAYS: ReadonlyArray<Pathway> = ['material', 'process', 'inquiry', 'retrospective', 'understanding'];

function asPathway(value: unknown): Pathway {
  return VALID_PATHWAYS.includes(value as Pathway) ? (value as Pathway) : 'process';
}

export default function BuildModulesPage() {
  const [selected, setSelected] = useState<Pathway | null>(null);
  const [drafts, setDrafts] = useState<ModuleDraftRecord[] | null>(null);
  const [resume, setResume] = useState<{ data: SharedEditData; draftId: string | null } | null>(null);
  const [resumeOutcome, setResumeOutcome] = useState<SaveOutcome | null>(null);
  const [autosave, setAutosave] = useState<AutosaveSnapshot | null>(null);
  const [discardArmed, setDiscardArmed] = useState<string | null>(null);

  const onChooser = selected === null && resume === null && resumeOutcome === null;

  useEffect(() => {
    if (!onChooser) return;
    let cancelled = false;
    // Syncing the recovery banner with localStorage each time the chooser is
    // shown — an unconditional set so a snapshot cleared mid-session (saved or
    // published) also clears its banner.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutosave(readAutosave());
    fetch('/api/modules/drafts')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: ModuleDraftRecord[]) => {
        if (cancelled) return;
        setDrafts(Array.isArray(rows) ? rows.filter((d) => d.status === 'draft') : []);
      })
      .catch(() => { if (!cancelled) setDrafts([]); });
    return () => { cancelled = true; };
  }, [onChooser]);

  const resumeDraft = (d: ModuleDraftRecord) => {
    setResume({ data: draftToEditData(asPathway(d.pathway), d.draftData ?? {}), draftId: d.id });
  };

  const restoreAutosave = () => {
    if (!autosave) return;
    const raw = autosave.form as unknown as Record<string, unknown>;
    setResume({ data: draftToEditData(asPathway(raw.pathway), raw), draftId: autosave.draftId ?? null });
  };

  const discardDraft = (id: string) => {
    setDrafts((ds) => (ds ? ds.filter((d) => d.id !== id) : ds));
    setDiscardArmed(null);
    fetch(`/api/modules/drafts/${id}`, { method: 'DELETE' })
      .catch(() => { /* reappears on next load if the delete failed */ });
  };

  if (resumeOutcome) {
    return (
      <div className="px-md py-lg max-w-2xl mx-auto">
        <SavedView outcome={resumeOutcome} onBack={() => setResumeOutcome(null)} />
      </div>
    );
  }

  if (resume) {
    return (
      <div className="px-md py-lg max-w-4xl mx-auto">
        <SharedEditView
          initialData={resume.data}
          initialDraftId={resume.draftId}
          onBack={() => setResume(null)}
          onSaved={(o) => { setResume(null); setResumeOutcome(o); }}
        />
      </div>
    );
  }

  if (selected === 'material') {
    return <div className="px-md py-lg max-w-4xl mx-auto"><MaterialPathwayForm onBack={() => setSelected(null)} onSwitchPathway={setSelected} /></div>;
  }
  if (selected === 'process') {
    return <div className="px-md py-lg max-w-4xl mx-auto"><ProcessPathwayForm onBack={() => setSelected(null)} onSwitchPathway={setSelected} /></div>;
  }
  if (selected === 'inquiry') {
    return <div className="px-md py-lg max-w-4xl mx-auto"><InquiryPathwayForm onBack={() => setSelected(null)} onSwitchPathway={setSelected} /></div>;
  }
  if (selected === 'retrospective') {
    return <div className="px-md py-lg max-w-2xl mx-auto"><RetrospectiveLiftPathwayForm onBack={() => setSelected(null)} /></div>;
  }
  if (selected === 'understanding') {
    return <div className="px-md py-lg max-w-4xl mx-auto"><GoalForwardPathwayForm onBack={() => setSelected(null)} onSwitchPathway={setSelected} /></div>;
  }

  return (
    <div className="px-md py-lg max-w-2xl mx-auto">
      <div className="mb-xl">
        <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Build</p>
        <h1 className="font-serif text-2xl font-semibold text-text-primary mb-xs">
          Create a module
        </h1>
        <p className="font-serif text-text-secondary">
          Where does your thinking start? Choose a pathway and we&apos;ll build from there.
        </p>
      </div>

      {autosave && (
        <div className="mb-lg rounded-lg border border-ember/25 bg-ember-glow/20 p-md flex items-center justify-between gap-md">
          <div className="flex-1 min-w-0">
            <p className="font-serif text-sm font-semibold text-text-primary truncate">
              Unsaved work: {(autosave.form?.title ?? '').trim() || 'Untitled module'}
            </p>
            <p className="font-sans text-xs text-text-muted mt-[2px]">
              Recovered from this device — restore it to keep editing.
            </p>
          </div>
          <div className="flex items-center gap-sm shrink-0">
            <button
              type="button"
              onClick={restoreAutosave}
              className="font-sans text-xs font-semibold text-ember border border-ember rounded-md px-sm min-h-[36px] transition duration-[var(--motion-quick)]"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={() => { clearAutosave(); setAutosave(null); }}
              className="font-sans text-xs text-text-muted hover:text-text-secondary min-h-[36px] transition-colors duration-[var(--motion-quick)]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {(() => {
        const visibleDrafts = (drafts ?? []).filter((d) => !(autosave && autosave.draftId === d.id));
        if (visibleDrafts.length === 0) return null;
        return (
          <div className="mb-xl">
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-sm">
              Continue where you left off
            </p>
            <div className="flex flex-col gap-sm">
              {visibleDrafts.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center gap-md bg-surface-panel border border-border-subtle rounded-lg p-md">
                  <button type="button" onClick={() => resumeDraft(d)} className="flex-1 min-w-0 text-left group">
                    <p className="font-serif text-base font-semibold text-text-primary truncate group-hover:text-ember transition-colors duration-[var(--motion-quick)]">
                      {draftDisplayTitle(asPathway(d.pathway), d.draftData ?? {})}
                    </p>
                    <p className="font-sans text-xs text-text-muted mt-[2px]">
                      {PATHWAY_NAMES[asPathway(d.pathway)]}
                      {d.updatedAt ? ` · ${formatDistanceToNow(new Date(d.updatedAt), { addSuffix: true })}` : ''}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => (discardArmed === d.id ? discardDraft(d.id) : setDiscardArmed(d.id))}
                    onBlur={() => setDiscardArmed(null)}
                    className={[
                      'shrink-0 font-sans text-xs min-h-[36px] px-sm rounded-md transition-colors duration-[var(--motion-quick)]',
                      discardArmed === d.id
                        ? 'font-semibold text-red-400 border border-red-900/30 bg-red-900/20'
                        : 'text-text-muted hover:text-red-400',
                    ].join(' ')}
                  >
                    {discardArmed === d.id ? 'Really discard?' : 'Discard'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="flex flex-col gap-sm mb-sm">
        {PATHWAYS.map((pathway) => (
          <button
            key={pathway.id}
            onClick={() => setSelected(pathway.id)}
            className={[
              'flex items-start gap-md bg-surface-panel border rounded-lg p-md text-left w-full shadow-card transition duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:bg-surface-hover hover:border-border-medium hover:translate-y-[-1px]',
              pathway.id === 'retrospective' ? 'border-ember/25' : 'border-border-subtle',
            ].join(' ')}
          >
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-surface-raised rounded-md text-text-secondary">
              <pathway.Icon size={18} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-base font-semibold text-text-primary leading-snug mb-xs">
                {pathway.label}
              </p>
              <p className="font-sans text-sm text-text-secondary leading-snug">
                {pathway.hint}
              </p>
              {pathway.badge && (
                <span className="inline-flex items-center gap-xs font-sans text-xs font-medium text-ember bg-ember-glow px-sm py-[2px] rounded-full mt-[6px]">
                  <Sparkle size={12} aria-hidden="true" /> {pathway.badge}
                </span>
              )}
            </div>
            <span className="inline-flex self-center flex-shrink-0 text-text-muted" aria-hidden="true"><CaretRight size={14} /></span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-md my-md">
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="font-sans text-xs text-text-muted">More structured</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>

      <button
        onClick={() => setSelected(GOAL_PATHWAY.id)}
        className="flex items-start gap-md bg-surface-panel border border-border-subtle rounded-lg p-md text-left w-full shadow-card transition duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:bg-surface-hover hover:border-border-medium hover:translate-y-[-1px]"
      >
        <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-surface-raised rounded-md text-text-secondary">
          <GOAL_PATHWAY.Icon size={18} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-base font-semibold text-text-primary leading-snug mb-xs">
            {GOAL_PATHWAY.label}
          </p>
          <p className="font-sans text-sm text-text-secondary leading-snug">
            {GOAL_PATHWAY.hint}
          </p>
        </div>
        <span className="inline-flex self-center flex-shrink-0 text-text-muted" aria-hidden="true"><CaretRight size={14} /></span>
      </button>

      <p className="font-sans text-sm text-text-muted text-center mt-lg">
        Not sure where to start?{' '}
        <a href="/explore/activities" className="text-ember underline underline-offset-2 transition-colors duration-[var(--motion-quick)] hover:text-ember-hover">
          Browse Activity Discovery
        </a>
      </p>
    </div>
  );
}
