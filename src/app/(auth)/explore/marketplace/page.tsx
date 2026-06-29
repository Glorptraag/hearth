import { sanityFetch } from '@/lib/sanity/server-fetch';
import { PACKS_QUERY, STANDALONE_MODULES_QUERY } from '@/lib/sanity/queries';
import type { SanityPack } from '@/components/screens/MarketplaceCard';
import type { SanityStandaloneModule } from '@/components/screens/MarketplaceModuleCard';
import { MarketplaceShell } from './MarketplaceShell';

export default async function MarketplacePage() {
  // Subject normalisation (the #102 fix) happens inside MarketplaceShell:
  // normalizeSubject lives in a 'use client' module and cannot be invoked
  // from a server component. Keep each fetch defensive so a Sanity blip
  // degrades to an empty grid rather than crashing the route (per the
  // 2026-05-25 "a 5xx must not crash the page" rule).
  let packs: SanityPack[] = [];
  let modules: SanityStandaloneModule[] = [];
  try {
    packs = (await sanityFetch<SanityPack[]>(PACKS_QUERY)) ?? [];
  } catch {
    packs = [];
  }
  try {
    modules = (await sanityFetch<SanityStandaloneModule[]>(STANDALONE_MODULES_QUERY)) ?? [];
  } catch {
    modules = [];
  }
  return <MarketplaceShell initialPacks={packs} initialModules={modules} />;
}
