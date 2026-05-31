#!/usr/bin/env node
// Content audit: find published packs that are dead-ends for parents.
//
// A "dead-end" pack is one a family can add to their library but where
// clicking through reveals nothing to actually do. Two cases:
//   1. Pack has zero `modules[]` refs (the empty pack).
//   2. Pack has module refs, but every referenced module is a draft —
//      so the Sanity-gated runtime query (workstream A) returns []
//      and the family sees "No modules in this pack yet."
//
// Both are content-side bugs the Sanity editor needs to fix:
//   - Add modules to the empty pack, or unpublish it.
//   - Publish the modules that the pack references, or remove the refs.
//
// Read-only: prints a checklist. Does not mutate Sanity.
//
// Usage:
//   node scripts/audit-published-packs.mjs
//
// Companion to the runtime invariant enforced by:
//   scripts/check-sanity-gating.mjs

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';

if (!projectId) {
  console.error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set.');
  process.exit(2);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function main() {
  // Note: we INTENTIONALLY do NOT filter modules[]-> by status here — the
  // point of the audit is to see what runtime callers DON'T see. The runtime
  // query filters by `status == "published"`, so an unpublished module ref
  // disappears in production. This script surfaces that gap.
  const packs = await client.fetch(
    `*[_type == "pack" && status == "published"]{
      _id, title, "slug": slug.current,
      "totalRefs": count(modules),
      "publishedRefs": count(modules[@->status == "published"])
    } | order(title asc)`,
  );

  const empty = packs.filter((p) => (p.totalRefs ?? 0) === 0);
  const draftOnly = packs.filter(
    (p) => (p.totalRefs ?? 0) > 0 && (p.publishedRefs ?? 0) === 0,
  );
  const partial = packs.filter(
    (p) =>
      (p.totalRefs ?? 0) > 0 &&
      (p.publishedRefs ?? 0) > 0 &&
      p.publishedRefs < p.totalRefs,
  );

  const fmt = (p) =>
    `  - ${p.title}  (${p._id})  ${p.publishedRefs ?? 0}/${p.totalRefs ?? 0} modules live`;

  console.log(`Published packs: ${packs.length}\n`);

  if (empty.length === 0 && draftOnly.length === 0 && partial.length === 0) {
    console.log('✓ Every published pack has at least one published module.');
    return;
  }

  if (empty.length > 0) {
    console.log(`✗ Empty packs (${empty.length}) — published with no module refs:`);
    empty.forEach((p) => console.log(fmt(p)));
    console.log('  → Add modules or unpublish the pack.\n');
  }

  if (draftOnly.length > 0) {
    console.log(
      `✗ Draft-only packs (${draftOnly.length}) — published but every referenced module is a draft:`,
    );
    draftOnly.forEach((p) => console.log(fmt(p)));
    console.log(
      '  → Publish the referenced modules, or remove the unpublished refs.\n',
    );
  }

  if (partial.length > 0) {
    console.log(
      `⚠ Partial packs (${partial.length}) — some referenced modules are still drafts:`,
    );
    partial.forEach((p) => console.log(fmt(p)));
    console.log(
      '  → Families see fewer modules than the pack advertises. Publish the rest.\n',
    );
  }

  // Non-zero exit only on hard failures (empty or draft-only). Partial is a
  // warning, not a block — partial publishing during alpha is intentional.
  if (empty.length > 0 || draftOnly.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('audit failed:', err);
  process.exit(2);
});
