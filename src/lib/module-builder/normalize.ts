import type { ModuleStep, Pathway, SharedEditData } from './types';
import { getTemplateSteps } from './session-templates';

export function normalizeToEditData(pathway: Pathway, data: Record<string, unknown>): SharedEditData {
  const base: SharedEditData = {
    pathway,
    title: '',
    targetUnderstanding: '',
    watchFor: '',
    pivot: '',
    steps: [],
    materials: [],
    subjects: (data.subjects as string[]) ?? [],
    duration: (data.duration as string) ?? '',
    setting: (data.setting as string) ?? 'either',
    ageRange: (data.ageRange as string) ?? '',
    capabilities: [],
    provenance: {},
  };

  switch (pathway) {
    case 'material': {
      base.title = (data.resourceName as string) ?? '';
      base.provenance = {
        type: 'sourceResource',
        resourceType: data.resourceType,
        resourceName: data.resourceName,
        excitement: data.excitement,
        usageIntents: data.usageIntents,
      };
      const templateSteps = getTemplateSteps(
        (data.resourceType as string) ?? 'other',
        (data.usageIntents as string[]) ?? [],
      );
      if (templateSteps.length > 0) {
        base.steps = templateSteps;
      }
      break;
    }
    case 'process':
      base.title = (data.activityName as string) ?? '';
      if (data.whatHappens) {
        const lines = (data.whatHappens as string).split('\n').filter(Boolean);
        base.steps = lines.map((line, i) => ({
          id: `step-${i}`,
          title: `Step ${i + 1}`,
          instructions: line.trim(),
          observationHint: '',
        }));
      }
      if (data.hasProduct && data.productName) {
        base.materials.push(data.productName as string);
      }
      break;
    case 'inquiry':
      base.title = (data.question as string) ?? '';
      base.provenance = {
        type: 'sourceQuestion',
        question: data.question,
        priorKnowledge: data.priorKnowledge,
        investigationTypes: data.investigationTypes,
      };
      break;
    case 'retrospective':
      base.title = (data.moduleName as string) ?? (data.subject as string) ?? '';
      base.provenance = {
        type: 'sourceLogs',
        subject: data.subject,
        entryIds: data.entryIds,
      };
      break;
    case 'understanding':
      base.title = (data.goal as string) ?? (data.threadName as string) ?? '';
      if (data.mode === 'capability') {
        base.provenance = {
          type: 'sourceCapability',
          threadId: data.threadId,
          threadName: data.threadName,
          targetTier: data.tier,
        };
        if (data.threadId) {
          base.capabilities = [{ threadId: data.threadId as string, confidence: 'explicit' }];
        }
      } else {
        base.provenance = {
          type: 'sourceGoal',
          goal: data.goal,
          successLooksLike: data.successLooksLike,
        };
      }
      break;
  }
  return base;
}

function asSteps(value: unknown): ModuleStep[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .map((s, i) => ({
      id: typeof s.id === 'string' ? s.id : `step-${i}`,
      title: typeof s.title === 'string' ? s.title : '',
      instructions: typeof s.instructions === 'string' ? s.instructions : '',
      observationHint: typeof s.observationHint === 'string' ? s.observationHint : '',
    }));
}

function asCapabilities(value: unknown): SharedEditData['capabilities'] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object' && typeof c.threadId === 'string')
    .map((c) => ({
      threadId: c.threadId as string,
      confidence: c.confidence === 'explicit' ? 'explicit' as const : 'inferred' as const,
    }));
}

/**
 * Turn a saved draft row's draftData back into the editor's shape.
 *
 * Drafts come in two shapes: editor drafts (saved from SharedEditView — already
 * SharedEditData, possibly with AI-enriched fields) and entry drafts (saved from
 * a pathway entry form — raw pathway fields like resourceName / whatHappens).
 * Entry drafts go through the same normalization "Continue" would have applied,
 * then any enriched fields present on the row are overlaid where normalization
 * left blanks.
 */
export function draftToEditData(pathway: Pathway, draftData: Record<string, unknown>): SharedEditData {
  const isEditorShape = typeof draftData.title === 'string' && Array.isArray(draftData.steps);

  if (isEditorShape) {
    return {
      pathway,
      title: (draftData.title as string) ?? '',
      targetUnderstanding: typeof draftData.targetUnderstanding === 'string' ? draftData.targetUnderstanding : '',
      watchFor: typeof draftData.watchFor === 'string' ? draftData.watchFor : '',
      pivot: typeof draftData.pivot === 'string' ? draftData.pivot : '',
      steps: asSteps(draftData.steps),
      materials: Array.isArray(draftData.materials) ? (draftData.materials as string[]).filter((m) => typeof m === 'string') : [],
      subjects: Array.isArray(draftData.subjects) ? (draftData.subjects as string[]).filter((s) => typeof s === 'string') : [],
      duration: typeof draftData.duration === 'string' ? draftData.duration : '',
      setting: typeof draftData.setting === 'string' ? draftData.setting : 'either',
      ageRange: typeof draftData.ageRange === 'string' ? draftData.ageRange : '',
      capabilities: asCapabilities(draftData.capabilities),
      provenance: (draftData.provenance && typeof draftData.provenance === 'object' ? draftData.provenance : {}) as Record<string, unknown>,
    };
  }

  const normalized = normalizeToEditData(pathway, draftData);
  if (!normalized.targetUnderstanding && typeof draftData.targetUnderstanding === 'string') {
    normalized.targetUnderstanding = draftData.targetUnderstanding;
  }
  if (!normalized.watchFor && typeof draftData.watchFor === 'string') {
    normalized.watchFor = draftData.watchFor;
  }
  if (!normalized.pivot && typeof draftData.pivot === 'string') {
    normalized.pivot = draftData.pivot;
  }
  if (normalized.steps.length === 0) {
    normalized.steps = asSteps(draftData.steps);
  }
  if (normalized.capabilities.length === 0) {
    normalized.capabilities = asCapabilities(draftData.capabilities);
  }
  return normalized;
}

const PATHWAY_FALLBACK_TITLES: Record<Pathway, string> = {
  material: 'Resource module',
  process: 'Activity module',
  inquiry: 'Question module',
  retrospective: 'Lifted from logs',
  understanding: 'Goal module',
};

/** Best human label for a draft row in the resume list. */
export function draftDisplayTitle(pathway: Pathway, draftData: Record<string, unknown>): string {
  const candidates = [
    draftData.title, draftData.resourceName, draftData.activityName,
    draftData.question, draftData.moduleName, draftData.goal, draftData.threadName, draftData.subject,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return PATHWAY_FALLBACK_TITLES[pathway] ?? 'Untitled draft';
}
