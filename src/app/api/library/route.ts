import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { familyLibrary } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const records = await db
    .select()
    .from(familyLibrary)
    .where(eq(familyLibrary.familyId, family.id));

  return NextResponse.json(records);
}

const addPackSchema = z.object({
  sanityPackId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const body = await request.json();
  const parsed = addPackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [record] = await db
    .insert(familyLibrary)
    .values({ familyId: family.id, sanityPackId: parsed.data.sanityPackId })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json(record ?? { message: 'Already in library' }, { status: 201 });
}
