'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { sanityClient } from '@/lib/sanity/client';
import { PACKS_QUERY } from '@/lib/sanity/queries';
import { MarketplaceCard, type SanityPack, type Subject } from '@/components/screens/MarketplaceCard';

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
  const [packs, setPacks] = useState<SanityPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [libraryIds, setLibraryIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [sanityPacks, libraryRes] = await Promise.all([
        sanityClient.fetch<SanityPack[]>(PACKS_QUERY),
        fetch('/api/library'),
      ]);
      setPacks(sanityPacks ?? []);
      if (libraryRes.ok) {
        const library: { sanityPackId: string }[] = await libraryRes.json();
        setLibraryIds(new Set(library.map((l) => l.sanityPackId)));
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

  async function handleAddToLibrary(id: string) {
    setLibraryIds((prev) => new Set(prev).add(id));
    try {
      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sanityPackId: id }),
      });
    } catch {
      setLibraryIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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
            <span>📚</span>
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
          <span className="absolute left-sm top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">
            🔍
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
                  <MarketplaceCard
                    key={pack._id}
                    pack={pack}
                    inLibrary={libraryIds.has(pack._id)}
                    onAddToLibrary={handleAddToLibrary}
                  />
                ))}
              </div>
            ) : (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-4">🔭</span>
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
    </div>
  );
}
