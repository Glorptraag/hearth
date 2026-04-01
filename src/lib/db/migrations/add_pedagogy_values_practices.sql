-- Add pedagogy_values and pedagogy_practices columns to family_settings
-- These support the pedagogy profile panel (values/practices preferences per family)

ALTER TABLE family_settings
  ADD COLUMN IF NOT EXISTS pedagogy_values TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pedagogy_practices TEXT[] DEFAULT '{}';
