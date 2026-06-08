/**
 * Integration test for /api/entries/[id] — the GET/PATCH/DELETE handlers
 * against a real database.
 *
 * Like learners/[id], every handler scopes its query with
 * and(eq(id), eq(familyId)), so a caller can only touch an entry owned by
 * their own family. PATCH and DELETE additionally run checkWritePermission
 * (a viewer is refused), and DELETE only permits draft entries. These tests
 * lock all three guards in:
 *   - cross-family isolation (the silent-breach bug class),
 *   - the viewer write-permission gate, and
 *   - the draft-only delete rule.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut, asViewer } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { learningEntries, familyMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GET, PATCH, DELETE } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

const OTHER_FAMILY_ID = '00000000-0000-0000-0000-00000000000b';
const OTHER_USER_ID = 'user_other_1';

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
function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

/** Seed family A (caller) + family B, each with a learner and a draft entry. */
async function seedTwoFamilies() {
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
  const learnerA = await createLearner(db, { familyId: TEST_FAMILY_ID });
  const mine = await createEntry(db, {
    familyId: TEST_FAMILY_ID,
    learnerIds: [learnerA.id],
    title: 'A — mine',
    status: 'draft',
  });

  await createFamily(db, { id: OTHER_FAMILY_ID, clerkUserId: OTHER_USER_ID });
  const learnerB = await createLearner(db, { familyId: OTHER_FAMILY_ID });
  const theirs = await createEntry(db, {
    familyId: OTHER_FAMILY_ID,
    learnerIds: [learnerB.id],
    title: 'B — theirs',
    status: 'draft',
  });

  return { mine, theirs };
}

describe('GET /api/entries/[id]', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(getReq('http://x/api/entries/whatever'), ctx('whatever'));
    expect(res.status).toBe(401);
  });

  it("returns the caller's own entry", async () => {
    const { mine } = await seedTwoFamilies();
    asUser({});
    const res = await GET(getReq(`http://x/api/entries/${mine.id}`), ctx(mine.id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; familyId: string };
    expect(body.id).toBe(mine.id);
    expect(body.familyId).toBe(TEST_FAMILY_ID);
  });

  it("returns 404 for another family's entry", async () => {
    const { theirs } = await seedTwoFamilies();
    asUser({});
    const res = await GET(getReq(`http://x/api/entries/${theirs.id}`), ctx(theirs.id));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/entries/[id]', () => {
  it("updates the caller's own entry", async () => {
    const { mine } = await seedTwoFamilies();
    asUser({});
    const res = await PATCH(
      patchReq(`http://x/api/entries/${mine.id}`, { title: 'A — edited' }),
      ctx(mine.id),
    );
    expect(res.status).toBe(200);
    const row = await db.query.learningEntries.findFirst({ where: eq(learningEntries.id, mine.id) });
    expect(row?.title).toBe('A — edited');
  });

  it('ignores evidenceUrls — the schema drops it, so the legacy column is never touched', async () => {
    // PATCH has no learning_entry_evidence dual-write (only POST does), so it
    // deliberately does not accept evidenceUrls. Zod strips the unknown field;
    // the title still updates but evidence_urls stays exactly as seeded — no
    // half-written desync against the new table.
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
    const entry = await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      title: 'Has evidence',
      status: 'draft',
      evidenceUrls: ['https://blob/original.jpg'],
    });
    asUser({});

    const res = await PATCH(
      patchReq(`http://x/api/entries/${entry.id}`, {
        title: 'Edited',
        evidenceUrls: ['https://blob/sneaky.jpg'],
      }),
      ctx(entry.id),
    );
    expect(res.status).toBe(200);
    const row = await db.query.learningEntries.findFirst({ where: eq(learningEntries.id, entry.id) });
    expect(row?.title).toBe('Edited');
    expect(row?.evidenceUrls).toEqual(['https://blob/original.jpg']);
  });

  it("cannot modify another family's entry — 404, row untouched", async () => {
    const { theirs } = await seedTwoFamilies();
    asUser({});
    const res = await PATCH(
      patchReq(`http://x/api/entries/${theirs.id}`, { title: 'Hijacked' }),
      ctx(theirs.id),
    );
    expect(res.status).toBe(404);
    const row = await db.query.learningEntries.findFirst({ where: eq(learningEntries.id, theirs.id) });
    expect(row?.title).toBe('B — theirs');
  });

  it('refuses a viewer with 403 and leaves the row untouched', async () => {
    // Owner is someone else; the test user is only a viewer member.
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: 'user_owner_xyz' });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
    const entry = await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      title: 'Owned',
      status: 'draft',
    });
    await db.insert(familyMembers).values({
      familyId: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      email: 'viewer@example.com',
      role: 'viewer',
      status: 'active',
    });
    asViewer({});

    const res = await PATCH(
      patchReq(`http://x/api/entries/${entry.id}`, { title: 'Forbidden' }),
      ctx(entry.id),
    );
    expect(res.status).toBe(403);
    const row = await db.query.learningEntries.findFirst({ where: eq(learningEntries.id, entry.id) });
    expect(row?.title).toBe('Owned');
  });
});

describe('DELETE /api/entries/[id]', () => {
  it("deletes the caller's own draft entry", async () => {
    const { mine } = await seedTwoFamilies();
    asUser({});
    const res = await DELETE(deleteReq(`http://x/api/entries/${mine.id}`), ctx(mine.id));
    expect(res.status).toBe(200);
    const row = await db.query.learningEntries.findFirst({ where: eq(learningEntries.id, mine.id) });
    expect(row).toBeUndefined();
  });

  it('refuses to delete a non-draft entry with 400', async () => {
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
    const completed = await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      title: 'Completed',
      status: 'complete',
    });
    asUser({});
    const res = await DELETE(deleteReq(`http://x/api/entries/${completed.id}`), ctx(completed.id));
    expect(res.status).toBe(400);
    const row = await db.query.learningEntries.findFirst({ where: eq(learningEntries.id, completed.id) });
    expect(row?.id).toBe(completed.id); // survives
  });

  it("cannot delete another family's entry — 404, row survives", async () => {
    const { theirs } = await seedTwoFamilies();
    asUser({});
    const res = await DELETE(deleteReq(`http://x/api/entries/${theirs.id}`), ctx(theirs.id));
    expect(res.status).toBe(404);
    const row = await db.query.learningEntries.findFirst({ where: eq(learningEntries.id, theirs.id) });
    expect(row?.id).toBe(theirs.id);
  });
});
