/**
 * Content-readiness audit for published packs.
 *
 * Answers two questions for every published pack, read-only:
 *
 *   1. Is it still carrying "[NEEDED]" placeholder materials?  → NOT READY.
 *      Such packs should be unpublished at the pack level and kept as drafts
 *      until the gaps are filled (set pack.status → draft in Sanity Studio).
 *
 *   2. Does it depend on media we cannot auto-produce (audio assets, or assets
 *      with no uploaded file)?  → BLOCKED ON MANUAL MEDIA. Hearth has no audio-
 *      or image-generation pipeline today (see
 *      docs/content-media-integration-assessment.md); these assets have to be
 *      recorded/uploaded by hand before the pack is genuinely complete.
 *
 * Scope of "[NEEDED]" detection is MATERIALS FIELDS ONLY — pack/module
 * materials.description and activity materials[].name / .alternative. The shared
 * predicates live in src/lib/content-readiness so a future automated retract
 * and this audit can never disagree.
 *
 * Read-only: prints a checklist and exits non-zero if any not-ready pack is
 * live. Companion to scripts/audit-published-packs.mjs (empty / draft-only
 * packs) and src/scripts/promote-packs (the publish path).
 *
 * Usage:
 *   npm run audit:content-readiness
 *
 * Pre-flight: NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET set
 * (loaded from .env.local by the npm script). No write token needed.
 */

import { query } from '@/lib/sanity/mutations';
import {
  analyzePackMaterials,
  analyzePackMedia,
  PACK_MATERIALS_PROJECTION,
  PACK_ASSETS_PROJECTION,
  type RawPackMaterials,
  type RawAsset,
} from '@/lib/content-readiness';

interface PackRow {
  _id: string;
  title: string;
  slug: string | null;
}

async function main() {
  const packs = await query<PackRow[]>(
    `*[_type == "pack" && status == "published"]{ _id, title, "slug": slug.current } | order(title asc)`,
  );

  console.log(`Published packs: ${packs.length}\n`);

  const notReady: { pack: PackRow; fields: string[]; samples: string[] }[] = [];
  const mediaBlocked: {
    pack: PackRow;
    audio: number;
    missingFile: number;
    audioTitles: string[];
  }[] = [];

  for (const pack of packs) {
    const materials = await query<RawPackMaterials>(
      `*[_id == $id][0]${PACK_MATERIALS_PROJECTION}`,
      { id: pack._id },
    );
    const hits = analyzePackMaterials(materials ?? {});
    if (hits.length > 0) {
      notReady.push({
        pack,
        fields: Array.from(new Set(hits.map((h) => h.field))).sort(),
        samples: Array.from(new Set(hits.map((h) => h.text))).slice(0, 3),
      });
    }

    const assetsRes = await query<{ assets: (RawAsset | null)[] | null }>(
      `*[_id == $id][0]${PACK_ASSETS_PROJECTION}`,
      { id: pack._id },
    );
    const media = analyzePackMedia((assetsRes?.assets ?? []).filter(Boolean) as RawAsset[]);
    if (media.audio.length > 0 || media.missingFile.length > 0) {
      mediaBlocked.push({
        pack,
        audio: media.audio.length,
        missingFile: media.missingFile.length,
        audioTitles: media.audio.map((a) => a.title ?? a._id ?? '(untitled)').slice(0, 3),
      });
    }
  }

  if (notReady.length === 0 && mediaBlocked.length === 0) {
    console.log('✓ Every published pack is materials-complete and free of unproducible media.');
    return;
  }

  if (notReady.length > 0) {
    console.log(`✗ Not ready (${notReady.length}) — published packs with "[NEEDED]" placeholder materials:`);
    for (const n of notReady) {
      console.log(`  - ${n.pack.title}  (${n.pack._id})`);
      console.log(`      fields: ${n.fields.join(', ')}`);
      for (const s of n.samples) console.log(`      e.g. "${s}"`);
    }
    console.log('  → Unpublish at the pack level (set pack.status → draft in Sanity Studio) until the gaps are filled.\n');
  }

  if (mediaBlocked.length > 0) {
    console.log(
      `⚠ Blocked on manual media (${mediaBlocked.length}) — packs referencing media Hearth cannot auto-generate:`,
    );
    for (const m of mediaBlocked) {
      const parts = [];
      if (m.audio > 0) parts.push(`${m.audio} audio asset${m.audio === 1 ? '' : 's'}`);
      if (m.missingFile > 0) parts.push(`${m.missingFile} asset${m.missingFile === 1 ? '' : 's'} missing a file`);
      console.log(`  - ${m.pack.title}  (${m.pack._id}) — ${parts.join(', ')}`);
      if (m.audioTitles.length > 0) console.log(`      audio: ${m.audioTitles.join('; ')}`);
    }
    console.log(
      '  → There is no audio/image generation pipeline (no Deepgram, no image gen; only a\n' +
        '    narrow ja-JP Google TTS helper used by a smoke test). These assets must be produced\n' +
        '    by hand. See docs/content-media-integration-assessment.md.\n',
    );
  }

  // Hard failure only for not-ready packs that are live. Media dependency is a
  // warning — a pack can legitimately ship while its audio is recorded, and we
  // don't want to block the whole audit on it.
  if (notReady.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error('audit failed:', err);
  process.exit(2);
});
