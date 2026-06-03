BEGIN;

-- ─── module_runs ──────────────────────────────────────────────────────────
-- Tracks a parent's pass through a module's Facilitate phase.
-- State machine: active → paused (open_ended only) | finished (sustained) | abandoned.
-- learning_entries.module_run_id (added below) links a logged entry back to
-- the run that produced it. Abandonment is derived at read time (no cron).

CREATE TABLE "module_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "family_id" uuid NOT NULL REFERENCES "families"("id"),
  "sanity_module_id" text NOT NULL,
  "approach_id" text,
  "learner_ids" uuid[] DEFAULT '{}'::uuid[],
  "state" text NOT NULL DEFAULT 'active',
  "session_type" text NOT NULL DEFAULT 'sustained',
  "started_at" timestamp NOT NULL DEFAULT now(),
  "last_active_at" timestamp NOT NULL DEFAULT now(),
  "finished_at" timestamp,
  "materials_state" jsonb DEFAULT '{}'::jsonb,
  "device" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "mr_state_check" CHECK ("state" IN ('active','paused','finished','abandoned')),
  CONSTRAINT "mr_session_type_check" CHECK ("session_type" IN ('sustained','open_ended'))
);
--> statement-breakpoint

CREATE INDEX "mr_family_state_idx" ON "module_runs" ("family_id", "state");
--> statement-breakpoint
CREATE INDEX "mr_family_module_idx" ON "module_runs" ("family_id", "sanity_module_id");
--> statement-breakpoint

-- ─── learning_entry_evidence ──────────────────────────────────────────────
-- One row per piece of evidence captured for a learning entry. Replaces the
-- learning_entries.evidence_urls text[] (kept dual-write through a 2-cycle
-- deprecation window). Supports five kinds: photo, quote, note, link, audio.
--   photo  → content = Blob URL (Vercel Blob)
--   quote  → content = quoted text
--   note   → content = freeform text
--   link   → content = URL
--   audio  → content = Blob URL, metadata = { durationMs, mimeType }

CREATE TABLE "learning_entry_evidence" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "entry_id" uuid NOT NULL REFERENCES "learning_entries"("id") ON DELETE CASCADE,
  "kind" text NOT NULL,
  "content" text NOT NULL,
  "caption" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "lee_kind_check" CHECK ("kind" IN ('photo','quote','note','link','audio'))
);
--> statement-breakpoint

CREATE INDEX "lee_entry_idx" ON "learning_entry_evidence" ("entry_id");
--> statement-breakpoint

-- ─── learning_entries: new FK columns ─────────────────────────────────────

ALTER TABLE "learning_entries"
  ADD COLUMN "module_run_id" uuid REFERENCES "module_runs"("id");
--> statement-breakpoint
ALTER TABLE "learning_entries"
  ADD COLUMN "planner_entry_id" uuid REFERENCES "planner_entries"("id");
--> statement-breakpoint

-- ─── family_library: soft-delete + partial-unique-index rewrite ───────────
-- Adds removed_at timestamp. NULL = active. Rewrites the two partial unique
-- indexes so that re-adding a previously soft-deleted item succeeds.

ALTER TABLE "family_library" ADD COLUMN "removed_at" timestamp;
--> statement-breakpoint

DROP INDEX IF EXISTS "fl_family_pack_unique_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "fl_family_module_unique_idx";
--> statement-breakpoint

CREATE UNIQUE INDEX "fl_family_pack_unique_idx"
  ON "family_library" ("family_id", "sanity_pack_id")
  WHERE "sanity_pack_id" IS NOT NULL AND "removed_at" IS NULL;
--> statement-breakpoint

CREATE UNIQUE INDEX "fl_family_module_unique_idx"
  ON "family_library" ("family_id", "sanity_module_id")
  WHERE "sanity_module_id" IS NOT NULL AND "removed_at" IS NULL;
--> statement-breakpoint

COMMIT;
