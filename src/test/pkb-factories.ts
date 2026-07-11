/**
 * DB-aware factories for Pedagogy Knowledge Base (PKB) integration tests.
 *
 * `pedagogy_knowledge_chunks` has no Drizzle schema object (it's written and
 * read via raw SQL — see src/app/api/pedagogy/sanity-webhook/route.ts and
 * src/lib/pedagogy/retrieval.ts), so this factory inserts it with a raw
 * `db.execute(sql\`...\`)` rather than a typed `.insert()`.
 *
 * Use ONLY in integration tests, same as db-factories.ts.
 */
import { sql } from 'drizzle-orm';
import { db as realDb } from '@/lib/db';
import { EMBEDDING_DIMENSIONS } from '@/lib/pedagogy/embedding';

type Db = typeof realDb;

/**
 * Build a deterministic, L2-normalised embedding vector of length
 * EMBEDDING_DIMENSIONS from a sparse index→weight map. Identical `components`
 * always produce cosine similarity 1 against each other; vectors built from
 * disjoint index sets have cosine similarity 0 (orthogonal).
 */
export function unitVector(components: Record<number, number>): number[] {
  const vec = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  for (const [indexStr, weight] of Object.entries(components)) {
    const index = Number(indexStr);
    if (index < 0 || index >= EMBEDDING_DIMENSIONS) {
      throw new Error(
        `unitVector: index ${index} out of range for ${EMBEDDING_DIMENSIONS}-dim embedding`
      );
    }
    vec[index] = weight;
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

/**
 * Insert a pedagogy_knowledge_chunks row directly (no ORM model exists for
 * this table). Mirrors the shape the sanity-webhook route writes in
 * production: id, pedagogy_key, layer, text, embedding, metadata,
 * content_hash, sanity_doc_id, updated_at.
 */
export async function insertPedagogyChunk(
  db: Db,
  args: {
    id: string;
    pedagogyKey: string;
    layer: string;
    text?: string;
    metadata?: Record<string, unknown>;
    embedding: number[];
  }
): Promise<void> {
  const { id, pedagogyKey, layer, text = 'chunk text', metadata = {}, embedding } = args;
  const embeddingLiteral = `[${embedding.join(',')}]`;

  await db.execute(sql`
    INSERT INTO pedagogy_knowledge_chunks (id, pedagogy_key, layer, text, embedding, metadata, content_hash, sanity_doc_id, updated_at)
    VALUES (
      ${id},
      ${pedagogyKey},
      ${layer},
      ${text},
      ${embeddingLiteral}::vector(1024),
      ${JSON.stringify(metadata)}::jsonb,
      ${id},
      ${id},
      NOW()
    )
  `);
}
