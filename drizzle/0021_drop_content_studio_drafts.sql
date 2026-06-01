-- Drop Content Studio Drafts.
-- The in-app Content Studio editor is retired; content authoring moves to
-- Sanity Studio, which holds drafts natively. The Postgres-backed draft store
-- (and the QA draft-merge that read it) are removed, so this table is dropped.

BEGIN;

DROP TABLE IF EXISTS "content_studio_drafts";

COMMIT;
