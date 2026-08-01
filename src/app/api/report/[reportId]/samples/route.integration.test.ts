/**
 * Integration test for GET/PATCH /api/report/[reportId]/samples — real DB.
 *
 * Focus: the PATCH cross-slot conflict guard. A single entry may only occupy
 * one slot per report; assigning it to a second slot must 409 rather than
 * silently duplicating it (which would put the same evidence in two places
 * in the compliance PDF).
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { complianceReports, workSamples } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GET, PATCH } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../../vitest.setup';

async function seedReportWithEntry() {
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
  const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
  const entry = await createEntry(db, {
    familyId: TEST_FAMILY_ID,
    learnerIds: [learner.id],
    title: 'Fraction pizza',
    status: 'complete',
    subjects: ['mathematics'],
  });
  const [report] = await db
    .insert(complianceReports)
    .values({ familyId: TEST_FAMILY_ID, learnerId: learner.id, reportYear: 2026 })
    .returning();
  return { learner, entry, report };
}

function patchReq(body: unknown) {
  return new NextRequest('http://x/samples', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

function getReq() {
  return new NextRequest('http://x/samples');
}

describe('GET/PATCH /api/report/[reportId]/samples — real DB', () => {
  it('GET returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(getReq(), { params: Promise.resolve({ reportId: 'r' }) });
    expect(res!.status).toBe(401);
  });

  it('PATCH returns 401 when signed out', async () => {
    asSignedOut();
    const res = await PATCH(patchReq({ slot: 'early_writing', entryId: null }), {
      params: Promise.resolve({ reportId: 'r' }),
    });
    expect(res!.status).toBe(401);
  });

  it('PATCH returns 404 when the report does not belong to the caller’s family', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const res = await PATCH(patchReq({ slot: 'early_writing', entryId: null }), {
      params: Promise.resolve({ reportId: '00000000-0000-0000-0000-0000000000ff' }),
    });
    expect(res!.status).toBe(404);
  });

  it('PATCH assigns an entry to an empty slot', async () => {
    asUser({});
    const { entry, report } = await seedReportWithEntry();
    await db.insert(workSamples).values({ reportId: report.id, slot: 'early_maths', status: 'empty' });

    const res = await PATCH(patchReq({ slot: 'early_maths', entryId: entry.id }), {
      params: Promise.resolve({ reportId: report.id }),
    });
    expect(res!.status).toBe(200);
    const body = await res!.json();
    expect(body.entryId).toBe(entry.id);
    expect(body.status).toBe('selected');
  });

  it('PATCH rejects assigning an entry that is already occupying a different slot (409)', async () => {
    asUser({});
    const { entry, report } = await seedReportWithEntry();
    await db.insert(workSamples).values([
      { reportId: report.id, slot: 'early_maths', entryId: entry.id, status: 'selected' },
      { reportId: report.id, slot: 'later_maths', status: 'empty' },
    ]);

    const res = await PATCH(patchReq({ slot: 'later_maths', entryId: entry.id }), {
      params: Promise.resolve({ reportId: report.id }),
    });
    expect(res!.status).toBe(409);
    const body = await res!.json();
    expect(body.error).toContain('early_maths');

    // The conflicting slot must be left untouched — no silent double-assignment.
    const untouched = await db.query.workSamples.findFirst({
      where: eq(workSamples.slot, 'later_maths'),
    });
    expect(untouched?.entryId).toBeNull();
    expect(untouched?.status).toBe('empty');
  });

  it('PATCH allows re-assigning an entry to the same slot it already occupies (no conflict)', async () => {
    asUser({});
    const { entry, report } = await seedReportWithEntry();
    await db.insert(workSamples).values({
      reportId: report.id,
      slot: 'early_maths',
      entryId: entry.id,
      status: 'selected',
    });

    const res = await PATCH(patchReq({ slot: 'early_maths', entryId: entry.id }), {
      params: Promise.resolve({ reportId: report.id }),
    });
    expect(res!.status).toBe(200);
  });
});
