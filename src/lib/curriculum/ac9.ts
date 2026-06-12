/**
 * Australian Curriculum v9 code shape.
 *
 * Format: AC9[Subject][Year][Strand][Number] — e.g. AC9E2LY01, AC9M3N02.
 * This is a SHAPE lint only: it validates that a string looks like an AC9
 * descriptor code, not that the code actually exists in the curriculum.
 *
 * Single source of truth so the enrichment boundary (`src/lib/ai/enrich.ts`)
 * and the regulatory-mapping authoring lint (`scripts/seed-dlo-mappings.ts`)
 * cannot drift. Kept dependency-free so a plain `tsx` seed script can import it
 * without pulling in the enrichment pipeline (Anthropic SDK, db, Sanity).
 */
export const AC9_CODE_PATTERN = /^AC9[A-Z]{1,4}\d{1,2}[A-Z]{1,3}\d{2}$/;
