import type { Subject } from '@/components/screens/MarketplaceCard';

/** Which catalogue kinds the Marketplace browse is showing. */
export type CatalogKind = 'all' | 'pack' | 'module';

interface PackLike {
  title: string;
  creator?: string;
  description?: string | null;
  subjects?: Subject[];
}

interface ModuleLike {
  title: string;
  targetUnderstanding?: string | null;
  subjects?: Subject[];
}

/** A pack matches when the query hits title/creator/description and the subject (if any) is covered. */
export function packMatchesFilter(pack: PackLike, q: string, subject: Subject | null): boolean {
  const query = q.toLowerCase().trim();
  const matchesSearch =
    !query ||
    pack.title.toLowerCase().includes(query) ||
    (pack.creator ?? '').toLowerCase().includes(query) ||
    (pack.description ?? '').toLowerCase().includes(query);
  const matchesSubject = !subject || (pack.subjects ?? []).includes(subject);
  return matchesSearch && matchesSubject;
}

/** A standalone module matches when the query hits title/understanding and the subject (if any) is covered. */
export function moduleMatchesFilter(module: ModuleLike, q: string, subject: Subject | null): boolean {
  const query = q.toLowerCase().trim();
  const matchesSearch =
    !query ||
    module.title.toLowerCase().includes(query) ||
    (module.targetUnderstanding ?? '').toLowerCase().includes(query);
  const matchesSubject = !subject || (module.subjects ?? []).includes(subject);
  return matchesSearch && matchesSubject;
}
