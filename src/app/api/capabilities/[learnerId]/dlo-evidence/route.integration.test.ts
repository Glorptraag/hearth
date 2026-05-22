/**
 * Integration test for GET /api/capabilities/[learnerId]/dlo-evidence —
 * proves the constellation Level-4 query joins observation_dlo_links to
 * learning_entries correctly, filters by learner + dlo, respects family
 * isolation, and orders newest-first.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { observationDloLinks } from '@/lib/db/schema';
import { GET } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../../vitest.setup';

function getReq(url: string) {
  return new NextRequest(url);
}

async function seedLink(opts: {
  learnerId: string;
  entryId: string;
  dloId: string;
  tier: 'emerging' | 'developing' | 'demonstrating';
  confidence: number;
  rationale: string;
}) {
  await db.insert(observationDloLinks).values({
    observationId: opts.entryId,
    learnerId: opts.learnerId,
    dloId: opts.dloId,
    tier: opts.tier,
    confidence: String(opts.confidence),
    rationale: opts.rationale,
  });
}

describe('GET /api/capabilities/[learnerId]/dlo-evidence — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(
      getReq('http://x/api/capabilities/some-learner/dlo-evidence?dloId=dlo-x'),
      { params: Promise.resolve({ learnerId: 'some-learner' }) },
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 when dloId is missing', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'A' });
    const res = await GET(
      getReq(`http://x/api/capabilities/${learner.id}/dlo-evidence`),
      { params: Promise.resolve({ learnerId: learner.id }) },
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when the learner belongs to another family', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const other = await createFamily(db, { id: crypto.randomUUID(), clerkUserId: 'user-other' });
    const otherLearner = await createLearner(db, { familyId: other.id, name: 'X' });

    const res = await GET(
      getReq(`http://x/api/capabilities/${otherLearner.id}/dlo-evidence?dloId=dlo-x`),
      { params: Promise.resolve({ learnerId: otherLearner.id }) },
    );
    expect(res.status).toBe(404);
  });

  it('returns the evidence rows for the requested (learner, dlo) pair, newest first', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Sage' });

    const oldEntry = await createEntry(db, {
      familyId: TEST_FAMILY_ID, title: 'Older moment', dateOccurred: '2026-01-10',
    });
    const newEntry = await createEntry(db, {
      familyId: TEST_FAMILY_ID, title: 'Newer moment', dateOccurred: '2026-04-22',
    });
    // An unrelated entry on a different dlo — must NOT appear in results
    const unrelatedEntry = await createEntry(db, {
      familyId: TEST_FAMILY_ID, title: 'Different DLO', dateOccurred: '2026-05-01',
    });

    await seedLink({ learnerId: learner.id, entryId: oldEntry.id,       dloId: 'dlo-target', tier: 'emerging',      confidence: 0.62, rationale: 'First emergence' });
    await seedLink({ learnerId: learner.id, entryId: newEntry.id,       dloId: 'dlo-target', tier: 'demonstrating', confidence: 0.88, rationale: 'Solid demo' });
    await seedLink({ learnerId: learner.id, entryId: unrelatedEntry.id, dloId: 'dlo-other',  tier: 'developing',    confidence: 0.71, rationale: 'Different DLO' });

    const res = await GET(
      getReq(`http://x/api/capabilities/${learner.id}/dlo-evidence?dloId=dlo-target`),
      { params: Promise.resolve({ learnerId: learner.id }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.evidence).toHaveLength(2);
    expect(body.evidence[0].title).toBe('Newer moment');
    expect(body.evidence[0].tier).toBe('demonstrating');
    expect(body.evidence[0].confidence).toBeCloseTo(0.88);
    expect(body.evidence[0].rationale).toBe('Solid demo');
    expect(body.evidence[1].title).toBe('Older moment');
  });

  it('returns an empty evidence array for a dlo with no links', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Quiet' });

    const res = await GET(
      getReq(`http://x/api/capabilities/${learner.id}/dlo-evidence?dloId=dlo-never-seen`),
      { params: Promise.resolve({ learnerId: learner.id }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.evidence).toEqual([]);
  });
});
