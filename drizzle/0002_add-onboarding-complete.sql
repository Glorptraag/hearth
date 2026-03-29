ALTER TABLE "badge_assessment_logs" ADD COLUMN "cooling_until" timestamp;--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "onboarding_complete" boolean DEFAULT false NOT NULL;