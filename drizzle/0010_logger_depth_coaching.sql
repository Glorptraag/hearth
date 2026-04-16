ALTER TABLE "families" ADD COLUMN "logger_default_mode" text;
--> statement-breakpoint
ALTER TABLE "learning_entries" ADD COLUMN "observation_details" jsonb DEFAULT '{}';
