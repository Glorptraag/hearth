-- Family Pack State — Pack Indicators feature (spec v1).
-- Per-family booleans for a pack: printables downloaded + kit owned. Read by
-- Module Experience to switch the indicator dot from ember-muted to sage.
-- State only exists once a family has a pack in their library; rows are
-- upserted on first interaction. Marketplace never reads this table.

BEGIN;

CREATE TABLE IF NOT EXISTS "family_pack_state" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "family_id" uuid NOT NULL REFERENCES "families"("id"),
  "sanity_pack_id" text NOT NULL,
  "printables_downloaded" boolean NOT NULL DEFAULT false,
  "kit_owned" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "fps_family_pack_unique_idx"
  ON "family_pack_state" ("family_id", "sanity_pack_id");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "fps_family_idx"
  ON "family_pack_state" ("family_id");

COMMIT;
