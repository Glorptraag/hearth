/**
 * Mock data for dev-preview routes.
 * Shapes match what the real server pages pass to client components.
 * Only used when Clerk/Neon are unavailable.
 */

// ─── Family ──────────────────────────────────────────────────────────────────

export const mockFamily = {
  id: 1,
  familyName: 'Douglas',
  clerkUserId: 'dev_preview',
  onboardingComplete: true,
};

// ─── Learners ────────────────────────────────────────────────────────────────

export const mockLearners = [
  {
    id: '1',
    name: 'Isla',
    dateOfBirth: '2017-04-12',
    shapeIcon: '🌟',
    colourToken: 'rose',
    displayOrder: 0,
  },
  {
    id: '2',
    name: 'Archie',
    dateOfBirth: '2020-09-03',
    shapeIcon: '🦋',
    colourToken: 'blue',
    displayOrder: 1,
  },
];

// ─── Learning Entries ────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
const fourDaysAgo = new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0];

export const mockEntries = [
  {
    id: 'e1',
    title: 'Nature journaling at the creek',
    description: 'We spent the morning sketching banksia pods and recording bird calls. Isla identified three new species using her field guide.',
    dateOccurred: today,
    subjects: ['science', 'arts'],
    learnerIds: ['1', '2'],
  },
  {
    id: 'e2',
    title: 'Fraction baking — banana bread',
    description: 'Doubling the recipe gave us great practice with halves and quarters. Archie measured all the wet ingredients independently.',
    dateOccurred: today,
    subjects: ['mathematics'],
    learnerIds: ['1', '2'],
  },
  {
    id: 'e3',
    title: 'Reading aloud — Charlotte\'s Web Ch.7-8',
    description: 'Isla read two chapters aloud with excellent expression. We discussed friendship and loyalty themes.',
    dateOccurred: yesterday,
    subjects: ['english'],
    learnerIds: ['1'],
  },
  {
    id: 'e4',
    title: 'Block building & symmetry',
    description: 'Archie built a castle with perfect bilateral symmetry, then drew it from above. Great spatial reasoning.',
    dateOccurred: twoDaysAgo,
    subjects: ['mathematics', 'arts'],
    learnerIds: ['2'],
  },
  {
    id: 'e5',
    title: 'Community garden volunteering',
    description: 'Both kids helped plant seedlings and learned about composting cycles. Wonderful social interaction with other families.',
    dateOccurred: threeDaysAgo,
    subjects: ['science', 'hpe'],
    learnerIds: ['1', '2'],
  },
  {
    id: 'e6',
    title: 'History maps — Ancient Egypt',
    description: 'Isla traced the Nile on a blank map and labelled key cities. Archie coloured the desert regions.',
    dateOccurred: fourDaysAgo,
    subjects: ['hass'],
    learnerIds: ['1', '2'],
  },
];

// ─── Intelligence Snapshot ───────────────────────────────────────────────────

export const mockSnapshot = {
  activityStreak: 4,
  lastLogDate: today,
  weeklyThreadCoverage: 68,
  activeModulesCount: 3,
  hearthVoice:
    'Isla\'s nature observations are becoming increasingly detailed — she\'s naturally building scientific inquiry skills through her journaling practice. Archie\'s hands-on measurement work this week shows real confidence with fractions.',
  weekStats: {
    momentsLogged: 6,
    collaborativeActivities: 4,
    newCapabilities: 2,
    evidenceCollected: 8,
  },
  recommendations: [
    { title: 'Try a poetry writing session', subject: 'english' },
    { title: 'Revisit map skills with a local walk', subject: 'hass' },
    { title: 'Archie is ready for simple multiplication', subject: 'mathematics' },
  ],
  activeThreads: [
    { thread_id: 'scientific-thinking', observation_count: 12, suggested_tier: 'developing', last_evidence_date: today },
    { thread_id: 'mathematical-reasoning', observation_count: 8, suggested_tier: 'emerging', last_evidence_date: today },
    { thread_id: 'creative-expression', observation_count: 6, suggested_tier: 'emerging', last_evidence_date: yesterday },
    { thread_id: 'written-communication', observation_count: 10, suggested_tier: 'developing', last_evidence_date: yesterday },
    { thread_id: 'physical-coordination', observation_count: 4, suggested_tier: 'emerging', last_evidence_date: threeDaysAgo },
  ],
};

// ─── Planner Entries ─────────────────────────────────────────────────────────

export const mockPlannerEntries = [
  {
    id: 'p1',
    title: 'Nature Explorers — Module 2',
    status: 'completed',
    moduleId: 'mod-nature-2',
    learnerIds: ['1', '2'],
    date: today,
  },
  {
    id: 'p2',
    title: 'Kitchen Mathematics — Fractions',
    status: 'completed',
    moduleId: 'mod-kitchen-1',
    learnerIds: ['1', '2'],
    date: today,
  },
  {
    id: 'p3',
    title: 'Reading aloud — Charlotte\'s Web',
    status: 'planned',
    moduleId: null,
    learnerIds: ['1'],
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  },
  {
    id: 'p4',
    title: 'Ancient Worlds — Egypt mapping',
    status: 'planned',
    moduleId: 'mod-ancient-1',
    learnerIds: ['1', '2'],
    date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
  },
];

// ─── Notifications ───────────────────────────────────────────────────────────

export const mockNotifications = [
  {
    id: 'n1',
    type: 'draft_resume',
    title: 'You were logging "Watercolour landscapes"…',
    body: 'You started this entry yesterday. Pick up where you left off.',
    bodyData: {},
    tier: 'whisper',
    state: 'visible',
    destinationRoute: '/log',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'n2',
    type: 'badge_ready',
    title: 'Isla might be ready for Scientific Thinker',
    body: '12 observations recorded across 4 weeks. Would you like to check together?',
    bodyData: { learnerId: '1', badgeId: 'b-scientific' },
    tier: 'nudge',
    state: 'visible',
    destinationRoute: '/badges/assess/b-scientific',
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'n3',
    type: 'compliance_nudge',
    title: 'Your HEU check-in is 8 weeks away',
    body: 'You have 3 of 6 required work samples. Science and HPE need attention.',
    bodyData: {},
    tier: 'nudge',
    state: 'visible',
    destinationRoute: '/our-story/report',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'n4',
    type: 'streak_prompt',
    title: 'Four days running — keep the story going',
    body: 'You\'ve logged learning four days in a row. That\'s a lovely rhythm.',
    bodyData: {},
    tier: 'chime',
    state: 'visible',
    destinationRoute: '/log',
    createdAt: new Date(Date.now() - 2 * 86400000),
  },
  {
    id: 'n5',
    type: 'log_invitation',
    title: 'You ran Nature Explorers today — capture it?',
    body: null,
    bodyData: { moduleTitle: 'Nature Explorers — Module 2' },
    tier: 'chime',
    state: 'actioned',
    destinationRoute: '/log',
    createdAt: new Date(Date.now() - 4 * 3600000),
  },
];

// ─── Settings ────────────────────────────────────────────────────────────────

export const mockSettings = {
  familyName: 'Douglas',
  pedagogyPreference: 'charlotte_mason',
  heuRegistrationNumber: 'HEU-2025-04821',
  heuNextReportDate: '2026-05-30',
  state: 'QLD',
  notificationPrefs: {
    draft_resume: true,
    badge_ready: true,
    compliance_nudge: true,
    streak_prompt: true,
    log_invitation: true,
    prep_reminder: false,
    quietHoursStart: '20:00',
    quietHoursEnd: '07:00',
  },
};

export const mockChildren = [
  {
    id: '1',
    name: 'Isla',
    colourToken: 'rose',
    dateOfBirth: '2017-04-12',
  },
  {
    id: '2',
    name: 'Archie',
    colourToken: 'blue',
    dateOfBirth: '2020-09-03',
  },
];

// ─── Our Story Hub (learner stats) ──────────────────────────────────────────

export const mockOurStoryLearners = [
  {
    id: '1',
    name: 'Isla',
    dateOfBirth: '2017-04-12',
    shapeIcon: '🌟',
    colourToken: 'rose',
    learningSince: 'March 2025',
    termSummary:
      'Isla has demonstrated strong growth in Scientific Thinking and Written Communication this term, with emerging confidence in Creative Expression. Her nature journaling practice is a real strength.',
    portfolioTotal: 47,
    portfolioThisTerm: 12,
    heuSamplesReady: 3,
    heuWeeksUntilDeadline: 8,
    capabilityThreadsActive: 14,
    capabilityNearMilestone: 2,
    evidenceThumbs: ['📷', '📷', '📄', '📷', '🎨', '📷'],
  },
  {
    id: '2',
    name: 'Archie',
    dateOfBirth: '2020-09-03',
    shapeIcon: '🦋',
    colourToken: 'blue',
    learningSince: 'January 2026',
    termSummary:
      'Archie is building a strong foundation in Number Sense and Physical Exploration this term. His curiosity and hands-on approach continue to drive meaningful learning moments.',
    portfolioTotal: 18,
    portfolioThisTerm: 4,
    heuSamplesReady: 1,
    heuWeeksUntilDeadline: 8,
    capabilityThreadsActive: 8,
    capabilityNearMilestone: 0,
    evidenceThumbs: ['📷', '📄', '🎨'],
  },
];
