#!/usr/bin/env node
/**
 * DLO mapping quality eval harness (WS-3).
 *
 * Builds enrichment prompts from the golden set, calls Haiku directly
 * (no database writes anywhere), and reports per-entry + aggregate
 * DLO id precision/recall and tier agreement.
 *
 * Pattern: scripts/backfill-dlo-links.mjs for env loading and flags.
 *
 * Flags:
 *   --dry-run       Print assembled prompts; do not call the API
 *   --entry <id>    Run only the named golden-set entry (repeatable)
 *   --delay <ms>    Pause between API calls (default: 400ms)
 *
 * Env (loaded from .env.local):
 *   ANTHROPIC_API_KEY   required unless --dry-run
 *
 * Run:
 *   node scripts/eval-dlo-mapping.mjs
 *   node scripts/eval-dlo-mapping.mjs --dry-run
 *
 * The script delegates TS imports (GOLDEN_SET, SYSTEM_PROMPT, buildUserPrompt)
 * to a tsx subprocess that outputs JSON, then handles API calls and reporting
 * in plain Node.js. This avoids tsx/ESM interop complexity in the main process.
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
config({ path: resolve(repoRoot, '.env.local') });

// ─── Arg parsing ──────────────────────────────────────────────────────────────

const flag = (name) => process.argv.includes(`--${name}`);
const multiArg = (name) => {
  const vals = [];
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === `--${name}` && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) {
      vals.push(process.argv[i + 1]);
    } else if (process.argv[i].startsWith(`--${name}=`)) {
      vals.push(process.argv[i].split('=', 2)[1]);
    }
  }
  return vals;
};
const singleArg = (name, fallback) => { const v = multiArg(name); return v.length > 0 ? v[0] : fallback; };

const DRY_RUN = flag('dry-run');
const ENTRY_FILTER = multiArg('entry');   // [] = all
const DELAY_MS = Number(singleArg('delay', '400'));

if (!DRY_RUN && !process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not set — required unless --dry-run');
  process.exit(2);
}

// ─── Build prompts via tsx subprocess ────────────────────────────────────────
// We shell out to tsx to import the TypeScript golden set + exported builders
// from enrich.ts without requiring complex ESM/CJS shims in this .mjs file.

// Build helper code with absolute repoRoot embedded so it can import from
// project node_modules regardless of where the tmp file lives.
const helperCode = `
// Env already loaded by parent; pedagogy KB disabled to avoid Sanity calls.
process.env.PEDAGOGY_KB_ENABLED = 'false';

import { GOLDEN_SET } from '${repoRoot}/scripts/data/dlo-golden-set.ts';
import { SYSTEM_PROMPT, buildUserPrompt } from '${repoRoot}/src/lib/ai/enrich.ts';

async function buildFixtureCtx(entry) {
  const now = Date.now();
  const childRecords = entry.childRecords.map((c, i) => {
    const ageMsApprox = c.ageYears * 365.25 * 24 * 60 * 60 * 1000;
    return {
      id: 'fixture-' + i,
      name: c.name,
      familyId: 'fixture-family',
      dateOfBirth: new Date(now - ageMsApprox).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      colorPreference: null,
      shape: null,
    };
  });
  return {
    entry: {
      id: entry.id,
      familyId: 'fixture-family',
      title: entry.title,
      description: entry.description,
      learnerIds: childRecords.map(c => c.id),
      sourceActivityIds: entry.sourceActivityIds ?? [],
      status: 'complete',
      dateOccurred: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiEnrichment: null,
      discoveriesPerLearner: null,
      observationDetails: null,
      engagementPerLearner: null,
      threadLinks: null,
      location: null,
      subjectTags: [],
      duration: null,
      evidenceUrls: [],
      workSampleCandidate: null,
      workSampleQuality: null,
    },
    settings: { familyId: 'fixture-family', pedagogyPreference: 'eclectic' },
    childRecords,
    activeThreads: entry.activeThreads ?? {},
    recentEntries: [],
    candidateThreadIds: Object.values(entry.activeThreads ?? {}).flat()
      .filter((v, i, a) => a.indexOf(v) === i).slice(0, 10),
  };
}

async function main() {
  const out = [];
  for (const entry of GOLDEN_SET) {
    const ctx = await buildFixtureCtx(entry);
    const { prompt } = await buildUserPrompt(ctx);
    out.push({ id: entry.id, prompt });
  }
  process.stdout.write(JSON.stringify({ systemPrompt: SYSTEM_PROMPT, entries: out }));
}
main().catch(e => { process.stderr.write(String(e) + '\\n'); process.exit(1); });
`;

import { writeFileSync as wf, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const tmpHelper = join(tmpdir(), `hearth-eval-helper-${Date.now()}.ts`);
wf(tmpHelper, helperCode);

let builtPrompts;
try {
  const r = spawnSync('npx', ['--yes', 'tsx', tmpHelper], {
    cwd: repoRoot,
    env: { ...process.env, PEDAGOGY_KB_ENABLED: 'false' },
    encoding: 'utf-8',
    maxBuffer: 20 * 1024 * 1024,
    timeout: 60_000,
  });
  if (r.status !== 0) {
    console.error('Failed to build prompts from golden set:\n', r.stderr);
    process.exit(1);
  }
  builtPrompts = JSON.parse(r.stdout);
} finally {
  try { unlinkSync(tmpHelper); } catch {}
}

const SYSTEM_PROMPT = builtPrompts.systemPrompt;
const promptMap = new Map(builtPrompts.entries.map(e => [e.id, e.prompt]));

// ─── Re-import golden set metadata (via tsx) ──────────────────────────────────

const gsResult = spawnSync('npx', ['--yes', 'tsx', '--eval',
  `import { GOLDEN_SET } from '${repoRoot}/scripts/data/dlo-golden-set.ts'; process.stdout.write(JSON.stringify(GOLDEN_SET));`
], { cwd: repoRoot, encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024, timeout: 30_000 });

if (gsResult.status !== 0) {
  console.error('Failed to load golden set:\n', gsResult.stderr);
  process.exit(1);
}
const GOLDEN_SET = JSON.parse(gsResult.stdout);

// ─── Filter ───────────────────────────────────────────────────────────────────

const entries = ENTRY_FILTER.length > 0
  ? GOLDEN_SET.filter(e => ENTRY_FILTER.includes(e.id))
  : GOLDEN_SET;

if (DRY_RUN) {
  console.log('=== DRY RUN — assembled prompts ===\n');
  for (const entry of entries) {
    const prompt = promptMap.get(entry.id) ?? '(missing)';
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Entry: ${entry.id}`);
    console.log(`Title: "${entry.title}"`);
    console.log(`Gold DLOs: ${entry.expected_dlo_ids.join(', ') || '(none)'}`);
    console.log(`\nUSER PROMPT:\n${prompt}`);
  }
  process.exit(0);
}

// ─── Anthropic calls ──────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function extractJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first === -1 || last === -1 || last < first) return candidate;
  return candidate.slice(first, last + 1);
}

const runResults = [];
console.log(`\nDLO mapping eval — ${entries.length} entries — model: claude-haiku-4-5-20251001\n`);

for (let i = 0; i < entries.length; i++) {
  const entry = entries[i];
  const userPrompt = promptMap.get(entry.id);
  if (!userPrompt) { console.warn(`  [SKIP] ${entry.id} — no prompt built`); continue; }
  if (i > 0) await sleep(DELAY_MS);

  process.stdout.write(`[${i + 1}/${entries.length}] ${entry.id} ... `);

  let predicted = [];
  let inputTokens = 0, outputTokens = 0, errorMsg = null;

  try {
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt }],
    });
    inputTokens = resp.usage.input_tokens;
    outputTokens = resp.usage.output_tokens;
    const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const parsed = JSON.parse(extractJson(text));
    predicted = (parsed.discrete_learning_objectives ?? [])
      .filter(d => d && typeof d.dlo_id === 'string' && typeof d.confidence === 'number' && d.confidence >= 0.4)
      .slice(0, 3);
  } catch (e) {
    errorMsg = e.message?.slice(0, 80) ?? String(e);
  }

  // Metrics
  const goldIds = new Set(entry.expected_dlo_ids);
  const predIds = new Set(predicted.map(d => d.dlo_id));
  const tp = [...predIds].filter(id => goldIds.has(id));

  const precision = predIds.size > 0 ? tp.length / predIds.size
    : goldIds.size === 0 ? 1 : 0;
  const recall = goldIds.size > 0 ? tp.length / goldIds.size
    : predIds.size === 0 ? 1 : 0;

  const tierMatches = tp.filter(id => {
    const pred = predicted.find(d => d.dlo_id === id);
    return pred && entry.expected_tiers[id] && pred.tier === entry.expected_tiers[id];
  });
  const tierAgreement = tp.length > 0 ? tierMatches.length / tp.length : null;

  runResults.push({
    id: entry.id,
    title: entry.title,
    gold_ids: entry.expected_dlo_ids,
    pred_ids: [...predIds],
    predicted_full: predicted,
    tp,
    precision,
    recall,
    tier_agreement: tierAgreement,
    tier_matches: tierMatches.length,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    error: errorMsg,
  });

  const tier_str = tierAgreement !== null ? tierAgreement.toFixed(2) : ' N/A';
  console.log(`P=${precision.toFixed(2)} R=${recall.toFixed(2)} tier=${tier_str} tok=${inputTokens}+${outputTokens}${errorMsg ? ' ERR:'+errorMsg.slice(0,30) : ''}`);
}

// ─── Aggregate ────────────────────────────────────────────────────────────────

const n = runResults.length;
const avgP = runResults.reduce((s, r) => s + r.precision, 0) / n;
const avgR = runResults.reduce((s, r) => s + r.recall, 0) / n;
const tierRows = runResults.filter(r => r.tier_agreement !== null);
const avgTier = tierRows.length > 0
  ? tierRows.reduce((s, r) => s + r.tier_agreement, 0) / tierRows.length : null;
const totalIn = runResults.reduce((s, r) => s + r.input_tokens, 0);
const totalOut = runResults.reduce((s, r) => s + r.output_tokens, 0);

console.log(`\n${'═'.repeat(70)}`);
console.log('AGGREGATE (macro-average across all entries)');
console.log(`${'═'.repeat(70)}`);
console.log(`  Precision (id):       ${avgP.toFixed(3)}`);
console.log(`  Recall (id):          ${avgR.toFixed(3)}`);
console.log(`  Tier agreement (tp):  ${avgTier !== null ? avgTier.toFixed(3) : 'N/A'}`);
console.log(`  Avg input tokens:     ${Math.round(totalIn / n)}`);
console.log(`  Avg output tokens:    ${Math.round(totalOut / n)}`);
console.log(`  Total tokens:         ${totalIn + totalOut}`);
console.log(`  Errors:               ${runResults.filter(r => r.error).length}/${n}`);

console.log(`\n${'─'.repeat(75)}`);
console.log('ID                         |  P   |  R   | Tier | in_tok | out_tok');
console.log(`${'─'.repeat(75)}`);
for (const r of runResults) {
  console.log([
    r.id.slice(0, 26).padEnd(26),
    r.precision.toFixed(2).padStart(4),
    r.recall.toFixed(2).padStart(4),
    (r.tier_agreement !== null ? r.tier_agreement.toFixed(2) : ' N/A').padStart(4),
    String(r.input_tokens).padStart(6),
    String(r.output_tokens).padStart(7),
  ].join(' | '));
}

// Write raw JSON for audit doc
const payload = {
  run_at: new Date().toISOString(),
  model: 'claude-haiku-4-5-20251001',
  phase: 'baseline',
  n_entries: n,
  aggregate: { precision: avgP, recall: avgR, tier_agreement: avgTier,
    avg_input_tokens: Math.round(totalIn / n), avg_output_tokens: Math.round(totalOut / n),
    total_input_tokens: totalIn, total_output_tokens: totalOut },
  per_entry: runResults,
};
const auditDir = resolve(repoRoot, 'docs', 'audits');
mkdirSync(auditDir, { recursive: true });
const outPath = resolve(auditDir, '_eval-dlo-run-latest.json');
writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log(`\nRaw results → docs/audits/_eval-dlo-run-latest.json`);
