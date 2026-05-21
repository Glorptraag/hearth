import { db } from '@/lib/db';
import {
  learningEntries,
  learners,
  familySettings,
  familyIntelligenceSnapshots,
  badgeDefinitions,
  badgeAwards,
  familyLibrary,
  plannerEntries,
  learnerDloStatus,
} from '@/lib/db/schema';
import { eq, and, desc, gte, lte, count, inArray } from 'drizzle-orm';
import { subDays, addDays, startOfWeek, differenceInCalendarDays, format, startOfMonth } from 'date-fns';
import type { EnrichmentResult } from './enrich';
import {
  triggerBadgeReady,
  triggerComplianceNudge,
  triggerStreakPrompt,
  triggerModuleNudge,
  cleanStaleNotifications,
} from '@/lib/notifications/triggers';
import { generateMonthlyNarrative } from './generate-monthly-narrative';
import { getCachedThreads } from './sanity-thread-cache';
import { scoreModules, type ScoringModule } from './recommend';
import { sanityClient } from '@/lib/sanity/client';
import { SCORING_MODULES_QUERY, SCORING_OWN_MODULES_QUERY } from '@/lib/sanity/queries';
import type {
  SnapshotActiveThread, SnapshotPlannerSuggestion, ChildSnapshot,
  ThreadTrajectory, EvidenceQuality, SubjectBalance,
} from '@/types/snapshot';

type RebuildTrigger = 'entry_saved' | 'library_change' | 'settings_change' | 'manual';

export async function rebuildSnapshot(
  familyId: string,
  trigger: RebuildTrigger = 'entry_saved'
): Promise<void> {
  const startTime = Date.now();

  try {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

    const [familyLearners, settings, allEntries, badges, libraryPackIds, weekPlanned] = await Promise.all([
      db.select().from(learners).where(eq(learners.familyId, familyId)),
      db.query.familySettings.findFirst({ where: eq(familySettings.familyId, familyId) }),
      db
        .select()
        .from(learningEntries)
        .where(and(eq(learningEntries.familyId, familyId), eq(learningEntries.status, 'complete')))
        .orderBy(desc(learningEntries.dateOccurred)),
      db.select().from(badgeDefinitions).where(eq(badgeDefinitions.familyId, familyId)),
      db
        .select({ sanityPackId: familyLibrary.sanityPackId })
        .from(familyLibrary)
        .where(eq(familyLibrary.familyId, familyId)),
      db
        .select({ moduleId: plannerEntries.moduleId, date: plannerEntries.date, subjects: plannerEntries.subjects })
        .from(plannerEntries)
        .where(
          and(
            eq(plannerEntries.familyId, familyId),
            gte(plannerEntries.date, weekStartStr),
            lte(plannerEntries.date, weekEndStr)
          )
        ),
    ]);

    const sevenDaysAgo = format(subDays(now, 7), 'yyyy-MM-dd');
    const thirtyDaysAgo = format(subDays(now, 30), 'yyyy-MM-dd');

    const childSnapshots: Record<string, unknown> = {};
    const pendingNotifications: unknown[] = [];

    // Load per-learner DLO state once for the whole family. Indexed by learner_id
    // so each child gets its own slice without an N+1.
    const learnerIds = familyLearners.map((l) => l.id);
    const dloRows = learnerIds.length > 0
      ? await db
          .select()
          .from(learnerDloStatus)
          .where(inArray(learnerDloStatus.learnerId, learnerIds))
      : [];
    const dloStatusByLearner: Record<string, Record<string, { status: string; confidence: number | null; last_observed_at: string | null }>> = {};
    for (const row of dloRows) {
      const bucket = (dloStatusByLearner[row.learnerId] ||= {});
      bucket[row.dloId] = {
        status: row.status,
        confidence: row.confidence ? Number(row.confidence) : null,
        last_observed_at: row.lastObservedAt ? row.lastObservedAt.toISOString() : null,
      };
    }

    for (const child of familyLearners) {
      const childEntries = allEntries.filter((e) =>
        e.learnerIds?.includes(child.id)
      );

      const subjectCounts: Record<string, number> = {};
      const threadCounts: Record<string, { count: number; lastDate: string; tier: string }> = {};
      const descriptorSet = new Set<string>();

      for (const entry of childEntries) {
        for (const subj of entry.subjects ?? []) {
          subjectCounts[subj] = (subjectCounts[subj] ?? 0) + 1;
        }

        const enrichment = entry.aiEnrichment as EnrichmentResult | null;
        if (enrichment) {
          for (const thread of enrichment.capability_threads ?? []) {
            const existing = threadCounts[thread.thread_id];
            if (existing) {
              existing.count++;
              if (entry.dateOccurred > existing.lastDate) {
                existing.lastDate = entry.dateOccurred;
              }
            } else {
              threadCounts[thread.thread_id] = {
                count: 1,
                lastDate: entry.dateOccurred,
                tier: 'emerging',
              };
            }
          }
          for (const desc of enrichment.curriculum_descriptors ?? []) {
            descriptorSet.add(desc.code);
          }
        }
      }

      // Compute tiers based on observation count
      const tierOverrides = (child.profileData as Record<string, unknown>)?.tierOverrides as
        Record<string, { tier: string }> | null | undefined;
      for (const [threadId, data] of Object.entries(threadCounts)) {
        if (data.count >= 8) data.tier = 'demonstrating';
        else if (data.count >= 4) data.tier = 'developing';
        else data.tier = 'emerging';

        // Parent override takes precedence (can only lower, never raise)
        const override = tierOverrides?.[threadId];
        if (override) {
          const tierRank = { emerging: 0, developing: 1, demonstrating: 2 };
          const autoRank = tierRank[data.tier as keyof typeof tierRank] ?? 0;
          const overrideRank = tierRank[override.tier as keyof typeof tierRank] ?? 0;
          if (overrideRank < autoRank) {
            data.tier = override.tier;
          }
        }
      }

      // Count AC V9 descriptors per subject from AI enrichment
      const descriptorsBySubject: Record<string, Set<string>> = {};
      for (const entry of childEntries) {
        const enrichment = entry.aiEnrichment as EnrichmentResult | null;
        if (enrichment) {
          for (const desc of enrichment.curriculum_descriptors ?? []) {
            // AC9 codes start with AC9 + subject abbreviation (e.g. AC9E = English, AC9MA = Maths)
            const code = desc.code;
            for (const [subj, prefix] of Object.entries({
              english: 'AC9E',
              mathematics: 'AC9MA',
              science: 'AC9S',
              hass: 'AC9HS',
              arts: 'AC9A',
              technologies: 'AC9T',
              hpe: 'AC9HP',
              languages: 'AC9L',
            })) {
              if (code.startsWith(prefix)) {
                if (!descriptorsBySubject[subj]) descriptorsBySubject[subj] = new Set();
                descriptorsBySubject[subj].add(code);
              }
            }
          }
        }
      }

      // Curriculum coverage by subject
      const curriculumCoverage: Record<string, unknown> = {};
      const allSubjects = ['english', 'mathematics', 'science', 'hass', 'arts', 'technologies', 'hpe', 'languages'];
      for (const subj of allSubjects) {
        const touched = subjectCounts[subj] ?? 0;
        const descriptorCount = descriptorsBySubject[subj]?.size ?? 0;
        curriculumCoverage[subj] = {
          total_entries: touched,
          unique_descriptors: descriptorCount,
          coverage_percentage: Math.min(100, Math.round((touched / 20) * 100)),
        };
      }

      // Badge threshold detection + per-thread badge mapping
      const badgeReady: unknown[] = [];
      const badgeApproaching: unknown[] = [];
      // Track per-thread: highest awarded badge + next badge progress
      const threadBadgeMap: Record<string, { current: string | null; next: string | null; nextProgress: number }> = {};

      // Fetch awarded badges for this child
      const childAwards = await db
        .select({ badgeDefinitionId: badgeAwards.badgeDefinitionId })
        .from(badgeAwards)
        .where(eq(badgeAwards.learnerId, child.id));
      const awardedBadgeIds = new Set(childAwards.map((a) => a.badgeDefinitionId));

      for (const badge of badges) {
        const threadIds = badge.capabilityThreadIds ?? [];
        const threshold = badge.observationThreshold ?? 5;

        let totalObs = 0;
        for (const tid of threadIds) {
          totalObs += threadCounts[tid]?.count ?? 0;
        }

        const isAwarded = awardedBadgeIds.has(badge.id);

        // Build per-thread badge progression
        for (const tid of threadIds) {
          const existing = threadBadgeMap[tid];
          if (isAwarded) {
            // Track highest awarded badge for this thread
            if (!existing || existing.current === null) {
              threadBadgeMap[tid] = {
                current: badge.title,
                next: existing?.next ?? null,
                nextProgress: existing?.nextProgress ?? 0,
              };
            }
          } else {
            // Track next unearned badge and progress toward it
            const progress = Math.min(1, totalObs / threshold);
            if (!existing || (existing.next === null && progress > 0)) {
              threadBadgeMap[tid] = {
                current: existing?.current ?? null,
                next: badge.title,
                nextProgress: progress,
              };
            }
          }
        }

        if (isAwarded) continue;

        if (totalObs >= threshold) {
          badgeReady.push({
            badge_id: badge.id,
            thread_id: threadIds[0] ?? null,
            observations_required: threshold,
            observations_confirmed: totalObs,
          });
          pendingNotifications.push({
            type: 'badge_ready',
            target_learner_id: child.id,
            payload: {
              badge_id: badge.id,
              badge_title: badge.title,
              badge_emoji: badge.emoji,
              learner_id: child.id,
              learner_name: child.name,
            },
          });
        } else if (totalObs >= threshold - 2) {
          badgeApproaching.push({
            badge_id: badge.id,
            thread_id: threadIds[0] ?? null,
            observations_remaining: threshold - totalObs,
          });
        }
      }

      // Trajectory: 4-week window split into two 14-day halves
      const fourteenDaysAgo = format(subDays(now, 14), 'yyyy-MM-dd');
      const twentyEightDaysAgo = format(subDays(now, 28), 'yyyy-MM-dd');
      const recentWindow = childEntries.filter((e) => e.dateOccurred >= fourteenDaysAgo);
      const priorWindow = childEntries.filter(
        (e) => e.dateOccurred >= twentyEightDaysAgo && e.dateOccurred < fourteenDaysAgo
      );

      function computeTrajectory(threadId: string): ThreadTrajectory {
        const total = threadCounts[threadId]?.count ?? 0;
        if (total < 3) return 'new';

        let recentCount = 0;
        for (const entry of recentWindow) {
          const enrichment = entry.aiEnrichment as EnrichmentResult | null;
          if (enrichment?.capability_threads?.some((t) => t.thread_id === threadId)) {
            recentCount++;
          }
        }

        let priorCount = 0;
        for (const entry of priorWindow) {
          const enrichment = entry.aiEnrichment as EnrichmentResult | null;
          if (enrichment?.capability_threads?.some((t) => t.thread_id === threadId)) {
            priorCount++;
          }
        }

        if (recentCount === 0) return 'plateau';
        if (priorCount > 0 && recentCount >= priorCount * 1.5) return 'accelerating';
        return 'steady_growth';
      }

      // Evidence quality: average description_richness across last 5 entries for each thread
      function computeEvidenceQuality(threadId: string): EvidenceQuality {
        const threadEntries = childEntries
          .filter((e) => {
            const enrichment = e.aiEnrichment as EnrichmentResult | null;
            return enrichment?.capability_threads?.some((t) => t.thread_id === threadId);
          })
          .slice(0, 5);

        if (threadEntries.length === 0) return 'weak';

        const richnessCounts = { thin: 0, adequate: 0, rich: 0 };
        for (const entry of threadEntries) {
          const enrichment = entry.aiEnrichment as EnrichmentResult | null;
          const richness = enrichment?.quality_indicators?.description_richness ?? 'thin';
          richnessCounts[richness]++;
        }

        if (richnessCounts.rich >= threadEntries.length * 0.5) return 'strong';
        if (richnessCounts.thin >= threadEntries.length * 0.5) return 'weak';
        return 'adequate';
      }

      // Build enhanced active threads with DLO data from cache
      const threadMetaMap = await getCachedThreads();
      const tierRankMap = { emerging: 0, developing: 1, demonstrating: 2 };

      const activeThreads: SnapshotActiveThread[] = Object.entries(threadCounts)
        .map(([threadId, data]) => {
          const meta = threadMetaMap.get(threadId);
          const badgeInfo = threadBadgeMap[threadId];
          const childTierRank = tierRankMap[data.tier as keyof typeof tierRankMap] ?? 0;

          // DLOs confirmed = count of DLOs at or below the child's tier
          let dlosConfirmed = 0;
          const dlosTotal = meta?.dlos_total ?? 3;
          if (meta?.dlos?.length) {
            for (const dlo of meta.dlos) {
              const dloRank = tierRankMap[dlo.tier as keyof typeof tierRankMap] ?? 0;
              if (dloRank <= childTierRank) dlosConfirmed++;
            }
          } else {
            // No Sanity DLO data — estimate from tier
            dlosConfirmed = childTierRank + 1;
          }

          return {
            thread_id: threadId,
            thread_name: meta?.title ?? threadId,
            observation_count: data.count,
            last_evidence_date: data.lastDate,
            suggested_tier: data.tier as SnapshotActiveThread['suggested_tier'],
            current_badge_level: badgeInfo?.current ?? null,
            next_badge: badgeInfo?.next ?? null,
            next_badge_progress: badgeInfo?.nextProgress ?? 0,
            dlos_confirmed: dlosConfirmed,
            dlos_total: dlosTotal,
            trajectory: computeTrajectory(threadId),
            recent_evidence_quality: computeEvidenceQuality(threadId),
          };
        })
        .sort((a, b) => b.observation_count - a.observation_count);

      // Recent activity
      const entriesLast7 = childEntries.filter((e) => e.dateOccurred >= sevenDaysAgo).length;
      const entriesLast30 = childEntries.filter((e) => e.dateOccurred >= thirtyDaysAgo).length;
      const subjectsThisWeek = [
        ...new Set(
          childEntries
            .filter((e) => e.dateOccurred >= sevenDaysAgo)
            .flatMap((e) => e.subjects ?? [])
        ),
      ];

      // Current sparks (top 3 threads by recent frequency)
      const recentEntries = childEntries.filter((e) => e.dateOccurred >= sevenDaysAgo);
      const sparkCounts: Record<string, number> = {};
      for (const entry of recentEntries) {
        const enrichment = entry.aiEnrichment as EnrichmentResult | null;
        if (enrichment) {
          for (const t of enrichment.capability_threads ?? []) {
            sparkCounts[t.thread_id] = (sparkCounts[t.thread_id] ?? 0) + 1;
          }
        }
      }
      const currentSparks = Object.entries(sparkCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, sparkCount]) => ({ name, count: sparkCount }));

      // Gap analysis
      const underservedSubjects = allSubjects.filter(
        (s) => (subjectCounts[s] ?? 0) < 2
      );
      const suggestedFocusThreads = Object.entries(threadCounts)
        .filter(([, data]) => data.lastDate < thirtyDaysAgo)
        .map(([threadId]) => threadId);

      // Monthly narrative (AI-generated, only when entries exist this month)
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEntries = childEntries.filter((e) => e.dateOccurred >= monthStart);
      let monthlyNarrative = '';
      if (monthEntries.length > 0 && (trigger === 'entry_saved' || trigger === 'manual')) {
        const monthSubjects = [...new Set(monthEntries.flatMap((e) => e.subjects ?? []))];
        const monthThreadNames = Object.entries(threadCounts)
          .filter(([, d]) => d.lastDate >= monthStart)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([id]) => id);
        const topActivities = monthEntries.slice(0, 4).map((e) => e.title);

        monthlyNarrative = await generateMonthlyNarrative({
          childName: child.name,
          entryCount: monthEntries.length,
          subjects: monthSubjects,
          threadNames: monthThreadNames,
          topActivities,
          badgesEarned: badgeReady.map((b) => String((b as Record<string, unknown>).badge_id)),
        });
      }

      childSnapshots[child.id] = {
        learner_id: child.id,
        name: child.name,
        curriculum_coverage: curriculumCoverage,
        active_threads: activeThreads,
        badge_thresholds: { ready: badgeReady, approaching: badgeApproaching },
        recent_activity: {
          entries_last_7_days: entriesLast7,
          entries_last_30_days: entriesLast30,
          subjects_this_week: subjectsThisWeek,
          current_sparks: currentSparks,
        },
        gap_analysis: {
          underserved_subjects: underservedSubjects,
          suggested_focus_threads: suggestedFocusThreads,
        },
        monthly_narrative: monthlyNarrative,
        dlo_status: dloStatusByLearner[child.id] ?? {},
      };
    }

    // ─── Recommendations + Planner Suggestions ───
    let recommendations: { suggested_next: import('@/types/snapshot').SnapshotRecommendation[]; subject_balance: Record<string, SubjectBalance> } | undefined;
    let plannerSuggestions: SnapshotPlannerSuggestion[] | undefined;

    const packIds = libraryPackIds
      .map((r) => r.sanityPackId)
      .filter((id): id is string => !!id);
    {
      try {
        type RawScoringModule = Omit<ScoringModule, 'capabilityThreadIds'> & { capabilityThreadTitles?: string[] };
        const [sanityPacks, ownScoringModules] = await Promise.all([
          packIds.length > 0
            ? sanityClient.fetch<{ modules: RawScoringModule[] }[]>(SCORING_MODULES_QUERY, { packIds })
            : Promise.resolve([] as { modules: RawScoringModule[] }[]),
          sanityClient.fetch<RawScoringModule[]>(SCORING_OWN_MODULES_QUERY, { familyId }),
        ]);
        // Build title → code lookup from the cached taxonomy so module thread refs
        // (which resolve to Sanity titles) match snapshot thread_id codes (L1, S5, etc.).
        const threadCache = await getCachedThreads();
        const titleToCode = new Map<string, string>();
        for (const [code, meta] of threadCache.entries()) {
          titleToCode.set(meta.title.toLowerCase(), code);
        }
        const toScoring = (m: RawScoringModule): ScoringModule => ({
          _id: m._id,
          title: m.title,
          subjects: m.subjects ?? [],
          averageEnergyLevel: m.averageEnergyLevel ?? null,
          capabilityThreadIds: (m.capabilityThreadTitles ?? [])
            .map((t) => titleToCode.get((t ?? '').toLowerCase()))
            .filter((c): c is string => !!c),
        });
        const seen = new Set<string>();
        const scoringModules: ScoringModule[] = [
          ...sanityPacks.flatMap((p) => p.modules ?? []),
          ...(ownScoringModules ?? []),
        ]
          .filter((m) => m._id && m.title)
          .filter((m) => (seen.has(m._id) ? false : (seen.add(m._id), true)))
          .map(toScoring);

        if (scoringModules.length > 0) {
          const plannedModuleIds = weekPlanned
            .map((p) => p.moduleId)
            .filter((id): id is string => id != null);

          // Count completed modules from entries
          const completedModuleCounts: Record<string, number> = {};
          for (const e of allEntries) {
            const modId = (e as Record<string, unknown>).sourceModuleId as string | null;
            if (modId) completedModuleCounts[modId] = (completedModuleCounts[modId] ?? 0) + 1;
          }

          // Subjects already planned this week
          const weekSubjects = new Set(weekPlanned.flatMap((p) => p.subjects ?? []));

          const scored = scoreModules(
            scoringModules,
            childSnapshots as Record<string, ChildSnapshot>,
            plannedModuleIds,
            completedModuleCounts,
            weekSubjects,
          );

          // Subject balance: count planned subjects per day vs target of 2 per core subject
          const coreSubjects = ['english', 'mathematics', 'science', 'hass'];
          const subjectPlannedCount: Record<string, number> = {};
          for (const p of weekPlanned) {
            for (const s of p.subjects ?? []) {
              subjectPlannedCount[s] = (subjectPlannedCount[s] ?? 0) + 1;
            }
          }
          const subjectBalance: Record<string, SubjectBalance> = {};
          for (const s of coreSubjects) {
            const count = subjectPlannedCount[s] ?? 0;
            subjectBalance[s] = count >= 2 ? (count > 4 ? 'over' : 'balanced') : 'under';
          }

          recommendations = { suggested_next: scored, subject_balance: subjectBalance };

          // Planner suggestions: top recommendations not already planned, assigned to under-represented days
          const weekDays = Array.from({ length: 5 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));
          const daySubjectCounts: Record<string, Record<string, number>> = {};
          for (const day of weekDays) daySubjectCounts[day] = {};
          for (const p of weekPlanned) {
            if (!daySubjectCounts[p.date]) continue;
            for (const s of p.subjects ?? []) {
              daySubjectCounts[p.date][s] = (daySubjectCounts[p.date][s] ?? 0) + 1;
            }
          }

          plannerSuggestions = scored.slice(0, 5).map((rec) => {
            // Assign to the day with fewest entries in this module's primary subject
            const primarySubject = scoringModules.find((m) => m._id === rec.module_id)?.subjects[0];
            let bestDay = weekDays[0];
            let minCount = Infinity;
            for (const day of weekDays) {
              const cnt = primarySubject ? (daySubjectCounts[day][primarySubject] ?? 0) : Object.values(daySubjectCounts[day]).reduce((s, c) => s + c, 0);
              if (cnt < minCount) { minCount = cnt; bestDay = day; }
            }
            return {
              module_id: rec.module_id,
              module_title: rec.module_title,
              suggested_day: bestDay,
              reason: rec.primary_reason,
              reason_text: rec.reason_text,
            };
          });
        }
      } catch (err) {
        console.warn('[snapshotRebuild] Recommendation scoring failed, skipping:', err);
      }
    }

    // Family-wide intelligence
    const totalEntries = allEntries.length;
    const entriesThisTerm = allEntries.filter((e) => e.dateOccurred >= thirtyDaysAgo).length;

    // Streak calculation
    let streakCount = 0;
    const today = format(now, 'yyyy-MM-dd');
    const entryDates = [...new Set(allEntries.map((e) => e.dateOccurred))].sort().reverse();
    if (entryDates.length > 0) {
      let checkDate = today;
      for (const d of entryDates) {
        if (d === checkDate || d === format(subDays(new Date(checkDate), 1), 'yyyy-MM-dd')) {
          streakCount++;
          checkDate = d;
        } else if (d < checkDate) {
          break;
        }
      }
    }

    // Dashboard summary
    const weekEntries = allEntries.filter((e) => e.dateOccurred >= sevenDaysAgo);
    const weekSubjects = [...new Set(weekEntries.flatMap((e) => e.subjects ?? []))];
    const celebrationMessage =
      weekEntries.length > 0
        ? `${weekEntries.length} session${weekEntries.length > 1 ? 's' : ''} this week across ${weekSubjects.length} subject${weekSubjects.length !== 1 ? 's' : ''}`
        : 'Start logging to see your weekly summary';

    const allSubjectsSet = new Set(allEntries.flatMap((e) => e.subjects ?? []));
    const missingSubjects = ['english', 'mathematics', 'science', 'hass', 'arts', 'technologies', 'hpe', 'languages']
      .filter((s) => !weekSubjects.includes(s) && allSubjectsSet.has(s));
    const nudgeMessage = missingSubjects.length > 0
      ? `${missingSubjects[0].charAt(0).toUpperCase() + missingSubjects[0].slice(1)} hasn't appeared this week`
      : null;

    // HEU compliance
    const nextReportDue = settings?.nextReportDate ?? null;
    const daysUntilDue = nextReportDue
      ? differenceInCalendarDays(new Date(nextReportDue), now)
      : null;
    const coverageSufficient = totalEntries >= 20 && weekSubjects.length >= 3;

    // Compute weekly thread coverage for dashboard summary card
    const weekThreads = new Set<string>();
    for (const entry of weekEntries) {
      const enrichment = entry.aiEnrichment as EnrichmentResult | null;
      if (enrichment) {
        for (const t of enrichment.capability_threads ?? []) {
          weekThreads.add(t.thread_id);
        }
      }
    }
    const weeklyThreadCoverage = Math.min(100, Math.round((weekThreads.size / 57) * 100));

    const activeModulesCount = await db
      .select({ count: count() })
      .from(familyLibrary)
      .where(eq(familyLibrary.familyId, familyId))
      .then((r) => r[0]?.count ?? 0);

    const snapshotData = {
      family_id: familyId,
      rebuilt_at: now.toISOString(),
      rebuild_trigger: trigger,
      children: childSnapshots,
      family: {
        total_entries: totalEntries,
        entries_this_term: entriesThisTerm,
        active_learners: familyLearners.length,
        pedagogy_key: settings?.pedagogyPreference ?? 'eclectic',
        dashboard_summary: {
          celebration_message: celebrationMessage,
          nudge_message: nudgeMessage,
          streak_count: streakCount,
        },
        heu_status: {
          next_report_due: nextReportDue,
          days_until_due: daysUntilDue,
          coverage_sufficient: coverageSufficient,
        },
      },
      recommendations,
      planner_suggestions: plannerSuggestions,
      pending_notifications: pendingNotifications,
      // Flat fields for dashboard summary card compatibility
      activityStreak: streakCount,
      weeklyThreadCoverage,
      activeModulesCount,
      lastLogDate: entryDates[0] ?? null,
    };

    const rebuildDuration = Date.now() - startTime;

    // Upsert snapshot
    const existing = await db.query.familyIntelligenceSnapshots.findFirst({
      where: eq(familyIntelligenceSnapshots.familyId, familyId),
    });

    if (existing) {
      await db
        .update(familyIntelligenceSnapshots)
        .set({
          snapshotData,
          rebuiltAt: now,
          rebuildTrigger: trigger,
          snapshotVersion: (existing.snapshotVersion ?? 0) + 1,
          updatedAt: now,
        })
        .where(eq(familyIntelligenceSnapshots.familyId, familyId));
    } else {
      await db.insert(familyIntelligenceSnapshots).values({
        familyId,
        snapshotData,
        rebuiltAt: now,
        rebuildTrigger: trigger,
        snapshotVersion: 1,
      });
    }

    // Clean stale notifications before creating new ones
    await cleanStaleNotifications(familyId);

    // Create badge-ready notifications via trigger system (frequency-capped)
    for (const notif of pendingNotifications) {
      const n = notif as { type: string; target_learner_id: string; payload: Record<string, unknown> };
      await triggerBadgeReady(familyId, {
        badgeId: String(n.payload.badge_id),
        badgeTitle: String(n.payload.badge_title),
        badgeEmoji: String(n.payload.badge_emoji),
        learnerId: String(n.payload.learner_id),
        learnerName: String(n.payload.learner_name),
      });
    }

    // Compliance nudge: if HEU deadline approaching + coverage gaps
    if (daysUntilDue !== null && daysUntilDue <= 28) {
      const allChildGaps = Object.values(childSnapshots)
        .flatMap((cs) => {
          const snap = cs as { gap_analysis?: { underserved_subjects?: string[] } };
          return snap.gap_analysis?.underserved_subjects ?? [];
        });
      const uniqueGaps = [...new Set(allChildGaps)];
      await triggerComplianceNudge(familyId, {
        daysUntilDue,
        gapSubjects: uniqueGaps,
      });
    }

    // Streak prompt: if ≥5 days since last logged activity
    if (entryDates[0]) {
      const daysSinceLastLog = differenceInCalendarDays(now, new Date(entryDates[0]));
      if (daysSinceLastLog >= 5) {
        await triggerStreakPrompt(familyId, daysSinceLastLog);
      }
    }

    // Module nudge: if family has logged ≥10 retro entries but never used a module
    const retroEntries = allEntries.filter((e) => e.source === 'logger');
    const hasUsedModule = allEntries.some((e) => e.source === 'module_log');
    if (retroEntries.length >= 10 && !hasUsedModule) {
      const subjectCounts: Record<string, number> = {};
      for (const e of retroEntries) {
        for (const s of e.subjects ?? []) {
          subjectCounts[s] = (subjectCounts[s] ?? 0) + 1;
        }
      }
      const topSubjects = Object.entries(subjectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([s]) => s);
      await triggerModuleNudge(familyId, {
        retroEntryCount: retroEntries.length,
        hasUsedModule,
        topSubjects,
      });
    }

    if (rebuildDuration > 500) {
      console.warn(`[snapshotRebuild] SLOW family=${familyId} duration=${rebuildDuration}ms trigger=${trigger}`);
    } else {
      console.log(`[snapshotRebuild] family=${familyId} duration=${rebuildDuration}ms trigger=${trigger}`);
    }
  } catch (error) {
    console.error('[snapshotRebuild] Failed:', error);
  }
}
