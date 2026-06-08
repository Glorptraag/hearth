#!/usr/bin/env node
/**
 * Deploy-time migration runner — wired into the Vercel build via the
 * `db:migrate:deploy` npm script (see vercel.json `buildCommand`).
 *
 * Why this exists: the deploy pipeline used to run `next build` only, and
 * migrations were applied by hand from a laptop (deployment-runbook §1.4). On
 * 2026-06-06 that gap let prod drift one migration behind the Drizzle schema —
 * `0023_evidence_sort_order` was never applied, so `GET /api/entries`
 * (`ORDER BY learning_entry_evidence.sort_order`) threw, the route 500'd, and
 * the portfolio silently degraded to "Your story starts here". This script
 * closes the gap: every production deploy applies pending migrations BEFORE the
 * build, and a failed migration aborts the build so the broken schema never
 * goes live.
 *
 * Ordering matters: buildCommand is `npm run db:migrate:deploy && next build`.
 * Migrate runs first; if it fails we exit non-zero, `&&` short-circuits, the
 * build is skipped, and the previous (working) deployment stays promoted.
 *
 * Idempotent: drizzle-kit tracks applied migrations in
 * `drizzle.__drizzle_migrations`, so an up-to-date deploy is a near-no-op.
 *
 * Production-guarded: only runs against the DB when VERCEL_ENV === 'production'.
 * Only `main` auto-deploys (vercel.json), so production is the only environment
 * that auto-migrates here. A preview Neon branch DB exists (built for the
 * constellations rebuild) but is migrated by hand — the guard guarantees this
 * step only ever touches prod, so a stray `vercel` CLI preview build can't
 * migrate a DB out from under that workflow. Intentional migrations (prod or the
 * preview branch) still go through `npm run db:migrate` with the matching URL.
 *
 * Exit codes:
 *   0  migrations applied (or skipped: non-prod) and journal verified
 *   1  not safe to build — migrate failed, or drift remains after migrate
 */
import { execSync, spawnSync } from 'node:child_process';

const env = process.env.VERCEL_ENV;

if (env !== 'production') {
  console.log(
    `[deploy-migrate] VERCEL_ENV=${env ?? '(unset)'} — not a production build, skipping migrations.`,
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error(
    '[deploy-migrate] production build but DATABASE_URL is unset — refusing to build without a migration target.',
  );
  process.exit(1);
}

console.log('[deploy-migrate] production build — applying pending Drizzle migrations…');
try {
  // Reuse the canonical script so the migrate command stays single-sourced.
  execSync('npm run db:migrate', { stdio: 'inherit' });
} catch {
  console.error(
    '[deploy-migrate] drizzle-kit migrate failed — aborting the build so a schema-behind deployment is not promoted.',
  );
  process.exit(1);
}

// Post-migrate verification: assert the live DB now matches the journal AND
// every schema.ts table physically exists. Catches the "journaled as applied
// but the DDL silently no-op'd" class (see scripts/check-migration-drift.mjs).
// A genuine drift (exit 1) aborts the build; a verifier connectivity error
// (exit 2) is logged but non-fatal — migrate already succeeded, and we don't
// want a transport hiccup on a read-only check to block an otherwise-good deploy.
const verify = spawnSync('node', ['scripts/check-migration-drift.mjs'], { stdio: 'inherit' });
if (verify.status === 0) {
  console.log('[deploy-migrate] drift check passed — db matches the migration journal.');
} else if (verify.status === 1) {
  console.error(
    '[deploy-migrate] drift detected AFTER migrate — aborting build; investigate before promoting.',
  );
  process.exit(1);
} else {
  console.warn(
    `[deploy-migrate] drift check could not complete (exit ${verify.status ?? 'signal'}); ` +
      'migrate already succeeded, continuing the build.',
  );
}

process.exit(0);
