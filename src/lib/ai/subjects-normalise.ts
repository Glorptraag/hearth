/**
 * Subjects from enrichment.
 *
 * The Logger no longer asks the parent to pick an activity type or subject; the
 * entry's `subjects` column (read by snapshot-rebuild for weekly / monthly
 * subject balance) is filled from Haiku's `subjects_detected` when the parent
 * gave none. `subjects_detected` is free-form display text ('Mathematics',
 * 'HASS', 'The Arts'); the column is the lowercase `SUBJECTS` enum. Pure.
 *
 * Subjects a writer already set (the module runner, batch log, CSV import, a
 * Portfolio edit) are never overwritten.
 */
import { SUBJECTS, type Subject } from '@/types';

const ALIASES: Record<string, Subject> = {
  english: 'english', literacy: 'english', reading: 'english', writing: 'english',
  mathematics: 'mathematics', maths: 'mathematics', math: 'mathematics', numeracy: 'mathematics',
  science: 'science',
  hass: 'hass', humanities: 'hass', history: 'hass', geography: 'hass', civics: 'hass', economics: 'hass',
  'humanities and social sciences': 'hass',
  arts: 'arts', 'the arts': 'arts', art: 'arts', music: 'arts', drama: 'arts', dance: 'arts',
  'visual arts': 'arts', 'media arts': 'arts', 'creative arts': 'arts',
  technologies: 'technologies', technology: 'technologies', tech: 'technologies',
  'digital technologies': 'technologies', 'design and technologies': 'technologies',
  hpe: 'hpe', 'health and physical education': 'hpe', health: 'hpe', pe: 'hpe',
  'physical education': 'hpe',
  languages: 'languages', lote: 'languages', language: 'languages',
};

const VALID = new Set<string>(SUBJECTS);

/** Map detected display names onto the enum: trim + lowercase, alias, drop unknown, dedupe, keep order. */
export function normaliseDetectedSubjects(detected: readonly string[] | null | undefined): Subject[] {
  const out: Subject[] = [];
  for (const raw of detected ?? []) {
    if (typeof raw !== 'string') continue;
    const key = raw.trim().toLowerCase();
    const mapped = ALIASES[key] ?? (VALID.has(key) ? (key as Subject) : null);
    if (mapped && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

/**
 * The `subjects` column update to spread into the enrichment writeback: `{}`
 * when the entry already has subjects or nothing normalises.
 */
export function subjectsFill(
  existing: readonly string[] | null | undefined,
  detected: readonly string[] | null | undefined,
): { subjects: Subject[] } | Record<string, never> {
  if (existing && existing.length > 0) return {};
  const subjects = normaliseDetectedSubjects(detected);
  return subjects.length > 0 ? { subjects } : {};
}
