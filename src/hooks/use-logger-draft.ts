'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DRAFT_KEY,
  isRestorableDraft,
  isStaleDraft,
  parseDraft,
  serializeDraft,
  shouldPersistDraft,
  type LoggerDraft,
  type LoggerDraftFields,
} from '@/lib/logger/draft';

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
   * Called once on mount with the parsed draft if storage held one. The
   * caller is responsible for hydrating its form state (each setter gated on
   * field presence — same shape as the original inline effect).
   */
  onRestore: (draft: LoggerDraft) => void;
};

export type UseLoggerDraftReturn = {
  /**
   * True when the parsed draft had real content (a description or at least
   * one selected learner) — drives the "Draft restored" banner.
   */
  draftRestored: boolean;
  /** Dismiss the "Draft restored" banner. */
  dismissDraftRestored: () => void;
  /** Wall-clock ms of the most recent autosave write, or null. */
  lastSavedAt: number | null;
  /** Wipe persisted draft + reset banner/timestamp. Call after a successful save. */
  clearDraft: () => void;
};

/**
 * Logger draft autosave + restore wiring — the React side of the
 * offline-minimum safety net whose pure rules live in `src/lib/logger/draft.ts`.
 * Extracted from `app/(auth)/log/page.tsx` so the page can describe its form
 * state without also owning the `localStorage` I/O and timer plumbing.
 *
 * Behaviour preserved verbatim from the inline effects:
 *  - on mount, read `DRAFT_KEY`, hand the parsed draft to `onRestore` once;
 *  - if the parsed draft is restorable, raise the banner;
 *  - if the parsed draft is stale (> 4 h), fire a `draft_resume` notification;
 *  - every 10 s of idle form state, write the current draft to storage;
 *  - `clearDraft` wipes both `localStorage` and the local banner/timestamp.
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
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const onRestoreRef = useRef(onRestore);
  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);

  useEffect(() => {
    const d = parseDraft(localStorage.getItem(DRAFT_KEY));
    if (!d) return;
    onRestoreRef.current(d);
    // Restoring banner state from localStorage on mount; gated on presence of restorable content.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isRestorableDraft(d)) setDraftRestored(true);
    if (isStaleDraft(d, Date.now())) {
      const draftTitle = d.description?.slice(0, 40) || undefined;
      fetch('/api/notifications/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'draft_resume', draftTitle }),
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!shouldPersistDraft(state)) return;
      const now = Date.now();
      localStorage.setItem(DRAFT_KEY, serializeDraft(state, now));
      setLastSavedAt(now);
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [state]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setLastSavedAt(null);
    setDraftRestored(false);
  }, []);

  const dismissDraftRestored = useCallback(() => setDraftRestored(false), []);

  return { draftRestored, dismissDraftRestored, lastSavedAt, clearDraft };
}
