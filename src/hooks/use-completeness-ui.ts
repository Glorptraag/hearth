'use client';

import { useMemo } from 'react';
import type { LoggerMode } from './use-logger-mode-and-snapshot';

export type UseCompletenessUiArgs = {
  /** Completeness score (0–100) from `scoreCompleteness()`. */
  completeness: number;
  /** Current Logger mode — determines the activity-type requirement. */
  loggerMode: LoggerMode;
  selectedLearners: string[];
  description: string;
  activityType: string | null;
  engagement: Record<string, number>;
  observations: string[];
};

export type UseCompletenessUiReturn = {
  /** Short tier label (e.g. "Excellent", "Strong", "Getting Started"). */
  label: string;
  /** Next-step hint that pairs with the label. */
  hint: string;
  /**
   * Concrete checklist of what's still missing before the entry can be saved.
   * Surfaced in the mobile save bar so the parent never has to guess why Save
   * is disabled.
   */
  missingItems: string[];
};

/**
 * UI-layer memos that translate a completeness score into save-bar copy.
 * Extracted from `app/(auth)/log/page.tsx`. The pure scoring logic stays in
 * `lib/logger/completeness.ts`; this hook just turns numbers into words.
 *
 * Behaviour preserved verbatim from the inline memos:
 *  - label/hint break-points: 90 / 70 / 55 / 40 / 20;
 *  - the missing-items checklist mirrors the original deps array exactly.
 */
export function useCompletenessUi({
  completeness,
  loggerMode,
  selectedLearners,
  description,
  activityType,
  engagement,
  observations,
}: UseCompletenessUiArgs): UseCompletenessUiReturn {
  const label = useMemo(() => {
    if (completeness >= 90) return 'Excellent';
    if (completeness >= 70) return 'Great';
    if (completeness >= 55) return 'Strong';
    if (completeness >= 40) return 'Good';
    if (completeness >= 20) return 'Basic';
    return 'Getting Started';
  }, [completeness]);

  const hint = useMemo(() => {
    if (completeness >= 90) return 'Ready to save';
    if (completeness >= 70) return 'Add evidence for richer record';
    if (completeness >= 55) return 'Add observations';
    if (completeness >= 40) return 'Rate engagement for each child';
    if (completeness >= 20) return 'Describe what happened';
    return 'Select who was learning';
  }, [completeness]);

  const missingItems = useMemo(() => {
    const items: string[] = [];
    if (selectedLearners.length === 0) items.push('Pick who was learning');
    if (description.trim().length <= 20) items.push('Describe what happened');
    if (loggerMode === 'guided' && !activityType) items.push('Choose an activity');
    if (selectedLearners.length > 0 && !selectedLearners.some((id) => engagement[id]))
      items.push('Rate engagement');
    if (observations.length === 0) items.push('Add an observation');
    return items;
  }, [selectedLearners, description, activityType, engagement, observations, loggerMode]);

  return { label, hint, missingItems };
}
