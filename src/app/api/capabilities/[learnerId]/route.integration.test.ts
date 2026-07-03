/**
 * Integration test for GET /api/capabilities/[learnerId] — proves the
 * constellation payload assembly reads the per-child snapshot slice and that
 * alpha-suppressed threads (capability-alpha-suppression.ts) are filtered at
 * the read seam even when a STALE snapshot still carries them. This is the
 * defence-in-depth half of the H6 suppression contract; the pure seams are
 * pinned in src/lib/capability-alpha-suppression.test.ts.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createSnapshot } from '@/test/db-factories';
import { GET } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

function getReq(url: string) {
  return new NextRequest(url);
}

describe('GET /api/capabilities/[learnerId] — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(getReq('http://x/api/capabilities/some-learner'), {
      params: Promise.resolve({ learnerId: 'some-learner' }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 404 for a learner belonging to another family', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const other = await createFamily(db, { id: crypto.randomUUID(), clerkUserId: 'user-other' });
    const otherLearner = await createLearner(db, { familyId: other.id, name: 'X' });

    const res = await GET(getReq(`http://x/api/capabilities/${otherLearner.id}`), {
      params: Promise.resolve({ learnerId: otherLearner.id }),
    });
    expect(res.status).toBe(404);
  });

  it('returns empty shapes when no snapshot exists', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Sage' });

    const res = await GET(getReq(`http://x/api/capabilities/${learner.id}`), {
      params: Promise.resolve({ learnerId: learner.id }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activeThreads).toEqual([]);
    expect(body.dloStatus).toEqual({});
  });

  it('serves the per-child slice and filters alpha-suppressed threads from a stale snapshot', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Sage' });

    // A snapshot built BEFORE suppression landed: H6 present everywhere.
    await createSnapshot(db, {
      familyId: TEST_FAMILY_ID,
      snapshotData: {
        children: {
          [learner.id]: {
            active_threads: [
              { thread_id: 'H6', thread_name: 'First Nations Australian Perspectives', observation_count: 3 },
              { thread_id: 'L3', thread_name: 'Reading Comprehension', observation_count: 5 },
            ],
            dlo_status: {
              'dlo.H6.emerging': { status: 'emerging', confidence: 0.8, last_observed_at: null },
              'dlo.L3.emerging': { status: 'emerging', confidence: 0.7, last_observed_at: null },
            },
            gap_analysis: {
              underserved_subjects: ['science'],
              suggested_focus_threads: ['H6', 'M1'],
            },
            curriculum_coverage: { english: { total_entries: 2 } },
          },
        },
      },
    });

    const res = await GET(getReq(`http://x/api/capabilities/${learner.id}`), {
      params: Promise.resolve({ learnerId: learner.id }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.activeThreads.map((t: { thread_id: string }) => t.thread_id)).toEqual(['L3']);
    expect(Object.keys(body.dloStatus)).toEqual(['dlo.L3.emerging']);
    expect(body.gapAnalysis.suggested_focus_threads).toEqual(['M1']);
    // Non-thread fields pass through untouched.
    expect(body.gapAnalysis.underserved_subjects).toEqual(['science']);
    expect(body.curriculumCoverage.english.total_entries).toBe(2);
  });
});
