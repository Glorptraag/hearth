/**
 * Integration test for /api/learners/[id] — the auth → DB → response chain
 * against a real database.
 *
 * Every handler here scopes its query with `and(eq(id), eq(familyId))`, so a
 * caller can only read, mutate, or delete a learner that belongs to their own
 * family. That cross-family isolation is the bug class unit tests can't catch
 * reliably (a future refactor could silently drop the familyId clause and a
 * unit test with a mocked DB would never notice). These tests lock it in:
 * family B's learner must be invisible — 404, never mutated, never deleted —
 * to family A, and the row must survive untouched in the database.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut, asOtherFamily } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner } from '@/test/db-factories';
import { learners } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GET, PATCH, DELETE } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

// Family B — a second family the caller must never be able to touch.
const OTHER_FAMILY_ID = '00000000-0000-0000-0000-00000000000b';
const OTHER_USER_ID = 'user_other_1'; // matches asOtherFamily()

function getReq(url: string) {
  return new NextRequest(url);
}
function patchReq(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
function deleteReq(url: string) {
  return new NextRequest(url, { method: 'DELETE' });
}
// Next.js passes route params as a Promise in the second handler arg.
function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

/** Seed family A (the caller) and family B, each with one learner. */
async function seedTwoFamilies() {
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
  const mine = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Emma' });

  await createFamily(db, { id: OTHER_FAMILY_ID, clerkUserId: OTHER_USER_ID });
  const theirs = await createLearner(db, { familyId: OTHER_FAMILY_ID, name: 'Other Child' });

  return { mine, theirs };
}

describe('GET /api/learners/[id]', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(getReq('http://x/api/learners/whatever'), ctx('whatever'));
    expect(res.status).toBe(401);
  });

  it('returns 404 when the caller has no family row', async () => {
    asUser({});
    const res = await GET(getReq('http://x/api/learners/whatever'), ctx('whatever'));
    expect(res.status).toBe(404);
  });

  it("returns the caller's own learner", async () => {
    const { mine } = await seedTwoFamilies();
    asUser({});
    const res = await GET(getReq(`http://x/api/learners/${mine.id}`), ctx(mine.id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; familyId: string };
    expect(body.id).toBe(mine.id);
    expect(body.familyId).toBe(TEST_FAMILY_ID);
  });

  it("returns 404 for another family's learner (no cross-family read)", async () => {
    const { theirs } = await seedTwoFamilies();
    asUser({}); // caller is family A
    const res = await GET(getReq(`http://x/api/learners/${theirs.id}`), ctx(theirs.id));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/learners/[id]', () => {
  it("updates the caller's own learner", async () => {
    const { mine } = await seedTwoFamilies();
    asUser({});
    const res = await PATCH(
      patchReq(`http://x/api/learners/${mine.id}`, { name: 'Emma Renamed' }),
      ctx(mine.id),
    );
    expect(res.status).toBe(200);

    const row = await db.query.learners.findFirst({ where: eq(learners.id, mine.id) });
    expect(row?.name).toBe('Emma Renamed');
  });

  it("cannot modify another family's learner — 404 and the row is untouched", async () => {
    const { theirs } = await seedTwoFamilies();
    asUser({}); // family A trying to rename family B's child
    const res = await PATCH(
      patchReq(`http://x/api/learners/${theirs.id}`, { name: 'Hijacked' }),
      ctx(theirs.id),
    );
    expect(res.status).toBe(404);

    const row = await db.query.learners.findFirst({ where: eq(learners.id, theirs.id) });
    expect(row?.name).toBe('Other Child'); // unchanged
  });
});

describe('DELETE /api/learners/[id]', () => {
  it("deletes the caller's own learner", async () => {
    const { mine } = await seedTwoFamilies();
    asUser({});
    const res = await DELETE(deleteReq(`http://x/api/learners/${mine.id}`), ctx(mine.id));
    expect(res.status).toBe(200);

    const row = await db.query.learners.findFirst({ where: eq(learners.id, mine.id) });
    expect(row).toBeUndefined();
  });

  it("cannot delete another family's learner — 404 and the row survives", async () => {
    const { theirs } = await seedTwoFamilies();
    asUser({}); // family A trying to delete family B's child
    const res = await DELETE(deleteReq(`http://x/api/learners/${theirs.id}`), ctx(theirs.id));
    expect(res.status).toBe(404);

    const row = await db.query.learners.findFirst({ where: eq(learners.id, theirs.id) });
    expect(row?.id).toBe(theirs.id); // still there
  });

  it("the other family can still delete its own learner (sanity check on the seed)", async () => {
    const { theirs } = await seedTwoFamilies();
    asOtherFamily(); // now acting as family B
    const res = await DELETE(deleteReq(`http://x/api/learners/${theirs.id}`), ctx(theirs.id));
    expect(res.status).toBe(200);

    const row = await db.query.learners.findFirst({ where: eq(learners.id, theirs.id) });
    expect(row).toBeUndefined();
  });
});
