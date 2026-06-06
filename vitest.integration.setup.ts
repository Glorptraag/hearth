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

const afterRegistry = globalThis as typeof globalThis & { __hearthAfter?: Promise<unknown>[] };

/**
 * Flush every post-response async write the route scheduled — Next.js `after()`
 * callbacks (tracked explicitly in __hearthAfter by the next/server mock) AND
 * raw fire-and-forget `.then/.catch` promises (drained via macrotask yields) —
 * so they all run NOW, inside the current test's transaction. Without this they
 * resolve later, on the shared pinned connection, during a DIFFERENT test:
 * their FK writes hit the rolled-back family, abort that transaction, and
 * cascade-fail the whole worker. Flushing here keeps each test's async tail
 * contained to its own (about-to-be-rolled-back) transaction.
 */
async function flushPostResponseWork(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    if (afterRegistry.__hearthAfter?.length) {
      await Promise.allSettled(afterRegistry.__hearthAfter.splice(0));
    }
    // Yield a macrotask so raw fire-and-forget chains advance a step, then
    // re-check the registry. Stops early once nothing is pending.
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (!afterRegistry.__hearthAfter?.length) break;
  }
}

beforeAll(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  vi.clearAllMocks();
  // Drop any post-response promises left pending from a prior test/file so the
  // registry can't leak a stale write across the transaction boundary.
  if (afterRegistry.__hearthAfter) afterRegistry.__hearthAfter.length = 0;
  const start = TIMING ? performance.now() : 0;
  await beginTx();
  if (TIMING) {
    console.log(`[test-timing] isolation hook ${(performance.now() - start).toFixed(1)}ms`);
  }
});

afterEach(async () => {
  // Settle the test's async tail INSIDE its transaction, then roll back so all
  // of it — the test's writes and the flushed post-response writes — is discarded.
  await flushPostResponseWork();
  await rollbackTx();
});

afterAll(async () => {
  await endTestDb();
});
