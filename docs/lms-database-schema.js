/**
 * Hearth LMS — PostgreSQL Database Schema Reference
 * ORM: Drizzle (drizzle-orm/pg-core)
 * Host: Neon serverless Postgres
 * Schema source: src/lib/db/schema.ts
 * Tables: 19
 *
 * Updated: 2 April 2026
 */

// ─── Identity & Auth ───

const families = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  clerkUserId: 'text UNIQUE NOT NULL',
  familyName: 'text NOT NULL',
  onboardingComplete: 'boolean NOT NULL DEFAULT false',
  welcomeCompletedAt: 'timestamp',
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
};

const learners = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  familyId: 'uuid NOT NULL REFERENCES families(id)',
  name: 'text NOT NULL',
  dateOfBirth: 'date',
  shapeIcon: 'text',          // Abstract shape identifier (no photos by default)
  colourToken: 'text',        // Design token colour for learner
  displayOrder: 'integer DEFAULT 0',
  profileData: 'jsonb DEFAULT {}',
  // profileData shape:
  // {
  //   about?: string,
  //   workingStyle?: string[],
  //   interests?: string[],
  //   strengths?: string[],
  //   notes?: string,
  //   tagline?: string | null,
  //   facilitatorNotes?: string | null,
  //   sparks?: Array<{ name: string; count?: number }>,
  //   attentionWindowStart?: number | null,
  //   attentionWindowEnd?: number | null,
  //   preferredTimes?: string[] | null,
  //   stylePreferences?: Record<string, string> | null,
  //   tierOverrides?: Record<string, { tier: 'emerging' | 'developing' | 'demonstrating'; reason?: string; setAt?: string }> | null,
  // }
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
};

const familySettings = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  familyId: 'uuid UNIQUE NOT NULL REFERENCES families(id)',
  pedagogyPreference: "text DEFAULT 'eclectic'",  // charlotte_mason | classical | montessori | waldorf | unschooling | eclectic
  pedagogyValues: 'text[] DEFAULT {}',
  pedagogyPractices: 'text[] DEFAULT {}',
  heuRegistrationNumber: 'text',
  heuNextReportDate: 'date',
  state: "text DEFAULT 'QLD'",
  notificationPrefs: 'jsonb DEFAULT {}',
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
};

const familyMembers = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  familyId: 'uuid NOT NULL REFERENCES families(id)',
  clerkUserId: 'text',
  email: 'text NOT NULL',
  role: "text NOT NULL DEFAULT 'editor'",    // 'owner' | 'editor' | 'viewer'
  status: "text NOT NULL DEFAULT 'invited'", // 'invited' | 'active' | 'removed'
  inviteToken: 'text UNIQUE',
  invitedAt: 'timestamp DEFAULT now()',
  joinedAt: 'timestamp',
  createdAt: 'timestamp DEFAULT now()',
  // Indexes: fm_family_idx(familyId), fm_clerk_idx(clerkUserId)
  // Unique: fm_family_email_uniq(familyId, email)
};

// ─── Learning Data ───

const learningEntries = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  familyId: 'uuid NOT NULL REFERENCES families(id)',
  title: 'text NOT NULL',
  description: 'text',
  dateOccurred: 'date NOT NULL DEFAULT now()',
  subjects: 'text[]',                  // Array of subject keys
  learnerIds: 'uuid[]',               // Which learners participated
  engagementPerLearner: 'jsonb DEFAULT {}',   // { [learnerId]: engagement data }
  discoveriesPerLearner: 'jsonb DEFAULT {}',  // { [learnerId]: discovery data }
  evidenceUrls: 'text[] DEFAULT {}',   // Vercel Blob URLs for photos/files
  source: "text NOT NULL DEFAULT 'logger'",   // 'logger' | 'module' | 'project' | 'import'
  sourceModuleId: 'text',             // Sanity module ID if from module experience
  sourceProjectId: 'text',            // Sanity project ID if from project experience
  sourceStageNumber: 'integer',       // Project stage number
  status: "text NOT NULL DEFAULT 'draft'",    // 'draft' | 'complete'
  aiEnrichment: 'jsonb',              // AI-generated enrichment data (see below)
  heuCandidate: 'boolean DEFAULT false',
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
  // Indexes: le_family_date_idx(familyId, dateOccurred), le_family_status_idx(familyId, status)
};
// aiEnrichment shape:
// {
//   capability_threads?: Array<{ thread_id: string; confidence: number }>,
//   curriculum_descriptors?: Array<{ code: string; confidence: number }>,
//   subjects_detected?: string[],
//   engagement_score?: number,
//   insight_suggestions?: string[],
// }

// ─── AI Layer ───

const familyIntelligenceSnapshots = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  familyId: 'uuid UNIQUE NOT NULL REFERENCES families(id)',
  snapshotData: 'jsonb NOT NULL DEFAULT {}', // Pre-computed per-child capability profiles
  rebuiltAt: 'timestamp',
  rebuildTrigger: 'text',        // What caused the rebuild
  snapshotVersion: 'integer DEFAULT 1',
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
};

const aiPipelineLogs = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  familyId: 'uuid NOT NULL REFERENCES families(id)',
  entryId: 'uuid REFERENCES learning_entries(id)',
  modelUsed: 'text NOT NULL',         // e.g. 'claude-haiku-4-5-20251001'
  inputTokens: 'integer NOT NULL',
  outputTokens: 'integer NOT NULL',
  latencyMs: 'integer NOT NULL',
  confidence: 'decimal(3,2)',
  retryTriggered: 'boolean DEFAULT false',
  createdAt: 'timestamp DEFAULT now()',
  // Indexes: apl_family_idx(familyId), apl_created_idx(createdAt)
};

// ─── Badges ───

const badgeDefinitions = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  familyId: 'uuid REFERENCES families(id)', // NULL for system badges (from Sanity)
  title: 'text NOT NULL',
  description: 'text',
  emoji: 'text',
  criteriaSummary: 'text',
  indicatorStatements: 'text[]',
  capabilityThreadIds: 'text[]',       // Sanity capability thread IDs
  observationThreshold: 'integer DEFAULT 5',
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
};

const badgeAwards = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  badgeDefinitionId: 'uuid NOT NULL REFERENCES badge_definitions(id)',
  learnerId: 'uuid NOT NULL REFERENCES learners(id)',
  awardedAt: 'timestamp DEFAULT now()',
  awardedBy: "text DEFAULT 'parent'",
  evidenceEntryIds: 'uuid[]',          // Learning entry IDs as evidence
  notes: 'text',
  retractedAt: 'timestamp',           // Non-null = retracted
};

const badgeAssessmentLogs = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  badgeDefinitionId: 'uuid NOT NULL REFERENCES badge_definitions(id)',
  learnerId: 'uuid NOT NULL REFERENCES learners(id)',
  responses: 'jsonb NOT NULL',         // Structured assessment responses
  outcome: 'text NOT NULL',           // 'awarded' | 'deferred' | 'not_ready'
  coolingUntil: 'timestamp',          // Cooling period before re-assessment
  assessedAt: 'timestamp DEFAULT now()',
};

// ─── Planner ───

const plannerEntries = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  familyId: 'uuid NOT NULL REFERENCES families(id)',
  date: 'date NOT NULL',
  title: 'text',
  moduleId: 'text',                   // Sanity module ID
  activityId: 'text',                 // Sanity activity ID
  learnerIds: 'uuid[]',
  status: "text DEFAULT 'planned'",   // 'planned' | 'completed' | 'skipped'
  session: "text DEFAULT 'morning'",  // 'morning' | 'afternoon' | 'evening'
  subjects: 'text[]',
  notes: 'text',
  displayOrder: 'integer DEFAULT 0',
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
  // Indexes: pe_family_date_idx(familyId, date)
};

// ─── Notifications ───

const notifications = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  familyId: 'uuid NOT NULL REFERENCES families(id)',
  type: 'text NOT NULL',              // 'badge_ready' | 'module_nudge' | 'heu_reminder' | etc.
  tier: "text NOT NULL DEFAULT 'whisper'", // 'whisper' | 'nudge' | 'celebrate'
  title: 'text NOT NULL',
  body: 'text',
  bodyData: 'jsonb DEFAULT {}',        // Structured data for rendering
  state: "text NOT NULL DEFAULT 'visible'", // 'visible' | 'read' | 'snoozed' | 'dismissed'
  snoozedUntil: 'timestamp',
  destinationRoute: 'text',           // Deep link route
  createdAt: 'timestamp DEFAULT now()',
  expiresAt: 'timestamp',
  // Indexes: notif_family_state_idx(familyId, state)
};

// ─── Content Library ───

const familyLibrary = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  familyId: 'uuid NOT NULL REFERENCES families(id)',
  sanityPackId: 'text NOT NULL',       // Sanity pack document ID
  addedAt: 'timestamp DEFAULT now()',
  // Unique: fl_family_pack_unique(familyId, sanityPackId)
};

// ─── Module Builder ───

const moduleDrafts = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  familyId: 'uuid NOT NULL REFERENCES families(id)',
  pathway: 'text NOT NULL',           // 'material' | 'process' | 'inquiry' | 'retrospective' | 'goal'
  draftData: 'jsonb NOT NULL DEFAULT {}', // Full draft state per pathway
  status: "text NOT NULL DEFAULT 'draft'", // 'draft' | 'complete'
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
  // Indexes: md_family_status_idx(familyId, status)
};

// ─── Facilitator Notes ───

const facilitatorNotes = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  familyId: 'uuid NOT NULL REFERENCES families(id)',
  learnerId: 'uuid NOT NULL REFERENCES learners(id)',
  noteText: 'text NOT NULL',
  isPrivate: 'boolean DEFAULT true',
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
};

// ─── HEU Compliance ───

const heuReports = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  familyId: 'uuid NOT NULL REFERENCES families(id)',
  learnerId: 'uuid NOT NULL REFERENCES learners(id)',
  reportYear: 'integer NOT NULL',
  status: "text NOT NULL DEFAULT 'draft'",  // 'draft' | 'complete' | 'exported'
  lastExportedAt: 'timestamp',
  choiceArea: "text DEFAULT 'science'",     // 'science' | 'hass' for slots 5-6
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
  // Unique: hr_family_learner_year(familyId, learnerId, reportYear)
};

const workSamples = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  reportId: 'uuid NOT NULL REFERENCES heu_reports(id)',
  slot: 'text NOT NULL',              // 'early_writing' | 'later_writing' | 'early_maths' | 'later_maths' | 'early_choice' | 'later_choice'
  entryId: 'uuid REFERENCES learning_entries(id)',
  status: "text NOT NULL DEFAULT 'empty'",  // 'empty' | 'selected' | 'annotated' | 'complete'
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
  // Unique: ws_report_slot(reportId, slot)
  // Indexes: ws_entry_idx(entryId)
};

const workSampleAnnotations = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  workSampleId: 'uuid UNIQUE NOT NULL REFERENCES work_samples(id)',
  observations: 'text',
  observationsSource: "text DEFAULT 'parent_written'",      // 'ai_draft' | 'parent_edited' | 'parent_written'
  needsStrengths: 'text',
  needsStrengthsSource: "text DEFAULT 'parent_written'",
  adjustment: 'text',
  adjustmentSource: "text DEFAULT 'parent_written'",
  planning: 'text',
  planningSource: "text DEFAULT 'parent_written'",
  progressionSummary: 'text',
  progressionSummaryEdited: 'boolean DEFAULT false',
  confirmedAt: 'timestamp',           // Non-null = parent confirmed this annotation
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
};

// ─── Provider Codes ───

const providerCodes = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  code: 'text NOT NULL UNIQUE',
  redeemedByFamilyId: 'uuid REFERENCES families(id)',
  redeemedAt: 'timestamp',
  createdAt: 'timestamp DEFAULT now()',
};
