<!-- Version: 1 | Date: 2026-04-11 | Changes: Initial implementation specification for the Pedagogy Knowledge Base. Translates the architecture spec (hearth-pedagogy-knowledge-base-architecture-v1.md) into concrete engineering contracts ready for Claude Code execution. Resolves PKB-DEF-1 (text-embedding-3-small), PKB-DEF-2 (Next.js API route deployment), and adds two new operational decisions (retrieval failure fallback and chunking strategy). Includes Sanity schemas, Drizzle migration, webhook handler contract, embedding pipeline, retrieval service contract, write-time Haiku refactor, and a six-prompt Sonnet execution sequence as Appendix A. -->

# Hearth Pedagogy Knowledge Base — Implementation Specification

> **Status:** Implementation contract. Translates the architecture into engineering work ready for Claude Code execution.
> **Architecture reference:** `hearth-pedagogy-knowledge-base-architecture-v1.md` (data model, layer definitions, integration points)
> **Decisions reference:** `hearth-pedagogy-knowledge-base-decisions-addendum-v2.md` (PKB1–PKB14)
> **Resolved deferrals:** PKB-DEF-1 (embedding model), PKB-DEF-2 (deployment target). Two new operational decisions documented in §0.2.
> **Audience:** Claude Code (Sonnet) executing against the existing Hearth codebase.
> **Companion handoff artifact:** Appendix A — six numbered Sonnet prompts ready for paste-and-execute.

---

## 0. Preamble

### 0.1 What This Document Is For

This spec exists because the architecture document describes *what* the Pedagogy Knowledge Base does, but does not describe *how* to build it in the existing Hearth codebase. Sonnet needs concrete schemas, contracts, and verification steps to execute without clarifying questions or speculative assumptions.

The spec is organised into six sections matching the engineering items A1–A6 from the build queue. Each section is self-contained enough that it can be turned into a Sonnet prompt and executed against the codebase. Appendix A wraps each section as a numbered Sonnet prompt with preflight checks, acceptance criteria, and file lists.

### 0.2 Operational Decisions Resolved by This Spec

Four decisions are now closed:

| Decision | Resolution | Reasoning |
|---|---|---|
| **PKB-DEF-1** Embedding model | **`text-embedding-3-small`** (1536 dimensions, OpenAI) | Cheap (~$0.02 per 1M tokens), well-understood, easy to upgrade via batch re-embedding. Corpus is small enough that model upgrades are trivial. |
| **PKB-DEF-2** Retrieval service deployment | **Next.js API route** at `/api/pedagogy/retrieve` | Single codebase, serverless budget, no separate ops surface. Operation is a single PG query well within Vercel function limits. |
| **NEW: Retrieval failure fallback** | **Silent fallback to framework summary** + log warning + admin dashboard surface | Production safety wins over alpha debuggability. Failures are observable via logs and admin metrics. |
| **NEW: Chunking strategy** | **Embed whole documents** for v1; no chunking | Layer documents are 200–800 tokens. Whole-document embedding is simpler, retrieval quality is fine at this scale. Chunking becomes a v2 optimisation if quality suffers. |

### 0.3 What Sonnet Should Do Before Starting Any Section

Each section's prompt in Appendix A begins with a preflight checklist that lists files to read first. As a global preflight before any section work, Sonnet should:

1. Read `hearth-pedagogy-knowledge-base-architecture-v1.md` end to end.
2. Read `hearth-sanity-document-json-reference-v1.md` to understand the existing Sanity document conventions.
3. Read `hearth-pack-data-architecture-v1.md` for the PDA conventions and the existing pedagogy framework document type.
4. Read `PROJECT_STATUS.md` and `COMPONENT_REGISTRY.md` to understand current state.
5. View the existing `pedagogicalFramework` Sanity schema file to understand existing pedagogy tagging conventions.
6. View the existing Drizzle schema for the family intelligence snapshot table, as a reference for table definition patterns.
7. View the existing write-time Haiku enrichment service module to understand current prompt structure and call pattern.

If any of these files is missing or has changed since this spec was written, Sonnet should flag the discrepancy before generating code rather than guessing.

### 0.4 Honest Caveats About This Spec

Three things this spec cannot do that Sonnet must verify directly against the codebase:

- **Existing Sanity schema field naming conventions.** I have specified field names that match the architecture spec and what is documented in the JSON reference, but the live Sanity schemas may use slightly different conventions (camelCase vs snake_case, `key` suffixes vs not). Sonnet should match the existing convention rather than the convention shown here when they conflict.
- **Existing Drizzle migration pattern.** I have specified a Drizzle schema definition, but the existing migration tooling, naming pattern, and rollback approach may differ. Sonnet should match the existing migration pattern.
- **Existing write-time enrichment service signature.** I have specified how the Haiku call should be modified, but the actual function signature, the existing prompt template location, and the existing context-assembly pipeline are not visible from this spec. Sonnet should verify by viewing the actual file before refactoring.

When in doubt, conform to existing patterns over the patterns shown here.

---

## 1. Section A1 — Six Sanity Schemas

### 1.1 Goal

Define six new Sanity document types implementing the six layers of the pedagogy knowledge base. All six reference the existing `pedagogicalFramework` document by `pedagogyKey` so retrieval can filter by tradition.

### 1.2 Conventions

- **Document IDs:** Deterministic, following the existing project convention. Pattern: `{type}.{pedagogyKey}.{NNN}` where `NNN` is a zero-padded sequence number per pedagogy. Examples: `pedagogySourceExcerpt.cm.001`, `pedagogyPracticePattern.unschooling.003`.
- **Schema files:** One file per type under `sanity/schemas/pedagogy/`. File names: `pedagogySourceExcerpt.ts`, `pedagogyPracticePattern.ts`, etc.
- **Schema registration:** Add all six to the schema types array in the Sanity Studio config.
- **Required vs optional:** Every Source Excerpt must have full attribution. Every other type must have at least one Source Excerpt reference under `groundedIn`. The Facilitation Vocabulary doc is a singleton per pedagogy and uses a different ID convention (`pedagogyFacilitationVocabulary.{pedagogyKey}` with no number).
- **Drafts and `suggestedDraft` flag:** Every type carries a `suggestedDraft` boolean (default `true` for AI-drafted candidates, `false` for human-published). The retrieval embedding pipeline only embeds documents with `suggestedDraft = false` AND not in Sanity draft state.

### 1.3 Schema Definitions

#### 1.3.1 `pedagogySourceExcerpt`

```ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pedagogySourceExcerpt',
  title: 'Pedagogy Source Excerpt',
  type: 'document',
  fields: [
    defineField({
      name: 'excerptId',
      title: 'Excerpt ID',
      description: 'Format: SE-{PEDAGOGY_KEY}-{NNN}, e.g. SE-CM-001',
      type: 'string',
      validation: Rule => Rule.required().regex(/^SE-[A-Z]+-\d{3}$/),
    }),
    defineField({
      name: 'pedagogyKey',
      title: 'Pedagogy',
      type: 'reference',
      to: [{ type: 'pedagogicalFramework' }],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'text',
      title: 'Excerpt Text (verbatim or paraphrased)',
      description: 'For PD sources: verbatim quotation. For paraphrased entries: original Hearth text with explicit attribution to author.',
      type: 'text',
      rows: 6,
      validation: Rule => Rule.required().min(20).max(2000),
    }),
    defineField({
      name: 'isParaphrase',
      title: 'Is this a paraphrase rather than a verbatim quotation?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'contextInSource',
      title: 'Context in source',
      description: 'Where in the original work this passage appears and any framing the reader needs.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'themes',
      title: 'Themes',
      description: 'Tradition-specific concept tags. E.g. for CM: narration, habit, atmosphere, science_of_relations.',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'appliesAtAges',
      title: 'Age range applicability',
      description: 'Inclusive [min, max] age range. Use [0, 18] for "all ages".',
      type: 'object',
      fields: [
        { name: 'min', type: 'number', validation: Rule => Rule.required().min(0).max(18) },
        { name: 'max', type: 'number', validation: Rule => Rule.required().min(0).max(18) },
      ],
    }),
    defineField({
      name: 'capabilityThreadRelevance',
      title: 'Capability threads this excerpt speaks to',
      description: 'Reference the canonical capability thread library.',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'situationalRelevance',
      title: 'Situational triggers',
      description: 'Tag the kinds of Logger entries or screen contexts where this excerpt should be retrieved.',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'sourceAttribution',
      title: 'Source attribution',
      type: 'object',
      validation: Rule => Rule.required(),
      fields: [
        { name: 'authorFullName', type: 'string', validation: Rule => Rule.required() },
        { name: 'workTitle', type: 'string', validation: Rule => Rule.required() },
        { name: 'volumeOrSeriesInfo', type: 'string' },
        { name: 'publisher', type: 'string' },
        { name: 'yearOfPublication', type: 'number' },
        { name: 'chapterOrSection', type: 'string' },
        { name: 'pageReference', type: 'string' },
        {
          name: 'copyrightStatus',
          type: 'string',
          options: {
            list: [
              { title: 'Public domain worldwide', value: 'public_domain_worldwide' },
              { title: 'Public domain US only', value: 'public_domain_us_only' },
              { title: 'Creative Commons (specify in licenceDetail)', value: 'creative_commons' },
              { title: 'Licensed', value: 'licensed' },
              { title: 'Paraphrase with attribution', value: 'paraphrase_with_attribution' },
            ],
          },
          validation: Rule => Rule.required(),
        },
        { name: 'licenceDetail', type: 'string', description: 'E.g. "CC BY 3.0 Unported" if Creative Commons.' },
        { name: 'sourceUrl', type: 'url' },
        { name: 'retrievedDate', type: 'date' },
      ],
    }),
    defineField({
      name: 'suggestedDraft',
      title: 'AI-drafted candidate (not yet human-confirmed)',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'excerptId',
      subtitle: 'sourceAttribution.authorFullName',
      description: 'text',
    },
    prepare({ title, subtitle, description }) {
      return {
        title: title || 'Untitled Excerpt',
        subtitle: subtitle || '—',
        description: description?.slice(0, 100),
      }
    },
  },
})
```

#### 1.3.2 `pedagogyPracticePattern`

```ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pedagogyPracticePattern',
  title: 'Pedagogy Practice Pattern',
  type: 'document',
  fields: [
    defineField({
      name: 'patternId',
      title: 'Pattern ID',
      description: 'Format: PP-{PEDAGOGY_KEY}-{NNN}',
      type: 'string',
      validation: Rule => Rule.required().regex(/^PP-[A-Z]+-\d{3}$/),
    }),
    defineField({
      name: 'pedagogyKey',
      type: 'reference',
      to: [{ type: 'pedagogicalFramework' }],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'triggerTitle',
      title: 'Short trigger description',
      description: 'E.g. "Child resists a planned lesson"',
      type: 'string',
      validation: Rule => Rule.required().max(120),
    }),
    defineField({
      name: 'triggerContext',
      title: 'Full trigger context',
      description: 'A 1–3 sentence description of the situation this pattern addresses.',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'traditionResponse',
      title: 'Tradition response',
      description: 'How this pedagogy responds to the trigger. 200–400 words.',
      type: 'text',
      rows: 12,
      validation: Rule => Rule.required().min(200),
    }),
    defineField({
      name: 'antiPattern',
      title: 'Anti-pattern',
      description: 'What the tradition explicitly warns against doing in this situation.',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'groundedIn',
      title: 'Grounded in source excerpts',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'pedagogySourceExcerpt' }] }],
      validation: Rule => Rule.min(1),
    }),
    defineField({
      name: 'situationalTriggers',
      title: 'Situational triggers (for retrieval matching)',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      validation: Rule => Rule.min(1),
    }),
    defineField({
      name: 'appliesAtAges',
      type: 'object',
      fields: [
        { name: 'min', type: 'number' },
        { name: 'max', type: 'number' },
      ],
    }),
    defineField({
      name: 'capabilityThreadRelevance',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'authoredBy',
      title: 'Authored by',
      description: 'For commissioned guest authors, name them here. Empty for in-house authoring.',
      type: 'string',
    }),
    defineField({
      name: 'suggestedDraft',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'patternId',
      subtitle: 'triggerTitle',
    },
  },
})
```

#### 1.3.3 `pedagogyObservationalMarker`

```ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pedagogyObservationalMarker',
  title: 'Pedagogy Observational Marker',
  type: 'document',
  fields: [
    defineField({
      name: 'markerId',
      title: 'Marker ID',
      description: 'Format: OM-{PEDAGOGY_KEY}-{NNN}',
      type: 'string',
      validation: Rule => Rule.required().regex(/^OM-[A-Z]+-\d{3}$/),
    }),
    defineField({
      name: 'pedagogyKey',
      type: 'reference',
      to: [{ type: 'pedagogicalFramework' }],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'markerName',
      title: 'Marker name',
      description: 'E.g. "Quality of narration", "Habit of attention"',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'whatItIndicates',
      title: 'What it indicates',
      description: 'Plain prose explaining what the tradition reads this signal as meaning about learning or development.',
      type: 'text',
      rows: 6,
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'markersToLookFor',
      title: 'Markers to look for',
      description: 'Concrete observable signs.',
      type: 'array',
      of: [{ type: 'string' }],
      validation: Rule => Rule.min(2),
    }),
    defineField({
      name: 'capabilityThreadMapping',
      title: 'Capability thread mapping',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      validation: Rule => Rule.min(1),
    }),
    defineField({
      name: 'groundedIn',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'pedagogySourceExcerpt' }] }],
    }),
    defineField({
      name: 'suggestedDraft',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'markerId',
      subtitle: 'markerName',
    },
  },
})
```

#### 1.3.4 `pedagogyFacilitationVocabulary`

This type is a singleton per pedagogy, so the ID convention is `pedagogyFacilitationVocabulary.{pedagogyKey}` with no number.

```ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pedagogyFacilitationVocabulary',
  title: 'Pedagogy Facilitation Vocabulary',
  type: 'document',
  fields: [
    defineField({
      name: 'pedagogyKey',
      type: 'reference',
      to: [{ type: 'pedagogicalFramework' }],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'verbs',
      title: 'Verbs the tradition uses for what the parent does',
      type: 'array',
      of: [
        defineField({
          name: 'verbEntry',
          type: 'object',
          fields: [
            { name: 'verb', type: 'string', validation: Rule => Rule.required() },
            { name: 'meaning', type: 'text', rows: 3, validation: Rule => Rule.required() },
          ],
        }),
      ],
      validation: Rule => Rule.min(3),
    }),
    defineField({
      name: 'characteristicRestraints',
      title: 'Characteristic restraints',
      description: 'Things the tradition explicitly does not do.',
      type: 'array',
      of: [{ type: 'string' }],
      validation: Rule => Rule.min(3),
    }),
    defineField({
      name: 'microScripts',
      title: 'Example micro-scripts',
      description: 'Short example scripts of what the parent might say in specific moments.',
      type: 'array',
      of: [
        defineField({
          name: 'scriptEntry',
          type: 'object',
          fields: [
            { name: 'situation', type: 'string', validation: Rule => Rule.required() },
            { name: 'script', type: 'text', rows: 3, validation: Rule => Rule.required() },
          ],
        }),
      ],
      validation: Rule => Rule.min(3),
    }),
    defineField({
      name: 'groundedIn',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'pedagogySourceExcerpt' }] }],
    }),
    defineField({
      name: 'authoredBy',
      type: 'string',
    }),
    defineField({
      name: 'suggestedDraft',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      pedagogy: 'pedagogyKey.title',
    },
    prepare({ pedagogy }) {
      return { title: `Facilitation Vocabulary — ${pedagogy || 'Unknown'}` }
    },
  },
})
```

#### 1.3.5 `pedagogyContraindication`

```ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pedagogyContraindication',
  title: 'Pedagogy Contraindication',
  type: 'document',
  fields: [
    defineField({
      name: 'contraindicationId',
      title: 'Contraindication ID',
      description: 'Format: CI-{PEDAGOGY_KEY}-{NNN}',
      type: 'string',
      validation: Rule => Rule.required().regex(/^CI-[A-Z]+-\d{3}$/),
    }),
    defineField({
      name: 'pedagogyKey',
      type: 'reference',
      to: [{ type: 'pedagogicalFramework' }],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'warnedAgainst',
      title: 'Practice warned against',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'traditionReasoning',
      title: 'Tradition reasoning',
      type: 'text',
      rows: 6,
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'tensionWithOtherTraditions',
      title: 'Tension with other traditions (cross-pedagogy honesty)',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'groundedIn',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'pedagogySourceExcerpt' }] }],
      validation: Rule => Rule.min(1),
    }),
    defineField({
      name: 'suggestedDraft',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'contraindicationId',
      subtitle: 'warnedAgainst',
    },
  },
})
```

#### 1.3.6 `pedagogyWorkedExample`

```ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pedagogyWorkedExample',
  title: 'Pedagogy Worked Example',
  type: 'document',
  fields: [
    defineField({
      name: 'exampleId',
      title: 'Example ID',
      description: 'Format: WE-{PEDAGOGY_KEY}-{NNN}',
      type: 'string',
      validation: Rule => Rule.required().regex(/^WE-[A-Z]+-\d{3}$/),
    }),
    defineField({
      name: 'pedagogyKey',
      type: 'reference',
      to: [{ type: 'pedagogicalFramework' }],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'scenario',
      title: 'Scenario (anonymised or composite Logger entry)',
      type: 'text',
      rows: 6,
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'capabilityThreads',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'ageRange',
      type: 'object',
      fields: [
        { name: 'min', type: 'number' },
        { name: 'max', type: 'number' },
      ],
    }),
    defineField({
      name: 'activityType',
      type: 'string',
    }),
    defineField({
      name: 'interpretationInTraditionVoice',
      title: 'Interpretation in the tradition\'s voice',
      description: '3–6 sentences interpreting what this tradition would notice as significant and what it would suggest as next steps.',
      type: 'text',
      rows: 12,
      validation: Rule => Rule.required().min(150),
    }),
    defineField({
      name: 'groundedIn',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'pedagogySourceExcerpt' }] }],
      validation: Rule => Rule.min(1),
    }),
    defineField({
      name: 'authoredBy',
      type: 'string',
    }),
    defineField({
      name: 'suggestedDraft',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'exampleId',
      subtitle: 'scenario',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Untitled Example',
        subtitle: subtitle?.slice(0, 100),
      }
    },
  },
})
```

### 1.4 Schema Registration

Add all six to the Sanity Studio config schema types array. Group them under a "Pedagogy Knowledge Base" structure section in the desk navigation.

### 1.5 Acceptance Criteria for A1

- All six schema files exist under `sanity/schemas/pedagogy/`.
- All six are registered in the Studio config.
- A test publish in Sanity Studio for each type succeeds with valid sample data.
- The pedagogy framework reference field correctly resolves to existing `charlotte-mason` and `unschooling` framework documents.
- Schema validation rules trigger appropriately on missing required fields.

---

## 2. Section A2 — Drizzle Migration with pgvector

### 2.1 Goal

Enable the pgvector extension on the Neon Postgres instance and create the `pedagogy_knowledge_chunks` table with the appropriate vector column, indexes, and Drizzle schema definition.

### 2.2 pgvector Setup

Neon supports pgvector but it must be explicitly enabled. The migration must include:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

This is a one-time enablement at the database level. After this, the `vector` type is available in subsequent migrations.

### 2.3 Table Schema

```sql
CREATE TABLE pedagogy_knowledge_chunks (
  id TEXT PRIMARY KEY,                    -- Sanity document ID
  pedagogy_key TEXT NOT NULL,             -- e.g. 'charlotte-mason', 'unschooling'
  layer TEXT NOT NULL,                    -- 'source_excerpt' | 'practice_pattern' | 'observational_marker' | 'facilitation_vocabulary' | 'contraindication' | 'worked_example'
  text TEXT NOT NULL,                     -- The composed retrievable text
  embedding vector(1536) NOT NULL,        -- text-embedding-3-small dimensionality
  metadata JSONB NOT NULL DEFAULT '{}',   -- Tags, ages, threads, triggers, attribution
  content_hash TEXT NOT NULL,             -- SHA-256 of source text for change detection
  sanity_doc_id TEXT NOT NULL,            -- Back-reference (same as id, kept for clarity)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for filtering by pedagogy + layer (most common query pattern)
CREATE INDEX idx_pedagogy_chunks_pedagogy_layer
  ON pedagogy_knowledge_chunks (pedagogy_key, layer);

-- HNSW index for vector similarity search
-- HNSW chosen over IVFFlat for our scale: better recall, no training step, fast for small corpora
-- Cosine similarity is the standard for OpenAI embeddings
CREATE INDEX idx_pedagogy_chunks_embedding
  ON pedagogy_knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- GIN index on metadata for tag-based filtering
CREATE INDEX idx_pedagogy_chunks_metadata
  ON pedagogy_knowledge_chunks
  USING gin (metadata);
```

### 2.4 Drizzle Schema Definition

```ts
// db/schema/pedagogy.ts
import { pgTable, text, jsonb, timestamp, customType, index } from 'drizzle-orm/pg-core'

// pgvector custom type (Drizzle doesn't have native vector support yet)
const vector = (name: string, dimensions: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dimensions})`
    },
    toDriver(value: number[]) {
      return `[${value.join(',')}]`
    },
    fromDriver(value: string) {
      return JSON.parse(value)
    },
  })(name)

export const pedagogyKnowledgeChunks = pgTable(
  'pedagogy_knowledge_chunks',
  {
    id: text('id').primaryKey(),
    pedagogyKey: text('pedagogy_key').notNull(),
    layer: text('layer').notNull(),
    text: text('text').notNull(),
    embedding: vector('embedding', 1536).notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    contentHash: text('content_hash').notNull(),
    sanityDocId: text('sanity_doc_id').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pedagogyLayerIdx: index('idx_pedagogy_chunks_pedagogy_layer').on(table.pedagogyKey, table.layer),
  })
)

export type PedagogyKnowledgeChunk = typeof pedagogyKnowledgeChunks.$inferSelect
export type NewPedagogyKnowledgeChunk = typeof pedagogyKnowledgeChunks.$inferInsert
```

The HNSW and GIN indexes must be created via raw SQL in the migration file because Drizzle's index DSL does not yet support pgvector index types or GIN with custom operators.

### 2.5 Migration File

The migration file should be created via the existing Drizzle migration tooling (likely `drizzle-kit generate`). The generated SQL should be supplemented with the raw SQL for:

1. `CREATE EXTENSION IF NOT EXISTS vector;` (at the top)
2. The HNSW vector index
3. The GIN metadata index

Sonnet should verify the existing migration file naming pattern and add the new migration in the same convention.

### 2.6 Acceptance Criteria for A2

- pgvector extension enabled on the Neon database.
- `pedagogy_knowledge_chunks` table exists with all columns and types as specified.
- All three indexes (pedagogy+layer, HNSW, GIN) are created and verifiable via `\d+ pedagogy_knowledge_chunks` in psql.
- Drizzle schema file exists and types check.
- A test insert and select using the Drizzle schema succeeds in a dev environment.
- A test cosine similarity query against a randomly seeded embedding returns ordered results.

---

## 3. Section A3 — Sanity → PG Sync Webhook Handler

### 3.1 Goal

When a pedagogy document is published or updated in Sanity, sync it to the `pedagogy_knowledge_chunks` table in Postgres. When a document is unpublished or deleted, remove the corresponding chunk.

### 3.2 Endpoint

`POST /api/pedagogy/sanity-webhook`

Implemented as a Next.js App Router API route at `app/api/pedagogy/sanity-webhook/route.ts`.

### 3.3 Authentication

Sanity webhooks support a shared secret in the `Authorization` header. The webhook must verify:

```ts
const authHeader = request.headers.get('authorization')
const expectedToken = `Bearer ${process.env.SANITY_WEBHOOK_SECRET}`
if (authHeader !== expectedToken) {
  return new Response('Unauthorized', { status: 401 })
}
```

`SANITY_WEBHOOK_SECRET` must be added to environment variables and to the Vercel project config.

### 3.4 Request Payload

Sanity webhook payloads have the shape:

```ts
type SanityWebhookPayload = {
  _type: string         // Document type, e.g. 'pedagogySourceExcerpt'
  _id: string           // Document ID
  _rev: string          // Revision
  operation: 'create' | 'update' | 'delete'
  // ... plus the document fields themselves
}
```

The webhook handler must filter to only the six pedagogy document types. All other types are ignored with a 200 OK response.

### 3.5 Sync Logic

```
1. Verify auth.
2. Parse payload.
3. If _type is not one of the six pedagogy types: return 200 OK (no-op).
4. If operation is 'delete' OR document is in draft state OR suggestedDraft is true:
     DELETE FROM pedagogy_knowledge_chunks WHERE id = $1
     return 200 OK
5. Otherwise (create or update of a published, non-draft document):
   a. Compose the embedding text from the document (see §3.6 for per-type composition rules).
   b. Compute SHA-256 content hash of the composed text.
   c. Check if a chunk with this id exists:
      - If yes and content_hash matches: skip embedding, update metadata only, return 200 OK.
      - If yes and content_hash differs: re-embed.
      - If no: embed.
   d. Call OpenAI text-embedding-3-small with the composed text.
   e. UPSERT into pedagogy_knowledge_chunks with id, pedagogy_key, layer, text, embedding, metadata, content_hash, sanity_doc_id, updated_at.
   f. Return 200 OK.
6. On any error: log the error, return 500 (Sanity will retry up to 3 times).
```

### 3.6 Embedding Text Composition Per Layer

The text that gets embedded is a composition of the document's retrievable content. Per layer:

| Layer | Composition |
|---|---|
| `pedagogySourceExcerpt` | `text` field only. The excerpt itself is the retrieval target. |
| `pedagogyPracticePattern` | `triggerTitle` + `\n\n` + `triggerContext` + `\n\n` + `traditionResponse`. (Anti-pattern is in metadata, not embedded.) |
| `pedagogyObservationalMarker` | `markerName` + `\n\n` + `whatItIndicates` + `\n\n` + markersToLookFor joined with newlines. |
| `pedagogyFacilitationVocabulary` | All verbs as `verb: meaning` lines, followed by characteristic restraints, followed by all micro-scripts as `situation: script` lines. |
| `pedagogyContraindication` | `warnedAgainst` + `\n\n` + `traditionReasoning`. |
| `pedagogyWorkedExample` | `scenario` + `\n\n` + `interpretationInTraditionVoice`. |

### 3.7 Metadata Composition

The `metadata` JSONB column carries the searchable tags and the data needed to render retrieval results without a Sanity round-trip:

```ts
{
  // Common across all layers
  layer: 'practice_pattern',  // e.g.
  pedagogyKey: 'charlotte-mason',
  excerptId: 'PP-CM-001',     // Or the equivalent ID for the layer
  authoredBy: null,           // Or the commissioned author name
  
  // Layer-specific
  themes: ['narration', 'attention'],
  capabilityThreadRelevance: ['oral_language', 'comprehension'],
  situationalRelevance: ['child_resists_lesson'],
  appliesAtAges: { min: 5, max: 12 },
  
  // For source excerpts: full attribution for retrieval-time display
  sourceAttribution: { /* ... */ },
  
  // For worked examples
  activityType: 'read_aloud_and_narration',
}
```

### 3.8 Sanity Webhook Configuration

In Sanity Studio's project settings, configure a webhook with:

- **Name:** Pedagogy KB Sync
- **URL:** `https://{production_domain}/api/pedagogy/sanity-webhook`
- **Trigger on:** Create, Update, Delete
- **Filter (GROQ):** `_type in ["pedagogySourceExcerpt", "pedagogyPracticePattern", "pedagogyObservationalMarker", "pedagogyFacilitationVocabulary", "pedagogyContraindication", "pedagogyWorkedExample"]`
- **Secret:** Set to the value of `SANITY_WEBHOOK_SECRET`
- **HTTP method:** POST
- **API version:** Latest stable

A separate webhook should be configured for the development project pointing at the dev/preview environment.

### 3.9 Acceptance Criteria for A3

- Webhook endpoint responds 200 to a manual test publish in Sanity Studio of a pedagogy document.
- Auth check rejects requests without the correct bearer token.
- Publishing a `pedagogySourceExcerpt` results in a row in `pedagogy_knowledge_chunks` with a non-null embedding.
- Updating the same document re-embeds only if the composed text changed (verified by checking `content_hash`).
- Unpublishing the document deletes the chunk row.
- Documents with `suggestedDraft: true` are excluded from sync.
- Errors are logged and surface 500 to Sanity for retry.

---

## 4. Section A4 — Embedding Pipeline

### 4.1 Goal

Compute and store OpenAI text embeddings for pedagogy chunks. This is mostly invoked from the webhook handler in §3, but also runs as a batch job for re-embedding scenarios.

### 4.2 Embedding Service Module

Create `lib/pedagogy/embedding.ts`:

```ts
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536

export async function embedText(text: string): Promise<number[]> {
  // Truncate to model's input limit (8192 tokens for text-embedding-3-small).
  // Our longest layer document is well under this; truncation is a safety net.
  const truncated = text.slice(0, 30000) // ~7500 tokens conservative
  
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncated,
    dimensions: EMBEDDING_DIMENSIONS,
  })
  
  return response.data[0].embedding
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  // OpenAI batch API supports up to 2048 inputs per call.
  // For our scale (~600 docs across all six pedagogies), single batches work fine.
  if (texts.length > 2000) {
    throw new Error('Batch size exceeds API limit; split into multiple calls')
  }
  
  const truncated = texts.map(t => t.slice(0, 30000))
  
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncated,
    dimensions: EMBEDDING_DIMENSIONS,
  })
  
  return response.data.map(d => d.embedding)
}

export const EMBEDDING_CONFIG = {
  model: EMBEDDING_MODEL,
  dimensions: EMBEDDING_DIMENSIONS,
} as const
```

### 4.3 Cost and Budget Notes

- `text-embedding-3-small` costs ~$0.02 per 1M tokens input.
- Estimated full corpus across six pedagogies: ~600 documents × ~500 tokens average = 300K tokens = ~$0.006 to embed the entire corpus.
- Re-embedding the entire corpus from scratch: still under $0.01.
- This is small enough that no budget cap or alerting is required for v1. Add a cost monitor in the admin dashboard as a v2 task.

### 4.4 Re-embedding Batch Job

Create `scripts/reembed-pedagogy-corpus.ts` as a one-off script that:

1. Connects to Sanity and pulls all published, non-draft, non-suggestedDraft documents of the six pedagogy types.
2. For each, composes the embedding text per the rules in §3.6.
3. Computes content hashes.
4. Compares to existing rows in `pedagogy_knowledge_chunks`; skips rows whose hash matches.
5. Re-embeds the changed/new ones in batches of up to 100.
6. Upserts into the table.
7. Reports stats: total processed, embedded, skipped, errors.

This script is invoked manually when:

- The embedding model is upgraded (e.g. moving to `text-embedding-3-large`).
- A bulk content authoring sprint completes.
- A backfill is needed after a webhook outage.

### 4.5 Acceptance Criteria for A4

- `embedText()` and `embedBatch()` functions exist and return valid 1536-dimensional arrays.
- A unit test calls `embedText('hello world')` and verifies the response shape.
- The batch script runs end-to-end against the existing CM v1 corpus (after Sanity import) and populates `pedagogy_knowledge_chunks` with the expected number of rows.
- Re-running the script a second time results in zero re-embeddings (all hashes match).

---

## 5. Section A5 — Retrieval Service

### 5.1 Goal

A Next.js API route that accepts a Logger entry's context and returns the top-N most relevant pedagogy chunks for use in the write-time Haiku enrichment.

### 5.2 Endpoint

`POST /api/pedagogy/retrieve`

Implemented as a Next.js App Router API route at `app/api/pedagogy/retrieve/route.ts`.

### 5.3 Authentication

This is an internal service called by the write-time enrichment service, not by clients. Auth is via a shared secret in the same pattern as the Sanity webhook:

```
Authorization: Bearer ${PEDAGOGY_RETRIEVAL_SECRET}
```

`PEDAGOGY_RETRIEVAL_SECRET` must be added to environment variables.

### 5.4 Request Schema

```ts
type RetrievalRequest = {
  pedagogyKey: string                    // e.g. 'charlotte-mason'. Required.
  capabilityThreads: string[]            // e.g. ['oral_language', 'attention']. Required, can be empty.
  ageRange: { min: number; max: number } // Required.
  activityType?: string                  // e.g. 'read_aloud_and_narration'. Optional.
  situationalSignals: string[]           // e.g. ['child_resists_lesson']. Required, can be empty.
  loggerEntryText?: string               // Optional: the parent's free-text from the Logger entry, used for query embedding.
  topN?: number                          // Default 8.
}
```

### 5.5 Response Schema

```ts
type RetrievalResponse = {
  chunks: Array<{
    id: string                           // Sanity doc ID
    pedagogyKey: string
    layer: string
    text: string                         // The chunk text
    metadata: Record<string, unknown>    // Tags, attribution, etc.
    similarityScore: number              // Cosine similarity, 0–1
    matchReasons: string[]               // Human-readable explanations: 'matched theme: narration', 'matched age range', etc.
  }>
  totalMatched: number                   // How many candidates before top-N filter
  retrievalLatencyMs: number             // For observability
  fallbackUsed: boolean                  // True if zero chunks matched and the empty array is being returned
}
```

### 5.6 Algorithm

```
1. Verify auth.
2. Parse and validate request.
3. Compose query embedding text:
   - If loggerEntryText is provided: use it directly as the embedding query.
   - Otherwise: synthesise a query from the structured fields:
     "{situationalSignals joined} | capability threads: {threads joined} | age {min}-{max} | activity: {activityType ?? 'general'}"
4. Embed the query text via the same embedTexture function from §4.2.
5. Run pgvector similarity search:
   SELECT id, pedagogy_key, layer, text, metadata,
          1 - (embedding <=> $1) AS similarity_score
   FROM pedagogy_knowledge_chunks
   WHERE pedagogy_key = $2
   ORDER BY embedding <=> $1
   LIMIT 50;  -- Cast a wider net than topN, then rerank
6. Apply rerank pass:
   - For each candidate, compute match reasons by checking metadata against request:
     - Age range overlap (boost 0.05 if overlap)
     - Capability thread overlap (boost 0.05 per matching thread, max 0.15)
     - Situational signal match (boost 0.10 per match)
     - Activity type exact match (boost 0.05)
   - Adjusted score = similarity_score + boosts
7. Apply layer balance:
   - From the reranked list, select top-N chunks ensuring:
     - At least 1 practice_pattern (if any matched)
     - At least 2 source_excerpts (if any matched)
     - At least 1 worked_example (if any matched)
     - Fill remaining slots from highest-adjusted-score regardless of layer
8. If totalMatched is 0:
   - Set fallbackUsed = true
   - Return empty chunks array
9. Return response.
```

### 5.7 Performance Budget

- p95 < 200ms for the full request including embedding.
- The OpenAI embedding call is the dominant cost (~50–100ms).
- The pgvector query against ~600 chunks is < 10ms.
- Reranking is in-memory and < 5ms.
- Acceptable for v1 without caching.

### 5.8 Failure Fallback Behaviour

Per the operational decision in §0.2, retrieval failures are silent fallbacks:

- If OpenAI embedding fails: log warning, return empty chunks array with `fallbackUsed: true`.
- If pgvector query fails: log error, return 500 (the calling write-time service should handle gracefully).
- If zero chunks match: return empty array with `fallbackUsed: true` and the calling service uses the framework summary fallback.

### 5.9 Observability Hooks

Every retrieval call emits a structured log with:

```ts
{
  event: 'pedagogy_retrieval',
  pedagogyKey: string,
  capabilityThreadsCount: number,
  situationalSignalsCount: number,
  totalMatched: number,
  topNReturned: number,
  retrievalLatencyMs: number,
  fallbackUsed: boolean,
  error?: string,
}
```

Log to the existing structured logging pipeline (whatever the codebase uses — likely console JSON in dev, Vercel logs + future ingestion in prod).

### 5.10 Acceptance Criteria for A5

- Endpoint responds 200 to a valid request with the CM corpus loaded.
- Endpoint responds 401 to unauthenticated requests.
- A request with `pedagogyKey: 'charlotte-mason'`, capability threads `['oral_language', 'attention']`, age range `{min: 6, max: 8}`, and situational signals `['child_resists_lesson']` returns chunks that include the relevant CM Practice Patterns and Source Excerpts.
- Response includes accurate `similarityScore` and `matchReasons` for each chunk.
- Layer balance is enforced: when both practice patterns and source excerpts exist, both layers appear in results.
- Fallback case (e.g. unknown pedagogyKey) returns empty array with `fallbackUsed: true`.
- p95 latency under 200ms in dev environment.

---

## 6. Section A6 — Write-Time Haiku Enrichment Refactor

### 6.1 Goal

Modify the existing write-time enrichment service so it calls the retrieval service before invoking Haiku, and includes the retrieved chunks as expanded prompt context. UC5 (two-layer AI) must continue to hold: exactly one LLM call per save.

### 6.2 Locating the Existing Service

The existing write-time enrichment service is the function that runs when a Logger entry is saved. It composes context, calls Haiku, parses the response, and persists the enriched entry. Sonnet must locate this function before refactoring; it's likely in `lib/ai/enrichment.ts` or similar. Verify against the codebase.

### 6.3 New Data Flow

```
Logger save (existing trigger)
    ↓
Existing entry context assembly (unchanged)
    ↓
NEW: Pedagogy retrieval step
    - Build retrieval request from existing context + family pedagogy profile
    - POST to /api/pedagogy/retrieve
    - Receive chunks (or empty array on fallback)
    ↓
Modified Haiku prompt assembly (see §6.4)
    ↓
Existing Haiku call (unchanged signature)
    ↓
Existing parse and persist (unchanged)
    ↓
Existing FIS rebuild queue (unchanged)
```

### 6.4 Prompt Template Modification

The existing prompt has some structure already. The refactor adds a new section after the existing context but before the instruction tail. Approximate shape:

```
[existing system / role section — UNCHANGED]

[existing entry context — UNCHANGED]

[existing family context — UNCHANGED]

<pedagogy_reference_material>
The family follows the {pedagogyKey} pedagogical approach. The following reference material has been retrieved as relevant to this entry. Use it to inform interpretation and suggestions, attributing specific guidance back to its source where appropriate.

{for each chunk:}
<reference layer="{chunk.layer}" id="{chunk.id}">
{chunk.text}
</reference>

</pedagogy_reference_material>

[existing instructions / output format section — UNCHANGED]
```

If `fallbackUsed: true` (no chunks retrieved), the `<pedagogy_reference_material>` section is replaced with the previous framework-summary fallback content from the existing prompt. This preserves backward compatibility and is the operational fallback decided in §0.2.

### 6.5 Token Budget

The retrieved chunks must fit within the prompt context budget. Enforce a soft cap:

- Maximum total tokens for retrieved chunks: 2000 (approx).
- If the top-N chunks exceed this, drop chunks from the bottom of the list until under the cap.
- The simplest token estimator is `text.length / 4`. Use this rather than a tokenizer library for v1.

### 6.6 UC5 Verification

Critical: this refactor MUST NOT introduce a second LLM call per save. The retrieval service makes an embedding call, but per `hearth-alpha-use-case-verification-v1.md` UC5, embedding calls do not count as the kind of LLM call that violates the two-layer AI principle. Embeddings are infrastructure; they are not generative reasoning calls.

Sonnet should explicitly verify after refactor that:

1. The write-time enrichment service makes exactly one Haiku call per save.
2. The retrieval service makes exactly one embedding call per retrieval (not one per chunk).
3. Read-time screens still make zero LLM calls.

If any of these change, UC5 is violated and the refactor is wrong.

### 6.7 Calling the Retrieval Service Internally

Since the retrieval service is exposed as `/api/pedagogy/retrieve`, the write-time enrichment service can either:

1. Call it via `fetch()` with the bearer token (cleaner separation, slightly more latency).
2. Call the underlying retrieval function directly without going through HTTP (lower latency, tighter coupling).

**Recommendation: option 2.** Extract the core retrieval logic into a function `retrievePedagogyChunks()` in `lib/pedagogy/retrieval.ts`. The API route is a thin wrapper around this function. The write-time enrichment service imports and calls the function directly.

This avoids unnecessary HTTP overhead in serverless contexts and keeps the API route as a debugging/admin surface.

### 6.8 Acceptance Criteria for A6

- The write-time enrichment service compiles and existing tests pass.
- A test save of a Logger entry for a CM family triggers a retrieval call and includes pedagogy reference material in the Haiku prompt.
- A test save for a family with an unknown or empty pedagogy key uses the framework-summary fallback and does not error.
- Manual verification: examine the actual prompt sent to Haiku for a real test entry; confirm the structure matches §6.4.
- UC5 verification check passes: exactly one Haiku call per save, confirmed via instrumentation.
- Existing FIS rebuild and entry persistence behaviour is unchanged.

---

## 7. Cross-Cutting Concerns

### 7.1 Environment Variables

Three new environment variables are introduced:

| Variable | Purpose | Where set |
|---|---|---|
| `OPENAI_API_KEY` | Embeddings via OpenAI API | Vercel project settings (production + preview); `.env.local` for dev |
| `SANITY_WEBHOOK_SECRET` | Auth for Sanity → PG sync webhook | Vercel + Sanity project webhook config + `.env.local` |
| `PEDAGOGY_RETRIEVAL_SECRET` | Auth for retrieval API endpoint | Vercel + `.env.local` |

`OPENAI_API_KEY` may already exist in the codebase if Hearth uses OpenAI for any other purpose. Verify before adding.

### 7.2 Feature Flag

Recommend adding a `PEDAGOGY_KB_ENABLED` boolean feature flag (default `false`) that gates the retrieval call in the write-time enrichment service. This allows the engineering work to land without immediately changing user-visible behaviour. Flip to `true` after the CM corpus is fully embedded and validated.

### 7.3 Monitoring

Add three new entries to whatever monitoring dashboard or admin observability surface exists:

- Pedagogy chunks count (per pedagogy_key, per layer)
- Retrieval call rate and p95 latency
- Retrieval fallback rate (high values indicate corpus gaps)

These can be deferred until after the corpus is in production, but the structured logs from §5.9 should be in place from day one so the data is captured.

### 7.4 Rollback Plan

If the refactor causes problems in production:

1. **Immediate:** Set `PEDAGOGY_KB_ENABLED=false`. The write-time enrichment falls back to the previous framework-summary path. No data loss, no broken saves.
2. **If schemas or migration cause issues:** The Drizzle migration is forward-only by default, but the `pedagogy_knowledge_chunks` table can be safely truncated or dropped without affecting any other table. The Sanity schemas can be removed from the Studio config without affecting any other content type.
3. **If the retrieval service has a bug:** Disable via feature flag and patch.

The architecture is intentionally additive — no existing tables are modified, no existing services are replaced, only extended.

---

## 8. Acceptance Criteria for the Whole Implementation

The implementation is complete when all of the following hold:

- All six Sanity schemas exist and are registered.
- The Drizzle migration has been applied to dev and production Neon instances.
- The Sanity webhook endpoint syncs published documents to the chunks table.
- The CM v1 corpus has been imported into Sanity and successfully embedded into the chunks table.
- The retrieval service returns relevant chunks for realistic test inputs.
- The write-time enrichment service includes pedagogy reference material in the Haiku prompt when the feature flag is enabled.
- UC5 verification passes: exactly one Haiku call per save.
- The feature flag is in place and defaulted to `false`.
- Environment variables are documented in the README or equivalent.

After this, the work to switch from "engineering complete" to "in production" is:

1. Author the full CM Wave 1 corpus (~100 documents).
2. Import to Sanity and verify embeddings.
3. Test the retrieval and enrichment flow against real Logger entries in alpha.
4. Flip the feature flag to `true`.
5. Monitor for a week.

---

## Appendix A — Sonnet Prompt Sequence

Six numbered prompts ready for paste into Claude Code Sonnet sessions. Each prompt is self-contained: it references this spec, names the relevant sections, lists preflight files to read, and states acceptance criteria. Run them in order. After each, verify acceptance criteria before moving to the next.

### Prompt 1 — Sanity Schemas

```
Implement Section A1 of hearth-pedagogy-knowledge-base-implementation-spec-v1.md.

Goal: create six new Sanity document types for the pedagogy knowledge base.

Preflight (read these first, in order):
1. hearth-pedagogy-knowledge-base-implementation-spec-v1.md §1 (full section)
2. hearth-pedagogy-knowledge-base-architecture-v1.md §3 (six layers)
3. hearth-sanity-document-json-reference-v1.md (for naming conventions)
4. The existing Sanity schema files for pedagogicalFramework — view this file directly to confirm the existing pedagogy reference convention

Task:
- Create six schema files under sanity/schemas/pedagogy/ matching the definitions in §1.3.
- Register all six in the Sanity Studio schema config.
- Group them under a "Pedagogy Knowledge Base" desk structure section.
- Match existing project conventions where they conflict with the spec (specifically: field naming case, ID conventions, validation patterns).

Acceptance criteria from §1.5:
- All six schema files exist under sanity/schemas/pedagogy/.
- All six are registered in the Studio config.
- Manual test publish in Sanity Studio of a pedagogySourceExcerpt for the existing charlotte-mason framework succeeds.
- Schema validation triggers on missing required fields.

Output: confirm completion and list the files created/modified. Do not proceed to A2.
```

### Prompt 2 — Drizzle Migration with pgvector

```
Implement Section A2 of hearth-pedagogy-knowledge-base-implementation-spec-v1.md.

Goal: enable pgvector on Neon and create the pedagogy_knowledge_chunks table with HNSW vector index.

Preflight (read these first):
1. hearth-pedagogy-knowledge-base-implementation-spec-v1.md §2 (full section)
2. The existing Drizzle schema directory — view to understand the current migration pattern, naming convention, and how raw SQL is invoked
3. The existing migration files to confirm the file naming convention
4. The Neon connection string and access pattern in env config

Task:
- Generate a new Drizzle migration that enables the pgvector extension and creates the pedagogy_knowledge_chunks table.
- Add the HNSW and GIN indexes via raw SQL in the migration file (Drizzle's index DSL doesn't support these).
- Add the Drizzle schema definition file at db/schema/pedagogy.ts per §2.4.
- Verify the migration applies cleanly to dev Neon.

Acceptance criteria from §2.6:
- pgvector extension enabled on dev Neon.
- pedagogy_knowledge_chunks table exists with all columns and types.
- All three indexes verifiable via psql \d+.
- Drizzle schema typechecks.
- A test insert + cosine similarity select succeeds.

Output: confirm completion, list files, and report the migration filename. Do not proceed to A3.
```

### Prompt 3 — Sanity → PG Sync Webhook

```
Implement Section A3 of hearth-pedagogy-knowledge-base-implementation-spec-v1.md.

Goal: a Next.js API route that receives Sanity publish webhooks for pedagogy documents and syncs them to pedagogy_knowledge_chunks.

Preflight (read these first):
1. hearth-pedagogy-knowledge-base-implementation-spec-v1.md §3 (full section) and §4 (embedding service used inside)
2. The existing Next.js App Router API routes to confirm the conventions for route handlers
3. The existing env var loading pattern
4. The Sanity client config in the codebase
5. The Drizzle client config pattern for writing to the new table

Task:
- Create lib/pedagogy/embedding.ts per §4.2 first (it's a dependency of the webhook).
- Create the API route at app/api/pedagogy/sanity-webhook/route.ts.
- Implement auth verification, payload parsing, type filtering, and the sync logic from §3.5.
- Implement the embedding text composition rules from §3.6 for all six layer types.
- Add SANITY_WEBHOOK_SECRET to env.example and document in the README env section.

Acceptance criteria from §3.9:
- Webhook responds 200 to a manual test publish.
- Auth check works.
- Publishing a SourceExcerpt creates a chunk row with embedding.
- Update with same content does not re-embed (hash check).
- Unpublish deletes the chunk row.
- Drafts and suggestedDraft documents are excluded.

Output: confirm completion, list files, report the route URL, and state what manual Sanity Studio webhook config is needed (per §3.8). Do not proceed to A4.
```

### Prompt 4 — Embedding Pipeline Batch Job

```
Implement Section A4 of hearth-pedagogy-knowledge-base-implementation-spec-v1.md.

Note: §4.2 (the embedding service module) was already created in the previous prompt as a dependency of A3. This prompt focuses on the batch re-embedding script.

Goal: a one-off script that re-embeds the entire pedagogy corpus from Sanity.

Preflight (read these first):
1. hearth-pedagogy-knowledge-base-implementation-spec-v1.md §4 (full section)
2. The existing scripts/ directory to understand the script conventions in this project
3. The Sanity client config for fetching documents

Task:
- Create scripts/reembed-pedagogy-corpus.ts per §4.4.
- The script must handle all six layer types with the same composition rules used in the webhook (§3.6).
- It must skip rows whose content_hash matches the existing row.
- It must use embedBatch() for efficiency, batching up to 100 docs per call.
- It must report final stats: total processed, embedded, skipped, errors.

Acceptance criteria from §4.5:
- embedText() and embedBatch() return valid 1536-dimensional arrays (already verified in A3).
- Script runs end-to-end against the existing CM v1 corpus once it has been imported to Sanity.
- Re-running results in zero re-embeddings.

Output: confirm completion, list files, document how to invoke the script. Do not proceed to A5.
```

### Prompt 5 — Retrieval Service

```
Implement Section A5 of hearth-pedagogy-knowledge-base-implementation-spec-v1.md.

Goal: a retrieval function and Next.js API route that returns top-N relevant pedagogy chunks for a given Logger entry context.

Preflight (read these first):
1. hearth-pedagogy-knowledge-base-implementation-spec-v1.md §5 (full section) and §6.7 (function vs API route split)
2. The existing API route patterns
3. The Drizzle client config for raw SQL queries (pgvector cosine similarity uses the <=> operator which Drizzle may not natively support — verify and use raw SQL if needed)

Task:
- Create lib/pedagogy/retrieval.ts containing the core retrievePedagogyChunks() function per §5.6.
- Implement the embedding query composition, pgvector search, rerank pass, and layer balance logic.
- Create app/api/pedagogy/retrieve/route.ts as a thin wrapper around the function for debugging/admin use.
- Add PEDAGOGY_RETRIEVAL_SECRET to env.example.
- Add structured logging per §5.9.

Acceptance criteria from §5.10:
- Endpoint responds 200 with a valid response shape.
- A test request for charlotte-mason with capability threads ['oral_language', 'attention'], age range {6,8}, and signal ['child_resists_lesson'] returns chunks including the expected CM Practice Patterns and Source Excerpts.
- matchReasons are populated.
- Layer balance is enforced.
- Fallback case returns empty array with fallbackUsed: true.
- p95 latency under 200ms in dev.

Output: confirm completion, list files, and run a manual smoke test against the retrieve endpoint reporting the response. Do not proceed to A6.
```

### Prompt 6 — Write-Time Haiku Enrichment Refactor

```
Implement Section A6 of hearth-pedagogy-knowledge-base-implementation-spec-v1.md.

Goal: refactor the existing write-time enrichment service to call the retrieval function and include retrieved chunks in the Haiku prompt, gated by a feature flag.

Preflight (read these first, carefully):
1. hearth-pedagogy-knowledge-base-implementation-spec-v1.md §6 (full section) and §7 (cross-cutting)
2. hearth-alpha-use-case-verification-v1.md UC5 (two-layer AI) — must continue to hold
3. The existing write-time Haiku enrichment service file — view this directly. Likely at lib/ai/enrichment.ts or similar. Identify it and confirm its current signature, prompt template, and call pattern before any modifications.
4. lib/pedagogy/retrieval.ts (created in the previous prompt)

Task:
- Add PEDAGOGY_KB_ENABLED feature flag (default false) to env config.
- Locate the existing prompt template and add the new <pedagogy_reference_material> section per §6.4.
- Modify the enrichment service to call retrievePedagogyChunks() before the Haiku call when the feature flag is on.
- Implement the token budget cap per §6.5.
- Implement the silent fallback behaviour per §6.6 and §0.2.
- Add UC5 verification: instrument the enrichment service to count Haiku calls per save and assert exactly one.

Critical constraint: do not introduce a second LLM call per save. The retrieval embedding call is infrastructure, not generative — it does not count as an LLM call for UC5 purposes. But adding any new generative call (e.g. a separate Haiku call for "summarising the retrieved chunks") would violate UC5 and is forbidden.

Acceptance criteria from §6.8:
- Enrichment service compiles, existing tests pass.
- Test save for a CM family with feature flag on triggers retrieval and includes reference material in the prompt.
- Test save for a family with no pedagogy key uses fallback path and does not error.
- Manual verification of the actual prompt sent to Haiku confirms structure matches §6.4.
- UC5 verification passes: one Haiku call per save.
- FIS rebuild and entry persistence behaviour unchanged.

Output: confirm completion, list files, paste a sample of the actual modified prompt as sent to Haiku for one test entry. Report UC5 verification result.

This is the final implementation prompt. After this, the engineering side of the pedagogy knowledge base is complete.
```

---

## Appendix B — Verification Checklist

After all six prompts have run, run this end-to-end verification before declaring the implementation complete:

1. **Sanity:** Open Sanity Studio. Confirm all six new types appear in the desk structure under "Pedagogy Knowledge Base". Publish a test SourceExcerpt and verify it survives validation.

2. **Database:** Connect to Neon with psql. Run `\d+ pedagogy_knowledge_chunks`. Confirm all columns, all three indexes, vector(1536) type.

3. **Webhook:** In Sanity Studio, modify and republish a pedagogy document. Check the Vercel function logs for the webhook handler. Confirm a row appears in `pedagogy_knowledge_chunks`.

4. **Embedding:** Run `pnpm tsx scripts/reembed-pedagogy-corpus.ts` (or whatever the project script invocation pattern is). Confirm it imports the existing CM v1 corpus end to end and reports the expected count.

5. **Retrieval:** Make a curl request to `/api/pedagogy/retrieve` with the bearer token and a test payload. Confirm structured response with chunks, scores, and matchReasons.

6. **Enrichment:** Set `PEDAGOGY_KB_ENABLED=true` in dev. Save a test Logger entry through the Logger UI for a CM family. Inspect the structured logs to confirm:
   - One pedagogy_retrieval log with chunks returned
   - One Haiku call (UC5)
   - The prompt sent to Haiku contains the `<pedagogy_reference_material>` section

7. **UC5:** Save 10 test Logger entries in succession. Count Haiku calls. Must equal exactly 10.

8. **Fallback:** Set the family's pedagogy_key to an invalid value. Save a Logger entry. Confirm it succeeds, the retrieval logs show fallbackUsed: true, and the prompt uses the framework-summary fallback path.

If all eight pass, the implementation is complete and the feature flag can be flipped on for alpha after the full CM Wave 1 corpus is authored.

---

## Appendix C — What Comes After This

After implementation completion, four streams of work follow naturally:

1. **CM Wave 1 corpus authoring sprint** — bring the existing v1 corpus from ~30 entries to ~100 entries (the full target volume). Content work, parallelisable across the engineering completion.

2. **Pedagogy Engine v2 spec revision** — `hearth-pedagogy-engine-spec-v1.md` sections 7 and 8 are partially superseded by this implementation. Write a v2 of the engine spec documenting the new consumption pattern.

3. **Wave 5 Unschooling guest author commissioning** — proceed per `hearth-pedagogy-corpus-licensing-needs-v2.md` §6 and §10. Outreach to Pam Laricchia, Sue Elvis, Sue Patterson, Freya Dawson.

4. **Admin observability surface for the knowledge base** — add the three monitoring entries from §7.3 to the Platform Operations Dashboard once that exists.

None of these block beta. The Pedagogy Knowledge Base is the differentiation play; Provider Code Management remains the beta gate.

---

*This document is the canonical implementation contract for the Pedagogy Knowledge Base. Sonnet executes against it; updates require versioning. After all six sections are complete and verified, this document can be marked "Implemented" in COMPONENT_REGISTRY.md and the Pedagogy Engine v2 spec inherits the new architecture as its baseline.*
