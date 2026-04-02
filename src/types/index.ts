import type { InferSelectModel } from 'drizzle-orm';
import type {
  families,
  learners,
  familySettings,
  learningEntries,
  badgeDefinitions,
  badgeAwards,
  plannerEntries,
  notifications,
  facilitatorNotes,
  familyIntelligenceSnapshots,
  badgeAssessmentLogs,
  familyLibrary,
  aiPipelineLogs,
  heuReports,
  workSamples,
  workSampleAnnotations,
  hearths,
  hearthMemberships,
  hearthSessions,
  sessionAttendance,
  sessionEvidence,
  suggestedObservations,
  sessionReflections,
  hearthInvites,
} from '@/lib/db/schema';

// ─── Entity types inferred from schema ───

export type Family = InferSelectModel<typeof families>;
export type Learner = InferSelectModel<typeof learners>;
export type FamilySettings = InferSelectModel<typeof familySettings>;
export type LearningEntry = InferSelectModel<typeof learningEntries>;
export type BadgeDefinition = InferSelectModel<typeof badgeDefinitions>;
export type BadgeAward = InferSelectModel<typeof badgeAwards>;
export type BadgeAssessmentLog = InferSelectModel<typeof badgeAssessmentLogs>;
export type PlannerEntry = InferSelectModel<typeof plannerEntries>;
export type Notification = InferSelectModel<typeof notifications>;
export type FacilitatorNote = InferSelectModel<typeof facilitatorNotes>;
export type FamilyIntelligenceSnapshot = InferSelectModel<typeof familyIntelligenceSnapshots>;
export type FamilyLibraryEntry = InferSelectModel<typeof familyLibrary>;
export type AiPipelineLog = InferSelectModel<typeof aiPipelineLogs>;
export type HeuReport = InferSelectModel<typeof heuReports>;
export type WorkSample = InferSelectModel<typeof workSamples>;
export type WorkSampleAnnotation = InferSelectModel<typeof workSampleAnnotations>;
export type Hearth = InferSelectModel<typeof hearths>;
export type HearthMembership = InferSelectModel<typeof hearthMemberships>;
export type HearthSession = InferSelectModel<typeof hearthSessions>;
export type SessionAttendance = InferSelectModel<typeof sessionAttendance>;
export type SessionEvidence = InferSelectModel<typeof sessionEvidence>;
export type SuggestedObservation = InferSelectModel<typeof suggestedObservations>;
export type SessionReflection = InferSelectModel<typeof sessionReflections>;
export type HearthInvite = InferSelectModel<typeof hearthInvites>;

// ─── Enum / Union types ───

export const SUBJECTS = [
  'english',
  'mathematics',
  'science',
  'hass',
  'arts',
  'technologies',
  'hpe',
  'languages',
] as const;
export type Subject = (typeof SUBJECTS)[number];

export const LEARNER_COLOURS = ['rose', 'blue', 'sage', 'amber'] as const;
export type LearnerColour = (typeof LEARNER_COLOURS)[number];

export const ENTRY_SOURCES = ['logger', 'module_log', 'project_stage', 'hearth_session'] as const;
export type EntrySource = (typeof ENTRY_SOURCES)[number];

export const ENTRY_STATUSES = ['draft', 'complete'] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export const OBSERVATION_STATUSES = ['emerging', 'developing', 'demonstrating'] as const;
export type ObservationStatus = (typeof OBSERVATION_STATUSES)[number];

export const NOTIFICATION_TIERS = ['whisper', 'nudge', 'chime', 'flare'] as const;
export type NotificationTier = (typeof NOTIFICATION_TIERS)[number];

export const NOTIFICATION_STATES = ['visible', 'dismissed', 'actioned', 'snoozed', 'expired'] as const;
export type NotificationState = (typeof NOTIFICATION_STATES)[number];

export const PEDAGOGIES = [
  'charlotte_mason',
  'classical',
  'montessori',
  'waldorf_steiner',
  'unschooling',
  'eclectic',
] as const;
export type Pedagogy = (typeof PEDAGOGIES)[number];

// ─── Community (Hearths) ───

export const HEARTH_STATUSES = ['active', 'archived'] as const;
export type HearthStatus = (typeof HEARTH_STATUSES)[number];

export const MEMBERSHIP_ROLES = ['coordinator', 'member'] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const MEMBERSHIP_STATUSES = ['active', 'left', 'removed'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const SESSION_STATUSES = ['upcoming', 'completed', 'cancelled'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const RSVP_STATUSES = ['pending', 'attending', 'declined'] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const SUGGESTED_OBSERVATION_STATUSES = ['pending', 'accepted', 'dismissed'] as const;
export type SuggestedObservationStatus = (typeof SUGGESTED_OBSERVATION_STATUSES)[number];
