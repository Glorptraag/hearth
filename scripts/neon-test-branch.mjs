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
 *   0. Sweep `test-*` branches older than 10 minutes (reap leaks from
 *      previous runs whose cleanup didn't fire). See sweepStaleTestBranches.
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

/**
 * Reap leaked `test-*` branches from previous runs before creating a new one.
 *
 * Why this exists:
 *   This script deletes its own branch in `finally` + signal handlers, but
 *   that only fires if Node gets to run the cleanup. The orchestrator can
 *   leak a branch if (a) the GitHub Actions runner is killed mid-step,
 *   (b) the node process is SIGKILL'd (no handler runs), or (c) the network
 *   drops between createBranch and the cleanup path. Each leak is invisible
 *   until enough accumulate to trip Neon's `ROOT_BRANCHES_LIMIT_EXCEEDED`
 *   — at which point every subsequent CI run fails on branch creation, not
 *   on anything the PR actually changed. The 2026-05-25 CI freeze was
 *   exactly this.
 *
 *   `init_source: 'schema-only'` on createBranch creates a NEW root branch
 *   (Neon decouples it from the parent's data), so every test branch counts
 *   against the project's root-branch ceiling — leaks add up forever.
 *
 * Why the 10-min cutoff:
 *   Integration runs typically finish in 3-5 minutes. A 10-minute floor is
 *   comfortably past any healthy in-flight run, so we never reap a branch
 *   that another CI job is actively using. Branches younger than 10 min are
 *   left alone even if we suspect they might be orphans — false positives
 *   here would break concurrent PRs' tests.
 *
 * Failure mode:
 *   Best-effort. If listing or deleting fails, we log and proceed to the
 *   normal createBranch call. The sweep is a defense in depth, not a gate.
 */
async function sweepStaleTestBranches() {
  const STALE_MS = 10 * 60 * 1000; // 10 minutes
  let data;
  try {
    data = await neon('GET', `/projects/${NEON_PROJECT_ID}/branches`);
  } catch (err) {
    console.error(`[neon] sweep: could not list branches: ${err.message}`);
    return;
  }
  const cutoff = Date.now() - STALE_MS;
  const stale = (data.branches || []).filter(
    (b) =>
      typeof b.name === 'string' &&
      b.name.startsWith('test-') &&
      b.id !== NEON_PARENT_BRANCH_ID &&
      b.created_at &&
      new Date(b.created_at).getTime() < cutoff
  );
  if (stale.length === 0) {
    console.log('[neon] sweep: no stale test branches found.');
    return;
  }
  console.log(`[neon] sweep: deleting ${stale.length} stale test branch(es) older than 10min:`);
  for (const b of stale) {
    try {
      await neon('DELETE', `/projects/${NEON_PROJECT_ID}/branches/${b.id}`);
      console.log(`[neon]   deleted ${b.name} (${b.id}, created ${b.created_at})`);
    } catch (err) {
      console.error(`[neon]   delete failed for ${b.name} (${b.id}): ${err.message}`);
    }
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
  // Defense in depth: reap any leaked `test-*` branches from previous runs
  // before we try to create a new one. See sweepStaleTestBranches() header
  // for the failure modes this protects against (CI runner killed mid-run,
  // SIGKILL, network drops). Without this, leaked branches accumulate until
  // the project hits ROOT_BRANCHES_LIMIT_EXCEEDED and every CI run fails.
  await sweepStaleTestBranches();

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
