CREATE TABLE "hearth_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hearth_id" uuid NOT NULL,
	"invited_by_family_id" uuid NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_by_family_id" uuid,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "hearth_invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "hearth_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hearth_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"invited_by_family_id" uuid,
	"consent_cross_observation" boolean DEFAULT false NOT NULL,
	"consent_evidence_sharing" boolean DEFAULT false NOT NULL,
	"left_at" timestamp,
	CONSTRAINT "hm_hearth_family_uniq" UNIQUE("hearth_id","family_id")
);
--> statement-breakpoint
CREATE TABLE "hearth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hearth_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" date NOT NULL,
	"time_start" text,
	"time_end" text,
	"location" text,
	"facilitator_family_id" uuid NOT NULL,
	"facilitator_user_id" text,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"module_reference" text,
	"activity_reference" text,
	"prep_notes" text,
	"shared_record" text,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "hearths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"location" text,
	"created_by_family_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
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
CREATE TABLE "session_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"rsvp_status" text DEFAULT 'pending' NOT NULL,
	"actually_attended" boolean,
	"learner_ids" uuid[],
	CONSTRAINT "sa_session_family_uniq" UNIQUE("session_id","family_id")
);
--> statement-breakpoint
CREATE TABLE "session_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"uploaded_by_family_id" uuid NOT NULL,
	"uploaded_by_user_id" text,
	"file_url" text NOT NULL,
	"file_type" text,
	"caption" text,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_reflections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"user_id" text,
	"reflection_text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suggested_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"observer_family_id" uuid NOT NULL,
	"observer_user_id" text,
	"target_family_id" uuid NOT NULL,
	"target_learner_id" uuid NOT NULL,
	"observation_text" text NOT NULL,
	"evidence_ids" uuid[] DEFAULT '{}',
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"family_entry_id" uuid
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
ALTER TABLE "learning_entries" ADD COLUMN "source_session_id" uuid;--> statement-breakpoint
ALTER TABLE "learning_entries" ADD COLUMN "heu_candidate" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "hearth_invites" ADD CONSTRAINT "hearth_invites_hearth_id_hearths_id_fk" FOREIGN KEY ("hearth_id") REFERENCES "public"."hearths"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hearth_invites" ADD CONSTRAINT "hearth_invites_invited_by_family_id_families_id_fk" FOREIGN KEY ("invited_by_family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hearth_invites" ADD CONSTRAINT "hearth_invites_used_by_family_id_families_id_fk" FOREIGN KEY ("used_by_family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hearth_memberships" ADD CONSTRAINT "hearth_memberships_hearth_id_hearths_id_fk" FOREIGN KEY ("hearth_id") REFERENCES "public"."hearths"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hearth_memberships" ADD CONSTRAINT "hearth_memberships_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hearth_memberships" ADD CONSTRAINT "hearth_memberships_invited_by_family_id_families_id_fk" FOREIGN KEY ("invited_by_family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hearth_sessions" ADD CONSTRAINT "hearth_sessions_hearth_id_hearths_id_fk" FOREIGN KEY ("hearth_id") REFERENCES "public"."hearths"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hearth_sessions" ADD CONSTRAINT "hearth_sessions_facilitator_family_id_families_id_fk" FOREIGN KEY ("facilitator_family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hearths" ADD CONSTRAINT "hearths_created_by_family_id_families_id_fk" FOREIGN KEY ("created_by_family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heu_reports" ADD CONSTRAINT "heu_reports_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heu_reports" ADD CONSTRAINT "heu_reports_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_session_id_hearth_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."hearth_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_evidence" ADD CONSTRAINT "session_evidence_session_id_hearth_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."hearth_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_evidence" ADD CONSTRAINT "session_evidence_uploaded_by_family_id_families_id_fk" FOREIGN KEY ("uploaded_by_family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_reflections" ADD CONSTRAINT "session_reflections_session_id_hearth_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."hearth_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_reflections" ADD CONSTRAINT "session_reflections_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_observations" ADD CONSTRAINT "suggested_observations_session_id_hearth_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."hearth_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_observations" ADD CONSTRAINT "suggested_observations_observer_family_id_families_id_fk" FOREIGN KEY ("observer_family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_observations" ADD CONSTRAINT "suggested_observations_target_family_id_families_id_fk" FOREIGN KEY ("target_family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_observations" ADD CONSTRAINT "suggested_observations_target_learner_id_learners_id_fk" FOREIGN KEY ("target_learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_observations" ADD CONSTRAINT "suggested_observations_family_entry_id_learning_entries_id_fk" FOREIGN KEY ("family_entry_id") REFERENCES "public"."learning_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_sample_annotations" ADD CONSTRAINT "work_sample_annotations_work_sample_id_work_samples_id_fk" FOREIGN KEY ("work_sample_id") REFERENCES "public"."work_samples"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_samples" ADD CONSTRAINT "work_samples_report_id_heu_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."heu_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_samples" ADD CONSTRAINT "work_samples_entry_id_learning_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."learning_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hm_family_status_idx" ON "hearth_memberships" USING btree ("family_id","status");--> statement-breakpoint
CREATE INDEX "hs_hearth_date_idx" ON "hearth_sessions" USING btree ("hearth_id","date");--> statement-breakpoint
CREATE INDEX "so_target_status_idx" ON "suggested_observations" USING btree ("target_family_id","status");--> statement-breakpoint
CREATE INDEX "ws_entry_idx" ON "work_samples" USING btree ("entry_id");