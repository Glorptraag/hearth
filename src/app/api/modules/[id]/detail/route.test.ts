/**
 * Unit test for GET /api/modules/[id]/detail — the authed server proxy that
 * lets the client module page read MODULE_DETAIL_QUERY through the token-bearing
 * `sanityServerClient` (the dotted-id commonsText/asset derefs are dark to the
 * tokenless client in prod). Asserts the auth gate + that it reads via the
 * server client with the module id.
 */
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));

vi.mock('@/lib/sanity/client', () => ({
  // Route reads through the authed server client; back both names with the same
  // mock so the import resolves regardless of which the handler uses.
  sanityServerClient: { fetch: mocks.fetch },
  sanityClient: { fetch: mocks.fetch },
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { GET } from './route';

const MOCK_MODULE = { _id: 'module_1', title: 'Tide Pools', subjects: ['science'] };

function req() {
  return new NextRequest('http://x/api/modules/module_1/detail');
}
function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetch.mockResolvedValue(MOCK_MODULE);
});

describe('GET /api/modules/[id]/detail', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(req(), ctx('module_1'));
    expect(res.status).toBe(401);
  });

  it('returns the module read through the authed server client', async () => {
    asUser({});
    const res = await GET(req(), ctx('module_1'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(MOCK_MODULE);
    // Reads the module-detail projection with the id param.
    expect(mocks.fetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "module"'),
      { id: 'module_1' },
    );
  });

  it('returns null (not 500) when the module is not found', async () => {
    asUser({});
    mocks.fetch.mockResolvedValue(null);
    const res = await GET(req(), ctx('missing'));
    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();
  });
});
