import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { eq, and } from 'drizzle-orm';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';
import { upsertParentAssertion, clearParentAssertion } from '@/lib/ai/dlo-persistence';
import { parseDloId } from '@/lib/ai/thread-tier';

/**
 * POST /api/capabilities/[learnerId]/dlo/[dloId]/confirm
 *
 * Explicit parent confirmation ("Yes, I've seen this") or dispute/clear of a
 * DLO for a learner. A confirm writes an `asserted` parent assertion (no backing
 * entry) at the DLO's authored tier — the corroboration the WS-4
 * PRODUCTION_TIER_BAR needs to lift a thread to "demonstrating". A dispute clears
 * the parent's assertion (leaving any inferred/declared evidence intact). The
 * snapshot is rebuilt fire-and-forget; the UI flips optimistically and refetches.
 *
 * Cross-family isolation: 404 if the learner isn't in the signed-in family.
 */
type Params = { params: Promise<{ learnerId: string; dloId: string }> };

const bodySchema = z.object({ action: z.enum(['confirm', 'dispute']) });

export const POST = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { learnerId, dloId: rawDloId } = await params;
  const dloId = decodeURIComponent(rawDloId);
  if (!parseDloId(dloId)) {
    return NextResponse.json({ error: 'Invalid dloId' }, { status: 400 });
  }

  const result = await parseBody(request, bodySchema);
  if ('error' in result) return result.error;
  const { action } = result.data;

  const learner = await db.query.learners.findFirst({
    where: and(eq(learners.id, learnerId), eq(learners.familyId, family.id)),
  });
  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  const now = new Date();
  if (action === 'confirm') {
    const asserted = await upsertParentAssertion({ learnerId, dloId, observedAt: now });
    if (!asserted) return NextResponse.json({ error: 'Unknown DLO' }, { status: 400 });
  } else {
    await clearParentAssertion({ learnerId, dloId, observedAt: now });
  }

  // Reflect the new/cleared evidence in the snapshot (a confirm can lift the
  // thread tier under PRODUCTION_TIER_BAR). Fire-and-forget — never block.
  rebuildSnapshot(family.id, 'manual').catch((err) =>
    console.error('[capabilities/dlo/confirm] snapshot rebuild error:', err),
  );

  return NextResponse.json({ success: true, dloId, action });
}, { route: 'POST /api/capabilities/[learnerId]/dlo/[dloId]/confirm' });
