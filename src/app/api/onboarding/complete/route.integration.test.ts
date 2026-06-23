/**
 * Integration test for /api/onboarding/complete — the state/territory gate.
 *
 * getJurisdiction(null) silently defaults to QLD, so finishing onboarding
 * without a state would leave a family on a hidden QLD assumption. The route
 * refuses to mark onboarding complete until familySettings.state is set.
 */
import { describe, it, expect } from 'vitest';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily } from '@/test/db-factories';
import { families, familySettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { POST } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

describe('POST /api/onboarding/complete — state gate', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('400s when no state is set, and leaves onboarding incomplete', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID, onboardingComplete: false });

    const res = await POST();
    expect(res.status).toBe(400);

    const row = await db.query.families.findFirst({ where: eq(families.id, TEST_FAMILY_ID) });
    expect(row?.onboardingComplete).toBe(false);
  });

  it('completes onboarding once a state is set', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID, onboardingComplete: false });
    await db.insert(familySettings).values({ familyId: TEST_FAMILY_ID, state: 'QLD' });

    const res = await POST();
    expect(res.status).toBe(200);

    const row = await db.query.families.findFirst({ where: eq(families.id, TEST_FAMILY_ID) });
    expect(row?.onboardingComplete).toBe(true);
  });
});
