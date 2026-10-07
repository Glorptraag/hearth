'use client';

import { use } from 'react';
import Link from 'next/link';
import { differenceInYears } from 'date-fns';
import { ArrowRight } from '@/components/icons';
import LearnerAvatar from '@/components/ui/LearnerAvatar';
import SectionHeader from '@/components/ui/SectionHeader';
import { mockLearners, mockLearnerProfiles } from '../../../mock-data';

export default function DemoLearnerProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const learner = mockLearners.find((l) => l.id === id);
  const profile = mockLearnerProfiles[id as keyof typeof mockLearnerProfiles];

  if (!learner || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-md py-lg lg:py-2xl">
        <div className="rounded-lg border border-border-subtle bg-surface-panel p-lg text-center">
          <p className="font-sans text-sm text-text-muted mb-lg">Learner not found</p>
          <Link
            href="/demo/our-story"
            className="inline-flex rounded-md bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse hover:bg-ember-hover transition duration-[var(--motion-quick)]"
          >
            Back to Our Story
          </Link>
        </div>
      </div>
    );
  }

  const age = differenceInYears(new Date(), new Date(learner.dateOfBirth));

  return (
    <div className="mx-auto max-w-4xl px-md py-lg lg:py-2xl">
      {/* Hero Section */}
      <div className="mb-3xl flex flex-col items-center text-center">
        <LearnerAvatar name={learner.name} colourToken={learner.colourToken} size="lg" />
        <h1 className="mt-lg font-serif text-3xl font-semibold text-text-primary tracking-[-0.02em]">
          {learner.name}
        </h1>
        <p className="mt-xs font-sans text-sm text-text-muted">
          Age {age}
        </p>
      </div>

      {/* About Section */}
      <div className="mb-3xl">
        <SectionHeader overline="ABOUT" title={learner.name} />
        <div className="mt-lg rounded-lg border border-border-subtle bg-surface-panel p-lg">
          <p className="font-serif text-text-secondary">{profile.about}</p>
        </div>
      </div>

      {/* Interests Section */}
      <div className="mb-3xl">
        <SectionHeader overline="SPARKS" title="Interests" />
        <div className="mt-lg flex flex-wrap gap-sm">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="rounded-full border border-border-subtle bg-surface-raised px-md py-xs font-sans text-sm text-text-primary hover:border-border-medium transition duration-[var(--motion-quick)]"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      {/* Strengths Section */}
      <div className="mb-3xl">
        <SectionHeader overline="STRENGTHS" title="Natural Abilities" />
        <div className="mt-lg flex flex-wrap gap-sm">
          {profile.strengths.map((strength) => (
            <span
              key={strength}
              className="rounded-full border border-border-subtle bg-surface-raised px-md py-xs font-sans text-sm text-text-primary hover:border-border-medium transition duration-[var(--motion-quick)]"
            >
              {strength}
            </span>
          ))}
        </div>
      </div>

      {/* Working Style Section */}
      <div className="mb-3xl">
        <SectionHeader overline="LEARNING STYLE" title="How They Learn Best" />
        <div className="mt-lg rounded-lg border border-border-subtle bg-surface-panel p-lg">
          <p className="font-serif text-text-secondary">{profile.workingStyle}</p>
        </div>
      </div>

      {/* Facilitator Notes Section */}
      <div className="mb-3xl">
        <SectionHeader overline="NOTES" title="Facilitator Observations" />
        <div className="mt-lg rounded-lg border border-border-subtle bg-surface-raised p-lg">
          <p className="font-serif italic text-text-secondary">{profile.facilitatorNotes}</p>
        </div>
      </div>

      {/* Bottom Links */}
      <div className="mt-3xl pt-lg border-t border-border-subtle space-y-sm">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-text-muted mb-lg">
          Explore
        </p>
        <Link
          href={`/demo/explore/activities?learner=${id}`}
          className="flex items-center justify-between rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-sans text-sm font-medium text-ember hover:bg-surface-panel hover:border-border-medium transition-[background-color,border-color] duration-[var(--motion-quick)] ease-[var(--ease-default)]"
        >
          Find activities for {learner.name}&apos;s interests <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <Link
          href="/demo/settings"
          className="flex items-center justify-between rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-sans text-sm font-medium text-ember hover:bg-surface-panel hover:border-border-medium transition-[background-color,border-color] duration-[var(--motion-quick)] ease-[var(--ease-default)]"
        >
          Edit {learner.name}&apos;s profile <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
