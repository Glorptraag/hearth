import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-helpers';
import { suggestedObservations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getFamilyByClerkId } from '@/lib/auth/helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const family = await getFamilyByClerkId(userId);
  if (!family) return apiError('Family not found', 404);

  const observation = await db.query.suggestedObservations.findFirst({
    where: eq(suggestedObservations.id, id),
  });
  if (!observation) return apiError('Observation not found', 404);
  if (observation.targetFamilyId !== family.id) return apiError('Not authorized', 403);
  if (observation.status !== 'pending') return apiError('Observation already reviewed', 400);

  const [updated] = await db
    .update(suggestedObservations)
    .set({ status: 'dismissed', reviewedAt: new Date() })
    .where(eq(suggestedObservations.id, id))
    .returning();

  return NextResponse.json(updated);
}
