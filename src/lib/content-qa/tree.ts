import { sanityWriteClient } from '@/lib/sanity/client';
import { db } from '@/lib/db';
import { contentStudioDrafts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { PackTree, SanityDoc } from './types';

// ─── GROQ query for full pack hierarchy ───

const PACK_TREE_QUERY = /* groq */ `
*[_type == "pack" && _id == $packId][0]{
  _id, _type, _rev, _updatedAt,
  title, slug, description, richTextIntro,
  "modules": modules[]{_key, _ref},
  moduleCount, totalActivities,
  pricingId, stripePriceId, status,
  "expandedModules": modules[]->{
    _id, _type, _rev, _updatedAt,
    title, slug, description, targetUnderstanding,
    understandingIndicators,
    "approaches": approaches[]{_key, _ref},
    "capabilityThreads": capabilityThreads[]{_key, _ref},
    "pack": pack{_ref}
  },
  "expandedApproaches": modules[]->approaches[]->{
    _id, _type, _rev, _updatedAt,
    title, slug, description, modality,
    "activities": activities[]{_key, _ref},
    "module": module{_ref}
  },
  "expandedActivities": modules[]->approaches[]->activities[]->{
    _id, _type, _rev, _updatedAt,
    title, slug,
    instructions,
    instructionsText,
    materials,
    facilitatorGuidance,
    sessionMetadata,
    duration, setting, energyLevel,
    "capabilityThreads": capabilityThreads[]{_key, _ref},
    subjects, subjectAreas,
    "approach": approach{_ref}
  },
  "expandedBadges": badges[]->{
    _id, _type, _rev, _updatedAt,
    title, slug, description,
    criteria,
    "connectedThreads": connectedThreads[]{_key, _ref},
    "pack": pack{_ref}
  }
}
`;

export async function fetchPackTree(packId: string): Promise<PackTree> {
  const result = await sanityWriteClient.fetch(PACK_TREE_QUERY, { packId });

  if (!result) {
    return { pack: null, modules: [], approaches: [], activities: [], badges: [] };
  }

  // Pull pack-level data (without the expanded sub-arrays)
  const { expandedModules, expandedApproaches, expandedActivities, expandedBadges, ...packFields } = result;

  // Re-attach the module refs list to the pack object (for count checks)
  const pack = { ...packFields, modules: result.modules ?? [] };

  return {
    pack,
    modules: expandedModules ?? [],
    approaches: expandedApproaches ?? [],
    activities: expandedActivities ?? [],
    badges: expandedBadges ?? [],
  };
}

// ─── Draft merge ───

// Merges contentStudioDrafts data over the Sanity tree for a given pack.
//
// NOTE: contentStudioDrafts stores a full StudioState blob (not per-document rows).
// The merge is field-level at pack scope and title-matched for sub-documents.
// When the flat content_drafts table (spec §11.2) is implemented, this function
// should be refactored to use doc_id based matching instead.

export async function mergeWithDrafts(tree: PackTree): Promise<PackTree> {
  const packId = tree.pack?._id;
  if (!packId) return tree;

  const rows = await db
    .select()
    .from(contentStudioDrafts)
    .where(eq(contentStudioDrafts.sanityPackId, packId));

  // Only use non-published drafts (published drafts are already reflected in Sanity)
  const activeDrafts = rows.filter((r) => r.status !== 'published');
  if (activeDrafts.length === 0) return tree;

  // Use the most recently updated draft
  const latestDraft = activeDrafts.reduce((a, b) =>
    (b.updatedAt ?? new Date(0)) > (a.updatedAt ?? new Date(0)) ? b : a
  );

  const draftData = latestDraft.draftData as Record<string, unknown> | null;
  if (!draftData) return tree;

  const packs = draftData.packs as Record<string, unknown>[] | undefined;
  const packDraft = Array.isArray(packs) ? packs[0] : null;

  if (!packDraft) return tree;

  // Merge pack-level fields (draft wins over published)
  const mergedPack = mergeDraftIntoDoc(tree.pack!, packDraft);

  // Merge modules by title (best-effort without per-doc IDs in current schema)
  const draftModules = (packDraft.modules ?? []) as Record<string, unknown>[];
  const mergedModules = tree.modules.map((sanityModule) => {
    const draftModule = findByTitle(draftModules, sanityModule.title);
    if (!draftModule) return sanityModule;
    return mergeDraftIntoDoc(sanityModule, draftModule);
  });

  const draftApproachByTitle = new Map<string, Record<string, unknown>>();
  for (const draftMod of draftModules) {
    for (const draftApproach of (draftMod.approaches ?? []) as Record<string, unknown>[]) {
      if (draftApproach.title) draftApproachByTitle.set(draftApproach.title as string, draftApproach);
    }
  }

  const mergedApproaches = tree.approaches.map((sanityApproach) => {
    const draftApproach = draftApproachByTitle.get(sanityApproach.title ?? '');
    if (!draftApproach) return sanityApproach;
    return mergeDraftIntoDoc(sanityApproach, draftApproach);
  });

  const draftActivityByTitle = new Map<string, Record<string, unknown>>();
  for (const draftMod of draftModules) {
    for (const draftApproach of (draftMod.approaches ?? []) as Record<string, unknown>[]) {
      for (const draftActivity of (draftApproach.activities ?? []) as Record<string, unknown>[]) {
        if (draftActivity.title) draftActivityByTitle.set(draftActivity.title as string, draftActivity);
      }
    }
  }

  const mergedActivities = tree.activities.map((sanityActivity) => {
    const draftActivity = draftActivityByTitle.get(sanityActivity.title ?? '');
    if (!draftActivity) return sanityActivity;
    return mergeDraftIntoDoc(sanityActivity, draftActivity);
  });

  return {
    pack: mergedPack,
    modules: mergedModules,
    approaches: mergedApproaches,
    activities: mergedActivities,
    badges: tree.badges,
  };
}

// ─── Merge helpers ───

function mergeDraftIntoDoc(sanityDoc: SanityDoc, draft: Record<string, unknown>): SanityDoc {
  if (!draft) return sanityDoc;
  const merged: Record<string, unknown> = { ...sanityDoc };

  // Map draft field names to Sanity field names where they differ
  const fieldMappings: Record<string, string> = {
    instructionsText: 'instructionsText', // keep as-is; rules.ts handles the fallback
    stripePriceId: 'stripePriceId',
  };

  for (const [draftKey, val] of Object.entries(draft)) {
    if (draftKey === '_key') continue; // draft internal key, not a Sanity ID
    const targetKey = fieldMappings[draftKey] ?? draftKey;
    // Only overwrite if draft has a meaningful value
    if (val !== undefined && val !== null && val !== '') {
      merged[targetKey] = val;
    }
  }

  return merged as SanityDoc;
}

function findByTitle(arr: Record<string, unknown>[], title: string | undefined): Record<string, unknown> | null {
  if (!title) return null;
  return arr.find((item) => item?.title === title) ?? null;
}
