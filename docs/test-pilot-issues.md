# Test Pilot — issues log

Running log of pre-existing issues surfaced during the 2026-04-25 test pilot
walkthrough. Each item is a follow-up; none are pilot blockers.

## Open

- **`source .env.local` fails on `&` in DATABASE_URL** (zsh parse error
  near `&channel_binding=require`). Workaround: `node --env-file=.env.local
  ...`. Long-term: quote values in `.env.local`, or update
  `npm run test:integration` to use `--env-file` so an operator never has to
  source manually. Files involved: `.env.local`, `package.json` (the
  `test:integration` script).

- **Vitest 4 deprecation: `test.poolOptions` removed**, surfaced at
  integration run time. `vitest.integration.config.ts` needs migration to
  top-level options per https://vitest.dev/guide/migration#pool-rework.
  Non-blocking but will be a hard fail in a future minor. Files involved:
  `vitest.integration.config.ts` (and possibly `vitest.config.ts` — audit
  both).

- **Drizzle migration journal is out of sync with `drizzle/*.sql` on disk.**
  Journal at `drizzle/meta/_journal.json` only has 8 entries (0000–0007).
  Files 0008–0011 plus the duplicates `0003_planner-session-subjects.sql` and
  `0007_heu_work_samples.sql` exist on disk but are NOT in the journal, so
  drizzle-kit ignores them. The dev parent branch `br-still-tooth-a7j94j67`
  has those tables (someone applied them out-of-band), which is why the
  schema-only fork lights up `relation already exists` errors. We worked
  around this by inserting a fake `drizzle.__drizzle_migrations` row on
  every fork (see `scripts/neon-test-branch.mjs`, "Backfilling drizzle
  migration tracking on fork"). Real fix: either regenerate the journal so
  it reflects all on-disk SQL (and renumber the duplicate `0003_`/`0007_`
  pairs), or delete the orphan files and migrate the schema state through a
  proper `drizzle-kit generate` cycle. This is the same migration-numbering
  issue called out as Tier 0 #2 on the 30-step list.

- **drizzle-kit migrate swallows real SQL errors behind its spinner.** The
  pilot lost ~15 minutes because drizzle-kit 0.31.10 prints `[⣟] applying
  migrations...` and then exits non-zero with no detail. We had to write
  `scripts/debug-migrate.mjs` (uses `drizzle-orm/neon-http/migrator`
  directly) to surface the actual `relation "badge_assessment_logs" already
  exists`. Workaround stays in the repo as a diagnostic. If drizzle-kit
  fixes this in a later release, delete the debug script. Setting `CI=true`
  did not disable the spinner.

- **Schema-only Neon forks don't carry data**, including
  `drizzle.__drizzle_migrations`. We discovered this when a one-shot
  parent-branch backfill failed to propagate to forks (see
  `scripts/backfill-parent-migrations.mjs` — kept for documentation, but no
  longer load-bearing). Per-fork backfill in the orchestrator is the
  working fix. Worth capturing in the test runbook so the next person
  doesn't re-discover it.

- **Real integration tests fail with `relation "admin_audit_log" does not
  exist`** because `vitest.integration.setup.ts` truncates 31 tables but
  the dev parent branch only has those that are in the (out-of-sync)
  journal. Tables introduced by orphan SQL files (0008 content_studio_drafts,
  0009 admin_audit_invitations, 0010 logger_depth_coaching, 0011
  family_library_modules, plus the dup `0003_planner-session-subjects` and
  `0007_heu_work_samples`) are missing from the parent. Same root cause as
  the journal-drift item above — fixing that fixes this. Until then, any
  test that exercises a route reading or writing those tables will fail
  on the truncate step. The first real integration test
  (`src/app/api/entries/route.integration.test.ts`) is in place and runs;
  5 tests, all currently red on this issue, not on test logic. Confirmed
  by running `node --env-file=.env.test.local
  scripts/neon-test-branch.mjs -- entries`.

## Resolved this pilot

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
