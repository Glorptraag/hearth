BEGIN;

-- ─── feedback: in-app pilot feedback capture ───────────────────────────────
-- One row per submission from the Send Feedback modal (Settings). Email was
-- the only feedback channel through the first pilot and captured zero
-- family-level UX findings (research log R7) — this makes reporting friction
-- cheaper than the friction being reported. Rows are triaged into
-- docs/hearth-research-log.md per decisions-log PR-1.

CREATE TABLE "feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "family_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "category" text NOT NULL,
  "message" text NOT NULL,
  "route" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "feedback_category_check" CHECK ("category" IN ('bug','idea','confusion','praise'))
);
--> statement-breakpoint

ALTER TABLE "feedback"
  ADD CONSTRAINT "feedback_family_id_families_id_fk"
  FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE cascade;
--> statement-breakpoint

CREATE INDEX "feedback_family_idx" ON "feedback" ("family_id", "created_at");
--> statement-breakpoint

COMMIT;
