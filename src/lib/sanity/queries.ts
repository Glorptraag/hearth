// ─────────────────────────────────────────────────────────────────────────────
// SANITY GATING INVARIANT (see deepwork plan: make-a-deepwork-plan-velvety-candy)
//
// Every runtime query that fetches `pack`, `module`, `activity`, `asset`,
// `commonsText`, or `project` documents MUST filter by `status == "published"`.
// Publishing in Sanity is the ONLY mechanism that makes content live; no repo
// change should ever be required to flip availability.
//
// For dereferenced arrays (e.g. `pack.modules[]->`), filter BEFORE the deref:
//   modules[@->status == "published"]->{...}
// — never modules[]->{...} without the gate.
//
// The admin QA path (src/app/(admin)/admin/content/qa/*, src/lib/content-qa/*)
// is intentionally exempt because it exists to QA drafts. Mark exempt callers
// with a comment that references this invariant.
//
// A CI script (scripts/check-sanity-gating.mjs) enforces this on every PR.
// ─────────────────────────────────────────────────────────────────────────────

// Reusable projection for the pack/module indicators feature.
// - Derefs kitRef so the detail view can render contents + price without a
//   second fetch.
// - Pulls denormalised assetCounts so the indicator can derive
//   `printables.available` when the editor hasn't explicitly authored it
//   (see derivePrintablesFromAssetCounts in src/lib/sanity/pack-indicators.ts).
//   GROQ ignores fields the document doesn't have (returns null), so projecting
//   assetCounts on a module is harmless.
export const PACK_INDICATORS_PROJECTION = `
  printables{ available, count },
  materials{
    mode,
    description,
    kitPriceAUD,
    kitRef->{ _id, title, contents, priceAUD, stripePriceId }
  },
  assetCounts
`;

// Pack list for marketplace/activity discovery.
// moduleCount gates on status so the card matches what the pack detail renders
// (modules[@->status == "published"]) — an un-gated count(modules) would count
// draft modules and over-report on the marketplace card. Mirrors the gated
// count(activities[@->status == "published"]) pattern in ALL_MODULES_QUERY.
export const PACKS_QUERY = `*[_type == "pack" && status == "published"]{
  _id, title, slug, description, subjects, ageRange,
  "moduleCount": count(modules[@->status == "published"]),
  totalActivities,
  availability, version, creator, creatorType, stripePriceId, "badgeCount": count(badges),
  assetCounts, commonsTextCount,
  ${PACK_INDICATORS_PROJECTION}
}`;

// Single pack with full module tree
export const PACK_DETAIL_QUERY = `*[_type == "pack" && slug.current == $slug && status == "published"][0]{
  ...,
  assetCounts,
  commonsTextCount,
  ${PACK_INDICATORS_PROJECTION},
  "modules": modules[@->status == "published"]->{
    _id, title, slug, targetUnderstanding, subjects, ageRange, duration, status,
    ${PACK_INDICATORS_PROJECTION},
    "approaches": approaches[@->status == "published"]->{
      _id, title, slug, modality,
      "activities": activities[@->status == "published"]->{
        _id, title, slug, summary, duration, setting, energyLevel,
        // Counts gate on the referenced doc's status so the pack detail
        // promises exactly what the runner renders (MODULE_DETAIL_QUERY
        // filters assets/commonsTexts the same way). A bare count() also
        // counted broken refs whose deref resolves to nothing.
        "assetCount": count(assets[@.asset->status == "published"]),
        "commonsTextCount": count(commonsTexts[@.text->status == "published"])
      }
    }
  },
  badges[]->{ _id, title, emoji, description }
}`;

// Single module with approaches and activities
// NOTE: fileUrl intentionally excluded — this query runs client-side.
// Downloads go through /api/assets/download which checks entitlements.
export const MODULE_DETAIL_QUERY = `*[_type == "module" && _id == $id && status == "published"][0]{
  ...,
  ${PACK_INDICATORS_PROJECTION},
  "owningPack": *[_type == "pack" && status == "published" && references(^._id)][0]{
    _id, title, slug,
    ${PACK_INDICATORS_PROJECTION}
  },
  "approaches": approaches[@->status == "published"]->{
    ...,
    "activities": activities[@->status == "published"]->{
      ...,
      capabilityThreads[]->{ _id, title, domain },
      enabledBadges[]->{ _id, title, emoji },
      "assets": assets[@.asset->status == "published"]{
        _key, role, notes,
        asset->{ _id, title, slug, kind, pageCount, description, printGuidance, ageBand, status,
          "thumbnailUrl": thumbnail.asset->url
        }
      },
      "commonsTexts": commonsTexts[@.text->status == "published"]{
        _key, role, presentationMode, notes,
        text->{ _id, title, slug, kind, tradition, body, shortBody, readAloudVersion,
          estimatedReadAloudMinutes, length, source, status,
          "audioUrl": *[_type == "asset" && kind == "audio" && status == "published" && references(^._id)][0].file.asset->url
        }
      }
    }
  },
  capabilityThreads[]->{ _id, title, domain, description },
  badges[]->{ _id, title, emoji, criteriaSummary }
}`;

// Single activity with full content
// NOTE: fileUrl intentionally excluded — this query runs client-side.
export const ACTIVITY_DETAIL_QUERY = `*[_type == "activity" && _id == $id && status == "published"][0]{
  ...,
  capabilityThreads[]->{ _id, title, domain },
  enabledBadges[]->{ _id, title, emoji },
  "assets": assets[@.asset->status == "published"]{
    _key, role, notes,
    asset->{ _id, title, slug, kind, pageCount, description, printGuidance, ageBand, status,
      "thumbnailUrl": thumbnail.asset->url
    }
  },
  "commonsTexts": commonsTexts[@.text->status == "published"]{
    _key, role, presentationMode, notes,
    text->{ _id, title, slug, kind, tradition, body, shortBody, readAloudVersion,
      estimatedReadAloudMinutes, length, source, status,
      "audioUrl": *[_type == "asset" && kind == "audio" && status == "published" && references(^._id)][0].file.asset->url
    }
  }
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
export const PROJECT_DETAIL_QUERY = `*[_type == "project" && _id == $id && status == "published"][0]{
  ...,
  "stages": stages[@->status == "published"]->{
    _id, title, slug, stageNumber, instructions, materials,
    estimatedDuration, artifactDescription, dependsOn, status
  } | order(stageNumber asc),
  capabilityThreads[]->{ _id, title, domain },
  badges[]->{ _id, title, emoji, criteriaSummary }
}`;

// All published projects for explore/browse
export const ALL_PROJECTS_QUERY = `*[_type == "project" && status == "published"]{
  _id, title, slug, description, subjects, ageRange, duration,
  "stageCount": count(stages[@->status == "published"]),
  badges[]->{ _id, title, emoji },
  capabilityThreads[]->{ _id, title, domain }
}`;

// All capability threads (reference data)
export const CAPABILITY_THREADS_QUERY = `*[_type == "capabilityThread"] | order(domain, title){
  _id, title, slug, domain, description, dlos,
  "prerequisiteIds": prerequisites[]._ref,
  "enablesIds": enables[]._ref
}`;

// All discrete learning objectives (reference data, grouped client-side by thread).
// Deterministic IDs follow the convention `dlo.{threadId}.{tier}` (one per tier per
// thread today; the array shape supports n-per-tier authoring once Studio editing
// adds extras). Status field gates draft-vs-published.
// `descriptor` is aliased to coalesce(parentVersion, descriptor): the lo-fi
// descriptors are already parent-readable, so there is no parent/technical
// split — if a parentVersion is ever authored it wins, otherwise the
// descriptor renders. Transitional per Item 4. `badgeLevel` is still selected
// but is not seeded; the constellation synthesises it from tier (Item 5).
export const ALL_DLOS_QUERY = `*[_type == "discreteLearningObjective" && status == "published"]{
  _id,
  "threadId": thread->slug.current,
  "threadRef": thread._ref,
  tier,
  "descriptor": coalesce(parentVersion, descriptor),
  badgeLevel
} | order(tier asc, _id asc)`;

// Lean per-thread DLO tier list for the Family Intelligence Snapshot rebuild.
// Standalone discreteLearningObjective documents are the single source of
// truth (Item 3); the constellation visualiser reads the SAME documents.
// (WS-4 removed the snapshot's fabricated dlos_confirmed math — real per-DLO
// status comes from learner_dlo_status.) threadRef is the deterministic
// `capabilityThread.{shortCode}` ref written by seed-dlos.ts.
export const DLO_TIERS_QUERY = `*[_type == "discreteLearningObjective" && status == "published"]{
  _id,
  "threadRef": thread._ref,
  tier
} | order(_id asc)`;

// DLO → regulatory-framework mappings for the deterministic coverage transposer
// (WS-5). One row per published DLO; `regulatoryMappings` carries the verbatim
// atomicCapability shape (frameworkKey/frameworkVersion/codes/reportTier/
// contribution/evidenceWeight). The report/coverage path joins these against
// `learner_dlo_status` keyed by the deterministic `dlo.{threadId}.{tier}` _id.
// Separate from ALL_DLOS_QUERY (the constellation consumer) on purpose.
export const DLO_MAPPINGS_QUERY = `*[_type == "discreteLearningObjective" && status == "published"]{
  _id,
  tier,
  "threadRef": thread._ref,
  regulatoryMappings[]{
    frameworkKey,
    frameworkVersion,
    codes,
    reportTier,
    contribution,
    evidenceWeight
  }
} | order(_id asc)`;

// Lightweight indicator fetch for Planner / Dashboard / any compact-card surface.
// Returns the module's own printables/materials AND its owning pack's, so the
// caller can apply resolveIndicators() inheritance client-side.
export const MODULE_INDICATORS_QUERY = `*[_type == "module" && _id in $ids && status == "published"]{
  _id,
  ${PACK_INDICATORS_PROJECTION},
  "owningPack": *[_type == "pack" && status == "published" && references(^._id)][0]{
    _id,
    ${PACK_INDICATORS_PROJECTION}
  }
}`;

// Modules in family library (by pack IDs)
export const LIBRARY_MODULES_QUERY = `*[_type == "pack" && _id in $packIds && status == "published"]{
  _id,
  ${PACK_INDICATORS_PROJECTION},
  "modules": modules[@->status == "published"]->{
    _id, title, slug, targetUnderstanding, subjects, ageRange, duration,
    ${PACK_INDICATORS_PROJECTION},
    "approaches": approaches[@->status == "published"]->{
      _id, title, modality,
      "activityCount": count(activities[@->status == "published"])
    }
  }
}`;

// Scoring-ready modules for recommendation engine (includes capability thread slugs + energy levels)
export const SCORING_MODULES_QUERY = `*[_type == "pack" && _id in $packIds && status == "published"]{
  "modules": modules[@->status == "published"]->{
    _id, title, subjects,
    "capabilityThreadTitles": capabilityThreads[]->title,
    "averageEnergyLevel": approaches[0].activities[0]->energyLevel
  }
}`;

// All published modules with pack back-reference for explore/browse
export const ALL_MODULES_QUERY = `*[_type == "pack" && status == "published"]{
  _id,
  title,
  description,
  subjects,
  "modules": modules[@->status == "published"]->{
    _id, title, slug, targetUnderstanding, subjects, ageRange, duration,
    "approaches": approaches[@->status == "published"]->{
      _id, title, modality,
      "activityCount": count(activities[@->status == "published"])
    }
  }
}`;

// Own-authored standalone modules for Activity Discovery + Library
// Private-by-default: only returns modules authored by the given family.
export const DISCOVERY_OWN_MODULES_QUERY = `*[_type == "module" && status == "published" && authorFamilyId == $familyId]{
  _id, title, slug, targetUnderstanding, subjects, ageRange, duration, createdVia,
  "approaches": approaches[@->status == "published"]->{
    _id, title, modality,
    "activityCount": count(activities[@->status == "published"])
  }
}`;

// Scoring-ready standalone modules authored by the family (for recommendations)
export const SCORING_OWN_MODULES_QUERY = `*[_type == "module" && status == "published" && authorFamilyId == $familyId]{
  _id, title, subjects,
  "capabilityThreadTitles": capabilityThreads[]->title,
  "averageEnergyLevel": approaches[0]->activities[0]->energyLevel
}`;

// Standalone marketplace modules: published, curated (not family-private), and
// NOT contained in any published pack — so the Marketplace's module view never
// duplicates a pack's own modules. Powers the ?kind=module browse (Task 6.3).
export const STANDALONE_MODULES_QUERY = `*[
  _type == "module"
  && status == "published"
  && !defined(authorFamilyId)
  && !(_id in *[_type == "pack" && status == "published"].modules[]._ref)
]{
  _id, title, subjects, targetUnderstanding, ageRange, duration,
  "approachCount": count(approaches[@->status == "published"])
} | order(title asc)`;

// Single asset with full metadata
export const ASSET_DETAIL_QUERY = `*[_type == "asset" && _id == $id && status == "published"][0]{
  ...,
  "fileUrl": file.asset->url,
  "thumbnailUrl": thumbnail.asset->url,
  relatedCommonsTexts[]->{ _id, title, slug, kind }
}`;

// Single commons text with full content
export const COMMONS_TEXT_DETAIL_QUERY = `*[_type == "commonsText" && _id == $id && status == "published"][0]{
  ...,
  relatedAssets[]->{ _id, title, slug, kind },
  relatedTexts[]->{ _id, title, slug, kind }
}`;

// All assets and commons texts for a set of activities (batch fetch for planner/module)
// NOTE: fileUrl intentionally excluded — this query runs client-side.
export const ACTIVITIES_MATERIALS_QUERY = `*[_type == "activity" && _id in $ids && status == "published"]{
  _id, title,
  "assets": assets[@.asset->status == "published"]{
    _key, role, notes,
    asset->{ _id, title, slug, kind, pageCount, description, printGuidance, status,
      "thumbnailUrl": thumbnail.asset->url
    }
  },
  "commonsTexts": commonsTexts[@.text->status == "published"]{
    _key, role, presentationMode, notes,
    text->{ _id, title, slug, kind, tradition, estimatedReadAloudMinutes, length, source, status }
  }
}`;

// Reverse lookup: which published packs contain a given asset (for entitlement check)
export const ASSET_ENTITLEMENT_QUERY = `*[_type == "pack" && status == "published" && references($assetId)]{ _id }`;

// Reverse lookup: which published packs contain a given commons text (for entitlement check)
export const COMMONS_TEXT_ENTITLEMENT_QUERY = `*[_type == "pack" && status == "published" && references($textId)]{ _id }`;

// Batch fetch materials for multiple modules (used by weekly planner print)
// NOTE: fileUrl intentionally excluded — this query runs client-side.
export const MODULES_MATERIALS_BATCH_QUERY = `*[_type == "module" && _id in $ids && status == "published"]{
  _id, title,
  "approaches": approaches[@->status == "published"]->{
    "activities": activities[@->status == "published"]->{
      _id, title,
      "assets": assets[@.asset->status == "published"]{
        _key, role,
        asset->{ _id, title, slug, kind, pageCount, description, printGuidance, status,
          "thumbnailUrl": thumbnail.asset->url
        }
      },
      "commonsTexts": commonsTexts[@.text->status == "published"]{
        _key, role, presentationMode,
        text->{ _id, title, slug, kind, tradition, estimatedReadAloudMinutes, length, source, status }
      }
    }
  }
}`;

// Pack materials for marketplace preview and library view
// NOTE: fileUrl intentionally excluded — this query runs client-side.
// Downloads go through /api/assets/download which checks entitlements.
export const PACK_MATERIALS_QUERY = `*[_type == "pack" && _id == $packId && status == "published"][0]{
  _id, title,
  "modules": modules[@->status == "published"]->{
    _id, title,
    "approaches": approaches[@->status == "published"]->{
      "activities": activities[@->status == "published"]->{
        _id, title,
        "assets": assets[@.asset->status == "published"]{
          _key, role, notes,
          asset->{ _id, title, slug, kind, pageCount, description, printGuidance, ageBand, status,
            "thumbnailUrl": thumbnail.asset->url
          }
        },
        "commonsTexts": commonsTexts[@.text->status == "published"]{
          _key, role, presentationMode, notes,
          text->{ _id, title, slug, kind, tradition, estimatedReadAloudMinutes, length, source, status }
        }
      }
    }
  }
}`;

// Pedagogical framework by pedagogy key (slug field)
export const FRAMEWORK_BY_PEDAGOGY_KEY_QUERY = `*[_type == "pedagogicalFramework" && slug == $pedagogyKey][0]{
  _id, slug
}`;

// PKB: Practice patterns for a given framework
export const PRACTICE_PATTERNS_QUERY = `*[_type == "pedagogyPracticePattern" && references($frameworkId)]{
  _id, triggerTitle, triggerContext, traditionResponse, antiPattern, tags
}`;

// PKB: Observational markers for a given framework
export const OBSERVATIONAL_MARKERS_QUERY = `*[_type == "pedagogyObservationalMarker" && references($frameworkId)]{
  _id, markerName, whatItIndicates, markersToLookFor, tags
}`;

// PKB: Source excerpts for a given framework (Learn More panel). Excludes
// suggested drafts. `pedagogySourceExcerpt` uses dotted ids → dark to the
// tokenless browser client, so this reads through the authed proxy.
export const PEDAGOGY_SOURCE_EXCERPTS_QUERY = `*[_type == "pedagogySourceExcerpt" && references($frameworkId) && status == "published" && suggestedDraft != true]{
  text, isParaphrase,
  sourceAttribution{ author, title, year, pageOrChapter },
  tags
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

// ─── Site copy ───────────────────────────────────────────────────────────────
// Every published `siteCopy` document (one per surface). Not a gated content
// type: Sanity's own draft/publish is the swap mechanism, and the app merges
// values over code defaults (src/lib/copy/defaults.ts) so a missing doc or key
// is never a failure. Tokenless readers never see drafts, so no draft filter
// is needed here.
export const SITE_COPY_QUERY = `*[_type == "siteCopy"]{
  surface,
  "entries": entries[]{ key, value }
}`;
