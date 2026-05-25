// Parent-initiated enrichment retry. One Haiku call per tap, routes through
// the same enrichEntry() service as write-time enrichment — never a parallel
// Anthropic SDK call site. See docs/hearth-logger-post-save-resolution-v1.md
// §2 Item 3.

import { after, NextRequest, NextResponse } from 'next/server';

// See note on /api/entries route — `after()` is bounded by maxDuration.
export const maxDuration = 60;
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { learningEntries } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getFamilyByClerkId, checkWritePermission } from '@/lib/auth/helpers';
import { enrichEntry } from '@/lib/ai/enrich';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';
import { rateLimit } from '@/lib/rate-limit';
import { trackServer } from '@/lib/analytics/posthog-server';
import { routeHandler } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export const POST = routeHandler(async (_request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: writeCheck.statusCode });
  }

  // Tighter than the entry-create limit. 10 retries/hour/family is plenty for
  // honest recovery and protects the pipeline from tap-spam.
  const rl = rateLimit(`enrich-retry:${family.id}`, { limit: 10, windowMs: 60 * 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '600' } });
  }

  const { id } = await params;

  const entry = await db.query.learningEntries.findFirst({
    where: and(eq(learningEntries.id, id), eq(learningEntries.familyId, family.id)),
  });
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Optimistic pending — surfaces in the UI immediately so the affordance can
  // flip to a "reading…" state without waiting on Haiku.
  await db
    .update(learningEntries)
    .set({
      aiEnrichment: { status: 'pending' as const, startedAt: new Date().toISOString() },
      updatedAt: new Date(),
    })
    .where(eq(learningEntries.id, id));

  const startedAt = Date.now();
  after(async () => {
    try {
      await enrichEntry({ entryId: id, familyId: family.id });
      await rebuildSnapshot(family.id, 'entry_saved').catch(() => {});
      trackServer('entry_enrich_retried', userId, {
        duration_ms: Date.now() - startedAt,
        status: 'ok',
      }, { familyId: family.id });
    } catch (err) {
      console.error('[entries/:id/enrich] retry pipeline error:', err);
      trackServer('entry_enrich_retried', userId, {
        duration_ms: Date.now() - startedAt,
        status: 'error',
      }, { familyId: family.id });
    }
  });

  return NextResponse.json({ status: 'pending' }, { status: 202 });
}, { route: 'POST /api/entries/[id]/enrich' });
