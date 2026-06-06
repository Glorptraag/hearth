/**
 * Logger entry-payload logic — the derivations that shape a saved entry.
 *
 * The Logger's save handler (`app/(auth)/log/page.tsx` → handleSave) POSTs a
 * body to `/api/entries`. Most of that body is pass-through form state, but a
 * few fields are *derived* — and that derivation is the part worth pinning under
 * test, because it silently shapes what a learning entry becomes:
 *
 *  - the title is a 60-char truncation of the description;
 *  - subjects come from the activity type (or the explicit lesson-subject
 *    picker for structured lessons) via ACTIVITY_SUBJECT_MAP;
 *  - evidence URLs are the photo evidence only;
 *  - the "thin entry" heuristic decides whether the deliberate post-save second
 *    screen appears or the entry gets the fast toast-only path.
 *
 * Extracted verbatim from the page so the heartbeat's contract is characterised
 * without mounting the Logger. The pass-through fields stay inline at the call
 * site — they carry no logic to protect.
 */
import type { DraftEvidenceItem } from './draft';

/** Logger mode — mirrors `useLoggerModeAndSnapshot`'s `LoggerMode` without a hook dependency. */
export type LoggerSaveMode = 'guided' | 'quick';

/**
 * Activity type → Australian Curriculum subject keys. Structured lessons bypass
 * this map and use the parent's explicit lesson-subject selection instead.
 */
export const ACTIVITY_SUBJECT_MAP: Record<string, string[]> = {
  nature: ['science'],
  cooking: ['mathematics', 'science'],
  reading: ['english'],
  art: ['arts'],
  physical: ['hpe'],
  social: ['hass'],
  structured: [],
  freeplay: [],
};

/** Below this completeness score a sparse entry counts as "thin". */
export const THIN_ENTRY_COMPLETENESS = 55;

/** Descriptions at/above this length are no longer "short" for thin detection. */
export const THIN_ENTRY_DESCRIPTION_CHARS = 60;

/**
 * Derive the curriculum subjects for an entry. A structured lesson carries the
 * parent's explicit picks; everything else maps from the activity type, falling
 * back to no subjects for an unknown/absent type.
 */
export function deriveSubjects(activityType: string | null, lessonSubjects: string[]): string[] {
  return activityType === 'structured'
    ? lessonSubjects
    : ACTIVITY_SUBJECT_MAP[activityType ?? ''] ?? [];
}

/** Truncate the description into a 60-char title, appending an ellipsis if cut. */
export function deriveEntryTitle(description: string): string {
  return description.slice(0, 60).trim() + (description.length > 60 ? '...' : '');
}

/** The persisted evidence URLs are the photo evidence's content only. */
export function derivePhotoEvidenceUrls(
  evidence: ReadonlyArray<Pick<DraftEvidenceItem, 'type' | 'content'>>,
): string[] {
  return evidence.filter((e) => e.type === 'photo').map((e) => e.content);
}

/**
 * A `learning_entry_evidence` row as sent to `/api/entries` (the server fills
 * `id`/`entryId`/`createdAt`). The `kind` mirrors the table's check constraint.
 */
export interface EvidencePayloadItem {
  kind: 'photo' | 'quote' | 'note' | 'link' | 'audio';
  content: string;
  caption?: string;
}

/**
 * Derive the dual-write evidence rows for `learning_entry_evidence`. A faithful
 * mirror of {@link derivePhotoEvidenceUrls} — photo evidence only, same order —
 * but carrying the `caption` that the flat `evidenceUrls` text[] has no room for.
 * Kept in lockstep with that column until it's retired. (Non-photo kinds aren't
 * persisted yet; that pre-existing gap is out of scope here.)
 */
export function derivePhotoEvidenceRows(
  evidence: ReadonlyArray<Pick<DraftEvidenceItem, 'type' | 'content' | 'caption'>>,
): EvidencePayloadItem[] {
  return evidence
    .filter((e) => e.type === 'photo')
    .map((e) => {
      const caption = e.caption?.trim();
      return caption
        ? { kind: 'photo' as const, content: e.content, caption }
        : { kind: 'photo' as const, content: e.content };
    });
}

/**
 * The "thin entry" heuristic. Four signals must all agree for an entry to skip
 * the substantive post-save second screen and keep the fast "Saved" toast:
 *   1. short description (<60 chars);
 *   2. no Guided observation chip details;
 *   3. no evidence;
 *   4. completeness below "Strong" (55).
 * scoreCompleteness is the authoritative weighting, so the heuristic anchors to
 * it rather than re-deriving signal weights.
 */
export function isThinEntry(input: {
  description: string;
  observationDetails: Record<string, unknown> | undefined;
  evidenceUrlCount: number;
  completeness: number;
}): boolean {
  return (
    (input.description?.trim().length ?? 0) < THIN_ENTRY_DESCRIPTION_CHARS &&
    Object.keys(input.observationDetails ?? {}).length === 0 &&
    input.evidenceUrlCount === 0 &&
    input.completeness < THIN_ENTRY_COMPLETENESS
  );
}

/** Form state read by the save handler to assemble the `/api/entries` body. */
export interface EntrySaveForm {
  description: string;
  /** Pre-formatted `yyyy-MM-dd` (the page resolves the today/yesterday/earlier picker). */
  dateOccurred: string;
  activityType: string | null;
  lessonSubjects: string[];
  selectedLearners: string[];
  engagement: Record<string, number>;
  discoveries: Record<string, string>;
  evidence: ReadonlyArray<Pick<DraftEvidenceItem, 'type' | 'content' | 'caption'>>;
  loggerMode: LoggerSaveMode;
  observationDetails: Record<string, unknown>;
}

/** Save-time context not held in the form: scaffold session + project provenance. */
export interface EntrySaveContext {
  /** The Hearth-session id when logging from a scaffold, else undefined. */
  scaffoldSessionId: string | undefined;
  /** `projectContext.source` — overridden to 'hearth_session' when scaffolded. */
  projectSource: string;
  projectId: string | undefined;
  stageNumber: string | undefined;
}

/** The POST body sent to `/api/entries` on save. */
export interface EntrySavePayload {
  title: string;
  description: string;
  dateOccurred: string;
  subjects: string[];
  learnerIds: string[];
  engagementPerLearner: Record<string, number>;
  discoveriesPerLearner: Record<string, string>;
  evidenceUrls: string[];
  /**
   * Full-fidelity evidence rows for the `learning_entry_evidence` dual-write.
   * Mirrors `evidenceUrls` (photos, same order) but carries captions. Kept
   * alongside the legacy column until it's retired.
   */
  evidence: EvidencePayloadItem[];
  observationDetails: Record<string, unknown> | undefined;
  mode: LoggerSaveMode;
  source: string;
  sourceSessionId: string | undefined;
  projectId: string | undefined;
  stageNumber: string | undefined;
  status: 'complete';
}

/**
 * Assemble the full `/api/entries` POST body from form state + save context.
 *
 * Composes the field derivations (`deriveSubjects` / `deriveEntryTitle` /
 * `derivePhotoEvidenceUrls`) and applies the two context rules that were inline
 * in `handleSave`:
 *   - a scaffolded entry reports `source: 'hearth_session'` and carries the
 *     session id; otherwise the project-context source/ids pass through;
 *   - Guided-mode observation details are included only in Guided mode (Quick
 *     mode sends `undefined`).
 *
 * Extracted verbatim from `app/(auth)/log/page.tsx` so the saved entry's shape
 * is pinned under test.
 */
export function buildEntrySavePayload(
  form: EntrySaveForm,
  ctx: EntrySaveContext,
): EntrySavePayload {
  const isScaffold = ctx.scaffoldSessionId !== undefined;
  return {
    title: deriveEntryTitle(form.description),
    description: form.description,
    dateOccurred: form.dateOccurred,
    subjects: deriveSubjects(form.activityType, form.lessonSubjects),
    learnerIds: form.selectedLearners,
    engagementPerLearner: form.engagement,
    discoveriesPerLearner: form.discoveries,
    evidenceUrls: derivePhotoEvidenceUrls(form.evidence),
    evidence: derivePhotoEvidenceRows(form.evidence),
    observationDetails: form.loggerMode === 'guided' ? form.observationDetails : undefined,
    mode: form.loggerMode,
    source: isScaffold ? 'hearth_session' : ctx.projectSource,
    sourceSessionId: ctx.scaffoldSessionId,
    projectId: ctx.projectId,
    stageNumber: ctx.stageNumber,
    status: 'complete',
  };
}
