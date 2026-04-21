/**
 * Hearth LMS — PostgreSQL Database Schema Reference
 * ORM: Drizzle (drizzle-orm/pg-core)
 * Host: Neon serverless Postgres
 * Schema source: src/lib/db/schema.ts
 * Tables: 30
 *
 * Updated: 12 April 2026
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
  registrationNumber: 'text',              // Renamed from heuRegistrationNumber (April 2026)
  nextReportDate: 'date',                  // Renamed from heuNextReportDate (April 2026)
  state: 'text',                           // No default — was previously DEFAULT 'QLD'
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
  source: "text NOT NULL DEFAULT 'logger'",   // 'logger' | 'module_log' | 'project' | 'import' | 'hearth_session'
  sourceModuleId: 'text',             // Sanity module ID if from module experience
  sourceProjectId: 'text',            // Sanity project ID if from project experience
  sourceStageNumber: 'integer',       // Project stage number
  sourceSessionId: 'uuid',            // Hearth session ID if from community session
  status: "text NOT NULL DEFAULT 'draft'",    // 'draft' | 'complete'
  aiEnrichment: 'jsonb',              // AI-generated enrichment data (see below)
  workSampleCandidate: 'boolean DEFAULT false',
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
  // Indexes: le_family_date_idx(familyId, dateOccurred), le_family_status_idx(familyId, status)
};
// aiEnrichment shape:
// {
//   capability_threads?: Array<{ thread_id: string; confidence: number }>,
//   curriculum_descriptors?: Array<{ code: string; confidence: number }>,
//   subjects_detected?: string[],
//   per_child_signals?: Record<string, { engagement?: string; discovery?: string; strengths?: string[] }>,
//   journey_observations?: Array<{ trigger: 'cross_domain' | 'independence' | 'metacognition' | 'transfer'; text: string }>,
//   quality?: { richness: 'thin' | 'adequate' | 'rich'; evidence_present: boolean; multi_subject: boolean },
//   confidence?: number,
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

// ─── Compliance Reports ───

const complianceReports = {
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
  reportId: 'uuid NOT NULL REFERENCES compliance_reports(id)',
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

// ─── Community (Hearths) ───

const hearths = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  name: 'text NOT NULL',
  description: 'text',
  location: 'text',
  createdByFamilyId: 'uuid NOT NULL REFERENCES families(id)',
  status: "text NOT NULL DEFAULT 'active'",
  settings: 'jsonb DEFAULT {}',
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
};

const hearthMemberships = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  hearthId: 'uuid NOT NULL REFERENCES hearths(id)',
  familyId: 'uuid NOT NULL REFERENCES families(id)',
  role: "text NOT NULL DEFAULT 'member'",      // 'creator' | 'member'
  status: "text NOT NULL DEFAULT 'active'",    // 'active' | 'left'
  joinedAt: 'timestamp DEFAULT now()',
  invitedByFamilyId: 'uuid REFERENCES families(id)',
  consentCrossObservation: 'boolean NOT NULL DEFAULT false',
  consentEvidenceSharing: 'boolean NOT NULL DEFAULT false',
  leftAt: 'timestamp',
  // Unique: hm_hearth_family_uniq(hearthId, familyId)
  // Indexes: hm_family_status_idx(familyId, status)
};

const hearthSessions = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  hearthId: 'uuid NOT NULL REFERENCES hearths(id)',
  title: 'text NOT NULL',
  description: 'text',
  date: 'date NOT NULL',
  timeStart: 'text',
  timeEnd: 'text',
  location: 'text',
  facilitatorFamilyId: 'uuid NOT NULL REFERENCES families(id)',
  facilitatorUserId: 'text',
  status: "text NOT NULL DEFAULT 'upcoming'",  // 'upcoming' | 'in_progress' | 'completed' | 'cancelled'
  moduleReference: 'text',           // Sanity module ID
  activityReference: 'text',         // Sanity activity ID
  prepNotes: 'text',
  sharedRecord: 'text',
  createdAt: 'timestamp DEFAULT now()',
  completedAt: 'timestamp',
  // Indexes: hs_hearth_date_idx(hearthId, date)
};

const sessionAttendance = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  sessionId: 'uuid NOT NULL REFERENCES hearth_sessions(id)',
  familyId: 'uuid NOT NULL REFERENCES families(id)',
  rsvpStatus: "text NOT NULL DEFAULT 'pending'",  // 'pending' | 'going' | 'not_going'
  actuallyAttended: 'boolean',
  learnerIds: 'uuid[]',             // Which learners from this family attended
  // Unique: sa_session_family_uniq(sessionId, familyId)
};

const sessionEvidence = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  sessionId: 'uuid NOT NULL REFERENCES hearth_sessions(id)',
  uploadedByFamilyId: 'uuid NOT NULL REFERENCES families(id)',
  uploadedByUserId: 'text',
  fileUrl: 'text NOT NULL',
  fileType: 'text',
  caption: 'text',
  uploadedAt: 'timestamp DEFAULT now()',
};

const suggestedObservations = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  sessionId: 'uuid NOT NULL REFERENCES hearth_sessions(id)',
  observerFamilyId: 'uuid NOT NULL REFERENCES families(id)',
  observerUserId: 'text',
  targetFamilyId: 'uuid NOT NULL REFERENCES families(id)',
  targetLearnerId: 'uuid NOT NULL REFERENCES learners(id)',
  observationText: 'text NOT NULL',
  evidenceIds: 'uuid[] DEFAULT {}',
  status: "text NOT NULL DEFAULT 'pending'",  // 'pending' | 'accepted' | 'dismissed'
  createdAt: 'timestamp DEFAULT now()',
  reviewedAt: 'timestamp',
  familyEntryId: 'uuid REFERENCES learning_entries(id)',  // Entry created when accepted
  // Indexes: so_target_status_idx(targetFamilyId, status)
};

const sessionReflections = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  sessionId: 'uuid NOT NULL REFERENCES hearth_sessions(id)',
  familyId: 'uuid NOT NULL REFERENCES families(id)',
  userId: 'text',
  reflectionText: 'text NOT NULL',
  createdAt: 'timestamp DEFAULT now()',
};

const hearthInvites = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  hearthId: 'uuid NOT NULL REFERENCES hearths(id)',
  invitedByFamilyId: 'uuid NOT NULL REFERENCES families(id)',
  code: 'text UNIQUE NOT NULL',
  expiresAt: 'timestamp NOT NULL',
  usedByFamilyId: 'uuid REFERENCES families(id)',
  usedAt: 'timestamp',
  createdAt: 'timestamp DEFAULT now()',
};

// ─── Admin ───

const adminAuditLog = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  adminUserId: 'text NOT NULL',
  adminEmail: 'text NOT NULL',
  action: 'text NOT NULL',
  targetResource: 'text',
  targetId: 'text',
  reason: 'text',
  metadata: 'jsonb',
  ipAddress: 'text',
  userAgent: 'text',
  mfaSatisfied: 'boolean DEFAULT false',
  createdAt: 'timestamp DEFAULT now()',
  // Indexes: audit_admin_user_idx(adminUserId, createdAt),
  //          audit_target_idx(targetResource, targetId, createdAt),
  //          audit_action_idx(action, createdAt)
};

const invitations = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  code: 'text UNIQUE NOT NULL',
  intendedFamilyName: 'text NOT NULL',
  intendedPrimaryEmail: 'text',
  intendedLocationState: 'text',
  sourceLabel: 'text',
  notes: 'text',
  status: "text NOT NULL DEFAULT 'pending'",  // 'pending' | 'redeemed' | 'revoked' | 'expired'
  expiresAt: 'timestamp',
  redeemedAt: 'timestamp',
  redeemedByFamilyId: 'uuid REFERENCES families(id)',
  revokedAt: 'timestamp',
  revokedReason: 'text',
  createdByAdminId: 'text NOT NULL',
  createdAt: 'timestamp DEFAULT now()',
  // Indexes: invitations_status_idx(status, createdAt), invitations_code_idx(code)
};

const contentStudioDrafts = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  clerkUserId: 'text NOT NULL',
  title: 'text NOT NULL',
  draftType: "text NOT NULL DEFAULT 'pack'",
  draftData: 'jsonb NOT NULL DEFAULT {}',
  status: "text NOT NULL DEFAULT 'draft'",   // 'draft' | 'published'
  sanityPackId: 'text',                      // Set after publishing to Sanity
  createdAt: 'timestamp DEFAULT now()',
  updatedAt: 'timestamp DEFAULT now()',
  // Indexes: csd_user_status_idx(clerkUserId, status)
};
