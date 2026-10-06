import {
  COPY_DEFAULTS,
  COPY_SURFACES,
  defaultNote,
  defaultValue,
  siteCopyDocId,
  type CopySurface,
} from './defaults';

/**
 * Pure planning for `scripts/seed-site-copy.ts` (unit-tested here, executed
 * there). Given what is currently in Sanity, produce the exact documents to
 * write and a human-readable drift report.
 *
 * Merge rules (default, non-destructive):
 *   - Keys in code but not in Sanity → added with the code default.
 *   - Keys in both → Sanity VALUE kept (an editor's wording survives a re-seed),
 *     note/title/description refreshed from code (they're code-owned).
 *   - Keys in Sanity but not in code → dropped (nothing reads them).
 * `reset: true` overwrites every value with the code default.
 */

export type SiteCopyEntryDoc = { _key: string; _type: 'siteCopyEntry'; key: string; value: string; note?: string };

export type SiteCopyDoc = {
  _id: string;
  _type: 'siteCopy';
  surface: CopySurface;
  title: string;
  description: string;
  entries: SiteCopyEntryDoc[];
};

export type ExistingSiteCopyDoc = {
  _id?: string;
  surface?: string | null;
  entries?: Array<{ key?: string | null; value?: string | null } | null> | null;
};

export type SurfacePlan = {
  surface: CopySurface;
  doc: SiteCopyDoc;
  added: string[];
  kept: string[];
  overwritten: string[];
  dropped: string[];
  /** True when the Sanity doc did not exist at all. */
  created: boolean;
};

function existingValues(existing: ExistingSiteCopyDoc | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const e of existing?.entries ?? []) {
    if (e && typeof e.key === 'string' && typeof e.value === 'string') map.set(e.key, e.value);
  }
  return map;
}

export function planSurface(
  surface: CopySurface,
  existing: ExistingSiteCopyDoc | undefined,
  opts: { reset?: boolean } = {},
): SurfacePlan {
  const def = COPY_DEFAULTS[surface];
  const live = existingValues(existing);
  const added: string[] = [];
  const kept: string[] = [];
  const overwritten: string[] = [];

  const entries: SiteCopyEntryDoc[] = Object.entries(def.entries).map(([key, entry]) => {
    const fallback = defaultValue(entry);
    const note = defaultNote(entry);
    const current = live.get(key);
    let value: string;
    if (current === undefined) {
      added.push(key);
      value = fallback;
    } else if (opts.reset && current !== fallback) {
      overwritten.push(key);
      value = fallback;
    } else {
      kept.push(key);
      value = current;
    }
    const doc: SiteCopyEntryDoc = { _key: key.replace(/\./g, '-'), _type: 'siteCopyEntry', key, value };
    if (note) doc.note = note;
    return doc;
  });

  const codeKeys = new Set(Object.keys(def.entries));
  const dropped = [...live.keys()].filter((k) => !codeKeys.has(k));

  return {
    surface,
    created: !existing,
    added,
    kept,
    overwritten,
    dropped,
    doc: {
      _id: siteCopyDocId(surface),
      _type: 'siteCopy',
      surface,
      title: def.title,
      description: def.description,
      entries,
    },
  };
}

export function planAllSurfaces(
  existingDocs: ExistingSiteCopyDoc[],
  opts: { reset?: boolean } = {},
): SurfacePlan[] {
  const bySurface = new Map<string, ExistingSiteCopyDoc>();
  for (const d of existingDocs) {
    if (typeof d?.surface === 'string') bySurface.set(d.surface, d);
  }
  return COPY_SURFACES.map((surface) => planSurface(surface, bySurface.get(surface), opts));
}

/** Sanity docs whose surface no longer exists in code — reported, never deleted automatically. */
export function orphanSurfaces(existingDocs: ExistingSiteCopyDoc[]): string[] {
  const known = new Set<string>(COPY_SURFACES);
  return existingDocs
    .map((d) => d?.surface)
    .filter((s): s is string => typeof s === 'string' && !known.has(s));
}

/** `--check` mode: true when Sanity would change on a seed (i.e. drift exists). */
export function hasDrift(plans: SurfacePlan[]): boolean {
  return plans.some((p) => p.created || p.added.length > 0 || p.dropped.length > 0 || p.overwritten.length > 0);
}

export function describePlan(plans: SurfacePlan[], orphans: string[]): string {
  const lines: string[] = [];
  for (const p of plans) {
    const state = p.created ? 'CREATE' : hasDrift([p]) ? 'UPDATE' : 'ok';
    lines.push(
      `${state.padEnd(6)} ${p.doc._id}  +${p.added.length} added, ${p.kept.length} kept, ${p.overwritten.length} reset, -${p.dropped.length} dropped`,
    );
    for (const k of p.added) lines.push(`         + ${k}`);
    for (const k of p.overwritten) lines.push(`         ~ ${k}`);
    for (const k of p.dropped) lines.push(`         - ${k}`);
  }
  for (const s of orphans) lines.push(`ORPHAN siteCopy surface "${s}" exists in Sanity but not in code (left untouched)`);
  return lines.join('\n');
}
