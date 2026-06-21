// Unit tests for the authenticated transcription proxy. Verifies the route
// wires auth → write-permission → rate-limit → body guards → Deepgram correctly
// and never reaches the (metered) transcriber on a request it should refuse.
// The Deepgram client itself is covered in src/lib/ai/transcribe.test.ts.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { getFamilyByClerkId, checkWritePermission } from '@/lib/auth/helpers';
import { transcribeAudio } from '@/lib/ai/transcribe';
import { rateLimit } from '@/lib/rate-limit';
import { POST } from './route';

vi.mock('@/lib/auth/helpers', () => ({
  getFamilyByClerkId: vi.fn(),
  checkWritePermission: vi.fn(),
}));

// Mock the Deepgram client AND shrink the size cap so the 413 path is testable
// without constructing a 25MB body.
vi.mock('@/lib/ai/transcribe', () => ({
  transcribeAudio: vi.fn(),
  TRANSCRIBE_MAX_BYTES: 8,
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 19 })),
}));

function audioReq(
  opts: { contentType?: string | null; body?: BodyInit } = {},
) {
  const headers = new Headers();
  if (opts.contentType !== null) headers.set('content-type', opts.contentType ?? 'audio/webm');
  const init: RequestInit = { method: 'POST', headers };
  if (opts.body !== undefined) init.body = opts.body;
  return new Request('http://localhost/api/transcribe', init) as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  asUser({ userId: 'user_1', familyId: 'fam_1' });
  vi.mocked(getFamilyByClerkId).mockResolvedValue({ id: 'fam_1' } as never);
  vi.mocked(checkWritePermission).mockResolvedValue({ allowed: true });
  vi.mocked(rateLimit).mockReturnValue({ success: true, remaining: 19 });
  vi.mocked(transcribeAudio).mockResolvedValue({ transcript: 'hello there.', model: 'nova-2' });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/transcribe', () => {
  it('returns 401 when signed out, and never transcribes', async () => {
    asSignedOut();
    const res = await POST(audioReq({ body: new Uint8Array([1, 2, 3, 4]) }));
    expect(res.status).toBe(401);
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it('returns 403 for a read-only viewer (no Deepgram spend)', async () => {
    vi.mocked(checkWritePermission).mockResolvedValue({ allowed: false, statusCode: 403 });
    const res = await POST(audioReq({ body: new Uint8Array([1, 2, 3, 4]) }));
    expect(res.status).toBe(403);
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it('returns 429 when rate-limited, and never transcribes', async () => {
    vi.mocked(rateLimit).mockReturnValueOnce({ success: false, remaining: 0 });
    const res = await POST(audioReq({ body: new Uint8Array([1, 2, 3, 4]) }));
    expect(res.status).toBe(429);
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it('returns 415 for a non-audio Content-Type', async () => {
    const res = await POST(audioReq({ contentType: 'application/json', body: new Uint8Array([1]) }));
    expect(res.status).toBe(415);
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it('returns 400 for an empty body', async () => {
    const res = await POST(audioReq());
    expect(res.status).toBe(400);
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it('returns 413 for an oversized clip', async () => {
    const res = await POST(audioReq({ body: new Uint8Array(16) }));
    expect(res.status).toBe(413);
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it('returns 200 with the transcript on the happy path', async () => {
    const res = await POST(audioReq({ contentType: 'audio/webm', body: new Uint8Array([1, 2, 3, 4]) }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ transcript: 'hello there.' });
    expect(transcribeAudio).toHaveBeenCalledTimes(1);
    expect(transcribeAudio).toHaveBeenCalledWith(expect.anything(), { contentType: 'audio/webm' });
  });

  it('maps a Deepgram failure to a clean 502 (never a 500)', async () => {
    vi.mocked(transcribeAudio).mockRejectedValue(new Error('deepgram down'));
    const res = await POST(audioReq({ body: new Uint8Array([1, 2, 3, 4]) }));
    expect(res.status).toBe(502);
  });
});
