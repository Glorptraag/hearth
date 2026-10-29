/**
 * Push knowledge-note and tradition watch-how drafts (Hearth Cycle HC-1b / HC-2b).
 *
 * Reads, from content/:
 *   craft-notes/*.yaml      -> `knowledgeNote` drafts   (_id = the content id, e.g. craft.wait-time)
 *   lesson-patterns/*.yaml  -> `knowledgeNote` drafts   (e.g. pattern.read-tell-back)
 *   traditions/watch-how.yaml -> patches onto `drafts.pedagogicalFramework.<slug>`
 *
 * Hard rules this script enforces on every mutation it builds (same as push-dlo-note-drafts.ts):
 *   - only `drafts.*` ids are ever written; the published doc is never touched;
 *   - nothing is published (no actions API, no write to a non-draft id);
 *   - confirmedAt / confirmedBy / watchHowConfirmedAt / watchHowConfirmedBy are never set.
 *     A YAML `confirmedAt` is ignored (confirm in Studio). When text changes they are removed:
 *     knowledge notes are replaced wholesale (so they are dropped), framework patches UNSET them.
 *     Unchanged content is skipped, so an existing confirmation survives a no-op re-run.
 *
 * Dry run (default, no network, no token needed):
 *   npx tsx scripts/push-knowledge-notes.ts [--only craft|patterns|watchhow]
 * Write (explicit dataset required, never read from env):
 *   npx tsx scripts/push-knowledge-notes.ts --write --dataset <name> [--only craft|patterns|watchhow]
 */

import { createClient, type Mutation } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { isDeepStrictEqual } from 'util';
import { parse as parseYaml } from 'yaml';

const CONTENT_DIR = path.resolve(process.cwd(), 'content');
const SOURCES = {
  craft: 'craft-notes',
  patterns: 'lesson-patterns',
} as const;
const WATCH_HOW_FILE = path.join(CONTENT_DIR, 'traditions', 'watch-how.yaml');
const ONLY_VALUES = ['craft', 'patterns', 'watchhow'] as const;
type Only = (typeof ONLY_VALUES)[number];

const NOTE_CONFIRMATION_FIELDS = ['confirmedAt', 'confirmedBy'] as const;
const FRAMEWORK_CONFIRMATION_FIELDS = ['watchHowConfirmedAt', 'watchHowConfirmedBy'] as const;
const ALL_CONFIRMATION_FIELDS: readonly string[] = [
  ...NOTE_CONFIRMATION_FIELDS,
  ...FRAMEWORK_CONFIRMATION_FIELDS,
];
const SYSTEM_FIELDS = ['_rev', '_createdAt', '_updatedAt'] as const;

const STRANDS = ['prime', 'notice', 'record', 'respond', 'craft'];
const STAGES = ['E1', 'E2', 'E3', 'E4'];
const CARDS = ['try', 'understand', 'notice'];
const TRIGGER_KINDS = [
  'notyet-repeat',
  'didnt-come-up-repeat',
  'outcome-repeat',
  'no-parent-move',
  'saw-it-rate-high',
  'weekday-skips',
  'tried-then-partly-drops',
];
const EVIDENCE_KINDS = ['does', 'says', 'makes', 'chooses'] as const;
const NOTIFY_DEFAULTS = ['planned', 'monday'];
const TRADITIONS = ['charlotte_mason', 'classical', 'montessori', 'waldorf_steiner', 'unschooling', 'eclectic'];

const CRAFT_BODY_MAX_EARLY = 40; // E1-E2
const CRAFT_BODY_MAX_LATE = 90; // E3-E4
const CRAFT_WHY_MAX = 15;
const PARENT_ACTION_MAX = 20;

type Doc = Record<string, unknown> & { _id: string; _type: string };
type Existing = Record<string, unknown> & { _id: string };
type Item = { label: string; draftId: string; doc: Doc };
type FrameworkPatch = {
  label: string;
  frameworkId: string;
  set: Record<string, unknown>;
  unset: string[];
};

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

function argValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

function readYaml(file: string): Record<string, unknown> {
  const parsed = parseYaml(fs.readFileSync(file, 'utf8'));
  if (!isObj(parsed)) throw new Error(`${path.relative(process.cwd(), file)}: expected a YAML mapping`);
  return parsed;
}

function listYaml(dir: string): string[] {
  const full = path.join(CONTENT_DIR, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.yaml'))
    .sort()
    .map((f) => path.join(full, f));
}

/** Strip null/undefined (YAML `confirmedAt: null`) and the confirmation fields. */
function cleanNote(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if ((NOTE_CONFIRMATION_FIELDS as readonly string[]).includes(k)) continue;
    if (v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

// ---------------------------------------------------------------- craft notes

function validateCommon(raw: Record<string, unknown>, file: string, kind: string, prefix: string): string[] {
  const at = path.relative(process.cwd(), file);
  const errors: string[] = [];
  const id = raw.id;
  if (!isStr(id)) errors.push(`${at}: id is required`);
  else {
    if (!id.startsWith(prefix)) errors.push(`${at}: id "${id}" must start with "${prefix}"`);
    if (path.basename(file, '.yaml') !== id) errors.push(`${at}: id "${id}" does not match the file name`);
  }
  if (raw.kind !== kind) errors.push(`${at}: kind must be "${kind}"`);
  if (!isStr(raw.title)) errors.push(`${at}: title is required`);
  if (!isStr(raw.status)) errors.push(`${at}: status is required`);
  else if (raw.status !== 'draft') errors.push(`${at}: status must be "draft" (never publish from here)`);
  if (!isStr(raw.source)) errors.push(`${at}: source is required`);
  const all = JSON.stringify(raw);
  if (/[–—]/.test(all)) errors.push(`${at}: contains an en/em dash (house style is commas)`);
  return errors;
}

function validateCraft(raw: Record<string, unknown>, file: string): string[] {
  const at = path.relative(process.cwd(), file);
  const errors = validateCommon(raw, file, 'craft', 'craft.');
  if (!STRANDS.includes(raw.strand as string)) errors.push(`${at}: strand must be one of ${STRANDS.join(', ')}`);
  if (!STAGES.includes(raw.stage as string)) errors.push(`${at}: stage must be one of ${STAGES.join(', ')}`);
  if (!CARDS.includes(raw.card as string)) errors.push(`${at}: card must be one of ${CARDS.join(', ')}`);
  const tradition = raw.tradition;
  if (!isStr(tradition) || (tradition !== 'neutral' && !TRADITIONS.includes(tradition))) {
    errors.push(`${at}: tradition must be "neutral" or a tradition key`);
  }
  if (typeof raw.cooldown !== 'number' || raw.cooldown < 0) errors.push(`${at}: cooldown must be a number of days`);

  if (!isStr(raw.body)) errors.push(`${at}: body is required`);
  else {
    const max = raw.stage === 'E1' || raw.stage === 'E2' ? CRAFT_BODY_MAX_EARLY : CRAFT_BODY_MAX_LATE;
    if (wordCount(raw.body) > max) errors.push(`${at}: body is ${wordCount(raw.body)} words (max ${max} at ${raw.stage})`);
  }
  const why = raw.why;
  if (!isObj(why) || !isStr(why.short)) errors.push(`${at}: why.short is required`);
  else {
    if (wordCount(why.short) > CRAFT_WHY_MAX) errors.push(`${at}: why.short is ${wordCount(why.short)} words (max ${CRAFT_WHY_MAX})`);
    if ((raw.stage === 'E1' || raw.stage === 'E2') && why.deeper) errors.push(`${at}: why.deeper is left out of E1-E2 notes`);
  }
  if (!isObj(raw.relates)) errors.push(`${at}: relates is required`);
  if (raw.trigger !== undefined) {
    if (!Array.isArray(raw.trigger)) errors.push(`${at}: trigger must be a list`);
    else {
      for (const t of raw.trigger) {
        if (!isObj(t) || !TRIGGER_KINDS.includes(t.kind as string)) {
          errors.push(`${at}: trigger kind must be one of ${TRIGGER_KINDS.join(', ')}`);
        }
      }
    }
  }
  return errors;
}

function buildCraft(raw: Record<string, unknown>): Doc {
  const note = cleanNote(raw);
  if (Array.isArray(note.trigger)) {
    note.trigger = note.trigger.map((t, i) => ({ _key: `t${i + 1}`, ...(t as object) }));
  }
  return { ...note, _id: `drafts.${raw.id as string}`, _type: 'knowledgeNote' } as Doc;
}

// ------------------------------------------------------------------- patterns

function validatePattern(raw: Record<string, unknown>, file: string): string[] {
  const at = path.relative(process.cwd(), file);
  const errors = validateCommon(raw, file, 'pattern', 'pattern.');
  const moves = raw.moves;
  if (!Array.isArray(moves) || moves.length < 3 || moves.length > 5) {
    errors.push(`${at}: moves must have 3 to 5 entries (has ${Array.isArray(moves) ? moves.length : 0})`);
  } else {
    const keys = new Set<string>();
    for (const m of moves) {
      if (!isObj(m) || !isStr(m.key) || !isStr(m.label) || !isStr(m.parentAction)) {
        errors.push(`${at}: every move needs key, label and parentAction`);
        continue;
      }
      if (keys.has(m.key)) errors.push(`${at}: duplicate move key "${m.key}"`);
      keys.add(m.key);
      if (wordCount(m.parentAction) > PARENT_ACTION_MAX) {
        errors.push(`${at}: move "${m.key}" parentAction is ${wordCount(m.parentAction)} words (max ${PARENT_ACTION_MAX})`);
      }
      for (const slot of m.parentAction.match(/\{[^}]*\}/g) ?? []) {
        if (slot !== '{activity}' && slot !== '{child}') errors.push(`${at}: move "${m.key}" has unsupported slot ${slot}`);
      }
    }
  }
  const slot = raw.watchForSlot;
  if (!isObj(slot) || !isStr(slot.prompt) || !Array.isArray(slot.evidenceKinds) || !slot.evidenceKinds.length) {
    errors.push(`${at}: watchForSlot needs prompt and evidenceKinds`);
  } else {
    for (const k of slot.evidenceKinds) {
      if (!(EVIDENCE_KINDS as readonly string[]).includes(k as string)) errors.push(`${at}: unknown evidence kind "${k}"`);
    }
  }
  if (!isStr(raw.whyItWorks)) errors.push(`${at}: whyItWorks is required`);
  const cm = raw.commonMistakes;
  if (!Array.isArray(cm) || cm.length < 2 || cm.length > 4) errors.push(`${at}: commonMistakes must have 2 to 4 lines`);
  const fit = raw.traditionFit;
  if (!Array.isArray(fit) || !fit.length) errors.push(`${at}: traditionFit is required`);
  else {
    for (const f of fit) {
      if (!isObj(f) || !TRADITIONS.includes(f.tradition as string) || typeof f.natural !== 'boolean' || !isStr(f.note)) {
        errors.push(`${at}: traditionFit entries need tradition, natural and note`);
      }
    }
  }
  if (!STAGES.includes(raw.stage as string)) errors.push(`${at}: stage must be one of ${STAGES.join(', ')}`);
  if (!isObj(raw.ageBand)) errors.push(`${at}: ageBand is required`);
  if (!isObj(raw.example)) errors.push(`${at}: example is required`);
  return errors;
}

function buildPattern(raw: Record<string, unknown>): Doc {
  const note = cleanNote(raw);
  note.moves = (raw.moves as Record<string, unknown>[]).map((m) => ({ _key: m.key as string, ...m }));
  note.traditionFit = (raw.traditionFit as Record<string, unknown>[]).map((f) => ({
    _key: f.tradition as string,
    ...f,
  }));
  return { ...note, _id: `drafts.${raw.id as string}`, _type: 'knowledgeNote' } as Doc;
}

// ------------------------------------------------------------------ watch-how

function buildWatchHow(raw: Record<string, unknown>): { patches: FrameworkPatch[]; errors: string[] } {
  const errors: string[] = [];
  const patches: FrameworkPatch[] = [];
  const at = 'content/traditions/watch-how.yaml';
  const traditions = raw.traditions;
  if (!isObj(traditions)) return { patches, errors: [`${at}: traditions mapping is required`] };

  const checkLines = (where: string, lines: unknown): Record<string, string> | null => {
    if (!isObj(lines)) {
      errors.push(`${where}: needs does, says, makes and chooses`);
      return null;
    }
    const out: Record<string, string> = {};
    for (const k of EVIDENCE_KINDS) {
      const v = lines[k];
      if (!isStr(v)) errors.push(`${where}: ${k} is required`);
      else out[k] = v.trim();
    }
    for (const k of Object.keys(lines)) {
      if (!(EVIDENCE_KINDS as readonly string[]).includes(k)) errors.push(`${where}: unexpected key "${k}"`);
    }
    return out;
  };

  for (const slug of TRADITIONS) {
    const t = traditions[slug];
    const where = `${at} ${slug}`;
    if (!isObj(t)) {
      errors.push(`${where}: missing`);
      continue;
    }
    if (!NOTIFY_DEFAULTS.includes(t.notifyDefault as string)) {
      errors.push(`${where}: notifyDefault must be one of ${NOTIFY_DEFAULTS.join(', ')}`);
    }
    const set: Record<string, unknown> = { notifyDefault: t.notifyDefault };
    const unset: string[] = [];

    if (slug === 'eclectic') {
      if (!isStr(t.rule)) errors.push(`${where}: rule is required`);
      else set.watchHowRule = t.rule.trim();
      const fb = checkLines(`${where} expoFallback`, isObj(t.expoFallback) ? omit(t.expoFallback, ['status']) : null);
      if (fb) set.watchHowFallback = fb;
      if (isStr(t.labelTemplate)) set.watchHowLabelTemplate = t.labelTemplate.trim();
      unset.push('watchHow');
    } else {
      const lines = checkLines(`${where} watchHow`, t.watchHow);
      if (lines) set.watchHow = lines;
      unset.push('watchHowRule', 'watchHowFallback', 'watchHowLabelTemplate');
    }

    const overrides = t.stageOverrides;
    if (overrides !== undefined) {
      if (!isObj(overrides)) errors.push(`${where}: stageOverrides must be a mapping`);
      else {
        const list: { _key: string; stage: string; kind: string; text: string }[] = [];
        for (const [stage, kinds] of Object.entries(overrides)) {
          if (!isObj(kinds)) {
            errors.push(`${where}: stageOverrides.${stage} must be a mapping`);
            continue;
          }
          for (const [kind, text] of Object.entries(kinds)) {
            if (!(EVIDENCE_KINDS as readonly string[]).includes(kind) || !isStr(text)) {
              errors.push(`${where}: stageOverrides.${stage}.${kind} is invalid`);
              continue;
            }
            list.push({ _key: `${stage}-${kind}`, stage, kind, text: text.trim() });
          }
        }
        if (list.length) set.watchHowStageOverrides = list;
      }
    }
    if (!('watchHowStageOverrides' in set)) unset.push('watchHowStageOverrides');

    // No dash check here: the lines are transcribed verbatim from WF §3.4 (the Waldorf `does` line has an em dash).
    patches.push({ label: slug, frameworkId: `pedagogicalFramework.${slug}`, set, unset });
  }
  return { patches, errors };
}

function omit(o: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
}

// ------------------------------------------------------------------ mutations

function stripVolatile(doc: Record<string, unknown>): Record<string, unknown> {
  const out = { ...doc };
  for (const k of [...SYSTEM_FIELDS, ...ALL_CONFIRMATION_FIELDS]) delete out[k];
  return out;
}

/** createOrReplace the draft; skipped when it already carries exactly this content. */
function noteMutations(item: Item, draft: Existing | null): Mutation[] {
  if (draft && isDeepStrictEqual(stripVolatile(draft), stripVolatile(item.doc))) return [];
  return [{ createOrReplace: item.doc }];
}

/**
 * Patch the framework draft. With no draft yet, copy the published doc into one first
 * (confirmation fields dropped), exactly as push-dlo-note-drafts.ts does.
 */
function frameworkMutations(
  p: FrameworkPatch,
  published: Existing | null,
  draft: Existing | null,
): Mutation[] {
  const draftId = `drafts.${p.frameworkId}`;
  const current = draft ?? published;
  if (
    current &&
    Object.entries(p.set).every(([k, v]) => isDeepStrictEqual(current[k], v)) &&
    p.unset.every((k) => current[k] === undefined)
  ) {
    return [];
  }
  const mutations: Mutation[] = [];
  if (!draft) {
    if (!published) throw new Error(`${p.frameworkId}: no published or draft document to base a draft on`);
    const base: Record<string, unknown> = { ...published, _id: draftId };
    for (const key of [...SYSTEM_FIELDS, ...FRAMEWORK_CONFIRMATION_FIELDS]) delete base[key];
    mutations.push({ createIfNotExists: base as { _id: string; _type: string } });
  }
  mutations.push({
    patch: { id: draftId, set: p.set, unset: [...p.unset, ...FRAMEWORK_CONFIRMATION_FIELDS] },
  });
  return mutations;
}

/** Belt and braces: refuse anything that isn't a draft-only, unconfirmed write. */
function assertDraftOnly(mutations: Mutation[]): void {
  for (const m of mutations) {
    const json = m as Record<string, Record<string, unknown>>;
    const [kind] = Object.keys(json);
    const body = json[kind];
    const id = (body._id ?? body.id) as string | undefined;
    if (!['createOrReplace', 'createIfNotExists', 'patch'].includes(kind)) {
      throw new Error(`Refusing mutation kind "${kind}"`);
    }
    if (!id?.startsWith('drafts.')) throw new Error(`Refusing to write non-draft id "${id}"`);
    const set = (kind === 'patch' ? body.set : body) as Record<string, unknown> | undefined;
    for (const field of ALL_CONFIRMATION_FIELDS) {
      if (set && field in set) throw new Error(`Refusing to set ${field} on ${id}`);
    }
  }
}

// ------------------------------------------------------------------------ main

function load(only: Only | undefined) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items: (Item & { group: 'craft' | 'patterns' })[] = [];
  const seen = new Set<string>();

  for (const group of ['craft', 'patterns'] as const) {
    if (only && only !== group) continue;
    for (const file of listYaml(SOURCES[group])) {
      let raw: Record<string, unknown>;
      try {
        raw = readYaml(file);
      } catch (err) {
        errors.push(`${path.relative(process.cwd(), file)}: ${(err as Error).message}`);
        continue;
      }
      const fileErrors = group === 'craft' ? validateCraft(raw, file) : validatePattern(raw, file);
      errors.push(...fileErrors);
      if (raw.confirmedAt || raw.confirmedBy) {
        warnings.push(`${raw.id}: confirmedAt/confirmedBy in YAML are ignored, confirm in Studio`);
      }
      if (fileErrors.length) continue;
      const id = raw.id as string;
      if (seen.has(id)) errors.push(`${id}: duplicate id`);
      seen.add(id);
      const doc = group === 'craft' ? buildCraft(raw) : buildPattern(raw);
      items.push({ group, label: id, draftId: doc._id, doc });
    }
  }

  let patches: FrameworkPatch[] = [];
  if (!only || only === 'watchhow') {
    if (!fs.existsSync(WATCH_HOW_FILE)) errors.push('missing content/traditions/watch-how.yaml');
    else {
      const raw = readYaml(WATCH_HOW_FILE);
      if (raw.confirmedAt || raw.confirmedBy) warnings.push('watch-how.yaml: confirmedAt/confirmedBy are ignored, confirm in Studio');
      const built = buildWatchHow(raw);
      patches = built.patches;
      errors.push(...built.errors);
    }
  }

  if (errors.length) {
    console.error(`Validation failed (${errors.length}):`);
    for (const e of errors) console.error(`  · ${e}`);
    process.exit(1);
  }
  return { items, patches, warnings };
}

async function main() {
  const args = process.argv.slice(2);
  const onlyArg = argValue(args, '--only');
  if (onlyArg !== undefined && !(ONLY_VALUES as readonly string[]).includes(onlyArg)) {
    console.error(`--only must be one of ${ONLY_VALUES.join(', ')}`);
    process.exit(1);
  }
  const only = onlyArg as Only | undefined;
  const { items, patches, warnings } = load(only);
  const craft = items.filter((i) => i.group === 'craft');
  const patterns = items.filter((i) => i.group === 'patterns');

  if (!args.includes('--write')) {
    console.log(
      `[dry-run] ${craft.length} craft notes, ${patterns.length} patterns, ${patches.length} framework patches validated.\n`,
    );
    for (const i of craft) {
      const d = i.doc as { stage?: string; strand?: string; body?: string };
      console.log(`  craft    ${i.draftId.padEnd(34)} ${d.stage} ${String(d.strand).padEnd(7)} body ${wordCount(String(d.body ?? ''))}w`);
    }
    for (const i of patterns) {
      const d = i.doc as { moves?: unknown[] };
      console.log(`  pattern  ${i.draftId.padEnd(34)} ${d.moves?.length ?? 0} moves`);
    }
    for (const p of patches) {
      // Simulate the no-draft-yet case so the guard runs over the real shape.
      const placeholder: Existing = { _id: p.frameworkId, _type: 'pedagogicalFramework' };
      assertDraftOnly(frameworkMutations(p, placeholder, null));
      console.log(`  patch    drafts.${p.frameworkId.padEnd(34)} set ${Object.keys(p.set).join(', ')}`);
    }
    for (const i of items) assertDraftOnly(noteMutations(i, null));
    for (const w of warnings) console.log(`  warning: ${w}`);
    console.log(`\n[dry-run] nothing written. Pass --write --dataset <name> to push drafts.`);
    return;
  }

  const dataset = argValue(args, '--dataset');
  if (!dataset || dataset.startsWith('--')) {
    console.error('--write requires an explicit --dataset <name>. Aborting.');
    process.exit(1);
  }
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = process.env.SANITY_API_TOKEN;
  if (!projectId || !token) {
    console.error('NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN are required for --write. Aborting.');
    process.exit(1);
  }

  const client = createClient({ projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false });
  const ids = [
    ...items.map((i) => i.draftId),
    ...patches.flatMap((p) => [p.frameworkId, `drafts.${p.frameworkId}`]),
  ];
  const existing = await client.fetch<Existing[]>(`*[_id in $ids]`, { ids });
  const byId = new Map(existing.map((d) => [d._id, d]));

  const mutations: Mutation[] = [];
  const failures: string[] = [];
  let unchanged = 0;
  for (const i of items) {
    const m = noteMutations(i, byId.get(i.draftId) ?? null);
    if (!m.length) unchanged++;
    mutations.push(...m);
  }
  for (const p of patches) {
    try {
      const m = frameworkMutations(p, byId.get(p.frameworkId) ?? null, byId.get(`drafts.${p.frameworkId}`) ?? null);
      if (!m.length) unchanged++;
      mutations.push(...m);
    } catch (err) {
      failures.push((err as Error).message);
    }
  }
  if (failures.length) {
    console.error(`Aborting before any write:\n  · ${failures.join('\n  · ')}`);
    process.exit(1);
  }
  assertDraftOnly(mutations);

  if (!mutations.length) {
    console.log(`All ${items.length + patches.length} drafts already carry this content. Nothing to write.`);
    return;
  }
  console.log(`Writing ${mutations.length} mutations to dataset "${dataset}"…`);
  await client.mutate(mutations);
  console.log(`Done. ${unchanged} unchanged. Nothing was published; confirm in Studio.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
