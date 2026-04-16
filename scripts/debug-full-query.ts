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

type DebugDoc = {
  _id: string;
  _type: string;
  framework?: { slug?: string | { current?: string } } | null;
};

async function main() {
  const docs = await sanity.fetch<DebugDoc[]>(`
    *[_type == "pedagogyContraindication" && status == "published" && suggestedDraft == false][0..1] {
      _id, _type, framework->{ slug }, ...
    }
  `);
  const doc = docs[0];
  console.log('doc.framework:', JSON.stringify(doc.framework));
  console.log('doc.framework?.slug:', doc.framework?.slug);
  console.log('typeof slug:', typeof doc.framework?.slug);
}

main().catch(console.error);
