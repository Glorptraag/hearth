import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { plannerEntries } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq, gte, lte } from 'drizzle-orm';
import { parseBody } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const params = request.nextUrl.searchParams;
  const startDate = params.get('startDate');
  const endDate = params.get('endDate');

  const conditions = [eq(plannerEntries.familyId, family.id)];
  if (startDate) conditions.push(gte(plannerEntries.date, startDate));
  if (endDate) conditions.push(lte(plannerEntries.date, endDate));

  const entries = await db
    .select()
    .from(plannerEntries)
    .where(and(...conditions));

  return NextResponse.json(entries);
}

const createPlannerEntrySchema = z.object({
  date: z.string().min(1),
  title: z.string().optional(),
  moduleId: z.string().optional(),
  activityId: z.string().optional(),
  learnerIds: z.array(z.string().uuid()).optional(),
  status: z.string().optional(),
  session: z.enum(['morning', 'afternoon']).optional(),
  subjects: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const result = await parseBody(request, createPlannerEntrySchema);
  if ('error' in result) return result.error;

  const [entry] = await db
    .insert(plannerEntries)
    .values({ familyId: family.id, ...result.data })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
