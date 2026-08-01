/**
 * Hearth PKB — Corpus Confirm
 *
 * Flips `suggestedDraft: false` for explicitly-named vault entries after a
 * human (Drew) has reviewed them — see `npm run corpus:review`. This is
 * the PKB9 human-confirmation gate, so it is deliberately narrow:
 *
 *   - `--ids` is REQUIRED and must name every entry explicitly.
 *     There is no `--all` and there never will be — see corpus/pedagogy/README.md
 *     ("Never set `false` yourself" is the authoring rule; this script is
 *     the one place that happens, and only for ids Drew typed out).
 *   - All-or-nothing: every id is validated before anything is written.
 *     One unknown or already-confirmed id aborts the whole run.
 *   - Ids are the short form (`cm.021`, `montessori.003`) or the
 *     facilitation-vocabulary singleton (`cm`). Montessori reuses numbers
 *     across layers, so an ambiguous id must be layer-qualified:
 *     `<prefix>:<shortId>`, e.g. `pp:montessori.003`, `we:montessori.006`
 *     (prefixes: se|pp|om|fv|ci|we).
 *   - The edit is surgical — only the `suggestedDraft:` line changes.
 *
 * Run:   npm run corpus:confirm -- --ids cm.021,we:montessori.004
 * Next:  npm run seed:pedagogy:corpus && npm run seed:pedagogy:reembed
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { compileVault, DEFAULT_VAULT_ROOT, FRAMEWORKS } from '../src/lib/pedagogy/corpus';
import { toResolvableDocs, resolveConfirmIds, type ResolvableDoc } from '../src/lib/pedagogy/corpus-review/resolve-id';
import { locateVaultFile } from '../src/lib/pedagogy/corpus-review/locate-file';
import { setSuggestedDraftFalse } from '../src/lib/pedagogy/corpus-review/patch-frontmatter';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const args = process.argv.slice(2);

function readIdsFlag(argv: string[]): string | null {
  const i = argv.indexOf('--ids');
  if (i === -1) return null;
  return argv[i + 1] ?? null;
}

function fail(message: string): never {
  console.error(`\n${message}`);
  process.exit(1);
}

function main() {
  console.log('\nHearth PKB corpus confirm');

  if (args.includes('--all')) {
    fail(
      '--all is not supported — corpus:confirm never bulk-confirms by design. ' +
        'Name every id explicitly: --ids <comma,separated,ids>'
    );
  }

  const idsRaw = readIdsFlag(args);
  if (idsRaw === null || idsRaw.trim() === '') {
    fail(
      'Missing required --ids <comma,separated,ids>. Nothing was written.\n' +
        'Example: npm run corpus:confirm -- --ids cm.021,we:montessori.004\n' +
        'Run `npm run corpus:review` first to see what is pending.'
    );
  }

  const tokens = idsRaw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t !== '');

  if (tokens.length === 0) {
    fail('--ids was given but contained no ids. Nothing was written.');
  }

  console.log(`  Requested: ${tokens.join(', ')}`);

  const before = compileVault();
  if (before.issues.length > 0) {
    console.log(
      `\n  Note: the vault currently has ${before.issues.length} compile issue(s) unrelated to this run — ` +
        'run `npm run corpus:check` for details.'
    );
  }

  const resolvable = toResolvableDocs(before.docs);
  const { resolved, errors } = resolveConfirmIds(tokens, resolvable);

  if (errors.length > 0) {
    console.error(`\n${errors.length} problem${errors.length === 1 ? '' : 's'} — nothing written:`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  // Multiple tokens may resolve to the same file (e.g. a qualified and an
  // unqualified form of the same id) — dedupe before touching disk.
  const uniqueByDocId = new Map<string, ResolvableDoc>();
  for (const r of resolved) uniqueByDocId.set(r.entry.doc._id, r.entry);
  const toApply = [...uniqueByDocId.values()];

  // Locate every file before writing any of them — keeps the operation
  // all-or-nothing even if a file has moved since compileVault() ran.
  const withPaths = toApply.map((entry) => {
    const framework = FRAMEWORKS.find((f) => f.short === entry.frameworkShort);
    const filePath = framework
      ? locateVaultFile(DEFAULT_VAULT_ROOT, framework.dir, entry.layerDir, entry.shortId)
      : null;
    return { entry, filePath };
  });

  const missing = withPaths.filter((w) => !w.filePath);
  if (missing.length > 0) {
    fail(
      `Could not locate the vault file for: ${missing.map((m) => m.entry.qualifiedId).join(', ')}. Nothing written.`
    );
  }

  console.log(`\n${toApply.length} entr${toApply.length === 1 ? 'y' : 'ies'} to confirm:`);
  for (const { entry, filePath } of withPaths) {
    console.log(`  ${entry.qualifiedId}  (${path.relative(process.cwd(), filePath as string)})`);
  }

  for (const { filePath } of withPaths) {
    const raw = fs.readFileSync(filePath as string, 'utf8');
    fs.writeFileSync(filePath as string, setSuggestedDraftFalse(raw), 'utf8');
  }

  const after = compileVault();
  const confirmedAfter = after.docs.filter((d) => d.status === 'published' && d.suggestedDraft === false).length;

  console.log(
    `\n+${toApply.length} confirmed; now ${confirmedAfter} of ${after.docs.length} entries are published+confirmed ` +
      '(retrievable after reembed).'
  );
  console.log('Next: npm run seed:pedagogy:corpus && npm run seed:pedagogy:reembed');
}

main();
