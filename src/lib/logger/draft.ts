/**
 * Logger draft persistence — the offline-minimum safety net.
 *
 * Pure serialization, migration and staleness rules for the retrospective
 * logging draft that autosaves to localStorage every 10 s (and mirrors to
 * Postgres for cross-device pickup — D-LPS-8) and restores on mount.
 *
 * Draft v2 is the Notice shape plus a version stamp. Old (v1) drafts from the
 * six-section Logger are migrated on read, never rejected: a parent mid-entry
 * when the rebuild deploys keeps their words.
 */
import { format, subDays } from 'date-fns';
import { isFeltLevel, type FeltLevel, type NoticeFields } from './notice';

export const DRAFT_KEY = 'hearth:logger:draft';

/** A draft is considered stale (worth a resume nudge) after 4 hours. */
export const DRAFT_STALE_MS = 4 * 60 * 60 * 1000;

/**
 * How long a server-mirrored draft survives before it's treated as expired.
 * Enforced read-time by the draft route so no cron is needed.
 */
export const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export type DraftEvidenceItem = {
  type: 'photo' | 'quote' | 'note' | 'link';
  content: string;
  caption?: string;
  url?: string;
  name?: string;
};

export const LOGGER_DRAFT_VERSION = 2 as const;

/** The persisted draft shape — the Notice fields plus a version and a save timestamp. */
export type LoggerDraft = NoticeFields & { v: typeof LOGGER_DRAFT_VERSION; savedAt: number };

/** Form fields without the storage bookkeeping — what the caller hands us to save. */
export type LoggerDraftFields = NoticeFields;

export type DraftMigration = {
  draft: LoggerDraft;
  /**
   * True when a legacy draft's "earlier" date could not be carried over (it was
   * a hidden −5-day offset). The restored banner tells the parent the date is
   * now today and to change it if it was another day.
   */
  dateReset: boolean;
};

const EVIDENCE_TYPES = new Set<DraftEvidenceItem['type']>(['photo', 'quote', 'note', 'link']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function evidenceArray(value: unknown): DraftEvidenceItem[] {
  if (!Array.isArray(value)) return [];
  const out: DraftEvidenceItem[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const type = item.type as DraftEvidenceItem['type'];
    if (!EVIDENCE_TYPES.has(type) || typeof item.content !== 'string') continue;
    const e: DraftEvidenceItem = { type, content: item.content };
    if (typeof item.caption === 'string') e.caption = item.caption;
    if (typeof item.url === 'string') e.url = item.url;
    if (typeof item.name === 'string') e.name = item.name;
    out.push(e);
  }
  return out;
}

function feltRecord(value: unknown, learnerIds: readonly string[]): Record<string, FeltLevel> {
  const out: Record<string, FeltLevel> = {};
  if (!isRecord(value)) return out;
  const keep = new Set(learnerIds);
  for (const [id, v] of Object.entries(value)) {
    if (keep.has(id) && isFeltLevel(v)) out[id] = v;
  }
  return out;
}

function noticedRecord(value: unknown, learnerIds: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isRecord(value)) return out;
  const keep = new Set(learnerIds);
  for (const [id, v] of Object.entries(value)) {
    if (keep.has(id) && typeof v === 'string' && v.trim().length > 0) out[id] = v;
  }
  return out;
}

const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isoDayOrNull(value: unknown): string | null {
  return typeof value === 'string' && ISO_DAY_RE.test(value) ? value : null;
}

/**
 * Turn whatever storage held into a v2 draft, or null when nothing restorable
 * survives. Unknown future versions return null (forward-safe); legacy v1
 * drafts are field-mapped:
 *   selectedLearners → learnerIds · description → text · engagement → felt
 *   (1..4 only, selected children only) · discoveries → noticed (non-empty,
 *   selected children only) · evidence → evidence · whenDate 'yesterday' is
 *   anchored to the draft's own savedAt · 'earlier' keeps a stored `earlierDate`
 *   (#285), else becomes today + dateReset.
 */
export function migrateDraft(raw: unknown, now: number): DraftMigration | null {
  if (!isRecord(raw)) return null;

  if ('v' in raw) {
    if (raw.v !== LOGGER_DRAFT_VERSION) return null;
    const learnerIds = stringArray(raw.learnerIds);
    const draft: LoggerDraft = {
      v: LOGGER_DRAFT_VERSION,
      learnerIds,
      text: typeof raw.text === 'string' ? raw.text : '',
      dateOccurred: isoDayOrNull(raw.dateOccurred),
      felt: feltRecord(raw.felt, learnerIds),
      noticed: noticedRecord(raw.noticed, learnerIds),
      evidence: evidenceArray(raw.evidence),
      savedAt: typeof raw.savedAt === 'number' ? raw.savedAt : now,
    };
    return isRestorableDraft(draft) ? { draft, dateReset: false } : null;
  }

  // Legacy v1 (six-section Logger).
  const learnerIds = stringArray(raw.selectedLearners);
  const savedAt = typeof raw.savedAt === 'number' ? raw.savedAt : now;
  const whenDate = raw.whenDate;
  // #285 gave 'earlier' a real picked date (`earlierDate`); carry it over when
  // present. Only an 'earlier' with no date (the old hidden −5-day offset)
  // resets to today.
  const earlierDate = whenDate === 'earlier' ? isoDayOrNull(raw.earlierDate) : null;
  const dateOccurred =
    whenDate === 'yesterday'
      ? format(subDays(new Date(savedAt), 1), 'yyyy-MM-dd')
      : earlierDate;
  const draft: LoggerDraft = {
    v: LOGGER_DRAFT_VERSION,
    learnerIds,
    text: typeof raw.description === 'string' ? raw.description : '',
    dateOccurred,
    felt: feltRecord(raw.engagement, learnerIds),
    noticed: noticedRecord(raw.discoveries, learnerIds),
    evidence: evidenceArray(raw.evidence),
    savedAt,
  };
  return isRestorableDraft(draft)
    ? { draft, dateReset: whenDate === 'earlier' && earlierDate === null }
    : null;
}

/**
 * Parse a stored draft. Returns null for absent, corrupt or empty data so
 * callers can treat "no usable draft" uniformly.
 */
export function parseDraft(raw: string | null, now: number = Date.now()): DraftMigration | null {
  if (!raw) return null;
  try {
    return migrateDraft(JSON.parse(raw), now);
  } catch {
    return null;
  }
}

/** Serialize form fields into a timestamped v2 draft string for storage. */
export function serializeDraft(fields: LoggerDraftFields, savedAt: number): string {
  const draft: LoggerDraft = { ...fields, v: LOGGER_DRAFT_VERSION, savedAt };
  return JSON.stringify(draft);
}

/**
 * Whether the current form state is worth persisting: a draft with no words, no
 * selected child and no evidence is noise, not a draft.
 */
export function shouldPersistDraft(
  fields: Pick<LoggerDraftFields, 'text' | 'learnerIds' | 'evidence'>,
): boolean {
  return fields.text.trim().length > 0 || fields.learnerIds.length > 0 || fields.evidence.length > 0;
}

/** Whether a restored draft represents real, restorable content. Drives the "picked up" banner. */
export function isRestorableDraft(draft: LoggerDraft | null): boolean {
  if (!draft) return false;
  return shouldPersistDraft(draft);
}

/** Whether a draft is old enough (>4h) to warrant a resume notification. */
export function isStaleDraft(draft: LoggerDraft | null, now: number): boolean {
  if (!draft?.savedAt) return false;
  return now - draft.savedAt > DRAFT_STALE_MS;
}

/**
 * Reconcile the offline-first `localStorage` draft with the Postgres mirror —
 * last-write-wins by `savedAt`. Null-safe: returns the other when one is
 * absent, or null when both are. A tie keeps local (no needless re-restore).
 */
export function pickNewerDraft(
  local: LoggerDraft | null,
  server: LoggerDraft | null,
): LoggerDraft | null {
  if (!local) return server;
  if (!server) return local;
  return (server.savedAt ?? 0) > (local.savedAt ?? 0) ? server : local;
}
