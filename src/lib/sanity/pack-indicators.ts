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

export interface Indicators {
  printables?: Printables;
  materials?: Materials;
}

interface IndicatorSource {
  printables?: Printables;
  materials?: Materials;
}

// Module-level fields override the parent pack. A child overrides when it explicitly
// declares the field — for printables, `available` must be defined; for materials,
// `mode` must be set to a non-default value. Otherwise the pack value carries through.
export function resolveIndicators(
  pack?: IndicatorSource | null,
  module?: IndicatorSource | null,
): Indicators {
  const printables =
    module?.printables?.available !== undefined ? module.printables : pack?.printables;

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
