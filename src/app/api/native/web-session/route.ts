// POST /api/native/web-session — mints a single-use Clerk sign-in ticket so
// the iOS app can sign its hosted WKWebView in as the same user
// (docs/hearth-native-ios-plan-v2.md §4, N1). The app loads the returned
// /native/handoff URL, which redeems the ticket and continues to `next`.
//
// Bearer-only: a ticket is a fresh session for the caller, so it must come
// from the native app's Clerk token, never a browser's cookie session.

import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/rate-limit';
import {
  HANDOFF_TICKET_TTL_SECONDS,
  buildHandoffUrl,
  safeNextPath,
} from '@/lib/platform/handoff';

const webSessionSchema = z.object({
  next: z.string(),
});

export const POST = routeHandler(async (request: NextRequest) => {
  if (!request.headers.get('authorization')?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Bearer token required' }, { status: 401 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // A webview needs this about once per web session; anything faster is a loop.
  const rl = rateLimit(`native-web-session:${userId}`, { limit: 10, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const result = await parseBody(request, webSessionSchema);
  if ('error' in result) return result.error;

  const next = safeNextPath(result.data.next);
  if (!next) return NextResponse.json({ error: 'next must be a same-origin path' }, { status: 400 });

  const client = await clerkClient();
  const signInToken = await client.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: HANDOFF_TICKET_TTL_SECONDS,
  });

  return NextResponse.json(
    { url: buildHandoffUrl(signInToken.token, next) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}, { route: 'POST /api/native/web-session' });
