import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { moduleRuns } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq } from 'drizzle-orm';
import { parseBody, routeHandler } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

// Valid state transitions:
//   active  → paused (open_ended only), finished, abandoned
//   paused  → active (resume), abandoned
//   finished/abandoned → no transitions (terminal)
const VALID_TRANSITIONS: Record<string, string[]> = {
  active: ['paused', 'finished', 'abandoned'],
  paused: ['active', 'abandoned'],
  finished: [],
  abandoned: [],
};

const patchSchema = z.object({
  lastActiveAt: z.string().datetime().optional(),
  materialsState: z.record(z.string(), z.unknown()).optional(),
  state: z.enum(['active', 'paused', 'finished', 'abandoned']).optional(),
});

export const PATCH = routeHandler(async (request: NextRequest, { params }: Params) => {
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

  const result = await parseBody(request, patchSchema);
  if ('error' in result) return result.error;

  const { lastActiveAt, materialsState, state } = result.data;

  if (state && state !== existing.state) {
    const allowed = VALID_TRANSITIONS[existing.state] ?? [];
    if (!allowed.includes(state)) {
      return NextResponse.json(
        { error: `Cannot transition from '${existing.state}' to '${state}'` },
        { status: 422 }
      );
    }
    // paused is only valid for open_ended runs
    if (state === 'paused' && existing.sessionType !== 'open_ended') {
      return NextResponse.json(
        { error: 'Only open_ended runs can be paused' },
        { status: 422 }
      );
    }
  }

  const updates: Record<string, unknown> = {
    lastActiveAt: lastActiveAt ? new Date(lastActiveAt) : new Date(),
    updatedAt: new Date(),
  };
  if (materialsState !== undefined) updates.materialsState = materialsState;
  if (state !== undefined) updates.state = state;
  // Set finishedAt when transitioning to a terminal state
  if (state === 'finished' || state === 'abandoned') {
    updates.finishedAt = new Date();
  }

  const [updated] = await db
    .update(moduleRuns)
    .set(updates)
    .where(and(eq(moduleRuns.id, id), eq(moduleRuns.familyId, family.id)))
    .returning();

  return NextResponse.json(updated);
}, { route: 'PATCH /api/module-runs/[id]' });
