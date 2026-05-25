#!/usr/bin/env node
/**
 * Migration drift detector.
 *
 * Compares the canonical `drizzle/meta/_journal.json` chain against the actual
 * `drizzle.__drizzle_migrations` rows in the target database. Fails non-zero if
 * any journal entry is missing — i.e. the code expects schema state that the
 * database has not been told to enter.
 *
 * Run modes:
 *   --against=DATABASE_URL_env_var  (default: DATABASE_URL)
 *
 * Designed to be cheap enough to run as a post-deploy verification step or as
 * a manual safety check. Connects via the @neondatabase/serverless HTTP path,
 * so it is safe to call from CI without a long-lived pool.
 *
 * Exit codes:
 *   0  journal matches db
 *   1  drift detected
 *   2  cannot reach db / setup error
 */
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';

const arg = (name, fallback) => {
  const m = process.argv.find((a) => a.startsWith(`--${name}=`));
  return m ? m.split('=', 2)[1] : fallback;
};

const envVar = arg('against', 'DATABASE_URL');
const url = process.env[envVar];
if (!url) {
  console.error(`[drift] no DATABASE_URL in env var '${envVar}'`);
  process.exit(2);
}

const journalPath = resolve(process.cwd(), 'drizzle/meta/_journal.json');
let journal;
try {
  journal = JSON.parse(readFileSync(journalPath, 'utf8'));
} catch (e) {
  console.error(`[drift] failed to read ${journalPath}: ${e.message}`);
  process.exit(2);
}

const sql = neon(url);
let appliedHashes;
try {
  const rows = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
  appliedHashes = new Set(rows.map((r) => r.hash));
} catch (e) {
  console.error(`[drift] failed to query __drizzle_migrations: ${e.message}`);
  process.exit(2);
}

// The `__drizzle_migrations.hash` column has TWO formats in prod, because the
// repo's migrator changed under it:
//
//   1. Legacy custom migrator (rows 0..15 in prod as of 2026-05-25) stored the
//      filename tag itself, eg. "0015_dlo_state" (≤32 chars).
//   2. Standard drizzle-orm migrator (rows 16+ — anything I ran during the
//      2026-05-25 incident) stores SHA256(sql body), per
//      `node_modules/drizzle-orm/migrator.js:23`. 64-char hex.
//
// We don't get to rewrite history, so a journal entry is considered "applied"
// if EITHER form appears in the column. Likewise an applied row is "extra"
// only if neither its tag-name nor its hash appears in the journal.
function hashOfMigration(tag) {
  const sqlPath = resolve(process.cwd(), 'drizzle', `${tag}.sql`);
  const body = readFileSync(sqlPath, 'utf8');
  return createHash('sha256').update(body).digest('hex');
}

const expected = journal.entries.map((e) => ({ tag: e.tag, hash: hashOfMigration(e.tag) }));
const missing = expected
  .filter((e) => !appliedHashes.has(e.hash) && !appliedHashes.has(e.tag))
  .map((e) => e.tag);
const expectedTokens = new Set(expected.flatMap((e) => [e.tag, e.hash]));
const extra = [...appliedHashes].filter((h) => !expectedTokens.has(h));

// Secondary check: every table declared in schema.ts must physically exist
// in the database. Catches the case where __drizzle_migrations says a
// migration ran but the SQL was actually no-op'd (e.g. by a buggy bespoke
// runner — see the 2026-05-22 incident notes in scripts/repair-prod-migrations.mjs).
const schemaPath = 'src/lib/db/schema.ts';
let physicalMissing = [];
try {
  const schemaSrc = readFileSync(resolve(process.cwd(), schemaPath), 'utf8');
  const declared = [...schemaSrc.matchAll(/pgTable\(\s*['"]([a-zA-Z0-9_]+)['"]/g)].map((m) => m[1]);
  const rows = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
  const present = new Set(rows.map((r) => r.table_name));
  physicalMissing = declared.filter((t) => !present.has(t)).sort();
} catch (e) {
  console.error(`[drift] could not run physical table check: ${e.message}`);
}

if (missing.length === 0 && extra.length === 0 && physicalMissing.length === 0) {
  console.log(`[drift] OK — ${expected.length} migrations applied in order, all schema.ts tables present in db`);
  process.exit(0);
}

if (physicalMissing.length > 0) {
  console.error(`[drift] PHYSICAL MISMATCH — tables declared in schema.ts but missing from db:`);
  for (const t of physicalMissing) console.error(`  - ${t}`);
  console.error(`        → a migration was journaled as applied but its DDL did not run.`);
}

if (missing.length > 0) {
  console.error(`[drift] MISSING from db (code expects but db has not applied):`);
  for (const t of missing) console.error(`  - ${t}`);
}
if (extra.length > 0) {
  console.error(`[drift] EXTRA in db (applied but not in journal):`);
  for (const t of extra) console.error(`  - ${t}`);
}
process.exit(1);
