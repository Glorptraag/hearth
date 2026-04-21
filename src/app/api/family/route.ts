import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { families, familySettings, learningEntries } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq, sql } from 'drizzle-orm';
import { parseBody } from '@/lib/api-helpers';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Completed-entry count drives logger mode tapering (Guided -> Quick at 20).
  const [entryCountRow, settings] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(learningEntries)
      .where(and(eq(learningEntries.familyId, family.id), eq(learningEntries.status, 'complete'))),
    db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, family.id),
    }),
  ]);

  return NextResponse.json({
    ...family,
    entryCount: entryCountRow[0]?.count ?? 0,
    pedagogyPreference: settings?.pedagogyPreference ?? 'eclectic',
  });
}

const updateFamilySchema = z.object({
  familyName: z.string().min(1).max(80).optional(),
  loggerDefaultMode: z.enum(['guided', 'quick']).nullable().optional(),
});

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await parseBody(request, updateFamilySchema);
  if ('error' in result) return result.error;
  const parsed = result;

  const [updated] = await db
    .update(families)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(families.id, family.id))
    .returning();

  return NextResponse.json(updated);
}
