'use client';

/**
 * Demo pack detail surface — parallels (auth)/pack/[id]/page.tsx but reads
 * mock packs + mock modules instead of a Sanity fetch. The live page is a
 * server component (sanityFetch on render) so a thin wrapper isn't an
 * option here; this file mirrors the JSX structure verbatim so the look
 * stays in lockstep.
 *
 * PackIndicators is skipped — mockPacks don't carry the
 * printables/materials/assetCounts triple, and the demo viewer doesn't
 * need to see the cluster of resource pips for the cosmetic surface to
 * read as the real pack page.
 *
 * The CTA is inlined as a single "Add to Library" / "In Library" button
 * that toggles a local state set — no /api/library POST, no Stripe.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { Books } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { mockPacks, mockModules } from '@/app/demo/mock-data';

export default function DemoPackDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const pack = mockPacks.find((p) => p.id === id);
  const { toast } = useToast();
  const [inLibrary, setInLibrary] = useState(false);

  if (!pack) notFound();

  // mockModules doesn't carry per-pack mapping; surface every published
  // module so the page reads as a populated pack. Phase 4 mock-data will
  // introduce per-pack module references.
  const modules = mockModules.slice(0, 4);

  function handleAdd() {
    if (inLibrary) return;
    setInLibrary(true);
    toast(`Added ${pack!.title} to your library`, 'info');
  }

  return (
    <div className="min-h-screen bg-surface-body">
      <div className="max-w-[960px] mx-auto px-md py-xl lg:px-lg">
        <div className="mb-lg">
          <Link
            href="/demo/explore/marketplace"
            className="font-sans text-[0.8rem] font-medium text-text-secondary hover:text-ember transition-colors duration-200"
          >
            ← Marketplace
          </Link>
        </div>

        <header className="mb-xl">
          <p className="mb-xs font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            {pack.subjects.slice(0, 3).join(' · ')}
          </p>
          <h1 className="font-serif text-2xl font-semibold text-text-primary leading-tight mb-sm">
            {pack.title}
          </h1>
          <p className="font-serif text-sm text-text-secondary leading-relaxed mb-md">
            {pack.description}
          </p>
          <p className="mb-md font-sans text-[0.75rem] text-text-muted">
            Ages {pack.ageRange.min}–{pack.ageRange.max} · {pack.moduleCount} modules
          </p>

          {/* Demo CTA — single-state, no /api/library, no Stripe. */}
          <div className="mt-lg max-w-xs">
            {inLibrary ? (
              <button
                disabled
                className="w-full bg-sage/20 text-sage font-sans font-semibold rounded-md px-md py-sm text-sm cursor-default"
              >
                In Library
              </button>
            ) : (
              <button
                onClick={handleAdd}
                className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]"
              >
                Add to Library
              </button>
            )}
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
                  key={m.id}
                  href={`/demo/module/${m.id}`}
                  className="group block bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card hover:border-border-medium hover:shadow-hover hover:-translate-y-[2px] transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
                >
                  <h3 className="font-serif text-[1rem] font-semibold text-text-primary mb-xs">
                    {m.title}
                  </h3>
                  <p className="font-serif text-sm text-text-secondary line-clamp-2 mb-sm">
                    {m.targetUnderstanding}
                  </p>
                  <div className="mt-sm flex items-center justify-between gap-sm">
                    <span className="font-sans text-[0.7rem] text-text-muted">
                      {m.duration.min}–{m.duration.max} min
                    </span>
                    <span className="font-sans text-[0.7rem] text-text-muted">
                      Ages {m.ageRange.min}–{m.ageRange.max}
                    </span>
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
