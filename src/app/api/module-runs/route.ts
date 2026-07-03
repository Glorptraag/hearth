// POST /api/module-runs — open-or-create the family's run for a module.
//
// The runner calls this when the parent enters Facilitate mode. If the family
// already has an OPEN run (state active|paused) for the module, that run is
// returned (200, created:false) and its lastActiveAt touched — re-entering a
// module resumes the run rather than forking a second one. Otherwise a fresh
// active run is inserted (201, created:true).
//
// Runs record LIFECYCLE (started / last active / finished) for the library
// status board and abandonment analytics; the in-session cursor stays in
// localStorage. Completion is written by POST /api/entries when a log carrying
// moduleRunId saves — not by the client directly — and abandonment is derived
// at read time (see /api/library/status), so there is no state to reconcile
// here. Concurrent first-entries could in principle race two open runs; the
// read side prefers the freshest, so this is acceptable for family-scale use.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { moduleRuns } from '@/lib/db/schema';
import { getFamilyByClerkId, checkWritePermission } from '@/lib/auth/helpers';
import { and, eq, inArray, desc } from 'drizzle-orm';
import { parseBody, routeHandler } from '@/lib/api-helpers';

const createRunSchema = z.object({
  sanityModuleId: z.string().min(1),
  // Which approach (modality) the parent picked; null when the module has a
  // single approach and the picker was skipped.
  approachId: z.string().nullish(),
  learnerIds: z.array(z.string().uuid()).optional(),
  // Mirrors Sanity module.sessionType. The field is not yet authored on module
  // docs, so callers omit it and runs default to 'sustained'.
  sessionType: z.enum(['sustained', 'open_ended']).optional(),
});

export const POST = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: writeCheck.statusCode });
  }

  const result = await parseBody(request, createRunSchema);
  if ('error' in result) return result.error;
  const { sanityModuleId, approachId, learnerIds, sessionType } = result.data;

  const [existing] = await db
    .select()
    .from(moduleRuns)
    .where(
      and(
        eq(moduleRuns.familyId, family.id),
        eq(moduleRuns.sanityModuleId, sanityModuleId),
        inArray(moduleRuns.state, ['active', 'paused']),
      ),
    )
    .orderBy(desc(moduleRuns.lastActiveAt))
    .limit(1);

  if (existing) {
    const [touched] = await db
      .update(moduleRuns)
      .set({ lastActiveAt: new Date(), updatedAt: new Date() })
      .where(eq(moduleRuns.id, existing.id))
      .returning();
    return NextResponse.json({ ...touched, created: false }, { status: 200 });
  }

  const [run] = await db
    .insert(moduleRuns)
    .values({
      familyId: family.id,
      sanityModuleId,
      approachId: approachId ?? null,
      learnerIds: learnerIds ?? [],
      state: 'active',
      sessionType: sessionType ?? 'sustained',
    })
    .returning();

  return NextResponse.json({ ...run, created: true }, { status: 201 });
}, { route: 'POST /api/module-runs' });
