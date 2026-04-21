import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { familyLibrary } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { sanityClient } from '@/lib/sanity/client';
import { parseBody } from '@/lib/api-helpers';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const records = await db
    .select()
    .from(familyLibrary)
    .where(eq(familyLibrary.familyId, family.id));

  if (records.length === 0) return NextResponse.json([]);

  // Enrich with Sanity data (titles + subjects)
  const packIds = records.map((r) => r.sanityPackId);
  const modules = await sanityClient.fetch<
    Array<{ _id: string; title: string; subjects: string[] }>
  >(
    `*[_type == "module" && _id in $ids]{ _id, title, subjects }`,
    { ids: packIds }
  ).catch(() => [] as Array<{ _id: string; title: string; subjects: string[] }>);

  const moduleMap = new Map(modules.map((m) => [m._id, m]));

  const enriched = records.map((r) => {
    const mod = moduleMap.get(r.sanityPackId);
    return {
      title: mod?.title ?? r.sanityPackId,
      moduleId: r.sanityPackId,
      subjects: mod?.subjects ?? [],
    };
  });

  return NextResponse.json(enriched);
}

const addPackSchema = z.object({
  sanityPackId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const result = await parseBody(request, addPackSchema);
  if ('error' in result) return result.error;

  const [record] = await db
    .insert(familyLibrary)
    .values({ familyId: family.id, sanityPackId: result.data.sanityPackId })
    .onConflictDoNothing()
    .returning();

  // Rebuild snapshot so recommendations update with new library content
  if (record) {
    rebuildSnapshot(family.id, 'library_change').catch((err) =>
      console.error('[library POST] Snapshot rebuild failed:', err)
    );
  }

  return NextResponse.json(record ?? { message: 'Already in library' }, { status: 201 });
}
