import {
  COPY_DEFAULTS,
  COPY_SURFACES,
  defaultValue,
  type CopyBundle,
  type CopyKey,
  type CopySurface,
} from './defaults';

/**
 * Pure merge + formatting layer for site copy. No I/O, safe in client bundles.
 * Fetching lives in `./server` (RSC / route handlers) and distribution to
 * client components in `./CopyProvider`.
 */

/** Sanity values that differ from the code default, keyed surface → key → value. */
export type CopyOverrides = Partial<Record<CopySurface, Record<string, string>>>;

const EMPTY: Record<string, string> = {};

export function isCopySurface(value: unknown): value is CopySurface {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(COPY_DEFAULTS, value);
}

/** Flat `{ key: defaultValue }` map for a surface. */
export function defaultBundle<S extends CopySurface>(surface: S): CopyBundle<S> {
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(COPY_DEFAULTS[surface].entries)) {
    out[key] = defaultValue(entry);
  }
  return out as CopyBundle<S>;
}

/**
 * Resolve the live bundle for a surface: every code-owned key, with the Sanity
 * value where one exists and is a non-empty string, else the default. Unknown
 * keys in the override are ignored, so a stale Sanity document can never leak
 * strings the app doesn't expect.
 */
export function resolveCopy<S extends CopySurface>(
  surface: S,
  overrides: CopyOverrides | undefined | null,
): CopyBundle<S> {
  const base = defaultBundle(surface) as Record<string, string>;
  const o = overrides?.[surface] ?? EMPTY;
  for (const key of Object.keys(base)) {
    const v = o[key];
    if (typeof v === 'string' && v.trim().length > 0) base[key] = v;
  }
  return base as CopyBundle<S>;
}

/**
 * Shape of a `siteCopy` row as the GROQ projection returns it. Tolerant — every
 * field is optional and validated at runtime because the data crosses a
 * CMS boundary that editors can (accidentally) reshape.
 */
export type SiteCopyRow = {
  surface?: string | null;
  entries?: Array<{ key?: string | null; value?: string | null } | null> | null;
};

/**
 * Turn raw Sanity rows into the minimal override map: only known surfaces,
 * only known keys, only non-empty values that DIFFER from the default. This
 * keeps the payload the root layout ships to the browser near-empty until
 * someone actually edits copy.
 */
export function normaliseSiteCopyRows(rows: unknown): CopyOverrides {
  const out: CopyOverrides = {};
  if (!Array.isArray(rows)) return out;
  for (const row of rows as SiteCopyRow[]) {
    if (!row || !isCopySurface(row.surface) || !Array.isArray(row.entries)) continue;
    const surface = row.surface;
    const defaults = COPY_DEFAULTS[surface].entries as Record<string, unknown>;
    for (const entry of row.entries) {
      if (!entry || typeof entry.key !== 'string' || typeof entry.value !== 'string') continue;
      if (!Object.prototype.hasOwnProperty.call(defaults, entry.key)) continue;
      const value = entry.value;
      if (value.trim().length === 0) continue;
      if (value === defaultValue(defaults[entry.key] as never)) continue;
      (out[surface] ??= {})[entry.key] = value;
    }
  }
  return out;
}

/**
 * Fill `{placeholder}` tokens. Unknown placeholders are left verbatim so an
 * editor's typo is visible on the page rather than silently blanked.
 */
export function formatCopy(
  template: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => {
    const v = vars[name];
    return v === null || v === undefined ? match : String(v);
  });
}

/** Convenience: resolve one key for one surface. */
export function copyValue<S extends CopySurface>(
  surface: S,
  key: CopyKey<S>,
  overrides?: CopyOverrides | null,
): string {
  return resolveCopy(surface, overrides)[key];
}

export { COPY_SURFACES };
