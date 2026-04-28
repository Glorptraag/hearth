import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * INTEGRATION TEST CONFIG
 *
 * Runs against a real Postgres (a Neon branch). Other external services
 * (Clerk, Anthropic, Sanity, Blob) are still mocked — "integration" here
 * means "API handler + real database + real Drizzle," not "entire world."
 *
 * Use for:
 *  - Testing Drizzle queries actually execute against real tables
 *  - Testing migration correctness (each run hits a fresh migrated branch)
 *  - Testing API handlers end-to-end (auth → DB → response)
 *  - Testing snapshot rebuild pipeline with real aggregate data
 *
 * Run with: `npm run test:integration`
 *
 * Requires a DATABASE_URL pointing at a test Neon branch. The branch is
 * created automatically by scripts/neon-test-branch.mjs before tests run.
 */
export default defineConfig({
  test: {
    name: 'integration',

    // globalSetup runs ONCE before all integration tests. It verifies that
    // a test DATABASE_URL is set (the Neon branch script must have run).
    globalSetup: ['./vitest.integration.globalSetup.ts'],

    // setupFiles runs once per test FILE. Mocks Clerk/Anthropic/Sanity/Blob,
    // but explicitly does NOT mock the DB — that's the whole point.
    setupFiles: ['./vitest.integration.setup.ts'],

    // Node, not jsdom. These tests don't render React.
    environment: 'node',
    globals: true,

    // Only integration tests. Use .integration.test.ts extension.
    include: ['src/**/*.integration.test.{ts,tsx}'],
    exclude: ['node_modules', 'drizzle', '.next', 'prototypes'],

    // Serial execution — tests share one Neon branch and truncate tables
    // between runs. Parallel writes would interleave badly. If this gets
    // painful, the fix is table-prefix isolation per test, not more workers.
    // (Vitest 4: top-level `maxWorkers` + `isolate` replace the removed
    // `pool` / `poolOptions` knobs — see vitest.dev/guide/migration#pool-rework.)
    //
    // `isolate: true` is REQUIRED here, not optional. Under `isolate: false`,
    // setup files run once per worker and Vitest's module cache holds
    // whichever copy of `@clerk/nextjs/server` got imported first. If a
    // route module hits that import before the setup's `vi.mock` registers,
    // the real Clerk loads and pulls in `server-only`, which throws. The
    // flake hits ALL files in the suite (including the canonical entries
    // test) once ≥3 files run together. Per-file isolation costs us a
    // little startup time but makes mocks deterministic.
    maxWorkers: 1,
    isolate: true,

    // Integration tests are slower than unit tests. Default 5s timeout is
    // tight for DB round trips on a fresh branch.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
