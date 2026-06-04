/**
 * Retract (unpublish) packs that aren't ready for families — at the pack level.
 *
 * Setting pack.status → "draft" makes the whole pack vanish from the app (the
 * runtime GROQ layer gates packs on status == "published"), while leaving the
 * child modules / approaches / activities exactly as they are so you can keep
 * editing the drafts in Sanity Studio. This is the deliberate counterpart to
 * src/scripts/promote-packs (which publishes a whole tree): retract touches ONLY
 * the pack document.
 *
 * Two ways to choose targets:
 *   --with-needed-materials   auto-select every published pack whose tree still
 *                             carries a "[NEEDED]" placeholder in its materials
 *                             (same predicate as the audit; materials only).
 *   <slug|id|pack-slug> ...   retract specific packs by hand.
 *
 * Dry-run is the default. Nothing is written until you pass --commit.
 *
 * Usage:
 *   # preview every not-ready pack
 *   npm run retract:packs -- --with-needed-materials
 *
 *   # preview specific packs
 *   npm run retract:packs -- storytellers pack-first-term-foundations
 *
 *   # actually unpublish
 *   npm run retract:packs -- --with-needed-materials --commit
 *
 * Pre-flight:
 *   - SANITY_API_TOKEN must have write scope (only needed with --commit).
 *   - NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET must be set
 *     (loaded from .env.local by the npm script).
 *
 * Companion to src/scripts/audit-content-readiness (which finds these packs) and
 * src/scripts/promote-packs (the publish path).
 */

import { query, patchMany } from '@/lib/sanity/mutations';
import {
  analyzePackMaterials,
  PACK_MATERIALS_PROJECTION,
  type RawPackMaterials,
} from '@/lib/content-readiness';

interface PackRow {
  _id: string;
  title: string;
  slug: string | null;
  status: string;
}

async function resolveByNeededMaterials(): Promise<PackRow[]> {
  const published = await query<PackRow[]>(
    `*[_type == "pack" && status == "published"]{ _id, title, "slug": slug.current, status } | order(title asc)`,
  );
  const out: PackRow[] = [];
  for (const pack of published) {
    const materials = await query<RawPackMaterials>(
      `*[_id == $id][0]${PACK_MATERIALS_PROJECTION}`,
      { id: pack._id },
    );
    if (analyzePackMaterials(materials ?? {}).length > 0) out.push(pack);
  }
  return out;
}

async function resolveByName(args: string[]): Promise<PackRow[]> {
  // Accept a raw _id, a slug, or a bare slug we prefix to the deterministic id.
  const prefixed = args.map((a) => (a.startsWith('pack-') ? a : `pack-${a}`));
  return query<PackRow[]>(
    `*[_type == "pack" && (_id in $ids || _id in $prefixed || slug.current in $slugs)]{
      _id, title, "slug": slug.current, status
    } | order(title asc)`,
    { ids: args, prefixed, slugs: args },
  );
}

async function main() {
  const argv = process.argv.slice(2);
  const commit = argv.includes('--commit');
  const withNeeded = argv.includes('--with-needed-materials');
  const targets = argv.filter((a) => !a.startsWith('--'));

  if (!withNeeded && targets.length === 0) {
    console.error(
      'Nothing to retract. Pass pack slugs/ids, or --with-needed-materials.\n' +
        'Example: npm run retract:packs -- --with-needed-materials --commit',
    );
    process.exit(2);
  }

  if (commit && !process.env.SANITY_API_TOKEN) {
    console.error('--commit needs SANITY_API_TOKEN (write scope) in the environment.');
    process.exit(2);
  }

  const packs = withNeeded ? await resolveByNeededMaterials() : await resolveByName(targets);
  if (packs.length === 0) {
    console.log(
      withNeeded
        ? 'No published packs carry "[NEEDED]" placeholder materials. Nothing to retract.'
        : 'No matching packs found.',
    );
    return;
  }

  console.log(
    `${commit ? '[retract]' : '[dry-run]'} ${packs.length} pack${packs.length === 1 ? '' : 's'} targeted` +
      `${commit ? '' : ' — no writes will be made (pass --commit to apply)'}\n`,
  );

  const toRetract: { id: string; fields: { status: string } }[] = [];
  for (const pack of packs) {
    const live = pack.status === 'published';
    console.log(`• ${pack.title}  (${pack._id}) — currently ${pack.status}`);
    if (!live) {
      console.log('    ✓ already not published — nothing to do\n');
      continue;
    }
    console.log('    → set pack.status → draft (child documents untouched)\n');
    toRetract.push({ id: pack._id, fields: { status: 'draft' } });
  }

  if (toRetract.length === 0) {
    console.log('Everything targeted is already unpublished. Done.');
    return;
  }

  if (!commit) {
    console.log(
      `[dry-run] Would unpublish ${toRetract.length} pack${toRetract.length === 1 ? '' : 's'} (pack-level only).\n` +
        'Re-run with --commit to apply.',
    );
    return;
  }

  await patchMany(toRetract);
  console.log(`\n[retract] Done. Unpublished ${toRetract.length} pack${toRetract.length === 1 ? '' : 's'} to draft.`);
  console.log('Tip: run `npm run audit:content-readiness` to confirm no not-ready packs remain live.');
}

main().catch((err) => {
  console.error('retract failed:', err);
  process.exit(1);
});
