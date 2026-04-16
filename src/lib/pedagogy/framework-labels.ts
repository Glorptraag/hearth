// Shared display labels for pedagogy framework keys (families.pedagogyPreference).
// Keep in sync with PedagogySelector options and the Sanity pedagogicalFramework
// slugs. Single source of truth — do not duplicate this map.

export const FRAMEWORK_LABELS: Record<string, string> = {
  charlotte_mason: 'Charlotte Mason',
  classical: 'Classical',
  montessori: 'Montessori',
  waldorf_steiner: 'Waldorf / Steiner',
  unschooling: 'Unschooling',
  eclectic: 'Eclectic',
};

export function frameworkLabel(pedagogyKey: string | null | undefined): string {
  if (!pedagogyKey) return 'Eclectic';
  return FRAMEWORK_LABELS[pedagogyKey] ?? pedagogyKey;
}
