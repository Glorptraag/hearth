// Family-scoped snapshot rebuild trigger. Used by Dashboard mount to refresh
// the monthly narrative when it's stale. Debounced to once per 24h per family
// so a tab-thrash can't run up the Anthropic bill.
//
// Unlike /api/admin/snapshots/rebuild this actually calls rebuildSnapshot()
// inside `after()` (the admin route only bumps the trigger column).

import { after, NextRequest, NextResponse } from 'next/server';

// rebuildSnapshot needs room — Anthropic call per child + Sanity reads.
export const maxDuration = 60;

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { familyIntelligenceSnapshots } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';
import { rateLimit } from '@/lib/rate-limit';
import { routeHandler } from '@/lib/api-helpers';

const DEBOUNCE_MS = 24 * 60 * 60 * 1000;

export const POST = routeHandler(
  async (_req: NextRequest) => {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const family = await getFamilyByClerkId(userId);
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    const limit = rateLimit(`snapshots-rebuild:${family.id}`, {
      limit: 2,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '3600' } }
      );
    }

    const [snapshot] = await db
      .select({ rebuiltAt: familyIntelligenceSnapshots.rebuiltAt })
      .from(familyIntelligenceSnapshots)
      .where(eq(familyIntelligenceSnapshots.familyId, family.id))
      .limit(1);

    if (snapshot?.rebuiltAt && Date.now() - snapshot.rebuiltAt.getTime() < DEBOUNCE_MS) {
      return NextResponse.json({ skipped: true, reason: 'fresh' }, { status: 200 });
    }

    after(async () => {
      await rebuildSnapshot(family.id, 'user_dashboard').catch((err) => {
        console.error('[snapshots/rebuild] background rebuild failed', err);
      });
    });

    return NextResponse.json({ queued: true }, { status: 202 });
  },
  { route: 'POST /api/snapshots/rebuild' }
);
