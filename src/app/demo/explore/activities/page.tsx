'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import DomainChip from '@/components/ui/DomainChip';
import { mockModules } from '../../mock-data';

const SUBJECTS = [
  'english', 'mathematics', 'science', 'hass',
  'arts', 'technologies', 'hpe', 'languages',
] as const;

const DURATION_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'quick', label: 'Quick (<30min)' },
  { key: 'medium', label: 'Medium (30–60min)' },
  { key: 'long', label: 'Long (60min+)' },
] as const;

export default function DemoActivities() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState('all');

  function toggleSubject(s: string) {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const filtered = useMemo(() => {
    return mockModules.filter((m) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !m.title.toLowerCase().includes(q) &&
          !m.targetUnderstanding.toLowerCase().includes(q)
        )
          return false;
      }
      if (
        selectedSubjects.length > 0 &&
        !m.subjects.some((s) => selectedSubjects.includes(s))
      )
        return false;
      if (selectedDuration === 'quick' && m.duration.max >= 30) return false;
      if (
        selectedDuration === 'medium' &&
        (m.duration.min < 30 || m.duration.max > 60)
      )
        return false;
      if (selectedDuration === 'long' && m.duration.min < 60) return false;
      return true;
    });
  }, [searchQuery, selectedSubjects, selectedDuration]);

  return (
    <div className="mx-auto max-w-5xl px-md py-xl">
      {/* Header + tabs */}
      <div className="mb-lg">
        <h1 className="font-serif text-2xl font-semibold text-text-primary tracking-[-0.02em] mb-md">
          Explore Activities
        </h1>
        <div className="flex gap-lg border-b border-border-subtle">
          <span className="pb-sm font-sans text-sm font-semibold text-ember border-b-2 border-ember">
            My Library
          </span>
          <Link
            href="/demo/explore/marketplace"
            className="pb-sm font-sans text-sm font-medium text-text-muted hover:text-text-secondary transition-colors duration-[var(--motion-quick)]"
          >
            Marketplace
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍  Search modules..."
          className="w-full bg-surface-raised border border-border-subtle rounded-md px-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none transition-colors duration-[var(--motion-quick)]"
        />
      </div>

      {/* Subject filters */}
      <div className="mb-md flex flex-wrap gap-sm">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => toggleSubject(s)}
            className={`transition-opacity duration-[var(--motion-quick)] ${
              selectedSubjects.length === 0 || selectedSubjects.includes(s)
                ? 'opacity-100'
                : 'opacity-40'
            }`}
          >
            <DomainChip subject={s} size="sm" showEmoji />
          </button>
        ))}
      </div>

      {/* Duration filters */}
      <div className="mb-xl flex gap-sm">
        {DURATION_FILTERS.map((d) => (
          <button
            key={d.key}
            onClick={() => setSelectedDuration(d.key)}
            className={`rounded-md px-md py-xs font-sans text-xs border transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
              selectedDuration === d.key
                ? 'border-ember text-ember bg-ember/10'
                : 'border-border-subtle text-text-muted hover:border-border-medium'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Module grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <Link
              key={m.id}
              href={`/demo/module/${m.id}`}
              className="group bg-surface-panel rounded-lg p-xl border border-border-subtle shadow-card transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:translate-y-[-2px] hover:border-border-medium hover:shadow-hover"
            >
              <h3 className="font-serif text-base font-semibold text-text-primary mb-sm">
                {m.title}
              </h3>
              <p className="font-serif text-sm text-text-secondary leading-relaxed mb-md line-clamp-2">
                {m.targetUnderstanding}
              </p>
              <div className="flex flex-wrap gap-xs mb-md">
                {m.subjects.map((s) => (
                  <DomainChip key={s} subject={s} size="sm" showEmoji />
                ))}
              </div>
              <div className="flex items-center gap-md font-sans text-xs text-text-muted">
                <span>Ages {m.ageRange.min}–{m.ageRange.max}</span>
                <span>{m.duration.min}–{m.duration.max} min</span>
                <span>{m.approaches.length} approaches</span>
              </div>
              <div className="mt-md">
                <span className="inline-block rounded-md bg-ember px-md py-xs font-sans text-xs font-semibold text-text-inverse group-hover:bg-ember-hover transition-colors duration-[var(--motion-quick)]">
                  Start
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-3xl text-center">
          <span className="text-4xl mb-md" aria-hidden="true">🔍</span>
          <p className="font-serif text-lg text-text-primary mb-sm">
            No modules match your filters
          </p>
          <p className="font-sans text-sm text-text-muted">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
