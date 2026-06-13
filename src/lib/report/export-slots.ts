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
