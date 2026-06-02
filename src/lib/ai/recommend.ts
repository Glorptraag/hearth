import type { ChildSnapshot, SnapshotRecommendation, RecommendationReason } from '@/types/snapshot';

// ─── Types ───

export interface ScoringModule {
  _id: string;
  title: string;
  subjects: string[];
  capabilityThreadIds: string[];
  averageEnergyLevel: string | null;
  /**
   * Supply-side affinity tags from Sanity. Used by the pedagogy weight only —
   * never as a filter (Q10 invariant: a book-heavy CM module must still
   * surface to a Montessori family on spark/gap merit).
   */
  methodAffinity?: {
    pedagogies?: string[];
    interpretivePatterns?: string[];
  } | null;
}

export interface PedagogyContext {
  /** family_settings.pedagogyPreference */
  pedagogyKey: string;
  /** family_settings.pedagogyValues — currently informational, no weight contribution. */
  values: string[];
  /** family_settings.pedagogyPractices */
  practices: string[];
}

// ─── Weights (Phase 3 rebalance — Q10) ───
// Pedagogy is added, NEVER gated. The 6th weight pulls 5pts off spark, 5 off
// gap, 3 off repeat, and 2 off energy to make room for a 15pt pedagogy
// contribution. Net effect: modules tagged for the family's tradition get a
// gentle nudge, but a high spark / gap module from a different tradition
// still outranks a pedagogy-matched but low-signal module.

const W_SPARK = 0.30;
const W_GAP = 0.25;
const W_PEDAGOGY = 0.15;
const W_REPEAT = 0.12;
const W_ENERGY = 0.08;
const W_RECENCY = 0.10;

const MAX_RESULTS = 10;
const MAX_REPEAT_COMPLETIONS = 3;

// ─── Scoring Engine ───

/**
 * Pure deterministic scoring — no LLM, no DB calls.
 * Returns up to 10 scored recommendations sorted by priority_score desc.
 *
 * @param pedagogyContext optional family pedagogy preference. When omitted,
 *   W_PEDAGOGY is rerouted into spark (preserving overall ranking shape for
 *   pre-pedagogy callers and tests).
 */
export function scoreModules(
  modules: ScoringModule[],
  childSnapshots: Record<string, ChildSnapshot>,
  plannedModuleIds: string[],
  completedModuleCounts: Record<string, number>,
  weekSubjects: Set<string>,
  pedagogyContext?: PedagogyContext,
): SnapshotRecommendation[] {
  const plannedSet = new Set(plannedModuleIds);

  // Aggregate child signals across all children
  const allSparks = new Set<string>();
  const allGapSubjects = new Set<string>();
  const allFocusThreads = new Set<string>();
  const nonDemonstratingThreads = new Set<string>();
  const learnerIds = Object.keys(childSnapshots);

  for (const child of Object.values(childSnapshots)) {
    for (const spark of child.recent_activity.current_sparks) {
      allSparks.add(spark.name);
    }
    for (const subj of child.gap_analysis.underserved_subjects) {
      allGapSubjects.add(subj);
    }
    for (const tid of child.gap_analysis.suggested_focus_threads) {
      allFocusThreads.add(tid);
    }
    for (const thread of child.active_threads) {
      if (thread.suggested_tier !== 'demonstrating') {
        nonDemonstratingThreads.add(thread.thread_id);
      }
    }
  }

  // When no pedagogy context is supplied, redirect W_PEDAGOGY into W_SPARK so
  // pre-pedagogy callers (tests, legacy code) keep their existing ranking
  // semantics rather than seeing every module score lower across the board.
  const effectiveWSpark = pedagogyContext ? W_SPARK : W_SPARK + W_PEDAGOGY;
  const effectiveWPedagogy = pedagogyContext ? W_PEDAGOGY : 0;

  const familyPracticeSet = pedagogyContext
    ? new Set(pedagogyContext.practices)
    : new Set<string>();

  const scored: SnapshotRecommendation[] = [];

  for (const mod of modules) {
    if (plannedSet.has(mod._id)) continue;

    const completions = completedModuleCounts[mod._id] ?? 0;

    // ─── Spark match ───
    const sparkOverlap = mod.capabilityThreadIds.filter((s) => allSparks.has(s)).length;
    const sparkScore = mod.capabilityThreadIds.length > 0
      ? sparkOverlap / mod.capabilityThreadIds.length
      : 0;

    // ─── Gap fill ───
    const subjectGapOverlap = mod.subjects.filter((s) => allGapSubjects.has(s)).length;
    const threadGapOverlap = mod.capabilityThreadIds.filter((s) => allFocusThreads.has(s)).length;
    const gapScore = Math.min(1, (subjectGapOverlap * 0.6 + threadGapOverlap * 0.4));

    // ─── Pedagogy match (additive only, never a filter — Q10 invariant) ───
    let pedagogyScore = 0;
    if (pedagogyContext) {
      const tags = mod.methodAffinity ?? {};
      const pedagogyMatch = (tags.pedagogies ?? []).includes(pedagogyContext.pedagogyKey) ? 1 : 0;
      const patterns = tags.interpretivePatterns ?? [];
      const practiceOverlap = familyPracticeSet.size > 0 && patterns.length > 0
        ? patterns.filter((p) => familyPracticeSet.has(p)).length / patterns.length
        : 0;
      // 70/30 split between exact pedagogy match and practice/IP overlap so
      // a perfect-pedagogy module without IP tags still scores ~0.7.
      pedagogyScore = pedagogyMatch * 0.7 + practiceOverlap * 0.3;
    }

    // ─── Repeat value ───
    let repeatScore = 0;
    if (completions > 0 && completions < MAX_REPEAT_COMPLETIONS) {
      const hasNonDemThreads = mod.capabilityThreadIds.some((s) => nonDemonstratingThreads.has(s));
      repeatScore = hasNonDemThreads ? 0.8 - (completions * 0.2) : 0;
    }

    // ─── Energy match ───
    // Soft signal — moderate energy is always a decent fit
    const energyScore = mod.averageEnergyLevel === 'moderate' ? 0.6
      : mod.averageEnergyLevel === 'low' ? 0.4
      : mod.averageEnergyLevel === 'high' ? 0.5
      : 0.3;

    // ─── Recency penalty ───
    const subjectsAlreadyThisWeek = mod.subjects.filter((s) => weekSubjects.has(s)).length;
    const recencyPenalty = mod.subjects.length > 0
      ? 1 - (subjectsAlreadyThisWeek / mod.subjects.length) * 0.7
      : 1;

    const priorityScore =
      sparkScore * effectiveWSpark +
      gapScore * W_GAP +
      pedagogyScore * effectiveWPedagogy +
      repeatScore * W_REPEAT +
      energyScore * W_ENERGY +
      recencyPenalty * W_RECENCY;

    // Determine primary reason — pedagogy_match is one of the candidates but
    // only wins when no spark/gap/repeat signal exceeds it. This is what makes
    // Q10's invariant hold: a high-signal CM module surfaces to a Montessori
    // family with `spark_match` as the primary reason, NOT filtered out.
    const reasons: [RecommendationReason, number][] = [
      ['spark_match', sparkScore * effectiveWSpark],
      ['gap_fill', gapScore * W_GAP],
      ['pedagogy_match', pedagogyScore * effectiveWPedagogy],
      ['repeat_value', repeatScore * W_REPEAT],
      ['energy_match', energyScore * W_ENERGY],
    ];
    reasons.sort((a, b) => b[1] - a[1]);
    const primaryReason = reasons[0][0];

    // Find which children benefit most
    const targetLearnerIds = learnerIds.filter((id) => {
      const child = childSnapshots[id];
      const sparks = new Set(child.recent_activity.current_sparks.map((s) => s.name));
      const gaps = new Set<string>(child.gap_analysis.underserved_subjects);
      return mod.capabilityThreadIds.some((s) => sparks.has(s)) ||
        mod.subjects.some((s) => gaps.has(s));
    });

    scored.push({
      module_id: mod._id,
      module_title: mod.title,
      priority_score: Math.round(priorityScore * 1000) / 1000,
      primary_reason: primaryReason,
      reason_text: buildReasonText(primaryReason, mod, childSnapshots, targetLearnerIds, pedagogyContext),
      target_learner_ids: targetLearnerIds.length > 0 ? targetLearnerIds : learnerIds,
    });
  }

  return scored
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, MAX_RESULTS);
}

// ─── Reason text templates ───

function buildReasonText(
  reason: RecommendationReason,
  mod: ScoringModule,
  childSnapshots: Record<string, ChildSnapshot>,
  targetLearnerIds: string[],
  pedagogyContext?: PedagogyContext,
): string {
  const childName = targetLearnerIds.length === 1
    ? childSnapshots[targetLearnerIds[0]]?.name
    : null;

  switch (reason) {
    case 'spark_match': {
      const sparkThread = mod.capabilityThreadIds[0] ?? 'this area';
      const prefix = childName ? `${childName}'s` : 'Their';
      return `Builds on ${prefix} interest in ${sparkThread}`;
    }
    case 'gap_fill': {
      const subject = mod.subjects[0];
      if (subject) {
        const label = subject.charAt(0).toUpperCase() + subject.slice(1);
        return `${label} hasn't appeared recently`;
      }
      return 'Covers an area that needs attention';
    }
    case 'pedagogy_match': {
      // Translate via the pedagogy adapter would be ideal, but adapter is
      // client-side. Server-side recommend.ts uses a minimal label here; the
      // /explore + /marketplace cards re-phrase via the adapter at render time.
      const key = pedagogyContext?.pedagogyKey ?? 'your';
      const label = PEDAGOGY_DISPLAY[key] ?? key.replace(/_/g, ' ');
      return `Aligns with ${label} approach`;
    }
    case 'repeat_value': {
      const thread = mod.capabilityThreadIds[0] ?? 'key threads';
      const prefix = childName ? childName : 'They';
      return `Worth revisiting — ${prefix} is still developing ${thread}`;
    }
    case 'energy_match':
      return `Good fit for a ${mod.averageEnergyLevel ?? 'balanced'} session`;
  }
}

const PEDAGOGY_DISPLAY: Record<string, string> = {
  charlotte_mason: 'Charlotte Mason',
  classical: 'Classical',
  montessori: 'Montessori',
  waldorf_steiner: 'Waldorf',
  unschooling: 'unschooling',
  eclectic: 'an eclectic',
};
