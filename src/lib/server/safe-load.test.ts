import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const captureException = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

const { safeLoad } = await import('./safe-load');

describe('safeLoad', () => {
  beforeEach(() => {
    captureException.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns ok=true with the resolved value on success', async () => {
    const result = await safeLoad('test-route', async () => ({ hello: 'world' }));
    expect(result).toEqual({ ok: true, data: { hello: 'world' } });
    expect(captureException).not.toHaveBeenCalled();
  });

  it('returns ok=false and reports to Sentry on a thrown error', async () => {
    const err = new Error('db kaboom');
    const result = await safeLoad('test-route', async () => {
      throw err;
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(err);
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(err, {
      tags: { route: 'test-route', pipeline: 'server-component' },
    });
  });

  it('logs the route name to console.error', async () => {
    const spy = vi.spyOn(console, 'error');
    await safeLoad('dashboard', async () => {
      throw new Error('boom');
    });
    expect(spy).toHaveBeenCalledWith('[dashboard]', expect.any(Error));
  });

  it('wraps a non-Error throw in Error', async () => {
    const result = await safeLoad('test-route', async () => {
      throw 'string thrown';
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe('string thrown');
    }
  });

  it('re-throws Next redirect errors instead of swallowing them', async () => {
    const redirectErr = Object.assign(new Error('NEXT_REDIRECT'), {
      digest: 'NEXT_REDIRECT;replace;/sign-in;307;',
    });
    await expect(
      safeLoad('test-route', async () => {
        throw redirectErr;
      }),
    ).rejects.toBe(redirectErr);
    expect(captureException).not.toHaveBeenCalled();
  });

  it('re-throws Next notFound/HTTP-access-fallback errors', async () => {
    const notFoundErr = Object.assign(new Error('NEXT_HTTP_ERROR_FALLBACK'), {
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    });
    await expect(
      safeLoad('test-route', async () => {
        throw notFoundErr;
      }),
    ).rejects.toBe(notFoundErr);
    expect(captureException).not.toHaveBeenCalled();
  });

  it('does not treat arbitrary digest strings as Next navigation errors', async () => {
    const err = Object.assign(new Error('something else'), {
      digest: 'SOME_OTHER_DIGEST;foo',
    });
    const result = await safeLoad('test-route', async () => {
      throw err;
    });
    expect(result.ok).toBe(false);
    expect(captureException).toHaveBeenCalledTimes(1);
  });
});
