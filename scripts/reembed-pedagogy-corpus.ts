/**
 * Hearth PKB — Batch Re-embedding Script
 *
 * Queries all published, human-confirmed PKB documents from Sanity,
 * compares content hashes against the DB, and re-embeds only changed
 * or new documents via Voyage AI.
 *
 * Run:   npx tsx scripts/reembed-pedagogy-corpus.ts
 * Flags: --dry-run   Print what would be upserted without writing
 *        --force     Re-embed all docs regardless of hash match
 *        --framework charlotte_mason|classical|montessori|waldorf_steiner|unschooling|eclectic
 *                    Restrict to one framework
 */

import { createClient } from '@sanity/client';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { buildChunkText, hashChunk, sanityTypeToPkbLayer } from '../src/lib/pedagogy/chunk-builder';
import { embedBatch } from '../src/lib/pedagogy/embedding';
import type { PkbLayer } from '../src/lib/pedagogy/chunk-builder';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ─── CLI flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const frameworkFlag = (() => {
  const i = args.indexOf('--framework');
  return i !== -1 ? args[i + 1] : null;
})();

// ─── Clients ──────────────────────────────────────────────────────────────────

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const sql = neon(process.env.DATABASE_URL!);

// ─── Types ────────────────────────────────────────────────────────────────────

const PKB_TYPES = [
  'pedagogySourceExcerpt',
  'pedagogyPracticePattern',
  'pedagogyObservationalMarker',
  'pedagogyFacilitationVocabulary',
  'pedagogyContraindication',
  'pedagogyWorkedExample',
] as const;

interface SanityPkbDoc {
  _id: string;
  _type: string;
  framework?: { slug?: string };
  [key: string]: unknown;
}

interface ExistingChunk {
  id: string;
  content_hash: string;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchPkbDocs(frameworkKey: string | null): Promise<SanityPkbDoc[]> {
  const typeFilter = PKB_TYPES.map((t) => `"${t}"`).join(', ');
  const frameworkFilter = frameworkKey
    ? ` && framework->slug == "${frameworkKey}"`
    : '';

  const query = `
    *[_type in [${typeFilter}]
      && status == "published"
      && suggestedDraft == false
      ${frameworkFilter}
    ] {
      ...,
      _id,
      _type,
      "framework": framework->{ slug }
    }
  `;

  return sanity.fetch<SanityPkbDoc[]>(query);
}

async function fetchExistingHashes(): Promise<Map<string, string>> {
  const rows = (await sql`
    SELECT id, content_hash FROM pedagogy_knowledge_chunks
  `) as ExistingChunk[];
  return new Map(rows.map((r) => [r.id, r.content_hash]));
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

interface ChunkRow {
  id: string;
  pedagogy_key: string;
  layer: PkbLayer;
  text: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  content_hash: string;
  sanity_doc_id: string;
}

async function upsertChunks(chunks: ChunkRow[]): Promise<void> {
  for (const c of chunks) {
    // pgvector expects the embedding as a string literal '[n,n,n,...]'
    const embeddingLiteral = `[${c.embedding.join(',')}]`;
    await sql`
      INSERT INTO pedagogy_knowledge_chunks
        (id, pedagogy_key, layer, text, embedding, metadata, content_hash, sanity_doc_id, updated_at)
      VALUES (
        ${c.id},
        ${c.pedagogy_key},
        ${c.layer},
        ${c.text},
        ${embeddingLiteral}::vector(1024),
        ${JSON.stringify(c.metadata)},
        ${c.content_hash},
        ${c.sanity_doc_id},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        pedagogy_key  = EXCLUDED.pedagogy_key,
        layer         = EXCLUDED.layer,
        text          = EXCLUDED.text,
        embedding     = EXCLUDED.embedding,
        metadata      = EXCLUDED.metadata,
        content_hash  = EXCLUDED.content_hash,
        sanity_doc_id = EXCLUDED.sanity_doc_id,
        updated_at    = NOW()
    `;
  }
}

// ─── Metadata extraction ──────────────────────────────────────────────────────

function extractMetadata(doc: SanityPkbDoc): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  if (Array.isArray(doc.tags)) meta.tags = doc.tags;
  if (doc.ageRange) meta.ageRange = doc.ageRange;
  if (Array.isArray(doc.capabilityThreads)) meta.capabilityThreads = doc.capabilityThreads;
  return meta;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\nHearth PKB re-embedding${DRY_RUN ? ' [DRY RUN]' : ''}${FORCE ? ' [FORCE]' : ''}`);
  if (frameworkFlag) console.log(`  Framework filter: ${frameworkFlag}`);

  // 1. Fetch source docs
  const docs = await fetchPkbDocs(frameworkFlag);
  console.log(`\nFetched ${docs.length} published, confirmed PKB docs from Sanity`);

  if (docs.length === 0) {
    console.log('Nothing to embed. Exiting.');
    return;
  }

  // 2. Load existing hashes
  const existingHashes = FORCE ? new Map<string, string>() : await fetchExistingHashes();
  console.log(`Loaded ${existingHashes.size} existing chunk hashes from DB`);

  // 3. Build chunk texts and filter to changed/new
  const pending: Array<{ doc: SanityPkbDoc; layer: PkbLayer; text: string; hash: string }> = [];
  let skipped = 0;

  for (const doc of docs) {
    const layer = sanityTypeToPkbLayer(doc._type);
    if (!layer) {
      console.warn(`  WARN: unknown _type "${doc._type}" — skipping ${doc._id}`);
      continue;
    }

    let text: string;
    try {
      text = buildChunkText(layer, doc as Record<string, unknown>);
    } catch (err) {
      console.warn(`  WARN: buildChunkText failed for ${doc._id}: ${(err as Error).message}`);
      continue;
    }

    if (!text.trim()) {
      console.warn(`  WARN: empty chunk text for ${doc._id} — skipping`);
      continue;
    }

    const hash = hashChunk(text);
    const existingHash = existingHashes.get(doc._id);

    if (!FORCE && existingHash === hash) {
      skipped++;
      continue;
    }

    pending.push({ doc, layer, text, hash });
  }

  console.log(`\n  ${skipped} unchanged (skipped)`);
  console.log(`  ${pending.length} to embed`);

  if (pending.length === 0) {
    console.log('\nAll chunks up to date. Done.');
    return;
  }

  if (DRY_RUN) {
    console.log('\nDry run — would embed:');
    for (const { doc, layer } of pending) {
      const fw = doc.framework?.slug ?? 'unknown';
      console.log(`  ${doc._id}  [${fw}/${layer}]`);
    }
    return;
  }

  // 4. Embed in batches
  const texts = pending.map((p) => p.text);
  console.log(`\nEmbedding ${texts.length} chunks via Voyage AI…`);
  const embeddings = await embedBatch(texts);
  console.log('Embedding complete.');

  // 5. Upsert
  const chunks: ChunkRow[] = pending.map((p, i) => ({
    id: p.doc._id,
    pedagogy_key: p.doc.framework?.slug ?? '',
    layer: p.layer,
    text: p.text,
    embedding: embeddings[i],
    metadata: extractMetadata(p.doc),
    content_hash: p.hash,
    sanity_doc_id: p.doc._id,
  }));

  console.log(`Upserting ${chunks.length} chunks into DB…`);
  await upsertChunks(chunks);

  // 6. Report
  console.log('\nDone.\n');
  const byFramework = new Map<string, number>();
  for (const c of chunks) {
    byFramework.set(c.pedagogy_key, (byFramework.get(c.pedagogy_key) ?? 0) + 1);
  }
  for (const [fw, count] of [...byFramework.entries()].sort()) {
    console.log(`  ${fw}: ${count} chunk${count !== 1 ? 's' : ''} upserted`);
  }
  console.log(`  Total: ${chunks.length}`);
}

run().catch((err) => {
  console.error('\nFatal:', err);
  process.exit(1);
});
