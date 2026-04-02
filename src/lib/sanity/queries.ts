// Pack list for marketplace/activity discovery
export const PACKS_QUERY = `*[_type == "pack" && status == "published"]{
  _id, title, slug, description, subjects, ageRange, moduleCount, totalActivities,
  availability, version, creator, creatorType, stripePriceId, "badgeCount": count(badges)
}`;

// Single pack with full module tree
export const PACK_DETAIL_QUERY = `*[_type == "pack" && slug.current == $slug][0]{
  ...,
  modules[]->{
    _id, title, slug, targetUnderstanding, subjects, ageRange, duration,
    approaches[]->{
      _id, title, slug, modality,
      activities[]->{
        _id, title, slug, summary, duration, setting, energyLevel
      }
    }
  },
  badges[]->{ _id, title, emoji, description }
}`;

// Single module with approaches and activities
export const MODULE_DETAIL_QUERY = `*[_type == "module" && _id == $id][0]{
  ...,
  approaches[]->{
    ...,
    activities[]->{
      ...,
      capabilityThreads[]->{ _id, title, domain },
      enabledBadges[]->{ _id, title, emoji }
    }
  },
  capabilityThreads[]->{ _id, title, domain, description },
  badges[]->{ _id, title, emoji, criteriaSummary }
}`;

// Single activity with full content
export const ACTIVITY_DETAIL_QUERY = `*[_type == "activity" && _id == $id][0]{
  ...,
  capabilityThreads[]->{ _id, title, domain },
  enabledBadges[]->{ _id, title, emoji }
}`;

// Pedagogy overlay for an activity + framework
export const OVERLAY_QUERY = `*[_type == "pedagogyOverlay" && activity._ref == $activityId && framework == $framework][0]`;

// Pedagogy overlays for all activities in an approach (batch)
export const OVERLAYS_BATCH_QUERY = `*[_type == "pedagogyOverlay" && activity._ref in $activityIds && framework == $framework]{
  _id,
  activity { _ref },
  lens { perspective, facilitatorTips, languageFrame, watchFor }
}`;

// Single project with all stages
export const PROJECT_DETAIL_QUERY = `*[_type == "project" && _id == $id][0]{
  ...,
  stages[]->{
    _id, title, slug, stageNumber, instructions, materials,
    estimatedDuration, artifactDescription, dependsOn, status
  } | order(stageNumber asc),
  capabilityThreads[]->{ _id, title, domain },
  badges[]->{ _id, title, emoji, criteriaSummary }
}`;

// All published projects for explore/browse
export const ALL_PROJECTS_QUERY = `*[_type == "project" && status == "published"]{
  _id, title, slug, description, subjects, ageRange, duration,
  "stageCount": count(stages),
  badges[]->{ _id, title, emoji },
  capabilityThreads[]->{ _id, title, domain }
}`;

// All capability threads (reference data)
export const CAPABILITY_THREADS_QUERY = `*[_type == "capabilityThread"] | order(domain, title){
  _id, title, slug, domain, description, dlos,
  "prerequisiteIds": prerequisites[]._ref,
  "enablesIds": enables[]._ref
}`;

// Modules in family library (by pack IDs)
export const LIBRARY_MODULES_QUERY = `*[_type == "pack" && _id in $packIds && status == "published"]{
  modules[]->{
    _id, title, slug, targetUnderstanding, subjects, ageRange, duration,
    approaches[]->{
      _id, title, modality,
      "activityCount": count(activities)
    }
  }
}`;

// All published modules with pack back-reference for explore/browse
export const ALL_MODULES_QUERY = `*[_type == "pack" && status == "published"]{
  _id,
  title,
  description,
  subjects,
  modules[]->{
    _id, title, slug, targetUnderstanding, subjects, ageRange, duration,
    approaches[]->{
      _id, title, modality,
      "activityCount": count(activities)
    }
  }
}`;

export interface SkeletonRecord {
  _id: string;
  skeletonId: string;
  threadId?: string;
  domain: string;
  targetTier: string;
  activityPreference: string;
  confidence: 'curated' | 'domain-generic' | 'generated';
  title: string;
  description: string;
  suggestedUnderstanding: string;
  suggestedSteps: Array<{ title: string; instructions: string; observationHint: string }>;
  suggestedMaterials: Array<{ name: string; isCore: boolean }>;
  indicatorsFocused: string[];
  estimatedDuration?: number;
  setting?: string;
}
