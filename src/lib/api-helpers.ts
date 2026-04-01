import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { rateLimit } from '@/lib/rate-limit';

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
