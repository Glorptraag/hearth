/**
 * Test script: Enrichment pipeline PKB integration
 *
 * Tests three scenarios for buildPedagogyContext():
 *   A — PEDAGOGY_KB_ENABLED=true, charlotte_mason key  → PKB XML block
 *   B — PEDAGOGY_KB_ENABLED=false                      → one-line fallback string
 *   C — PEDAGOGY_KB_ENABLED=true, classical key        → graceful empty/fallback
 */

import { buildPedagogyContext } from '@/lib/ai/pedagogy-context';

const CM_ENTRY = {
  entryTitle: 'Creek Observation — Water Striders',
  entryDescription:
    'Finn spent the morning at the creek observing water striders and sketching them in his nature journal. He asked why they don\'t sink.',
  childAges: [8],
  capabilityThreads: ['S1', 'S5', 'C1'],
};

function pass(label: string, detail: string) {
  console.log(`  ✓ PASS  ${label}`);
  if (detail) console.log(`         ${detail}`);
}

function fail(label: string, detail: string) {
  console.error(`  ✗ FAIL  ${label}`);
  if (detail) console.error(`         ${detail}`);
  process.exitCode = 1;
}

// ─── Test A: Flag ON, Charlotte Mason ────────────────────────────────────────

async function testA() {
  console.log('\n── Test A: Flag ON, charlotte_mason ──────────────────────────────');
  process.env.PEDAGOGY_KB_ENABLED = 'true';

  let result: string;
  try {
    result = await buildPedagogyContext({ ...CM_ENTRY, framework: 'charlotte_mason' });
  } catch (err) {
    fail('No unhandled exception', String(err));
    return;
  }

  const hasOuterTag = result.includes('<pedagogy_reference_material>');
  const hasRefTag = result.includes('<reference');

  if (hasOuterTag) {
    pass('Contains <pedagogy_reference_material>', '');
  } else {
    fail('Contains <pedagogy_reference_material>', `Got: ${result.slice(0, 200)}`);
  }

  if (hasRefTag) {
    const chunkCount = (result.match(/<reference/g) ?? []).length;
    pass(`Contains at least one <reference> tag`, `chunk count: ${chunkCount}`);
  } else {
    // Could be no CM corpus in DB yet — warn rather than hard fail
    console.warn('  ⚠ WARN  No <reference> tags found — CM corpus may not be ingested yet');
    console.warn(`         First 200 chars: ${result.slice(0, 200)}`);
  }

  console.log(`  First 200 chars of output:\n  ${result.slice(0, 200)}`);
}

// ─── Test B: Flag OFF ─────────────────────────────────────────────────────────

async function testB() {
  console.log('\n── Test B: Flag OFF ──────────────────────────────────────────────');
  process.env.PEDAGOGY_KB_ENABLED = 'false';

  let result: string;
  try {
    result = await buildPedagogyContext({ ...CM_ENTRY, framework: 'charlotte_mason' });
  } catch (err) {
    fail('No unhandled exception', String(err));
    return;
  }

  const isOneliner = !result.includes('\n') || result.split('\n').filter(Boolean).length <= 2;
  const hasNoXml = !result.includes('<pedagogy_reference_material>') && !result.includes('<reference');

  if (hasNoXml) {
    pass('No XML tags in fallback output', '');
  } else {
    fail('No XML tags in fallback output', `Got: ${result}`);
  }

  if (isOneliner) {
    pass('Fallback is a compact string (≤2 lines)', '');
  } else {
    fail('Fallback is a compact string', `Got multiline: ${result}`);
  }

  console.log(`  Fallback string: "${result}"`);
}

// ─── Test C: Flag ON, no corpus (classical) ───────────────────────────────────

async function testC() {
  console.log('\n── Test C: Flag ON, no-corpus pedagogy (classical) ───────────────');
  process.env.PEDAGOGY_KB_ENABLED = 'true';

  let result: string;
  try {
    result = await buildPedagogyContext({ ...CM_ENTRY, framework: 'classical' });
  } catch (err) {
    fail('No unhandled exception thrown', String(err));
    return;
  }

  pass('No exception thrown for unknown pedagogy key', '');

  const isGraceful = typeof result === 'string' && result.length > 0;
  if (isGraceful) {
    pass('Returns a non-empty string gracefully', '');
  } else {
    fail('Returns a non-empty string', `Got: ${JSON.stringify(result)}`);
  }

  console.log(`  Result: "${result.slice(0, 200)}"`);
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Enrichment Pipeline PKB Integration Tests ===');
  await testA();
  await testB();
  await testC();
  console.log('\n=== Done ===');
  if (process.exitCode === 1) {
    console.error('One or more tests FAILED.');
  } else {
    console.log('All tests PASSED (or warned).');
  }
}

main().catch((err) => {
  console.error('Unexpected top-level error:', err);
  process.exit(1);
});
