import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { familySettings } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { PEDAGOGIES } from '@/types';

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

  const body = await request.json();
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let existing = await db.query.familySettings.findFirst({
    where: eq(familySettings.familyId, family.id),
  });

  if (!existing) {
    const [created] = await db
      .insert(familySettings)
      .values({ familyId: family.id, ...parsed.data })
      .returning();
    return NextResponse.json(created);
  }

  const [updated] = await db
    .update(familySettings)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(familySettings.familyId, family.id))
    .returning();

  return NextResponse.json(updated);
}
