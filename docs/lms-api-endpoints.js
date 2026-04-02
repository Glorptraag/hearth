/**
 * Hearth LMS — API Route Reference
 * Base URL: /api
 * Auth: Clerk (@clerk/nextjs/server)
 * RBAC: checkWritePermission(clerkUserId, familyId) gates all write endpoints to owner/editor roles
 * Route count: 48 route files, 65 handlers
 *
 * Updated: 2 April 2026
 */

// ═══════════════════════════════════════
// ENTRIES (Learning Data)
// ═══════════════════════════════════════

// List entries for authenticated family
// GET /api/entries
// Query: learnerId, from, to, status

// Create a new learning entry
// POST /api/entries
// Body: { title, description, dateOccurred, subjects[], learnerIds[], engagementPerLearner, discoveriesPerLearner, evidenceUrls[], source, sourceModuleId?, sourceProjectId?, sourceStageNumber? }
// RBAC: checkWritePermission required
// Side effect: triggers AI enrichment (enrich.ts → Haiku)

// Get a single entry
// GET /api/entries/[id]

// Update an entry
// PATCH /api/entries/[id]
// Body: partial entry fields
// RBAC: checkWritePermission required

// Delete an entry
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

// Award a badge to a learner
// POST /api/badges/award
// Body: { badgeDefinitionId, learnerId, evidenceEntryIds[], notes? }

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
// Query: from, to

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
// Body: { pedagogyPreference?, pedagogyValues?, pedagogyPractices?, heuRegistrationNumber?, heuNextReportDate?, state?, notificationPrefs? }

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
