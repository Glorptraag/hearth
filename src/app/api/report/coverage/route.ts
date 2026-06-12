import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { learners, familySettings } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';
import { getDeterministicCoverage } from '@/lib/report/coverage';
import { frameworkKeyForState } from '@/lib/report/deterministic-coverage';

/**
 * GET /api/report/coverage?learnerId=
 *
 * Deterministic curriculum coverage for one learner (WS-5). Returns
 * `{ mode: 'deterministic', coverage }` when the family's framework has authored
 * DLO→framework mappings, or `{ mode: 'fallback' }` when it doesn't — in which
 * case the caller keeps today's LLM-derived coverage path unchanged.
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const learnerId = request.nextUrl.searchParams.get('learnerId');
  if (!learnerId) return NextResponse.json({ error: 'learnerId required' }, { status: 400 });

  const learner = await db.query.learners.findFirst({
    where: and(eq(learners.id, learnerId), eq(learners.familyId, family.id)),
  });
  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  const settings = await db.query.familySettings.findFirst({
    where: eq(familySettings.familyId, family.id),
  });
  const frameworkKey = frameworkKeyForState(settings?.state ?? null);

  const result = await getDeterministicCoverage({ learnerId, frameworkKey });
  return NextResponse.json(result);
}, { route: 'GET /api/report/coverage' });
