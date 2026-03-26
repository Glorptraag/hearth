'use client';

import { useState, useRef } from 'react';

const CAPABILITY_THREADS = [
  'Scientific Thinking',
  'Mathematical Reasoning',
  'Creative Expression',
  'Written Communication',
  'Physical Coordination',
  'Social Awareness',
];

interface BadgeForm {
  title: string;
  emoji: string;
  description: string;
  indicators: string[];
  capabilityThread: string;
  observationThreshold: number;
}

export default function BuildBadgesPage() {
  const [form, setForm] = useState<BadgeForm>({
    title: '',
    emoji: '',
    description: '',
    indicators: ['', '', ''],
    capabilityThread: '',
    observationThreshold: 5,
  });
  const [focusField, setFocusField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const indicatorRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setIndicator = (index: number, value: string) => {
    setForm((f) => {
      const next = [...f.indicators];
      next[index] = value;
      return { ...f, indicators: next };
    });
  };

  const addIndicator = () => {
    if (form.indicators.length >= 5) return;
    setForm((f) => ({ ...f, indicators: [...f.indicators, ''] }));
    // Focus new input on next tick
    const nextIndex = form.indicators.length;
    setTimeout(() => indicatorRefs.current[nextIndex]?.focus(), 50);
  };

  const removeIndicator = (index: number) => {
    if (form.indicators.length <= 1) return;
    setForm((f) => ({
      ...f,
      indicators: f.indicators.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError('Badge name is required.');
      return;
    }

    const filledIndicators = form.indicators.filter((i) => i.trim());

    setSaving(true);
    try {
      const res = await fetch('/api/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          emoji: form.emoji.trim() || undefined,
          description: form.description.trim() || undefined,
          indicatorStatements: filledIndicators.length > 0 ? filledIndicators : undefined,
          capabilityThreadIds: form.capabilityThread ? [form.capabilityThread] : undefined,
          observationThreshold: form.observationThreshold,
        }),
      });
      if (!res.ok) throw new Error('Failed to save badge');
      setSaved(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({
      title: '',
      emoji: '',
      description: '',
      indicators: ['', '', ''],
      capabilityThread: '',
      observationThreshold: 5,
    });
    setSaved(false);
    setError(null);
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    padding: '10px 16px',
    borderColor: focusField === field ? '#D97B3A' : undefined,
    boxShadow: focusField === field ? '0 0 0 3px rgba(217,123,58,0.25)' : undefined,
  });

  if (saved) {
    return (
      <div className="px-md py-lg max-w-xl mx-auto">
        <div
          className="bg-surface-panel border border-border-subtle rounded-lg p-xl flex flex-col items-center gap-lg text-center"
          style={{ boxShadow: 'var(--shadow-soft)' }}
        >
          <span className="text-4xl">{form.emoji || '🏅'}</span>
          <div>
            <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">
              Badge created
            </h2>
            <p className="font-serif text-text-secondary">
              <strong className="text-text-primary font-semibold">{form.title}</strong> is ready to award.
            </p>
          </div>
          <div className="flex gap-md w-full">
            <button
              onClick={handleReset}
              className="flex-1 font-sans text-sm font-semibold text-ember border border-ember rounded-md transition-all duration-200"
              style={{ minHeight: 44 }}
            >
              Create another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-md py-lg max-w-xl mx-auto">
      {/* Page header */}
      <div className="mb-xl">
        <h1 className="font-serif text-2xl font-semibold text-text-primary mb-xs">
          🏅 Create a badge
        </h1>
        <p className="font-serif text-text-secondary">
          Define a capability milestone your learner can earn through demonstrated evidence.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-panel border border-border-subtle rounded-lg p-xl flex flex-col gap-lg"
        style={{ boxShadow: 'var(--shadow-soft)' }}
      >
        {/* Badge name + emoji row */}
        <div className="flex gap-sm">
          {/* Emoji */}
          <div className="flex-shrink-0">
            <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
              Emoji
            </label>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
              placeholder="🏅"
              maxLength={2}
              onFocus={() => setFocusField('emoji')}
              onBlur={() => setFocusField(null)}
              className="w-16 bg-surface-raised border border-border-subtle rounded-md font-sans text-xl text-center text-text-primary outline-none transition-all duration-200"
              style={{ ...inputStyle('emoji'), padding: '10px 8px' }}
            />
          </div>
          {/* Name */}
          <div className="flex-1">
            <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
              Badge name <span className="text-text-muted">(required)</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Confident Reader"
              required
              onFocus={() => setFocusField('title')}
              onBlur={() => setFocusField(null)}
              className="w-full bg-surface-raised border border-border-subtle rounded-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200"
              style={inputStyle('title')}
            />
          </div>
        </div>

        {/* Capability description */}
        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
            A learner with this badge can&hellip;
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Read independently for 20+ minutes and discuss what they've understood..."
            rows={3}
            onFocus={() => setFocusField('description')}
            onBlur={() => setFocusField(null)}
            className="w-full bg-surface-raised border border-border-subtle rounded-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y transition-all duration-200"
            style={{
              ...inputStyle('description'),
              lineHeight: 1.6,
            }}
          />
        </div>

        {/* Observable indicators */}
        <div>
          <div className="flex items-center justify-between mb-xs">
            <label className="font-sans text-xs font-medium text-text-secondary">
              What would you see? <span className="text-text-muted">(observable indicators)</span>
            </label>
            {form.indicators.length < 5 && (
              <button
                type="button"
                onClick={addIndicator}
                className="font-sans text-xs font-semibold text-ember transition-colors duration-200 hover:text-ember-hover"
              >
                + Add
              </button>
            )}
          </div>
          <div className="flex flex-col gap-sm">
            {form.indicators.map((indicator, i) => (
              <div key={i} className="flex gap-sm items-center">
                <span className="font-sans text-xs text-text-muted w-4 flex-shrink-0 text-right">
                  {i + 1}.
                </span>
                <input
                  ref={(el) => { indicatorRefs.current[i] = el; }}
                  type="text"
                  value={indicator}
                  onChange={(e) => setIndicator(i, e.target.value)}
                  placeholder="e.g. Chooses to read without prompting"
                  onFocus={() => setFocusField(`ind-${i}`)}
                  onBlur={() => setFocusField(null)}
                  className="flex-1 bg-surface-raised border border-border-subtle rounded-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200"
                  style={inputStyle(`ind-${i}`)}
                />
                {form.indicators.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIndicator(i)}
                    className="font-sans text-sm text-text-muted hover:text-red-400 transition-colors duration-200 flex-shrink-0"
                    title="Remove"
                    style={{ minWidth: 20, minHeight: 20 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="font-sans text-xs text-text-muted mt-xs">
            {form.indicators.length} of 5 indicators
          </p>
        </div>

        {/* Capability thread */}
        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
            Linked capability thread
          </label>
          <select
            value={form.capabilityThread}
            onChange={(e) => setForm((f) => ({ ...f, capabilityThread: e.target.value }))}
            onFocus={() => setFocusField('thread')}
            onBlur={() => setFocusField(null)}
            className="w-full bg-surface-raised border border-border-subtle rounded-md font-sans text-sm text-text-primary outline-none transition-all duration-200 cursor-pointer"
            style={{
              ...inputStyle('thread'),
              color: form.capabilityThread ? undefined : '#6B5D52',
            }}
          >
            <option value="" disabled style={{ color: '#6B5D52' }}>
              Select a capability thread…
            </option>
            {CAPABILITY_THREADS.map((thread) => (
              <option key={thread} value={thread} style={{ background: '#252117', color: '#E8DFD4' }}>
                {thread}
              </option>
            ))}
          </select>
        </div>

        {/* Required observations */}
        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
            Required observations before badge is ready
          </label>
          <div className="flex items-center gap-md">
            <input
              type="number"
              value={form.observationThreshold}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  observationThreshold: Math.max(1, parseInt(e.target.value) || 1),
                }))
              }
              min={1}
              max={20}
              onFocus={() => setFocusField('threshold')}
              onBlur={() => setFocusField(null)}
              className="w-20 bg-surface-raised border border-border-subtle rounded-md font-sans text-sm text-text-primary text-center outline-none transition-all duration-200"
              style={inputStyle('threshold')}
            />
            <p className="font-sans text-sm text-text-muted">
              logged observations
            </p>
          </div>
        </div>

        {error && (
          <p className="font-sans text-sm text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div
          className="flex justify-end gap-md pt-sm border-t border-border-subtle"
        >
          <button
            type="button"
            onClick={handleReset}
            className="font-sans text-sm font-semibold text-ember border border-border-subtle rounded-md transition-all duration-200"
            style={{ minHeight: 44, padding: '0 24px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="font-sans text-sm font-semibold text-text-inverse bg-ember rounded-md transition-all duration-200 disabled:opacity-50"
            style={{
              minHeight: 44,
              padding: '0 24px',
              boxShadow: '0 4px 16px rgba(217,123,58,0.3)',
            }}
          >
            {saving ? 'Saving…' : 'Create badge'}
          </button>
        </div>
      </form>
    </div>
  );
}
