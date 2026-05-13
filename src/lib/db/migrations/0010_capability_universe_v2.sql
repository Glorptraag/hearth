-- Capability Universe v2 — full substrate cut-over
-- See docs/hearth-capability-universe-v2-architecture-spec-v1.md
--
-- Test families only — this migration drops v1 columns rather than carrying them forward.
-- v1 thread/badge content in Sanity is unaffected by this DDL; v1 schemas have been replaced
-- in src/sanity/schemas/. v1 seed data is retired.

BEGIN;

-- ── learning_entries: capture-time library version + v2 thread links ──
ALTER TABLE learning_entries
  ADD COLUMN IF NOT EXISTS captured_library_version text NOT NULL DEFAULT '2.0.0';

ALTER TABLE learning_entries
  ADD COLUMN IF NOT EXISTS thread_links jsonb DEFAULT '[]'::jsonb;

-- ── badge_definitions: v1 → v2 cut-over ──
-- Drop v1 thread-array + threshold; add v2 stage-tier scoping + atomic criteria.
ALTER TABLE badge_definitions
  DROP COLUMN IF EXISTS criteria_summary,
  DROP COLUMN IF EXISTS indicator_statements,
  DROP COLUMN IF EXISTS capability_thread_ids,
  DROP COLUMN IF EXISTS observation_threshold;

ALTER TABLE badge_definitions
  ADD COLUMN IF NOT EXISTS what_it_recognises text,
  ADD COLUMN IF NOT EXISTS parent_narrative text,
  ADD COLUMN IF NOT EXISTS thread_id text,
  ADD COLUMN IF NOT EXISTS stage_band text,
  ADD COLUMN IF NOT EXISTS criteria jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS criteria_policy text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS threshold_count integer,
  ADD COLUMN IF NOT EXISTS prerequisite_badge_ids text[],
  ADD COLUMN IF NOT EXISTS introduced_in_version text NOT NULL DEFAULT '2.0.0',
  ADD COLUMN IF NOT EXISTS canon_status text NOT NULL DEFAULT 'active';

-- ── family_library_state: one row per family, defaulted to current canon ──
CREATE TABLE IF NOT EXISTS family_library_state (
  family_id uuid PRIMARY KEY REFERENCES families(id),
  current_library_version text NOT NULL DEFAULT '2.0.0',
  pinned_at_version text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Backfill: every existing family lands on 2.0.0 (test families only).
INSERT INTO family_library_state (family_id, current_library_version)
SELECT id, '2.0.0' FROM families
ON CONFLICT (family_id) DO NOTHING;

-- ── library_upgrade_events: append-only audit trail of migration events ──
CREATE TABLE IF NOT EXISTS library_upgrade_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id),
  from_version text NOT NULL,
  to_version text NOT NULL,
  upgraded_at timestamp NOT NULL DEFAULT now(),
  observations_retagged integer NOT NULL DEFAULT 0,
  observations_carried_as_legacy integer NOT NULL DEFAULT 0,
  notes jsonb DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS lue_family_idx
  ON library_upgrade_events (family_id, upgraded_at);

-- ── custom_threads: family-authored threads (D11) ──
-- Flat structure, no stage-bands or atoms. Renders distinctly from canon.
CREATE TABLE IF NOT EXISTS custom_threads (
  id text PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES families(id),
  created_by_user_id text NOT NULL,
  name text NOT NULL,
  summary text,
  tier_indicators jsonb NOT NULL DEFAULT '{"emerging":[],"developing":[],"demonstrating":[]}'::jsonb,
  domain_affinity text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ct_family_idx ON custom_threads (family_id);

COMMIT;
