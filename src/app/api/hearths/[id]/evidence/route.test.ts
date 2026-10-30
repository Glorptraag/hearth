// Unit tests for the Hearth session-photo read proxy: it must refuse before
// touching membership or storage for any ref outside this hearth, and stream
// only after membership + consent pass. Ref parsing is covered exhaustively in
// src/lib/hearth-evidence.test.ts; membership + consent against real Postgres in
// route.integration.test.ts.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { canViewHearthEvidencePath, requireHearthMember } from '@/lib/auth/hearth-helpers';
import { GET } from './route';

vi.mock('@/lib/auth/hearth-helpers', () => ({
  requireHearthMember: vi.fn(),
  canViewHearthEvidencePath: vi.fn(),
}));

const H = '11111111-1111-4111-8111-111111111111';
const OTHER_H = '55555555-5555-4555-8555-555555555555';
const S = '22222222-2222-4222-8222-222222222222';
const F = '33333333-3333-4333-8333-333333333333';
const REF = `hearth-evidence/${H}/${S}/${F}/1729-abc.jpg`;

function req(ref?: string) {
  const url =
    ref != null
      ? `http://localhost/api/hearths/${H}/evidence?ref=${encodeURIComponent(ref)}`
      : `http://localhost/api/hearths/${H}/evidence`;
  return new Request(url) as unknown as Parameters<typeof GET>[0];
}

const ctx = { params: Promise.resolve({ id: H }) };

function fakeStream() {
  return new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new Uint8Array([1, 2, 3]));
      c.close();
    },
  });
}

beforeEach(() => {
  asUser({ userId: 'user_1' });
  vi.mocked(requireHearthMember).mockResolvedValue({ family: { id: F }, membership: {} } as never);
  vi.mocked(canViewHearthEvidencePath).mockResolvedValue(true);
  process.env.BLOB_READ_WRITE_TOKEN = 'test_token';
});

describe('GET /api/hearths/[id]/evidence (session photo proxy)', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(req(REF), ctx);
    expect(res.status).toBe(401);
    expect(get).not.toHaveBeenCalled();
  });

  it('returns 400 when ref is missing', async () => {
    const res = await GET(req(), ctx);
    expect(res.status).toBe(400);
  });

  it('returns 403 without a membership lookup for a ref scoped to another hearth', async () => {
    const res = await GET(req(`hearth-evidence/${OTHER_H}/${S}/${F}/1.jpg`), ctx);
    expect(res.status).toBe(403);
    expect(requireHearthMember).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it.each([
    ['family evidence', `evidence/${F}/1.jpg`],
    ['traversal', `hearth-evidence/${H}/${S}/${F}/../../x/1.jpg`],
    ['absolute URL', `https://x.public.blob.vercel-storage.com/${REF}`],
  ])('returns 403 for a %s ref', async (_label, ref) => {
    const res = await GET(req(ref), ctx);
    expect(res.status).toBe(403);
    expect(get).not.toHaveBeenCalled();
  });

  it('returns the membership error for a non-member', async () => {
    vi.mocked(requireHearthMember).mockResolvedValue({
      error: NextResponse.json({ error: 'Not a member of this hearth' }, { status: 403 }),
    });
    const res = await GET(req(REF), ctx);
    expect(res.status).toBe(403);
    expect(get).not.toHaveBeenCalled();
  });

  it('returns 404 for a photo the viewer may not see', async () => {
    vi.mocked(canViewHearthEvidencePath).mockResolvedValue(false);
    const res = await GET(req(REF), ctx);
    expect(res.status).toBe(404);
    expect(canViewHearthEvidencePath).toHaveBeenCalledWith(H, REF, F);
    expect(get).not.toHaveBeenCalled();
  });

  it('returns 503 when blob storage is unconfigured', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const res = await GET(req(REF), ctx);
    expect(res.status).toBe(503);
  });

  it('streams via private access only, with private no-sniff sandboxed headers', async () => {
    vi.mocked(get).mockResolvedValue({
      statusCode: 200,
      stream: fakeStream(),
      headers: new Headers(),
      blob: { contentType: 'image/jpeg', size: 3 },
    } as never);
    const res = await GET(req(REF), ctx);
    expect(res.status).toBe(200);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(REF, { access: 'private' });
    expect(res.headers.get('Cache-Control')).toMatch(/^private/);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Content-Security-Policy')).toBe('sandbox');
  });

  it('returns 404 when the private blob is missing (no public fallback)', async () => {
    vi.mocked(get).mockResolvedValue(null);
    const res = await GET(req(REF), ctx);
    expect(res.status).toBe(404);
    expect(get).toHaveBeenCalledTimes(1);
  });
});
