'use client';

import { useId, useState } from 'react';
import { Camera, Check } from '@/components/icons';
import { confirmCopy } from './confirmCopy';

export type ReadDraftRowProps = {
  entryId: string;
  /** The Photo Read's one-sentence description. */
  draft: string;
  onError: (message: string) => void;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
};

const PRIMARY =
  'hearth-press inline-flex min-h-[44px] items-center justify-center rounded-md bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse hover:bg-ember-hover disabled:opacity-60';
const GHOST =
  'hearth-press inline-flex min-h-[44px] items-center justify-center rounded-md border border-border-subtle bg-transparent px-md py-sm font-sans text-sm font-semibold text-text-secondary hover:border-border-medium hover:text-text-primary disabled:opacity-60';

/**
 * The Photo Read draft on the Confirm surface (W3.3; A1, Logger spec v2 §5.2).
 * Model text, so it is shown as an explicit, labelled draft: nothing changes
 * until the parent taps "Use this" (or edits, then uses their version), which
 * PATCHes `/api/entries/[id]/read-draft` and marks the words `drafted_by: 'read'`.
 */
export function ReadDraftRow({ entryId, draft, onError, fetchImpl = fetch }: ReadDraftRowProps) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState(draft);
  const [accepted, setAccepted] = useState<string | null>(null);
  const labelId = useId();
  const fieldId = useId();
  const c = confirmCopy.readDraft;

  async function accept(words: string) {
    const trimmed = words.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await fetchImpl(`/api/entries/${encodeURIComponent(entryId)}/read-draft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setAccepted(trimmed);
    } catch {
      onError(c.error);
    } finally {
      setBusy(false);
    }
  }

  if (accepted) {
    return (
      <div className="flex flex-col gap-xs rounded-md border border-border-subtle bg-surface-raised p-md">
        <p className="body-serif text-[1rem] leading-relaxed text-text-primary">{accepted}</p>
        <span role="status" className="inline-flex items-center gap-xs font-sans text-[12px] text-text-secondary">
          <Check size={14} weight="bold" aria-hidden="true" />
          {c.accepted}
        </span>
      </div>
    );
  }

  return (
    <section
      aria-labelledby={labelId}
      className="hearth-reveal flex flex-col gap-sm rounded-md border border-dashed border-border-medium bg-surface-raised p-md"
    >
      <span id={labelId} className="inline-flex items-center gap-xs font-sans text-[11px] uppercase tracking-[0.08em] text-text-muted">
        <Camera size={14} aria-hidden="true" />
        {c.label}
      </span>

      {editing ? (
        <>
          <label htmlFor={fieldId} className="sr-only">
            {c.editLabel}
          </label>
          <textarea
            id={fieldId}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            disabled={busy}
            className="w-full resize-y rounded-md border border-border-subtle bg-surface-panel p-sm font-serif text-[1rem] text-text-primary focus:border-border-focus focus:outline-none"
          />
          <div className="flex flex-wrap gap-sm">
            <button type="button" className={PRIMARY} disabled={busy || !text.trim()} onClick={() => void accept(text)}>
              {c.saveEdited}
            </button>
            <button
              type="button"
              className={GHOST}
              disabled={busy}
              onClick={() => {
                setText(draft);
                setEditing(false);
              }}
            >
              {c.cancel}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="body-serif text-[1rem] italic leading-relaxed text-text-secondary">{draft}</p>
          <div className="flex flex-wrap gap-sm">
            <button type="button" className={PRIMARY} disabled={busy} onClick={() => void accept(draft)}>
              {c.use}
            </button>
            <button type="button" className={GHOST} disabled={busy} onClick={() => setEditing(true)}>
              {c.edit}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
