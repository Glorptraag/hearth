// Provider contracts for the logger coaching layer.
// The post-save nudge provider implements these interfaces so the surface can
// be independently upgraded to an LLM provider without touching the UI.

export type SnapshotSignals = {
  perChild: Record<string, { quiet: string[]; active: string[] }>;
  onboarding?: boolean;
};

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
