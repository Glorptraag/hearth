'use client';

import { useState, useEffect } from 'react';

type Pathway = 'material' | 'process' | 'inquiry' | 'retrospective' | 'goal';

const RESOURCE_TYPES = [
  { id: 'book', label: '📚 Book' },
  { id: 'video', label: '🎬 Video' },
  { id: 'kit', label: '🧰 Kit' },
  { id: 'app', label: '📱 App' },
  { id: 'place', label: '📍 Place' },
  { id: 'audio', label: '🎵 Audio' },
  { id: 'other', label: '📦 Other' },
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

const INVESTIGATION_TYPES = [
  { id: 'observe', label: '🔍 Observe closely' },
  { id: 'test', label: '🧪 Test it out' },
  { id: 'research', label: '📚 Look it up' },
  { id: 'ask', label: '🗣️ Ask an expert' },
  { id: 'visit', label: '📍 Go somewhere' },
  { id: 'make', label: '🔧 Build or make' },
];

const TIERS = ['Emerging', 'Developing', 'Demonstrating'];

const ACTIVITY_PREFERENCES = [
  { id: 'outdoors', label: '🌿 Outdoors' },
  { id: 'art', label: '🎨 Art / craft' },
  { id: 'books', label: '📚 Books' },
  { id: 'games', label: '🎲 Games' },
  { id: 'cooking', label: '🧑‍🍳 Cooking' },
  { id: 'experiments', label: '🔬 Experiments' },
  { id: 'active', label: '🏃 Active' },
  { id: 'discussion', label: '🗣️ Discussion' },
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

const PATHWAYS = [
  {
    id: 'material' as Pathway,
    emoji: '📖',
    label: '"I have a great resource"',
    name: 'Material-Anchored',
    hint: 'Build a module around a book, video, kit, or place',
    badge: null,
  },
  {
    id: 'process' as Pathway,
    emoji: '🔧',
    label: '"I know the steps"',
    name: 'Process',
    hint: 'You already know what to do — capture it as a reusable module',
    badge: null,
  },
  {
    id: 'inquiry' as Pathway,
    emoji: '❓',
    label: '"I have a question to explore"',
    name: 'Inquiry',
    hint: 'Start with curiosity and design an investigation',
    badge: null,
  },
  {
    id: 'retrospective' as Pathway,
    emoji: '🔄',
    label: '"We\'ve already been doing this"',
    name: 'Retrospective Lift',
    hint: 'Turn logged activities into a structured module',
    badge: '3 patterns found',
  },
];

const GOAL_PATHWAY = {
  id: 'goal' as Pathway,
  emoji: '🎯',
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
        'font-sans text-sm font-medium px-md py-xs rounded-md border min-h-[36px] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        active
          ? 'bg-ember text-text-inverse border-ember'
          : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function PathwayHeader({ emoji, name, subtitle, onBack }: { emoji: string; name: string; subtitle: string; onBack: () => void }) {
  return (
    <>
      <div className="flex items-center gap-sm">
        <button
          onClick={onBack}
          className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
        >
          ← Back
        </button>
        <span className="text-text-muted font-sans text-sm">/</span>
        <span className="font-sans text-sm text-text-secondary">{name}</span>
      </div>
      <div>
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">
          {emoji} {name}
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
          className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary outline-none transition-all duration-200 focus:border-ember"
        >
          <option value="">Select…</option>
          {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="flex-1">
        <OLabel>Setting</OLabel>
        <div className="flex gap-sm">
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

function SavedView({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-lg py-2xl text-center">
      <span className="text-4xl">✅</span>
      <h2 className="font-serif text-xl font-semibold text-text-primary">Draft saved</h2>
      <p className="font-serif text-text-secondary max-w-xs">
        Your module draft has been saved. You can come back to finish it anytime.
      </p>
      <button
        onClick={onBack}
        className="font-sans text-sm font-semibold text-ember border border-ember rounded-md px-md py-sm min-h-[44px] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
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
        className="flex-1 font-sans text-sm font-semibold text-ember border border-ember rounded-md min-h-[44px] px-lg transition-all duration-200 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save as draft'}
      </button>
      <button
        type="button"
        onClick={onContinue}
        disabled={saving}
        className="flex-1 font-sans text-sm font-semibold text-text-inverse bg-ember rounded-md min-h-[44px] px-lg shadow-[0_4px_16px_rgba(217,123,58,0.3)] transition-all duration-200 disabled:opacity-50"
      >
        {saving ? 'Saving…' : (continueLabel ?? 'Continue →')}
      </button>
    </div>
  );
}

async function saveDraft(pathway: string, draftData: unknown, status: 'draft' | 'complete'): Promise<boolean> {
  const res = await fetch('/api/modules/drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pathway, draftData, status }),
  });
  return res.ok;
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
  if (currentPathway !== 'goal' && GOAL_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { pathway: 'goal', label: 'Goal-Forward', reason: 'Sounds like a learning target' };
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

// ── Shared Editing View ───────────────────────────────────────────────────

interface ModuleStep {
  id: string;
  title: string;
  instructions: string;
  observationHint: string;
}

interface SharedEditData {
  pathway: Pathway;
  title: string;
  targetUnderstanding: string;
  watchFor: string;
  pivot: string;
  steps: ModuleStep[];
  materials: string[];
  subjects: string[];
  duration: string;
  setting: string;
  ageRange: string;
  capabilities: Array<{ threadId: string; confidence: 'explicit' | 'inferred' }>;
  provenance: Record<string, unknown>;
}

function normalizeToEditData(pathway: Pathway, data: Record<string, unknown>): SharedEditData {
  const base: SharedEditData = {
    pathway,
    title: '',
    targetUnderstanding: '',
    watchFor: '',
    pivot: '',
    steps: [],
    materials: [],
    subjects: (data.subjects as string[]) ?? [],
    duration: (data.duration as string) ?? '',
    setting: (data.setting as string) ?? 'either',
    ageRange: (data.ageRange as string) ?? '',
    capabilities: [],
    provenance: {},
  };

  switch (pathway) {
    case 'material':
      base.title = (data.resourceName as string) ?? '';
      base.provenance = {
        type: 'sourceResource',
        resourceType: data.resourceType,
        resourceName: data.resourceName,
        excitement: data.excitement,
      };
      break;
    case 'process':
      base.title = (data.activityName as string) ?? '';
      if (data.whatHappens) {
        const lines = (data.whatHappens as string).split('\n').filter(Boolean);
        base.steps = lines.map((line, i) => ({
          id: `step-${i}`,
          title: `Step ${i + 1}`,
          instructions: line.trim(),
          observationHint: '',
        }));
      }
      if (data.hasProduct && data.productName) {
        base.materials.push(data.productName as string);
      }
      break;
    case 'inquiry':
      base.title = (data.question as string) ?? '';
      base.provenance = {
        type: 'sourceQuestion',
        question: data.question,
        priorKnowledge: data.priorKnowledge,
        investigationTypes: data.investigationTypes,
      };
      break;
    case 'retrospective':
      base.title = (data.moduleName as string) ?? (data.subject as string) ?? '';
      base.provenance = {
        type: 'sourceLogs',
        subject: data.subject,
        entryIds: data.entryIds,
      };
      break;
    case 'goal':
      base.title = (data.goal as string) ?? (data.threadName as string) ?? '';
      if (data.mode === 'capability') {
        base.provenance = {
          type: 'sourceCapability',
          threadId: data.threadId,
          threadName: data.threadName,
          targetTier: data.tier,
        };
        if (data.threadId) {
          base.capabilities = [{ threadId: data.threadId as string, confidence: 'explicit' }];
        }
      } else {
        base.provenance = {
          type: 'sourceGoal',
          goal: data.goal,
          successLooksLike: data.successLooksLike,
        };
      }
      break;
  }
  return base;
}

const PROVENANCE_LABELS: Record<string, string> = {
  sourceResource: 'Source Resource',
  sourceQuestion: 'Driving Question',
  sourceLogs: 'Lifted from Logs',
  sourceGoal: 'Learning Target',
  sourceCapability: 'Capability Target',
};

function SharedEditView({
  initialData,
  onBack,
  onSaved,
}: {
  initialData: SharedEditData;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSave = async (status: 'draft' | 'complete') => {
    if (!form.title.trim()) { setError('Module title is required.'); return; }
    setSaving(true); setError(null);
    const ok = await saveDraft(form.pathway, { ...form }, status);
    setSaving(false);
    if (ok) onSaved();
    else setError('Something went wrong. Please try again.');
  };

  const provenanceType = form.provenance.type as string | undefined;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <div className="flex items-center gap-sm">
          <button onClick={onBack} className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-200">
            ← Back to entry
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
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-base text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember focus:shadow-[0_0_0_2px_rgba(217,123,58,0.15)]"
          />
        </div>

        {/* Target understanding */}
        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">What will they understand?</label>
          <textarea
            value={form.targetUnderstanding}
            onChange={(e) => setForm((f) => ({ ...f, targetUnderstanding: e.target.value }))}
            placeholder="What's the key understanding this module develops? AI will suggest one if you leave this blank."
            rows={2}
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember focus:shadow-[0_0_0_2px_rgba(217,123,58,0.15)]"
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
              <p className="font-sans text-xs text-text-muted">No steps yet. Add one above, or AI will generate them on save.</p>
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
              className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember"
            />
          </div>
          <div className="flex-1">
            <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">Pivot if needed</label>
            <textarea
              value={form.pivot}
              onChange={(e) => setForm((f) => ({ ...f, pivot: e.target.value }))}
              placeholder="If things go sideways, what's a good redirect?"
              rows={2}
              className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember"
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
          onDraft={() => handleSave('draft')}
          onContinue={() => handleSave('complete')}
          continueLabel="Save module"
        />
      </div>

      <AiCompanionPanel hints={[
        'Leave fields blank and AI will suggest content on save.',
        'Steps are optional — some modules work better as guided exploration.',
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
  ageRange: string;
  subjects: string[];
}

function MaterialPathwayForm({ onBack, onSwitchPathway }: { onBack: () => void; onSwitchPathway: (p: Pathway) => void }) {
  const [form, setForm] = useState<MaterialDraft>({
    resourceType: '',
    resourceName: '',
    excitement: '',
    ageRange: '',
    subjects: [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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
    const ok = await saveDraft('material', form, status);
    setSaving(false);
    if (ok) setSaved(true);
    else setError('Something went wrong. Please try again.');
  };

  if (saved) return <SavedView onBack={onBack} />;
  if (editing) return <SharedEditView initialData={editing} onBack={() => setEditing(null)} onSaved={() => setSaved(true)} />;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <PathwayHeader emoji="📖" name="Material-Anchored" subtitle="Start with what you have — a book, video, kit, place, or anything that sparked your interest." onBack={onBack} />

        <div>
          <OLabel>What type of resource?</OLabel>
          <div className="flex flex-wrap gap-sm">
            {RESOURCE_TYPES.map((rt) => (
              <PillButton key={rt.id} active={form.resourceType === rt.id} onClick={() => setForm((f) => ({ ...f, resourceType: rt.id }))}>
                {rt.label}
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
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember focus:shadow-[0_0_0_2px_rgba(217,123,58,0.15)]"
          />
        </div>

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">What excites you about this?</label>
          <textarea
            value={form.excitement}
            onChange={(e) => setForm((f) => ({ ...f, excitement: e.target.value }))}
            placeholder="What drew you to this resource? What do you hope your learner will get from it?"
            rows={3}
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember focus:shadow-[0_0_0_2px_rgba(217,123,58,0.15)]"
          />
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
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<SharedEditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nudge = detectCrossPathNudge('process', form.whatHappens);

  const toggleSubject = (s: string) =>
    setForm((f) => ({ ...f, subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s] }));

  const handleSave = async (status: 'draft' | 'complete') => {
    if (!form.activityName.trim()) { setError('Activity name is required.'); return; }
    if (status === 'complete') {
      setEditing(normalizeToEditData('process', form as unknown as Record<string, unknown>));
      return;
    }
    setSaving(true); setError(null);
    const ok = await saveDraft('process', form, status);
    setSaving(false);
    if (ok) setSaved(true);
    else setError('Something went wrong. Please try again.');
  };

  if (saved) return <SavedView onBack={onBack} />;
  if (editing) return <SharedEditView initialData={editing} onBack={() => setEditing(null)} onSaved={() => setSaved(true)} />;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <PathwayHeader emoji="🔧" name="Process" subtitle="You already know what to do — capture it as a reusable module." onBack={onBack} />

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">Activity name</label>
          <input
            type="text"
            value={form.activityName}
            onChange={(e) => setForm((f) => ({ ...f, activityName: e.target.value }))}
            placeholder="e.g. Building a birdhouse, Sourdough bread, Nature journalling..."
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember focus:shadow-[0_0_0_2px_rgba(217,123,58,0.15)]"
          />
        </div>

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">What happens in this activity?</label>
          <textarea
            value={form.whatHappens}
            onChange={(e) => setForm((f) => ({ ...f, whatHappens: e.target.value }))}
            placeholder="Describe what you do, step by step or in broad strokes. The learning spine will emerge from this."
            rows={4}
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember focus:shadow-[0_0_0_2px_rgba(217,123,58,0.15)]"
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
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors duration-200 ${
                form.hasProduct ? 'bg-ember border-ember' : 'bg-surface-hover border-border-medium'
              }`}
              role="switch"
              aria-checked={form.hasProduct}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-text-primary shadow ring-0 transition duration-200 mt-[1px] ${
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
              className="mt-sm w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember"
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

        <CrossPathNudge suggestion={nudge} onSwitch={onSwitchPathway} />
        {error && <p className="font-sans text-sm text-red-400">{error}</p>}

        <FormActions saving={saving} onDraft={() => handleSave('draft')} onContinue={() => handleSave('complete')} continueLabel="Capture the steps →" />
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
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<SharedEditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nudge = detectCrossPathNudge('inquiry', form.question + ' ' + form.priorKnowledge);

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
    const ok = await saveDraft('inquiry', form, status);
    setSaving(false);
    if (ok) setSaved(true);
    else setError('Something went wrong. Please try again.');
  };

  if (saved) return <SavedView onBack={onBack} />;
  if (editing) return <SharedEditView initialData={editing} onBack={() => setEditing(null)} onSaved={() => setSaved(true)} />;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <PathwayHeader emoji="❓" name="Inquiry" subtitle="Start with curiosity and design an investigation." onBack={onBack} />

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
            The question
          </label>
          <input
            type="text"
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            placeholder="e.g. Why do leaves change colour in autumn?"
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-base text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember focus:shadow-[0_0_0_2px_rgba(217,123,58,0.15)]"
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
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember focus:shadow-[0_0_0_2px_rgba(217,123,58,0.15)]"
          />
        </div>

        <div>
          <OLabel>How might you explore this?</OLabel>
          <p className="font-sans text-[11px] text-text-muted mb-sm -mt-xs">Pick 1 or 2 that feel right</p>
          <div className="flex flex-wrap gap-sm">
            {INVESTIGATION_TYPES.map((it) => (
              <PillButton key={it.id} active={form.investigationTypes.includes(it.id)} onClick={() => toggleType(it.id)}>
                {it.label}
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

        <CrossPathNudge suggestion={nudge} onSwitch={onSwitchPathway} />
        {error && <p className="font-sans text-sm text-red-400">{error}</p>}

        <FormActions saving={saving} onDraft={() => handleSave('draft')} onContinue={() => handleSave('complete')} continueLabel="Plan the exploration →" />
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
  const [saved, setSaved] = useState(false);
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
    const ok = await saveDraft('retrospective', draftData, status);
    setSaving(false);
    if (ok) setSaved(true);
    else setError('Something went wrong. Please try again.');
  };

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

  if (saved) return <SavedView onBack={onBack} />;
  if (editing) return <SharedEditView initialData={editing} onBack={() => setEditing(null)} onSaved={() => setSaved(true)} />;

  return (
    <div className="flex flex-col gap-lg">
      <PathwayHeader emoji="🔄" name="Retrospective Lift" subtitle="We'll find patterns in your logs and turn them into a reusable module." onBack={onBack} />

      {loadingEntries ? (
        <p className="font-sans text-sm text-text-muted animate-pulse">Looking through your logs…</p>
      ) : patterns.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
          <span className="text-3xl mb-md block">📋</span>
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
                      'flex items-start gap-md rounded-lg border p-md text-left transition-all duration-200',
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
                  className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember"
                />
              </div>

              {error && <p className="font-sans text-sm text-red-400">{error}</p>}

              <FormActions saving={saving} onDraft={() => handleSave('draft')} onContinue={() => handleSave('complete')} continueLabel="Review the evidence →" />
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
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<SharedEditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nudge = detectCrossPathNudge('goal', form.goal + ' ' + form.successLooksLike);

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
      setEditing(normalizeToEditData('goal', { ...form, mode } as unknown as Record<string, unknown>));
      return;
    }
    setSaving(true); setError(null);
    const ok = await saveDraft('goal', { ...form, mode }, status);
    setSaving(false);
    if (ok) setSaved(true);
    else setError('Something went wrong. Please try again.');
  };

  if (saved) return <SavedView onBack={onBack} />;
  if (editing) return <SharedEditView initialData={editing} onBack={() => setEditing(null)} onSaved={() => setSaved(true)} />;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <PathwayHeader emoji="🎯" name="Goal-Forward" subtitle="Target a specific capability or learning gap." onBack={onBack} />

        {/* Mode switcher */}
        <div className="flex gap-xs rounded-lg border border-border-subtle bg-surface-raised p-xs">
          {(['aspiration', 'capability'] as GoalMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setForm((f) => ({ ...f, mode: m })); }}
              className={[
                'flex-1 rounded-md py-sm font-sans text-sm font-semibold transition-all duration-200',
                mode === m
                  ? 'bg-ember text-text-inverse shadow-[0_2px_8px_rgba(217,123,58,0.3)]'
                  : 'text-text-muted hover:text-text-secondary',
              ].join(' ')}
            >
              {m === 'aspiration' ? '✏️ I have a goal' : '🧵 I have a thread'}
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
                className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember focus:shadow-[0_0_0_2px_rgba(217,123,58,0.15)]"
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
                className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember"
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
                className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember mb-sm"
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
                            'w-full flex items-center gap-sm px-md py-sm text-left transition-colors duration-200',
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
                  <div className="flex gap-sm">
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
                        {p.label}
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
          continueLabel={mode === 'capability' ? 'See suggested modules →' : 'Build the module →'}
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

export default function BuildModulesPage() {
  const [selected, setSelected] = useState<Pathway | null>(null);

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
  if (selected === 'goal') {
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

      <div className="flex flex-col gap-sm mb-sm">
        {PATHWAYS.map((pathway) => (
          <button
            key={pathway.id}
            onClick={() => setSelected(pathway.id)}
            className={[
              'flex items-start gap-md bg-surface-panel border rounded-lg p-md text-left w-full shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-surface-hover hover:border-border-medium hover:translate-y-[-1px]',
              pathway.id === 'retrospective' ? 'border-ember/25' : 'border-border-subtle',
            ].join(' ')}
          >
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-surface-raised rounded-md text-xl">
              {pathway.emoji}
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
                  ✨ {pathway.badge}
                </span>
              )}
            </div>
            <span className="text-text-muted text-base self-center flex-shrink-0">›</span>
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
        className="flex items-start gap-md bg-surface-panel border border-border-subtle rounded-lg p-md text-left w-full shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-surface-hover hover:border-border-medium hover:translate-y-[-1px]"
      >
        <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-surface-raised rounded-md text-xl">
          {GOAL_PATHWAY.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-base font-semibold text-text-primary leading-snug mb-xs">
            {GOAL_PATHWAY.label}
          </p>
          <p className="font-sans text-sm text-text-secondary leading-snug">
            {GOAL_PATHWAY.hint}
          </p>
        </div>
        <span className="text-text-muted text-base self-center flex-shrink-0">›</span>
      </button>

      <p className="font-sans text-sm text-text-muted text-center mt-lg">
        Not sure where to start?{' '}
        <a href="/explore/activities" className="text-ember underline underline-offset-2 transition-colors duration-200 hover:text-ember-hover">
          Browse Activity Discovery
        </a>
      </p>
    </div>
  );
}
