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
