/**
 * Integration-test doubles for account deletion. Imported by the
 * `*.integration.test.ts` files in this folder only — never by the route.
 *
 * - `db.transaction` on the pinned test client would BEGIN/COMMIT and commit
 *   the per-test outer transaction, so it is swapped for a SAVEPOINT that
 *   gives the same all-or-nothing behaviour inside the rolled-back test.
 * - The shared Clerk mock has no `users.deleteUser`; each test gets a fresh
 *   spy. Originals are restored afterwards so nothing leaks across files
 *   (the integration config runs with `isolate: false`).
 */
import { afterEach, beforeEach, vi, type Mock } from 'vitest';
import { sql } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';
import { del, list } from '@vercel/blob';
import { db } from '@/lib/db';
import { getTestDb } from '@/test/integration-db';

export const deleteUser: Mock<(id: string) => Promise<unknown>> = vi.fn(async () => ({}));

export function installAccountDeletionDoubles(): void {
  let restoreClerk: (() => void) | undefined;
  let restoreBlob: (() => void) | undefined;

  beforeEach(() => {
    const testDb = getTestDb();
    vi.spyOn(testDb, 'transaction').mockImplementation((async (fn: (tx: typeof testDb) => Promise<unknown>) => {
      await testDb.execute(sql`savepoint account_delete`);
      try {
        const result = await fn(testDb);
        await testDb.execute(sql`release savepoint account_delete`);
        return result;
      } catch (err) {
        await testDb.execute(sql`rollback to savepoint account_delete`);
        throw err;
      }
    }) as never);

    const clerk = vi.mocked(clerkClient);
    const originalClerk = clerk.getMockImplementation();
    deleteUser.mockReset();
    deleteUser.mockResolvedValue({});
    clerk.mockImplementation(async () => {
      const base = originalClerk ? await originalClerk() : ({} as Awaited<ReturnType<typeof clerkClient>>);
      return { ...base, users: { ...base.users, deleteUser } } as never;
    });
    restoreClerk = () => {
      if (originalClerk) clerk.mockImplementation(originalClerk);
    };

    const originalDel = vi.mocked(del).getMockImplementation();
    const originalList = vi.mocked(list).getMockImplementation();
    restoreBlob = () => {
      if (originalDel) vi.mocked(del).mockImplementation(originalDel);
      if (originalList) vi.mocked(list).mockImplementation(originalList);
    };
  });

  afterEach(() => {
    vi.mocked(getTestDb().transaction).mockRestore?.();
    restoreClerk?.();
    restoreBlob?.();
  });
}

/** Every blob ref handed to `del()` across all calls. */
export function deletedBlobRefs(): string[] {
  return vi.mocked(del).mock.calls.flatMap(([refs]) => (Array.isArray(refs) ? refs : [refs]));
}

/** Rows in `table` whose FK columns into `target` hold any of `ids` — read from the catalog, so new tables are covered. */
export async function referencesTo(target: string, ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const fks = await db.execute<{ tbl: string; col: string }>(sql`
    select c.conrelid::regclass::text as tbl, a.attname as col
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.contype = 'f' and c.confrelid = ${target}::regclass
  `);
  const out: Record<string, number> = {};
  for (const { tbl, col } of fks.rows) {
    const res = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from ${sql.identifier(tbl)}
      where ${sql.identifier(col)}::text in (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})
    `);
    out[`${tbl}.${col}`] = res.rows[0].n;
  }
  return out;
}
