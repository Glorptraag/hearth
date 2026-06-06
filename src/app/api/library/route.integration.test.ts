/**
 * Integration test for /api/library — covers the soft-delete +
 * restore-on-re-add cycle introduced by Task 4.2.
 *
 * Task 4.8.
 */
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser } from '@/test/clerk-helpers';

// The route fires rebuildSnapshot(...) fire-and-forget (not awaited). Under the
// single-pinned-transaction integration harness that escaped async write runs
// AFTER the test's transaction rolls back, hits an FK violation (family gone),
// and aborts the shared connection — poisoning subsequent tests. Snapshot
// rebuild has its own coverage; stub it to a no-op here so we test only the
// library DB behaviour.
vi.mock('@/lib/ai/snapshot-rebuild', () => ({
  rebuildSnapshot: vi.fn(async () => {}),
}));
import { db } from '@/lib/db';
import { createFamily } from '@/test/db-factories';
import { familyLibrary } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { GET, POST } from './route';
import { DELETE } from './[id]/route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../vitest.setup';

function jsonReq(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function getReq(url = 'http://x/api/library') {
  return new NextRequest(url);
}

describe('POST /api/library — add/restore semantics (4.2 + 4.7)', () => {
  it('inserts a fresh pack row when none exists', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(jsonReq('http://x/api/library', { sanityPackId: 'pack-1' }));
    expect(res.status).toBe(201);

    const rows = await db
      .select()
      .from(familyLibrary)
      .where(and(eq(familyLibrary.familyId, TEST_FAMILY_ID), eq(familyLibrary.sanityPackId, 'pack-1')));
    expect(rows).toHaveLength(1);
    expect(rows[0].removedAt).toBeNull();
  });

  it('restores a soft-deleted row on re-add, preserving rowId + addedAt', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const originalAddedAt = new Date('2026-05-01T00:00:00Z');
    const [original] = await db
      .insert(familyLibrary)
      .values({
        familyId: TEST_FAMILY_ID,
        sanityPackId: 'pack-restore',
        addedAt: originalAddedAt,
        removedAt: new Date(),
      })
      .returning();

    const res = await POST(jsonReq('http://x/api/library', { sanityPackId: 'pack-restore' }));
    expect(res.status).toBe(201);

    const rows = await db
      .select()
      .from(familyLibrary)
      .where(and(eq(familyLibrary.familyId, TEST_FAMILY_ID), eq(familyLibrary.sanityPackId, 'pack-restore')));
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(original.id); // same rowId preserved
    expect(rows[0].removedAt).toBeNull(); // restored
    // addedAt is preserved (within ms) — assertion uses time equality.
    expect(rows[0].addedAt?.toISOString()).toBe(originalAddedAt.toISOString());
  });

  it('accepts sanityModuleId for module add (XOR with packId)', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(jsonReq('http://x/api/library', { sanityModuleId: 'mod-1' }));
    expect(res.status).toBe(201);

    const rows = await db
      .select()
      .from(familyLibrary)
      .where(and(eq(familyLibrary.familyId, TEST_FAMILY_ID), eq(familyLibrary.sanityModuleId, 'mod-1')));
    expect(rows).toHaveLength(1);
  });

  it('rejects requests with both pack and module', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(
      jsonReq('http://x/api/library', { sanityPackId: 'pack-1', sanityModuleId: 'mod-1' }),
    );
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/library/[id] — soft delete', () => {
  it('sets removedAt and hides the row from default GET', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const [row] = await db
      .insert(familyLibrary)
      .values({ familyId: TEST_FAMILY_ID, sanityPackId: 'pack-delete' })
      .returning();

    const delRes = await DELETE(
      new NextRequest(`http://x/api/library/${row.id}`, { method: 'DELETE' }),
      { params: Promise.resolve({ id: row.id }) },
    );
    expect(delRes.status).toBe(200);

    const persisted = await db
      .select()
      .from(familyLibrary)
      .where(eq(familyLibrary.id, row.id));
    expect(persisted[0].removedAt).not.toBeNull();

    const getRes = await GET(getReq());
    const body = (await getRes.json()) as Array<{ id: string }>;
    expect(body.find((i) => i.id === 'pack-delete')).toBeUndefined();
  });

  it('?includeRemoved=true surfaces soft-deleted rows', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await db.insert(familyLibrary).values({
      familyId: TEST_FAMILY_ID,
      sanityPackId: 'pack-removed',
      removedAt: new Date(),
    });

    const res = await GET(getReq('http://x/api/library?includeRemoved=true'));
    const body = (await res.json()) as Array<{ id: string; removedAt: string | null }>;
    expect(body.find((i) => i.id === 'pack-removed')?.removedAt).not.toBeNull();
  });

  it("returns 404 when trying to delete another family's row", async () => {
    const otherFamilyId = '00000000-0000-0000-0000-00000000000c';
    await createFamily(db, { id: otherFamilyId, clerkUserId: 'user_other_lib' });
    const [foreign] = await db
      .insert(familyLibrary)
      .values({ familyId: otherFamilyId, sanityPackId: 'pack-foreign' })
      .returning();

    // Now act as my user.
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    asUser({});

    const res = await DELETE(
      new NextRequest(`http://x/api/library/${foreign.id}`, { method: 'DELETE' }),
      { params: Promise.resolve({ id: foreign.id }) },
    );
    expect(res.status).toBe(404);

    // Foreign row remains unmodified.
    const persisted = await db
      .select()
      .from(familyLibrary)
      .where(eq(familyLibrary.id, foreign.id));
    expect(persisted[0].removedAt).toBeNull();
  });
});

describe('Soft-delete + re-add: partial unique index plays nicely', () => {
  it('allows insert → soft-delete → re-add → soft-delete cycle without UNIQUE violation', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    // 1. Add
    let res = await POST(jsonReq('http://x/api/library', { sanityPackId: 'pack-cycle' }));
    expect(res.status).toBe(201);
    const rowsAfterAdd = await db
      .select()
      .from(familyLibrary)
      .where(and(eq(familyLibrary.familyId, TEST_FAMILY_ID), eq(familyLibrary.sanityPackId, 'pack-cycle')));
    expect(rowsAfterAdd).toHaveLength(1);
    const rowId = rowsAfterAdd[0].id;

    // 2. Soft-delete
    const delRes = await DELETE(
      new NextRequest(`http://x/api/library/${rowId}`, { method: 'DELETE' }),
      { params: Promise.resolve({ id: rowId }) },
    );
    expect(delRes.status).toBe(200);

    // 3. Re-add (should restore same row, not insert duplicate)
    res = await POST(jsonReq('http://x/api/library', { sanityPackId: 'pack-cycle' }));
    expect(res.status).toBe(201);
    const rowsAfterRestore = await db
      .select()
      .from(familyLibrary)
      .where(and(eq(familyLibrary.familyId, TEST_FAMILY_ID), eq(familyLibrary.sanityPackId, 'pack-cycle')));
    expect(rowsAfterRestore).toHaveLength(1); // no duplicate
    expect(rowsAfterRestore[0].id).toBe(rowId);
    expect(rowsAfterRestore[0].removedAt).toBeNull();

    // Active partial-unique-index invariant: only one active row.
    const activeRows = await db
      .select()
      .from(familyLibrary)
      .where(
        and(
          eq(familyLibrary.familyId, TEST_FAMILY_ID),
          eq(familyLibrary.sanityPackId, 'pack-cycle'),
          isNull(familyLibrary.removedAt),
        ),
      );
    expect(activeRows).toHaveLength(1);
  });
});
