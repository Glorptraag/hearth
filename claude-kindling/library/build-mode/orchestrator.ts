/**
 * Build-mode orchestrator — walks a module from `specced` to `content_constructed`.
 *
 * Run from hearth-main root:
 *   npx tsx claude-kindling/library/build-mode/orchestrator.ts \
 *     --spec claude-kindling/design/specs/modules/module-1-1-looking-closely.md
 *
 * Optional flags:
 *   --session <slug>      Override the session slug used in register events.
 *                         Default: today's date + '-build-' + module index.
 *   --dry-run             Skip Sanity writes; still parses, prompts, runs sparse checks,
 *                         and prints what WOULD be written. Useful for development.
 *   --non-interactive     Disable prompting. Activities will be created with placeholder
 *                         content that hard-fails sparse checks — only useful for testing
 *                         the orchestrator's blocking behaviour.
 *
 * Env required (when not --dry-run):
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_TOKEN
 *
 * What it does, in order:
 *   1. Parse the spec at the given path (spec-parser.ts).
 *   2. Validate the module's latest register event is `specced`. Refuse otherwise.
 *   3. Cross-check the spec's pillarsConfirmed checklist (informational; the gate is
 *      the register event, not the doc — the doc may have stale checkboxes).
 *   4. Ensure a module document exists in Sanity. Create with `createdVia: 'editorial'`
 *      and `authorFamilyId` unset if absent. Idempotent.
 *   5. For each approach in the spec:
 *        a. Create the approach Sanity document (if not already present).
 *        b. Fire `created` register event for the approach.
 *        c. For each activity slot the spec calls for:
 *             i.   Prompt the user (Drew/Cowork) for activity content via @inquirer/prompts.
 *             ii.  Run sparse-content checks BEFORE creating the activity. Hard-fails
 *                  block creation; soft warnings are recorded.
 *             iii. Create the activity Sanity document (createActivity).
 *             iv.  Fire `created` register event for the activity.
 *   6. Patch each approach's `activities` array.
 *   7. Patch the module's `approaches` array.
 *   8. For every resource in the spec with status `NEEDED`, fire a `flagged` event with
 *      `flag: 'asset-needed'` (or `text-needed` for commons texts) IF such a flag isn't
 *      already on the register for that ID + this module. Append to
 *      `build-package/open-questions.md`.
 *   9. If every activity passed all hard-fail checks, fire `content_constructed` on the
 *      module. Otherwise, do NOT fire it; surface the blockers in the close-out.
 *  10. Print a session close-out summary.
 *
 * Idempotency: re-running on the same spec checks Sanity for existing docs at the
 * deterministic IDs and skips re-creation. Register events are append-only — a re-run will
 * append fresh `created` events. The orchestrator records its own session slug so
 * patrol-mode can correlate.
 *
 * Boundary: this script writes ONLY inside `claude-kindling/` (the open-questions file
 * and register JSONL files) and to Sanity. It does NOT modify any platform-side file.
 */

import 'dotenv/config';
import { createClient, type SanityClient } from '@sanity/client';
import { input, select, confirm, editor } from '@inquirer/prompts';
import { appendFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { parseModuleSpec, type ModuleSpec, type ApproachSpec, type ResourceRef } from './spec-parser';
import {
  checkActivity,
  checkModule,
  type ActivityCheckInput,
  type ModuleCheckInput,
} from './sparse-content-checks';
import {
  appendEvent,
  readEvents,
  latestEventForId,
} from '../../register/helper';
import { checkPackGate } from './pack-gate';
import { checkOverlap, type OverlapHit } from './overlap-check';
import { sixTestCheckActivity, type SixTestActivityInput } from './six-test-checks';
import { writeSessionNoteStart, appendSessionNoteCloseOut } from './session-note';
import { regenerateDerivedArtifacts, type DerivedArtifactPaths } from './derived-artifacts';

// ─── CLI parsing ─────────────────────────────────────────────────────────────

interface CliArgs {
  specPath: string;
  session: string | null;
  dryRun: boolean;
  nonInteractive: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { specPath: '', session: null, dryRun: false, nonInteractive: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--spec') args.specPath = argv[++i];
    else if (a === '--session') args.session = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--non-interactive') args.nonInteractive = true;
  }
  if (!args.specPath) {
    throw new Error(
      'orchestrator: --spec <path> is required.\n' +
        'Example: npx tsx claude-kindling/library/build-mode/orchestrator.ts \\\n' +
        '  --spec claude-kindling/design/specs/modules/module-1-1-looking-closely.md',
    );
  }
  return args;
}

// ─── Session setup ───────────────────────────────────────────────────────────

function defaultSessionSlug(spec: ModuleSpec): string {
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  // module.1.1.looking-closely → 1-1
  const m = /^module\.(\d+)\.(\d+)\./.exec(spec.kindlingId);
  const tag = m ? `${m[1]}-${m[2]}` : 'unknown';
  return `${yyyy}-${mm}-${dd}-build-${tag}`;
}

// ─── Sanity client ───────────────────────────────────────────────────────────

function makeSanityClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_TOKEN;
  if (!projectId || !dataset || !token) {
    throw new Error(
      'orchestrator: Sanity credentials missing.\n' +
        'Required env: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN.\n' +
        'For development without writes, pass --dry-run.',
    );
  }
  return createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: false,
    token,
  });
}

// ─── Sanity helpers (mirroring src/lib/sanity/helpers.ts so we don't reach across) ─
// We mirror them here rather than importing because the platform-side helpers depend on
// the platform's `sanityWriteClient` singleton, which pulls env at module load — fine in
// practice, but we want this script to be runnable in `--dry-run` without Sanity creds.

function key(prefix = 'k'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function autoSlug(title: string) {
  return {
    _type: 'slug' as const,
    current: title
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''),
  };
}

function ref(id: string) {
  return { _type: 'reference' as const, _ref: id };
}

function keyedRef(id: string) {
  return { _type: 'reference' as const, _ref: id, _key: key('ref') };
}

function keyedRefs(ids: string[]) {
  return ids.map(keyedRef);
}

function blockText(text: string) {
  // Each paragraph (separated by \n\n) becomes its own block.
  return text.split('\n\n').map((para, i) => ({
    _type: 'block' as const,
    _key: key(`block-${i}`),
    style: 'normal' as const,
    markDefs: [],
    children: [{ _type: 'span' as const, _key: key(`span-${i}`), text: para, marks: [] }],
  }));
}

// ─── ID derivation ───────────────────────────────────────────────────────────
// The kindlingId / Sanity ID convention is documented in
// `design/sanity-schema-reference.md` §8.

function packAndModuleIndices(moduleKindlingId: string): { pack: number; module: number } {
  const m = /^module\.(\d+)\.(\d+)\./.exec(moduleKindlingId);
  if (!m) throw new Error(`Cannot parse pack/module indices from kindlingId: ${moduleKindlingId}`);
  return { pack: parseInt(m[1], 10), module: parseInt(m[2], 10) };
}

function approachIdFor(moduleSpec: ModuleSpec, approach: ApproachSpec): string {
  const { pack, module: mod } = packAndModuleIndices(moduleSpec.kindlingId);
  const letter = String.fromCharCode('a'.charCodeAt(0) + (approach.index - 1));
  const slug = slugify(approach.title);
  return `approach.${pack}.${mod}.${letter}.${slug}`;
}

function activityIdFor(
  moduleSpec: ModuleSpec,
  approach: ApproachSpec,
  activityIndex: number,
  activitySlug: string,
): string {
  const { pack, module: mod } = packAndModuleIndices(moduleSpec.kindlingId);
  const letter = String.fromCharCode('a'.charCodeAt(0) + (approach.index - 1));
  return `activity.${pack}.${mod}.${letter}.${activityIndex}.${activitySlug}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Core flow ───────────────────────────────────────────────────────────────

interface RunContext {
  args: CliArgs;
  spec: ModuleSpec;
  session: string;
  sanity: SanityClient | null;          // null in dry-run
  dryRun: boolean;
  // Accumulated state for close-out
  created: { type: string; id: string; title: string }[];
  skipped: { type: string; id: string; reason: string }[];
  hardFailures: { id: string; criteria: string[] }[];
  softWarnings: { id: string; criteria: string[] }[];
  neededFlagged: ResourceRef[];
  // [NEW] §4.2 wiring
  sessionNotePath: string;
  overlapWarnings: OverlapHit[];
  derivedArtifacts?: DerivedArtifactPaths;
  derivedArtifactsError?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const specPath = resolve(process.cwd(), args.specPath);
  if (!existsSync(specPath)) {
    throw new Error(`Spec file not found: ${specPath}`);
  }
  const spec = await parseModuleSpec(specPath);
  const session = args.session ?? defaultSessionSlug(spec);

  console.log(`\n🌱 build-mode orchestrator`);
  console.log(`   spec: ${args.specPath}`);
  console.log(`   module: ${spec.kindlingId}`);
  console.log(`   pack: ${spec.packRef}`);
  console.log(`   session: ${session}`);
  console.log(`   dry-run: ${args.dryRun ? 'yes' : 'no'}`);

  const ctx: RunContext = {
    args,
    spec,
    session,
    sanity: args.dryRun ? null : makeSanityClient(),
    dryRun: args.dryRun,
    created: [],
    skipped: [],
    hardFailures: [],
    softWarnings: [],
    neededFlagged: [],
    sessionNotePath: '',
    overlapWarnings: [],
  };

  // ── [NEW] Pack gate — parent pack must be at `specced` or beyond
  const packGate = await checkPackGate(spec.packRef);
  if (!packGate.ok) {
    throw new Error(packGate.error ?? 'pack-gate: refused');
  }

  // ── Gate: spec must be at `specced` per register
  await checkSpecGate(ctx);

  // ── [NEW] Overlap check vs register/modules.jsonl
  const overlap = await checkOverlap(spec);
  if (overlap.blocking.length > 0) {
    const hits = overlap.blocking
      .map((h) => `${h.kindlingId} (Jaccard ${h.jaccard.toFixed(2)})`)
      .join('; ');
    throw new Error(
      `overlap-check: target understanding overlaps too closely with existing module(s): ${hits}.\n` +
        `Reword the spec's targetUnderstanding or, if intentional, file a scribe-mode note ` +
        `before re-running build mode.`,
    );
  }
  ctx.overlapWarnings = overlap.warnings;
  for (const w of overlap.warnings) {
    ctx.softWarnings.push({
      id: spec.kindlingId,
      criteria: [`overlap:near-duplicate:${w.kindlingId}`],
    });
  }

  // ── [NEW] Session note — write the design-lock header
  ctx.sessionNotePath = await writeSessionNoteStart({
    session: ctx.session,
    mode: 'build',
    module: spec.kindlingId,
    packRef: spec.packRef,
    targetUnderstanding: spec.targetUnderstanding,
    approachCount: spec.approaches.length,
    startedAt: new Date().toISOString(),
  });
  console.log(`  📝 session note: ${ctx.sessionNotePath}`);

  // ── Module-level sparse-content check (informational; some fields aren't yet known)
  surfaceModulePreview(ctx);

  // ── Ensure module Sanity doc exists
  await ensureModuleDoc(ctx);

  // ── Walk approaches and activities
  const approachToActivities = new Map<string, string[]>();
  for (const approach of ctx.spec.approaches) {
    const approachId = await ensureApproachDoc(ctx, approach);
    const activityIds: string[] = [];
    const count = approach.activityCount ?? 1;
    for (let i = 1; i <= count; i++) {
      const activityId = await runActivitySlot(ctx, approach, i);
      if (activityId) activityIds.push(activityId);
    }
    approachToActivities.set(approachId, activityIds);
  }

  // ── Patch references: approach.activities, module.approaches
  await patchReferences(ctx, approachToActivities);

  // ── Flag NEEDED resources
  await flagNeededResources(ctx);

  // ── Fire content_constructed if no hard fails
  await maybeFireContentConstructed(ctx);

  // ── [NEW] Regenerate derived artifacts (status board, heatmap, per-module YAML)
  // Wrapped in try/catch — a regen failure must NOT reverse content_constructed.
  try {
    ctx.derivedArtifacts = await regenerateDerivedArtifacts(spec, {
      session: ctx.session,
      spec: ctx.spec,
      created: ctx.created,
      hardFailures: ctx.hardFailures,
      softWarnings: ctx.softWarnings,
      dryRun: ctx.dryRun,
    });
    console.log(`\n✓ derived artifacts regenerated`);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    ctx.derivedArtifactsError = message;
    console.warn(
      `\n⚠  derived-artifacts regen failed: ${message}\n` +
        `   content_constructed event was NOT reversed — failure is logged but isolated.`,
    );
  }

  // ── [NEW] Append close-out section to the session note (file-side)
  await appendSessionNoteCloseOut(ctx.sessionNotePath, {
    session: ctx.session,
    spec: { kindlingId: ctx.spec.kindlingId, packRef: ctx.spec.packRef },
    dryRun: ctx.dryRun,
    created: ctx.created,
    skipped: ctx.skipped,
    hardFailures: ctx.hardFailures,
    softWarnings: ctx.softWarnings,
    neededFlagged: ctx.neededFlagged.map((r) => ({
      deterministicId: r.deterministicId,
      scope: r.scope,
      raw: r.raw,
    })),
    overlapWarnings: ctx.overlapWarnings.map((o) => ({
      kindlingId: o.kindlingId,
      jaccard: o.jaccard,
    })),
    derivedArtifacts: ctx.derivedArtifacts,
    derivedArtifactsError: ctx.derivedArtifactsError,
  });

  // ── Close-out (stdout, alongside the file write above)
  printCloseOut(ctx);
}

async function checkSpecGate(ctx: RunContext): Promise<void> {
  const events = await readEvents('module');
  const latest = latestEventForId(events, ctx.spec.kindlingId);
  if (!latest || latest.event !== 'specced') {
    const current = latest?.event ?? '<no events>';
    throw new Error(
      `Bucket gate failed: module ${ctx.spec.kindlingId} is at \`${current}\`, expected \`specced\`.\n\n` +
        `Build mode runs from specced → content_constructed. If the spec is ready, fire the\n` +
        `\`specced\` event first via:\n` +
        `  npx tsx claude-kindling/register/confirm-spec.ts --module ${ctx.spec.kindlingId}\n\n` +
        `(Or whichever script confirms the four pillars and fires the event.)`,
    );
  }
  // Pillars-confirmed checklist sanity check (informational)
  const pc = ctx.spec.pillarsConfirmed;
  const allFour = pc.understanding && pc.hours && pc.topicCoverage && pc.resources;
  if (!allFour) {
    console.log(
      `\n⚠  Spec gate passed (specced event found) BUT the pillars-confirmed checklist in\n` +
        `   the spec doc has unticked boxes. The register and the doc disagree. Continuing\n` +
        `   because the register is authoritative — but you should reconcile the doc.`,
    );
    console.log(
      `   understanding: ${pc.understanding} | hours: ${pc.hours} | ` +
        `topic-coverage: ${pc.topicCoverage} | resources: ${pc.resources}`,
    );
  }
}

function surfaceModulePreview(ctx: RunContext): void {
  // Module-level checks. We can run most of these now from the spec; some won't be known
  // until the activities are authored, so we re-run after.
  const moduleInput: ModuleCheckInput = {
    title: ctx.spec.packTitle ?? ctx.spec.kindlingId,
    targetUnderstanding: ctx.spec.targetUnderstanding,
    understandingIndicators: ctx.spec.understandingIndicators,
    approachCount: ctx.spec.approaches.length,
    approachModalities: ctx.spec.approaches.map((a) => a.modality),
    subjects: ctx.spec.subjects,
    ageRange: ctx.spec.ageRange,
    duration: null,
    capabilityThreads: ctx.spec.capabilityThreads.map((t) => ({ id: t.label })),
  };
  const result = checkModule(moduleInput);
  if (result.hardFails.length || result.softWarnings.length) {
    console.log(`\n📋 Module sparse-content preview:`);
    if (result.hardFails.length) console.log(`   hard fails: ${result.hardFails.join(', ')}`);
    if (result.softWarnings.length) console.log(`   soft warnings: ${result.softWarnings.join(', ')}`);
  }
}

// ─── Module Sanity doc ──────────────────────────────────────────────────────

async function ensureModuleDoc(ctx: RunContext): Promise<string> {
  const moduleId = ctx.spec.kindlingId; // by convention, kindlingId === Sanity _id for editorial
  if (ctx.dryRun) {
    console.log(`\n[dry-run] would ensure module exists at id: ${moduleId}`);
    ctx.created.push({ type: 'module', id: moduleId, title: titleFromKindlingId(moduleId) });
    return moduleId;
  }
  const sanity = ctx.sanity!;
  const existing = await sanity.getDocument(moduleId);
  if (existing) {
    console.log(`  ↩  module exists in Sanity: ${moduleId}`);
    ctx.skipped.push({ type: 'module', id: moduleId, reason: 'already in Sanity' });
    return moduleId;
  }
  // Build the module document. We use the spec's targetUnderstanding (locked from A1) and
  // the three-tier indicators if present. Approaches are NOT set here — they're patched in
  // after they exist.
  const indicators = ctx.spec.understandingIndicators;
  const indicatorsObj: Record<string, string> = {};
  if (indicators.emerging.length) indicatorsObj.emerging = indicators.emerging.join('\n• ');
  if (indicators.developing.length) indicatorsObj.developing = indicators.developing.join('\n• ');
  if (indicators.demonstrating.length) indicatorsObj.demonstrating = indicators.demonstrating.join('\n• ');

  const title = ctx.spec.packTitle ? deriveModuleTitleFromSpec(ctx.spec) : ctx.spec.kindlingId;

  await sanity.createOrReplace({
    _id: moduleId,
    _type: 'module',
    title,
    slug: autoSlug(title),
    targetUnderstanding: ctx.spec.targetUnderstanding ?? '',
    understandingIndicators: indicatorsObj,
    subjects: ctx.spec.subjects.length ? ctx.spec.subjects : undefined,
    ageRange: ctx.spec.ageRange ?? undefined,
    status: 'draft',
    createdVia: 'editorial',
    // authorFamilyId deliberately omitted — editorial rule
  });

  await appendEvent({
    event: 'created',
    type: 'module',
    sanityId: moduleId,
    kindlingId: moduleId,
    title,
    slug: autoSlug(title).current,
    packRef: ctx.spec.packRef,
    createdVia: 'editorial',
    session: ctx.session,
  });
  ctx.created.push({ type: 'module', id: moduleId, title });
  console.log(`  ✓  module created in Sanity: ${moduleId}`);
  return moduleId;
}

function deriveModuleTitleFromSpec(spec: ModuleSpec): string {
  // Prefer the H1 of the spec doc (e.g. "Looking Closely — Spec" → "Looking Closely")
  // Spec parser doesn't carry it, so we extract from rawByHeading or kindlingId fallback.
  // Look in the heading map for any heading that matches the kindling slug.
  const slug = spec.kindlingId.split('.').slice(-1)[0];
  const titleCase = slug
    .split('-')
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
  return titleCase;
}

function titleFromKindlingId(id: string): string {
  const slug = id.split('.').slice(-1)[0];
  return slug
    .split('-')
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// ─── Approach Sanity doc ────────────────────────────────────────────────────

async function ensureApproachDoc(ctx: RunContext, approach: ApproachSpec): Promise<string> {
  const id = approachIdFor(ctx.spec, approach);
  console.log(`\n── Approach ${approach.index}: ${approach.title}`);
  if (ctx.dryRun) {
    console.log(`  [dry-run] would create approach: ${id}`);
    ctx.created.push({ type: 'approach', id, title: approach.title });
    return id;
  }
  const sanity = ctx.sanity!;
  const existing = await sanity.getDocument(id);
  if (existing) {
    console.log(`  ↩  approach exists: ${id}`);
    ctx.skipped.push({ type: 'approach', id, reason: 'already in Sanity' });
    return id;
  }
  await sanity.createOrReplace({
    _id: id,
    _type: 'approach',
    title: approach.title,
    slug: autoSlug(approach.title),
    module: ref(ctx.spec.kindlingId),
    modality: approach.modality ?? undefined,
    description: approach.angle ?? undefined,
    status: 'draft',
  });
  await appendEvent({
    event: 'created',
    type: 'approach',
    sanityId: id,
    kindlingId: id,
    title: approach.title,
    slug: autoSlug(approach.title).current,
    moduleRef: ctx.spec.kindlingId,
    packRef: ctx.spec.packRef,
    session: ctx.session,
  });
  ctx.created.push({ type: 'approach', id, title: approach.title });
  console.log(`  ✓  approach created: ${id}`);
  return id;
}

// ─── Activity slot — prompt user, run sparse checks, create ─────────────────

interface ActivityDraft {
  title: string;
  summary: string;
  instructions: string;
  facilitatorGuidance: { before: string; during: string; challenges: string };
  materials: { name: string; required: boolean; alternative?: string }[];
  duration: { min: number; max: number };
  setting: 'indoor' | 'outdoor' | 'either';
  energyLevel: 'calm' | 'moderate' | 'active';
  modality: 'kinesthetic' | 'visual' | 'auditory' | 'narrative' | 'social';
  observationPrompts: string[];
  reflectionPrompts: string[];
  capabilityThreads: { id: string; primary: boolean }[];
  assetRefs: { assetId: string; role: 'core' | 'optional' | 'extension'; notes?: string }[];
  commonsTextRefs: {
    textId: string;
    role: 'core' | 'optional' | 'extension';
    presentationMode: 'read_aloud' | 'child_reads' | 'reference_only' | 'memorisation';
    notes?: string;
  }[];
}

async function runActivitySlot(
  ctx: RunContext,
  approach: ApproachSpec,
  activityIndex: number,
): Promise<string | null> {
  console.log(`\n  ── Activity ${approach.index}.${activityIndex}`);
  let draft: ActivityDraft;
  if (ctx.args.nonInteractive) {
    draft = nonInteractiveStub(approach, activityIndex);
  } else {
    draft = await promptForActivity(ctx, approach, activityIndex);
  }

  // Sparse-content check BEFORE creation
  const checkInput: ActivityCheckInput = {
    title: draft.title,
    instructions: draft.instructions,
    materials: draft.materials,
    facilitatorGuidance: draft.facilitatorGuidance,
    duration: draft.duration,
    setting: draft.setting,
    energyLevel: draft.energyLevel,
    modality: draft.modality,
    observationPrompts: draft.observationPrompts,
    capabilityThreads: draft.capabilityThreads,
  };
  const sparseResult = checkActivity(checkInput);
  const id = activityIdFor(ctx.spec, approach, activityIndex, slugify(draft.title));

  // [NEW] Six-test gate runs AFTER sparse-content passes — its codes are
  // namespaced 'six-test:*' so we merge them into the same hard/soft buckets
  // that drive content_constructed.
  let sixTestResult = { hardFails: [] as string[], softWarnings: [] as string[] };
  if (sparseResult.hardFails.length === 0) {
    const sixInput: SixTestActivityInput = {
      ...checkInput,
      ageRange: ctx.spec.ageRange ?? null,
      targetUnderstanding: ctx.spec.targetUnderstanding ?? null,
    };
    sixTestResult = sixTestCheckActivity(sixInput);
  }
  const result = {
    hardFails: [...sparseResult.hardFails, ...sixTestResult.hardFails],
    softWarnings: [...sparseResult.softWarnings, ...sixTestResult.softWarnings],
  };

  if (result.hardFails.length) {
    console.log(`    ✗ hard-fail blocks creation: ${result.hardFails.join(', ')}`);
    ctx.hardFailures.push({ id, criteria: result.hardFails });
    if (result.softWarnings.length) ctx.softWarnings.push({ id, criteria: result.softWarnings });
    // Fire a flagged event so the failure is on the record even though we didn't create.
    await appendEvent({
      event: 'flagged',
      type: 'activity',
      kindlingId: id,
      flag: 'sparse-content',
      severity: 'hard-fail',
      criteria_failed: result.hardFails,
      blocking_transition: 'content_constructed',
      session: ctx.session,
    });
    ctx.skipped.push({ type: 'activity', id, reason: `hard-fail: ${result.hardFails.join(', ')}` });
    return null;
  }

  if (result.softWarnings.length) {
    console.log(`    ⚠ soft warnings: ${result.softWarnings.join(', ')}`);
    ctx.softWarnings.push({ id, criteria: result.softWarnings });
  }

  // Create the activity
  if (ctx.dryRun) {
    console.log(`    [dry-run] would create activity: ${id}`);
    ctx.created.push({ type: 'activity', id, title: draft.title });
    if (result.softWarnings.length) {
      await appendEvent({
        event: 'flagged',
        type: 'activity',
        kindlingId: id,
        flag: 'sparse-content',
        severity: 'soft-warning',
        criteria_failed: result.softWarnings,
        session: ctx.session,
      });
    }
    return id;
  }

  const sanity = ctx.sanity!;
  const existing = await sanity.getDocument(id);
  if (existing) {
    console.log(`    ↩  activity exists: ${id}`);
    ctx.skipped.push({ type: 'activity', id, reason: 'already in Sanity' });
    return id;
  }

  // Build the activity doc
  const approachRefId = approachIdFor(ctx.spec, approach);
  await sanity.createOrReplace({
    _id: id,
    _type: 'activity',
    title: draft.title,
    slug: autoSlug(draft.title),
    summary: draft.summary || undefined,
    approach: ref(approachRefId),
    instructions: blockText(draft.instructions),
    facilitatorGuidance: {
      before: draft.facilitatorGuidance.before || undefined,
      during: draft.facilitatorGuidance.during || undefined,
      challenges: draft.facilitatorGuidance.challenges || undefined,
    },
    materials: draft.materials.map((m) => ({
      _key: key('mat'),
      name: m.name,
      required: m.required,
      ...(m.alternative ? { alternative: m.alternative } : {}),
    })),
    assets: draft.assetRefs.map((a) => ({
      _key: key('aref'),
      asset: ref(a.assetId),
      role: a.role,
      ...(a.notes ? { notes: a.notes } : {}),
    })),
    commonsTexts: draft.commonsTextRefs.map((c) => ({
      _key: key('ctref'),
      text: ref(c.textId),
      role: c.role,
      presentationMode: c.presentationMode,
      ...(c.notes ? { notes: c.notes } : {}),
    })),
    duration: draft.duration,
    setting: draft.setting,
    energyLevel: draft.energyLevel,
    modality: draft.modality,
    observationPrompts: draft.observationPrompts,
    reflectionPrompts: draft.reflectionPrompts.length ? draft.reflectionPrompts : undefined,
    capabilityThreads: keyedRefs(draft.capabilityThreads.map((t) => t.id)),
    status: 'draft',
  });

  await appendEvent({
    event: 'created',
    type: 'activity',
    sanityId: id,
    kindlingId: id,
    title: draft.title,
    slug: autoSlug(draft.title).current,
    approachRef: approachRefId,
    moduleRef: ctx.spec.kindlingId,
    packRef: ctx.spec.packRef,
    // Heatmap replay reads capabilityThreads off the created event payload.
    capabilityThreads: draft.capabilityThreads.map((t) => ({ id: t.id, primary: t.primary })),
    session: ctx.session,
  });

  if (result.softWarnings.length) {
    await appendEvent({
      event: 'flagged',
      type: 'activity',
      sanityId: id,
      kindlingId: id,
      flag: 'sparse-content',
      severity: 'soft-warning',
      criteria_failed: result.softWarnings,
      session: ctx.session,
    });
  }

  ctx.created.push({ type: 'activity', id, title: draft.title });
  console.log(`    ✓ activity created: ${id}`);
  return id;
}

// ─── Interactive prompting ──────────────────────────────────────────────────

async function promptForActivity(
  ctx: RunContext,
  approach: ApproachSpec,
  activityIndex: number,
): Promise<ActivityDraft> {
  console.log(`    Approach: ${approach.title} (${approach.modality ?? 'unknown modality'})`);
  console.log(`    Spec angle: ${approach.angle ?? '—'}`);
  console.log(`    Spec asset hints (resources flagged in spec):`);
  const moduleResourceLines = ctx.spec.resources
    .map((r) => `      - ${r.deterministicId} [${r.status}]`)
    .join('\n');
  console.log(moduleResourceLines || '      (none)');
  console.log('');

  const title = await input({
    message: `Activity title (sentence case, descriptive, no emoji):`,
    validate: (v) => (v.trim().length ? true : 'Required'),
  });
  const summary = await input({
    message: `One-sentence card summary (optional):`,
    default: '',
  });
  const instructions = await editor({
    message: `Core instructions — opens an editor. Plain prose, second-person, mid-density. (Press enter to open editor.)`,
    default: `\n\n# Suggested structure (delete this header before saving)\n# Short framing line, then the steps, then any notes.\n`,
  });

  const before = await input({ message: `Facilitator guidance — BEFORE:`, default: '' });
  const during = await input({ message: `Facilitator guidance — DURING:`, default: '' });
  const challenges = await input({
    message: `Facilitator guidance — IF IT'S NOT WORKING (mandatory if duration > 10 min):`,
    default: '',
  });

  // Materials — collect until empty title
  const materials: ActivityDraft['materials'] = [];
  while (true) {
    const name = await input({ message: `Material name (blank to finish):`, default: '' });
    if (!name.trim()) break;
    const required = await confirm({ message: `Required?`, default: true });
    const alternative = await input({ message: `Alternative (blank if none):`, default: '' });
    materials.push({ name, required, alternative: alternative || undefined });
  }

  const durationMin = parseInt(
    await input({ message: `Duration min (minutes):`, validate: (v) => /^\d+$/.test(v) || 'Number required' }),
    10,
  );
  const durationMax = parseInt(
    await input({ message: `Duration max (minutes):`, validate: (v) => /^\d+$/.test(v) || 'Number required' }),
    10,
  );

  const setting = (await select({
    message: `Setting:`,
    choices: [
      { value: 'indoor', name: 'indoor' },
      { value: 'outdoor', name: 'outdoor' },
      { value: 'either', name: 'either' },
    ],
  })) as ActivityDraft['setting'];

  const energyLevel = (await select({
    message: `Energy level:`,
    choices: [
      { value: 'calm', name: 'calm' },
      { value: 'moderate', name: 'moderate' },
      { value: 'active', name: 'active' },
    ],
  })) as ActivityDraft['energyLevel'];

  const modality = (await select({
    message: `Modality (activity-level):`,
    choices: [
      { value: 'kinesthetic', name: 'kinesthetic' },
      { value: 'visual', name: 'visual' },
      { value: 'auditory', name: 'auditory' },
      { value: 'narrative', name: 'narrative' },
      { value: 'social', name: 'social' },
    ],
  })) as ActivityDraft['modality'];

  console.log(`    Observation prompts (2–4 — empty line to finish):`);
  const observationPrompts: string[] = [];
  while (true) {
    const p = await input({ message: `  Prompt ${observationPrompts.length + 1}:`, default: '' });
    if (!p.trim()) break;
    observationPrompts.push(p.trim());
    if (observationPrompts.length >= 4) break;
  }

  console.log(`    Reflection prompts (optional — empty line to finish):`);
  const reflectionPrompts: string[] = [];
  while (true) {
    const p = await input({ message: `  Prompt ${reflectionPrompts.length + 1}:`, default: '' });
    if (!p.trim()) break;
    reflectionPrompts.push(p.trim());
  }

  console.log(
    `    Capability threads — at most 3, max 2 primary, never all 3 primary.\n` +
      `    Spec module-level threads are: ${ctx.spec.capabilityThreads
        .map((t) => `${t.label} (${t.primary ? 'primary' : 'secondary'})`)
        .join(', ') || '(none)'}`,
  );
  const capabilityThreads: ActivityDraft['capabilityThreads'] = [];
  while (capabilityThreads.length < 3) {
    const id = await input({
      message: `  Thread Sanity ID (blank to finish):`,
      default: '',
    });
    if (!id.trim()) break;
    const primary = await confirm({ message: `  Is this thread primary?`, default: false });
    capabilityThreads.push({ id: id.trim(), primary });
  }

  // Asset refs — from spec resources
  const assetRefs: ActivityDraft['assetRefs'] = [];
  for (const r of ctx.spec.resources) {
    if (!isAssetId(r.deterministicId)) continue;
    const useIt = await confirm({
      message: `  Reference asset \`${r.deterministicId}\` in this activity?`,
      default: false,
    });
    if (!useIt) continue;
    const role = (await select({
      message: `    role:`,
      choices: [
        { value: 'core', name: 'core' },
        { value: 'optional', name: 'optional' },
        { value: 'extension', name: 'extension' },
      ],
    })) as 'core' | 'optional' | 'extension';
    const notes = await input({ message: `    notes (optional):`, default: '' });
    assetRefs.push({ assetId: r.deterministicId, role, notes: notes || undefined });
  }

  // Commons text refs — same prompt
  const commonsTextRefs: ActivityDraft['commonsTextRefs'] = [];
  for (const r of ctx.spec.resources) {
    if (!isCommonsTextId(r.deterministicId)) continue;
    const useIt = await confirm({
      message: `  Reference commons text \`${r.deterministicId}\` in this activity?`,
      default: false,
    });
    if (!useIt) continue;
    const role = (await select({
      message: `    role:`,
      choices: [
        { value: 'core', name: 'core' },
        { value: 'optional', name: 'optional' },
        { value: 'extension', name: 'extension' },
      ],
    })) as 'core' | 'optional' | 'extension';
    const presentationMode = (await select({
      message: `    presentation mode:`,
      choices: [
        { value: 'read_aloud', name: 'read_aloud' },
        { value: 'child_reads', name: 'child_reads' },
        { value: 'reference_only', name: 'reference_only' },
        { value: 'memorisation', name: 'memorisation' },
      ],
    })) as 'read_aloud' | 'child_reads' | 'reference_only' | 'memorisation';
    const notes = await input({ message: `    notes (optional):`, default: '' });
    commonsTextRefs.push({ textId: r.deterministicId, role, presentationMode, notes: notes || undefined });
  }

  return {
    title,
    summary,
    instructions,
    facilitatorGuidance: { before, during, challenges },
    materials,
    duration: { min: durationMin, max: durationMax },
    setting,
    energyLevel,
    modality,
    observationPrompts,
    reflectionPrompts,
    capabilityThreads,
    assetRefs,
    commonsTextRefs,
  };
}

function isAssetId(id: string): boolean {
  return /^(template|image|reference|audio|worksheet|card_set|handout|manipulative):[a-z0-9-]+$/.test(id);
}

function isCommonsTextId(id: string): boolean {
  return id.startsWith('commons.') || id.startsWith('text.pack-');
}

function nonInteractiveStub(approach: ApproachSpec, activityIndex: number): ActivityDraft {
  // Deliberately sparse — the orchestrator will hard-fail this and skip creation. Used
  // only to test the gate behaviour.
  return {
    title: `${approach.title} — Activity ${activityIndex}`,
    summary: '',
    instructions: '',
    facilitatorGuidance: { before: '', during: '', challenges: '' },
    materials: [],
    duration: { min: 5, max: 5 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [],
    reflectionPrompts: [],
    capabilityThreads: [],
    assetRefs: [],
    commonsTextRefs: [],
  };
}

// ─── Patch references ────────────────────────────────────────────────────────

async function patchReferences(
  ctx: RunContext,
  approachToActivities: Map<string, string[]>,
): Promise<void> {
  if (ctx.dryRun) {
    console.log(`\n[dry-run] would patch approach.activities and module.approaches references.`);
    return;
  }
  const sanity = ctx.sanity!;
  for (const [approachId, activityIds] of approachToActivities) {
    if (activityIds.length === 0) continue;
    await sanity.patch(approachId).set({ activities: keyedRefs(activityIds) }).commit();
    console.log(`  ↻  patched approach ${approachId}: ${activityIds.length} activities`);
  }
  const approachIds = ctx.spec.approaches.map((a) => approachIdFor(ctx.spec, a));
  await sanity.patch(ctx.spec.kindlingId).set({ approaches: keyedRefs(approachIds) }).commit();
  console.log(`  ↻  patched module ${ctx.spec.kindlingId}: ${approachIds.length} approaches`);
}

// ─── Flag NEEDED resources ──────────────────────────────────────────────────

async function flagNeededResources(ctx: RunContext): Promise<void> {
  const events = await readEvents('asset');
  const textEvents = await readEvents('commonsText');
  for (const r of ctx.spec.resources) {
    if (r.status !== 'NEEDED') continue;
    // Has a `flagged` (or `needed`) event already been fired for this asset?
    const all = isAssetId(r.deterministicId) ? events : textEvents;
    const existing = all.filter(
      (e) => (e.sanityId === r.deterministicId || e.kindlingId === r.deterministicId) && (e.event === 'flagged' || e.event === 'needed'),
    );
    if (existing.length > 0) {
      console.log(`  ↩  needed flag already on register for ${r.deterministicId}`);
      continue;
    }
    const flag = isAssetId(r.deterministicId) ? 'asset-needed' : 'text-needed';
    await appendEvent({
      event: 'flagged',
      type: isAssetId(r.deterministicId) ? 'asset' : 'commonsText',
      kindlingId: r.deterministicId,
      flag,
      note: `Required by ${ctx.spec.kindlingId}: ${r.raw}`,
      requiredBy: ctx.spec.kindlingId,
      scope: r.scope,
      session: ctx.session,
    });
    ctx.neededFlagged.push(r);
    console.log(`  ⚑  flagged ${flag}: ${r.deterministicId}`);
  }
  if (ctx.neededFlagged.length) {
    await appendToOpenQuestions(ctx);
  }
}

async function appendToOpenQuestions(ctx: RunContext): Promise<void> {
  // Append a section to build-package/open-questions.md describing the new flags.
  const oqPath = resolve(__dirname, '..', '..', 'build-package', 'open-questions.md');
  let header = '';
  if (!existsSync(oqPath)) {
    header = '# Open Questions\n\n> Build-package open-question log. Append entries; never edit historical entries.\n\n';
  }
  const block = [
    `\n## ${ctx.session} — assets/texts flagged NEEDED by ${ctx.spec.kindlingId}\n`,
    ...ctx.neededFlagged.map(
      (r) =>
        `- \`${r.deterministicId}\` (${r.scope === 'pack-level' ? 'pack-level recurring' : 'module-specific'}) — ${r.raw}`,
    ),
    '',
  ].join('\n');
  if (header) {
    await writeFile(oqPath, header + block, 'utf8');
  } else {
    await appendFile(oqPath, block, 'utf8');
  }
  console.log(`  📝 appended to build-package/open-questions.md (${ctx.neededFlagged.length} flags)`);
}

// ─── Fire content_constructed ───────────────────────────────────────────────

async function maybeFireContentConstructed(ctx: RunContext): Promise<void> {
  if (ctx.hardFailures.length > 0) {
    console.log(
      `\n⚠  ${ctx.hardFailures.length} activity(s) hit hard-fail sparse-content checks. ` +
        `Skipping content_constructed event; module stays at \`specced\`.`,
    );
    return;
  }
  // Count activities created
  const activityCount = ctx.created.filter((c) => c.type === 'activity').length;
  const approachCount = ctx.created.filter((c) => c.type === 'approach').length +
    ctx.skipped.filter((s) => s.type === 'approach').length;
  if (activityCount === 0) {
    console.log(`\n⚠  No activities were created. Skipping content_constructed event.`);
    return;
  }
  await appendEvent({
    event: 'content_constructed',
    type: 'module',
    sanityId: ctx.spec.kindlingId,
    kindlingId: ctx.spec.kindlingId,
    approachCount,
    activityCount,
    // Honest value — we only reach here when ctx.hardFailures is empty, but the
    // payload is now driven by the live counter rather than a hard-coded `true`.
    // If a future code path lets us through with hard failures, this won't lie.
    sixTestPassed: ctx.hardFailures.length === 0,
    softWarningCount: ctx.softWarnings.length,
    targetUnderstanding: ctx.spec.targetUnderstanding ?? undefined,
    session: ctx.session,
  });
  console.log(`\n✓ fired content_constructed for ${ctx.spec.kindlingId}`);
}

// ─── Close-out ──────────────────────────────────────────────────────────────

function printCloseOut(ctx: RunContext): void {
  console.log(`\n────────────────────────────────────────────────────────`);
  console.log(`Session Close-Out — ${ctx.session}`);
  console.log(`────────────────────────────────────────────────────────\n`);

  console.log(`Module: ${ctx.spec.kindlingId} (${ctx.spec.packRef})`);
  console.log(`Mode: build`);
  console.log(`Dry-run: ${ctx.dryRun ? 'yes' : 'no'}`);
  console.log('');

  console.log(`Created:`);
  if (ctx.created.length === 0) console.log(`  (none)`);
  for (const c of ctx.created) console.log(`  + ${c.type}: ${c.id} — ${c.title}`);

  console.log(`\nSkipped:`);
  if (ctx.skipped.length === 0) console.log(`  (none)`);
  for (const s of ctx.skipped) console.log(`  ↩ ${s.type}: ${s.id} (${s.reason})`);

  console.log(`\nHard fails:`);
  if (ctx.hardFailures.length === 0) console.log(`  (none — clean run)`);
  for (const h of ctx.hardFailures) console.log(`  ✗ ${h.id}: ${h.criteria.join(', ')}`);

  console.log(`\nSoft warnings:`);
  if (ctx.softWarnings.length === 0) console.log(`  (none)`);
  for (const w of ctx.softWarnings) console.log(`  ⚠ ${w.id}: ${w.criteria.join(', ')}`);

  console.log(`\n[NEEDED] flags raised:`);
  if (ctx.neededFlagged.length === 0) console.log(`  (none)`);
  for (const n of ctx.neededFlagged) console.log(`  ⚑ ${n.deterministicId} (${n.scope})`);

  console.log(`\n────────────────────────────────────────────────────────\n`);
}

// ─── Entry ───────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error(`\n✗ orchestrator failed: ${err.message ?? err}`);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
