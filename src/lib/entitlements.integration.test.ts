/**
 * Integration test for entitlement resolution — guards the rule that a
 * soft-removed pack (familyLibrary.removedAt set) must stop granting access to
 * its assets/commons-text. getFamilyPackIds() is the single source the asset and
 * commons-text entitlement checks build on, so filtering removed rows here is
 * what actually revokes downloads when a family removes a pack from their library.
 */
import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db';
import { createFamily } from '@/test/db-factories';
import { familyLibrary } from '@/lib/db/schema';
import { getFamilyPackIds } from './entitlements';
import { TEST_FAMILY_ID, TEST_USER_ID } from '../../vitest.setup';

describe('getFamilyPackIds — soft-removed packs lose entitlement', () => {
  it('returns active pack ids and excludes soft-removed ones', async () => {
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    await db.insert(familyLibrary).values([
      { familyId: TEST_FAMILY_ID, sanityPackId: 'pack-active' },
      { familyId: TEST_FAMILY_ID, sanityPackId: 'pack-removed', removedAt: new Date() },
    ]);

    const ids = await getFamilyPackIds(TEST_FAMILY_ID);

    expect(ids).toEqual(['pack-active']);
    expect(ids).not.toContain('pack-removed');
  });

  it('returns no pack ids when every row is soft-removed', async () => {
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    await db.insert(familyLibrary).values({
      familyId: TEST_FAMILY_ID,
      sanityPackId: 'pack-gone',
      removedAt: new Date(),
    });

    expect(await getFamilyPackIds(TEST_FAMILY_ID)).toEqual([]);
  });
});
