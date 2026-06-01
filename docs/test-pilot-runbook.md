# Test Infrastructure Pilot Runbook

First-time walkthrough for the testing platform in this repo. Follow it start-to-finish in order. Each step has an expected outcome and a troubleshooting note for when reality differs.

**Assumption:** you are sitting in front of the machine, running commands yourself, and watching output. This is not an automation script — it's a checklist for a supervised first run.

**Goal by the end:** `npm test` produces a green unit signal, and you've run the integration suite end-to-end against a local throwaway Postgres, with the database created, migrated, exercised, and torn down automatically.

> **The big picture.** Integration tests run against a **real Postgres in a local Docker container** — not Neon. Isolation between tests is **transaction rollback**: each test runs inside `BEGIN … ROLLBACK`, so nothing it writes survives, with zero per-test cleanup round-trips. CI does the same thing with a `pgvector/pgvector:pg16` service container. You do **not** need Neon, an API key, or any cloud credentials to run or write tests.

---

## What's in place

| Path | Purpose |
|------|---------|
| `vitest.config.ts` | Unit test config (jsdom, all mocks in `vitest.setup.ts`) |
| `vitest.setup.ts` | Clerk v7 async mocks + Anthropic/Sanity/Blob/next mocks |
| `vitest.integration.config.ts` | Integration config (node env; aliases `@/lib/db` → the rollback test client) |
| `vitest.integration.setup.ts` | Mocks for everything except the DB; opens a transaction before each test and rolls it back after |
| `vitest.integration.globalSetup.ts` | Safety checks for `DATABASE_URL` before tests run (hard-stops on the prod endpoint) |
| `src/test/integration-db.ts` | The pinned `node-postgres` client: `connect / begin / rollback / end` |
| `src/test/db-test-shim.ts` | What `@/lib/db` resolves to in integration tests — `db` / `getDb` / `ConfigError` backed by the test client |
| `docker-compose.test.yml` | Local `pgvector/pgvector:pg16` Postgres (tmpfs, throwaway) for `test:integration:local` |
| `scripts/neon-test-branch.mjs` | **Optional/advanced** orchestrator: fork a Neon branch → migrate → vitest → delete. Not needed for normal work. |
| `src/test/clerk-helpers.ts` | Per-test Clerk identity overrides (`asUser`, `asSignedOut`, …) |
| `src/test/factories.ts` | Pure object factories for unit tests |
| `src/test/db-factories.ts` | DB-aware factories that insert real rows (batched inserts) |
| `.github/workflows/test.yml` | CI: lint / typecheck / unit / integration jobs |

CI's integration job always runs on every PR and push (no Neon gating) — it stands up the Postgres service container itself.

---

## Step 0 — Before you start

Confirm you have:

- [ ] Node **22**. `node --version` should print `v22.x`. CI pins 22; matching avoids "works on my laptop" surprises.
- [ ] **Docker** running. `docker info` should succeed without error. This is the only external dependency for integration tests — no cloud accounts.
- [ ] A clean working tree (or you know what's modified). `git status` first.

You do **not** need a Neon API key, project id, or `.env.test.local` for the normal path. (Those only matter for the optional Neon orchestrator in the appendix.)

---

## Step 1 — Install dependencies

```bash
npm install
```

**Expected:** finishes in under 2 minutes on a warm cache. `pg` + `@types/pg` (the integration DB driver) and `@vitest/coverage-v8` are present.

**If it hangs for more than 5 minutes:** Ctrl-C and try `npm install --no-audit --no-fund --prefer-offline`. If it still hangs, the culprit is usually `sharp` rebuilding from source or a stalled registry request. Run `npm install --verbose` to see where it's stuck.

**Verify:**

```bash
ls node_modules/pg node_modules/@vitest/coverage-v8 && echo "ok"
```

Should print `ok`.

---

## Step 2 — Typecheck

```bash
npx tsc --noEmit
```

**Expected:** either completely clean, or errors that existed before this session in files unrelated to `vitest.*.ts`, `src/test/**`.

**Sanity-check the test infra typechecks cleanly:**

```bash
npx tsc --noEmit 2>&1 | grep -E "vitest\.|src/test/" || echo "test infra clean"
```

Should print `test infra clean`. If it prints errors, the most likely cause is factory type drift — compare the field name the compiler complains about with the matching table in `src/lib/db/schema.ts` and update `src/test/factories.ts`.

---

## Step 3 — Unit test smoke run

```bash
npm test
```

**Expected:**

- Vitest boots under `jsdom`.
- The unit suite runs and all tests pass. Exit code 0.

This is the moment the Clerk v7 async-auth boundary is confirmed working. If you previously couldn't run `npm test` because the Clerk boundary exploded on import, you should see a green summary instead.

**If a pre-existing test fails:** read the failure carefully:

- **`ReferenceError: document is not defined`** → a test relied on the old `environment: 'node'`. Either fix it to not touch `document`, or add `// @vitest-environment node` at the top of that file.
- **`TypeError: Cannot read properties of undefined (reading 'userId')`** → a test imports a server module that calls `auth()` without awaiting. Clerk v7 mocks resolve a promise; the code needs `await`.
- **Anything involving `@clerk/nextjs`** → the mock is in `vitest.setup.ts`. Confirm the failing test imports `auth` / `currentUser` from `@clerk/nextjs/server`, not the root package.

---

## Step 4 — Run the integration suite (local Postgres)

One command does everything: starts the container, applies the schema, runs the suite, tears the container down.

```bash
npm run test:integration:local
```

Under the hood this is: `docker compose -f docker-compose.test.yml up -d --wait` → `drizzle-kit migrate` against the container → `vitest run --config vitest.integration.config.ts` → `docker compose … down`. The script preserves vitest's exit code, so a test failure still surfaces as a non-zero exit even though teardown runs.

**What to watch for, in order:**

1. Docker pulls/starts `pgvector/pgvector:pg16` and waits for the healthcheck (`pg_isready`). First run pulls the image (~tens of seconds); later runs are instant.
2. `drizzle-kit migrate` applies all migrations to the empty DB. Migration `0014` runs `CREATE EXTENSION IF NOT EXISTS vector` — this is why the image is **pgvector**, not stock `postgres:16`.
3. `[integration] Using local/CI Postgres` and `[integration] DATABASE_URL=postgresql://postgres:***@localhost:5432/hearth_test` — the globalSetup check running.
4. Vitest output. The `integration-isolation` guard test proves rollback works (insert in one test, table empty in the next).
5. `docker compose … down` removes the container. Because data lives in tmpfs, nothing persists.

Exit code 0. Elapsed time after the first image pull: a few seconds — no branch provisioning, no network latency.

**Tip — keep the DB up while iterating.** If you're writing tests and want to avoid the up/down each run, start the container once and point the vitest-only script at it:

```bash
docker compose -f docker-compose.test.yml up -d --wait
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hearth_test
npm run db:migrate                 # once, after the container is fresh
npm run test:integration:only      # re-run as many times as you like
npm run test:integration:only -- entries   # filter by test name
# when done:
docker compose -f docker-compose.test.yml down
```

`test:integration:only` is just vitest — it assumes `DATABASE_URL` already points at a migrated Postgres and does no container or schema management.

---

## Step 5 — Write your first real integration test

The recommended first real test is `src/app/api/entries/route.integration.test.ts`. It exercises the most valuable path:

- Auth (via mocked Clerk) → DB (real) → response.
- Family isolation — assertions that one family's `auth()` context cannot fetch another family's entries. This is the class of bug unit tests cannot reliably catch.

Skeleton:

```ts
import { describe, it, expect } from 'vitest';
import { asUser } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner } from '@/test/db-factories';
import { learningEntries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
// import the route handler under test
// import { POST } from '@/app/api/entries/route';

describe('POST /api/entries — real DB', () => {
  // No per-test cleanup needed: vitest.integration.setup wraps every test
  // in BEGIN…ROLLBACK, so each test starts from an empty database.

  it("writes an entry scoped to the caller's family", async () => {
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
    expect(rows).toHaveLength(0); // change to 1 once POST is uncommented above
  });
});
```

Run it via either path in Step 4. The file must end in `.integration.test.ts` so the integration config picks it up (the unit config ignores it).

---

## Troubleshooting

### `docker: command not found` / `Cannot connect to the Docker daemon`

Docker isn't installed or isn't running. Start Docker Desktop (or your daemon) and confirm `docker info` succeeds before re-running.

### `drizzle-kit migrate` fails with `type "vector" does not exist` or `extension "vector" is not available`

You're on a stock `postgres` image instead of pgvector. The compose file and CI both pin `pgvector/pgvector:pg16`; if you hand-rolled a container, use that image. Migration `0014` needs the extension.

### Port 5432 already in use

Another Postgres (a local install, or a leftover container) holds the port. Stop it, or change the host port mapping in `docker-compose.test.yml` (and the `DATABASE_URL` port to match).

### "Integration tests require DATABASE_URL"

You ran `npm run test:integration:only` (or vitest directly) without a `DATABASE_URL`. Either use `npm run test:integration:local` (which sets it), or export it yourself pointing at a running, migrated Postgres — see the iterate tip in Step 4.

### "Integration tests refuse to run against production"

The guard in `vitest.integration.globalSetup.ts` matched the production Neon endpoint (`ep-red-hat-a76y1fdq`), or `NEON_BRANCH_NAME=main`, or `NODE_ENV=production`. Your `DATABASE_URL` is pointed at prod — fix it. For local work it should be the container URL (`…@localhost:5432/hearth_test`). This is intentional and load-bearing; don't weaken it.

### A test sees data from a previous test

Rollback isolation should make this impossible. If it happens, something committed the outer transaction — almost always app code calling a Postgres `db.transaction()` that escapes the test wrapper, or a test opening its own connection instead of using the shared `db` from `@/lib/db`. The `integration-isolation.integration.test.ts` guard exists to catch exactly this regression; if it's red, start there.

### Clerk mock "X is not a function" on a named import

`vitest.setup.ts` mocks the Clerk helpers this app imports today: `auth`, `currentUser`, `clerkClient`, `getAuth`, `clerkMiddleware`, `createRouteMatcher`. If you add code importing something new from `@clerk/nextjs/server`, add it to that mock.

### `npm test` hangs on the first jsdom run

Usually a stuck worker. Kill and re-run. If it recurs every time, set `pool: 'forks'` in `vitest.config.ts` as a temporary workaround.

---

## What "pilot successful" looks like

- [ ] `npm test` green — unit suite passing under jsdom.
- [ ] `npx tsc --noEmit` clean in test infra files.
- [ ] One `npm run test:integration:local` run end-to-end: container up → migrated → vitest green (including the rollback isolation guard) → container down.
- [ ] One real integration test file written (`src/app/api/entries/route.integration.test.ts` recommended), asserting something meaningful about family isolation.
- [ ] CI on a push or PR showing four green jobs: lint, typecheck, unit, integration.

Once those check, the platform is alive. Subsequent tests are purely authoring work — no more setup needed.

---

## Appendix — the optional Neon orchestrator

`npm run test:integration` (no `:local` / `:only`) runs the suite against an **ephemeral Neon branch** instead of a local container, via `scripts/neon-test-branch.mjs`: create branch → `drizzle-kit migrate` the fork → vitest → delete the branch. The same rollback isolation applies on top.

You almost never need this — local Postgres is faster and free. It exists only if you want to validate against Neon's actual managed Postgres on demand. It requires a `.env.test.local` at repo root (git-ignored) with:

```bash
NEON_API_KEY=your_api_key_here
NEON_PROJECT_ID=your_project_id_here
NEON_PARENT_BRANCH_ID=br_your_empty_test_base_branch_id_here
```

`NEON_PARENT_BRANCH_ID` must point at an **empty `test-base` branch**, never prod — the orchestrator forks it and migrates from scratch. Schema-only forks copy DDL but not row data, so tests seed everything via `src/test/db-factories.ts`. If the run is killed with SIGKILL (OOM), the cleanup path won't run and you'll have an orphan branch named `test-<timestamp>-<hex>` to delete in the Neon console.

CI does **not** use this path; it uses the Postgres service container described above.

---

## When things don't match this runbook

If reality diverges at any step, stop and diagnose before moving on. Don't paper over a weird step-3 failure with a retry; it'll bite worse later. The cost of a careful pilot is an hour. The cost of a half-working test platform is every test case you write on top of it.

Escalate to a Claude session with the exact error message and the step you were on. Don't fix mock files from guesses — they're narrow enough that the right fix is usually one line, but a wrong fix can snowball.
