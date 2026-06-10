<!-- Version: 1 | Date: 2026-05-13 | Changes: Initial canonical architecture document for the full Hearth pedagogy system. Synthesises and supersedes the architectural framing in hearth-pedagogy-integration-framework.md. Sits above and references the component-specific specs (engine, knowledge base, lens bundle). Captures decisions from the 2026-05-13 architecture session: interpretive-not-prescriptive scope discipline, Interpretive Patterns reframe, lensAccumulatedSignals on FIS, methodAffinity on modules, tag-match recommender loop. -->

# Hearth Pedagogy System — Architecture

> **Status:** Canonical. This is the top-level architectural document for the methodology layer of Hearth. The component-specific specs referenced below go deeper on individual layers; this document is the map.
>
> **Authority chain:** This doc supersedes the architectural framing in `hearth-pedagogy-integration-framework.md` (which remains useful as a reference for voice-per-philosophy and historical context, but is no longer the canonical map). Component specs (`hearth-pedagogy-engine-spec-v1.md`, `hearth-pedagogy-knowledge-base-architecture-v1.md`, `hearth-pedagogy-lens-bundle-v1.md`) remain canonical for their respective layers.
>
> **Priority:** Foundational. Any future change to how Hearth handles methodology should be measured against this document.

---

## 1. The Frame

The methodology layer's job is one sentence:

> **Hearth makes its catalogue legible to a family in the voice of their tradition, and lets the family's accumulated reads inform what gets surfaced next.**

The methodology layer is **interpretive, not prescriptive.** It does not steer the curriculum. It teaches the parent to see through their tradition's eyes, and it makes the platform's surfacing behaviour responsive to what the parent has been seeing.

The user journey it serves:

> **Moment → moment surfaced in the Logger → observation presented to the parent → activity selection and marketplace picking up the clew → next moment.**

The thread is laid by the parent's lived practice. The platform makes the thread visible. The parent pulls it.

### What this rules out

The methodology layer does not produce content. It does not branch modules into reactive trees. It does not generate forward task lists. It does not schedule the parent's week. It does not adapt the curriculum at run-time. None of those are things the architecture can honour, and pretending otherwise produces commodity AI output and breaks parent trust.

### What this enables

A parent who chooses Charlotte Mason at onboarding gets, over weeks and months:

- Logger insights that read their entries through Mason's eyes, grounded in Mason's own words
- Module Experience surfaces that frame what they're doing in CM vocabulary and posture
- Observation cues that highlight what CM considers evidence of learning
- A catalogue that surfaces more of the modules that have CM affinity, more often, as their accumulated lens-signals stack up

What the parent gains is **fluency in their tradition.** By month three they're producing CM-shaped next-moves themselves without the platform generating them. That is the win state.

---

## 2. The Six Pedagogies

Hearth supports six pedagogies. Five are major recognised traditions; the sixth is the multi-lens fallback.

| Key | Name | Tagline | Role |
|---|---|---|---|
| `charlotte_mason` | Charlotte Mason | Children are born persons, fed with living ideas | Nature study, narration, living books, habit training |
| `classical` | Classical | The mind is trained through the Trivium stages | Grammar/Logic/Rhetoric stages, memory work, great books |
| `montessori` | Montessori | The child constructs themselves through purposeful work | Prepared environment, sensitive periods, self-directed work |
| `waldorf` | Waldorf / Steiner | The child unfolds in stages, nourished by imagination | Rhythm, imagination, delayed academics, head-heart-hands |
| `unschooling` | Unschooling | Children learn naturally when trusted to follow their interests | Interest-led, no formal curriculum, deschooling, strewing |
| `eclectic` | Eclectic | We draw consciously from multiple traditions | Multi-lens fallback; surfaces 2–3 perspectives per surface |

Reggio Emilia was removed from v1 (decision 17 March 2026). Reggio's strengths overlap heavily with documentation-as-pedagogy themes that Hearth's Portfolio and Constellation surfaces already serve well, and the tradition's adoption rate in Australian homeschool contexts is too thin to justify a sixth distinct corpus.

### Eclectic handling

Eclectic is the system-wide fallback grammar. When the family selects Eclectic, or when a Lens Bundle field is absent for the family's chosen tradition, the runtime falls back to Eclectic. Eclectic surfaces present 2–3 perspectives per moment, drawn from the same per-tradition Bundles.

Eclectic is not a separate corpus. It is multi-lens retrieval from the existing five corpora. The Pedagogy Engine wizard's Eclectic card carries an honest caveat: *"Eclectic requires more synthesis — some of all means less depth in each tradition."* This is informed consent, not discouragement.

---

## 3. The Seven Layers

**Why the parent cares (read this before the table).** None of these layers is visible to the parent as a layer. What she experiences is: the platform speaks her tradition's language when it reflects her day back to her (a Charlotte Mason family hears "narration," not "comprehension check"), and over months the catalogue quietly starts feeling *curated for how her family actually works* — without ever telling her what to do next. A first-year parent like Mei-Lin (`hearth-pilot-personas-v1.md`) gets fluency in a tradition she's still learning; a veteran like Bec gets a system that keeps up with thinking she already does. The seven layers below exist to deliver exactly that and nothing more — which is why the architecture forbids the system from scheduling, branching, or prescribing (C-PA1: the platform makes the thread visible; the parent pulls it).

The methodology layer is implemented as seven distinct architectural layers, each doing one job. The layers communicate via well-defined interfaces (mostly the Family Intelligence Snapshot and the Sanity content schema). No layer reaches across boundaries.

| # | Layer | Where it lives | Role |
|---|---|---|---|
| 1 | Family Pedagogy Profile | PostgreSQL (JSONB on `families`) | Family's configuration: which tradition, which values, which practices |
| 2 | Pedagogy Knowledge Base (corpus) | Sanity CMS + pgvector | Source material grounding all interpretive output |
| 3 | Pedagogy Lens Bundle | Sanity CMS (per module per pedagogy) | Content-time-baked interpretation for each module |
| 4 | Per-screen overlay behaviours | Runtime templates + FIS | Vocabulary swaps, sort biases, prompt variations on individual screens |
| 5 | Lens Accumulated Signals | PostgreSQL (on FIS, per child) | Trace of what the family has been doing, classified by Interpretive Patterns |
| 6 | Method Affinity (supply-side tags) | Sanity CMS (on modules) | Which traditions and Interpretive Patterns each module satisfies |
| 7 | Tag-match recommender loop | PostgreSQL read-time query | Overlap scoring between accumulated signals and method affinity at Discovery / Planner / Marketplace |

The first four are about *interpretation* — they shape what the parent sees and hears. The last three are about *surfacing* — they shape what the platform offers next. The bridge between the two halves is the Logger save event: each save updates Layer 5, which feeds Layer 7's next read.

The rest of this document goes layer by layer.

---

## 4. Layer 1 — Family Pedagogy Profile

**Canonical spec:** `hearth-pedagogy-engine-spec-v1.md`

The profile captures three things, in priority order:

- **Philosophy** (1 selection) — the foundational tradition, or Eclectic
- **Values** (up to 5, prioritised) — what matters most when traditions conflict on a Tuesday afternoon
- **Practices** (up to 5, prioritised) — daily rhythms the family wants to use

The profile is set during onboarding via a one-time wizard, with editable access from Family Settings thereafter. Skipping is permitted; a skip is treated as de facto Eclectic at runtime.

### Storage

PostgreSQL, as a JSONB column on the `families` table (or a dedicated `family_pedagogy_profiles` table — implementation choice for the schema architect). NOT in Sanity. Sanity holds the catalogue of philosophy / value / practice definitions; the family's selections are user data.

### Runtime consumption

The profile is loaded as part of the Family Intelligence Snapshot. Screens that overlay-interpret content read it from the cached FIS, not from a fresh DB query per page load. When the profile is updated in Settings, the FIS is invalidated and regenerated asynchronously.

### What the profile does NOT contain

The profile does not contain learned preferences. Those live on the FIS as Lens Accumulated Signals (Layer 5). The profile is the family's stated identity; the signals are the platform's observed evidence of it. Keeping them separate matters: the parent can edit who they say they are, the platform records what they have actually been doing, and the surfacing logic uses both as inputs.

---

## 5. Layer 2 — Pedagogy Knowledge Base (corpus)

**Canonical spec:** `hearth-pedagogy-knowledge-base-architecture-v1.md`
**Status:** Charlotte Mason corpus partially built; Unschooling corpus planned via commissioned practitioner essays; other four pedagogies not yet started.

The PKB is the source material that grounds every interpretive output Hearth produces. Without it, the lens collapses to vocabulary substitution. With it, the lens can quote Mason on the act of attention while reading a parent's nature walk log, attributed and contextualised.

### Corpus structure — five layers per pedagogy

| Layer | Purpose | Target volume |
|---|---|---|
| Source Excerpts | Direct passages from the tradition's foundational texts, tagged for retrieval | ~30 per pedagogy |
| **Interpretive Patterns** | How the tradition *reads* common parenting / learning situations | **~8 per pedagogy (Wave 1)** |
| Observational Markers | Tagged mappings between the tradition's evidence priorities and Hearth's capability threads | 6 per pedagogy |
| Facilitation Vocabulary | The operational grammar of how the parent intervenes, in the tradition's own language | 1 structured doc per pedagogy |
| Contraindications & Tensions | What the tradition explicitly warns against; where it disagrees with other traditions Hearth supports | ~8 per pedagogy |
| Worked Examples | Composite Logger-style entries with the tradition's authentic interpretation | ~20 per pedagogy |

### The Interpretive Patterns reframe (2026-05-13 decision)

This layer was previously named **Practice Patterns** and was scoped to ~15 per pedagogy, framed as "operational guidance the tradition itself has authored" for specific triggers. That framing produced output that crossed the interpretive/prescriptive line — telling parents what to do in specific situations rather than how to read those situations.

The reframe:

- **Renamed** to Interpretive Patterns.
- **Scope tightened** from "what the tradition does when X happens" to "how the tradition *reads* what's happening when X happens."
- **Target volume halved** from ~15 to ~8 per pedagogy for Wave 1, prioritising patterns that are *diagnostic* — patterns that fire on identifiable Logger entry shapes, classifying the moment in a way that's useful both for interpretation and for the Accumulated Signals tally (Layer 5).
- **Double duty:** each Interpretive Pattern is now both a retrieval source for Logger insight generation *and* a classifier ID that gets tallied into the family's accumulated signal. The eight chosen need to be the eight that classify well, not just the eight that read well.

Patterns that exist as prose only — that tell the parent what to do without a diagnostic shape — should be cut or rewritten. The CM corpus has at least one such pattern (PP-CM-006 "parent wants to measure progress") that should be reviewed under the new frame.

### Storage and retrieval

- **Sanity CMS** holds the authored documents. Editorial workflow, publish/draft states, human review gates. Source of truth.
- **PostgreSQL with pgvector** holds the embedding index for retrieval. Embeddings are generated at content publish time from Sanity; the pgvector index is rebuilt as content publishes. Embedding model: `text-embedding-3-small` at 1536 dimensions.

Retrieval is used at content-time (Lens Bundle generation) and at write-time (Logger insight generation). Never at read-time.

### Corpus update behaviour

Per the canonical PKB spec: corpus updates are **append-mostly.** Removing or significantly editing a Source Excerpt that's already cited by existing Lens Bundle provenance breaks the audit trail. New material added to the corpus benefits new modules created after the addition; existing modules retain their original Bundles. No remake mechanism in v1.

---

## 6. Layer 3 — Pedagogy Lens Bundle

**Canonical spec:** `hearth-pedagogy-lens-bundle-v1.md`

The Bundle is the content-time-baked artefact that makes each module legible in each tradition. One Bundle per `(moduleId, pedagogyKey)` pair, generated at module save (parent-built) or content publish (curated). Baked into the module document in Sanity. Read at runtime; no LLM call at read-time.

### Bundle composition (five fields, all optional)

| Field | Purpose |
|---|---|
| `whyThisMatters` | Module-specific framing of why this learning matters in this tradition (90–120 words) |
| `facilitationNote` | What the parent in this tradition actually does during this activity (2–3 sentences) |
| `observationCues` | What this tradition's eye picks out in this activity (up to 3 items) |
| `questionOverlay` | What to notice on the next encounter **with this same module's content** (per-tradition grammar) |
| `evidencePriorities` | Which of the module's capability threads this tradition reads as carrying the most weight (up to 5) |

### Honest density (the editorial core)

Pedagogies have legitimate strengths and weaker overlaps with different module types. A Bundle with three filled fields of genuine substance is preferable to a Bundle with five fields padded to fit a schema. The generation prompt instructs the Kindler to skip fields where the tradition has no distinctive view. Validation enforces this with two checks: the banned-phrase test (commodity AI patterns rejected) and the cross-field similarity test (Bundles where every filled field reads as paraphrase of the same underlying chunk get rejected).

What this looks like in practice: a Charlotte Mason Bundle for a nature observation module will fill all five fields richly. A Classical Bundle for the same module will fill two or three. A Waldorf Bundle for a Year 1 taxonomy memorisation module will be sparse and may fall back to Eclectic for several fields — the tradition genuinely doesn't have much to say about that activity at that age. **Sparse output is the system working as designed, not failing.**

### The forward-prescription guard (2026-05-13 decision)

The Bundle validation pipeline gets a new check alongside the existing banned-phrase and cross-field similarity tests:

**Forward-prescription guard.** Reject Bundles where any field contains imperative forward-direction language that implies content the module doesn't contain. Patterns to flag include: *"next, switch to..."*, *"tomorrow do..."*, *"follow this with..."*, *"a good next module is..."*, and similar. The tradition can caution, redirect within the moment, and point at existing structure — it cannot generate forward content paths.

The `questionOverlay` field is the highest-risk field for this kind of drift. Its scope is now explicit: "what to notice on the next encounter with this same module's content." Within-module, not cross-module.

### Generation scope

- **Parent-built modules:** Bundle generated at save for the family's pedagogy only (~1 Haiku call, ~3K tokens). Other pedagogies generated lazily on marketplace publish.
- **Curated content:** All six pedagogies generated at content publish, per activity for hand-curated packs (richest density), per module for agent-produced packs.
- **Agent-produced content:** All six pedagogies, flagged `lensStatus: needs_review` until human-confirmed in the admin Content QA queue.

### Surface mapping

Each Bundle field maps to a specific Module Experience surface:

| Bundle field | Module Experience surface |
|---|---|
| `whyThisMatters` | Prep mode → "Why This Matters" panel |
| `facilitationNote` | Facilitate mode → header above activity steps |
| `observationCues` | Log mode → prompt list above the description field |
| `questionOverlay` | Prep panel → "What to notice next" + Planner card expansion |
| `evidencePriorities` | Constellation node detail → highlight when filtered to this module |

The mapping lives as a Sanity singleton (`pedagogyLensSurfaceMap`) so surfaces can evolve without a Kindler-side change.

---

## 7. Layer 4 — Per-screen overlay behaviours

**Reference:** `hearth-pedagogy-engine-spec-v1.md` Section 8

Beyond the per-module Lens Bundle, several screens carry lighter-weight pedagogy texture that doesn't require module-specific generation. These are template-driven, sourced from Sanity, interpolated at runtime against the family profile.

| Screen | Overlay behaviour |
|---|---|
| Dashboard | Greeting templates use vocabulary from the family's tradition. "Welcome to your morning rhythm" (Waldorf) vs "Your feast of living ideas awaits" (CM). Templates only; not generated. |
| Activity Discovery | Sort order biases toward modules with high methodAffinity to family profile (Layer 7). Card descriptions use tradition-appropriate language. |
| Retrospective Logger | AI insight panel — the primary overlay surface. Philosophy lens generates 2–3 interpretation sentences at write-time, using PKB retrieval. The single largest interpretive surface. |
| Weekly Planner | Suggestion language adapts to tradition. Sort order shares ranker logic with Discovery. |
| Capabilities Constellation | Observation Markers (PKB Layer 3) influence which threads are highlighted as growing for this family. |
| HEU / Learning Report | Narrative templates use tradition vocabulary where appropriate; capability data is tradition-neutral. |

### What stays out

- **Module content itself** — never tradition-flavoured at the data layer. Modules are philosophy-neutral. Overlay happens at the surface, not the source.
- **Capability thread definitions** — neutral. The lens shapes which threads get *highlighted*, never what threads *exist*.
- **Curriculum mapping** — Australian Curriculum V9 mapping is a backend concern. UI shows capability threads and plain-language descriptors only.

---

## 8. Layer 5 — Lens Accumulated Signals

**Canonical spec:** to be written (`hearth-lens-loop-architecture-v1.md` — see Section 13 below).

This is the most recent architectural addition (2026-05-13 decision) and the bridge between interpretation and surfacing.

### What it is

A per-child field on the Family Intelligence Snapshot capturing the trace of what the family has been doing, classified by the Interpretive Patterns the Logger's Haiku enrichment matches at write-time. Plain counts, with timestamps for optional decay logic later.

### Data shape (illustrative)

```javascript
lensAccumulatedSignals: {
  // Per Interpretive Pattern match counts
  interpretivePatterns: {
    'IP-CM-001': { count: 7, lastFired: '2026-05-11T...' },  // child_deeply_interested
    'IP-CM-003': { count: 3, lastFired: '2026-05-10T...' },  // nature_observation
    'IP-MO-002': { count: 1, lastFired: '2026-05-09T...' },  // self_directed_concentration
    // ...
  },

  // Aggregated activity shape tags from the Logger pipeline
  activityShapes: {
    'nature-observation': 12,
    'narration': 8,
    'building-construction': 5,
    'read-aloud': 7,
    // ...
  },

  // Capability threads receiving evidence
  capabilityThreadsTouched: {
    'S1': 9, 'L1': 11, 'C3': 4, // ...
  },

  updatedAt: '2026-05-11T...'
}
```

### How it's written

The signals are written as part of the existing Logger save Haiku call, not as a separate LLM operation. The same call that produces the insight prose also outputs a small structured trace block: which Interpretive Patterns this entry matched, which activity shape it carried, which capability threads it provided evidence for. The marginal token cost is small (~500–1000 tokens per save). Zero read-time cost.

This honours the two-layer AI rule absolutely: **one Haiku call per Logger save, all read-time surfaces read from snapshots, no new LLM calls anywhere downstream.**

### What it does NOT contain

- Stated preferences (those are on the profile, Layer 1)
- Wizard-set values or practices (also on the profile)
- Forward predictions or recommendations (those are computed at read-time from this + Layer 6)

Layer 5 is observed evidence. Layer 1 is stated identity. The two are kept separate deliberately. They each become inputs to Layer 7's ranker.

### Relationship to the deprecated `observedPatterns` profile field

The Pedagogy Engine spec's `observedPatterns` sub-object on the profile (`approachesThatResonate`, `sessionLengthPreference`, `currentInterests`) is superseded by Layer 5. That field can be deprecated in a future engine spec revision; for now, leave it in the schema (it costs nothing) and don't write to it. The canonical home for the trace is the FIS.

---

## 9. Layer 6 — Method Affinity (supply-side tags)

**Canonical spec:** to be written (`hearth-lens-loop-architecture-v1.md`).

The supply-side counterpart to Layer 5. Where Accumulated Signals capture what the family has been doing, Method Affinity captures what each module *offers* in tradition-readable terms.

### What it is

A new field on the Sanity module schema:

```javascript
methodAffinity: {
  // Which pedagogies read this module favourably
  pedagogies: ['charlotte_mason', 'classical'],

  // Which Interpretive Patterns this module is well-suited to satisfy
  interpretivePatterns: ['IP-CM-001', 'IP-CM-003', 'IP-CL-002'],

  // Activity shape tags
  activityShapes: ['nature-observation', 'narration'],

  // Capability threads strongly served
  primaryCapabilityThreads: ['S1', 'L1'],
}
```

### Three reasonable specificity options

The richer the affinity tagging, the better the ranker can match — at the cost of more authoring work. Options, increasing in richness:

1. **Pedagogy keys only.** Coarse. Six values per module.
2. **Pedagogy keys + Interpretive Pattern IDs.** Medium. Recommended for v1 — matches the granularity of what Layer 5 can produce cleanly at write-time.
3. **Pedagogy keys + Pattern IDs + activity shapes + primary threads.** Rich. Recommended only when usage data shows option 2 is too coarse.

**v1 decision: Option 2.** Pedagogy keys plus Interpretive Pattern IDs. This matches Layer 5's classification granularity and avoids authoring debt that won't pay off until the catalogue is much larger.

### How it's authored

Two paths, depending on module origin:

- **Hand-curated content (Starter Pack, future curated packs):** Content Studio team authors `methodAffinity` as part of the module's metadata. One pass per module. The Kindler's Lens Bundle generation can suggest pattern matches based on which corpus chunks it grounds against, leaving the editor to confirm or refine.
- **Parent-built modules:** Inferred from the Bundle generation pass. Whichever Interpretive Patterns the Kindler retrieved heavily during Bundle generation are recorded as affinities. Quiet, automatic, no parent-facing surface.
- **Agent-produced content:** Generated and flagged for human review, same as Bundle handling.

### What's NOT in this field

- Age ranges, time estimates, materials lists — those are already on the module schema, separately
- Recommendation scores — those are computed at read-time, not stored
- Family-specific data — methodAffinity is supply-side and universal

---

## 10. Layer 7 — The tag-match recommender loop

**Canonical spec:** to be written (`hearth-lens-loop-architecture-v1.md`).

The final layer. Where the accumulated signal meets the affinity tag and the catalogue gets re-ordered for this family, at this moment, based on what they've actually been doing.

### What it is

A plain overlap-scoring function. For each candidate module surfaced at Discovery, Planner, or Marketplace:

```
score = overlap(family.lensAccumulatedSignals, module.methodAffinity)
```

Higher overlap → higher rank. That's the whole mechanism. No LLM call. No vector index for this step (the embedding index is for content-time retrieval into the PKB only). Just PostgreSQL JSONB matching against indexed Sanity content, sorted descending.

### Why this — not a vector ranker, not a learned model

For a curated catalogue at beta scale, tag-match is the right architecture. It is:

- **Debuggable.** A parent or admin can see exactly why a module got ranked where it did. The reasons are tags.
- **Explainable.** The system can produce a one-line "we surfaced this because you've been doing a lot of nature observation lately" when warranted.
- **Cheap.** Zero LLM cost, zero new infrastructure beyond the FIS field and the Sanity tag block.
- **Honest.** It claims to do exactly what it does. No black-box machine-learning aura.

Vector embeddings, decay weighting, exploration budgets — those are mature-recommender features that solve problems Hearth doesn't yet have. Defer all of them until usage data shows the need.

### Where the ranker fires

- **Activity Discovery** — primary surface. The browse experience for the catalogue.
- **Weekly Planner** — suggestion ordering when surfacing options for an empty slot.
- **Marketplace** — pack-level affinity (an aggregation of module-level affinity) influences pack ordering.
- **Dashboard "next steps" surfaces** — same logic, smaller surface.

### What the ranker does NOT do

- Push modules into a parent's library without consent. Surfacing ≠ adopting.
- Reactively shift the order of modules *inside* a pack the family is already doing. Pack internal sequence is the content author's decision.
- Generate explanations using LLM. The "why we surfaced this" line is template-filled from tag overlap, not Haiku-generated.
- Modify the parent's stated profile (Layer 1) based on signals. The profile is what they said; the signals are what they did. They're related but never written to from each other.

### Filter-bubble and cold-start handling

Filter bubble risk is small at beta scale with a curated catalogue. Defer the exploration-budget question until usage data shows it's needed. If the loop starts behaving as a filter, the fix is a reserved percentage of surfaced slots for adjacent or outside-cluster modules — a simple rule, added later.

Cold start (new family, empty signals): the profile alone (Layer 1) provides enough signal to rank by pedagogy match. Modules whose `methodAffinity.pedagogies` includes the family's selected tradition rank higher; everything else by neutral ordering. No new family ever sees a useless ranked catalogue.

---

## 11. The write-time / read-time discipline

A single rule governs the entire stack:

> **One Haiku call per Logger save. All read-time surfaces read from pre-computed snapshots. No new LLM calls anywhere downstream.**

This rule is non-negotiable and applies to every layer of the methodology system. The table below shows where AI calls occur and where they explicitly do not:

| Operation | When | Cost |
|---|---|---|
| Lens Bundle generation | Content-time, on module save (parent-built) or publish (curated) | ~3K tokens per pedagogy per module |
| Logger insight + signal classification | Write-time, on Logger save | ~3K tokens per save (insight + signal block in one call) |
| FIS rebuild after Logger save | Async background job | Zero LLM tokens — aggregation only |
| Pedagogy profile save | On wizard completion or Settings edit | Zero LLM tokens |
| Activity Discovery / Planner / Marketplace ranking | Read-time, on screen load | Zero LLM tokens — tag-match query |
| Bundle field rendering on Module Experience | Read-time, on screen load | Zero LLM tokens — pre-baked content |
| Constellation thread highlighting | Read-time, on screen load | Zero LLM tokens — FIS-driven |

**Two places in the codebase should call `api.anthropic.com`:** the Logger write-time enrichment service, and the content-time Lens Bundle generation service. Anywhere else is an architectural violation.

---

## 12. The Honest Density Principle

This principle governs the entire interpretive output of the system, not just the Lens Bundle. It is stated once here because it applies everywhere.

> **Producing fewer fields with genuine tradition-grounded substance is preferable to producing more fields with thin generic substance.**

Where the tradition has a strong view, the lens speaks at length. Where the tradition has a weak or absent view, the lens falls silent or falls back to Eclectic for that particular surface. Validation enforces this with two checks (banned-phrase test and cross-field similarity test).

The principle exists to prevent the most insidious failure mode: AI output that *looks* tradition-shaped but reads, on examination, as generic praise dressed in vocabulary. A Waldorf Bundle for a 7-year-old's mammal-vs-reptile memorisation breakthrough that confidently fills five fields with celebration is *worse* than one that fills two fields honestly (or none, falling to Eclectic).

The parent experiences honest density as: *"My tradition has something to say here, and it's worth reading. When my tradition is quiet, it's because it's not its moment."* This is a more credible voice than the alternative.

---

## 13. What this system does NOT do

A list of things the architecture explicitly excludes, to keep the scope honest:

- **Branch module trees reactively.** Modules are deterministic. The system does not generate new activities in response to a parent's logged moment.
- **Generate forward task lists in tradition-flavoured prose.** No "next, do this." No "tomorrow's lesson should be." The lens interprets the present; it does not script the future.
- **Schedule the family's week.** The Weekly Planner is a parent-operated surface. The ranker can suggest ordering; it does not auto-fill the calendar.
- **Cross-pollinate signals between children.** Each child on the FIS has their own `lensAccumulatedSignals`. Signals are per-child, not family-aggregated, because two siblings can be at completely different points in their relationship with a tradition.
- **Override the parent's stated profile based on observed signals.** The system never silently re-classifies a family from CM to Classical because their signal pattern looks more Classical. The profile is the parent's statement of who they are; signals inform surfacing, not identity.
- **Make read-time AI calls of any kind.** Not for insight regeneration, not for "freshen up" passes, not for personalised explanations. Everything served at read-time is pre-computed.
- **Generate philosophy-specific content at the module layer.** Modules are philosophy-neutral. Philosophy overlay is a separate, runtime concern.
- **Apply Australian Curriculum mapping as a parent-facing concept.** ACV9 mapping is a backend concern for the HEU report and Learning Report surfaces only. UI shows capability threads and plain-language descriptors only.

---

## 14. Data flow — the closed loop

```
                                          ┌──────────────────────────────┐
                                          │   1. PARENT LOGS A MOMENT    │
                                          │   (Retrospective Logger)     │
                                          └──────────────┬───────────────┘
                                                         │
                                                         ▼
                              ┌──────────────────────────────────────────────────┐
                              │  2. SINGLE HAIKU CALL (write-time)               │
                              │  - Generates insight prose (Logger panel)        │
                              │  - Classifies entry against Interpretive         │
                              │    Patterns (using PKB retrieval)                │
                              │  - Outputs structured signal block               │
                              │  - Maps capability thread evidence               │
                              └──────────────────┬───────────────────────────────┘
                                                 │
                                                 ▼
                              ┌──────────────────────────────────────────────────┐
                              │  3. FIS REBUILD (async, no LLM)                  │
                              │  - lensAccumulatedSignals updated (Layer 5)      │
                              │  - Capability thread state updated               │
                              │  - Other snapshot fields updated                 │
                              └──────────────────┬───────────────────────────────┘
                                                 │
                                                 ▼
                              ┌──────────────────────────────────────────────────┐
                              │  4. OBSERVATION SURFACES TO PARENT (read-time)   │
                              │  - Logger insight panel (the immediate read)     │
                              │  - Dashboard summary, Constellation, Portfolio   │
                              │    (the next-visit reads)                        │
                              └──────────────────┬───────────────────────────────┘
                                                 │
                                                 ▼
                              ┌──────────────────────────────────────────────────┐
                              │  5. NEXT-MODULE SURFACING (read-time, no LLM)    │
                              │  - Activity Discovery / Planner / Marketplace    │
                              │  - Tag-match: lensAccumulatedSignals against     │
                              │    each module's methodAffinity                  │
                              │  - Higher overlap → higher rank                  │
                              └──────────────────┬───────────────────────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────────────────────┐
                                          │   6. PARENT PICKS NEXT       │
                                          │   MODULE → does it →         │
                                          │   logs another moment        │
                                          └──────────────┬───────────────┘
                                                         │
                                                         └─→ loop closes
```

Each pass through the loop deposits more signal, sharpens the surfacing, and feeds the parent's developing fluency in their tradition.

---

## 15. Decisions resolved by this document

| Decision | Resolution | Source |
|---|---|---|
| Should the methodology layer be reduced or rescoped given the scope tightening? | No reduction; reframe. Five corpus layers safe; one (Practice Patterns → Interpretive Patterns) reframed and halved. | 2026-05-13 architecture session |
| What does the methodology layer claim to do? | Make the catalogue legible in the family's tradition; let accumulated reads inform surfacing. Not curriculum branching. | 2026-05-13 architecture session |
| How does forward-direction get prevented in Bundle output? | Forward-prescription guard added to Bundle validation pipeline. `questionOverlay` scope tightened to within-module. | 2026-05-13 architecture session |
| Where do accumulated signals live? | On the FIS (`lensAccumulatedSignals`), per child. Not on the profile. | 2026-05-13 architecture session |
| How does the loop close from observation back to next-content surfacing? | Tag-match recommender: `lensAccumulatedSignals` × `methodAffinity` overlap scoring at Discovery / Planner / Marketplace. No LLM. | 2026-05-13 architecture session |
| What's the affinity tag granularity for v1? | Option 2: pedagogy keys + Interpretive Pattern IDs. | 2026-05-13 architecture session |
| Is the `observedPatterns` sub-object on the profile still needed? | Superseded by Layer 5. Leave the field; don't write to it; deprecate in a future engine spec revision. | 2026-05-13 architecture session |
| How are filter-bubble and decay handled? | Defer both until usage data shows the need. Simple rules added later if required. | 2026-05-13 architecture session |
| Number of supported pedagogies | 5 distinct (CM, Classical, Montessori, Waldorf, Unschooling) + Eclectic as fallback. Reggio removed. | 17 March 2026 decision |
| Two-layer AI rule applied to methodology | One Haiku call per Logger save; all downstream methodology surfaces read from snapshots. | `Hearth_AI_Intelligence_Layer_Architecture.md` |
| Single philosophy selection, not multiple | One philosophy or Eclectic. No multi-select. | `hearth-pedagogy-engine-spec-v1.md` |
| Profile storage | PostgreSQL JSONB. Sanity holds catalogue definitions only. | `hearth-pedagogy-engine-spec-v1.md` |
| Corpus update behaviour | Append-mostly. Existing Bundles are not regenerated when corpus is updated. | `hearth-pedagogy-knowledge-base-architecture-v1.md` |

---

## 16. Open items / deferred

| Item | Status | Notes |
|---|---|---|
| Lens loop architecture spec (`hearth-lens-loop-architecture-v1.md`) | Spec needed | Captures Layer 5, Layer 6, Layer 7 implementation detail. Blocked on PKB Wave 1 corpus completion (need final Interpretive Pattern IDs before locking signal schema). |
| PKB corpora for Classical, Montessori, Waldorf | Not started | Charlotte Mason partially built; Unschooling planned via commissioned essays. Pattern selection for these corpora should follow the new diagnostic-first principle. |
| CM corpus audit against new Interpretive Patterns frame | Needed | At least one existing Practice Pattern (PP-CM-006) likely crosses the prescriptive line. Net reduction expected. |
| Bundle field count revisit | Deferred | `evidencePriorities` is the weakest of the five Bundle fields. If content-time cost becomes tight, it's the candidate to drop. Don't change pre-emptively. |
| Filter-bubble exploration budget | Deferred | Implement if/when usage data shows the loop is trapping families. |
| Signal decay weighting | Deferred | Implement if/when staleness becomes a problem. |
| Per-facilitator pedagogy (two-parent families with different traditions) | Out of scope | Resolved by Eclectic at the family level. |
| `observedPatterns` field deprecation on profile | Cosmetic | Leave field; don't write; mark deprecated in next engine spec revision. |
| Cross-pedagogy "stretch" surfacing | Out of scope | A future version might deliberately surface adjacent traditions to broaden a family's repertoire. Not v1. |
| Projects (vs. modules) Bundle treatment | Deferred | Projects warrant their own Bundle spec; schema and surface mapping differ. Flagged for follow-up. |

---

## 17. Cross-references

### Canonical component specs

| File | Layer covered |
|---|---|
| `hearth-pedagogy-engine-spec-v1.md` | Layer 1 (Family Pedagogy Profile) |
| `hearth-pedagogy-knowledge-base-architecture-v1.md` | Layer 2 (PKB corpus) |
| `hearth-pedagogy-knowledge-base-decisions-addendum-v1.md` | Layer 2 (decisions) |
| `hearth-pedagogy-corpus-charlotte-mason-v1.md` | Layer 2 (CM corpus content) |
| `hearth-pedagogy-lens-bundle-v1.md` | Layer 3 (Lens Bundle) |
| `hearth-lens-loop-architecture-v1.md` | Layers 5, 6, 7 (spec needed) |

### Architectural foundations

| File | Why it matters here |
|---|---|
| `Hearth_AI_Intelligence_Layer_Architecture.md` | The two-layer AI rule that governs every layer of this system |
| `hearth-alpha-use-case-verification-v1.md` | UC5 (two-layer AI integrity) and UC6 (pedagogy-shaped surfaces) |
| `hearth-pack-data-architecture-v1.md` | Where methodAffinity will be added to the Sanity module schema |
| `hearth-decisions-log-v1.md` | All decisions referenced in Section 15 should appear here |
| `hearth-founding-brief-v1.md` | The "professional pedagogical frameworks accessible to homeschooling parents" mission this entire system serves |

### Older/historical reference

| File | Status |
|---|---|
| `hearth-pedagogy-integration-framework.md` | Architectural framing superseded by this document. Useful historical reference for voice-per-philosophy detail and original integration thinking. Do not treat as canonical map. |

---

## 18. Glossary

| Term | Meaning |
|---|---|
| **Family Pedagogy Profile** | The family's stated philosophical identity: chosen tradition + prioritised values + prioritised practices. Layer 1. |
| **Pedagogy Knowledge Base (PKB)** | The structured corpus per tradition that grounds all interpretive output. Layer 2. |
| **Source Excerpts** | Direct passages from the tradition's foundational texts. PKB layer. |
| **Interpretive Patterns** | How the tradition *reads* common situations. Renamed from Practice Patterns. PKB layer; also doubles as classifier IDs in Layer 5. |
| **Observational Markers** | Tagged mappings between the tradition's evidence priorities and Hearth's capability threads. PKB layer. |
| **Facilitation Vocabulary** | The operational grammar of how the parent intervenes, in the tradition's own language. PKB layer. |
| **Contraindications & Tensions** | What the tradition warns against; where it disagrees with other traditions. PKB layer. |
| **Worked Examples** | Composite Logger-style entries with the tradition's authentic interpretation. PKB layer. |
| **Pedagogy Lens Bundle** | Content-time-baked interpretation of a module in a tradition. Five fields. Layer 3. |
| **Honest Density** | The principle that legitimate sparse output is preferable to padded thin output. |
| **Lens Accumulated Signals** | Per-child trace on the FIS of which Interpretive Patterns have fired, which activity shapes have been logged, which threads have received evidence. Layer 5. |
| **Method Affinity** | Supply-side tag block on each Sanity module: which pedagogies and Interpretive Patterns this module satisfies. Layer 6. |
| **Tag-match recommender** | The plain overlap-scoring function that ranks catalogue surfaces by `lensAccumulatedSignals` × `methodAffinity`. Layer 7. |
| **Family Intelligence Snapshot (FIS)** | Per-family pre-computed JSONB document in PostgreSQL. All read-time surfaces consume from this. |
| **Forward-prescription guard** | Validation check on Bundle output that rejects fields containing imperative forward-direction language implying content the module doesn't contain. |
| **Eclectic** | Multi-lens fallback. Not a separate corpus; multi-lens retrieval from the five tradition corpora. |
| **Write-time / Read-time discipline** | The non-negotiable rule that LLM calls occur only at content-time and Logger save-time; never at screen load. |

---

## 19. The journey, restated

> **Moment → moment surfaced in the Logger → observation presented to the parent → activity selection and marketplace picking up the clew → next moment.**

> **The methodology layer does its interpretive work at each step. Accumulated reads — not real-time prescription — inform later content surfacing. The platform makes the thread visible; the parent pulls it.**

This sentence belongs at the top of every methodology-related spec in the project. It is the single source of architectural truth for this system, and it is enough on its own to resolve most future scope questions: if a proposed feature claims to do something other than make the catalogue legible or shift its surfacing order, the proposal needs revision.

---

*This document captures the Hearth pedagogy system architecture as of 13 May 2026. Component-level detail lives in the specs referenced in Section 17. Subsequent versions of this document should be created when an architectural layer is added, removed, or substantially reshaped — not for content-level refinements within layers.*
