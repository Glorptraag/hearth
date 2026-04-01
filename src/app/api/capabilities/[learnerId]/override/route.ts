import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { parseBody } from '@/lib/api-helpers';
import { eq, and } from 'drizzle-orm';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';

type Params = { params: Promise<{ learnerId: string }> };

const overrideSchema = z.object({
  threadId: z.string().min(1),
  tier: z.enum(['emerging', 'developing', 'demonstrating']).nullable(),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { learnerId } = await params;

  const result = await parseBody(request, overrideSchema);
  if ('error' in result) return result.error;
  const { threadId, tier, reason } = result.data;

  const learner = await db.query.learners.findFirst({
    where: and(eq(learners.id, learnerId), eq(learners.familyId, family.id)),
  });
  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  type TierOverride = { tier: 'emerging' | 'developing' | 'demonstrating'; reason?: string; setAt?: string };
  const profileData = learner.profileData ?? {};
  const overrides: Record<string, TierOverride> = { ...(profileData.tierOverrides ?? {}) };

  if (tier === null) {
    delete overrides[threadId];
  } else {
    overrides[threadId] = {
      tier,
      reason: reason ?? undefined,
      setAt: new Date().toISOString(),
    };
  }

  await db
    .update(learners)
    .set({
      profileData: { ...profileData, tierOverrides: overrides },
      updatedAt: new Date(),
    })
    .where(eq(learners.id, learnerId));

  // Rebuild snapshot to reflect the override
  rebuildSnapshot(family.id, 'manual').catch((err) =>
    console.error('[capabilities/override] snapshot rebuild error:', err)
  );

  return NextResponse.json({ success: true, threadId, tier });
}
