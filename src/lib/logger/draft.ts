/**
 * Logger draft persistence — the offline-minimum safety net.
 *
 * Pure serialization + staleness rules for the retrospective-logging draft that
 * autosaves to localStorage every 10s and restores on mount. Extracted from
 * `app/(auth)/log/page.tsx` so the behaviour can be characterised under test
 * without mounting the ~2k-line Logger. The React wiring (the effects that call
 * these helpers and the actual localStorage reads/writes) stays in the page for
 * now; this module owns only the data shape and the rules.
 *
 * Behaviour preserved verbatim from the original inline effects:
 *  - a draft with neither description nor selected learners is not worth saving;
 *  - a corrupt or absent payload restores nothing (errors swallowed);
 *  - a draft older than 4h is "stale" and warrants a resume nudge.
 */

export const DRAFT_KEY = 'hearth:logger:draft';

/** A draft is considered stale (worth a resume nudge) after 4 hours. */
export const DRAFT_STALE_MS = 4 * 60 * 60 * 1000;

export type DraftEvidenceItem = {
  type: 'photo' | 'quote' | 'note' | 'link';
  content: string;
  caption?: string;
  url?: string;
  name?: string;
};

/**
 * A single Guided-mode observation-chip detail — the free-text note (and
 * optional duration) the parent types into the "What did you observe?" chip
 * pop-up. Structurally identical to the UI's `ChipDetailValue`; defined here so
 * the draft module owns its own data shape without a component dependency.
 */
export type DraftObservationDetail = {
  detail: string;
  durationMin?: number;
};

/** The persisted draft shape — the Logger form fields plus a save timestamp. */
export type LoggerDraft = {
  description: string;
  selectedLearners: string[];
  discoveries: Record<string, string>;
  activityType: string | null;
  lessonSubjects: string[];
  engagement: Record<string, number>;
  whenDate: 'today' | 'yesterday' | 'earlier';
  /** The real yyyy-MM-dd behind an "earlier" pick. Optional: drafts saved
   *  before the picker existed have no value and restore as unset. */
  earlierDate?: string | null;
  duration: string | null;
  location: string | null;
  observations: string[];
  evidence: DraftEvidenceItem[];
  /**
   * Guided-mode per-chip observation details, keyed by chip label. Persisted so
   * the "What did you observe?" pop-up notes survive a draft save + reload —
   * they were previously dropped because they were never part of the draft shape.
   */
  observationDetails: Record<string, DraftObservationDetail>;
  savedAt: number;
};

/** Form fields without the storage timestamp — what the caller hands us to save. */
export type LoggerDraftFields = Omit<LoggerDraft, 'savedAt'>;

/**
 * Whether the current form state is worth persisting. Mirrors the original
 * autosave guard: a draft with neither a description nor any selected learner is
 * noise, not a draft.
 */
export function shouldPersistDraft(
  fields: Pick<LoggerDraftFields, 'description' | 'selectedLearners'>,
): boolean {
  return Boolean(fields.description) || fields.selectedLearners.length > 0;
}

/** Serialize form fields into a timestamped draft string for storage. */
export function serializeDraft(fields: LoggerDraftFields, savedAt: number): string {
  const draft: LoggerDraft = { ...fields, savedAt };
  return JSON.stringify(draft);
}

/**
 * Parse a stored draft. Returns null for absent or corrupt data so callers can
 * treat "no usable draft" uniformly — the original code swallowed parse errors
 * and simply restored nothing.
 */
export function parseDraft(raw: string | null): LoggerDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return null;
    return parsed as LoggerDraft;
  } catch {
    return null;
  }
}

/**
 * Whether a restored draft represents real, restorable content (a description or
 * at least one selected learner). Drives the "draft restored" banner.
 */
export function isRestorableDraft(draft: LoggerDraft | null): boolean {
  if (!draft) return false;
  return Boolean(draft.description) || (draft.selectedLearners?.length ?? 0) > 0;
}

/** Whether a draft is old enough (>4h) to warrant a resume notification. */
export function isStaleDraft(draft: LoggerDraft | null, now: number): boolean {
  if (!draft?.savedAt) return false;
  return now - draft.savedAt > DRAFT_STALE_MS;
}

/**
 * How long a server-mirrored draft survives before it's treated as expired.
 * Mirrors the logger spec's §Open-Q#3 recommendation ("7-day auto-expiry");
 * enforced read-time by the draft route so no cron is needed.
 */
export const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Reconcile the offline-first `localStorage` draft with the Postgres mirror —
 * last-write-wins by `savedAt`. Null-safe: returns the other when one is
 * absent, or null when both are. This is what lets a draft started on the
 * phone surface on the tablet (server wins) without ever losing fresher local
 * work (local wins).
 */
export function pickNewerDraft(
  local: LoggerDraft | null,
  server: LoggerDraft | null,
): LoggerDraft | null {
  if (!local) return server;
  if (!server) return local;
  return (server.savedAt ?? 0) > (local.savedAt ?? 0) ? server : local;
}
