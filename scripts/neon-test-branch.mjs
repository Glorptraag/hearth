#!/usr/bin/env node
/**
 * Creates an ephemeral Neon test branch, spawns vitest with DATABASE_URL
 * pointing at the branch, and deletes the branch afterward — even if tests
 * fail or the process is killed.
 *
 * Usage:
 *   node scripts/neon-test-branch.mjs [extra vitest args...]
 *
 * Required env vars:
 *   NEON_API_KEY      — API key with branch management permissions
 *   NEON_PROJECT_ID   — project to create branches inside
 *   NEON_PARENT_BRANCH_ID — branch to fork from. This MUST be the
 *     permanently-empty `test-base` branch (no schema, no data), NOT prod
 *     and NOT a dev branch. See "How it works" below.
 *
 * Optional:
 *   NEON_DATABASE_NAME — database name (default: neondb)
 *   NEON_ROLE_NAME     — role to connect as (default: neondb_owner)
 *
 * How it works:
 *   1. POST to Neon API creating an ephemeral branch from the empty
 *      test-base branch (NEON_PARENT_BRANCH_ID)
 *   2. Poll until the endpoint is "active" and get the connection URI
 *   3. Run the full Drizzle migration set against the ephemeral fork
 *   4. Spawn vitest with DATABASE_URL + NEON_TEST_BRANCH_ID in its env
 *   5. When vitest exits, DELETE the branch (always — via finally + signals)
 *
 * Empty-base + migrate-the-fork: the fork starts empty and builds its
 * entire schema from `drizzle/` migrations every run. This decouples CI
 * from production/any durable branch (no human ever hand-migrates to make
 * tests pass) and makes every run a from-scratch migration-correctness
 * check. If migration fails the run aborts before vitest — that is a real
 * correctness signal, not noise.
 */

import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import process from 'node:process';

const API = 'https://console.neon.tech/api/v2';

// ---------------------------------------------------------------------------
// Env + config
// ---------------------------------------------------------------------------
const {
  NEON_API_KEY,
  NEON_PROJECT_ID,
  NEON_PARENT_BRANCH_ID,
  NEON_DATABASE_NAME = 'neondb',
  NEON_ROLE_NAME = 'neondb_owner',
} = process.env;

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    console.error('See scripts/neon-test-branch.mjs header comment for full list.');
    process.exit(2);
  }
}
requireEnv('NEON_API_KEY', NEON_API_KEY);
requireEnv('NEON_PROJECT_ID', NEON_PROJECT_ID);
requireEnv('NEON_PARENT_BRANCH_ID', NEON_PARENT_BRANCH_ID);

// ---------------------------------------------------------------------------
// Neon API helpers
// ---------------------------------------------------------------------------
async function neon(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${NEON_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Neon API ${method} ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function createBranch(suffix) {
  const branchName = `test-${suffix}`;
  console.log(`[neon] Creating branch "${branchName}" from ${NEON_PARENT_BRANCH_ID}...`);

  const result = await neon('POST', `/projects/${NEON_PROJECT_ID}/branches`, {
    branch: {
      name: branchName,
      parent_id: NEON_PARENT_BRANCH_ID,
      // Parent is the empty test-base branch, so there is nothing to copy
      // either way; schema-only keeps creation fast. The fork's schema is
      // built by `drizzle-kit migrate` (see main()), not inherited.
      init_source: 'schema-only',
    },
    endpoints: [
      {
        type: 'read_write',
        // suspend_timeout_seconds intentionally omitted — Neon free tier
        // rejects explicit values (412 "modifying the suspend interval is
        // not permitted"). Default suspend is fine for ephemeral branches;
        // the script deletes the branch in `finally` regardless.
      },
    ],
  });

  return {
    branchId: result.branch.id,
    branchName: result.branch.name,
    // The endpoint host is in the operations response. Fetch it below.
  };
}

async function getBranchConnectionUri(branchId) {
  // The branch just created includes endpoint(s). Fetch them and build
  // a connection URI. For simplicity, we just ask Neon for the full URI
  // via the connection_uri endpoint.
  const uri = await neon(
    'GET',
    `/projects/${NEON_PROJECT_ID}/connection_uri?branch_id=${branchId}` +
      `&database_name=${encodeURIComponent(NEON_DATABASE_NAME)}` +
      `&role_name=${encodeURIComponent(NEON_ROLE_NAME)}`
  );

  return uri.uri; // looks like: postgres://<role>:<pwd>@<endpoint>/<db>?sslmode=require
}

async function waitForBranchReady(branchId, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const data = await neon('GET', `/projects/${NEON_PROJECT_ID}/branches/${branchId}`);
    if (data.branch.current_state === 'ready') return;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Timeout waiting for branch ${branchId} to be ready`);
}

async function deleteBranch(branchId) {
  if (!branchId) return;
  try {
    console.log(`[neon] Deleting branch ${branchId}...`);
    await neon('DELETE', `/projects/${NEON_PROJECT_ID}/branches/${branchId}`);
    console.log(`[neon] Branch ${branchId} deleted.`);
  } catch (err) {
    // Don't fail the whole process if cleanup fails — log and continue so
    // the original test result still reaches the caller.
    console.error(`[neon] Cleanup failed for ${branchId}:`, err.message);
    console.error(`[neon] You may need to delete it manually in the Neon console.`);
  }
}

// ---------------------------------------------------------------------------
// Subprocess helpers
// ---------------------------------------------------------------------------
function runCommand(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      env: { ...process.env, ...env },
      shell: process.platform === 'win32',
    });
    child.on('exit', (code, signal) => {
      if (signal) reject(new Error(`${cmd} killed by ${signal}`));
      else if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
let branchId = null;

async function main() {
  const suffix = `${Date.now()}-${randomBytes(3).toString('hex')}`;

  const { branchId: newId, branchName } = await createBranch(suffix);
  branchId = newId;

  console.log(`[neon] Waiting for branch ${branchName} to be ready...`);
  await waitForBranchReady(branchId);

  console.log(`[neon] Fetching connection URI...`);
  const databaseUrl = await getBranchConnectionUri(branchId);

  // Empty-base: the fork has no schema. Build it from the canonical
  // drizzle/ migration set before any test runs. A migration failure here
  // aborts the run (runCommand rejects → main throws → cleanup deletes the
  // branch + exits non-zero) — a genuine migration-correctness signal.
  console.log(`[neon] Applying drizzle migrations to the ephemeral fork...\n`);
  await runCommand('npx', ['drizzle-kit', 'migrate'], { DATABASE_URL: databaseUrl });

  // Hand off to vitest. Extra args after this script's argv[2] are passed
  // through — e.g. `npm run test:integration -- entries` to filter by name.
  console.log(`\n[neon] Starting vitest against test branch...\n`);
  const extraArgs = process.argv.slice(2);
  await runCommand(
    'npx',
    ['vitest', 'run', '--config', 'vitest.integration.config.ts', ...extraArgs],
    {
      DATABASE_URL: databaseUrl,
      NEON_TEST_BRANCH_ID: branchId,
      NEON_TEST_BRANCH_NAME: branchName,
    }
  );
}

// ---------------------------------------------------------------------------
// Always clean up, even on signal / unhandled rejection.
// ---------------------------------------------------------------------------
async function cleanup(exitCode) {
  await deleteBranch(branchId);
  process.exit(exitCode);
}

process.on('SIGINT', () => cleanup(130));
process.on('SIGTERM', () => cleanup(143));
process.on('uncaughtException', (err) => {
  console.error('[neon] Uncaught exception:', err);
  cleanup(1);
});
process.on('unhandledRejection', (err) => {
  console.error('[neon] Unhandled rejection:', err);
  cleanup(1);
});

try {
  await main();
  await cleanup(0);
} catch (err) {
  console.error(`[neon] Test run failed: ${err.message}`);
  await cleanup(1);
}
