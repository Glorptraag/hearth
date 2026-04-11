# Plan: Pedagogy Knowledge Base (PKB)

> Pharao output — generated 2026-04-11. Review before executing.

## Overview

Build a six-layer pedagogy knowledge base that embeds curated pedagogical content (source excerpts, practice patterns, observational markers, facilitation vocabulary, contraindications, worked examples) as vectors in Postgres, retrieves relevant chunks at write-time, and includes them in the Haiku enrichment prompt — grounding AI suggestions in real pedagogical source material rather than a bare philosophy string.

**Architecture spec:** `~/Downloads/hearth-pedagogy-knowledge-base-implementation-spec-v1.md`
**Planning doc:** `~/.claude/plans/wise-purring-walrus.md`

## Key Context for All Sessions

- Schemas live at `src/sanity/schemas/` (NOT `sanity/schemas/`)
- DB uses `@neondatabase/serverless` + `drizzle-orm/neon-http`. Raw SQL via `db.execute(sql\`...\`)` for complex queries
- No `pedagogicalFramework` Sanity doc type exists yet — Task 1.1 creates it
- Pedagogy keys use underscores: `charlotte_mason`, `waldorf_steiner` (not hyphens)
- Embedding provider: **Voyage AI** (`voyage-3`, 1024 dims) — NOT OpenAI. All spec refs to 1536 dims become 1024
- Feature flag: `process.env.PEDAGOGY_KB_ENABLED === 'true'` (default false)
- Enrichment service: `src/lib/ai/enrich.ts` — single Haiku call per save, must stay that way (UC5)

---

## Phases

### Phase 1: Foundation (Sanity Schemas + Database)

#### Task 1.1: Create `pedagogicalFramework` Sanity schema + seed script `[SONNET]`
- **Description**: The spec's six PKB schemas all reference a `pedagogicalFramework` document type that doesn't exist yet. Create this document type with fields `title` (string), `key` (string, unique — matches `familySettings.pedagogyPreference` values), `description` (text), `status` (string: draft/published). Create a seed script that uses `sanityWriteClient.createOrReplace()` to create the 6 framework docs with deterministic IDs (`pedagogicalFramework.charlotte_mason`, etc.). Register the type in `src/sanity/schemas/index.ts`.
- **Files**: `src/sanity/schemas/pedagogy/pedagogicalFramework.ts` (create), `scripts/seed-pedagogy-frameworks.ts` (create), `src/sanity/schemas/index.ts` (modify — add import)
- **Done when**: Schema file exists, `schemaTypes` array includes it, seed script runs without error
- **Parallel group**: A
- **Preflight reads**: `src/sanity/schemas/pedagogyOverlay.ts` (enum values at lines 22-29), `src/lib/sanity/client.ts` (write client pattern), `src/sanity/schemas/index.ts` (import pattern)

#### Task 1.2: Create six PKB Sanity schemas `[SONNET]`
- **Description**: Implement the six layer schemas exactly as defined in the spec §1.3.1–§1.3.6: `pedagogySourceExcerpt`, `pedagogyPracticePattern`, `pedagogyObservationalMarker`, `pedagogyFacilitationVocabulary`, `pedagogyContraindication`, `pedagogyWorkedExample`. Each references `pedagogicalFramework` via `pedagogyKey`. All have `suggestedDraft` boolean (default `true`). Follow spec field names, types, and validations exactly. Create barrel `index.ts` exporting all 7 types. Register all in `schemaTypes`. Add custom desk structure grouping them under "Pedagogy Knowledge Base" folder.
- **Files**: `src/sanity/schemas/pedagogy/pedagogySourceExcerpt.ts` (create), `src/sanity/schemas/pedagogy/pedagogyPracticePattern.ts` (create), `src/sanity/schemas/pedagogy/pedagogyObservationalMarker.ts` (create), `src/sanity/schemas/pedagogy/pedagogyFacilitationVocabulary.ts` (create), `src/sanity/schemas/pedagogy/pedagogyContraindication.ts` (create), `src/sanity/schemas/pedagogy/pedagogyWorkedExample.ts` (create), `src/sanity/schemas/pedagogy/index.ts` (create), `src/sanity/schemas/index.ts` (modify), `sanity.config.ts` (modify — add desk structure)
- **Done when**: All 6 schema files exist with all spec fields, barrel exports all 7 types, `schemaTypes` includes all 7, desk structure groups PKB types, TypeScript compiles
- **Gate**: Blocked on 1.1 — schemas reference `pedagogicalFramework` type which 1.1 creates
- **Parallel group**: B
- **Preflight reads**: Spec §1.3.1–§1.3.6 (full schema definitions), `src/sanity/schemas/pedagogyOverlay.ts` (convention: `defineType`/`defineField`, validation style), `sanity.config.ts` (current plugins config)

#### Task 1.3: Create pgvector migration `[SONNET]`
- **Description**: Write a SQL migration that enables the pgvector extension on Neon and creates the `pedagogy_knowledge_chunks` table. Use `vector(1024)` for Voyage AI (spec says 1536 for OpenAI — adapt). Columns: `id TEXT PRIMARY KEY` (Sanity doc ID), `pedagogy_key TEXT`, `layer TEXT`, `text TEXT`, `embedding vector(1024)`, `metadata JSONB`, `content_hash TEXT`, `sanity_doc_id TEXT`, `updated_at TIMESTAMPTZ`. Create HNSW index for cosine similarity, composite index on `(pedagogy_key, layer)`, and GIN index on metadata.
- **Files**: `src/lib/db/migrations/add_pedagogy_knowledge_chunks.sql` (create)
- **Done when**: Migration SQL file exists with `CREATE EXTENSION`, `CREATE TABLE`, all three `CREATE INDEX` statements. SQL is syntactically valid.
- **Parallel group**: A
- **Preflight reads**: `src/lib/db/migrations/` (existing migration naming pattern), spec §2.3 (table schema), spec §2.4 (index definitions)

---

### Phase 2: Embedding Infrastructure

#### Task 2.1: Create embedding service module `[SONNET]`
- **Description**: Create `src/lib/pedagogy/embedding.ts` exporting `embedText(text: string): Promise<number[]>` and `embedBatch(texts: string[]): Promise<number[][]>`. Use Voyage AI REST API (`POST https://api.voyageai.com/v1/embeddings`) with model `voyage-3` (1024 dims). Read `VOYAGE_API_KEY` from env. Truncate input to ~30000 chars as safety net. Batch limit: 128 inputs per call (Voyage limit). Export `EMBEDDING_CONFIG` constant.
- **Files**: `src/lib/pedagogy/embedding.ts` (create)
- **Done when**: Module exports both functions and config constant, TypeScript compiles, uses fetch to call Voyage API
- **Parallel group**: B
- **Preflight reads**: Spec §4.2 (adapt OpenAI pattern to Voyage), `src/lib/pedagogy/adapter.ts` (existing module conventions in this directory)

#### Task 2.2: Create chunk text builder `[SONNET]`
- **Description**: Create `src/lib/pedagogy/chunk-builder.ts` exporting `buildChunkText(doc)` and `buildChunkMetadata(doc)`. Implements the per-layer composition rules from spec §3.6 and metadata structure from §3.7. Also export `computeContentHash(text)` using SHA-256. This module is shared by both the webhook handler (A3) and the batch re-embed script (A4).
- **Files**: `src/lib/pedagogy/chunk-builder.ts` (create)
- **Done when**: Module exports all three functions, handles all 6 layer types, TypeScript compiles
- **Parallel group**: B
- **Preflight reads**: Spec §3.6 (composition rules table), spec §3.7 (metadata structure)

#### Task 2.3: Create batch re-embedding script `[SONNET]`
- **Description**: Create `scripts/reembed-pedagogy-corpus.ts`. Connects to Sanity (pull all published, non-draft, `suggestedDraft: false` PKB docs), composes text per chunk-builder rules, computes content hashes, compares to existing `pedagogy_knowledge_chunks` rows, re-embeds changed/new ones via `embedBatch()`, upserts. Reports stats: total, embedded, skipped, errors. Uses `neon()` + `drizzle()` pattern from `src/lib/db/index.ts` for DB access.
- **Files**: `scripts/reembed-pedagogy-corpus.ts` (create)
- **Done when**: Script connects to Sanity + Neon, processes all 6 layer types, skips unchanged docs (hash match), reports stats
- **Gate**: Blocked on 2.1 + 2.2 — needs embedding functions and chunk builder
- **Parallel group**: C
- **Preflight reads**: `scripts/seed-content.ts` (existing script pattern), `src/lib/sanity/client.ts` (Sanity client), `src/lib/db/index.ts` (DB connection), spec §4.4

---

### Phase 3: Sync + Retrieval (Complex Integration)

#### Task 3.1: Create Sanity webhook handler `[OPUS]`
- **Description**: Create the API route at `src/app/api/pedagogy/sanity-webhook/route.ts`. This is the sync pipeline: Sanity publishes a PKB doc → webhook fires → handler verifies auth (Bearer token via `SANITY_WEBHOOK_SECRET`), filters to the 6 PKB types, and either deletes the chunk row (on delete/draft/suggestedDraft) or composes text, checks content hash, embeds if changed, and upserts. Must handle all edge cases: draft state detection, idempotent upserts, error logging with 500 for Sanity retry. Uses `embedText()` from embedding.ts and `buildChunkText()`/`buildChunkMetadata()`/`computeContentHash()` from chunk-builder.ts. Raw SQL via `db.execute()` for the vector upsert.
- **Files**: `src/app/api/pedagogy/sanity-webhook/route.ts` (create)
- **Done when**: Route handles POST, verifies auth, filters types, implements full sync logic from spec §3.5, returns 200/401/500 appropriately
- **Gate**: Blocked on 2.1 + 2.2 — needs embedding service and chunk builder
- **Parallel group**: C
- **Preflight reads**: Spec §3 (full section), `src/app/api/admin/snapshots/health/route.ts` (raw SQL + `db.execute()` pattern), existing API routes for auth patterns

#### Task 3.2: Create retrieval service `[OPUS]`
- **Description**: Create `src/lib/pedagogy/retrieval.ts` exporting `retrievePedagogyChunks()`. This is the core intelligence: embeds a query string, runs pgvector cosine similarity search filtered by `pedagogy_key`, applies metadata reranking (age overlap +0.05, capability thread overlap +0.05/thread max +0.15, situational signal +0.10/match, activity type +0.05), enforces layer balance (at least 1 practice_pattern, 2 source_excerpts, 1 worked_example when available), and returns top-N chunks with similarity scores and match reasons. Also create a thin API wrapper at `src/app/api/pedagogy/retrieve/route.ts` for debugging/admin use. Include structured logging per spec §5.9.
- **Files**: `src/lib/pedagogy/retrieval.ts` (create), `src/app/api/pedagogy/retrieve/route.ts` (create)
- **Done when**: Function accepts query + framework + metadata, returns ranked chunks with scores + matchReasons, layer balance enforced, fallback returns empty array with `fallbackUsed: true`, structured log emitted
- **Gate**: Blocked on 2.1 — needs embedding service for query embedding
- **Parallel group**: C
- **Preflight reads**: Spec §5 (full section, especially §5.6 algorithm), `src/app/api/admin/analytics/thread-coverage/route.ts` (raw SQL pattern with `db.execute()`)

---

### Phase 4: Enrichment Integration

#### Task 4.1: Refactor write-time enrichment `[OPUS]`
- **Description**: Modify `src/lib/ai/enrich.ts` to call `retrievePedagogyChunks()` before the Haiku call and include retrieved chunks as `<pedagogy_reference_material>` in the prompt. Create `src/lib/ai/pedagogy-context.ts` that builds the prompt section. Gate behind `PEDAGOGY_KB_ENABLED` env var. When disabled or no chunks found, use fallback text replacing the current `Philosophy: ${pedagogy}` line. Enforce token budget (~2000 tokens for chunks, estimate via `text.length / 4`). Update system prompt line 81 to instruct grounding in reference material. **Critical constraint**: must NOT introduce a second LLM call — the retrieval embedding is infrastructure, not generative. `buildUserPrompt()` becomes async.
- **Files**: `src/lib/ai/pedagogy-context.ts` (create), `src/lib/ai/enrich.ts` (modify)
- **Done when**: Enrichment compiles, feature flag gates retrieval, prompt includes `<pedagogy_reference_material>` section when enabled, fallback works when disabled, exactly one Haiku call per save (UC5), `buildUserPrompt` is async
- **Gate**: Blocked on 3.2 — needs retrieval service
- **Parallel group**: D
- **Preflight reads**: `src/lib/ai/enrich.ts` (full file — current prompt structure, `buildUserPrompt()`, `assembleContext()`), spec §6.4 (prompt template), spec §6.5 (token budget), spec §6.6 (UC5 verification)

---

## Dependency Graph

```
1.1 (framework schema) ──► 1.2 (PKB schemas)
                                              ╲
1.3 (pgvector migration)                       ╲
                                                 ╲
2.1 (embedding service) ──┬──► 2.3 (batch script) ╲
                          ├──► 3.1 (webhook)        ├──► 4.1 (enrichment refactor)
2.2 (chunk builder) ──────┤                        ╱
                          └──► 3.2 (retrieval) ───╱
```

## Parallel Execution Guide

| Terminal | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|----------|---------|---------|---------|---------|
| T1 (Sonnet) | 1.1 → 1.2 | 2.1 → 2.3 | — | — |
| T2 (Sonnet) | 1.3 | 2.2 | — | — |
| T3 (Opus) | — | — | 3.1 | 4.1 |
| T4 (Opus) | — | — | 3.2 | — |

**Execution flow:**
- Phase 1: T1 does 1.1 then 1.2 sequentially. T2 does 1.3 in parallel.
- Phase 2: T1 does 2.1, then 2.3 (gated on 2.1+2.2). T2 does 2.2 in parallel with 2.1.
- Phase 3: T3 does 3.1, T4 does 3.2. Both gated on Phase 2 completion (2.1+2.2).
- Phase 4: T3 does 4.1 after 3.2 completes.

**Minimum terminals needed:** 2 (one Sonnet, one Opus). 4 terminals maximizes parallelism.

---

## Status

| Task | Model | Status | Completed By |
|------|-------|--------|-------------|
| 1.1  | Sonnet | ⬜     |             |
| 1.2  | Sonnet | ⬜     |             |
| 1.3  | Sonnet | ⬜     |             |
| 2.1  | Sonnet | ⬜     |             |
| 2.2  | Sonnet | ⬜     |             |
| 2.3  | Sonnet | ⬜     |             |
| 3.1  | Opus   | ⬜     |             |
| 3.2  | Opus   | ⬜     |             |
| 4.1  | Opus   | ⬜     |             |

---

## Session Prompts

### Terminal 1 — Sonnet (Schemas + Embedding)

```
Read `.claude/plans/PLAN-pkb.md` and `.claude/plans/status-pkb.json`.

You are working on the Pedagogy Knowledge Base feature for the Hearth LMS.

**Reference documents:**
- Implementation spec: `~/Downloads/hearth-pedagogy-knowledge-base-implementation-spec-v1.md`
- Planning doc: `~/.claude/plans/wise-purring-walrus.md`

Execute tasks in order: 1.1, 1.2, 2.1, 2.3. Check gates in status.json before starting each task.

**Task 1.1** — Create `pedagogicalFramework` Sanity document type:
- Create `src/sanity/schemas/pedagogy/pedagogicalFramework.ts` with fields: title (string, required), key (string, required), description (text), status (draft/published)
- Use `defineType`/`defineField` from 'sanity', match validation style from `src/sanity/schemas/pedagogyOverlay.ts`
- Create `scripts/seed-pedagogy-frameworks.ts` — seed 6 framework docs with deterministic IDs using `sanityWriteClient.createOrReplace()` from `src/lib/sanity/client.ts`
- Framework keys must match existing enum: charlotte_mason, classical, montessori, waldorf_steiner, unschooling, eclectic
- Add import to `src/sanity/schemas/index.ts` and include in `schemaTypes` array

**Task 1.2** — Create six PKB Sanity schemas (GATED on 1.1):
- Read spec §1.3.1–§1.3.6 for exact field definitions — follow them precisely
- Create all 6 schema files under `src/sanity/schemas/pedagogy/`
- Create barrel `src/sanity/schemas/pedagogy/index.ts` exporting all 7 types
- Update `src/sanity/schemas/index.ts` to import from barrel
- Update `sanity.config.ts` with custom desk structure grouping PKB types under "Pedagogy Knowledge Base"
- All `pedagogyKey` fields: `type: 'reference', to: [{ type: 'pedagogicalFramework' }]`
- All types get `suggestedDraft` boolean field with `initialValue: true`

**Task 2.1** — Create embedding service (no gates):
- Create `src/lib/pedagogy/embedding.ts`
- Export `embedText(text: string): Promise<number[]>` and `embedBatch(texts: string[]): Promise<number[][]>`
- Use Voyage AI REST API: `POST https://api.voyageai.com/v1/embeddings`, model `voyage-3`, 1024 dimensions
- Read `VOYAGE_API_KEY` from process.env
- Truncate input to 30000 chars, batch limit 128 inputs per call
- Export `EMBEDDING_CONFIG = { model: 'voyage-3', dimensions: 1024 } as const`

**Task 2.3** — Create batch re-embedding script (GATED on 2.1 + 2.2):
- Create `scripts/reembed-pedagogy-corpus.ts` per spec §4.4
- Follow pattern from `scripts/seed-content.ts` for script structure
- Connect to Sanity + Neon, process all 6 PKB types
- Use chunk-builder.ts for text composition and hash computation
- Use embedBatch() for efficiency, batch 100 docs at a time
- Skip unchanged rows (content_hash match), report stats

After each task, update `.claude/plans/status-pkb.json` — set the task status to "done", add ISO timestamp and "T1" as completed_by. Then proceed to the next task.
```

### Terminal 2 — Sonnet (Migration + Chunk Builder)

```
Read `.claude/plans/PLAN-pkb.md` and `.claude/plans/status-pkb.json`.

You are working on the Pedagogy Knowledge Base feature for the Hearth LMS.

**Reference documents:**
- Implementation spec: `~/Downloads/hearth-pedagogy-knowledge-base-implementation-spec-v1.md`
- Planning doc: `~/.claude/plans/wise-purring-walrus.md`

Execute tasks in order: 1.3, 2.2. Check gates in status.json before starting each task.

**Task 1.3** — Create pgvector migration (no gates):
- Create `src/lib/db/migrations/add_pedagogy_knowledge_chunks.sql`
- Start with `CREATE EXTENSION IF NOT EXISTS vector;`
- Create table `pedagogy_knowledge_chunks` per spec §2.3, but use `vector(1024)` instead of `vector(1536)` (Voyage AI, not OpenAI)
- Columns: id TEXT PK, pedagogy_key TEXT NOT NULL, layer TEXT NOT NULL, text TEXT NOT NULL, embedding vector(1024) NOT NULL, metadata JSONB NOT NULL DEFAULT '{}', content_hash TEXT NOT NULL, sanity_doc_id TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- Create HNSW index: `USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)`
- Create composite index on `(pedagogy_key, layer)`
- Create GIN index on `metadata`
- Use `IF NOT EXISTS` on all creates for idempotency

**Task 2.2** — Create chunk text builder (no gates):
- Create `src/lib/pedagogy/chunk-builder.ts`
- Export `buildChunkText(doc: SanityPKBDocument): string` — implements spec §3.6 composition rules for all 6 layer types
- Export `buildChunkMetadata(doc: SanityPKBDocument): Record<string, unknown>` — implements spec §3.7 metadata structure
- Export `computeContentHash(text: string): string` — SHA-256 hex digest
- Export the `PEDAGOGY_LAYER_TYPES` constant array and `SanityPKBDocument` type
- Normalize pedagogy keys to underscore format (charlotte_mason, not charlotte-mason)

After each task, update `.claude/plans/status-pkb.json` — set the task status to "done", add ISO timestamp and "T2" as completed_by.
```

### Terminal 3 — Opus (Webhook + Enrichment)

```
Read `.claude/plans/PLAN-pkb.md` and `.claude/plans/status-pkb.json`.

You are working on the Pedagogy Knowledge Base feature for the Hearth LMS.

**Reference documents:**
- Implementation spec: `~/Downloads/hearth-pedagogy-knowledge-base-implementation-spec-v1.md` (read §3, §6, §7 carefully)
- Planning doc: `~/.claude/plans/wise-purring-walrus.md`

Execute tasks in order: 3.1, then 4.1. Check gates in status.json before starting each — both are gated on Phase 2 tasks.

**Task 3.1** — Create Sanity webhook handler (GATED on 2.1 + 2.2):
- Create `src/app/api/pedagogy/sanity-webhook/route.ts`
- Implement full sync logic from spec §3.5:
  - Verify `Authorization: Bearer ${SANITY_WEBHOOK_SECRET}` header
  - Filter to 6 PKB types only (return 200 for others)
  - On delete / draft / suggestedDraft=true: DELETE FROM pedagogy_knowledge_chunks WHERE id = $1
  - On publish: compose text (buildChunkText), compute hash (computeContentHash), check existing row
  - If hash matches: update metadata only. If hash differs or new: embed (embedText) + upsert
  - Use `db.execute(sql\`...\`)` for all DB operations (pattern from `src/app/api/admin/snapshots/health/route.ts`)
  - Log errors, return 500 for Sanity retry on failures
- Edge cases: draft state detection (Sanity prefixes draft IDs with `drafts.`), idempotent upserts via INSERT ON CONFLICT, handle missing fields gracefully

**Task 4.1** — Refactor write-time enrichment (GATED on 3.2):
- Read `src/lib/ai/enrich.ts` carefully first — understand current prompt structure
- Create `src/lib/ai/pedagogy-context.ts`:
  - Export `buildPedagogyContext(opts: { entryTitle, entryDescription, framework, childAges? }): Promise<string>`
  - Calls `retrievePedagogyChunks()` from `src/lib/pedagogy/retrieval.ts`
  - Returns formatted `<pedagogy_reference_material>` block per spec §6.4
  - Enforces token budget: max ~2000 tokens, estimate via text.length/4, drop lowest-scored chunks if over
  - Returns fallback text if no chunks or feature disabled
- Modify `src/lib/ai/enrich.ts`:
  - Gate retrieval behind `process.env.PEDAGOGY_KB_ENABLED === 'true'`
  - Make `buildUserPrompt()` async
  - Insert pedagogy context after FAMILY CONTEXT, before ENTRY TO ENRICH
  - Update system prompt line 81: replace "Use family's pedagogical philosophy if provided" with instruction to ground in retrieved reference material and cite sources
  - When feature flag off: replace `Philosophy: ${pedagogy}` with `PEDAGOGY CONTEXT:\nFamily follows the ${pedagogy} approach.`
- **CRITICAL**: Do NOT introduce a second LLM call. Retrieval embedding is infrastructure. One Haiku call per save (UC5).

After each task, update `.claude/plans/status-pkb.json` — set the task status to "done", add ISO timestamp and "T3" as completed_by.
```

### Terminal 4 — Opus (Retrieval Service)

```
Read `.claude/plans/PLAN-pkb.md` and `.claude/plans/status-pkb.json`.

You are working on the Pedagogy Knowledge Base feature for the Hearth LMS.

**Reference documents:**
- Implementation spec: `~/Downloads/hearth-pedagogy-knowledge-base-implementation-spec-v1.md` (read §5 carefully)
- Planning doc: `~/.claude/plans/wise-purring-walrus.md`

Execute task 3.2. Check gates in status.json first — gated on 2.1.

**Task 3.2** — Create retrieval service (GATED on 2.1):
- Create `src/lib/pedagogy/retrieval.ts`:
  - Export `retrievePedagogyChunks(opts: { queryText, pedagogyKey, capabilityThreads, ageRange, situationalSignals, activityType?, loggerEntryText?, topN? }): Promise<RetrievalResponse>`
  - Algorithm (spec §5.6):
    1. Compose query text from loggerEntryText or structured fields
    2. Embed query via embedText() — 1024 dims, Voyage AI
    3. pgvector search: `SELECT ... 1 - (embedding <=> $1::vector) AS similarity_score FROM pedagogy_knowledge_chunks WHERE pedagogy_key = $2 ORDER BY embedding <=> $1::vector LIMIT 50`
    4. Reranking: age overlap +0.05, capability thread overlap +0.05/thread (max +0.15), situational signal +0.10/match, activity type +0.05
    5. Layer balance: at least 1 practice_pattern, 2 source_excerpts, 1 worked_example (when available), fill rest by score
    6. Return top-N (default 8) with similarity_score, matchReasons[]
  - On zero matches or error: return empty chunks with fallbackUsed: true
  - Structured logging per spec §5.9
  - Use `db.execute(sql\`...\`)` for the vector query
- Create `src/app/api/pedagogy/retrieve/route.ts`:
  - Thin POST wrapper around retrievePedagogyChunks()
  - Auth: Bearer token via PEDAGOGY_RETRIEVAL_SECRET
  - Validates request with Zod
  - Returns RetrievalResponse JSON

After the task, update `.claude/plans/status-pkb.json` — set task 3.2 status to "done", add ISO timestamp and "T4" as completed_by.
```
