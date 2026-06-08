import { getThreadName } from '@/lib/capability-threads';

/**
 * Confidence floor shared by the Portfolio's thread-derived views: the monthly
 * "Threads" count, the per-card thread tags, and the default "By Thread"
 * grouping. Keeping these on one constant guarantees a card's group matches the
 * threads it displays and the threads counted in the monthly summary.
 */
export const THREAD_DISPLAY_CONFIDENCE_FLOOR = 0.5;

export type ConfidenceThread = { thread_id: string; confidence: number };

export const UNCATEGORIZED_GROUP = 'Uncategorized';

/**
 * The single capability thread an entry belongs to in "By Thread" view: its
 * highest-confidence mapping at or above the floor. Ties resolve to the first
 * qualifying thread in array order (stable). Returns null when none qualifies.
 *
 * Replaces the dead `aiEnrichment.suggested_thread` read — the enrichment
 * pipeline only ever emits `capability_threads`, never a `suggested_thread`.
 */
export function topThreadId(
  threads: ConfidenceThread[] | null | undefined,
  floor: number = THREAD_DISPLAY_CONFIDENCE_FLOOR,
): string | null {
  let best: ConfidenceThread | null = null;
  for (const t of threads ?? []) {
    if (typeof t?.confidence !== 'number' || t.confidence < floor) continue;
    // Strictly-greater keeps the first thread on a confidence tie (stable).
    if (!best || t.confidence > best.confidence) best = t;
  }
  return best?.thread_id ?? null;
}

/** Display group name for an entry's top thread, or "Uncategorized". */
export function threadGroupName(
  threads: ConfidenceThread[] | null | undefined,
  floor: number = THREAD_DISPLAY_CONFIDENCE_FLOOR,
): string {
  const id = topThreadId(threads, floor);
  return id ? getThreadName(id) : UNCATEGORIZED_GROUP;
}

type GroupableEntry = {
  aiEnrichment?: { capability_threads?: ConfidenceThread[] } | null;
};

/**
 * Group entries by their top capability thread's display name, sorted by group
 * size descending (mirrors the prior grouping's sort). Each entry maps to
 * exactly one group — its highest-confidence thread, or "Uncategorized" — so
 * the accordion totals still sum to the entry count.
 */
export function groupEntriesByTopThread<T extends GroupableEntry>(
  entries: T[],
  floor: number = THREAD_DISPLAY_CONFIDENCE_FLOOR,
): [string, T[]][] {
  const grouped = new Map<string, T[]>();
  for (const entry of entries) {
    const name = threadGroupName(entry.aiEnrichment?.capability_threads, floor);
    const bucket = grouped.get(name);
    if (bucket) bucket.push(entry);
    else grouped.set(name, [entry]);
  }
  return Array.from(grouped.entries()).sort((a, b) => b[1].length - a[1].length);
}
