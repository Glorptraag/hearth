'use client';

/**
 * Demo Library landing.
 *
 * Mirrors the header + tab anatomy of (auth)/library/LibraryClient.tsx
 * (Library title with italic subline, "Recently removed" button + Browse
 * Marketplace deep-link, then a left-aligned tab row with active-ember
 * underline). Two tabs ship: "In use" (seeded modules) and "Packs" (seeded
 * packs). Materials and Browse — both heavy data-dependent surfaces — are
 * deliberately omitted; Phase 4 mock-data can light them up.
 *
 * No /api/library, /api/library/modules, /api/library/status; no soft-delete
 * DELETE. The demo viewer can flip tabs and follow links into pack + module
 * detail surfaces, which is the actual interaction this surface signals.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Books,
  Sparkle,
  Play,
  CalendarBlank,
} from '@/components/icons';
import { mockPacks, mockModules } from '../mock-data';

type Tab = 'modules' | 'packs';

type ModuleStatus = 'in_flight' | 'planned' | 'recently_used';

const STATUS_BADGE: Record<ModuleStatus, { label: string; className: string; Icon: typeof Play | null }> = {
  in_flight: { label: 'In flight', className: 'bg-ember/15 text-ember border-ember/30', Icon: Play },
  planned: { label: 'Planned', className: 'bg-domain-science/15 text-domain-science border-domain-science/30', Icon: CalendarBlank },
  recently_used: { label: 'Recent', className: 'bg-sage/15 text-sage border-sage/30', Icon: null },
};

const SUBJECT_CHIP: Record<string, string> = {
  english: 'bg-domain-english/15 text-domain-english',
  mathematics: 'bg-domain-mathematics/15 text-domain-mathematics',
  science: 'bg-domain-science/15 text-domain-science',
  hass: 'bg-domain-hass/15 text-domain-hass',
  arts: 'bg-domain-arts/15 text-domain-arts',
  technologies: 'bg-domain-technologies/15 text-domain-technologies',
  hpe: 'bg-domain-hpe/15 text-domain-hpe',
  languages: 'bg-domain-languages/15 text-domain-languages',
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

// Seed a believable mix: first module in flight, second planned. The
// remaining mockModules are tagged as 'recently_used' so the "In use" tab
// always has content.
const DEMO_MODULE_STATUS: Record<string, ModuleStatus> = mockModules.reduce(
  (acc, m, i) => {
    acc[m.id] = i === 0 ? 'in_flight' : i === 1 ? 'planned' : 'recently_used';
    return acc;
  },
  {} as Record<string, ModuleStatus>
);

// Pack roll-up: one in-flight + one planned for the first pack, so the
// pack card surfaces both pill indicators.
const DEMO_PACK_ROLLUP: Record<string, { inFlight: number; planned: number }> = {
  [mockPacks[0]?.id ?? '']: { inFlight: 1, planned: 1 },
};

export default function DemoLibraryPage() {
  const [tab, setTab] = useState<Tab>('modules');

  return (
    <div className="min-h-screen bg-surface-body">
      <div className="max-w-[960px] mx-auto px-md py-xl lg:px-lg">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-md mb-lg">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-text-primary leading-tight mb-xs">
              Library
            </h1>
            <p className="font-serif text-sm text-text-secondary italic">
              Your family&apos;s learning collection
            </p>
          </div>
          <Link
            href="/demo/explore/marketplace"
            className="font-sans text-[0.8rem] font-medium text-ember hover:text-ember/80 transition-colors duration-200"
          >
            Browse Marketplace →
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-lg mb-xl border-b border-border-subtle overflow-x-auto scrollbar-none">
          {([
            { key: 'modules' as const, label: 'In use', count: mockModules.length },
            { key: 'packs' as const, label: 'Packs', count: mockPacks.length },
          ]).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-sm font-sans text-sm font-semibold transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] border-b-2 ${
                tab === key
                  ? 'text-ember border-ember'
                  : 'text-text-muted border-transparent hover:text-text-secondary'
              }`}
            >
              {label}
              <span className="ml-xs font-sans text-[0.72rem] text-text-muted">
                ({count})
              </span>
            </button>
          ))}
        </div>

        {/* Modules tab */}
        {tab === 'modules' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            {mockModules.map((m) => {
              const status = DEMO_MODULE_STATUS[m.id] ?? 'recently_used';
              const badge = STATUS_BADGE[status];
              const StatusIcon = badge.Icon;
              return (
                <Link
                  key={m.id}
                  href={`/demo/module/${m.id}`}
                  className="group block bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card hover:border-border-medium hover:shadow-hover hover:-translate-y-[2px] transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
                >
                  <div className="flex items-start justify-between gap-sm mb-sm">
                    <h3 className="font-serif text-[1rem] font-semibold text-text-primary line-clamp-2 flex-1">
                      {m.title}
                    </h3>
                    <span
                      className={`shrink-0 inline-flex items-center gap-xs font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-2 py-[3px] rounded-full border ${badge.className}`}
                    >
                      {StatusIcon ? <StatusIcon size={10} aria-hidden="true" /> : null}
                      {badge.label}
                    </span>
                  </div>
                  <p className="font-serif text-sm text-text-secondary line-clamp-2 mb-md">
                    {m.targetUnderstanding}
                  </p>
                  <div className="flex flex-wrap gap-xs mb-sm">
                    {m.subjects.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className={`font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                          SUBJECT_CHIP[s] ?? 'bg-surface-raised text-text-muted'
                        }`}
                      >
                        {SUBJECT_LABELS[s] ?? s}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-md font-sans text-[0.7rem] text-text-muted">
                    <span>Ages {m.ageRange.min}–{m.ageRange.max}</span>
                    <span>{m.duration.min}–{m.duration.max} min</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Packs tab */}
        {tab === 'packs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            {mockPacks.map((p) => {
              const rollup = DEMO_PACK_ROLLUP[p.id];
              return (
                <Link
                  key={p.id}
                  href={`/demo/pack/${p.id}`}
                  className="group block bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card hover:border-border-medium hover:shadow-hover hover:-translate-y-[2px] transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
                >
                  <div className="flex items-start gap-md">
                    <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md bg-surface-raised text-ember">
                      <Books size={22} weight="regular" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-[1rem] font-semibold text-text-primary mb-xs line-clamp-2">
                        {p.title}
                      </h3>
                      <p className="font-sans text-[0.7rem] text-text-muted">
                        {p.moduleCount} modules · Ages {p.ageRange.min}–{p.ageRange.max}
                      </p>
                    </div>
                  </div>
                  {rollup ? (
                    <div className="mt-md flex flex-wrap gap-xs">
                      {rollup.inFlight > 0 && (
                        <span className="inline-flex items-center gap-xs font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-2 py-[3px] rounded-full border bg-ember/15 text-ember border-ember/30">
                          <Play size={10} aria-hidden="true" />
                          {rollup.inFlight} in flight
                        </span>
                      )}
                      {rollup.planned > 0 && (
                        <span className="inline-flex items-center gap-xs font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-2 py-[3px] rounded-full border bg-domain-science/15 text-domain-science border-domain-science/30">
                          <CalendarBlank size={10} aria-hidden="true" />
                          {rollup.planned} planned
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-md inline-flex items-center gap-xs font-sans text-[0.65rem] text-text-muted">
                      <Sparkle size={10} aria-hidden="true" /> Saved
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
