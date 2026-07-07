// Source registry — licence-as-data.
//
// Every source a corpus entry quotes or paraphrases must be registered in
// corpus/pedagogy/sources.json with its licence class. Whether a verbatim
// quotation is permitted is then a lookup, not a judgment call: the compile
// gate enforces PKB10 (full attribution, no exceptions) and PKB11 (no
// Australian fair-dealing cover — licence, PD, CC, or paraphrase only)
// mechanically, so no authoring session ever needs to re-litigate copyright.

import type { CorpusIssue, CorpusSource, SourceLicence, SourceRegistry } from './types';

const LICENCES: SourceLicence[] = [
  'public_domain',
  'cc_by',
  'cc_by_nc_nd',
  'in_copyright',
  'licensed',
  'commissioned',
];

export function parseSourceRegistry(rawJson: string): SourceRegistry {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    throw new Error(`sources.json is not valid JSON: ${(err as Error).message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('sources.json must be an object keyed by source id');
  }

  const registry: SourceRegistry = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    registry[key] = validateSource(key, value);
  }
  return registry;
}

function validateSource(key: string, value: unknown): CorpusSource {
  if (!value || typeof value !== 'object') {
    throw new Error(`sources.json["${key}"] must be an object`);
  }
  const v = value as Record<string, unknown>;

  for (const field of ['author', 'title', 'year'] as const) {
    if (typeof v[field] !== 'string' || v[field] === '') {
      throw new Error(`sources.json["${key}"].${field} must be a non-empty string`);
    }
  }
  if (!LICENCES.includes(v.licence as SourceLicence)) {
    throw new Error(
      `sources.json["${key}"].licence must be one of ${LICENCES.join(', ')} — got "${v.licence}"`
    );
  }
  if (typeof v.allowVerbatim !== 'boolean') {
    throw new Error(`sources.json["${key}"].allowVerbatim must be a boolean`);
  }

  return {
    author: v.author as string,
    title: v.title as string,
    year: v.year as string,
    licence: v.licence as SourceLicence,
    allowVerbatim: v.allowVerbatim,
    url: typeof v.url === 'string' ? v.url : undefined,
    notes: typeof v.notes === 'string' ? v.notes : undefined,
  };
}

/**
 * The licence gate. Returns an issue when an entry's use of its source is
 * not permitted by the registry, null when it is.
 */
export function checkLicenceGate(
  file: string,
  sourceKey: string,
  registry: SourceRegistry,
  isParaphrase: boolean
): CorpusIssue | null {
  const source = registry[sourceKey];
  if (!source) {
    return {
      file,
      message: `source "${sourceKey}" is not registered in sources.json — register it (with its licence) before compiling`,
    };
  }
  if (!isParaphrase && !source.allowVerbatim) {
    return {
      file,
      message:
        `verbatim quotation from "${sourceKey}" is not permitted (licence: ${source.licence}). ` +
        `Either mark the entry isParaphrase: true and rewrite in Hearth's words with attribution, ` +
        `or resolve the licence and update sources.json`,
    };
  }
  return null;
}
