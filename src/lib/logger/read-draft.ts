/**
 * What the Confirm surface may show from a Photo Read (launch pivot W3.3; A1,
 * D-LP-2, D-LP-6). Pure; client-safe.
 *
 * Provenance rule (Logger spec v2 §5.2): the Read is model text, so it renders
 * only as an explicit draft the parent accepts ("Use this / Edit"), and only
 * when the parent wrote no words of their own — a draft never competes with,
 * or replaces, the parent's text. The Working-from chip is a deterministic
 * Shelf match on the Read's printed header (`src/lib/shelf/match.ts`), never a
 * model guess.
 */
import { parseReadOutput } from '@/lib/ai/read-schema';

export type WorkingFrom = {
  resourceId: string;
  /** Resource level as printed, e.g. "Alpha". */
  level?: string;
  /** Lesson number as a string, e.g. "12". */
  lesson?: string;
  /** 'read' = the parent confirmed Hearth's match; 'parent' = the parent chose it. */
  source: 'read' | 'parent';
};

export type ConfirmRead = {
  /** The Read's one-sentence description, offered as a draft. Null = no draft row. */
  draft: string | null;
  /** The printed header the Shelf matcher runs on. Null = no Working-from chip. */
  printedText: string | null;
};

/** The entry fields `GET /api/entries/[id]` returns that the Confirm surface reads. */
export type EntryReadFields = {
  readOutput?: unknown;
  description?: string | null;
  draftedBy?: string | null;
};

/**
 * Derive the Read's Confirm-surface contribution from a fetched entry, or null
 * when there is no valid Read (never ran, refused, invalid — never invented).
 */
export function confirmReadFor(entry: EntryReadFields | null | undefined): ConfirmRead | null {
  if (!entry) return null;
  const read = parseReadOutput(entry.readOutput ?? null);
  if (!read) return null;
  const parentWrote = (entry.description ?? '').trim().length > 0;
  const alreadyRead = entry.draftedBy === 'read';
  const draft = !parentWrote && !alreadyRead && read.doing.trim() ? read.doing.trim() : null;
  const printedText = read.printedText.trim() ? read.printedText.trim() : null;
  if (!draft && !printedText) return null;
  return { draft, printedText };
}

/** "Math-U-See Alpha · Lesson 12" — the resource as the chip names it. */
export function workingFromLabel(title: string, level?: string | null, lesson?: string | number | null): string {
  const resource = level && !title.toLowerCase().includes(level.toLowerCase()) ? `${title} ${level}` : title;
  return lesson !== undefined && lesson !== null && String(lesson) !== '' ? `${resource} · Lesson ${lesson}` : resource;
}
