import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // Distribution by pedagogy_key and layer
  const dist = await sql`
    SELECT pedagogy_key, layer, count(*) as count
    FROM pedagogy_knowledge_chunks
    GROUP BY pedagogy_key, layer
    ORDER BY layer, pedagogy_key
  ` as Array<{ pedagogy_key: string; layer: string; count: string }>;

  console.log('\nDistribution:');
  let total = 0;
  for (const row of dist) {
    console.log(`  pedagogy_key="${row.pedagogy_key}" | layer=${row.layer} | count=${row.count}`);
    total += Number(row.count);
  }
  console.log(`  TOTAL: ${total}`);

  // Check embedding non-null and dimensions
  const sample = await sql`
    SELECT id, pedagogy_key, layer,
           embedding IS NOT NULL as has_embedding,
           vector_dims(embedding) as dims
    FROM pedagogy_knowledge_chunks
    LIMIT 5
  ` as Array<{ id: string; pedagogy_key: string; layer: string; has_embedding: boolean; dims: number }>;

  console.log('\nSample rows (embedding check):');
  for (const row of sample) {
    console.log(`  ${row.id} | key="${row.pedagogy_key}" | layer=${row.layer} | has_embedding=${row.has_embedding} | dims=${row.dims}`);
  }

  // Null embedding count
  const nullCheck = await sql`
    SELECT count(*) as null_count FROM pedagogy_knowledge_chunks WHERE embedding IS NULL
  ` as Array<{ null_count: string }>;
  console.log(`\nNull embeddings: ${nullCheck[0].null_count}`);
}

main().catch(console.error);
