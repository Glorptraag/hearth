/**
 * Integration test for GET /api/snapshot/next.
 *
 * Uses a real Postgres transaction (rolled back after each test) for the
 * family / settings rows. Sanity, thread-cache, and trackServer are mocked —
 * scoring correctness is covered by recommend.test.ts; here we verify
 * auth + response shape + that trackServer fires exactly once per call.
 *
 * Mock pattern follows stripe/webhook/route.test.ts (vi.hoisted so the
 * factory closure can reference the mock fn before vi.mock factories run).
 */

const mocks = vi.hoisted(() => ({
  trackServer: vi.fn().mockResolvedValue(undefined),
  sanityFetch: vi.fn().mockResolvedValue([]),
  getCachedThreads: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock('@/lib/analytics/posthog-server', () => ({
  trackServer: mocks.trackServer,
}));
vi.mock('@/lib/sanity/client', () => ({
  sanityClient: { fetch: mocks.sanityFetch },
}));
vi.mock('@/lib/ai/sanity-thread-cache', () => ({
  getCachedThreads: mocks.getCachedThreads,
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { asSignedOut, asUser } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily } from '@/test/db-factories';
import { GET } from './route';
import type { NextResponseBody } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

function req(qs = '') {
  return new NextRequest(`http://x/api/snapshot/next${qs}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sanityFetch.mockResolvedValue([]);
  mocks.getCachedThreads.mockResolvedValue(new Map());
});

describe('GET /api/snapshot/next — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(mocks.trackServer).not.toHaveBeenCalled();
  });

  it('returns 404 when caller has no family row', async () => {
    asUser({});
    const res = await GET(req());
    expect(res.status).toBe(404);
    expect(mocks.trackServer).not.toHaveBeenCalled();
  });

  it('returns 200 with correct shape and fires trackServer exactly once', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await GET(req('?limit=5'));
    expect(res.status).toBe(200);

    const body = (await res.json()) as NextResponseBody;
    expect(Array.isArray(body.recommendations)).toBe(true);
    expect(typeof body.pedagogyKey).toBe('string');
    expect(typeof body.in_library_count).toBe('number');

    expect(mocks.trackServer).toHaveBeenCalledTimes(1);
    expect(mocks.trackServer).toHaveBeenCalledWith(
      'recommendations_scored',
      TEST_FAMILY_ID,
      expect.objectContaining({
        surface: 'next',
        rec_count: expect.any(Number),
        top_reason: expect.any(String),
      }),
      expect.objectContaining({ familyId: TEST_FAMILY_ID }),
    );
  });
});
