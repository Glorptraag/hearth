'use client';

import OurStoryHubClient from '@/components/our-story/OurStoryHubClient';
import { mockLearners, mockOurStoryLearners } from '../mock-data';

/**
 * Demo wrapper for the canonical Our Story hub.
 * Pure cosmetic surface: no auth, no fetches — feeds the live Client a
 * seeded learner list + per-learner stats map drawn from mock-data.
 *
 * Schema bridge: mockLearners has {displayOrder} but no {createdAt}; the
 * Client only reads createdAt for the "Learning since {month yyyy}" line,
 * so we synthesise one per learner from mockOurStoryLearners.learningSince.
 */

const learnersForHub = mockLearners.map((l) => {
  const profile = mockOurStoryLearners.find((p) => p.id === l.id);
  const createdAt = profile?.learningSince
    ? new Date(`${profile.learningSince} 1`).toISOString()
    : null;
  return {
    id: l.id,
    name: l.name,
    dateOfBirth: l.dateOfBirth,
    shapeIcon: l.shapeIcon,
    colourToken: l.colourToken,
    createdAt,
  };
});

const statsByLearner = Object.fromEntries(
  mockOurStoryLearners.map((p) => [
    p.id,
    {
      portfolioTotal: p.portfolioTotal,
      portfolioThisTerm: p.portfolioThisTerm,
      capabilityThreadsActive: p.capabilityThreadsActive,
      capabilityNearMilestone: p.capabilityNearMilestone,
      // Mock thumbs are emoji strings, not URLs — the hub's <img src> would
      // 404. Empty array triggers the "No evidence captured yet" copy, which
      // reads cleanly for a demo viewer who hasn't logged anything.
      recentEvidence: [] as string[],
    },
  ])
);

export default function DemoOurStoryPage() {
  return (
    <OurStoryHubClient
      mode="demo"
      basePath="/demo"
      initialLearners={learnersForHub}
      initialStatsByLearner={statsByLearner}
      initialFamilyState="QLD"
    />
  );
}
