// ─── Module Experience Types ─────────────────────────────────────────────────

import type { Printables, Materials, AssetCounts } from '@/lib/sanity/pack-indicators';

export interface Material {
  name: string;
  alternative?: string;
  required: boolean;
}

export interface CapabilityThread {
  _id: string;
  title: string;
  domain: string;
  description?: string;
}

export interface Badge {
  _id: string;
  title: string;
  emoji: string;
  criteriaSummary?: string;
}

export interface ActivityAsset {
  _key: string;
  role: string;
  notes?: string;
  asset: {
    _id: string;
    title: string;
    slug?: { current: string };
    kind: string;
    pageCount?: number;
    description?: string;
    printGuidance?: string;
    ageBand?: string;
    status: string;
    fileUrl?: string;
    thumbnailUrl?: string;
  };
}

export interface ActivityCommonsText {
  _key: string;
  role: string;
  presentationMode?: string;
  notes?: string;
  text: {
    _id: string;
    title: string;
    slug?: { current: string };
    kind: string;
    tradition?: string;
    body?: unknown[];
    shortBody?: unknown[];
    readAloudVersion?: unknown[];
    estimatedReadAloudMinutes?: number;
    length?: string;
    source?: string;
    status: string;
  };
}

export interface Activity {
  _id: string;
  title: string;
  summary?: string;
  instructions?: unknown[];
  facilitatorGuidance?: { before?: string; during?: string; challenges?: string };
  materials?: Material[];
  assets?: ActivityAsset[];
  commonsTexts?: ActivityCommonsText[];
  duration?: { min: number; max: number };
  setting?: string;
  energyLevel?: string;
  modality?: string;
  observationPrompts?: string[];
  reflectionPrompts?: string[];
  capabilityThreads?: CapabilityThread[];
  enabledBadges?: Badge[];
}

export interface Approach {
  _id: string;
  title: string;
  modality?: string;
  activities?: Activity[];
}

export interface Module {
  _id: string;
  title: string;
  targetUnderstanding: string;
  sessionType?: 'sustained' | 'open_ended';
  understandingIndicators?: { emerging?: string; developing?: string; demonstrating?: string };
  approaches?: Approach[];
  subjects?: string[];
  capabilityThreads?: CapabilityThread[];
  badges?: Badge[];
  printables?: Printables;
  materials?: Materials;
  assetCounts?: AssetCounts | null;
  owningPack?: {
    _id: string;
    title?: string;
    printables?: Printables;
    materials?: Materials;
    assetCounts?: AssetCounts | null;
  } | null;
}

export interface Learner {
  id: string;
  name: string;
  colourToken?: string;
}

export interface PedagogyLens {
  perspective?: string;
  facilitatorTips?: string;
  languageFrame?: string;
  watchFor?: string;
}

export interface ActivityOverlay {
  activityId: string;
  lens: PedagogyLens;
}

export type Mode = 'approach-pick' | 'prep' | 'facilitate' | 'log';

export interface QuickCaptureItem {
  type: 'note' | 'photo';
  content: string;
  activityIdx: number;
  activityTitle: string;
  // Sanity activity _id. Optional for forward-compatibility with old
  // sessions that pre-date this field (LogMode dedupes against undefined).
  activityId?: string;
  timestamp: number;
}
