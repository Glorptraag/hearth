# Drizzle migration metadata

`_journal.json` is the canonical migration history. `drizzle-kit migrate` walks
it in `idx` order and runs each `<tag>.sql` from `drizzle/`.

## Missing snapshots (0008–0014)

Snapshot JSONs (`drizzle/meta/<tag>_snapshot.json`) exist for migrations 0000–0007
but **not** for 0008–0014. They were never produced when those migrations were
hand-authored. Snapshots are only used by `drizzle-kit generate` to diff schema.ts
against a stored baseline; `drizzle-kit migrate` does not need them, so the chain
runs correctly without them.

Accept this as the current state. Future `drizzle-kit generate` runs should be
expected to re-emit the full delta from 0007 — review the output carefully and
hand-trim, rather than committing the regenerated chain wholesale.

## Authoring future migrations by hand

1. Pick the next `idx` and a snake_case tag.
2. Write `drizzle/<NNNN>_<tag>.sql` — wrap in `BEGIN; … COMMIT;` and use
   `--> statement-breakpoint` between statements.
3. Append an entry to `_journal.json` with a strictly-increasing `when` epoch ms.
4. Update `src/lib/db/schema.ts` to match the DDL.
5. Run `npx tsc --noEmit` to catch drift.

## Why this file lives OUTSIDE drizzle/meta/

`drizzle-kit` treats every file inside `drizzle/meta/` as a JSON snapshot and
crashes on anything else (it does `JSON.parse()` on each file). A README in
that directory will break `drizzle-kit generate` with a SyntaxError. Keep
this file at `drizzle/META_README.md`, not `drizzle/meta/README.md`.

## Next `drizzle-kit generate` will need interactive prompts

Snapshots 0008-0011 were never authored (those migrations exist as raw SQL
without journalled snapshot JSON). When the next person runs
`drizzle-kit generate`, drizzle will treat tables created in those
migrations as "new" and prompt to confirm. Run with a real TTY and answer
the prompts honestly (these tables already exist; pick "create table" — the
generated SQL is `CREATE TABLE IF NOT EXISTS` so it's a no-op on prod).
