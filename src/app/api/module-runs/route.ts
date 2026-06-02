import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { moduleRuns } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq } from 'drizzle-orm';
import { parseBody, routeHandler } from '@/lib/api-helpers';

export const GET = routeHandler(async (request: NextRequest) => {
  if (!process.env.MODULE_RUNS_ENABLED) {
    return NextResponse.json({ error: 'Not enabled' }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const stateParam = request.nextUrl.searchParams.get('state');

  const conditions = [eq(moduleRuns.familyId, family.id)];
  if (stateParam) conditions.push(eq(moduleRuns.state, stateParam));

  const runs = await db
    .select()
    .from(moduleRuns)
    .where(and(...conditions))
    .orderBy(moduleRuns.lastActiveAt);

  return NextResponse.json(runs);
}, { route: 'GET /api/module-runs' });

const createSchema = z.object({
  sanityModuleId: z.string().min(1),
  approachId: z.string().optional(),
  learnerIds: z.array(z.string().uuid()).default([]),
  sessionType: z.enum(['sustained', 'open_ended']).default('sustained'),
  device: z.string().optional(),
});

export const POST = routeHandler(async (request: NextRequest) => {
  if (!process.env.MODULE_RUNS_ENABLED) {
    return NextResponse.json({ error: 'Not enabled' }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const result = await parseBody(request, createSchema);
  if ('error' in result) return result.error;

  const { sanityModuleId, approachId, learnerIds, sessionType, device } = result.data;

  const [run] = await db
    .insert(moduleRuns)
    .values({
      familyId: family.id,
      sanityModuleId,
      approachId,
      learnerIds,
      sessionType,
      device,
      state: 'active',
    })
    .returning();

  return NextResponse.json(run, { status: 201 });
}, { route: 'POST /api/module-runs' });
