/**
 * Shared thread-id utilities and per-entry aggregation.
 *
 * Two sources of thread evidence exist per entry:
 *   - Inferred: aiEnrichment.capability_threads (bare ids like "L1")
 *   - Declared: threadLinks from activity metadata (Sanity _ids like
 *     "capabilityThread.L1")
 *
 * This module normalises both to bare codes and merges them so every
 * downstream consumer — snapshot threadCounts, trajectory, evidence quality,
 * sparks, weekly coverage — sees a single deduped list per entry.
 *
 * A declared-only thread behaves identically to an inferred one everywhere.
 * Source flags (inferred / declared) are preserved so WS-4 can track
 * provenance distribution.
 */

export const VALID_THREAD_IDS = new Set([
  'L1','L2','L3','L4','L5','L6','L7','L8','L9',
  'M1','M2','M3','M4','M5','M6','M7','M8','M9',
  'S1','S2','S3','S4','S5','S6',
  'H1','H2','H3','H4','H5','H6',
  'P1','P2','P3','P4','P5',
  'PS1','PS2','PS3','PS4','PS5','PS6','PS7',
  'C1','C2','C3','C4','C5','C6','C7',
  'EF1','EF2','EF3','EF4','EF5','EF6','EF7','EF8',
]);

/**
 * Strips the "capabilityThread." Sanity _id prefix and validates the bare
 * code. Returns null for any id that is not in the canonical 57-thread set.
 */
export function normalizeThreadId(id: string): string | null {
  const bare = id.startsWith('capabilityThread.') ? id.slice('capabilityThread.'.length) : id;
  return VALID_THREAD_IDS.has(bare) ? bare : null;
}

export interface AggregatedThread {
  threadId: string;
  inferred: boolean;
  declared: boolean;
}

interface EntryForAggregation {
  aiEnrichment?: { capability_threads?: Array<{ thread_id: string }> } | null | unknown;
  threadLinks?: Array<{ threadId: string }> | null | unknown;
}

/**
 * Merge inferred (aiEnrichment) and declared (threadLinks) thread ids for a
 * single entry. Deduped — at most one result per bare thread code. Both
 * sources may contribute to the same thread (inferred = true AND declared =
 * true). Invalid or unknown ids are silently dropped.
 */
export function entryThreadIds(entry: EntryForAggregation): AggregatedThread[] {
  const map = new Map<string, { inferred: boolean; declared: boolean }>();

  const enrichment = entry.aiEnrichment as { capability_threads?: Array<{ thread_id: string }> } | null | undefined;
  for (const t of enrichment?.capability_threads ?? []) {
    const id = normalizeThreadId(t.thread_id);
    if (!id) continue;
    const existing = map.get(id);
    if (existing) {
      existing.inferred = true;
    } else {
      map.set(id, { inferred: true, declared: false });
    }
  }

  const links = entry.threadLinks as Array<{ threadId: string }> | null | undefined;
  for (const link of links ?? []) {
    const id = normalizeThreadId(link.threadId);
    if (!id) continue;
    const existing = map.get(id);
    if (existing) {
      existing.declared = true;
    } else {
      map.set(id, { inferred: false, declared: true });
    }
  }

  return Array.from(map.entries()).map(([threadId, flags]) => ({ threadId, ...flags }));
}
