/**
 * Hearth PKB — Corpus Vault Compiler
 *
 * Compiles corpus/pedagogy/ vault entries into Sanity PKB documents.
 * Deterministic IDs → createOrReplace updates in place, never duplicates.
 *
 * Run:   npm run seed:pedagogy:corpus            (compile + write to Sanity)
 * Flags: --check      Validate the vault and print coverage; write nothing.
 *        --dry-run    Compile and list what would be written; write nothing.
 *        --framework <dir>   Restrict to one framework directory
 *                            (charlotte-mason | classical | montessori |
 *                             waldorf-steiner | unschooling)
 *
 * After a write, run `npm run seed:pedagogy:reembed` to materialise
 * published + confirmed documents into pedagogy_knowledge_chunks, then
 * `npm run verify:pkb` to check the index.
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { compileVault, formatCoverage } from '../src/lib/pedagogy/corpus';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const DRY_RUN = args.includes('--dry-run');
const frameworkFlag = (() => {
  const i = args.indexOf('--framework');
  return i !== -1 ? args[i + 1] : undefined;
})();

async function run() {
  const mode = CHECK ? ' [CHECK]' : DRY_RUN ? ' [DRY RUN]' : '';
  console.log(`\nHearth PKB corpus vault compile${mode}`);
  if (frameworkFlag) console.log(`  Framework filter: ${frameworkFlag}`);

  const output = compileVault(undefined, { frameworkDir: frameworkFlag });

  console.log(`\nParsed ${output.entryCount} entries, ${Object.keys(output.registry).length} registered sources`);
  console.log('\nCoverage vs Wave-1 targets:');
  for (const line of formatCoverage(output.coverage)) console.log(line);

  if (output.issues.length > 0) {
    console.error(`\n${output.issues.length} issue${output.issues.length === 1 ? '' : 's'}:`);
    for (const issue of output.issues) {
      console.error(`  ✗ ${issue.file}\n      ${issue.message}`);
    }
    process.exit(1);
  }

  console.log(`\n✓ Vault valid — ${output.docs.length} compiled documents`);

  const confirmed = output.docs.filter((d) => d.status === 'published' && d.suggestedDraft === false);
  const awaitingReview = output.docs.length - confirmed.length;
  console.log(`  ${confirmed.length} published + confirmed (retrievable after reembed)`);
  if (awaitingReview > 0) {
    console.log(`  ${awaitingReview} draft or awaiting human review (excluded from retrieval by design)`);
  }

  if (CHECK) return;

  if (DRY_RUN) {
    console.log('\nWould write:');
    for (const doc of output.docs) console.log(`  ${doc._id}`);
    return;
  }

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    token: process.env.SANITY_API_TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
  });

  const BATCH_SIZE = 20;
  for (let i = 0; i < output.docs.length; i += BATCH_SIZE) {
    const batch = output.docs.slice(i, i + BATCH_SIZE);
    const tx = client.transaction();
    for (const doc of batch) tx.createOrReplace(doc);
    await tx.commit();
    console.log(`  Committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} docs)`);
  }

  console.log(`\nDone — ${output.docs.length} documents written to Sanity.`);
  console.log('Next: npm run seed:pedagogy:reembed  (then: npm run verify:pkb)');
}

run().catch((err) => {
  console.error('\nFatal:', err);
  process.exit(1);
});
