#!/usr/bin/env node
/**
 * detach-kindling.mjs
 *
 * One-shot, idempotent cleanup that detaches `claude-kindling/` from the
 * hearth repo. See docs/plans/detach-kindling (or the approved plan file)
 * for the full rationale.
 *
 * Steps performed:
 *   1. Move ./claude-kindling out of the hearth tree to <dest>
 *   2. Delete scripts/run-bundle-job.ts (only file importing kindling internals)
 *   3. Clean tsconfig.json `exclude`
 *   4. Clean .gitignore
 *   5. Update CLAUDE.md principle #10
 *   6. Update src/sanity/schemas/activity.ts description string
 *   7. Update narrative doc files
 *   8. Print summary + git status
 *
 * Usage (from hearth repo root):
 *   node scripts/detach-kindling.mjs
 *   node scripts/detach-kindling.mjs --dest /absolute/path/to/claude-kindling
 *
 * Safe to re-run: every step is a no-op once already applied.
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import * as path from 'node:path';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const destFlagIdx = args.indexOf('--dest');
const dest = destFlagIdx >= 0
  ? path.resolve(args[destFlagIdx + 1])
  : path.join(homedir(), 'Desktop', 'Codebases', 'claude-kindling');

const changes = { moved: null, deleted: [], edited: [], skipped: [] };

function logStep(label) {
  console.log(`\n→ ${label}`);
}

// ─────────────────────────────────────────────────────────────────────
// 1. Move ./claude-kindling out
// ─────────────────────────────────────────────────────────────────────
logStep('Step 1: relocate claude-kindling/');
const src = path.join(repoRoot, 'claude-kindling');
if (existsSync(src)) {
  if (existsSync(dest) && readdirSync(dest).length > 0) {
    console.error(`✖ Destination already exists and is non-empty: ${dest}`);
    console.error('  Aborting before any other edits. Pick a different --dest or clear it first.');
    process.exit(1);
  }
  try {
    renameSync(src, dest);
  } catch (err) {
    if (err.code === 'EXDEV') {
      // Cross-volume — fall back to `mv`.
      execSync(`mv ${JSON.stringify(src)} ${JSON.stringify(dest)}`);
    } else {
      throw err;
    }
  }
  changes.moved = { from: src, to: dest };
  console.log(`  moved → ${dest}`);
} else {
  changes.skipped.push('move (claude-kindling/ already gone)');
  console.log('  already moved — skipping');
}

// ─────────────────────────────────────────────────────────────────────
// 2. Delete scripts/run-bundle-job.ts
// ─────────────────────────────────────────────────────────────────────
logStep('Step 2: delete scripts/run-bundle-job.ts');
const bundleJob = path.join(repoRoot, 'scripts', 'run-bundle-job.ts');
if (existsSync(bundleJob)) {
  rmSync(bundleJob);
  changes.deleted.push('scripts/run-bundle-job.ts');
  console.log('  deleted');
} else {
  changes.skipped.push('delete run-bundle-job.ts (already gone)');
  console.log('  already gone — skipping');
}

// ─────────────────────────────────────────────────────────────────────
// Helpers for text edits
// ─────────────────────────────────────────────────────────────────────
function editFile(relPath, transform) {
  const abs = path.join(repoRoot, relPath);
  if (!existsSync(abs)) {
    changes.skipped.push(`${relPath} (missing)`);
    console.log(`  ${relPath}: missing — skipping`);
    return;
  }
  const before = readFileSync(abs, 'utf8');
  const after = transform(before);
  if (before === after) {
    changes.skipped.push(`${relPath} (already clean)`);
    console.log(`  ${relPath}: already clean`);
    return;
  }
  writeFileSync(abs, after);
  changes.edited.push(relPath);
  console.log(`  ${relPath}: updated`);
}

function replaceAll(src, pairs) {
  let out = src;
  for (const [from, to] of pairs) {
    out = out.split(from).join(to);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// 3. tsconfig.json — remove two exclude entries
// ─────────────────────────────────────────────────────────────────────
logStep('Step 3: clean tsconfig.json');
editFile('tsconfig.json', (src) => {
  const json = JSON.parse(src);
  if (Array.isArray(json.exclude)) {
    json.exclude = json.exclude.filter(
      (entry) => entry !== 'claude-kindling/**' && entry !== 'scripts/run-bundle-job.ts',
    );
  }
  return JSON.stringify(json, null, 2) + '\n';
});

// ─────────────────────────────────────────────────────────────────────
// 4. .gitignore — remove the kindling block
// ─────────────────────────────────────────────────────────────────────
logStep('Step 4: clean .gitignore');
editFile('.gitignore', (src) => {
  const lines = src.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('# claude-kindling')) {
      // Skip this comment line plus the immediately-following `claude-kindling/` line if present.
      if (lines[i + 1] === 'claude-kindling/') i += 1;
      // Also collapse a trailing blank line if the previous line is blank.
      if (out.length && out[out.length - 1] === '') {
        // leave existing blank
      }
      continue;
    }
    if (line === 'claude-kindling/') continue;
    out.push(line);
  }
  return out.join('\n');
});

// ─────────────────────────────────────────────────────────────────────
// 5. CLAUDE.md — reword principle #10
// ─────────────────────────────────────────────────────────────────────
logStep('Step 5: update CLAUDE.md');
editFile('CLAUDE.md', (src) =>
  replaceAll(src, [
    [
      '    - **External authoring path** (`claude-kindling/`, separate repo, gitignored): module spec docs → `claude-kindling/library/build-mode/orchestrator.ts` → direct Sanity mutations with deterministic IDs and `register/modules.jsonl` event trail. Used by Drew / Cowork to build official content packs. Writes via direct mutations because `/api/modules/publish` violates the editorial rule (it auto-sets `authorFamilyId`). See the kindling repo\'s `design/sanity-schema-reference.md` and `library/build-mode/README.md`. The hearth repo only has `claude-kindling/` as a gitignored sibling checkout — do not commit anything inside it from this repo.',
      '    - **External authoring path** (kindling repo, fully separate from hearth): module spec docs → kindling\'s `library/build-mode/orchestrator.ts` → direct Sanity mutations with deterministic IDs and `register/modules.jsonl` event trail. Used by Drew / Cowork to build official content packs. Writes via direct mutations because `/api/modules/publish` violates the editorial rule (it auto-sets `authorFamilyId`). See the kindling repo\'s `design/sanity-schema-reference.md` and `library/build-mode/README.md`. The kindling repo lives as a sibling checkout on Drew\'s machine — it is not part of this repo.',
    ],
  ]),
);

// ─────────────────────────────────────────────────────────────────────
// 6. src/sanity/schemas/activity.ts — rewrite path reference
// ─────────────────────────────────────────────────────────────────────
logStep('Step 6: update src/sanity/schemas/activity.ts');
editFile('src/sanity/schemas/activity.ts', (src) => {
  // The surrounding string literal in activity.ts is single-quoted, so we must
  // either flip the delimiters or escape. We flip the delimiters to double
  // quotes for the one line we touch so the apostrophe in "kindling repo's"
  // is safe.
  const oldLine =
    "        'Optional. A parent-off addendum: child returns alone to material the parent has already introduced. See claude-kindling/design/workbench-specification.md.',";
  const newLine =
    "        \"Optional. A parent-off addendum: child returns alone to material the parent has already introduced. See the kindling repo's `design/workbench-specification.md`.\",";
  return src.includes(oldLine) ? src.replace(oldLine, newLine) : src;
});

// ─────────────────────────────────────────────────────────────────────
// 7. Narrative docs — strip `claude-kindling/` path prefix
// ─────────────────────────────────────────────────────────────────────
logStep('Step 7: update narrative docs');

editFile('docs/hearth-decisions-log-v1.md', (src) =>
  replaceAll(src, [
    [
      '**Implementation:** `claude-kindling/library/build-mode/bundle-validation.ts` (`validateForwardPrescription`)',
      '**Implementation:** kindling repo, `library/build-mode/bundle-validation.ts` (`validateForwardPrescription`)',
    ],
  ]),
);

editFile('docs/PROJECT_STATUS.md', (src) =>
  replaceAll(src, [
    [
      '| **External authoring** (`claude-kindling/`) | Drew / Cowork building official packs from spec docs | `claude-kindling/library/build-mode/orchestrator.ts` (CLI) | Direct Sanity mutations with deterministic IDs | **Lives in a separate repo** — `claude-kindling/` is gitignored from this repo (sibling checkout only). Uses `register/modules.jsonl` for event trail and `specced → content_constructed` bucket gates. Bypasses `/api/modules/publish` because that endpoint violates the editorial rule. Dropped 1 May 2026 (commits `306e4fc`, `f8ee5c7`, `f9e6e5c`). |',
      '| **External authoring** (kindling repo) | Drew / Cowork building official packs from spec docs | kindling\'s `library/build-mode/orchestrator.ts` (CLI) | Direct Sanity mutations with deterministic IDs | **Lives in a separate repo**, not part of this codebase. Uses `register/modules.jsonl` for event trail and `specced → content_constructed` bucket gates. Bypasses `/api/modules/publish` because that endpoint violates the editorial rule. Dropped 1 May 2026 (commits `306e4fc`, `f8ee5c7`, `f9e6e5c`). |',
    ],
  ]),
);

editFile('docs/hearth-lens-loop-implementation-plan-v1.md', (src) =>
  replaceAll(src, [
    [
      '`claude-kindling/library/build-mode/bundle-validation.ts` (`checkForwardPrescription`)',
      "kindling repo, `library/build-mode/bundle-validation.ts` (`checkForwardPrescription`)",
    ],
    [
      '`claude-kindling/library/build-mode/bundle-orchestrator.ts` — emit `methodAffinity` from the Lens Bundle generation pass alongside the bundle itself',
      "kindling repo, `library/build-mode/bundle-orchestrator.ts` — emit `methodAffinity` from the Lens Bundle generation pass alongside the bundle itself",
    ],
    [
      '**PKB Wave 1 reframe** (Cowork-side work, in the `claude-kindling/` repo)',
      '**PKB Wave 1 reframe** (Cowork-side work, in the kindling repo)',
    ],
  ]),
);

editFile('docs/COMPONENT_REGISTRY.md', (src) =>
  replaceAll(src, [
    [
      '| **External authoring** | `claude-kindling/` — **separate git repo**, gitignored from this one (sibling checkout only) | `claude-kindling/library/build-mode/orchestrator.ts` CLI → direct Sanity mutations with deterministic IDs + `register/modules.jsonl` event trail. Used by Drew / Cowork to build official content packs from spec docs. Dropped 1 May 2026 (commits `306e4fc`, `f8ee5c7`, `f9e6e5c`). Bypasses `/api/modules/publish` because that endpoint violates the editorial rule (auto-stamps `authorFamilyId`). |',
      '| **External authoring** | kindling repo — **separate git repo**, not part of this codebase (sibling checkout on Drew\'s machine) | kindling\'s `library/build-mode/orchestrator.ts` CLI → direct Sanity mutations with deterministic IDs + `register/modules.jsonl` event trail. Used by Drew / Cowork to build official content packs from spec docs. Dropped 1 May 2026 (commits `306e4fc`, `f8ee5c7`, `f9e6e5c`). Bypasses `/api/modules/publish` because that endpoint violates the editorial rule (auto-stamps `authorFamilyId`). |',
    ],
  ]),
);

// ─────────────────────────────────────────────────────────────────────
// 8. Summary
// ─────────────────────────────────────────────────────────────────────
console.log('\n──────────── summary ────────────');
if (changes.moved) {
  console.log(`moved:    ${changes.moved.from}\n          → ${changes.moved.to}`);
}
if (changes.deleted.length) console.log(`deleted:  ${changes.deleted.join(', ')}`);
if (changes.edited.length) console.log(`edited:   ${changes.edited.join(', ')}`);
if (changes.skipped.length) console.log(`skipped:  ${changes.skipped.join(', ')}`);

console.log('\n──────────── git status ────────────');
try {
  const status = execSync('git status --short', { encoding: 'utf8' });
  process.stdout.write(status || '(working tree clean)\n');
} catch {
  console.log('(not a git repo, or git unavailable)');
}

console.log('\n✓ done. Next steps:');
console.log('   npx tsc --noEmit && npm run lint && npm test');
console.log('   git add -A && git commit -m "chore: detach claude-kindling from repo tree"');
