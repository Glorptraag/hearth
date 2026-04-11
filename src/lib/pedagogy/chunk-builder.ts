// Chunk text composition rules for the Pedagogy Knowledge Base.
// Each layer composes its embedding text differently to optimise retrieval quality.
// SHA-256 hash is used for change detection — re-embed only when hash changes.

import { createHash } from 'crypto';

export type PkbLayer =
  | 'source_excerpt'
  | 'practice_pattern'
  | 'observational_marker'
  | 'facilitation_vocabulary'
  | 'contraindication'
  | 'worked_example';

// ─── Per-layer doc shapes ─────────────────────────────────────────────────────

interface SourceExcerptDoc {
  text: string;
}

interface PracticePatternDoc {
  triggerTitle: string;
  triggerContext: string;
  traditionResponse: string;
}

interface ObservationalMarkerDoc {
  markerName: string;
  whatItIndicates: string;
  markersToLookFor: string[];
}

interface FacilitationVocabularyDoc {
  verbs?: Array<{ verb: string; meaning: string }>;
  characteristicRestraints?: string[];
  microScripts?: Array<{ situation: string; script: string }>;
}

interface ContraindicationDoc {
  warnedAgainst: string;
  traditionReasoning: string;
}

interface WorkedExampleDoc {
  scenario: string;
  interpretationInTraditionVoice: string;
}

// ─── Composition rules ────────────────────────────────────────────────────────

function buildSourceExcerpt(doc: SourceExcerptDoc): string {
  return doc.text.trim();
}

function buildPracticePattern(doc: PracticePatternDoc): string {
  return [doc.triggerTitle.trim(), doc.triggerContext.trim(), doc.traditionResponse.trim()].join(
    '\n\n'
  );
}

function buildObservationalMarker(doc: ObservationalMarkerDoc): string {
  const lines = [
    doc.markerName.trim(),
    doc.whatItIndicates.trim(),
    ...(doc.markersToLookFor ?? []).map((m) => `Look for: ${m.trim()}`),
  ];
  return lines.join('\n\n');
}

function buildFacilitationVocabulary(doc: FacilitationVocabularyDoc): string {
  const parts: string[] = [];

  if (doc.verbs?.length) {
    parts.push(doc.verbs.map(({ verb, meaning }) => `${verb}: ${meaning}`).join('\n'));
  }

  if (doc.characteristicRestraints?.length) {
    parts.push(doc.characteristicRestraints.map((r) => `Do NOT: ${r}`).join('\n'));
  }

  if (doc.microScripts?.length) {
    parts.push(
      doc.microScripts
        .map(({ situation, script }) => `Situation — ${situation}: ${script}`)
        .join('\n')
    );
  }

  return parts.join('\n\n');
}

function buildContraindication(doc: ContraindicationDoc): string {
  return [doc.warnedAgainst.trim(), doc.traditionReasoning.trim()].join('\n\n');
}

function buildWorkedExample(doc: WorkedExampleDoc): string {
  return [doc.scenario.trim(), doc.interpretationInTraditionVoice.trim()].join('\n\n');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compose the embedding text for a PKB document.
 * Throws if the layer is unknown or required fields are missing.
 */
export function buildChunkText(layer: PkbLayer, doc: Record<string, unknown>): string {
  switch (layer) {
    case 'source_excerpt':
      return buildSourceExcerpt(doc as unknown as SourceExcerptDoc);
    case 'practice_pattern':
      return buildPracticePattern(doc as unknown as PracticePatternDoc);
    case 'observational_marker':
      return buildObservationalMarker(doc as unknown as ObservationalMarkerDoc);
    case 'facilitation_vocabulary':
      return buildFacilitationVocabulary(doc as unknown as FacilitationVocabularyDoc);
    case 'contraindication':
      return buildContraindication(doc as unknown as ContraindicationDoc);
    case 'worked_example':
      return buildWorkedExample(doc as unknown as WorkedExampleDoc);
    default: {
      const exhaustive: never = layer;
      throw new Error(`Unknown PKB layer: ${exhaustive}`);
    }
  }
}

/** SHA-256 of the composed text — used to skip re-embedding unchanged docs. */
export function hashChunk(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Map a Sanity document type name to its PKB layer identifier. */
export function sanityTypeToPkbLayer(sanityType: string): PkbLayer | null {
  const MAP: Record<string, PkbLayer> = {
    pedagogySourceExcerpt: 'source_excerpt',
    pedagogyPracticePattern: 'practice_pattern',
    pedagogyObservationalMarker: 'observational_marker',
    pedagogyFacilitationVocabulary: 'facilitation_vocabulary',
    pedagogyContraindication: 'contraindication',
    pedagogyWorkedExample: 'worked_example',
  };
  return MAP[sanityType] ?? null;
}
