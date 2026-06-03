import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { familyIntelligenceSnapshots } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';
import type { SnapshotData } from '@/types/snapshot';

/**
 * GET /api/snapshot/freshness?staleDays=21
 *
 * Per-learner "quiet corners" — threads with no observation in the last
 * N days (default 21). Projects from `children[learnerId].active_threads`
 * using `last_evidence_date`. Powers Explore "Quiet corners" card.
 *
 * Optional `?learnerId=` narrows to a single learner.
 *
 * Task 3.8.
 */
export interface FreshnessThread {
  thread_id: string;
  thread_name: string;
  last_evidence_date: string;
  days_since: number;
}

export interface FreshnessLearner {
  learner_id: string;
  learner_name: string;
  stale_threads: FreshnessThread[];
}

export interface FreshnessResponse {
  stale_days_threshold: number;
  learners: FreshnessLearner[];
}

const DEFAULT_STALE_DAYS = 21;

function daysBetween(iso: string): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Infinity;
  return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
}

export const GET = routeHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const params = req.nextUrl.searchParams;
  const staleDays = Number(params.get('staleDays') ?? DEFAULT_STALE_DAYS);
  const learnerFilter = params.get('learnerId');
  const threshold = Number.isFinite(staleDays) && staleDays > 0 ? staleDays : DEFAULT_STALE_DAYS;

  const snapshot = await db.query.familyIntelligenceSnapshots.findFirst({
    where: eq(familyIntelligenceSnapshots.familyId, family.id),
  });

  if (!snapshot?.snapshotData) {
    return NextResponse.json<FreshnessResponse>({
      stale_days_threshold: threshold,
      learners: [],
    });
  }

  const data = snapshot.snapshotData as unknown as SnapshotData;
  const children = data.children ?? {};

  const learners: FreshnessLearner[] = [];
  for (const [learnerId, child] of Object.entries(children)) {
    if (learnerFilter && learnerFilter !== learnerId) continue;
    const stale: FreshnessThread[] = [];
    for (const t of child.active_threads ?? []) {
      const days = daysBetween(t.last_evidence_date);
      if (days >= threshold) {
        stale.push({
          thread_id: t.thread_id,
          thread_name: t.thread_name,
          last_evidence_date: t.last_evidence_date,
          days_since: days === Infinity ? -1 : days,
        });
      }
    }
    if (stale.length > 0) {
      stale.sort((a, b) => b.days_since - a.days_since);
      learners.push({
        learner_id: learnerId,
        learner_name: child.name,
        stale_threads: stale,
      });
    }
  }

  return NextResponse.json<FreshnessResponse>({
    stale_days_threshold: threshold,
    learners,
  });
}, { route: 'GET /api/snapshot/freshness' });
