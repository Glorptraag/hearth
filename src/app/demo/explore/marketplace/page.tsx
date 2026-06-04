'use client';

import { MarketplaceShell } from '@/app/(auth)/explore/marketplace/MarketplaceShell';
import type { SanityPack, Subject } from '@/components/screens/MarketplaceCard';
import { mockPacks } from '../../mock-data';

/**
 * Demo wrapper for the canonical Marketplace shell.
 * Pure cosmetic surface: no auth, no Sanity fetch, no Stripe checkout — the
 * Shell receives mock packs mapped onto the SanityPack shape and runs in
 * `mode="demo"` so every /api/* fetch is short-circuited.
 *
 * mockPacks uses {id, imageEmoji, moduleCount, status} which doesn't match
 * SanityPack ({_id, creator, totalActivities, availability, …}). Map only
 * the fields the Shell actually consumes; the rest are optional.
 */

const SUBJECT_VOCAB: ReadonlyArray<Subject> = [
  'english', 'mathematics', 'science', 'hass',
  'arts', 'technologies', 'hpe', 'languages',
];

function asSubjects(arr: readonly string[]): Subject[] {
  return arr.filter((s): s is Subject => (SUBJECT_VOCAB as readonly string[]).includes(s));
}

const demoPacks: SanityPack[] = mockPacks.map((p) => ({
  _id: p.id,
  title: p.title,
  creator: 'Hearth Content Team',
  creatorType: 'content-team' as const,
  subjects: asSubjects(p.subjects),
  ageRange: p.ageRange,
  moduleCount: p.moduleCount,
  description: p.description,
  availability: 'included' as const,
}));

// Seed the chrome so the demo viewer sees the real interactions: one pack
// already saved (so the library badge shows "1"), nothing owned, and a
// Family Fit hint pointing at a subject not well-served by the seeded
// learners' logged moments (the Family Fit banner only renders when this
// list is non-empty).
const demoLibraryIds = [demoPacks[0]?._id].filter((x): x is string => !!x);
const demoOwnedIds: string[] = [];
const demoGapSubjects: string[] = ['languages'];

export default function DemoMarketplacePage() {
  return (
    <MarketplaceShell
      initialPacks={demoPacks}
      mode="demo"
      basePath="/demo"
      initialLibraryIds={demoLibraryIds}
      initialOwnedIds={demoOwnedIds}
      initialGapSubjects={demoGapSubjects}
    />
  );
}
