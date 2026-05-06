<!-- Version: 1 | Date: 2026-04-11 | Changes: Initial decisions log addendum for Pedagogy Knowledge Base architecture wave. Captures the seven key calls made on 2026-04-11 that govern all subsequent corpus authoring, retrieval service implementation, and pedagogy engine v2 work. -->

# Hearth Decisions Log — Pedagogy Knowledge Base Addendum

> **⚠️ ARCHIVED — superseded by [hearth-pedagogy-knowledge-base-decisions-addendum-v2.md](hearth-pedagogy-knowledge-base-decisions-addendum-v2.md).** v1 retained for historical reference. Use v2 for the current canonical decisions.

> **Parent document:** `hearth-decisions-log-v1.md` — append this section to the main log under a new "Pedagogy Knowledge Base" category.
> **Decision date:** 2026-04-11
> **Trigger:** Drew raised the pentagon-differentiation problem. Current `pedagogicalFramework` documents are too thin to carry the weight of pedagogy-as-differentiator once packs are well-built. The thin framework definitions produce thin AI output no matter how well the prompt is engineered. Fix requires structural, not cosmetic, changes.

---

## Pedagogy Knowledge Base Decisions

| # | Decision | Choice | Document of Record | Downstream Dependencies |
|---|---|---|---|---|
| PKB1 | Pedagogy treatment model | Pedagogies are knowledge domains (structured corpora with six layers) retrieved from at write-time, not framework summaries injected into prompts. | `hearth-pedagogy-knowledge-base-architecture-v1.md` | Pedagogy Engine v2 spec, write-time enrichment service refactor, Sanity schema additions |
| PKB2 | Storage split | Sanity holds authored documents (all six layers); Postgres + pgvector holds the embedding index; write-time retrieval is a PG query, not an LLM call. | `hearth-pedagogy-knowledge-base-architecture-v1.md` §4 | New Sanity document types, new PG table, new retrieval service module, Sanity→PG sync webhook |
| PKB3 | Two-layer AI preservation | Retrieval is a PG call. Write-time Haiku remains the only LLM call per save. Read-time screens remain LLM-free. UC5 verification still passes. | `hearth-alpha-use-case-verification-v1.md` UC5 (unchanged) | All read-time screens (no change), write-time enrichment service (prompt context expansion only) |
| PKB4 | Corpus scope per pedagogy v1 | ~50 Source Excerpts, ~15 Practice Patterns, 6 Observational Markers, 1 Facilitation Vocabulary, ~8 Contraindications, ~20 Worked Examples. Total ~100 documents per pedagogy. | `hearth-pedagogy-knowledge-base-architecture-v1.md` §6 | Content authoring sprints, Sanity seeding scripts |
| PKB5 | Sequencing | Wave 1 Charlotte Mason (immediate); Wave 2 Classical; Wave 3 Montessori; Wave 4 Waldorf; Wave 5 Unschooling. Eclectic is a retrieval strategy, no separate corpus. | `hearth-pedagogy-knowledge-base-architecture-v1.md` §6 | CM authoring starts now and runs parallel with Starter Pack v3 and Jumpstart Classical content revision |
| PKB6 | Proof-of-concept deliverable | Charlotte Mason corpus at ~30% of target volume, delivered alongside architecture spec, with real attributed excerpts from Project Gutenberg PD sources across all six layers. | `hearth-pedagogy-corpus-charlotte-mason-v1.md` | Validates the retrieval architecture end-to-end before the full CM sprint begins |
| PKB7 | Licensing strategy | Build all six corpora at v1 quality from public domain sources and paraphrase-with-attribution. Zero mandatory spend. Optional enhancements: Sandra Dodd + Pat Farenga (Unschooling), Sayers estate (Classical), Montessori Pierson (Montessori late works). | `hearth-pedagogy-corpus-licensing-needs-v1.md` | Drew initiates licensing conversations as optional enhancements, not as blockers |
| PKB8 | Supersession scope | Sections 7 and 8 of `hearth-pedagogy-engine-spec-v1.md` are partially superseded. Prompt template section of `hearth-pedagogy-integration-framework.md` is superseded. Both specs need v2 revisions after retrieval service ships. | This document §8 | Pedagogy Engine v2 spec owed after retrieval service lands |
| PKB9 | Human-authored quality gate | All corpus entries are human-authored or human-confirmed. Opus-drafted candidates are marked `suggestedDraft: true` until a reviewer publishes. Banned-phrase list from UC6 applies. Mirrors existing overlay pipeline quality gate per PDA9. | `hearth-pack-data-architecture-v1.md` PDA9 (extended) | Content QA pipeline tool extension to handle six new document types |
| PKB10 | Attribution standard | Every Source Excerpt carries full bibliographic attribution including volume, page, edition, copyright status, and source URL. Every paraphrased entry names the author and work. No exceptions. | `hearth-pedagogy-knowledge-base-architecture-v1.md` Appendix A | Sanity schema for `pedagogySourceExcerpt.sourceAttribution` field |

---

## Non-decisions (explicitly deferred)

| # | Item | Why deferred |
|---|---|---|
| PKB-DEF-1 | Embedding model choice (text-embedding-3-small vs -large vs self-hosted) | Not blocking. Start with small model; batch re-embedding is trivial if we upgrade later. Resolve when retrieval service is built. |
| PKB-DEF-2 | Retrieval service deployment target (Next.js API route vs dedicated microservice) | Not blocking. Recommendation is Next.js API route. Resolve at implementation time. |
| PKB-DEF-3 | Pedagogy Wiki parent-facing surface | Not blocking. Listed as Phase 3 retention feature. Corpus existence makes it nearly free to ship later. |
| PKB-DEF-4 | Overlay regeneration against knowledge base for existing Starter Pack | Not blocking. Run as v2 pass on Starter Pack after v3 content revision lands, not before. |
| PKB-DEF-5 | Anonymised alpha Logger entries as Worked Example source | Not blocking CM Wave 1 (which uses composite scenarios). Resolve before Wave 2 begins by adding opt-in to alpha consent flow. |
| PKB-DEF-6 | Sync vs async retrieval step in write-time pipeline | Not blocking. Synchronous is cleaner for v1; async optimisation is a performance decision for post-launch. |

---

## Supersession Notes

This decision set partially supersedes:

**`hearth-pedagogy-engine-spec-v1.md` §7** (Runtime Consumption) — The FIS still carries the `familyPedagogicalProfile`. What changes is what the profile is used for downstream. Instead of being injected into the Haiku prompt as framework text, the `pedagogyKey` is now used as a filter on the retrieval service query. The profile structure itself does not change.

**`hearth-pedagogy-engine-spec-v1.md` §8** (Per-Screen Overlay Behaviour) — The table of where overlays are active stays correct in terms of which screens consume the profile. The mechanism of consumption changes for the screens that currently call Haiku with framework context. Logger, Module Experience, and Activity Discovery all now benefit from retrieved source material rather than framework bullet points.

**`hearth-pedagogy-integration-framework.md`** — The Part 6 prompt templates were designed for framework-definition-in-prompt and need to be refactored to accept retrieved chunks as structured context. Refactor happens as part of retrieval service implementation, not as a separate spec revision.

A `hearth-pedagogy-engine-spec-v2.md` revision is owed once the retrieval service is in place and the new consumption pattern is concretised in code. Target: after Wave 1 CM corpus is fully authored and retrieval is running end-to-end in staging.

---

## Traceability Back to Founding Brief

This architecture directly serves two commitments from `hearth-founding-brief-v1.md`:

**Mission alignment:** "Hearth makes pedagogy and the professional frameworks of education accessible to families who educate at home." A thin framework summary does not make pedagogy accessible — it makes a summary of pedagogy accessible. A structured knowledge base of source excerpts, practice patterns, and worked examples gives parents genuine access to the traditions they are trying to educate within.

**Retention philosophy alignment:** "Hammer and wood, not training wheels. Competent usage leads to advanced usage, not graduation off the platform." The knowledge base is the single most direct answer to "what do power users do once they're competent?" — they deepen into the tradition they've chosen. The Pedagogy Wiki surface that becomes nearly free once the corpora exist is the operational expression of this philosophy.

---

*These decisions should be treated as authoritative for all downstream work on the Pedagogy Engine, write-time enrichment, Sanity schema design, and corpus authoring. Changes to any of PKB1–PKB10 require a new decision entry and a version bump on this addendum.*
