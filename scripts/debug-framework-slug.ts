import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function main() {
  const docs = await sanity.fetch(`
    *[_type == "pedagogyContraindication" && status == "published" && suggestedDraft == false][0..2] {
      _id, _type, framework->{ _id, _type, slug, name }
    }
  `);
  console.log(JSON.stringify(docs, null, 2));
}

main().catch(console.error);
