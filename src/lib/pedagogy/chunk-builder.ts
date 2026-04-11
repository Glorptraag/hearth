import { createHash } from 'crypto';

export const PEDAGOGY_LAYER_TYPES = [
  'pedagogySourceExcerpt',
  'pedagogyPracticePattern',
  'pedagogyObservationalMarker',
  'pedagogyFacilitationVocabulary',
  'pedagogyContraindication',
  'pedagogyWorkedExample',
] as const;

export type PedagogyLayerType = (typeof PEDAGOGY_LAYER_TYPES)[number];

const TYPE_TO_LAYER: Record<PedagogyLayerType, string> = {
  pedagogySourceExcerpt: 'source_excerpt',
  pedagogyPracticePattern: 'practice_pattern',
  pedagogyObservationalMarker: 'observational_marker',
  pedagogyFacilitationVocabulary: 'facilitation_vocabulary',
  pedagogyContraindication: 'contraindication',
  pedagogyWorkedExample: 'worked_example',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SanityPKBDocument = Record<string, any> & {
  _id: string;
  _type: PedagogyLayerType;
  _rev?: string;
};

export function isPedagogyType(type: string): type is PedagogyLayerType {
  return PEDAGOGY_LAYER_TYPES.includes(type as PedagogyLayerType);
}

export function getLayerKey(type: PedagogyLayerType): string {
  return TYPE_TO_LAYER[type];
}

export function buildChunkText(doc: SanityPKBDocument): string {
  switch (doc._type) {
    case 'pedagogySourceExcerpt':
      return doc.text ?? '';

    case 'pedagogyPracticePattern':
      return [
        doc.triggerTitle,
        doc.triggerContext,
        doc.traditionResponse,
      ]
        .filter(Boolean)
        .join('\n\n');

    case 'pedagogyObservationalMarker':
      return [
        doc.markerName,
        doc.whatItIndicates,
        ...(Array.isArray(doc.markersToLookFor) ? doc.markersToLookFor : []),
      ]
        .filter(Boolean)
        .join('\n\n');

    case 'pedagogyFacilitationVocabulary': {
      const verbs = Array.isArray(doc.verbs)
        ? doc.verbs.map((v: { verb: string; meaning: string }) => `${v.verb}: ${v.meaning}`).join('\n')
        : '';
      const restraints = Array.isArray(doc.characteristicRestraints)
        ? doc.characteristicRestraints.join('\n')
        : '';
      const scripts = Array.isArray(doc.microScripts)
        ? doc.microScripts.map((s: { situation: string; script: string }) => `${s.situation}: ${s.script}`).join('\n')
        : '';
      return [verbs, restraints, scripts].filter(Boolean).join('\n\n');
    }

    case 'pedagogyContraindication':
      return [doc.warnedAgainst, doc.traditionReasoning]
        .filter(Boolean)
        .join('\n\n');

    case 'pedagogyWorkedExample':
      return [doc.scenario, doc.interpretationInTraditionVoice]
        .filter(Boolean)
        .join('\n\n');

    default:
      return '';
  }
}

export function buildChunkMetadata(doc: SanityPKBDocument): Record<string, unknown> {
  const meta: Record<string, unknown> = {
    layer: getLayerKey(doc._type),
    pedagogyKey: resolvePedagogyKey(doc),
  };

  // Common optional fields
  if (doc.themes) meta.themes = doc.themes;
  if (doc.capabilityThreadRelevance) meta.capabilityThreadRelevance = doc.capabilityThreadRelevance;
  if (doc.capabilityThreadMapping) meta.capabilityThreadMapping = doc.capabilityThreadMapping;
  if (doc.situationalRelevance) meta.situationalRelevance = doc.situationalRelevance;
  if (doc.situationalTriggers) meta.situationalTriggers = doc.situationalTriggers;
  if (doc.appliesAtAges) meta.appliesAtAges = doc.appliesAtAges;
  if (doc.ageRange) meta.ageRange = doc.ageRange;
  if (doc.authoredBy) meta.authoredBy = doc.authoredBy;

  // Layer-specific
  switch (doc._type) {
    case 'pedagogySourceExcerpt':
      if (doc.excerptId) meta.excerptId = doc.excerptId;
      if (doc.sourceAttribution) meta.sourceAttribution = doc.sourceAttribution;
      if (doc.isParaphrase != null) meta.isParaphrase = doc.isParaphrase;
      break;
    case 'pedagogyPracticePattern':
      if (doc.patternId) meta.patternId = doc.patternId;
      if (doc.antiPattern) meta.antiPattern = doc.antiPattern;
      break;
    case 'pedagogyObservationalMarker':
      if (doc.markerId) meta.markerId = doc.markerId;
      break;
    case 'pedagogyContraindication':
      if (doc.contraindicationId) meta.contraindicationId = doc.contraindicationId;
      if (doc.tensionWithOtherTraditions) meta.tensionWithOtherTraditions = doc.tensionWithOtherTraditions;
      break;
    case 'pedagogyWorkedExample':
      if (doc.exampleId) meta.exampleId = doc.exampleId;
      if (doc.activityType) meta.activityType = doc.activityType;
      if (doc.capabilityThreads) meta.capabilityThreads = doc.capabilityThreads;
      break;
  }

  return meta;
}

export function computeContentHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function resolvePedagogyKey(doc: SanityPKBDocument): string {
  // pedagogyKey can be a Sanity reference object { _ref: 'pedagogicalFramework.charlotte_mason' }
  // or a resolved string. Handle both.
  const pk = doc.pedagogyKey;
  if (!pk) return 'unknown';
  if (typeof pk === 'string') return pk;
  if (typeof pk === 'object' && pk._ref) {
    // Extract key from ref ID: 'pedagogicalFramework.charlotte_mason' → 'charlotte_mason'
    const ref = pk._ref as string;
    const dotIdx = ref.indexOf('.');
    return dotIdx >= 0 ? ref.slice(dotIdx + 1) : ref;
  }
  return 'unknown';
}
