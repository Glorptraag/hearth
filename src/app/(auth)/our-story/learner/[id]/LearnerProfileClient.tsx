'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { LEARNER_COLOUR_MAP } from '@/components/ui/LearnerAvatar';
import { useToast } from '@/hooks/use-toast';
import { Sparkle, Medal, Plant, Lock } from '@/components/icons';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileData {
  about?: string;
  workingStyle?: string[];
  interests?: string[];
  strengths?: string[];
  notes?: string;
  tagline?: string | null;
  sparks?: Array<{ name: string; count?: number }>;
  attentionWindowStart?: number | null;
  attentionWindowEnd?: number | null;
  preferredTimes?: string[] | null;
  stylePreferences?: Record<string, string> | null;
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
  /** Decrypted facilitator private note (E19) — sourced from the encrypted
   *  facilitator_notes table, never from profileData. */
  facilitatorNote?: string;
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

const COLOUR_MAP = LEARNER_COLOUR_MAP;
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
  facilitatorNote = '',
}: LearnerProfileClientProps) {
  const colour = COLOUR_MAP[learner.colourToken ?? ''] ?? DEFAULT_COLOUR;
  const { toast } = useToast();

  // Local editable state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

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
  const [tagline, setTagline] = useState(learner.profileData.tagline ?? '');
  const [taglineEditing, setTaglineEditing] = useState(false);
  const [facilitatorNotes, setFacilitatorNotes] = useState(facilitatorNote);
  const [facilitatorNotesEditing, setFacilitatorNotesEditing] = useState(false);
  const [attentionWindowStart, setAttentionWindowStart] = useState(
    learner.profileData.attentionWindowStart ?? 9
  );
  const [attentionWindowEnd, setAttentionWindowEnd] = useState(
    learner.profileData.attentionWindowEnd ?? 12
  );
  const [preferredTimes, setPreferredTimes] = useState<string[]>(
    learner.profileData.preferredTimes ?? []
  );
  const [stylePreferences, setStylePreferences] = useState<Record<string, string>>(
    learner.profileData.stylePreferences ?? {}
  );

  // Snapshot for cancel
  const snapshot = useRef({
    about,
    workingStyle,
    interests,
    strengths,
    notes,
    tagline,
    facilitatorNotes,
    attentionWindowStart,
    attentionWindowEnd,
    preferredTimes,
    stylePreferences,
  });

  function startEdit() {
    snapshot.current = {
      about,
      workingStyle,
      interests,
      strengths,
      notes,
      tagline,
      facilitatorNotes,
      attentionWindowStart,
      attentionWindowEnd,
      preferredTimes,
      stylePreferences,
    };
    setEditing(true);
  }

  function cancelEdit() {
    const s = snapshot.current;
    setAbout(s.about);
    setWorkingStyle(s.workingStyle);
    setInterests(s.interests);
    setStrengths(s.strengths);
    setNotes(s.notes);
    setTagline(s.tagline);
    setFacilitatorNotes(s.facilitatorNotes);
    setAttentionWindowStart(s.attentionWindowStart);
    setAttentionWindowEnd(s.attentionWindowEnd);
    setPreferredTimes(s.preferredTimes);
    setStylePreferences(s.stylePreferences);
    setEditing(false);
  }

  async function save() {
    setSaving(true);
    try {
      // Profile fields and the facilitator private note are two distinct stores:
      // profileData (plaintext JSON) and the encrypted facilitator_notes table.
      // Facilitator notes are NEVER written into profileData.
      const [profileRes, notesRes] = await Promise.all([
        fetch(`/api/learners/${learner.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileData: {
              about,
              workingStyle,
              interests,
              strengths,
              notes,
              tagline,
              attentionWindowStart,
              attentionWindowEnd,
              preferredTimes,
              stylePreferences,
            },
          }),
        }),
        fetch(`/api/learners/${learner.id}/facilitator-notes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteText: facilitatorNotes }),
        }),
      ]);
      if (!profileRes.ok || !notesRes.ok) throw new Error('Save failed');
      setEditing(false);
      toast(`${learner.name}'s portrait saved`);
    } catch {
      toast('Save failed — please try again', 'error');
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
    <div
      style={{ '--color-child-accent': `var(${(LEARNER_COLOUR_MAP[learner.colourToken ?? 'rose'] ?? LEARNER_COLOUR_MAP.rose).cssVar})` } as React.CSSProperties}
      className="mx-auto max-w-2xl pb-[120px]"
    >
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
            className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 ${colour.dot} ring-4 ${colour.ring}`}
            style={{ borderColor: `color-mix(in srgb, var(--color-child-accent) 40%, transparent)` }}
          >
            <span className="font-serif text-3xl font-semibold text-text-inverse">
              {learner.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="font-serif text-[2rem] font-semibold leading-none text-text-primary">
              {learner.name}
            </h1>
            {taglineEditing && editing ? (
              <input
                autoFocus
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                onBlur={() => setTaglineEditing(false)}
                className="mt-xs w-full bg-transparent font-serif text-base italic text-text-secondary border-b border-border-subtle focus:outline-none transition-colors duration-200 focus:[border-color:var(--color-child-accent)]"
                placeholder="Add a tagline..."
              />
            ) : (
              <button
                onClick={() => editing && setTaglineEditing(true)}
                disabled={!editing}
                className={`mt-xs ${editing ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {tagline ? (
                  <p className="font-serif text-base italic text-text-secondary hover:text-text-primary transition-colors duration-200">
                    {tagline}
                  </p>
                ) : (
                  <p className="font-serif text-base italic text-text-muted">
                    {editing ? 'Add a tagline...' : ''}
                  </p>
                )}
              </button>
            )}
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

        {/* ── Empty profile banner ── */}
        {!learner.profileData.about &&
          (!learner.profileData.workingStyle || learner.profileData.workingStyle.length === 0) &&
          (!learner.profileData.interests || learner.profileData.interests.length === 0) &&
          (!learner.profileData.strengths || learner.profileData.strengths.length === 0) && (
          <div className="flex flex-col items-center gap-sm rounded-[16px] border border-border-subtle bg-surface-panel px-lg py-lg text-center shadow-card">
            <span className="inline-flex text-ember" aria-hidden="true">
              <Sparkle size={32} />
            </span>
            <h2 className="font-serif text-lg font-semibold text-text-primary">
              {learner.name}&rsquo;s profile is ready to grow
            </h2>
            <p className="font-serif text-sm text-text-secondary leading-relaxed">
              Add a few details about how {learner.name} learns best. Tap &ldquo;Edit portrait&rdquo; above to get started.
            </p>
          </div>
        )}

        {/* ── Sparks ── */}
        {learner.profileData.sparks && learner.profileData.sparks.length > 0 && (
          <section>
            <p className="mb-sm font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Sparks
            </p>
            <div className="flex flex-wrap gap-xs">
              {learner.profileData.sparks.map((spark, i) => (
                <div
                  key={i}
                  className="flex items-center gap-xs rounded-full border border-border-subtle bg-surface-raised px-md py-xs"
                >
                  <span className="font-serif text-sm text-text-primary">
                    {spark.name}
                  </span>
                  {spark.count !== undefined && (
                    <span className="rounded-full bg-ember/15 px-xs py-[1px] font-sans text-[10px] font-semibold text-ember">
                      {spark.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Learning Rhythms ── */}
        <section>
          <p className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Learning Rhythms
          </p>

          {/* Attention Window Dot Bar */}
          <div className="mb-xl">
            <p className="mb-sm font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Attention Window
            </p>
            <div className="flex items-center gap-xs">
              {Array.from({ length: 12 }, (_, i) => i + 7).map((h) => (
                <div
                  key={h}
                  className={`h-2 w-2 rounded-full transition-all duration-200 ${
                    h >= attentionWindowStart && h < attentionWindowEnd
                      ? 'bg-ember shadow-[0_0_4px_rgba(217,123,58,0.4)]'
                      : 'bg-surface-hover'
                  }`}
                  title={`${h}:00`}
                />
              ))}
              <span className="ml-xs font-sans text-[11px] text-text-muted">
                {attentionWindowStart}am–{attentionWindowEnd > 12 ? `${attentionWindowEnd - 12}pm` : `${attentionWindowEnd}am`}
              </span>
            </div>
          </div>

          {/* Time-of-Day Preference Badges */}
          <div className="mb-xl">
            <p className="mb-sm font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Best Learning Times
            </p>
            <div className="flex flex-wrap gap-xs">
              {['Morning', 'Afternoon', 'Evening'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    if (!editing) return;
                    setPreferredTimes((prev) =>
                      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                    );
                  }}
                  disabled={!editing}
                  className={`rounded-full border px-md py-[4px] font-sans text-xs font-semibold transition-all duration-200 ${
                    preferredTimes.includes(t)
                      ? 'border-ember bg-ember/15 text-ember'
                      : editing
                        ? 'border-border-subtle bg-transparent text-text-muted hover:text-text-secondary'
                        : 'border-border-subtle bg-transparent text-text-muted'
                  } ${!editing && !preferredTimes.includes(t) ? 'opacity-50' : ''}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Environment & Social Style Toggles */}
          {[
            { key: 'environment', options: ['Indoor', 'Outdoor', 'Both'] },
            { key: 'social', options: ['Solo', 'Paired', 'Group'] },
          ].map(({ key, options }) => (
            <div key={key} className="mb-md">
              <p className="mb-xs font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted capitalize">
                {key}
              </p>
              <div className="flex gap-xs">
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      if (!editing) return;
                      setStylePreferences((prev) => ({
                        ...prev,
                        [key]: opt,
                      }));
                    }}
                    disabled={!editing}
                    className={`rounded-md border px-sm py-[3px] font-sans text-xs font-semibold transition-all duration-200 ${
                      stylePreferences[key] === opt
                        ? 'border-ember bg-ember/15 text-ember'
                        : editing
                          ? 'border-border-subtle bg-transparent text-text-muted hover:text-text-secondary'
                          : 'border-border-subtle bg-transparent text-text-muted'
                    } ${!editing && stylePreferences[key] !== opt ? 'opacity-50' : ''}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

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
              className="w-full resize-none rounded-[10px] border border-border-medium bg-surface-raised px-md py-sm font-serif text-base leading-relaxed text-text-primary outline-none placeholder:text-text-muted focus:border-border-medium focus:shadow-focus transition-all duration-200"
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

        {/* ── Bright Moments ── */}
        <section>
          <p className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Bright Moments
          </p>
          <div className="rounded-[10px] border border-border-subtle bg-surface-panel p-lg text-center">
            <span className="inline-flex text-text-secondary" aria-hidden="true">
              <Medal size={22} />
            </span>
            <p className="mt-sm font-serif text-sm text-text-muted">
              Badges earned will appear here as {learner.name}&rsquo;s portfolio grows.
            </p>
          </div>
        </section>

        {/* ── Family Thread ── */}
        <section>
          <p className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Family Thread
          </p>
          <div className="rounded-[10px] border border-border-subtle bg-surface-panel p-lg text-center">
            <span className="inline-flex text-text-secondary" aria-hidden="true">
              <Plant size={22} />
            </span>
            <p className="mt-sm font-serif text-sm text-text-muted">
              Shared learning moments with siblings will appear here.
            </p>
          </div>
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
              className="w-full resize-none rounded-[10px] border border-border-medium bg-surface-raised px-md py-sm font-serif text-base leading-relaxed text-text-primary outline-none placeholder:text-text-muted focus:border-border-medium focus:shadow-focus transition-all duration-200"
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

        {/* ── Facilitator Notes ── */}
        <section>
          <div className="mb-md flex items-center gap-xs">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Facilitator Notes
            </p>
            <span className="inline-flex items-center gap-xs rounded-full bg-surface-raised px-xs py-[1px] font-sans text-[9px] text-text-muted border border-border-subtle">
              <Lock size={10} aria-hidden="true" /> Private
            </span>
          </div>
          {facilitatorNotesEditing && editing ? (
            <textarea
              autoFocus
              value={facilitatorNotes}
              onChange={(e) => setFacilitatorNotes(e.target.value)}
              onBlur={() => setFacilitatorNotesEditing(false)}
              rows={4}
              className="w-full rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-serif text-sm text-text-secondary focus:border-ember focus:outline-none resize-none transition-all duration-200"
              placeholder="Private notes about this learner's style, needs, or observations…"
            />
          ) : (
            <button
              onClick={() => editing && setFacilitatorNotesEditing(true)}
              disabled={!editing}
              className="w-full text-left rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-serif text-sm italic text-text-secondary hover:border-border-medium transition-all duration-200 disabled:cursor-default"
            >
              {facilitatorNotes ? (
                facilitatorNotes
              ) : (
                <span className="text-text-muted">
                  {editing ? 'Add private notes...' : ''}
                </span>
              )}
            </button>
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

    </div>
  );
}
