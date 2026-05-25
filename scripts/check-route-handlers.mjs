#!/usr/bin/env node
/**
 * Route-handler wrap drift detector.
 *
 * Every file matching `src/app/api/**\/route.ts` must use the `routeHandler`
 * wrapper from `@/lib/api-helpers`. Without the wrapper, an uncaught throw
 * inside a handler escapes Next.js and surfaces as an HTML 500 page —
 * which causes the client `.json()` parser to throw synchronously and
 * white-screen the page (the 2026-05-25 incident class).
 *
 * This gate fails CI if any route file is missing the wrapper. It does NOT
 * verify that every handler export within the file is wrapped — only that
 * `routeHandler` appears in the source somewhere. Partial-wrap detection
 * would require a real TS AST parse; the simple gate catches the most
 * common drift (forgetting the wrapper entirely on a new file).
 *
 * Exit codes:
 *   0  all route files use routeHandler
 *   1  one or more route files do not import or call routeHandler
 *   2  setup error (no route files found, glob failed)
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const ROUTE_GLOB = 'src/app/api/**/route.ts';

let files;
try {
  // Use git ls-files so untracked + deleted files don't pollute the audit.
  // The pattern is glob-on-tracked-paths; git understands the same syntax.
  const out = execSync(`git ls-files -- '${ROUTE_GLOB}'`, { cwd: ROOT, encoding: 'utf8' });
  files = out.split('\n').filter(Boolean);
} catch (e) {
  console.error(`[route-check] could not enumerate route files: ${e.message}`);
  process.exit(2);
}

if (files.length === 0) {
  console.error(`[route-check] no route files found under ${ROUTE_GLOB}`);
  process.exit(2);
}

const unwrapped = [];
for (const file of files) {
  let src;
  try {
    src = readFileSync(resolve(ROOT, file), 'utf8');
  } catch (e) {
    console.error(`[route-check] failed to read ${file}: ${e.message}`);
    process.exit(2);
  }
  if (!src.includes('routeHandler')) {
    unwrapped.push(file);
  }
}

if (unwrapped.length === 0) {
  console.log(`[route-check] OK — all ${files.length} route files use routeHandler`);
  process.exit(0);
}

console.error(`[route-check] FAIL — ${unwrapped.length} route file(s) do not use routeHandler:`);
for (const f of unwrapped) console.error(`  - ${f}`);
console.error('');
console.error(`        Wrap each handler with routeHandler from '@/lib/api-helpers':`);
console.error(`          export const GET = routeHandler(async (req, ctx) => {`);
console.error(`            // body unchanged`);
console.error(`          }, { route: 'GET /api/some/path' });`);
console.error(``);
console.error(`        See docs/incident-runbook.md §7 (2026-05-25) for why this matters.`);
process.exit(1);
