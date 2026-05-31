import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { familyLibrary } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { sanityClient } from '@/lib/sanity/client';
import { PACK_INDICATORS_PROJECTION } from '@/lib/sanity/queries';
import type { Printables, Materials, AssetCounts } from '@/lib/sanity/pack-indicators';
import { routeHandler } from '@/lib/api-helpers';

/**
 * Flat view of every module the family can run, regardless of whether it
 * arrived via a pack or was authored standalone. Drives the default tab on
 * /library (workstream C) and the Logger attach-to-module picker
 * (workstream F).
 *
 * A typical family with 5 packs × 6 modules each = 30 modules. Surfacing
 * them flat means the parent can pick a module in one click rather than
 * navigating pack → modules → pick.
 *
 * Each item carries an `owningPack` chip so the parent can still see where
 * the module came from.
 */
export interface LibraryModuleItem {
  id: string;
  title: string;
  subjects: string[];
  targetUnderstanding: string | null;
  duration: { min: number; max: number } | null;
  isOwnBuilt: boolean;
  owningPack: { id: string; title: string } | null;
  printables?: Printables;
  materials?: Materials;
  assetCounts?: AssetCounts | null;
}

type ModuleMeta = {
  _id: string;
  title: string;
  subjects?: string[];
  targetUnderstanding?: string;
  duration?: { min: number; max: number };
  printables?: Printables;
  materials?: Materials;
  assetCounts?: AssetCounts | null;
};

type OwnModuleMeta = ModuleMeta & { authorFamilyId?: string | null };
type PackWithModules = {
  _id: string;
  title: string;
  modules?: ModuleMeta[];
};

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

  const packIds = records.map((r) => r.sanityPackId).filter((v): v is string => !!v);
  const moduleIds = records.map((r) => r.sanityModuleId).filter((v): v is string => !!v);

  // Pack expansion: for each pack in the library, pull its modules. Both
  // gates (pack must be published, modules must be published) live in the
  // GROQ so a published pack containing draft modules silently surfaces
  // only the published ones. See src/lib/sanity/queries.ts header.
  const packQuery = `*[_type == "pack" && _id in $ids && status == "published"]{
    _id, title,
    "modules": modules[@->status == "published"]->{
      _id, title, subjects, targetUnderstanding, duration,
      ${PACK_INDICATORS_PROJECTION}
    }
  }`;

  // Own-built modules: standalone, no owning pack.
  const ownModuleQuery = `*[_type == "module" && _id in $ids && status == "published"]{
    _id, title, subjects, targetUnderstanding, duration, authorFamilyId,
    ${PACK_INDICATORS_PROJECTION}
  }`;

  const [packs, ownModules] = await Promise.all([
    packIds.length > 0
      ? sanityClient
          .fetch<PackWithModules[]>(packQuery, { ids: packIds })
          .catch(() => [] as PackWithModules[])
      : Promise.resolve([] as PackWithModules[]),
    moduleIds.length > 0
      ? sanityClient
          .fetch<OwnModuleMeta[]>(ownModuleQuery, { ids: moduleIds })
          .catch(() => [] as OwnModuleMeta[])
      : Promise.resolve([] as OwnModuleMeta[]),
  ]);

  const items: LibraryModuleItem[] = [];
  const seen = new Set<string>();

  for (const pack of packs) {
    for (const m of pack.modules ?? []) {
      if (seen.has(m._id)) continue; // dedupe across packs that share a module
      seen.add(m._id);
      items.push({
        id: m._id,
        title: m.title,
        subjects: m.subjects ?? [],
        targetUnderstanding: m.targetUnderstanding ?? null,
        duration: m.duration ?? null,
        isOwnBuilt: false,
        owningPack: { id: pack._id, title: pack.title },
        printables: m.printables,
        materials: m.materials,
        assetCounts: m.assetCounts,
      });
    }
  }

  for (const m of ownModules) {
    if (seen.has(m._id)) continue;
    seen.add(m._id);
    items.push({
      id: m._id,
      title: m.title,
      subjects: m.subjects ?? [],
      targetUnderstanding: m.targetUnderstanding ?? null,
      duration: m.duration ?? null,
      isOwnBuilt: m.authorFamilyId === family.id,
      owningPack: null,
      printables: m.printables,
      materials: m.materials,
      assetCounts: m.assetCounts,
    });
  }

  // Alphabetical default ordering. Caller can re-sort.
  items.sort((a, b) => a.title.localeCompare(b.title));

  return NextResponse.json(items);
}, { route: 'GET /api/library/modules' });
