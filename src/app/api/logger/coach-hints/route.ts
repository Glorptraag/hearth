import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { familyIntelligenceSnapshots } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { resolveCoachHintProvider } from '@/lib/logger/coaching/resolve';
import type { SnapshotData, ChildSnapshot } from '@/types/snapshot';
import type { SnapshotSignals } from '@/lib/logger/coaching/types';

const coachHintsSchema = z.object({
  learnerIds: z.array(z.string().uuid()).min(1),
  activityType: z.string().nullable().optional(),
  description: z.string(),
  observations: z.array(z.string()).default([]),
});

export const POST = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 60 requests/min per user — generous for a debounced 1200ms call
  const rl = rateLimit(`coach-hints:${userId}`, { limit: 60, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const result = await parseBody(request, coachHintsSchema);
  if ('error' in result) return result.error;
  const { learnerIds, activityType, description, observations } = result.data;

  // Server re-derives snapshotSignals from the cached snapshot.
  // Client never sends per-child profile data.
  const snapshot = await db.query.familyIntelligenceSnapshots.findFirst({
    where: eq(familyIntelligenceSnapshots.familyId, family.id),
  });

  const snapshotData = snapshot?.snapshotData as SnapshotData | null;
  const snapshotSignals = deriveSnapshotSignals(learnerIds, snapshotData);

  // Provider throws are handled softly: the UI degrades gracefully on empty
  // hints rather than 500ing in the parent's face.
  try {
    const provider = await resolveCoachHintProvider();
    const hints = await provider.getHints({
      familyId: family.id,
      learnerIds,
      activityType: activityType ?? null,
      description,
      observations,
      snapshotSignals,
    });
    return NextResponse.json(hints);
  } catch (err) {
    console.warn('[coach-hints] retrieval provider failed:', err);
    return NextResponse.json([]);
  }
}, { route: 'POST /api/logger/coach-hints' });

function deriveSnapshotSignals(
  learnerIds: string[],
  snapshotData: SnapshotData | null,
): SnapshotSignals {
  const perChild: SnapshotSignals['perChild'] = {};

  if (!snapshotData?.children) {
    return { perChild, onboarding: true };
  }

  for (const learnerId of learnerIds) {
    const child: ChildSnapshot | undefined = snapshotData.children[learnerId];
    if (!child) continue;

    const active = (child.active_threads ?? []).map((t) => t.thread_id);
    const quiet = child.gap_analysis?.suggested_focus_threads ?? [];
    perChild[learnerId] = { active, quiet };
  }

  const totalEntries = snapshotData.family?.total_entries ?? 0;
  const onboarding = totalEntries < 20;

  return { perChild, onboarding };
}
