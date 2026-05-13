// Capability Universe v2 — substrate types
// Source of truth: docs/hearth-capability-universe-v2-architecture-spec-v1.md (§3)
// Mirrors the spec verbatim. Sanity schemas and Drizzle tables follow these shapes.
// Append-only after publication (D3, D12) — fields may be added but not removed or restructured.

export type LibraryVersion = string; // semver, e.g. "2.0.0"

export type StageBandKey =
  | 'foundational'
  | 'intermediate'
  | 'advanced'
  | 'tertiary';

export type SuperDomainKey =
  | 'foundations'
  | 'cultural-inheritance'
  | 'classical-disciplines'
  | 'aesthetic-expression'
  | 'practical-vocational'
  | 'human-formation';

export type EdgeType =
  | 'foundational'
  | 'concurrent'
  | 'alternative'
  | 'enrichment';

export type ObservationTier = 'emerging' | 'developing' | 'demonstrating';

export type EvidenceConfidence = 'suggested' | 'confirmed' | 'parent-asserted';

export type CanonStatus = 'active' | 'deprecated';

export type PedagogyKey =
  | 'charlotte-mason'
  | 'classical'
  | 'montessori'
  | 'waldorf'
  | 'unschooling'
  | 'eclectic';

export type PedagogyAffinityWeight = 'high' | 'moderate' | 'low' | 'neutral';

export type StrandOrdering = 'sequential' | 'parallel' | 'flexible';

export type EdgeStrength = 'hard' | 'soft';

export type MappingContribution = 'primary' | 'partial' | 'incidental';

export type ReportTier =
  | 'cd_level'
  | 'learning_area'
  | 'standard'
  | 'outcome';

export type RegulatoryFrameworkKey =
  | 'ac-v9-qld'
  | 'ac-v9-nsw'
  | 'ac-v9-vic'
  | 'ac-v9-wa'
  | 'ac-v9-sa'
  | 'ac-v9-tas'
  | 'ac-v9-act'
  | 'ac-v9-nt'
  | 'us-common-core'
  | 'us-ngss'
  | 'us-tx-homeschool'
  | 'us-pa-homeschool-portfolio'
  | 'us-ca-homeschool'
  | 'none';

// ─── Domain ───

export interface ConstellationRegion {
  angularStart: number; // degrees
  angularEnd: number;
  radialMin: number; // 0–1 normalised
  radialMax: number;
}

export interface Domain {
  id: string;
  numericId: number;
  name: string;
  shortName: string;
  superDomain: SuperDomainKey;
  introducedInVersion: LibraryVersion;
  authoredBy: string;
  status: CanonStatus;
  deprecationReplacement?: string;
  summary: string;
  whatItIsNot: string;
  exampleObservations: string[];
  iconKey: string;
  colourToken: string;
  constellationRegion: ConstellationRegion;
}

// ─── Thread ───

export interface PedagogyAffinity {
  pedagogyKey: PedagogyKey;
  weight: PedagogyAffinityWeight;
  rationale?: string;
}

export interface ThreadStageBand {
  key: StageBandKey;
  isPopulatedInThisVersion: boolean;
  approximateAgeBand?: { min: number; max: number };
  summary: string;
  strandIds: string[];
  badgeIds: string[];
  prerequisiteEdgeIds: string[];
}

export interface Thread {
  id: string;
  domainId: string;
  name: string;
  shortName: string;
  legacyV1Id?: string;
  introducedInVersion: LibraryVersion;
  status: CanonStatus;
  deprecationReplacement?: string;
  summary: string;
  longDescription: string;
  whatItLooksLike: string[];
  stageBands: ThreadStageBand[]; // exactly 4 entries
  pedagogyAffinities: PedagogyAffinity[];
  iconKey: string;
  colourToken: string;
}

// ─── Strand ───

export interface Strand {
  id: string;
  threadId: string;
  stageBand: StageBandKey;
  name: string;
  introducedInVersion: LibraryVersion;
  status: CanonStatus;
  publishedInVersion?: LibraryVersion;
  summary: string;
  whatItDevelops: string;
  atomicCapabilityIds: string[];
  ordering: StrandOrdering;
}

// ─── Atomic capability ───

export interface AtomicIndicator {
  id: string;
  tier: ObservationTier;
  text: string;
  observabilityNotes?: string;
  introducedInVersion: LibraryVersion;
  status: CanonStatus;
}

export interface RegulatoryMapping {
  frameworkKey: RegulatoryFrameworkKey;
  frameworkVersion: string;
  codes: string[];
  reportTier?: ReportTier;
  contribution: MappingContribution;
  evidenceWeight: number; // 0.0–1.0
}

export interface AtomicCapability {
  id: string;
  strandId: string;
  threadId: string;
  domainId: string;
  stageBand: StageBandKey;
  name: string;
  shortName: string;
  introducedInVersion: LibraryVersion;
  status: CanonStatus;
  publishedInVersion?: LibraryVersion;
  description: string;
  whyItMatters: string;
  observableInContext: string;
  indicators: AtomicIndicator[];
  prerequisiteEdgeIds: string[];
  regulatoryMappings: RegulatoryMapping[];
  facilitationHints: string[];
}

// ─── Prerequisite edge ───

export interface PrerequisiteEdge {
  id: string;
  edgeType: EdgeType;

  // exactly one of the two endpoint pairs must be populated (D6)
  fromThreadId?: string;
  fromStageBand?: StageBandKey;
  toThreadId?: string;
  toStageBand?: StageBandKey;

  fromAtomicId?: string;
  toAtomicId?: string;

  rationale: string;
  strength: EdgeStrength;
  introducedInVersion: LibraryVersion;
  status: CanonStatus;
}

// ─── Regulatory framework ───

export interface ReportFormatSchema {
  // Schema is framework-specific; kept opaque at the type layer.
  [key: string]: unknown;
}

export interface EvidenceRequirementSchema {
  [key: string]: unknown;
}

export interface RegulatoryFramework {
  key: RegulatoryFrameworkKey;
  name: string;
  jurisdiction: string;
  reportTier: ReportTier;
  totalCodes: number;
  reportFormat: ReportFormatSchema;
  evidenceRequirements: EvidenceRequirementSchema;
  introducedInVersion: LibraryVersion;
  deprecatedInVersion?: LibraryVersion;
}

// ─── Badge (stage-tier scoped, D8) ───

export type BadgeCriteriaPolicy = 'all' | 'threshold';

export interface BadgeCriterion {
  atomicCapabilityId: string;
  minimumTier: ObservationTier;
  weight: number;
}

export interface Badge {
  id: string;
  name: string;
  shortName: string;
  threadId: string;
  stageBand: StageBandKey;
  introducedInVersion: LibraryVersion;
  status: CanonStatus;
  description: string;
  whatItRecognises: string;
  parentNarrative: string;
  criteria: BadgeCriterion[];
  criteriaPolicy: BadgeCriteriaPolicy;
  thresholdCount?: number;
  prerequisiteBadgeIds: string[];
  iconKey: string;
  colourToken: string;
}

// ─── Observation (PostgreSQL — user-specific, v2 enriched) ───

export type EvidenceArtifactType =
  | 'photo'
  | 'audio'
  | 'video'
  | 'document'
  | 'text';

export interface EvidenceArtifact {
  type: EvidenceArtifactType;
  uri?: string;
  text?: string;
  caption?: string;
}

export interface AtomicObservationLink {
  atomicCapabilityId: string;
  tierAtTime: ObservationTier;
  indicatorIds: string[];
  confidence: EvidenceConfidence;
}

export interface ThreadObservationLink {
  threadId: string;
  stageBand: StageBandKey;
  tierAtTime: ObservationTier;
  confidence: EvidenceConfidence;
  atomicLinks: AtomicObservationLink[];
}

export type ObservationSource =
  | 'retrospective_log'
  | 'module_completion'
  | 'quick_capture'
  | 'badge_assessment';

export interface Observation {
  id: string;
  familyId: string;
  learnerId: string;
  timestamp: string; // ISO 8601
  source: ObservationSource;
  sourceId: string;
  title: string;
  description: string;
  evidence: EvidenceArtifact[];
  threadLinks: ThreadObservationLink[];
  capturedLibraryVersion: LibraryVersion;
}

// ─── Custom thread (PostgreSQL — family-specific, D11) ───

export interface CustomThreadTierIndicators {
  emerging: string[];
  developing: string[];
  demonstrating: string[];
}

export interface CustomThread {
  id: string; // "custom-{familyId}-{slug}"
  familyId: string;
  createdByUserId: string;
  name: string;
  summary: string;
  tierIndicators: CustomThreadTierIndicators;
  isCustom: true;
  domainAffinity?: string;
}

// ─── Family library state (PostgreSQL) ───

export interface LibraryUpgradeEvent {
  fromVersion: LibraryVersion;
  toVersion: LibraryVersion;
  upgradedAt: string;
  observationsRetagged: number;
  observationsCarriedAsLegacy: number;
  notes: string[];
}

export interface FamilyLibraryState {
  familyId: string;
  currentLibraryVersion: LibraryVersion;
  pinnedAtVersion?: LibraryVersion;
  upgradeHistory: LibraryUpgradeEvent[];
}

// ─── Constants ───

export const CURRENT_LIBRARY_VERSION: LibraryVersion = '2.0.0';

export const STAGE_BANDS: readonly StageBandKey[] = [
  'foundational',
  'intermediate',
  'advanced',
  'tertiary',
] as const;

export const SUPER_DOMAINS: readonly SuperDomainKey[] = [
  'foundations',
  'cultural-inheritance',
  'classical-disciplines',
  'aesthetic-expression',
  'practical-vocational',
  'human-formation',
] as const;

export const EDGE_TYPES: readonly EdgeType[] = [
  'foundational',
  'concurrent',
  'alternative',
  'enrichment',
] as const;
