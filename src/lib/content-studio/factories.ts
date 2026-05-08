import type {
  PackDraft,
  ModuleDraft,
  ApproachDraft,
  ActivityDraft,
  BadgeDraft,
  MaterialDraft,
  FurtherReadingItem,
  WorkbenchDraft,
  WorkbenchPackDraft,
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

export function createEmptyWorkbench(): WorkbenchDraft {
  return {
    handOffFraming: '',
    parentOffGuidance: '',
    whatTheBenchInvites: '',
    evidenceTrail: '',
    materialAssetIds: [],
    childFacingSetupNotes: '',
    workbenchId: '',
    capabilityThreadsSecondaryIds: [],
  };
}

export function createEmptyWorkbenchPack(id = ''): WorkbenchPackDraft {
  return {
    _key: uid(),
    id,
    name: '',
    consolidatesPaths: [],
    physicalForm: '',
  };
}

export function createEmptyFurtherReading(): FurtherReadingItem {
  return {
    _key: uid(),
    title: '',
    url: '',
  };
}

export function createEmptyStudioState() {
  return {
    packs: [],
    standaloneModules: [],
    standaloneActivities: [],
  };
}
