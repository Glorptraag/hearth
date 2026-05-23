<!-- Version: 1 | Date: 2026-05-13 | Changes: Initial draft. Maps all 57 v1 threads (L1–L9, M1–M9, S1–S6, H1–H6, P1–P5, PS1–PS7, C1–C7, EF1–EF8) onto the 15-domain v2 architecture per hearth-capability-universe-v2-architecture-spec-v1.md §11. Surfaces splits, merges, edge-case placements, and net-new v2 threads that have no v1 ancestor. -->

# Hearth v1 → v2 Thread Migration Table

> **Status:** Draft for Drew's review. The substantive thinking pass §11.3 of the architecture spec defers.
> **Purpose:** Per-thread assignment of v1 capability threads into the v2 15-domain structure, with explicit splits, merges, and renames. Output drives the library content build and the `legacyV1Id` field on each v2 thread.
> **Companion:** `hearth-capability-universe-v2-architecture-spec-v1.md` (architectural authority), `seed-capability-threads.ts` (v1 archive, frozen).

---

## Summary

**v1 inventory:** 57 threads across 8 domains.

**v2 outcome:**

| Mapping kind | Count | Description |
|---|---|---|
| Direct (1:1) | 38 | v1 thread carries over to one v2 thread, same scope, possibly refined name |
| Split (1:many) | 6 | v1 thread decomposes into 2+ v2 threads under different domains |
| Merge (many:1) | 1 (H1+H3) | Two v1 threads consolidate into one v2 thread |
| Distribute (1:atoms) | 1 (H6) | v1 thread becomes a cross-domain concept; no direct v2 successor thread |
| Re-home (1:1, new domain) | 11 | v1 thread carries over but moves to a different v2 domain |
| **Net-new v2 threads** | **~20–30** | No v1 ancestor; required to populate Domains 4, 7, 8, 9, 12 fully |

**Coverage gaps closed by v2 NEW domains and threads:**

- Domain 4 Technological Fluency: net-new (computational thinking, coding, data literacy, engineering design)
- Domain 7 Classical Languages: net-new (Latin, Greek, Hebrew)
- Domain 8 Logic & Rhetoric: partial v1 cover from L8, EF5 only; substantial net-new
- Domain 9 Theology & Scriptural Literacy: net-new (Christian scriptural literacy, opt-in family-level)
- Domain 12 Practical Mastery: partial v1 cover from C6 only; substantial net-new (handwork, domestic arts, gardening, repair, traditional crafts)

---

## Per-domain migration tables

### Domain 1 — Language & Literacy

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| L1 | Oral Communication & Listening | Direct → Domain 1 | Communication-as-craft stays here. Communication-as-relation (conversational empathy, conflict resolution) lives in Domain 14 as a separate atom set. |
| L2 | Phonological Awareness & Decoding | Direct → Domain 1 | Foundational stage-band heavy. |
| L3 | Reading Comprehension | Direct → Domain 1 | All stage-bands populate. |
| L4 | Spelling & Word Knowledge | Direct → Domain 1 | Etymology atoms may cross-reference Domain 7 (Classical Languages) at intermediate+ stages. |
| L5 | Written Expression | Direct → Domain 1 | Persuasive composition atoms here cross-reference Domain 8 atoms. |
| L6 | Handwriting & Text Production | Direct → Domain 1 | Motor substrate cross-references Domain 15 P2 atoms (fine motor). |
| L7 | Text Structure & Purpose | Direct → Domain 1 | |
| L8 | Persuasion & Argument | **Split** → Domain 1 + Domain 8 | Writing-as-craft aspects fold into L5/L7. Reasoning, dialectic, rhetorical figures move to Domain 8 (Logic & Rhetoric). Recommended v2 placement: primarily Domain 8, with cross-reference atoms in Domain 1. |
| L9 | Literary Response & Appreciation | **Re-home** → Domain 6 | Per spec §11.2. Literary tradition is its own domain. |

### Domain 2 — Mathematical Thinking

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| M1 | Number Sense & Place Value | Direct → Domain 2 | |
| M2 | Operations & Computation | Direct → Domain 2 | |
| M3 | Fractional Thinking | Direct → Domain 2 | |
| M4 | Algebraic Thinking & Patterns | Direct → Domain 2 | |
| M5 | Measurement Sense | Direct → Domain 2 | |
| M6 | Spatial Reasoning & Geometry | Direct → Domain 2 | |
| M7 | Data & Statistical Thinking | Direct → Domain 2 | Some atoms cross-reference Domain 4 (data literacy at the computational level). |
| M8 | Probability & Chance | Direct → Domain 2 | |
| M9 | Mathematical Modelling & Problem Solving | Direct → Domain 2 | Tertiary stage-band may carry atoms that cross-reference Domain 8 (mathematical logic). |

### Domain 3 — Scientific Thinking

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| S1 | Scientific Inquiry | Direct → Domain 3 | |
| S2 | Living Systems | Direct → Domain 3 | |
| S3 | Earth & Environmental Systems | Direct → Domain 3 | |
| S4 | Physical & Chemical Sciences | Direct → Domain 3 | |
| S5 | Scientific Observation | Direct → Domain 3 | The "observation as discipline" framing also informs Domain 13 atoms (sustained attention applied to a domain) but the v2 thread stays in 3. |
| S6 | Science as Human Endeavour | Direct → Domain 3 | Strong cross-reference to Domain 5 (history of science) atoms. |

### Domain 4 — Technological Fluency (v2 NEW DOMAIN)

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| C7 | Digital Creation | **Re-home** → Domain 4 (primary) | Creative-output aspects of digital making split to Domain 10 (Visual Arts) where appropriate. |
| PS7 | Digital Citizenship | **Split** → Domain 4 + Domain 13 | Digital-fluency aspects → Domain 4. Ethical/citizenship aspects roll into Domain 13 ethics atoms. |
| — | (net-new) Computational Thinking | NEW thread | Decomposition, abstraction, pattern recognition, algorithms. |
| — | (net-new) Coding & Programming | NEW thread | Block-based through text-based languages, code structure, debugging. |
| — | (net-new) Engineering Design Thinking | NEW thread | Define / ideate / prototype / test cycle. Some C6 design-thinking atoms migrate here. |
| — | (net-new) Data Literacy | NEW thread | Reading, querying, visualising data at the digital tool level (distinct from M7 which is mathematical reasoning over data). |
| — | (net-new) Hardware & Systems Understanding | NEW thread | How computers, networks, and physical-digital systems work. Lighter than the others in v2; deepens in v3+. |

### Domain 5 — Historical, Civic & Geographic Understanding

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| H1 | Historical Thinking & Chronology | Direct → Domain 5 | |
| H2 | Source Analysis & Evidence | Direct → Domain 5 | HASS-specific inquiry skill. Logic-of-evidence atoms cross-reference Domain 8. |
| H3 | Geography & Environmental Awareness | **Merge** with H1 atoms → Domain 5 | Per spec §2.2 ("geography is where history happens"). H3 keeps its own thread identity but lives alongside H1 in the same domain with shared stage-band scaffolding. |
| H4 | Civic & Economic Understanding | Direct → Domain 5 | Senior-stage economic atoms may cross-reference Domain 2 (M7 statistics, financial maths). |
| H5 | HASS Inquiry Skills | Direct → Domain 5 | Substantial overlap with H2; v2 authoring should consider whether H5 and H2 are genuinely distinct or whether one absorbs the other. **Author note:** recommend keeping both but tightening scope — H2 = source quality / provenance / evidence; H5 = inquiry process / question formulation / synthesis. |
| H6 | First Nations Australian Perspectives | **Distribute** (no direct successor) | Per spec §2.3. First Nations content is woven across Domains 5 (history), 6 (oral tradition / narrative), 9 (cosmology where families opt in), 11 (music, dance). Observations re-tag to the appropriate domain's thread. Migration table flags this as the most sensitive case and recommends a follow-on review with First Nations education consultation before content authoring proceeds. |

### Domain 6 — Literary & Narrative Tradition (v2 NEW DOMAIN IDENTITY)

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| L9 | Literary Response & Appreciation | **Re-home** → Domain 6 | Becomes the spine of Domain 6. |
| C1 | Narrative & Storytelling | **Re-home** → Domain 6 | Storytelling-as-craft (composition) folds into L5/L7 atoms in Domain 1; storytelling-as-tradition (oral storytelling, story structure, myth, folklore) lives here. |
| C3 | Poetic & Rhythmic Expression | **Split** → Domain 6 + Domain 11 | Literary engagement with poetry (reading, criticism, canon) → Domain 6. Performative/oral aspects (recitation, hymnody) → Domain 11. |
| — | (net-new) Literary Form & Genre | NEW thread | The reader's understanding of narrative structures (epic, tragedy, comedy, novel, short story, etc.). Develops alongside L3 Reading Comprehension but is its own capability. |
| — | (net-new) The Reading Life | NEW thread | Sustained engagement with books over time. Quantity, range, and depth of reading. Charlotte Mason and classical traditions weight this heavily. |

### Domain 7 — Classical Languages (v2 NEW DOMAIN)

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| — | (net-new) Latin | NEW thread | Vocabulary & etymology, morphology & grammar, reading classical texts, translation, language-as-discipline. Primary classical language for Western tradition. |
| — | (net-new) Greek | NEW thread | Parallel scope to Latin. May ship later than Latin. |
| — | (net-new) Hebrew | NEW thread | Primarily for families engaging Hebrew Scripture. Opt-in similar to Domain 9. |

Per spec §2.2, each classical language is a strand-equivalent — they are separate threads within Domain 7, not sub-domains. Atoms within them follow parallel stage-band structures.

### Domain 8 — Logic & Rhetoric (v2 NEW DOMAIN)

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| L8 | Persuasion & Argument | **Re-home** (primary placement) → Domain 8 | Reasoning, dialectic, persuasive composition, rhetorical figures. |
| EF5 | Critical Thinking | **Split** → Domain 8 + Domain 13 | Formal reasoning, syllogisms, fallacies, propositional logic → Domain 8. Personal disposition to think critically → Domain 13. |
| — | (net-new) Formal Logic | NEW thread | Syllogistic and propositional logic at intermediate; predicate logic and mathematical logic at advanced/tertiary. |
| — | (net-new) Dialectic & Argumentation | NEW thread | Constructing and evaluating arguments in dialogue. The classical Trivium's dialectic stage. |
| — | (net-new) Rhetorical Forms & Oratory | NEW thread | Recognising and using rhetorical figures (anaphora, chiasmus, etc.). Oratory and public speaking as performance. |

### Domain 9 — Theology & Scriptural Literacy (v2 NEW DOMAIN)

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| — | (net-new) Christian Scriptural Literacy | NEW thread | Engagement with the Bible (narrative, doctrinal, devotional layers), catechesis, ethical reasoning grounded in Christian tradition, church history. Opt-in at family level. |
| — | (net-new) Hebrew Textual Tradition | NEW thread (later) | Jewish textual engagement. Likely Phase 3+. |
| — | (net-new) Comparative Religious Literacy | NEW thread (later) | World religions framing for families that want broader treatment. Phase 3+. |

Domain 9 is opt-in at the family level per spec §2.2. Families that select a non-religious worldview see the domain in the Constellation as available but unlit; packs touching it can be filtered out of recommendations.

### Domain 10 — Visual & Plastic Arts

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| C5 | Visual Expression & Design | **Re-home** → Domain 10 | Becomes the spine of Domain 10. May split internally into multiple v2 threads (Drawing & Painting, Sculpture & 3D, Photography, Design, Art Appreciation) as the domain authors. |
| — | (net-new) Picture Study & Art Appreciation | NEW thread | Charlotte Mason picture study tradition. Engagement with great works. |
| — | (net-new) Visual Design Thinking | NEW thread | Layout, composition, colour theory, typography. Some C6 atoms migrate here. |

### Domain 11 — Musical & Performative Arts

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| C2 | Musical Expression | **Re-home** → Domain 11 | Spec §11.2 omits C2 from the explicit list but it clearly belongs here. The spec table is incomplete; add C2 → Domain 11. |
| C3 | Poetic & Rhythmic Expression | **Split** → Domain 6 + Domain 11 | Performative side (recitation, hymnody) lands here. See Domain 6 row. |
| C4 | Dramatic Expression | **Re-home** → Domain 11 | |
| — | (net-new) Dance | NEW thread | Distinct from C1/C4. May ship later if no Phase 2 pack drives it. |

### Domain 12 — Practical Mastery (v2 NEW DOMAIN)

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| C6 | Design & Construction | **Split** → Domain 12 + Domain 4 | Physical making/construction → Domain 12. Design-thinking process → Domain 4 (Engineering Design Thinking). |
| — | (net-new) Handwork & Textile Crafts | NEW thread | Knitting, sewing, weaving, embroidery. Charlotte Mason and Waldorf-weighted. |
| — | (net-new) Woodwork & Construction | NEW thread | Hobby-grade. Trades-grade reserved for v3+. |
| — | (net-new) Domestic Arts & Food Skills | NEW thread | Cooking, baking, food preservation, household management. |
| — | (net-new) Gardening & Land Skills | NEW thread | Small-scale food growing, plant care, seasonal awareness. Charlotte Mason nature study has cross-reference atoms with Domain 3 (Scientific Observation). |
| — | (net-new) Repair, Maintenance & Tool Use | NEW thread | Basic mechanical repair, tool care, problem-solving in the physical world. |

### Domain 13 — Personal & Ethical Formation

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| EF1 | Sustained Attention & Focus | Direct → Domain 13 | |
| EF2 | Working Memory | Direct → Domain 13 | |
| EF3 | Memory & Recall | Direct → Domain 13 | Cross-reference atoms in Domain 8 (memorisation traditions, recitation as discipline) and Domain 7 (Latin grammar memorisation). |
| EF4 | Planning & Organisation | Direct → Domain 13 | |
| EF5 | Critical Thinking | **Split** → Domain 13 + Domain 8 | See Domain 8 row. Domain 13 carries the disposition; Domain 8 carries the formal substance. |
| EF7 | Metacognition & Reflective Practice | Direct → Domain 13 | |
| EF8 | Creative Thinking & Innovation | Direct → Domain 13 | Atoms cross-reference Aesthetic Expression domains (10, 11) and Practical Mastery (12). |
| PS3 | Self-Regulation & Wellbeing | **Re-home** → Domain 13 | |
| PS4 | Identity & Belonging | **Split** → Domain 13 + Domain 14 | Identity, self-knowledge, vocational awareness → Domain 13. Family belonging, community participation → Domain 14. |
| PS5 | Environmental Stewardship | **Re-home** → Domain 13 | The ethical/virtue dimension. Strong cross-reference atoms with Domain 5 (geography, civics) and Domain 3 (science). |
| PS6 | Ethical Reasoning | **Re-home** → Domain 13 | Cross-references Domain 8 atoms at advanced stage-bands (formal moral philosophy). |
| PS7 | Digital Citizenship | **Split** → Domain 13 + Domain 4 | Ethical-conduct-in-digital-contexts atoms here. See Domain 4 row. |
| — | (net-new) Virtue Formation | NEW thread | The classical virtues — courage, temperance, honesty, humility, generosity, justice. Christian classical and traditional packs weight this heavily. |

### Domain 14 — Social & Relational Formation

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| PS1 | Empathy & Perspective-Taking | **Re-home** → Domain 14 | |
| PS2 | Social Skills & Cooperation | **Re-home** → Domain 14 | |
| EF6 | Collaboration & Teamwork | **Re-home** → Domain 14 | v1 placed this under Executive Function. v2 corrects: collaboration is relational, not executive. |
| — | (net-new) Conflict Resolution | NEW thread | May fold into PS2 successor if scope overlaps too much; author decides during build. |
| — | (net-new) Hospitality & Community Participation | NEW thread | Charlotte Mason, Waldorf, and Christian classical traditions weight community formation. PS4's "belonging" atoms migrate here. |

### Domain 15 — Physical & Embodied Capability

| v1 ID | v1 Title | v2 Mapping | Notes |
|---|---|---|---|
| P1 | Gross Motor & Physical Coordination | Direct → Domain 15 | |
| P2 | Fine Motor & Manipulation | Direct → Domain 15 | Tool-specific dexterity atoms cross-reference Domain 12 (Practical Mastery) — body-level dexterity stays here, tool-mastery atoms live there. |
| P3 | Health & Body Awareness | Direct → Domain 15 | |
| P4 | Sport & Cooperative Games | Direct → Domain 15 | Cooperation atoms cross-reference Domain 14. |
| P5 | Risk Assessment & Physical Safety | Direct → Domain 15 | |
| — | (net-new) Outdoor Capability & Bushcraft | NEW thread | Outdoor traditions (Charlotte Mason, scouting heritage, Australian bushcraft). Some v1 atoms in P1/P5 migrate here. |

---

## Cross-cutting notes

**Cross-domain atoms via prerequisiteEdge.** Many v2 atoms will carry cross-domain `enables` and `requires` edges. The migration table places threads in their *primary* domain; cross-references are atom-level, not thread-level, and are authored as prerequisiteEdge documents per spec §3.6.

**Observation re-tagging contract.** Every v1 thread that maps to a single v2 thread will re-tag observations automatically via `legacyV1Id`. v1 threads that split require per-observation reclassification — for v2 launch, those observations carry over with thread-level evidence intact but no atomic-level evidence (spec §11.4).

**The H6 First Nations question is sensitive.** The distributed approach in spec §2.3 is the architectural decision. Implementation should be reviewed with First Nations education consultation before atoms in this area are authored. Treat as a content-pause, not an architecture-pause.

**Spec §11.2 incompleteness.** The spec table omits C2 explicitly. C2 → Domain 11 should be added to a v2 spec amendment.

**EF taxonomy correction.** v1 placed EF6 Collaboration & Teamwork under Executive Function. v2 corrects this — collaboration is relational, not executive — and re-homes it to Domain 14. This is a substantive taxonomic correction, not a cosmetic rename, and is the most significant single thread relocation in the migration.

---

## Authoring sequence implication

Phase 2 (Foundational stage-band content per spec §13.1) needs:

1. Domains with mostly-direct v1 successors (1, 2, 3, 5, 10, 11, 15) — author Foundational stage-band first; observation re-tagging is automatic.
2. Domains with substantial splits or re-homes (6, 13, 14) — author with careful atom-level reclassification logic for v1 observation migration.
3. Net-new domains (4, 7, 8, 9, 12) — author from scratch. No v1 observation re-tag burden. Foundational stage-band priority on the threads most needed by Phase 2 packs (Jumpstart Classical drives Domain 7, 8, 9 priority; Starter Pack v3 drives Domains 1, 2, 3, 5).

---

## Open items for Drew's review

1. **H5 vs H2 distinction.** Are these two genuinely separate threads or should one absorb the other? Author note above recommends keeping both with tightened scope.
2. **C3 split allocation.** Confirm: literary engagement with poetry → Domain 6; performative recitation → Domain 11. Or alternative split?
3. **C6 split allocation.** Physical making → Domain 12; design-thinking process → Domain 4. Or keep design-thinking under Domain 12 with light Domain 4 cross-reference?
4. **PS5 placement.** Environmental Stewardship in Domain 13 (ethical) feels right, but could equally sit in Domain 5 (geographic understanding) or Domain 3 (science). Confirm Domain 13 primary.
5. **EF5 split ratio.** Most of v1 EF5 is informal critical thinking — confirm Domain 13 as primary placement with Domain 8 carrying the formal logic atoms only.
6. **H6 First Nations distribution.** Sign off on the distributed approach or pause for consultant input before any First Nations content authoring.
7. **The v2 spec §11.2 omission of C2.** Should this be propagated back into a spec amendment, or recorded only here?

---

*This migration table is the substantive bridge between the v1 library and v2 Universe content authoring. It does not enumerate every atom — atom authoring is the Phase 2+ content build that follows from this table. Update this document if Drew's review revises any mapping; that triggers a v2 of this file, not an in-place edit.*
