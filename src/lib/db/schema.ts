import {
  pgTable,
  text,
  uuid,
  timestamp,
  date,
  integer,
  boolean,
  jsonb,
  decimal,
  index,
  unique,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Identity & Auth ───

export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').unique().notNull(),
  familyName: text('family_name').notNull(),
  onboardingComplete: boolean('onboarding_complete').default(false).notNull(),
  welcomeCompletedAt: timestamp('welcome_completed_at'),
  loggerDefaultMode: text('logger_default_mode'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const learners = pgTable('learners', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .references(() => families.id)
    .notNull(),
  name: text('name').notNull(),
  dateOfBirth: date('date_of_birth'),
  shapeIcon: text('shape_icon'),
  colourToken: text('colour_token'),
  displayOrder: integer('display_order').default(0),
  profileData: jsonb('profile_data').$type<{
    about?: string;
    workingStyle?: string[];
    interests?: string[];
    strengths?: string[];
    notes?: string;
    tagline?: string | null;
    facilitatorNotes?: string | null;
    sparks?: Array<{ name: string; count?: number }>;
    attentionWindowStart?: number | null;
    attentionWindowEnd?: number | null;
    preferredTimes?: string[] | null;
    stylePreferences?: Record<string, string> | null;
    tierOverrides?: Record<string, { tier: 'emerging' | 'developing' | 'demonstrating'; reason?: string; setAt?: string }> | null;
  }>().default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const familySettings = pgTable('family_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .references(() => families.id)
    .unique()
    .notNull(),
  pedagogyPreference: text('pedagogy_preference').default('eclectic'),
  pedagogyValues: text('pedagogy_values').array().default([]),
  pedagogyPractices: text('pedagogy_practices').array().default([]),
  registrationNumber: text('registration_number'),
  nextReportDate: date('next_report_date'),
  state: text('state'),
  notificationPrefs: jsonb('notification_prefs').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Learning Data ───

export const learningEntries = pgTable(
  'learning_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .references(() => families.id)
      .notNull(),
    title: text('title').notNull(),
    description: text('description'),
    dateOccurred: date('date_occurred').notNull().defaultNow(),
    subjects: text('subjects').array(),
    learnerIds: uuid('learner_ids').array(),
    engagementPerLearner: jsonb('engagement_per_learner').default({}),
    discoveriesPerLearner: jsonb('discoveries_per_learner').default({}),
    evidenceUrls: text('evidence_urls').array().default([]),
    source: text('source').notNull().default('logger'),
    sourceModuleId: text('source_module_id'),
    sourceProjectId: text('source_project_id'),
    sourceStageNumber: integer('source_stage_number'),
    sourceSessionId: uuid('source_session_id'),
    status: text('status').notNull().default('draft'),
    observationDetails: jsonb('observation_details').default({}),
    aiEnrichment: jsonb('ai_enrichment').$type<import('@/types/enrichment').AiEnrichment>(),
    workSampleCandidate: boolean('work_sample_candidate').default(false),
    capturedLibraryVersion: text('captured_library_version').notNull().default('2.0.0'),
    threadLinks: jsonb('thread_links').default([]),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('le_family_date_idx').on(table.familyId, table.dateOccurred),
    index('le_family_status_idx').on(table.familyId, table.status),
  ]
);

// ─── AI Layer ───

export const familyIntelligenceSnapshots = pgTable(
  'family_intelligence_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .references(() => families.id)
      .unique()
      .notNull(),
    snapshotData: jsonb('snapshot_data').notNull().default({}),
    rebuiltAt: timestamp('rebuilt_at'),
    rebuildTrigger: text('rebuild_trigger'),
    snapshotVersion: integer('snapshot_version').default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  }
);

export const aiPipelineLogs = pgTable(
  'ai_pipeline_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .references(() => families.id)
      .notNull(),
    entryId: uuid('entry_id').references(() => learningEntries.id),
    modelUsed: text('model_used').notNull(),
    inputTokens: integer('input_tokens').notNull(),
    outputTokens: integer('output_tokens').notNull(),
    latencyMs: integer('latency_ms').notNull(),
    confidence: decimal('confidence', { precision: 3, scale: 2 }),
    retryTriggered: boolean('retry_triggered').default(false),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('apl_family_idx').on(table.familyId),
    index('apl_created_idx').on(table.createdAt),
  ]
);

// ─── Badges ───

export const badgeDefinitions = pgTable('badge_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').references(() => families.id),
  title: text('title').notNull(),
  description: text('description'),
  emoji: text('emoji'),
  criteriaSummary: text('criteria_summary'),
  indicatorStatements: text('indicator_statements').array(),
  capabilityThreadIds: text('capability_thread_ids').array(),
  observationThreshold: integer('observation_threshold').default(5),
  // v2 additive (v1 cols above kept alive until badge code cut-over)
  whatItRecognises: text('what_it_recognises'),
  parentNarrative: text('parent_narrative'),
  threadId: text('thread_id'),
  stageBand: text('stage_band'),
  criteria: jsonb('criteria').default([]),
  criteriaPolicy: text('criteria_policy').notNull().default('all'),
  thresholdCount: integer('threshold_count'),
  prerequisiteBadgeIds: text('prerequisite_badge_ids').array(),
  introducedInVersion: text('introduced_in_version').notNull().default('2.0.0'),
  canonStatus: text('canon_status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const badgeAwards = pgTable('badge_awards', {
  id: uuid('id').primaryKey().defaultRandom(),
  badgeDefinitionId: uuid('badge_definition_id')
    .references(() => badgeDefinitions.id)
    .notNull(),
  learnerId: uuid('learner_id')
    .references(() => learners.id)
    .notNull(),
  awardedAt: timestamp('awarded_at').defaultNow(),
  awardedBy: text('awarded_by').default('parent'),
  evidenceEntryIds: uuid('evidence_entry_ids').array(),
  notes: text('notes'),
  retractedAt: timestamp('retracted_at'),
});

export const badgeAssessmentLogs = pgTable('badge_assessment_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  badgeDefinitionId: uuid('badge_definition_id')
    .references(() => badgeDefinitions.id)
    .notNull(),
  learnerId: uuid('learner_id')
    .references(() => learners.id)
    .notNull(),
  responses: jsonb('responses').notNull(),
  outcome: text('outcome').notNull(),
  coolingUntil: timestamp('cooling_until'),
  assessedAt: timestamp('assessed_at').defaultNow(),
});

// ─── Planner ───

export const plannerEntries = pgTable(
  'planner_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .references(() => families.id)
      .notNull(),
    date: date('date').notNull(),
    title: text('title'),
    moduleId: text('module_id'),
    activityId: text('activity_id'),
    learnerIds: uuid('learner_ids').array(),
    status: text('status').default('planned'),
    session: text('session').default('morning'),
    subjects: text('subjects').array(),
    notes: text('notes'),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('pe_family_date_idx').on(table.familyId, table.date)]
);

// ─── Notifications ───

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .references(() => families.id)
      .notNull(),
    type: text('type').notNull(),
    tier: text('tier').notNull().default('whisper'),
    title: text('title').notNull(),
    body: text('body'),
    bodyData: jsonb('body_data').default({}),
    state: text('state').notNull().default('visible'),
    snoozedUntil: timestamp('snoozed_until'),
    destinationRoute: text('destination_route'),
    createdAt: timestamp('created_at').defaultNow(),
    expiresAt: timestamp('expires_at'),
  },
  (table) => [
    index('notif_family_state_idx').on(table.familyId, table.state),
  ]
);

// ─── Content Library ───

export const familyLibrary = pgTable(
  'family_library',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .references(() => families.id)
      .notNull(),
    sanityPackId: text('sanity_pack_id'),
    sanityModuleId: text('sanity_module_id'),
    addedAt: timestamp('added_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('fl_family_pack_unique_idx')
      .on(table.familyId, table.sanityPackId)
      .where(sql`${table.sanityPackId} IS NOT NULL`),
    uniqueIndex('fl_family_module_unique_idx')
      .on(table.familyId, table.sanityModuleId)
      .where(sql`${table.sanityModuleId} IS NOT NULL`),
    check(
      'fl_pack_xor_module',
      sql`(${table.sanityPackId} IS NOT NULL) <> (${table.sanityModuleId} IS NOT NULL)`,
    ),
  ]
);

// ─── Module Drafts ───

export const moduleDrafts = pgTable(
  'module_drafts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .references(() => families.id)
      .notNull(),
    pathway: text('pathway').notNull(), // 'material' | 'process' | 'inquiry' | 'retrospective' | 'goal'
    draftData: jsonb('draft_data').notNull().default({}),
    status: text('status').notNull().default('draft'), // 'draft' | 'complete'
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('md_family_status_idx').on(table.familyId, table.status)]
);

// ─── Family Members (Co-Facilitators) ───

export const familyMembers = pgTable(
  'family_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .references(() => families.id)
      .notNull(),
    clerkUserId: text('clerk_user_id'),
    email: text('email').notNull(),
    role: text('role').notNull().default('editor'), // 'owner' | 'editor' | 'viewer'
    status: text('status').notNull().default('invited'), // 'invited' | 'active' | 'removed'
    inviteToken: text('invite_token').unique(),
    invitedAt: timestamp('invited_at').defaultNow(),
    joinedAt: timestamp('joined_at'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('fm_family_idx').on(table.familyId),
    index('fm_clerk_idx').on(table.clerkUserId),
    unique('fm_family_email_uniq').on(table.familyId, table.email),
  ]
);

// ─── Facilitator Notes ───

export const facilitatorNotes = pgTable('facilitator_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .references(() => families.id)
    .notNull(),
  learnerId: uuid('learner_id')
    .references(() => learners.id)
    .notNull(),
  noteText: text('note_text').notNull(),
  isPrivate: boolean('is_private').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Compliance Reports ───

export const complianceReports = pgTable(
  'compliance_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .references(() => families.id)
      .notNull(),
    learnerId: uuid('learner_id')
      .references(() => learners.id)
      .notNull(),
    reportYear: integer('report_year').notNull(),
    status: text('status').notNull().default('draft'), // 'draft' | 'complete' | 'exported'
    lastExportedAt: timestamp('last_exported_at'),
    choiceArea: text('choice_area').default('science'), // 'science' | 'hass' for slots 5-6
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    unique('hr_family_learner_year').on(table.familyId, table.learnerId, table.reportYear),
  ]
);

export const workSamples = pgTable(
  'work_samples',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id')
      .references(() => complianceReports.id)
      .notNull(),
    slot: text('slot').notNull(), // 'early_writing' | 'later_writing' | 'early_maths' | 'later_maths' | 'early_choice' | 'later_choice'
    entryId: uuid('entry_id').references(() => learningEntries.id),
    status: text('status').notNull().default('empty'), // 'empty' | 'selected' | 'annotated' | 'complete'
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    unique('ws_report_slot').on(table.reportId, table.slot),
    index('ws_entry_idx').on(table.entryId),
  ]
);

export const workSampleAnnotations = pgTable('work_sample_annotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  workSampleId: uuid('work_sample_id')
    .references(() => workSamples.id)
    .unique()
    .notNull(),
  observations: text('observations'),
  observationsSource: text('observations_source').default('parent_written'), // 'ai_draft' | 'parent_edited' | 'parent_written'
  needsStrengths: text('needs_strengths'),
  needsStrengthsSource: text('needs_strengths_source').default('parent_written'),
  adjustment: text('adjustment'),
  adjustmentSource: text('adjustment_source').default('parent_written'),
  planning: text('planning'),
  planningSource: text('planning_source').default('parent_written'),
  progressionSummary: text('progression_summary'),
  progressionSummaryEdited: boolean('progression_summary_edited').default(false),
  confirmedAt: timestamp('confirmed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Provider Codes ───

export const providerCodes = pgTable('provider_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  redeemedByFamilyId: uuid('redeemed_by_family_id').references(() => families.id),
  redeemedAt: timestamp('redeemed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Community (Hearths) ───

export const hearths = pgTable('hearths', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  location: text('location'),
  createdByFamilyId: uuid('created_by_family_id').references(() => families.id).notNull(),
  status: text('status').notNull().default('active'),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const hearthMemberships = pgTable(
  'hearth_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hearthId: uuid('hearth_id').references(() => hearths.id).notNull(),
    familyId: uuid('family_id').references(() => families.id).notNull(),
    role: text('role').notNull().default('member'),
    status: text('status').notNull().default('active'),
    joinedAt: timestamp('joined_at').defaultNow(),
    invitedByFamilyId: uuid('invited_by_family_id').references(() => families.id),
    consentCrossObservation: boolean('consent_cross_observation').default(false).notNull(),
    consentEvidenceSharing: boolean('consent_evidence_sharing').default(false).notNull(),
    leftAt: timestamp('left_at'),
  },
  (table) => [
    unique('hm_hearth_family_uniq').on(table.hearthId, table.familyId),
    index('hm_family_status_idx').on(table.familyId, table.status),
  ]
);

export const hearthSessions = pgTable(
  'hearth_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hearthId: uuid('hearth_id').references(() => hearths.id).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    date: date('date').notNull(),
    timeStart: text('time_start'),
    timeEnd: text('time_end'),
    location: text('location'),
    facilitatorFamilyId: uuid('facilitator_family_id').references(() => families.id).notNull(),
    facilitatorUserId: text('facilitator_user_id'),
    status: text('status').notNull().default('upcoming'),
    moduleReference: text('module_reference'),
    activityReference: text('activity_reference'),
    prepNotes: text('prep_notes'),
    sharedRecord: text('shared_record'),
    createdAt: timestamp('created_at').defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    index('hs_hearth_date_idx').on(table.hearthId, table.date),
  ]
);

export const sessionAttendance = pgTable(
  'session_attendance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').references(() => hearthSessions.id).notNull(),
    familyId: uuid('family_id').references(() => families.id).notNull(),
    rsvpStatus: text('rsvp_status').notNull().default('pending'),
    actuallyAttended: boolean('actually_attended'),
    learnerIds: uuid('learner_ids').array(),
  },
  (table) => [
    unique('sa_session_family_uniq').on(table.sessionId, table.familyId),
  ]
);

export const sessionEvidence = pgTable('session_evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => hearthSessions.id).notNull(),
  uploadedByFamilyId: uuid('uploaded_by_family_id').references(() => families.id).notNull(),
  uploadedByUserId: text('uploaded_by_user_id'),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type'),
  caption: text('caption'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

export const suggestedObservations = pgTable(
  'suggested_observations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').references(() => hearthSessions.id).notNull(),
    observerFamilyId: uuid('observer_family_id').references(() => families.id).notNull(),
    observerUserId: text('observer_user_id'),
    targetFamilyId: uuid('target_family_id').references(() => families.id).notNull(),
    targetLearnerId: uuid('target_learner_id').references(() => learners.id).notNull(),
    observationText: text('observation_text').notNull(),
    evidenceIds: uuid('evidence_ids').array().default([]),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow(),
    reviewedAt: timestamp('reviewed_at'),
    familyEntryId: uuid('family_entry_id').references(() => learningEntries.id),
  },
  (table) => [
    index('so_target_status_idx').on(table.targetFamilyId, table.status),
  ]
);

export const sessionReflections = pgTable('session_reflections', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => hearthSessions.id).notNull(),
  familyId: uuid('family_id').references(() => families.id).notNull(),
  userId: text('user_id'),
  reflectionText: text('reflection_text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const hearthInvites = pgTable('hearth_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  hearthId: uuid('hearth_id').references(() => hearths.id).notNull(),
  invitedByFamilyId: uuid('invited_by_family_id').references(() => families.id).notNull(),
  code: text('code').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedByFamilyId: uuid('used_by_family_id').references(() => families.id),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Admin: Audit Log ───

export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminUserId: text('admin_user_id').notNull(),
    adminEmail: text('admin_email').notNull(),
    action: text('action').notNull(),
    targetResource: text('target_resource'),
    targetId: text('target_id'),
    reason: text('reason'),
    metadata: jsonb('metadata'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    mfaSatisfied: boolean('mfa_satisfied').default(false),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('audit_admin_user_idx').on(table.adminUserId, table.createdAt),
    index('audit_target_idx').on(table.targetResource, table.targetId, table.createdAt),
    index('audit_action_idx').on(table.action, table.createdAt),
  ]
);

// ─── Admin: Invitations ───

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').unique().notNull(),
    intendedFamilyName: text('intended_family_name').notNull(),
    intendedPrimaryEmail: text('intended_primary_email'),
    intendedLocationState: text('intended_location_state'),
    sourceLabel: text('source_label'),
    notes: text('notes'),
    status: text('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at'),
    redeemedAt: timestamp('redeemed_at'),
    redeemedByFamilyId: uuid('redeemed_by_family_id').references(() => families.id),
    revokedAt: timestamp('revoked_at'),
    revokedReason: text('revoked_reason'),
    createdByAdminId: text('created_by_admin_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('invitations_status_idx').on(table.status, table.createdAt),
    index('invitations_code_idx').on(table.code),
  ]
);

// ─── Admin: Content Studio Drafts ───

export const contentStudioDrafts = pgTable(
  'content_studio_drafts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkUserId: text('clerk_user_id').notNull(),
    title: text('title').notNull(),
    draftType: text('draft_type').notNull().default('pack'),
    draftData: jsonb('draft_data').notNull().default({}),
    status: text('status').notNull().default('draft'),
    sanityPackId: text('sanity_pack_id'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('csd_user_status_idx').on(table.clerkUserId, table.status),
  ]
);

// ─── Capability Universe v2 ───

export const familyLibraryState = pgTable('family_library_state', {
  familyId: uuid('family_id')
    .primaryKey()
    .references(() => families.id),
  currentLibraryVersion: text('current_library_version').notNull().default('2.0.0'),
  pinnedAtVersion: text('pinned_at_version'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const libraryUpgradeEvents = pgTable(
  'library_upgrade_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .references(() => families.id)
      .notNull(),
    fromVersion: text('from_version').notNull(),
    toVersion: text('to_version').notNull(),
    upgradedAt: timestamp('upgraded_at').notNull().defaultNow(),
    observationsRetagged: integer('observations_retagged').notNull().default(0),
    observationsCarriedAsLegacy: integer('observations_carried_as_legacy').notNull().default(0),
    notes: jsonb('notes').default([]),
  },
  (table) => [index('lue_family_idx').on(table.familyId, table.upgradedAt)]
);

export const customThreads = pgTable(
  'custom_threads',
  {
    id: text('id').primaryKey(),
    familyId: uuid('family_id')
      .references(() => families.id)
      .notNull(),
    createdByUserId: text('created_by_user_id').notNull(),
    name: text('name').notNull(),
    summary: text('summary'),
    tierIndicators: jsonb('tier_indicators').notNull().default({ emerging: [], developing: [], demonstrating: [] }),
    domainAffinity: text('domain_affinity'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('ct_family_idx').on(table.familyId)]
);
