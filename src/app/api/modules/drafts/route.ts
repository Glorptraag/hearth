import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { moduleDrafts } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { enrichModuleDraft } from '@/lib/ai/enrich-module';
import { routeHandler } from '@/lib/api-helpers';

export const GET = routeHandler(async () => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const drafts = await db.query.moduleDrafts.findMany({
    where: eq(moduleDrafts.familyId, family.id),
    orderBy: (t, { desc }) => desc(t.updatedAt),
  });

  return NextResponse.json(drafts);
}, { route: 'GET /api/modules/drafts' });

const createDraftSchema = z.object({
  pathway: z.enum(['material', 'process', 'inquiry', 'retrospective', 'understanding']),
  draftData: z.record(z.string(), z.unknown()),
  status: z.enum(['draft', 'complete']).optional().default('draft'),
});

export const POST = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const body = await request.json();
  const parsed = createDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [draft] = await db
    .insert(moduleDrafts)
    .values({
      familyId: family.id,
      pathway: parsed.data.pathway,
      draftData: parsed.data.draftData,
      status: parsed.data.status,
    })
    .returning();

  // Async AI enrichment for completed modules — fills in blank fields
  if (parsed.data.status === 'complete') {
    enrichModuleDraft(draft.id, family.id)
      .catch((err) => console.error('[modules/drafts] enrichment error:', err));
  }

  return NextResponse.json(draft, { status: 201 });
}, { route: 'POST /api/modules/drafts' });
