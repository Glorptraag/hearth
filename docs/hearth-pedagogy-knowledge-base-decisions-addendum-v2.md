<!-- Version: 2 | Date: 2026-04-11 | Changes from v1: Added decisions PKB11–PKB14 arising from the deep research pass on Unschooling rights and contemporary practitioners (Wave 5 wave). PKB11 captures the Australian fair dealing finding (October 2025 government rejection of TDM exception). PKB12 captures the strategic shift to commissioning over licensing for Unschooling. PKB13 captures the named primary candidate ranking (Laricchia, Patterson, Elvis, Dawson). PKB14 captures the Gray & Riley CC BY 3.0 papers as immediately usable corpus material. PKB1–PKB10 are unchanged. Two non-decisions removed because the research resolved them (PKB-DEF-3 and PKB-DEF-5). Supersedes v1. -->

# Hearth Decisions Log — Pedagogy Knowledge Base Addendum (v2)

> **Parent document:** `hearth-decisions-log-v1.md` — append this section to the main log under the "Pedagogy Knowledge Base" category, replacing the v1 addendum entries.
> **First decision date:** 2026-04-11 (PKB1–PKB10)
> **v2 decision date:** 2026-04-11 (PKB11–PKB14, same day, added after deep research pass on Unschooling)
> **Trigger for v2:** Drew commissioned a deep research task on Unschooling rights and contemporary practitioners. Findings overturned the v1 Unschooling licensing strategy and surfaced an Australian legal finding (the October 2025 rejection of any TDM copyright exception) that is operative across all six pedagogies. The architecture itself was not affected — only the Wave 5 sourcing strategy and the cross-cutting legal posture.
> **Supersedes:** `hearth-pedagogy-knowledge-base-decisions-addendum-v1.md`

---

## Pedagogy Knowledge Base Decisions

| # | Decision | Choice | Document of Record | Downstream Dependencies |
|---|---|---|---|---|
| PKB1 | Pedagogy treatment model | Pedagogies are knowledge domains (structured corpora with six layers) retrieved from at write-time, not framework summaries injected into prompts. | `hearth-pedagogy-knowledge-base-architecture-v1.md` | Pedagogy Engine v2 spec, write-time enrichment service refactor, Sanity schema additions |
| PKB2 | Storage split | Sanity holds authored documents (all six layers); Postgres + pgvector holds the embedding index; write-time retrieval is a PG query, not an LLM call. | `hearth-pedagogy-knowledge-base-architecture-v1.md` §4 | New Sanity document types, new PG table, new retrieval service module, Sanity→PG sync webhook |
| PKB3 | Two-layer AI preservation | Retrieval is a PG call. Write-time Haiku remains the only LLM call per save. Read-time screens remain LLM-free. UC5 verification still passes. | `hearth-alpha-use-case-verification-v1.md` UC5 (unchanged) | All read-time screens (no change), write-time enrichment service (prompt context expansion only) |
| PKB4 | Corpus scope per pedagogy v1 | ~50 Source Excerpts, ~15 Practice Patterns, 6 Observational Markers, 1 Facilitation Vocabulary, ~8 Contraindications, ~20 Worked Examples. Total ~100 documents per pedagogy. Unschooling deliberately starts smaller (~50 documents) because the commissioning model trades volume for authentic voice. | `hearth-pedagogy-knowledge-base-architecture-v1.md` §6 | Content authoring sprints, Sanity seeding scripts |
| PKB5 | Sequencing | Wave 1 Charlotte Mason (in progress); Wave 2 Classical; Wave 3 Montessori; Wave 4 Waldorf; Wave 5 Unschooling. Eclectic is a retrieval strategy, no separate corpus. | `hearth-pedagogy-knowledge-base-architecture-v1.md` §6 | CM authoring runs parallel with Starter Pack v3 and Jumpstart Classical content revision |
| PKB6 | Proof-of-concept deliverables | Charlotte Mason corpus at ~30% of target volume **and** Unschooling corpus at structural-template depth, both delivered as v1 to validate the architecture against two materially different sourcing strategies. | `hearth-pedagogy-corpus-charlotte-mason-v1.md`, `hearth-pedagogy-corpus-unschooling-v1.md` | Validates the retrieval architecture end-to-end before the full sprints begin |
| PKB7 | Licensing strategy (cross-pedagogy) | Build CM, Classical, Montessori, Waldorf v1 corpora at zero spend from public domain and paraphrase. Unschooling spend goes to commissioning, not licensing — see PKB12. | `hearth-pedagogy-corpus-licensing-needs-v2.md` | Drew initiates outreach per PKB13; no licensing conversations on the critical path |
| PKB8 | Supersession scope | Sections 7 and 8 of `hearth-pedagogy-engine-spec-v1.md` are partially superseded. Prompt template section of `hearth-pedagogy-integration-framework.md` is superseded. Both specs need v2 revisions after retrieval service ships. | This document §8 (v1) | Pedagogy Engine v2 spec owed after retrieval service lands |
| PKB9 | Human-authored quality gate | All corpus entries are human-authored or human-confirmed. Opus-drafted candidates are marked `suggestedDraft: true` until a reviewer publishes. Banned-phrase list from UC6 applies. Mirrors existing overlay pipeline quality gate per PDA9. Commissioned-author entries inherit the same gate — author publishes under their own attribution, Hearth content reviewer accepts before retrieval embedding. | `hearth-pack-data-architecture-v1.md` PDA9 (extended) | Content QA pipeline tool extension to handle six new document types and named-author attribution |
| PKB10 | Attribution standard | Every Source Excerpt carries full bibliographic attribution including volume, page, edition, copyright status, and source URL. Every paraphrased entry names the author and work. Every commissioned entry names the contemporary author. No exceptions. | `hearth-pedagogy-knowledge-base-architecture-v1.md` Appendix A | Sanity schema for `pedagogySourceExcerpt.sourceAttribution` field |
| **PKB11** | **Australian legal posture (NEW v2)** | **Australian fair dealing does not protect Hearth's commercial AI retrieval pipeline. The October 2025 government rejection of the Productivity Commission's proposed TDM exception is settled. Every direct quotation from in-copyright material requires either licensing, public domain status, an applicable Creative Commons licence, or replacement with original paraphrase-with-attribution.** This decision is operative across all six pedagogies, not only Unschooling. | `hearth-pedagogy-corpus-licensing-needs-v2.md` §1 | All six wave authoring plans; the Content QA pipeline must check copyright status of every published entry |
| **PKB12** | **Wave 5 Unschooling sourcing strategy (NEW v2 — overturns v1 Unschooling recommendation)** | **Commission contemporary practitioners as guest authors. Do not lead with Holt licensing.** The reasons: (a) Holt's rights are split between Hachette and HoltGWS LLC requiring two separate negotiations with no public edtech precedent for either, (b) Holt's 1960s–80s narrative essays do not fit the operational scenario-driven structure of Practice Patterns and Worked Examples, (c) contemporary practitioners already produce structurally aligned content commercially, (d) Australian fair dealing closure (PKB11) eliminates any fall-back rationale for short-quote use. Commissioning is faster, cheaper for what it produces, more current in voice, and architecturally appropriate. | `hearth-pedagogy-corpus-licensing-needs-v2.md` §6 | Outreach work per PKB13; Wave 5 is no longer "free" — budget AUD $12,000–$30,000 |
| **PKB13** | **Wave 5 named candidate priority (NEW v2)** | **Primary international candidate: Pam Laricchia** (Ontario, Canada; livingjoyfully.ca) — 5 books, 300+ podcast episodes, paid membership community, Sandra Dodd endorses. **Alternative international candidate: Sue Patterson** (Texas, USA; unschoolingmom2mom.com) — coaching practice, 21 published guides, $75/half hour pricing anchor, 30 years experience. **Essential Australian co-author: Sue Elvis** (NSW, Australia; storiesofanunschoolingfamily.com) — 27 years of NSW registration experience, currently co-hosting podcast with Sandra Dodd, irreplaceable for Australian regulatory authenticity. **Australian regulatory specialist: Freya Dawson** (NSW, freyadawson.com.au) — former University of Wollongong law lecturer, runs commercial unschooling courses, deepest publicly available NSW registration writing. **Stylistic enrichment candidate (conditional): Joyce Fetteroll** — Carnegie Mellon engineer background, only worth one outreach attempt due to uncertain current activity level. | `hearth-pedagogy-corpus-licensing-needs-v2.md` §6.2 and Contact Sheet | Drew initiates outreach within two weeks per the engagement sequence in licensing-needs-v2 §6.4 |
| **PKB14** | **Gray & Riley CC BY 3.0 papers as immediate Wave 5 substrate (NEW v2)** | **Peter Gray and Gina Riley's 2015 papers ("Grown Unschoolers' Evaluations" Reports I and II) are licensed CC BY 3.0 Unported and can be adapted directly into Source Excerpts and Observational Markers entries today, with no rights conversation.** They are the only substantial body of openly licensed empirical research on unschooling outcomes and they ground the corpus in real evidence. The 2013 *Journal of Unschooling and Alternative Learning* paper (CC BY-NC-ND 4.0) can be referenced and linked but not adapted into modified entries. | `hearth-pedagogy-corpus-licensing-needs-v2.md` §6.3 and `hearth-pedagogy-corpus-unschooling-v1.md` SE-US-001 (already integrated) | Wave 5 evidence layer is partially built before any commissioning conversation begins |

---

## Non-decisions (explicitly deferred)

| # | Item | Why deferred |
|---|---|---|
| PKB-DEF-1 | Embedding model choice (text-embedding-3-small vs -large vs self-hosted) | Not blocking. Start with small model; batch re-embedding is trivial if we upgrade later. Resolve when retrieval service is built. |
| PKB-DEF-2 | Retrieval service deployment target (Next.js API route vs dedicated microservice) | Not blocking. Recommendation is Next.js API route. Resolve at implementation time. |
| PKB-DEF-3 | ~~Pedagogy Wiki parent-facing surface~~ — *resolved as Phase 3 Hearth feature, not part of corpus build itself; remains scoped post-MVP* | Resolved by virtue of being external to corpus build |
| PKB-DEF-4 | Overlay regeneration against knowledge base for existing Starter Pack | Not blocking. Run as v2 pass on Starter Pack after v3 content revision lands, not before. |
| PKB-DEF-5 | ~~Anonymised alpha Logger entries as Worked Example source~~ — *resolved by Wave 5 commissioning strategy: commissioned authors will write composite scenarios from their own practice. Alpha entries become a Wave 6+ enhancement, not a Wave 5 prerequisite* | Resolved by PKB12 |
| PKB-DEF-6 | Sync vs async retrieval step in write-time pipeline | Not blocking. Synchronous is cleaner for v1; async optimisation is a performance decision for post-launch. |
| PKB-DEF-7 (NEW v2) | Whether to commission a single guest author for Wave 5 or split across two (Laricchia + Elvis) | Resolve at outreach time based on each candidate's response, scope appetite, and pricing. The licensing-needs-v2 §6 plans for the dual-author case as the default but can collapse to single author if either declines or prefers solo authorship. |
| PKB-DEF-8 (NEW v2) | Pricing structure for commissioned guest authorship — flat fee per entry vs total project fee vs hourly | Resolve through individual negotiation with each chosen author. Pricing anchors documented in licensing-needs-v2 §6.5 are starting points, not contractual commitments. |

---

## Supersession Notes (Unchanged from v1)

This decision set partially supersedes:

**`hearth-pedagogy-engine-spec-v1.md` §7** (Runtime Consumption) — The FIS still carries the `familyPedagogicalProfile`. What changes is what the profile is used for downstream. Instead of being injected into the Haiku prompt as framework text, the `pedagogyKey` is now used as a filter on the retrieval service query. The profile structure itself does not change.

**`hearth-pedagogy-engine-spec-v1.md` §8** (Per-Screen Overlay Behaviour) — The table of where overlays are active stays correct in terms of which screens consume the profile. The mechanism of consumption changes for the screens that currently call Haiku with framework context.

**`hearth-pedagogy-integration-framework.md`** — The Part 6 prompt templates were designed for framework-definition-in-prompt and need to be refactored to accept retrieved chunks as structured context. Refactor happens as part of retrieval service implementation.

A `hearth-pedagogy-engine-spec-v2.md` revision is owed once the retrieval service is in place and the new consumption pattern is concretised in code.

---

## Traceability Back to Founding Brief (Unchanged from v1, Reinforced by v2)

This architecture serves two commitments from `hearth-founding-brief-v1.md`:

**Mission alignment:** "Hearth makes pedagogy and the professional frameworks of education accessible to families who educate at home." A thin framework summary does not make pedagogy accessible. The v2 strategy reinforces this — commissioning Sue Elvis to write Australian regulatory translation content is the most direct possible way of making unschooling pedagogy operationally accessible to the families Hearth serves.

**Retention philosophy alignment:** "Hammer and wood, not training wheels. Competent usage leads to advanced usage." The v2 commissioning strategy means that as families deepen into the Unschooling tradition through Hearth, they encounter named contemporary practitioners' actual operational guidance, not platform paraphrases. The Pedagogy Wiki surface that becomes nearly free once the corpora exist will surface these named authors and their living work — which is exactly the deepening retention loop described in the founding brief.

---

*These decisions should be treated as authoritative for all downstream work on the Pedagogy Engine, write-time enrichment, Sanity schema design, corpus authoring, and Wave 5 commissioning. Changes to any of PKB1–PKB14 require a new decision entry and a version bump on this addendum.*
