-- Capability Universe v2 substrate + pedagogy knowledge chunks.
-- Folds the never-applied src/lib/db/migrations/0010_capability_universe_v2.sql
-- and src/lib/db/migrations/add_pedagogy_knowledge_chunks.sql into the
-- canonical drizzle chain. All operations are idempotent so this is safe
-- to run against prod even if portions were applied out-of-band previously.
--
-- See docs/hearth-capability-universe-v2-architecture-spec-v1.md.

BEGIN;

-- ── learning_entries: capture-time library version + v2 thread links ──
ALTER TABLE "learning_entries"
  ADD COLUMN IF NOT EXISTS "captured_library_version" text NOT NULL DEFAULT '2.0.0';
--> statement-breakpoint
ALTER TABLE "learning_entries"
  ADD COLUMN IF NOT EXISTS "thread_links" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint

-- ── badge_definitions: additive v2 columns ──
-- DEVIATION from plan: the v1 columns (criteria_summary, indicator_statements,
-- capability_thread_ids, observation_threshold) are NOT dropped here. ~10 runtime
-- callsites (badges API, recommend, snapshot-rebuild, build UI) still read them.
-- v1 columns will be dropped in a follow-up PR alongside the badge v2 code cut-over.
ALTER TABLE "badge_definitions"
  ADD COLUMN IF NOT EXISTS "what_it_recognises" text,
  ADD COLUMN IF NOT EXISTS "parent_narrative" text,
  ADD COLUMN IF NOT EXISTS "thread_id" text,
  ADD COLUMN IF NOT EXISTS "stage_band" text,
  ADD COLUMN IF NOT EXISTS "criteria" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "criteria_policy" text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS "threshold_count" integer,
  ADD COLUMN IF NOT EXISTS "prerequisite_badge_ids" text[],
  ADD COLUMN IF NOT EXISTS "introduced_in_version" text NOT NULL DEFAULT '2.0.0',
  ADD COLUMN IF NOT EXISTS "canon_status" text NOT NULL DEFAULT 'active';
--> statement-breakpoint

-- ── family_library_state ──
CREATE TABLE IF NOT EXISTS "family_library_state" (
  "family_id" uuid PRIMARY KEY REFERENCES "families"("id"),
  "current_library_version" text NOT NULL DEFAULT '2.0.0',
  "pinned_at_version" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
INSERT INTO "family_library_state" ("family_id", "current_library_version")
SELECT "id", '2.0.0' FROM "families"
ON CONFLICT ("family_id") DO NOTHING;
--> statement-breakpoint

-- ── library_upgrade_events ──
CREATE TABLE IF NOT EXISTS "library_upgrade_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "family_id" uuid NOT NULL REFERENCES "families"("id"),
  "from_version" text NOT NULL,
  "to_version" text NOT NULL,
  "upgraded_at" timestamp NOT NULL DEFAULT now(),
  "observations_retagged" integer NOT NULL DEFAULT 0,
  "observations_carried_as_legacy" integer NOT NULL DEFAULT 0,
  "notes" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lue_family_idx" ON "library_upgrade_events" ("family_id", "upgraded_at");
--> statement-breakpoint

-- ── custom_threads (family-authored, D11) ──
CREATE TABLE IF NOT EXISTS "custom_threads" (
  "id" text PRIMARY KEY,
  "family_id" uuid NOT NULL REFERENCES "families"("id"),
  "created_by_user_id" text NOT NULL,
  "name" text NOT NULL,
  "summary" text,
  "tier_indicators" jsonb NOT NULL DEFAULT '{"emerging":[],"developing":[],"demonstrating":[]}'::jsonb,
  "domain_affinity" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ct_family_idx" ON "custom_threads" ("family_id");
--> statement-breakpoint

-- ── pedagogy_knowledge_chunks (PKB vector store, runtime read by src/lib/pedagogy/retrieval.ts) ──
-- Requires pgvector. Folded from src/lib/db/migrations/add_pedagogy_knowledge_chunks.sql.
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pedagogy_knowledge_chunks" (
  "id" text PRIMARY KEY,
  "pedagogy_key" text NOT NULL,
  "layer" text NOT NULL CHECK ("layer" IN (
    'source_excerpt',
    'practice_pattern',
    'observational_marker',
    'facilitation_vocabulary',
    'contraindication',
    'worked_example'
  )),
  "text" text NOT NULL,
  "embedding" vector(1024) NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "content_hash" text NOT NULL,
  "sanity_doc_id" text NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pedagogy_chunks_pedagogy_layer"
  ON "pedagogy_knowledge_chunks" ("pedagogy_key", "layer");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pedagogy_chunks_embedding"
  ON "pedagogy_knowledge_chunks"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 128);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pedagogy_chunks_metadata"
  ON "pedagogy_knowledge_chunks"
  USING gin ("metadata");

COMMIT;
