/**
 * Unit test for POST /api/sanity/read — the allowlisted authed read proxy that
 * lets client components run dark-touching GROQ through `sanityServerClient`.
 * Asserts: auth gate, allowlist enforcement (no arbitrary GROQ), and that an
 * allowlisted key runs its registered query with the passed params.
 */
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));

vi.mock('@/lib/sanity/client', () => ({
  sanityServerClient: { fetch: mocks.fetch },
  sanityClient: { fetch: mocks.fetch },
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { CLIENT_READ_QUERIES } from '@/lib/sanity/read-allowlist';
import { POST } from './route';

function req(body: unknown) {
  return new NextRequest('http://x/api/sanity/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetch.mockResolvedValue([{ _id: 'x' }]);
});

describe('POST /api/sanity/read', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST(req({ key: 'allDlos' }));
    expect(res.status).toBe(401);
  });

  it('rejects an unknown query key (no arbitrary GROQ)', async () => {
    asUser({});
    const res = await POST(req({ key: 'not-a-real-key' }));
    expect(res.status).toBe(400);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('rejects a raw GROQ string passed as the key', async () => {
    asUser({});
    const res = await POST(req({ key: '*[_type=="learner"]' }));
    expect(res.status).toBe(400);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('runs the registered query for an allowlisted key with params', async () => {
    asUser({});
    const res = await POST(req({ key: 'overlaysBatch', params: { activityIds: ['a'], framework: 'eclectic' } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ _id: 'x' }]);
    expect(mocks.fetch).toHaveBeenCalledWith(CLIENT_READ_QUERIES.overlaysBatch, {
      activityIds: ['a'],
      framework: 'eclectic',
    });
  });

  it('passes an empty params object when none provided', async () => {
    asUser({});
    await POST(req({ key: 'allDlos' }));
    expect(mocks.fetch).toHaveBeenCalledWith(CLIENT_READ_QUERIES.allDlos, {});
  });
});
