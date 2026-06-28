import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { sanityServerClient } from '@/lib/sanity/client';
import { CLIENT_READ_QUERIES, isClientReadKey } from '@/lib/sanity/read-allowlist';

/**
 * POST /api/sanity/read
 *
 * Authed proxy for the handful of GROQ reads that client components need but
 * can't run from the browser: they dereference dotted-id ("dark") docs that
 * Sanity's public dataset ACL hides from the tokenless client, so a direct
 * client read returns empty in production. The browser sends an allowlisted
 * KEY (never raw GROQ) plus params; we run the corresponding query through the
 * authed `sanityServerClient`. Same projection as the old client read — nothing
 * new is exposed, the dark derefs simply resolve.
 */
const BodySchema = z.object({
  key: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
});

export const POST = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = await parseBody(request, BodySchema);
  if ('error' in parsed) return parsed.error;

  const { key, params } = parsed.data;
  if (!isClientReadKey(key)) {
    return NextResponse.json({ error: `Unknown query key: ${key}` }, { status: 400 });
  }

  const result = await sanityServerClient.fetch(CLIENT_READ_QUERIES[key], params ?? {});
  return NextResponse.json(result ?? null);
}, { route: 'POST /api/sanity/read' });
