#!/usr/bin/env node
/**
 * Backfill DLO links for pre-Phase-2 learning entries.
 *
 * Before PR #60 the enrichment pipeline did not emit
 * `discrete_learning_objectives`, so observation_dlo_links has no rows for
 * any entry created before that ship. This script re-runs enrichment on
 * eligible entries so the constellation Level-4 drill-down shows real
 * evidence instead of the legacy thread-level fallback.
 *
 * Eligibility:
 *   - status = 'enriched' (the first-pass pipeline succeeded)
 *   - no rows in observation_dlo_links for the entryId yet
 *
 * Flags:
 *   --dry-run            list what would be processed, don't call the LLM
 *   --family-id <uuid>   limit to one family (default: all)
 *   --since <YYYY-MM-DD> only entries with date_occurred ≥ this
 *   --limit <n>          max entries to process this run (default: 50)
 *   --delay <ms>         pause between LLM calls (default: 600ms ≈ 100/min)
 *
 * Cost note: each enrichment call costs roughly $0.001-$0.005 with
 * Haiku 4.5. A 1000-entry backfill is on the order of $1-$5. Run with
 * --dry-run first to see the row count.
 */
import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });

const arg = (name, fallback) => {
  const m = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (m) return m.split('=', 2)[1];
  const i = process.argv.indexOf(`--${name}`);
  if (i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) {
    return process.argv[i + 1];
  }
  return fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);

const dryRun = flag('dry-run');
const familyId = arg('family-id', null);
const since = arg('since', null);
const limit = Number(arg('limit', '50'));
const delayMs = Number(arg('delay', '600'));

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(2);
}
if (!process.env.ANTHROPIC_API_KEY && !dryRun) {
  console.error('ANTHROPIC_API_KEY not set — required unless --dry-run');
  process.exit(2);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const client = await pool.connect();
let candidates;
try {
  const whereParts = [`e.status = 'enriched'`, `NOT EXISTS (SELECT 1 FROM observation_dlo_links l WHERE l.observation_id = e.id)`];
  const params = [];
  if (familyId) { params.push(familyId); whereParts.push(`e.family_id = $${params.length}`); }
  if (since)    { params.push(since);    whereParts.push(`e.date_occurred >= $${params.length}`); }
  const sqlText = `
    SELECT e.id, e.family_id, e.date_occurred, e.title
    FROM learning_entries e
    WHERE ${whereParts.join(' AND ')}
    ORDER BY e.date_occurred DESC
    LIMIT ${Number.isFinite(limit) ? limit : 50}
  `;
  const res = await client.query(sqlText, params);
  candidates = res.rows;
} finally {
  client.release();
}

console.log(`Found ${candidates.length} entries eligible for DLO backfill${dryRun ? ' (DRY RUN)' : ''}.`);
if (candidates.length === 0) { await pool.end(); process.exit(0); }

if (dryRun) {
  for (const e of candidates.slice(0, 20)) {
    console.log(`  ${e.date_occurred}  ${e.id}  family=${e.family_id}  "${e.title?.slice(0, 60) ?? '(untitled)'}"`);
  }
  if (candidates.length > 20) console.log(`  … and ${candidates.length - 20} more`);
  await pool.end();
  process.exit(0);
}

// Dynamic import of the real enrichEntry so the script lives outside Next's
// bundler graph but still uses the production code path. We rely on tsx for
// .ts resolution; the npm script wraps node accordingly.
const { enrichEntry } = await import('../src/lib/ai/enrich.ts');

let ok = 0;
let fail = 0;
for (let i = 0; i < candidates.length; i++) {
  const e = candidates[i];
  process.stdout.write(`[${i + 1}/${candidates.length}] ${e.id} … `);
  try {
    await enrichEntry({ entryId: e.id, familyId: e.family_id });
    console.log('ok');
    ok++;
  } catch (err) {
    console.log(`fail (${err.message})`);
    fail++;
  }
  if (i < candidates.length - 1) {
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

console.log(`\nBackfill complete: ${ok} succeeded, ${fail} failed.`);
await pool.end();
process.exit(fail > 0 ? 1 : 0);
