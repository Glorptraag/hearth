// Types and inheritance logic for the Pack Indicators feature.
// Spec: hearth-pack-indicators-spec-v1.

export interface Printables {
  available?: boolean;
  count?: number;
}

export interface KitRef {
  _id?: string;
  title?: string;
  contents?: string[];
  priceAUD?: number;
  stripePriceId?: string;
}

export type MaterialsMode = 'none' | 'required' | 'ships-with';

export interface Materials {
  mode?: MaterialsMode;
  description?: string;
  kitRef?: KitRef | null;
  kitPriceAUD?: number;
}

// Pack-level denormalised asset rollup. Source of truth for whether a pack
// actually contains printable PDFs at the moment the indicator renders.
// Field names mirror src/sanity/schemas/pack.ts and AssetKind in
// src/components/content/types.ts (everything except `audio` is printable per
// `isPrintableAssetKind`).
export interface AssetCounts {
  total?: number;
  template?: number;
  worksheet?: number;
  reference?: number;
  card_set?: number;
  handout?: number;
  audio?: number;
  manipulative?: number;
}

export interface Indicators {
  printables?: Printables;
  materials?: Materials;
}

export interface IndicatorSource {
  printables?: Printables;
  materials?: Materials;
  assetCounts?: AssetCounts | null;
}

// Derive a Printables hint from the pack's denormalised assetCounts. Used as
// a fallback when the editor hasn't explicitly authored `printables.available`,
// so the indicator works on legacy content without requiring per-pack toggling.
// Authors can still opt out by setting `printables.available = false` explicitly
// (the schema no longer defaults to false — see pack.ts).
export function derivePrintablesFromAssetCounts(
  assetCounts?: AssetCounts | null,
): Printables | undefined {
  if (!assetCounts) return undefined;
  const total = assetCounts.total ?? 0;
  const audio = assetCounts.audio ?? 0;
  const printableCount = total - audio;
  if (printableCount <= 0) return undefined;
  return { available: true, count: printableCount };
}

// Resolve which printables value to render for this source. Authored value
// wins; otherwise fall back to the asset-count derivation.
function resolveSourcePrintables(source?: IndicatorSource | null): Printables | undefined {
  if (!source) return undefined;
  if (source.printables?.available !== undefined) return source.printables;
  return derivePrintablesFromAssetCounts(source.assetCounts);
}

// Module-level fields override the parent pack. A child overrides when it
// explicitly declares the field — for printables, `available` must be defined;
// for materials, `mode` must be a non-default value. Otherwise the pack value
// (which may itself be derived from assetCounts) carries through.
export function resolveIndicators(
  pack?: IndicatorSource | null,
  module?: IndicatorSource | null,
): Indicators {
  const printables =
    module?.printables?.available !== undefined
      ? module.printables
      : resolveSourcePrintables(pack);

  const moduleHasMaterials = module?.materials?.mode && module.materials.mode !== 'none';
  const materials = moduleHasMaterials ? module!.materials : pack?.materials;

  return { printables, materials };
}

export function hasAnyIndicator(indicators?: Indicators | null): boolean {
  if (!indicators) return false;
  const printablesOn = indicators.printables?.available === true;
  const materialsOn =
    !!indicators.materials?.mode && indicators.materials.mode !== 'none';
  return printablesOn || materialsOn;
}
