# Test Infrastructure Pilot Runbook

First-time walkthrough for the four-layer testing platform landed in this repo. Follow this start-to-finish in order. Each step has an expected outcome and a troubleshooting note for what to do when reality differs.

**Assumption:** you are sitting in front of the machine, running commands yourself, and watching output. This is not an automation script — it's a checklist for a supervised first run.

**Goal by the end:** you've got `npm test` producing a green unit signal, and you've run one real integration test against an ephemeral Neon branch end-to-end, with automatic cleanup.

---

## What's in place

The installation has already been done. The files you care about:

| Path | Purpose |
|------|---------|
| `vitest.config.ts` | Unit test config (jsdom, all mocks in `vitest.setup.ts`) |
| `vitest.setup.ts` | Clerk v7 async mocks + Anthropic/Sanity/Blob/next mocks |
| `vitest.integration.config.ts` | Integration test config (node, real Neon DB) |
| `vitest.integration.setup.ts` | Mocks for everything except the DB, plus truncate between tests |
| `vitest.integration.globalSetup.ts` | Safety checks for `DATABASE_URL` before tests run |
| `scripts/neon-test-branch.mjs` | Orchestrator: create branch → migrate → vitest → delete |
| `src/test/clerk-helpers.ts` | Per-test Clerk identity overrides (`asUser`, `asSignedOut`, …) |
| `src/test/factories.ts` | Pure object factories for unit tests |
| `src/test/db-factories.ts` | DB-aware factories that insert real rows |
| `src/test/example.integration.test.ts` | Reference template — `describe.skip`, delete when writing real tests |
| `.github/workflows/test.yml` | CI: lint / typecheck / unit / integration jobs |

The `test:integration` path in CI is gated on Neon variables existing — until you set them, the job skips cleanly rather than failing red.

---

## Step 0 — Before you start

Confirm you have:

- [ ] Node **22** on your machine. `node --version` should print `v22.x`. Lower versions may work but CI pins 22; matching avoids "works on my laptop" surprises.
- [ ] Your Neon project URL and a Neon API key with branch permissions. Get these from the Neon console (Settings → API keys). You can do the rest of the setup without these, but you'll need them for step 4.
- [ ] A dev Neon branch (not `main`) with recent migrations applied. The test runner forks from this branch schema-only. If the parent hasn't been migrated, the fork has nothing to copy from.
- [ ] A clean working tree (or you know what's modified). `git status` first. If anything in the testing infra files looks unexpected, check the plan file at `~/.claude/plans/users-claw-downloads-files-package-scri-sparkling-dream.md` for the intended shape.

---

## Step 1 — Install dependencies

```bash
npm install
```

**Expected:** finishes in under 2 minutes on a warm cache. `@vitest/coverage-v8` is the new dep that wasn't previously present.

**If it hangs for more than 5 minutes:** Ctrl-C and try `npm install --no-audit --no-fund --prefer-offline`. If it still hangs, the culprit is usually `sharp` rebuilding from source or a stalled registry request. Run `npm install --verbose` to see where it's stuck.

**Verify:**

```bash
ls node_modules/@vitest/coverage-v8 && echo "ok"
```

Should print `ok`. If not, re-run install targeting just that package: `npm install @vitest/coverage-v8`.

---

## Step 2 — Typecheck

```bash
npx tsc --noEmit
```

**Expected:** either completely clean, or errors that existed before this session in files unrelated to `vitest.*.ts`, `src/test/**`, or `scripts/neon-test-branch.mjs`.

**Sanity-check the new files typecheck cleanly:**

```bash
npx tsc --noEmit 2>&1 | grep -E "vitest\.|src/test/|scripts/neon" || echo "new files clean"
```

Should print `new files clean`. If it prints errors, the most likely cause is factory type drift — compare the field name the compiler complains about with the matching table in `src/lib/db/schema.ts` and update `src/test/factories.ts`.

---

## Step 3 — Unit test smoke run

```bash
npm test
```

**Expected:**

- Vitest boots under `jsdom` environment.
- The existing seven unit tests run (ai-pipeline, completeness, keyword-matcher, two nudge-provider files, pedagogy adapter, rate-limit).
- All pass. Exit code 0.

This is the moment the Clerk v7 async-auth blocker dies. If you previously couldn't run `npm test` because the Clerk boundary exploded on import, you should see a green test summary instead.

**If one of the seven pre-existing tests now fails:** that's expected to be rare but possible. Read the failure carefully:

- **`ReferenceError: document is not defined`** → a test was relying on the old `environment: 'node'`. Either fix the test to not touch `document`, or add `// @vitest-environment node` at the top of that file.
- **`TypeError: Cannot read properties of undefined (reading 'userId')`** → a test is importing a server module that calls `auth()` and not awaiting it. The mock resolves a promise; the test code needs `await`.
- **Anything involving `@clerk/nextjs`** → the mock is in `vitest.setup.ts`. Check that the failing test imports `auth` / `currentUser` from `@clerk/nextjs/server`, not from the root package.

---

## Step 4 — Set up Neon test branch env

Create `.env.test.local` at repo root (git-ignored):

```bash
cat > .env.test.local <<'EOF'
NEON_API_KEY=your_api_key_here
NEON_PROJECT_ID=your_project_id_here
NEON_PARENT_BRANCH_ID=br_your_dev_branch_id_here
EOF
```

Replace the three values with what you pulled from the Neon console. **Double-check `NEON_PARENT_BRANCH_ID` is a dev branch, not `main`** — the integration test setup truncates every user-data table between tests. If you point at production, you wipe real data.

The globalSetup file has a safety check that refuses to run if `DATABASE_URL` looks like production, but treat that as a second line of defence, not your first.

**Verify the file:**

```bash
test -f .env.test.local && grep -c "^NEON_" .env.test.local
```

Should print `3`.

**Verify the script parses (doesn't execute it — just syntax-checks):**

```bash
node --check scripts/neon-test-branch.mjs && echo "ok"
```

Should print `ok`.

---

## Step 5 — First integration run

This creates a real Neon branch, runs migrations, runs one skipped test, then deletes the branch. Even though the example test is `describe.skip`, the branch lifecycle still happens — which is what you want to validate.

```bash
set -a
source .env.test.local
set +a
npm run test:integration
```

**What to watch for, in order:**

1. `[neon] Creating branch "test-<timestamp>-<hex>" from br_<your parent>...` — the POST to Neon API.
2. `[neon] Waiting for branch test-... to be ready...` — usually 3-10 seconds. Cold starts can take up to a minute.
3. `[neon] Fetching connection URI...`
4. `[neon] Running drizzle-kit migrations against branch...` — should apply all ten migrations from the `drizzle/` directory. This doubles as your migration smoke test.
5. `[neon] Starting vitest against test branch...`
6. `[integration] Using Neon branch br_<id>` and `[integration] DATABASE_URL=postgres://<role>:***@<host>/<db>?...` — the globalSetup check running.
7. Vitest output showing `0 passed | 3 skipped` (the example file has three skipped tests).
8. `[neon] Deleting branch br_<id>...` followed by `[neon] Branch br_<id> deleted.`

Exit code 0. Elapsed time: 30-90 seconds, mostly waiting on Neon.

**Go check the Neon console.** The branch you just saw created should be gone. If it's still there, the cleanup path didn't run — see troubleshooting below.

---

## Step 6 — Write your first real integration test

Once step 5 is clean, delete or empty out `src/test/example.integration.test.ts` (it's a skipped template, not load-bearing).

The recommended first real test is `src/app/api/entries/route.integration.test.ts`. It exercises the most valuable integration path:

- Auth (via mocked Clerk) → DB (real) → response.
- Family isolation — assertions that one family's `auth()` context cannot fetch another family's entries. This is the class of bug unit tests cannot reliably catch.

Skeleton:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { asUser } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { learningEntries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
// import the route handler under test
// import { POST } from '@/app/api/entries/route';

describe('POST /api/entries — real DB', () => {
  beforeEach(async () => {
    // truncateAll runs in vitest.integration.setup's beforeEach already;
    // no need to repeat here unless you want a narrower reset.
  });

  it('writes an entry scoped to the caller\'s family', async () => {
    const { userId, familyId } = asUser({});
    const family = await createFamily(db, { id: familyId, clerkUserId: userId });
    const learner = await createLearner(db, { familyId: family.id });

    // const req = new Request('http://localhost/api/entries', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ title: 'Magnetic circuit', learnerIds: [learner.id] }),
    // });
    // const res = await POST(req);
    // expect(res.status).toBe(201);

    const rows = await db
      .select()
      .from(learningEntries)
      .where(eq(learningEntries.familyId, family.id));
    expect(rows).toHaveLength(1); // change once POST is uncommented above
  });
});
```

Run it the same way:

```bash
npm run test:integration
```

You'll see the full branch lifecycle again. If you want to filter by test name:

```bash
npm run test:integration -- entries
```

The extra args get passed through to vitest.

---

## Troubleshooting

### "Missing required env var: NEON_API_KEY"

You forgot to source the env file. Run `set -a; source .env.test.local; set +a` again in the same shell.

### "Integration tests refuse to run against production"

The safety check in `vitest.integration.globalSetup.ts` caught something. Check your `NEON_PARENT_BRANCH_ID` — it should point at a dev branch, not main. Also check that `DATABASE_URL` (if you manually set it) doesn't contain `ep-prod`.

### "Timeout waiting for branch … to be ready"

Neon cold start took longer than 60s. Run again — it usually works on the second try. If it's consistently slow, raise the timeout in `scripts/neon-test-branch.mjs` (the `waitForBranchReady` call).

### Branch created but not deleted after run

Something killed the Node process hard (OOM, SIGKILL). The cleanup path runs on SIGINT/SIGTERM/uncaughtException/unhandledRejection but not on SIGKILL. Go to the Neon console and delete the orphan manually — they're named `test-<timestamp>-<hex>`.

### "drizzle-kit migrate" fails

Your migrations don't apply cleanly to a schema-only fork of `NEON_PARENT_BRANCH_ID`. Most common cause: your dev parent branch has schema state newer than what's in `drizzle/` (someone ran `drizzle-kit push` against it without committing the SQL). Fix: regenerate the migration with `npm run db:generate` (or whatever your drizzle-kit invocation is), commit it, re-run.

### Integration test leaves data behind the next test sees

Check `TABLES_TO_TRUNCATE` in `vitest.integration.setup.ts`. If you added a new table in the schema, add it to this list. The list has 31 entries as of install; it must stay in sync with `src/lib/db/schema.ts`.

### Clerk mock "X is not a function" on a named import

The setup mocks the specific Clerk helpers that this app imports today: `auth`, `currentUser`, `clerkClient`, `getAuth`, `clerkMiddleware`, `createRouteMatcher`. If you add code that imports something new from `@clerk/nextjs/server`, add it to the mock in `vitest.setup.ts`.

### `npm test` hangs on the first run after switch to jsdom

Usually a stuck worker. Kill the process and re-run. If it happens every time, set `pool: 'forks'` in `vitest.config.ts` as a temporary workaround — `threads` is faster but rarer to hit on a jsdom codebase.

---

## What "pilot successful" looks like

A clean pilot leaves you with:

- [ ] `npm test` green, all pre-existing unit tests passing under jsdom.
- [ ] `npx tsc --noEmit` clean in new files.
- [ ] One manual `npm run test:integration` run end-to-end, with branch created + migrated + vitest run + branch deleted. Neon console confirms no orphans.
- [ ] One real integration test file written (`src/app/api/entries/route.integration.test.ts` recommended), asserting something meaningful about family isolation.
- [ ] CI on a push or PR showing four jobs (lint, typecheck, unit, integration). Integration should skip cleanly if Neon vars aren't set in GitHub yet.

Once those five check, the platform is alive. Subsequent tests are purely authoring work — no more setup needed.

---

## When things don't match this runbook

If reality diverges from the expected behavior at any step, stop and diagnose before moving to the next step. Don't paper over a weird step-3 failure with a retry; it'll bite worse in step 5. The cost of a careful pilot is an hour. The cost of a half-working test platform is every test case you write on top of it.

Escalate to a Claude session with the exact error message and what step you were on. Don't try to fix mock files from guesses — they're narrow enough that the right fix is usually one line, but the wrong fix can snowball into a day of chasing symptoms.
