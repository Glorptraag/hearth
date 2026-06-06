BEGIN;

-- ─── learning_entry_evidence: per-entry display order ──────────────────────
-- Every row captured for one entry is written in a single batched INSERT, so
-- they share created_at — the (created_at, id) read order then tiebreaks on a
-- random uuid. Display order was deterministic per entry but NOT the parent's
-- capture order. sort_order pins that capture order; writeEntryEvidence assigns
-- it from the evidence[] array index, and attachEvidence reads by it first.
-- Pre-existing rows default to 0 and keep falling back to (created_at, id).

ALTER TABLE "learning_entry_evidence"
  ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint

COMMIT;
