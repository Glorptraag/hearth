# Pedagogy Knowledge Base — Corpus Vault

The authoring source of truth for the PKB. One markdown file = one corpus entry = one Sanity document. The engine that consumes this (retrieval, embedding, webhook, write-time enrichment) already exists in the app — this vault is how content gets into it at scale.

**Architecture:** `docs/hearth-pedagogy-corpus-vault-architecture-v1.md` (why this exists, full pipeline).
**PKB decisions:** `docs/hearth-pedagogy-knowledge-base-decisions-addendum-v2.md` (PKB1–PKB14).

## The pipeline

```
register source in sources.json  →  author entry .md files  →  npm run corpus:check
    →  npm run seed:pedagogy:corpus          (compile + write to Sanity)
    →  npm run seed:pedagogy:reembed         (embed published+confirmed docs → pedagogy_knowledge_chunks)
    →  npm run verify:pkb                    (check the index)
```

Retrieval only ever sees entries that are `status: published` **and** `suggestedDraft: false`. Everything else sits in Sanity awaiting review — that is the PKB9 human-confirmation gate, enforced by the reembed pipeline, not by convention.

## Layout

```
pedagogy/
  sources.json          ← licence registry (licence-as-data; see below)
  SOURCES.md            ← human-readable view of the registry
  <framework>/          ← charlotte-mason | classical | montessori | waldorf-steiner | unschooling
    README.md           ← wave status, coverage, gaps, review queue
    source-excerpts/    ← SE: passages from the tradition's texts (verbatim or paraphrase)
    practice-patterns/  ← PP: how the tradition reads a common situation (interpretive patterns)
    observational-markers/    ← OM: what the tradition watches for as evidence
    facilitation-vocabulary/  ← FV: verbs, restraints, micro-scripts (one singleton per framework)
    contraindications/  ← CI: what the tradition warns against + cross-tradition tensions
    worked-examples/    ← WE: composite Logger scenarios interpreted in tradition voice
```

Eclectic has no corpus by design — it is a retrieval strategy across the other five.

## The licence gate (why copyright is never re-litigated here)

PKB11: Australian fair dealing does not cover Hearth's pipeline, so every entry's right-to-use is **data, not judgment**. Each source is registered once in `sources.json` with its licence class and an `allowVerbatim` flag. The compiler then enforces mechanically:

- A source excerpt **must** name a registered `source:`.
- `isParaphrase: false` (verbatim) compiles only if the source's `allowVerbatim` is true (public domain, CC BY, licensed, or commissioned).
- Paraphrase-with-attribution compiles from any registered source.
- An unregistered source is a compile error — register it (with its licence) first.

If you're unsure of a source's licence, that is a registration task for Drew, not a reason to stall authoring: write the entry as `isParaphrase: true` in Hearth's words with attribution, or park it. Do **not** debate copyright inside an authoring session — the registry is the single place that question is answered. Strategy of record: `docs/hearth-pedagogy-corpus-licensing-needs-v2.md`.

## Entry format

YAML-ish frontmatter (strict grammar — strings, booleans, string arrays only; quote values containing `:`, `,`, or `"`) plus `## Section` bodies. The compiler (`scripts/compile-pedagogy-corpus.ts`) rejects unknown keys and unknown sections, so drift fails loudly at `npm run corpus:check` — which also runs in CI via `src/lib/pedagogy/corpus/vault.test.ts`.

Common frontmatter: `id` (`cm.001` style — `{framework-short}.{nnn}`, or bare short code for the facilitation-vocabulary singleton), `status` (`draft`|`published`), `suggestedDraft` (omit = `true`; set `false` only after human review), `tags`, optional `source` (registry key).

Per layer:

| Layer | Extra frontmatter | Body sections |
|---|---|---|
| source-excerpts | `source` (required), `pageOrChapter`, `isParaphrase`, `attributionAuthor/Title/Year` (overrides) | `## Text` (required), `## Context` (vault-only note) |
| practice-patterns | `triggerTitle` | `## Trigger`, `## Response`, `## Anti-pattern`, `## Grounded in` |
| observational-markers | `markerName` | `## What it indicates`, `## Look for` (list), `## Grounded in` |
| facilitation-vocabulary | — | `## Verbs`, `## Restraints`, `## Micro-scripts` (pair lists: `- **Term** — description`) |
| contraindications | `warnedAgainst` | `## Reasoning`, `## Grounded in` |
| worked-examples | — | `## Scenario`, `## Interpretation`, `## Grounded in` |

`## Context` and `## Grounded in` are vault-only: they carry authoring provenance and `[[wikilinks]]` for Obsidian's graph, and are not pushed to Sanity.

Filenames: `{id-with-dashes}-{slug}.md`, e.g. `cm-001-educational-triad.md`. Document IDs are deterministic (`pedagogySourceExcerpt.cm.001`), so recompiling always updates in place.

## Authoring workflow (for an LLM session or a human)

1. Read this file, then the framework README you're working in.
2. If drawing on a new source, register it in `sources.json` first (Drew confirms licence class).
3. Draft entries with `suggestedDraft: true`. Never set `false` yourself — that flag is the human review gate.
4. `npm run corpus:check` until clean.
5. Drew reviews (in the PR or in Sanity Studio), flips `suggestedDraft: false` per entry, and runs the compile + reembed.

## One-time note before the first compile against a dataset

Earlier experiments (the Kindler Advance "Alexandria" pass) may have left stray PKB documents in Sanity under different IDs. Before the first `seed:pedagogy:corpus` run, list what exists and delete strays so the vault's deterministic IDs are the only PKB population:

```groq
*[_type in ["pedagogySourceExcerpt","pedagogyPracticePattern","pedagogyObservationalMarker","pedagogyFacilitationVocabulary","pedagogyContraindication","pedagogyWorkedExample"]]{_id}
```
