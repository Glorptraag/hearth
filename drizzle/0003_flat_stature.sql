ALTER TABLE "notifications" ADD COLUMN "snoozed_until" timestamp;--> statement-breakpoint
ALTER TABLE "planner_entries" ADD COLUMN "session" text DEFAULT 'morning';--> statement-breakpoint
ALTER TABLE "planner_entries" ADD COLUMN "subjects" text[];