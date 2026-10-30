BEGIN;
--> statement-breakpoint
-- Photo Read + working-from. drafted_by records who wrote the entry text (the
-- parent, or an accepted/edited Read draft); read_output holds the validated
-- Read result; working_from is the shelf resource/lesson, written only on
-- parent confirm. families.photo_read_opt_in is NULL until the family answers
-- the first-photo disclosure. Existing rows backfill to 'parent' / NULL.
ALTER TABLE "learning_entries" ADD COLUMN IF NOT EXISTS "drafted_by" text DEFAULT 'parent' NOT NULL;
--> statement-breakpoint
ALTER TABLE "learning_entries" ADD CONSTRAINT "le_drafted_by_check" CHECK ("learning_entries"."drafted_by" IN ('parent', 'read'));
--> statement-breakpoint
ALTER TABLE "learning_entries" ADD COLUMN IF NOT EXISTS "read_output" jsonb;
--> statement-breakpoint
ALTER TABLE "learning_entries" ADD COLUMN IF NOT EXISTS "working_from" jsonb;
--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN IF NOT EXISTS "photo_read_opt_in" boolean;
--> statement-breakpoint
COMMIT;
