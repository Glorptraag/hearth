/**
 * Logger entry payload — how a Notice becomes a `POST /api/entries` body.
 *
 * The server contract is unchanged (no migration). A few fields are derived and
 * worth pinning under test because they silently shape what an entry becomes:
 *   - the title is a 60-char truncation of the text, or a kind-aware fallback
 *     (the server rejects an empty title);
 *   - felt → `engagementPerLearner`, noticed → `discoveriesPerLearner`, both
 *     pruned to the selected children;
 *   - evidence URLs are the photo evidence only; `evidence[]` carries every kind;
 *   - provenance keys are the ones the route actually validates
 *     (`sourceProjectId` / numeric `sourceStageNumber` — the old payload sent
 *     `projectId` / `stageNumber`, which the route silently stripped).
 *
 * `subjects` is deliberately absent: it is filled server-side from enrichment
 * (`src/lib/ai/subjects-normalise.ts`) when the parent gave none.
 */
import type { LoggerContext } from '@/types/logger-context';
import { format, isValid, parseISO } from 'date-fns';
import type { DraftEvidenceItem } from './draft';
import { resolveDateOccurred, type NoticeFields } from './notice';
import type { NoticeSource } from './source';

/** Truncate the text into a 60-char title, appending an ellipsis if cut. */
export function deriveEntryTitle(text: string): string {
  return text.slice(0, 60).trim() + (text.length > 60 ? '...' : '');
}

const EVIDENCE_TITLE_LABEL: Record<DraftEvidenceItem['type'], string> = {
  photo: 'Photo',
  quote: 'Their words',
  note: 'Note',
  link: 'Link',
};

/**
 * A human-readable title for a moment with no words — a photo-only save is a
 * normal Logger entry. Without this the title would be empty and the server's
 * `title.min(1)` check would reject the save. Never empty.
 */
export function deriveFallbackTitle(
  dateOccurred: string,
  firstEvidenceKind: DraftEvidenceItem['type'] | null,
): string {
  const parsed = parseISO(dateOccurred);
  const day = isValid(parsed) ? format(parsed, 'd MMM') : dateOccurred;
  const label = firstEvidenceKind ? EVIDENCE_TITLE_LABEL[firstEvidenceKind] : 'Learning';
  return `${label} on ${day}`;
}

/**
 * Restrict a per-learner record to the currently-selected learners — the
 * save-boundary guarantee that an orphaned rating never persists to the entry
 * or reaches the enrichment prompt as a bare learner id.
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

/** Per-child "noticed" text, trimmed, blanks dropped, pruned to selected children. */
export function deriveNoticed(
  noticed: Record<string, string>,
  selectedLearners: readonly string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, value] of Object.entries(pickSelectedLearners(noticed, selectedLearners))) {
    const trimmed = value?.trim() ?? '';
    if (trimmed) out[id] = trimmed;
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
 * kind the parent captured, not just photos.
 *   - photo → content = blob ref, caption = optional photo caption;
 *   - quote → content = the quoted text;
 *   - note  → content = the freeform note;
 *   - link  → content = the URL, caption = the resource name.
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

/** The POST body sent to `/api/entries` on save. Optional keys are omitted, never `undefined`. */
export interface EntrySavePayload {
  title: string;
  description: string;
  dateOccurred: string;
  learnerIds: string[];
  engagementPerLearner: Record<string, number>;
  discoveriesPerLearner: Record<string, string>;
  evidenceUrls: string[];
  evidence: EvidencePayloadItem[];
  /**
   * Structured capture context persisted on the row (`logger_context`, #292).
   * Read by the enrichment prompt (`formatStructuredNotes`) and pedagogy
   * retrieval. The Notice form captures none of its chips (D-LPS-14), so it is
   * omitted today; the key stays so a future capture field has a home.
   */
  loggerContext?: LoggerContext;
  source: 'logger' | 'project_stage' | 'hearth_session';
  sourceSessionId?: string;
  sourceProjectId?: string;
  sourceStageNumber?: number;
  status: 'complete';
}

/** The persisted capture context, or undefined when the parent set none of it. */
export function buildLoggerContext(form: {
  activityType?: string | null;
  observations?: string[];
  duration?: string | null;
  location?: string | null;
}): LoggerContext | undefined {
  const observations = (form.observations ?? []).filter((o) => typeof o === 'string' && o.trim().length > 0);
  const ctx: LoggerContext = {};
  if (form.activityType) ctx.activityType = form.activityType;
  if (observations.length > 0) ctx.observations = observations;
  if (form.location) ctx.location = form.location;
  if (form.duration) ctx.duration = form.duration;
  return Object.keys(ctx).length > 0 ? ctx : undefined;
}

/**
 * Assemble the `/api/entries` POST body from the Notice and its source.
 * A check-in is a plain Logger entry on the wire (`check-in` is not an entry
 * source); the thread only steers which chip sorts first after save.
 */
export function buildEntrySavePayload(args: {
  fields: NoticeFields;
  source: NoticeSource;
  now?: Date;
}): EntrySavePayload {
  const { fields, source } = args;
  const now = args.now ?? new Date();
  const text = fields.text.trim();
  const dateOccurred = resolveDateOccurred(fields.dateOccurred, now);
  const title =
    deriveEntryTitle(text) || deriveFallbackTitle(dateOccurred, fields.evidence[0]?.type ?? null);

  const payload: EntrySavePayload = {
    title,
    description: text,
    dateOccurred,
    learnerIds: fields.learnerIds,
    engagementPerLearner: pickSelectedLearners(fields.felt, fields.learnerIds),
    discoveriesPerLearner: deriveNoticed(fields.noticed, fields.learnerIds),
    evidenceUrls: derivePhotoEvidenceUrls(fields.evidence),
    evidence: deriveEvidenceRows(fields.evidence),
    source: 'logger',
    status: 'complete',
  };

  // The Notice form no longer captures activity / observation / where / how-long
  // chips (D-LPS-14), so they go in empty and the key is omitted. The plumbing
  // stays wired for rows written before the rebuild and any future capture field.
  const loggerContext = buildLoggerContext({
    activityType: null,
    observations: [],
    location: null,
    duration: null,
  });
  if (loggerContext) payload.loggerContext = loggerContext;

  if (source.kind === 'hearth_session') {
    payload.source = 'hearth_session';
    payload.sourceSessionId = source.sessionId;
  } else if (source.kind === 'project_stage') {
    payload.source = 'project_stage';
    payload.sourceProjectId = source.projectId;
    if (source.stageNumber !== null) payload.sourceStageNumber = source.stageNumber;
  }

  return payload;
}
