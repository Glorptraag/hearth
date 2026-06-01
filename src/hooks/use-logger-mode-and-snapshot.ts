'use client';

import { useEffect, useState } from 'react';
import type { SnapshotSignals } from '@/lib/ai/keyword-matcher';
import type { SnapshotData } from '@/types/snapshot';

export type LoggerMode = 'guided' | 'quick';

export type UseLoggerModeAndSnapshotReturn = {
  /** Resolved Logger mode. Defaults to `quick` until the family fetch resolves. */
  loggerMode: LoggerMode;
  /** Imperative setter for the manual mode toggle. */
  setLoggerMode: (mode: LoggerMode) => void;
  /** Family Intelligence Snapshot, or null until loaded / when unavailable. */
  snapshotData: SnapshotData | null;
  /** Derived per-child active / quiet thread signals + onboarding flag. */
  snapshotSignals: SnapshotSignals | null;
};

/**
 * Resolves Logger mode + loads the Family Intelligence Snapshot on mount.
 * Extracted from `app/(auth)/log/page.tsx`.
 *
 * Behaviour preserved verbatim:
 *  - mode resolution order:
 *      1. `loggerDefaultMode` from the family row when it's `guided` or `quick`;
 *      2. otherwise `guided` when fewer than 20 entries, `quick` thereafter;
 *      3. on any error the mode stays `quick` (the initial state).
 *  - snapshot resolution:
 *      • the API wraps the snapshot in `{ snapshotData }` — unwrap before use;
 *      • per-child signals are derived from `active_threads` (mapped to ids)
 *        and `gap_analysis.suggested_focus_threads`;
 *      • the onboarding flag fires when total entries < 20.
 *  - non-critical: any throw or non-OK response is swallowed (mode stays
 *    `quick`, snapshot stays null).
 */
export function useLoggerModeAndSnapshot(): UseLoggerModeAndSnapshotReturn {
  const [loggerMode, setLoggerMode] = useState<LoggerMode>('quick');
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
  const [snapshotSignals, setSnapshotSignals] = useState<SnapshotSignals | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [famRes, snapRes] = await Promise.all([
          fetch('/api/family'),
          fetch('/api/snapshot'),
        ]);
        if (famRes.ok) {
          const fam = (await famRes.json()) as {
            loggerDefaultMode?: string | null;
            entryCount?: number;
          };
          if (fam.loggerDefaultMode === 'guided' || fam.loggerDefaultMode === 'quick') {
            setLoggerMode(fam.loggerDefaultMode);
          } else {
            setLoggerMode((fam.entryCount ?? 0) < 20 ? 'guided' : 'quick');
          }
        }
        if (snapRes.ok) {
          const wrapper = (await snapRes.json()) as {
            snapshotData: SnapshotData | null;
          } | null;
          const snap = wrapper?.snapshotData ?? null;
          setSnapshotData(snap);
          if (snap?.children) {
            const perChild: SnapshotSignals['perChild'] = {};
            for (const [id, child] of Object.entries(snap.children)) {
              const active = (child.active_threads ?? []).map((t) => t.thread_id);
              const quiet = child.gap_analysis?.suggested_focus_threads ?? [];
              perChild[id] = { active, quiet };
            }
            setSnapshotSignals({
              perChild,
              onboarding: (snap.family?.total_entries ?? 0) < 20,
            });
          }
        }
      } catch {
        /* non-critical — mode stays quick, no snapshot */
      }
    })();
  }, []);

  return { loggerMode, setLoggerMode, snapshotData, snapshotSignals };
}
