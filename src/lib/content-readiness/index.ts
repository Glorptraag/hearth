/**
 * Content-readiness analysis for Sanity packs.
 *
 * Two independent concerns drive the alpha content cleanup:
 *
 *  1. Placeholder materials. Draft content carries "[NEEDED]" markers in its
 *     materials where a real item still has to be sourced or produced. A pack
 *     whose tree still contains any "[NEEDED]" marker is NOT ready to be live —
 *     it should be unpublished at the pack level (pack.status → draft) and kept
 *     as a draft until the gaps are filled. See `hasNeededPlaceholder` /
 *     `analyzePackMaterials`.
 *
 *  2. Generated-media dependency. Some content assumes auto-generated images or
 *     audio. Hearth has no such pipeline today (no Deepgram, no image
 *     generation; the only media automation is a narrow ja-JP Google TTS helper
 *     wired to nothing but a smoke test — see
 *     docs/content-media-integration-assessment.md). Any pack that references an
 *     `audio` asset, or an asset with no uploaded file, is blocked on media that
 *     has to be produced by hand. See `analyzePackMedia`.
 *
 * The logic here is PURE — it operates on already-fetched plain objects so it
 * can be unit-tested without a Sanity connection. The scripts in
 * `src/scripts/{audit-content-readiness,retract-packs}` do the GROQ fetch and
 * the writes; this module decides what the fetched data means.
 */

// "[NEEDED]" is the canonical placeholder marker. We match it case-insensitively
// and tolerate surrounding whitespace inside the brackets, e.g. "[ needed ]".
// The brackets are required so we don't flag legitimate prose that happens to
// contain the word "needed" (e.g. "no special equipment needed").
export const NEEDED_PLACEHOLDER_RE = /\[\s*needed\s*\]/i;

export function hasNeededPlaceholder(text: string | null | undefined): boolean {
  if (typeof text !== 'string') return false;
  return NEEDED_PLACEHOLDER_RE.test(text);
}

/**
 * The materials strings reachable from a pack, as returned by
 * `PACK_MATERIALS_PROJECTION`. GROQ chained dereferences return nested arrays,
 * so every field is `unknown` and flattened defensively.
 */
export interface RawPackMaterials {
  packMaterialsDesc?: unknown; // pack.materials.description (string)
  moduleMaterialsDesc?: unknown; // modules[]->materials.description (string[])
  activityMaterialNames?: unknown; // ...activities[]->materials[].name (string[][])
  activityMaterialAlternatives?: unknown; // ...activities[]->materials[].alternative
}

export interface NeededHit {
  field: string;
  text: string;
}

// Flatten arbitrarily-nested arrays of strings (the shape GROQ chained
// dereferences produce), dropping nulls/non-strings.
function flattenStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(flattenStrings);
  return typeof value === 'string' ? [value] : [];
}

/**
 * Find every "[NEEDED]" placeholder reachable through a pack's materials
 * fields. Materials-only by design — instructions and guidance are NOT scanned.
 */
export function analyzePackMaterials(raw: RawPackMaterials): NeededHit[] {
  const fields: [string, unknown][] = [
    ['pack.materials.description', raw.packMaterialsDesc],
    ['module.materials.description', raw.moduleMaterialsDesc],
    ['activity.materials[].name', raw.activityMaterialNames],
    ['activity.materials[].alternative', raw.activityMaterialAlternatives],
  ];
  const hits: NeededHit[] = [];
  for (const [field, value] of fields) {
    for (const text of flattenStrings(value)) {
      if (hasNeededPlaceholder(text)) hits.push({ field, text });
    }
  }
  return hits;
}

/**
 * A single asset reachable from a pack, projected to just the fields that tell
 * us whether it depends on media we cannot auto-produce.
 */
export interface RawAsset {
  _id?: string | null;
  title?: string | null;
  kind?: string | null;
  hasFile?: boolean | null;
}

export interface MediaDependency {
  audio: RawAsset[]; // kind === 'audio' — no working audio-generation pipeline
  missingFile: RawAsset[]; // asset with no uploaded file — placeholder awaiting production
}

/**
 * Classify the assets a pack references by the production gap they imply.
 * De-dupes by `_id` so an asset shared across activities is counted once.
 */
export function analyzePackMedia(assets: readonly RawAsset[]): MediaDependency {
  const seenAudio = new Set<string>();
  const seenMissing = new Set<string>();
  const audio: RawAsset[] = [];
  const missingFile: RawAsset[] = [];
  for (const a of assets) {
    if (!a) continue;
    const id = a._id ?? '';
    if (a.kind === 'audio' && !seenAudio.has(id)) {
      seenAudio.add(id);
      audio.push(a);
    }
    if (a.hasFile === false && !seenMissing.has(id)) {
      seenMissing.add(id);
      missingFile.push(a);
    }
  }
  return { audio, missingFile };
}

// GROQ projections shared by the audit and retract scripts, so both agree on
// exactly which fields define "[NEEDED]" placeholders and media dependency.
export const PACK_MATERIALS_PROJECTION = `{
  "packMaterialsDesc": materials.description,
  "moduleMaterialsDesc": modules[]->materials.description,
  "activityMaterialNames": modules[]->approaches[]->activities[]->materials[].name,
  "activityMaterialAlternatives": modules[]->approaches[]->activities[]->materials[].alternative
}`;

export const PACK_ASSETS_PROJECTION = `{
  "assets": modules[]->approaches[]->activities[]->assets[].asset->{
    _id, title, kind, "hasFile": defined(file)
  }
}`;
