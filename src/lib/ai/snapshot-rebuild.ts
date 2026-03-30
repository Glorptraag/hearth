import { db } from '@/lib/db';
import {
  learningEntries,
  learners,
  familySettings,
  familyIntelligenceSnapshots,
  badgeDefinitions,
  badgeAwards,
  notifications,
  familyLibrary,
} from '@/lib/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { subDays, differenceInCalendarDays, format } from 'date-fns';
import type { EnrichmentResult } from './enrich';

type RebuildTrigger = 'entry_saved' | 'library_change' | 'settings_change' | 'manual';

export async function rebuildSnapshot(
  familyId: string,
  trigger: RebuildTrigger = 'entry_saved'
): Promise<void> {
  const startTime = Date.now();

  try {
    const [familyLearners, settings, allEntries, badges] = await Promise.all([
      db.select().from(learners).where(eq(learners.familyId, familyId)),
      db.query.familySettings.findFirst({ where: eq(familySettings.familyId, familyId) }),
      db
        .select()
        .from(learningEntries)
        .where(and(eq(learningEntries.familyId, familyId), eq(learningEntries.status, 'complete')))
        .orderBy(desc(learningEntries.dateOccurred)),
      db.select().from(badgeDefinitions).where(eq(badgeDefinitions.familyId, familyId)),
    ]);

    const now = new Date();
    const sevenDaysAgo = format(subDays(now, 7), 'yyyy-MM-dd');
    const thirtyDaysAgo = format(subDays(now, 30), 'yyyy-MM-dd');

    const childSnapshots: Record<string, unknown> = {};
    const pendingNotifications: unknown[] = [];

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
      for (const [, data] of Object.entries(threadCounts)) {
        if (data.count >= 8) data.tier = 'demonstrating';
        else if (data.count >= 4) data.tier = 'developing';
        else data.tier = 'emerging';
      }

      // Curriculum coverage by subject
      const curriculumCoverage: Record<string, unknown> = {};
      const allSubjects = ['english', 'mathematics', 'science', 'hass', 'arts', 'technologies', 'hpe', 'languages'];
      for (const subj of allSubjects) {
        const touched = subjectCounts[subj] ?? 0;
        curriculumCoverage[subj] = {
          total_descriptors_touched: touched,
          confirmed_descriptors: 0,
          suggested_descriptors: touched,
          coverage_percentage: Math.min(100, Math.round((touched / 20) * 100)),
        };
      }

      // Active threads
      const activeThreads = Object.entries(threadCounts)
        .map(([threadId, data]) => ({
          thread_id: threadId,
          observation_count: data.count,
          suggested_tier: data.tier,
          last_evidence_date: data.lastDate,
        }))
        .sort((a, b) => b.observation_count - a.observation_count);

      // Badge threshold detection
      const badgeReady: unknown[] = [];
      const badgeApproaching: unknown[] = [];

      for (const badge of badges) {
        const threadIds = badge.capabilityThreadIds ?? [];
        const threshold = badge.observationThreshold ?? 5;

        let totalObs = 0;
        for (const tid of threadIds) {
          totalObs += threadCounts[tid]?.count ?? 0;
        }

        const existing = await db.query.badgeAwards.findFirst({
          where: and(
            eq(badgeAwards.badgeDefinitionId, badge.id),
            eq(badgeAwards.learnerId, child.id)
          ),
        });
        if (existing) continue;

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

      // Gap analysis
      const underservedSubjects = allSubjects.filter(
        (s) => (subjectCounts[s] ?? 0) < 2
      );
      const suggestedFocusThreads = Object.entries(threadCounts)
        .filter(([, data]) => data.lastDate < thirtyDaysAgo)
        .map(([threadId]) => threadId);

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
          current_sparks: [],
        },
        gap_analysis: {
          underserved_subjects: underservedSubjects,
          suggested_focus_threads: suggestedFocusThreads,
        },
      };
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
    const heuNextReport = settings?.heuNextReportDate ?? null;
    const daysUntilDue = heuNextReport
      ? differenceInCalendarDays(new Date(heuNextReport), now)
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
          next_report_due: heuNextReport,
          days_until_due: daysUntilDue,
          coverage_sufficient: coverageSufficient,
        },
      },
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

    // Create badge-ready notifications
    for (const notif of pendingNotifications) {
      const n = notif as { type: string; target_learner_id: string; payload: Record<string, unknown> };
      await db.insert(notifications).values({
        familyId,
        type: n.type,
        tier: 'chime',
        title: `${n.payload.badge_emoji} Badge ready: ${n.payload.badge_title}`,
        body: `${n.payload.learner_name} has enough observations for the ${n.payload.badge_title} badge!`,
        bodyData: n.payload,
        destinationRoute: `/badges/assess/${n.payload.badge_id}?learner=${n.payload.learner_id}&name=${encodeURIComponent(String(n.payload.learner_name))}`,
      });
    }

    console.log(`[snapshotRebuild] family=${familyId} duration=${rebuildDuration}ms trigger=${trigger}`);
  } catch (error) {
    console.error('[snapshotRebuild] Failed:', error);
  }
}
