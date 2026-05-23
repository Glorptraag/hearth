-- Write-time AI quality score for HEU work-sample candidate ranking.
-- Populated by enrich.ts alongside the existing work_sample_candidate flag.
-- Range 0.0-1.0. Null for entries enriched before this column existed.
-- See docs/hearth-heu-work-sample-curation-spec-v1.md §3.2.

BEGIN;

ALTER TABLE "learning_entries" ADD COLUMN IF NOT EXISTS "work_sample_quality" numeric(3,2);

COMMIT;
