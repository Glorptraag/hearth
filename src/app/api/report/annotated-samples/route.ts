import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';
import { loadAnnotatedSamples } from '@/lib/report/annotated-samples-data';

/**
 * GET /api/report/annotated-samples?learnerId=&reportId=
 *
 * Annotated work samples (W5.1) for one learner, grouped per learning area:
 * `{ groups: AnnotatedSampleGroup[] }`. An entry with a photo and a
 * parent-confirmed DLO renders as the parent's words + the DLO plain-language
 * line + a band sentence (see `src/lib/report/annotated-samples.ts`).
 *
 * Read-only. `reportId` is optional and only tags a sample the parent also
 * chose for one of the six required slots; it never fills a slot. Photos come
 * back as stored refs; the client renders them through `/api/evidence`.
 *
 * Cross-family isolation: 404 if the learner isn't in the signed-in family.
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const learnerId = request.nextUrl.searchParams.get('learnerId');
  if (!learnerId) return NextResponse.json({ error: 'learnerId required' }, { status: 400 });
  const reportId = request.nextUrl.searchParams.get('reportId');

  const learner = await db.query.learners.findFirst({
    where: and(eq(learners.id, learnerId), eq(learners.familyId, family.id)),
  });
  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  const groups = await loadAnnotatedSamples({
    familyId: family.id,
    learnerId,
    learnerName: learner.name,
    reportId,
  });
  return NextResponse.json({ groups });
}, { route: 'GET /api/report/annotated-samples' });
