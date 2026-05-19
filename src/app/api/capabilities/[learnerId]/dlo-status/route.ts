import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { learners, learnerDloStatus } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';

type Params = { params: Promise<{ learnerId: string }> };

// Genuine per-DLO state (Item 6). GET returns { [sanityDloId]: state } for
// the learner. PUT sets one DLO's state by EXPLICIT parent confirmation —
// this is the only writer for now. Write-time observation→DLO enrichment +
// a confidence model are the deliberately deferred keystone, NOT this path.
export const DLO_STATE = ['not-started', 'emerging', 'confirmed'] as const;

export const dloStatusPutSchema = z.object({
  dloId: z.string().min(1).max(200),
  state: z.enum(DLO_STATE),
});

async function resolveLearner(learnerId: string, familyId: string) {
  return db.query.learners.findFirst({
    where: and(eq(learners.id, learnerId), eq(learners.familyId, familyId)),
  });
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { learnerId } = await params;
  const learner = await resolveLearner(learnerId, family.id);
  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  const rows = await db
    .select({ dloId: learnerDloStatus.dloId, state: learnerDloStatus.state })
    .from(learnerDloStatus)
    .where(
      and(
        eq(learnerDloStatus.learnerId, learnerId),
        eq(learnerDloStatus.familyId, family.id),
      ),
    );

  const byId: Record<string, string> = {};
  for (const r of rows) byId[r.dloId] = r.state;
  return NextResponse.json(byId);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { learnerId } = await params;
  const learner = await resolveLearner(learnerId, family.id);
  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  const parsed = dloStatusPutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 422 });
  }
  const { dloId, state } = parsed.data;

  await db
    .insert(learnerDloStatus)
    .values({ familyId: family.id, learnerId, dloId, state, source: 'parent' })
    .onConflictDoUpdate({
      target: [learnerDloStatus.learnerId, learnerDloStatus.dloId],
      set: { state, source: 'parent', updatedAt: new Date() },
    });

  return NextResponse.json({ dloId, state });
}
