/**
 * Standalone test script for pedagogy retrieval.
 * Run: npx dotenv-cli -e .env.local -- npx tsx scripts/test-retrieval.ts
 */
import { retrievePedagogyChunks } from '../src/lib/pedagogy/retrieval';
import type { RetrievedChunk } from '../src/lib/pedagogy/retrieval';

const CM_AGE_RANGE = { min: 6, max: 12 };

const payloads = [
  {
    label: 'Payload 1 — Nature observation',
    request: {
      pedagogyKey: 'charlotte_mason',
      loggerEntryText:
        "We spent an hour at the creek today. Finn noticed the water striders moving across the surface and asked why they don't sink. He sketched three of them in his nature journal.",
      capabilityThreads: ['science', 'nature_study'],
      ageRange: CM_AGE_RANGE,
      situationalSignals: ['outdoor', 'nature_journal', 'child_led_inquiry'],
      topN: 8,
    },
  },
  {
    label: 'Payload 2 — Narration',
    request: {
      pedagogyKey: 'charlotte_mason',
      loggerEntryText:
        "After reading two chapters of The Story of the World, Lily narrated back the entire section on Roman roads. She remembered details I had forgotten. We talked about why the Romans built them so straight.",
      capabilityThreads: ['history', 'literacy', 'narration'],
      ageRange: CM_AGE_RANGE,
      situationalSignals: ['narration', 'living_books', 'history'],
      topN: 8,
    },
  },
  {
    label: 'Payload 3 — Parent anxiety',
    request: {
      pedagogyKey: 'charlotte_mason',
      loggerEntryText:
        "I'm worried we're not covering enough maths. Finn is 9 and still counts on his fingers sometimes. I feel like we're falling behind compared to school kids.",
      capabilityThreads: ['mathematics'],
      ageRange: CM_AGE_RANGE,
      situationalSignals: ['parent_anxiety', 'comparison_to_school'],
      topN: 8,
    },
  },
];

function checkLayerBalance(chunks: RetrievedChunk[]): {
  sourceExcerpts: number;
  practicePatterns: number;
  workedExamples: number;
  pass: boolean;
} {
  const sourceExcerpts = chunks.filter((c) => c.layer === 'source_excerpt').length;
  const practicePatterns = chunks.filter((c) => c.layer === 'practice_pattern').length;
  const workedExamples = chunks.filter((c) => c.layer === 'worked_example').length;
  return {
    sourceExcerpts,
    practicePatterns,
    workedExamples,
    pass: sourceExcerpts >= 2 && practicePatterns >= 1 && workedExamples >= 1,
  };
}

async function run() {
  let allPassed = true;

  for (const { label, request } of payloads) {
    console.log('\n' + '='.repeat(60));
    console.log(label);
    console.log('='.repeat(60));

    const result = await retrievePedagogyChunks(request);

    console.log(`\nChunks returned: ${result.chunks.length}`);
    console.log(`Total matched: ${result.totalMatched}`);
    console.log(`Latency: ${result.retrievalLatencyMs}ms`);
    console.log(`Fallback used: ${result.fallbackUsed}`);

    if (result.chunks.length === 0) {
      console.error('FAIL: No chunks returned');
      allPassed = false;
      continue;
    }

    // Layer balance check
    const balance = checkLayerBalance(result.chunks);
    console.log(`\nLayer distribution:`);
    console.log(`  source_excerpt: ${balance.sourceExcerpts} (need >=2)`);
    console.log(`  practice_pattern: ${balance.practicePatterns} (need >=1)`);
    console.log(`  worked_example: ${balance.workedExamples} (need >=1)`);

    const layersFound = new Set(result.chunks.map((c) => c.layer));
    for (const layer of Array.from(layersFound).sort()) {
      const count = result.chunks.filter((c) => c.layer === layer).length;
      if (layer !== 'source_excerpt' && layer !== 'practice_pattern' && layer !== 'worked_example') {
        console.log(`  ${layer}: ${count}`);
      }
    }

    if (!balance.pass) {
      console.error(`FAIL: Layer balance not met`);
      allPassed = false;
    } else {
      console.log(`  Layer balance: PASS`);
    }

    // Similarity scores check
    const lowScore = result.chunks.filter((c) => c.similarityScore <= 0.3);
    if (lowScore.length > 0) {
      console.warn(`WARN: ${lowScore.length} chunks have similarity <= 0.3`);
    }

    const minScore = Math.min(...result.chunks.map((c) => c.similarityScore));
    const maxScore = Math.max(...result.chunks.map((c) => c.similarityScore));
    console.log(`\nSimilarity scores: min=${minScore.toFixed(4)}, max=${maxScore.toFixed(4)}`);

    if (minScore <= 0.3) {
      console.warn(`WARN: min similarity score ${minScore.toFixed(4)} <= 0.3`);
    } else {
      console.log(`  Score threshold (>0.3): PASS`);
    }

    // matchReasons check
    const emptyReasons = result.chunks.filter((c) => !c.matchReasons || c.matchReasons.length === 0);
    console.log(`\nmatchReasons populated: ${result.chunks.length - emptyReasons.length}/${result.chunks.length}`);
    if (emptyReasons.length === result.chunks.length) {
      // All empty is a warn, not a hard fail (semantic similarity alone is valid)
      console.warn(`WARN: No matchReasons populated (metadata boosts may not have triggered)`);
    } else {
      console.log(`  matchReasons: PASS`);
    }

    // Print chunk summary
    console.log('\nTop chunks:');
    for (const chunk of result.chunks.slice(0, 5)) {
      console.log(`  [${chunk.layer}] score=${chunk.similarityScore.toFixed(4)} reasons=${JSON.stringify(chunk.matchReasons)}`);
      console.log(`    "${chunk.text.slice(0, 100)}..."`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
  console.log('='.repeat(60));
  process.exit(allPassed ? 0 : 1);
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
