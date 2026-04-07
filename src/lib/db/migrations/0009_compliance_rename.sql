-- Rename HEU-specific table and column to generic names for multi-state support
ALTER TABLE "heu_reports" RENAME TO "compliance_reports";
ALTER TABLE "learning_entries" RENAME COLUMN "heu_candidate" TO "work_sample_candidate";
