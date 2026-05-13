// Runtime types for the three-layer content model (pedagogy + methodology + content).
// Specs: docs/hearth-pedagogy-lens-bundle-v1.md, docs/hearth-methodology-overlay-bundle-v1.md.
// These mirror the Sanity object schemas in src/sanity/schemas/{pedagogyLensBundle,methodologyOverlay}.ts
// minus admin-only fields (corpusChunkIds, generatedBy) which are not fetched at runtime.

export type LensStatus = 'pending' | 'ready' | 'failed';
export type MethodologyStatus = 'pending' | 'ready' | 'failed';

export type PedagogyKey =
  | 'charlotte_mason'
  | 'classical'
  | 'montessori'
  | 'waldorf_steiner'
  | 'unschooling'
  | 'eclectic';

export type EvidencePriority = {
  threadKey: string;
  weight: number;
  interpretation?: string;
};

export type QuestionOverlay = {
  grammar?: string;
  payload?: string;
};

export type PedagogyLensBundle = {
  pedagogyKey: PedagogyKey;
  whyThisMatters?: string | null;
  facilitationNote?: string | null;
  observationCues?: string[];
  questionOverlay?: QuestionOverlay;
  evidencePriorities?: EvidencePriority[];
  generatedAt?: string;
};

export type MethodologyOverlay = {
  practiceKey: string;
  loggerPromptHint?: string | null;
  prepHint?: string | null;
  observationCue?: string | null;
  evidenceTagBias?: string[];
  generatedAt?: string;
};

export type FamilyPedagogicalProfile = {
  pedagogyKey: PedagogyKey | string;
  practices: string[];
};

export type ModuleWithBundles = {
  lensStatus?: LensStatus;
  pedagogyLensBundles?: PedagogyLensBundle[];
  methodologyStatus?: MethodologyStatus;
  methodologyAffordances?: string[];
  methodologyOverlays?: MethodologyOverlay[];
};
