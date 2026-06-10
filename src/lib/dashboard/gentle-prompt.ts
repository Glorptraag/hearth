import type { SnapshotData } from '@/types/snapshot';

export type GentlePrompt = {
  /** Parent-facing "noticing" sentence from the recommender (reason_text). */
  text: string;
  moduleTitle: string;
};

/**
 * Derives the Dashboard "Gentle Prompt" card content from the snapshot's
 * recommendations block. Typed against the canonical SnapshotData shape the
 * rebuild writes ({ suggested_next, subject_balance }) — research log R10:
 * the card previously read this field as an array and never rendered.
 */
export function getGentlePrompt(
  recommendations: SnapshotData['recommendations'] | null | undefined,
): GentlePrompt | null {
  const first = recommendations?.suggested_next?.[0];
  if (!first || !first.reason_text) return null;
  return { text: first.reason_text, moduleTitle: first.module_title };
}
