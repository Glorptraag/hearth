import type { Subject } from '@/types';

// ─── Enums ───

export const MODALITIES = [
  'kinesthetic',
  'visual',
  'auditory',
  'narrative',
  'social',
  'exploratory',
] as const;
export type Modality = (typeof MODALITIES)[number];

export const ACTIVITY_MODALITIES = [
  'kinesthetic',
  'visual',
  'auditory',
  'narrative',
  'social',
] as const;
export type ActivityModality = (typeof ACTIVITY_MODALITIES)[number];

export const SETTINGS = ['indoor', 'outdoor', 'either'] as const;
export type Setting = (typeof SETTINGS)[number];

export const ENERGY_LEVELS = ['calm', 'moderate', 'active'] as const;
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

export const WORLDVIEWS = ['christian-classical', 'secular', 'neutral'] as const;
export type Worldview = (typeof WORLDVIEWS)[number];

export const AVAILABILITIES = ['included', 'premium'] as const;
export type Availability = (typeof AVAILABILITIES)[number];

export const CONTENT_STATUSES = ['draft', 'published'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const PACK_STATUSES = ['draft', 'published', 'archived'] as const;
export type PackStatus = (typeof PACK_STATUSES)[number];

export const DELIVERY_CHANNELS = [
  'screen',
  'audio',
  'physical',
  'cast',
  'print',
  'journal',
] as const;
export type DeliveryChannel = (typeof DELIVERY_CHANNELS)[number];

export const ASSET_KINDS = [
  'template',
  'worksheet',
  'reference',
  'card_set',
  'handout',
  'audio',
  'manipulative',
] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export const COMMONS_TEXT_KINDS = [
  'fable',
  'fairy_tale',
  'folk_tale',
  'scripture',
  'parable',
  'psalm',
  'proverb',
  'poem',
  'nursery_rhyme',
  'myth',
  'primary_source',
  'story',
] as const;
export type CommonsTextKind = (typeof COMMONS_TEXT_KINDS)[number];

export const AGE_BANDS = ['5-7', '7-9', '9-12', '12-15', 'all'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const ASSET_LICENSES = [
  'hearth_proprietary',
  'cc_by',
  'cc_by_sa',
  'public_domain',
  'commissioned',
  'fair_use_reference',
] as const;
export type AssetLicense = (typeof ASSET_LICENSES)[number];

export const COMMONS_TEXT_LICENSES = ['public_domain', 'cc_by', 'cc_by_sa'] as const;
export type CommonsTextLicense = (typeof COMMONS_TEXT_LICENSES)[number];

export const TEXT_LENGTHS = ['micro', 'short', 'medium', 'long'] as const;
export type TextLength = (typeof TEXT_LENGTHS)[number];

export const ASSET_ROLES = ['core', 'optional', 'extension'] as const;
export type AssetRole = (typeof ASSET_ROLES)[number];

export const PRESENTATION_MODES = [
  'read_aloud',
  'child_reads',
  'reference_only',
  'memorisation',
] as const;
export type PresentationMode = (typeof PRESENTATION_MODES)[number];

export const READING_LEVELS = ['5-7', '7-9', '9-12', '12-15'] as const;
export type ReadingLevel = (typeof READING_LEVELS)[number];

// ─── Draft document shapes ───

export interface MaterialDraft {
  _key: string;
  name: string;
  required: boolean;
  alternative?: string;
}

export interface FacilitatorGuidanceDraft {
  before?: string;
  during?: string;
  challenges?: string;
}

export interface BadgeDraft {
  _key: string;
  title: string;
  emoji: string;
  description: string;
  criteriaSummary: string;
  capabilityThreadIds: string[];
  observationThreshold: number;
  status: ContentStatus;
}

export interface ActivityAssetRefDraft {
  _key: string;
  assetId: string;
  role: AssetRole;
  notes: string;
}

export interface ActivityCommonsTextRefDraft {
  _key: string;
  commonsTextId: string;
  role: AssetRole;
  presentationMode: PresentationMode;
  notes: string;
}

export interface ActivityDraft {
  _key: string;
  title: string;
  summary: string;
  instructionsText: string;
  facilitatorGuidance: FacilitatorGuidanceDraft;
  materials: MaterialDraft[];
  assetRefs: ActivityAssetRefDraft[];
  commonsTextRefs: ActivityCommonsTextRefDraft[];
  duration: { min: number; max: number };
  ageRange: { min: number; max: number };
  setting: Setting;
  energyLevel: EnergyLevel;
  modality: ActivityModality;
  observationPrompts: string[];
  reflectionPrompts: string[];
  capabilityThreadIds: string[];
  enabledBadgeKeys: string[];
  deliveryChannel: DeliveryChannel;
  status: ContentStatus;
}

export interface SanityFileRef {
  assetId: string;
  filename: string;
}

export interface AssetDraft {
  _key: string;
  title: string;
  kind: AssetKind;
  file: SanityFileRef | null;
  thumbnail: SanityFileRef | null;
  pageCount: number;
  description: string;
  printGuidance: string;
  ageBand: AgeBand;
  license: AssetLicense;
  source: string;
  sourceUrl: string;
  tags: string[];
  relatedCommonsTextIds: string[];
  status: ContentStatus;
  version: number;
}

export interface CommonsTextDraft {
  _key: string;
  title: string;
  kind: CommonsTextKind;
  tradition: string;
  bodyText: string;
  shortBodyText: string;
  readAloudVersionText: string;
  estimatedReadAloudMinutes: number;
  length: TextLength | '';
  readingLevel: ReadingLevel | '';
  themes: string[];
  moralOrLesson: string;
  source: string;
  sourceUrl: string;
  license: CommonsTextLicense;
  relatedAssetIds: string[];
  relatedTextIds: string[];
  tags: string[];
  status: ContentStatus;
}

export interface ApproachDraft {
  _key: string;
  title: string;
  modality: Modality | '';
  description: string;
  activities: ActivityDraft[];
  status: ContentStatus;
}

export interface UnderstandingIndicators {
  emerging: string;
  developing: string;
  demonstrating: string;
}

export interface ModuleDraft {
  _key: string;
  title: string;
  targetUnderstanding: string;
  understandingIndicators: UnderstandingIndicators;
  subjects: Subject[];
  ageRange: { min: number; max: number };
  duration: { min: number; max: number };
  capabilityThreadIds: string[];
  badgeKeys: string[];
  approaches: ApproachDraft[];
  standalone: boolean;
  status: ContentStatus;
}

export interface FurtherReadingItem {
  _key: string;
  title: string;
  url: string;
}

export interface PackIntroDraft {
  title: string;
  body: string;
  keyPoints: string[];
  furtherReading: FurtherReadingItem[];
}

export interface PackDraft {
  _key: string;
  title: string;
  description: string;
  intro: PackIntroDraft;
  subjects: Subject[];
  ageRange: { min: number; max: number };
  termWeeks: number;
  worldview: Worldview;
  availability: Availability;
  stripePriceId: string;
  creator: string;
  version: string;
  modules: ModuleDraft[];
  badges: BadgeDraft[];
  status: PackStatus;
}

// ─── Top-level studio state ───

export interface StudioState {
  packs: PackDraft[];
  standaloneModules: ModuleDraft[];
  standaloneActivities: ActivityDraft[];
  assets: AssetDraft[];
  commonsTexts: CommonsTextDraft[];
}

// ─── Sidebar selection ───

export type SelectionScope = 'pack' | 'standalone-module' | 'standalone-activity';

export type Selection =
  | { scope: 'pack'; pi: number; type: 'pack' }
  | { scope: 'pack'; pi: number; mi: number; type: 'module' }
  | { scope: 'pack'; pi: number; mi: number; ai: number; type: 'approach' }
  | { scope: 'pack'; pi: number; mi: number; ai: number; acti: number; type: 'activity' }
  | { scope: 'pack'; pi: number; bi: number; type: 'badge' }
  | { scope: 'standalone-module'; mi: number; type: 'module' }
  | { scope: 'standalone-module'; mi: number; ai: number; type: 'approach' }
  | { scope: 'standalone-module'; mi: number; ai: number; acti: number; type: 'activity' }
  | { scope: 'standalone-activity'; acti: number; type: 'activity' }
  | { scope: 'asset'; index: number; type: 'asset' }
  | { scope: 'commonsText'; index: number; type: 'commonsText' };

// ─── Capability thread (loaded from Sanity) ───

export interface CapabilityThreadOption {
  _id: string;
  title: string;
  slug: string;
  domain: string;
  description?: string;
}

// ─── Draft DB row shape ───

export type DraftType = 'pack' | 'standalone_module' | 'standalone_activity';

export interface ContentDraftRow {
  id: string;
  clerkUserId: string;
  title: string;
  draftType: DraftType;
  draftData: StudioState;
  status: string;
  sanityPackId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// ─── Reducer action types ───

export type StudioAction =
  | { type: 'LOAD'; payload: StudioState }
  | { type: 'SET_FIELD'; path: (string | number)[]; value: unknown }
  | { type: 'ADD_PACK'; title: string }
  | { type: 'ADD_STANDALONE_MODULE'; title: string }
  | { type: 'ADD_STANDALONE_ACTIVITY'; title: string }
  | { type: 'ADD_MODULE'; pi: number; title: string }
  | { type: 'ADD_APPROACH'; scope: SelectionScope; pi?: number; mi: number; title: string }
  | { type: 'ADD_ACTIVITY'; scope: SelectionScope; pi?: number; mi: number; ai: number; title: string }
  | { type: 'ADD_BADGE'; pi: number; title: string }
  | { type: 'DELETE_SELECTED'; sel: Selection }
  | { type: 'TOGGLE_ARRAY_ITEM'; path: (string | number)[]; value: string }
  | { type: 'ADD_ASSET'; asset: AssetDraft }
  | { type: 'DELETE_ASSET'; index: number }
  | { type: 'UPDATE_ASSET'; index: number; asset: AssetDraft }
  | { type: 'ADD_COMMONS_TEXT'; text: CommonsTextDraft }
  | { type: 'DELETE_COMMONS_TEXT'; index: number }
  | { type: 'UPDATE_COMMONS_TEXT'; index: number; text: CommonsTextDraft }
  | { type: 'BULK_IMPORT_COMMONS_TEXTS'; texts: CommonsTextDraft[] };
