// Unit tests for the native → web sign-in ticket route. The path guard itself
// is covered exhaustively in src/lib/platform/handoff.test.ts; here we verify
// the route refuses everything except a bearer-authenticated, same-origin
// request, and mints the ticket for the caller only.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clerkClient } from '@clerk/nextjs/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { POST } from './route';

const createSignInToken = vi.fn();

function req(body: unknown, { bearer = true }: { bearer?: boolean } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (bearer) headers.Authorization = 'Bearer native_session_token';
  return new Request('http://localhost/api/native/web-session', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  asUser({ userId: 'user_native' });
  createSignInToken.mockReset();
  createSignInToken.mockResolvedValue({ id: 'sit_1', token: 'tok_single_use', userId: 'user_native' });
  vi.mocked(clerkClient).mockResolvedValue({ signInTokens: { createSignInToken } } as never);
});

describe('POST /api/native/web-session', () => {
  it('returns a handoff URL carrying the ticket and next', async () => {
    const res = await POST(req({ next: '/planner?week=2' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');

    const { url } = await res.json();
    const parsed = new URL(url, 'https://www.hearth-lms.com');
    expect(parsed.pathname).toBe('/native/handoff');
    expect(parsed.searchParams.get('ticket')).toBe('tok_single_use');
    expect(parsed.searchParams.get('next')).toBe('/planner?week=2');
  });

  it('mints a short-lived ticket for the signed-in caller only', async () => {
    await POST(req({ next: '/dashboard' }));
    expect(createSignInToken).toHaveBeenCalledWith({ userId: 'user_native', expiresInSeconds: 60 });
  });

  it('refuses cookie-only (browser) requests without a bearer token', async () => {
    const res = await POST(req({ next: '/dashboard' }, { bearer: false }));
    expect(res.status).toBe(401);
    expect(createSignInToken).not.toHaveBeenCalled();
  });

  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST(req({ next: '/dashboard' }));
    expect(res.status).toBe(401);
    expect(createSignInToken).not.toHaveBeenCalled();
  });

  it.each(['https://evil.example', '//evil.example', '/sign-in', ''])(
    'rejects unsafe next %j without minting a ticket',
    async (next) => {
      const res = await POST(req({ next }));
      expect(res.status).toBe(400);
      expect(createSignInToken).not.toHaveBeenCalled();
    },
  );

  it('rejects a body without next', async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
    expect(createSignInToken).not.toHaveBeenCalled();
  });
});
