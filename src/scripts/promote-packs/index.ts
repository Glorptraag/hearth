/**
 * Promote stranded draft content packs to published in Sanity.
 *
 * The runtime GROQ layer gates EVERY level on `status == "published"`, and the
 * pack-detail query dereferences children with `modules[@->status ==
 * "published"]->`. So a pack only reaches families when its WHOLE tree — pack,
 * modules, approaches, activities, plus the assets and commons texts those
 * activities reference, plus the pack's badges — is published. Flipping just the
 * pack leaves a dead-end (see scripts/audit-published-packs.mjs). This script
 * walks the tree from each target pack and promotes every descendant in one go.
 *
 * Dry-run is the default. Nothing is written until you pass --commit.
 *
 * Usage:
 *   # preview every draft pack and its tree
 *   npm run promote:packs -- --all-drafts
 *
 *   # preview specific packs (by slug, _id, or pack-<slug>)
 *   npm run promote:packs -- first-term-foundations pack-storytellers
 *
 *   # actually write
 *   npm run promote:packs -- --all-drafts --commit
 *
 * Pre-flight:
 *   - SANITY_API_TOKEN must have write scope (only needed with --commit).
 *   - NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET must be set
 *     (loaded from .env.local by the npm script).
 *
 * Companion to scripts/audit-published-packs.mjs (which finds the dead-ends this
 * script fixes) and scripts/check-sanity-gating.mjs (the CI invariant).
 */

import { query, patchMany } from '@/lib/sanity/mutations';

interface PackRow {
  _id: string;
  title: string;
  slug: string | null;
  status: string;
}

interface DocRow {
  _id: string;
  _type: string;
  status?: string;
}

// Flatten the nested-array shapes that GROQ chained dereferences return.
function flattenIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(flattenIds);
  return typeof value === 'string' ? [value] : [];
}

async function resolvePacks(args: string[], allDrafts: boolean): Promise<PackRow[]> {
  if (allDrafts) {
    return query<PackRow[]>(
      `*[_type == "pack" && status == "draft"]{ _id, title, "slug": slug.current, status } | order(title asc)`,
    );
  }
  // Accept a raw _id, a slug, or a bare slug we prefix to the deterministic id.
  const prefixed = args.map((a) => (a.startsWith('pack-') ? a : `pack-${a}`));
  return query<PackRow[]>(
    `*[_type == "pack" && (_id in $ids || _id in $prefixed || slug.current in $slugs)]{
      _id, title, "slug": slug.current, status
    } | order(title asc)`,
    { ids: args, prefixed, slugs: args },
  );
}

// Collect every descendant document id beneath a pack.
async function collectTreeIds(packId: string): Promise<string[]> {
  const tree = await query<{
    moduleIds: unknown;
    badgeIds: unknown;
    approachIds: unknown;
    activityIds: unknown;
    assetIds: unknown;
    commonsTextIds: unknown;
  } | null>(
    `*[_id == $id][0]{
      "moduleIds": modules[]->_id,
      "badgeIds": badges[]->_id,
      "approachIds": modules[]->approaches[]->_id,
      "activityIds": modules[]->approaches[]->activities[]->_id,
      "assetIds": modules[]->approaches[]->activities[]->assets[]->_id,
      "commonsTextIds": modules[]->approaches[]->activities[]->commonsTexts[]->_id
    }`,
    { id: packId },
  );
  if (!tree) return [];
  return [
    ...flattenIds(tree.moduleIds),
    ...flattenIds(tree.badgeIds),
    ...flattenIds(tree.approachIds),
    ...flattenIds(tree.activityIds),
    ...flattenIds(tree.assetIds),
    ...flattenIds(tree.commonsTextIds),
  ];
}

function countByType(docs: DocRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of docs) out[d._type] = (out[d._type] ?? 0) + 1;
  return out;
}

function formatCounts(counts: Record<string, number>): string {
  const entries = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return '0 docs';
  return entries.map(([t, n]) => `${n} ${t}`).join(', ');
}

async function main() {
  const argv = process.argv.slice(2);
  const commit = argv.includes('--commit');
  const allDrafts = argv.includes('--all-drafts');
  const targets = argv.filter((a) => !a.startsWith('--'));

  if (!allDrafts && targets.length === 0) {
    console.error(
      'Nothing to promote. Pass pack slugs/ids, or --all-drafts.\n' +
        'Example: npm run promote:packs -- first-term-foundations --commit',
    );
    process.exit(2);
  }

  if (commit && !process.env.SANITY_API_TOKEN) {
    console.error('--commit needs SANITY_API_TOKEN (write scope) in the environment.');
    process.exit(2);
  }

  const packs = await resolvePacks(targets, allDrafts);
  if (packs.length === 0) {
    console.log('No matching packs found.');
    return;
  }

  console.log(
    `${commit ? '[promote]' : '[dry-run]'} ${packs.length} pack${packs.length === 1 ? '' : 's'} targeted` +
      `${commit ? '' : ' — no writes will be made (pass --commit to apply)'}\n`,
  );

  const allToPromote: { id: string; fields: { status: string } }[] = [];

  for (const pack of packs) {
    const ids = Array.from(new Set([pack._id, ...(await collectTreeIds(pack._id))]));
    const docs = await query<DocRow[]>(`*[_id in $ids]{ _id, _type, status }`, { ids });

    const toPromote = docs.filter((d) => d.status !== 'published');
    const alreadyLive = docs.length - toPromote.length;

    console.log(`• ${pack.title}  (${pack._id})`);
    console.log(`    tree: ${docs.length} docs — ${formatCounts(countByType(docs))}`);
    if (toPromote.length === 0) {
      console.log(`    ✓ already fully published — nothing to do\n`);
      continue;
    }
    console.log(
      `    → promote ${toPromote.length} (${formatCounts(countByType(toPromote))})` +
        `${alreadyLive > 0 ? `; ${alreadyLive} already live` : ''}\n`,
    );

    for (const d of toPromote) {
      allToPromote.push({ id: d._id, fields: { status: 'published' } });
    }
  }

  if (allToPromote.length === 0) {
    console.log('Everything targeted is already published. Done.');
    return;
  }

  if (!commit) {
    console.log(
      `[dry-run] Would promote ${allToPromote.length} document${allToPromote.length === 1 ? '' : 's'} to published.\n` +
        'Re-run with --commit to apply.',
    );
    return;
  }

  // Chunk the writes to keep each transaction comfortably small.
  const CHUNK = 50;
  let written = 0;
  for (let i = 0; i < allToPromote.length; i += CHUNK) {
    const batch = allToPromote.slice(i, i + CHUNK);
    await patchMany(batch);
    written += batch.length;
    console.log(`  committed ${written}/${allToPromote.length}…`);
  }

  console.log(`\n[promote] Done. Promoted ${written} documents to published.`);
  console.log('Tip: run `npm run audit:published-packs` to confirm no dead-ends remain.');
}

main().catch((err) => {
  console.error('promote failed:', err);
  process.exit(1);
});
