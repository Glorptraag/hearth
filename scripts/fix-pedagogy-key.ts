import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // All current rows are charlotte_mason docs — set pedagogy_key from the sanity_doc_id
  // IDs follow pattern: pedagogyXxx.cm.NNN → framework = charlotte_mason
  const result = await sql`
    UPDATE pedagogy_knowledge_chunks
    SET pedagogy_key = 'charlotte_mason'
    WHERE pedagogy_key = ''
    RETURNING id
  ` as Array<{ id: string }>;
  console.log(`Updated ${result.length} rows to pedagogy_key='charlotte_mason'`);
}

main().catch(console.error);
