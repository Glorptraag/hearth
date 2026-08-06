/**
 * Integration tests for /api/modules/drafts — the module builder's resume
 * loop. Exercises auth → DB → response against real Postgres. The bugs this
 * surface must never ship: cross-family draft access (updating or deleting
 * another family's draft), and duplicate-row pileup from repeat saves (the
 * update-in-place path).
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily } from '@/test/db-factories';
import { moduleDrafts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GET, POST } from './route';
import { DELETE } from './[id]/route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

const OTHER_USER_ID = 'user_other_1';
const OTHER_FAMILY_ID = '00000000-0000-4000-8000-0000000000ff';

function postReq(body: unknown) {
  return new NextRequest('http://x/api/modules/drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deleteReq(id: string) {
  return new NextRequest(`http://x/api/modules/drafts/${id}`, { method: 'DELETE' });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

const draftBody = (overrides: Record<string, unknown> = {}) => ({
  pathway: 'material',
  draftData: { resourceName: 'The Secret Garden', resourceType: 'book' },
  status: 'draft',
  ...overrides,
});

describe('/api/modules/drafts — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    expect((await GET()).status).toBe(401);
    expect((await POST(postReq(draftBody()))).status).toBe(401);
    expect((await DELETE(deleteReq('00000000-0000-4000-8000-000000000001'), params('00000000-0000-4000-8000-000000000001'))).status).toBe(401);
  });

  it('POST without id inserts a new draft', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(postReq(draftBody()));
    expect(res.status).toBe(201);
    const created = await res.json();
    expect(created.familyId).toBe(TEST_FAMILY_ID);
    expect(created.id).toBeTruthy();

    const rows = await db.select().from(moduleDrafts).where(eq(moduleDrafts.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(1);
  });

  it('POST with id updates the same row instead of piling up duplicates', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const first = await (await POST(postReq(draftBody()))).json();
    const res = await POST(postReq(draftBody({
      id: first.id,
      draftData: { resourceName: 'Planet Earth II', resourceType: 'video' },
    })));
    expect(res.status).toBe(200);

    const rows = await db.select().from(moduleDrafts).where(eq(moduleDrafts.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(1);
    expect((rows[0].draftData as Record<string, unknown>).resourceName).toBe('Planet Earth II');
  });

  it("POST with another family's draft id returns 404 and leaves their row alone", async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await createFamily(db, { id: OTHER_FAMILY_ID, clerkUserId: OTHER_USER_ID });
    const [theirs] = await db.insert(moduleDrafts).values({
      familyId: OTHER_FAMILY_ID,
      pathway: 'inquiry',
      draftData: { question: 'Why do magnets stick?' },
      status: 'draft',
    }).returning();

    const res = await POST(postReq(draftBody({ id: theirs.id })));
    expect(res.status).toBe(404);

    const [row] = await db.select().from(moduleDrafts).where(eq(moduleDrafts.id, theirs.id));
    expect((row.draftData as Record<string, unknown>).question).toBe('Why do magnets stick?');
  });

  it("GET returns only the caller's drafts", async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await createFamily(db, { id: OTHER_FAMILY_ID, clerkUserId: OTHER_USER_ID });
    await db.insert(moduleDrafts).values([
      { familyId: TEST_FAMILY_ID, pathway: 'material', draftData: { resourceName: 'Mine' }, status: 'draft' },
      { familyId: OTHER_FAMILY_ID, pathway: 'material', draftData: { resourceName: 'Theirs' }, status: 'draft' },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const rows = await res.json();
    expect(rows).toHaveLength(1);
    expect(rows[0].draftData.resourceName).toBe('Mine');
  });

  it("DELETE removes the caller's draft but 404s on another family's", async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await createFamily(db, { id: OTHER_FAMILY_ID, clerkUserId: OTHER_USER_ID });
    const [mine] = await db.insert(moduleDrafts).values({
      familyId: TEST_FAMILY_ID, pathway: 'process', draftData: {}, status: 'draft',
    }).returning();
    const [theirs] = await db.insert(moduleDrafts).values({
      familyId: OTHER_FAMILY_ID, pathway: 'process', draftData: {}, status: 'draft',
    }).returning();

    expect((await DELETE(deleteReq(mine.id), params(mine.id))).status).toBe(200);
    expect(await db.select().from(moduleDrafts).where(eq(moduleDrafts.id, mine.id))).toHaveLength(0);

    expect((await DELETE(deleteReq(theirs.id), params(theirs.id))).status).toBe(404);
    expect(await db.select().from(moduleDrafts).where(eq(moduleDrafts.id, theirs.id))).toHaveLength(1);
  });

  it('DELETE with a malformed id returns 404, not a 500 from the uuid cast', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    expect((await DELETE(deleteReq('not-a-uuid'), params('not-a-uuid'))).status).toBe(404);
  });
});
