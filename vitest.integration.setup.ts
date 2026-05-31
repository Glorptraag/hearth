/**
 * INTEGRATION TEST SETUP
 *
 * Runs per test file. Mocks Clerk, Anthropic, Sanity, Blob — everything
 * except the database. The DB is real (a Neon branch created by globalSetup).
 *
 * Between tests, truncates all user-data tables so tests don't leak data
 * into each other. Schemas/migrations are NOT touched — they live for the
 * whole test run.
 */
import { sql, getTableName, is } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { vi, beforeEach, afterAll } from 'vitest';

// Re-use the Clerk/Anthropic/Sanity/Blob mocks from unit setup.
// This side-effects-registers them via vi.mock() calls.
import './vitest.setup';
import * as schema from '@/lib/db/schema';

// Truncate every user-data table defined in src/lib/db/schema.ts. We derive
// the list from schema.ts exports at runtime — adding a new pgTable export
// automatically opts it into the truncate sweep, so the suite can't silently
// leak rows between tests. CASCADE handles FK dependencies in a single pass;
// no manual topological ordering needed.
//
// Tables that exist in the DB but are NOT exported from schema.ts (e.g. the
// pedagogy_knowledge_chunks reference table populated by an offline embedder)
// are not truncated — they hold reference data that should survive between
// tests, which matches the historical hand-curated intent.
const TABLES_TO_TRUNCATE: string[] = Object.values(schema)
  .filter((v): v is PgTable => is(v, PgTable))
  .map((t) => getTableName(t));

async function truncateAll() {
  // Lazy import so this module doesn't hit Neon at setup-file load time.
  const { db } = await import('@/lib/db');

  // Filter the curated list against what actually exists in the database.
  // The hand-maintained list above documents *intent* (every user-data
  // table the suite wants wiped between tests). The filter handles real
  // drift between the list and the migrations — e.g. a table that was
  // created and later dropped (capability_observations was created in
  // 0000_last_gunslinger.sql and dropped in 0005_eminent_paladin.sql, so
  // a hand-curated entry for it would throw 42P01 here). Without the
  // filter, every test in the suite fails on the first `beforeEach`.
  const result = (await db.execute(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  )) as { rows: Array<{ tablename: string }> } | Array<{ tablename: string }>;
  const rows = Array.isArray(result) ? result : result.rows;
  const existing = new Set(rows.map((r) => r.tablename));
  const present = TABLES_TO_TRUNCATE.filter((t) => existing.has(t));

  if (present.length === 0) return;

  // CASCADE handles FK dependencies in one pass. RESTART IDENTITY resets
  // any serial sequences so tests that assert on row IDs stay deterministic.
  const tables = present.map((t) => `"${t}"`).join(', ');
  await db.execute(sql.raw(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`));
}

// Opt-in timing for the per-test isolation hook. Set HEARTH_TEST_TIMING=1 to
// print how long isolation costs each test — the single biggest lever on
// integration suite wall time. Silent by default; left in across refactors so
// before/after numbers stay measurable.
const TIMING = !!process.env.HEARTH_TEST_TIMING;

beforeEach(async () => {
  vi.clearAllMocks();
  const start = TIMING ? performance.now() : 0;
  await truncateAll();
  if (TIMING) {
    console.log(`[test-timing] isolation hook ${(performance.now() - start).toFixed(1)}ms`);
  }
});

afterAll(async () => {
  // Leaves the branch intact for CI teardown to handle. Locally, the
  // neon-test-branch.mjs script deletes the branch after vitest exits.
});
