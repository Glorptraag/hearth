# Hearth — Three Passes Toward a Coherent System

<!-- Version: 1 | Date: 2026-10-07 | Changes: initial. Three successive reworkings of section 8 of hearth-complexity-map-v1.md, each more severe, ending in a first-principles target. Companion to the published page "Hearth Complexity Map". -->

> **Purpose:** section 8 of the complexity map trimmed branches. These three passes go after the trunk. Pass 1 consolidates without rewriting. Pass 2 changes the data model so the system can be inspected. Pass 3 rebuilds the product from five nouns and three verbs and says what to delete.
> **Test applied to every pass:** can a cold reader explain, in one sentence each, (a) what happens when a parent saves, (b) why a thread shows the state it shows, (c) where any sentence the parent reads came from. The current system fails all three.

---

## 0. Why the current system is incoherent (the trunk, not the branches)

Six roots. Everything in the complexity map grows from one of them.

| # | Root | How it shows up |
|---|---|---|
| R1 | **Two interpretation engines were never chosen between.** Generative (Haiku per save, draft insights, coach hints, Sonnet fallback) and structured (keyword rail, declared targets, tag-match recommender, PKB retrieval, now Shelf) grew side by side. | Four model touchpoints on the Logger path; a PKB that is built and off; a plan that adds a second capped call. |
| R2 | **One parent question is answered by five concepts.** "Did my child do this?" is represented by provenance (4 values), claimed tier, tier band (3), the bar rule, overrides, and #288's four states. | Rubric copy held since June; no plain sentence matches the code. |
| R3 | **Pedagogy tried to be three things.** A vocabulary overlay (adapter), a knowledge engine (PKB retrieval), and authored content (lens bundles per module × tradition). | Seven layers, two of which reach a parent. |
| R4 | **Capture was designed before consumption.** The Logger collects engagement, discoveries, chips, observation details, evidence, now felt-experience and "noticed", without a stated list of what downstream reads. | A 1,108-line page; fields that enrich ignores; fields enrich wants that aren't captured. |
| R5 | **The snapshot is an opaque blob.** `family_intelligence_snapshots` is JSONB rebuilt by code every screen reads; nobody can list its contents or explain a value by pointing at facts. | "Unverifiable": the answer to "why does it say that?" is "the rebuild said so". |
| R6 | **Six shapes of 'a thing a family can do'.** Activity, Project stage, Hearth session, parent-built module, Kit, and now Shelf unit, each with its own path into an entry. | Every new content type adds code to the interpretation path. |

The three passes address R1–R6 in increasing depth. Pass 1 touches R1, R2, R3 lightly. Pass 2 resolves R5 and R6. Pass 3 resolves all six by redefining the product.

---

## Pass 1 — Consolidate (no data-model change; weeks, not months)

**Principle:** one engine per job. Structured matching does interpretation; the model writes one sentence and proposes candidates only when nothing structured applies.

### 1.1 One interpretation pipeline, five named stages

`enrich.ts` becomes five functions called in order, each with an input and output type and a tape:

1. **Capture** — the entry as saved. Nothing else.
2. **Match** (deterministic) — if the entry has a source (activity, Shelf unit, project stage, session), take its declared `capabilityTargets`; else run the keyword/taxonomy matcher against thread and DLO descriptors. Output: candidate DLOs with a `source` of `declared` or `matched`.
3. **Propose** (one Haiku call, constrained) — given the capture and the candidates, return (a) which candidates the moment actually evidences, at which tier band, (b) one per-child sentence. The model chooses from the candidate list; it may add at most one DLO from the taxonomy with a stated reason. Output: proposals, never facts.
4. **Confirm** — the parent's tap on the post-save surface (or later). Confirmed proposals become evidence. Unconfirmed proposals stay proposals, visible as "we think", never in the Report.
5. **Roll-up** — rebuild per-child thread state from confirmed evidence only.

Deleted from the path: draft insights (`/api/entries/draft-insight`), coach hints, depth coaching, PKB retrieval, Sonnet fallback (replace with "proposal failed, try again" state; the tape makes retries safe). Deepgram stays (it is input, not interpretation).

### 1.2 Evidence model: two provenance values, two parent-facing words

| Internal | Meaning | Parent sees |
|---|---|---|
| `proposed` | came from Match or Propose; not yet confirmed | "we noticed" (dimmed) |
| `confirmed` | parent confirmed, or a declared opportunity was corroborated by the parent's own observation field | "shown" |

Tier band stays (emerging / developing / demonstrating) but is computed from counts of confirmed evidence per DLO with one published rule, and the rubric copy is that rule in plain words. `claimed_tier`, `tierOverrides`, and #288's four states are removed; an override becomes a confirmed evidence row with `source: parent_assertion` and a note.

This reinstates the original March decision D7 (all AI mappings "suggested" until the parent confirms), which the build silently dropped.

### 1.3 Pedagogy: three layers

Keep L1 profile, L3 lens bundles (authored per module × tradition), L4 adapter vocabulary. Delete L5/L6 from the architecture doc. Park L2 retrieval entirely: the corpus vault becomes an **author's reference** for whoever writes lens bundles and taxonomy copy variants, not a runtime system. L7 recommender stays as a read-time query.

### 1.4 Logger capture schema derived from consumption

The capture schema is exactly the union of what Match, Propose and Show read: child(ren), what happened (text / voice transcript), evidence (photo / quote), optional source (opportunity), per-child felt-experience chip, per-child "what they noticed or asked". Engagement level, discoveries free-text, 24 observation chips and `observationDetails` are removed unless a stage reads them (today none does; they are stored and forgotten).

### 1.5 Snapshot gets a schema

`family_intelligence_snapshots.snapshot_data` is typed: `{ learners: { [id]: { threads: { [threadId]: { band, confirmedCount, lastConfirmedAt } } } }, recommendations, momentum, gaps }`. Every screen declares which keys it reads in a `reads:` comment at the top of its page file; a CI script fails if a key is read that the type doesn't declare.

**What Pass 1 costs:** two weeks of Claude Code, mostly deletion and typing. **What it reverses:** E-12 second call, E-13 PKB flip, E-22 commissioning, #286/#287/#288 landing, X-LOG-1. **Expo impact:** the demo gets simpler; Shelf fits (a unit is a source for Match). **What it leaves unresolved:** R5 (snapshot still code-rebuilt) and R6 (six content shapes).

---

## Pass 2 — Make it inspectable (data-model change; the expo demo survives, the rest follows)

**Principle:** facts first, views second. The system stores what was noticed and confirmed as rows; everything a parent sees is a query over those rows. No blob, no rebuild, nothing that can't be explained by pointing at a row.

### 2.1 The evidence ledger replaces `aiEnrichment` + `observation_dlo_links` + `learner_dlo_status`

One append-only table, `evidence`:

| column | meaning |
|---|---|
| `id`, `family_id`, `learner_id`, `moment_id` | who, from which capture |
| `dlo_id` | the one thing evidenced |
| `band` | emerging / developing / demonstrating, as proposed or confirmed |
| `status` | `proposed` / `confirmed` / `retracted` |
| `source` | `declared` (opportunity targets) / `matched` (taxonomy match) / `model` (Propose) / `parent` (assertion or confirmation) |
| `opportunity_id` | nullable; the Shelf unit / activity / stage / session it came from |
| `confirmed_at`, `confirmed_by` | the parent tap |
| `run_id` | pointer to the tape of the Propose run that produced it |

Thread state is a **SQL view**, not a column: `band = f(count of confirmed rows per DLO over the last N days)` with the rule written once in SQL and once in the rubric copy. The Constellation, the Report, badge thresholds, Planner "next", Dashboard momentum are all views or queries over `evidence`. `family_intelligence_snapshots` becomes a materialised view refreshed on confirm, or is dropped.

Why this answers R5: "why does this thread say developing?" → "because these three confirmed rows, here are the moments". The admin "what went in / what came out" screen is `SELECT * FROM evidence WHERE moment_id = ?` plus the tape.

### 2.2 One content primitive: the Opportunity

Every "thing a family can do" becomes one Sanity shape, **`opportunity`**, which is the Shelf unit's shape generalised:

`title · kind (activity | unit | stage | session | custom) · parent (module / resource / project / hearth) · capabilityTargets[{dlo, band}] · plainLanguage · observationPrompts[3] · validLogChecklist[] · next[]`

Activity, Shelf `resourceUnit`, `projectStage`, Hearth session template and the Module Builder's output all *are* opportunities; Pack, Module, Resource, Project and Hearth are **collections** that order them. Approach collapses into opportunity metadata (`approachLabel`). Kit, Skeleton, Asset, CommonsText attach to opportunities as materials.

Why this answers R6: Match reads `opportunity.capabilityTargets` whatever the kind. Adding a content type is a Sanity `kind` value, not a code path. The Shelf is no longer a new system; it is the first collection authored to the primitive the whole catalogue migrates to.

### 2.3 The model does exactly one thing

`propose(moment, candidates) → { evidence: proposed rows, sentence: per child }`. Constrained to candidates plus at most one taxonomy addition with a reason. Recorded to the tape with input and output. Replayable. Diffable. No other model call exists in the product; Deepgram is transcription, not interpretation. Any future "AI feature" must be expressible as a change to `propose`'s inputs or as a query; otherwise it is out.

### 2.4 Pedagogy as copy variants on nodes

Delete lens bundles as a type. Instead, every taxonomy node (thread, DLO) and every opportunity carries **copy variants per tradition**: `plainLanguage.cm`, `.classical`, `.montessori`, `.waldorf`, `.unschooling`, `.eclectic` (fallback to neutral). The adapter chooses the variant from the family profile. Observational markers become `observationPrompts` variants. Six traditions = six authored copy sets on the same nodes, confirmed by you, no engine. The PKB corpus is the author's source material.

Why this answers R3: pedagogy becomes one thing: which words a family sees. The forward-prescription guard becomes an authoring rule, not validation code.

### 2.5 Logger = Notice; post-save = Confirm

The Logger screen has three parts: who, what happened (voice / photo / text), working from (an opportunity, or nothing). Save creates a `moment` and runs Match → Propose. The post-save surface shows proposed evidence as tappable chips ("Sam — Counting to 20 — developing?") with the one sentence; a tap confirms. A weekly "Did these happen?" review catches the untapped ones. There is no insights rail, no completeness ring; the proposal chips are the insight.

**What Pass 2 costs:** 4–6 weeks; migrations for `evidence` and `opportunity`; a backfill from `observation_dlo_links`; rewrite of `snapshot-rebuild` as SQL views; Sanity migration of activities to opportunities. **What it reverses:** the seven-layer pedagogy architecture (C-PL1), the outcomes-spine data model (D-OS1–4), the four-provenance model, the lens-bundle type, Pack → Module → Approach → Activity as a four-level hierarchy (becomes collection → opportunity). **Expo impact:** not completable by 9 Nov in full. The expo subset is 2.2 for Shelf only (author Shelf units in the opportunity shape from day one), 2.3 (the constrained propose), 2.5 (the Confirm surface). The ledger and views come after. **What it leaves:** the product still has planner, badges, hearths, marketplace, module builder, projects, library, notifications as separate surfaces.

---

## Pass 3 — Rebuild from first principles (what Hearth is, in five nouns and three verbs)

**Principle:** a product a parent can explain to another parent in one breath, and a developer can explain to a reviewer in one diagram. Everything that isn't one of the nouns or verbs is either a view, a way of making opportunities, or deleted.

### 3.1 The nouns

| Noun | What it is | Lives in |
|---|---|---|
| **Child** (and Family, Facilitator) | who learns; who notices | Postgres |
| **Moment** | one retrospective capture: text / voice / photo, one or more children, optional opportunity | Postgres |
| **Opportunity** | anything with declared targets: a lesson in a resource, an activity, a project stage, a co-op session, something a parent made | Sanity (platform) and Postgres (parent-made) |
| **Evidence** | one fact: child × DLO × moment × band × status × source | Postgres, append-only |
| **Thread / DLO** | the taxonomy: 15 domains, 57 threads, 171 DLOs, with authored copy variants per tradition and regulatory mappings per jurisdiction | Sanity |

### 3.2 The verbs

| Verb | Screen | Mechanism |
|---|---|---|
| **Notice** | Logger | create a Moment; Match → Propose produces proposed Evidence |
| **Confirm** | post-save chips; weekly review | proposed → confirmed; the only way a fact enters the record |
| **Show** | Our Story (Portfolio, Constellation, Report, Profile), Dashboard | queries over confirmed Evidence, rendered through the family's copy variant |

### 3.3 What every other feature becomes

| Today | Under Pass 3 | Change |
|---|---|---|
| Weekly Planner | a list of Opportunities with intended dates; finishing one opens Notice with the opportunity pre-filled | view; drag/touch picker stays |
| Module Experience runner (Prep → Facilitate → Log) | the Opportunity detail page with a "Notice this" button | collapse three modes into one page |
| Module Builder, five pathways | one "Make an opportunity" form: title, what you'll do, which threads (pick from 57), optional prompts; Propose drafts the targets, you confirm | delete four pathways, skeletons, session templates, drafts table |
| Projects / stages | an ordered collection of Opportunities | delete `project` as a separate experience |
| Hearths (community) | a collection of Opportunities shared across families; a session is an Opportunity with a date; suggested observations are proposed Evidence rows for the member family | keep membership + invites; delete session_evidence / session_reflections / narrative as separate tables |
| Badges (creator + assessment) | a named set of DLOs; "awarded" = all confirmed at a band; assessment questions become Confirm prompts | delete badge_definitions/awards/assessment_logs; badges are a Sanity doc + a query |
| Marketplace / Library / Pack indicators | browsing and saving collections; entitlements unchanged | views |
| Notifications | three triggers only: proposals awaiting confirmation; a thread newly shown; a report period closing | delete tiers, cooldowns, quiet-day logic |
| HEU Report | query: confirmed Evidence × regulatory mapping × period, curated samples = Moments with photos | unchanged in purpose; deterministic by construction |
| Pedagogy wizard + lens bundles + PKB + overlays | the family's tradition choice selects copy variants; nothing else | delete 11 of 12 pedagogy Sanity types, pgvector, Voyage, retrieval API, webhook |
| Admin | families, evidence inspector (moment → proposals → confirmations → tape), content QA, invitations, audit | delete analytics that read the blob; rebuild on queries |
| Spark / Servo / future tools | producers of Moments and Opportunities through one API; nothing else needs to know they exist | this is the "LTI-spirit" platform model, for free |

### 3.4 The one diagram

```
          Opportunity (Sanity / parent-made)
                 │ declared targets
                 ▼
 Parent ──Notice──▶ Moment ──Match──▶ candidates ──Propose (1 call)──▶ proposed Evidence
                                                                             │
                                                              Parent ──Confirm──▶ confirmed Evidence
                                                                             │
                                   Thread/DLO copy variants ◀── Show ◀── queries (band, coverage, badges, next)
```

Three arrows a parent performs, one model call, one table of facts, one taxonomy. Everything on the complexity map's four diagrams either sits on this line or is deleted.

### 3.5 What gets deleted (so it is concrete)

Postgres (of 41 tables): `logger_drafts` stays; `learning_entry_evidence` folds into Moment; `observation_dlo_links`, `learner_dlo_status`, `custom_threads` (becomes parent-made DLO under a custom thread, Sanity-free), `family_intelligence_snapshots` (view), `ai_pipeline_logs` (becomes the tape table), `badge_definitions`, `badge_awards`, `badge_assessment_logs`, `module_drafts`, `module_runs` (a Moment with an opportunity *is* the run), `planner_entries` (intent on an opportunity-collection row), `session_evidence`, `session_reflections`, `suggested_observations` (proposed Evidence), `notifications` tiers. Net: roughly 41 → 24.

Sanity (of 31 schemas): keep `capabilityDomain`, `capabilityThread`, `discreteLearningObjective`, `regulatoryFramework`, `opportunity`, `collection` (pack / resource / project / hearth-set), `badge`, `asset`, `commonsText`, `kit`, `siteCopy`. Delete `approach`, `activity` (migrated), `module`, `pack`, `project`, `projectStage` (collections), `moduleSkeleton`, `bannedPhraseSet` (authoring rule), `strand`, `prerequisiteEdge` (move to DLO field), `practice`, `atomicCapability`, and all 12 pedagogy types except copy variants on nodes. Net: 31 → 11.

Code: `enrich.ts` → `match.ts` + `propose.ts` + `confirm.ts`; `snapshot-rebuild.ts` → SQL views; `src/lib/pedagogy/` → `copy-variant.ts`; five Module Builder pathways → one form; Module runner → opportunity page; `/log/page.tsx` → under 300 lines by construction.

### 3.6 Coherence invariants (the tests a reviewer runs)

1. Every value on every screen is the result of a query a developer can paste into the SQL console.
2. Every model output is a row with `status = proposed` and a `run_id`; no model output is ever read by Show.
3. Every sentence a parent reads is either their own words, a confirmed fact rendered through a copy variant, or copy with a human author in Sanity.
4. A parent can state the band rule in one sentence, and it is the same sentence as the SQL.
5. Adding a content type touches Sanity only.
6. Adding a sister app touches the Moment/Opportunity API only.
7. The pedagogy system is a lookup; it has no runtime.

### 3.7 Cost, sequencing, and the expo

Pass 3 is a 10–14 week rebuild for one developer with Claude Code, done as a strangler: new tables and views alongside old, screens re-pointed one at a time, old tables dropped last. It cannot be done by 9 November. What the expo can honestly show under Pass 3 is the *line*: Notice → Propose → Confirm → Show, on Shelf units authored in the opportunity shape, with a Constellation that says two words and a Report that is a query. That subset is Pass 1 plus Pass 2 items 2.2 (Shelf only), 2.3 and 2.5, which is roughly the current plan v2 with WS3 and the PKB items removed and the Confirm surface added.

Order after the expo: evidence ledger and views (R5) → opportunity migration of the Starter Pack (R6) → copy variants and pedagogy deletion (R3) → feature collapses in 3.3 → table and schema drops.

---

## Decision required

| Question | Options |
|---|---|
| Which pass is the target? | Pass 1 only · Pass 2 · Pass 3 (with Pass 1 + the Pass 2 subset for the expo) |
| Does the expo demo commit to the *line* (Notice → Propose → Confirm → Show) or to the current surfaces? | line · current |
| Do the June–October decisions that Pass 2/3 reverse (C-PL1, D-OS1–4, four-provenance, lens bundles, four-level hierarchy) get re-opened formally in the decisions log? | yes, as a new dated section · no, Pass 1 only |

If the answer is Pass 3, plan v2 becomes v3: WS2 Shelf authored as opportunities, WS3 replaced by the Confirm surface and the constrained `propose`, E-13/E-17/E-22 withdrawn, #286–#288 closed unmerged, and the post-expo roadmap is section 3.7.

---

*v1 — 7 October 2026. Companion to `hearth-complexity-map-v1.md` and the published "Hearth Complexity Map". Supersedes section 8 of both.*
