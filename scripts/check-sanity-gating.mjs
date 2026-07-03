#!/usr/bin/env node
// Enforce the Sanity-gating invariant: every runtime GROQ query that fetches
// pack / module / activity / approach / asset / commonsText / project documents
// MUST filter by `status == "published"`.
//
// Publishing in Sanity is the ONLY mechanism that makes content live; no repo
// change should ever be required to flip availability. See:
//   - CLAUDE.md "Architecture Principles"
//   - src/lib/sanity/queries.ts header (full invariant statement)
//   - .claude/plans/make-a-deepwork-plan-velvety-candy.md (workstream A)
//
// Usage:
//   node scripts/check-sanity-gating.mjs            # exits non-zero on violation
//   node scripts/check-sanity-gating.mjs --list     # list every matched query
//
// Exemptions:
//   - Files under src/app/(admin)/, src/lib/content-studio/, src/lib/content-qa/
//     are admin/editorial paths that MUST see drafts. Excluded by path.
//   - Any other file can opt out a single query by placing the comment
//     "SANITY-GATING EXEMPT" within ~3 lines above the query.
//   - Tests (*.test.{ts,tsx}, *.integration.test.{ts,tsx}) are excluded.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const ROOTS = ['src/app', 'src/lib', 'src/components', 'src/hooks'];
const EXCLUDE_DIRS = [
  'src/app/(admin)',
  'src/lib/content-studio',
  'src/lib/content-qa',
  'node_modules',
  '.next',
];
const GATED_TYPES = ['pack', 'module', 'activity', 'approach', 'asset', 'commonsText', 'project'];
const TYPE_RE = new RegExp(
  String.raw`_type\s*==\s*"(${GATED_TYPES.join('|')})"`,
  'g',
);
const PUBLISHED_RE = /status\s*==\s*"published"/;
// Arrays of gated (draftable) documents. `count(<field>)` over one of these
// counts draft docs too — the gated form is `count(field[@->status == …])`
// (or `[@.ref->status == …]` for keyed reference arrays). A bare count slipped
// through the per-query PUBLISHED_RE five times historically because the query
// gates SOMEWHERE, just not inside the count argument.
const GATED_ARRAY_FIELDS = ['modules', 'approaches', 'activities', 'assets', 'commonsTexts', 'stages'];
const UNGATED_COUNT_RE = new RegExp(
  String.raw`count\(\s*(${GATED_ARRAY_FIELDS.join('|')})\s*\)`,
  'g',
);
const EXEMPT_RE = /SANITY-GATING EXEMPT/;
const LIST = process.argv.includes('--list');

function walk(dir, acc = []) {
  if (EXCLUDE_DIRS.some((ex) => dir.includes(ex))) return acc;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) {
      acc.push(full);
    }
  }
  return acc;
}

// Find the bounded "query expression" containing a `_type ==` hit. We walk
// outward to the nearest enclosing matching backtick / template literal so the
// `status == "published"` check is scoped to the SAME query, not the file.
function queryRangeAround(src, hitIdx) {
  // Search backward for a `\`` that opens the literal.
  let start = src.lastIndexOf('`', hitIdx);
  if (start === -1) return null;
  // Find the matching closing backtick.
  let end = src.indexOf('`', start + 1);
  // Handle nested template literals via ${...} — find the FIRST top-level closer.
  let depth = 0;
  for (let i = start + 1; i < src.length; i++) {
    if (src[i] === '$' && src[i + 1] === '{') {
      depth++;
      i++;
    } else if (depth > 0 && src[i] === '}') {
      depth--;
    } else if (depth === 0 && src[i] === '`') {
      end = i;
      break;
    }
  }
  if (end <= start) return null;
  return { start, end };
}

function lineForOffset(src, off) {
  return src.slice(0, off).split('\n').length;
}

function hasExemption(src, hitIdx) {
  // Look at the 5 lines preceding the hit.
  const before = src.slice(Math.max(0, hitIdx - 400), hitIdx);
  return EXEMPT_RE.test(before);
}

const files = ROOTS.flatMap((r) => walk(join(ROOT, r)));
const violations = [];
const matches = [];
// A query with several `_type ==` hits resolves to the same range each time —
// dedupe count violations by their absolute position.
const seenCountViolations = new Set();

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  TYPE_RE.lastIndex = 0;
  let m;
  while ((m = TYPE_RE.exec(src)) !== null) {
    const hitIdx = m.index;
    const range = queryRangeAround(src, hitIdx);
    if (!range) continue;
    const query = src.slice(range.start, range.end + 1);
    const line = lineForOffset(src, hitIdx);
    const relPath = relative(ROOT, file);
    matches.push({ file: relPath, line, type: m[1] });

    // Per-deref hole: a bare count() over a gated array inside an otherwise
    // gated query. Checked before the whole-query PUBLISHED_RE pass, which a
    // gated-elsewhere query satisfies trivially.
    UNGATED_COUNT_RE.lastIndex = 0;
    let c;
    while ((c = UNGATED_COUNT_RE.exec(query)) !== null) {
      const absIdx = range.start + c.index;
      const key = `${relPath}:${absIdx}`;
      if (seenCountViolations.has(key)) continue;
      seenCountViolations.add(key);
      if (hasExemption(src, absIdx)) continue;
      violations.push({
        file: relPath,
        line: lineForOffset(src, absIdx),
        type: `ungated count(${c[1]})`,
        snippet: `count(${c[1]}) counts drafts — use count(${c[1]}[@->status == "published"]) (or [@.ref->status == …] for keyed reference arrays)`,
      });
    }

    if (PUBLISHED_RE.test(query)) continue;
    if (hasExemption(src, hitIdx)) continue;
    violations.push({
      file: relPath,
      line,
      type: m[1],
      snippet: query.length > 160 ? query.slice(0, 157) + '…' : query,
    });
  }
}

if (LIST) {
  for (const m of matches) {
    console.log(`${m.file}:${m.line}\t_type == "${m.type}"`);
  }
  console.log(`\n${matches.length} matched query expressions across ${files.length} files`);
}

if (violations.length === 0) {
  console.log(`✓ Sanity-gating OK — checked ${matches.length} query expressions in ${files.length} files`);
  process.exit(0);
}

console.error(`\n✗ Sanity-gating violation(s): ${violations.length}\n`);
for (const v of violations) {
  const label = v.type.startsWith('ungated') ? v.type : `_type == "${v.type}"`;
  console.error(`  ${v.file}:${v.line}  (${label})`);
  console.error(`    ${v.snippet.replace(/\n\s*/g, ' ')}`);
}
console.error('\nEvery runtime GROQ query for pack/module/activity/asset/commonsText/project');
console.error('must include `status == "published"`. See src/lib/sanity/queries.ts header.\n');
console.error('If this query is admin/editorial and intentionally exempt, add a');
console.error('comment containing "SANITY-GATING EXEMPT" within ~5 lines above it.');
process.exit(1);
