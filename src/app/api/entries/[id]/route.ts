import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { learningEntries, learningEntryEvidence } from '@/lib/db/schema';
import { getFamilyByClerkId, checkWritePermission } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import { SUBJECTS, ENTRY_SOURCES, ENTRY_STATUSES } from '@/types';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { attachEvidence } from '@/lib/evidence-db';

type Params = { params: Promise<{ id: string }> };

export const GET = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { id } = await params;

  const entry = await db.query.learningEntries.findFirst({
    where: and(
      eq(learningEntries.id, id),
      eq(learningEntries.familyId, family.id)
    ),
  });

  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Attach caption-carrying learning_entry_evidence rows (read side of the
  // evidenceUrls dual-write); the portfolio prefers these over evidenceUrls.
  const [withEvidence] = await attachEvidence([entry]);
  return NextResponse.json(withEvidence);
}, { route: 'GET /api/entries/[id]' });

const updateEntrySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dateOccurred: z.string().optional(),
  subjects: z.array(z.enum(SUBJECTS)).optional(),
  learnerIds: z.array(z.string().uuid()).optional(),
  engagementPerLearner: z.record(z.string(), z.number().min(1).max(4)).optional(),
  discoveriesPerLearner: z.record(z.string(), z.string()).optional(),
  evidenceUrls: z.array(z.string()).optional(),
  source: z.enum(ENTRY_SOURCES).optional(),
  status: z.enum(ENTRY_STATUSES).optional(),
  workSampleCandidate: z.boolean().optional(),
  // Source-attach fields. Normally write-once at create-time, but the
  // Logger's retrospective "attach to module" flow (workstream F) needs to
  // back-fill these onto an already-saved entry. The narrow PATCH-write
  // path is acceptable; other source fields stay create-only.
  sourceModuleId: z.string().optional(),
  sourceActivityIds: z.array(z.string()).optional(),
  sourceApproachId: z.string().optional(),
});

export const PATCH = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions to modify entries' }, { status: writeCheck.statusCode });
  }

  const { id } = await params;

  const existing = await db.query.learningEntries.findFirst({
    where: and(
      eq(learningEntries.id, id),
      eq(learningEntries.familyId, family.id)
    ),
  });

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await parseBody(request, updateEntrySchema);
  if ('error' in result) return result.error;
  const parsed = result;

  const [updated] = await db
    .update(learningEntries)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(
      and(
        eq(learningEntries.id, id),
        eq(learningEntries.familyId, family.id)
      )
    )
    .returning();

  return NextResponse.json(updated);
}, { route: 'PATCH /api/entries/[id]' });

export const DELETE = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions to delete entries' }, { status: writeCheck.statusCode });
  }

  const { id } = await params;

  const existing = await db.query.learningEntries.findFirst({
    where: and(
      eq(learningEntries.id, id),
      eq(learningEntries.familyId, family.id)
    ),
  });

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft entries can be deleted' },
      { status: 400 }
    );
  }

  await db
    .delete(learningEntries)
    .where(
      and(
        eq(learningEntries.id, id),
        eq(learningEntries.familyId, family.id)
      )
    );

  return NextResponse.json({ success: true });
}, { route: 'DELETE /api/entries/[id]' });
