import { db } from '@/lib/db';
import {
  notifications,
  familySettings,
  learningEntries,
  plannerEntries,
  families,
} from '@/lib/db/schema';
import { eq, and, gte, desc, count } from 'drizzle-orm';
import { format, addHours, differenceInCalendarDays } from 'date-fns';
import { adaptNotificationCopy } from '@/lib/pedagogy/adapter';

// ─── Types ───

type NotificationType =
  | 'draft_resume'
  | 'pause_ack'
  | 'badge_ready'
  | 'compliance_nudge'
  | 'log_invitation'
  | 'prep_reminder'
  | 'streak_prompt'
  | 'module_nudge';

type NotificationTier = 'whisper' | 'nudge' | 'chime';

interface CreateNotificationInput {
  familyId: string;
  type: NotificationType;
  tier: NotificationTier;
  title: string;
  body?: string;
  bodyData?: Record<string, unknown>;
  destinationRoute?: string;
  expiresAt?: Date;
}

// Per-type cooldowns: minimum time between notifications of the same type
const TYPE_COOLDOWNS: Record<NotificationType, number> = {
  draft_resume: 24 * 60 * 60 * 1000,       // 1 day
  pause_ack: 24 * 60 * 60 * 1000,          // 1 day
  badge_ready: 7 * 24 * 60 * 60 * 1000,    // 1 week
  compliance_nudge: 7 * 24 * 60 * 60 * 1000, // 1 week (tightens to 3 days when <2 weeks out)
  log_invitation: 24 * 60 * 60 * 1000,     // 1 day
  prep_reminder: 24 * 60 * 60 * 1000,      // 1 day
  streak_prompt: 5 * 24 * 60 * 60 * 1000,  // 5 days
  module_nudge: 14 * 24 * 60 * 60 * 1000,  // 2 weeks
};

const DAILY_CAP = 4;

// ─── Core: Create Notification with Frequency Gating ───

async function createNotification(input: CreateNotificationInput): Promise<boolean> {
  const { familyId, type } = input;
  const now = new Date();

  // Check daily cap (max 4 new notifications per day)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [{ count: todayCount }] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.familyId, familyId),
        gte(notifications.createdAt, todayStart)
      )
    );

  if (Number(todayCount) >= DAILY_CAP) {
    // Compliance nudges override daily cap when within 2 weeks of deadline
    if (type !== 'compliance_nudge') return false;
    const settings = await db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, familyId),
    });
    const daysUntil = settings?.heuNextReportDate
      ? differenceInCalendarDays(new Date(settings.heuNextReportDate), now)
      : null;
    if (daysUntil === null || daysUntil > 14) return false;
  }

  // Check per-type cooldown
  let cooldown = TYPE_COOLDOWNS[type];
  // Compliance nudge tightens to 3 days when <2 weeks out
  if (type === 'compliance_nudge') {
    const settings = await db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, familyId),
    });
    const daysUntil = settings?.heuNextReportDate
      ? differenceInCalendarDays(new Date(settings.heuNextReportDate), now)
      : null;
    if (daysUntil !== null && daysUntil <= 14) {
      cooldown = 3 * 24 * 60 * 60 * 1000;
    }
  }

  const cooldownStart = new Date(now.getTime() - cooldown);
  const recentSameType = await db.query.notifications.findFirst({
    where: and(
      eq(notifications.familyId, familyId),
      eq(notifications.type, type),
      gte(notifications.createdAt, cooldownStart)
    ),
    orderBy: desc(notifications.createdAt),
  });

  if (recentSameType) return false;

  // Check quiet hours (8pm-7am)
  const hour = now.getHours();
  if (hour >= 20 || hour < 7) {
    // Compliance nudge overrides quiet hours when <2 weeks
    if (type !== 'compliance_nudge') return false;
  }

  // Check quiet day toggle
  const settings = await db.query.familySettings.findFirst({
    where: eq(familySettings.familyId, familyId),
  });
  const prefs = (settings?.notificationPrefs ?? {}) as Record<string, unknown>;
  if (prefs.quietDayUntil) {
    const quietUntil = new Date(prefs.quietDayUntil as string);
    if (now < quietUntil) {
      if (type !== 'compliance_nudge') return false;
    }
  }

  // Check first-week suppression
  const family = await db.query.families.findFirst({
    where: eq(families.id, familyId),
  });
  if (family?.createdAt) {
    const daysSinceCreation = differenceInCalendarDays(now, new Date(family.createdAt));
    if (daysSinceCreation < 7) return false;
  }

  // Check weekend suppression for prep_reminder and log_invitation
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend && (type === 'prep_reminder' || type === 'log_invitation')) {
    // Allow if there's a planned activity for today
    const today = format(now, 'yyyy-MM-dd');
    const plannedToday = await db.query.plannerEntries.findFirst({
      where: and(
        eq(plannerEntries.familyId, familyId),
        eq(plannerEntries.date, today)
      ),
    });
    if (!plannedToday) return false;
  }

  await db.insert(notifications).values({
    familyId: input.familyId,
    type: input.type,
    tier: input.tier,
    title: input.title,
    body: input.body,
    bodyData: input.bodyData ?? {},
    destinationRoute: input.destinationRoute,
    expiresAt: input.expiresAt,
  });

  return true;
}

// ─── Trigger: draft_resume ───
// Called when a stale localStorage draft is detected on logger page load

export async function triggerDraftResume(
  familyId: string,
  draft: { title?: string }
): Promise<boolean> {
  const label = draft.title?.slice(0, 40) || 'an entry';
  return createNotification({
    familyId,
    type: 'draft_resume',
    tier: 'whisper',
    title: `You were logging "${label}" — pick up where you left off?`,
    bodyData: { draftTitle: label },
    destinationRoute: '/log',
    expiresAt: addHours(new Date(), 48),
  });
}

// ─── Trigger: pause_ack ───
// Called when user pauses a module session or has inactivity during logging

export async function triggerPauseAck(
  familyId: string,
  context: { moduleId?: string; moduleTitle?: string; entryId?: string; title?: string }
): Promise<boolean> {
  const label = context.moduleTitle ?? context.title ?? 'your session';
  const route = context.moduleId
    ? `/module/${context.moduleId}`
    : context.entryId
      ? `/log?resume=${context.entryId}`
      : '/dashboard';

  return createNotification({
    familyId,
    type: 'pause_ack',
    tier: 'whisper',
    title: `Looks like life called — we've saved your spot on "${label}"`,
    bodyData: {
      moduleId: context.moduleId ?? null,
      moduleTitle: context.moduleTitle ?? null,
      entryId: context.entryId ?? null,
    },
    destinationRoute: route,
    expiresAt: addHours(new Date(), 24),
  });
}

// ─── Trigger: badge_ready ───
// Called from snapshot rebuild when evidence threshold ≥ 90%

export async function triggerBadgeReady(
  familyId: string,
  badge: {
    badgeId: string;
    badgeTitle: string;
    badgeEmoji: string;
    learnerId: string;
    learnerName: string;
  }
): Promise<boolean> {
  return createNotification({
    familyId,
    type: 'badge_ready',
    tier: 'nudge',
    title: `${badge.badgeEmoji} ${badge.learnerName} might be ready for ${badge.badgeTitle}`,
    body: `${badge.learnerName} has enough observations for the ${badge.badgeTitle} badge!`,
    bodyData: {
      badge_id: badge.badgeId,
      badge_title: badge.badgeTitle,
      badge_emoji: badge.badgeEmoji,
      learner_id: badge.learnerId,
      learner_name: badge.learnerName,
    },
    destinationRoute: `/badges/assess/${badge.badgeId}?learner=${badge.learnerId}&name=${encodeURIComponent(badge.learnerName)}`,
  });
}

// ─── Trigger: compliance_nudge ───
// Called from snapshot rebuild when HEU deadline is approaching

export async function triggerComplianceNudge(
  familyId: string,
  heuStatus: { daysUntilDue: number; gapSubjects: string[] }
): Promise<boolean> {
  if (heuStatus.daysUntilDue > 28) return false;

  const urgency = heuStatus.daysUntilDue <= 14 ? 'soon' : 'approaching';
  const gapText =
    heuStatus.gapSubjects.length > 0
      ? ` ${heuStatus.gapSubjects.slice(0, 3).join(', ')} could use attention.`
      : '';

  return createNotification({
    familyId,
    type: 'compliance_nudge',
    tier: 'nudge',
    title: `Your HEU check-in is ${heuStatus.daysUntilDue <= 7 ? 'next week' : `${Math.ceil(heuStatus.daysUntilDue / 7)} weeks away`}`,
    body: `Areas to review before your report.${gapText}`,
    bodyData: {
      days_until_due: heuStatus.daysUntilDue,
      gap_subjects: heuStatus.gapSubjects,
      urgency,
    },
    destinationRoute: '/our-story/report',
  });
}

// ─── Helper: get family pedagogy ───

async function getFamilyPedagogy(familyId: string): Promise<string> {
  const settings = await db.query.familySettings.findFirst({
    where: eq(familySettings.familyId, familyId),
  });
  return settings?.pedagogyPreference ?? 'eclectic';
}

// ─── Trigger: log_invitation ───
// Called after module session completed or at end-of-day

export async function triggerLogInvitation(
  familyId: string,
  context: { moduleTitle?: string; reason: 'session_complete' | 'end_of_day' }
): Promise<boolean> {
  const pedagogy = await getFamilyPedagogy(familyId);
  const adapted = adaptNotificationCopy(pedagogy, 'log_invitation', {});

  const title = context.moduleTitle
    ? `You ran ${context.moduleTitle} today — want to capture what happened?`
    : adapted?.title ?? "Today's learning is still fresh — want to jot down a quick note?";

  return createNotification({
    familyId,
    type: 'log_invitation',
    tier: 'chime',
    title,
    body: adapted?.body,
    bodyData: {
      module_title: context.moduleTitle ?? null,
      reason: context.reason,
    },
    destinationRoute: '/log',
    expiresAt: addHours(new Date(), 48),
  });
}

// ─── Trigger: prep_reminder ───
// Called when a planned activity is within 2 hours

export async function triggerPrepReminder(
  familyId: string,
  planned: { moduleTitle: string; moduleId: string; session: string }
): Promise<boolean> {
  return createNotification({
    familyId,
    type: 'prep_reminder',
    tier: 'chime',
    title: `${planned.moduleTitle} is coming up — materials ready?`,
    bodyData: {
      module_id: planned.moduleId,
      module_title: planned.moduleTitle,
      session: planned.session,
    },
    destinationRoute: planned.moduleId ? `/module/${planned.moduleId}` : '/planner',
    expiresAt: addHours(new Date(), 4),
  });
}

// ─── Trigger: streak_prompt ───
// Called from snapshot rebuild when ≥5 days since last logged activity

export async function triggerStreakPrompt(
  familyId: string,
  daysSinceLastLog: number
): Promise<boolean> {
  if (daysSinceLastLog < 5) return false;

  const pedagogy = await getFamilyPedagogy(familyId);
  const adapted = adaptNotificationCopy(pedagogy, 'streak_prompt', {});

  return createNotification({
    familyId,
    type: 'streak_prompt',
    tier: 'chime',
    title: adapted?.title ?? "It's been a little while — a quick note keeps the story going",
    body: adapted?.body ?? `${daysSinceLastLog} days since your last log. Even a short entry helps!`,
    bodyData: { days_since_last_log: daysSinceLastLog },
    destinationRoute: '/log',
  });
}

// ─── Trigger: module_nudge ───
// Called from snapshot rebuild when family has logged enough retro entries
// but hasn't tried a module yet. Gentle migration from pure retro logging.

export async function triggerModuleNudge(
  familyId: string,
  stats: { retroEntryCount: number; hasUsedModule: boolean; topSubjects: string[] }
): Promise<boolean> {
  if (stats.hasUsedModule) return false;
  if (stats.retroEntryCount < 10) return false;

  const subjectHint = stats.topSubjects.length > 0
    ? ` We have ${stats.topSubjects[0]} activities that match what you've been logging.`
    : '';

  const pedagogy = await getFamilyPedagogy(familyId);
  const vocab = (await import('@/lib/pedagogy/adapter')).getPedagogyVocabulary(pedagogy);

  return createNotification({
    familyId,
    type: 'module_nudge',
    tier: 'whisper',
    title: `You've logged ${stats.retroEntryCount} ${vocab.sessionNoun}s — ready to try a guided module?`,
    body: `Modules give structure while you stay in control.${subjectHint}`,
    bodyData: {
      retro_entry_count: stats.retroEntryCount,
      top_subjects: stats.topSubjects,
    },
    destinationRoute: '/explore/marketplace',
  });
}

// ─── Auto-Stale Cleanup ───
// Archives notifications whose triggering condition is no longer relevant.
// Called during snapshot rebuild.

export async function cleanStaleNotifications(familyId: string): Promise<void> {
  // Re-queue snoozed notifications whose cooldown has expired
  const snoozedNotifs = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.familyId, familyId),
        eq(notifications.state, 'snoozed')
      )
    );

  const now = new Date();
  for (const notif of snoozedNotifs) {
    if (notif.snoozedUntil && new Date(notif.snoozedUntil) <= now) {
      await db
        .update(notifications)
        .set({ state: 'visible', snoozedUntil: null })
        .where(eq(notifications.id, notif.id));
    }
  }

  // Expire stale visible notifications
  const visibleNotifs = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.familyId, familyId),
        eq(notifications.state, 'visible')
      )
    );

  for (const notif of visibleNotifs) {
    const data = (notif.bodyData ?? {}) as Record<string, unknown>;
    let shouldExpire = false;

    // Check expiration timestamp
    if (notif.expiresAt && new Date(notif.expiresAt) < new Date()) {
      shouldExpire = true;
    }

    // Type-specific stale checks
    if (!shouldExpire) {
      switch (notif.type) {
        case 'draft_resume': {
          // Stale if entry was completed or deleted
          if (data.entryId) {
            const entry = await db.query.learningEntries.findFirst({
              where: eq(learningEntries.id, data.entryId as string),
            });
            if (!entry || entry.status === 'complete') shouldExpire = true;
          }
          break;
        }
        case 'badge_ready': {
          // Stale if badge was already awarded (handled by badge award flow)
          // Also stale if badge_id no longer exists
          break;
        }
        case 'streak_prompt': {
          // Stale if a new entry was logged
          const latestEntry = await db.query.learningEntries.findFirst({
            where: and(
              eq(learningEntries.familyId, familyId),
              eq(learningEntries.status, 'complete')
            ),
            orderBy: desc(learningEntries.createdAt),
          });
          if (latestEntry && latestEntry.createdAt) {
            const createdAfterNotif = notif.createdAt
              ? new Date(latestEntry.createdAt) > new Date(notif.createdAt)
              : false;
            if (createdAfterNotif) shouldExpire = true;
          }
          break;
        }
        case 'compliance_nudge': {
          // Stale if HEU report date has passed
          const settings = await db.query.familySettings.findFirst({
            where: eq(familySettings.familyId, familyId),
          });
          if (settings?.heuNextReportDate) {
            if (new Date(settings.heuNextReportDate) < new Date()) shouldExpire = true;
          }
          break;
        }
      }
    }

    if (shouldExpire) {
      await db
        .update(notifications)
        .set({ state: 'expired' })
        .where(eq(notifications.id, notif.id));
    }
  }
}
