'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { LibraryMaterialsTab } from '@/components/content/LibraryMaterialsTab';
import { Books, Sparkle, Play, CalendarBlank, X } from '@/components/icons';
import { PackIndicators } from '@/components/ui/PackIndicators';
import type { Printables, Materials, AssetCounts } from '@/lib/sanity/pack-indicators';
import type { LibraryModuleItem } from '@/app/api/library/modules/route';
import type { LibraryStatus, LibraryStatusResponse } from '@/app/api/library/status/route';
import { BrowseTab } from './_components/BrowseTab';
import { RecentlyRemovedDrawer } from './_components/RecentlyRemovedDrawer';

interface LibraryItem {
  id: string;
  title: string;
  subjects?: string[];
  kind: 'pack' | 'module';
  isOwnBuilt: boolean;
  sanityPackId: string | null;
  sanityModuleId: string | null;
  moduleId: string;
  /** family_library row UUID — used by soft-delete (DELETE /api/library/[id]). */
  rowId: string;
  printables?: Printables;
  materials?: Materials;
  assetCounts?: AssetCounts | null;
}

type Tab = 'modules' | 'packs' | 'materials' | 'browse';

const ACTIVE_STATUSES: ReadonlySet<LibraryStatus> = new Set([
  'in_flight',
  'planned',
  'recently_used',
]);

const STATUS_BADGE: Record<LibraryStatus, { label: string; className: string; Icon: typeof Play | null }> = {
  in_flight: { label: 'In flight', className: 'bg-ember/15 text-ember border-ember/30', Icon: Play },
  planned: { label: 'Planned', className: 'bg-domain-science/15 text-domain-science border-domain-science/30', Icon: CalendarBlank },
  recently_used: { label: 'Recent', className: 'bg-sage/15 text-sage border-sage/30', Icon: null },
  abandoned: { label: 'Abandoned', className: 'bg-amber-status/15 text-amber-status border-amber-status/30', Icon: null },
  untouched: { label: 'Untouched', className: 'bg-surface-raised text-text-muted border-border-subtle', Icon: null },
};

const SUBJECT_CHIP: Record<string, string> = {
  english:      'bg-domain-english/15 text-domain-english',
  mathematics:  'bg-domain-mathematics/15 text-domain-mathematics',
  science:      'bg-domain-science/15 text-domain-science',
  hass:         'bg-domain-hass/15 text-domain-hass',
  arts:         'bg-domain-arts/15 text-domain-arts',
  technologies: 'bg-domain-technologies/15 text-domain-technologies',
  hpe:          'bg-domain-hpe/15 text-domain-hpe',
  languages:    'bg-domain-languages/15 text-domain-languages',
};

const SUBJECT_LABELS: Record<string, string> = {
  english: 'English',
  mathematics: 'Maths',
  science: 'Science',
  hass: 'HASS',
  arts: 'Arts',
  technologies: 'Tech',
  hpe: 'HPE',
  languages: 'Languages',
};

export default function LibraryClient() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [modules, setModules] = useState<LibraryModuleItem[]>([]);
  const [status, setStatus] = useState<LibraryStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  // Modules (in use) is the default tab — typical family has 5 packs × 6
  // modules and modules are the unit a parent actually runs in a session.
  const [tab, setTab] = useState<Tab>('modules');
  // Task 4.7 — Recently-Removed drawer state.
  const [removedDrawerOpen, setRemovedDrawerOpen] = useState(false);

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, modulesRes, statusRes] = await Promise.all([
        fetch('/api/library'),
        fetch('/api/library/modules'),
        fetch('/api/library/status'),
      ]);
      if (itemsRes.ok) setItems(await itemsRes.json());
      if (modulesRes.ok) setModules(await modulesRes.json());
      if (statusRes.ok) setStatus(await statusRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount data hydration; setState calls inside fetchLibrary are gated on completion.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLibrary();
  }, [fetchLibrary]);

  const packItems = items.filter((i) => i.kind === 'pack');

  // moduleId → status item lookup so cards can render badges without
  // re-querying. Used for both standalone and pack-nested modules.
  const statusByModuleId = useMemo(() => {
    const map = new Map<string, NonNullable<typeof status>['items'][number]>();
    for (const item of status?.items ?? []) {
      if (item.sanityModuleId) map.set(item.sanityModuleId, item);
    }
    return map;
  }, [status]);

  // For the "Modules (in use)" tab: filter to active statuses + sort by
  // most recent activity. Modules without a status row fall back to
  // 'untouched' so they're hidden from this tab and surfaced in Browse.
  const modulesInUse = useMemo(() => {
    const augmented = modules.map((m) => ({
      module: m,
      status: statusByModuleId.get(m.id),
    }));
    return augmented
      .filter((a) => a.status && ACTIVE_STATUSES.has(a.status.status))
      .sort((a, b) => {
        const ta = a.status?.lastActivityAt ?? '';
        const tb = b.status?.lastActivityAt ?? '';
        return ta > tb ? -1 : 1;
      });
  }, [modules, statusByModuleId]);

  // Pack status rollups: count how many of each pack's modules are in flight.
  const packRollupByPackId = useMemo(() => {
    const map = new Map<string, { inFlight: number; planned: number }>();
    for (const item of status?.items ?? []) {
      if (!item.sanityPackId) continue;
      const existing = map.get(item.sanityPackId) ?? { inFlight: 0, planned: 0 };
      if (item.status === 'in_flight') existing.inFlight += 1;
      else if (item.status === 'planned') existing.planned += 1;
      map.set(item.sanityPackId, existing);
    }
    return map;
  }, [status]);

  return (
    <div className="min-h-screen bg-surface-body">
      <div className="max-w-[960px] mx-auto px-md py-xl lg:px-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-text-primary leading-tight mb-xs">
              Library
            </h1>
            <p className="font-serif text-sm text-text-secondary italic">
              Your family&apos;s learning collection
            </p>
          </div>
          <div className="flex items-center gap-md">
            <button
              onClick={() => setRemovedDrawerOpen(true)}
              className="font-sans text-[0.8rem] font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              Recently removed
            </button>
            <Link
              href="/explore/marketplace"
              className="font-sans text-[0.8rem] font-medium text-ember hover:text-ember/80 transition-colors duration-200"
            >
              Browse Marketplace →
            </Link>
          </div>
        </div>

        {/* Tabs — Modules (in use) first; it's the unit a parent runs.
            Packs is the provenance / kitting view. Materials aggregates
            per-pack printables/kits. Browse is the expansive catalog of
            every module across owned packs + standalone (4.6). */}
        <div className="flex gap-lg mb-xl border-b border-border-subtle overflow-x-auto">
          {([
            { key: 'modules' as const, label: 'In use', count: modulesInUse.length },
            { key: 'packs' as const, label: 'Packs', count: items.filter((i) => i.kind === 'pack').length },
            { key: 'materials' as const, label: 'Materials', count: null },
            { key: 'browse' as const, label: 'Browse', count: null },
          ]).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-sm font-sans text-sm font-semibold transition-all duration-200 border-b-2 ${
                tab === key
                  ? 'text-ember border-ember'
                  : 'text-text-muted border-transparent hover:text-text-secondary'
              }`}
            >
              {label}
              {!loading && count != null && (
                <span className="ml-xs font-sans text-[0.72rem] text-text-muted">
                  ({count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'modules' && (
          <>
            {loading ? (
              <div className="py-20 text-center">
                <p className="font-sans text-sm text-text-muted animate-pulse">Loading library…</p>
              </div>
            ) : modules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="mb-md inline-flex text-text-secondary" aria-hidden="true">
                  <Books size={32} />
                </span>
                <h3 className="font-serif text-lg font-semibold text-text-primary mb-sm">
                  Your library is empty
                </h3>
                <p className="font-sans text-sm text-text-secondary mb-lg max-w-xs">
                  Browse the marketplace to add packs, or build your own module from the Build screen.
                </p>
                <Link
                  href="/explore/marketplace"
                  className="bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember/90 transition-all duration-200"
                >
                  Explore Marketplace
                </Link>
              </div>
            ) : modulesInUse.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="mb-md inline-flex text-text-secondary" aria-hidden="true">
                  <Books size={32} />
                </span>
                <h3 className="font-serif text-lg font-semibold text-text-primary mb-sm">
                  Nothing in flight yet
                </h3>
                <p className="font-sans text-sm text-text-secondary mb-lg max-w-sm">
                  Once you start a module, plan one, or log against one, it shows up here.
                  Pick something to begin from <strong>Browse</strong>.
                </p>
                <button
                  onClick={() => setTab('browse')}
                  className="bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember/90 transition-all duration-200"
                >
                  Browse all modules
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                {modulesInUse.map(({ module: m, status: s }) => (
                  <ModuleCard key={m.id} module={m} status={s?.status ?? null} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'packs' && (
          <>
            {loading ? (
              <div className="py-20 text-center">
                <p className="font-sans text-sm text-text-muted animate-pulse">Loading library…</p>
              </div>
            ) : packItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="mb-md inline-flex text-text-secondary" aria-hidden="true">
                  <Books size={32} />
                </span>
                <h3 className="font-serif text-lg font-semibold text-text-primary mb-sm">
                  No packs in your library
                </h3>
                <p className="font-sans text-sm text-text-secondary mb-lg max-w-xs">
                  Browse the marketplace to add packs to your collection.
                </p>
                <Link
                  href="/explore/marketplace"
                  className="bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember/90 transition-all duration-200"
                >
                  Explore Marketplace
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                {items.map((item) => (
                  <LibraryCard
                    key={item.id}
                    item={item}
                    rollup={item.sanityPackId ? packRollupByPackId.get(item.sanityPackId) : undefined}
                    onRemove={async () => {
                      if (!confirm(`Remove "${item.title}" from your library? You can restore it any time.`)) {
                        return;
                      }
                      await fetch(`/api/library/${item.rowId}`, { method: 'DELETE' }).catch(() => {});
                      fetchLibrary();
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'materials' && (
          <LibraryMaterialsTab
            packs={packItems.map((p) => ({ sanityPackId: p.id, title: p.title }))}
          />
        )}

        {tab === 'browse' && <BrowseTab />}
      </div>
      <RecentlyRemovedDrawer
        open={removedDrawerOpen}
        onClose={() => setRemovedDrawerOpen(false)}
        onRestored={fetchLibrary}
      />
    </div>
  );
}

function ModuleCard({ module: m, status }: { module: LibraryModuleItem; status?: LibraryStatus | null }) {
  const badge = status ? STATUS_BADGE[status] : null;
  const BadgeIcon = badge?.Icon ?? null;
  return (
    <Link
      href={`/module/${m.id}`}
      className="group block bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card hover:border-border-medium hover:shadow-hover hover:-translate-y-[2px] transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
    >
      <div className="flex items-start justify-between gap-sm mb-xs">
        <h3 className="font-serif text-[1rem] font-semibold text-text-primary">
          {m.title}
        </h3>
        <div className="flex items-center gap-xs shrink-0">
          {badge && (
            <span
              className={`inline-flex items-center gap-xs font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${badge.className}`}
            >
              {BadgeIcon && <BadgeIcon size={10} aria-hidden="true" />}
              {badge.label}
            </span>
          )}
          {m.isOwnBuilt && (
            <span className="inline-flex items-center gap-xs font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sage/15 text-sage border border-sage/30">
              <Sparkle size={10} aria-hidden="true" /> Yours
            </span>
          )}
        </div>
      </div>
      {m.targetUnderstanding && (
        <p className="font-serif text-sm text-text-secondary line-clamp-2 mb-sm">
          {m.targetUnderstanding}
        </p>
      )}
      <div className="mt-sm flex items-center justify-between gap-sm">
        <div className="flex items-center gap-xs min-w-0">
          {m.duration && (
            <span className="font-sans text-[0.7rem] text-text-muted shrink-0">
              {m.duration.min}–{m.duration.max} min
            </span>
          )}
          {m.owningPack && (
            <span className="font-sans text-[0.65rem] text-text-muted bg-surface-raised border border-border-subtle rounded-full px-1.5 py-0.5 truncate">
              {m.owningPack.title}
            </span>
          )}
        </div>
        <PackIndicators
          context="card-compact"
          printables={m.printables}
          materials={m.materials}
          assetCounts={m.assetCounts}
          className="shrink-0"
        />
      </div>
    </Link>
  );
}

function LibraryCard({
  item,
  rollup,
  onRemove,
}: {
  item: LibraryItem;
  rollup?: { inFlight: number; planned: number };
  onRemove?: () => Promise<void>;
}) {
  const subjects = item.subjects ?? [];
  const content = (
    <div
      className="group relative bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card hover:border-border-medium hover:shadow-hover hover:-translate-y-[2px] transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
    >
      <div className="absolute left-0 right-0 top-0 h-[2px] rounded-t-lg bg-ember opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--motion-gentle)]" />
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void onRemove();
          }}
          className="absolute top-sm right-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--motion-quick)] inline-flex items-center justify-center w-7 h-7 rounded-full border border-border-subtle bg-surface-panel text-text-muted hover:border-red-400 hover:text-red-400"
          aria-label={`Remove ${item.title} from library`}
        >
          <X size={12} aria-hidden="true" />
        </button>
      )}
      <div className="flex items-start justify-between gap-sm mb-sm">
        <h3 className="font-serif text-[1rem] font-semibold text-text-primary">
          {item.title}
        </h3>
        <div className="flex items-center gap-xs shrink-0">
          {rollup && (rollup.inFlight > 0 || rollup.planned > 0) && (
            <span className="inline-flex items-center gap-xs font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-ember/15 text-ember border border-ember/30">
              {rollup.inFlight > 0 && (
                <span className="inline-flex items-center gap-[2px]">
                  <Play size={10} aria-hidden="true" /> {rollup.inFlight}
                </span>
              )}
              {rollup.planned > 0 && (
                <span className="inline-flex items-center gap-[2px]">
                  <CalendarBlank size={10} aria-hidden="true" /> {rollup.planned}
                </span>
              )}
            </span>
          )}
          {item.isOwnBuilt && (
            <span className="inline-flex items-center gap-xs font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sage/15 text-sage border border-sage/30">
              <Sparkle size={10} aria-hidden="true" /> Created by you
            </span>
          )}
        </div>
      </div>
      <div className="mt-sm flex items-center justify-between gap-sm">
        {subjects.length > 0 ? (
          <div className="flex flex-wrap gap-xs">
            {subjects.map((s) => (
              <span
                key={s}
                className={`font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${SUBJECT_CHIP[s] ?? 'bg-surface-raised text-text-muted'}`}
              >
                {SUBJECT_LABELS[s] ?? s}
              </span>
            ))}
          </div>
        ) : (
          <span />
        )}
        <PackIndicators
          context="card-compact"
          printables={item.printables}
          materials={item.materials}
          assetCounts={item.assetCounts}
          className="shrink-0"
        />
      </div>
    </div>
  );

  const href = item.kind === 'module' ? `/module/${item.id}` : `/pack/${item.id}`;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
