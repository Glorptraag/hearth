import { sanityFetch } from '@/lib/sanity/server-fetch';
import { PACKS_QUERY } from '@/lib/sanity/queries';
import { normalizeSubject, type SanityPack, type Subject } from '@/components/screens/MarketplaceCard';
import { MarketplaceShell } from './MarketplaceShell';

export default async function MarketplacePage() {
  const sanityPacks = await sanityFetch<SanityPack[]>(PACKS_QUERY);
  // Normalise drifted subject values server-side so a stale/aliased subject
  // can never blank the grid (preserves the fix from #102).
  const packs = (sanityPacks ?? []).map((p) => ({
    ...p,
    subjects: (p.subjects ?? [])
      .map(normalizeSubject)
      .filter((s): s is Subject => s !== null),
  }));
  return <MarketplaceShell initialPacks={packs} />;
}
