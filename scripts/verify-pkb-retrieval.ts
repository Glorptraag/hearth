/**
 * Hearth PKB — golden-query retrieval verifier (PLAN-pkb-completion E8).
 *
 * Runs Logger-voice queries from scripts/data/pkb-golden-queries.json through
 * the REAL retrieval code path (retrievePedagogyChunks → Voyage embedding →
 * pgvector → metadata rerank → layer / framework balancing) against the
 * populated index, and checks framework/layer-level expectations. It is an ops
 * tool for the flag-flip checklist (architecture doc §5), not a CI test — it
 * needs VOYAGE_API_KEY and a populated pedagogy_knowledge_chunks table.
 *
 * Run:   npm run verify:pkb:retrieval
 * Flags: --framework <key>   only queries for this pedagogyKey (e.g. montessori, eclectic)
 *        --query <id>        only this query id
 *        --delay <ms>        pause between queries (default 21000 — Voyage free tier is 3 RPM)
 *        --top <n>           chunks to request per query (default 8)
 *        --json              machine-readable summary on stdout
 *
 * Exit 1 if any non-optional expectation fails; 0 otherwise. Queries marked
 * `optional: true` (frameworks not yet populated) are reported, never failed.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { readFileSync } from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { evaluateGoldenQuery, type GoldenQuery, type GoldenVerdict as Verdict } from '../src/lib/pedagogy/golden-queries';

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  if (!process.env.VOYAGE_API_KEY) throw new Error('VOYAGE_API_KEY is not set (the verifier embeds each query for real)');

  const { retrievePedagogyChunks } = await import('../src/lib/pedagogy/retrieval');

  const fixture = JSON.parse(
    readFileSync(path.resolve(process.cwd(), 'scripts/data/pkb-golden-queries.json'), 'utf8'),
  ) as { queries: GoldenQuery[] };

  const onlyFramework = flag('--framework');
  const onlyQuery = flag('--query');
  const delayMs = Number(flag('--delay') ?? 21_000);
  const topN = Number(flag('--top') ?? 8);
  const asJson = process.argv.includes('--json');

  const queries = fixture.queries.filter(
    (q) => (!onlyFramework || q.pedagogyKey === onlyFramework) && (!onlyQuery || q.id === onlyQuery),
  );
  if (queries.length === 0) {
    console.error('No queries match the filters.');
    process.exit(2);
  }

  const verdicts: Verdict[] = [];
  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    if (i > 0 && delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    const ages = q.childAges ?? [];
    const res = await retrievePedagogyChunks({
      pedagogyKey: q.pedagogyKey,
      capabilityThreads: q.capabilityThreads ?? [],
      ageRange: { min: ages.length ? Math.min(...ages) : 0, max: ages.length ? Math.max(...ages) : 18 },
      activityType: q.activityType,
      situationalSignals: q.situationalSignals ?? [],
      loggerEntryText: q.text,
      topN,
    });
    const v = evaluateGoldenQuery(q, res);
    verdicts.push(v);

    if (!asJson) {
      const mark = v.passed ? '✓' : v.optional ? '○' : '✗';
      console.log(`\n${mark} ${v.id} [${v.pedagogyKey}] — ${v.returned}/${v.totalMatched} chunks, ${v.latencyMs}ms${v.fallbackUsed ? ', FALLBACK' : ''}`);
      for (const r of v.rows) {
        console.log(`   ${String(r.rank).padStart(2)}. ${r.score}  ${r.framework.padEnd(16)} ${r.layer.padEnd(22)} ${r.id}`);
        if (r.reasons !== '—') console.log(`       ${r.reasons}`);
      }
      for (const f of v.failures) console.log(`   ! ${f}${v.optional ? ' (optional — not counted)' : ''}`);
    }
  }

  const hardFailures = verdicts.filter((v) => !v.passed && !v.optional);
  const softFailures = verdicts.filter((v) => !v.passed && v.optional);
  if (asJson) {
    console.log(JSON.stringify({ total: verdicts.length, passed: verdicts.filter((v) => v.passed).length, hardFailures: hardFailures.map((v) => v.id), softFailures: softFailures.map((v) => v.id), verdicts }, null, 2));
  } else {
    console.log(`\n${verdicts.length} queries · ${verdicts.filter((v) => v.passed).length} passed · ${hardFailures.length} failed · ${softFailures.length} optional not yet met`);
  }
  process.exit(hardFailures.length > 0 ? 1 : 0);
}

if (process.argv[1] && /verify-pkb-retrieval/.test(process.argv[1])) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
