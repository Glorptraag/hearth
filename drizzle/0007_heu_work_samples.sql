-- HEU Compliance: Reports, Work Samples, Annotations
CREATE TABLE "heu_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"learner_id" uuid NOT NULL,
	"report_year" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"last_exported_at" timestamp,
	"choice_area" text DEFAULT 'science',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "hr_family_learner_year" UNIQUE("family_id","learner_id","report_year")
);
--> statement-breakpoint
CREATE TABLE "work_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"slot" text NOT NULL,
	"entry_id" uuid,
	"status" text DEFAULT 'empty' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ws_report_slot" UNIQUE("report_id","slot")
);
--> statement-breakpoint
CREATE TABLE "work_sample_annotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_sample_id" uuid NOT NULL,
	"observations" text,
	"observations_source" text DEFAULT 'parent_written',
	"needs_strengths" text,
	"needs_strengths_source" text DEFAULT 'parent_written',
	"adjustment" text,
	"adjustment_source" text DEFAULT 'parent_written',
	"planning" text,
	"planning_source" text DEFAULT 'parent_written',
	"progression_summary" text,
	"progression_summary_edited" boolean DEFAULT false,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "work_sample_annotations_work_sample_id_unique" UNIQUE("work_sample_id")
);
--> statement-breakpoint
ALTER TABLE "learning_entries" ADD COLUMN "heu_candidate" boolean DEFAULT false;
--> statement-breakpoint
CREATE INDEX "ws_entry_idx" ON "work_samples" USING btree ("entry_id");
--> statement-breakpoint
ALTER TABLE "heu_reports" ADD CONSTRAINT "heu_reports_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "heu_reports" ADD CONSTRAINT "heu_reports_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "work_samples" ADD CONSTRAINT "work_samples_report_id_heu_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."heu_reports"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "work_samples" ADD CONSTRAINT "work_samples_entry_id_learning_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."learning_entries"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "work_sample_annotations" ADD CONSTRAINT "work_sample_annotations_work_sample_id_work_samples_id_fk" FOREIGN KEY ("work_sample_id") REFERENCES "public"."work_samples"("id") ON DELETE no action ON UPDATE no action;
