/**
 * Site copy — code-owned KEYS and fallback VALUES.
 *
 * Every non-generative string a parent reads on a migrated surface lives here,
 * grouped by SURFACE (one Sanity `siteCopy` document per surface). Sanity owns
 * the live VALUE; this file owns the key, the fallback, and the editor note.
 *
 *   - Adding a string: add the key here, run `npm run seed:copy` (non-destructive
 *     — existing Sanity values are kept, new keys are added with their default).
 *   - Swapping wording: edit + publish in Studio → Site Copy. No deploy.
 *   - Removing a string: delete the key here; the next seed drops it from Sanity.
 *
 * Placeholders use `{name}` syntax and are filled by `formatCopy()`. The note
 * tells the editor which placeholders a string supports — keep them in sync.
 *
 * Deliberately NOT here (see docs/hearth-site-copy-system-v1.md §4): nav/IA
 * labels, aria-labels, validation errors, legal pages, pedagogy catalogues,
 * capability descriptors (Sanity-native already) and anything AI-generated.
 */

export type CopyEntryDefault = string | { value: string; note: string };

export type CopySurfaceDefaults = {
  /** Studio title for the surface document. */
  title: string;
  /** One line for editors: where this copy appears. */
  description: string;
  entries: Record<string, CopyEntryDefault>;
};

export const COPY_DEFAULTS = {
  // ───────────────────────────────────────────────────────────────────────────
  landing: {
    title: 'Landing page',
    description: 'The public marketing page at / (signed-out visitors).',
    entries: {
      'nav.tryDemo': 'Try Demo',
      'nav.signIn': 'Sign In',
      'nav.getStarted': 'Get Started',

      'hero.title': 'You’re doing more than you think. Now you can see it.',
      'hero.body':
        'Hearth gives homeschool families the tools that teachers train for years to use — so you can teach with confidence, track what matters, and handle compliance without the stress.',
      'hero.cta': 'Get Started',
      'hero.secondaryCta': 'See How It Works',

      'proof.line': 'Built for Australian homeschool families · All Australian states supported',

      'pillars.capture.title': 'Capture what’s already happening',
      'pillars.capture.body':
        'Log learning after it happens — describe your morning, and Hearth’s AI maps the literacy, numeracy, and science evidence for you. Under two minutes.',
      'pillars.content.title': 'Content shaped by your approach',
      'pillars.content.body':
        'Structured packs designed by educators, filtered through your family’s philosophy. Charlotte Mason, Classical, Montessori — same content, your lens.',
      'pillars.compliance.title': 'Compliance without the stress',
      'pillars.compliance.body':
        'Home education documentation that builds itself. Capability tracking, portfolio evidence, work sample curation. Export when you need it.',

      'how.title': 'Three steps. That’s it.',
      'how.subtitle': 'Logging takes under two minutes. Exporting a report takes one tap.',
      'how.step1.title': 'Log',
      'how.step1.body':
        'Describe what happened today. Hearth spots the learning and maps it to capability threads across eight domains.',
      'how.step2.title': 'Grow',
      'how.step2.body':
        'Watch the Capabilities Constellation fill in: one logged morning of baking shows up as maths, reading, and science at once.',
      'how.step3.title': 'Report',
      'how.step3.body':
        'Export portfolio documentation with one tap. Evidence, curriculum coverage, and work samples — sorted for your state’s requirements.',

      'audience.title': 'Wherever you’re starting from',
      'audience.subtitle':
        'First week or fifth year, you start the same way: log what already happened today.',
      'audience.new.title': 'New to homeschooling?',
      'audience.new.body':
        'You don’t need a teaching degree. Hearth puts real pedagogical frameworks in your hands and walks you through them. Start by logging what you’re already doing — you’ll be surprised how much learning is already happening.',
      'audience.experienced.title': 'Already homeschooling?',
      'audience.experienced.body':
        'Bring your experience. Hearth adds the professional lens, the capability tracking, and the compliance documentation that turns your good work into legible evidence. Build your own modules or explore curated packs.',

      'pricing.title': 'Simple pricing. Everything included.',
      'pricing.subtitle': 'No feature tiers. No content gates. Full access from day one.',
      'pricing.planName': 'Hearth Membership',
      'pricing.amount': { value: '8', note: 'Number only — the currency symbol and suffix are separate keys.' },
      'pricing.amountSuffix': '/month AUD',
      'pricing.includesLine1': 'All content packs · All features · All compliance tools',
      'pricing.includesLine2': 'Unlimited learners · AI-powered insights · Learning report export',
      'pricing.cta': 'Get Started',

      'demo.title': 'Want to explore first?',
      'demo.body':
        'Take a self-guided tour through Hearth with sample data. See the Logger, the Constellation, the compliance tools — no sign-up required.',
      'demo.cta': 'Try the Interactive Demo',

      'footer.tagline': 'Built in Australia · Hosted in Australia',
      'footer.terms': 'Terms',
      'footer.privacy': 'Privacy',
      'footer.contact': 'Contact',
      'footer.copyright': '© 2026 Hearth Learning Pty Ltd',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  auth: {
    title: 'Sign in / Sign up',
    description: 'The Hearth-owned chrome around the Clerk sign-in and sign-up forms (Clerk’s own form text is configured in Clerk, not here).',
    entries: {
      'nav.getStarted': 'Get Started',
      'nav.signIn': 'Sign In',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  welcome: {
    title: 'Welcome wizard',
    description: 'The six-slide tour at /welcome, shown once after sign-up.',
    entries: {
      'slide1.title': 'Welcome to Hearth',
      'slide1.body':
        'You just made one of the most important decisions for your family’s education. This is your home base — let’s show you around.',
      'slide2.title': 'Capture learning as it happens',
      'slide2.body':
        'Had a great morning? Open the Logger, describe what happened, and Hearth handles the rest. AI spots the learning, maps the capabilities, builds the evidence. Under two minutes.',
      'slide3.title': 'See what they’re really learning',
      'slide3.body':
        'Every logged moment feeds the Capabilities Constellation, a living map of your child’s growth across eight domains. An afternoon at the creek shows up as science, observation, and storytelling at once.',
      'slide4.title': 'Activities shaped by your approach',
      'slide4.body':
        'Structured packs, spontaneous modules, and everything in between — all filtered through your family’s educational philosophy. Charlotte Mason, Classical, Montessori, or your own blend.',
      'slide5.title': 'Reporting, handled',
      'slide5.body':
        'Portfolio evidence, capability coverage, work sample curation — Hearth produces the documentation you need. No stress, no last-minute scramble.',
      'slide6.title': 'Set up your family',
      'slide6.body': 'Set up your family profile and add your learners. It takes about two minutes.',

      'action.skip': 'Skip',
      'action.back': 'Back',
      'action.next': 'Next',
      'action.finish': 'Set up my family',
      'action.loading': 'Loading…',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  onboarding: {
    title: 'Onboarding',
    description:
      'The family set-up flow at /onboarding: welcome, family + learners, and the “ready” step. (Step 3, the pedagogy wizard, keeps its catalogue in code.)',
    entries: {
      'step1.title': 'Welcome to Hearth',
      'step1.body':
        'Hearth helps you capture and celebrate your family’s learning journey. No lesson plans required — just honest reflection on the learning that’s already happening.',
      'step1.cta': 'Set up your family',
      'step1.consent.lead': {
        value: 'By continuing, you agree to our',
        note: 'Followed by the Terms link, “and”, the Privacy link, and a full stop.',
      },
      'step1.consent.terms': 'Terms of Service',
      'step1.consent.and': 'and',
      'step1.consent.privacy': 'Privacy Policy',

      'step2.title': 'Your Family',
      'step2.state.label': 'Your State or Territory',
      'step2.state.placeholder': 'Select your state or territory',
      'step2.state.hintDefault':
        'We use this to match your reports to your state’s home-education requirements.',
      'step2.state.hintTailored': {
        value: 'Reports will be tailored for the {regulator} ({regulatorShort}).',
        note: 'Placeholders: {regulator} = full regulatory body name, {regulatorShort} = its abbreviation.',
      },
      'step2.familyName.label': 'Family Name',
      'step2.familyName.optional': '(optional)',
      'step2.familyName.placeholder': 'e.g. Douglas Family',
      'step2.learners.label': 'Your Learners',
      'step2.learner.namePlaceholder': 'Child’s name',
      'step2.learner.remove': 'Remove',
      'step2.learner.colour': 'Colour',
      'step2.learner.shape': 'Shape',
      'step2.addChild': '+ Add a child',
      'step2.nextHint': 'Next: a few questions about your educational approach. About three minutes.',
      'step2.continue': 'Continue',
      'step2.saving': 'Saving...',

      'step4.title': 'Your Hearth is ready',
      'step4.body':
        'Think of something your family learned recently — even yesterday’s bedtime story counts.',
      'step4.logNow': 'Log something now',
      'step4.exploreFirst': 'Explore first',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  dashboard: {
    title: 'Dashboard',
    description:
      'The signed-in home at /dashboard: time-of-day greeting, empty states, section labels and the pedagogy prompt card.',
    entries: {
      // Greeting headings. {name} = family display name, wrapped in <strong> by the app.
      'greeting.evening.logged': {
        value: 'A gentle close to the day, {name}.',
        note: '{name} = family display name (rendered in ember).',
      },
      'greeting.evening.quiet': { value: 'Good evening, {name}.', note: '{name} = family display name.' },
      'greeting.morning': { value: 'Good morning, {name}.', note: '{name} = family display name.' },
      'greeting.afternoon': { value: 'Good afternoon, {name}.', note: '{name} = family display name.' },

      // Greeting messages.
      'message.evening.loggedNamed': {
        value: 'Today brought {count} logged {moments} for {names}{subjects}. A good day’s learning.',
        note: '{count} number, {moments} = moment/moments, {names} = learner names, {subjects} = “ covering maths and science” or empty.',
      },
      'message.evening.logged': {
        value: 'Today brought {count} logged {moments} of learning{subjects}. The {name}’s hearth has been busy.',
        note: '{count}, {moments}, {subjects}, {name} = family display name.',
      },
      'message.evening.quiet': 'Quiet day. That’s okay — every day counts. What did you notice today?',
      'message.morning.plannedNamed': {
        value: '{count} {sessions} planned for {names} today{subjects}. What will the day bring?',
        note: '{count}, {sessions} = session/sessions, {names}, {subjects}.',
      },
      'message.morning.planned': {
        value: 'You have {count} {sessions} planned{subjects}. What will the day bring?',
        note: '{count}, {sessions}, {subjects}.',
      },
      'message.morning.openNamed': {
        value: 'Ready to learn with {names} today. What will today look like?',
        note: '{names} = learner names.',
      },
      'message.morning.open': 'What will today’s learning look like?',
      'message.afternoon.nothingNamed': {
        value: 'Nothing logged for {names} yet — capture what you’ve been up to.',
        note: '{names} = learner names.',
      },
      'message.afternoon.nothing': 'Nothing logged yet today — capture what you’ve been up to.',
      'message.afternoon.loggedNamed': {
        value: '{count} {sessions} logged for {names} today{subjects}. Keep it up!',
        note: '{count}, {sessions}, {names}, {subjects}.',
      },
      'message.afternoon.logged': {
        value: '{count} {sessions} logged today{subjects}. Keep it up!',
        note: '{count}, {sessions}, {subjects}.',
      },
      'message.subjectsPrefix': {
        value: ' covering {list}',
        note: 'Fills {subjects} above. Leading space is deliberate. {list} = up to two subjects joined by “and”.',
      },
      'unit.moment.one': 'moment',
      'unit.moment.many': 'moments',
      'unit.session.one': 'session',
      'unit.session.many': 'sessions',
      'names.pair': { value: '{a} and {b}', note: 'Two learners: {a} and {b} are their first names.' },
      'names.more': { value: '{a}, {b} and {n} more', note: 'Three or more learners: {a}, {b} = first two names, {n} = how many more.' },

      // Empty states.
      'empty.noChildren.title': 'Welcome to Hearth',
      'empty.noChildren.body': 'Who’s learning at your hearth? Add them to begin.',
      'empty.noChildren.cta': 'Add your first learner',
      'empty.noEntries.title': 'Your hearth is ready',
      'empty.noEntries.body':
        'Start by logging something that happened today — even five minutes of play counts.',
      'empty.noEntries.cta': 'Log a moment',
      'empty.inactive.body':
        'It’s been a few days. Learning has been happening. Capture some of it when you’re ready.',

      // Time-of-day section labels.
      'section.morning.title': 'TODAY’S SHAPE',
      'section.morning.subtitle': 'Plan your day',
      'section.afternoon.title': 'HAPPENING NOW',
      'section.afternoon.subtitle': 'Sessions in progress',
      'section.evening.title': 'TODAY’S MOMENTS',
      'section.evening.subtitle': 'How did it go?',

      // Sidebar.
      'insight.attribution': '— Pedagogical Insight',
      'week.title': 'This Week',
      'week.momentsLogged': 'Moments logged',
      'week.collaborative': 'Collaborative activities',
      'week.newCapabilities': 'New capabilities',
      'week.evidence': 'Evidence collected',
      'week.evidenceUnit': { value: '{count} items', note: '{count} = number of evidence items.' },
      'gentlePrompt.suffix': {
        value: '{text} — “{module}” could be a gentle next step.',
        note: '{text} = the generated prompt sentence, {module} = suggested module title.',
      },
      'gentlePrompt.cta': 'See suggestions',

      // Pedagogy prompt card (one prompt + tip per approach; eclectic shows none).
      'pedagogy.charlotte_mason.prompt': 'What living ideas captured attention today?',
      'pedagogy.charlotte_mason.tip':
        'Look for narration moments — when your child retells in their own words, learning is taking root.',
      'pedagogy.classical.prompt': 'What was practised or memorised today?',
      'pedagogy.classical.tip':
        'The grammar stage thrives on repetition and chanting. Even small daily drills compound over time.',
      'pedagogy.montessori.prompt': 'What did the child choose to work on?',
      'pedagogy.montessori.tip':
        'Notice periods of deep concentration — these are signs the prepared environment is working.',
      'pedagogy.waldorf_steiner.prompt': 'What stories or art shaped today’s learning?',
      'pedagogy.waldorf_steiner.tip':
        'Rhythm and beauty support the whole child. Trust the seasonal pace of the main lesson.',
      'pedagogy.unschooling.prompt': 'What sparked curiosity today?',
      'pedagogy.unschooling.tip':
        'Interest-led doesn’t mean unintentional. Notice the threads your child keeps returning to.',
    },
  },
} as const satisfies Record<string, CopySurfaceDefaults>;

export type CopySurface = keyof typeof COPY_DEFAULTS;
export type CopyKey<S extends CopySurface> = keyof (typeof COPY_DEFAULTS)[S]['entries'] & string;
/** The resolved, flat string map a component reads. */
export type CopyBundle<S extends CopySurface> = Readonly<Record<CopyKey<S>, string>>;

export const COPY_SURFACES = Object.keys(COPY_DEFAULTS) as CopySurface[];

export function defaultValue(entry: CopyEntryDefault): string {
  return typeof entry === 'string' ? entry : entry.value;
}

export function defaultNote(entry: CopyEntryDefault): string | undefined {
  return typeof entry === 'string' ? undefined : entry.note;
}

/** Deterministic Sanity `_id` for a surface. Hyphen, not dot — see siteCopy schema. */
export function siteCopyDocId(surface: CopySurface): string {
  return `siteCopy-${surface}`;
}
