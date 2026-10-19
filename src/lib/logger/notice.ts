/**
 * Notice — the Logger's capture model.
 *
 * The Logger captures exactly what downstream reads and nothing else:
 *   - who was learning (learnerIds)                 → enrich, snapshot, portfolio
 *   - what happened (text, typed or dictated)       → enrich prompt, portfolio, report
 *   - when (dateOccurred, resolved at save time)    → snapshot streaks / balance
 *   - how it felt for each child (felt, 1..4)       → engagementPerLearner
 *   - what each child said / asked / noticed        → discoveriesPerLearner
 *   - evidence (photo / their words / link)         → portfolio, report work samples
 *
 * Everything here is pure so the form reducer, the draft migration and the
 * save payload can be pinned under test without mounting the page.
 */
import { format, isValid, parseISO, subDays } from 'date-fns';
import type { DraftEvidenceItem } from './draft';

/**
 * Felt experience per child. The ordinal maps 1:1 onto the existing
 * `engagementPerLearner` column (1..4); the Portfolio renders 😕😐🙂😊 for 1..4
 * (portfolio/page.tsx `ENGAGEMENT_EMOJI`), so the order is load-bearing.
 */
export type FeltLevel = 1 | 2 | 3 | 4;

export const FELT_LEVELS: ReadonlyArray<{ value: FeltLevel; label: string }> = [
  { value: 4, label: 'Loved it' },
  { value: 3, label: 'Into it' },
  { value: 2, label: 'Went along' },
  { value: 1, label: 'Hard going' },
];

export function isFeltLevel(value: unknown): value is FeltLevel {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export type NoticeFields = {
  /** Who was learning. At least one is required to save. */
  learnerIds: string[];
  /** What happened — typed or dictated. */
  text: string;
  /** `yyyy-MM-dd` (local). `null` means "today", resolved at save time. */
  dateOccurred: string | null;
  /** Per child, optional. Keyed by learnerId. */
  felt: Record<string, FeltLevel>;
  /** Per child "said / asked / noticed", optional. Keyed by learnerId. */
  noticed: Record<string, string>;
  /** Photo / their words / link. The type keeps 'note' so old drafts still restore. */
  evidence: DraftEvidenceItem[];
};

export const EMPTY_NOTICE: NoticeFields = {
  learnerIds: [],
  text: '',
  dateOccurred: null,
  felt: {},
  noticed: {},
  evidence: [],
};

// ─── Save gate ───

export type SaveBlock = 'no-learner' | 'nothing-noticed' | null;

/**
 * The whole save gate: at least one child, and either a few words or a piece of
 * evidence. No score, no ring. Returns the reason save is blocked, or null when
 * the moment can be saved.
 */
export function saveBlock(f: Pick<NoticeFields, 'learnerIds' | 'text' | 'evidence'>): SaveBlock {
  if (f.learnerIds.length === 0) return 'no-learner';
  if (f.text.trim().length === 0 && f.evidence.length === 0) return 'nothing-noticed';
  return null;
}

// ─── Learners ───

/** Keep only the per-child maps for children still selected. */
export function pruneToLearners(f: NoticeFields): NoticeFields {
  const keep = new Set(f.learnerIds);
  const felt: Record<string, FeltLevel> = {};
  const noticed: Record<string, string> = {};
  for (const [id, v] of Object.entries(f.felt)) if (keep.has(id)) felt[id] = v;
  for (const [id, v] of Object.entries(f.noticed)) if (keep.has(id)) noticed[id] = v;
  return { ...f, felt, noticed };
}

/**
 * Select or deselect a child. Deselecting prunes that child's felt + noticed so
 * an orphaned rating can never linger, skew the form, or be sent on save.
 */
export function toggleLearner(f: NoticeFields, id: string): NoticeFields {
  const selected = f.learnerIds.includes(id);
  const learnerIds = selected ? f.learnerIds.filter((l) => l !== id) : [...f.learnerIds, id];
  return pruneToLearners({ ...f, learnerIds });
}

// ─── When ───

export type WhenKind = 'today' | 'yesterday' | 'other';

const ISO_DAY = 'yyyy-MM-dd';

export function todayIso(now: Date): string {
  return format(now, ISO_DAY);
}

/** Today is stored as `null` (resolved at save time); yesterday as a real date. */
export function dateForKind(kind: 'today' | 'yesterday', now: Date): string | null {
  return kind === 'today' ? null : format(subDays(now, 1), ISO_DAY);
}

function parseDay(value: string | null): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

/** Which segment of the When control is lit. Derived from the stored date, never stored itself. */
export function whenKindFor(dateOccurred: string | null, now: Date): WhenKind {
  if (dateOccurred === null) return 'today';
  const resolved = resolveDateOccurred(dateOccurred, now);
  if (resolved === todayIso(now)) return 'today';
  if (resolved === format(subDays(now, 1), ISO_DAY)) return 'yesterday';
  return 'other';
}

/** 'Today' | 'Yesterday' | 'Tue 6 Oct'. */
export function whenLabel(dateOccurred: string | null, now: Date): string {
  const kind = whenKindFor(dateOccurred, now);
  if (kind === 'today') return 'Today';
  if (kind === 'yesterday') return 'Yesterday';
  const d = parseDay(dateOccurred);
  return d ? format(d, 'EEE d MMM') : 'Today';
}

/**
 * The date that is actually saved. `null` → today; a future or unparsable value
 * → today. Never a hidden offset (the old "earlier" segment silently meant five
 * days ago).
 */
export function resolveDateOccurred(dateOccurred: string | null, now: Date): string {
  const today = todayIso(now);
  const d = parseDay(dateOccurred);
  if (!d) return today;
  const iso = format(d, ISO_DAY);
  return iso > today ? today : iso;
}
