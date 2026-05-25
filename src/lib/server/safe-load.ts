import 'server-only';

export type SafeLoadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: Error };

// Next signals navigation (redirect / notFound / forbidden / unauthorized) by
// throwing errors with these `digest` prefixes. The framework relies on them
// propagating, so we must never swallow them — re-throw instead.
const NEXT_NAV_DIGEST_PREFIXES = ['NEXT_REDIRECT', 'NEXT_HTTP_ERROR_FALLBACK'];

function isNextNavigationError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const digest = (err as { digest?: unknown }).digest;
  if (typeof digest !== 'string') return false;
  return NEXT_NAV_DIGEST_PREFIXES.some((prefix) => digest.startsWith(prefix));
}

export async function safeLoad<T>(
  route: string,
  fn: () => Promise<T>,
): Promise<SafeLoadResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (isNextNavigationError(err)) {
      throw err;
    }
    console.error(`[${route}]`, err);
    try {
      const Sentry = await import('@sentry/nextjs');
      Sentry.captureException(err, {
        tags: { route, pipeline: 'server-component' },
      });
    } catch {
      // Sentry import failures must never mask the original error.
    }
    return {
      ok: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}
