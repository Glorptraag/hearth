import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badgeAwards, learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const restore = body.restore === true;

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Verify the award belongs to a learner in this family
  const [award] = await db
    .select({ id: badgeAwards.id })
    .from(badgeAwards)
    .innerJoin(learners, eq(badgeAwards.learnerId, learners.id))
    .where(and(eq(badgeAwards.id, id), eq(learners.familyId, family.id)))
    .limit(1);

  if (!award) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db
    .update(badgeAwards)
    .set({ retractedAt: restore ? null : new Date() })
    .where(eq(badgeAwards.id, id));

  return NextResponse.json({ ok: true, retracted: !restore });
}
