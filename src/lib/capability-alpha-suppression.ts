// Alpha-window suppression of sensitive capability threads from parent-facing
// surfaces. H6 ("First Nations Australian Perspectives") is held back pending
// cultural consultation; this module is the single reversible switch.
//
// Scope contract:
//  - Parent-visible READ/AGGREGATION seams filter through these helpers:
//    snapshot assembly (snapshot-rebuild), the capabilities API, constellation
//    topology, the keyword matcher, post-save nudges, portfolio thread
//    grouping, and deterministic report coverage.
//  - EVIDENCE WRITES ARE NEVER FILTERED (enrichment, observation_dlo_links,
//    learner_dlo_status, thread_links) — evidence keeps accruing invisibly so
//    re-lighting the thread later loses nothing.
//  - Admin surfaces (tier comparison, analytics) intentionally do NOT filter.
//
// To re-light a thread: remove its id from ALPHA_SUPPRESSED_THREAD_IDS and
// rebuild snapshots (POST /api/admin/snapshots/rebuild); stale snapshots are
// also filtered at the capabilities API read seam in the meantime.

export const ALPHA_SUPPRESSED_THREAD_IDS: readonly string[] = ['H6'];

const SUPPRESSED = new Set(ALPHA_SUPPRESSED_THREAD_IDS);

/**
 * True when the id refers to a suppressed thread, in any of the id forms the
 * pipeline uses: bare thread id (`H6`), Sanity thread id / ref
 * (`capabilityThread.H6`), or DLO id (`dlo.H6.emerging`). Exact segment match
 * only — `PS6`/`H61` never collide with `H6`.
 */
export function isSuppressedThread(idOrRef: string | null | undefined): boolean {
  if (!idOrRef) return false;
  if (SUPPRESSED.has(idOrRef)) return true;
  const threadRef = idOrRef.match(/^capabilityThread\.(.+)$/);
  if (threadRef) return SUPPRESSED.has(threadRef[1]);
  const dlo = idOrRef.match(/^dlo\.([^.]+)\./);
  if (dlo) return SUPPRESSED.has(dlo[1]);
  return false;
}

/** Filter suppressed ids out of a list of bare thread ids. */
export function filterSuppressedThreadIds(ids: readonly string[]): string[] {
  return ids.filter((id) => !isSuppressedThread(id));
}

/**
 * Drop suppressed keys (thread ids or DLO ids) from a keyed record. Returns
 * the input object untouched when nothing is suppressed, so unchanged
 * snapshots don't churn referential equality.
 */
export function omitSuppressedKeys<T>(record: Record<string, T>): Record<string, T> {
  let hasSuppressed = false;
  for (const key of Object.keys(record)) {
    if (isSuppressedThread(key)) {
      hasSuppressed = true;
      break;
    }
  }
  if (!hasSuppressed) return record;
  const out: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!isSuppressedThread(key)) out[key] = value;
  }
  return out;
}
