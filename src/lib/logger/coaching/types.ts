// Provider contracts for the logger coaching layer.
// All coaching surfaces (in-flight hints, post-save nudge) implement these
// interfaces so any surface can be independently upgraded to an LLM provider
// without touching the UI.

export type SnapshotSignals = {
  perChild: Record<string, { quiet: string[]; active: string[] }>;
  onboarding?: boolean;
};

export type CoachHintInput = {
  familyId: string;
  learnerIds: string[];
  activityType: string | null;
  description: string;
  observations: string[];
  snapshotSignals: SnapshotSignals;
};

export type CoachHint = {
  id: string;
  kind: 'pattern' | 'question' | 'teaching';
  title: string;
  body: string;
  sourceRef?: string;
};

export interface CoachHintProvider {
  getHints(input: CoachHintInput): Promise<CoachHint[]>;
}

export type NudgeInput = {
  familyId: string;
  primaryLearnerId: string;
  primaryLearnerName: string;
  snapshotSignals: SnapshotSignals;
};

export type ProfileNudge = {
  text: string;
  thread_id: string;
};

export interface NudgeProvider {
  getNudge(input: NudgeInput): Promise<ProfileNudge | null>;
}
