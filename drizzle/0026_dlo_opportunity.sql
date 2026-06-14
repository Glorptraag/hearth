BEGIN;

-- ─── dlo_opportunity: evidence_state column on observation_dlo_links ──────────
-- WS-6 / D-OS1 (opportunity + corroboration). A completed targeted activity
-- writes a DLO link at the author-declared (thread, tier) as an OPPORTUNITY —
-- NOT observed evidence. It is promoted to 'observed' only when corroborated by
-- a per-child Haiku signal (Haiku independently infers the same DLO id) or,
-- later, a parent tap.
--
-- learner_dlo_status is recomputed from 'observed' rows ONLY, so a bare
-- completion never moves a learner's DLO status on its own. This is what
-- protects the evidence bar (WS-4 / C3 derives thread tiers from this evidence).
--
-- Existing rows (all genuine inferred/declared-module evidence to date) backfill
-- as 'observed' via the column DEFAULT so prior behaviour is preserved.

ALTER TABLE "observation_dlo_links"
  ADD COLUMN "evidence_state" text NOT NULL DEFAULT 'observed';
--> statement-breakpoint

COMMIT;
