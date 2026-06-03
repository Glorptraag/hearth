/**
 * Walk a Sanity module's nested activity materials and emit a flat, deduped
 * list keyed by material name. Used by the PrepMode per-run materials
 * checklist (Task 4.4) and by Library Materials tab roll-ups.
 *
 * Dedup rules:
 *   - keys are name.trim().toLowerCase()
 *   - `required` is OR'd across duplicates — if any activity flags a
 *     material required, the aggregated row is required
 *   - `alternative` is the first non-empty alternative encountered
 *   - `firstSeenIn` tracks the originating activity for surface tooltips
 *
 * Task 4.3.
 */

export interface ActivityMaterial {
  name: string;
  required?: boolean;
  alternative?: string;
}

export interface ActivitySource {
  _id?: string;
  title?: string;
  materials?: ActivityMaterial[];
}

export interface ApproachSource {
  _id?: string;
  title?: string;
  activities?: ActivitySource[];
}

export interface ModuleSource {
  _id?: string;
  approaches?: ApproachSource[];
}

export interface AggregatedMaterial {
  /** Stable key — name.trim().toLowerCase(). Used as the `materialsState` map key. */
  key: string;
  /** Display name (first-seen casing). */
  name: string;
  /** True if any activity flags the material as required. */
  required: boolean;
  /** Free-text alternative — first non-empty one encountered. */
  alternative: string | null;
  /** Pointer to the first activity (id + title) that introduced this material. */
  firstSeenIn: {
    activityId: string | null;
    activityTitle: string | null;
  };
}

export function aggregateModuleMaterials(module: ModuleSource): AggregatedMaterial[] {
  const map = new Map<string, AggregatedMaterial>();

  for (const approach of module.approaches ?? []) {
    for (const activity of approach.activities ?? []) {
      for (const mat of activity.materials ?? []) {
        const name = (mat.name ?? '').trim();
        if (!name) continue;
        const key = name.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          // OR required, keep first alternative + first activity.
          if (mat.required === true) existing.required = true;
          if (!existing.alternative && mat.alternative && mat.alternative.trim().length > 0) {
            existing.alternative = mat.alternative.trim();
          }
        } else {
          map.set(key, {
            key,
            name,
            required: mat.required !== false, // default true (matches Sanity initialValue)
            alternative: mat.alternative && mat.alternative.trim().length > 0
              ? mat.alternative.trim()
              : null,
            firstSeenIn: {
              activityId: activity._id ?? null,
              activityTitle: activity.title ?? null,
            },
          });
        }
      }
    }
  }

  // Sort: required first, then alphabetical.
  return Array.from(map.values()).sort((a, b) => {
    if (a.required !== b.required) return a.required ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Convenience: given a module and a materialsState map (from a module_runs
 * row), return per-material rows annotated with the parent's tick state.
 * Powers the PrepMode checklist render.
 */
export function withChecklistState(
  module: ModuleSource,
  materialsState: Record<string, { haveIt?: boolean; source?: string }> = {},
): Array<AggregatedMaterial & { haveIt: boolean; source: string | null }> {
  return aggregateModuleMaterials(module).map((m) => {
    const state = materialsState[m.key];
    return {
      ...m,
      haveIt: state?.haveIt === true,
      source: state?.source ?? null,
    };
  });
}
