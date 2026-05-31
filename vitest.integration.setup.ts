/**
 * INTEGRATION TEST SETUP
 *
 * Runs per test file. Mocks Clerk, Anthropic, Sanity, Blob — everything
 * except the database. The DB is real (a Neon branch in CI, or any Postgres
 * the DATABASE_URL points at).
 *
 * Isolation between tests is transaction rollback, NOT truncation. Each test
 * runs inside `BEGIN … ROLLBACK` on a single pinned connection (see
 * src/test/integration-db.ts), so anything a test writes is discarded with zero
 * extra round-trips and no sequence-reset bookkeeping. `@/lib/db` is aliased to
 * the test client in vitest.integration.config.ts, so the route handlers under
 * test write through the same transaction.
 *
 * (Every PK in the schema is a random UUID — there are no serial/identity
 * sequences — so rollback gives the same clean slate that TRUNCATE … RESTART
 * IDENTITY used to, without the per-test TRUNCATE.)
 */
import { vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';

// Re-use the Clerk/Anthropic/Sanity/Blob mocks from unit setup.
// This side-effects-registers them via vi.mock() calls.
import './vitest.setup';
import { connectTestDb, beginTx, rollbackTx, endTestDb } from '@/test/integration-db';

// Opt-in timing for the per-test isolation hook. Set HEARTH_TEST_TIMING=1 to
// print how long isolation costs each test — the single biggest lever on
// integration suite wall time. Silent by default; left in across refactors so
// before/after numbers stay measurable.
const TIMING = !!process.env.HEARTH_TEST_TIMING;

beforeAll(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  vi.clearAllMocks();
  const start = TIMING ? performance.now() : 0;
  await beginTx();
  if (TIMING) {
    console.log(`[test-timing] isolation hook ${(performance.now() - start).toFixed(1)}ms`);
  }
});

afterEach(async () => {
  await rollbackTx();
});

afterAll(async () => {
  await endTestDb();
});
