'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MarketplaceCard, normalizeSubject, type SanityPack, type Subject } from '@/components/screens/MarketplaceCard';
import { MarketplaceModuleCard, type SanityStandaloneModule } from '@/components/screens/MarketplaceModuleCard';
import {
  ArrowLeft, Binoculars, Target, Books, MagnifyingGlass, Check as CheckIcon,
} from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { track } from '@/lib/analytics/posthog';
import { packMatchesFilter, moduleMatchesFilter, type CatalogKind } from './catalog-filter';

// ─── Subject filter config ────────────────────────────────────────────────────

const SUBJECT_FILTERS: { label: string; value: Subject; hex: string }[] = [
  { label: 'English',      value: 'english',      hex: '#6B8E9B' },
  { label: 'Mathematics',  value: 'mathematics',  hex: '#9B7B6B' },
  { label: 'Science',      value: 'science',      hex: '#7B9B6B' },
  { label: 'HASS',         value: 'hass',         hex: '#9B8B6B' },
  { label: 'Arts',         value: 'arts',         hex: '#8B6B9B' },
  { label: 'Technologies', value: 'technologies', hex: '#6B7B9B' },
  { label: 'HPE',          value: 'hpe',          hex: '#9B6B7B' },
  { label: 'Languages',    value: 'languages',    hex: '#6B9B8B' },
];

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ─── Shell ──────────────────────────────────────────────────────────────────
// Packs and standalone modules are fetched server-side (tagged, cache-
// revalidated) and passed in; per-family state (library, entitlements,
// snapshot gaps) is fetched here.

export function MarketplaceShell({
  initialPacks,
  initialModules = [],
}: {
  initialPacks: SanityPack[];
  initialModules?: SanityStandaloneModule[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  // Normalise drifted/aliased subject values so a stale subject can't blank
  // the grid (the #102 fix). Runs client-side because normalizeSubject is a
  // 'use client' export and cannot be called from the server component.
  const packs = useMemo(
    () =>
      initialPacks.map((p) => ({
        ...p,
        subjects: (p.subjects ?? [])
          .map(normalizeSubject)
          .filter((s): s is Subject => s !== null),
      })),
    [initialPacks],
  );
  // Standalone modules (not inside any pack) — same subject normalisation.
  const modules = useMemo(
    () =>
      initialModules.map((m) => ({
        ...m,
        subjects: (m.subjects ?? [])
          .map(normalizeSubject)
          .filter((s): s is Subject => s !== null),
      })),
    [initialModules],
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [kind, setKind] = useState<CatalogKind>('all');
  const [libraryIds, setLibraryIds] = useState<Set<string>>(new Set());
  const [moduleLibraryIds, setModuleLibraryIds] = useState<Set<string>>(new Set());
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [gapSubjects, setGapSubjects] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [libraryRes, entitlementsRes, snapshotRes] = await Promise.all([
        fetch('/api/library'),
        fetch('/api/entitlements').catch(() => null),
        fetch('/api/snapshot').catch(() => null),
      ]);
      if (libraryRes.ok) {
        const library: Array<{ id: string; kind: 'pack' | 'module' }> = await libraryRes.json();
        setLibraryIds(new Set(library.filter((l) => l.kind === 'pack').map((l) => l.id)));
        setModuleLibraryIds(new Set(library.filter((l) => l.kind === 'module').map((l) => l.id)));
      }
      if (entitlementsRes?.ok) {
        const owned: string[] = await entitlementsRes.json();
        setOwnedIds(new Set(owned));
      }
      // Extract gap subjects from snapshot
      if (snapshotRes?.ok) {
        const snap = await snapshotRes.json();
        const children = snap?.snapshotData?.children ?? {};
        const allGaps = new Set<string>();
        for (const child of Object.values(children) as Array<{ gap_analysis?: { underserved_subjects?: string[] } }>) {
          for (const s of child?.gap_analysis?.underserved_subjects ?? []) {
            allGaps.add(s);
          }
        }
        setGapSubjects([...allGaps]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredPacks = useMemo(
    () => packs.filter((pack) => packMatchesFilter(pack, search, activeSubject)),
    [search, activeSubject, packs],
  );
  const filteredModules = useMemo(
    () => modules.filter((m) => moduleMatchesFilter(m, search, activeSubject)),
    [search, activeSubject, modules],
  );
  // What the active kind tab actually renders.
  const visiblePacks = kind === 'module' ? [] : filteredPacks;
  const visibleModules = kind === 'pack' ? [] : filteredModules;
  const visibleCount = visiblePacks.length + visibleModules.length;
  const hasContent = packs.length > 0 || modules.length > 0;
  // The kind toggle only appears once standalone modules exist, so when there
  // are none the screen behaves exactly as the packs-only version did.
  const showKindToggle = modules.length > 0;

  async function handlePurchase(id: string) {
    const pack = packs.find((p) => p._id === id);
    if (!pack?.stripePriceId) return;
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: pack.stripePriceId, packId: pack._id, packTitle: pack.title }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast('Could not start checkout — please try again', 'error');
      }
    } catch {
      toast('Something went wrong — please try again', 'error');
    }
  }

  async function handleAddToLibrary(id: string, itemKind: 'pack' | 'module' = 'pack') {
    const setIds = itemKind === 'module' ? setModuleLibraryIds : setLibraryIds;
    setIds((prev) => new Set(prev).add(id));
    const rollback = () => {
      setIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemKind === 'module' ? { sanityModuleId: id } : { sanityPackId: id }),
      });
      if (!res.ok) {
        rollback();
        const body = await res.text().catch(() => '');
        console.error('[marketplace] add-to-library failed', res.status, body);
        toast(`Couldn't add to library (${res.status})`, 'error');
        return;
      }
      track('module_added_to_library');
    } catch (err) {
      rollback();
      console.error('[marketplace] add-to-library threw', err);
      toast("Couldn't add to library — please try again", 'error');
    }
  }

  const libraryCount = libraryIds.size + moduleLibraryIds.size;

  return (
    <div className="min-h-screen bg-surface-body">
      <div className="relative z-10 max-w-[1280px] mx-auto px-md py-xl lg:px-lg">
        {/* ── Top nav ── */}
        <div className="flex items-center justify-between pb-lg mb-lg border-b border-border-subtle">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-sans text-[0.8rem] font-medium text-text-secondary hover:text-ember transition-colors duration-[var(--motion-quick)]"
          >
            <span className="inline-flex items-center gap-xs"><ArrowLeft size={14} aria-hidden="true" /> Dashboard</span>
          </Link>
          <div className="flex items-center gap-2 font-sans text-[0.8rem] font-medium text-text-secondary bg-surface-raised border border-border-subtle rounded-[10px] px-3 py-2 hover:border-border-medium hover:text-ember transition-all duration-[var(--motion-quick)] cursor-pointer">
            <Books size={16} aria-hidden="true" />
            <span>My Library</span>
            {libraryCount > 0 && (
              <span className="bg-ember text-text-inverse font-sans text-[0.65rem] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center">
                {libraryCount}
              </span>
            )}
          </div>
        </div>

        {/* ── Page header ── */}
        <div className="mb-lg">
          <h1 className="font-serif text-2xl font-semibold text-text-primary leading-tight mb-xs">
            Marketplace
          </h1>
          <p className="font-serif text-sm text-text-secondary italic">
            Curate your family&apos;s learning library
          </p>
        </div>

        {/* ── Search bar ── */}
        <div className="relative mb-lg">
          <span className="absolute left-sm top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden="true">
            <MagnifyingGlass size={16} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search packs, modules, or creators…"
            className="w-full bg-surface-panel border border-border-subtle rounded-[10px] pl-[36px] pr-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium transition-colors duration-[var(--motion-quick)]"
          />
        </div>

        {/* ── Kind filter (Packs / Modules) — only when standalone modules exist ── */}
        {showKindToggle && (
          <div className="flex items-center gap-2 mb-lg">
            <span className="font-sans text-[0.72rem] text-text-muted">Show</span>
            <div className="inline-flex rounded-full border border-border-subtle bg-surface-raised p-0.5">
              {([
                ['all', 'All'],
                ['pack', 'Packs'],
                ['module', 'Modules'],
              ] as [CatalogKind, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setKind(value)}
                  aria-pressed={kind === value}
                  className={`font-sans text-[0.72rem] font-semibold px-3 py-1 rounded-full transition-colors duration-[var(--motion-quick)] ${
                    kind === value
                      ? 'bg-ember text-text-inverse'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Subject filter pills ── */}
        <div className="flex flex-wrap gap-xs mb-xl">
          <button
            onClick={() => setActiveSubject(null)}
            className={`font-sans text-[0.75rem] font-semibold px-3 py-1.5 rounded-full border transition-all duration-[var(--motion-quick)] ${
              activeSubject === null
                ? 'bg-ember text-text-inverse border-ember'
                : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium hover:text-text-primary'
            }`}
          >
            All
          </button>
          {SUBJECT_FILTERS.map((s) => {
            const rgb = hexToRgb(s.hex);
            const isActive = activeSubject === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setActiveSubject(isActive ? null : s.value)}
                className="font-sans text-[0.75rem] font-semibold px-3 py-1.5 rounded-full border transition-all duration-[var(--motion-quick)]"
                style={{
                  color: s.hex,
                  background: isActive ? `rgba(${rgb},0.22)` : `rgba(${rgb},0.08)`,
                  borderColor: isActive ? `rgba(${rgb},0.5)` : `rgba(${rgb},0.2)`,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* ── Loading state ── */}
        {loading ? (
          <div className="py-20 text-center">
            <p className="font-sans text-sm text-text-muted animate-pulse">Loading marketplace…</p>
          </div>
        ) : (
          <>
            {/* ── Editor's Picks (pack-centric — hidden in the Modules view) ── */}
            {packs.length > 0 && kind !== 'module' && (
              <div className="mb-xl">
                <p className="mb-sm font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Editor&apos;s Picks
                </p>
                <div className="flex gap-md overflow-x-auto overscroll-x-contain snap-x pb-sm scrollbar-none">
                  {packs.slice(0, 4).map((pack, i) => {
                    const BADGES = ['Staff Pick', 'Specialist', 'New', 'Popular'];
                    const BADGE_STYLES = [
                      'bg-ember/15 text-ember',
                      'bg-sage/15 text-sage',
                      'bg-domain-science/15 text-domain-science',
                      'bg-domain-hass/15 text-domain-hass',
                    ];
                    return (
                      <div
                        key={pack._id}
                        className="relative snap-start shrink-0 w-[200px] rounded-[10px] border border-border-subtle bg-surface-panel p-md overflow-hidden"
                      >
                        <div className="absolute left-0 right-0 top-0 h-[2px] bg-ember opacity-60" />
                        <span className={`mb-sm inline-block rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold ${BADGE_STYLES[i % BADGE_STYLES.length]}`}>
                          {BADGES[i % BADGES.length]}
                        </span>
                        <p className="font-serif text-sm font-semibold text-text-primary line-clamp-2">{pack.title}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Family Fit Banner (suggests packs — hidden in the Modules view) ── */}
            {gapSubjects.length > 0 && kind !== 'module' && (
              <div className="mb-xl rounded-[16px] border border-ember/20 bg-ember-glow/20 p-lg overflow-hidden relative">
                <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,var(--color-ember),transparent)] opacity-60" />
                <div className="flex items-start gap-md">
                  <span className="shrink-0 inline-flex text-ember" aria-hidden="true">
                    <Target size={22} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ember mb-xs">
                      Family Fit
                    </p>
                    <p className="font-serif text-sm text-text-primary mb-sm">
                      There&rsquo;s room to grow in{' '}
                      {gapSubjects.slice(0, 3).map((s, i) => {
                        const label = SUBJECT_FILTERS.find((sf) => sf.value === s)?.label ?? s;
                        return (
                          <span key={s}>
                            {i > 0 && (i === Math.min(gapSubjects.length, 3) - 1 ? ' and ' : ', ')}
                            <button
                              onClick={() => setActiveSubject(s as Subject)}
                              className="text-ember font-semibold underline underline-offset-2 hover:text-ember-hover transition-colors"
                            >
                              {label}
                            </button>
                          </span>
                        );
                      })}
                      .
                    </p>
                    <p className="font-serif text-xs text-text-secondary">
                      Packs covering these subjects will help round out your curriculum evidence.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── All-in-library banner ── */}
            {hasContent &&
              visibleCount > 0 &&
              visiblePacks.every((p) => libraryIds.has(p._id)) &&
              visibleModules.every((m) => moduleLibraryIds.has(m._id)) && (
                <div className="mb-lg rounded-[10px] border border-sage/20 bg-sage/5 px-lg py-sm">
                  <p className="inline-flex items-center gap-xs font-serif text-sm text-sage">
                    <CheckIcon size={16} aria-hidden="true" />
                    You&rsquo;ve added everything here.
                  </p>
                </div>
              )}

            {/* ── Results count ── */}
            <p className="font-sans text-[0.75rem] text-text-muted mb-lg">
              {kind === 'module'
                ? `Showing ${visibleModules.length} ${visibleModules.length === 1 ? 'module' : 'modules'}`
                : kind === 'pack'
                  ? `Showing ${visiblePacks.length} ${visiblePacks.length === 1 ? 'pack' : 'packs'}`
                  : `Showing ${visibleCount} ${visibleCount === 1 ? 'item' : 'items'}`}
            </p>

            {/* ── Content grid ── */}
            {/* Pack cards navigate to /pack/[id]; module cards to /module/[id].
                Inline Add / Get CTAs stop propagation so they don't also fire
                the card-body navigation. */}
            {visibleCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
                {visiblePacks.map((pack) => (
                  <div
                    key={pack._id}
                    onClick={() => router.push(`/pack/${pack._id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/pack/${pack._id}`);
                      }
                    }}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open ${pack.title}`}
                    className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ember rounded-[16px]"
                  >
                    <MarketplaceCard
                      pack={pack}
                      inLibrary={libraryIds.has(pack._id)}
                      owned={ownedIds.has(pack._id)}
                      onAddToLibrary={handleAddToLibrary}
                      onPurchase={handlePurchase}
                    />
                  </div>
                ))}
                {visibleModules.map((module) => (
                  <div
                    key={module._id}
                    onClick={() => router.push(`/module/${module._id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/module/${module._id}`);
                      }
                    }}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open ${module.title}`}
                    className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ember rounded-[16px]"
                  >
                    <MarketplaceModuleCard
                      module={module}
                      inLibrary={moduleLibraryIds.has(module._id)}
                      onAddToLibrary={(id) => handleAddToLibrary(id, 'module')}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="mb-4 inline-flex text-text-secondary" aria-hidden="true">
                  <Binoculars size={32} />
                </span>
                <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                  {!hasContent
                    ? 'No content published yet'
                    : 'No content matches your filters'}
                </h3>
                <p className="font-sans text-sm text-text-secondary mb-6 max-w-xs">
                  {!hasContent
                    ? 'Packs and modules will appear here as they\u2019re published.'
                    : 'Try adjusting your search, kind, or subject filter.'}
                </p>
                {hasContent && (
                  <button
                    onClick={() => { setSearch(''); setActiveSubject(null); setKind('all'); }}
                    className="font-sans text-sm font-semibold px-4 py-2 rounded-[6px] border border-ember text-ember bg-transparent hover:bg-ember hover:text-text-inverse transition-all duration-[var(--motion-quick)]"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
