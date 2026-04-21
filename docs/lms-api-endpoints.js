/**
 * Hearth LMS — API Route Reference
 * Base URL: /api
 * Auth: Clerk (@clerk/nextjs/server)
 * RBAC: checkWritePermission(clerkUserId, familyId) gates all write endpoints to owner/editor roles
 * Route count: 107 route files, ~130 handlers
 *
 * Updated: 12 April 2026
 */

// ═══════════════════════════════════════
// ENTRIES (Learning Data)
// ═══════════════════════════════════════

// List entries for authenticated family
// GET /api/entries
// Query: learnerId, startDate, endDate, status, limit, offset

// Create a new learning entry
// POST /api/entries
// Body: { title, description, dateOccurred, subjects[], learnerIds[], engagementPerLearner, discoveriesPerLearner, evidenceUrls[], source, sourceModuleId?, sourceProjectId?, sourceStageNumber?, sourceSessionId? }
// RBAC: checkWritePermission required
// Side effect: triggers AI enrichment (enrich.ts → Haiku)

// Get a single entry
// GET /api/entries/[id]

// Update an entry
// PATCH /api/entries/[id]
// Body: partial entry fields
// RBAC: checkWritePermission required

// Delete an entry (draft status only — returns 400 if entry is complete)
// DELETE /api/entries/[id]
// RBAC: checkWritePermission required

// Mark entry as complete (triggers snapshot rebuild)
// POST /api/entries/[id]/complete
// Side effect: rebuildSnapshot(familyId, 'entry_saved')

// Import entries from CSV
// POST /api/entries/import
// Body: { csv: string }
// RBAC: checkWritePermission required
// Side effect: AI enrichment + snapshot rebuild

// ═══════════════════════════════════════
// LEARNERS
// ═══════════════════════════════════════

// List all learners for authenticated family
// GET /api/learners

// Create a new learner
// POST /api/learners
// Body: { name, dateOfBirth?, shapeIcon?, colourToken? }

// Get a single learner
// GET /api/learners/[id]

// Update a learner
// PATCH /api/learners/[id]
// Body: partial learner fields (including profileData)

// Delete a learner
// DELETE /api/learners/[id]

// ═══════════════════════════════════════
// BADGES
// ═══════════════════════════════════════

// List all badge definitions for family
// GET /api/badges

// Create a badge definition
// POST /api/badges
// Body: { title, description?, emoji?, criteriaSummary?, indicatorStatements[], capabilityThreadIds[], observationThreshold? }

// Get a single badge definition
// GET /api/badges/[id]

// Retract a badge award
// PATCH /api/badges/[id]/retract
// Body: { learnerId }

// Award a badge to a learner via assessment responses
// POST /api/badges/award
// Body: { badgeId, learnerId, responses: [{ questionId, response, note? }] }

// List all badge awards (optionally filtered by learner)
// GET /api/badges/awards
// Query: learnerId

// Check if any badge thresholds are met for a learner
// POST /api/badges/check-thresholds
// Body: { learnerId }

// Defer a badge assessment (set cooling period)
// POST /api/badges/defer
// Body: { badgeDefinitionId, learnerId, coolingDays? }

// Get assessment history for a badge+learner
// GET /api/badges/history
// Query: badgeDefinitionId, learnerId

// ═══════════════════════════════════════
// CAPABILITIES
// ═══════════════════════════════════════

// Get capability profile for a learner (from snapshot)
// GET /api/capabilities/[learnerId]

// Override a capability tier for a learner
// POST /api/capabilities/[learnerId]/override
// Body: { threadId, tier, reason? }
// Stored in learner profileData.tierOverrides

// ═══════════════════════════════════════
// PLANNER
// ═══════════════════════════════════════

// List planner entries for a date range
// GET /api/planner
// Query: startDate, endDate

// Create a planner entry
// POST /api/planner
// Body: { date, title?, moduleId?, activityId?, learnerIds[], session?, subjects[], notes? }

// Update a planner entry
// PATCH /api/planner/[id]
// Body: partial planner fields

// Delete a planner entry
// DELETE /api/planner/[id]

// ═══════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════

// List all notifications for family
// GET /api/notifications

// Batch update notification states
// PATCH /api/notifications
// Body: { ids[], state }

// Update a single notification
// PATCH /api/notifications/[id]
// Body: { state, snoozedUntil? }

// Mark all notifications as read
// PATCH /api/notifications/mark-all-read

// Trigger a notification (internal use)
// POST /api/notifications/trigger
// Body: { type, learnerId?, data? }

// ═══════════════════════════════════════
// DASHBOARD & SNAPSHOT
// ═══════════════════════════════════════

// Get dashboard data (recent entries, stats, moments)
// GET /api/dashboard

// Get family intelligence snapshot
// GET /api/snapshot

// ═══════════════════════════════════════
// FAMILY & SETTINGS
// ═══════════════════════════════════════

// Get family profile
// GET /api/family

// Update family profile
// PATCH /api/family
// Body: { familyName? }

// List family members (co-facilitators)
// GET /api/family/members

// Invite a family member
// POST /api/family/members
// Body: { email, role }

// Remove a family member
// DELETE /api/family/members
// Body: { memberId }

// Accept a family invite
// POST /api/family/invite
// Body: { inviteToken }

// Get family settings
// GET /api/settings

// Update family settings
// PATCH /api/settings
// Body: { pedagogyPreference?, pedagogyValues?, pedagogyPractices?, registrationNumber?, nextReportDate?, state?, notificationPrefs? }

// ═══════════════════════════════════════
// MODULES (Builder + Publishing)
// ═══════════════════════════════════════

// List module drafts
// GET /api/modules/drafts

// Create or update a module draft
// POST /api/modules/drafts
// Body: { pathway, draftData, status? }

// Publish a module to Sanity CMS
// POST /api/modules/publish
// Body: full module tree (see CLAUDE.md "Publish API" section)
// Returns: { moduleId, approaches: [{ approachId, activityIds }] }

// ═══════════════════════════════════════
// CONTENT LIBRARY
// ═══════════════════════════════════════

// Get family's purchased packs
// GET /api/library

// Add a pack to family library
// POST /api/library
// Body: { sanityPackId }

// ═══════════════════════════════════════
// EVIDENCE
// ═══════════════════════════════════════

// Upload evidence file (photo/document)
// POST /api/evidence/upload
// Body: FormData with file
// Returns: { url } (Vercel Blob URL)
// Requires: BLOB_READ_WRITE_TOKEN env var

// ═══════════════════════════════════════
// HEU REPORT & WORK SAMPLES
// ═══════════════════════════════════════

// Get or check for existing report
// GET /api/report
// Query: learnerId, year?

// Create a report with 6 empty work sample slots
// POST /api/report
// Body: { learnerId, year? }
// RBAC: checkWritePermission required
// Authz: verifies learnerId belongs to authenticated family

// Update report metadata
// PATCH /api/report/[reportId]
// Body: { choiceArea?, status? }
// RBAC: checkWritePermission required

// List work samples with annotations for a report
// GET /api/report/[reportId]/samples

// Assign or clear an entry on a work sample slot
// PATCH /api/report/[reportId]/samples
// Body: { slot, entryId }
// RBAC: checkWritePermission required
// Authz: verifies entryId belongs to authenticated family

// Upsert annotation on a work sample
// PATCH /api/report/[reportId]/samples/[sampleId]
// Body: { observations?, needsStrengths?, adjustment?, planning?, confirmed? }
// RBAC: checkWritePermission required

// Export HEU compliance report as PDF
// GET /api/report/export
// Query: learnerId, reportId?
// Returns: application/pdf

// ═══════════════════════════════════════
// STRIPE (Marketplace Payments)
// ═══════════════════════════════════════

// Create a Stripe checkout session
// POST /api/stripe/checkout
// Body: { priceId, packId }

// Stripe webhook handler
// POST /api/stripe/webhook
// Verifies Stripe signature, provisions pack to family library

// ═══════════════════════════════════════
// ONBOARDING & WELCOME
// ═══════════════════════════════════════

// Complete onboarding flow
// POST /api/onboarding/complete

// Complete welcome wizard
// POST /api/welcome/complete

// ═══════════════════════════════════════
// ACCOUNT MANAGEMENT
// ═══════════════════════════════════════

// Export all family data (GDPR)
// GET /api/account/export
// Returns: JSON dump of all family data

// Delete family account
// POST /api/account/delete
// Body: { confirmation }

// ═══════════════════════════════════════
// ADMIN & SEED
// ═══════════════════════════════════════

// Get AI pipeline token usage stats
// GET /api/admin/tokens

// Data retention — list or purge old data
// GET /api/admin/retention
// POST /api/admin/retention
// Body: { action, olderThanDays? }

// Seed capability threads from static data
// POST /api/seed/capability-threads

// Validate a provider/access code
// POST /api/provider-code/validate
// Body: { code }

// ═══════════════════════════════════════
// CONTENT QUERIES (Read-only from Sanity)
// ═══════════════════════════════════════

// Fetch module skeletons for builder suggestions
// GET /api/skeletons
// Query: domain?, tier?

// ═══════════════════════════════════════
// HEARTHS (Community Hub)
// ═══════════════════════════════════════

// List hearths for authenticated family
// GET /api/hearths

// Create a new hearth
// POST /api/hearths
// Body: { name, description?, location? }

// Get hearth details
// GET /api/hearths/[id]

// Update a hearth
// PATCH /api/hearths/[id]
// Body: { name?, description?, location?, settings? }

// Invite to a hearth (generates invite code)
// POST /api/hearths/[id]/invite

// Join a hearth via invite code
// POST /api/hearths/[id]/join
// Body: { code, consentCrossObservation?, consentEvidenceSharing? }

// Leave a hearth
// POST /api/hearths/[id]/leave

// List hearth members
// GET /api/hearths/[id]/members

// Remove a member from hearth
// DELETE /api/hearths/[id]/members/[familyId]

// Promote a member (e.g. to co-facilitator)
// POST /api/hearths/[id]/members/[familyId]/promote

// Get hearth's "our story" narrative
// GET /api/hearths/[id]/our-story

// List sessions for a hearth
// GET /api/hearths/[id]/sessions

// Create a session in a hearth
// POST /api/hearths/[id]/sessions
// Body: { title, description?, date, timeStart?, timeEnd?, location?, moduleReference?, activityReference?, prepNotes? }

// Get session details
// GET /api/hearths/[id]/sessions/[sessionId]

// Update a session
// PATCH /api/hearths/[id]/sessions/[sessionId]
// Body: partial session fields

// RSVP to a session
// POST /api/hearths/[id]/sessions/[sessionId]/rsvp
// Body: { rsvpStatus, learnerIds? }

// List/add observations for a session
// GET/POST /api/hearths/[id]/sessions/[sessionId]/observations
// POST Body: { targetFamilyId, targetLearnerId, observationText, evidenceIds? }

// List/add evidence for a session
// GET/POST /api/hearths/[id]/sessions/[sessionId]/evidence
// POST Body: FormData with file, caption?

// List/add reflections for a session
// GET/POST /api/hearths/[id]/sessions/[sessionId]/reflections
// POST Body: { reflectionText }
// Side effect: triggers hearth narrative rebuild

// ═══════════════════════════════════════
// OBSERVATIONS (Cross-family)
// ═══════════════════════════════════════

// Accept a suggested observation (creates learning entry)
// POST /api/observations/[id]/accept

// Dismiss a suggested observation
// POST /api/observations/[id]/dismiss

// ═══════════════════════════════════════
// SCAFFOLDS (Session Helpers)
// ═══════════════════════════════════════

// List available scaffolds
// GET /api/scaffolds

// Get scaffold for a specific session
// GET /api/scaffolds/[sessionId]

// Dismiss a scaffold
// POST /api/scaffolds/[sessionId]/dismiss

// ═══════════════════════════════════════
// PEDAGOGY (Knowledge Base & Webhooks)
// ═══════════════════════════════════════

// Retrieve pedagogy knowledge chunks (Bearer token auth, NOT Clerk)
// POST /api/pedagogy/retrieve
// Auth: Bearer PEDAGOGY_RETRIEVAL_SECRET
// Body: { query, framework?, limit? }

// Sanity webhook handler for pedagogy content updates
// POST /api/pedagogy/sanity-webhook
// Auth: Sanity webhook signature

// ═══════════════════════════════════════
// INVITATIONS (Beta Access)
// ═══════════════════════════════════════

// Validate an invitation code
// GET /api/invitations/validate
// Query: code

// Redeem an invitation code
// POST /api/invitations/redeem
// Body: { code }

// ═══════════════════════════════════════
// LIBRARY (Extended)
// ═══════════════════════════════════════

// Get materials list for library packs
// GET /api/library/materials

// ═══════════════════════════════════════
// ASSETS
// ═══════════════════════════════════════

// Download a content asset
// GET /api/assets/download
// Query: key

// ═══════════════════════════════════════
// PRINT
// ═══════════════════════════════════════

// Generate a print bundle (PDF)
// POST /api/print/bundle
// Body: { moduleId?, activityIds?, format? }

// ═══════════════════════════════════════
// COMMONS
// ═══════════════════════════════════════

// Render commons content to PDF
// GET /api/commons/render
// Query: id

// ═══════════════════════════════════════
// ADMIN (Extended)
// ═══════════════════════════════════════

// --- Analytics ---

// Get thread coverage analytics
// GET /api/admin/analytics/thread-coverage
// Auth: requireAdmin

// Get abandonment analytics
// GET /api/admin/analytics/abandonment
// Auth: requireAdmin

// Get activity heat analytics
// GET /api/admin/analytics/activity-heat
// Auth: requireAdmin

// Get pack adoption analytics
// GET /api/admin/analytics/pack-adoption
// Auth: requireAdmin

// --- Content Management ---

// List content studio drafts
// GET /api/admin/content/drafts
// Auth: requireAdmin

// Create a content studio draft
// POST /api/admin/content/drafts
// Body: { title, draftType?, draftData }
// Auth: requireAdmin

// Get a single draft
// GET /api/admin/content/drafts/[id]
// Auth: requireAdmin

// Update a draft
// PUT /api/admin/content/drafts/[id]
// Body: { title?, draftData?, status? }
// Auth: requireAdmin

// Delete a draft
// DELETE /api/admin/content/drafts/[id]
// Auth: requireAdmin

// Publish a content studio draft to Sanity
// POST /api/admin/content/publish
// Body: { draftId }
// Auth: requireAdmin

// --- Snapshot Management ---

// List stale snapshots
// GET /api/admin/snapshots/stale
// Auth: requireAdmin

// Get snapshot health status
// GET /api/admin/snapshots/health
// Auth: requireAdmin

// Rebuild all snapshots
// POST /api/admin/snapshots/rebuild
// Auth: requireAdmin

// --- Family Management ---

// Search families
// GET /api/admin/families/search
// Query: q
// Auth: requireAdmin

// View a specific family (admin view)
// GET /api/admin/families/[familyId]/view
// Auth: requireAdmin

// Rebuild snapshot for a specific family
// POST /api/admin/families/[familyId]/snapshot/rebuild
// Auth: requireAdmin

// --- Invitation Management ---

// List all invitations
// GET /api/admin/invitations
// Auth: requireAdmin

// Create a new invitation
// POST /api/admin/invitations
// Body: { intendedFamilyName, intendedPrimaryEmail?, intendedLocationState?, sourceLabel?, notes?, expiresAt? }
// Auth: requireAdmin

// Get invitation details
// GET /api/admin/invitations/[id]
// Auth: requireAdmin

// Revoke an invitation
// POST /api/admin/invitations/[id]/revoke
// Body: { reason? }
// Auth: requireAdmin

// Expire old invitations (batch)
// GET /api/admin/invitations/expire
// Auth: requireAdmin

// --- QA Tools ---

// List packs for QA review
// GET /api/admin/qa/packs
// Auth: requireAdmin

// Get QA details for a pack
// GET /api/admin/qa/packs/[packId]
// Auth: requireAdmin

// Recheck a pack's QA status
// POST /api/admin/qa/packs/[packId]/recheck
// Auth: requireAdmin

// List QA issues across all packs
// GET /api/admin/qa/issues
// Auth: requireAdmin

// --- Other Admin ---

// Get audit log
// GET /api/admin/audit-log
// Query: adminUserId?, action?, targetResource?, from?, to?, limit?, offset?
// Auth: requireAdmin

// Get ops summary (system health)
// GET /api/admin/ops/summary
// Auth: requireAdmin

// Seed content assets from Sanity
// POST /api/seed/content-assets
