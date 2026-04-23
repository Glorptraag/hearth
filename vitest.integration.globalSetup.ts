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

  // Belt-and-braces: require the branch name env var the script sets.
  if (!process.env.NEON_TEST_BRANCH_ID) {
    throw new Error(
      'Expected NEON_TEST_BRANCH_ID env var. The test-branch script should set this. ' +
        'If you see this error, the script is broken or vitest was invoked directly.'
    );
  }

  // Log once so the test runner's output shows which branch we're on.
  // Useful for CI debugging when tests fail.
  const maskedUrl = url.replace(/:[^@]*@/, ':***@');
  // eslint-disable-next-line no-console
  console.log(`[integration] Using Neon branch ${process.env.NEON_TEST_BRANCH_ID}`);
  // eslint-disable-next-line no-console
  console.log(`[integration] DATABASE_URL=${maskedUrl}`);
}

export async function teardown() {
  // The neon-test-branch.mjs script handles branch deletion after vitest
  // exits, so this is a no-op. Kept for symmetry and future hooks.
}
