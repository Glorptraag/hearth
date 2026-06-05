// Unit tests for the authenticated evidence read proxy. The security-critical
// path-prefix ACL is covered exhaustively in src/lib/evidence.test.ts; here we
// verify the route wires auth → ownership → blob fetch correctly and never
// reaches storage for a request it should refuse.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { get } from '@vercel/blob';
import { GET } from './route';

vi.mock('@/lib/auth/helpers', () => ({
  getFamilyByClerkId: vi.fn(),
}));

function req(ref?: string) {
  const url =
    ref != null
      ? `http://localhost/api/evidence?ref=${encodeURIComponent(ref)}`
      : 'http://localhost/api/evidence';
  return new Request(url) as unknown as Parameters<typeof GET>[0];
}

function fakeStream() {
  return new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new Uint8Array([1, 2, 3]));
      c.close();
    },
  });
}

beforeEach(() => {
  asUser({ userId: 'user_1', familyId: 'fam_1' });
  vi.mocked(getFamilyByClerkId).mockResolvedValue({ id: 'fam_1' } as never);
  process.env.BLOB_READ_WRITE_TOKEN = 'test_token';
});

describe('GET /api/evidence (authenticated photo proxy)', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(req('evidence/fam_1/1.jpg'));
    expect(res.status).toBe(401);
    expect(get).not.toHaveBeenCalled();
  });

  it('returns 400 when ref is missing', async () => {
    const res = await GET(req());
    expect(res.status).toBe(400);
    expect(get).not.toHaveBeenCalled();
  });

  it("returns 403 (and never touches storage) for another family's ref", async () => {
    const res = await GET(req('evidence/fam_2/1.jpg'));
    expect(res.status).toBe(403);
    expect(get).not.toHaveBeenCalled();
  });

  it('returns 403 on path traversal', async () => {
    const res = await GET(req('evidence/fam_1/../fam_2/1.jpg'));
    expect(res.status).toBe(403);
    expect(get).not.toHaveBeenCalled();
  });

  it('returns 503 when blob storage is unconfigured', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const res = await GET(req('evidence/fam_1/1.jpg'));
    expect(res.status).toBe(503);
    expect(get).not.toHaveBeenCalled();
  });

  it('streams the blob for the owning family via private access', async () => {
    vi.mocked(get).mockResolvedValue({
      statusCode: 200,
      stream: fakeStream(),
      headers: new Headers(),
      blob: { contentType: 'image/jpeg', size: 3 },
    } as never);
    const res = await GET(req('evidence/fam_1/1.jpg'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
    expect(res.headers.get('cache-control')).toContain('private');
    expect(get).toHaveBeenCalledWith('evidence/fam_1/1.jpg', { access: 'private' });
  });

  it('falls back to public access when private is unavailable', async () => {
    vi.mocked(get)
      .mockRejectedValueOnce(new Error('private not supported'))
      .mockResolvedValueOnce({
        statusCode: 200,
        stream: fakeStream(),
        headers: new Headers(),
        blob: { contentType: 'image/png', size: 3 },
      } as never);
    const res = await GET(req('evidence/fam_1/1.jpg'));
    expect(res.status).toBe(200);
    expect(get).toHaveBeenLastCalledWith('evidence/fam_1/1.jpg', { access: 'public' });
  });

  it('returns 404 when the blob is not found', async () => {
    vi.mocked(get).mockResolvedValue(null as never);
    const res = await GET(req('evidence/fam_1/1.jpg'));
    expect(res.status).toBe(404);
  });
});
