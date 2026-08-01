import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sanityFetch } from '@/lib/sanity/server-fetch';
import { PACK_INDICATORS_PROJECTION } from '@/lib/sanity/queries';
import { PackIndicators } from '@/components/ui/PackIndicators';
import type { Printables, Materials, AssetCounts } from '@/lib/sanity/pack-indicators';
import { ArrowLeft, Books } from '@/components/icons';
import { PackDetailCta } from '@/components/pack/PackDetailCta';

interface PackDetail {
  _id: string;
  title: string;
  description?: string;
  subjects?: string[];
  ageRange?: { min: number; max: number };
  availability?: 'included' | 'premium';
  stripePriceId?: string;
  creator?: string;
  printables?: Printables;
  materials?: Materials;
  assetCounts?: AssetCounts | null;
  modules?: Array<{
    _id: string;
    title: string;
    targetUnderstanding?: string;
    subjects?: string[];
    duration?: { min: number; max: number };
    printables?: Printables;
    materials?: Materials;
    assetCounts?: AssetCounts | null;
  }>;
}

// Sanity-gated: only published packs and modules. See src/lib/sanity/queries.ts header.
const PACK_BY_ID_QUERY = `*[_type == "pack" && _id == $id && status == "published"][0]{
  _id, title, description, subjects, ageRange, availability, stripePriceId, creator,
  ${PACK_INDICATORS_PROJECTION},
  "modules": modules[@->status == "published"]->{
    _id, title, targetUnderstanding, subjects, duration,
    ${PACK_INDICATORS_PROJECTION}
  }
}`;

export default async function PackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let pack: PackDetail | null = null;
  try {
    pack = await sanityFetch<PackDetail | null>(PACK_BY_ID_QUERY, { id });
  } catch {
    pack = null;
  }

  if (!pack) notFound();

  const modules = pack.modules ?? [];

  return (
    <div className="min-h-screen bg-surface-body">
      <div className="max-w-[960px] mx-auto px-md py-xl lg:px-lg">
        <div className="mb-lg">
          <Link
            href="/library"
            className="font-sans text-[0.8rem] font-medium text-text-secondary hover:text-ember transition-colors duration-[var(--motion-quick)]"
          >
            <span className="inline-flex items-center gap-xs"><ArrowLeft size={14} aria-hidden="true" /> Library</span>
          </Link>
        </div>

        <header className="mb-xl">
          <p className="mb-xs font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            {pack.subjects?.slice(0, 3).join(' · ') ?? 'Learning Pack'}
          </p>
          <h1 className="font-serif text-2xl font-semibold text-text-primary leading-tight mb-sm">
            {pack.title}
          </h1>
          {pack.description && (
            <p className="font-serif text-sm text-text-secondary leading-relaxed mb-md">
              {pack.description}
            </p>
          )}
          <PackIndicators
            context="detail"
            printables={pack.printables}
            materials={pack.materials}
            assetCounts={pack.assetCounts}
          />

          {/* Context-aware CTA — Add / In Library / Owned / Get Pack.
              Client island so the rest of the page stays server-rendered. */}
          <div className="mt-lg max-w-xs">
            <PackDetailCta
              packId={pack._id}
              packTitle={pack.title}
              availability={pack.availability}
              stripePriceId={pack.stripePriceId}
            />
          </div>
        </header>

        <section>
          <p className="mb-md font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Modules ({modules.length})
          </p>

          {modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-[16px] border border-border-subtle bg-surface-panel">
              <span className="mb-md inline-flex text-text-secondary" aria-hidden="true">
                <Books size={32} />
              </span>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-sm">
                No modules in this pack yet
              </h3>
              <p className="font-sans text-sm text-text-secondary max-w-sm">
                The pack creator hasn&apos;t added modules to this collection yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              {modules.map((m) => (
                <Link
                  key={m._id}
                  href={`/module/${m._id}`}
                  className="group block bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card hover:border-border-medium hover:shadow-hover hover:-translate-y-[2px] transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
                >
                  <h3 className="font-serif text-[1rem] font-semibold text-text-primary mb-xs">
                    {m.title}
                  </h3>
                  {m.targetUnderstanding && (
                    <p className="font-serif text-sm text-text-secondary line-clamp-2 mb-sm">
                      {m.targetUnderstanding}
                    </p>
                  )}
                  <div className="mt-sm flex items-center justify-between gap-sm">
                    {m.duration && (
                      <span className="font-sans text-[0.7rem] text-text-muted">
                        {m.duration.min}–{m.duration.max} min
                      </span>
                    )}
                    <PackIndicators
                      context="card-compact"
                      printables={m.printables}
                      materials={m.materials}
                      assetCounts={m.assetCounts}
                      className="shrink-0"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
