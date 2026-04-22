import type {
  PackDraft,
  ModuleDraft,
  ApproachDraft,
  ActivityDraft,
  BadgeDraft,
  MaterialDraft,
  FurtherReadingItem,
  AssetDraft,
  CommonsTextDraft,
  ActivityAssetRefDraft,
  ActivityCommonsTextRefDraft,
} from './types';

function uid() {
  return crypto.randomUUID().slice(0, 8);
}

export function createEmptyPack(title: string): PackDraft {
  return {
    _key: uid(),
    title,
    description: '',
    intro: { title: '', body: '', keyPoints: [], furtherReading: [] },
    subjects: [],
    ageRange: { min: 4, max: 8 },
    termWeeks: 10,
    worldview: 'neutral',
    availability: 'included',
    stripePriceId: '',
    creator: 'Hearth',
    version: '1.0.0',
    modules: [],
    badges: [],
    status: 'draft',
  };
}

export function createEmptyModule(title: string, standalone = false): ModuleDraft {
  return {
    _key: uid(),
    title,
    targetUnderstanding: '',
    understandingIndicators: { emerging: '', developing: '', demonstrating: '' },
    subjects: [],
    ageRange: { min: 4, max: 8 },
    duration: { min: 30, max: 60 },
    capabilityThreadIds: [],
    badgeKeys: [],
    approaches: [],
    standalone,
    status: 'draft',
  };
}

export function createEmptyApproach(title: string): ApproachDraft {
  return {
    _key: uid(),
    title,
    modality: '',
    description: '',
    activities: [],
    status: 'draft',
  };
}

export function createEmptyActivity(title: string): ActivityDraft {
  return {
    _key: uid(),
    title,
    summary: '',
    instructionsText: '',
    facilitatorGuidance: { before: '', during: '', challenges: '' },
    materials: [],
    assetRefs: [],
    commonsTextRefs: [],
    duration: { min: 15, max: 30 },
    ageRange: { min: 4, max: 8 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [],
    reflectionPrompts: [],
    capabilityThreadIds: [],
    enabledBadgeKeys: [],
    deliveryChannel: 'physical',
    status: 'draft',
  };
}

export function createEmptyBadge(title: string): BadgeDraft {
  return {
    _key: uid(),
    title,
    emoji: '',
    description: '',
    criteriaSummary: '',
    capabilityThreadIds: [],
    observationThreshold: 3,
    status: 'draft',
  };
}

export function createEmptyMaterial(): MaterialDraft {
  return {
    _key: uid(),
    name: '',
    required: true,
    alternative: '',
  };
}

export function createEmptyFurtherReading(): FurtherReadingItem {
  return {
    _key: uid(),
    title: '',
    url: '',
  };
}

export function createEmptyAsset(title = ''): AssetDraft {
  return {
    _key: uid(),
    title,
    kind: 'template',
    file: null,
    thumbnail: null,
    pageCount: 0,
    description: '',
    printGuidance: '',
    ageBand: 'all',
    license: 'hearth_proprietary',
    source: '',
    sourceUrl: '',
    tags: [],
    relatedCommonsTextIds: [],
    status: 'draft',
    version: 1,
  };
}

export function createEmptyCommonsText(title = ''): CommonsTextDraft {
  return {
    _key: uid(),
    title,
    kind: 'fable',
    tradition: '',
    bodyText: '',
    shortBodyText: '',
    readAloudVersionText: '',
    estimatedReadAloudMinutes: 0,
    length: '',
    readingLevel: '',
    themes: [],
    moralOrLesson: '',
    source: '',
    sourceUrl: '',
    license: 'public_domain',
    relatedAssetIds: [],
    relatedTextIds: [],
    tags: [],
    status: 'draft',
  };
}

export function createEmptyAssetRef(): ActivityAssetRefDraft {
  return {
    _key: uid(),
    assetId: '',
    role: 'core',
    notes: '',
  };
}

export function createEmptyCommonsTextRef(): ActivityCommonsTextRefDraft {
  return {
    _key: uid(),
    commonsTextId: '',
    role: 'core',
    presentationMode: 'read_aloud',
    notes: '',
  };
}

export function createEmptyStudioState() {
  return {
    packs: [],
    standaloneModules: [],
    standaloneActivities: [],
    assets: [] as AssetDraft[],
    commonsTexts: [] as CommonsTextDraft[],
  };
}
