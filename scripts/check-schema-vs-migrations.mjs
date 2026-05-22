#!/usr/bin/env node
/**
 * Static schema-vs-migrations lint.
 *
 * Reads every `pgTable('<name>', …)` declaration from `src/lib/db/schema.ts`
 * and confirms that the migration chain contains a `CREATE TABLE … <name>`
 * statement for each. This catches the case where a developer adds a table to
 * schema.ts (so the type system is happy and prod build succeeds) but forgets
 * to author the migration — exactly the failure that left prod missing
 * `learner_dlo_status` after PR #60.
 *
 * Runs without a database connection. Suitable for the CI typecheck/lint job.
 *
 * Exit codes:
 *   0  every pgTable has a CREATE TABLE somewhere in drizzle/*.sql
 *   1  one or more tables in schema.ts have no migration
 *   2  cannot read schema.ts or drizzle/
 */
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

const schemaPath = resolve(process.cwd(), 'src/lib/db/schema.ts');
let schemaSrc;
try {
  schemaSrc = readFileSync(schemaPath, 'utf8');
} catch (e) {
  console.error(`[schema-lint] cannot read ${schemaPath}: ${e.message}`);
  process.exit(2);
}

const pgTableRe = /pgTable\(\s*['"]([a-zA-Z0-9_]+)['"]/g;
const declared = new Set();
for (const m of schemaSrc.matchAll(pgTableRe)) {
  declared.add(m[1]);
}

if (declared.size === 0) {
  console.error('[schema-lint] no pgTable declarations found — refusing to pass vacuously');
  process.exit(2);
}

const drizzleDir = resolve(process.cwd(), 'drizzle');
let files;
try {
  files = readdirSync(drizzleDir).filter((f) => f.endsWith('.sql'));
} catch (e) {
  console.error(`[schema-lint] cannot read ${drizzleDir}: ${e.message}`);
  process.exit(2);
}

const allSql = files.map((f) => readFileSync(resolve(drizzleDir, f), 'utf8')).join('\n');
// match: CREATE TABLE [IF NOT EXISTS] "name" or `name` or name
const createRe = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+["`]?([a-zA-Z0-9_]+)["`]?/gi;
const created = new Set();
for (const m of allSql.matchAll(createRe)) {
  created.add(m[1]);
}
// ALTER TABLE … RENAME TO also creates the new name from a lint POV
const renameRe = /ALTER\s+TABLE\s+["`]?([a-zA-Z0-9_]+)["`]?\s+RENAME\s+TO\s+["`]?([a-zA-Z0-9_]+)["`]?/gi;
for (const m of allSql.matchAll(renameRe)) {
  created.add(m[2]);
}

const missing = [...declared].filter((t) => !created.has(t)).sort();
if (missing.length === 0) {
  console.log(`[schema-lint] OK — all ${declared.size} pgTable declarations have a CREATE TABLE in drizzle/`);
  process.exit(0);
}

console.error('[schema-lint] tables declared in schema.ts but never created in any migration:');
for (const t of missing) console.error(`  - ${t}`);
console.error('\nAuthor a migration in drizzle/ that creates each of these, or remove the declaration.');
process.exit(1);
