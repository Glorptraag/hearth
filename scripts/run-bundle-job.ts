/**
 * Run a Pedagogy Lens + Methodology Overlay generation job for one module.
 *
 * Usage:
 *   npx tsx scripts/run-bundle-job.ts \
 *     --module <sanityModuleId> \
 *     [--scope curated|all|parent-built] \
 *     [--family-pedagogy charlotte_mason] \
 *     [--family-practices narration,nature-journaling] \
 *     [--dry-run]
 *
 * Reads:
 *   - Sanity module document (via @sanity/client)
 *   - Sanity practice documents (the twelve seeded by scripts/seed-practices.ts)
 *   - Sanity bannedPhraseSet singleton (empty list = check no-ops)
 *
 * Writes:
 *   - Patches `module.pedagogyLensBundles`, `lensStatus`, `methodologyAffordances`,
 *     `methodologyOverlays`, `methodologyStatus` on the target Sanity module.
 *
 * Cost: every invocation spends Anthropic + Voyage tokens. Use --dry-run for a
 * cost estimate without LLM calls (skips generation; only runs affordance inference
 * and prints the planned scope).
 *
 * Spec: docs/hearth-methodology-overlay-bundle-v1.md, docs/hearth-pedagogy-lens-bundle-v1.md.
 */

import 'dotenv/config';
import { createClient, type SanityClient } from '@sanity/client';
import {
  runBundleJob,
  ALL_PEDAGOGIES,
  type GenerationScope,
} from '../claude-kindling/library/build-mode/bundle-orchestrator';
import type { PracticeContext } from '../claude-kindling/library/build-mode/methodology-overlay-generation';
import type { PathwayType, PracticeKey } from '../claude-kindling/library/build-mode/affordance-inference';
import {
  inferAffordances,
  parseDurationMinutes,
} from '../claude-kindling/library/build-mode/affordance-inference';

interface CliArgs {
  moduleId: string;
  scope: 'curated' | 'all' | 'parent-built';
  familyPedagogyKey?: string;
  familyPracticeKeys?: string[];
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: Partial<CliArgs> = { scope: 'curated', dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--module') args.moduleId = argv[++i];
    else if (a === '--scope') args.scope = argv[++i] as CliArgs['scope'];
    else if (a === '--family-pedagogy') args.familyPedagogyKey = argv[++i];
    else if (a === '--family-practices') args.familyPracticeKeys = argv[++i].split(',');
    else if (a === '--dry-run') args.dryRun = true;
  }
  if (!args.moduleId) throw new Error('--module <sanityModuleId> is required');
  if (args.scope === 'parent-built' && !args.familyPedagogyKey) {
    throw new Error('--scope parent-built requires --family-pedagogy <slug>');
  }
  return args as CliArgs;
}

function makeClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
  const token = process.env.SANITY_API_TOKEN;
  if (!projectId || !token) {
    throw new Error('Sanity creds missing: NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN required');
  }
  return createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token });
}

async function fetchModule(client: SanityClient, moduleId: string) {
  const query = `*[_type == "module" && _id == $id][0]{
    _id, title, targetUnderstanding, createdVia,
    duration, ageRange,
    "capabilityThreads": capabilityThreads[]->_id,
    "threadDomains": capabilityThreads[]->domain,
    "approaches": approaches[]->{title, modality, description,
      "activities": activities[]->{title, summary, "instructions": pt::text(instructions)}
    }
  }`;
  return client.fetch(query, { id: moduleId });
}

async function fetchPracticeCatalog(client: SanityClient): Promise<Record<string, PracticeContext>> {
  const docs = await client.fetch<
    Array<{ key: string; practiceVocabulary?: string[]; themeKeywords?: string[]; anchorPedagogies?: { slug: string }[] }>
  >(`*[_type == "practice"]{
    key, practiceVocabulary, themeKeywords,
    "anchorPedagogies": anchorPedagogies[]->{ slug }
  }`);
  const catalog: Record<string, PracticeContext> = {};
  for (const d of docs) {
    catalog[d.key] = {
      practiceKey: d.key,
      practiceVocabulary: d.practiceVocabulary ?? [],
      themeKeywords: d.themeKeywords ?? [],
      anchorPedagogyKeys: (d.anchorPedagogies ?? []).map((a) => a.slug),
    };
  }
  return catalog;
}

async function fetchBannedPhrases(client: SanityClient): Promise<string[]> {
  const set = await client.fetch<{ phrases?: { phrase: string }[] } | null>(
    `*[_type == "bannedPhraseSet"][0]{ phrases }`,
  );
  return (set?.phrases ?? []).map((p) => p.phrase).filter(Boolean);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const client = makeClient();

  console.log(`\n🔬 bundle-job`);
  console.log(`   module: ${args.moduleId}`);
  console.log(`   scope: ${args.scope}`);
  if (args.scope === 'parent-built') {
    console.log(`   pedagogy: ${args.familyPedagogyKey}`);
    console.log(`   practices: ${args.familyPracticeKeys?.join(', ') ?? '(none)'}`);
  }
  console.log(`   dry-run: ${args.dryRun ? 'yes' : 'no'}\n`);

  const [moduleDoc, practiceCatalog, bannedPhrases] = await Promise.all([
    fetchModule(client, args.moduleId),
    fetchPracticeCatalog(client),
    fetchBannedPhrases(client),
  ]);
  if (!moduleDoc) throw new Error(`Module not found: ${args.moduleId}`);

  const activityDescriptions: string[] = (moduleDoc.approaches ?? [])
    .flatMap((a: { activities?: Array<{ title?: string; summary?: string; instructions?: string }> }) =>
      (a.activities ?? []).map((act) =>
        [act.title, act.summary, act.instructions].filter(Boolean).join(' — '),
      ),
    )
    .filter(Boolean);

  const durationMinutes = parseDurationMinutes(
    moduleDoc.duration ? `${moduleDoc.duration.min}–${moduleDoc.duration.max} min` : null,
  );

  const moduleData = {
    title: moduleDoc.title ?? '',
    summary: moduleDoc.targetUnderstanding ?? '',
    pathway: (moduleDoc.createdVia ?? 'editorial') as PathwayType,
    capabilityThreads: moduleDoc.capabilityThreads ?? [],
    threadDomains: (moduleDoc.threadDomains ?? []).filter(Boolean),
    ageRange: moduleDoc.ageRange ?? { min: 5, max: 12 },
    durationLabel: moduleDoc.duration ? `${moduleDoc.duration.min}–${moduleDoc.duration.max} min` : null,
    activityDescriptions,
  };

  if (args.dryRun) {
    const inference = inferAffordances({
      pathway: moduleData.pathway,
      threadDomains: moduleData.threadDomains,
      durationMinutes,
      activityText: activityDescriptions.join(' '),
      biasPedagogy: args.familyPedagogyKey,
    });
    const pedagogyScope =
      args.scope === 'parent-built' ? [args.familyPedagogyKey!] : [...ALL_PEDAGOGIES];
    const practiceScope: PracticeKey[] =
      args.scope === 'parent-built'
        ? inference.affordances.filter((a) => args.familyPracticeKeys?.includes(a))
        : inference.affordances;
    console.log('Dry run — would attempt:');
    console.log(`  pedagogies: ${pedagogyScope.length} (${pedagogyScope.join(', ')})`);
    console.log(`  practices: ${practiceScope.length} (${practiceScope.join(', ')})`);
    console.log(`  affordances: ${inference.affordances.join(', ')}`);
    console.log(`  est. tokens: ~${pedagogyScope.length * 3000 + practiceScope.length * 1500}`);
    console.log(`  banned phrases loaded: ${bannedPhrases.length}`);
    console.log(`  practices in catalog: ${Object.keys(practiceCatalog).length}`);
    return;
  }

  const scope: GenerationScope =
    args.scope === 'parent-built'
      ? {
          kind: 'parent-built',
          familyPedagogyKey: args.familyPedagogyKey!,
          familyPracticeKeys: args.familyPracticeKeys ?? [],
        }
      : args.scope === 'all'
        ? { kind: 'all' }
        : { kind: 'curated' };

  const result = await runBundleJob(client, {
    moduleId: args.moduleId,
    moduleData,
    practiceCatalog,
    bannedPhrases,
    scope,
    dryRun: false,
  });

  console.log('\n✓ done');
  console.log(`  affordances: ${result.affordances.join(', ')}`);
  console.log(`  pedagogy bundles: ${result.pedagogyLensBundles.length} → lensStatus=${result.lensStatus}`);
  console.log(`  methodology overlays: ${result.methodologyOverlays.length} → methodologyStatus=${result.methodologyStatus}`);
  if (Object.keys(result.diagnostics.skippedFor).length) {
    console.log('  skipped:');
    for (const [k, v] of Object.entries(result.diagnostics.skippedFor)) {
      console.log(`    - ${k}: ${v}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
