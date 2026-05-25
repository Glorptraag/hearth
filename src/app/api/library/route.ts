import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { familyLibrary } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { sanityClient } from '@/lib/sanity/client';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';

export interface LibraryItem {
  id: string;
  title: string;
  subjects: string[];
  kind: 'pack' | 'module';
  isOwnBuilt: boolean;
  sanityPackId: string | null;
  sanityModuleId: string | null;
  moduleId: string;
}

export const GET = routeHandler(async () => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const records = await db
    .select()
    .from(familyLibrary)
    .where(eq(familyLibrary.familyId, family.id));

  if (records.length === 0) return NextResponse.json([]);

  const packIds = records
    .map((r) => r.sanityPackId)
    .filter((v): v is string => !!v);
  const moduleIds = records
    .map((r) => r.sanityModuleId)
    .filter((v): v is string => !!v);

  const [packs, modules] = await Promise.all([
    packIds.length > 0
      ? sanityClient
          .fetch<Array<{ _id: string; title: string; subjects: string[] }>>(
            `*[_type == "pack" && _id in $ids]{ _id, title, subjects }`,
            { ids: packIds },
          )
          .catch(() => [] as Array<{ _id: string; title: string; subjects: string[] }>)
      : Promise.resolve([] as Array<{ _id: string; title: string; subjects: string[] }>),
    moduleIds.length > 0
      ? sanityClient
          .fetch<Array<{ _id: string; title: string; subjects: string[]; authorFamilyId: string | null }>>(
            `*[_type == "module" && _id in $ids]{ _id, title, subjects, authorFamilyId }`,
            { ids: moduleIds },
          )
          .catch(() => [] as Array<{ _id: string; title: string; subjects: string[]; authorFamilyId: string | null }>)
      : Promise.resolve([] as Array<{ _id: string; title: string; subjects: string[]; authorFamilyId: string | null }>),
  ]);

  const packMap = new Map(packs.map((p) => [p._id, p]));
  const moduleMap = new Map(modules.map((m) => [m._id, m]));

  const items: LibraryItem[] = records.map((r) => {
    if (r.sanityPackId) {
      const meta = packMap.get(r.sanityPackId);
      return {
        id: r.sanityPackId,
        title: meta?.title ?? r.sanityPackId,
        subjects: meta?.subjects ?? [],
        kind: 'pack' as const,
        isOwnBuilt: false,
        sanityPackId: r.sanityPackId,
        sanityModuleId: null,
        moduleId: r.sanityPackId,
      };
    }
    const id = r.sanityModuleId as string;
    const meta = moduleMap.get(id);
    return {
      id,
      title: meta?.title ?? id,
      subjects: meta?.subjects ?? [],
      kind: 'module' as const,
      isOwnBuilt: meta?.authorFamilyId === family.id,
      sanityPackId: null,
      sanityModuleId: id,
      moduleId: id,
    };
  });

  return NextResponse.json(items);
}, { route: 'GET /api/library' });

const addPackSchema = z.object({
  sanityPackId: z.string().min(1),
});

export const POST = routeHandler(async (request: NextRequest) => {
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

  if (record) {
    rebuildSnapshot(family.id, 'library_change').catch((err) =>
      console.error('[library POST] Snapshot rebuild failed:', err)
    );
  }

  return NextResponse.json(record ?? { message: 'Already in library' }, { status: 201 });
}, { route: 'POST /api/library' });
