import { after, NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { learningEntries } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import { enrichEntry } from '@/lib/ai/enrich';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { id } = await params;

  const existing = await db.query.learningEntries.findFirst({
    where: and(
      eq(learningEntries.id, id),
      eq(learningEntries.familyId, family.id)
    ),
  });

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [updated] = await db
    .update(learningEntries)
    .set({ status: 'complete', updatedAt: new Date() })
    .where(
      and(
        eq(learningEntries.id, id),
        eq(learningEntries.familyId, family.id)
      )
    )
    .returning();

  // Async AI enrichment — does not block the response.
  // CRITICAL: wrap in `after()` so Vercel serverless keeps the function
  // instance alive past the response. A bare fire-and-forget Promise
  // gets killed the moment NextResponse returns; the entry status
  // flips to 'complete' but `ai_enrichment` stays null.
  after(async () => {
    try {
      await enrichEntry({ entryId: id, familyId: family.id });
      await rebuildSnapshot(family.id, 'entry_saved');
    } catch (err) {
      console.error('[entries/complete] AI pipeline error:', err);
    }
  });

  return NextResponse.json(updated);
}
