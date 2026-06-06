import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { familyLibrary } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq, isNull } from 'drizzle-orm';
import { sanityClient } from '@/lib/sanity/client';
import { PACK_INDICATORS_PROJECTION } from '@/lib/sanity/queries';
import type { Printables, Materials, AssetCounts } from '@/lib/sanity/pack-indicators';
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
  /** family_library row UUID — the soft-delete target. */
  rowId: string;
  /** ISO timestamp when the row was added (used by ContextualProposals recently-added). */
  addedAt: string | null;
  /** ISO timestamp when the row was soft-deleted; null for active rows. */
  removedAt: string | null;
  printables?: Printables;
  materials?: Materials;
  assetCounts?: AssetCounts | null;
}

export const GET = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const includeRemoved = request.nextUrl.searchParams.get('includeRemoved') === 'true';

  const baseCondition = eq(familyLibrary.familyId, family.id);
  const records = await db
    .select()
    .from(familyLibrary)
    .where(includeRemoved ? baseCondition : and(baseCondition, isNull(familyLibrary.removedAt)));

  if (records.length === 0) return NextResponse.json([]);

  const packIds = records
    .map((r) => r.sanityPackId)
    .filter((v): v is string => !!v);
  const moduleIds = records
    .map((r) => r.sanityModuleId)
    .filter((v): v is string => !!v);

  type PackMeta = {
    _id: string;
    title: string;
    subjects: string[];
    printables?: Printables;
    materials?: Materials;
    assetCounts?: AssetCounts | null;
  };
  type ModuleMeta = PackMeta & { authorFamilyId: string | null };

  const [packs, modules] = await Promise.all([
    packIds.length > 0
      ? sanityClient
          .fetch<PackMeta[]>(
            // Gated by status == "published" per Sanity-gating invariant
            // (see src/lib/sanity/queries.ts header).
            `*[_type == "pack" && _id in $ids && status == "published"]{ _id, title, subjects, ${PACK_INDICATORS_PROJECTION} }`,
            { ids: packIds },
          )
          .catch(() => [] as PackMeta[])
      : Promise.resolve([] as PackMeta[]),
    moduleIds.length > 0
      ? sanityClient
          .fetch<ModuleMeta[]>(
            // Gated by status == "published" per Sanity-gating invariant
            // (see src/lib/sanity/queries.ts header).
            `*[_type == "module" && _id in $ids && status == "published"]{ _id, title, subjects, authorFamilyId, ${PACK_INDICATORS_PROJECTION} }`,
            { ids: moduleIds },
          )
          .catch(() => [] as ModuleMeta[])
      : Promise.resolve([] as ModuleMeta[]),
  ]);

  const packMap = new Map(packs.map((p) => [p._id, p]));
  const moduleMap = new Map(modules.map((m) => [m._id, m]));

  const items: LibraryItem[] = records.map((r) => {
    const addedAt = r.addedAt?.toISOString() ?? null;
    const removedAt = r.removedAt?.toISOString() ?? null;
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
        rowId: r.id,
        addedAt,
        removedAt,
        printables: meta?.printables,
        materials: meta?.materials,
        assetCounts: meta?.assetCounts,
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
      rowId: r.id,
      addedAt,
      removedAt,
      printables: meta?.printables,
      materials: meta?.materials,
      assetCounts: meta?.assetCounts,
    };
  });

  return NextResponse.json(items);
}, { route: 'GET /api/library' });

// POST accepts either a pack OR a module — exactly one must be provided.
// Used for first-time add AND restore-from-soft-delete (the latter clears
// removedAt on the existing row rather than inserting a new one, preserving
// rowId + original addedAt). Spec: Task 4.7.
const addOrRestoreSchema = z
  .object({
    sanityPackId: z.string().min(1).optional(),
    sanityModuleId: z.string().min(1).optional(),
  })
  .refine(
    (d) => Boolean(d.sanityPackId) !== Boolean(d.sanityModuleId),
    { message: 'Provide exactly one of sanityPackId or sanityModuleId' },
  );

export const POST = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const result = await parseBody(request, addOrRestoreSchema);
  if ('error' in result) return result.error;

  const isPack = !!result.data.sanityPackId;
  const targetIdColumn = isPack ? familyLibrary.sanityPackId : familyLibrary.sanityModuleId;
  const targetId = (result.data.sanityPackId ?? result.data.sanityModuleId) as string;

  // Re-add / restore semantics: if a soft-deleted row exists for this
  // pack/module, restore it (clear removedAt). Otherwise insert new. The
  // partial unique index `... WHERE removed_at IS NULL` guarantees at most
  // one active row, so onConflictDoNothing is safe.
  const existing = await db
    .select()
    .from(familyLibrary)
    .where(
      and(
        eq(familyLibrary.familyId, family.id),
        eq(targetIdColumn, targetId),
      ),
    )
    .limit(1);

  let record: typeof familyLibrary.$inferSelect | undefined;
  const softDeleted = existing.find((e) => e.removedAt !== null);
  const active = existing.find((e) => e.removedAt === null);

  if (active) {
    record = active; // already in library — idempotent
  } else if (softDeleted) {
    [record] = await db
      .update(familyLibrary)
      .set({ removedAt: null })
      .where(eq(familyLibrary.id, softDeleted.id))
      .returning();
  } else {
    [record] = await db
      .insert(familyLibrary)
      .values(
        isPack
          ? { familyId: family.id, sanityPackId: targetId }
          : { familyId: family.id, sanityModuleId: targetId },
      )
      .onConflictDoNothing()
      .returning();
  }

  if (record && !active) {
    rebuildSnapshot(family.id, 'library_change').catch((err) =>
      console.error('[library POST] Snapshot rebuild failed:', err)
    );
  }

  return NextResponse.json(record ?? { message: 'Already in library' }, { status: 201 });
}, { route: 'POST /api/library' });
