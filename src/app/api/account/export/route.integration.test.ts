/**
 * Integration test for /api/account/export — exercises auth → multi-table
 * gather against a real Neon test branch. Family isolation is the
 * load-bearing case: another family's data must never appear in the
 * caller's export.
 */
import { describe, it, expect } from 'vitest';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import {
  createFamily,
  createLearner,
  createEntry,
  createFacilitatorNote,
} from '@/test/db-factories';
import { GET } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

describe('GET /api/account/export — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 404 when the caller has no family row', async () => {
    asUser({});
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('returns the caller’s family payload only, never another family’s', async () => {
    asUser({});
    await createFamily(db, {
      id: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      familyName: 'Alpha Family',
    });
    const learnerA = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Emma' });
    await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learnerA.id],
      title: 'A — visible',
    });

    const otherFamilyId = '00000000-0000-0000-0000-00000000000e';
    await createFamily(db, {
      id: otherFamilyId,
      clerkUserId: 'user_other_owner',
      familyName: 'Beta Family',
    });
    const learnerB = await createLearner(db, { familyId: otherFamilyId, name: 'Liam' });
    await createEntry(db, {
      familyId: otherFamilyId,
      learnerIds: [learnerB.id],
      title: 'B — hidden',
    });

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('Content-Disposition')).toContain('attachment');

    const body = (await res.json()) as {
      family: { name: string };
      learners: Array<{ id: string; name: string }>;
      learningEntries: Array<{ title: string }>;
    };
    expect(body.family.name).toBe('Alpha Family');
    expect(body.learners.map((l) => l.name)).toEqual(['Emma']);
    expect(body.learningEntries.map((e) => e.title)).toContain('A — visible');
    expect(body.learningEntries.map((e) => e.title)).not.toContain('B — hidden');
  });

  it('never includes facilitator private notes (E19: excluded from all exports)', async () => {
    asUser({});
    await createFamily(db, {
      id: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      familyName: 'Alpha Family',
    });
    const learner = await createLearner(db, {
      familyId: TEST_FAMILY_ID,
      name: 'Emma',
      // The other private-note surface: the JSON sub-field the profile UI writes.
      profileData: { facilitatorNotes: 'SECRET-PROFILE-NOTE-do-not-export' },
    });
    const SECRET = 'SECRET-FACILITATOR-NOTE-do-not-export';
    await createFacilitatorNote(db, { familyId: TEST_FAMILY_ID, learnerId: learner.id, noteText: SECRET });

    const res = await GET();
    expect(res.status).toBe(200);

    const text = await res.text();
    // The raw download must not carry either private-note surface, in plaintext
    // OR ciphertext (the facilitator_notes table is encrypted at rest).
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain('SECRET-PROFILE-NOTE-do-not-export');
    expect(text).not.toContain('noteText');
    expect(text).not.toContain('facilitatorNotes');

    const body = JSON.parse(text) as {
      facilitatorNotes?: unknown;
      learners: Array<{ profileData: Record<string, unknown> }>;
    };
    expect(body.facilitatorNotes).toBeUndefined();
    expect(body.learners[0].profileData).not.toHaveProperty('facilitatorNotes');
  });
});
