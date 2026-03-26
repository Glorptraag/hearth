'use client';

import { useState } from 'react';

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

interface MaterialDraft {
  resourceType: string;
  resourceName: string;
  excitement: string;
  ageRange: string;
  subjects: string[];
}

function MaterialPathwayForm({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState<MaterialDraft>({
    resourceType: '',
    resourceName: '',
    excitement: '',
    ageRange: '',
    subjects: [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<string | null>(null);

  const toggleSubject = (subject: string) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(subject)
        ? f.subjects.filter((s) => s !== subject)
        : [...f.subjects, subject],
    }));
  };

  const handleSave = async (status: 'draft' | 'complete') => {
    if (!form.resourceName.trim()) {
      setError('Resource name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/modules/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathway: 'material', draftData: form, status }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center gap-lg py-2xl text-center">
        <span className="text-4xl">✅</span>
        <h2 className="font-serif text-xl font-semibold text-text-primary">Draft saved</h2>
        <p className="font-serif text-text-secondary max-w-xs">
          Your module draft has been saved. You can come back to finish it anytime.
        </p>
        <button
          onClick={onBack}
          className="font-sans text-sm font-semibold text-ember border border-ember rounded-md px-md py-sm transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ minHeight: 44 }}
        >
          Back to pathways
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      {/* Header */}
      <div className="flex items-center gap-sm">
        <button
          onClick={onBack}
          className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
        >
          ← Back
        </button>
        <span className="text-text-muted font-sans text-sm">/</span>
        <span className="font-sans text-sm text-text-secondary">Material-Anchored</span>
      </div>

      <div>
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">
          📖 Build from a resource
        </h2>
        <p className="font-serif text-sm text-text-secondary">
          Start with what you have — a book, video, kit, place, or anything that sparked your interest.
        </p>
      </div>

      {/* Resource type pills */}
      <div>
        <p
          className="font-sans text-xs font-medium text-text-muted uppercase tracking-wide mb-sm"
        >
          What type of resource?
        </p>
        <div className="flex flex-wrap gap-sm">
          {RESOURCE_TYPES.map((rt) => {
            const active = form.resourceType === rt.id;
            return (
              <button
                key={rt.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, resourceType: rt.id }))}
                className={[
                  'font-sans text-sm font-medium px-md py-xs rounded-md border transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
                  active
                    ? 'bg-ember text-text-inverse border-ember'
                    : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium',
                ].join(' ')}
                style={{ minHeight: 36 }}
              >
                {rt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resource name */}
      <div>
        <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
          Resource name
        </label>
        <input
          type="text"
          value={form.resourceName}
          onChange={(e) => setForm((f) => ({ ...f, resourceName: e.target.value }))}
          placeholder="e.g. The Secret Garden, Planet Earth II, LEGO Mindstorms..."
          onFocus={() => setFocusField('name')}
          onBlur={() => setFocusField(null)}
          className="w-full bg-surface-raised border border-border-subtle rounded-md px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200"
          style={{
            padding: '10px 16px',
            borderColor: focusField === 'name' ? '#D97B3A' : undefined,
            boxShadow: focusField === 'name' ? '0 0 0 3px rgba(217,123,58,0.25)' : undefined,
          }}
        />
      </div>

      {/* Excitement */}
      <div>
        <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
          What excites you about this?
        </label>
        <textarea
          value={form.excitement}
          onChange={(e) => setForm((f) => ({ ...f, excitement: e.target.value }))}
          placeholder="What drew you to this resource? What do you hope your learner will get from it?"
          rows={3}
          onFocus={() => setFocusField('excitement')}
          onBlur={() => setFocusField(null)}
          className="w-full bg-surface-raised border border-border-subtle rounded-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y transition-all duration-200"
          style={{
            padding: '10px 16px',
            lineHeight: 1.6,
            borderColor: focusField === 'excitement' ? '#D97B3A' : undefined,
            boxShadow: focusField === 'excitement' ? '0 0 0 3px rgba(217,123,58,0.25)' : undefined,
          }}
        />
      </div>

      {/* Age range */}
      <div>
        <p className="font-sans text-xs font-medium text-text-muted uppercase tracking-wide mb-sm">
          Age range
        </p>
        <div className="flex flex-wrap gap-sm">
          {AGE_RANGES.map((age) => {
            const active = form.ageRange === age;
            return (
              <button
                key={age}
                type="button"
                onClick={() => setForm((f) => ({ ...f, ageRange: age }))}
                className={[
                  'font-sans text-sm font-medium px-md py-xs rounded-md border transition-all duration-200',
                  active
                    ? 'bg-ember text-text-inverse border-ember'
                    : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium',
                ].join(' ')}
                style={{ minHeight: 36 }}
              >
                {age}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject tags */}
      <div>
        <p className="font-sans text-xs font-medium text-text-muted uppercase tracking-wide mb-sm">
          Subject areas
        </p>
        <div className="flex flex-wrap gap-sm">
          {SUBJECT_TAGS.map((subject) => {
            const active = form.subjects.includes(subject);
            return (
              <button
                key={subject}
                type="button"
                onClick={() => toggleSubject(subject)}
                className={[
                  'font-sans text-sm font-medium px-md py-xs rounded-md border transition-all duration-200',
                  active
                    ? 'bg-ember text-text-inverse border-ember'
                    : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium',
                ].join(' ')}
                style={{ minHeight: 36 }}
              >
                {subject}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="font-sans text-sm text-red-400">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-md pt-sm border-t border-border-subtle">
        <button
          type="button"
          onClick={() => handleSave('draft')}
          disabled={saving}
          className="flex-1 font-sans text-sm font-semibold text-ember border border-ember rounded-md transition-all duration-200 disabled:opacity-50"
          style={{ minHeight: 44, padding: '0 24px' }}
        >
          {saving ? 'Saving…' : 'Save as draft'}
        </button>
        <button
          type="button"
          onClick={() => handleSave('complete')}
          disabled={saving}
          className="flex-1 font-sans text-sm font-semibold text-text-inverse bg-ember rounded-md transition-all duration-200 disabled:opacity-50"
          style={{
            minHeight: 44,
            padding: '0 24px',
            boxShadow: '0 4px 16px rgba(217,123,58,0.3)',
          }}
        >
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

function ComingSoonView({ pathway, onBack }: { pathway: typeof PATHWAYS[0] | typeof GOAL_PATHWAY; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center gap-sm">
        <button
          onClick={onBack}
          className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
        >
          ← Back
        </button>
      </div>
      <div
        className="bg-surface-panel border border-border-subtle rounded-lg p-xl"
        style={{ boxShadow: 'var(--shadow-soft)' }}
      >
        <div className="text-3xl mb-md">{pathway.emoji}</div>
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-sm">
          {pathway.name} pathway
        </h2>
        <p className="font-serif text-text-secondary mb-xl">{pathway.hint}</p>
        <div
          className="bg-surface-raised border border-border-subtle rounded-md p-md"
        >
          <p className="font-sans text-sm text-text-muted text-center">
            🚧 This pathway is coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BuildModulesPage() {
  const [selected, setSelected] = useState<Pathway | null>(null);

  const selectedPathway = selected === 'goal'
    ? GOAL_PATHWAY
    : PATHWAYS.find((p) => p.id === selected);

  if (selected === 'material') {
    return (
      <div className="px-md py-lg max-w-2xl mx-auto">
        <MaterialPathwayForm onBack={() => setSelected(null)} />
      </div>
    );
  }

  if (selected && selectedPathway) {
    return (
      <div className="px-md py-lg max-w-2xl mx-auto">
        <ComingSoonView pathway={selectedPathway} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="px-md py-lg max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-xl">
        <h1 className="font-serif text-2xl font-semibold text-text-primary mb-xs">
          Create a module
        </h1>
        <p className="font-serif text-text-secondary">
          Where does your thinking start? Choose a pathway and we&apos;ll build from there.
        </p>
      </div>

      {/* Pathway cards */}
      <div className="flex flex-col gap-sm mb-sm">
        {PATHWAYS.map((pathway) => (
          <button
            key={pathway.id}
            onClick={() => setSelected(pathway.id)}
            className="flex items-start gap-md bg-surface-panel border border-border-subtle rounded-lg p-md text-left w-full transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-surface-hover hover:border-border-medium hover:translate-y-[-1px]"
            style={{
              boxShadow: 'var(--shadow-soft)',
              borderColor: pathway.id === 'retrospective' ? 'rgba(217,123,58,0.25)' : undefined,
            }}
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
                <span
                  className="inline-flex items-center gap-xs mt-xs font-sans text-xs font-medium text-ember rounded-full px-sm"
                  style={{
                    background: 'rgba(217,123,58,0.12)',
                    padding: '2px 8px',
                    marginTop: 6,
                  }}
                >
                  ✨ {pathway.badge}
                </span>
              )}
            </div>
            <span className="text-text-muted text-base self-center flex-shrink-0 transition-colors duration-200 group-hover:text-ember">›</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-md my-md">
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="font-sans text-xs text-text-muted">More structured</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>

      {/* Goal-Forward card */}
      <button
        onClick={() => setSelected(GOAL_PATHWAY.id)}
        className="flex items-start gap-md bg-surface-panel border border-border-subtle rounded-lg p-md text-left w-full transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-surface-hover hover:border-border-medium hover:translate-y-[-1px]"
        style={{ boxShadow: 'var(--shadow-soft)' }}
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

      {/* Fallback link */}
      <p className="font-sans text-sm text-text-muted text-center mt-lg">
        Not sure where to start?{' '}
        <button className="text-ember underline underline-offset-2 transition-colors duration-200 hover:text-ember-hover">
          Browse Activity Discovery
        </button>
      </p>
    </div>
  );
}
