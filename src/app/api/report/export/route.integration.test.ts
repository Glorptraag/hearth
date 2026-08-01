/**
 * Integration test for /api/report/export — exercises auth → learner
 * scoping → jsPDF rendering against a real Neon test branch. PDF body
 * contents are not asserted (too fragile); we verify status, headers,
 * and that a non-empty PDF was produced.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { familySettings } from '@/lib/db/schema';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { GET } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

function getReq(query: string) {
  return new NextRequest(`http://x/api/report/export${query}`);
}

describe('GET /api/report/export — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(getReq('?learnerId=00000000-0000-0000-0000-000000000001'));
    expect(res.status).toBe(401);
  });

  it('returns 404 when the caller has no family row', async () => {
    asUser({});
    const res = await GET(getReq('?learnerId=00000000-0000-0000-0000-000000000001'));
    expect(res.status).toBe(404);
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

    const otherFamilyId = '00000000-0000-0000-0000-00000000000d';
    await createFamily(db, { id: otherFamilyId, clerkUserId: 'user_other_owner' });
    const otherLearner = await createLearner(db, { familyId: otherFamilyId });

    const res = await GET(getReq(`?learnerId=${otherLearner.id}`));
    expect(res.status).toBe(404);
  });

  it('renders a non-empty PDF for the caller’s learner', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
    await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      title: 'Magnetic circuit',
      status: 'complete',
      subjects: ['science'],
    });

    const res = await GET(getReq(`?learnerId=${learner.id}`));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
    expect(res.headers.get('Content-Disposition')).toContain('.pdf');

    const body = await res.arrayBuffer();
    expect(body.byteLength).toBeGreaterThan(0);
    // First 4 bytes of any valid PDF are %PDF.
    expect(new TextDecoder().decode(body.slice(0, 4))).toBe('%PDF');
  });

  // jsPDF's default output is uncompressed, so the literal text drawn via
  // doc.text()/autoTable() shows up verbatim in the raw PDF bytes as
  // latin1-decoded `(...) Tj` operators. That lets us assert on the tier
  // framing without a PDF-parsing dependency — see route.ts's cd_level vs.
  // learning_area branches for the exact strings below.
  it('renders the softer "learning areas" framing for a learning_area-tier family (NSW/VIC/WA/TAS/ACT), never the cd_level compliance framing', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await db.insert(familySettings).values({ familyId: TEST_FAMILY_ID, state: 'NSW' });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
    await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      title: 'Tide pool survey',
      status: 'complete',
      subjects: ['science'],
    });

    const res = await GET(getReq(`?learnerId=${learner.id}`));
    expect(res.status).toBe(200);

    const body = await res.arrayBuffer();
    const text = Buffer.from(body).toString('latin1');

    // learning_area-tier framing: soft "Learning Areas" summary + a per-area
    // entry portfolio table (unique to this tier).
    expect(text).toContain('Learning Summary');
    expect(text).toContain('Learning Areas Covered');
    expect(text).toContain('Curriculum Links');
    expect(text).toContain('Entry Title');

    // The cd_level compliance framing (required-work-samples table, formal
    // "Compliance Status") must never render for this tier.
    expect(text).not.toContain('Compliance Status');
    expect(text).not.toContain('Required Work Samples');
    expect(text).not.toContain('Curriculum outcomes');
  });

  it('renders the age line gracefully (omits it, never a bogus value) when the learner has no dateOfBirth', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, dateOfBirth: null });
    await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      title: 'Puzzle time',
      status: 'complete',
      subjects: ['mathematics'],
    });

    const res = await GET(getReq(`?learnerId=${learner.id}`));
    expect(res.status).toBe(200);

    const body = await res.arrayBuffer();
    expect(body.byteLength).toBeGreaterThan(0);
    expect(new TextDecoder().decode(body.slice(0, 4))).toBe('%PDF');

    const text = Buffer.from(body).toString('latin1');
    // No age line renders at all when dateOfBirth is null — never a bogus
    // "Age: null years" / "Age: NaN years" string leaking into the PDF.
    expect(text).not.toMatch(/Age: (null|undefined|NaN)/);
    expect(text).toContain(`Name: ${learner.name}`);
  });
});
