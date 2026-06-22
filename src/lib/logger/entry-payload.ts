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
import { ENTRY_SOURCES } from '@/types';
import type { DraftEvidenceItem } from './draft';

/**
 * Coerce a raw `?source=` query value to a valid entry source. The server
 * validates `source` against ENTRY_SOURCES (`z.enum`) and rejects anything else,
 * so a stale or mistyped deep link like `?source=foo` would otherwise hard-fail
 * an otherwise-valid save with a generic error. Unknown/absent values fall back
 * to 'logger'.
 */
export function coerceEntrySource(raw: string | null | undefined): string {
  return raw && (ENTRY_SOURCES as readonly string[]).includes(raw) ? raw : 'logger';
}

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

const SUBJECT_TITLE_LABEL: Record<string, string> = {
  english: 'English',
  mathematics: 'Maths',
  science: 'Science',
  hass: 'HASS',
  arts: 'Arts',
  technologies: 'Technologies',
  hpe: 'HPE',
  languages: 'Languages',
};

/**
 * A human-readable title for entries with no typed description — a normal Quick
 * log is tap-only (child + activity + engagement + observation chips) and never
 * touches the description field. Without this the title would be empty and the
 * /api/entries `title.min(1)` check rejects the save ("Failed to save"), losing
 * the parent's logged learning. Prefers the first subject, else the date.
 */
export function deriveFallbackTitle(subjects: string[], dateOccurred: string): string {
  if (subjects.length > 0) {
    return `${SUBJECT_TITLE_LABEL[subjects[0]] ?? subjects[0]} learning`;
  }
  return dateOccurred ? `Learning on ${dateOccurred}` : 'Learning entry';
}

/**
 * Restrict a per-learner record to the currently-selected learners. Deselecting
 * a child after rating them leaves an orphaned `engagement`/`discoveries` key in
 * form state (the toggle that removes the child does not, on its own, prune the
 * map). This is the save-boundary guarantee that such orphans never persist to
 * the entry or reach the enrichment prompt — without it a removed child's rating
 * is written and fed to Haiku as a bare learner id.
 */
export function pickSelectedLearners<T>(
  record: Record<string, T>,
  selectedLearners: readonly string[],
): Record<string, T> {
  const allowed = new Set(selectedLearners);
  const out: Record<string, T> = {};
  for (const [id, value] of Object.entries(record)) {
    if (allowed.has(id)) out[id] = value;
  }
  return out;
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
 * Derive the dual-write evidence rows for `learning_entry_evidence` — every
 * kind the parent captured, not just photos. `evidenceUrls` (via
 * {@link derivePhotoEvidenceUrls}) stays photos-only for the dual-write window;
 * this is the full-fidelity side that also persists quotes, notes, and links.
 *
 * Per-kind mapping (`content` is the column the table requires; `caption` is the
 * optional human label):
 *   - photo → content = blob ref, caption = optional photo caption;
 *   - quote → content = the quoted text;
 *   - note  → content = the freeform note;
 *   - link  → content = the URL, caption = the resource name. The draft link
 *     item carries `content`=name, `name`, and `url`; the URL becomes the row's
 *     content and the name its caption (a name-only link keeps empty content).
 *
 * Empty quotes/notes and fully-empty links are dropped; captions are trimmed.
 */
export function deriveEvidenceRows(
  evidence: ReadonlyArray<Pick<DraftEvidenceItem, 'type' | 'content' | 'caption' | 'url' | 'name'>>,
): EvidencePayloadItem[] {
  const rows: EvidencePayloadItem[] = [];
  for (const e of evidence) {
    if (e.type === 'photo') {
      const caption = e.caption?.trim();
      rows.push(
        caption
          ? { kind: 'photo', content: e.content, caption }
          : { kind: 'photo', content: e.content },
      );
    } else if (e.type === 'quote' || e.type === 'note') {
      const content = e.content?.trim();
      if (content) rows.push({ kind: e.type, content });
    } else if (e.type === 'link') {
      const url = e.url?.trim() ?? '';
      const name = (e.name ?? e.content)?.trim();
      if (!url && !name) continue;
      rows.push(name ? { kind: 'link', content: url, caption: name } : { kind: 'link', content: url });
    }
  }
  return rows;
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

/**
 * Warm confirmations for the fast (thin-entry) save path. A thin entry skips the
 * substantive post-save screen, so this toast is the *only* feedback the parent
 * gets — and it lands on exactly the busy days when a flat "Learning entry saved!"
 * feels coldest. The lines stay warm, concrete and philosophy-neutral, and don't
 * over-claim (a thin entry hasn't been richly enriched, so nothing here promises
 * an insight). Rotating keeps a run of quick saves from reading like a robot.
 * See isThinEntry for what counts as thin.
 */
export const THIN_SAVE_MESSAGES = [
  'Saved. Another moment in their story.',
  'Got it — the quick notes count too.',
  'Saved. Little moments like this add up.',
  'Captured. Even a quick jot builds the picture.',
] as const;

/**
 * Pick a warm confirmation for a thin-entry save. `pick` defaults to Math.random
 * (so repeated quick saves vary) but is injectable for deterministic tests.
 */
export function warmThinSaveMessage(pick: () => number = Math.random): string {
  const i = Math.floor(pick() * THIN_SAVE_MESSAGES.length) % THIN_SAVE_MESSAGES.length;
  return THIN_SAVE_MESSAGES[i];
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
  evidence: ReadonlyArray<Pick<DraftEvidenceItem, 'type' | 'content' | 'caption' | 'url' | 'name'>>;
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
   * Full-fidelity evidence rows for the `learning_entry_evidence` dual-write —
   * all kinds (photo/quote/note/link), carrying captions. `evidenceUrls` stays
   * photos-only alongside this until that legacy column is retired.
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
  const subjects = deriveSubjects(form.activityType, form.lessonSubjects);
  // Never ship an empty title — a description-less Quick log would otherwise be
  // rejected by the server's title.min(1) check ("Failed to save").
  const title = deriveEntryTitle(form.description) || deriveFallbackTitle(subjects, form.dateOccurred);
  return {
    title,
    description: form.description,
    dateOccurred: form.dateOccurred,
    subjects,
    learnerIds: form.selectedLearners,
    engagementPerLearner: pickSelectedLearners(form.engagement, form.selectedLearners),
    discoveriesPerLearner: pickSelectedLearners(form.discoveries, form.selectedLearners),
    evidenceUrls: derivePhotoEvidenceUrls(form.evidence),
    evidence: deriveEvidenceRows(form.evidence),
    observationDetails: form.loggerMode === 'guided' ? form.observationDetails : undefined,
    mode: form.loggerMode,
    source: isScaffold ? 'hearth_session' : ctx.projectSource,
    sourceSessionId: ctx.scaffoldSessionId,
    projectId: ctx.projectId,
    stageNumber: ctx.stageNumber,
    status: 'complete',
  };
}
