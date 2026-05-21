-- Normalize HEU-prefixed columns/tables to multi-state-friendly names.
-- Folds the never-applied src/lib/db/migrations/0008_multi_state_rename.sql
-- and 0009_compliance_rename.sql into the canonical drizzle chain.
--
-- The hot-fix `work_sample_candidate` column added in 0012 is dropped here
-- before the rename so we don't end up with two columns of the same name.

BEGIN;

ALTER TABLE "family_settings" RENAME COLUMN "heu_registration_number" TO "registration_number";
--> statement-breakpoint
ALTER TABLE "family_settings" RENAME COLUMN "heu_next_report_date" TO "next_report_date";
--> statement-breakpoint
ALTER TABLE "family_settings" ALTER COLUMN "state" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "heu_reports" RENAME TO "compliance_reports";
--> statement-breakpoint
ALTER TABLE "learning_entries" DROP COLUMN IF EXISTS "work_sample_candidate";
--> statement-breakpoint
ALTER TABLE "learning_entries" RENAME COLUMN "heu_candidate" TO "work_sample_candidate";

COMMIT;
