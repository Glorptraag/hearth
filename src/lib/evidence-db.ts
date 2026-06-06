/**
 * Server-only evidence persistence — the read/write sides of the
 * `evidenceUrls` text[] → `learning_entry_evidence` dual-write established in
 * #160. Kept apart from `@/lib/evidence` (which is pure + client-safe) because
 * this module imports the DB client.
 *
 * Dual-write contract (active until the `evidence_urls` column is retired):
 *  - write: `learning_entries.evidenceUrls` stays the durable record; the
 *    `learning_entry_evidence` rows are a redundant, caption-carrying mirror,
 *    so a row-insert failure never fails the save.
 *  - read: callers prefer the rows (they carry captions) and fall back to the
 *    legacy column for entries saved before the migration — see
 *    `entryPhotoEvidence` in `@/lib/evidence`.
 */
import type { InferSelectModel } from 'drizzle-orm';
import { asc, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { learningEntryEvidence } from '@/lib/db/schema';
import type { EvidencePayloadItem } from '@/lib/logger/entry-payload';

export type EntryEvidenceRow = InferSelectModel<typeof learningEntryEvidence>;

/**
 * Persist the dual-write evidence rows for a freshly-saved entry. Best-effort:
 * `evidenceUrls` is already committed on the entry, so a failure here is logged
 * and swallowed rather than failing the request (the read path falls back to
 * the column). When `items` is omitted, photo rows are synthesised from
 * `evidenceUrls` so every caller — including ones that only send the legacy
 * field — keeps the new table populated.
 */
export async function writeEntryEvidence(
  entryId: string,
  items: EvidencePayloadItem[] | undefined,
  evidenceUrls: string[] | undefined,
): Promise<void> {
  const rows =
    items && items.length > 0
      ? items
      : (evidenceUrls ?? []).map(
          (content): EvidencePayloadItem => ({ kind: 'photo', content }),
        );
  if (rows.length === 0) return;
  try {
    await db.insert(learningEntryEvidence).values(
      rows.map((e) => ({
        entryId,
        kind: e.kind,
        content: e.content,
        caption: e.caption ?? null,
      })),
    );
  } catch (err) {
    console.error('[evidence-db] dual-write to learning_entry_evidence failed:', err);
  }
}

/**
 * Fetch `learning_entry_evidence` rows for a set of entries and attach them as
 * an `evidence` array, keyed by entry id. Ordered for stable rendering.
 */
export async function attachEvidence<T extends { id: string }>(
  entries: T[],
): Promise<(T & { evidence: EntryEvidenceRow[] })[]> {
  if (entries.length === 0) return [];
  const ids = entries.map((e) => e.id);
  const rows = await db
    .select()
    .from(learningEntryEvidence)
    .where(inArray(learningEntryEvidence.entryId, ids))
    .orderBy(asc(learningEntryEvidence.createdAt), asc(learningEntryEvidence.id));

  const byEntry = new Map<string, EntryEvidenceRow[]>();
  for (const row of rows) {
    const list = byEntry.get(row.entryId);
    if (list) list.push(row);
    else byEntry.set(row.entryId, [row]);
  }
  return entries.map((e) => ({ ...e, evidence: byEntry.get(e.id) ?? [] }));
}
