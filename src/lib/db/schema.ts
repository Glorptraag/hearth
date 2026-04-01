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
} from 'drizzle-orm/pg-core';

// ─── Identity & Auth ───

export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').unique().notNull(),
  familyName: text('family_name').notNull(),
  onboardingComplete: boolean('onboarding_complete').default(false).notNull(),
  welcomeCompletedAt: timestamp('welcome_completed_at'),
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
  heuRegistrationNumber: text('heu_registration_number'),
  heuNextReportDate: date('heu_next_report_date'),
  state: text('state').default('QLD'),
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
    status: text('status').notNull().default('draft'),
    aiEnrichment: jsonb('ai_enrichment'),
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
    sanityPackId: text('sanity_pack_id').notNull(),
    addedAt: timestamp('added_at').defaultNow(),
  },
  (table) => [
    unique('fl_family_pack_unique').on(table.familyId, table.sanityPackId),
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

// ─── Provider Codes ───

export const providerCodes = pgTable('provider_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  redeemedByFamilyId: uuid('redeemed_by_family_id').references(() => families.id),
  redeemedAt: timestamp('redeemed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
