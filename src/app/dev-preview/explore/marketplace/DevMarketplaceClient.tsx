'use client';

import { useState, useMemo } from 'react';
import { MarketplaceCard, type SanityPack, type Subject } from '@/components/screens/MarketplaceCard';

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

interface DevMarketplaceClientProps {
  packs: SanityPack[];
}

export function DevMarketplaceClient({ packs }: DevMarketplaceClientProps) {
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [libraryIds, setLibraryIds] = useState<Set<string>>(new Set());
  const [source] = useState(packs === undefined ? 'fallback' : 'sanity');

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

  function handleAddToLibrary(id: string) {
    setLibraryIds((prev) => new Set(prev).add(id));
  }

  return (
    <div className="min-h-screen bg-surface-body">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at 15% 20%, rgba(217,123,58,0.06) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(217,123,58,0.04) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between pb-5 mb-6 border-b border-border-subtle">
          <a
            href="/dev-preview/dashboard"
            className="flex items-center gap-2 font-sans text-[0.8rem] font-medium text-text-secondary hover:text-ember transition-colors duration-200"
          >
            ← Dashboard
          </a>
          <div className="flex items-center gap-2">
            <span className="font-sans text-[0.7rem] text-text-muted bg-surface-raised border border-border-subtle rounded-full px-2 py-0.5">
              {source === 'sanity' ? '✓ Sanity' : '⚠ Fallback'}
            </span>
            <div className="flex items-center gap-2 font-sans text-[0.8rem] font-medium text-text-secondary bg-surface-raised border border-border-subtle rounded-[10px] px-3 py-2">
              <span aria-hidden="true">📚</span>
              <span>My Library</span>
              {libraryIds.size > 0 && (
                <span className="bg-ember text-text-inverse font-sans text-[0.65rem] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center">
                  {libraryIds.size}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="font-serif text-[clamp(1.75rem,4vw,2.25rem)] font-bold text-text-primary leading-tight mb-1">
            Marketplace
          </h1>
          <p className="font-serif text-[clamp(0.95rem,2vw,1.05rem)] text-text-secondary italic">
            Curate your family&rsquo;s learning library
          </p>
        </div>

        <div className="relative mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search packs, modules, or creators…"
            className="w-full bg-surface-panel border border-border-subtle rounded-[10px] pl-9 pr-4 py-3 font-sans text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium transition-colors duration-200"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
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

        <p className="font-sans text-[0.75rem] text-text-muted mb-5">
          {filtered.length === packs.length
            ? `Showing all ${filtered.length} packs`
            : `Showing ${filtered.length} of ${packs.length} packs`}
        </p>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4" aria-hidden="true">🔭</span>
            <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
              No content matches your filters
            </h3>
            <p className="font-sans text-sm text-text-secondary mb-6 max-w-xs">
              Try adjusting your search or selecting a different subject area.
            </p>
            <button
              onClick={() => { setSearch(''); setActiveSubject(null); }}
              className="font-sans text-sm font-semibold px-4 py-2 rounded-[6px] border border-ember text-ember bg-transparent hover:bg-ember hover:text-text-inverse transition-all duration-200"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
