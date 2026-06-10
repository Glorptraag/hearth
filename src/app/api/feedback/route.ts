import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { feedback } from '@/lib/db/schema';
import { authenticatedFamily, parseBody, routeHandler } from '@/lib/api-helpers';

const feedbackSchema = z.object({
  category: z.enum(['bug', 'idea', 'confusion', 'praise']),
  message: z.string().trim().min(1).max(2000),
  route: z.string().max(300).optional(),
});

// POST /api/feedback — in-app pilot feedback capture.
// Rows are triaged into docs/hearth-research-log.md (decisions log PR-1).
// No AI calls; cheap by design — the channel must cost less than the
// friction being reported (research log R7).
export const POST = routeHandler(async (request: NextRequest) => {
  const result = await authenticatedFamily({
    rateLimitKey: 'feedback',
    rateLimit: 20,
    rateLimitWindow: 60 * 60 * 1000,
  });
  if ('error' in result) return result.error;
  const { userId, family } = result;

  const parsed = await parseBody(request, feedbackSchema);
  if ('error' in parsed) return parsed.error;

  const [row] = await db
    .insert(feedback)
    .values({
      familyId: family.id,
      userId,
      category: parsed.data.category,
      message: parsed.data.message,
      route: parsed.data.route ?? null,
    })
    .returning({ id: feedback.id, createdAt: feedback.createdAt });

  return NextResponse.json({ id: row.id, received: true }, { status: 201 });
}, { route: 'POST /api/feedback' });
