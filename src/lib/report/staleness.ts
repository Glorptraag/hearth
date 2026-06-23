/**
 * "Edited since last export" derivation for the HEU report.
 *
 * Pure + client-side: a report is stale when any of its content — work-sample
 * rows, their annotations, or the underlying entries — was updated AFTER the
 * last export. The compliance-report row's own `updatedAt` is deliberately
 * excluded by callers: the export PATCH bumps it in the same write that sets
 * `lastExportedAt`, so counting it would make every report read as permanently
 * stale the instant it's exported.
 */
export function reportEditedSinceExport(
  lastExportedAt: string | null | undefined,
  contentUpdatedAts: ReadonlyArray<string | null | undefined>,
): boolean {
  if (!lastExportedAt) return false; // never exported → never "stale"
  const exportedMs = new Date(lastExportedAt).getTime();
  if (Number.isNaN(exportedMs)) return false;
  for (const ts of contentUpdatedAts) {
    if (!ts) continue;
    const ms = new Date(ts).getTime();
    if (!Number.isNaN(ms) && ms > exportedMs) return true;
  }
  return false;
}
