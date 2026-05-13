'use client';

// Minimal Constellation scaffold — list view of capability threads weighted
// by composite pedagogy + methodology contribution for a focused module.
// Spec: docs/hearth-runtime-methodology-integration-brief-v1.md §2.4.
// The full interactive map (per prototypes/hearth-constellation-map-v2.jsx)
// is a follow-up phase; this surface lights up the composite-weight read path.

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { sanityClient } from '@/lib/sanity/client';
import { MODULE_DETAIL_QUERY } from '@/lib/sanity/queries';
import { usePedagogy } from '@/hooks/use-pedagogy';
import {
  getActiveOverlays,
  getActivePedagogyBundle,
  getCompositeWeight,
  getThreadKeysForComposite,
} from '@/lib/pedagogy/get-active-bundle-and-overlays';
import type { ModuleWithBundles } from '@/lib/pedagogy/lens-bundle-types';

type ThreadInfo = { _id: string; title: string; domain?: string };

type FocusedModule = ModuleWithBundles & {
  _id: string;
  title: string;
  capabilityThreads?: ThreadInfo[];
};

export default function ConstellationPage() {
  const searchParams = useSearchParams();
  const moduleId = searchParams.get('module');
  const { pedagogy, pedagogyPractices, loading: pedagogyLoading } = usePedagogy();
  const [module, setModule] = useState<FocusedModule | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(moduleId));

  useEffect(() => {
    if (!moduleId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    sanityClient
      .fetch<FocusedModule>(MODULE_DETAIL_QUERY, { id: moduleId })
      .then((m) => setModule(m ?? null))
      .catch(() => setModule(null))
      .finally(() => setLoading(false));
  }, [moduleId]);

  if (!moduleId) {
    return (
      <div className="px-md py-xl max-w-2xl mx-auto">
        <h1 className="font-serif text-2xl font-semibold text-text-primary mb-md">
          Constellation
        </h1>
        <p className="font-serif text-base text-text-secondary leading-relaxed">
          Open a module-focused view by passing <code className="font-sans text-sm">?module=&lt;id&gt;</code>
          {' '}in the URL. The interactive map view ships in a follow-up phase.
        </p>
      </div>
    );
  }

  if (loading || pedagogyLoading) {
    return (
      <div className="px-md py-xl max-w-2xl mx-auto">
        <p className="font-serif text-base text-text-secondary">Loading…</p>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="px-md py-xl max-w-2xl mx-auto">
        <p className="font-serif text-base text-text-secondary">Module not found.</p>
      </div>
    );
  }

  const profile = { pedagogyKey: pedagogy, practices: pedagogyPractices };
  const pedagogyBundle = getActivePedagogyBundle(module, profile);
  const activeOverlays = getActiveOverlays(module, profile);
  const threadKeys = getThreadKeysForComposite(pedagogyBundle, activeOverlays);
  const threadInfo = new Map<string, ThreadInfo>();
  (module.capabilityThreads ?? []).forEach((t) => {
    if (t._id) threadInfo.set(t._id, t);
  });

  const weighted = threadKeys
    .map((key) => ({
      key,
      info: threadInfo.get(key),
      weight: getCompositeWeight(key, pedagogyBundle, activeOverlays, pedagogyPractices),
      interpretation: pedagogyBundle?.evidencePriorities?.find((p) => p.threadKey === key)
        ?.interpretation,
    }))
    .filter((row) => row.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  const maxWeight = weighted[0]?.weight ?? 1;

  return (
    <div className="px-md py-xl max-w-2xl mx-auto pb-32">
      <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ember mb-sm">
        Constellation
      </p>
      <h1 className="font-serif text-2xl font-semibold text-text-primary mb-sm">
        {module.title}
      </h1>
      <p className="font-serif text-base text-text-secondary leading-relaxed mb-xl">
        Capability threads weighted by your pedagogy and selected practices.
      </p>

      {weighted.length === 0 ? (
        <p className="font-serif text-sm italic text-text-muted">
          No weighted threads for the current pedagogy and practices.
        </p>
      ) : (
        <ul className="flex flex-col gap-md">
          {weighted.map((row) => {
            const pct = Math.min(100, Math.round((row.weight / maxWeight) * 100));
            return (
              <li
                key={row.key}
                className="rounded-lg border border-border-subtle bg-surface-panel p-lg"
              >
                <div className="flex items-baseline justify-between gap-sm mb-sm">
                  <p className="font-serif text-base font-semibold text-text-primary">
                    {row.info?.title ?? row.key}
                  </p>
                  <span className="font-sans text-xs text-text-muted">
                    {row.weight.toFixed(2)}
                  </span>
                </div>
                <div className="h-[6px] w-full rounded-full bg-surface-raised overflow-hidden">
                  <div
                    className="h-full bg-sage transition-[width] duration-[var(--motion-base)] ease-[var(--ease-out)]"
                    style={{ width: `${pct}%` }}
                    aria-hidden="true"
                  />
                </div>
                {row.interpretation && (
                  <p className="font-serif text-sm text-text-secondary leading-relaxed mt-sm">
                    {row.interpretation}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
