/**
 * Logger post-save enrichment poll.
 *
 * Saving an entry kicks off server-side AI enrichment via an `after()` job, so
 * the post-save surface polls `/api/entries/[id]` until the enrichment reaches a
 * terminal state (or a timeout elapses — spec: "never a spinner that hangs").
 *
 * The timing, the in-flight guard (the parent may start a *new* entry while a
 * fetch is mid-air), and the pending → terminal state machine are the parts
 * worth pinning under test. Extracted verbatim from `app/(auth)/log/page.tsx`;
 * the React state-mapping stays at the call site behind `onEnrichment`.
 */
import type { AiEnrichment } from '@/types/enrichment';

/** First check after 1.5 s; enrichment is rarely ready sooner. */
export const ENRICHMENT_POLL_INTERVAL_MS = 1500;
/** Give up after 30 s and resolve the surface to a failed view. */
export const ENRICHMENT_POLL_TIMEOUT_MS = 30000;
/**
 * Per-request abort budget. Without it a single hung GET (a stuck connection on
 * a flaky rural link) never settles, so the loop never re-checks the overall
 * timeout and the post-save surface sits on the skeleton forever. An aborted
 * request is treated as a transient failure — the loop continues until the
 * overall timeout, honouring the spec's "never a spinner that hangs".
 */
export const ENRICHMENT_REQUEST_TIMEOUT_MS = 10000;

export interface EnrichmentPollCallbacks {
  /**
   * True while this poll's entry is still the active one. The poll bails the
   * moment it returns false — the parent has moved on to a new entry.
   */
  isCurrent: () => boolean;
  /** Clear the active-entry marker (the poll owns its own teardown). */
  clearCurrent: () => void;
  /**
   * Apply a freshly-fetched enrichment to the UI. Called once per successful
   * fetch (including while still `pending`), so the surface updates live.
   */
  onEnrichment: (enrichment: AiEnrichment) => void;
  /**
   * Resolve the surface after the loop ends (terminal or timeout). The call
   * site no-ops when the entry already reached a terminal state.
   */
  onTimeout: () => void;
}

export interface EnrichmentPollOptions {
  intervalMs?: number;
  timeoutMs?: number;
  /** Per-request abort budget (ms). A hung fetch is aborted and treated as transient. */
  requestTimeoutMs?: number;
  fetchImpl?: typeof fetch;
  /** Injectable for tests; defaults to a real `setTimeout` delay. */
  sleep?: (ms: number) => Promise<void>;
  /** Injectable clock for tests; defaults to `Date.now`. */
  now?: () => number;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Poll an entry's enrichment until terminal or timeout.
 *
 * Each iteration: wait `intervalMs`, re-check the guard, fetch the entry, and
 * (on a non-`pending` enrichment) clear the marker and stop. A non-OK response,
 * a missing enrichment, or a thrown fetch are all transient — keep polling. The
 * guard is re-checked after the fetch too, since the parent may have switched
 * entries while it was in flight.
 */
export async function pollEntryEnrichment(
  entryId: string,
  cb: EnrichmentPollCallbacks,
  opts: EnrichmentPollOptions = {},
): Promise<void> {
  const intervalMs = opts.intervalMs ?? ENRICHMENT_POLL_INTERVAL_MS;
  const timeoutMs = opts.timeoutMs ?? ENRICHMENT_POLL_TIMEOUT_MS;
  const requestTimeoutMs = opts.requestTimeoutMs ?? ENRICHMENT_REQUEST_TIMEOUT_MS;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const sleep = opts.sleep ?? defaultSleep;
  const now = opts.now ?? Date.now;

  const start = now();
  while (now() - start < timeoutMs) {
    await sleep(intervalMs);
    if (!cb.isCurrent()) break;
    // Bound each request: a hung GET is aborted so the loop can re-check the
    // overall timeout instead of awaiting a promise that never settles.
    const controller = new AbortController();
    const reqTimer = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const res = await fetchImpl(`/api/entries/${entryId}`, { signal: controller.signal });
      if (!res.ok) continue;
      const body = (await res.json()) as { aiEnrichment?: AiEnrichment | null };
      const enrichment = body?.aiEnrichment;
      if (!enrichment) continue;
      // Re-check the guard — the parent may have started a new entry while the
      // fetch was in flight.
      if (!cb.isCurrent()) break;

      cb.onEnrichment(enrichment);

      // Keep polling while pending (the row exists but enrichment hasn't
      // completed). Only stop on a terminal state.
      if (enrichment.status === 'pending') continue;
      cb.clearCurrent();
      break;
    } catch {
      // transient (network error or per-request abort) — keep polling
    } finally {
      clearTimeout(reqTimer);
    }
  }

  if (cb.isCurrent()) cb.clearCurrent();
  cb.onTimeout();
}
