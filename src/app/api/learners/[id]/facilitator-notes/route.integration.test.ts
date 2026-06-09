/**
 * Integration test for /api/learners/[id]/facilitator-notes — the encrypted
 * private-note write/read path against a real database.
 *
 * Two properties this locks in:
 *  1. Round-trip: a note PUT through the handler reads back as the same
 *     plaintext via GET — the bug that motivated this (notes silently dropped
 *     because the learners PATCH Zod schema stripped facilitatorNotes) must
 *     stay fixed.
 *  2. Encrypted at rest (E19): the raw row in `facilitator_notes` is ciphertext
 *     (fenc1: token), never the plaintext the user typed.
 *
 * Plus the same cross-family isolation guarantee the sibling learners route
 * tests cover: a caller can only touch notes for a learner in their own family.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut, asOtherFamily } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createFacilitatorNote } from '@/test/db-factories';
import { facilitatorNotes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isEncrypted, decryptField } from '@/lib/crypto/field-encryption';
import { GET, PUT } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../../vitest.setup';

const OTHER_FAMILY_ID = '00000000-0000-0000-0000-00000000000b';
const OTHER_USER_ID = 'user_other_1'; // matches asOtherFamily()

function getReq() {
  return new NextRequest('http://x/api/learners/id/facilitator-notes');
}
function putReq(noteText: string) {
  return new NextRequest('http://x/api/learners/id/facilitator-notes', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteText }),
  });
}
function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedTwoFamilies() {
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
  const mine = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Emma' });

  await createFamily(db, { id: OTHER_FAMILY_ID, clerkUserId: OTHER_USER_ID });
  const theirs = await createLearner(db, { familyId: OTHER_FAMILY_ID, name: 'Other Child' });

  return { mine, theirs };
}

async function rawNotes(learnerId: string) {
  return db.select().from(facilitatorNotes).where(eq(facilitatorNotes.learnerId, learnerId));
}

describe('PUT /api/learners/[id]/facilitator-notes', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await PUT(putReq('secret'), ctx('whatever'));
    expect(res.status).toBe(401);
  });

  it('round-trips a note through save (the dropped-notes bug stays fixed)', async () => {
    const { mine } = await seedTwoFamilies();
    asUser({});
    const NOTE = 'Keep mornings unhurried; sensitive to loud transitions.';

    const putRes = await PUT(putReq(NOTE), ctx(mine.id));
    expect(putRes.status).toBe(200);

    const getRes = await GET(getReq(), ctx(mine.id));
    expect(getRes.status).toBe(200);
    const body = (await getRes.json()) as { noteText: string };
    expect(body.noteText).toBe(NOTE);
  });

  it('stores the note encrypted at rest — never plaintext (E19)', async () => {
    const { mine } = await seedTwoFamilies();
    asUser({});
    const NOTE = 'PLAINTEXT-MARKER-should-not-be-in-the-row';

    await PUT(putReq(NOTE), ctx(mine.id));

    const rows = await rawNotes(mine.id);
    expect(rows).toHaveLength(1);
    expect(isEncrypted(rows[0].noteText)).toBe(true);
    expect(rows[0].noteText).not.toContain(NOTE);
    // ...and the ciphertext still decrypts back to the original.
    expect(decryptField(rows[0].noteText)).toBe(NOTE);
  });

  it('upserts — saving twice updates the single row rather than duplicating', async () => {
    const { mine } = await seedTwoFamilies();
    asUser({});

    await PUT(putReq('first version'), ctx(mine.id));
    await PUT(putReq('second version'), ctx(mine.id));

    const rows = await rawNotes(mine.id);
    expect(rows).toHaveLength(1);
    expect(decryptField(rows[0].noteText)).toBe('second version');
  });

  it("cannot write another family's learner notes — 404, row untouched", async () => {
    const { theirs } = await seedTwoFamilies();
    await createFacilitatorNote(db, {
      familyId: OTHER_FAMILY_ID,
      learnerId: theirs.id,
      noteText: 'their private note',
    });
    asUser({}); // family A targeting family B's learner

    const res = await PUT(putReq('hijack'), ctx(theirs.id));
    expect(res.status).toBe(404);

    const rows = await rawNotes(theirs.id);
    expect(rows).toHaveLength(1);
    expect(decryptField(rows[0].noteText)).toBe('their private note'); // unchanged
  });
});

describe('GET /api/learners/[id]/facilitator-notes', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(getReq(), ctx('whatever'));
    expect(res.status).toBe(401);
  });

  it('returns an empty string when no note exists yet', async () => {
    const { mine } = await seedTwoFamilies();
    asUser({});
    const res = await GET(getReq(), ctx(mine.id));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { noteText: string }).noteText).toBe('');
  });

  it("returns 404 for another family's learner (no cross-family read)", async () => {
    const { theirs } = await seedTwoFamilies();
    await createFacilitatorNote(db, {
      familyId: OTHER_FAMILY_ID,
      learnerId: theirs.id,
      noteText: 'their private note',
    });
    asUser({}); // family A

    const res = await GET(getReq(), ctx(theirs.id));
    expect(res.status).toBe(404);
  });

  it('the owning family decrypts and reads its own note', async () => {
    const { theirs } = await seedTwoFamilies();
    await createFacilitatorNote(db, {
      familyId: OTHER_FAMILY_ID,
      learnerId: theirs.id,
      noteText: 'their private note',
    });
    asOtherFamily(); // now acting as family B

    const res = await GET(getReq(), ctx(theirs.id));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { noteText: string }).noteText).toBe('their private note');
  });
});
