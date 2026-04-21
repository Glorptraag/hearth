import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { buildChunkText, sanityTypeToPkbLayer } from '../src/lib/pedagogy/chunk-builder';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const PKB_TYPES = [
  'pedagogySourceExcerpt',
  'pedagogyPracticePattern',
  'pedagogyObservationalMarker',
  'pedagogyFacilitationVocabulary',
  'pedagogyContraindication',
  'pedagogyWorkedExample',
] as const;

async function main() {
  const docs = await sanity.fetch<Array<Record<string,unknown>>>(`
    *[_type in [${PKB_TYPES.map(t => '"' + t + '"').join(',')}]
      && status == "published"
      && suggestedDraft == false
      && framework->slug == "charlotte_mason"
    ] { _id, _type, framework->{ slug }, ... }
  `);

  let totalChars = 0;
  for (const doc of docs) {
    const layer = sanityTypeToPkbLayer(doc._type as string);
    if (!layer) continue;
    try {
      const text = buildChunkText(layer, doc);
      totalChars += text.length;
    } catch(e: unknown) {
      console.warn('skip:', doc._id, (e as Error).message);
    }
  }

  console.log('Total docs: ' + docs.length);
  console.log('Total chars: ' + totalChars);
  console.log('Estimated tokens: ~' + Math.round(totalChars / 4));
}

main().catch(console.error);
