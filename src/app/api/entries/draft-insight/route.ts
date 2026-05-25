import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { rateLimit } from '@/lib/rate-limit';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { generateDraftInsight } from '@/lib/ai/draft-insight';

const schema = z.object({
  description: z.string().min(20).max(2000),
  childNames: z.array(z.string().max(60)).max(10).optional(),
});

export const POST = routeHandler(async (request: NextRequest) => {
  // Feature flag (decision B — firm flag to kill instantly if cost spikes).
  // Default ON in production; unset or "false" disables the endpoint.
  if (process.env.DRAFT_INSIGHTS_ENABLED === 'false') {
    return NextResponse.json({ error: 'Draft insights disabled' }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  // Rate limit: 20 calls per minute per family. Debounced typing at 2s
  // intervals would top out at 30/min; 20 covers typical use with headroom
  // and hard-stops runaway loops.
  const rl = rateLimit(`draft-insight:${family.id}`, { limit: 20, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const result = await parseBody(request, schema);
  if ('error' in result) return result.error;

  const insight = await generateDraftInsight({
    description: result.data.description,
    childNames: result.data.childNames ?? [],
    familyId: family.id,
  });

  if (!insight) {
    return NextResponse.json({ subjects: [], threads: [], reflection: '' });
  }

  return NextResponse.json(insight);
}, { route: 'POST /api/entries/draft-insight' });
