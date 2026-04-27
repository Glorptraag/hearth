/**
 * Integration test for /api/badges/award — exercises auth → cross-family
 * learner check → badgeAwards/badgeAssessmentLogs writes against a real
 * Neon test branch. The cross-family learner check is the load-bearing
 * isolation case here.
 *
 * The route fires `rebuildSnapshot()` non-blocking; it's left real because
 * its catch block swallows errors and any side-effect rows are truncated
 * between tests.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createBadgeDefinition } from '@/test/db-factories';
import { badgeAwards, badgeAssessmentLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { POST } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

function jsonReq(body: unknown) {
  return new NextRequest('http://x/api/badges/award', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const RESPONSES = [
  { questionId: 'q1', response: 'yes' as const },
  { questionId: 'q2', response: 'sometimes' as const },
];

describe('POST /api/badges/award — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST(
      jsonReq({ badgeId: 'badge-number-navigator', learnerId: '00000000-0000-0000-0000-000000000001', responses: RESPONSES })
    );
    expect(res.status).toBe(401);
  });

  it('returns 404 when the caller has no family row', async () => {
    asUser({});
    const res = await POST(
      jsonReq({ badgeId: 'badge-number-navigator', learnerId: '00000000-0000-0000-0000-000000000001', responses: RESPONSES })
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 when the learner belongs to another family', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const otherFamilyId = '00000000-0000-0000-0000-00000000000c';
    await createFamily(db, { id: otherFamilyId, clerkUserId: 'user_other_owner' });
    const otherLearner = await createLearner(db, { familyId: otherFamilyId });

    const res = await POST(
      jsonReq({ badgeId: 'badge-number-navigator', learnerId: otherLearner.id, responses: RESPONSES })
    );
    expect(res.status).toBe(404);

    const awards = await db.select().from(badgeAwards);
    expect(awards).toHaveLength(0);
  });

  it('writes an award + assessment log on the happy path', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });

    const res = await POST(
      jsonReq({ badgeId: 'badge-number-navigator', learnerId: learner.id, responses: RESPONSES })
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { award: { learnerId: string; badgeDefinitionId: string } };
    expect(body.award.learnerId).toBe(learner.id);

    const awards = await db.select().from(badgeAwards).where(eq(badgeAwards.learnerId, learner.id));
    expect(awards).toHaveLength(1);

    const logs = await db
      .select()
      .from(badgeAssessmentLogs)
      .where(eq(badgeAssessmentLogs.learnerId, learner.id));
    expect(logs).toHaveLength(1);
    expect(logs[0].outcome).toBe('awarded');
  });

  it('accepts a real UUID badge definition (skips seed-resolution path)', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
    const badge = await createBadgeDefinition(db, {});

    const res = await POST(
      jsonReq({ badgeId: badge.id, learnerId: learner.id, responses: RESPONSES })
    );
    expect(res.status).toBe(201);

    const awards = await db.select().from(badgeAwards).where(eq(badgeAwards.learnerId, learner.id));
    expect(awards).toHaveLength(1);
    expect(awards[0].badgeDefinitionId).toBe(badge.id);
  });
});
