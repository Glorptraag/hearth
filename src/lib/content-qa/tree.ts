import { sanityWriteClient } from '@/lib/sanity/client';
import type { PackTree } from './types';

// ─── GROQ query for full pack hierarchy ───
// SANITY-GATING EXEMPT: admin QA tree fetcher; must see drafts.
// See src/lib/sanity/queries.ts header for the invariant.

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
    "capabilityTargets": capabilityTargets[]{_key, tier, "thread": thread{_ref}},
    subjects, subjectAreas,
    "commonsTexts": commonsTexts[]{
      _key, role, textId,
      "textPublished": text->status == "published"
    },
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
