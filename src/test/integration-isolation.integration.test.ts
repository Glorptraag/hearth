/**
 * Proves the transaction-rollback isolation actually isolates. If rollback ever
 * regresses (e.g. an app `db.transaction()` that COMMITs the outer tx), the
 * third test here fails loudly instead of letting state leak silently between
 * unrelated suites.
 *
 * Tests within a file run in definition order, so this reads top-to-bottom.
 */
import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db';
import { families } from '@/lib/db/schema';
import { createFamily } from '@/test/db-factories';

describe('integration isolation (transaction rollback)', () => {
  it('starts each test with an empty families table', async () => {
    const rows = await db.select().from(families);
    expect(rows).toHaveLength(0);
  });

  it('sees a row it inserts within the same test', async () => {
    await createFamily(db);
    const rows = await db.select().from(families);
    expect(rows).toHaveLength(1);
  });

  it('does NOT see the previous test’s row (rollback isolated it)', async () => {
    const rows = await db.select().from(families);
    expect(rows).toHaveLength(0);
  });
});
