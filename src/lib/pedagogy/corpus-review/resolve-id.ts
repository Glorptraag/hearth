// Corpus review — id resolution.
//
// Operator-facing helper for scripts/corpus-review-manifest.ts and
// scripts/corpus-confirm.ts. Deliberately separate from
// src/lib/pedagogy/corpus/ (the compiler): this module only reads
// CompiledDoc output, it never changes how the vault compiles.
//
// A vault entry's short id (the `id:` frontmatter value, e.g. "cm.001" or
// the facilitation-vocabulary singleton "cm") is only unique WITHIN its
// layer — Montessori deliberately reuses numbers across layers (see
// corpus/pedagogy/montessori/README.md), so "montessori.004" alone can
// resolve to a worked-example, an observational-marker, and a
// contraindication all at once. Layer-qualified ids
// (`<prefix>:<shortId>`, e.g. "we:montessori.004") disambiguate.

import type { CompiledDoc, LayerDir } from '../corpus/types';

/** Short prefix per layer, used for `<prefix>:<shortId>` qualified ids. */
export const LAYER_PREFIXES: Record<LayerDir, string> = {
  'source-excerpts': 'se',
  'practice-patterns': 'pp',
  'observational-markers': 'om',
  'facilitation-vocabulary': 'fv',
  'contraindications': 'ci',
  'worked-examples': 'we',
};

const PREFIX_TO_LAYER_DIR: Record<string, LayerDir> = Object.fromEntries(
  Object.entries(LAYER_PREFIXES).map(([layerDir, prefix]) => [prefix, layerDir])
) as Record<string, LayerDir>;

const SANITY_TYPE_TO_LAYER_DIR: Record<string, LayerDir> = {
  pedagogySourceExcerpt: 'source-excerpts',
  pedagogyPracticePattern: 'practice-patterns',
  pedagogyObservationalMarker: 'observational-markers',
  pedagogyFacilitationVocabulary: 'facilitation-vocabulary',
  pedagogyContraindication: 'contraindications',
  pedagogyWorkedExample: 'worked-examples',
};

export interface ResolvableDoc {
  doc: CompiledDoc;
  layerDir: LayerDir;
  /** The `id:` frontmatter value, e.g. "cm.001" or singleton "cm". */
  shortId: string;
  /** Framework short code, e.g. "cm" or "montessori". */
  frameworkShort: string;
  /** `<prefix>:<shortId>`, e.g. "we:montessori.004" — always unambiguous. */
  qualifiedId: string;
}

/** Project compiled docs into the shape the review/confirm scripts need. */
export function toResolvableDocs(docs: CompiledDoc[]): ResolvableDoc[] {
  return docs.map((doc) => {
    const layerDir = SANITY_TYPE_TO_LAYER_DIR[doc._type];
    if (!layerDir) {
      throw new Error(`unknown sanity type "${doc._type}" for doc ${doc._id}`);
    }
    const shortId = doc._id.slice(doc._type.length + 1);
    const frameworkShort = layerDir === 'facilitation-vocabulary' ? shortId : shortId.split('.')[0];
    return {
      doc,
      layerDir,
      shortId,
      frameworkShort,
      qualifiedId: `${LAYER_PREFIXES[layerDir]}:${shortId}`,
    };
  });
}

export interface ResolvedConfirmId {
  /** The token as the operator typed it. */
  token: string;
  entry: ResolvableDoc;
}

export interface ResolveConfirmIdsResult {
  resolved: ResolvedConfirmId[];
  errors: string[];
}

/**
 * Resolve operator-supplied id tokens against the current vault.
 *
 * Every token is checked independently and every problem is collected (not
 * just the first) so a single `--ids` invocation reports everything wrong
 * in one pass. The caller is responsible for the all-or-nothing rule:
 * if `errors` is non-empty, nothing should be written.
 */
export function resolveConfirmIds(rawTokens: string[], docs: ResolvableDoc[]): ResolveConfirmIdsResult {
  const errors: string[] = [];
  const resolved: ResolvedConfirmId[] = [];

  const byQualified = new Map<string, ResolvableDoc>();
  const byShort = new Map<string, ResolvableDoc[]>();
  for (const entry of docs) {
    byQualified.set(entry.qualifiedId, entry);
    const list = byShort.get(entry.shortId) ?? [];
    list.push(entry);
    byShort.set(entry.shortId, list);
  }

  for (const rawToken of rawTokens) {
    const token = rawToken.trim();
    if (token === '') {
      errors.push('empty id in --ids list');
      continue;
    }

    let candidate: ResolvableDoc | undefined;
    const colonIdx = token.indexOf(':');

    if (colonIdx !== -1) {
      const prefix = token.slice(0, colonIdx);
      const shortId = token.slice(colonIdx + 1);
      const layerDir = PREFIX_TO_LAYER_DIR[prefix];
      if (!layerDir) {
        errors.push(
          `"${token}": unknown layer prefix "${prefix}" — expected one of se|pp|om|fv|ci|we`
        );
        continue;
      }
      candidate = byQualified.get(`${prefix}:${shortId}`);
      if (!candidate) {
        errors.push(`"${token}": no vault entry found for id "${shortId}" in layer "${layerDir}"`);
        continue;
      }
    } else {
      const candidates = byShort.get(token) ?? [];
      if (candidates.length === 0) {
        errors.push(`"${token}": unknown id — no vault entry matches`);
        continue;
      }
      if (candidates.length > 1) {
        const options = candidates.map((c) => c.qualifiedId).join(', ');
        errors.push(
          `"${token}": ambiguous across ${candidates.length} layers — qualify it, e.g. ${options}`
        );
        continue;
      }
      candidate = candidates[0];
    }

    if (candidate.doc.suggestedDraft !== true) {
      errors.push(`"${candidate.qualifiedId}": already confirmed (suggestedDraft is not true)`);
      continue;
    }

    resolved.push({ token, entry: candidate });
  }

  return { resolved, errors };
}
