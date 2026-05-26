import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { familyPackState } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { parseBody, routeHandler } from '@/lib/api-helpers';

// GET /api/family-pack-state?packId=<sanityPackId>
// Returns the family's state for the given pack, defaulting to false/false
// when no row exists yet. Spec: hearth-pack-indicators-spec-v1 §"State layer".

export const GET = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const packId = new URL(request.url).searchParams.get('packId');
  if (!packId) return NextResponse.json({ error: 'packId is required' }, { status: 400 });

  const [row] = await db
    .select()
    .from(familyPackState)
    .where(
      and(
        eq(familyPackState.familyId, family.id),
        eq(familyPackState.sanityPackId, packId),
      ),
    )
    .limit(1);

  return NextResponse.json({
    packId,
    printablesDownloaded: row?.printablesDownloaded ?? false,
    kitOwned: row?.kitOwned ?? false,
  });
}, { route: 'GET /api/family-pack-state' });

const patchSchema = z.object({
  packId: z.string().min(1),
  printablesDownloaded: z.boolean().optional(),
  kitOwned: z.boolean().optional(),
});

// PATCH /api/family-pack-state
// Upserts the family's row for the pack. Called from the Module Experience
// when the family first downloads a printable; the kit_owned path exists for
// future Stripe purchase confirmation but is unused by UI in v1.

export const PATCH = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const result = await parseBody(request, patchSchema);
  if ('error' in result) return result.error;

  const { packId, printablesDownloaded, kitOwned } = result.data;
  if (printablesDownloaded === undefined && kitOwned === undefined) {
    return NextResponse.json(
      { error: 'At least one of printablesDownloaded or kitOwned is required' },
      { status: 400 },
    );
  }

  const updateSet: { printablesDownloaded?: boolean; kitOwned?: boolean; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (printablesDownloaded !== undefined) updateSet.printablesDownloaded = printablesDownloaded;
  if (kitOwned !== undefined) updateSet.kitOwned = kitOwned;

  const [row] = await db
    .insert(familyPackState)
    .values({
      familyId: family.id,
      sanityPackId: packId,
      printablesDownloaded: printablesDownloaded ?? false,
      kitOwned: kitOwned ?? false,
    })
    .onConflictDoUpdate({
      target: [familyPackState.familyId, familyPackState.sanityPackId],
      set: updateSet,
    })
    .returning();

  return NextResponse.json({
    packId,
    printablesDownloaded: row.printablesDownloaded,
    kitOwned: row.kitOwned,
  });
}, { route: 'PATCH /api/family-pack-state' });
