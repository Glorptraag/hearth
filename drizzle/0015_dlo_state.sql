-- DLO (Discrete Learning Objective) state tables.
-- learner_dlo_status: current per-learner status across the DLO catalog.
-- observation_dlo_links: provenance — which observation contributed evidence at what tier.
--
-- dlo_id is the Sanity document _id (text). No FK to Sanity; validation happens at
-- enrich-time against ALL_DLOS_QUERY before insert.
--
-- See docs/hearth-capability-universe-v2-architecture-spec-v1.md (DLO section)
-- and /Users/claw/.claude/plans/refactored-fluttering-dusk.md Phase 2.

BEGIN;

CREATE TABLE IF NOT EXISTS "learner_dlo_status" (
  "learner_id" uuid NOT NULL REFERENCES "learners"("id") ON DELETE CASCADE,
  "dlo_id" text NOT NULL,
  "status" text NOT NULL,
  "confidence" numeric,
  "last_observed_at" timestamptz,
  "source_observation_id" uuid REFERENCES "learning_entries"("id") ON DELETE SET NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("learner_id", "dlo_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lds_learner_idx" ON "learner_dlo_status" ("learner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lds_dlo_idx" ON "learner_dlo_status" ("dlo_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "observation_dlo_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "observation_id" uuid NOT NULL REFERENCES "learning_entries"("id") ON DELETE CASCADE,
  "learner_id" uuid NOT NULL REFERENCES "learners"("id") ON DELETE CASCADE,
  "dlo_id" text NOT NULL,
  "tier" text NOT NULL,
  "confidence" numeric,
  "rationale" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "odl_observation_idx" ON "observation_dlo_links" ("observation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "odl_learner_dlo_idx" ON "observation_dlo_links" ("learner_id", "dlo_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "odl_dlo_idx" ON "observation_dlo_links" ("dlo_id");

COMMIT;
