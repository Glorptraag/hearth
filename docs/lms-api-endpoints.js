/**
 * API Endpoints for Digital Badging and Learning Assurance
 * Base URL: /api/v1
 */

// BADGE MANAGEMENT
// =============================

// Get all badges (with filtering options)
// GET /api/v1/badges
// Query params: creatorId, frameworkType, skillsRepresented, isPublic

// Get a specific badge
// GET /api/v1/badges/:badgeId

// Create a new badge
// POST /api/v1/badges
// Body: {
//   name: String,
//   description: String,
//   criteria: String,
//   skillsRepresented: [String],
//   frameworkMappings: [
//     {
//       frameworkType: String,
//       frameworkIdentifier: String,
//       description: String,
//       level: String
//     }
//   ],
//   isPublic: Boolean
// }

// Update a badge
// PUT /api/v1/badges/:badgeId
// Body: same as POST with updated fields

// Delete a badge
// DELETE /api/v1/badges/:badgeId

// Upload badge image
// POST /api/v1/badges/:badgeId/image
// Body: FormData with image file

// LEARNER BADGE MANAGEMENT
// =============================

// Get all badges for a learner
// GET /api/v1/learners/:learnerId/badges
// Query params: visibility, dateFrom, dateTo

// Award a badge to a learner
// POST /api/v1/learners/:learnerId/badges
// Body: {
//   badgeId: String,
//   notes: String,
//   evidenceIds: [String],
//   visibility: String
// }

// Update a learner's badge
// PUT /api/v1/learners/:learnerId/badges/:learnerBadgeId
// Body: same as POST with updated fields

// Delete a learner's badge
// DELETE /api/v1/learners/:learnerId/badges/:learnerBadgeId

// PORTFOLIO MANAGEMENT
// =============================

// Get a learner's portfolio
// GET /api/v1/learners/:learnerId/portfolio
// Query params: visibility

// Create or update a learner's portfolio
// PUT /api/v1/learners/:learnerId/portfolio
// Body: {
//   name: String,
//   description: String,
//   sections: [
//     {
//       title: String,
//       description: String,
//       items: [
//         {
//           type: String,
//           itemId: String,
//           notes: String,
//           featured: Boolean
//         }
//       ]
//     }
//   ],
//   visibility: String
// }

// Add item to portfolio section
// POST /api/v1/learners/:learnerId/portfolio/sections/:sectionId/items
// Body: {
//   type: String,
//   itemId: String,
//   notes: String,
//   featured: Boolean
// }

// Remove item from portfolio section
// DELETE /api/v1/learners/:learnerId/portfolio/sections/:sectionId/items/:itemId

// EVIDENCE MANAGEMENT
// =============================

// Get all evidence for a learner
// GET /api/v1/learners/:learnerId/evidence
// Query params: evidenceType, dateFrom, dateTo

// Get specific evidence
// GET /api/v1/evidence/:evidenceId

// Create new evidence
// POST /api/v1/learners/:learnerId/evidence
// Body: {
//   title: String,
//   description: String,
//   evidenceType: String,
//   frameworkMappings: [
//     {
//       frameworkType: String,
//       frameworkIdentifier: String,
//       description: String,
//       level: String
//     }
//   ]
// }

// Update evidence
// PUT /api/v1/evidence/:evidenceId
// Body: same as POST with updated fields

// Delete evidence
// DELETE /api/v1/evidence/:evidenceId

// Upload evidence media
// POST /api/v1/evidence/:evidenceId/media
// Body: FormData with media files

// Verify evidence
// POST /api/v1/evidence/:evidenceId/verify
// Body: {
//   notes: String
// }

// ACTIVITY TRACKING
// =============================

// Get all activities for a learner
// GET /api/v1/learners/:learnerId/activities
// Query params: activityType, dateFrom, dateTo

// Get specific activity
// GET /api/v1/activities/:activityId

// Create new activity
// POST /api/v1/activities
// Body: {
//   title: String,
//   description: String,
//   activityType: String,
//   location: String,
//   startDate: Date,
//   endDate: Date,
//   duration: Number,
//   participants: [
//     {
//       learnerId: String,
//       role: String,
//       notes: String
//     }
//   ],
//   learningOutcomes: [String],
//   evidenceIds: [String],
//   frameworkMappings: [
//     {
//       frameworkType: String,
//       frameworkIdentifier: String,
//       description: String,
//       level: String
//     }
//   ]
// }

// Update activity
// PUT /api/v1/activities/:activityId
// Body: same as POST with updated fields

// Delete activity
// DELETE /api/v1/activities/:activityId

// FRAMEWORK MAPPINGS
// =============================

// Get all available frameworks
// GET /api/v1/frameworks
// Query params: country, state

// Get specific framework
// GET /api/v1/frameworks/:frameworkId

// Search framework items
// GET /api/v1/frameworks/:frameworkId/search
// Query params: query, category, level

// Get framework item by identifier
// GET /api/v1/frameworks/:frameworkId/items/:identifier

// REPORTING
// =============================

// Generate educational equivalency report
// POST /api/v1/learners/:learnerId/reports/equivalency
// Body: {
//   frameworkType: String,
//   dateRange: {
//     start: Date,
//     end: Date
//   },
//   includeEvidence: Boolean,
//   format: String // "pdf", "html", "json"
// }

// Generate portfolio export
// POST /api/v1/learners/:learnerId/portfolio/export
// Body: {
//   sections: [String], // section IDs to include
//   includeEvidence: Boolean,
//   format: String // "pdf", "html", "json"
// }

// Get learning progress summary
// GET /api/v1/learners/:learnerId/progress
// Query params: dateRange
