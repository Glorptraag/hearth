import type { ObservationStatus, Subject } from './index';

// ─── Per-child capability thread (enhanced) ───

export type ThreadTrajectory = 'steady_growth' | 'accelerating' | 'plateau' | 'new';
export type EvidenceQuality = 'weak' | 'adequate' | 'strong';

export interface SnapshotActiveThread {
  thread_id: string;
  thread_name: string;
  observation_count: number;
  last_evidence_date: string;
  // WS-4: DLO-evidence-derived. 'unobserved' ("Not yet") when a thread has
  // logging volume but no DLO evidence clears the bar.
  suggested_tier: ObservationStatus | 'unobserved';
  current_badge_level: string | null;
  next_badge: string | null;
  next_badge_progress: number;
  trajectory: ThreadTrajectory;
  recent_evidence_quality: EvidenceQuality;
  source_counts?: { inferred: number; declared: number };
}

// ─── Recommendations (Phase 2) ───

export type RecommendationReason =
  | 'spark_match'
  | 'gap_fill'
  | 'repeat_value'
  | 'energy_match'
  | 'pedagogy_match';

export interface SnapshotRecommendation {
  module_id: string;
  module_title: string;
  priority_score: number;
  primary_reason: RecommendationReason;
  reason_text: string;
  target_learner_ids: string[];
}

// ─── Planner suggestions (Phase 2) ───

export type SubjectBalance = 'balanced' | 'under' | 'over';

export interface SnapshotPlannerSuggestion {
  module_id: string;
  module_title: string;
  suggested_day: string;
  reason: RecommendationReason;
  reason_text: string;
}

// ─── Badge threshold ───

export interface SnapshotBadgeReady {
  badge_id: string;
  thread_id: string | null;
  observations_required: number;
  observations_confirmed: number;
}

export interface SnapshotBadgeApproaching {
  badge_id: string;
  thread_id: string | null;
  observations_remaining: number;
}

// ─── Per-child snapshot ───

export interface ChildSnapshot {
  learner_id: string;
  name: string;
  curriculum_coverage: Record<string, {
    total_entries: number;
    unique_descriptors: number;
    coverage_percentage: number;
  }>;
  active_threads: SnapshotActiveThread[];
  badge_thresholds: {
    ready: SnapshotBadgeReady[];
    approaching: SnapshotBadgeApproaching[];
  };
  recent_activity: {
    entries_last_7_days: number;
    entries_last_30_days: number;
    subjects_this_week: string[];
    current_sparks: { name: string; count: number }[];
  };
  gap_analysis: {
    underserved_subjects: Subject[];
    suggested_focus_threads: string[];
  };
  monthly_narrative: string;
  // Per-DLO status keyed by Sanity DLO `_id`. Absent before any DLO links exist
  // for the learner (older snapshots, or before Phase 2 rebuild) — readers must
  // default to 'not-started' when the entry is missing.
  dlo_status?: Record<string, DloStatusEntry>;
}

export type DloStatusValue = 'emerging' | 'developing' | 'demonstrating' | 'not-started';

export interface DloStatusEntry {
  status: DloStatusValue | string;
  confidence: number | null;
  last_observed_at: string | null;
  // True when this learner has an explicit parent assertion ("Yes, I've seen
  // this") for the DLO — an `asserted`, observation-less link. Lets the
  // constellation render the parent-facing confirm control as "Confirmed"
  // (and offer "Clear") durably across reloads, not just optimistically.
  // Absent on snapshots written before the T2 confirm loop landed.
  asserted_by_parent?: boolean;
}

// ─── Family-wide snapshot ───

export interface ComplianceStatus {
  next_report_due: string | null;
  days_until_due: number | null;
  coverage_sufficient: boolean;
}

/**
 * Dual-read for the 2026-06 jurisdiction rename: rebuilds now write
 * `compliance_status`; snapshots persisted before the rename still carry
 * `heu_status`. No SQL migration — stored JSONB is rewritten naturally on
 * the family's next rebuild.
 */
export function getComplianceStatus(
  family: Pick<SnapshotData['family'], 'compliance_status' | 'heu_status'> | null | undefined,
): ComplianceStatus | null {
  return family?.compliance_status ?? family?.heu_status ?? null;
}

export interface SnapshotData {
  family_id: string;
  rebuilt_at: string;
  rebuild_trigger: string;
  children: Record<string, ChildSnapshot>;
  family: {
    total_entries: number;
    entries_this_term: number;
    active_learners: number;
    pedagogy_key: string;
    dashboard_summary: {
      celebration_message: string;
      nudge_message: string | null;
      streak_count: number;
    };
    compliance_status: ComplianceStatus;
    /** @deprecated Pre-2026-06 snapshots wrote this key; read via getComplianceStatus(). */
    heu_status?: ComplianceStatus;
  };
  recommendations?: {
    suggested_next: SnapshotRecommendation[];
    subject_balance: Record<string, SubjectBalance>;
  };
  planner_suggestions?: SnapshotPlannerSuggestion[];
  pending_notifications: unknown[];
  // Flat fields for dashboard summary card compatibility
  activityStreak: number;
  weeklyThreadCoverage: number;
  activeModulesCount: number;
  lastLogDate: string | null;
}
