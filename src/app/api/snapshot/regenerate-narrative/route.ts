import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { familyIntelligenceSnapshots } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';
import { eq } from 'drizzle-orm';
import type { ChildSnapshot } from '@/types/snapshot';

const MIN_REBUILD_INTERVAL_MS = 60 * 60 * 1000;

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const snapshot = await db.query.familyIntelligenceSnapshots.findFirst({
    where: eq(familyIntelligenceSnapshots.familyId, family.id),
  });

  if (snapshot?.rebuiltAt) {
    const elapsedMs = Date.now() - snapshot.rebuiltAt.getTime();
    if (elapsedMs < MIN_REBUILD_INTERVAL_MS) {
      return NextResponse.json({ rebuilt: false, reason: 'throttled' });
    }
  }

  const children = (snapshot?.snapshotData as { children?: Record<string, ChildSnapshot> } | undefined)?.children ?? {};
  const needsNarrative = Object.values(children).some((c) => {
    const hasMonthEntries = (c.recent_activity?.entries_last_30_days ?? 0) > 0;
    const narrativeEmpty = !c.monthly_narrative || c.monthly_narrative.trim() === '';
    return hasMonthEntries && narrativeEmpty;
  });

  if (!needsNarrative) {
    return NextResponse.json({ rebuilt: false, reason: 'narrative_present' });
  }

  await rebuildSnapshot(family.id, 'manual');

  return NextResponse.json({ rebuilt: true });
}
