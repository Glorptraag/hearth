// Pure completeness scoring function — extracted from log/page.tsx so it can
// be unit-tested without rendering the component. The page's useMemo calls
// this directly; nothing else changes.

import { DETAIL_CHIPS } from '@/components/logger/ObservationChipDetail';

export type CompletenessInput = {
  selectedLearners: string[];
  description: string;
  activityType: string | null;
  engagement: Record<string, number>;
  discoveries: Record<string, string>;
  observations: string[];
  observationDetails: Record<string, { detail: string; durationMin?: number }>;
  duration: string | null;
  location: string | null;
  evidence: unknown[];
  mode: 'guided' | 'quick';
};

export function scoreCompleteness(input: CompletenessInput): number {
  const {
    selectedLearners, description, discoveries, activityType,
    engagement, duration, location, observations, evidence,
    mode, observationDetails,
  } = input;

  let score = 0;

  if (selectedLearners.length > 0) score += 20;
  if (description.length > 20) score += 15;
  else if (description.length > 0) score += 5;

  if (selectedLearners.length > 0) {
    const withDisc = selectedLearners.filter((id) => (discoveries[id] || '').length > 10).length;
    score += Math.round((withDisc / selectedLearners.length) * 10);
  }

  if (activityType) score += 5;

  if (selectedLearners.length > 0) {
    const rated = selectedLearners.filter((id) => engagement[id]).length;
    score += Math.round((rated / selectedLearners.length) * 15);
  }

  score += 3; // date always pre-selected
  if (duration) score += 3;
  if (location) score += 4;

  if (observations.length >= 3) score += 15;
  else score += Math.min(observations.length * 5, 15);

  if (evidence.length >= 2) score += 10;
  else if (evidence.length === 1) score += 5;

  // ─── Guided Mode bonus gates ────────────────────────────────────────────
  if (mode === 'guided') {
    // Per-child discovery ≥20 chars on at least 1-in-4 engagement-rated children
    const ratedIds = selectedLearners.filter((id) => engagement[id]);
    if (ratedIds.length > 0) {
      const minWithDisc = Math.max(1, Math.ceil(ratedIds.length / 4));
      const withDeepDisc = ratedIds.filter((id) => (discoveries[id] || '').length >= 20).length;
      if (withDeepDisc >= minWithDisc) score += 5;
    }
    // At least one detail-capable chip with its detail field filled
    const hasDetailedObs = observations.some(
      (chip) => DETAIL_CHIPS.has(chip) && (observationDetails[chip]?.detail?.length ?? 0) > 0
    );
    if (hasDetailedObs) score += 5;
    // Activity required in Guided — penalise if missing
    if (!activityType) score = Math.max(score - 5, 0);
  }

  return Math.min(score, 100);
}

export const GUIDED_THRESHOLD = 65;
export const QUICK_THRESHOLD = 50;

export function canSaveEntry(score: number, mode: 'guided' | 'quick'): boolean {
  return score >= (mode === 'guided' ? GUIDED_THRESHOLD : QUICK_THRESHOLD);
}
