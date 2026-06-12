/**
 * Integration test for GET /api/report/coverage (WS-5 transposer v0).
 *
 * Real Postgres (rolled back per test) for learner / settings / dlo-status
 * rows; Sanity is mocked so we can hand it fixture DLO→framework mappings.
 * The load-bearing assertions: same history → deep-equal coverage twice
 * (determinism), and zero authored mappings for the family's framework →
 * `{ mode: 'fallback' }` (legacy path untouched).
 *
 * Mock pattern follows snapshot/next/route.integration.test.ts.
 */

const mocks = vi.hoisted(() => ({
  sanityFetch: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/sanity/client', () => ({
  sanityClient: { fetch: mocks.sanityFetch },
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { asSignedOut, asUser } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { learnerDloStatus } from '@/lib/db/schema';
import { createFamily, createLearner } from '@/test/db-factories';
import { GET } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

function req(qs = '') {
  return new NextRequest(`http://x/api/report/coverage${qs}`);
}

// DLO_MAPPINGS_QUERY shape: one row per published DLO.
const QLD_FIXTURE = [
  {
    _id: 'dlo.L3.developing',
    tier: 'developing',
    threadRef: 'capabilityThread.L3',
    regulatoryMappings: [
      {
        frameworkKey: 'ac-v9-qld',
        frameworkVersion: '9.0',
        codes: ['AC9E2LY05'],
        reportTier: 'cd_level',
        contribution: 'primary',
        evidenceWeight: 1,
      },
    ],
  },
  {
    _id: 'dlo.M1.demonstrating',
    tier: 'demonstrating',
    threadRef: 'capabilityThread.M1',
    regulatoryMappings: [
      {
        frameworkKey: 'ac-v9-qld',
        frameworkVersion: '9.0',
        codes: ['AC9M3N01'],
        reportTier: 'cd_level',
        contribution: 'primary',
        evidenceWeight: 1,
      },
    ],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sanityFetch.mockResolvedValue([]);
});

describe('GET /api/report/coverage — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(req('?learnerId=00000000-0000-0000-0000-000000000001'));
    expect(res.status).toBe(401);
  });

  it('returns 400 when learnerId is missing', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const res = await GET(req(''));
    expect(res.status).toBe(400);
  });

  it('returns 404 when the learner belongs to another family', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const otherFamilyId = '00000000-0000-0000-0000-00000000000d';
    await createFamily(db, { id: otherFamilyId, clerkUserId: 'user_other_owner' });
    const otherLearner = await createLearner(db, { familyId: otherFamilyId });

    const res = await GET(req(`?learnerId=${otherLearner.id}`));
    expect(res.status).toBe(404);
  });

  it('is deterministic: same history → deep-equal coverage twice', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
    await db.insert(learnerDloStatus).values([
      { learnerId: learner.id, dloId: 'dlo.L3.developing', status: 'developing' },
      { learnerId: learner.id, dloId: 'dlo.M1.demonstrating', status: 'demonstrating' },
    ]);
    mocks.sanityFetch.mockResolvedValue(QLD_FIXTURE);

    const res1 = await GET(req(`?learnerId=${learner.id}`));
    const res2 = await GET(req(`?learnerId=${learner.id}`));
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const body1 = await res1.json();
    const body2 = await res2.json();

    expect(body1.mode).toBe('deterministic');
    expect(body1.coverage.english.codes).toEqual(['AC9E2LY05']);
    expect(body1.coverage.mathematics.codes).toEqual(['AC9M3N01']);
    expect(body1.coverage.english.weightedScore).toBe(0.5); // developing × 1.0
    expect(body1.coverage.mathematics.weightedScore).toBe(1); // demonstrating × 1.0

    // The determinism contract: byte-identical on a second call.
    expect(body2).toEqual(body1);
    expect(JSON.stringify(body2)).toBe(JSON.stringify(body1));
  });

  it('returns fallback (legacy shape untouched) when the framework has no mappings', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
    await db.insert(learnerDloStatus).values([
      { learnerId: learner.id, dloId: 'dlo.L3.developing', status: 'developing' },
    ]);
    // Mappings exist, but for a DIFFERENT framework — family defaults to QLD.
    mocks.sanityFetch.mockResolvedValue([
      {
        _id: 'dlo.L3.developing',
        tier: 'developing',
        threadRef: 'capabilityThread.L3',
        regulatoryMappings: [
          {
            frameworkKey: 'ac-v9-nsw',
            frameworkVersion: '9.0',
            codes: ['AC9E2LY05'],
            reportTier: 'cd_level',
            contribution: 'primary',
            evidenceWeight: 1,
          },
        ],
      },
    ]);

    const res = await GET(req(`?learnerId=${learner.id}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ mode: 'fallback' });
  });
});
