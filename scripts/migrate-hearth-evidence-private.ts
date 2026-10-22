/**
 * One-off, idempotent migration: move legacy PUBLIC Hearth session photos to
 * PRIVATE blob storage.
 *
 * Before this change `POST /api/hearths/[id]/sessions/[sessionId]/evidence`
 * stored photos with `access: 'public'` and saved the raw blob URL in
 * `session_evidence.file_url`, so anyone holding the URL could fetch a child's
 * photo. New uploads are private under
 * `hearth-evidence/<hearthId>/<sessionId>/<familyId>/<file>` and served only by
 * `GET /api/hearths/[id]/evidence` (see src/lib/hearth-evidence.ts).
 *
 * For each row whose `file_url` is still an absolute URL, this script:
 *   1. downloads the public blob,
 *   2. re-uploads it as a private blob under the hearth-scoped prefix,
 *   3. rewrites `file_url` to the new pathname (only if it still holds the old URL),
 *   4. deletes the public blob.
 * A row is rewritten only after its private copy exists, and the public blob is
 * deleted only after the row points at the copy, so a crash at any step leaves
 * every photo reachable. Re-running skips rows already holding a pathname. If
 * step 4 fails the row is migrated but the public blob lingers; the script
 * lists those URLs so they can be deleted by hand.
 *
 * Only URLs on Vercel Blob's public host are fetched; anything else is
 * reported and skipped.
 *
 * REQUIRES `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` for the SAME environment
 * (the token must belong to the store that holds the public blobs).
 *
 *   Dry run (default — lists what would move, no writes):
 *     node --env-file-if-exists=.env.local node_modules/tsx/dist/cli.mjs \
 *       scripts/migrate-hearth-evidence-private.ts
 *
 *   Apply:
 *     node --env-file-if-exists=.env.local node_modules/tsx/dist/cli.mjs \
 *       scripts/migrate-hearth-evidence-private.ts --apply [--limit=N]
 */
import { and, eq, like } from 'drizzle-orm';
import { put, del } from '@vercel/blob';
import { db } from '../src/lib/db';
import { hearthSessions, sessionEvidence } from '../src/lib/db/schema';
import { HEARTH_EVIDENCE_TYPES, hearthEvidencePath } from '../src/lib/hearth-evidence';

const PUBLIC_BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/i;

function extFor(contentType: string, url: URL): string {
  const known = HEARTH_EVIDENCE_TYPES[contentType];
  if (known) return known;
  const fromPath = url.pathname.split('.').pop()?.toLowerCase();
  return fromPath && /^[a-z0-9]{1,5}$/.test(fromPath) ? fromPath : 'bin';
}

async function main() {
  const apply = process.argv.includes('--apply');
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

  if (!process.env.DATABASE_URL || !process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ DATABASE_URL and BLOB_READ_WRITE_TOKEN must both be set (same environment).');
    process.exit(1);
  }

  console.log(`🔒 Moving Hearth session photos to private storage${apply ? '' : ' (DRY RUN — no writes)'}…`);

  const rows = await db
    .select({
      id: sessionEvidence.id,
      fileUrl: sessionEvidence.fileUrl,
      fileType: sessionEvidence.fileType,
      sessionId: sessionEvidence.sessionId,
      familyId: sessionEvidence.uploadedByFamilyId,
      hearthId: hearthSessions.hearthId,
    })
    .from(sessionEvidence)
    .innerJoin(hearthSessions, eq(hearthSessions.id, sessionEvidence.sessionId))
    .where(like(sessionEvidence.fileUrl, 'http%'));

  console.log(`Found ${rows.length} legacy public row(s).`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  const lingering: string[] = [];

  for (const row of rows) {
    if (migrated >= limit) break;

    let url: URL;
    try {
      url = new URL(row.fileUrl);
    } catch {
      console.warn(`  ⚠️  ${row.id}: unparseable file_url, skipped`);
      skipped++;
      continue;
    }
    if (url.protocol !== 'https:' || !PUBLIC_BLOB_HOST.test(url.hostname)) {
      console.warn(`  ⚠️  ${row.id}: not a Vercel public blob (${url.hostname}), skipped`);
      skipped++;
      continue;
    }

    if (!apply) {
      console.log(`  → ${row.id}: hearth ${row.hearthId} / session ${row.sessionId}`);
      migrated++;
      continue;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`download ${res.status}`);
      const contentType = res.headers.get('content-type')?.split(';')[0].trim() || row.fileType || 'application/octet-stream';
      const body = Buffer.from(await res.arrayBuffer());

      const blob = await put(
        hearthEvidencePath({ hearthId: row.hearthId, sessionId: row.sessionId, familyId: row.familyId }, extFor(contentType, url)),
        body,
        { access: 'private', addRandomSuffix: true, contentType }
      );

      const updated = await db
        .update(sessionEvidence)
        .set({ fileUrl: blob.pathname })
        .where(and(eq(sessionEvidence.id, row.id), eq(sessionEvidence.fileUrl, row.fileUrl)))
        .returning({ id: sessionEvidence.id });

      if (updated.length === 0) {
        // Row changed under us — drop the orphan private copy, keep the original.
        await del(blob.url).catch(() => {});
        console.warn(`  ⚠️  ${row.id}: row changed during migration, left as-is`);
        skipped++;
        continue;
      }

      try {
        await del(row.fileUrl);
      } catch (err) {
        lingering.push(row.fileUrl);
        console.warn(`  ⚠️  ${row.id}: migrated, but public blob delete failed:`, err);
      }
      migrated++;
      console.log(`  ✓ ${row.id} → ${blob.pathname}`);
    } catch (err) {
      failed++;
      console.error(`  ❌ ${row.id}: ${err instanceof Error ? err.message : String(err)} (row untouched)`);
    }
  }

  console.log(
    `✅ Done. ${migrated} ${apply ? 'migrated' : 'would migrate'}, ${skipped} skipped, ${failed} failed.`
  );
  if (lingering.length > 0) {
    console.log('Public blobs still to delete by hand:');
    for (const u of lingering) console.log(`  ${u}`);
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('❌ Hearth evidence migration failed:', err);
  process.exit(1);
});
