'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileData {
  about?: string;
  workingStyle?: string[];
  interests?: string[];
  strengths?: string[];
  notes?: string;
}

interface LearnerProfileClientProps {
  learner: {
    id: string;
    name: string;
    colourToken: string | null;
    age: number | null;
    createdAt: string | null;
    profileData: ProfileData;
  };
  familyName: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WORKING_STYLE_OPTIONS = [
  'Hands-on learner',
  'Loves reading',
  'Needs movement breaks',
  'Morning person',
  'Prefers routine',
  'Thrives on novelty',
  'Works best alone',
  'Collaborative',
  'Visual thinker',
  'Verbal processor',
];

const COLOUR_MAP: Record<string, { dot: string; ring: string; pill: string }> = {
  rose:   { dot: 'bg-child-rose',   ring: 'ring-child-rose/40',   pill: 'bg-child-rose/15 text-child-rose border-child-rose/20' },
  blue:   { dot: 'bg-child-blue',   ring: 'ring-child-blue/40',   pill: 'bg-child-blue/15 text-child-blue border-child-blue/20' },
  sage:   { dot: 'bg-child-sage',   ring: 'ring-child-sage/40',   pill: 'bg-child-sage/15 text-child-sage border-child-sage/20' },
  violet: { dot: 'bg-child-violet', ring: 'ring-child-violet/40', pill: 'bg-child-violet/15 text-child-violet border-child-violet/20' },
  amber:  { dot: 'bg-amber-400',    ring: 'ring-amber-400/40',    pill: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
};

const DEFAULT_COLOUR = COLOUR_MAP.rose;

// ─── Sub-components ──────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
  editing,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  editing: boolean;
  placeholder: string;
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(value: string) {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div
      className={`flex min-h-[44px] flex-wrap gap-xs rounded-[10px] border border-border-subtle bg-surface-raised p-sm transition-all duration-200 ${
        editing ? 'cursor-text' : ''
      }`}
      onClick={() => editing && inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-xs rounded-[6px] bg-surface-hover px-sm py-[3px] font-sans text-xs text-text-secondary"
        >
          {tag}
          {editing && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="ml-[2px] text-text-muted transition-colors hover:text-text-primary"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {editing && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 bg-transparent font-sans text-xs text-text-primary outline-none placeholder:text-text-muted"
        />
      )}
      {!editing && tags.length === 0 && (
        <span className="font-sans text-xs text-text-muted">{placeholder}</span>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function LearnerProfileClient({
  learner,
  familyName,
}: LearnerProfileClientProps) {
  const colour = COLOUR_MAP[learner.colourToken ?? ''] ?? DEFAULT_COLOUR;

  // Local editable state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [about, setAbout] = useState(learner.profileData.about ?? '');
  const [workingStyle, setWorkingStyle] = useState<string[]>(
    learner.profileData.workingStyle ?? []
  );
  const [interests, setInterests] = useState<string[]>(
    learner.profileData.interests ?? []
  );
  const [strengths, setStrengths] = useState<string[]>(
    learner.profileData.strengths ?? []
  );
  const [notes, setNotes] = useState(learner.profileData.notes ?? '');

  // Snapshot for cancel
  const snapshot = useRef({ about, workingStyle, interests, strengths, notes });

  function startEdit() {
    snapshot.current = { about, workingStyle, interests, strengths, notes };
    setEditing(true);
  }

  function cancelEdit() {
    const s = snapshot.current;
    setAbout(s.about);
    setWorkingStyle(s.workingStyle);
    setInterests(s.interests);
    setStrengths(s.strengths);
    setNotes(s.notes);
    setEditing(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/learners/${learner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileData: { about, workingStyle, interests, strengths, notes },
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setEditing(false);
      showToast(`${learner.name}'s portrait saved ✓`);
    } catch {
      showToast('Save failed — please try again');
    } finally {
      setSaving(false);
    }
  }

  function toggleWorkingStyle(tag: string) {
    if (!editing) return;
    setWorkingStyle((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const sinceDate = learner.createdAt
    ? format(new Date(learner.createdAt), 'MMMM yyyy')
    : null;

  return (
    <div className="mx-auto max-w-2xl pb-[120px]">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-md pb-md pt-lg">
        <Link
          href="/our-story"
          className="flex items-center gap-xs font-sans text-xs text-text-muted transition-colors duration-200 hover:text-text-secondary"
        >
          ← Our Story
        </Link>
        <button
          type="button"
          onClick={editing ? cancelEdit : startEdit}
          className={`rounded-[6px] border px-md py-sm font-sans text-xs font-medium transition-all duration-200 ${
            editing
              ? 'border-border-medium bg-surface-raised text-text-secondary'
              : 'border-border-subtle bg-surface-raised text-text-secondary hover:border-border-medium hover:text-text-primary'
          }`}
        >
          {editing ? 'Cancel' : 'Edit portrait'}
        </button>
      </div>

      {/* ── Portrait header ── */}
      <div className="px-md pb-xl">
        <div className="flex items-center gap-md">
          <div
            className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full ${colour.dot} ring-4 ${colour.ring}`}
          >
            <span className="font-serif text-3xl font-semibold text-white/90">
              {learner.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="font-serif text-[2rem] font-semibold leading-none text-text-primary">
              {learner.name}
            </h1>
            <div className="mt-xs flex flex-wrap items-center gap-sm">
              {learner.age !== null && (
                <span className="font-sans text-xs text-text-muted">
                  {learner.age} years old
                </span>
              )}
              {sinceDate && (
                <>
                  {learner.age !== null && (
                    <span className="text-text-muted">·</span>
                  )}
                  <span className="font-sans text-xs text-text-muted">
                    Learning at {familyName} Hearth since {sinceDate}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-xl px-md">

        {/* ── About ── */}
        <section>
          <p className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
            About {learner.name}
          </p>
          {editing ? (
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder={`What makes ${learner.name} unique as a learner?`}
              rows={4}
              className="w-full resize-none rounded-[10px] border border-border-medium bg-surface-raised px-md py-sm font-serif text-base leading-relaxed text-text-primary outline-none placeholder:text-text-muted focus:border-border-medium focus:shadow-[0_0_0_2px_rgba(217,123,58,0.15)] transition-all duration-200"
            />
          ) : about ? (
            <p className="font-serif text-base leading-relaxed text-text-secondary">
              {about}
            </p>
          ) : (
            <p className="font-serif text-base italic text-text-muted">
              What makes {learner.name} unique as a learner?
            </p>
          )}
        </section>

        {/* ── Working Style ── */}
        <section>
          <p className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Working Style
            {editing && (
              <span className="ml-sm font-normal normal-case tracking-normal text-text-muted">
                — tap to select
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-sm">
            {WORKING_STYLE_OPTIONS.map((tag) => {
              const active = workingStyle.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  disabled={!editing}
                  onClick={() => toggleWorkingStyle(tag)}
                  className={`rounded-[6px] border px-sm py-[5px] font-sans text-xs font-medium transition-all duration-200 ${
                    active
                      ? `${colour.pill} border`
                      : editing
                        ? 'border-border-subtle bg-surface-raised text-text-muted hover:border-border-medium hover:text-text-secondary'
                        : 'border-border-subtle bg-surface-raised text-text-muted'
                  } ${!editing && !active ? 'opacity-50' : ''}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Interests ── */}
        <section>
          <p className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Interests
            {editing && (
              <span className="ml-sm font-normal normal-case tracking-normal text-text-muted">
                — type and press Enter
              </span>
            )}
          </p>
          <TagInput
            tags={interests}
            onChange={setInterests}
            editing={editing}
            placeholder="What is she into right now?"
          />
        </section>

        {/* ── Strengths ── */}
        <section>
          <p className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Strengths
            {editing && (
              <span className="ml-sm font-normal normal-case tracking-normal text-text-muted">
                — type and press Enter
              </span>
            )}
          </p>
          <TagInput
            tags={strengths}
            onChange={setStrengths}
            editing={editing}
            placeholder="What does she do well?"
          />
        </section>

        {/* ── Notes ── */}
        <section>
          <div className="mb-md flex items-center gap-sm">
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
              Notes
            </p>
            <span className="rounded-[4px] border border-border-subtle bg-surface-raised px-xs py-[2px] font-sans text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Private
            </span>
          </div>
          {editing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else worth knowing — sensory needs, what helps on hard days, transition strategies…"
              rows={4}
              className="w-full resize-none rounded-[10px] border border-border-medium bg-surface-raised px-md py-sm font-serif text-base leading-relaxed text-text-primary outline-none placeholder:text-text-muted focus:border-border-medium focus:shadow-[0_0_0_2px_rgba(217,123,58,0.15)] transition-all duration-200"
            />
          ) : notes ? (
            <p className="font-serif text-base leading-relaxed text-text-secondary">
              {notes}
            </p>
          ) : (
            <p className="font-serif text-base italic text-text-muted">
              Anything else worth knowing — private, never exported.
            </p>
          )}
        </section>

      </div>

      {/* ── Fixed save bar ── */}
      {editing && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-surface-panel px-md py-md">
          <div className="mx-auto flex max-w-2xl gap-sm">
            <button
              type="button"
              onClick={cancelEdit}
              className="flex-1 rounded-[6px] border border-border-subtle bg-transparent py-sm font-sans text-sm font-semibold text-text-secondary transition-all duration-200 hover:border-border-medium hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-[2] rounded-[6px] bg-ember py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 hover:bg-[#E88F4E] disabled:opacity-60"
            >
              {saving ? 'Saving…' : `Save ${learner.name}'s portrait`}
            </button>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-[80px] left-1/2 z-[60] -translate-x-1/2 rounded-[10px] border border-border-subtle bg-surface-panel px-lg py-sm font-sans text-sm text-text-secondary shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {toast}
        </div>
      )}
    </div>
  );
}
