// Chunk text composition rules for the Pedagogy Knowledge Base.
// Each layer composes its embedding text differently to optimise retrieval quality.
// SHA-256 hash is used for change detection — re-embed only when hash changes.
//
// PKB document types are embeddings-only: pedagogyWorkedExample,
// pedagogyContraindication, pedagogyFacilitationVocabulary and friends have no
// CRUD path in src/lib/sanity/{queries,mutations}.ts. They are authored in the
// corpus vault (corpus/pedagogy/ — see its README), compiled to Sanity via
// `npm run seed:pedagogy:corpus` (scripts/compile-pedagogy-corpus.ts), and
// re-embedded with `npm run seed:pedagogy:reembed`
// (scripts/reembed-pedagogy-corpus.ts).

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

export type PkbLayer =
  | 'source_excerpt'
  | 'practice_pattern'
  | 'observational_marker'
  | 'facilitation_vocabulary'
  | 'contraindication'
  | 'worked_example';

const TYPE_TO_LAYER: Record<PedagogyLayerType, PkbLayer> = {
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

export function getLayerKey(type: PedagogyLayerType): PkbLayer {
  return TYPE_TO_LAYER[type];
}

/** Map a Sanity document type name to its PKB layer identifier. */
export function sanityTypeToPkbLayer(sanityType: string): PkbLayer | null {
  return TYPE_TO_LAYER[sanityType as PedagogyLayerType] ?? null;
}

// ─── Composition rules ────────────────────────────────────────────────────────

/**
 * Compose the embedding text for a PKB document.
 * Accepts either a full SanityPKBDocument (uses _type to dispatch)
 * or a layer key + raw doc fields.
 */
export function buildChunkText(docOrLayer: SanityPKBDocument | PkbLayer, rawDoc?: Record<string, unknown>): string {
  if (typeof docOrLayer === 'string' && rawDoc) {
    return buildByLayer(docOrLayer as PkbLayer, rawDoc);
  }
  const doc = docOrLayer as SanityPKBDocument;
  return buildByLayer(getLayerKey(doc._type), doc);
}

function buildByLayer(layer: PkbLayer, doc: Record<string, unknown>): string {
  switch (layer) {
    case 'source_excerpt':
      return str(doc.text);

    case 'practice_pattern':
      return [str(doc.triggerTitle), str(doc.triggerContext), str(doc.traditionResponse)]
        .filter(Boolean)
        .join('\n\n');

    case 'observational_marker': {
      const markers = Array.isArray(doc.markersToLookFor)
        ? (doc.markersToLookFor as string[]).map((m) => `Look for: ${m.trim()}`)
        : [];
      return [str(doc.markerName), str(doc.whatItIndicates), ...markers]
        .filter(Boolean)
        .join('\n\n');
    }

    case 'facilitation_vocabulary': {
      const parts: string[] = [];
      const verbs = doc.verbs as Array<{ verb: string; meaning: string }> | undefined;
      if (verbs?.length) {
        parts.push(verbs.map(({ verb, meaning }) => `${verb}: ${meaning}`).join('\n'));
      }
      const restraints = doc.characteristicRestraints as string[] | undefined;
      if (restraints?.length) {
        parts.push(restraints.map((r) => `Do NOT: ${r}`).join('\n'));
      }
      const scripts = doc.microScripts as Array<{ situation: string; script: string }> | undefined;
      if (scripts?.length) {
        parts.push(scripts.map(({ situation, script }) => `Situation — ${situation}: ${script}`).join('\n'));
      }
      return parts.join('\n\n');
    }

    case 'contraindication':
      return [str(doc.warnedAgainst), str(doc.traditionReasoning)]
        .filter(Boolean)
        .join('\n\n');

    case 'worked_example':
      return [str(doc.scenario), str(doc.interpretationInTraditionVoice)]
        .filter(Boolean)
        .join('\n\n');

    default:
      return '';
  }
}

function str(val: unknown): string {
  return typeof val === 'string' ? val.trim() : '';
}

/** Flatten a sourceAttribution object into a human-readable string for display. */
function formatAttribution(val: unknown): string {
  if (typeof val === 'string') return val;
  if (!val || typeof val !== 'object') return '';
  const a = val as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof a.author === 'string' && a.author) parts.push(a.author);
  if (typeof a.title === 'string' && a.title) parts.push(a.title);
  const loc = [a.pageOrChapter, a.year].filter((x) => typeof x === 'string' && x) as string[];
  if (loc.length) parts.push(loc.join(', '));
  return parts.join(', ');
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export function buildChunkMetadata(doc: SanityPKBDocument): Record<string, unknown> {
  const meta: Record<string, unknown> = {
    layer: getLayerKey(doc._type),
    pedagogyKey: resolvePedagogyKey(doc),
  };

  if (doc.themes) meta.themes = doc.themes;
  if (doc.capabilityThreadRelevance) meta.capabilityThreadRelevance = doc.capabilityThreadRelevance;
  if (doc.capabilityThreadMapping) meta.capabilityThreadMapping = doc.capabilityThreadMapping;
  if (doc.situationalRelevance) meta.situationalRelevance = doc.situationalRelevance;
  if (doc.situationalTriggers) meta.situationalTriggers = doc.situationalTriggers;
  if (doc.appliesAtAges) meta.appliesAtAges = doc.appliesAtAges;
  if (doc.ageRange) meta.ageRange = doc.ageRange;
  if (doc.authoredBy) meta.authoredBy = doc.authoredBy;

  switch (doc._type) {
    case 'pedagogySourceExcerpt':
      if (doc.excerptId) meta.excerptId = doc.excerptId;
      if (typeof doc.text === 'string') meta.text = doc.text;
      if (doc.sourceAttribution) {
        meta.sourceAttributionRaw = doc.sourceAttribution;
        meta.sourceAttribution = formatAttribution(doc.sourceAttribution);
      }
      if (doc.isParaphrase != null) meta.isParaphrase = doc.isParaphrase;
      break;
    case 'pedagogyPracticePattern':
      if (doc.patternId) meta.patternId = doc.patternId;
      if (typeof doc.triggerTitle === 'string') meta.triggerTitle = doc.triggerTitle;
      if (typeof doc.triggerContext === 'string') meta.triggerContext = doc.triggerContext;
      if (typeof doc.traditionResponse === 'string') meta.traditionResponse = doc.traditionResponse;
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

// ─── Hashing ──────────────────────────────────────────────────────────────────

/** SHA-256 of the composed text — used to skip re-embedding unchanged docs. */
export function computeContentHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Alias used by the batch re-embed script. */
export const hashChunk = computeContentHash;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolvePedagogyKey(doc: SanityPKBDocument): string {
  // Expanded framework reference (batch script path): framework->{ slug }
  const fw = doc.framework;
  if (fw) {
    if (typeof fw === 'object' && typeof fw.slug === 'string' && fw.slug) {
      return fw.slug;
    }
    if (typeof fw === 'object' && typeof fw._ref === 'string' && fw._ref) {
      const ref = fw._ref as string;
      const dotIdx = ref.indexOf('.');
      return dotIdx >= 0 ? ref.slice(dotIdx + 1) : ref;
    }
  }

  // Legacy fallback: pedagogyKey field (older documents)
  const pk = doc.pedagogyKey;
  if (typeof pk === 'string' && pk) return pk;
  if (typeof pk === 'object' && pk?._ref) {
    const ref = pk._ref as string;
    const dotIdx = ref.indexOf('.');
    return dotIdx >= 0 ? ref.slice(dotIdx + 1) : ref;
  }

  return 'unknown';
}
