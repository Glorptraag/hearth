/**
 * Integration test for /api/portfolio/export — auth → learner scoping →
 * jsPDF rendering against a real DB. PDF body contents are not asserted (too
 * fragile); we verify status, headers, and that a non-empty %PDF was produced.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { GET } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

function getReq(query: string) {
  return new NextRequest(`http://x/api/portfolio/export${query}`);
}

describe('GET /api/portfolio/export — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(getReq('?learnerId=00000000-0000-0000-0000-000000000001'));
    expect(res.status).toBe(401);
  });

  it('returns 400 when learnerId param is missing', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const res = await GET(getReq(''));
    expect(res.status).toBe(400);
  });

  it('returns 404 when learnerId belongs to another family', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const otherFamilyId = '00000000-0000-0000-0000-00000000000e';
    await createFamily(db, { id: otherFamilyId, clerkUserId: 'user_other_owner' });
    const otherLearner = await createLearner(db, { familyId: otherFamilyId });

    const res = await GET(getReq(`?learnerId=${otherLearner.id}`));
    expect(res.status).toBe(404);
  });

  it('renders a non-empty PDF grouped by thread for the caller’s learner', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
    await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      title: 'Tide pools',
      status: 'complete',
      subjects: ['science'],
      aiEnrichment: { status: 'enriched', capability_threads: [{ thread_id: 'S1', confidence: 0.9 }] },
    });

    const res = await GET(getReq(`?learnerId=${learner.id}`));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
    expect(res.headers.get('Content-Disposition')).toContain('.pdf');

    const body = await res.arrayBuffer();
    expect(body.byteLength).toBeGreaterThan(0);
    expect(new TextDecoder().decode(body.slice(0, 4))).toBe('%PDF');
  });

  it('still renders a (valid) PDF when the learner has no complete entries', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });

    const res = await GET(getReq(`?learnerId=${learner.id}`));
    expect(res.status).toBe(200);
    const body = await res.arrayBuffer();
    expect(new TextDecoder().decode(body.slice(0, 4))).toBe('%PDF');
  });
});
