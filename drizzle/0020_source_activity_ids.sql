-- Activity-level granularity on learning entries.
--
-- Before this migration, entries could record `source_module_id` only — but
-- a module typically contains 2–5 activities (across approaches), and a
-- logged session may exercise only a subset. Without activity IDs:
--   - AI enrichment can only map at module granularity, losing per-activity
--     capability-thread mapping that activities declare in Sanity.
--   - The Portfolio cannot show per-activity evidence.
--   - The unused `thread_links` jsonb column can never be populated from
--     declarative activity metadata.
--
-- This migration adds:
--   - source_activity_ids text[]  (which activities ran during the session)
--   - source_approach_id  text    (which modality the parent picked)
--
-- The Logger's retrospective "attach to module" flow (PATCH /api/entries/[id])
-- also populates these.
--
-- See deepwork plan: .claude/plans/make-a-deepwork-plan-velvety-candy.md
-- workstreams D + E + F.

BEGIN;

ALTER TABLE "learning_entries"
  ADD COLUMN IF NOT EXISTS "source_activity_ids" text[] DEFAULT '{}';

--> statement-breakpoint

ALTER TABLE "learning_entries"
  ADD COLUMN IF NOT EXISTS "source_approach_id" text;

COMMIT;
