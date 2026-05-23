<!-- Version: 1 | Date: 2026-05-09 | Changes: Initial draft of Capability Universe v2 architecture spec. Supersedes hearth-capability-thread-library.md (v1) and hearth-capabilities-connector-architecture.md as the architectural authority for the capability substrate. Establishes atomised internal hierarchy, 15-domain structure across 6 super-domains, four-type prerequisite graph, regulatory mapping as metadata, stage-tier badges, three-zone constellation visualisation, and append-only versioning protection. -->

# Hearth Capability Universe v2 — Architecture Specification

> **Version:** 1
> **Date:** 9 May 2026
> **Status:** Authoritative architectural specification for the capability substrate
> **Authored in:** Opus project chat (architecture and pedagogical judgement work)
> **Implementation venue:** Library content authoring is a separate phased project. Schema implementation is a Claude Code task that follows this spec.
> **Supersedes:** `hearth-capability-thread-library.md` (v1) and the structural sections of `hearth-capabilities-connector-architecture.md`. The connector architecture's five-layer model (Achievement Standard → Thread → Badge → DLO → Moment) is restated and refined here as the Universe's atomised hierarchy.
> **Companions:** `hearth-pedagogy-knowledge-base-architecture-v1.md` (lens overlay layer, unchanged), `hearth-jumpstart-classical-pack-plan-v2.md` (first content load that consumes Universe v2), `hearth-data-architecture-overview-v1.md` (where Universe content lives in Sanity vs PostgreSQL).

---

## 0. Reading guide

This is a long document because the Universe is the load-bearing substrate beneath everything Hearth does — every observation logged, every badge awarded, every report generated, every constellation rendered, every recommendation surfaced, every long-term capability portfolio that one day talks to a university admissions office reads from this layer. The document is structured so you can read it sequentially as a complete argument, or land on a specific section as a reference.

§1 fixes the architectural premise — the decisions taken in discourse before this spec was written.

§2 defines the domain structure: what the sky looks like, why it has the regions it does, and what's deliberately absent.

§3 is the data model. TypeScript interfaces for every object the Universe contains. This section is the contract between the architecture and the schema implementation.

§4 and §5 are authoring rules — how strands get drafted, how atomic capabilities are calibrated, what makes an indicator observable. The library content team reads these closely.

§6 specifies the prerequisite graph and how unlock logic, ghost-thread surfacing, and visualised edges relate.

§7 specifies regulatory mapping — how the Universe talks to AC v9, US Common Core, NGSS, and per-state homeschool frameworks without those frameworks contaminating the substrate.

§8 specifies the stage-tier badge model.

§9 is the visualisation contract: what the renderer needs from the data model, and what the data model commits to providing. The three-zone Constellation structure is specified here.

§10 is the Our Story surface contract — how atomic structure narrates without overwhelming the parent.

§11 is the migration plan from the v1 thread library to v2. What re-tags, what doesn't, what breaks.

§12 specifies library versioning — how v3, v4, v5 are admitted without breaking v2 families.

§13 is the authoring workflow: who drafts what, what gets quality-gated, what phases the library content build takes.

§14 surfaces the open authoring questions that need decisions during the actual content build that follows this spec.

---

## 1. Decisions baseline

The following decisions are taken as architectural premises for this spec. They were settled in discourse and are not re-opened here. Each one is referenced where relevant in later sections.

**D1. Substrate / mapping / lens separation.** The Universe is the substrate of what learning is. Regulatory frameworks (AC v9, Common Core, NGSS, state-specific homeschool requirements) are *mappings* applied as metadata to substrate objects — they do not shape the substrate's structure. Pedagogy lenses are runtime overlays that change how substrate content is presented to a given family without altering what is tracked.

**D2. Centrally authored, versioned canon.** The Universe is authored centrally by Hearth's content team, not by parents at the thread or atomic level. Custom family threads remain available for genuinely niche capabilities; they render distinctly in the Constellation and never enter the canon. The canonical Universe carries a library version number; new versions are released with explicit migration semantics.

**D3. Append-only after publication.** Once a strand or atomic capability is published as part of a library version, its identity and structure cannot change. Indicators can be added; nothing can be removed or restructured. This protects the integrity of historical observation evidence across library versions. Restructuring requires deprecation in place plus replacement, never silent edit.

**D4. Stage-band internal hierarchy.** Threads carry four stage-bands — Foundational, Intermediate, Advanced, Tertiary — with stage-band-specific strands and atomic capabilities. All threads carry all four stage-bands from v2 forward, even when empty. Tertiary stage-bands are commonly empty in v2 and fill in as content develops.

**D5. Atomic grain finer than HEU.** The substrate registers atomic capabilities at a grain finer than any state regulator's content descriptor. AC v9's two-digit number partitioning CD decomposes into six or more atomic capabilities in the Universe. Regulator CDs are computed at read time by rolling up atomic evidence. The grain we capture exceeds the grain we report.

**D6. Prerequisite edges attach at stage-band-to-stage-band and atomic-to-atomic only.** Edges across these two layers are first-class for unlock logic. The visualisation renders only thread-to-thread edges, computed as the union of underlying stage-band and atomic edges. Cross-domain edges are first-class.

**D7. Four edge types.** Foundational (hard prerequisite), concurrent (develops alongside), alternative (one of several entry points), enrichment (deepens an existing capability without unlocking new ones).

**D8. Stage-tier badges.** Badges are scoped to a thread's stage-band, not the thread overall. "Number Navigator (Foundational)" and "Number Navigator (Intermediate)" are distinct badges with their own atomic-capability criteria. This produces more badges across a child's life, each one specific and meaningful.

**D9. Three-zone Constellation.** Threads render in one of three visual zones — regulated (current region's framework maps), canonical extended (universally educationally recognised but outside the family's home framework), tradition-specific (Latin, theology, classical rhetoric, trades atoms). All canonical threads render always; brightness is observation-driven, not pedagogy-driven, not framework-driven, not discovery-mode-driven.

**D10. Atomic structure surfaces in Constellation and Our Story only.** Logger, Module Builder, Module Experience, Weekly Planner, Marketplace, Family Settings, HEU Report, Dashboard read rolled-up data only. The atomic layer is the engine; parent-facing surfaces present rolled-up information except where the parent is explicitly drilling down to see structure.

**D11. Custom threads remain.** Family-authored custom threads continue to be supported (existing v1 capability) but render distinctly outside the canonical zones, do not participate in cross-family analytics, and do not contribute to regulator rollups even when the parent attempts mapping.

**D12. Append-only also at the domain layer.** Domains in v2 cannot be removed or restructured in later library versions. New domains can be admitted (welding-era Industrial Trades in v3); existing ones cannot be merged, split, or renamed. Sub-domain structure inside a domain (via strands) can grow but not collapse.

---

## 2. Domain architecture

### 2.1 The fifteen domains

Universe v2 ships with fifteen canonical domains organised under six super-domains. The super-domain structure is a navigational and visual organising principle; domains are the addressable unit of capability identity. Threads belong to exactly one domain. Atomic capabilities inherit their domain from their thread.

| # | Domain | Super-domain | Origin |
|---|--------|--------------|--------|
| 1 | Language & Literacy | Foundations | v1 (refined) |
| 2 | Mathematical Thinking | Foundations | v1 (refined) |
| 3 | Scientific Thinking | Foundations | v1 (refined) |
| 4 | Technological Fluency | Foundations | v2 new |
| 5 | Historical, Civic & Geographic Understanding | Cultural Inheritance | v1 H1, H3 (consolidated and broadened) |
| 6 | Literary & Narrative Tradition | Cultural Inheritance | v1 L9, C1 (extracted and elevated) |
| 7 | Classical Languages | Classical Disciplines | v2 new |
| 8 | Logic & Rhetoric | Classical Disciplines | v2 new |
| 9 | Theology & Scriptural Literacy | Classical Disciplines | v2 new |
| 10 | Visual & Plastic Arts | Aesthetic Expression | v1 C5 (broadened) |
| 11 | Musical & Performative Arts | Aesthetic Expression | v1 C3, C4 (consolidated and broadened) |
| 12 | Practical Mastery | Practical & Vocational | v2 new |
| 13 | Personal & Ethical Formation | Human Formation | v1 EF + part of PS (consolidated) |
| 14 | Social & Relational Formation | Human Formation | v1 part of PS (extracted and elevated) |
| 15 | Physical & Embodied Capability | Human Formation | v1 P (refined) |

The Practical & Vocational super-domain has only one domain in v2 (Practical Mastery). Industrial & Technical Trades, Agricultural & Land-based Trades, and similar vocational domains are deliberately reserved as future v3+ admissions, populated when packs that justify them ship.

### 2.2 Domain-by-domain rationale

#### Foundations

**1. Language & Literacy.** The capabilities of a fluent reader, listener, writer, and speaker — phonological awareness, decoding, fluency, comprehension, written expression, oral expression, grammar and conventions, spelling, vocabulary. This domain holds modern-language literacy. Classical languages live in domain 7. Literary engagement (the experience of literature as art and tradition) lives in domain 6.

**2. Mathematical Thinking.** Number sense, place value, operations, fractions, decimals, ratio, proportion, algebraic thinking, geometric reasoning, measurement, statistics, probability, mathematical proof. Stage-bands extend through tertiary calculus, linear algebra, and discrete mathematics.

**3. Scientific Thinking.** Observation, classification, experimentation, hypothesis, the scientific method, biological systems, physical systems, earth systems, chemistry, scientific communication. Distinct from technological fluency — science is about understanding, technology is about making.

**4. Technological Fluency (v2 new).** Computational thinking, digital literacy, coding, engineering design thinking, system design, computer hardware understanding, data literacy at the algorithmic level. Stage-bands extend through tertiary software architecture and engineering disciplines. This domain was not present in v1; it was distributed awkwardly across other domains. v2 admits it explicitly because the modern world requires it and AC v9 increasingly recognises it.

#### Cultural Inheritance

**5. Historical, Civic & Geographic Understanding.** Chronological thinking, the long story of human history, civic and political life, geographic reasoning, place understanding, current events, and ethics-in-history (justice, tyranny, suffering, redemption). v1 split history (H1) and geography (H3) into separate threads under one humanities domain; v2 keeps them under one domain because in practice they are studied together — geography is where history happens.

**6. Literary & Narrative Tradition (v2 new domain identity).** The reader's relationship with great literature, the storytelling tradition, narrative form, literary criticism, the canon (variously defined), and the writer's apprenticeship to the tradition. v1 had this as threads inside Language & Literacy (L9) and Creative Expression (C1). v2 elevates it because classical and Charlotte Mason families place enormous weight on this — a child's engagement with *The Iliad*, *The Hobbit*, or *To Kill a Mockingbird* is not the same kind of thing as their decoding fluency, and the Constellation should reflect that.

#### Classical Disciplines

**7. Classical Languages (v2 new).** Latin, Greek, Hebrew, and the broader practice of engaging with languages whose primary purpose for the learner is access to historic textual traditions rather than contemporary communication. Strands include vocabulary and etymology, morphology and grammar, reading classical texts in original, translation practice, and language-as-discipline (the formative effect of studying an inflected language). Each language is its own strand — Latin is not a sub-domain, it is a strand within this domain. This decision keeps the domain count manageable and reflects the truth that the *capability* of "engaging a classical language seriously" is more similar across Latin/Greek/Hebrew than the surface differences suggest.

**8. Logic & Rhetoric (v2 new).** Formal logic (syllogisms, fallacies, propositional and predicate logic at higher stages), informal reasoning, dialectic and argumentation, rhetorical forms and figures, persuasive composition, oratory. The classical Trivium's logic and rhetoric stages live here. Stage-bands extend through tertiary mathematical logic and formal philosophy.

**9. Theology & Scriptural Literacy (v2 new).** Engagement with sacred texts (the Bible primarily for Christian families, but the domain accommodates Hebrew Scripture engagement, Quranic literacy, and other traditions), doctrinal understanding, catechesis, ethical reasoning grounded in religious tradition, the history of religious thought. This domain is opt-in at the family level — families that select a non-religious worldview at onboarding see this domain in the Constellation as available but unlit, and packs that touch it can be filtered out of recommendations. The domain is not religion-specific in its structure; threads inside it are tradition-specific (a "Christian Scriptural Literacy" thread, a "Jewish Textual Tradition" thread). Hearth's editorial position on Christianity in the public square is implemented through which threads are seeded in v2, not through whether the domain exists.

#### Aesthetic Expression

**10. Visual & Plastic Arts.** Drawing, painting, sculpture, printmaking, photography, design, architectural appreciation, visual art history, picture study, art criticism. v1 had this as C5 (Visual Expression & Design); v2 expands the scope and elevates it to its own domain.

**11. Musical & Performative Arts.** Music (singing, instrumental performance, music theory, music appreciation, composition), drama and theatre, dance, recitation, oral storytelling, hymnody. v1 split music (C4) and the broader creative expression including narrative (C1); v2 consolidates the performative arts under one domain because the *capability* of presenting an embodied artistic performance has shared substrate across musical, dramatic, and dance forms.

#### Practical & Vocational

**12. Practical Mastery.** Handwork (knitting, sewing, weaving, woodwork at hobby-grade), domestic arts (cooking, baking, food preservation, household management), gardening and small-scale food growing, basic repair and maintenance, tool use and care, traditional crafts. v1 had no dedicated domain for this; activities of this kind were distributed across other domains awkwardly or not registered at all. v2 admits Practical Mastery as a first-class domain because Charlotte Mason, Waldorf, Montessori, and Christian classical traditions all weight this heavily, and the modern educational mainstream undervalues it.

The Practical & Vocational super-domain has space reserved for future trades-grade vocational domains (welding, electrical, plumbing, carpentry, automotive, agriculture). These are not in v2; they are admitted in v3+ when packs that justify them ship. The architectural shape of those future domains follows the same model — they sit in this super-domain alongside Practical Mastery rather than nesting inside it, because trade-grade welding and hobby-grade handwork are genuinely different capability tiers despite sharing some substrate.

#### Human Formation

**13. Personal & Ethical Formation.** The inner formation of the learner — sustained attention, working memory, self-regulation, persistence, will, the formation of virtues (courage, temperance, honesty, humility, generosity), self-knowledge, moral reasoning at the personal level, conscience, vocational awareness. Consolidates v1's Executive Function (EF) and the personal-self portion of v1's Personal-Social (PS).

**14. Social & Relational Formation.** Cooperation and collaboration, communication-as-relation (distinct from communication-as-craft, which lives in Language & Literacy), conflict resolution, empathy and perspective-taking, friendship and peer relations, family belonging, community participation, hospitality. Extracted from v1's PS and elevated. The most common stereotype critique of homeschooling is that it neglects social development; this domain addresses that critique architecturally by making social formation visible and trackable.

**15. Physical & Embodied Capability.** Health and bodily knowledge, fundamental movement, sport and athletic capability, outdoor capability and bushcraft, embodied awareness (proprioception, balance, breath), physical courage and risk competence, manual dexterity at the body level (distinct from tool-specific manual dexterity which lives in Practical Mastery). Refines v1's P domain.

### 2.3 What's deliberately absent

Several domains were considered and rejected for v2:

- **First Nations / Indigenous Studies as a standalone domain.** First Nations perspectives are intentionally distributed across domains 5 (history, civics, geography), 6 (oral tradition, narrative), 9 (cosmology and theology where families opt in), and 11 (music, dance, performance). Creating a standalone domain risks tokenism. The distributed approach reflects how First Nations knowledge is actually encountered in homeschool curricula — embedded across subject areas — and aligns with v1's H6 thread. The same logic applies to Native American perspectives in future US expansion.

- **A "21st Century Skills" domain.** Critical thinking lives in Logic & Rhetoric. Communication lives in Language & Literacy and Social & Relational Formation. Collaboration lives in Social & Relational Formation. Creativity is distributed across Aesthetic Expression and Personal & Ethical Formation. Bundling them as a standalone domain would duplicate substrate and add no clarity.

- **A separate "Health" or "Nutrition" domain.** Health knowledge lives in Physical & Embodied Capability. Cooking lives in Practical Mastery. Nutritional thinking is mostly Scientific Thinking with applications in both. Standalone Health would be thin.

- **A "Self-directed Learning" or "Metacognition" domain.** These capabilities live in Personal & Ethical Formation (attention, will, self-knowledge) with strong links to Logic & Rhetoric (reasoning about one's own reasoning).

- **An "Entrepreneurship" or "Financial Literacy" domain.** Financial literacy is a strand inside Mathematical Thinking. Entrepreneurial capability decomposes into threads across Practical Mastery (making), Social & Relational Formation (selling and serving), Mathematical Thinking (numbers), and Personal & Ethical Formation (initiative, persistence). Standalone domains for these would fragment substrate that belongs together.

### 2.4 Super-domain structure

Six super-domains, with the domains they contain:

```
Foundations
├── 1. Language & Literacy
├── 2. Mathematical Thinking
├── 3. Scientific Thinking
└── 4. Technological Fluency

Cultural Inheritance
├── 5. Historical, Civic & Geographic Understanding
└── 6. Literary & Narrative Tradition

Classical Disciplines
├── 7. Classical Languages
├── 8. Logic & Rhetoric
└── 9. Theology & Scriptural Literacy

Aesthetic Expression
├── 10. Visual & Plastic Arts
└── 11. Musical & Performative Arts

Practical & Vocational
└── 12. Practical Mastery
    [reserved space for v3+ trades-grade vocational domains]

Human Formation
├── 13. Personal & Ethical Formation
├── 14. Social & Relational Formation
└── 15. Physical & Embodied Capability
```

Super-domains are visual and navigational. They do not carry their own data — they are derived from the `superDomain` field on each domain. Super-domain naming and grouping can be revised in later library versions without breaking observation evidence (D12 protects domains, not super-domains).

---

## 3. Data model

This section is the contract between this architecture and the schema implementation. Every object in the Universe is specified here as a TypeScript interface. Sanity schemas mirror these interfaces with appropriate field types; PostgreSQL tables for user-specific state mirror these interfaces with foreign keys.

### 3.1 Core types

```typescript
type LibraryVersion = string; // semver, e.g. "2.0.0"

type StageBandKey = 'foundational' | 'intermediate' | 'advanced' | 'tertiary';

type SuperDomainKey =
  | 'foundations'
  | 'cultural-inheritance'
  | 'classical-disciplines'
  | 'aesthetic-expression'
  | 'practical-vocational'
  | 'human-formation';

type EdgeType = 'foundational' | 'concurrent' | 'alternative' | 'enrichment';

type ObservationTier = 'emerging' | 'developing' | 'demonstrating';

type EvidenceConfidence = 'suggested' | 'confirmed' | 'parent-asserted';
```

### 3.2 Domain

```typescript
interface Domain {
  // Identity
  id: string;                       // stable slug, e.g. "language-literacy"
  numericId: number;                // 1–15 in v2, append-only allocated thereafter
  name: string;                     // "Language & Literacy"
  shortName: string;                // "Language" (for tight UI)
  superDomain: SuperDomainKey;

  // Authoring metadata
  introducedInVersion: LibraryVersion;
  authoredBy: string;               // Hearth content team identifier
  status: 'active' | 'deprecated';  // never deleted (D12)
  deprecationReplacement?: string;  // domain id this is replaced by, if deprecated

  // Editorial content
  summary: string;                  // 2–3 sentence plain-language description
  whatItIsNot: string;              // explicit boundary statements ("X lives elsewhere")
  exampleObservations: string[];    // 3–5 concrete observation examples

  // Visual
  iconKey: string;                  // emoji placeholder until icon system finalised
  colourToken: string;              // design system token (no hardcoded values)
  constellationRegion: ConstellationRegion;
}

interface ConstellationRegion {
  // Polar-coordinate placement on the constellation sky
  // Allows v3+ domains to be admitted without reshuffling existing layouts
  angularStart: number;   // degrees
  angularEnd: number;
  radialMin: number;      // 0–1 normalised
  radialMax: number;
}
```

### 3.3 Thread

```typescript
interface Thread {
  // Identity
  id: string;                       // e.g. "number-sense-place-value"
  domainId: string;                 // foreign key to Domain
  name: string;                     // "Number Sense & Place Value"
  shortName: string;
  legacyV1Id?: string;              // for migration mapping (e.g. "M1")

  // Authoring metadata
  introducedInVersion: LibraryVersion;
  status: 'active' | 'deprecated';
  deprecationReplacement?: string;

  // Editorial content
  summary: string;                  // 1 paragraph
  longDescription: string;          // richText, multi-paragraph
  whatItLooksLike: string[];        // 5–8 concrete examples across stage-bands

  // Structural
  stageBands: ThreadStageBand[];    // exactly 4 entries: foundational/intermediate/advanced/tertiary
  prerequisites: PrerequisiteEdge[];
  enables: PrerequisiteEdge[];      // inverse view, denormalised for query efficiency

  // Regulatory mappings live at stage-band, strand, and atomic levels — not on the thread itself
  // Pedagogy affinity tags live at the thread level for read-time lens overlay
  pedagogyAffinities: PedagogyAffinity[];

  // Visual
  iconKey: string;
  colourToken: string;
}

interface ThreadStageBand {
  key: StageBandKey;
  isPopulatedInThisVersion: boolean;
  approximateAgeBand?: { min: number; max: number };  // soft hint, not enforced
  summary: string;                  // 1–2 sentences specific to this stage-band
  strands: Strand[];
  badges: string[];                 // foreign keys to Badge ids — one per stage-band typical
  prerequisites: PrerequisiteEdge[]; // stage-band-to-stage-band edges (D6)
}

interface PedagogyAffinity {
  pedagogyKey: string;              // 'charlotte-mason' | 'classical' | 'montessori' | 'waldorf' | 'unschooling' | 'eclectic'
  weight: 'high' | 'moderate' | 'low' | 'neutral';
  rationale?: string;               // editorial note for read-time lens overlay
}
```

### 3.4 Strand

```typescript
interface Strand {
  // Identity
  id: string;                       // e.g. "partitioning-numbers"
  threadId: string;
  stageBand: StageBandKey;
  name: string;                     // "Partitioning Numbers"

  // Authoring metadata
  introducedInVersion: LibraryVersion;
  status: 'active' | 'deprecated';  // append-only after publication (D3)
  publishedInVersion?: LibraryVersion;  // once set, the strand cannot be restructured

  // Editorial content
  summary: string;
  whatItDevelops: string;           // 1 paragraph: what cognitive or practical capability this strand cultivates

  // Structural
  atomicCapabilities: AtomicCapability[];
  ordering: 'sequential' | 'parallel' | 'flexible';
  // sequential: atoms must be acquired in order
  // parallel: atoms develop alongside each other
  // flexible: atoms have soft sequencing but can be acquired in any order
}
```

### 3.5 Atomic capability

```typescript
interface AtomicCapability {
  // Identity
  id: string;                       // e.g. "partition-two-digit-canonical"
  strandId: string;
  threadId: string;                 // denormalised for query efficiency
  domainId: string;                 // denormalised
  stageBand: StageBandKey;          // denormalised
  name: string;                     // "Partition two-digit numbers into tens and ones"
  shortName: string;                // for compact UI

  // Authoring metadata
  introducedInVersion: LibraryVersion;
  status: 'active' | 'deprecated';
  publishedInVersion?: LibraryVersion;

  // Editorial content
  description: string;              // 1–2 sentences in plain language
  whyItMatters: string;             // 1 paragraph editorial — why this is a meaningful step
  observableInContext: string;      // "Looks like: 'I have 47, that's 4 tens and 7 ones.'"

  // Indicators — what counts as evidence at each tier
  indicators: AtomicIndicator[];

  // Structural relationships
  prerequisites: PrerequisiteEdge[];  // atomic-to-atomic edges (D6)

  // Regulatory mappings live here — atoms are the rollup source for CDs (§7)
  regulatoryMappings: RegulatoryMapping[];

  // Authoring guidance for content creators using this atom
  facilitationHints: string[];      // for module authors writing activities targeting this atom
}

interface AtomicIndicator {
  id: string;                       // e.g. "partition-two-digit-canonical-emerging-1"
  tier: ObservationTier;
  text: string;                     // "Says 'four tens and seven ones' when shown 47 and prompted"
  observabilityNotes?: string;      // guidance for parents on what counts
  introducedInVersion: LibraryVersion;
  // Indicators can be added but not removed (D3); deprecated indicators are flagged but remain
}
```

### 3.6 Prerequisite edge

```typescript
interface PrerequisiteEdge {
  // Identity
  id: string;
  edgeType: EdgeType;               // foundational | concurrent | alternative | enrichment

  // Endpoints — exactly one of these pairs must be populated
  // (D6: edges attach at stage-band or atomic level)

  // Stage-band-to-stage-band variant
  fromThreadId?: string;
  fromStageBand?: StageBandKey;
  toThreadId?: string;
  toStageBand?: StageBandKey;

  // Atomic-to-atomic variant
  fromAtomicId?: string;
  toAtomicId?: string;

  // Edge metadata
  rationale: string;                // editorial — why this prerequisite exists
  strength: 'hard' | 'soft';
  // hard: target is locked in unlock logic until source is reached
  // soft: target appears as ghost thread, surfaces in discovery, but is not locked

  introducedInVersion: LibraryVersion;
  status: 'active' | 'deprecated';
}
```

The four edge types operationalise as:

| Edge type | Semantics | Visualisation default |
|-----------|-----------|-----------------------|
| **foundational** | Source must reach a defined evidence threshold before target unlocks. Hard edge. | Solid line, primary weight |
| **concurrent** | Source and target develop alongside each other. Neither locks the other. Soft edge. | Dashed line, secondary weight |
| **alternative** | Source is one of multiple acceptable entry points to target. Any one alternative satisfies the prerequisite. | Branching dotted line |
| **enrichment** | Source deepens target without unlocking new structure. Optional. | Dotted line, light weight |

### 3.7 Regulatory mapping

```typescript
interface RegulatoryMapping {
  // Which framework
  frameworkKey: RegulatoryFrameworkKey;
  frameworkVersion: string;         // e.g. "AC v9.0", "Common Core 2010"

  // What it maps to in that framework
  codes: string[];                  // e.g. ["AC9M2N04", "AC9M2N05"]
  reportTier?: 'cd_level' | 'learning_area' | 'standard' | 'outcome';
  // For AC v9: cd_level (QLD/SA/NT) reports at content descriptor; learning_area (NSW/VIC/WA/TAS/ACT) at learning area
  // For US Common Core: standard or domain
  // Different frameworks use different rollup tiers

  // Strength of the mapping
  contribution: 'primary' | 'partial' | 'incidental';
  // primary: this atomic capability is centrally what the CD asks for
  // partial: this atomic capability satisfies one component of the CD
  // incidental: an observation evidencing this atom may also touch the CD opportunistically

  // Evidence sufficiency for rollup (§7.4)
  evidenceWeight: number;           // 0.0–1.0; how much one demonstrating-tier observation contributes to CD coverage
  // Default: 1.0 for primary, 0.5 for partial, 0.2 for incidental — content team can override
}

type RegulatoryFrameworkKey =
  | 'ac-v9-qld' | 'ac-v9-nsw' | 'ac-v9-vic' | 'ac-v9-wa' | 'ac-v9-sa' | 'ac-v9-tas' | 'ac-v9-act' | 'ac-v9-nt'
  | 'us-common-core' | 'us-ngss'
  | 'us-tx-homeschool' | 'us-pa-homeschool-portfolio' | 'us-ca-homeschool'
  // ... extended per-state US frameworks ...
  | 'none';
```

### 3.8 Badge

```typescript
interface Badge {
  // Identity
  id: string;                       // e.g. "number-navigator-foundational"
  name: string;                     // "Number Navigator (Foundational)"
  shortName: string;                // "Number Navigator"
  threadId: string;
  stageBand: StageBandKey;          // (D8) badges are stage-tier scoped

  // Authoring metadata
  introducedInVersion: LibraryVersion;
  status: 'active' | 'deprecated';

  // Editorial content
  description: string;
  whatItRecognises: string;         // 1 paragraph: what the child has formed when they earn this
  parentNarrative: string;          // suggested phrasing the parent might use to celebrate

  // Criteria — atomic capabilities that must show evidence at minimum tier
  criteria: BadgeCriterion[];
  criteriaPolicy: 'all' | 'threshold';
  thresholdCount?: number;          // if 'threshold', how many criteria must be met

  // Prerequisites
  prerequisiteBadges: string[];     // earlier-stage-band badges typically required

  // Visual
  iconKey: string;
  colourToken: string;
}

interface BadgeCriterion {
  atomicCapabilityId: string;
  minimumTier: ObservationTier;     // typically 'developing' or 'demonstrating'
  weight: number;                   // for threshold policy
}
```

### 3.9 Observation (PostgreSQL — user-specific)

The observation model is largely unchanged from v1's connector architecture, but the link structure is enriched to support atomic-level evidence.

```typescript
interface Observation {
  // Identity
  id: string;
  familyId: string;
  learnerId: string;
  timestamp: string;                // ISO 8601

  // Source
  source: 'retrospective_log' | 'module_completion' | 'quick_capture' | 'badge_assessment';
  sourceId: string;                 // links back to log entry, module chunk, etc.

  // Content
  title: string;                    // auto-generated or parent-edited
  description: string;              // parent's full description
  evidence: EvidenceArtifact[];

  // Capability links — enriched in v2
  threadLinks: ThreadObservationLink[];

  // Computed metadata
  capturedLibraryVersion: LibraryVersion;  // which library version was active at capture
  // Important: when library updates, existing observations retain their original library version
  // for replay accuracy. Migration logic (§11) handles upgrade paths.
}

interface ThreadObservationLink {
  threadId: string;
  stageBand: StageBandKey;          // which stage-band this observation evidences
  tierAtTime: ObservationTier;      // emerging | developing | demonstrating
  confidence: EvidenceConfidence;   // suggested | confirmed | parent-asserted

  // v2 enrichment: which atomic capabilities does this observation evidence?
  atomicLinks: AtomicObservationLink[];
}

interface AtomicObservationLink {
  atomicCapabilityId: string;
  tierAtTime: ObservationTier;
  indicatorIds: string[];           // which specific indicators this observation satisfied
  confidence: EvidenceConfidence;
}

interface EvidenceArtifact {
  type: 'photo' | 'audio' | 'video' | 'document' | 'text';
  uri?: string;
  text?: string;
  caption?: string;
}
```

### 3.10 Custom thread (PostgreSQL — family-specific)

Custom threads remain available per D11. Their structure mirrors the canonical Thread but with reduced fields and explicit non-canonical flagging.

```typescript
interface CustomThread {
  id: string;                       // family-prefixed: "custom-{familyId}-{slug}"
  familyId: string;
  createdByUserId: string;
  name: string;
  summary: string;

  // Custom threads do not have stage-bands, strands, or atomic capabilities
  // They are flat — observations link directly to the custom thread
  // Tier indicators are family-defined plain-text
  tierIndicators: {
    emerging: string[];
    developing: string[];
    demonstrating: string[];
  };

  // No regulatory mappings, no badges, no canonical authoring metadata
  isCustom: true;
  domainAffinity?: string;          // optional hint for visual placement near a related canonical domain
}
```

### 3.11 Family library version state (PostgreSQL)

```typescript
interface FamilyLibraryState {
  familyId: string;
  currentLibraryVersion: LibraryVersion;
  // The version against which the family's Constellation renders and against which new observations are tagged
  // Migration to a new library version is a discrete event with explicit migration logic (§11)

  pinnedAtVersion?: LibraryVersion;
  // Some families may pin to an older version to avoid disruption mid-HEU-cycle
  // If unpinned, family auto-upgrades to current canonical version

  upgradeHistory: LibraryUpgradeEvent[];
}

interface LibraryUpgradeEvent {
  fromVersion: LibraryVersion;
  toVersion: LibraryVersion;
  upgradedAt: string;
  observationsRetagged: number;
  observationsCarriedAsLegacy: number;
  notes: string[];
}
```

### 3.12 Where each object lives

| Object | Storage | Authoring source | Read frequency |
|--------|---------|------------------|----------------|
| Domain | Sanity CMS | Hearth content team (Opus-authored) | Read every Constellation render |
| Thread | Sanity CMS | Hearth content team | Read every Constellation render, every Logger save |
| Strand | Sanity CMS | Hearth content team | Read on Constellation deep zoom, Our Story narrative compose |
| AtomicCapability | Sanity CMS | Hearth content team (high-volume; some delegated to Sonnet with Opus QA) | Read on Logger AI insight generation, Constellation atomic zoom, badge threshold evaluation |
| AtomicIndicator | Sanity CMS | Hearth content team | Read on observation tier assessment |
| PrerequisiteEdge | Sanity CMS | Hearth content team (cross-domain edges Opus-authored) | Read on ghost thread surfacing, unlock logic |
| RegulatoryMapping | Sanity CMS | Hearth content team (AC v9 codes Opus-mapped from AC documents) | Read on HEU report generation, evidence rollup |
| Badge | Sanity CMS | Hearth content team | Read on Constellation render, badge threshold detection |
| Observation | PostgreSQL | Generated at write-time from Logger or module completion | Read on Constellation render, Portfolio render, Our Story render, HEU report |
| CustomThread | PostgreSQL | Family-authored | Read on Constellation render |
| FamilyLibraryState | PostgreSQL | System-managed with explicit upgrade events | Read every Universe-touching operation |

---

## 4. Strand authoring rules

Strands are the organisational layer between a thread's stage-band and its atomic capabilities. A well-authored strand is a small set of related atomic capabilities that develop together and form a coherent capability cluster. A poorly authored strand either bundles unrelated atoms (incoherence) or fragments a coherent cluster across multiple strands (over-splitting).

### 4.1 What makes a strand coherent

A strand is coherent when the following hold:

- **Single capability cluster.** All atomic capabilities in the strand develop the same underlying capability. Partitioning is one capability cluster; comparing magnitudes is another. They both belong in Foundational Number Sense as separate strands, not jammed together.

- **Common observational context.** The atoms in a strand are likely to be observed in similar real-world activities. A baking activity is likely to evidence multiple atoms in the Measurement Sense strand simultaneously. If the atoms in a strand never appear together, the strand is probably miscut.

- **Shared facilitation pattern.** A parent supporting their child through a strand uses similar prompts, similar materials, similar attention. If the facilitation pattern shifts between atoms in the same strand, the strand should probably split.

- **Internal sequencing is coherent.** If the strand is `sequential`, the atoms have a clear order. If `parallel`, the atoms truly develop in parallel without ordering. If `flexible`, ordering is loose. The author must assert one of these and be able to defend it.

### 4.2 When to split a strand

Split when:

- The strand has more than approximately seven atomic capabilities at a single stage-band. Strands of eight or more become unreadable in the Constellation atomic zoom and unwieldy for badge criteria.
- Two distinct capability clusters have been bundled. Look for atoms that "feel different" — you'd describe them with different verbs to a parent.
- A pack you're authoring needs to reference half the atoms in a strand but not the other half. This is a strong signal the strand is over-broad.
- The pedagogy affinity weighting differs across atoms — if Charlotte Mason heavily weights some atoms and barely registers others, the bundling is probably wrong.

### 4.3 When to merge

Merge candidates (during initial v2 authoring only — never after publication, per D3) when:

- A strand has only one atomic capability and shows no plausible expansion path.
- Two strands have the same prerequisite structure and are facilitated identically.
- The capability cluster is genuinely small and a single strand of three or four atoms covers it cleanly.

### 4.4 Naming conventions

Strands are named with a noun phrase that describes the capability cluster, not the activity. "Partitioning Numbers" not "Doing Partitioning Activities." The name should pass this test: a parent should be able to read the strand name and immediately understand what their child is forming, without having to read the description.

Avoid:
- Verbs as strand names ("Partitions Numbers" — sounds like a single skill, not a cluster).
- Pedagogically loaded names ("The Mason Approach to Number Sense" — strands are pedagogy-neutral).
- Year-level references ("Year 2 Number Sense" — strands are stage-banded but not year-specific).
- Jargon without translation ("Cardinal Subitising" — accurate but opaque to most parents).

Prefer:
- Plain capability descriptors ("Comparing Magnitudes", "Reading Aloud with Expression", "Observing Living Things in Their Environment").
- Pre-tested with parents not in education professions for comprehensibility.

### 4.5 Strand-level metadata authoring requirements

Every strand requires:

- **Summary** (1–2 sentences in plain English).
- **What it develops** (1 paragraph editorial — what cognitive or practical capability is being cultivated).
- **Ordering declaration** (sequential / parallel / flexible) with a one-sentence justification.
- **Atomic capabilities** (typically 3–7 per strand at a single stage-band).

### 4.6 Examples (illustrative — actual content authored separately)

**Example 1: Foundational Number Sense — Partitioning Numbers (sequential)**
- Summary: "Breaking numbers apart into smaller numbers, the foundation of arithmetic and place value."
- Develops: Place-value reasoning, the realisation that a number is composed of smaller numbers and can be decomposed in multiple ways.
- Ordering: Sequential (canonical partitioning before non-canonical; within-decade before across-decade).
- Atomic capabilities: ~5

**Example 2: Foundational Reading & Decoding — Phonological Awareness (parallel)**
- Summary: "Hearing the sounds inside words — rhyme, syllable, onset and rime, individual phonemes."
- Develops: The auditory substrate that decoding rests on. Necessary before decoding meaningfully begins.
- Ordering: Parallel (rhyme awareness, syllable counting, phoneme isolation can all develop alongside each other).
- Atomic capabilities: ~6

**Example 3: Foundational Latin — Vocabulary & Etymology (flexible)**
- Summary: "Building a working store of Latin word roots and their English derivatives, recognising kinship between words."
- Develops: The etymological imagination — seeing English as partly Latin, recognising root families.
- Ordering: Flexible (roots can be encountered in any order; what matters is volume and active use).
- Atomic capabilities: ~4 in Foundational, building to ~8 in Intermediate.

---

## 5. Atomic capability authoring rules

The atomic capability is the smallest grain of capability the Universe registers. Authoring at this layer requires precision. Get it wrong and the whole substrate becomes unreliable.

### 5.1 Grain calibration

The right grain for an atomic capability is **the smallest unit that a parent can confidently say their child either does or does not yet do**.

Too coarse: "Understands fractions." A parent has no clean way to assess this. The child does some things and not others. The judgement is fuzzy.

Too fine: "Recognises that the numerator of 3/4 is 3." Parents do not observe in this granularity; the assessment is artificial.

About right: "Identifies 1/2 of a circle, square, and rectangle when shown three of each shape divided into halves." Concrete, observable, binary-ish.

The calibration test: **could a non-expert parent, watching their child engage with the relevant material for ten minutes, give a confident answer to "does my child do this yet?"** If yes, the grain is right. If no, recalibrate.

### 5.2 Indicators

Each atomic capability carries indicators across three observation tiers:

- **Emerging:** the child shows the first signs of this capability in supportive contexts. Often imitative, often supported, often inconsistent. Three indicators minimum.
- **Developing:** the child performs this capability with moderate consistency in familiar contexts, sometimes with light support. Three indicators minimum.
- **Demonstrating:** the child performs this capability independently, consistently, and can transfer it to novel contexts. Three indicators minimum.

Each indicator is a single observable behaviour stated in language a non-expert parent can read and recognise.

### 5.3 Indicator language

Good indicator language has these qualities:

- **Concrete behavioural verb.** "Says" not "understands". "Counts" not "knows". "Writes" not "demonstrates".
- **Observable in context.** A parent reading the indicator should be able to imagine what watching this looks like.
- **Self-contained.** Does not require reading three other indicators to understand.
- **Free of pedagogical jargon.** "Narrates the story back" not "performs oral retelling demonstrating comprehension fidelity".
- **Specific enough to discriminate tiers.** If the same behaviour appears in two tiers verbatim, the indicators are not pulling their weight.

### 5.4 Examples of well-formed atomic capabilities

**Atomic capability:** Partition two-digit numbers into tens and ones (canonical)

- **Emerging:**
  - Says "four tens and seven ones" when shown 47 with explicit place-value support (base-10 blocks visible)
  - Writes 47 as 40 + 7 when prompted
  - Identifies the tens digit in a two-digit number when asked
- **Developing:**
  - Partitions any two-digit number into tens and ones without manipulatives, with occasional prompting
  - Self-corrects when a partition is wrong
  - Explains in own words why 47 is "forty and seven"
- **Demonstrating:**
  - Partitions any two-digit number into tens and ones fluently and independently
  - Uses canonical partitioning to support addition and subtraction strategies
  - Explains place value to a younger child or sibling

**Atomic capability:** Read aloud with expression (Foundational Reading & Decoding)

- **Emerging:**
  - Pauses at full stops and commas in familiar texts
  - Changes voice for character dialogue when prompted to "read it like the character"
  - Reads at a steady pace, not word-by-word, in texts at independent reading level
- **Developing:**
  - Reads expressively without prompting in familiar texts
  - Adjusts volume and pace to match the mood of a passage
  - Maintains expression even when encountering occasional unfamiliar words
- **Demonstrating:**
  - Reads aloud expressively in unfamiliar texts at independent reading level
  - Conveys author's tone through voice (humour, suspense, gravity)
  - Comments on how punctuation and sentence structure shape how a passage should sound

### 5.5 Why-it-matters editorial

Each atomic capability carries a `whyItMatters` paragraph. This is the author's chance to explain in plain English why this specific atomic step is a real and important one in the child's development. The audience is the parent, not the educator. Aim for warmth, accuracy, and the avoidance of jargon.

### 5.6 Facilitation hints

Each atomic capability carries `facilitationHints` — practical suggestions for module authors who want to write activities that target this atom. These are not module instructions; they are guidance for the people who will write module instructions. Examples:

- "Uses base-10 blocks well — physical manipulatives anchor canonical partitioning more reliably than printed worksheets at this stage."
- "Best evidenced in real-world contexts — counting change, measuring ingredients — rather than abstract worksheets."
- "Often emerges first in numbers under 30 and consolidates through 99 over time."

### 5.7 Common failure modes

Authoring failures to guard against:

- **Atoms that are activities in disguise.** "Builds a model bridge using craft materials" is a module activity, not an atomic capability. The capability the activity targets might be "Identifies how triangulation increases structural rigidity" or similar.
- **Atoms that are dispositions, not capabilities.** "Enjoys reading" is a disposition. The capability behind it might be "Reads independently for sustained periods of fifteen minutes or more by choice."
- **Atoms that bundle multiple capabilities.** "Reads, comprehends, and discusses chapter books" is three or four capabilities. Split.
- **Atoms calibrated to one age band.** "Counts to ten" makes sense for Foundational; the atom should not exist at all for Intermediate/Advanced. Authors must check which stage-band an atom truly belongs to.

---

## 6. Prerequisite graph

The prerequisite graph is the structural backbone that determines unlock logic, ghost-thread surfacing, recommendation, and the visual edges in the Constellation.

### 6.1 Edge attachment rules (D6 restated)

Edges attach at exactly one of two layers:

- **Stage-band-to-stage-band:** "Foundational Number Sense → Intermediate Number Sense" or "Foundational Reading & Decoding → Intermediate Number Sense" (cross-thread, even cross-domain).
- **Atomic-to-atomic:** "Partition two-digit numbers (canonical) → Partition two-digit numbers (non-canonical)" within a strand, or "Phoneme isolation → Decoding CVC words" across strands within a thread, or "Reads independently (Foundational L&L) → Reads classical text in translation (Intermediate Logic & Rhetoric)" across domains.

Edges do not attach at thread-to-thread, strand-to-strand, or domain-to-domain. The thread-level edges shown in the visualisation are *computed* as the union of underlying edges — if any stage-band or atomic in Thread A points into Thread B, a thread-level edge exists in the rendered view.

### 6.2 Edge types — operational semantics

| Edge type | Unlock logic | Ghost surfacing | Recommendation logic |
|-----------|--------------|-----------------|----------------------|
| **foundational** | Target locked until source reaches threshold (typically Developing tier or higher) | Source above 50% of threshold → target appears as ghost | Target boosted in recommendations once source reaches Developing |
| **concurrent** | Neither locks the other | Both visible from age-relevant onward | Mutual recommendation lift when one is active |
| **alternative** | Target unlocks when ANY one alternative source reaches threshold | All alternatives surface as ghosts when target is age-relevant | Recommendations diversified across alternatives |
| **enrichment** | No locking effect | No ghost surfacing | Recommendation lift if target thread is highly active and enrichment source is unmet |

### 6.3 Threshold tuning

Thresholds for foundational edges are configurable per edge but default to:

- Stage-band-to-stage-band foundational edge: source stage-band must have ≥50% of its strands at Developing or higher
- Atomic-to-atomic foundational edge: source atom must be at Demonstrating tier with at least two confirmed observations

These defaults exist to give the engine sensible behaviour out of the box. Edge authors can override per edge with rationale.

### 6.4 Cross-domain edges

Cross-domain edges are first-class and central to the Universe's design. Examples that should exist in v2:

- Foundational Reading & Decoding (L&L) → Foundational Latin Vocabulary (Classical Languages) — foundational edge: a child must be reading independently in English before Latin study is meaningful.
- Foundational Phonological Awareness (L&L) → Foundational Reading & Decoding (L&L) — foundational, intra-domain.
- Foundational Number Sense (Maths) → Foundational Measurement (Practical Mastery) — concurrent: developing alongside.
- Foundational Sustained Attention (Personal & Ethical Formation) → Foundational Memory Work (Theology & Scriptural Literacy, Logic & Rhetoric, Literary & Narrative Tradition) — foundational across multiple downstream targets.
- Foundational Workshop Discipline (Personal & Ethical Formation) → [future v3] Welding Foundational (Industrial Trades) — foundational, cross-domain, cross-super-domain.

The cross-domain edge structure is what makes the Universe substantively useful. Without it, the substrate is a set of disconnected silos. With it, the substrate models how human capability actually develops — every domain depending on others, no skill standing alone.

### 6.5 Authoring rules for edges

- **Every edge requires a rationale.** No silent edges. The author writes 1–2 sentences explaining why this prerequisite exists.
- **Strength must be explicit.** Hard edges lock; soft edges only surface as ghosts. Default to soft unless the author can defend hard.
- **Cycles forbidden.** The prerequisite graph is a DAG. If a cycle is detected during authoring, one edge must be downgraded (typically to concurrent or enrichment) or removed.
- **Enrichment edges are optional decoration.** Use them sparingly. They exist for cases where a meaningful relationship exists but neither unlocks nor is unlocked. Most relationships should be one of the other three types.

### 6.6 Visualisation contract for edges

The Constellation renders thread-to-thread edges only. The renderer queries the data model for "any edges from any stage-band/atomic in source thread to any stage-band/atomic in target thread" and synthesises a single visualised edge per source-target pair, with edge type defaulting to the strongest type present (foundational > concurrent > alternative > enrichment).

When the user zooms to stage-band level, the renderer can show stage-band-level edges. At atomic zoom, atomic-level edges become visible. This semantic-zoom edge rendering keeps the high-level view legible while exposing structure on demand.

---

## 7. Regulatory mapping

This section specifies how the Universe talks to external regulatory frameworks without those frameworks shaping the substrate.

### 7.1 Mapping attaches at atomic level

Regulatory mappings attach to atomic capabilities, not to threads or stage-bands. This is essential because:

- Atoms are the rollup source. The HEU report computes "is CD ACMNA-X covered?" by summing evidence on the atoms that map to that CD.
- One atom can map to multiple frameworks simultaneously. The same partitioning atom maps to AC v9, Common Core, and possibly state-specific US frameworks.
- One CD can be satisfied by multiple atoms. AC v9 CDs are deliberately broader than Universe atoms; one CD is typically satisfied by 2–6 atoms in concert.

### 7.2 The regulatory framework registry

Each supported framework is registered in the system with metadata:

```typescript
interface RegulatoryFramework {
  key: RegulatoryFrameworkKey;
  name: string;                     // "Australian Curriculum v9.0 (Queensland)"
  jurisdiction: string;             // "Queensland, Australia"
  reportTier: 'cd_level' | 'learning_area' | 'standard' | 'outcome';
  totalCodes: number;               // total CDs in the framework
  reportFormat: ReportFormatSchema; // how the export is structured
  evidenceRequirements: EvidenceRequirementSchema; // what counts as evidence
  introducedInVersion: LibraryVersion;
  deprecatedInVersion?: LibraryVersion;
}
```

The framework registry is canon, authored centrally, and updated when regulators update their standards. AC v9 → AC v9.1 would create a new framework key alongside the old one, with a deprecation window.

### 7.3 Per-family regulatory selection

Each family selects a `regulatoryFramework` in their settings, defaulting based on jurisdiction. The selected framework determines:

- Which threads render in the Constellation's "regulated" zone (those with mappings to the selected framework).
- What the HEU/state report exports.
- How recommendations weight gap closure.

A family can select `'none'` — homeschoolers in unregulated jurisdictions or those who have no reporting obligations. In that case the Constellation has no regulated zone; everything is canonical extended or tradition-specific or custom.

### 7.4 Rollup logic — atomic to CD

A regulator CD is considered "covered" when the sum of evidence weights from observations on atoms mapped to that CD reaches a sufficiency threshold.

```
CD coverage score = Σ (observation_weight × atom_evidence_weight × tier_multiplier)
                    for all observations linking to atoms mapped to the CD

where:
  observation_weight = 1.0 (each observation counts once toward each CD it can serve)
  atom_evidence_weight = the evidenceWeight field on the RegulatoryMapping (default 1.0/0.5/0.2)
  tier_multiplier = emerging: 0.3, developing: 0.7, demonstrating: 1.0
```

Coverage thresholds for HEU reporting purposes:

- **Not started:** score < 0.5
- **Partial:** 0.5 ≤ score < 1.5
- **Covered:** score ≥ 1.5

These thresholds are set such that one Demonstrating-tier observation on a primary-mapped atom is enough to clear "Partial," and three such observations clear "Covered" comfortably. The thresholds can be tuned but should remain defensible to a regulator.

The rollup is computed at read time. There is no stored "CD coverage" field; the report query computes it fresh from the underlying observation data, the atomic-CD mapping table, and the family's currently selected framework.

### 7.5 Cross-framework consistency

Where the same capability is recognised by both AC v9 and Common Core, the same atom carries both mappings. The atom doesn't change — only the rollup target changes when the family's framework selection changes. A family migrating from QLD to Texas does not lose evidence; their data simply rolls up to a different framework's structure on read.

### 7.6 Atoms with no regulatory mapping

This is the v2 architecture's most important design choice for the classical and trades content. Atoms can have zero regulatory mappings. They are first-class members of the Universe.

Examples of v2 atoms with no AC v9 mapping:

- Identifies the Latin root *aqua* in English derivatives (Foundational Latin Vocabulary)
- Recites the Lord's Prayer with comprehension (Foundational Theology)
- Identifies the rhetorical figure *anaphora* in a passage (Intermediate Logic & Rhetoric)
- Demonstrates competent stitch length consistency in hand sewing (Foundational Practical Mastery)

These atoms accumulate evidence, brighten threads in the Constellation, contribute to badges, surface in Our Story narrative, and inform the family's full picture of their child's formation. They contribute zero to the HEU report. That asymmetry is the point.

### 7.7 Opportunistic mapping

A single observation can evidence multiple atoms. A Latin copywork session might evidence:

- Latin Vocabulary atom (no AC v9 mapping)
- Handwriting Formation atom (AC v9 mapping in Foundational Writing)
- Sustained Attention atom (no direct AC v9 mapping but contributes to General Capabilities)

The Logger AI insight (write-time, Haiku) suggests atomic links to the parent at save time. The parent confirms or adjusts. The observation then carries multiple atomic links and contributes to multiple regulatory rollups simultaneously, where mappings exist.

### 7.8 Authoring regulatory mappings

For v2 launch:

- AC v9 mappings: Opus authors mappings from AC v9 documents to v2 atoms. This is high-judgement work — the mapping author must read the CD carefully and identify which atoms genuinely satisfy it. Mappings are reviewed by Drew before publication.
- Common Core mappings: Deferred to v2.1 or v3 unless US expansion is imminent. For US launch readiness, a single content authoring sprint maps the existing v2 atoms to Common Core structure.
- NGSS mappings: Same as Common Core.
- State-specific US homeschool frameworks: Most are quite minimal in their requirements (some require nothing). Mapping work is correspondingly light. A 1–2 sprint task per state.

---

## 8. Badge model — stage-tier scoped

Badges in v2 are stage-tier scoped per D8. "Number Navigator (Foundational)" and "Number Navigator (Intermediate)" are distinct badges.

### 8.1 Badge anatomy

A badge is defined by:

- **Identity:** belongs to one thread at one stage-band.
- **Criteria:** a set of atomic capabilities, each with a minimum tier requirement.
- **Criteria policy:** `all` (every criterion must be met) or `threshold` (a specified count of criteria must be met).
- **Prerequisite badges:** earlier stage-band badges typically required (Intermediate badge requires Foundational badge, etc.).
- **Editorial content:** name, description, what-it-recognises paragraph, suggested parent narrative.

### 8.2 How many badges per thread

Typical pattern: one badge per stage-band per thread. A thread with all four stage-bands populated will accumulate four badges across the child's life. Some threads warrant multiple badges per stage-band (Foundational Reading & Decoding might have a Phonological Awareness badge, a Decoding badge, and a Reading Fluency badge — each scoped to specific strands within the Foundational stage-band).

The total badge count across the v2 library is expected to be in the 200–400 range when fully populated, distributed unevenly across domains.

### 8.3 Why stage-tier badges are right

The v1 thread-level badge model produces three badges per thread (one per tier — emerging, developing, demonstrating), all of which feel similar to the parent because they describe progression through one capability cluster. The stage-tier model produces fewer-but-meaningful badges per thread per stage-band, with each subsequent badge representing a substantively different developmental moment.

A child who earns the Foundational Number Navigator badge has formed something specific: working canonical and non-canonical partitioning, comparison of magnitudes within 100, basic addition and subtraction strategies. The Intermediate Number Navigator badge means something different: place value extending to 1000+, multiplication and division foundations, fraction concepts. These aren't "more" of the same; they're different.

### 8.4 Badge authoring requirements

Every badge requires:

- Clear identity (thread, stage-band).
- 4–8 criteria atoms, drawn from across the strands of that stage-band (avoid all criteria coming from one strand — that produces a narrow badge).
- Criteria policy with rationale.
- Prerequisite badges if applicable.
- Editorial text (name, description, what-it-recognises, parent narrative).

### 8.5 Badge migration from v1

The v1 library contains badges scoped at the thread level with three tiers. The v2 migration:

- Each v1 thread badge maps to a Foundational v2 badge in the corresponding v2 thread.
- The Developing tier of the v1 badge maps to the v2 Foundational badge's "developing" criteria threshold.
- Demonstrating-tier v1 badges map to v2 Intermediate badges.
- This is approximate — content authoring will refine. Migration is treated as initial seeding, not a precise translation.

### 8.6 Custom thread badges

Custom threads do not have badges in v2. Families can describe milestones in custom-thread narrative form, but the formal badge mechanism is canon-only. This is consistent with D2 (centrally authored canon).

---

## 9. Visualisation contract

The Constellation is the primary visual surface for the Universe. This section specifies what the rendering layer needs from the data model and what the data model commits to providing.

### 9.1 Three-zone structure (D9 restated)

The Constellation renders threads in one of three zones:

**Regulated zone.** Threads with at least one atomic capability mapped to the family's currently selected `regulatoryFramework`. These threads render with full luminosity in the inner zone of the sky.

**Canonical extended zone.** Threads with no mapping to the family's framework but with mappings to other frameworks (e.g., a thread mapped to Common Core but not AC v9, for an Australian family). These render in the middle zone with slightly differentiated visual weight.

**Tradition-specific zone.** Threads with no regulatory mappings at all (Latin, theology, classical rhetoric, much of trades). These render in the outer zone of the sky.

A thread's zone is computed at render time from the family's framework selection. Switching framework re-computes the zone assignments without altering observation data.

### 9.2 Brightness rules (D9 restated)

A thread's visual brightness is a function of observation evidence:

- Threads with no observations render at minimum visibility — present, structurally honest, but visually quiet.
- Threads with observations brighten in proportion to evidence weight.
- The brightening function is monotonic — more evidence is never less bright.
- The brightness scale is per-zone-normalised so that the regulated zone doesn't visually dominate even when it has more observations than tradition-specific.

Brightness is not affected by:

- Family pedagogy (D9: not pedagogy-driven).
- Recommendation status (D9: discovery surfacing happens elsewhere, not in brightness).
- Age relevance (this affects ghost-thread surfacing, not brightness of active threads).

### 9.3 Semantic zoom layers

The Constellation supports six zoom levels:

| Level | What's shown | Camera implication |
|-------|--------------|---------------------|
| 1 | Super-domains as galaxy clusters | Full sky, camera distant |
| 2 | Domains as constellations within their super-domain regions | Zoomed to one super-domain or multi-super-domain region |
| 3 | Threads as stars within their domain region | Zoomed to one domain |
| 4 | Stage-bands within a thread, with stage-band edges visible | Zoomed to one thread's stage-band ring |
| 5 | Strands within a stage-band, with strand-level structure | Zoomed to one thread's stage-band |
| 6 | Atomic capabilities and indicators, with atomic edges visible | Zoomed to one strand |

Most parents will live at levels 2–3 most of the time. Level 4 surfaces for stage-band celebration moments. Levels 5–6 are for the engaged parent who wants to understand structure and for the long-form Our Story narrative composition.

### 9.4 Rendering technology contract

The data model commits to providing:

- Stable thread, stage-band, strand, atomic IDs.
- Stable spatial placement metadata at the domain level (`ConstellationRegion`) so v3+ domains can be admitted without reshuffling existing layouts.
- Pre-computed thread-to-thread edge collapse data to spare the renderer from reconstructing edges on every frame.
- Brightness values computed from observation evidence, with sensible defaults for "no observations yet" states.

The renderer is responsible for:

- Layout within each domain region (no fixed placement of threads within a domain — the renderer can use force-directed or organic layouts).
- Level-of-detail transitions (what to render at each zoom level).
- Frame budget — Canvas with LOD is the v2 target; WebGL is the upgrade path if Canvas hits performance limits.
- Tap targets at all zoom levels (44px minimum maintained).

### 9.5 Filter and toggle contracts

The Constellation supports the following filters:

- **Regulated only** — dims everything outside the regulated zone. For HEU prep moments.
- **Tradition focus** — highlights one tradition-specific cluster (Classical, Trades, Practical Mastery, etc.) and dims others.
- **Active only** — shows only threads with at least one observation. Useful for reviewing the current term.
- **Stage-band filter** — shows only one stage-band's view across all threads. For developmental-band perspective.

Filters never delete data. They affect rendering only.

### 9.6 Custom thread rendering

Custom family-authored threads render with distinct visual treatment:

- Outside the canonical zones, on the periphery of the sky.
- Different stroke or fill style to mark them as family-authored.
- Visible to the family but not exported in HEU reports unless explicitly attached via the report annotation flow.

---

## 10. Our Story surface contract

Our Story is the narrative surface — Hearth's long-form view of who the child is becoming, drawn from the substrate. Per D10, Our Story is one of two surfaces (alongside the Constellation) that exposes atomised structure to parents.

### 10.1 What Our Story surfaces from the Universe

Our Story uses Universe data at multiple grains depending on the narrative section:

- **Year-in-review narrative** — uses thread-level brightness changes over the period, identifies "what's been forming" without naming atomic capabilities.
- **Stage-band celebration moments** — when a stage-band crosses a milestone (e.g., 50% of strands at Developing), Our Story can compose a celebration narrative naming the stage-band and the strands without descending to atoms.
- **Atomic-capability-level reflection** — for engaged parents who want to read at depth, Our Story can render an atomic-grain narrative for a chosen thread and stage-band, walking through which atoms have evidence, what the evidence is, and where the next development typically lies.
- **Cross-domain pattern surfacing** — Our Story narrates patterns that span domains ("Emma's attention has been forming alongside her Latin work — both Foundational Sustained Attention and Foundational Latin Vocabulary brightened together this term"). This is the substrate's most distinctive narrative capacity.

### 10.2 What Our Story does not do

- Does not list atoms as a flat checklist.
- Does not surface every atom that has evidence — selects narratively.
- Does not narrate gaps as deficits — frames them as "next horizons" or "still ahead" or omits them.
- Does not use library-version language to the parent ("you've upgraded to library v3" — this is system-internal).

### 10.3 Composition — read-time, no LLM at read

Per the two-layer AI architecture, Our Story narratives are composed at write-time and stored in the Family Intelligence Snapshot. Read-time renders from the snapshot.

When a write event triggers an FIS rebuild (a logged observation, a badge earned, a stage-band threshold crossed), the rebuild process composes Our Story narrative fragments using a single Haiku call with the substrate context and the family's pedagogy lens. The resulting narrative fragments are stored in the FIS and rendered from there at read time without further LLM calls.

### 10.4 Atomic drill-down in Our Story

When a parent navigates from Our Story into atomic-grain detail for a specific thread and stage-band, the surface reads from the substrate directly (atomic capabilities, their indicators, observation evidence linked to each). This is structural data, not narrative — no LLM call is needed. The parent sees a structured view of "here are the seven atoms in this strand, here's what evidence exists for each, here's what's next."

### 10.5 Constellation deep zoom and Our Story drill-down convergence

The two paths into atomic detail are unified:

- From Constellation level 6 zoom (atomic level), tapping an atom shows the same atomic detail panel as Our Story drill-down.
- From Our Story atomic drill-down, "see this in your sky" navigates to Constellation level 6 zoomed to the relevant atom.

The two surfaces are different doors into the same data view. They share the rendering component for atomic detail.

---

## 11. Migration from v1

The v1 library contains 57 threads across 8 domains with three-tier indicators per thread. Migrating to v2 involves substantial restructure. This section specifies the migration mechanics.

### 11.1 What changes structurally

| v1 | v2 |
|----|----|
| 8 domains | 15 domains across 6 super-domains |
| 57 threads (flat tier structure) | ~150–200 threads (stage-band internal hierarchy) |
| Three-tier indicators (emerging/developing/demonstrating) directly on thread | Tiers attached to atomic indicators within strands within stage-bands |
| Thread-level badges with three tiers | Stage-band-tier badges scoped to specific stage-bands |
| Curriculum mappings on threads | Regulatory mappings on atoms |
| Prerequisite/enables arrays on threads | Typed PrerequisiteEdge graph at stage-band and atomic levels |

### 11.2 Domain mapping

| v1 domain | v2 domain mapping |
|-----------|---------------------|
| L (Language & Literacy) | Domain 1 (Language & Literacy) — most threads carry over, plus L9 splits to Domain 6 (Literary & Narrative Tradition) |
| M (Mathematical Thinking) | Domain 2 (Mathematical Thinking) — direct |
| S (Scientific Thinking) | Domain 3 (Scientific Thinking) — direct |
| H (Humanities) | Domain 5 (Historical, Civic & Geographic Understanding) — most threads. H6 (First Nations) distributes per §2.3. |
| C (Creative Expression) | C1 → Domain 6 (Literary & Narrative Tradition). C3, C4 → Domain 11 (Musical & Performative Arts). C5 → Domain 10 (Visual & Plastic Arts). |
| EF (Executive Function) | Domain 13 (Personal & Ethical Formation) — consolidated |
| P (Physical) | Domain 15 (Physical & Embodied Capability) — direct |
| PS (Personal-Social) | Distributes between Domain 13 (personal/ethical) and Domain 14 (social/relational) |

### 11.3 Thread mapping

Each v1 thread maps to a v2 thread (or, in some cases, splits to two v2 threads or merges with another v1 thread). The migration table is authored as part of the v2 library content build — this spec does not enumerate it (that's downstream work). The critical commitment is:

- **Every v1 thread has a v2 successor.** No v1 thread is silently dropped.
- **The v1 thread ID is preserved as `legacyV1Id` on the v2 thread.** This supports automated observation re-tagging.
- **Where a v1 thread splits, observations may need duplication or reclassification.** Migration logic decides per case based on the observation's content and source.

### 11.4 Observation re-tagging

Existing observations in PostgreSQL carry v1 thread links. On migration:

- Each observation's `threadLinks[].threadId` is mapped via `legacyV1Id` to its v2 successor.
- The v1 tier (emerging/developing/demonstrating) maps to a v2 stage-band's tier — typically Foundational unless the v1 evidence is sophisticated enough to warrant Intermediate placement.
- The v2 atomic links are NOT auto-populated. v1 observations carry over with thread-level evidence only; atomic-level evidence is empty.
- New observations from v2 onward populate atomic links normally.

The rationale for not back-filling atomic links: doing so would require LLM-grade reasoning over historical observation text to assign correct atomic links, and the resulting accuracy would be uncertain. Better to retain the historical thread-level evidence honestly than to fabricate atomic links.

### 11.5 Badge migration

v1 thread badges with three tiers map to v2 Foundational stage-band badges per thread. Demonstrating-tier v1 badges become Intermediate stage-band badges. This is a coarse mapping; v2 badge content authoring will refine.

Earned v1 badges remain earned. The badge identity changes from v1 thread-tier-scoped to v2 stage-band-scoped, but the family's Constellation continues to display the badge as awarded.

### 11.6 The v2 library content authoring commitment

Migrating from v1 to v2 is not just an engineering task. It requires:

- Re-drafting all 57 v1 threads to fit the v2 stage-band hierarchy.
- Authoring the strand and atomic capability content for each — this is the bulk of the work.
- Authoring the new Classical Disciplines, Practical Mastery, Technological Fluency, and Literary & Narrative Tradition content.
- Authoring regulatory mappings at atomic level for AC v9 (across all states).
- Authoring stage-tier badges across the entire library.
- Authoring the prerequisite graph in the typed v2 form.

This is a multi-month content authoring project, phased across releases. v2 launch can ship with partial atomic population (Foundational fully populated, Intermediate partially, Advanced and Tertiary skeletal) provided the data model and structural commitments are honoured throughout.

### 11.7 Migration as an event, not a creep

Migration from v1 to v2 happens as a discrete event for each family. The family's `FamilyLibraryState` records the upgrade with a timestamp. Pre-migration observations remain visible and contribute to the Constellation; post-migration observations carry the v2 enrichment. The visual experience is continuous; the data model migration is recorded for auditability.

A family currently mid-HEU-cycle can pin to v1 until their cycle completes (`pinnedAtVersion`). v2 launch should respect HEU cycle boundaries to avoid surprise mid-report changes.

---

## 12. Library versioning

### 12.1 Version increment rules

| Change | Version increment |
|--------|---------------------|
| Adding indicators to existing atoms | Patch (2.0.x) |
| Adding atoms to existing strands | Minor (2.x.0) |
| Adding strands to existing stage-bands | Minor |
| Adding new threads to existing domains | Minor |
| Adding new domains | Major (3.0.0) |
| Adding new stage-bands beyond the four canonical | Forbidden — the four stage-bands are fixed |
| Restructuring or removing existing canonical content | Forbidden after publication (D3) |
| Adding new regulatory frameworks | Minor |
| Updating existing regulatory framework version (e.g. AC v9 → v9.1) | Minor; old framework key deprecated, new key added |

### 12.2 Compatibility commitments

Universe v2 commits to:

- All v2 thread IDs remain valid in v3+ (active or deprecated, never removed).
- All v2 atomic IDs remain valid in v3+ (active or deprecated, never removed).
- All v2 indicators remain valid in v3+ (active or deprecated, never removed).
- Observations tagged at v2 will continue to render in any v3+ family library state.
- The four stage-bands (Foundational, Intermediate, Advanced, Tertiary) are fixed and cannot be added to or removed from.
- The six super-domains are visual organising principles and may be revised in later versions; super-domain-level changes do not affect data integrity.

### 12.3 Family auto-upgrade vs pinning

Default behaviour: families auto-upgrade to the latest library version on family-state-aware boundaries (typically end-of-week or end-of-HEU-cycle). This keeps everyone on current canon without disruption mid-week.

Pinning: a family can explicitly pin to an older version via Family Settings. This is rare and intended for HEU-cycle protection or for families experiencing instability after an upgrade. Pinning is opt-in.

### 12.4 Deprecation path

Content cannot be silently removed (D3, D12). When content needs to be retired:

1. Author the replacement (or decide there is no replacement — the content is genuinely obsolete).
2. Mark the original `status: 'deprecated'` and set `deprecationReplacement` if applicable.
3. The deprecated content remains in the library, no longer recommended for new use, but historical observations linked to it continue to function.
4. After multiple major versions, deeply deprecated content can be moved to an archive accessible only on explicit query — but never deleted from the data model.

---

## 13. Authoring workflow

### 13.1 Phasing

The v2 library content authoring is phased across releases:

**Phase 1: Architecture & schema (this spec + Claude Code schema implementation).**
- Outputs: this spec, Sanity schema migration files, PostgreSQL migration files, library version state machine.

**Phase 2: Foundational stage-band content (priority).**
- All 15 domains seeded with Foundational stage-band threads.
- Foundational strands and atomic capabilities authored across 80%+ of threads.
- AC v9 atomic-level mappings completed for all Foundational atoms.
- Stage-tier badges for Foundational stage-band across all threads.
- v2 library v2.0.0 ships at end of Phase 2.

**Phase 3: Intermediate stage-band content.**
- Intermediate stage-band populated across primary threads.
- Library v2.1.0 ships.

**Phase 4: Classical Disciplines deep authoring.**
- Latin, Greek (later), Logic, Rhetoric, Theology threads authored at Foundational and Intermediate depth.
- Drives Jumpstart Classical pack v2 and successor packs.
- Library v2.2.0.

**Phase 5: Practical Mastery & Trades preparation.**
- Practical Mastery deep authoring.
- Industrial Trades scaffolding (atom families ready for v3 admission when first welding/electrical pack ships).
- Library v2.3.0.

**Phase 6: Advanced and Tertiary stage-band content.**
- Sparser authoring focused on threads where families are observed reaching Advanced.
- Library v2.4.0.

**Phase 7+: US framework mappings, additional frameworks, Tertiary depth.**
- Common Core, NGSS, per-state mappings.
- Library v2.5+, eventually v3.0 when first new domain (Industrial Trades) admits.

### 13.2 Authoring roles

| Layer | Authored by | Quality gate |
|-------|-------------|--------------|
| Domain definitions | Opus (in project chat) | Drew |
| Thread structure and stage-bands | Opus | Drew + practitioner review |
| Strand structure | Opus | Drew |
| Atomic capabilities | Opus drafts framework; Sonnet/Haiku via coworker may draft individual atoms; Opus QAs and finalises | Drew sample-reviews |
| Atomic indicators | Same as atomic capabilities | Same |
| Prerequisite edges (intra-domain) | Opus | Drew + cross-domain review |
| Prerequisite edges (cross-domain) | Opus | Drew |
| Regulatory mappings (AC v9) | Opus from AC v9 documents | Drew + curriculum specialist if available |
| Regulatory mappings (other frameworks) | Opus from framework documents | Drew |
| Badges | Opus | Drew |
| Pedagogy affinities | Opus with reference to pedagogy knowledge base | Drew |

### 13.3 Quality gates

Each phase has a quality gate that must pass before release:

- **Coherence gate.** Every thread has stage-bands populated to declared depth. Every strand has 3+ atoms. Every atom has indicators across all three tiers.
- **Mapping gate.** AC v9 mappings are present for every atom that should map (per editorial judgement). Coverage of AC v9 CDs is computable and reaches >90% of CDs at Foundational level.
- **Graph gate.** No prerequisite cycles. Every cross-domain edge has rationale. Hard edges are defensible.
- **Visualisation gate.** The Constellation renders the full library at all six zoom levels without performance failure or visual breakage.
- **Migration gate.** Migration from v1 to the new version produces correct observation re-tagging on test families.

### 13.4 Operating rhythm

- Architecture and judgement work happens in this Opus project chat.
- Mechanical schema and migration work happens in Claude Code.
- Bulk atom authoring delegates to Sonnet/Haiku via coworker with Opus QA, similar to the Jumpstart Classical pack pattern.
- Drew reviews at quality gates, samples atom authoring at 10% rate, and resolves authoring questions surfaced in the open-questions log.

---

## 14. Open authoring questions

These are questions that need decisions during the actual content authoring that follows this spec. They are surfaced here to be addressed in sequence rather than re-discovered mid-authoring.

### 14.1 Domain-scoped questions

**Q1. Theology & Scriptural Literacy in v2 — which traditions seed?**
v2 ships with Christian Scriptural Literacy threads as the first occupant of this domain (driven by Jumpstart Classical's worldview and Hearth's Christianity-in-the-public-square positioning). Should v2 also seed Jewish, Islamic, or other tradition threads, or defer those to later versions? Recommendation: defer to v2.2 or beyond unless a specific pack drives the need.

**Q2. Classical Languages — which languages in v2?**
Latin is the priority. Should v2 seed Greek as well (used in some classical curricula), or defer? Recommendation: Latin Foundational populated; Greek as a stub strand within Classical Languages domain pointing to v2.x.

**Q3. Technological Fluency — at what age band does coding-as-discipline begin?**
Coding can sit in Foundational (block-based programming, pattern recognition) or be reserved for Intermediate (text-based programming with logic). Recommendation: split — block-based and computational thinking in Foundational; text-based programming in Intermediate.

**Q4. First Nations content distribution — concrete authoring guidance.**
The spec defers First Nations to distributed placement across Domains 5, 6, 9, 11. Specific authoring guidance for each domain is needed before content authoring begins. Drew has flagged this as an area requiring cultural review.

### 14.2 Mapping-scoped questions

**Q5. AC v9 mapping for the General Capabilities (cross-curriculum priorities).**
AC v9 has both content descriptors (subject-specific) and General Capabilities (Critical and Creative Thinking, Personal and Social Capability, Ethical Understanding, Intercultural Understanding, Digital Literacy, Literacy, Numeracy). General Capabilities map most naturally to v2 atoms in Personal & Ethical Formation, Social & Relational Formation, Logic & Rhetoric, and Technological Fluency. Specific mapping schema needed.

**Q6. AC v9 cross-curriculum priorities (Sustainability, Asia and Australia's Engagement with Asia, Aboriginal and Torres Strait Islander Histories and Cultures).**
Where do these map? Recommendation: cross-curriculum priorities are atomic-level tags that overlay normal domain mappings, not separate threads.

**Q7. US Common Core mapping completeness for v2 launch.**
Is US-readiness a v2 launch requirement, or a v2.x deferred? Recommendation: v2 launches AC v9-only; Common Core arrives in v2.2 or v2.3 as part of US-expansion preparation.

### 14.3 Graph-scoped questions

**Q8. How dense should the cross-domain prerequisite graph be in v2?**
Sparse: only the most defensible cross-domain edges (Reading → Latin; Attention → Memory Work; Number Sense → Measurement). Dense: every plausible cross-domain relationship surfaced as concurrent or enrichment. Recommendation: sparse foundational edges; concurrent and enrichment edges added incrementally as authoring matures.

**Q9. Edge authoring at atomic vs stage-band level.**
Some edges are most cleanly stated at stage-band level (Foundational Reading → Foundational Latin); others at atomic level (Phoneme isolation → Decoding CVC). Authoring guidance needed: when does each level apply?

### 14.4 Badge-scoped questions

**Q10. Multi-badge stage-bands.**
For threads with rich multi-strand stage-bands (Foundational Reading & Decoding has Phonological Awareness, Decoding, Fluency, Comprehension as strands), should each strand carry its own badge, or one composite stage-band badge? Recommendation: composite for most threads; multi-badge for threads where parents and educators clearly distinguish the strands as separate accomplishments.

**Q11. Badge naming conventions.**
"Number Navigator (Foundational)" is functional but reads clunkily. Should badge names be tradition-flavoured ("Number Apprentice", "Number Journeyman") or stay descriptive? Recommendation: descriptive with stage-band suffix; tradition-flavoured names risk over-loading the substrate with classical aesthetic that would not suit all families.

### 14.5 Visualisation-scoped questions

**Q12. Empty stage-band rendering at level 4.**
A child whose Foundational Number Sense is fully formed but whose Tertiary Number Sense has no observations — how does Tertiary render in a stage-band ring view? Visible-but-quiet (showing future structure) or hidden (avoiding clutter)? Recommendation: visible-but-quiet, consistent with the "all canonical threads always render" principle.

**Q13. How does the Constellation handle a 12-year-old with 5,000+ observations?**
The data model commits to honest evidence accumulation. The renderer must perform. Concrete performance budgets and LOD transitions need specification before mass-content authoring begins.

### 14.6 Process-scoped questions

**Q14. Library version pinning UX.**
How does the family UI present pinning? Is it a power-user setting or surfaced more prominently around library upgrade events? Recommendation: surface pinning only when an upgrade is imminent during an HEU cycle; otherwise hidden in advanced settings.

**Q15. Migration warning / consent flow.**
When a family migrates from v1 to v2, do they see an explicit upgrade event ("Hearth has updated your capability map — here's what changed for you") or is it silent? Recommendation: visible but reassuring — frame it as positive ("Your sky just got bigger") rather than disruptive.

---

## 15. File and version

- This file: `hearth-capability-universe-v2-architecture-spec-v1.md`
- Version: 1
- Date: 9 May 2026
- Status: Authoritative architectural specification for the capability substrate.
- Next artifacts triggered by this spec:
  - Sanity schema migration (Claude Code task) — implements §3 data model in Sanity schema and PostgreSQL DDL.
  - Library version state machine (Claude Code task) — implements §11 migration logic and §12 versioning rules.
  - v2 library content authoring (multi-phase content project) — see §13.
  - Constellation v2 visualisation prototype (separate Opus design discourse, then Claude Code build) — implements §9.
  - HEU report v2 query layer update (Claude Code task) — implements §7.4 atomic-to-CD rollup.
  - Our Story narrative composition update (Claude Code task) — implements §10 substrate-aware narrative.

This spec supersedes:
- `hearth-capability-thread-library.md` (v1, 14 February 2026) — entirely replaced for new authoring; v1 threads remain valid for migration source per §11.
- Structural sections of `hearth-capabilities-connector-architecture.md` — five-layer model is restated and refined here as the Universe's atomised hierarchy. The connector architecture's UbD framing remains valid as design philosophy.

This spec does not supersede:
- `hearth-pedagogy-knowledge-base-architecture-v1.md` — pedagogy lens overlays remain unchanged.
- `hearth-data-architecture-overview-v1.md` — Sanity vs PostgreSQL placement guidance remains valid; v2 follows the same patterns.
- `hearth-jumpstart-classical-pack-plan-v2.md` — pack plan structure remains valid; pack content authoring will reference v2 atoms and threads instead of v1 threads.

End of specification.
