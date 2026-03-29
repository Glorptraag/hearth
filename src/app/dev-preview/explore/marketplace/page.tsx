import { sanityClient } from '@/lib/sanity/client';
import { PACKS_QUERY } from '@/lib/sanity/queries';
import { DevMarketplaceClient } from './DevMarketplaceClient';

interface SanityPack {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  subjects: string[];
  ageRange: string | { min: number; max: number };
  moduleCount: number;
  totalActivities: number;
  availability: string;
  badgeCount: number;
}

function formatAgeRange(ageRange: string | { min: number; max: number } | null | undefined): string {
  if (!ageRange) return 'All ages';
  if (typeof ageRange === 'string') return ageRange;
  return `${ageRange.min}–${ageRange.max} yrs`;
}

import type { Pack } from '@/components/screens/MarketplaceCard';

const FALLBACK_PACKS: Pack[] = [
  {
    id: 'jumpstart-classical',
    title: 'Jumpstart Classical',
    creator: 'Hearth Editorial',
    subjects: ['english', 'hass'],
    ageRange: '5–8 yrs',
    moduleCount: 6,
    emoji: '📜',
    membership: true,
    description: 'An accessible introduction to classical education — mythology, great literature, and the ancient world told through story and discussion.',
  },
  {
    id: 'nature-explorers',
    title: 'Nature Explorers',
    creator: 'Sarah Pemberton',
    subjects: ['science', 'hpe'],
    ageRange: '6–10 yrs',
    moduleCount: 5,
    emoji: '🌿',
    membership: true,
    description: 'Hands-on field guides, nature journals, and outdoor learning sequences for young naturalists.',
  },
  {
    id: 'kitchen-mathematics',
    title: 'Kitchen Mathematics',
    creator: 'Hearth Editorial',
    subjects: ['mathematics'],
    ageRange: '7–11 yrs',
    moduleCount: 4,
    emoji: '🍳',
    membership: true,
    description: 'Real-world measurement, fractions, and number sense taught through cooking and baking.',
  },
];

const SUBJECT_EMOJI: Record<string, string> = {
  english: '📖',
  mathematics: '🔢',
  science: '🔬',
  hass: '🌏',
  arts: '🎨',
  technologies: '💻',
  hpe: '🏃',
  languages: '🗣️',
};

export default async function DevPreviewMarketplace() {
  let packs;
  try {
    const sanityPacks: SanityPack[] = await sanityClient.fetch(PACKS_QUERY);
    if (sanityPacks && sanityPacks.length > 0) {
      packs = sanityPacks.map((p) => ({
        id: p._id,
        title: p.title,
        creator: 'Hearth Editorial',
        subjects: (p.subjects ?? []) as Array<'english' | 'mathematics' | 'science' | 'hass' | 'arts' | 'technologies' | 'hpe' | 'languages'>,
        ageRange: formatAgeRange(p.ageRange),
        moduleCount: p.moduleCount ?? 0,
        emoji: SUBJECT_EMOJI[p.subjects?.[0]] ?? '📦',
        membership: p.availability === 'included',
        price: p.availability === 'premium' ? '$12.00 AUD' : undefined,
        description: p.description ?? '',
      }));
    } else {
      packs = FALLBACK_PACKS;
    }
  } catch {
    packs = FALLBACK_PACKS;
  }

  return <DevMarketplaceClient packs={packs} />;
}
