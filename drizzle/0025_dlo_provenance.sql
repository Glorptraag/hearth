BEGIN;

-- ─── dlo_provenance: provenance + tier-clamp columns on observation_dlo_links ─
-- Tracks whether evidence was inferred (Haiku enrichment), declared (from a
-- completed module run, WS-6), or asserted (parent tap, future).
-- claimed_tier records the model's original tier claim when it disagreed with
-- the Sanity-authoritative tier so the mismatch rate is measurable in admin.
-- Existing rows backfill as 'inferred' via the column DEFAULT.

ALTER TABLE "observation_dlo_links"
  ADD COLUMN "provenance" text NOT NULL DEFAULT 'inferred';
--> statement-breakpoint

ALTER TABLE "observation_dlo_links"
  ADD COLUMN "claimed_tier" text;
--> statement-breakpoint

COMMIT;
