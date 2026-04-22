import { z } from 'zod';

const materialSchema = z.object({
  _key: z.string(),
  name: z.string().min(1, 'Material name required'),
  required: z.boolean(),
  alternative: z.string().optional(),
});

const activityAssetRefSchema = z.object({
  _key: z.string(),
  assetId: z.string(),
  role: z.enum(['core', 'optional', 'extension']),
  notes: z.string(),
});

const activityCommonsTextRefSchema = z.object({
  _key: z.string(),
  commonsTextId: z.string(),
  role: z.enum(['core', 'optional', 'extension']),
  presentationMode: z.enum(['read_aloud', 'child_reads', 'reference_only', 'memorisation']),
  notes: z.string(),
});

const activitySchema = z.object({
  _key: z.string(),
  title: z.string().min(1, 'Activity title required'),
  instructionsText: z.string().min(1, 'Instructions required'),
  summary: z.string().optional(),
  facilitatorGuidance: z.object({
    before: z.string().optional(),
    during: z.string().optional(),
    challenges: z.string().optional(),
  }),
  materials: z.array(materialSchema),
  assetRefs: z.array(activityAssetRefSchema),
  commonsTextRefs: z.array(activityCommonsTextRefSchema),
  duration: z.object({ min: z.number(), max: z.number() }),
  ageRange: z.object({ min: z.number(), max: z.number() }),
  setting: z.enum(['indoor', 'outdoor', 'either']),
  energyLevel: z.enum(['calm', 'moderate', 'active']),
  modality: z.enum(['kinesthetic', 'visual', 'auditory', 'narrative', 'social']),
  observationPrompts: z.array(z.string()),
  reflectionPrompts: z.array(z.string()),
  capabilityThreadIds: z.array(z.string()),
  enabledBadgeKeys: z.array(z.string()),
  deliveryChannel: z.string(),
  status: z.enum(['draft', 'published']),
});

const approachSchema = z.object({
  _key: z.string(),
  title: z.string().min(1, 'Approach title required'),
  modality: z.string(),
  description: z.string(),
  activities: z.array(activitySchema).min(1, 'At least one activity per approach'),
  status: z.enum(['draft', 'published']),
});

const moduleSchema = z.object({
  _key: z.string(),
  title: z.string().min(1, 'Module title required'),
  targetUnderstanding: z.string().min(1, 'Target understanding required'),
  understandingIndicators: z.object({
    emerging: z.string(),
    developing: z.string(),
    demonstrating: z.string(),
  }),
  subjects: z.array(z.string()),
  ageRange: z.object({ min: z.number(), max: z.number() }),
  duration: z.object({ min: z.number(), max: z.number() }),
  capabilityThreadIds: z.array(z.string()),
  badgeKeys: z.array(z.string()),
  approaches: z.array(approachSchema).min(1, 'At least one approach per module'),
  standalone: z.boolean(),
  status: z.enum(['draft', 'published']),
});

const badgeSchema = z.object({
  _key: z.string(),
  title: z.string().min(1, 'Badge title required'),
  emoji: z.string().min(1, 'Badge emoji required'),
  description: z.string().min(1, 'Badge description required'),
  criteriaSummary: z.string().min(1, 'Criteria summary required'),
  capabilityThreadIds: z.array(z.string()),
  observationThreshold: z.number().min(1),
  status: z.enum(['draft', 'published']),
});

export const packPublishSchema = z.object({
  title: z.string().min(1, 'Pack title required'),
  description: z.string().min(1, 'Pack description required'),
  intro: z.object({
    title: z.string(),
    body: z.string(),
    keyPoints: z.array(z.string()),
    furtherReading: z.array(z.object({ _key: z.string(), title: z.string(), url: z.string() })),
  }),
  subjects: z.array(z.string()),
  ageRange: z.object({ min: z.number(), max: z.number() }),
  termWeeks: z.number(),
  worldview: z.string(),
  availability: z.string(),
  stripePriceId: z.string(),
  creator: z.string(),
  version: z.string(),
  modules: z.array(moduleSchema).min(1, 'At least one module per pack'),
  badges: z.array(badgeSchema),
  status: z.string(),
});

export const standaloneModulePublishSchema = moduleSchema;
export const standaloneActivityPublishSchema = activitySchema;

export const assetPublishSchema = z.object({
  _key: z.string(),
  title: z.string().min(1, 'Asset title required'),
  kind: z.enum(['template', 'worksheet', 'reference', 'card_set', 'handout', 'audio', 'manipulative']),
  file: z.object({ assetId: z.string().min(1), filename: z.string() }).nullable(),
  license: z.enum(['hearth_proprietary', 'cc_by', 'cc_by_sa', 'public_domain', 'commissioned', 'fair_use_reference']),
  status: z.enum(['draft', 'published']),
});

export const commonsTextPublishSchema = z.object({
  _key: z.string(),
  title: z.string().min(1, 'Commons text title required'),
  kind: z.enum(['fable', 'fairy_tale', 'folk_tale', 'scripture', 'parable', 'psalm', 'proverb', 'poem', 'nursery_rhyme', 'myth', 'primary_source', 'story']),
  tradition: z.string().min(1, 'Tradition required'),
  bodyText: z.string().min(1, 'Body text required'),
  license: z.enum(['public_domain', 'cc_by', 'cc_by_sa']),
  status: z.enum(['draft', 'published']),
});

export type PackValidationError = z.ZodError;
