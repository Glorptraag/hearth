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
import { sql } from 'drizzle-orm';
import { vi, beforeEach, afterAll } from 'vitest';

// Re-use the Clerk/Anthropic/Sanity/Blob mocks from unit setup.
// This side-effects-registers them via vi.mock() calls.
import './vitest.setup';

// Tables to truncate between tests. These are the ones with user/family data.
// Reference tables (e.g. Sanity-mirrored catalog data if any) are NOT listed
// so they don't get wiped between tests. Order is for human readability —
// CASCADE handles FK dependencies in a single pass.
const TABLES_TO_TRUNCATE = [
  // admin / no-deps
  'admin_audit_log',
  'content_studio_drafts',
  'invitations',
  'provider_codes',

  // hearth session children → sessions → hearths
  'session_reflections',
  'session_evidence',
  'session_attendance',
  'suggested_observations',
  'hearth_invites',
  'hearth_sessions',
  'hearth_memberships',
  'hearths',

  // compliance children → heu_reports (Queensland HEU). Was incorrectly
  // listed as `compliance_reports`, which no migration ever created — the
  // truncate then threw `relation "compliance_reports" does not exist` on
  // every test run.
  'work_sample_annotations',
  'work_samples',
  'heu_reports',

  // badges
  'badge_assessment_logs',
  'badge_awards',
  'badge_definitions',

  // per-family data
  'planner_entries',
  'notifications',
  'ai_pipeline_logs',
  'facilitator_notes',
  'family_intelligence_snapshots',
  'learning_entries',
  'family_library',
  'module_drafts',

  // family structure
  'learners',
  'family_members',
  'family_settings',
  'families',
];

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

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll();
});

afterAll(async () => {
  // Leaves the branch intact for CI teardown to handle. Locally, the
  // neon-test-branch.mjs script deletes the branch after vitest exits.
});
