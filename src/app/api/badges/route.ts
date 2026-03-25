import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { badgeDefinitions } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, or, isNull } from 'drizzle-orm';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const badges = await db.query.badgeDefinitions.findMany({
    where: or(
      eq(badgeDefinitions.familyId, family.id),
      isNull(badgeDefinitions.familyId)
    ),
  });

  return NextResponse.json(badges);
}

const createBadgeSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  emoji: z.string().optional(),
  criteriaSummary: z.string().optional(),
  capabilityThreadIds: z.array(z.string()).optional(),
  observationThreshold: z.number().min(1).optional(),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const body = await request.json();
  const parsed = createBadgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [badge] = await db
    .insert(badgeDefinitions)
    .values({
      familyId: family.id,
      ...parsed.data,
    })
    .returning();

  return NextResponse.json(badge, { status: 201 });
}
