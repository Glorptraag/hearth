-- Rename Module Builder pathway literal 'goal' → 'understanding'.
-- The user-facing label ("Goal-Forward") stays the same. Only the internal
-- pathway code changes. See docs/hearth-module-builder-pathways-architecture-v2.md.
--
-- Applies to module_drafts.pathway. No other table stores this literal.

BEGIN;

UPDATE "module_drafts" SET "pathway" = 'understanding' WHERE "pathway" = 'goal';

COMMIT;
