import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// api-helpers transitively imports auth/helpers → @/lib/db which evaluates
// `neon(process.env.DATABASE_URL!)` at module load. Stub to keep this test
// isolated to the wrapper itself.
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/db/schema', () => ({}));
vi.mock('@/lib/auth/helpers', () => ({
  getFamilyByClerkId: vi.fn(),
  checkWritePermission: vi.fn(),
}));
// Sentry's real `await import(...)` resolves to a heavy module that takes
// several seconds to evaluate in jsdom, blowing the per-test timeout for any
// test that exercises the catch path. The wrapper's own try/catch already
// makes Sentry optional — mock it so observability cost stays out of the test
// loop without changing the production path.
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

import { routeHandler } from './api-helpers';

describe('routeHandler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('passes a healthy NextResponse through unchanged', async () => {
    const inner = vi.fn(async () =>
      NextResponse.json({ ok: true }, { status: 200 })
    );
    const wrapped = routeHandler(inner, { route: 'GET /test' });

    const res = await wrapped();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(inner).toHaveBeenCalledOnce();
  });

  it('converts a thrown error into a JSON-500 (incident 2026-05-25)', async () => {
    // Silence the error log so vitest output stays clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const inner = vi.fn(async () => {
      throw new Error('boom — missing column work_sample_quality');
    });
    const wrapped = routeHandler(inner, { route: 'GET /api/learners' });

    const res = await wrapped();

    expect(res.status).toBe(500);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect(await res.json()).toEqual({ error: 'Internal Server Error' });
  });

  it('treats an undefined return as a JSON-500 (handler bug)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const inner = vi.fn(async () => undefined);
    const wrapped = routeHandler(inner, { route: 'GET /test' });

    const res = await wrapped();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Internal Server Error' });
  });

  it('forwards multiple args (request + ctx) to the inner handler', async () => {
    const inner = vi.fn(async (req: { url: string }, ctx: { id: string }) =>
      NextResponse.json({ url: req.url, id: ctx.id })
    );
    const wrapped = routeHandler(inner, { route: 'GET /api/x/[id]' });

    const res = await wrapped({ url: '/api/x/abc' }, { id: 'abc' });

    expect(await res.json()).toEqual({ url: '/api/x/abc', id: 'abc' });
  });

  it('tags ConfigError distinctly in console + still returns JSON-500', async () => {
    // We can't easily spy on the dynamically-imported Sentry mock without
    // restructuring the wrapper. Asserting the console log carries the
    // 'config' kind is enough to prove the branch is taken — Sentry tagging
    // reads from the same conditional in the source.
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    class ConfigError extends Error {
      readonly code = 'CONFIG_ERROR';
      constructor(message: string) {
        super(message);
        this.name = 'ConfigError';
      }
    }

    const inner = vi.fn(async () => {
      throw new ConfigError('DATABASE_URL is not set');
    });
    const wrapped = routeHandler(inner, { route: 'GET /api/learners' });

    const res = await wrapped();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Internal Server Error' });
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('(config)'),
      expect.any(ConfigError)
    );
  });
});
