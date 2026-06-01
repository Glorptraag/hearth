/**
 * Integration test for /api/report/[reportId] — the PATCH handler against a
 * real database.
 *
 * The handler scopes its lookup with
 * and(eq(complianceReports.id, reportId), eq(complianceReports.familyId, family.id))
 * before updating, and runs checkWritePermission first. These tests lock in:
 *   - cross-family isolation (family A cannot mutate family B's report),
 *   - the viewer write-permission gate, and
 *   - the happy-path update (including the lastExportedAt side-effect on
 *     status === 'exported').
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut, asViewer } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner } from '@/test/db-factories';
import { complianceReports, familyMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PATCH } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

const OTHER_FAMILY_ID = '00000000-0000-0000-0000-00000000000b';
const OTHER_USER_ID = 'user_other_1';

function patchReq(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
function ctx(reportId: string) {
  return { params: Promise.resolve({ reportId }) };
}

/** Seed family A (caller) + family B, each with a learner and a draft report. */
async function seedTwoFamilies() {
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
  const learnerA = await createLearner(db, { familyId: TEST_FAMILY_ID });
  const [mine] = await db
    .insert(complianceReports)
    .values({ familyId: TEST_FAMILY_ID, learnerId: learnerA.id, reportYear: 2026 })
    .returning();

  await createFamily(db, { id: OTHER_FAMILY_ID, clerkUserId: OTHER_USER_ID });
  const learnerB = await createLearner(db, { familyId: OTHER_FAMILY_ID });
  const [theirs] = await db
    .insert(complianceReports)
    .values({ familyId: OTHER_FAMILY_ID, learnerId: learnerB.id, reportYear: 2026 })
    .returning();

  return { mine, theirs };
}

describe('PATCH /api/report/[reportId]', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await PATCH(patchReq('http://x/api/report/whatever', { status: 'complete' }), ctx('whatever'));
    expect(res.status).toBe(401);
  });

  it("updates the caller's own report", async () => {
    const { mine } = await seedTwoFamilies();
    asUser({});
    const res = await PATCH(
      patchReq(`http://x/api/report/${mine.id}`, { choiceArea: 'hass', status: 'complete' }),
      ctx(mine.id),
    );
    expect(res.status).toBe(200);
    const row = await db.query.complianceReports.findFirst({ where: eq(complianceReports.id, mine.id) });
    expect(row?.choiceArea).toBe('hass');
    expect(row?.status).toBe('complete');
  });

  it("stamps lastExportedAt when status becomes 'exported'", async () => {
    const { mine } = await seedTwoFamilies();
    asUser({});
    const res = await PATCH(
      patchReq(`http://x/api/report/${mine.id}`, { status: 'exported' }),
      ctx(mine.id),
    );
    expect(res.status).toBe(200);
    const row = await db.query.complianceReports.findFirst({ where: eq(complianceReports.id, mine.id) });
    expect(row?.lastExportedAt).not.toBeNull();
  });

  it("cannot modify another family's report — 404, row untouched", async () => {
    const { theirs } = await seedTwoFamilies();
    asUser({});
    const res = await PATCH(
      patchReq(`http://x/api/report/${theirs.id}`, { status: 'complete' }),
      ctx(theirs.id),
    );
    expect(res.status).toBe(404);
    const row = await db.query.complianceReports.findFirst({ where: eq(complianceReports.id, theirs.id) });
    expect(row?.status).toBe('draft'); // unchanged
  });

  it('refuses a viewer with 403 and leaves the row untouched', async () => {
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: 'user_owner_xyz' });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
    const [report] = await db
      .insert(complianceReports)
      .values({ familyId: TEST_FAMILY_ID, learnerId: learner.id, reportYear: 2026 })
      .returning();
    await db.insert(familyMembers).values({
      familyId: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      email: 'viewer@example.com',
      role: 'viewer',
      status: 'active',
    });
    asViewer({});

    const res = await PATCH(
      patchReq(`http://x/api/report/${report.id}`, { status: 'complete' }),
      ctx(report.id),
    );
    expect(res.status).toBe(403);
    const row = await db.query.complianceReports.findFirst({ where: eq(complianceReports.id, report.id) });
    expect(row?.status).toBe('draft');
  });
});
