'use client';

import { useState, useRef } from 'react';
import { Medal, X } from '@/components/icons';

const CAPABILITY_THREADS = [
  'Literacy & Communication', 'Numeracy & Logic', 'Scientific Inquiry',
  'Creative Arts', 'Physical & Wellbeing', 'Digital & Technologies',
  'Humanities & Social Understanding', 'Languages', 'Character & Values',
  'Self-Direction & Executive Function', 'Environmental Stewardship', 'Entrepreneurship & Enterprise',
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadSearch, setThreadSearch] = useState('');
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

  const inputCls = 'w-full bg-surface-raised border border-border-subtle rounded-[6px] px-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition duration-[var(--motion-quick)] focus:border-ember focus:shadow-focus';

  if (saved) {
    return (
      <div className="px-md py-lg max-w-xl mx-auto">
        <div className="bg-surface-panel border border-border-subtle rounded-lg p-xl flex flex-col items-center gap-lg text-center shadow-card">
          {form.emoji ? (
            <span className="text-4xl" aria-hidden="true">{form.emoji}</span>
          ) : (
            <span className="inline-flex text-ember" aria-hidden="true"><Medal size={32} /></span>
          )}
          <div>
            <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">
              Badge created
            </h2>
            <p className="font-serif text-text-secondary">
              <strong className="text-text-primary font-semibold">{form.title}</strong> is ready to award.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="w-full rounded-md border border-ember px-lg py-sm font-sans text-sm font-semibold text-ember transition duration-[var(--motion-quick)] hover:bg-ember-glow"
          >
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-md py-lg max-w-xl mx-auto">
      {/* Page header */}
      <div className="mb-xl">
        <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Build</p>
        <h1 className="font-serif text-2xl font-semibold text-text-primary mb-xs">
          Create a Badge
        </h1>
        <p className="font-serif text-text-secondary">
          Define a capability milestone your learner can earn through demonstrated evidence.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-panel border border-border-subtle rounded-lg p-xl flex flex-col gap-xl shadow-card"
      >
        {/* ─── Identity ─── */}
        <section className="flex flex-col gap-md">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Identity</p>
          <div className="flex gap-sm">
            {/* Emoji */}
            <div className="flex-shrink-0">
              <label className="mb-xs block font-sans text-xs font-medium text-text-secondary">
                Icon
              </label>
              <input
                type="text"
                value={form.emoji}
                onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                placeholder=""
                maxLength={2}
                className="w-16 rounded-[6px] border border-border-subtle bg-surface-raised py-sm text-center font-sans text-xl text-text-primary outline-none transition duration-[var(--motion-quick)] focus:border-ember focus:shadow-focus"
              />
            </div>
            {/* Name */}
            <div className="flex-1">
              <label className="mb-xs block font-sans text-xs font-medium text-text-secondary">
                Badge name <span className="text-text-muted">(required)</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Confident Reader"
                required
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mb-xs block font-sans text-xs font-medium text-text-secondary">
              A learner with this badge can&hellip;
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Read independently for 20+ minutes and discuss what they've understood..."
              rows={3}
              className="w-full resize-y rounded-[6px] border border-border-subtle bg-surface-raised px-md py-sm font-serif text-sm leading-relaxed text-text-primary placeholder:text-text-muted outline-none transition duration-[var(--motion-quick)] focus:border-ember focus:shadow-focus"
            />
          </div>
        </section>

        {/* ─── Observable indicators ─── */}
        <section className="flex flex-col gap-sm">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Observable Indicators</p>
          <p className="font-sans text-xs text-text-muted -mt-xs">What would you see? Up to 5 statements.</p>
          <div className="flex flex-col gap-sm">
            {form.indicators.map((indicator, i) => (
              <div
                key={i}
                className="flex items-center gap-sm rounded-md border border-border-subtle bg-surface-raised px-sm py-xs"
              >
                <span className="w-5 shrink-0 font-sans text-xs text-text-muted text-center">
                  {i + 1}
                </span>
                <input
                  ref={(el) => { indicatorRefs.current[i] = el; }}
                  type="text"
                  value={indicator}
                  onChange={(e) => setIndicator(i, e.target.value)}
                  placeholder="e.g. Chooses to read without prompting"
                  className="flex-1 bg-transparent font-sans text-sm text-text-primary placeholder:text-text-muted outline-none"
                />
                {form.indicators.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIndicator(i)}
                    className="shrink-0 text-text-muted transition-colors duration-[var(--motion-quick)] hover:text-red-400"
                    aria-label="Remove indicator"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {form.indicators.length < 5 && (
            <button
              type="button"
              onClick={addIndicator}
              className="mt-xs flex items-center gap-xs rounded-md border border-dashed border-border-medium px-md py-sm font-sans text-sm text-text-muted transition duration-[var(--motion-quick)] hover:border-ember hover:text-ember"
            >
              <span>+</span> Add indicator statement
            </button>
          )}
        </section>

        {/* ─── Capability thread ─── */}
        <section className="flex flex-col gap-sm">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Capability Thread</p>
          <div className="relative">
            <input
              type="text"
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder="Search capability threads..."
              className="w-full rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none focus:shadow-focus transition duration-[var(--motion-quick)]"
            />
            {threadSearch && (
              <div className="absolute left-0 right-0 top-full z-10 mt-xs rounded-md border border-border-subtle bg-surface-panel shadow-float">
                {CAPABILITY_THREADS.filter((t) =>
                  t.toLowerCase().includes(threadSearch.toLowerCase())
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, capabilityThread: t }));
                      setThreadSearch(t);
                    }}
                    className="block w-full px-md py-sm text-left font-sans text-sm text-text-primary hover:bg-surface-raised transition-colors duration-[var(--motion-quick)] first:rounded-t-md last:rounded-b-md"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          {form.capabilityThread && (
            <p className="mt-xs font-sans text-xs text-text-muted">Selected: <span className="text-ember font-semibold">{form.capabilityThread}</span></p>
          )}
        </section>

        {/* ─── Observation threshold ─── */}
        <section className="flex flex-col gap-sm">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Evidence Threshold</p>
          <p className="font-sans text-xs text-text-muted">Required observations before this badge is ready to assess.</p>
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, observationThreshold: Math.max(1, f.observationThreshold - 1) }))}
              className="flex h-[36px] w-[36px] items-center justify-center rounded-md border border-border-subtle bg-surface-raised font-sans text-lg text-text-secondary transition duration-[var(--motion-quick)] hover:border-border-medium hover:text-text-primary"
            >
              –
            </button>
            <span className="min-w-[48px] text-center font-serif text-xl font-semibold text-text-primary">
              {form.observationThreshold}
            </span>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, observationThreshold: Math.min(20, f.observationThreshold + 1) }))}
              className="flex h-[36px] w-[36px] items-center justify-center rounded-md border border-border-subtle bg-surface-raised font-sans text-lg text-text-secondary transition duration-[var(--motion-quick)] hover:border-border-medium hover:text-text-primary"
            >
              +
            </button>
            <span className="font-sans text-sm text-text-muted">logged observations</span>
          </div>
        </section>

        {error && (
          <p className="font-sans text-sm text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-md border-t border-border-subtle pt-md">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-border-subtle px-lg py-sm font-sans text-sm font-semibold text-text-secondary transition duration-[var(--motion-quick)] hover:border-border-medium hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-ember px-lg py-sm font-sans text-sm font-semibold text-text-inverse shadow-ember transition duration-[var(--motion-quick)] hover:bg-ember-hover disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Create badge'}
          </button>
        </div>
      </form>
    </div>
  );
}
