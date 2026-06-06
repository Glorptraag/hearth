import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { familyIntelligenceSnapshots, learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';
import type { SnapshotData, SnapshotActiveThread } from '@/types/snapshot';

/**
 * GET /api/snapshot/trajectory/[learnerId]
 *
 * Per-learner projection of `active_threads[*]` from the family snapshot,
 * surfacing trajectory, recent evidence quality, and next-badge progress.
 *
 * Auth: caller must own the family that owns the learner.
 *
 * Task 3.5.
 */
export interface TrajectoryThread {
  thread_id: string;
  thread_name: string;
  observation_count: number;
  last_evidence_date: string;
  suggested_tier: string;
  trajectory: SnapshotActiveThread['trajectory'];
  recent_evidence_quality: SnapshotActiveThread['recent_evidence_quality'];
  next_badge: string | null;
  next_badge_progress: number;
}

export interface TrajectoryResponse {
  learner_id: string;
  learner_name: string;
  threads: TrajectoryThread[];
  /** Convenience rollups for surface code that wants headline stats. */
  summary: {
    total_active_threads: number;
    accelerating_count: number;
    plateau_count: number;
  };
}

export const GET = routeHandler(
  async (_req: NextRequest, ctx: { params: Promise<{ learnerId: string }> }) => {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const family = await getFamilyByClerkId(userId);
    if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

    const { learnerId } = await ctx.params;

    // Confirm the learner belongs to the caller's family — never let a
    // trajectory leak across families.
    const learner = await db.query.learners.findFirst({
      where: and(eq(learners.id, learnerId), eq(learners.familyId, family.id)),
    });
    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 });
    }

    const snapshot = await db.query.familyIntelligenceSnapshots.findFirst({
      where: eq(familyIntelligenceSnapshots.familyId, family.id),
    });

    const empty: TrajectoryResponse = {
      learner_id: learnerId,
      learner_name: learner.name,
      threads: [],
      summary: { total_active_threads: 0, accelerating_count: 0, plateau_count: 0 },
    };

    if (!snapshot?.snapshotData) return NextResponse.json(empty);

    const data = snapshot.snapshotData as unknown as SnapshotData;
    const child = data.children?.[learnerId];
    if (!child) return NextResponse.json(empty);

    const threads: TrajectoryThread[] = (child.active_threads ?? []).map((t) => ({
      thread_id: t.thread_id,
      thread_name: t.thread_name,
      observation_count: t.observation_count,
      last_evidence_date: t.last_evidence_date,
      suggested_tier: t.suggested_tier,
      trajectory: t.trajectory,
      recent_evidence_quality: t.recent_evidence_quality,
      next_badge: t.next_badge,
      next_badge_progress: t.next_badge_progress,
    }));

    return NextResponse.json<TrajectoryResponse>({
      learner_id: learnerId,
      learner_name: learner.name,
      threads,
      summary: {
        total_active_threads: threads.length,
        accelerating_count: threads.filter((t) => t.trajectory === 'accelerating').length,
        plateau_count: threads.filter((t) => t.trajectory === 'plateau').length,
      },
    });
  },
  { route: 'GET /api/snapshot/trajectory/[learnerId]' },
);
