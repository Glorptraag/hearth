'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DRAFT_KEY,
  isRestorableDraft,
  isStaleDraft,
  migrateDraft,
  parseDraft,
  pickNewerDraft,
  serializeDraft,
  shouldPersistDraft,
  type DraftMigration,
  type LoggerDraft,
  type LoggerDraftFields,
} from '@/lib/logger/draft';

/** The cross-device draft mirror endpoint. */
const DRAFT_ENDPOINT = '/api/logger/draft';

/** Whether we should attempt a network call (true when online or SSR-unknown). */
function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

/** How often the autosave timer ticks. The original page used 10 s. */
const AUTOSAVE_INTERVAL_MS = 10_000;

export type UseLoggerDraftArgs = {
  /**
   * Current Logger form fields — sampled by the 10 s autosave timer. Pass a
   * memoised object so the timer only restarts when a field actually changes,
   * matching the original deps-driven `useEffect`.
   */
  state: LoggerDraftFields;
  /**
   * Called once on mount with the migrated draft if storage held one (and
   * again if the server mirror turns out to be newer). The caller is
   * responsible for hydrating its form state. `meta.dateReset` is true when
   * a legacy draft's "earlier" date could not be carried over — the restored
   * banner tells the parent the date is now today.
   */
  onRestore: (draft: LoggerDraft, meta: { dateReset: boolean }) => void;
};

export type UseLoggerDraftReturn = {
  /**
   * True when the parsed draft had real content (text, a selected learner or
   * evidence) — drives the "Picked up where you left off" banner.
   */
  draftRestored: boolean;
  /**
   * True when the restored draft came from a legacy "earlier" date that is
   * now today. Drives the banner's date-reset suffix. Cleared with the banner.
   */
  dateReset: boolean;
  /** Dismiss the "Picked up where you left off" banner. */
  dismissDraftRestored: () => void;
  /** Wall-clock ms of the most recent autosave write, or null. */
  lastSavedAt: number | null;
  /** `savedAt` timestamp from the draft that was restored on mount, or null. Used to compute draft_age_ms on entry_created. */
  draftSavedAt: number | null;
  /** Wipe persisted draft + reset banner/timestamp. Call after a successful save. */
  clearDraft: () => void;
};

/**
 * Logger draft autosave + restore wiring — the React side of the
 * offline-minimum safety net whose pure rules live in `src/lib/logger/draft.ts`.
 * Extracted from `app/(auth)/log/page.tsx` so the page can describe its form
 * state without also owning the `localStorage` I/O and timer plumbing.
 *
 * Behaviour preserved from the inline effects:
 *  - on mount, read `DRAFT_KEY`, run it through `parseDraft` (which migrates
 *    legacy v1 drafts and sanitises v2 ones) and hand the result to
 *    `onRestore` once;
 *  - if the parsed draft is restorable, raise the banner;
 *  - if the parsed draft is stale (> 4 h), fire a `draft_resume` notification;
 *  - every 10 s of idle form state, write the current draft (always v2) to storage;
 *  - `clearDraft` wipes both `localStorage` and the local banner/timestamp.
 *
 * Cross-device sync (additive, never blocks — `localStorage` stays the
 * offline-first primary):
 *  - on mount, after the local restore, best-effort `GET` the Postgres mirror.
 *    The route returns the stored blob raw, so the body also runs through
 *    `migrateDraft` before comparison; if the server draft is newer
 *    (`pickNewerDraft`), restore from it and write it back to `localStorage`.
 *    Offline → skipped, local behaviour unchanged;
 *  - each autosave tick also fires a best-effort `PUT` of the same v2 draft
 *    (the route rejects anything else with 400, swallowed here);
 *  - `clearDraft` also fires a best-effort `DELETE` so a save on one device
 *    doesn't leave a stale draft to resurface on another.
 *  Every server call swallows its error (like the `draft_resume` fetch) so a
 *  network failure never degrades capture.
 *
 * `onRestore` is captured into a ref so the mount effect can run exactly once
 * without listing the caller's callback identity in its dep array.
 *
 * Design notes (logged 2026-06-01 during the refactor):
 *  - The autosave timer is *idle-driven*, not "every 10 s of wall-clock". The
 *    original deps-driven `useEffect` cleared and recreated the interval on
 *    every field change, so the write only fires after 10 s with no field
 *    edits. Preserved here by requiring the caller to pass a memoised
 *    `state` object (so the hook's `[state]` dep changes exactly when a
 *    draftable field changes). If a future change wants "every 10 s
 *    regardless of idle", swap this for a ref-driven once-on-mount interval.
 *  - `onRestore` is wrapped at the call site with `useCallback(…, [])` even
 *    though identity stability isn't strictly required (we capture into a
 *    ref). Keeping the stable identity makes the hook contract easier to
 *    reason about and avoids future "why does this restore twice?" puzzles.
 */
export function useLoggerDraft({ state, onRestore }: UseLoggerDraftArgs): UseLoggerDraftReturn {
  const [draftRestored, setDraftRestored] = useState(false);
  const [dateReset, setDateReset] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  const onRestoreRef = useRef(onRestore);
  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);

  useEffect(() => {
    const applyRestore = (migration: DraftMigration) => {
      const { draft } = migration;
      onRestoreRef.current(draft, { dateReset: migration.dateReset });
      if (isRestorableDraft(draft)) {
        setDraftRestored(true);
        setDateReset(migration.dateReset);
      }
      if (draft.savedAt) setDraftSavedAt(draft.savedAt);
    };

    const now = Date.now();
    const local = parseDraft(localStorage.getItem(DRAFT_KEY), now);
    if (local) {
      // Restoring banner state from localStorage on mount; gated on presence of restorable content.
      applyRestore(local);
      if (isStaleDraft(local.draft, now)) {
        const draftTitle = local.draft.text.slice(0, 40) || undefined;
        fetch('/api/notifications/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'draft_resume', draftTitle }),
        }).catch(() => {});
      }
    }

    // Best-effort cross-device pull. If the server mirror is newer than the
    // local draft, restore from it instead — this is what lets a draft started
    // on the phone surface on the tablet. Offline / signed-out / no server
    // draft → no-op, local behaviour above is untouched.
    if (!isOnline()) return;
    fetch(DRAFT_ENDPOINT)
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { draft: unknown } | null) => {
        const server = body?.draft == null ? null : migrateDraft(body.draft, Date.now());
        if (!server) return;
        if (pickNewerDraft(local?.draft ?? null, server.draft) !== server.draft) return;
        applyRestore(server);
        localStorage.setItem(DRAFT_KEY, serializeDraft(server.draft, server.draft.savedAt));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!shouldPersistDraft(state)) return;
      const now = Date.now();
      const draft: LoggerDraft = { ...state, v: 2, savedAt: now };
      localStorage.setItem(DRAFT_KEY, serializeDraft(state, now));
      setLastSavedAt(now);
      // Best-effort mirror to Postgres for cross-device pickup. Fire-and-forget;
      // offline / failure leaves the localStorage write (above) as the source of truth.
      if (isOnline()) {
        fetch(DRAFT_ENDPOINT, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft }),
        }).catch(() => {});
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [state]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setLastSavedAt(null);
    setDraftRestored(false);
    setDateReset(false);
    // Best-effort: drop the server mirror too, so a save on this device doesn't
    // leave a stale draft to resurface on another. Offline / failure is fine —
    // the next save's DELETE (or the 7-day server expiry) cleans it up.
    if (isOnline()) {
      fetch(DRAFT_ENDPOINT, { method: 'DELETE' }).catch(() => {});
    }
  }, []);

  const dismissDraftRestored = useCallback(() => {
    setDraftRestored(false);
    setDateReset(false);
  }, []);

  return { draftRestored, dateReset, dismissDraftRestored, lastSavedAt, draftSavedAt, clearDraft };
}
