CREATE TABLE "badge_assessment_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"badge_definition_id" uuid NOT NULL,
	"learner_id" uuid NOT NULL,
	"responses" jsonb NOT NULL,
	"outcome" text NOT NULL,
	"assessed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "badge_awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"badge_definition_id" uuid NOT NULL,
	"learner_id" uuid NOT NULL,
	"awarded_at" timestamp DEFAULT now(),
	"awarded_by" text DEFAULT 'parent',
	"evidence_entry_ids" uuid[],
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "badge_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"emoji" text,
	"criteria_summary" text,
	"capability_thread_ids" text[],
	"observation_threshold" integer DEFAULT 3,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "capability_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"thread_id" text NOT NULL,
	"dlo_id" text,
	"status" text DEFAULT 'emerging' NOT NULL,
	"source_entry_id" uuid,
	"observed_at" timestamp DEFAULT now(),
	"confirmed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "facilitator_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"learner_id" uuid NOT NULL,
	"note_text" text NOT NULL,
	"is_private" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"family_name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "families_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "family_intelligence_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"snapshot_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rebuilt_at" timestamp,
	"rebuild_trigger" text,
	"snapshot_version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "family_intelligence_snapshots_family_id_unique" UNIQUE("family_id")
);
--> statement-breakpoint
CREATE TABLE "family_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"sanity_pack_id" text NOT NULL,
	"added_at" timestamp DEFAULT now(),
	CONSTRAINT "fl_family_pack_unique" UNIQUE("family_id","sanity_pack_id")
);
--> statement-breakpoint
CREATE TABLE "family_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"pedagogy_preference" text DEFAULT 'eclectic',
	"heu_registration_number" text,
	"heu_next_report_date" date,
	"state" text DEFAULT 'QLD',
	"notification_prefs" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "family_settings_family_id_unique" UNIQUE("family_id")
);
--> statement-breakpoint
CREATE TABLE "learners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"name" text NOT NULL,
	"date_of_birth" date,
	"shape_icon" text,
	"colour_token" text,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date_occurred" date DEFAULT now() NOT NULL,
	"subjects" text[],
	"learner_ids" uuid[],
	"engagement_per_learner" jsonb DEFAULT '{}'::jsonb,
	"discoveries_per_learner" jsonb DEFAULT '{}'::jsonb,
	"evidence_urls" text[] DEFAULT '{}',
	"source" text DEFAULT 'logger' NOT NULL,
	"source_module_id" text,
	"source_project_id" text,
	"source_stage_number" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"ai_enrichment" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"type" text NOT NULL,
	"tier" text DEFAULT 'whisper' NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"body_data" jsonb DEFAULT '{}'::jsonb,
	"state" text DEFAULT 'visible' NOT NULL,
	"destination_route" text,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "planner_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"date" date NOT NULL,
	"title" text,
	"module_id" text,
	"activity_id" text,
	"learner_ids" uuid[],
	"status" text DEFAULT 'planned',
	"notes" text,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "badge_assessment_logs" ADD CONSTRAINT "badge_assessment_logs_badge_definition_id_badge_definitions_id_fk" FOREIGN KEY ("badge_definition_id") REFERENCES "public"."badge_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_assessment_logs" ADD CONSTRAINT "badge_assessment_logs_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_badge_definition_id_badge_definitions_id_fk" FOREIGN KEY ("badge_definition_id") REFERENCES "public"."badge_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_definitions" ADD CONSTRAINT "badge_definitions_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capability_observations" ADD CONSTRAINT "capability_observations_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capability_observations" ADD CONSTRAINT "capability_observations_source_entry_id_learning_entries_id_fk" FOREIGN KEY ("source_entry_id") REFERENCES "public"."learning_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilitator_notes" ADD CONSTRAINT "facilitator_notes_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilitator_notes" ADD CONSTRAINT "facilitator_notes_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_intelligence_snapshots" ADD CONSTRAINT "family_intelligence_snapshots_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_library" ADD CONSTRAINT "family_library_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_settings" ADD CONSTRAINT "family_settings_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learners" ADD CONSTRAINT "learners_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_entries" ADD CONSTRAINT "learning_entries_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_entries" ADD CONSTRAINT "planner_entries_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "co_learner_thread_idx" ON "capability_observations" USING btree ("learner_id","thread_id");--> statement-breakpoint
CREATE INDEX "le_family_date_idx" ON "learning_entries" USING btree ("family_id","date_occurred");--> statement-breakpoint
CREATE INDEX "le_family_status_idx" ON "learning_entries" USING btree ("family_id","status");--> statement-breakpoint
CREATE INDEX "notif_family_state_idx" ON "notifications" USING btree ("family_id","state");--> statement-breakpoint
CREATE INDEX "pe_family_date_idx" ON "planner_entries" USING btree ("family_id","date");