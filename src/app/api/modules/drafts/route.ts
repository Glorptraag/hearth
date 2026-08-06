import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { moduleDrafts } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq } from 'drizzle-orm';
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
  id: z.string().uuid().optional(),
  pathway: z.enum(['material', 'process', 'inquiry', 'retrospective', 'understanding']),
  draftData: z.record(z.string(), z.unknown()),
  status: z.enum(['draft', 'complete']).optional().default('draft'),
  // When omitted, enrichment fires for 'complete' saves (legacy behaviour).
  // The builder passes true on editor draft-saves (so blanks are filled for
  // resume) and false on the post-publish bookkeeping save (module is already
  // live in Sanity — enriching the dead draft would be wasted spend).
  enrich: z.boolean().optional(),
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

  let draft;
  if (parsed.data.id) {
    [draft] = await db
      .update(moduleDrafts)
      .set({
        pathway: parsed.data.pathway,
        draftData: parsed.data.draftData,
        status: parsed.data.status,
        updatedAt: new Date(),
      })
      .where(and(eq(moduleDrafts.id, parsed.data.id), eq(moduleDrafts.familyId, family.id)))
      .returning();
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  } else {
    [draft] = await db
      .insert(moduleDrafts)
      .values({
        familyId: family.id,
        pathway: parsed.data.pathway,
        draftData: parsed.data.draftData,
        status: parsed.data.status,
      })
      .returning();
  }

  // Async AI enrichment — fills in blank fields only
  const shouldEnrich = parsed.data.enrich ?? parsed.data.status === 'complete';
  if (shouldEnrich) {
    enrichModuleDraft(draft.id, family.id)
      .catch((err) => console.error('[modules/drafts] enrichment error:', err));
  }

  return NextResponse.json(draft, { status: parsed.data.id ? 200 : 201 });
}, { route: 'POST /api/modules/drafts' });
