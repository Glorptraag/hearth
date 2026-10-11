<!-- Version: 1 | Date: 2026-07-07 | Changes: Initial architecture for the pedagogy corpus vault (corpus/pedagogy/) — the durable, licence-gated intake layer that feeds the already-built PKB engine. Establishes the vault contract, the compile pipeline, the licence-as-data gate that mechanises PKB10/PKB11, the migration record (CM 45 verified round-trip; Unschooling template; Montessori pt2 survivors), and the remaining engine gaps as follow-up [BUILD] items. -->

# Hearth Pedagogy Corpus Vault — Architecture (v1)

> **Status:** Landed alongside the vault itself (`corpus/pedagogy/`).
> **Decisions of record:** `hearth-pedagogy-knowledge-base-decisions-addendum-v2.md` (PKB1–PKB14) — unchanged by this document.
> **Engine spec:** `hearth-pedagogy-knowledge-base-implementation-spec-v1.md` (A1–A6). **All six engineering items shipped in April–May 2026** (`cf84dcd`, `e31850f`, `d9a66f1`; routes wrapped in #84) with one deliberate deviation: Voyage AI `voyage-3` (1024-dim) instead of OpenAI `text-embedding-3-small` — no OpenAI dependency was introduced.
> **Vault contract (authoring-level):** `corpus/pedagogy/README.md`. This document is the why + the system view; the vault README is the how.

---

## 1. The problem this solves

The PKB engine has existed since April: six Sanity schemas, the `pedagogy_knowledge_chunks` pgvector table (migration 0014), the Voyage embedding service, the Sanity→PG webhook, the retrieval service with rerank + layer balancing, and the write-time enrichment integration (`src/lib/ai/pedagogy-context.ts`) — all gated behind `PEDAGOGY_KB_ENABLED` (default false).

What never existed was an **intake system**. Corpus content lived as TypeScript literals inside a seed script (CM only, 45 documents) and as monolithic markdown docs that one authoring session stalled writing (Montessori pt1 was lost mid-sentence; only pt2 survived). A previous attempt to continue the corpus work collapsed into re-litigating copyright per entry instead of authoring.

The vault fixes both failure modes:

1. **Scale.** One markdown file = one entry = one Sanity document. Authoring sessions produce files, not code edits; a session that dies loses one file, not a corpus. The structure is self-describing at every level (READMEs with coverage tables and next-steps), so any future LLM session or human can orient top-down without reading everything — the Karpathy-style knowledge-structure idea applied to our own corpus. The vault is also a valid Obsidian vault: `[[wikilinks]]` in `## Grounded in` sections give the graph view for free.
2. **Copyright as data, not debate.** PKB11 settled the legal posture (no Australian fair-dealing cover; licence, PD, CC, or paraphrase only). The vault mechanises it: every source is registered once in `sources.json` with a licence class and an `allowVerbatim` flag, and the compiler refuses verbatim quotation from any source whose flag is false. An authoring session can never spiral on copyright again — the only question it may ask is "is this source registered?", and the answer is a lookup. When Drew signs a licence or a commissioned author (PKB12/PKB13), one registry edit unlocks verbatim use everywhere.

## 2. System view

```
                 AUTHORING (git, PR-reviewed, CI-validated)
  sources.json ──► corpus/pedagogy/<framework>/<layer>/*.md
        │                        │
        │   licence gate         │  strict parse (frontmatter + ## sections)
        ▼                        ▼
  scripts/compile-pedagogy-corpus.ts        ← npm run corpus:check (also runs in CI
        │   deterministic IDs, createOrReplace  via src/lib/pedagogy/corpus/vault.test.ts)
        ▼
  Sanity (six PKB document types; Studio = review surface)
        │
        │  npm run seed:pedagogy:reembed   — only status=published AND suggestedDraft=false
        │  (or /api/pedagogy/sanity-webhook on publish)
        ▼
  pedagogy_knowledge_chunks (Neon pgvector, HNSW cosine, voyage-3 1024-dim)
        │
        │  retrievePedagogyChunks() — vector search + metadata rerank + layer balance
        ▼
  WRITE-TIME CONSUMPTION (one Haiku call per save — UC5 intact)
    • Logger enrichment: <pedagogy_reference_material> in the Haiku prompt
      (src/lib/ai/pedagogy-context.ts, flag-gated, 2000-token cap, silent fallback)
      Query = title (unless it is the description's opening) + up to 600 chars of
      description + per-child discoveries; situationalSignals + activityType come
      from the Logger's persisted capture context (learning_entries.logger_context)
      via src/lib/pedagogy/situational-signals.ts — the single place the Logger's
      chips meet tags.json's `situation` / `age_band` vocabulary (pinned by test).
    • Coach hints retrieval provider (src/lib/logger/coaching/retrieval-provider.ts)
      — same mapper, so pre-save hints and write-time enrichment share a vocabulary
    • [content-time] Lens Bundle / Methodology Overlay generation (Kindler, per C-PL3)
```

Read-time screens stay LLM-free and retrieval-free; they consume what write-time persisted. Nothing in this workstream changes the two-layer AI rule.

## 3. The vault contract (summary)

Full grammar in `corpus/pedagogy/README.md`. The load-bearing choices:

- **Strict, dependency-free parsing.** The frontmatter grammar and section contracts are deliberately narrow, and unknown keys/sections are hard errors. A compile gate should fail loudly, not guess — `npm run corpus:check` names the file and the line.
- **Deterministic IDs** (`pedagogySourceExcerpt.cm.001`): recompiles update in place; no duplicate risk; the 45 migrated CM documents keep their production IDs exactly (verified by round-tripping the compiled vault against the original ingest arrays — byte-identical fields, with `_key`s added to object arrays as a Studio-editing improvement).
- **The vault carries more than Sanity.** `## Context` notes, `## Grounded in` wikilinks, and registry provenance stay in the vault as authoring context; compilation projects the schema subset. Losing information at compile time is fine; losing it at authoring time is not.
- **The human gate is a field, not a promise.** `suggestedDraft` defaults to true; the reembed pipeline and webhook exclude anything not human-confirmed (the webhook's gate was found to check only an explicit `suggestedDraft: true` and never `status` — fixed 2026-10-06 to the same `status == published && suggestedDraft == false` predicate the reembed script uses, pinned by `sanity-webhook/route.test.ts`). Migrated CM entries are confirmed (they shipped that way in April); every other migrated entry awaits Drew's review pass. The vault test pins that CM stays confirmed.

## 4. What the vault holds today (2026-07-07)

| Framework | Entries | State |
|---|---|---|
| charlotte-mason | 45 | Confirmed. The April proof-of-concept, migrated verbatim from the retired `ingest-pedagogy-corpus.ts`. |
| unschooling | 24 | Awaiting review. Structural template + Gray & Riley evidence layer + paraphrased foundations, migrated from `hearth-pedagogy-corpus-unschooling-v1.md`. Operational layers are commissioned-author territory (PKB12/PKB13) — do not bulk-author in-house. |
| montessori | 18 | Awaiting review. The pt2 survivors (OM 004–006, facilitation grammar, 6 contraindications, 8 worked examples). **Pt1 (all SEs, all PPs, OM 001–003) was lost and needs a rebuild from the registered PD translations.** |
| classical / waldorf-steiner | 0 | Scaffolded READMEs with source strategy; waves 2 and 4. |

Wave-1 CM targets and per-framework next-steps live in each framework README — that is the authoritative worklist, not this doc.

## 5. Path to "engine on" (ops sequence)

The flag flip is an ops decision with a mechanical checklist, in order:

1. **Sanity hygiene (one-time):** list existing PKB docs (`GROQ` one-liner in the vault README) and delete strays left by earlier experiments (the Kindler-Advance "Alexandria" pass may have pushed differently-ID'd docs).
2. `npm run seed:pedagogy:frameworks` (idempotent; ensures the six `pedagogicalFramework.*` docs).
3. `npm run seed:pedagogy:corpus` — compiles the vault to Sanity.
4. Drew's review pass in Sanity Studio (or via PR edits to the vault, then recompile): flip `suggestedDraft` per entry.
5. Confirm `pedagogy_knowledge_chunks` exists in prod (migration 0014 applies via the deploy-time migration runner; verify — the table shipped inside `0014_capability_universe_v2.sql`).
6. `VOYAGE_API_KEY` in Vercel env (prod + preview). **Note:** the embedding module is tuned for Voyage's free tier (3 RPM, 65s inter-batch waits) — a full-corpus embed of ~600 docs will take hours on free tier; a paid key makes it minutes. The webhook path embeds one doc per publish and is fine either way.
7. `npm run seed:pedagogy:reembed`, then `npm run verify:pkb` (index shape) and `npm run verify:pkb:retrieval` (golden Logger-voice queries through the real retrieval path — `scripts/data/pkb-golden-queries.json`; classical/waldorf queries are `optional` until those corpora are populated).
8. Configure the Sanity webhook (URL, `SANITY_WEBHOOK_SECRET`, GROQ type filter — spec §3.8) so future Studio publishes sync automatically.
9. Set `PEDAGOGY_KB_ENABLED=true` in Vercel. Enrichment begins retrieving; fallback behaviour (framework one-liner) covers families whose pedagogy has thin coverage. Watch the `pedagogy_retrieval` structured logs and the AI cost dashboard for the first week.

Corpus growth needs **no deploys** after this: author → compile → review → reembed.

## 6. Follow-up engine gaps (not part of this landing)

These close the loop from "retrieval informs the Haiku prompt" to "the parent can see the tradition speaking". **The full execution program (with worker-model task routing) now lives in `.claude/plans/PLAN-pkb-completion.md`** — the items below are summarised there as tasks E1–E9:

- **[CORRECTED 2026-07-08] Pedagogy-source persistence is already built end-to-end** — this doc's v1 (and the July audit it inherited from) wrongly listed it as missing. Verified: `enrich.ts` persists `pedagogy_sources` into `learningEntries.aiEnrichment`, the enrichment poll populates the `/log` state, and `PedagogyAttribution` renders. The real residual gaps: `SourceCard` renders only 2 of 6 layers (→ E4), the persist→poll→render path has no test pinning it (→ E5), and the two chunk-metadata writers have diverged so vault-embedded chunks lack the display fields the cards read (→ E3, required).
- **[BUILD → E6] Eclectic multi-lens retrieval.** Eclectic families currently always hit the fallback (no corpus, single-key filter). E6 specs the one-query multi-framework retrieval with per-framework caps and a guaranteed contraindication for tension surfacing.
- **[SPEC → E9, BUILD later] Layer-5 lens accumulated signals (C-PL6).** Spec-only doc first; the build waits on the CM practice-pattern audit against the Interpretive Patterns reframe (architecture §16) and Drew's read of the spec.
- **[BUILD → E7/E8] Retrieval quality harness.** Deterministic pgvector integration tests (CI) + a golden-query ops verifier per framework for the populated index.

## 7. What this deliberately does not do

- No new LLM calls anywhere (UC5 intact; embeddings are infrastructure, not generative calls).
- No schema changes to Sanity or Postgres — the engine as built is consumed, not modified.
- No runtime dependency on the vault: the app never reads `corpus/`; only scripts and CI do.
- No relitigation of PKB decisions — sequencing, layer volumes, licensing strategy, and the commissioning plan all stand as decided in the v2 addendum.
