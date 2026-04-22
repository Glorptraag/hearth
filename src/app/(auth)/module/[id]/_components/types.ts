// ─── Module Experience Types ─────────────────────────────────────────────────

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
  role: 'core' | 'optional' | 'extension';
  notes?: string;
  asset: {
    _id: string;
    title: string;
    slug: { current: string };
    kind: string;
    thumbnailUrl?: string;
    fileUrl?: string;
    pageCount?: number;
    printGuidance?: string;
    description?: string;
  };
}

export interface ActivityCommonsText {
  role: 'core' | 'optional' | 'extension';
  presentationMode: 'read_aloud' | 'child_reads' | 'reference_only' | 'memorisation';
  notes?: string;
  text: {
    _id: string;
    title: string;
    slug: { current: string };
    kind: string;
    tradition: string;
    estimatedReadAloudMinutes?: number;
    length?: string;
    readingLevel?: string;
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
  understandingIndicators?: { emerging?: string; developing?: string; demonstrating?: string };
  approaches?: Approach[];
  subjects?: string[];
  capabilityThreads?: CapabilityThread[];
  badges?: Badge[];
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
  timestamp: number;
}
