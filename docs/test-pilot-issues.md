# Test Pilot — issues log

Running log of pre-existing issues surfaced during the 2026-04-25 test pilot
walkthrough. Each item is a follow-up; none are pilot blockers.

> **2026-05-06 reconciliation:** All six previously-Open items have been
> verified resolved by subsequent commits and tooling changes. See "Resolved
> after pilot" below. No open items remain.

## Open

- **Onboarding family-name pre-fill silently commits Clerk surname.**
  `src/app/(public)/onboarding/page.tsx:44-47` initialises the family-name
  input with `${user.lastName} Family`. A user who accepts the pre-fill
  (or doesn't notice it after Clerk's `useUser()` hydrates post-mount)
  ships their surname into `families.familyName`, and the dashboard
  greeting at `src/app/(auth)/dashboard/DashboardClient.tsx:111` strips
  ` Family` and renders e.g. "Douglas". Reproduces consistently for the
  dev Clerk identity (`lastName = "Douglas"`): every new sign-up under
  the same Clerk profile re-derives "Douglas Family" as the default,
  which reads as cross-account persistence even though each family row
  is fresh.

  Linked gaps surfaced by the same survey, fix together:

  - `src/app/api/welcome/complete/route.ts:12` and
    `src/app/api/onboarding/complete/route.ts:13` call
    `getOrCreateFamily(userId)` with no `familyName`; the row is born as
    literal `"My Family"` (`src/lib/auth/helpers.ts:19`) if onboarding
    is ever skipped. Pass `user.lastName` through so the fallback is
    `"<Surname> Family"`.
  - `onboarding/page.tsx:81-85` does not check `res.ok` on the
    `PATCH /api/family` call — a silent failure leaves "My Family" on
    the dashboard. Add error surfacing.
  - `useState(defaultFamilyName)` runs once; if `useUser()` resolves
    after first render, the input visibly jumps from empty to
    "<Surname> Family" mid-flow. Sync via effect when the field is
    still untouched, or drop the auto-fill in favour of the existing
    `placeholder="e.g. Douglas Family"`.

  Survey-only on branch `claude/fix-lastname-persistence-BXFXU`
  (2026-05-06); fix deferred. Verify after fix: Clerk identity with
  `lastName = "Douglas"` → finish onboarding without touching the
  field → dashboard must NOT read "Douglas".

## Resolved after pilot

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
