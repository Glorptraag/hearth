import {
  ALL_DLOS_QUERY,
  ALL_PROJECTS_QUERY,
  FRAMEWORK_BY_PEDAGOGY_KEY_QUERY,
  MODULES_MATERIALS_BATCH_QUERY,
  OVERLAYS_BATCH_QUERY,
  PACK_MATERIALS_QUERY,
  PEDAGOGY_SOURCE_EXCERPTS_QUERY,
  PRACTICE_PATTERNS_QUERY,
  PROJECT_DETAIL_QUERY,
} from './queries';

/**
 * Allowlist of GROQ queries that client components may run through the authed
 * read proxy (`POST /api/sanity/read`).
 *
 * Each query here dereferences dotted-id ("dark") document types
 * (discreteLearningObjective, capabilityThread, pedagogy*, asset, commonsText)
 * that Sanity's public dataset ACL hides from the tokenless browser client, so
 * reading them straight from a client component returns empty in production
 * (see project_sanity_public_acl_dotted_id). The proxy runs them through the
 * authed `sanityServerClient` instead.
 *
 * The browser sends a KEY, never raw GROQ — this object is the COMPLETE set of
 * queries a client can run, and params are passed as GROQ parameters (never
 * string-interpolated). Module detail has its own dedicated route
 * (`/api/modules/[id]/detail`) and is intentionally not duplicated here.
 */
export const CLIENT_READ_QUERIES = {
  allDlos: ALL_DLOS_QUERY,
  allProjects: ALL_PROJECTS_QUERY,
  frameworkByPedagogyKey: FRAMEWORK_BY_PEDAGOGY_KEY_QUERY,
  modulesMaterialsBatch: MODULES_MATERIALS_BATCH_QUERY,
  overlaysBatch: OVERLAYS_BATCH_QUERY,
  packMaterials: PACK_MATERIALS_QUERY,
  pedagogySourceExcerpts: PEDAGOGY_SOURCE_EXCERPTS_QUERY,
  practicePatterns: PRACTICE_PATTERNS_QUERY,
  projectDetail: PROJECT_DETAIL_QUERY,
} as const;

export type ClientReadKey = keyof typeof CLIENT_READ_QUERIES;

export function isClientReadKey(key: unknown): key is ClientReadKey {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(CLIENT_READ_QUERIES, key);
}
