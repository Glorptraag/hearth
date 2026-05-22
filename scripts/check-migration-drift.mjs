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
let applied;
try {
  const rows = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
  applied = new Set(rows.map((r) => r.hash));
} catch (e) {
  console.error(`[drift] failed to query __drizzle_migrations: ${e.message}`);
  process.exit(2);
}

const expected = journal.entries.map((e) => e.tag);
const missing = expected.filter((t) => !applied.has(t));
const extra = [...applied].filter((t) => !expected.includes(t));

if (missing.length === 0 && extra.length === 0) {
  console.log(`[drift] OK — ${expected.length} migrations applied in order`);
  process.exit(0);
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
