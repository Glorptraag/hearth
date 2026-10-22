/**
 * Push DLO "Watch for next" note drafts (launch pivot W4.3).
 *
 * Reads content/dlo-notes/batch-{1..5}.json and patches each note onto the
 * UNPUBLISHED draft of its DLO, `drafts.dlo.<THREAD>.<tier>` (seed ids come
 * from scripts/seed-dlos.ts). Drew confirms each batch in Studio; a note only
 * renders once a human has set watchForConfirmedAt (decision A5).
 *
 * Hard rules this script enforces on every mutation it builds:
 *   - only `drafts.*` ids are ever written; the published doc is never touched;
 *   - nothing is published (no actions API, no write to a non-draft id);
 *   - watchForConfirmedAt / watchForConfirmedBy are never set. When the note
 *     text changes they are UNSET on the draft, so an old confirmation can't
 *     carry over onto new, unreviewed text.
 *
 * Dry run (default, no network, no token needed):
 *   npx tsx scripts/push-dlo-note-drafts.ts [--batch <n>]
 * Write (explicit dataset required, never read from env):
 *   npx tsx scripts/push-dlo-note-drafts.ts --write --dataset <name> [--batch <n>]
 */

import { createClient, type Mutation } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

import { THREAD_NAMES } from '../src/lib/capability-threads';

const NOTES_DIR = path.resolve(process.cwd(), 'content/dlo-notes');
const TARGETS_DOC = path.resolve(process.cwd(), 'docs/hearth-dlo-notes-targets-v1.md');
const BATCH_NUMBERS = [1, 2, 3, 4, 5] as const;

type Tier = 'emerging' | 'developing' | 'demonstrating';
const DLO_ID = /^dlo\.([A-Z]+\d+)\.(emerging|developing|demonstrating)$/;
const CONFIRMATION_FIELDS = ['watchForConfirmedAt', 'watchForConfirmedBy'] as const;

const NEUTRAL_MAX_WORDS = 60;

type WatchForNext = {
  neutral: string;
};

type Note = {
  dloId: string;
  thread: string;
  tier: Tier;
  watchForNext: WatchForNext;
};

type BatchFile = { batch: number; source: string; notes: Note[] };

type ExistingDoc = Record<string, unknown> & { _id: string; watchForNext?: unknown };

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

function argValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

/** Batch number → DLO ids, parsed from the "## Batch N" tables of the targets doc. */
function readTargets(): Map<number, string[]> {
  const md = fs.readFileSync(TARGETS_DOC, 'utf8');
  const targets = new Map<number, string[]>();
  let current: number | null = null;
  for (const line of md.split('\n')) {
    const heading = line.match(/^## Batch (\d+)/);
    if (heading) {
      current = Number(heading[1]);
      targets.set(current, []);
      continue;
    }
    if (line.startsWith('## ')) current = null;
    if (current === null || !line.startsWith('|')) continue;
    const id = line.match(/`(dlo\.[A-Z]+\d+\.[a-z]+)`/);
    if (id) targets.get(current)!.push(id[1]);
  }
  return targets;
}

function validateBatch(file: BatchFile, expectedBatch: number, expectedIds: string[]): string[] {
  const errors: string[] = [];
  const where = `batch-${expectedBatch}.json`;
  if (file.batch !== expectedBatch) errors.push(`${where}: "batch" is ${file.batch}, expected ${expectedBatch}`);
  if (!Array.isArray(file.notes)) return [...errors, `${where}: "notes" must be an array`];

  const ids = file.notes.map((n) => n.dloId);
  const missing = expectedIds.filter((id) => !ids.includes(id));
  const extra = ids.filter((id) => !expectedIds.includes(id));
  if (missing.length) errors.push(`${where}: missing targets ${missing.join(', ')}`);
  if (extra.length) errors.push(`${where}: not in targets doc for this batch: ${extra.join(', ')}`);

  for (const note of file.notes) {
    const at = `${where} ${note.dloId}`;
    const m = DLO_ID.exec(note.dloId ?? '');
    if (!m) {
      errors.push(`${at}: id must match dlo.<THREAD>.<tier>`);
      continue;
    }
    const [, thread, tier] = m;
    if (!(thread in THREAD_NAMES)) errors.push(`${at}: unknown thread code ${thread}`);
    if (note.tier !== tier) errors.push(`${at}: tier "${note.tier}" does not match id`);
    if (!note.thread?.startsWith(`${thread} `)) errors.push(`${at}: thread label should start with "${thread} "`);

    for (const key of Object.keys(note)) {
      if ((CONFIRMATION_FIELDS as readonly string[]).includes(key)) {
        errors.push(`${at}: ${key} must never be authored in a notes file`);
      }
    }

    const w = note.watchForNext;
    if (!w || typeof w.neutral !== 'string' || !w.neutral.trim()) {
      errors.push(`${at}: watchForNext.neutral is required`);
      continue;
    }
    const allowedKeys = new Set(['neutral']);
    for (const key of Object.keys(w)) {
      if (!allowedKeys.has(key)) errors.push(`${at}: unexpected watchForNext.${key}`);
    }
    if (wordCount(w.neutral) > NEUTRAL_MAX_WORDS) {
      errors.push(`${at}: neutral is ${wordCount(w.neutral)} words (max ${NEUTRAL_MAX_WORDS})`);
    }
    if (/[–—]/.test(w.neutral)) errors.push(`${at}: contains an en/em dash (house style is commas)`);
  }
  return errors;
}

function sanityValue(w: WatchForNext): WatchForNext {
  return { neutral: w.neutral.trim() };
}

/** True when the doc already carries exactly this note and no stale variants. */
function sameNote(a: unknown, b: WatchForNext): boolean {
  if (!a || typeof a !== 'object') return false;
  const x = a as WatchForNext & { variants?: unknown };
  return x.neutral === b.neutral && x.variants === undefined;
}

/**
 * Build the mutations for one note. `published` / `draft` are the current docs
 * (null when absent). Returns [] when the draft (or, with no draft, the
 * published doc) already carries exactly this note.
 */
function buildMutations(
  dloId: string,
  note: WatchForNext,
  published: ExistingDoc | null,
  draft: ExistingDoc | null,
): Mutation[] {
  const draftId = `drafts.${dloId}`;
  const value = sanityValue(note);
  const current = draft ?? published;
  if (current && sameNote(current.watchForNext, value)) return [];

  const mutations: Mutation[] = [];
  if (!draft) {
    if (!published) throw new Error(`${dloId}: no published or draft document to base a draft on`);
    // Copy the published doc into a new draft. System fields are re-issued by
    // Sanity; confirmation fields are dropped because the note is changing.
    const base: Record<string, unknown> = { ...published, _id: draftId };
    for (const key of ['_rev', '_createdAt', '_updatedAt', ...CONFIRMATION_FIELDS]) delete base[key];
    mutations.push({ createIfNotExists: base as { _id: string; _type: string } });
  }
  mutations.push({
    patch: { id: draftId, set: { watchForNext: value }, unset: [...CONFIRMATION_FIELDS, 'watchForNext.variants'] },
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
    if (kind !== 'createIfNotExists' && kind !== 'patch') throw new Error(`Refusing mutation kind "${kind}"`);
    if (!id?.startsWith('drafts.')) throw new Error(`Refusing to write non-draft id "${id}"`);
    const set = (kind === 'patch' ? body.set : body) as Record<string, unknown> | undefined;
    for (const field of CONFIRMATION_FIELDS) {
      if (set && field in set) throw new Error(`Refusing to set ${field} on ${id}`);
    }
  }
}

function loadBatches(only?: number): { file: BatchFile; batch: number }[] {
  const targets = readTargets();
  const batches = only ? [only] : [...BATCH_NUMBERS];
  const errors: string[] = [];
  const loaded: { file: BatchFile; batch: number }[] = [];
  const seen = new Set<string>();

  for (const batch of batches) {
    const p = path.join(NOTES_DIR, `batch-${batch}.json`);
    if (!fs.existsSync(p)) {
      errors.push(`missing ${path.relative(process.cwd(), p)}`);
      continue;
    }
    const file = JSON.parse(fs.readFileSync(p, 'utf8')) as BatchFile;
    const expected = targets.get(batch) ?? [];
    if (!expected.length) errors.push(`targets doc has no ids for Batch ${batch}`);
    errors.push(...validateBatch(file, batch, expected));
    for (const n of file.notes ?? []) {
      if (seen.has(n.dloId)) errors.push(`${n.dloId} appears in more than one batch`);
      seen.add(n.dloId);
    }
    loaded.push({ file, batch });
  }

  if (errors.length) {
    console.error(`Validation failed (${errors.length}):`);
    for (const e of errors) console.error(`  · ${e}`);
    process.exit(1);
  }
  return loaded;
}

async function main() {
  const args = process.argv.slice(2);
  const batchArg = argValue(args, '--batch');
  const only = batchArg ? Number(batchArg) : undefined;
  if (only !== undefined && !(BATCH_NUMBERS as readonly number[]).includes(only)) {
    console.error(`--batch must be one of ${BATCH_NUMBERS.join(', ')}`);
    process.exit(1);
  }

  const batches = loadBatches(only);
  const notes = batches.flatMap(({ file, batch }) => file.notes.map((n) => ({ ...n, batch })));

  if (!args.includes('--write')) {
    console.log(`[dry-run] ${notes.length} notes across ${batches.length} batch file(s) validated.\n`);
    for (const n of notes) {
      // Simulate the no-draft-yet case so the guard runs over the real shape.
      const placeholder: ExistingDoc = { _id: n.dloId, _type: 'discreteLearningObjective' };
      const mutations = buildMutations(n.dloId, n.watchForNext, placeholder, null);
      assertDraftOnly(mutations);
      console.log(
        `  batch ${n.batch}  drafts.${n.dloId.padEnd(22)} neutral ${String(wordCount(n.watchForNext.neutral)).padStart(2)}w`,
      );
    }
    console.log(`\n[dry-run] nothing written. Pass --write --dataset <name> to patch drafts.`);
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
  const ids = notes.map((n) => n.dloId);
  const existing = await client.fetch<ExistingDoc[]>(
    `*[_id in $ids || _id in $draftIds]`,
    { ids, draftIds: ids.map((id) => `drafts.${id}`) },
  );
  const byId = new Map(existing.map((d) => [d._id, d]));

  const mutations: Mutation[] = [];
  let unchanged = 0;
  const failures: string[] = [];
  for (const n of notes) {
    try {
      const m = buildMutations(n.dloId, n.watchForNext, byId.get(n.dloId) ?? null, byId.get(`drafts.${n.dloId}`) ?? null);
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
    console.log(`All ${notes.length} drafts already carry these notes. Nothing to write.`);
    return;
  }
  console.log(`Writing ${mutations.length} mutations (${notes.length - unchanged} drafts) to dataset "${dataset}"…`);
  await client.mutate(mutations);
  console.log(`Done. ${unchanged} unchanged. Nothing was published; confirm each batch in Studio.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
