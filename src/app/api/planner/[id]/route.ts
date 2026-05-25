import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { plannerEntries } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq } from 'drizzle-orm';
import { parseBody, routeHandler } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(['planned', 'in_progress', 'completed']).optional(),
  title: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  session: z.enum(['morning', 'afternoon']).optional(),
  subjects: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const PATCH = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { id } = await params;

  const existing = await db.query.plannerEntries.findFirst({
    where: and(eq(plannerEntries.id, id), eq(plannerEntries.familyId, family.id)),
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await parseBody(request, patchSchema);
  if ('error' in result) return result.error;

  const [updated] = await db
    .update(plannerEntries)
    .set({ ...result.data, updatedAt: new Date() })
    .where(and(eq(plannerEntries.id, id), eq(plannerEntries.familyId, family.id)))
    .returning();

  return NextResponse.json(updated);
}, { route: 'PATCH /api/planner/[id]' });

export const DELETE = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { id } = await params;

  const existing = await db.query.plannerEntries.findFirst({
    where: and(eq(plannerEntries.id, id), eq(plannerEntries.familyId, family.id)),
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db
    .delete(plannerEntries)
    .where(and(eq(plannerEntries.id, id), eq(plannerEntries.familyId, family.id)));

  return NextResponse.json({ success: true });
}, { route: 'DELETE /api/planner/[id]' });
