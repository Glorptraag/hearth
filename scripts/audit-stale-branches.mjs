#!/usr/bin/env node
// Audit local + remote branches for staleness relative to origin/main.
// Read-only: prints findings and suggested commands; does not delete anything.
//
// Usage:
//   node scripts/audit-stale-branches.mjs
//   STALE_DAYS=7 node scripts/audit-stale-branches.mjs
//   PROTECTED=main,release,staging node scripts/audit-stale-branches.mjs
//
// Companion: docs/branch-hygiene.md

import { execSync } from 'node:child_process';

const STALE_DAYS = Number(process.env.STALE_DAYS ?? 14);
const PROTECTED = (process.env.PROTECTED ?? 'main,master,HEAD')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const BASE = process.env.BASE ?? 'origin/main';

function git(cmd) {
  return execSync(`git ${cmd}`, { encoding: 'utf8' }).trim();
}

function tryGit(cmd) {
  try {
    return git(cmd);
  } catch {
    return '';
  }
}

try {
  git('rev-parse --is-inside-work-tree');
} catch {
  console.error('error: not inside a git repository');
  process.exit(1);
}

// Refresh remote state so "merged" checks are accurate.
try {
  execSync('git fetch --prune --quiet', { stdio: 'inherit' });
} catch {
  console.warn('warning: git fetch failed — results may be stale');
}

// Collect: [refname, committerdate:iso, merged-into-base?]
const raw = git(
  'for-each-ref --format="%(refname:short)|%(committerdate:iso8601)" refs/remotes/origin',
)
  .split('\n')
  .filter(Boolean);

const now = Date.now();
const staleCutoffMs = STALE_DAYS * 24 * 60 * 60 * 1000;

const merged = [];
const unmergedStale = [];
const unmergedActive = [];

for (const line of raw) {
  const [refname, dateStr] = line.replace(/^"/, '').replace(/"$/, '').split('|');
  if (!refname || !dateStr) continue;

  const shortName = refname.replace(/^origin\//, '');
  if (PROTECTED.includes(shortName)) continue;

  const committed = Date.parse(dateStr);
  const ageMs = now - committed;
  const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

  // `git merge-base --is-ancestor` returns 0 when refname is reachable from
  // BASE, meaning the branch is fully merged.
  const isMerged = (() => {
    try {
      execSync(`git merge-base --is-ancestor ${refname} ${BASE}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();

  const entry = { refname, shortName, ageDays, committed: dateStr };

  if (isMerged) merged.push(entry);
  else if (ageMs >= staleCutoffMs) unmergedStale.push(entry);
  else unmergedActive.push(entry);
}

function sortByAgeDesc(a, b) {
  return b.ageDays - a.ageDays;
}

function section(title, entries, hint) {
  console.log(`\n${title} (${entries.length})`);
  console.log('-'.repeat(title.length + ` (${entries.length})`.length));
  if (entries.length === 0) {
    console.log('  (none)');
    return;
  }
  for (const e of entries.sort(sortByAgeDesc)) {
    console.log(`  ${e.ageDays.toString().padStart(4)}d  ${e.shortName}   (${e.committed})`);
  }
  if (hint) {
    console.log(`\n  ${hint}`);
  }
}

console.log(`Stale window: ${STALE_DAYS} days. Base: ${BASE}. Protected: ${PROTECTED.join(', ')}`);

section(
  'UNMERGED & STALE — needs triage',
  unmergedStale,
  'Triage each: rebase and push if still wanted, otherwise delete:\n' +
    '    git push origin --delete <branch>',
);

section('UNMERGED & ACTIVE — informational', unmergedActive);

section(
  'MERGED but not auto-deleted — GitHub auto-delete may have regressed',
  merged,
  'Delete server-side:\n' +
    "    git push origin --delete <branch>\n" +
    '  And re-check Settings → General → "Automatically delete head branches".',
);

// Exit 0 always — this is an audit, not a gate. CI can wrap it if needed.

// Local hygiene reminder.
const localGone = tryGit('branch -vv')
  .split('\n')
  .filter((l) => l.includes(': gone]'))
  .map((l) => l.trim().split(' ')[0].replace('*', ''))
  .filter(Boolean);

if (localGone.length > 0) {
  console.log(`\nLOCAL branches whose remote tracking ref is gone (${localGone.length}):`);
  for (const b of localGone) console.log(`  ${b}`);
  console.log('\n  Delete locally once you\'re sure nothing is unpushed:');
  console.log("    git branch -d " + localGone.join(' '));
  console.log("  (use -D to force if the branch has unmerged local commits)");
}
