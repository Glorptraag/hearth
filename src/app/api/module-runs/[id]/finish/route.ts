import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { moduleRuns } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export const POST = routeHandler(async (request: NextRequest, { params }: Params) => {
  if (!process.env.MODULE_RUNS_ENABLED) {
    return NextResponse.json({ error: 'Not enabled' }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { id } = await params;

  const existing = await db.query.moduleRuns.findFirst({
    where: and(eq(moduleRuns.id, id), eq(moduleRuns.familyId, family.id)),
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (existing.state === 'finished') {
    return NextResponse.json(existing);
  }
  if (existing.state === 'abandoned') {
    return NextResponse.json(
      { error: 'Cannot finish an abandoned run' },
      { status: 422 }
    );
  }

  const now = new Date();
  const [updated] = await db
    .update(moduleRuns)
    .set({ state: 'finished', finishedAt: now, lastActiveAt: now, updatedAt: now })
    .where(and(eq(moduleRuns.id, id), eq(moduleRuns.familyId, family.id)))
    .returning();

  return NextResponse.json(updated);
}, { route: 'POST /api/module-runs/[id]/finish' });
