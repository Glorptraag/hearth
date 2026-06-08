/**
 * One-off, idempotent backfill: encrypt existing plaintext facilitator_notes.
 *
 * Facilitator private notes (E19: "encrypted; excluded from all exports and
 * AI") must be encrypted at rest. Any rows written before encryption landed
 * still hold plaintext in `note_text`. This script encrypts them in place. The
 * column type is unchanged (`text`) — this is a data-only migration, so there
 * is no Drizzle schema migration to generate.
 *
 * Idempotent: an already-encrypted value carries the `fenc1:` version prefix
 * (see src/lib/crypto/field-encryption.ts), so re-running skips it. Safe to run
 * twice, or after a partial failure.
 *
 * REQUIRES `FACILITATOR_NOTES_ENCRYPTION_KEY` to be set (the SAME key the app
 * uses, or every encrypted note becomes unreadable). The script aborts with a
 * clear message if it is missing.
 *
 *   Dry run (counts only, no writes):
 *     node --env-file-if-exists=.env.local node_modules/tsx/dist/cli.mjs \
 *       scripts/encrypt-facilitator-notes.ts --dry-run
 *
 *   Apply:
 *     node --env-file-if-exists=.env.local node_modules/tsx/dist/cli.mjs \
 *       scripts/encrypt-facilitator-notes.ts
 *
 *   (or: npm run db:encrypt-notes  /  npm run db:encrypt-notes -- --dry-run)
 *
 * In production, set the key in Vercel first, then run against the prod
 * DATABASE_URL once after this change deploys.
 */
import { eq } from 'drizzle-orm';
import { db } from '../src/lib/db';
import { facilitatorNotes } from '../src/lib/db/schema';
import { encryptField, isEncrypted } from '../src/lib/crypto/field-encryption';

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!process.env.FACILITATOR_NOTES_ENCRYPTION_KEY) {
    console.error(
      '❌ FACILITATOR_NOTES_ENCRYPTION_KEY is not set. Set it (the same key the app uses) before running.\n' +
        '   Generate one with: openssl rand -base64 32'
    );
    process.exit(1);
  }

  console.log(`🔐 Encrypting facilitator notes${dryRun ? ' (DRY RUN — no writes)' : ''}…`);

  const rows = await db
    .select({ id: facilitatorNotes.id, noteText: facilitatorNotes.noteText })
    .from(facilitatorNotes);

  let migrated = 0;
  let alreadyEncrypted = 0;

  for (const row of rows) {
    if (isEncrypted(row.noteText)) {
      alreadyEncrypted++;
      continue;
    }
    if (!dryRun) {
      await db
        .update(facilitatorNotes)
        .set({ noteText: encryptField(row.noteText), updatedAt: new Date() })
        .where(eq(facilitatorNotes.id, row.id));
    }
    migrated++;
  }

  console.log(
    `✅ Done. ${rows.length} row(s) total — ${migrated} ${dryRun ? 'would be ' : ''}encrypted, ` +
      `${alreadyEncrypted} already encrypted (skipped).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Encryption backfill failed:', err);
  process.exit(1);
});
