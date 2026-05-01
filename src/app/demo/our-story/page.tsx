'use client';

import { useState } from 'react';
import Link from 'next/link';
import { differenceInYears } from 'date-fns';
import { ChildSelector } from '@/components/ui/child-selector';
import LearnerAvatar from '@/components/ui/LearnerAvatar';
import { mockLearners, mockOurStoryLearners } from '../mock-data';

export default function DemoOurStoryHub() {
  const [selectedId, setSelectedId] = useState('1');

  const selected = mockLearners.find((l) => l.id === selectedId);
  const selectedProfile = mockOurStoryLearners.find((l) => l.id === selectedId);

  if (!selected || !selectedProfile) return null;

  const age = differenceInYears(new Date(), new Date(selected.dateOfBirth));
  const learningStartYear = new Date().getFullYear() - (selectedId.charCodeAt(0) % 3 + 1);

  return (
    <div className="mx-auto max-w-4xl px-md py-lg lg:py-2xl">
      {/* Child Selector */}
      <ChildSelector learners={mockLearners} selectedId={selectedId} onChange={setSelectedId} />

      {/* Selected Child Header */}
      <div className="mt-2xl mb-3xl flex flex-col items-center text-center">
        <LearnerAvatar name={selected.name} colourToken={selected.colourToken} size="lg" />
        <h1 className="mt-lg font-serif text-3xl font-semibold text-text-primary tracking-[-0.02em]">
          {selected.name}
        </h1>
        <p className="mt-xs font-sans text-sm text-text-muted">
          {age} years old • Learning since {learningStartYear}
        </p>
      </div>

      {/* Term Summary */}
      <div className="mb-3xl rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-card">
        <p className="font-serif text-text-secondary">{selectedProfile.termSummary}</p>
      </div>

      {/* Navigation Cards Grid */}
      <div className="mb-3xl grid grid-cols-1 gap-lg sm:grid-cols-2">
        <Link
          href={`/demo/our-story/portfolio?child=${selectedId}`}
          className="group rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-card hover:translate-y-[-2px] hover:border-border-medium hover:shadow-hover transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
        >
          <div className="mb-md text-3xl" aria-hidden="true">📷</div>
          <h3 className="mb-sm font-serif font-semibold text-text-primary">{selected.name}&apos;s Portfolio</h3>
          <p className="font-sans text-xs text-text-muted mb-md">
            {selectedProfile.portfolioThisTerm} evidence items this term
          </p>
          <div className="text-ember font-sans text-sm font-semibold">View portfolio →</div>
        </Link>

        <Link
          href={`/demo/our-story/report?child=${selectedId}`}
          className="group rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-card hover:translate-y-[-2px] hover:border-border-medium hover:shadow-hover transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
        >
          <div className="mb-md text-3xl" aria-hidden="true">📄</div>
          <h3 className="mb-sm font-serif font-semibold text-text-primary">Learning Report</h3>
          <p className="font-sans text-xs text-text-muted mb-md">
            {selectedProfile.heuSamplesReady} of 6 work samples ready
          </p>
          <div className="text-ember font-sans text-sm font-semibold">View report →</div>
        </Link>

        <Link
          href={`/demo/our-story/capabilities?child=${selectedId}`}
          className="group rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-card hover:translate-y-[-2px] hover:border-border-medium hover:shadow-hover transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
        >
          <div className="mb-md text-3xl" aria-hidden="true">🌟</div>
          <h3 className="mb-sm font-serif font-semibold text-text-primary">Capabilities</h3>
          <p className="font-sans text-xs text-text-muted mb-md">
            {selectedProfile.capabilityThreadsActive} threads active
          </p>
          <div className="text-ember font-sans text-sm font-semibold">View capabilities →</div>
        </Link>

        <Link
          href={`/demo/our-story/learner/${selectedId}`}
          className="group rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-card hover:translate-y-[-2px] hover:border-border-medium hover:shadow-hover transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
        >
          <div className="mb-md text-3xl" aria-hidden="true">💡</div>
          <h3 className="mb-sm font-serif font-semibold text-text-primary">About {selected.name}</h3>
          <p className="font-sans text-xs text-text-muted mb-md">
            Interests, strengths & learning style
          </p>
          <div className="text-ember font-sans text-sm font-semibold">View profile →</div>
        </Link>
      </div>

      {/* Recent Evidence Strip */}
      <div>
        <p className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
          Recent Evidence
        </p>
        <div className="flex gap-md overflow-x-auto pb-md">
          {selectedProfile.evidenceThumbs.map((emoji, idx) => (
            <div
              key={idx}
              className="shrink-0 flex h-[60px] w-[60px] items-center justify-center rounded-lg border border-border-subtle bg-surface-raised text-2xl shadow-card"
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
