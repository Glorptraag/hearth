import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { learners, learnerDloStatus } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';

type Params = { params: Promise<{ learnerId: string }> };

// Genuine per-DLO state (Item 6). Returns { [sanityDloId]: state } for the
// learner. Empty until a parent confirms — honest 'not-started' everywhere
// else. No write-time enrichment / confidence (deferred keystone).
export async function GET(_request: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { learnerId } = await params;

  const learner = await db.query.learners.findFirst({
    where: and(eq(learners.id, learnerId), eq(learners.familyId, family.id)),
  });
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
