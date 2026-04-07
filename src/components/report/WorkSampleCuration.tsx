'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { useFocusTrap } from '@/hooks/use-focus-trap';

// ─── Types ───

type Entry = {
  id: string;
  title: string;
  dateOccurred: string;
  subjects: string[] | null;
  evidenceUrls: string[] | null;
  description: string | null;
  heuCandidate: boolean | null;
  source: string;
  aiEnrichment: {
    subjects_detected?: string[];
    curriculum_descriptors?: { code: string; confidence: number }[];
  } | null;
};

type WorkSampleData = {
  id: string;
  reportId: string;
  slot: string;
  entryId: string | null;
  status: string;
  annotation: Annotation | null;
};

type Annotation = {
  id: string;
  observations: string | null;
  observationsSource: string | null;
  needsStrengths: string | null;
  needsStrengthsSource: string | null;
  adjustment: string | null;
  adjustmentSource: string | null;
  planning: string | null;
  planningSource: string | null;
  progressionSummary: string | null;
  progressionSummaryEdited: boolean | null;
  confirmedAt: string | null;
};

type SlotConfig = {
  id: number;
  area: string;
  altArea?: string;
  areaLabel: string;
  label: string;
  timing: string;
  termHalf: 'early' | 'late';
};

// ─── Props ───

type Props = {
  reportId: string;
  slot: SlotConfig;
  entries: Entry[];
  reportYear: number;
  sample: WorkSampleData | null;
  onSampleChanged: () => void;
  onClose: () => void;
};

const ANNOTATION_FIELDS = [
  { key: 'observations', label: 'What I observed', placeholder: 'Describe what you saw during this learning moment...' },
  { key: 'needsStrengths', label: 'Needs & strengths', placeholder: 'What strengths did you notice? What needs emerged?' },
  { key: 'adjustment', label: 'How I adjusted', placeholder: 'How did you respond or adapt to what you observed?' },
  { key: 'planning', label: 'Where to next', placeholder: 'What learning directions might follow from this?' },
] as const;

const SUBJECT_EMOJI: Record<string, string> = {
  english: '📚', mathematics: '🔢', science: '🔬', hass: '🌏',
  arts: '🎨', technologies: '⚙️', hpe: '🏃', languages: '🗣️',
};

export default function WorkSampleCuration({
  reportId,
  slot,
  entries,
  reportYear,
  sample,
  onSampleChanged,
  onClose,
}: Props) {
  const [view, setView] = useState<'candidates' | 'annotate'>(
    sample?.entryId ? 'annotate' : 'candidates'
  );
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(sample?.entryId ?? null);
  const [saving, setSaving] = useState(false);
  const [annotationDraft, setAnnotationDraft] = useState({
    observations: sample?.annotation?.observations ?? '',
    needsStrengths: sample?.annotation?.needsStrengths ?? '',
    adjustment: sample?.annotation?.adjustment ?? '',
    planning: sample?.annotation?.planning ?? '',
  });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trapRef = useFocusTrap(true);

  // Filter entries to candidates for this slot
  const candidates = entries.filter((e) => {
    const d = new Date(e.dateOccurred + 'T00:00:00');
    if (d.getFullYear() !== reportYear) return false;
    const month = d.getMonth() + 1;
    const inHalf = slot.termHalf === 'early' ? month <= 6 : month >= 7;
    if (!inHalf) return false;
    const subjects = new Set([
      ...(e.subjects ?? []),
      ...(e.aiEnrichment?.subjects_detected ?? []).map((s) => s.toLowerCase()),
    ]);
    return subjects.has(slot.area) || (slot.altArea ? subjects.has(slot.altArea) : false);
  });

  // Sort: HEU candidates first, then by evidence, then by recency
  const sortedCandidates = [...candidates].sort((a, b) => {
    if (a.heuCandidate && !b.heuCandidate) return -1;
    if (!a.heuCandidate && b.heuCandidate) return 1;
    const aEvidence = (a.evidenceUrls?.length ?? 0) > 0;
    const bEvidence = (b.evidenceUrls?.length ?? 0) > 0;
    if (aEvidence !== bEvidence) return aEvidence ? -1 : 1;
    return new Date(b.dateOccurred).getTime() - new Date(a.dateOccurred).getTime();
  });

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) ?? null;

  const handleSelect = async (entryId: string) => {
    const slotKey = sample?.slot ?? '';
    setSaving(true);
    try {
      await fetch(`/api/report/${reportId}/samples`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: slotKey, entryId }),
      });
      setSelectedEntryId(entryId);
      setView('annotate');
      onSampleChanged();
    } catch {
      // ignore
    }
    setSaving(false);
  };

  const handleRemove = async () => {
    const slotKey = sample?.slot ?? '';
    setSaving(true);
    try {
      await fetch(`/api/report/${reportId}/samples`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: slotKey, entryId: null }),
      });
      setSelectedEntryId(null);
      setAnnotationDraft({ observations: '', needsStrengths: '', adjustment: '', planning: '' });
      setView('candidates');
      onSampleChanged();
    } catch {
      // ignore
    }
    setSaving(false);
  };

  // Auto-save annotation with debounce
  const saveAnnotation = useCallback(async (draft: typeof annotationDraft, confirmed?: boolean) => {
    if (!sample?.id) return;
    try {
      await fetch(`/api/report/${reportId}/samples/${sample.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observations: draft.observations || null,
          observationsSource: 'parent_written',
          needsStrengths: draft.needsStrengths || null,
          needsStrengthsSource: 'parent_written',
          adjustment: draft.adjustment || null,
          adjustmentSource: 'parent_written',
          planning: draft.planning || null,
          planningSource: 'parent_written',
          ...(confirmed ? { confirmed: true } : {}),
        }),
      });
      onSampleChanged();
    } catch {
      // ignore
    }
  }, [sample, reportId, onSampleChanged]);

  const handleFieldChange = (key: string, value: string) => {
    const next = { ...annotationDraft, [key]: value };
    setAnnotationDraft(next);
    // Debounced auto-save
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveAnnotation(next), 5000);
  };

  const handleConfirm = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    await saveAnnotation(annotationDraft, true);
    setSaving(false);
  };

  // Cleanup timer
  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const filledFields = ANNOTATION_FIELDS.filter((f) => annotationDraft[f.key]?.trim()).length;
  const isComplete = filledFields === 4;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-overlay-backdrop backdrop-blur-sm">
      <div ref={trapRef} role="dialog" aria-modal="true" aria-labelledby="work-sample-title" className="w-full max-w-[640px] max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-surface-body border border-border-subtle shadow-medium" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface-body border-b border-border-subtle px-lg py-md flex items-center justify-between">
          <div>
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">{slot.areaLabel}</p>
            <h3 id="work-sample-title" className="font-serif text-lg font-semibold text-text-primary">{slot.label}</h3>
            <p className="font-sans text-xs text-text-muted">{slot.timing}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-sm hover:bg-surface-hover transition-colors text-text-muted hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        {/* Tab toggle */}
        {selectedEntryId && (
          <div className="flex border-b border-border-subtle">
            <button
              onClick={() => setView('candidates')}
              className={`flex-1 py-sm font-sans text-xs font-semibold text-center transition-colors ${
                view === 'candidates' ? 'text-ember border-b-2 border-ember' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Change Sample
            </button>
            <button
              onClick={() => setView('annotate')}
              className={`flex-1 py-sm font-sans text-xs font-semibold text-center transition-colors ${
                view === 'annotate' ? 'text-ember border-b-2 border-ember' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Annotate ({filledFields}/4)
            </button>
          </div>
        )}

        <div className="p-lg">
          {/* ─── Candidate List ─── */}
          {view === 'candidates' && (
            <div>
              {sortedCandidates.length === 0 ? (
                <div className="text-center py-xl">
                  <p className="text-3xl mb-sm" aria-hidden="true">📭</p>
                  <p className="font-serif text-sm text-text-secondary">No matching entries found for this slot.</p>
                  <p className="font-sans text-xs text-text-muted mt-xs">
                    Log a {slot.areaLabel.toLowerCase()} activity from {slot.timing.split('·')[1]?.trim()} to see candidates here.
                  </p>
                </div>
              ) : (
                <div className="space-y-sm">
                  <p className="font-sans text-xs text-text-muted mb-sm">
                    {sortedCandidates.length} candidate{sortedCandidates.length !== 1 ? 's' : ''} — tap to select
                  </p>
                  {sortedCandidates.map((entry) => {
                    const isSelected = entry.id === selectedEntryId;
                    const hasEvidence = (entry.evidenceUrls?.length ?? 0) > 0;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => handleSelect(entry.id)}
                        disabled={saving}
                        className={`w-full text-left rounded-lg border p-md transition-all duration-200 ${
                          isSelected
                            ? 'border-ember bg-ember/5'
                            : 'border-border-subtle bg-surface-raised hover:border-border-medium hover:translate-y-[-1px]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-sm">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-sm">
                              <p className="font-serif text-sm font-semibold text-text-primary truncate">{entry.title}</p>
                              {entry.source === 'hearth_session' && (
                                <span className="inline-flex items-center gap-xs px-2 py-0.5 bg-ember/[0.08] text-ember border border-ember/15 rounded-[6px] font-sans text-[0.65rem] font-medium whitespace-nowrap">
                                  🔥 From community
                                </span>
                              )}
                            </div>
                            <p className="font-sans text-xs text-text-muted mt-[2px]">
                              {format(new Date(entry.dateOccurred + 'T00:00:00'), 'd MMM yyyy')}
                            </p>
                            {entry.description && (
                              <p className="font-serif text-xs text-text-secondary mt-xs line-clamp-2">{entry.description}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-xs shrink-0">
                            {entry.heuCandidate && (
                              <span className="rounded-full bg-sage/15 text-sage px-sm py-[1px] font-sans text-[10px] font-semibold">
                                📋 Work Sample
                              </span>
                            )}
                            {hasEvidence && (
                              <span className="rounded-full bg-ember-glow text-ember px-sm py-[1px] font-sans text-[10px] font-semibold">
                                📷 {entry.evidenceUrls!.length}
                              </span>
                            )}
                            {isSelected && (
                              <span className="rounded-full bg-ember/15 text-ember px-sm py-[1px] font-sans text-[10px] font-semibold">
                                ✓ Selected
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Subject chips */}
                        <div className="flex flex-wrap gap-xs mt-sm">
                          {[...(entry.subjects ?? [])].map((s) => (
                            <span key={s} className="rounded-full bg-surface-hover px-sm py-[1px] font-sans text-[10px] text-text-muted">
                              {SUBJECT_EMOJI[s] ?? ''} {s}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Remove current selection */}
              {selectedEntryId && (
                <button
                  onClick={handleRemove}
                  disabled={saving}
                  className="mt-md w-full rounded-md border border-red-900/30 bg-red-900/10 py-sm font-sans text-xs font-semibold text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  Remove current selection
                </button>
              )}
            </div>
          )}

          {/* ─── Annotation Form ─── */}
          {view === 'annotate' && selectedEntry && (
            <div>
              {/* Selected entry summary */}
              <div className="rounded-lg border border-border-subtle bg-surface-raised p-md mb-lg">
                <p className="font-serif text-sm font-semibold text-text-primary">{selectedEntry.title}</p>
                <p className="font-sans text-xs text-text-muted mt-[2px]">
                  {format(new Date(selectedEntry.dateOccurred + 'T00:00:00'), 'd MMM yyyy')}
                </p>
                {selectedEntry.description && (
                  <p className="font-serif text-xs text-text-secondary mt-sm">{selectedEntry.description}</p>
                )}
              </div>

              {/* Annotation quality indicator */}
              <div className="flex items-center gap-sm mb-md">
                <div className="flex gap-[3px]">
                  {ANNOTATION_FIELDS.map((f) => (
                    <div
                      key={f.key}
                      className={`h-[4px] w-[32px] rounded-full transition-colors duration-200 ${
                        annotationDraft[f.key]?.trim() ? 'bg-sage' : 'bg-surface-hover'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-sans text-[10px] text-text-muted">
                  {filledFields}/4 fields
                  {isComplete ? ' — ready to confirm' : ''}
                </span>
              </div>

              {/* 4 annotation fields */}
              <div className="space-y-md">
                {ANNOTATION_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label className="block font-sans text-xs font-semibold text-text-secondary mb-xs">
                      {field.label}
                    </label>
                    <textarea
                      value={annotationDraft[field.key]}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full rounded-md border border-border-subtle bg-surface-panel px-md py-sm font-serif text-sm text-text-primary placeholder:text-text-muted/50 focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember/30 resize-none transition-colors"
                    />
                  </div>
                ))}
              </div>

              <p className="font-sans text-[10px] text-text-muted mt-sm">Auto-saves every 5 seconds while typing.</p>

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                disabled={saving || !isComplete}
                className={`mt-lg w-full rounded-md py-sm font-sans text-sm font-semibold transition-all duration-200 ${
                  isComplete
                    ? 'bg-sage text-surface-body hover:bg-sage/90 shadow-[0_4px_16px_rgba(74,222,128,0.2)]'
                    : 'bg-surface-raised text-text-muted cursor-not-allowed opacity-50'
                }`}
              >
                {saving ? 'Saving...' : sample?.annotation?.confirmedAt ? '✓ Confirmed — Update' : 'Confirm Work Sample'}
              </button>

              {sample?.annotation?.confirmedAt && (
                <p className="font-sans text-[10px] text-sage text-center mt-xs">
                  Confirmed {format(new Date(sample.annotation.confirmedAt), 'd MMM yyyy h:mm a')}
                </p>
              )}
            </div>
          )}

          {view === 'annotate' && !selectedEntry && (
            <div className="text-center py-xl">
              <p className="font-serif text-sm text-text-secondary">Select an entry first to add your annotations.</p>
              <button
                onClick={() => setView('candidates')}
                className="mt-sm font-sans text-xs text-ember hover:text-ember-hover"
              >
                Choose an entry →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
