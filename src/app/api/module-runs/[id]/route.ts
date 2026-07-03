// PATCH /api/module-runs/[id] — touch or finish a run.
//
//   { action: 'touch' }  → bump lastActiveAt (the runner calls this as the
//                          parent advances activities, so read-time staleness
//                          derivation reflects real activity)
//   { action: 'finish' } → state:'finished' + finishedAt. Normally the entry
//                          save finishes the run server-side (POST /api/entries
//                          with moduleRunId); this action exists for explicit
//                          end-without-log flows.
//
// Abandonment is DERIVED at read time (/api/library/status) — it is not a
// writable state here.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { moduleRuns } from '@/lib/db/schema';
import { getFamilyByClerkId, checkWritePermission } from '@/lib/auth/helpers';
import { and, eq } from 'drizzle-orm';
import { parseBody, routeHandler } from '@/lib/api-helpers';

const patchRunSchema = z.object({
  action: z.enum(['touch', 'finish']),
});

type Params = { params: Promise<{ id: string }> };

export const PATCH = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: writeCheck.statusCode });
  }

  const result = await parseBody(request, patchRunSchema);
  if ('error' in result) return result.error;
  const { action } = result.data;

  const { id } = await params;
  // Non-UUID ids would throw at the Postgres layer — treat them as not found.
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }
  const [run] = await db
    .select()
    .from(moduleRuns)
    .where(and(eq(moduleRuns.id, id), eq(moduleRuns.familyId, family.id)))
    .limit(1);
  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });

  const now = new Date();
  const [updated] = await db
    .update(moduleRuns)
    .set(
      action === 'finish'
        ? { state: 'finished', finishedAt: now, lastActiveAt: now, updatedAt: now }
        : { lastActiveAt: now, updatedAt: now },
    )
    .where(eq(moduleRuns.id, run.id))
    .returning();

  return NextResponse.json(updated);
}, { route: 'PATCH /api/module-runs/[id]' });
