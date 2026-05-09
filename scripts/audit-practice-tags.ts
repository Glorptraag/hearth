/**
 * Audit pedagogy_knowledge_chunks for practice-relevance theme coverage.
 *
 * Read-only diagnostic script. Reports per-practice:
 *   - how many chunks in `pedagogy_knowledge_chunks` carry at least one of the
 *     practice's `themeKeywords` in `metadata.themes[]`
 *   - which anchor-pedagogy corpora have zero coverage (would fall back to RAG-only retrieval)
 *
 * Use this before kicking off a curated-pack bundle generation run; thin theme coverage
 * means overlays will fall back to similarity-only retrieval and may produce thinner output.
 *
 * Usage: npx tsx scripts/audit-practice-tags.ts
 *
 * Spec: docs/hearth-methodology-overlay-bundle-v1.md §9.
 */

import 'dotenv/config';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';
import { createClient } from '@sanity/client';

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

interface PracticeRow {
  key: string;
  themeKeywords: string[];
  anchorPedagogies: string[];
}

async function loadPractices(): Promise<PracticeRow[]> {
  const docs = await sanity.fetch<
    Array<{ key: string; themeKeywords?: string[]; anchorPedagogies?: { slug: string }[] }>
  >(`*[_type == "practice"]{
    key, themeKeywords,
    "anchorPedagogies": anchorPedagogies[]->{ slug }
  }`);
  return docs.map((d) => ({
    key: d.key,
    themeKeywords: (d.themeKeywords ?? []).map((t) => t.toLowerCase()),
    anchorPedagogies: (d.anchorPedagogies ?? []).map((a) => a.slug),
  }));
}

async function chunkCounts(): Promise<Record<string, number>> {
  const rows = await db.execute<{ pedagogy_key: string; n: number }>(
    sql`SELECT pedagogy_key, COUNT(*)::int AS n FROM pedagogy_knowledge_chunks GROUP BY pedagogy_key`,
  );
  const out: Record<string, number> = {};
  for (const r of rows.rows ?? []) out[r.pedagogy_key] = r.n;
  return out;
}

async function chunksMatchingThemes(themes: string[]): Promise<{ pedagogy_key: string; n: number }[]> {
  if (themes.length === 0) return [];
  // Match if metadata->'themes' contains any of the keywords (case-insensitive comparison
  // after pulling them out — JSONB `?|` is exact-key, so we do array overlap on the JSON elements).
  const rows = await db.execute<{ pedagogy_key: string; n: number }>(
    sql`SELECT pedagogy_key, COUNT(*)::int AS n
        FROM pedagogy_knowledge_chunks
        WHERE EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(COALESCE(metadata->'themes', '[]'::jsonb)) t
          WHERE LOWER(t) = ANY(${themes})
        )
        GROUP BY pedagogy_key`,
  );
  return rows.rows ?? [];
}

async function main() {
  const [practices, totals] = await Promise.all([loadPractices(), chunkCounts()]);

  console.log(`\n📊 practice-tag audit\n`);
  console.log(`Per-pedagogy chunk totals:`);
  for (const [k, n] of Object.entries(totals).sort()) {
    console.log(`  ${k.padEnd(20)} ${n}`);
  }
  console.log('');

  let anyThin = false;
  for (const p of practices.sort((a, b) => a.key.localeCompare(b.key))) {
    const matches = await chunksMatchingThemes(p.themeKeywords);
    const matchByPedagogy: Record<string, number> = {};
    for (const m of matches) matchByPedagogy[m.pedagogy_key] = m.n;

    console.log(`▸ ${p.key}`);
    console.log(`    keywords: ${p.themeKeywords.join(', ') || '(none)'}`);
    if (p.anchorPedagogies.length === 0) {
      console.log(`    no anchor pedagogies — uses Sanity template fallback at gen time`);
    } else {
      for (const anchor of p.anchorPedagogies) {
        const total = totals[anchor] ?? 0;
        const matched = matchByPedagogy[anchor] ?? 0;
        const pct = total > 0 ? ((matched / total) * 100).toFixed(0) : '—';
        const flag = total > 0 && matched === 0 ? '  ⚠ NO TAG COVERAGE' : '';
        if (total > 0 && matched === 0) anyThin = true;
        console.log(`    ${anchor.padEnd(20)} ${matched}/${total} (${pct}%)${flag}`);
      }
    }
  }

  if (anyThin) {
    console.log(
      '\n⚠  At least one anchor corpus has zero matching theme tags for a practice. Overlay\n' +
        '   generation will fall back to similarity-only retrieval for those practices, which\n' +
        '   may produce thinner output. Recommended: extend metadata.themes on chunks in the\n' +
        '   affected corpora before running curated-pack generation.',
    );
  } else {
    console.log('\n✓ all practice-anchor combinations have at least one matching theme tag.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
