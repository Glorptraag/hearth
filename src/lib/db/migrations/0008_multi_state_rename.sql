-- Multi-state adaptation: rename HEU-specific columns to generic names
-- Remove QLD default from state column

ALTER TABLE "family_settings" RENAME COLUMN "heu_registration_number" TO "registration_number";
ALTER TABLE "family_settings" RENAME COLUMN "heu_next_report_date" TO "next_report_date";
ALTER TABLE "family_settings" ALTER COLUMN "state" DROP DEFAULT;
