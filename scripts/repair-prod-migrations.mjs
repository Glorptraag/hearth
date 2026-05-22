import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

// Drizzle splits at --> statement-breakpoint. Run each as a separate query.
async function runMigration(file) {
  const raw = readFileSync(file, 'utf8');
  // strip BEGIN/COMMIT - we'll wrap in our own
  const body = raw.replace(/^\s*BEGIN;?\s*$/gm, '').replace(/^\s*COMMIT;?\s*$/gm, '');
  const stmts = body.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
  console.log(`\n=== ${file} (${stmts.length} statements) ===`);
  for (let i = 0; i < stmts.length; i++) {
    const s = stmts[i];
    const preview = s.replace(/\s+/g, ' ').slice(0, 80);
    try {
      await sql.unsafe(s);
      console.log(`  [${i+1}] ok: ${preview}`);
    } catch (e) {
      console.error(`  [${i+1}] FAIL: ${preview}`);
      console.error(`       ${e.message}`);
      throw e;
    }
  }
}

await runMigration('drizzle/0014_capability_universe_v2.sql');
await runMigration('drizzle/0015_dlo_state.sql');

// Backfill __drizzle_migrations history for 0012-0015
const entries = [
  { tag: '0012_work_sample_candidate', when: '1779400000000' },
  { tag: '0013_normalize_columns', when: '1779500000000' },
  { tag: '0014_capability_universe_v2', when: '1779500000001' },
  { tag: '0015_dlo_state', when: '1779600000000' },
];
console.log('\n=== Backfill __drizzle_migrations ===');
for (const e of entries) {
  const exists = await sql`SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = ${e.tag}`;
  if (exists.length > 0) {
    console.log(`  skip (already present): ${e.tag}`);
    continue;
  }
  await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${e.tag}, ${e.when})`;
  console.log(`  inserted: ${e.tag}`);
}

console.log('\n=== Verify final state ===');
const final = await sql`SELECT id, hash FROM drizzle.__drizzle_migrations ORDER BY id`;
for (const r of final) console.log(`  ${r.id}: ${r.hash}`);
