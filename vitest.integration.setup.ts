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
import { after } from 'next/server';
import { connectTestDb, beginTx, rollbackTx, endTestDb } from '@/test/integration-db';

// `after()` callbacks captured during the current test. Unit setup mocks
// `after` as fire-and-forget (`Promise.resolve().then(cb)`), which is fatal for
// integration isolation: the callback's REAL DB writes (draft-resume
// notifications, enrichment, snapshot rebuild) land on the single pinned
// connection AFTER this test's ROLLBACK — leaking rows into the next test and
// poisoning its transaction (a duplicate-key cascade that fails every later
// test). We instead queue them and drain inside the still-open transaction in
// afterEach, so their writes roll back with everything else. Best-effort: the
// routes already treat after() as fire-and-forget, and a throwing callback is
// discarded by the rollback that immediately follows.
const pendingAfterCallbacks: Array<() => void | Promise<void>> = [];

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
  pendingAfterCallbacks.length = 0;
  // Re-point `after` at the queue every test (after clearAllMocks, which wipes
  // call history but not implementation — set here so it can never be lost).
  vi.mocked(after).mockImplementation((cb: () => void | Promise<void>) => {
    pendingAfterCallbacks.push(cb);
  });
  const start = TIMING ? performance.now() : 0;
  await beginTx();
  if (TIMING) {
    console.log(`[test-timing] isolation hook ${(performance.now() - start).toFixed(1)}ms`);
  }
});

afterEach(async () => {
  // Drain after() callbacks inside the open transaction so their writes are
  // rolled back, not committed onto the shared connection.
  for (const cb of pendingAfterCallbacks.splice(0)) {
    try {
      await cb();
    } catch {
      // Best-effort — the rollback below discards any partial work.
    }
  }
  await rollbackTx();
});

afterAll(async () => {
  await endTestDb();
});
