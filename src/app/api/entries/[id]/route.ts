import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { learningEntries } from '@/lib/db/schema';
import { getFamilyByClerkId, checkWritePermission } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import { SUBJECTS, ENTRY_SOURCES, ENTRY_STATUSES } from '@/types';
import { parseBody } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
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

  return NextResponse.json(entry);
}

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
});

export async function PATCH(request: NextRequest, { params }: Params) {
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
}

export async function DELETE(request: NextRequest, { params }: Params) {
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
}
