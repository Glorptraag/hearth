/**
 * Integration test for /api/marketplace/search.
 *
 * The Sanity client is mocked via vitest.setup so we verify auth + the
 * route's request-shape contract (auth + token parsing + response shape)
 * rather than search relevance, which is owned by Sanity at runtime.
 *
 * Task 6.6.
 */
import { describe, it, expect, vi, type Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { asSignedOut, asUser } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily } from '@/test/db-factories';
import { GET } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

vi.mock('@/lib/sanity/client', () => ({
  sanityClient: {
    fetch: vi.fn(async () => []),
  },
}));

function req(qs: string) {
  return new NextRequest(`http://x/api/marketplace/search${qs}`);
}

describe('GET /api/marketplace/search', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(req('?q=magnet'));
    expect(res.status).toBe(401);
  });

  it('returns 404 when caller has no family row', async () => {
    asUser({});
    const res = await GET(req('?q=magnet'));
    expect(res.status).toBe(404);
  });

  it('returns empty hits when query is missing', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const res = await GET(req(''));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { hits: unknown[] };
    expect(body.hits).toEqual([]);
  });

  it('returns empty hits when query has no meaningful tokens', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const res = await GET(req('?q=a%20!!'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { hits: unknown[]; query: string };
    expect(body.hits).toEqual([]);
    expect(body.query).toBe('a !!');
  });

  it('echoes query and returns hits in pack→module order', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const { sanityClient } = await import('@/lib/sanity/client');
    // sanityClient.fetch is a typed overload; the bare Mock cast lets the
    // resolved-value helpers accept plain GROQ result arrays in this test.
    const fetchMock = sanityClient.fetch as unknown as Mock;
    fetchMock
      .mockResolvedValueOnce([
        {
          _id: 'pack-1',
          title: 'Magnet Pack',
          subjects: ['science'],
          description: 'All about magnets',
          availability: 'included',
        },
      ])
      .mockResolvedValueOnce([
        {
          _id: 'mod-1',
          title: 'Magnet Lab',
          subjects: ['science'],
          targetUnderstanding: 'How magnets work',
          availability: null,
        },
      ]);

    const res = await GET(req('?q=magnet'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      query: string;
      hits: Array<{ kind: string; id: string; title: string }>;
    };
    expect(body.query).toBe('magnet');
    expect(body.hits).toHaveLength(2);
    expect(body.hits[0].kind).toBe('pack');
    expect(body.hits[0].id).toBe('pack-1');
    expect(body.hits[1].kind).toBe('module');
    expect(body.hits[1].id).toBe('mod-1');
  });
});
