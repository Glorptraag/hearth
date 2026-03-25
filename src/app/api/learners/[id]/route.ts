import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import { LEARNER_COLOURS } from '@/types';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { id } = await params;

  const learner = await db.query.learners.findFirst({
    where: and(
      eq(learners.id, id),
      eq(learners.familyId, family.id)
    ),
  });

  if (!learner) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(learner);
}

const updateLearnerSchema = z.object({
  name: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),
  shapeIcon: z.string().optional(),
  colourToken: z.enum(LEARNER_COLOURS).optional(),
  displayOrder: z.number().optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { id } = await params;

  const existing = await db.query.learners.findFirst({
    where: and(
      eq(learners.id, id),
      eq(learners.familyId, family.id)
    ),
  });

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const parsed = updateLearnerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(learners)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(
      and(eq(learners.id, id), eq(learners.familyId, family.id))
    )
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { id } = await params;

  const existing = await db.query.learners.findFirst({
    where: and(
      eq(learners.id, id),
      eq(learners.familyId, family.id)
    ),
  });

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db
    .delete(learners)
    .where(
      and(eq(learners.id, id), eq(learners.familyId, family.id))
    );

  return NextResponse.json({ success: true });
}
