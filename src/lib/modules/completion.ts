/**
 * Completion tracking for the module runner's facilitate flow.
 *
 * An activity counts as completed once the parent has actually entered/viewed
 * it in facilitate mode — NOT by cursor position. That distinction matters
 * because completed activities become an entry's `sourceActivityIds`, which the
 * entries API turns into activity→capability-thread links (portfolio + HEU
 * signal). Cursor-based "everything strictly before the cursor" tracking
 * mis-recorded partial sessions three ways: the current activity was never
 * counted (one-and-done recorded zero), the last activity of a full run was
 * never counted, and jumping ahead falsely marked the skipped activities done.
 *
 * The fix: mark an activity visited when it becomes current, and derive the
 * source ids from that visited set.
 */

/** Add a single visited activity index to the completed set (deduped, sorted ascending). */
export function markActivityVisited(completed: readonly number[], idx: number): number[] {
  if (idx < 0) return dedupeSorted(completed);
  const next = new Set(completed);
  next.add(idx);
  return Array.from(next).sort((a, b) => a - b);
}

/**
 * Visited set for resuming a linearly-advanced session at `cursorIdx`
 * (0..cursorIdx inclusive). Used on cold mount when only the saved cursor
 * position survives — we assume the parent advanced through everything up to it.
 */
export function visitedThrough(cursorIdx: number): number[] {
  if (cursorIdx < 0) return [];
  return Array.from({ length: cursorIdx + 1 }, (_, i) => i);
}

/**
 * Resolve the Sanity activity ids actually facilitated this session, merging:
 *  - quick captures (parent jotted a note/photo while on an activity), and
 *  - completed/visited activity indexes (parent entered the activity).
 * Captures are taken first; order of first appearance is preserved; ids dedupe.
 */
export function deriveSourceActivityIds(opts: {
  activities: ReadonlyArray<{ _id: string }> | undefined;
  completedActivityIdxs: readonly number[] | undefined;
  quickCaptures: ReadonlyArray<{ activityId?: string }> | undefined;
}): string[] {
  const ids = new Set<string>();
  for (const cap of opts.quickCaptures ?? []) {
    if (cap.activityId) ids.add(cap.activityId);
  }
  for (const idx of opts.completedActivityIdxs ?? []) {
    const act = opts.activities?.[idx];
    if (act?._id) ids.add(act._id);
  }
  return Array.from(ids);
}

function dedupeSorted(xs: readonly number[]): number[] {
  return Array.from(new Set(xs)).sort((a, b) => a - b);
}
