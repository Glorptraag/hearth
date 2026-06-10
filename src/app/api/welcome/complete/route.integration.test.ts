/**
 * Regression tests for research log R1 — the one user-facing defect of the
 * 2026-04-25 pilot: onboarding silently committed the Clerk surname as the
 * family name ("Douglas" instead of "Douglas Family"), and a fresh family
 * could be born as literal "My Family" even when Clerk knew the surname.
 *
 * Contract under test (fix branch claude/fix-lastname-persistence-BXFXU):
 *  - a NEW family row is born `${lastName} Family`, derived from Clerk
 *  - no Clerk surname → honest "My Family" fallback
 *  - an EXISTING family's name is never overwritten by the Clerk surname —
 *    a parent's explicit choice survives repeat welcome/complete calls
 *
 * Closes coverage-gap matrix row 1 in docs/hearth-research-log.md.
 */
import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { families } from '@/lib/db/schema';
import { createFamily } from '@/test/db-factories';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';
import { POST } from './route';

async function familyRow() {
  return db.query.families.findFirst({ where: eq(families.clerkUserId, TEST_USER_ID) });
}

describe('POST /api/welcome/complete — R1 family-name regression (real DB)', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('creates a new family as "<Surname> Family", derived from Clerk', async () => {
    asUser({ lastName: 'Douglas' });
    const res = await POST();
    expect(res.status).toBe(200);

    const row = await familyRow();
    expect(row?.familyName).toBe('Douglas Family');
    expect(row?.welcomeCompletedAt).not.toBeNull();
  });

  it('falls back to "My Family" when the Clerk account has no surname', async () => {
    asUser({ lastName: null });
    const res = await POST();
    expect(res.status).toBe(200);

    const row = await familyRow();
    expect(row?.familyName).toBe('My Family');
  });

  it('treats a whitespace-only surname as absent', async () => {
    asUser({ lastName: '   ' });
    await POST();
    const row = await familyRow();
    expect(row?.familyName).toBe('My Family');
  });

  it('never overwrites an existing family name with the Clerk surname', async () => {
    // The parent explicitly chose this name during onboarding.
    asUser({ lastName: 'Douglas' });
    await createFamily(db, {
      id: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      familyName: 'The Hearthside Crew',
    });

    const res = await POST();
    expect(res.status).toBe(200);

    const row = await familyRow();
    expect(row?.familyName).toBe('The Hearthside Crew');
    expect(row?.welcomeCompletedAt).not.toBeNull();
  });
});
