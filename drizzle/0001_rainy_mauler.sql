CREATE TABLE "ai_pipeline_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"entry_id" uuid,
	"model_used" text NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"latency_ms" integer NOT NULL,
	"confidence" numeric(3, 2),
	"retry_triggered" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "module_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"pathway" text NOT NULL,
	"draft_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "badge_definitions" ALTER COLUMN "observation_threshold" SET DEFAULT 5;--> statement-breakpoint
ALTER TABLE "badge_definitions" ADD COLUMN "indicator_statements" text[];--> statement-breakpoint
ALTER TABLE "learners" ADD COLUMN "profile_data" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "ai_pipeline_logs" ADD CONSTRAINT "ai_pipeline_logs_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_pipeline_logs" ADD CONSTRAINT "ai_pipeline_logs_entry_id_learning_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."learning_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_drafts" ADD CONSTRAINT "module_drafts_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "apl_family_idx" ON "ai_pipeline_logs" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "apl_created_idx" ON "ai_pipeline_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "md_family_status_idx" ON "module_drafts" USING btree ("family_id","status");