CREATE TABLE "learner_dlo_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"learner_id" uuid NOT NULL,
	"dlo_id" text NOT NULL,
	"state" text DEFAULT 'not-started' NOT NULL,
	"source" text DEFAULT 'parent' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "learner_dlo_status_state_chk" CHECK ("learner_dlo_status"."state" in ('not-started', 'emerging', 'confirmed'))
);
--> statement-breakpoint
ALTER TABLE "learner_dlo_status" ADD CONSTRAINT "learner_dlo_status_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "learner_dlo_status" ADD CONSTRAINT "learner_dlo_status_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "learner_dlo_status_learner_dlo_idx" ON "learner_dlo_status" ("learner_id","dlo_id");
--> statement-breakpoint
CREATE INDEX "learner_dlo_status_learner_idx" ON "learner_dlo_status" ("learner_id");
