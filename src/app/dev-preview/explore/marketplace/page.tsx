import { sanityClient } from '@/lib/sanity/client';
import { PACKS_QUERY } from '@/lib/sanity/queries';
import { DevMarketplaceClient } from './DevMarketplaceClient';
import type { SanityPack } from '@/components/screens/MarketplaceCard';

const FALLBACK_PACKS: SanityPack[] = [
  {
    _id: 'fallback-jumpstart-classical',
    title: 'Jumpstart Classical',
    creator: 'Hearth Editorial',
    subjects: ['english', 'hass'],
    ageRange: { min: 5, max: 8 },
    moduleCount: 6,
    availability: 'included',
    description: 'An accessible introduction to classical education — mythology, great literature, and the ancient world told through story and discussion.',
  },
  {
    _id: 'fallback-nature-explorers',
    title: 'Nature Explorers',
    creator: 'Sarah Pemberton',
    subjects: ['science', 'hpe'],
    ageRange: { min: 6, max: 10 },
    moduleCount: 5,
    availability: 'included',
    description: 'Hands-on field guides, nature journals, and outdoor learning sequences for young naturalists.',
  },
  {
    _id: 'fallback-kitchen-mathematics',
    title: 'Kitchen Mathematics',
    creator: 'Hearth Editorial',
    subjects: ['mathematics'],
    ageRange: { min: 7, max: 11 },
    moduleCount: 4,
    availability: 'included',
    description: 'Real-world measurement, fractions, and number sense taught through cooking and baking.',
  },
];

export default async function DevPreviewMarketplace() {
  let packs: SanityPack[];
  try {
    const sanityPacks: SanityPack[] = await sanityClient.fetch(PACKS_QUERY);
    packs = sanityPacks && sanityPacks.length > 0 ? sanityPacks : FALLBACK_PACKS;
  } catch {
    packs = FALLBACK_PACKS;
  }

  return <DevMarketplaceClient packs={packs} />;
}
