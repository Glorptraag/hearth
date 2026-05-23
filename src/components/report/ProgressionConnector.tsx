'use client';

import { useState } from 'react';
import { ArrowRight, Sparkle, PencilSimple, Check } from '@/components/icons';

type Props = {
  reportId: string;
  pair: 'english' | 'maths' | 'choice';
  pairLabel: string;
  earlyConfirmed: boolean;
  lateConfirmed: boolean;
  lateSampleId: string | null;
  summary: string | null;
  edited: boolean;
  onChanged: () => void;
};

// Sits between early + late sample cards in a subject pair. Only fully
// active once BOTH halves are confirmed — until then it nudges the parent
// to finish annotating. Once both are confirmed the parent can generate a
// progression sentence and edit it inline (which sets edited=true and
// freezes the AI overwrite).
export default function ProgressionConnector({
  reportId,
  pair,
  pairLabel,
  earlyConfirmed,
  lateConfirmed,
  lateSampleId,
  summary,
  edited,
  onChanged,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(summary ?? '');
  const [saving, setSaving] = useState(false);
  const bothConfirmed = earlyConfirmed && lateConfirmed;

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/report/${reportId}/progression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pair }),
      });
      if (res.ok) {
        const data = await res.json();
        setDraft(data.summary ?? '');
        onChanged();
      }
    } catch {
      // ignore
    }
    setGenerating(false);
  };

  const handleSaveEdit = async () => {
    if (!lateSampleId || saving) return;
    setSaving(true);
    try {
      await fetch(`/api/report/${reportId}/samples/${lateSampleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressionSummary: draft || null,
          progressionSummaryEdited: true,
        }),
      });
      setEditing(false);
      onChanged();
    } catch {
      // ignore
    }
    setSaving(false);
  };

  if (!bothConfirmed) {
    return (
      <div className="rounded-md border border-dashed border-border-subtle bg-surface-panel/50 px-md py-sm flex items-center gap-sm">
        <ArrowRight size={14} className="text-text-muted shrink-0" aria-hidden="true" />
        <p className="font-sans text-[11px] text-text-muted">
          Confirm both {pairLabel} samples to unlock the progression summary.
        </p>
      </div>
    );
  }

  if (!summary && !editing) {
    return (
      <div className="rounded-md border border-border-subtle bg-surface-raised px-md py-sm flex items-center justify-between gap-sm">
        <div className="flex items-center gap-sm">
          <Sparkle size={14} weight="fill" className="text-ember shrink-0" aria-hidden="true" />
          <p className="font-sans text-[11px] text-text-secondary">
            Generate a 1–2 sentence progression summary for {pairLabel}.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-md bg-ember text-text-inverse px-md py-xs font-sans text-[11px] font-semibold whitespace-nowrap hover:bg-ember-hover transition-colors disabled:opacity-60"
        >
          {generating ? 'Drafting…' : 'Generate'}
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="rounded-md border border-ember/30 bg-surface-raised px-md py-sm">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-xs">
          {pairLabel} progression
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border-subtle bg-surface-panel px-sm py-xs font-serif text-xs text-text-primary focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember/30 resize-none"
        />
        <div className="flex items-center justify-end gap-xs mt-xs">
          <button
            onClick={() => { setDraft(summary ?? ''); setEditing(false); }}
            className="rounded-md px-sm py-[2px] font-sans text-[10px] text-text-muted hover:text-text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={saving}
            className="rounded-md bg-sage text-surface-body px-md py-[2px] font-sans text-[10px] font-semibold hover:bg-sage/90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border-subtle bg-surface-raised px-md py-sm">
      <div className="flex items-center justify-between gap-sm mb-xs">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-wide text-text-muted inline-flex items-center gap-xs">
          {pairLabel} progression
          {edited ? (
            <span className="inline-flex items-center gap-xs text-sage normal-case font-medium">
              <Check size={10} aria-hidden="true" /> edited
            </span>
          ) : (
            <span className="inline-flex items-center gap-xs text-ember normal-case font-medium">
              <Sparkle size={10} weight="fill" aria-hidden="true" /> AI draft
            </span>
          )}
        </p>
        <div className="flex items-center gap-xs">
          {!edited && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="font-sans text-[10px] text-text-muted hover:text-text-secondary"
            >
              {generating ? 'Drafting…' : 'Regenerate'}
            </button>
          )}
          <button
            onClick={() => { setDraft(summary ?? ''); setEditing(true); }}
            className="inline-flex items-center gap-xs font-sans text-[10px] text-ember hover:text-ember-hover"
          >
            <PencilSimple size={10} aria-hidden="true" /> Edit
          </button>
        </div>
      </div>
      <p className="font-serif text-xs text-text-secondary leading-relaxed">{summary}</p>
    </div>
  );
}
