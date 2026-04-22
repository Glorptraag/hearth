import type {
  PackDraft,
  ModuleDraft,
  ApproachDraft,
  ActivityDraft,
  BadgeDraft,
  AssetDraft,
  CommonsTextDraft,
} from './types';
import { slugify } from '@/lib/sanity/helpers';

/**
 * Transforms studio draft shapes into the input objects expected
 * by the existing Sanity mutation functions in src/lib/sanity/mutations.ts.
 *
 * The mutation functions handle slug generation, reference wiring, and
 * Portable Text conversion internally — we just need to map field names.
 *
 * TODO: Rich instruction blocks — instructionsText is currently plain text
 * converted to "normal" Portable Text blocks via blockText(). The Sanity
 * activity schema also supports sayBlock, pauseNote, and watchBlock styles.
 * When the ActivityEditor gains a rich block picker, this transform layer
 * will need to emit pre-structured block arrays instead of plain strings.
 */

export function transformBadge(badge: BadgeDraft) {
  return {
    title: badge.title,
    slug: slugify(badge.title),
    emoji: badge.emoji,
    description: badge.description,
    criteriaSummary: badge.criteriaSummary,
    capabilityThreadIds: badge.capabilityThreadIds.length > 0 ? badge.capabilityThreadIds : undefined,
    observationThreshold: badge.observationThreshold,
    status: badge.status as 'draft' | 'published',
  };
}

export function transformActivity(activity: ActivityDraft, approachId: string) {
  return {
    title: activity.title,
    slug: slugify(activity.title),
    approachId,
    summary: activity.summary || undefined,
    instructions: activity.instructionsText,
    facilitatorGuidance:
      activity.facilitatorGuidance.before ||
      activity.facilitatorGuidance.during ||
      activity.facilitatorGuidance.challenges
        ? {
            before: activity.facilitatorGuidance.before || undefined,
            during: activity.facilitatorGuidance.during || undefined,
            challenges: activity.facilitatorGuidance.challenges || undefined,
          }
        : undefined,
    materials: activity.materials.length > 0
      ? activity.materials.map((m) => ({
          name: m.name,
          required: m.required,
          alternative: m.alternative || undefined,
        }))
      : undefined,
    assetRefs: activity.assetRefs?.length > 0
      ? activity.assetRefs.filter((a) => a.assetId).map((a) => ({
          assetId: a.assetId,
          role: a.role as 'core' | 'optional' | 'extension',
          notes: a.notes || undefined,
        }))
      : undefined,
    commonsTextRefs: activity.commonsTextRefs?.length > 0
      ? activity.commonsTextRefs.filter((t) => t.commonsTextId).map((t) => ({
          textId: t.commonsTextId,
          role: t.role as 'core' | 'optional' | 'extension',
          presentationMode: t.presentationMode as 'read_aloud' | 'child_reads' | 'reference_only' | 'memorisation',
          notes: t.notes || undefined,
        }))
      : undefined,
    duration: { min: activity.duration.min, max: activity.duration.max },
    setting: activity.setting as 'indoor' | 'outdoor' | 'either',
    energyLevel: activity.energyLevel as 'calm' | 'moderate' | 'active',
    modality: activity.modality as 'kinesthetic' | 'visual' | 'auditory' | 'narrative' | 'social',
    observationPrompts: activity.observationPrompts.length > 0 ? activity.observationPrompts : undefined,
    reflectionPrompts: activity.reflectionPrompts.length > 0 ? activity.reflectionPrompts : undefined,
    capabilityThreadIds: activity.capabilityThreadIds.length > 0 ? activity.capabilityThreadIds : undefined,
    badgeIds: activity.enabledBadgeKeys.length > 0 ? activity.enabledBadgeKeys : undefined,
    status: activity.status as 'draft' | 'published',
  };
}

export function transformApproach(approach: ApproachDraft) {
  return {
    title: approach.title,
    slug: slugify(approach.title),
    modality: (approach.modality || undefined) as 'kinesthetic' | 'visual' | 'auditory' | 'narrative' | 'social' | 'exploratory' | undefined,
    description: approach.description || undefined,
  };
}

export function transformModuleForFullCreate(mod: ModuleDraft) {
  return {
    title: mod.title,
    slug: slugify(mod.title),
    targetUnderstanding: mod.targetUnderstanding,
    understandingIndicators:
      mod.understandingIndicators.emerging ||
      mod.understandingIndicators.developing ||
      mod.understandingIndicators.demonstrating
        ? {
            emerging: mod.understandingIndicators.emerging || undefined,
            developing: mod.understandingIndicators.developing || undefined,
            demonstrating: mod.understandingIndicators.demonstrating || undefined,
          }
        : undefined,
    subjects: mod.subjects.length > 0 ? mod.subjects : undefined,
    ageRange: { min: mod.ageRange.min, max: mod.ageRange.max },
    duration: { min: mod.duration.min, max: mod.duration.max },
    capabilityThreadIds: mod.capabilityThreadIds.length > 0 ? mod.capabilityThreadIds : undefined,
    status: mod.status as 'draft' | 'published',
    approaches: mod.approaches.map((a) => ({
      title: a.title,
      slug: slugify(a.title),
      modality: (a.modality || undefined) as 'kinesthetic' | 'visual' | 'auditory' | 'narrative' | 'social' | 'exploratory' | undefined,
      description: a.description || undefined,
      activities: a.activities.map((act) => ({
        title: act.title,
        slug: slugify(act.title),
        summary: act.summary || undefined,
        instructions: act.instructionsText,
        facilitatorGuidance:
          act.facilitatorGuidance.before || act.facilitatorGuidance.during || act.facilitatorGuidance.challenges
            ? {
                before: act.facilitatorGuidance.before || undefined,
                during: act.facilitatorGuidance.during || undefined,
                challenges: act.facilitatorGuidance.challenges || undefined,
              }
            : undefined,
        materials: act.materials.length > 0
          ? act.materials.map((m) => ({
              name: m.name,
              required: m.required,
              alternative: m.alternative || undefined,
            }))
          : undefined,
        assetRefs: act.assetRefs?.length > 0
          ? act.assetRefs.filter((a) => a.assetId).map((a) => ({
              assetId: a.assetId,
              role: a.role as 'core' | 'optional' | 'extension',
              notes: a.notes || undefined,
            }))
          : undefined,
        commonsTextRefs: act.commonsTextRefs?.length > 0
          ? act.commonsTextRefs.filter((t) => t.commonsTextId).map((t) => ({
              textId: t.commonsTextId,
              role: t.role as 'core' | 'optional' | 'extension',
              presentationMode: t.presentationMode as 'read_aloud' | 'child_reads' | 'reference_only' | 'memorisation',
              notes: t.notes || undefined,
            }))
          : undefined,
        duration: { min: act.duration.min, max: act.duration.max },
        setting: act.setting,
        energyLevel: act.energyLevel,
        modality: act.modality,
        observationPrompts: act.observationPrompts.length > 0 ? act.observationPrompts : undefined,
        reflectionPrompts: act.reflectionPrompts.length > 0 ? act.reflectionPrompts : undefined,
        capabilityThreadIds: act.capabilityThreadIds.length > 0 ? act.capabilityThreadIds : undefined,
        status: act.status,
      })),
    })),
  };
}

export function transformPack(
  pack: PackDraft,
  moduleIds: string[],
  badgeIds: string[],
  assetKindMap?: Map<string, string>,
) {
  const allActivities = pack.modules.flatMap((m) =>
    m.approaches.flatMap((a) => a.activities),
  );

  let assetCounts: Record<string, number> | undefined;
  let commonsTextCount: number | undefined;

  if (assetKindMap) {
    const uniqueAssetIds = new Set<string>();
    const uniqueTextIds = new Set<string>();
    for (const act of allActivities) {
      for (const ar of act.assetRefs ?? []) {
        if (ar.assetId) uniqueAssetIds.add(ar.assetId);
      }
      for (const tr of act.commonsTextRefs ?? []) {
        if (tr.commonsTextId) uniqueTextIds.add(tr.commonsTextId);
      }
    }

    const counts: Record<string, number> = {
      template: 0, worksheet: 0, reference: 0, card_set: 0,
      handout: 0, audio: 0, manipulative: 0, total: 0,
    };
    for (const id of uniqueAssetIds) {
      const kind = assetKindMap.get(id);
      if (kind && kind in counts) counts[kind]++;
      counts.total++;
    }
    assetCounts = counts;
    commonsTextCount = uniqueTextIds.size;
  }

  return {
    title: pack.title,
    slug: slugify(pack.title),
    description: pack.description || undefined,
    subjects: pack.subjects.length > 0 ? pack.subjects : undefined,
    ageRange: { min: pack.ageRange.min, max: pack.ageRange.max },
    termWeeks: pack.termWeeks,
    worldview: (pack.worldview || undefined) as 'christian-classical' | 'secular' | 'neutral' | undefined,
    availability: (pack.availability || undefined) as 'included' | 'premium' | undefined,
    stripePriceId: pack.stripePriceId || undefined,
    creator: pack.creator || undefined,
    version: pack.version || undefined,
    moduleIds,
    badgeIds: badgeIds.length > 0 ? badgeIds : undefined,
    moduleCount: pack.modules.length,
    totalActivities: pack.modules.reduce(
      (s, m) => s + m.approaches.reduce((s2, a) => s2 + a.activities.length, 0),
      0,
    ),
    assetCounts,
    commonsTextCount,
    status: pack.status as 'draft' | 'published' | 'archived',
  };
}

export function transformAsset(asset: AssetDraft) {
  const s = slugify(asset.title);
  return {
    _id: `asset.${asset.kind}.${s}`,
    title: asset.title,
    slug: s,
    kind: asset.kind,
    fileRef: asset.file?.assetId || undefined,
    thumbnailRef: asset.thumbnail?.assetId || undefined,
    pageCount: asset.pageCount || undefined,
    description: asset.description || undefined,
    printGuidance: asset.printGuidance || undefined,
    ageBand: asset.ageBand || undefined,
    license: asset.license,
    source: asset.source || undefined,
    sourceUrl: asset.sourceUrl || undefined,
    tags: asset.tags.length > 0 ? asset.tags : undefined,
    relatedCommonsTextIds: asset.relatedCommonsTextIds.length > 0 ? asset.relatedCommonsTextIds : undefined,
    status: asset.status as 'draft' | 'published',
    version: asset.version,
  };
}

export function transformCommonsText(text: CommonsTextDraft) {
  const s = slugify(text.title);
  return {
    _id: `commons.${text.tradition}.${s}`,
    title: text.title,
    slug: s,
    kind: text.kind,
    tradition: text.tradition,
    body: text.bodyText || undefined,
    shortBody: text.shortBodyText || undefined,
    readAloudVersion: text.readAloudVersionText || undefined,
    estimatedReadAloudMinutes: text.estimatedReadAloudMinutes || undefined,
    length: (text.length || undefined) as 'micro' | 'short' | 'medium' | 'long' | undefined,
    readingLevel: (text.readingLevel || undefined) as '5-7' | '7-9' | '9-12' | '12-15' | undefined,
    themes: text.themes.length > 0 ? text.themes : undefined,
    moralOrLesson: text.moralOrLesson || undefined,
    source: text.source || undefined,
    sourceUrl: text.sourceUrl || undefined,
    license: text.license,
    relatedAssetIds: text.relatedAssetIds.length > 0 ? text.relatedAssetIds : undefined,
    relatedTextIds: text.relatedTextIds.length > 0 ? text.relatedTextIds : undefined,
    tags: text.tags.length > 0 ? text.tags : undefined,
    status: text.status as 'draft' | 'published',
  };
}
