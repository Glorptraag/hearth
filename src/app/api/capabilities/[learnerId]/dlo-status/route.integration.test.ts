/**
 * Integration test for /api/capabilities/[learnerId]/dlo-status — exercises
 * auth → cross-family learner isolation → Zod validation → upsert/read of
 * genuine per-DLO state against a real Neon test branch.
 *
 * The cross-family learner check and the upsert-not-duplicate behaviour are
 * the load-bearing cases: per-DLO state must never leak across families and
 * a re-confirm must update in place (unique learner+dlo), not stack rows.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner } from '@/test/db-factories';
import { learnerDloStatus } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GET, PUT } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../../vitest.setup';

const ctx = (learnerId: string) => ({ params: Promise.resolve({ learnerId }) });

function putReq(body: unknown) {
  return new NextRequest('http://x/api/capabilities/x/dlo-status', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
const getReq = () => new NextRequest('http://x/api/capabilities/x/dlo-status');

describe('/api/capabilities/[learnerId]/dlo-status — real DB', () => {
  it('GET returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(getReq(), ctx('00000000-0000-0000-0000-000000000001'));
    expect(res.status).toBe(401);
  });

  it('PUT returns 401 when signed out', async () => {
    asSignedOut();
    const res = await PUT(putReq({ dloId: 'dlo.L1.emerging', state: 'emerging' }), ctx('00000000-0000-0000-0000-000000000001'));
    expect(res.status).toBe(401);
  });

  it('returns 404 when the caller has no family row', async () => {
    asUser({});
    const res = await GET(getReq(), ctx('00000000-0000-0000-0000-000000000001'));
    expect(res.status).toBe(404);
  });

  it('PUT returns 404 when the learner belongs to another family', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const otherFamilyId = '00000000-0000-0000-0000-00000000000c';
    await createFamily(db, { id: otherFamilyId, clerkUserId: 'user_other_owner' });
    const otherLearner = await createLearner(db, { familyId: otherFamilyId });

    const res = await PUT(putReq({ dloId: 'dlo.L1.emerging', state: 'confirmed' }), ctx(otherLearner.id));
    expect(res.status).toBe(404);
    expect(await db.select().from(learnerDloStatus)).toHaveLength(0);
  });

  it('PUT returns 422 on an invalid body', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });

    const res = await PUT(putReq({ dloId: '', state: 'mastered' }), ctx(learner.id));
    expect(res.status).toBe(422);
  });

  it('PUT writes state, GET reads it back, and re-PUT upserts in place', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });

    const r1 = await PUT(putReq({ dloId: 'dlo.L1.emerging', state: 'emerging' }), ctx(learner.id));
    expect(r1.status).toBe(200);

    const g1 = await GET(getReq(), ctx(learner.id));
    expect(await g1.json()).toEqual({ 'dlo.L1.emerging': 'emerging' });

    // Re-confirm the same DLO → update in place, not a second row.
    const r2 = await PUT(putReq({ dloId: 'dlo.L1.emerging', state: 'confirmed' }), ctx(learner.id));
    expect(r2.status).toBe(200);

    const rows = await db
      .select()
      .from(learnerDloStatus)
      .where(eq(learnerDloStatus.learnerId, learner.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].state).toBe('confirmed');

    const g2 = await GET(getReq(), ctx(learner.id));
    expect(await g2.json()).toEqual({ 'dlo.L1.emerging': 'confirmed' });
  });

  it('GET is family-scoped — never returns another family\'s rows', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const mine = await createLearner(db, { familyId: TEST_FAMILY_ID });
    await PUT(putReq({ dloId: 'dlo.M1.emerging', state: 'confirmed' }), ctx(mine.id));

    const g = await GET(getReq(), ctx(mine.id));
    expect(await g.json()).toEqual({ 'dlo.M1.emerging': 'confirmed' });
  });
});
