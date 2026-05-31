/**
 * Integration globalSetup — runs ONCE before all integration tests.
 *
 * Responsibility: confirm the test environment is wired up correctly.
 * It does NOT create the Neon branch itself — that's the job of
 * scripts/neon-test-branch.mjs which runs BEFORE vitest.
 *
 * Flow:
 *   1. scripts/neon-test-branch.mjs creates a branch, runs migrations,
 *      and exports DATABASE_URL into the vitest process's env.
 *   2. This globalSetup confirms DATABASE_URL is set and points to a
 *      branch (not the production database, to avoid catastrophe).
 *   3. Tests run, sharing the branch. beforeEach truncates tables.
 *   4. After vitest exits, the script deletes the branch.
 */
export async function setup() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      'Integration tests require DATABASE_URL. Run via `npm run test:integration`, ' +
        'not `vitest --config vitest.integration.config.ts` directly. The test-branch ' +
        'script creates a Neon branch and injects DATABASE_URL before vitest starts.'
    );
  }

  // Refuse to run if DATABASE_URL matches production. This is the "don't
  // truncate prod by accident" safety net. Customize the check to match
  // whatever identifies your prod DB (host, branch name, etc).
  const isProduction =
    url.includes('ep-prod') || // Neon compute endpoint naming convention
    process.env.NEON_BRANCH_NAME === 'main' ||
    process.env.NODE_ENV === 'production';

  if (isProduction) {
    throw new Error(
      'Integration tests refuse to run against production. ' +
        `DATABASE_URL looks like production: ${url.replace(/:[^@]*@/, ':***@')}`
    );
  }

  // Two supported flows: (a) the Neon orchestrator, which forks a branch and
  // sets NEON_TEST_BRANCH_ID before spawning vitest; (b) a plain Postgres
  // (local container / CI service) where the schema is applied by a migrate
  // step and DATABASE_URL points at it directly. Only enforce the branch-id
  // guard for the Neon flow — a Neon URL with no branch id means the
  // orchestrator is broken and we'd otherwise run against a durable branch.
  const isNeon = /neon\.tech/.test(url);
  if (isNeon && !process.env.NEON_TEST_BRANCH_ID) {
    throw new Error(
      'Expected NEON_TEST_BRANCH_ID env var for a Neon DATABASE_URL. The test-branch ' +
        'script should set this. If you see this error, the script is broken or vitest ' +
        'was invoked directly against Neon.'
    );
  }

  // Log once so the test runner's output shows which DB we're on.
  const maskedUrl = url.replace(/:[^@]*@/, ':***@');
  const target = isNeon
    ? `Neon branch ${process.env.NEON_TEST_BRANCH_ID}`
    : 'local/CI Postgres';
  console.log(`[integration] Using ${target}`);
  console.log(`[integration] DATABASE_URL=${maskedUrl}`);
}

export async function teardown() {
  // The neon-test-branch.mjs script handles branch deletion after vitest
  // exits, so this is a no-op. Kept for symmetry and future hooks.
}
