/**
 * Persisted-only work-sample slot resolution for the HEU report PDF export.
 *
 * A slot is filled ONLY from its persisted DB work-sample row — there is no
 * date/subject auto-match. This is deliberate: the compliance PDF must reflect
 * exactly what the parent selected on screen, never a "best guess" entry they
 * never chose (which would put an unvetted sample in front of the regulator and
 * diverge from the on-screen report).
 */

export type ExportSlotConfig = { area: string; label: string };

export type ExportSlotSample = {
  slot: string;
  entryId: string | null;
  annotation: { confirmedAt: Date | null } | null;
};

export type ExportSlotEntry = { id: string; title: string | null };

export type ExportSlotStatus = 'Empty' | 'Selected' | 'Confirmed';

export type ResolvedExportSlot = ExportSlotConfig & {
  entryTitle: string;
  status: ExportSlotStatus;
};

/**
 * Resolve the ordered slot rows for the export table. `slotKeyMap` maps each
 * persisted slot key (e.g. `early_writing`) to its index in the ordered `slots`
 * array. Slots with no persisted entry stay `Empty` / `—`.
 */
export function resolveExportSlotData(
  slots: ExportSlotConfig[],
  slotKeyMap: Record<string, number>,
  dbSamples: ExportSlotSample[],
  entries: ExportSlotEntry[],
): ResolvedExportSlot[] {
  const resolved: ResolvedExportSlot[] = slots.map((s) => ({
    ...s,
    entryTitle: '—',
    status: 'Empty',
  }));

  for (const dbs of dbSamples) {
    const idx = slotKeyMap[dbs.slot];
    if (idx === undefined || !dbs.entryId) continue;
    const entry = entries.find((e) => e.id === dbs.entryId);
    if (!entry) continue;
    resolved[idx].entryTitle = entry.title ?? '—';
    resolved[idx].status = dbs.annotation?.confirmedAt ? 'Confirmed' : 'Selected';
  }

  return resolved;
}

// ─── On-screen slot resolution ───
// The HEU report screen is PERSISTED-ONLY too: a slot is filled solely from its
// selected DB work-sample entry — never a date/subject auto-match. This keeps the
// on-screen report and the exported PDF in lockstep (both show "Empty" for an
// unfilled slot). The screen's status vocabulary (complete/partial/empty, from
// workSamples.status) differs from the export's (Empty/Selected/Confirmed), so
// this is a sibling resolver rather than the same function — but neither auto-matches.

export type ScreenSlotStatus = 'complete' | 'partial' | 'empty';

/** Minimal slice of a DB work-sample row the screen resolver needs. */
export type ScreenSlotSample = { slot: string; entryId: string | null; status: string };

export type ResolvedScreenSlot<S, E, D> = S & {
  matchedEntry: E | null;
  status: ScreenSlotStatus;
  dbSample: D | null;
};

/**
 * Resolve the on-screen work-sample slots from persisted DB rows only. A slot is
 * `empty` unless its DB row carries an `entryId` that resolves to a loaded entry
 * (a selected-but-since-deleted entry falls back to `empty`, matching the export).
 * Generic over the caller's slot / entry / sample shapes so the page keeps its
 * richer types on the returned objects.
 */
export function resolveScreenSlots<
  S extends { slotKey: string },
  E extends { id: string },
  D extends ScreenSlotSample,
>(slots: S[], samples: D[], entries: E[]): ResolvedScreenSlot<S, E, D>[] {
  const sampleMap = new Map(samples.map((s) => [s.slot, s]));
  return slots.map((slot) => {
    const dbSample = sampleMap.get(slot.slotKey) ?? null;
    if (dbSample?.entryId) {
      const matchedEntry = entries.find((e) => e.id === dbSample.entryId) ?? null;
      if (matchedEntry) {
        const st = dbSample.status;
        const status: ScreenSlotStatus =
          st === 'complete' || st === 'annotated' ? 'complete' : st === 'selected' ? 'partial' : 'empty';
        return { ...slot, matchedEntry, status, dbSample };
      }
    }
    return { ...slot, matchedEntry: null, status: 'empty', dbSample };
  });
}
