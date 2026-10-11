'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useToast } from '@/hooks/use-toast';
import { X, Tray, Flame, Camera, Check, Sparkle, ArrowRight } from '@/components/icons';
import WorkSamplePill from '@/components/ui/WorkSamplePill';

// ─── Types ───

type Entry = {
  id: string;
  title: string;
  dateOccurred: string;
  subjects: string[] | null;
  evidenceUrls: string[] | null;
  description: string | null;
  workSampleCandidate: boolean | null;
  workSampleQuality: number | null;
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
  learnerName: string;
  /** Jurisdiction reporting body, e.g. "Home Education Unit" (QLD) — drives copy. */
  reportingBody: string;
  onSampleChanged: () => void;
  onClose: () => void;
};

const ANNOTATION_FIELDS = [
  { key: 'observations', label: 'What I observed', placeholder: 'Describe what you saw during this learning moment...' },
  { key: 'needsStrengths', label: 'Needs & strengths', placeholder: 'What strengths did you notice? What needs emerged?' },
  { key: 'adjustment', label: 'How I adjusted', placeholder: 'How did you respond or adapt to what you observed?' },
  { key: 'planning', label: 'Where to next', placeholder: 'What learning directions might follow from this?' },
] as const;

// Subject chips inside the candidate row label themselves — no need for an
// extra glyph here. (Domain colour pills live in DomainChip.tsx for any
// surface that needs them.)

type SourceVal = 'ai_draft' | 'parent_edited' | 'parent_written';
type FieldKey = 'observations' | 'needsStrengths' | 'adjustment' | 'planning';
type SourceMap = Record<FieldKey, SourceVal | null>;

function readSource(value: string | null | undefined): SourceVal | null {
  return value === 'ai_draft' || value === 'parent_edited' || value === 'parent_written'
    ? value
    : null;
}

function classifyQuality(value: string, source: SourceVal | null, learnerName: string) {
  const trimmed = value.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  if (source === 'ai_draft' || words < 20) {
    return { tone: 'needs', label: 'Needs attention', dot: 'bg-child-rose' };
  }
  const hasSpecific = trimmed.toLowerCase().includes(learnerName.toLowerCase()) || /\d/.test(trimmed);
  if (words >= 60 && hasSpecific) {
    return { tone: 'strong', label: 'Strong', dot: 'bg-sage' };
  }
  return { tone: 'consider', label: 'Consider expanding', dot: 'bg-amber-status' };
}

export default function WorkSampleCuration({
  reportId,
  slot,
  entries,
  reportYear,
  sample,
  learnerName,
  reportingBody,
  onSampleChanged,
  onClose,
}: Props) {
  const { toast } = useToast();
  const [browseAll, setBrowseAll] = useState(false);
  const [view, setView] = useState<'candidates' | 'annotate'>(
    sample?.entryId ? 'annotate' : 'candidates'
  );
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(sample?.entryId ?? null);
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [annotationDraft, setAnnotationDraft] = useState({
    observations: sample?.annotation?.observations ?? '',
    needsStrengths: sample?.annotation?.needsStrengths ?? '',
    adjustment: sample?.annotation?.adjustment ?? '',
    planning: sample?.annotation?.planning ?? '',
  });
  const [sources, setSources] = useState<SourceMap>({
    observations: readSource(sample?.annotation?.observationsSource),
    needsStrengths: readSource(sample?.annotation?.needsStrengthsSource),
    adjustment: readSource(sample?.annotation?.adjustmentSource),
    planning: readSource(sample?.annotation?.planningSource),
  });
  const [showAiDraftWarning, setShowAiDraftWarning] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trapRef = useFocusTrap(true);

  // Predicate: does this entry fall within the slot's report-year + term-half +
  // subject window? Extracted so the candidate filter and the out-of-window
  // warning chip can never drift apart.
  const matchesSlotWindow = (e: Entry): boolean => {
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
  };

  const candidates = entries.filter(matchesSlotWindow);
  // Escape hatch: when the window-matched set is thin, the parent can browse the
  // full entry list and still select a legitimately out-of-window or mistagged
  // moment — the API has no term validation, so the pick persists. Out-of-window
  // rows are flagged amber (a warning, not a block).
  const displayedEntries = browseAll ? entries : candidates;

  // Sort: compliance candidates first (flag from write-time AI or manual parent
  // override), then by AI quality score (0-1), then by evidence presence, then
  // by recency. Quality score lets the panel rank candidates even within a
  // tied flag bucket — pre-quality entries fall through to the evidence tier.
  const sortedCandidates = [...displayedEntries].sort((a, b) => {
    if (a.workSampleCandidate && !b.workSampleCandidate) return -1;
    if (!a.workSampleCandidate && b.workSampleCandidate) return 1;
    const aq = a.workSampleQuality ?? -1;
    const bq = b.workSampleQuality ?? -1;
    if (aq !== bq) return bq - aq;
    const aEvidence = (a.evidenceUrls?.length ?? 0) > 0;
    const bEvidence = (b.evidenceUrls?.length ?? 0) > 0;
    if (aEvidence !== bEvidence) return aEvidence ? -1 : 1;
    return new Date(b.dateOccurred).getTime() - new Date(a.dateOccurred).getTime();
  });

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) ?? null;

  /** Pull the server's `{ error }` message off a non-OK response, if any. */
  const errorMessage = async (res: Response): Promise<string | null> =>
    res.json().then((b) => (b && typeof b.error === 'string' ? b.error : null)).catch(() => null);

  const handleSelect = async (entryId: string) => {
    const slotKey = sample?.slot ?? '';
    if (!slotKey) {
      toast("This slot isn't ready yet — reopen the report and try again.", 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/report/${reportId}/samples`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: slotKey, entryId }),
      });
      if (!res.ok) {
        // e.g. 409 cross-slot conflict — surface the server's message and stay
        // on the candidate list; do NOT fake the annotate transition.
        toast((await errorMessage(res)) ?? "Couldn't select that sample — please try again.", 'error');
        return;
      }
      setSelectedEntryId(entryId);
      setView('annotate');
      onSampleChanged();
    } catch {
      toast("Couldn't select that sample — please try again.", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    const slotKey = sample?.slot ?? '';
    if (!slotKey) {
      toast("This slot isn't ready yet — reopen the report and try again.", 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/report/${reportId}/samples`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: slotKey, entryId: null }),
      });
      if (!res.ok) {
        toast((await errorMessage(res)) ?? "Couldn't remove that sample — please try again.", 'error');
        return;
      }
      setSelectedEntryId(null);
      setAnnotationDraft({ observations: '', needsStrengths: '', adjustment: '', planning: '' });
      setView('candidates');
      onSampleChanged();
    } catch {
      toast("Couldn't remove that sample — please try again.", 'error');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save annotation with debounce
  const saveAnnotation = useCallback(async (
    draft: typeof annotationDraft,
    srcs: SourceMap,
    confirmed?: boolean,
  ) => {
    if (!sample?.id) return;
    try {
      await fetch(`/api/report/${reportId}/samples/${sample.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observations: draft.observations || null,
          observationsSource: srcs.observations ?? undefined,
          needsStrengths: draft.needsStrengths || null,
          needsStrengthsSource: srcs.needsStrengths ?? undefined,
          adjustment: draft.adjustment || null,
          adjustmentSource: srcs.adjustment ?? undefined,
          planning: draft.planning || null,
          planningSource: srcs.planning ?? undefined,
          ...(confirmed ? { confirmed: true } : {}),
        }),
      });
      onSampleChanged();
    } catch {
      // ignore
    }
  }, [sample, reportId, onSampleChanged]);

  const handleFieldChange = (key: FieldKey, value: string) => {
    const next = { ...annotationDraft, [key]: value };
    const prevSource = sources[key];
    // ai_draft → parent_edited on first keystroke. null → parent_written.
    const nextSource: SourceVal =
      prevSource === 'ai_draft' ? 'parent_edited' :
      prevSource === null ? 'parent_written' :
      prevSource;
    const nextSources = { ...sources, [key]: nextSource };
    setAnnotationDraft(next);
    setSources(nextSources);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveAnnotation(next, nextSources), 5000);
  };

  const allAiDraft = (Object.values(sources) as (SourceVal | null)[]).every((s) => s === 'ai_draft');

  const handleConfirm = async () => {
    if (allAiDraft && !showAiDraftWarning) {
      setShowAiDraftWarning(true);
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    await saveAnnotation(annotationDraft, sources, true);
    setSaving(false);
    setShowAiDraftWarning(false);
  };

  // Generate an AI draft for an empty annotation. Refused server-side if
  // any parent text already exists.
  const handleGenerateDraft = async () => {
    if (!sample?.id || drafting) return;
    setDrafting(true);
    try {
      const res = await fetch(`/api/report/${reportId}/samples/${sample.id}/draft`, {
        method: 'POST',
      });
      if (res.ok) {
        const { annotation } = await res.json();
        setAnnotationDraft({
          observations: annotation.observations ?? '',
          needsStrengths: annotation.needsStrengths ?? '',
          adjustment: annotation.adjustment ?? '',
          planning: annotation.planning ?? '',
        });
        setSources({
          observations: 'ai_draft',
          needsStrengths: 'ai_draft',
          adjustment: 'ai_draft',
          planning: 'ai_draft',
        });
        onSampleChanged();
      }
    } catch {
      // ignore
    }
    setDrafting(false);
  };

  // Cleanup timer
  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const filledFields = ANNOTATION_FIELDS.filter((f) => annotationDraft[f.key]?.trim()).length;
  const isComplete = filledFields === 4;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center hearth-backdrop-enter backdrop-modal backdrop-blur-sm">
      <div ref={trapRef} role="dialog" aria-modal="true" aria-labelledby="work-sample-title" className="hearth-modal-enter w-full max-w-[640px] max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-2xl bg-surface-body border border-border-subtle shadow-float" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
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
            aria-label="Close"
          >
            <X size={18} aria-hidden="true" />
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
              {/* Escape hatch + thin-candidate banner. Always offers the full
                  list so a legitimately out-of-window moment is never unpickable. */}
              {entries.length > 0 && (
                <div className="mb-md flex items-center justify-between gap-sm rounded-lg border border-border-subtle bg-surface-raised px-md py-sm">
                  <p className="font-sans text-xs text-text-secondary">
                    {browseAll
                      ? 'Showing all entries — amber-flagged ones fall outside this slot’s usual window.'
                      : candidates.length < 6
                        ? `Only ${candidates.length} entr${candidates.length === 1 ? 'y' : 'ies'} match this slot — you need 6 across the report. Browse all to pick any moment.`
                        : 'Can’t find the right one? Browse all your entries.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBrowseAll((v) => !v)}
                    className="shrink-0 font-sans text-xs font-semibold text-ember hover:underline"
                  >
                    {browseAll ? 'Show matches only' : 'Browse all entries'}
                  </button>
                </div>
              )}
              {sortedCandidates.length === 0 ? (
                <div className="text-center py-xl">
                  <p className="mb-sm flex justify-center text-text-secondary" aria-hidden="true">
                    <Tray size={32} />
                  </p>
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
                        className={`w-full text-left rounded-lg border p-md transition duration-[var(--motion-quick)] ${
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
                                  <Flame size={12} aria-hidden="true" /> From community
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
                            {browseAll && !matchesSlotWindow(entry) && (
                              <span className="inline-flex items-center gap-xs rounded-full bg-amber-status/15 text-amber-status px-sm py-[1px] font-sans text-[10px] font-semibold whitespace-nowrap">
                                Outside window
                              </span>
                            )}
                            {entry.workSampleCandidate && (
                              <WorkSamplePill size="sm" quality={entry.workSampleQuality} />
                            )}
                            {hasEvidence && (
                              <span className="inline-flex items-center gap-xs rounded-full bg-ember-glow text-ember px-sm py-[1px] font-sans text-[10px] font-semibold">
                                <Camera size={10} aria-hidden="true" /> {entry.evidenceUrls!.length}
                              </span>
                            )}
                            {isSelected && (
                              <span className="inline-flex items-center gap-xs rounded-full bg-ember/15 text-ember px-sm py-[1px] font-sans text-[10px] font-semibold">
                                <Check size={10} aria-hidden="true" /> Selected
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Subject chips */}
                        <div className="flex flex-wrap gap-xs mt-sm">
                          {[...(entry.subjects ?? [])].map((s) => (
                            <span key={s} className="rounded-full bg-surface-hover px-sm py-[1px] font-sans text-[10px] text-text-muted">
                              {s}
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
                      className={`h-[4px] w-[32px] rounded-full transition-colors duration-[var(--motion-quick)] ${
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

              {/* AI draft trigger — shown only when annotation is empty */}
              {filledFields === 0 && (
                <div className="rounded-lg border border-ember/20 bg-ember-glow px-md py-sm mb-md flex items-center justify-between gap-sm">
                  <div>
                    <p className="font-sans text-xs font-semibold text-ember inline-flex items-center gap-xs">
                      <Sparkle size={12} weight="fill" aria-hidden="true" /> Get an AI draft to start
                    </p>
                    <p className="font-sans text-[10px] text-text-muted mt-[2px]">
                      We&rsquo;ll draft each field from this entry&rsquo;s description. You review and edit before confirming.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateDraft}
                    disabled={drafting}
                    className="rounded-md bg-ember text-text-inverse px-md py-xs font-sans text-xs font-semibold whitespace-nowrap hover:bg-ember-hover transition-colors disabled:opacity-60"
                  >
                    {drafting ? 'Drafting…' : 'Draft with AI'}
                  </button>
                </div>
              )}

              {/* 4 annotation fields */}
              <div className="space-y-md">
                {ANNOTATION_FIELDS.map((field) => {
                  const value = annotationDraft[field.key];
                  const source = sources[field.key];
                  const showAiLabel = source === 'ai_draft';
                  const quality = value.trim() ? classifyQuality(value, source, learnerName) : null;
                  return (
                    <div key={field.key}>
                      <div className="flex items-center justify-between mb-xs">
                        <label className="font-sans text-xs font-semibold text-text-secondary">
                          {field.label}
                        </label>
                        {showAiLabel && (
                          <span className="inline-flex items-center gap-xs rounded-full bg-ember/10 text-ember px-sm py-[1px] font-sans text-[10px] font-semibold">
                            <Sparkle size={10} weight="fill" aria-hidden="true" /> AI draft — review and edit
                          </span>
                        )}
                      </div>
                      <textarea
                        value={value}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className={`w-full rounded-md border bg-surface-panel px-md py-sm font-serif text-sm text-text-primary placeholder:text-text-muted/50 focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember/30 resize-none transition-colors ${
                          showAiLabel ? 'border-ember/30' : 'border-border-subtle'
                        }`}
                      />
                      {quality && (
                        <div className="flex items-center gap-xs mt-[4px]">
                          <span className={`h-[6px] w-[6px] rounded-full ${quality.dot}`} aria-hidden="true" />
                          <span className="font-sans text-[10px] text-text-muted">{quality.label}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="font-sans text-[10px] text-text-muted mt-sm">Auto-saves every 5 seconds while typing.</p>

              {showAiDraftWarning && (
                <div className="mt-md rounded-md border border-amber-status/40 bg-amber-status/10 px-md py-sm">
                  <p className="font-sans text-xs font-semibold text-amber-status mb-xs">
                    These annotations haven&rsquo;t been reviewed yet.
                  </p>
                  <p className="font-sans text-[11px] text-text-secondary">
                    The {reportingBody} expects your own observations. Edit each field to reflect what you actually saw, then confirm. If you&rsquo;re sure the draft is accurate as-is, tap Confirm again.
                  </p>
                </div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                disabled={saving || !isComplete}
                className={`mt-lg w-full rounded-md py-sm font-sans text-sm font-semibold transition duration-[var(--motion-quick)] ${
                  isComplete
                    ? 'bg-sage text-surface-body hover:bg-sage/90 shadow-[0_4px_16px_rgba(123,191,138,0.20)]'
                    : 'bg-surface-raised text-text-muted cursor-not-allowed opacity-50'
                }`}
              >
                {saving
                  ? 'Saving…'
                  : sample?.annotation?.confirmedAt
                  ? <span className="inline-flex items-center gap-xs"><Check size={14} aria-hidden="true" /> Confirmed — Update</span>
                  : allAiDraft && showAiDraftWarning
                  ? 'Confirm anyway'
                  : 'Confirm Work Sample'}
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
                className="hearth-link-arrow mt-sm font-sans text-xs text-ember hover:text-ember-hover transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]"
              >
                Choose an entry <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        <div aria-hidden="true" className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </div>
  );
}
