// Pedagogy Corpus Vault — shared types and constants.
//
// The vault (corpus/pedagogy/) is the authoring source of truth for the
// Pedagogy Knowledge Base. One markdown file = one corpus entry = one Sanity
// document. The compiler (scripts/compile-pedagogy-corpus.ts) projects vault
// entries onto the live Sanity PKB schemas; the existing reembed pipeline
// (scripts/reembed-pedagogy-corpus.ts) then materialises published, confirmed
// documents into pedagogy_knowledge_chunks for retrieval.

export interface FrameworkInfo {
  /** Vault directory name, e.g. 'charlotte-mason' */
  dir: string;
  /** Sanity pedagogicalFramework slug, e.g. 'charlotte_mason' */
  slug: string;
  /** Short code used in document IDs, e.g. 'cm' → pedagogySourceExcerpt.cm.001 */
  short: string;
  title: string;
}

export const FRAMEWORKS: FrameworkInfo[] = [
  { dir: 'charlotte-mason', slug: 'charlotte_mason', short: 'cm', title: 'Charlotte Mason' },
  { dir: 'classical', slug: 'classical', short: 'classical', title: 'Classical' },
  { dir: 'montessori', slug: 'montessori', short: 'montessori', title: 'Montessori' },
  { dir: 'waldorf-steiner', slug: 'waldorf_steiner', short: 'waldorf', title: 'Waldorf / Steiner' },
  { dir: 'unschooling', slug: 'unschooling', short: 'us', title: 'Unschooling' },
];

export function frameworkByDir(dir: string): FrameworkInfo | undefined {
  return FRAMEWORKS.find((f) => f.dir === dir);
}

export const LAYER_DIRS = [
  'source-excerpts',
  'practice-patterns',
  'observational-markers',
  'facilitation-vocabulary',
  'contraindications',
  'worked-examples',
] as const;

export type LayerDir = (typeof LAYER_DIRS)[number];

export const LAYER_DIR_TO_SANITY_TYPE: Record<LayerDir, string> = {
  'source-excerpts': 'pedagogySourceExcerpt',
  'practice-patterns': 'pedagogyPracticePattern',
  'observational-markers': 'pedagogyObservationalMarker',
  'facilitation-vocabulary': 'pedagogyFacilitationVocabulary',
  'contraindications': 'pedagogyContraindication',
  'worked-examples': 'pedagogyWorkedExample',
};

/**
 * Wave-1 volume targets per framework, from the PKB architecture
 * (hearth-pedagogy-knowledge-base-architecture-v1.md §6, practice-pattern
 * count updated by the 2026-05-13 Interpretive Patterns reframe).
 */
export const LAYER_TARGETS: Record<LayerDir, number> = {
  'source-excerpts': 50,
  'practice-patterns': 8,
  'observational-markers': 6,
  'facilitation-vocabulary': 1,
  'contraindications': 8,
  'worked-examples': 20,
};

// ─── Source registry (licence-as-data) ────────────────────────────────────────

/**
 * Licence classes for registered sources. PKB11 established that Australian
 * fair dealing does not cover Hearth's pipeline, so verbatim quotation is a
 * mechanical gate: it requires a licence class where allowVerbatim is true.
 * Paraphrase-with-attribution is permitted from any registered source
 * (ideas and facts are not copyrightable; the registry note records any
 * per-source caveat, e.g. CC BY-NC-ND reference-only handling per PKB14).
 */
export type SourceLicence =
  | 'public_domain'
  | 'cc_by'
  | 'cc_by_nc_nd'
  | 'in_copyright'
  | 'licensed'
  | 'commissioned';

export interface CorpusSource {
  author: string;
  title: string;
  year: string;
  licence: SourceLicence;
  /** Whether verbatim quotation from this source is permitted. */
  allowVerbatim: boolean;
  url?: string;
  notes?: string;
}

export type SourceRegistry = Record<string, CorpusSource>;

// ─── Parsed entries ───────────────────────────────────────────────────────────

export type FrontmatterValue = string | boolean | string[];

export interface ParsedEntry {
  /** Path relative to the vault root, for error reporting. */
  file: string;
  framework: FrameworkInfo;
  layerDir: LayerDir;
  sanityType: string;
  frontmatter: Record<string, FrontmatterValue>;
  /** Body sections keyed by lower-cased heading name. */
  sections: Record<string, string>;
}

export interface CorpusIssue {
  file: string;
  message: string;
}

/** A compiled Sanity document ready for createOrReplace. */
export interface CompiledDoc {
  _id: string;
  _type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
