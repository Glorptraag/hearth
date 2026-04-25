/**
 * Integration test for /api/entries — exercises the auth → DB → response
 * chain against a real Neon test branch. Family isolation is the class of
 * bug unit tests cannot catch reliably; this is the test that justifies
 * the integration platform existing.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut, asViewer } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { familyMembers, learningEntries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GET, POST } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../vitest.setup';

function jsonReq(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function getReq(url: string) {
  return new NextRequest(url);
}

describe('POST /api/entries — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST(jsonReq('http://x/api/entries', { title: 'Anything' }));
    expect(res.status).toBe(401);
  });

  it('returns 404 when the caller has no family row', async () => {
    asUser({});
    const res = await POST(jsonReq('http://x/api/entries', { title: 'Anything' }));
    expect(res.status).toBe(404);
  });

  it('writes a draft entry scoped to the caller’s family', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(
      jsonReq('http://x/api/entries', { title: 'Magnetic circuit', status: 'draft' })
    );
    expect(res.status).toBe(201);

    const rows = await db
      .select()
      .from(learningEntries)
      .where(eq(learningEntries.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Magnetic circuit');
    expect(rows[0].familyId).toBe(TEST_FAMILY_ID);
  });

  it('rejects writes from a viewer role with 403', async () => {
    // Owner is someone else; the test user is only a viewer member, so the
    // route's checkWritePermission should refuse the write.
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: 'user_owner_xyz' });
    await db.insert(familyMembers).values({
      familyId: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      email: 'viewer@example.com',
      role: 'viewer',
      status: 'active',
    });
    asViewer({});

    const res = await POST(jsonReq('http://x/api/entries', { title: 'Forbidden' }));
    expect(res.status).toBe(403);

    const rows = await db
      .select()
      .from(learningEntries)
      .where(eq(learningEntries.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(0);
  });
});

describe('GET /api/entries — cross-family isolation', () => {
  it('never returns another family’s entries', async () => {
    // Family A — the caller.
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learnerA = await createLearner(db, { familyId: TEST_FAMILY_ID });
    await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learnerA.id],
      title: 'A — visible',
    });

    // Family B — must NEVER appear in family A’s GET response.
    const otherFamilyId = '00000000-0000-0000-0000-00000000000b';
    await createFamily(db, { id: otherFamilyId, clerkUserId: 'user_other_xyz' });
    const learnerB = await createLearner(db, { familyId: otherFamilyId });
    await createEntry(db, {
      familyId: otherFamilyId,
      learnerIds: [learnerB.id],
      title: 'B — hidden',
    });

    asUser({});
    const res = await GET(getReq('http://x/api/entries'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ familyId: string; title: string }>;

    expect(body.every((e) => e.familyId === TEST_FAMILY_ID)).toBe(true);
    expect(body.map((e) => e.title)).toContain('A — visible');
    expect(body.map((e) => e.title)).not.toContain('B — hidden');
  });
});
