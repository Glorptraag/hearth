BEGIN;
--> statement-breakpoint
-- The Logger's structured capture context (activity-type chip, observation
-- chips, where, how long). Previously dropped at save time; now persisted so
-- the enrichment prompt and pedagogy retrieval can read it. Nullable: rows
-- saved before this migration simply carry NULL.
ALTER TABLE "learning_entries" ADD COLUMN IF NOT EXISTS "logger_context" jsonb;
--> statement-breakpoint
COMMIT;
