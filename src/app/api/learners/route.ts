import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { LEARNER_COLOURS } from '@/types';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const result = await db.query.learners.findMany({
    where: eq(learners.familyId, family.id),
    orderBy: learners.displayOrder,
  });

  return NextResponse.json(result);
}

const createLearnerSchema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.string().optional(),
  shapeIcon: z.string().optional(),
  colourToken: z.enum(LEARNER_COLOURS).optional(),
  displayOrder: z.number().optional(),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const body = await request.json();
  const parsed = createLearnerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [learner] = await db
    .insert(learners)
    .values({
      familyId: family.id,
      ...parsed.data,
    })
    .returning();

  return NextResponse.json(learner, { status: 201 });
}
