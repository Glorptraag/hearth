// Centralised emoji/icon registry for the entire Hearth app.
// Every emoji used in the UI should be referenced from here.
// Each entry carries metadata for future sprite migration tooling.
//
// Keys use dot-notation: category.semantic-key
// Same emoji character can appear under different keys when used for
// distinct semantic purposes (e.g. subject.arts and pedagogy.waldorf
// both use 🎨 but are independently swappable).

export type IconCategory =
  | 'navigation'
  | 'subject'
  | 'activity-type'
  | 'engagement'
  | 'location'
  | 'modality'
  | 'energy'
  | 'pedagogy'
  | 'pedagogy-value'
  | 'pedagogy-practice'
  | 'creator'
  | 'ui-action'
  | 'state'
  | 'notification'
  | 'settings-tab'
  | 'brand'
  | 'badge'
  | 'learner-shape'
  | 'session'
  | 'resource-type'
  | 'pathway'
  | 'intent'
  | 'investigation'
  | 'preference'
  | 'insight'
  | 'story'
  | 'landing'
  | 'admin'
  | 'project'
  | 'module-engagement'
  | 'welcome'
  | 'misc';

export interface IconEntry {
  value: string;
  category: IconCategory;
  description: string;
  reuse: 'high' | 'medium' | 'low';
}

export const ICON_REGISTRY = {
  // ── Navigation ──────────────────────────────────────────────
  'nav.home':          { value: '🏠', category: 'navigation', description: 'Dashboard/Home', reuse: 'high' },
  'nav.log':           { value: '✏️', category: 'navigation', description: 'Learning logger', reuse: 'high' },
  'nav.story':         { value: '📖', category: 'navigation', description: 'Our Story', reuse: 'high' },
  'nav.explore':       { value: '🔍', category: 'navigation', description: 'Explore activities', reuse: 'high' },
  'nav.plan':          { value: '📅', category: 'navigation', description: 'Weekly planner', reuse: 'high' },
  'nav.settings':      { value: '⚙️', category: 'navigation', description: 'Settings', reuse: 'high' },
  'nav.notifications': { value: '🔔', category: 'navigation', description: 'Notification bell', reuse: 'high' },
  'nav.capabilities':  { value: '🌟', category: 'navigation', description: 'Capabilities view', reuse: 'medium' },
  'nav.portfolio':     { value: '📄', category: 'navigation', description: 'Portfolio', reuse: 'medium' },
  'nav.marketplace':   { value: '📚', category: 'navigation', description: 'Marketplace', reuse: 'medium' },

  // ── Subjects / Domains ──────────────────────────────────────
  'subject.english':            { value: '📚', category: 'subject', description: 'English/Literacy', reuse: 'high' },
  'subject.mathematics':        { value: '🔢', category: 'subject', description: 'Mathematics', reuse: 'high' },
  'subject.science':            { value: '🔬', category: 'subject', description: 'Science', reuse: 'high' },
  'subject.hass':               { value: '🌏', category: 'subject', description: 'Humanities & Social Sciences', reuse: 'high' },
  'subject.arts':               { value: '🎨', category: 'subject', description: 'Creative Arts', reuse: 'high' },
  'subject.technologies':       { value: '⚙️', category: 'subject', description: 'Technologies', reuse: 'high' },
  'subject.hpe':                { value: '🏃', category: 'subject', description: 'Health & Physical Education', reuse: 'high' },
  'subject.languages':          { value: '🗣️', category: 'subject', description: 'Languages', reuse: 'high' },
  'subject.psychosocial':       { value: '💡', category: 'subject', description: 'Psychosocial', reuse: 'medium' },
  'subject.executive-function': { value: '🧠', category: 'subject', description: 'Executive Function', reuse: 'medium' },

  // ── Activity Types ──────────────────────────────────────────
  'activity.free-exploration': { value: '🌿', category: 'activity-type', description: 'Free/unstructured exploration', reuse: 'high' },
  'activity.guided':           { value: '📋', category: 'activity-type', description: 'Guided/structured activity', reuse: 'high' },
  'activity.read-aloud':       { value: '📖', category: 'activity-type', description: 'Reading aloud together', reuse: 'medium' },
  'activity.project':          { value: '🔨', category: 'activity-type', description: 'Project-based work', reuse: 'medium' },
  'activity.field-trip':       { value: '🚶', category: 'activity-type', description: 'Excursion/field trip', reuse: 'medium' },
  'activity.creative':         { value: '🎨', category: 'activity-type', description: 'Creative play/art', reuse: 'medium' },
  'activity.physical':         { value: '⚽', category: 'activity-type', description: 'Physical activity/sport', reuse: 'medium' },
  'activity.life-skills':      { value: '🏠', category: 'activity-type', description: 'Life skills/practical', reuse: 'medium' },

  // ── Engagement ──────────────────────────────────────────────
  'engagement.loved':     { value: '😊', category: 'engagement', description: 'Loved it / deep engagement', reuse: 'medium' },
  'engagement.engaged':   { value: '🙂', category: 'engagement', description: 'Engaged / positive', reuse: 'medium' },
  'engagement.okay':      { value: '😐', category: 'engagement', description: 'Okay / neutral', reuse: 'medium' },
  'engagement.struggled': { value: '😕', category: 'engagement', description: 'Struggled / difficult', reuse: 'medium' },

  // ── Location / Setting ──────────────────────────────────────
  'location.home':      { value: '🏠', category: 'location', description: 'Home/Indoor', reuse: 'high' },
  'location.outdoors':  { value: '🌳', category: 'location', description: 'Outdoors/Nature', reuse: 'high' },
  'location.community': { value: '🏛', category: 'location', description: 'Community venue', reuse: 'medium' },
  'location.online':    { value: '💻', category: 'location', description: 'Online/digital', reuse: 'medium' },
  'location.either':    { value: '🔄', category: 'location', description: 'Indoor or outdoor', reuse: 'medium' },

  // ── Modality ────────────────────────────────────────────────
  'modality.kinesthetic': { value: '🤲', category: 'modality', description: 'Hands-on/physical learning', reuse: 'medium' },
  'modality.visual':      { value: '👁', category: 'modality', description: 'Visual/observation', reuse: 'medium' },
  'modality.auditory':    { value: '👂', category: 'modality', description: 'Listening/auditory', reuse: 'medium' },
  'modality.narrative':   { value: '📖', category: 'modality', description: 'Story/narrative', reuse: 'medium' },
  'modality.social':      { value: '👥', category: 'modality', description: 'Group/collaborative', reuse: 'medium' },
  'modality.reading':     { value: '📚', category: 'modality', description: 'Reading-based', reuse: 'medium' },
  'modality.exploratory': { value: '🔍', category: 'modality', description: 'Inquiry/exploration', reuse: 'medium' },

  // ── Energy ──────────────────────────────────────────────────
  'energy.calm':     { value: '🧘', category: 'energy', description: 'Calm/quiet activity', reuse: 'medium' },
  'energy.moderate': { value: '⚡', category: 'energy', description: 'Moderate energy', reuse: 'medium' },
  'energy.active':   { value: '🔥', category: 'energy', description: 'High energy/active', reuse: 'medium' },

  // ── Pedagogy ────────────────────────────────────────────────
  'pedagogy.charlotte-mason': { value: '🌿', category: 'pedagogy', description: 'Charlotte Mason approach', reuse: 'medium' },
  'pedagogy.classical':       { value: '🏛️', category: 'pedagogy', description: 'Classical education', reuse: 'medium' },
  'pedagogy.montessori':      { value: '🧩', category: 'pedagogy', description: 'Montessori method', reuse: 'medium' },
  'pedagogy.waldorf':         { value: '🎨', category: 'pedagogy', description: 'Waldorf/Steiner', reuse: 'medium' },
  'pedagogy.unschooling':     { value: '🌱', category: 'pedagogy', description: 'Unschooling/natural', reuse: 'medium' },
  'pedagogy.eclectic':        { value: '🔀', category: 'pedagogy', description: 'Eclectic/mixed', reuse: 'medium' },

  // ── Pedagogy Values ─────────────────────────────────────────
  'value.child-led':    { value: '🧒', category: 'pedagogy-value', description: 'Child-led learning', reuse: 'low' },
  'value.structured':   { value: '📋', category: 'pedagogy-value', description: 'Structured approach', reuse: 'low' },
  'value.nature':       { value: '🌿', category: 'pedagogy-value', description: 'Nature-focused', reuse: 'low' },
  'value.arts':         { value: '🎨', category: 'pedagogy-value', description: 'Arts-integrated', reuse: 'low' },
  'value.academic':     { value: '📚', category: 'pedagogy-value', description: 'Academic rigor', reuse: 'low' },
  'value.real-world':   { value: '🌍', category: 'pedagogy-value', description: 'Real-world connection', reuse: 'low' },
  'value.flexibility':  { value: '🌊', category: 'pedagogy-value', description: 'Flexible scheduling', reuse: 'low' },
  'value.whole-child':  { value: '💚', category: 'pedagogy-value', description: 'Whole-child development', reuse: 'low' },
  'value.independence': { value: '🦅', category: 'pedagogy-value', description: 'Independence', reuse: 'low' },
  'value.mastery':      { value: '🎯', category: 'pedagogy-value', description: 'Mastery-based', reuse: 'low' },

  // ── Pedagogy Practices ──────────────────────────────────────
  'practice.short-lessons':     { value: '⏱', category: 'pedagogy-practice', description: 'Short focused lessons', reuse: 'low' },
  'practice.extended-projects': { value: '🏗', category: 'pedagogy-practice', description: 'Extended project work', reuse: 'low' },
  'practice.living-books':      { value: '📖', category: 'pedagogy-practice', description: 'Living books', reuse: 'low' },
  'practice.hands-on':          { value: '🤲', category: 'pedagogy-practice', description: 'Hands-on activities', reuse: 'low' },
  'practice.narration':         { value: '🗣', category: 'pedagogy-practice', description: 'Oral narration', reuse: 'low' },
  'practice.nature-journaling': { value: '🌸', category: 'pedagogy-practice', description: 'Nature journaling', reuse: 'low' },
  'practice.movement':          { value: '🎵', category: 'pedagogy-practice', description: 'Movement/music', reuse: 'low' },
  'practice.rhythm':            { value: '🔄', category: 'pedagogy-practice', description: 'Daily rhythm', reuse: 'low' },
  'practice.documentation':     { value: '📁', category: 'pedagogy-practice', description: 'Documentation', reuse: 'low' },
  'practice.free-play':         { value: '🎮', category: 'pedagogy-practice', description: 'Free play', reuse: 'low' },
  'practice.memory-work':       { value: '🧠', category: 'pedagogy-practice', description: 'Memory work', reuse: 'low' },
  'practice.copywork':          { value: '✍', category: 'pedagogy-practice', description: 'Copywork', reuse: 'low' },

  // ── Creator Types ───────────────────────────────────────────
  'creator.content-team': { value: '🌿', category: 'creator', description: 'Hearth content team', reuse: 'medium' },
  'creator.educator':     { value: '🎓', category: 'creator', description: 'Educator-contributed', reuse: 'medium' },
  'creator.parent':       { value: '💛', category: 'creator', description: 'Parent-contributed', reuse: 'medium' },
  'creator.default':      { value: '✨', category: 'creator', description: 'Default/unknown creator', reuse: 'medium' },

  // ── UI Actions ──────────────────────────────────────────────
  'action.edit':      { value: '✏️', category: 'ui-action', description: 'Edit/modify', reuse: 'high' },
  'action.photo':     { value: '📷', category: 'ui-action', description: 'Add/view photo', reuse: 'medium' },
  'action.voice':     { value: '🎤', category: 'ui-action', description: 'Voice recording', reuse: 'low' },
  'action.words':     { value: '💬', category: 'ui-action', description: "Child's words", reuse: 'low' },
  'action.note':      { value: '📝', category: 'ui-action', description: 'Add note', reuse: 'medium' },
  'action.link':      { value: '🔗', category: 'ui-action', description: 'Link resource', reuse: 'low' },
  'action.search':    { value: '🔍', category: 'ui-action', description: 'Search', reuse: 'medium' },
  'action.log-stage': { value: '✏️', category: 'ui-action', description: 'Log a project stage', reuse: 'low' },

  // ── States ──────────────────────────────────────────────────
  'state.welcome':         { value: '👋', category: 'state', description: 'Welcome/greeting', reuse: 'low' },
  'state.growth':          { value: '🌱', category: 'state', description: 'Growth/ready/set up', reuse: 'high' },
  'state.success':         { value: '✨', category: 'state', description: 'Success/celebration', reuse: 'high' },
  'state.celebration':     { value: '🎉', category: 'state', description: 'Achievement celebration', reuse: 'medium' },
  'state.not-found':       { value: '🔭', category: 'state', description: 'Content not found', reuse: 'medium' },
  'state.nothing-planned': { value: '📅', category: 'state', description: 'Nothing planned', reuse: 'medium' },
  'state.quiet':           { value: '🌙', category: 'state', description: 'Quiet/do not disturb', reuse: 'low' },
  'state.empty-story':     { value: '📖', category: 'state', description: 'Story not started', reuse: 'medium' },
  'state.returning':       { value: '🌅', category: 'state', description: 'Returning inactive user', reuse: 'low' },
  'state.draft':           { value: '📝', category: 'state', description: 'Draft saved/restored', reuse: 'low' },
  'state.searching':       { value: '🔍', category: 'state', description: 'Searching/loading', reuse: 'low' },
  'state.deep-engagement': { value: '✨', category: 'state', description: 'Deep engagement insight', reuse: 'low' },
  'state.growth-moment':   { value: '💪', category: 'state', description: 'Growth moment insight', reuse: 'low' },
  'state.private':         { value: '🔒', category: 'state', description: 'Private/locked content', reuse: 'low' },

  // ── Notifications ───────────────────────────────────────────
  'notification.draft':              { value: '📝', category: 'notification', description: 'Draft resume', reuse: 'low' },
  'notification.pause':              { value: '📝', category: 'notification', description: 'Pause acknowledgement', reuse: 'low' },
  'notification.badge-ready':        { value: '🏅', category: 'notification', description: 'Badge ready to award', reuse: 'low' },
  'notification.compliance':         { value: '📋', category: 'notification', description: 'Compliance nudge', reuse: 'low' },
  'notification.invitation':         { value: '💡', category: 'notification', description: 'Log invitation', reuse: 'low' },
  'notification.reminder':           { value: '📅', category: 'notification', description: 'Prep reminder', reuse: 'low' },
  'notification.streak':             { value: '💭', category: 'notification', description: 'Streak prompt', reuse: 'low' },
  'notification.streak-celebration': { value: '🎉', category: 'notification', description: 'Streak celebration', reuse: 'low' },
  'notification.digest':             { value: '📊', category: 'notification', description: 'Weekly digest', reuse: 'low' },
  'notification.capability-growth':  { value: '🌱', category: 'notification', description: 'Capability growth', reuse: 'low' },

  // ── Settings Tabs ───────────────────────────────────────────
  'settings.family':        { value: '🏡', category: 'settings-tab', description: 'Family Profile tab', reuse: 'low' },
  'settings.learners':      { value: '👧', category: 'settings-tab', description: 'Our Learners tab', reuse: 'low' },
  'settings.approach':      { value: '🌿', category: 'settings-tab', description: 'Learning Approach tab', reuse: 'low' },
  'settings.compliance':    { value: '📋', category: 'settings-tab', description: 'Compliance tab', reuse: 'low' },
  'settings.notifications': { value: '🔔', category: 'settings-tab', description: 'Notifications tab', reuse: 'low' },
  'settings.access':        { value: '🔑', category: 'settings-tab', description: 'Family Access tab', reuse: 'low' },
  'settings.security':      { value: '🛡️', category: 'settings-tab', description: 'Account & Security tab', reuse: 'low' },
  'settings.subscription':  { value: '💎', category: 'settings-tab', description: 'Subscription tab', reuse: 'low' },

  // ── Brand ───────────────────────────────────────────────────
  'brand.logo':     { value: '🔥', category: 'brand', description: 'Hearth brand fire', reuse: 'high' },
  'brand.founding': { value: '🌿', category: 'brand', description: 'Founding member badge', reuse: 'low' },

  // ── Badges ──────────────────────────────────────────────────
  'badge.default': { value: '🏅', category: 'badge', description: 'Default badge icon', reuse: 'medium' },

  // ── Learner Shapes ──────────────────────────────────────────
  'shape.star':      { value: '🌟', category: 'learner-shape', description: 'Star shape', reuse: 'medium' },
  'shape.butterfly': { value: '🦋', category: 'learner-shape', description: 'Butterfly shape', reuse: 'low' },
  'shape.leaf':      { value: '🌿', category: 'learner-shape', description: 'Leaf shape', reuse: 'low' },
  'shape.fire':      { value: '🔥', category: 'learner-shape', description: 'Fire shape', reuse: 'low' },
  'shape.wave':      { value: '🌊', category: 'learner-shape', description: 'Wave shape', reuse: 'low' },
  'shape.palette':   { value: '🎨', category: 'learner-shape', description: 'Palette shape', reuse: 'low' },

  // ── Session / Time ──────────────────────────────────────────
  'session.morning':   { value: '☀️', category: 'session', description: 'Morning session', reuse: 'low' },
  'session.afternoon': { value: '🌆', category: 'session', description: 'Afternoon session', reuse: 'low' },

  // ── Resource Types ──────────────────────────────────────────
  'resource.book':  { value: '📚', category: 'resource-type', description: 'Book resource', reuse: 'low' },
  'resource.video': { value: '🎬', category: 'resource-type', description: 'Video resource', reuse: 'low' },
  'resource.kit':   { value: '🧰', category: 'resource-type', description: 'Kit/materials', reuse: 'low' },
  'resource.app':   { value: '📱', category: 'resource-type', description: 'App/digital', reuse: 'low' },
  'resource.place': { value: '📍', category: 'resource-type', description: 'Location/venue', reuse: 'low' },
  'resource.audio': { value: '🎵', category: 'resource-type', description: 'Audio resource', reuse: 'low' },
  'resource.other': { value: '📦', category: 'resource-type', description: 'Other resource', reuse: 'low' },

  // ── Pathways ────────────────────────────────────────────────
  'pathway.material':      { value: '📖', category: 'pathway', description: 'Material-Anchored pathway', reuse: 'low' },
  'pathway.process':       { value: '🔧', category: 'pathway', description: 'Process pathway', reuse: 'low' },
  'pathway.retrospective': { value: '🔄', category: 'pathway', description: 'Retrospective Lift pathway', reuse: 'low' },
  'pathway.goal':          { value: '🎯', category: 'pathway', description: 'Goal-Forward pathway', reuse: 'low' },

  // ── Usage Intents ───────────────────────────────────────────
  'intent.read':        { value: '📖', category: 'intent', description: 'Read/watch', reuse: 'low' },
  'intent.inspiration': { value: '🎨', category: 'intent', description: 'Inspiration', reuse: 'low' },
  'intent.explore':     { value: '🔍', category: 'intent', description: 'Explore', reuse: 'low' },
  'intent.discuss':     { value: '🗣️', category: 'intent', description: 'Discuss', reuse: 'low' },
  'intent.do-activity': { value: '🧪', category: 'intent', description: 'Do activity', reuse: 'low' },
  'intent.writing':     { value: '✍️', category: 'intent', description: 'Writing point', reuse: 'low' },
  'intent.memorise':    { value: '🧠', category: 'intent', description: 'Memorise', reuse: 'low' },

  // ── Investigation Types ─────────────────────────────────────
  'investigation.observe':    { value: '🔍', category: 'investigation', description: 'Observe', reuse: 'low' },
  'investigation.test':       { value: '🧪', category: 'investigation', description: 'Test hypothesis', reuse: 'low' },
  'investigation.research':   { value: '📚', category: 'investigation', description: 'Research', reuse: 'low' },
  'investigation.ask-expert': { value: '🗣️', category: 'investigation', description: 'Ask expert', reuse: 'low' },
  'investigation.visit':      { value: '📍', category: 'investigation', description: 'Visit location', reuse: 'low' },
  'investigation.build':      { value: '🔧', category: 'investigation', description: 'Build/make', reuse: 'low' },

  // ── Build Preferences ───────────────────────────────────────
  'preference.outdoors':    { value: '🌿', category: 'preference', description: 'Outdoors preference', reuse: 'low' },
  'preference.art':         { value: '🎨', category: 'preference', description: 'Art/craft preference', reuse: 'low' },
  'preference.books':       { value: '📚', category: 'preference', description: 'Books preference', reuse: 'low' },
  'preference.games':       { value: '🎲', category: 'preference', description: 'Games preference', reuse: 'low' },
  'preference.cooking':     { value: '🧑‍🍳', category: 'preference', description: 'Cooking preference', reuse: 'low' },
  'preference.experiments': { value: '🔬', category: 'preference', description: 'Experiments preference', reuse: 'low' },
  'preference.active':      { value: '🏃', category: 'preference', description: 'Active preference', reuse: 'low' },
  'preference.discussion':  { value: '🗣️', category: 'preference', description: 'Discussion preference', reuse: 'low' },

  // ── Insights ────────────────────────────────────────────────
  'insight.subject-hint': { value: '📐', category: 'insight', description: 'Subject detection hint', reuse: 'low' },
  'insight.thread-hint':  { value: '🌱', category: 'insight', description: 'Capability thread hint', reuse: 'low' },
  'insight.hearth':       { value: '💡', category: 'insight', description: 'Hearth Insights label', reuse: 'low' },
  'insight.sparkle':      { value: '✨', category: 'insight', description: 'AI insight sparkle', reuse: 'low' },

  // ── Our Story Hub ───────────────────────────────────────────
  'story.portfolio': { value: '📁', category: 'story', description: 'Portfolio nav card', reuse: 'low' },
  'story.report':    { value: '📋', category: 'story', description: 'Compliance Report nav card (jurisdiction-titled)', reuse: 'low' },
  'story.learner':   { value: '👤', category: 'story', description: 'Learner Profile nav', reuse: 'low' },

  // ── Landing Page ────────────────────────────────────────────
  'landing.capture':    { value: '📝', category: 'landing', description: 'Capture pillar', reuse: 'low' },
  'landing.content':    { value: '📚', category: 'landing', description: 'Content pillar', reuse: 'low' },
  'landing.compliance': { value: '📋', category: 'landing', description: 'Compliance pillar', reuse: 'low' },
  'landing.new':        { value: '🌱', category: 'landing', description: 'New to homeschooling', reuse: 'low' },
  'landing.existing':   { value: '🔥', category: 'landing', description: 'Already homeschooling', reuse: 'low' },
  'landing.demo':       { value: '🏠', category: 'landing', description: 'Demo section', reuse: 'low' },

  // ── Admin ───────────────────────────────────────────────────
  'admin.api-calls':     { value: '📊', category: 'admin', description: 'API calls metric', reuse: 'low' },
  'admin.input-tokens':  { value: '📥', category: 'admin', description: 'Input tokens metric', reuse: 'low' },
  'admin.output-tokens': { value: '📤', category: 'admin', description: 'Output tokens metric', reuse: 'low' },
  'admin.latency':       { value: '⚡', category: 'admin', description: 'Avg latency metric', reuse: 'low' },

  // ── Project Detail ──────────────────────────────────────────
  'project.duration':   { value: '📅', category: 'project', description: 'Project duration', reuse: 'low' },
  'project.age':        { value: '👤', category: 'project', description: 'Age range', reuse: 'low' },
  'project.artifact':   { value: '📎', category: 'project', description: 'Artifact output', reuse: 'low' },
  'project.dependency': { value: '📋', category: 'project', description: 'Dependency', reuse: 'low' },

  // ── Module Engagement Scale ─────────────────────────────────
  'module-engagement.none':  { value: '😴', category: 'module-engagement', description: 'No engagement', reuse: 'low' },
  'module-engagement.some':  { value: '🙂', category: 'module-engagement', description: 'Some engagement', reuse: 'low' },
  'module-engagement.good':  { value: '😊', category: 'module-engagement', description: 'Good engagement', reuse: 'low' },
  'module-engagement.great': { value: '🌟', category: 'module-engagement', description: 'Great engagement', reuse: 'low' },

  // ── Welcome Wizard ──────────────────────────────────────────
  'welcome.home':         { value: '🏠', category: 'welcome', description: 'Welcome slide', reuse: 'low' },
  'welcome.capture':      { value: '📝', category: 'welcome', description: 'Capture slide', reuse: 'low' },
  'welcome.capabilities': { value: '✨', category: 'welcome', description: 'Capabilities slide', reuse: 'low' },
  'welcome.activities':   { value: '📚', category: 'welcome', description: 'Activities slide', reuse: 'low' },
  'welcome.compliance':   { value: '📋', category: 'welcome', description: 'Compliance slide', reuse: 'low' },
  'welcome.ready':        { value: '🔥', category: 'welcome', description: 'Ready slide', reuse: 'low' },

  // ── Misc ────────────────────────────────────────────────────
  'misc.child-mentioned':   { value: '👦', category: 'misc', description: 'Child mentioned in text', reuse: 'low' },
  'misc.family-fit':        { value: '🎯', category: 'misc', description: 'Family fit callout', reuse: 'low' },
  'misc.library':           { value: '📚', category: 'misc', description: 'My Library button', reuse: 'low' },
  'misc.multiple-learners': { value: '👥', category: 'misc', description: 'Multiple learners indicator', reuse: 'low' },
  'misc.no-patterns':       { value: '📋', category: 'misc', description: 'No patterns yet', reuse: 'low' },
  'misc.no-prebuilt':       { value: '🔮', category: 'misc', description: 'No pre-built ideas', reuse: 'low' },
  'misc.snooze':            { value: '💤', category: 'misc', description: 'Snooze notification', reuse: 'low' },
} as const satisfies Record<string, IconEntry>;

export type IconName = keyof typeof ICON_REGISTRY;

/** Get the emoji string for a registry key. */
export function getIcon(name: IconName): string {
  return ICON_REGISTRY[name].value;
}

/** Get the full entry (value + metadata) for a registry key. */
export function getIconEntry(name: IconName): IconEntry {
  return ICON_REGISTRY[name];
}

/** Get all entries matching a category. */
export function getIconsByCategory(category: IconCategory): Partial<Record<IconName, IconEntry>> {
  const result: Partial<Record<IconName, IconEntry>> = {};
  for (const [key, entry] of Object.entries(ICON_REGISTRY)) {
    if (entry.category === category) {
      result[key as IconName] = entry;
    }
  }
  return result;
}

/**
 * Build a Record<string, string> mapping the key suffix (after the dot)
 * to the emoji value for all entries in a category.
 *
 * Example: buildEmojiMap('subject') => { english: '📚', mathematics: '🔢', ... }
 *
 * This is a drop-in replacement for patterns like DOMAIN_EMOJI, SETTING_EMOJI, etc.
 */
export function buildEmojiMap(category: IconCategory): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(ICON_REGISTRY)) {
    if (entry.category === category) {
      const suffix = key.split('.').slice(1).join('.');
      result[suffix] = entry.value;
    }
  }
  return result;
}
