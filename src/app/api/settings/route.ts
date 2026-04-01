import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { familySettings } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { PEDAGOGIES } from '@/types';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';
import { parseBody } from '@/lib/api-helpers';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  let settings = await db.query.familySettings.findFirst({
    where: eq(familySettings.familyId, family.id),
  });

  if (!settings) {
    const [created] = await db
      .insert(familySettings)
      .values({ familyId: family.id })
      .returning();
    settings = created;
  }

  return NextResponse.json(settings);
}

const updateSettingsSchema = z.object({
  pedagogyPreference: z.enum(PEDAGOGIES).optional(),
  pedagogyValues: z.array(z.string()).optional(),
  pedagogyPractices: z.array(z.string()).optional(),
  heuRegistrationNumber: z.string().optional(),
  heuNextReportDate: z.string().optional(),
  state: z.string().optional(),
  notificationPrefs: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const result = await parseBody(request, updateSettingsSchema);
  if ('error' in result) return result.error;
  const parsed = result;

  const existing = await db.query.familySettings.findFirst({
    where: eq(familySettings.familyId, family.id),
  });

  if (!existing) {
    const [created] = await db
      .insert(familySettings)
      .values({ familyId: family.id, ...parsed.data })
      .returning();
    return NextResponse.json(created);
  }

  const pedagogyChanged =
    parsed.data.pedagogyPreference &&
    parsed.data.pedagogyPreference !== existing.pedagogyPreference;

  const [updated] = await db
    .update(familySettings)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(familySettings.familyId, family.id))
    .returning();

  if (pedagogyChanged) {
    rebuildSnapshot(family.id, 'settings_change').catch(() => {
      // Non-blocking — settings are already saved
    });
  }

  return NextResponse.json(updated);
}
