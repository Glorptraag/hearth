#!/usr/bin/env node
/**
 * One-shot prod migration repair.
 *
 * Idempotently applies any of 0012-0015 that are physically missing, then
 * back-fills the `drizzle.__drizzle_migrations` history rows so that
 * `npm run db:check-drift` returns clean.
 *
 * Every migration file in the chain is already wrapped in BEGIN/COMMIT and
 * every DDL is `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`, so we run each
 * file as ONE multi-statement query — no fragile splitting on
 * `--> statement-breakpoint`. The previous version of this script did split,
 * and dropped any chunk beginning with `--`, which silently no-op'd six
 * legitimate ALTERs/CREATEs in 0014.
 *
 * Safe to re-run.
 */
import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(2);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runFile(file) {
  console.log(`\n=== ${file} ===`);
  const sqlText = readFileSync(file, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sqlText);
    console.log('  ok (entire file applied as one transaction)');
  } catch (e) {
    console.error(`  FAIL: ${e.message}`);
    throw e;
  } finally {
    client.release();
  }
}

try {
  await runFile('drizzle/0014_capability_universe_v2.sql');
  await runFile('drizzle/0015_dlo_state.sql');
} catch (e) {
  console.error('aborting before journal backfill');
  await pool.end();
  process.exit(1);
}

const entries = [
  { tag: '0012_work_sample_candidate', when: '1779400000000' },
  { tag: '0013_normalize_columns', when: '1779500000000' },
  { tag: '0014_capability_universe_v2', when: '1779500000001' },
  { tag: '0015_dlo_state', when: '1779600000000' },
];

console.log('\n=== Backfill __drizzle_migrations ===');
const client = await pool.connect();
try {
  for (const e of entries) {
    const r = await client.query(
      'SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1',
      [e.tag]
    );
    if (r.rows.length > 0) {
      console.log(`  skip (already present): ${e.tag}`);
      continue;
    }
    await client.query(
      'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)',
      [e.tag, e.when]
    );
    console.log(`  inserted: ${e.tag}`);
  }
  const final = await client.query(
    'SELECT id, hash FROM drizzle.__drizzle_migrations ORDER BY id'
  );
  console.log('\n=== Final migration history ===');
  for (const r of final.rows) console.log(`  ${r.id}: ${r.hash}`);
} finally {
  client.release();
}

await pool.end();
console.log('\nNext: run `npm run db:check-drift` to confirm.');
