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
