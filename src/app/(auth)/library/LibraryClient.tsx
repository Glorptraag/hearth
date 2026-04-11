'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { LibraryMaterialsTab } from '@/components/content/LibraryMaterialsTab';

interface LibraryPack {
  sanityPackId: string;
  title: string;
  subjects?: string[];
}

type Tab = 'packs' | 'materials';

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
  const [packs, setPacks] = useState<LibraryPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('packs');

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/library');
      if (res.ok) {
        const data = await res.json();
        setPacks(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

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
          <Link
            href="/explore/marketplace"
            className="font-sans text-[0.8rem] font-medium text-ember hover:text-ember/80 transition-colors duration-200"
          >
            Browse Marketplace →
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-lg mb-xl border-b border-border-subtle">
          <button
            onClick={() => setTab('packs')}
            className={`pb-sm font-sans text-sm font-semibold transition-all duration-200 border-b-2 ${
              tab === 'packs'
                ? 'text-ember border-ember'
                : 'text-text-muted border-transparent hover:text-text-secondary'
            }`}
          >
            Packs
            {!loading && (
              <span className="ml-xs font-sans text-[0.72rem] text-text-muted">
                ({packs.length})
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('materials')}
            className={`pb-sm font-sans text-sm font-semibold transition-all duration-200 border-b-2 ${
              tab === 'materials'
                ? 'text-ember border-ember'
                : 'text-text-muted border-transparent hover:text-text-secondary'
            }`}
          >
            Materials
          </button>
        </div>

        {/* Content */}
        {tab === 'packs' && (
          <>
            {loading ? (
              <div className="py-20 text-center">
                <p className="font-sans text-sm text-text-muted animate-pulse">Loading library…</p>
              </div>
            ) : packs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-md" aria-hidden="true">📚</span>
                <h3 className="font-serif text-lg font-semibold text-text-primary mb-sm">
                  Your library is empty
                </h3>
                <p className="font-sans text-sm text-text-secondary mb-lg max-w-xs">
                  Browse the marketplace to add packs to your library and unlock activities and materials.
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
                {packs.map((pack) => (
                  <div
                    key={pack.sanityPackId}
                    className="group relative bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-soft hover:border-border-medium hover:shadow-warm hover:-translate-y-[2px] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                  >
                    <div className="absolute left-0 right-0 top-0 h-[2px] rounded-t-lg bg-ember opacity-0 group-hover:opacity-100 transition-opacity duration-[400ms]" />
                    <h3 className="font-serif text-[1rem] font-semibold text-text-primary mb-sm">
                      {pack.title}
                    </h3>
                    {pack.subjects && pack.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-xs">
                        {pack.subjects.map((s) => (
                          <span
                            key={s}
                            className={`font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${SUBJECT_CHIP[s] ?? 'bg-surface-raised text-text-muted'}`}
                          >
                            {SUBJECT_LABELS[s] ?? s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'materials' && (
          <LibraryMaterialsTab packs={packs} />
        )}
      </div>
    </div>
  );
}
