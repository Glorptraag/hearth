import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function authenticatedFamily(opts?: {
  rateLimitKey?: string;
  rateLimit?: number;
  rateLimitWindow?: number;
}) {
  const { userId } = await auth();
  if (!userId) return { error: apiError('Unauthorized', 401) } as const;

  if (opts?.rateLimitKey) {
    const key = `${opts.rateLimitKey}:${userId}`;
    const result = rateLimit(key, {
      limit: opts.rateLimit ?? 60,
      windowMs: opts.rateLimitWindow ?? 60_000,
    });
    if (!result.success) {
      return {
        error: NextResponse.json(
          { error: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': '60' } }
        ),
      } as const;
    }
  }

  const family = await getFamilyByClerkId(userId);
  if (!family) return { error: apiError('Family not found', 404) } as const;

  return { userId, family } as const;
}

export async function parseBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>
): Promise<{ data: T } | { error: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: apiError('Invalid JSON in request body', 400) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { error: NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }) };
  }
  return { data: parsed.data };
}

/**
 * Wrap a route handler so uncaught throws return JSON-500 instead of HTML.
 *
 * The 2026-05-25 incident showed how a single unrun migration cascaded into
 * a white-screen crash on every client page that called `.json()` on the
 * resulting HTML 500 body (WebKit throws SyntaxError synchronously). The
 * server-side fix is to never return HTML on error — always JSON.
 *
 * Usage:
 *
 *   export const GET = routeHandler(async () => {
 *     const result = await db.query.X.findMany(...);
 *     return NextResponse.json(result);
 *   }, { route: 'GET /api/learners' });
 *
 * The wrapper:
 *  - Catches uncaught throws.
 *  - Logs to console.error and Sentry (with route tag).
 *  - Returns NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }).
 *
 * The `route` tag is optional but strongly recommended for Sentry triage.
 */
// Permissive handler signature so callers don't have to widen union returns
// (eg. authenticatedFamily()'s discriminated union confuses strict inference).
// The wrapper itself always resolves to a real Response; if the inner returns
// undefined we treat it as a 500.
type RouteResult = NextResponse | Response | undefined;

export function routeHandler<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<RouteResult>,
  opts?: { route?: string }
): (...args: TArgs) => Promise<NextResponse | Response> {
  return async (...args: TArgs) => {
    try {
      const res = await handler(...args);
      if (!res) {
        const tag = opts?.route ?? 'unknown';
        console.error(`[routeHandler ${tag}] handler returned undefined`);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }
      return res;
    } catch (err) {
      const tag = opts?.route ?? 'unknown';
      // Tag config errors distinctly — they almost always mean a Vercel env
      // var is missing on this deployment, and we want a separate Sentry alert
      // for that rather than burying it in the generic-5xx noise.
      const errorKind =
        err instanceof Error && (err as { code?: string }).code === 'CONFIG_ERROR'
          ? 'config'
          : 'runtime';
      console.error(`[routeHandler ${tag}] (${errorKind})`, err);
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(err, {
          tags: { pipeline: 'route-handler', route: tag, error_kind: errorKind },
        });
      } catch {
        // Sentry import can fail in test env or if the SDK is misconfigured.
        // Never let observability crash the response.
      }
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
