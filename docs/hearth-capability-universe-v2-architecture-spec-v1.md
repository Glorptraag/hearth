# Hearth Capability Universe v2 — Architecture Spec v1 (Reconstructed)

> **Status:** Reconstructed from code 2026-06-11 (the original spec was never committed). Replace with the canonical copy if one is found; until then the types file is normative and this document is its prose mirror.

**Normative source:** `src/types/capability-universe.ts` (its header declares it mirrors spec §3 verbatim).
**Reconstructed from:**

- `src/types/capability-universe.ts` — substrate types (§3)
- `src/lib/capability-universe-v2.ts` — 15-domain taxonomy + v1→v2 thread→domain map (§2, §3.2)
- `src/sanity/schemas/{capabilityDomain,capabilityThread,strand,atomicCapability,prerequisiteEdge,regulatoryFramework,badge}.ts` — Sanity conformance schemas + decision-tag comments
- `scripts/seed-capability-domains.ts` — §2.1/§2.2 per-domain editorial content (spec-canonical seed)
- `scripts/seed-capability-threads.ts` — v1→v2 migration semantics
- `scripts/data/hearth-constellation-content-lo-fi-v1.ts`, `src/app/(auth)/our-story/capabilities/_constellation/topology.ts` — §9.1 / D-tag citations

Section numbers preserve the original spec's numbering wherever code cites it (§2, §3.1–§3.7, §7.1, §7.2, §9.1, §11.4). Sections the code never cites (§1, §4–§6, §8, §10, most of §11) are **not recovered** and are marked as such — do not invent content for them.

---

## §1 — Purpose (not recovered)

The original §1 was never cited by code. What can be asserted from context: the Capability Universe v2 is Hearth's canonical map of what a homeschooled learner can develop — the substrate beneath the Constellation visualisation, badge system, observation tagging, and regulatory reporting. It replaces the flat v1 scheme (57 threads × 3 tiers × inline DLOs) with a versioned, append-only canon: Domain → Thread → Stage-band → Strand → Atomic capability, with typed prerequisite edges and atomic-level regulatory mappings.

## §2 — Domain architecture

### §2.1 — The 15 domains and 6 super-domains

v2 organises capability identity into **15 domains** grouped under **6 super-domains**. Domains are the addressable unit of capability identity: threads belong to exactly one domain; atomic capabilities inherit their domain from their thread.

Super-domain keys (§3.1 `SuperDomainKey` union, kebab-case — canonical):
`foundations` · `cultural-inheritance` · `classical-disciplines` · `aesthetic-expression` · `practical-vocational` · `human-formation`

| # | Domain | Short name | Super-domain | Key | v1 threads |
|---|--------|-----------|--------------|-----|-----------|
| 1 | Language & Literacy | Language | foundations | `languageLiteracy` | 7 |
| 2 | Mathematical Thinking | Maths | foundations | `mathematicalThinking` | 9 |
| 3 | Scientific Thinking | Science | foundations | `scientificThinking` | 6 |
| 4 | Technological Fluency | Technology | foundations | `technologicalFluency` | 2 |
| 5 | Historical, Civic & Geographic Understanding | History & Place | cultural-inheritance | `historicalCivicGeographic` | 6 |
| 6 | Literary & Narrative Tradition | Literature | cultural-inheritance | `literaryTradition` | 2 |
| 7 | Classical Languages | Classical | classical-disciplines | `classicalLanguages` | 0 |
| 8 | Logic & Rhetoric | Logic & Rhetoric | classical-disciplines | `logicRhetoric` | 1 |
| 9 | Theology & Scriptural Literacy | Theology | classical-disciplines | `theologyScripture` | 0 |
| 10 | Visual & Plastic Arts | Visual Arts | aesthetic-expression | `visualPlasticArts` | 1 |
| 11 | Musical & Performative Arts | Music & Performance | aesthetic-expression | `musicalPerformative` | 3 |
| 12 | Practical Mastery | Practical | practical-vocational | `practicalMastery` | 1 |
| 13 | Personal & Ethical Formation | Personal | human-formation | `personalEthical` | 11 |
| 14 | Social & Relational Formation | Social | human-formation | `socialRelational` | 3 |
| 15 | Physical & Embodied Capability | Physical | human-formation | `physicalEmbodied` | 5 |

Domains 7 and 9 have **no v1 successor threads** — they render in the Constellation as present-but-unlit (§9.1 / D9). Domain 9 is additionally **opt-in at family level** (§2.2): families that have not selected the relevant worldview see it available but unlit, and packs touching it can be filtered out.

### §2.2 — Per-domain rationale and boundaries

Each domain carries a `summary` (2–3 sentences), a `whatItIsNot` boundary statement (where adjacent capability lives instead — prevents domain bleed during authoring), and 3–5 `exampleObservations`. The canonical editorial content lives in `scripts/seed-capability-domains.ts` (extracted there from this spec's §2.2). Boundary highlights:

1. **Language & Literacy** — fluent reading, listening, writing, speaking. *Not:* classical languages (D7), literature-as-tradition (D6), communication-as-relation (D14).
2. **Mathematical Thinking** — number sense through tertiary calculus/linear algebra/discrete maths. *Not:* formal logic at tertiary (D8), applied measurement in making (D12).
3. **Scientific Thinking** — understanding as the goal, distinct from technology, which is making. *Not:* engineering (D4), nature-as-devotion (D13).
4. **Technological Fluency** — computational thinking, coding, engineering design. **v2 new** — modern life requires it and AC v9 increasingly recognises it. *Not:* hand-tool mastery (D12), maths-over-data without computation (D2).
5. **Historical, Civic & Geographic Understanding** — history and geography studied together because geography is where history happens. *Not:* personal ethics (D13), literary-historical narrative (D6).
6. **Literary & Narrative Tradition** — being formed by what one reads; distinct from Language & Literacy's reading craft. *Not:* decoding (D1), original creative writing-as-craft (D1).
7. **Classical Languages** — Latin, Greek, Hebrew; access to historic textual traditions rather than contemporary communication. Each language is a **strand** within this domain, not a sub-domain.
8. **Logic & Rhetoric** — the Trivium's logic and rhetoric stages; formal + informal reasoning, dialectic, oratory. *Not:* mathematical proof (D2), persuasion-as-writing-craft (D1).
9. **Theology & Scriptural Literacy** — sacred texts, doctrine, catechesis, tradition-grounded ethical reasoning. **Opt-in at family level; threads inside are tradition-specific.** *Not:* general ethics (D13), comparative-religion history (D5).
10. **Visual & Plastic Arts** — drawing through art criticism. *Not:* performative/time-based art (D11), functional hand-craft (D12).
11. **Musical & Performative Arts** — music, drama, dance, recitation, oral storytelling, hymnody. *Not:* static visual arts (D10); poetry-as-literature is D6, performative poetry lives here.
12. **Practical Mastery** — handwork, domestic arts, gardening, repair, tool use. **Trades-grade vocational competence is reserved for v3+ admissions.** *Not:* visual-art making (D10), athletic body work (D15).
13. **Personal & Ethical Formation** — the inner formation of the learner: attention, self-regulation, persistence, virtue, conscience. *Not:* interpersonal relating (D14), embodied capability (D15), formal moral philosophy at tertiary (D8).
14. **Social & Relational Formation** — cooperation, empathy, friendship, family belonging, hospitality. *Not:* communication-as-craft (D1), self-regulation that supports relating (D13).
15. **Physical & Embodied Capability** — movement, sport, bushcraft, proprioception, risk competence. *Not:* tool-specific dexterity (D12), team-sport cooperation (D14).

### §2.3 — v1→v2 thread→domain migration

The 57 v1 threads map onto the 15 v2 domains via a primary-domain assignment (split cases take the primary domain only; source: `hearth-v1-to-v2-thread-migration-table-v1.md`, itself not committed). The runtime copy is `THREAD_TO_V2_DOMAIN` in `src/lib/capability-universe-v2.ts`, extracted verbatim from `scripts/seed-capability-threads.ts` so the rendered constellation, the Sanity seed, and the migration table cannot drift:

| v2 domain | v1 thread codes |
|-----------|----------------|
| 1 Language & Literacy | L1–L7 |
| 2 Mathematical Thinking | M1–M9 |
| 3 Scientific Thinking | S1–S6 |
| 4 Technological Fluency | PS7, C7 |
| 5 Historical, Civic & Geographic | H1–H6 |
| 6 Literary & Narrative Tradition | L9, C1 |
| 7 Classical Languages | — (none) |
| 8 Logic & Rhetoric | L8 |
| 9 Theology & Scriptural Literacy | — (none) |
| 10 Visual & Plastic Arts | C5 |
| 11 Musical & Performative Arts | C2–C4 |
| 12 Practical Mastery | C6 |
| 13 Personal & Ethical Formation | PS3–PS6, EF1–EF5, EF7, EF8 |
| 14 Social & Relational Formation | PS1, PS2, EF6 |
| 15 Physical & Embodied Capability | P1–P5 |

Migration semantics (per `scripts/seed-capability-threads.ts`): v1 threads are seeded under v2 IDs (`capabilityThread.{legacyV1Id}`) with v2 domain references, carrying v1 content. `legacyV1Id` is preserved so observations re-tag automatically on migration (§11.4). When a v2-native successor thread is authored, the v1 thread flips to `canonStatus: 'deprecated'` with `deprecationReplacement` pointing across. v1-migrated threads ship with the required four-band skeleton, all bands `isPopulatedInThisVersion: false` (v1 content is flat, not stage-banded).

## §3 — Substrate types

The shapes below are the conformance contract for the Sanity schemas (`src/sanity/schemas/*`) and Drizzle tables. `src/types/capability-universe.ts` mirrors this section verbatim — if this document and that file ever disagree, **the types file wins**.

**Storage split:** Domains, threads, strands, atomic capabilities, prerequisite edges, regulatory frameworks, and badges are centrally authored canon → **Sanity**. Observations, custom threads, and family library state are user data → **PostgreSQL**. (This is the global Sanity-vs-Postgres rule applied to the Universe.)

### §3.1 — Shared keys and unions

```ts
export type LibraryVersion = string; // semver, e.g. "2.0.0"

export type StageBandKey = 'foundational' | 'intermediate' | 'advanced' | 'tertiary';

export type SuperDomainKey =
  | 'foundations' | 'cultural-inheritance' | 'classical-disciplines'
  | 'aesthetic-expression' | 'practical-vocational' | 'human-formation';

export type EdgeType = 'foundational' | 'concurrent' | 'alternative' | 'enrichment';

export type ObservationTier = 'emerging' | 'developing' | 'demonstrating';

export type EvidenceConfidence = 'suggested' | 'confirmed' | 'parent-asserted';

export type CanonStatus = 'active' | 'deprecated';

export type PedagogyKey =
  | 'charlotte-mason' | 'classical' | 'montessori'
  | 'waldorf' | 'unschooling' | 'eclectic';

export type PedagogyAffinityWeight = 'high' | 'moderate' | 'low' | 'neutral';

export type StrandOrdering = 'sequential' | 'parallel' | 'flexible';

export type EdgeStrength = 'hard' | 'soft';

export type MappingContribution = 'primary' | 'partial' | 'incidental';

export type ReportTier = 'cd_level' | 'learning_area' | 'standard' | 'outcome';

export type RegulatoryFrameworkKey =
  | 'ac-v9-qld' | 'ac-v9-nsw' | 'ac-v9-vic' | 'ac-v9-wa' | 'ac-v9-sa'
  | 'ac-v9-tas' | 'ac-v9-act' | 'ac-v9-nt'
  | 'us-common-core' | 'us-ngss' | 'us-tx-homeschool'
  | 'us-pa-homeschool-portfolio' | 'us-ca-homeschool'
  | 'none';
```

The tier vocabulary (`emerging`/`developing`/`demonstrating`) is preserved from v1 for backward-compatible consumption alongside the v2 stage-band structure. Stage-bands describe *where in the developmental arc* a strand/atom sits; tiers describe *how established* an observed capability is.

### §3.2 — Domain

```ts
export interface ConstellationRegion {
  angularStart: number; // degrees
  angularEnd: number;
  radialMin: number;    // 0–1 normalised
  radialMax: number;
}

export interface Domain {
  id: string;
  numericId: number;          // 1–15 in v2, append-only allocated thereafter
  name: string;
  shortName: string;
  superDomain: SuperDomainKey;
  introducedInVersion: LibraryVersion;
  authoredBy: string;
  status: CanonStatus;
  deprecationReplacement?: string;
  summary: string;            // 2–3 sentence plain-language description
  whatItIsNot: string;        // explicit boundary statements
  exampleObservations: string[]; // 3–5 concrete examples
  iconKey: string;
  colourToken: string;        // design-system token — no hardcoded values
  constellationRegion: ConstellationRegion;
}
```

`ConstellationRegion` gives each domain a stable polar-coordinate placement so v3+ domains can be admitted without reshuffling existing layouts. It is optional in v2 — the renderer can use organic layout within a domain region; the region itself is what's constrained.

Implementation notes (Sanity `capabilityDomain`): identity is `slug` + deterministic `_id` `capabilityDomain.{camelCaseKey}` per the seed; `authoredBy` is intentionally omitted from the schema per the blessed schema artifact; the schema adds an `optIn` boolean (true for Domain 9 per §2.2). It supersedes the earlier `domain.ts` schema (required `domainId` string, no `optIn`).

### §3.3 — Thread

```ts
export interface PedagogyAffinity {
  pedagogyKey: PedagogyKey;
  weight: PedagogyAffinityWeight;
  rationale?: string;         // editorial note for lens overlay
}

export interface ThreadStageBand {
  key: StageBandKey;
  isPopulatedInThisVersion: boolean;
  approximateAgeBand?: { min: number; max: number }; // soft hint, not enforced
  summary: string;            // 1–2 sentences
  strandIds: string[];
  badgeIds: string[];         // stage-tier scoped (D8)
  prerequisiteEdgeIds: string[]; // stage-band-to-stage-band edges (D6)
}

export interface Thread {
  id: string;
  domainId: string;           // exactly one domain
  name: string;
  shortName: string;
  legacyV1Id?: string;        // migration mapping, e.g. "M1", "PS4", "EF6" (§11.4)
  introducedInVersion: LibraryVersion;
  status: CanonStatus;
  deprecationReplacement?: string;
  summary: string;            // 1 paragraph
  longDescription: string;    // multi-paragraph
  whatItLooksLike: string[];  // 5–8 concrete examples across stage-bands
  stageBands: ThreadStageBand[]; // exactly 4 entries (D4)
  pedagogyAffinities: PedagogyAffinity[];
  iconKey: string;
  colourToken: string;
}
```

Every thread carries all four stage-bands from v2 forward, even when unpopulated (D4). Per D3/D6, regulatory mappings and atomic structure do **not** live on the thread — they attach at stage-band/strand/atomic level.

Implementation notes (Sanity `capabilityThread`): spec names the canon field `status`; the schema uses `canonStatus` to avoid collision with document workflow status. The schema retains legacy v1 fields (`description`, inline `dlos`, thread-level `prerequisites`/`enables`, thread-level `curriculumCodes`) as optional/deprecated during the v1→v2 transition, until DLO content collapses onto standalone `discreteLearningObjective` documents.

### §3.4 — Strand

```ts
export interface Strand {
  id: string;
  threadId: string;
  stageBand: StageBandKey;
  name: string;
  introducedInVersion: LibraryVersion;
  status: CanonStatus;
  publishedInVersion?: LibraryVersion; // locks structure once set
  summary: string;
  whatItDevelops: string;
  atomicCapabilityIds: string[];
  ordering: StrandOrdering;
  // sequential — atoms must be acquired in order
  // parallel   — atoms develop alongside each other
  // flexible   — soft sequencing
}
```

The strand is the organisational layer between a thread's stage-band and its atomic capabilities. In Domain 7, each classical language is a strand (§2.2).

### §3.5 — Atomic capability

```ts
export interface AtomicIndicator {
  id: string;
  tier: ObservationTier;
  text: string;
  observabilityNotes?: string;
  introducedInVersion: LibraryVersion;
  status: CanonStatus;
}

export interface RegulatoryMapping {            // §3.7
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
  threadId: string;     // denormalised
  domainId: string;     // denormalised
  stageBand: StageBandKey;
  name: string;
  shortName: string;
  introducedInVersion: LibraryVersion;
  status: CanonStatus;
  publishedInVersion?: LibraryVersion; // locks structure once set
  description: string;           // 1–2 sentences plain language
  whyItMatters: string;
  observableInContext: string;   // sample utterance
  indicators: AtomicIndicator[];
  prerequisiteEdgeIds: string[]; // atomic-to-atomic (D6)
  regulatoryMappings: RegulatoryMapping[]; // atom is the rollup source
  facilitationHints: string[];   // for module authors
}
```

The atomic capability is the smallest grain the Universe registers. It is append-only after publication (D3): indicators can be added but never removed.

### §3.6 — Prerequisite edge

```ts
export interface PrerequisiteEdge {
  id: string;
  edgeType: EdgeType; // four types (D7):
  // foundational — hard prerequisite
  // concurrent   — develops alongside
  // alternative  — one of several entry points
  // enrichment   — deepens without unlocking

  // exactly one of the two endpoint pairs must be populated (D6)
  fromThreadId?: string;
  fromStageBand?: StageBandKey;
  toThreadId?: string;
  toStageBand?: StageBandKey;

  fromAtomicId?: string;
  toAtomicId?: string;

  rationale: string;     // required — no silent edges
  strength: EdgeStrength;
  // hard — locks until source meets threshold
  // soft — surfaces as ghost; does not lock
  introducedInVersion: LibraryVersion;
  status: CanonStatus;
}
```

Edges attach at exactly one of: stage-band-to-stage-band OR atomic-to-atomic (D6). Thread-to-thread edges are computed unions and are not stored.

### §3.7 — Regulatory mapping

See `RegulatoryMapping` in §3.5. Mappings attach at the **atomic** level only (§7.1); thread-level `curriculumCodes` are a deprecated v1 leftover. The atom is the rollup source: report generation aggregates atomic mappings upward to whatever `ReportTier` the target framework requires.

### §3.8 — Badge (stage-tier scoped, D8)

> Sub-section numbering from here down is inferred from type-file order; the original spec's exact numbering beyond §3.7 was not recoverable.

```ts
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
  stageBand: StageBandKey;     // badges are scoped to a thread × stage-band (D8)
  introducedInVersion: LibraryVersion;
  status: CanonStatus;
  description: string;
  whatItRecognises: string;
  parentNarrative: string;
  criteria: BadgeCriterion[];
  criteriaPolicy: BadgeCriteriaPolicy;
  thresholdCount?: number;     // when criteriaPolicy = 'threshold'
  prerequisiteBadgeIds: string[];
  iconKey: string;
  colourToken: string;
}
```

**Known divergence:** the shipped Sanity `badge.ts` schema is still the **v1 shape** (`capabilityThreads[]` references + a flat `observationThreshold`, draft/published/archived workflow). The v2 stage-tier-scoped Badge above exists in the types file (and is referenced from `capabilityThread.stageBands[].badges`) but has not yet been migrated into the Sanity schema. Treat the types file as the v2 target.

### §3.9 — Regulatory framework registry (§7.2)

```ts
export interface ReportFormatSchema { [key: string]: unknown }       // framework-specific, opaque at the type layer
export interface EvidenceRequirementSchema { [key: string]: unknown }

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
```

Centrally authored registry (Sanity `regulatoryFramework`); each framework is a target for atomic-level mappings. The Sanity schema stores `reportFormat`/`evidenceRequirements` as opaque JSON text fields.

### §3.10 — Observation (PostgreSQL — user-specific, v2 enriched)

```ts
export type EvidenceArtifactType = 'photo' | 'audio' | 'video' | 'document' | 'text';

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
  | 'retrospective_log' | 'module_completion' | 'quick_capture' | 'badge_assessment';

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
```

Observations record `tierAtTime` and `capturedLibraryVersion` — evidence is pinned to the canon version under which it was captured, which is what makes append-only library upgrades safe (§11.4).

### §3.11 — Custom thread (PostgreSQL — family-specific, D11)

```ts
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
```

Families can author their own threads (D11). Custom threads live in Postgres, never in the Sanity canon, and use the v1-style flat tier vocabulary.

### §3.12 — Family library state (PostgreSQL)

```ts
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
```

Each family tracks which library version it is on (`CURRENT_LIBRARY_VERSION = '2.0.0'`), can pin, and records upgrade events including how many observations were re-tagged vs carried as legacy.

## Append-only canon rules

The Universe is a versioned canon. Once published, structure is **append-only**:

- **Fields** may be added to substrate types but never removed or restructured (types-file header, D3/D12).
- **Domains** (D12) cannot be removed, merged, split, or renamed in later library versions. New domains can be admitted (numericId append-only allocated past 15); existing ones are deprecated in place, never deleted.
- **Threads / strands / atomic capabilities** (D3) are deprecated, never deleted; a deprecated node carries `deprecationReplacement` pointing at its successor. `publishedInVersion` locks a strand/atom's structure once set.
- **Indicators** can be added to an atom but never removed; individual indicators carry their own `introducedInVersion`/`status`.
- **Edges** require a `rationale` (no silent edges) and carry `introducedInVersion`/`status` like every other canon node.
- **Why:** observations pin `capturedLibraryVersion` and `tierAtTime`. A child's evidence trail must remain interpretable under every later library version — deletion or restructuring would orphan historical evidence. Upgrades re-tag what can be re-tagged (via `legacyV1Id`, §11.4) and carry the rest as legacy, with counts recorded on `FamilyLibraryState.upgradeHistory`.

## Decision register (as recovered from code)

The original spec carried a numbered decision register. Only the tags actually cited in code comments are recoverable; the rest are marked unknown.

| Tag | Decision (as evidenced) | Where cited |
|-----|------------------------|-------------|
| D1 | Capability content is pedagogy-neutral | `scripts/data/hearth-constellation-content-lo-fi-v1.ts` |
| D2 | *(not recovered)* | — |
| D3 | Canon is append-only after publication: threads/atoms deprecated in place, never deleted; indicators added, never removed; regulatory/atomic structure does not live on the thread | `src/types/capability-universe.ts`, `atomicCapability.ts`, `capabilityThread.ts` |
| D4 | Every thread carries exactly four stage-bands (foundational/intermediate/advanced/tertiary), present from v2 forward even when unpopulated | `capabilityThread.ts`, seed scripts |
| D5 | *(not recovered)* | — |
| D6 | Prerequisite edges attach at exactly one of: stage-band↔stage-band OR atomic↔atomic; thread-level edges are computed unions, not stored | `prerequisiteEdge.ts`, `capabilityThread.ts`, types file |
| D7 | Four edge types: foundational / concurrent / alternative / enrichment | `prerequisiteEdge.ts` |
| D8 | Badges are stage-tier scoped (thread × stage-band), not thread-global | types file, `capabilityThread.ts` |
| D9 | Domains with no populated threads (7 Classical Languages, 9 Theology) still render in the Constellation — present but unlit (§9.1) | `src/lib/capability-universe-v2.ts`, `topology.ts` |
| D10 | *(not recovered)* | — |
| D11 | Families can author custom threads; family-specific, stored in Postgres, never in the Sanity canon | types file |
| D12 | Domains are append-only: never removed, merged, split, or renamed; deprecated in place | `capabilityDomain.ts`, types file |

## §7 — Regulatory layer (partial)

- **§7.1** — Regulatory mappings attach at the **atomic** level only. Thread-level `curriculumCodes` are deprecated v1 leftovers retained for transition.
- **§7.2** — The framework registry (§3.9) is centrally authored. Fourteen framework keys ship in v2: the eight AC v9 state/territory variants, five US frameworks, and `none`. Report generation rolls atomic-level mappings up to the framework's `reportTier` (`cd_level` / `learning_area` / `standard` / `outcome`), weighting by `contribution` and `evidenceWeight`.
- The rest of §7 (report formats, evidence-requirement schemas per framework) is not recovered; the Sanity schema keeps both as opaque JSON.

## §9 — Constellation rendering (partial)

- **§9.1** — All 15 domains render in the Constellation regardless of population. Domains with no v1 successor threads (7, 9) render present-but-unlit (D9); opt-in domains (9) render available-but-unlit for families that haven't opted in. `ConstellationRegion` (§3.2) reserves stable polar placement per domain so future admissions don't reshuffle the sky. Colour assignment is deferred design: each domain currently reuses an existing `--color-domain-*` token (see `src/lib/capability-universe-v2.ts`).
- The rest of §9 is not recovered.

## §11 — Versioning and migration (partial)

- **§11.4** — `legacyV1Id` on threads preserves the v1 thread id so observations re-tag automatically on library upgrade. Observations that cannot be re-tagged are carried as legacy; both counts land in `FamilyLibraryState.upgradeHistory`.
- The rest of §11 is not recovered.

## Known divergences between spec-as-cited and shipped code

1. **Badge Sanity schema is still v1** — see §3.8. The v2 Badge type is defined but not yet schema-migrated.
2. **`canonStatus` vs `status`** on `capabilityThread` — deliberate rename to avoid collision with workflow status (documented in the schema).
3. **`authoredBy` omitted** from the `capabilityDomain` Sanity schema per the blessed schema artifact, though §3.2 lists it.
4. **Legacy v1 fields retained** on `capabilityThread` (inline `dlos`, thread-level `prerequisites`/`enables`/`curriculumCodes`) pending the data-pipeline workstream collapsing DLOs onto standalone `discreteLearningObjective` documents.
5. **DLO layer coexistence** — the live product still reads the v1-style 3-tier DLO scheme (57 threads, 171 DLOs per `CLAUDE.md`); the v2 strand/atomic substrate is seeded structurally but largely unpopulated (`isPopulatedInThisVersion: false` across migrated threads).
