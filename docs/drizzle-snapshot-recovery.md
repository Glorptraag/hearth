# Drizzle snapshot recovery — one-time backfill

> **When to do this:** Once, before the next `drizzle-kit generate`. After that,
> snapshots regenerate automatically on every `generate` call and this whole
> problem disappears.
>
> **Why it exists:** Migrations 0008–0015 were authored as raw SQL without the
> matching `drizzle/meta/<idx>_snapshot.json` artefacts. Drizzle-kit needs the
> *latest* snapshot to be accurate to diff against `schema.ts`. The next
> `drizzle-kit generate` will prompt you to resolve every table/column that has
> appeared since snapshot 0007.
>
> **You don't need to read or understand the prompts.** Use this answer key.

## Pre-flight

```bash
cd <repo-root>
git status                 # must be clean
git checkout -b chore/drizzle-snapshot-resync
```

Confirm the current schema and migrations match what the runbook expects:

```bash
npm run db:check-schema    # must pass
npm run db:check-drift     # must pass (skips gracefully if no DATABASE_URL)
```

## Running the generate

```bash
npx drizzle-kit generate --name=resync_snapshots
```

You will be prompted, in roughly this order. Pick the matching answer **exactly**:

### Table prompts

Drizzle will detect ~10 changes. Answer each:

| Drizzle prompt | Your answer | Why |
|---|---|---|
| `heu_reports` (deleted?) ↔ `compliance_reports` (created?) | **rename** `heu_reports` → `compliance_reports` | Migration 0013 line 16: `ALTER TABLE "heu_reports" RENAME TO "compliance_reports"` |
| `admin_audit_log` (created?) | **create** | New in 0009 |
| `content_studio_drafts` (created?) | **create** | New in 0008 |
| `custom_threads` (created?) | **create** | New in 0014 |
| `family_library_state` (created?) | **create** | New in 0014 |
| `invitations` (created?) | **create** | New in 0009 |
| `learner_dlo_status` (created?) | **create** | New in 0015 — DLO pipeline |
| `library_upgrade_events` (created?) | **create** | New in 0014 |
| `observation_dlo_links` (created?) | **create** | New in 0015 — DLO evidence |
| `pedagogy_knowledge_chunks` (created?) | **create** | New in 0014 |

> **Hard rule:** Only one prompt should ever resolve to `rename` — the
> `heu_reports → compliance_reports` one. If drizzle offers `rename` for any
> other pair, **answer `create` (or whichever non-rename option keeps both
> tables)**. A wrong `rename` choice generates a `DROP TABLE` against a live
> table.

### Column prompts (within the `learning_entries`, `family_settings`, `families` tables)

If drizzle prompts about columns (it may not — `RENAME COLUMN` migrations sometimes get absorbed):

| Drizzle prompt | Your answer |
|---|---|
| `family_settings.heu_registration_number` ↔ `family_settings.registration_number` | **rename** |
| `family_settings.heu_next_report_date` ↔ `family_settings.next_report_date` | **rename** |
| `learning_entries.heu_candidate` ↔ `learning_entries.work_sample_candidate` | **rename** |

For any other column prompt — **create**, never rename.

## After the prompts finish

Drizzle will write:

- `drizzle/<NNNN>_resync_snapshots.sql` — a migration file
- `drizzle/meta/<NNNN>_snapshot.json` — the recovered snapshot
- Updated `drizzle/meta/_journal.json`

### Sanity-check the generated SQL

```bash
cat drizzle/<NNNN>_resync_snapshots.sql
```

It should consist **only** of:
- `CREATE TABLE IF NOT EXISTS …` statements for tables prod already has
- Possibly some `ALTER TABLE … ADD COLUMN IF NOT EXISTS …`
- **No `DROP TABLE`, no `DROP COLUMN`, no `ALTER … RENAME` you didn't expect.**

If you see any destructive statement, **stop**. Delete the generated files,
fix the wrong prompt answer mentally, and re-run from the top.

### Mark the resync as already-applied

The generated SQL is logically a no-op against prod (everything is
`IF NOT EXISTS`), but you don't want drizzle-migrate to run it later
and waste time. Insert the row by hand:

```sql
-- Run against prod DATABASE_URL
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '<copy hash from drizzle/meta/_journal.json for the new idx>',
       <copy when from same journal entry>::bigint
WHERE NOT EXISTS (
  SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = '<same hash>'
);
```

### Verify

```bash
npm run db:check-drift     # must still pass
npm run db:check-schema    # must still pass
git add drizzle/ && git commit -m "chore(db): resync drizzle snapshots"
git push
```

Open a PR. Merge. Done forever.

## What if you mis-answer a prompt

You'll see a destructive statement in the generated SQL during the
"sanity-check the generated SQL" step above. **Don't apply it.**

```bash
git checkout -- drizzle/        # discard generated files
```

Re-run `drizzle-kit generate` and choose more carefully. The prompts are
deterministic — same answers, same input, same output.

## Why this is a one-time exercise

After this PR merges, `drizzle/meta/<NNNN>_snapshot.json` exists for every
journal entry. From that point on, every `drizzle-kit generate` reads the
latest snapshot, diffs against `schema.ts`, and writes the next snapshot
non-interactively. No more prompts.
