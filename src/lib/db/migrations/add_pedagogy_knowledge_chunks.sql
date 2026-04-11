-- Pedagogy Knowledge Base — vector chunk store
-- Requires pgvector extension (available on Neon).
-- Run after: add_pedagogy_values_practices.sql

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS pedagogy_knowledge_chunks (
  -- Stable identifier: Sanity doc ID
  id                TEXT        PRIMARY KEY,

  -- Which of the 6 pedagogical frameworks this chunk belongs to
  pedagogy_key      TEXT        NOT NULL,

  -- PKB layer this chunk came from
  layer             TEXT        NOT NULL
    CHECK (layer IN (
      'source_excerpt',
      'practice_pattern',
      'observational_marker',
      'facilitation_vocabulary',
      'contraindication',
      'worked_example'
    )),

  -- Composed retrievable text (built by chunk-builder, embedded by Voyage AI)
  text              TEXT        NOT NULL,

  -- voyage-3 produces 1024-dimensional vectors
  embedding         vector(1024) NOT NULL,

  -- Non-embedded metadata used for reranking (age range, capability threads, tags)
  metadata          JSONB       NOT NULL DEFAULT '{}',

  -- SHA-256 of composed text; used to skip re-embedding when content hasn't changed
  content_hash      TEXT        NOT NULL,

  -- Back-reference to source Sanity document
  sanity_doc_id     TEXT        NOT NULL,

  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Filter by framework + layer before similarity search
CREATE INDEX IF NOT EXISTS idx_pedagogy_chunks_pedagogy_layer
  ON pedagogy_knowledge_chunks (pedagogy_key, layer);

-- HNSW index for approximate nearest-neighbour cosine similarity
-- ef_construction=128, m=16 are sensible defaults for a corpus of ~600 docs
CREATE INDEX IF NOT EXISTS idx_pedagogy_chunks_embedding
  ON pedagogy_knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 128);

-- GIN index for metadata tag/thread overlap queries
CREATE INDEX IF NOT EXISTS idx_pedagogy_chunks_metadata
  ON pedagogy_knowledge_chunks
  USING gin (metadata);
