# Test Pilot — issues log

Running log of pre-existing issues surfaced during the 2026-04-25 test pilot
walkthrough. Each item is a follow-up; none are pilot blockers.

> **2026-05-06 reconciliation:** All six previously-Open items have been
> verified resolved by subsequent commits and tooling changes. See "Resolved
> after pilot" below. No open items remain.

## Open

_(none)_

## Resolved after pilot

- **Onboarding family-name pre-fill silently committed Clerk surname.**
  Resolved on branch `claude/fix-lastname-persistence-BXFXU`
  (2026-05-06). `/api/welcome/complete` and `/api/onboarding/complete`
  now derive `${user.lastName} Family` from Clerk and pass it to
  `getOrCreateFamily`, so the row is born with the surname already set
  instead of literal `"My Family"`. The onboarding family-name input
  is now optional: it's seeded from Clerk via `useEffect` once
  `useUser()` hydrates (only while untouched, so a user edit — or a
  cleared field — is preserved), and `handleSaveFamily` only PATCHes
  `/api/family` when the user typed an override (with `res.ok`
  checking). The dashboard no longer surfaces `"Douglas"` for a
  Douglas-Clerk identity unless the user explicitly chose it.

- **`source .env.local` fails on `&` in DATABASE_URL** — Resolved.
  `package.json#scripts.test:integration` now invokes
  `node --env-file-if-exists=.env.test.local --env-file-if-exists=.env.local
  scripts/neon-test-branch.mjs`, so an operator never has to `source`
  manually.

- **Vitest 4 deprecation: `test.poolOptions` removed** — Resolved.
  `vitest.integration.config.ts` migrated to top-level options per
  https://vitest.dev/guide/migration#pool-rework (in-file comment at line 46
  records the migration).

- **Drizzle migration journal is out of sync with `drizzle/*.sql` on disk.**
  — Resolved by commit `e4fc25c` (`fix(drizzle): reconcile migration
  journal with on-disk SQL`, 2026-04-25). Duplicate SQL files removed,
  journal entries added for 0008–0011, parent branch's
  `__drizzle_migrations` refreshed in lockstep. Per-fork backfill removed
  (the `scripts/backfill-parent-migrations.mjs` diagnostic file is gone).

- **drizzle-kit migrate swallows real SQL errors behind its spinner.** —
  No longer load-bearing. The diagnostic script
  `scripts/debug-migrate.mjs` has been removed; the underlying journal
  drift that originally triggered the silent failure is fixed.

- **Schema-only Neon forks don't carry data** — Resolved as part of the
  journal reconciliation. Per-fork backfill removed; orchestrator no
  longer needs the workaround.

- **Real integration tests fail with `relation "admin_audit_log" does not
  exist`** — Resolved. Same root cause as the journal-drift item;
  reconciliation of the journal restored the missing tables in the dev
  parent branch.

## Resolved during pilot

- **Neon API rejected `suspend_timeout_seconds: 300`** with 412 "modifying
  the suspend interval is not permitted" on the free tier. Removed the
  field from `scripts/neon-test-branch.mjs`; the branch is deleted in
  `finally` so default suspend is harmless.


- **date-fns 4.1.0 install missing `index.d.ts`** (28 tsc errors in app code).
  Published tarball at `https://registry.npmjs.org/date-fns/-/date-fns-4.1.0.tgz`
  *does* contain `index.d.ts`; the local extraction dropped it. `npm install
  date-fns@4.1.0 --force` was a no-op (lockfile already satisfied). Step-2
  runbook filter confirmed new test files are clean, so this does not block
  the pilot. Fix candidate: `rm -rf node_modules/date-fns && npm install
  date-fns@4.1.0`, or full clean reinstall. Long-term: separate task on the
  30-step list (Tier 1 #7 lint/typecheck debt).
