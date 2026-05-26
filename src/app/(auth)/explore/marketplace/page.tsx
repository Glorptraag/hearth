'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { sanityClient } from '@/lib/sanity/client';
import { PACKS_QUERY } from '@/lib/sanity/queries';
import { MarketplaceCard, type SanityPack, type Subject, type CreatorType } from '@/components/screens/MarketplaceCard';
import { PackMaterialsList } from '@/components/content/PackMaterialsList';
import { PackIndicators } from '@/components/ui/PackIndicators';
import {
  Binoculars, Target, Books, MagnifyingGlass, Confetti, X,
  FlowerLotus, GraduationCap, Heart, Sparkle,
} from '@/components/icons';
import type { ComponentType as MpComponentType } from 'react';

type MpIconC = MpComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;
import { useToast } from '@/hooks/use-toast';
import { track } from '@/lib/analytics/posthog';

function getCreatorIcon(type?: CreatorType): MpIconC {
  switch (type) {
    case 'content-team': return FlowerLotus;
    case 'educator':     return GraduationCap;
    case 'parent':       return Heart;
    default:             return Sparkle;
  }
}

function getCreatorLabel(type?: CreatorType): string {
  switch (type) {
    case 'content-team': return 'Hearth Team';
    case 'educator':     return 'Educator';
    case 'parent':       return 'Parent Creator';
    default:             return 'Creator';
  }
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const { toast } = useToast();
  const [packs, setPacks] = useState<SanityPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [libraryIds, setLibraryIds] = useState<Set<string>>(new Set());
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [detailPack, setDetailPack] = useState<SanityPack | null>(null);
  const [showMaterials, setShowMaterials] = useState(false);
  const [gapSubjects, setGapSubjects] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [sanityPacks, libraryRes, entitlementsRes, snapshotRes] = await Promise.all([
        sanityClient.fetch<SanityPack[]>(PACKS_QUERY),
        fetch('/api/library'),
        fetch('/api/entitlements').catch(() => null),
        fetch('/api/snapshot').catch(() => null),
      ]);
      setPacks(sanityPacks ?? []);
      if (libraryRes.ok) {
        const library: Array<{ id: string; kind: 'pack' | 'module' }> = await libraryRes.json();
        setLibraryIds(new Set(library.filter((l) => l.kind === 'pack').map((l) => l.id)));
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return packs.filter((pack) => {
      const matchesSearch =
        !q ||
        pack.title.toLowerCase().includes(q) ||
        (pack.creator ?? '').toLowerCase().includes(q) ||
        (pack.description ?? '').toLowerCase().includes(q);
      const matchesSubject = !activeSubject || (pack.subjects ?? []).includes(activeSubject);
      return matchesSearch && matchesSubject;
    });
  }, [search, activeSubject, packs]);

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

  async function handleAddToLibrary(id: string) {
    setLibraryIds((prev) => new Set(prev).add(id));
    try {
      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sanityPackId: id }),
      });
      track('module_added_to_library');
    } catch {
      setLibraryIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast("Couldn't add to library — please try again", 'error');
    }
  }

  const libraryCount = libraryIds.size;

  return (
    <div className="min-h-screen bg-surface-body">
      <div className="relative z-10 max-w-[1280px] mx-auto px-md py-xl lg:px-lg">
        {/* ── Top nav ── */}
        <div className="flex items-center justify-between pb-lg mb-lg border-b border-border-subtle">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-sans text-[0.8rem] font-medium text-text-secondary hover:text-ember transition-colors duration-200"
          >
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2 font-sans text-[0.8rem] font-medium text-text-secondary bg-surface-raised border border-border-subtle rounded-[10px] px-3 py-2 hover:border-border-medium hover:text-ember transition-all duration-200 cursor-pointer">
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
            className="w-full bg-surface-panel border border-border-subtle rounded-[10px] pl-[36px] pr-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium transition-colors duration-200"
          />
        </div>

        {/* ── Subject filter pills ── */}
        <div className="flex flex-wrap gap-xs mb-xl">
          <button
            onClick={() => setActiveSubject(null)}
            className={`font-sans text-[0.75rem] font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 ${
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
                className="font-sans text-[0.75rem] font-semibold px-3 py-1.5 rounded-full border transition-all duration-200"
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
            <p className="font-sans text-sm text-text-muted animate-pulse">Loading packs…</p>
          </div>
        ) : (
          <>
            {/* ── Editor's Picks ── */}
            {packs.length > 0 && (
              <div className="mb-xl">
                <p className="mb-sm font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Editor&apos;s Picks
                </p>
                <div className="flex gap-md overflow-x-auto pb-sm scrollbar-none">
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
                        className="relative shrink-0 w-[200px] rounded-[10px] border border-border-subtle bg-surface-panel p-md overflow-hidden"
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

            {/* ── Family Fit Banner ── */}
            {gapSubjects.length > 0 && (
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
                      Your learning journey has room to grow in{' '}
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
            {packs.length > 0 && filtered.length > 0 && filtered.every((p) => libraryIds.has(p._id)) && (
              <div className="mb-lg rounded-[10px] border border-sage/20 bg-sage/5 px-lg py-sm">
                <p className="inline-flex items-center gap-xs font-serif text-sm text-sage">
                  <Confetti size={16} aria-hidden="true" />
                  You&rsquo;ve added everything here — nice curation!
                </p>
              </div>
            )}

            {/* ── Results count ── */}
            <p className="font-sans text-[0.75rem] text-text-muted mb-lg">
              {filtered.length === packs.length
                ? `Showing all ${filtered.length} packs`
                : `Showing ${filtered.length} of ${packs.length} packs`}
            </p>

            {/* ── Content grid ── */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
                {filtered.map((pack) => (
                  <div
                    key={pack._id}
                    onClick={() => setDetailPack(pack)}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
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
              </div>
            ) : (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="mb-4 inline-flex text-text-secondary" aria-hidden="true">
                  <Binoculars size={32} />
                </span>
                <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                  {packs.length === 0
                    ? 'No packs published yet'
                    : 'No content matches your filters'}
                </h3>
                <p className="font-sans text-sm text-text-secondary mb-6 max-w-xs">
                  {packs.length === 0
                    ? 'Content packs will appear here once they are published in Sanity.'
                    : 'Try adjusting your search or selecting a different subject area.'}
                </p>
                {packs.length > 0 && (
                  <button
                    onClick={() => { setSearch(''); setActiveSubject(null); }}
                    className="font-sans text-sm font-semibold px-4 py-2 rounded-[6px] border border-ember text-ember bg-transparent hover:bg-ember hover:text-text-inverse transition-all duration-200"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pack detail modal */}
      {detailPack && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-modal backdrop-blur-sm p-0 sm:p-lg"
          onClick={() => { setDetailPack(null); setShowMaterials(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pack-detail-title"
            tabIndex={-1}
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-[24px] sm:rounded-[16px] bg-surface-panel border border-border-subtle shadow-[0_24px_64px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Escape') { setDetailPack(null); setShowMaterials(false); } }}
          >
            {/* Drag handle — mobile only */}
            <div className="mx-auto mt-sm h-1 w-10 rounded-full bg-border-medium sm:hidden" />

            {/* Ember top line */}
            <div className="absolute left-0 right-0 top-0 h-[2px] rounded-t-[16px] bg-ember opacity-70 hidden sm:block" />

            {/* Header */}
            <div className="px-xl pt-lg pb-md border-b border-border-subtle">
              <div className="flex items-start justify-between gap-md">
                <div className="flex-1">
                  <p className="mb-xs font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                    {detailPack.subjects?.slice(0, 2).join(' · ') ?? 'Learning Pack'}
                  </p>
                  <h2 id="pack-detail-title" className="font-serif text-xl font-semibold text-text-primary leading-snug">
                    {detailPack.title}
                  </h2>
                </div>
                <button
                  onClick={() => { setDetailPack(null); setShowMaterials(false); }}
                  className="shrink-0 rounded-full border border-border-subtle p-xs text-text-muted hover:text-text-primary transition-colors duration-200"
                  aria-label="Close"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-xl py-lg space-y-lg">
              {detailPack.description && (
                <p className="font-serif text-sm leading-relaxed text-text-secondary">
                  {detailPack.description}
                </p>
              )}

              <PackIndicators
                context="detail"
                printables={detailPack.printables}
                materials={detailPack.materials}
              />

              {/* Creator */}
              <div>
                <p className="mb-sm font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Creator
                </p>
                <div className="flex items-center gap-xs">
                  <span className="inline-flex text-text-secondary" aria-hidden="true">
                    {(() => {
                      const CreatorIcon = getCreatorIcon(detailPack.creatorType);
                      return <CreatorIcon size={14} />;
                    })()}
                  </span>
                  <span className="font-serif text-sm text-text-primary">
                    {detailPack.creator ?? 'Hearth Team'}
                  </span>
                  <span className="font-sans text-[10px] text-text-muted bg-surface-raised rounded-full px-xs py-[1px] border border-border-subtle">
                    {getCreatorLabel(detailPack.creatorType)}
                  </span>
                </div>
              </div>

              {/* Age range & duration */}
              <div className="grid grid-cols-2 gap-md">
                {detailPack.ageRange && (
                  <div>
                    <p className="mb-xs font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                      Age Range
                    </p>
                    <p className="font-serif text-sm text-text-primary">
                      {detailPack.ageRange.min}–{detailPack.ageRange.max} years
                    </p>
                  </div>
                )}
                {detailPack.moduleCount && (
                  <div>
                    <p className="mb-xs font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                      Modules
                    </p>
                    <p className="font-serif text-sm text-text-primary">{detailPack.moduleCount}</p>
                  </div>
                )}
              </div>

              {/* Included Materials */}
              {(() => {
                const printCount = (detailPack.assetCounts?.total ?? 0) - (detailPack.assetCounts?.audio ?? 0);
                const readCount = detailPack.commonsTextCount ?? 0;
                const audioCount = detailPack.assetCounts?.audio ?? 0;
                const hasMaterials = printCount > 0 || readCount > 0 || audioCount > 0;
                if (!hasMaterials) return null;

                const parts: string[] = [];
                if (printCount > 0) parts.push(`${printCount} printable${printCount !== 1 ? 's' : ''}`);
                if (readCount > 0) parts.push(`${readCount} reading${readCount !== 1 ? 's' : ''}`);
                if (audioCount > 0) parts.push(`${audioCount} audio`);

                return (
                  <div>
                    <p className="mb-sm font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                      Included Materials
                    </p>
                    <p className="font-serif text-sm text-text-secondary mb-sm">
                      {parts.join(' · ')}
                    </p>
                    <button
                      onClick={() => setShowMaterials(true)}
                      className="font-sans text-[0.8rem] font-medium text-ember hover:text-ember/80 transition-colors duration-200"
                    >
                      View all materials →
                    </button>
                  </div>
                );
              })()}

              {/* Action */}
              <div className="pt-sm border-t border-border-subtle">
                {libraryIds.has(detailPack._id) ? (
                  <button
                    disabled
                    className="w-full bg-sage/20 text-sage font-sans font-semibold rounded-md px-md py-sm text-sm cursor-default"
                  >
                    In Library
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleAddToLibrary(detailPack._id);
                      setDetailPack(null);
                    }}
                    className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember/90 transition-all duration-200"
                  >
                    Add to Library
                  </button>
                )}
              </div>
            </div>

            {/* Materials push-over view */}
            {showMaterials && (
              <div className="absolute inset-0 bg-surface-panel rounded-t-[24px] sm:rounded-[16px] z-10 flex flex-col overflow-hidden">
                <PackMaterialsList
                  packId={detailPack._id}
                  packTitle={detailPack.title}
                  inLibrary={libraryIds.has(detailPack._id)}
                  onBack={() => setShowMaterials(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
