/**
 * Hearth Constellation Content — Lo-Fi v1
 *
 * Expansive low-fidelity developmental milestone data for the capability
 * constellation. Generated 13 May 2026 from the v1 thread archive plus
 * spec-aligned lo-fi extrapolation per domain.
 *
 * Aligned with: hearth-capability-universe-v2-architecture-spec-v1.md
 *   - 4 stage-bands per thread per spec D4 (foundational/intermediate/advanced/tertiary)
 *   - Pedagogy-neutral content per D1
 *   - No regulatory framework mappings — those attach at atomic level per §7,
 *     and HEU compliance is a separate layer entirely
 *   - Tier vocabulary (emerging/developing/demonstrating) preserved for v1
 *     backward-compatible consumption alongside the v2 stage-band structure
 *
 * Scope: STEM and standard subjects.
 * In scope: 11 of 15 v2 domains.
 *   Foundations (1–4), Cultural Inheritance (5–6), Aesthetic Expression (10–11),
 *   Human Formation (13–15).
 * Out of scope: Classical Languages (D7), Theology (D9), Practical Mastery (D12).
 * Dropped threads: H6 First Nations Australian Perspectives (per migration
 *   table — pending consultant review), PS5 Environmental Stewardship.
 *
 * Quality: lo-fi by design. Each milestone is one observable behaviour
 * statement of 15–30 words. Tier-2 of foundational/intermediate/advanced
 * uses v1 DLO text verbatim. Tier-1 and Tier-3 are short standalone
 * statements derived from the band's developmental role. Tertiary band is
 * extrapolated using per-domain patterns. Suitable for lighting the
 * constellation with real content; not suitable for final publication.
 *
 * Counts:
 *   - 11 domains
 *   - 55 threads
 *   - 4 stage-bands per thread
 *   - 3 milestones per stage-band
 *   - 660 milestones total
 *   - 165 v1-legacy DLO equivalents preserved (55 threads × 3 tiers)
 *
 * Consumption: import THREADS and DOMAIN_INDEX as data sources for
 *   - scripts/seed-dlos.ts (use v1LegacyTiers for the 3-tier flat schema), or
 *   - direct replacement of dlo-descriptors.ts fallback, or
 *   - future v2 atomic-indicator authoring (each milestone → AtomicIndicator)
 */

export type StageBand = 'foundational' | 'intermediate' | 'advanced' | 'tertiary';

export interface Milestone {
  /** 1, 2, or 3 within the stage-band — ordered earliest-to-latest. */
  tier: 1 | 2 | 3;
  /** Single observable behaviour statement. */
  text: string;
}

export interface ThreadContent {
  legacyV1Id: string;
  title: string;
  domainKey: string;
  summary: string;
  stageBands: Record<StageBand, Milestone[]>;
  /** v1 3-tier collapse for legacy seed-dlos.ts consumption. */
  v1LegacyTiers: { emerging: string; developing: string; demonstrating: string };
}

export interface DomainIndexEntry {
  key: string;
  name: string;
  threadIds: string[];
}

export const DOMAIN_INDEX: DomainIndexEntry[] = [
  {
    key: 'languageLiteracy',
    name: `Language & Literacy`,
    threadIds: ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8"],
  },
  {
    key: 'mathematicalThinking',
    name: `Mathematical Thinking`,
    threadIds: ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9"],
  },
  {
    key: 'scientificThinking',
    name: `Scientific Thinking`,
    threadIds: ["S1", "S2", "S3", "S4", "S5", "S6"],
  },
  {
    key: 'technologicalFluency',
    name: `Technological Fluency`,
    threadIds: ["PS7", "C6", "C7"],
  },
  {
    key: 'historicalCivicGeographic',
    name: `Historical, Civic & Geographic Understanding`,
    threadIds: ["H1", "H2", "H3", "H4", "H5"],
  },
  {
    key: 'literaryTradition',
    name: `Literary & Narrative Tradition`,
    threadIds: ["L9", "C1"],
  },
  {
    key: 'visualPlasticArts',
    name: `Visual & Plastic Arts`,
    threadIds: ["C5"],
  },
  {
    key: 'musicalPerformative',
    name: `Musical & Performative Arts`,
    threadIds: ["C2", "C3", "C4"],
  },
  {
    key: 'personalEthical',
    name: `Personal & Ethical Formation`,
    threadIds: ["PS3", "PS4", "PS6", "EF1", "EF2", "EF3", "EF4", "EF5", "EF7", "EF8"],
  },
  {
    key: 'socialRelational',
    name: `Social & Relational Formation`,
    threadIds: ["PS1", "PS2", "EF6"],
  },
  {
    key: 'physicalEmbodied',
    name: `Physical & Embodied Capability`,
    threadIds: ["P1", "P2", "P3", "P4", "P5"],
  },
];

export const THREADS: ThreadContent[] = [
  {
    legacyV1Id: 'L1',
    title: `Oral Communication & Listening`,
    domainKey: 'languageLiteracy',
    summary: `The child can listen actively, respond meaningfully in conversation, share ideas clearly, and adapt their communication to different situations and audiences.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about oral communication and listening; engages briefly with adult support.` },
        { tier: 2, text: `Responds with a relevant word or phrase. Takes turns with prompting. Follows simple one-two step instructions.` },
        { tier: 3, text: `Holds attention on oral communication and listening for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with oral communication and listening reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Initiates conversation about experiences without prompting. Asks clarifying questions. Retells events in sequence. Adjusts volume/tone for different settings.` },
        { tier: 3, text: `Applies oral communication and listening to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with oral communication and listening confidently across most contexts encountered.` },
        { tier: 2, text: `Presents ideas to groups with confidence. Adapts language for different audiences. Sustains conversation by building on what others say. Uses specific vocabulary from learning contexts.` },
        { tier: 3, text: `Brings oral communication and listening to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Uses oral communication and listening with deliberate purpose, choosing register and structure for audience and effect.` },
        { tier: 2, text: `Refines oral communication and listening through metacognitive review of own work, revising independently.` },
        { tier: 3, text: `Engages oral communication and listening as a craft tradition, drawing on conventions and exemplars.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Responds with a relevant word or phrase. Takes turns with prompting. Follows simple one-two step instructions.`,
      developing: `Initiates conversation about experiences without prompting. Asks clarifying questions. Retells events in sequence. Adjusts volume/tone for different settings.`,
      demonstrating: `Presents ideas to groups with confidence. Adapts language for different audiences. Sustains conversation by building on what others say. Uses specific vocabulary from learning contexts.`,
    },
  },
  {
    legacyV1Id: 'L2',
    title: `Phonological Awareness & Decoding`,
    domainKey: 'languageLiteracy',
    summary: `The child understands that spoken words are made up of sounds, can manipulate those sounds, and uses this knowledge to decode (read) and encode (spell) words.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about phonological awareness and decoding; engages briefly with adult support.` },
        { tier: 2, text: `Recognises rhyming words in songs. Claps syllables. Identifies first sound in words. Recognises some letters by name.` },
        { tier: 3, text: `Holds attention on phonological awareness and decoding for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with phonological awareness and decoding reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Blends 2-3 phonemes to read CVC words. Segments words into sounds. Matches letters to sounds. Reads familiar high-frequency words. Self-corrects when decoded word does not make sense.` },
        { tier: 3, text: `Applies phonological awareness and decoding to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with phonological awareness and decoding confidently across most contexts encountered.` },
        { tier: 2, text: `Reads unfamiliar words by applying phonics fluently. Handles consonant blends, digraphs, vowel patterns. Reads with phrasing and expression. Recognises and reads multisyllabic words.` },
        { tier: 3, text: `Brings phonological awareness and decoding to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Uses phonological awareness and decoding with deliberate purpose, choosing register and structure for audience and effect.` },
        { tier: 2, text: `Refines phonological awareness and decoding through metacognitive review of own work, revising independently.` },
        { tier: 3, text: `Engages phonological awareness and decoding as a craft tradition, drawing on conventions and exemplars.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Recognises rhyming words in songs. Claps syllables. Identifies first sound in words. Recognises some letters by name.`,
      developing: `Blends 2-3 phonemes to read CVC words. Segments words into sounds. Matches letters to sounds. Reads familiar high-frequency words. Self-corrects when decoded word does not make sense.`,
      demonstrating: `Reads unfamiliar words by applying phonics fluently. Handles consonant blends, digraphs, vowel patterns. Reads with phrasing and expression. Recognises and reads multisyllabic words.`,
    },
  },
  {
    legacyV1Id: 'L3',
    title: `Reading Comprehension`,
    domainKey: 'languageLiteracy',
    summary: `The child makes meaning from texts — understanding what is stated explicitly, making inferences, connecting ideas across a text, and bringing their own experience to interpretation.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about reading comprehension; engages briefly with adult support.` },
        { tier: 2, text: `Points to pictures that match text. Answers "what happened?" questions. Makes connections to personal experience. Identifies main characters.` },
        { tier: 3, text: `Holds attention on reading comprehension for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with reading comprehension reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Predicts what happens next based on clues. Retells story including beginning, middle, end. Identifies main idea in informational text. Makes simple inferences. Asks questions about unfamiliar words.` },
        { tier: 3, text: `Applies reading comprehension to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with reading comprehension confidently across most contexts encountered.` },
        { tier: 2, text: `Compares ideas across multiple texts. Identifies author purpose or perspective. Distinguishes fact from opinion. Uses evidence to support interpretation. Monitors own comprehension and uses strategies when meaning breaks down.` },
        { tier: 3, text: `Brings reading comprehension to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Uses reading comprehension with deliberate purpose, choosing register and structure for audience and effect.` },
        { tier: 2, text: `Refines reading comprehension through metacognitive review of own work, revising independently.` },
        { tier: 3, text: `Engages reading comprehension as a craft tradition, drawing on conventions and exemplars.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Points to pictures that match text. Answers "what happened?" questions. Makes connections to personal experience. Identifies main characters.`,
      developing: `Predicts what happens next based on clues. Retells story including beginning, middle, end. Identifies main idea in informational text. Makes simple inferences. Asks questions about unfamiliar words.`,
      demonstrating: `Compares ideas across multiple texts. Identifies author purpose or perspective. Distinguishes fact from opinion. Uses evidence to support interpretation. Monitors own comprehension and uses strategies when meaning breaks down.`,
    },
  },
  {
    legacyV1Id: 'L4',
    title: `Spelling & Word Knowledge`,
    domainKey: 'languageLiteracy',
    summary: `The child understands how English words are structured — morphemes, etymology, spelling patterns — and applies this knowledge when writing.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about spelling and word knowledge; engages briefly with adult support.` },
        { tier: 2, text: `Represents sounds in words with plausible letter choices (invented spelling). Spells some high-frequency words. Recognises when word "doesn't look right".` },
        { tier: 3, text: `Holds attention on spelling and word knowledge for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with spelling and word knowledge reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Applies common spelling patterns consistently. Uses word families to spell related words. Spells most high-frequency words correctly. Begins to use morphemic knowledge (adding -ed, -ing, -s). Uses references to check.` },
        { tier: 3, text: `Applies spelling and word knowledge to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with spelling and word knowledge confidently across most contexts encountered.` },
        { tier: 2, text: `Applies prefixes, suffixes, and root words. Spells words with complex patterns. Self-edits for spelling. Uses etymological knowledge. Demonstrates precise word choice in writing.` },
        { tier: 3, text: `Brings spelling and word knowledge to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Uses spelling and word knowledge with deliberate purpose, choosing register and structure for audience and effect.` },
        { tier: 2, text: `Refines spelling and word knowledge through metacognitive review of own work, revising independently.` },
        { tier: 3, text: `Engages spelling and word knowledge as a craft tradition, drawing on conventions and exemplars.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Represents sounds in words with plausible letter choices (invented spelling). Spells some high-frequency words. Recognises when word "doesn't look right".`,
      developing: `Applies common spelling patterns consistently. Uses word families to spell related words. Spells most high-frequency words correctly. Begins to use morphemic knowledge (adding -ed, -ing, -s). Uses references to check spelling.`,
      demonstrating: `Applies prefixes, suffixes, and root words. Spells words with complex patterns. Self-edits for spelling. Uses etymological knowledge. Demonstrates precise word choice in writing.`,
    },
  },
  {
    legacyV1Id: 'L5',
    title: `Written Expression`,
    domainKey: 'languageLiteracy',
    summary: `The child communicates ideas, experiences, and arguments in writing with increasing control over structure, voice, and audience awareness.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about written expression; engages briefly with adult support.` },
        { tier: 2, text: `Dictates ideas for an adult to write down. Writes or draws to convey simple message. Attempts sentences with capitals and full stops. Labels pictures or diagrams.` },
        { tier: 3, text: `Holds attention on written expression for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with written expression reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Writes multiple connected sentences on topic. Includes beginning, middle, end. Uses descriptive language (adjectives, simple adverbs). Writes for different purposes when prompted. Re-reads and makes simple changes.` },
        { tier: 3, text: `Applies written expression to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with written expression confidently across most contexts encountered.` },
        { tier: 2, text: `Plans before writing using notes, diagrams, or outlines. Writes sustained texts with clear structure and paragraphing. Varies sentence length and type for effect. Shows audience awareness. Edits and revises for.` },
        { tier: 3, text: `Brings written expression to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Uses written expression with deliberate purpose, choosing register and structure for audience and effect.` },
        { tier: 2, text: `Refines written expression through metacognitive review of own work, revising independently.` },
        { tier: 3, text: `Engages written expression as a craft tradition, drawing on conventions and exemplars.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Dictates ideas for an adult to write down. Writes or draws to convey simple message. Attempts sentences with capitals and full stops. Labels pictures or diagrams.`,
      developing: `Writes multiple connected sentences on topic. Includes beginning, middle, end. Uses descriptive language (adjectives, simple adverbs). Writes for different purposes when prompted. Re-reads and makes simple changes.`,
      demonstrating: `Plans before writing using notes, diagrams, or outlines. Writes sustained texts with clear structure and paragraphing. Varies sentence length and type for effect. Shows audience awareness. Edits and revises for clarity.`,
    },
  },
  {
    legacyV1Id: 'L6',
    title: `Handwriting & Text Production`,
    domainKey: 'languageLiteracy',
    summary: `The child produces legible written text — whether through handwriting, typing, or other tools — with increasing fluency and automaticity.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about handwriting and text production; engages briefly with adult support.` },
        { tier: 2, text: `Holds writing tool with functional grip. Forms recognisable letters (may be inconsistent). Writes own name. Distinguishes between drawing and writing.` },
        { tier: 3, text: `Holds attention on handwriting and text production for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with handwriting and text production reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Forms most letters correctly with consistent size. Writes on lines with appropriate spacing. Produces legible text others can read. Writes with sufficient fluency that ideas aren't lost. Begins to use.` },
        { tier: 3, text: `Applies handwriting and text production to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with handwriting and text production confidently across most contexts encountered.` },
        { tier: 2, text: `Produces text fluently in chosen mode (handwriting or typing). Writing tool no longer limits complexity or length of expression. Adapts presentation for purpose. Uses digital tools for text production when.` },
        { tier: 3, text: `Brings handwriting and text production to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Uses handwriting and text production with deliberate purpose, choosing register and structure for audience and effect.` },
        { tier: 2, text: `Refines handwriting and text production through metacognitive review of own work, revising independently.` },
        { tier: 3, text: `Engages handwriting and text production as a craft tradition, drawing on conventions and exemplars.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Holds writing tool with functional grip. Forms recognisable letters (may be inconsistent). Writes own name. Distinguishes between drawing and writing.`,
      developing: `Forms most letters correctly with consistent size. Writes on lines with appropriate spacing. Produces legible text others can read. Writes with sufficient fluency that ideas aren't lost. Begins to use joined/cursive writing or efficient keyboard.`,
      demonstrating: `Produces text fluently in chosen mode (handwriting or typing). Writing tool no longer limits complexity or length of expression. Adapts presentation for purpose. Uses digital tools for text production when appropriate.`,
    },
  },
  {
    legacyV1Id: 'L7',
    title: `Text Structure & Purpose`,
    domainKey: 'languageLiteracy',
    summary: `The child understands that different text types are structured differently depending on their purpose, and can both recognise and use these structures.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about text structure and purpose; engages briefly with adult support.` },
        { tier: 2, text: `Recognises difference between story and information text. Identifies basic text features (title, pictures, page numbers). Understands texts are written for different reasons.` },
        { tier: 3, text: `Holds attention on text structure and purpose for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with text structure and purpose reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Names and recognises common text types (narrative, procedure, report). Uses appropriate structure when writing familiar text type. Identifies text features (headings, captions, diagrams). Understands purpose of contents pages and glossaries.` },
        { tier: 3, text: `Applies text structure and purpose to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with text structure and purpose confidently across most contexts encountered.` },
        { tier: 2, text: `Explains how structure supports author purpose. Chooses appropriate text type for given need. Analyses how language features differ across text types. Creates texts combining or adapting structures for effect. Evaluates.` },
        { tier: 3, text: `Brings text structure and purpose to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Uses text structure and purpose with deliberate purpose, choosing register and structure for audience and effect.` },
        { tier: 2, text: `Refines text structure and purpose through metacognitive review of own work, revising independently.` },
        { tier: 3, text: `Engages text structure and purpose as a craft tradition, drawing on conventions and exemplars.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Recognises difference between story and information text. Identifies basic text features (title, pictures, page numbers). Understands texts are written for different reasons.`,
      developing: `Names and recognises common text types (narrative, procedure, report). Uses appropriate structure when writing familiar text type. Identifies text features (headings, captions, diagrams). Understands purpose of contents pages and glossaries.`,
      demonstrating: `Explains how structure supports author purpose. Chooses appropriate text type for given need. Analyses how language features differ across text types. Creates texts combining or adapting structures for effect. Evaluates whether structure serves purpose.`,
    },
  },
  {
    legacyV1Id: 'L8',
    title: `Persuasion & Argument`,
    domainKey: 'languageLiteracy',
    summary: `The child can construct and evaluate arguments — identifying claims, supporting evidence, and rhetorical strategies in others' texts and their own.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about persuasion and argument; engages briefly with adult support.` },
        { tier: 2, text: `Expresses preference with simple reason ("I think cats are better because they're soft"). Recognises when someone is trying to convince them. Understands people can have different opinions.` },
        { tier: 3, text: `Holds attention on persuasion and argument for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with persuasion and argument reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Gives multiple reasons to support opinion. Identifies persuasive techniques in advertisements. Writes simple persuasive text with clear position and reasons. Considers counter-argument when prompted.` },
        { tier: 3, text: `Applies persuasion and argument to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with persuasion and argument confidently across most contexts encountered.` },
        { tier: 2, text: `Constructs sustained arguments with evidence and reasoning. Evaluates strength of evidence. Identifies bias, emotive language, rhetorical strategies. Acknowledges counter-arguments and addresses them. Distinguishes fact, opinion, reasoned judgment.` },
        { tier: 3, text: `Brings persuasion and argument to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Uses persuasion and argument with deliberate purpose, choosing register and structure for audience and effect.` },
        { tier: 2, text: `Refines persuasion and argument through metacognitive review of own work, revising independently.` },
        { tier: 3, text: `Engages persuasion and argument as a craft tradition, drawing on conventions and exemplars.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Expresses preference with simple reason ("I think cats are better because they're soft"). Recognises when someone is trying to convince them. Understands people can have different opinions.`,
      developing: `Gives multiple reasons to support opinion. Identifies persuasive techniques in advertisements. Writes simple persuasive text with clear position and reasons. Considers counter-argument when prompted.`,
      demonstrating: `Constructs sustained arguments with evidence and reasoning. Evaluates strength of evidence. Identifies bias, emotive language, rhetorical strategies. Acknowledges counter-arguments and addresses them. Distinguishes fact, opinion, reasoned judgment.`,
    },
  },
  {
    legacyV1Id: 'L9',
    title: `Literary Response & Appreciation`,
    domainKey: 'literaryTradition',
    summary: `The child engages with literature — responding personally, aesthetically, and critically to stories, poems, and other literary forms.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about literary response and appreciation; engages briefly with adult support.` },
        { tier: 2, text: `Shows enjoyment of stories being read aloud. Has favourite books, characters, or story types. Responds with personal reaction. Recognises story elements (character, setting, problem).` },
        { tier: 3, text: `Holds attention on literary response and appreciation for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with literary response and appreciation reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Explains why they like or dislike text with reference to specific parts. Identifies with characters and discusses motivations. Recognises literary devices when pointed out. Compares texts by same author or.` },
        { tier: 3, text: `Applies literary response and appreciation to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with literary response and appreciation confidently across most contexts encountered.` },
        { tier: 2, text: `Discusses themes and ideas across multiple texts. Analyses how authors create effect through language choices. Responds to literature with personal interpretation and evidence. Appreciates literary forms and conventions. Evaluates how.` },
        { tier: 3, text: `Brings literary response and appreciation to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Reads and interprets literary response and appreciation with attention to form, tradition, texture of language.` },
        { tier: 2, text: `Situates works of literary response and appreciation within longer traditions; recognises influence and convention.` },
        { tier: 3, text: `Articulates considered judgments on literary response and appreciation, supporting claims from the text.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Shows enjoyment of stories being read aloud. Has favourite books, characters, or story types. Responds with personal reaction. Recognises story elements (character, setting, problem).`,
      developing: `Explains why they like or dislike text with reference to specific parts. Identifies with characters and discusses motivations. Recognises literary devices when pointed out. Compares texts by same author or on same topic. Recommends books.`,
      demonstrating: `Discusses themes and ideas across multiple texts. Analyses how authors create effect through language choices. Responds to literature with personal interpretation and evidence. Appreciates literary forms and conventions. Evaluates how texts reflect different cultural or.`,
    },
  },
  {
    legacyV1Id: 'M1',
    title: `Number Sense & Place Value`,
    domainKey: 'mathematicalThinking',
    summary: `The child has an intuitive understanding of quantity, can compose and decompose numbers, understands the structure of our number system, and can work flexibly with numbers.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about number sense and place value; engages briefly with adult support.` },
        { tier: 2, text: `Counts objects with one-to-one correspondence. Recognises last number counted tells "how many". Compares two groups (more/fewer). Recognises numerals. Understands numbers come in fixed order.` },
        { tier: 3, text: `Holds attention on number sense and place value for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with number sense and place value reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Counts forwards and backwards from any starting point. Uses skip counting (2s, 5s, 10s) purposefully. Understands tens and ones (24 = 2 tens + 4 ones). Orders numbers on number.` },
        { tier: 3, text: `Applies number sense and place value to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with number sense and place value confidently across most contexts encountered.` },
        { tier: 2, text: `Composes and decomposes numbers flexibly (38 = 30+8 = 20+18). Understands place value across hundreds, thousands. Compares and orders large numbers. Rounds appropriately. Applies number sense to check reasonableness.` },
        { tier: 3, text: `Brings number sense and place value to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Reasons abstractly about number sense and place value, generalising patterns into formal representations.` },
        { tier: 2, text: `Constructs justifications for claims involving number sense and place value; evaluates others' reasoning.` },
        { tier: 3, text: `Applies number sense and place value to model real-world systems, refining models against data.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Counts objects with one-to-one correspondence. Recognises last number counted tells "how many". Compares two groups (more/fewer). Recognises numerals. Understands numbers come in fixed order.`,
      developing: `Counts forwards and backwards from any starting point. Uses skip counting (2s, 5s, 10s) purposefully. Understands tens and ones (24 = 2 tens + 4 ones). Orders numbers on number line. Estimates quantities.`,
      demonstrating: `Composes and decomposes numbers flexibly (38 = 30+8 = 20+18). Understands place value across hundreds, thousands. Compares and orders large numbers. Rounds appropriately. Applies number sense to check reasonableness.`,
    },
  },
  {
    legacyV1Id: 'M2',
    title: `Operations & Computation`,
    domainKey: 'mathematicalThinking',
    summary: `The child understands the four operations (addition, subtraction, multiplication, division), their relationships to each other, and can compute fluently using a range of strategies.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about operations and computation; engages briefly with adult support.` },
        { tier: 2, text: `Combines two groups and counts total. Removes objects and counts remainder. Uses concrete materials for addition/subtraction. Recognises "putting together" and "taking away". Shares equally between two people.` },
        { tier: 3, text: `Holds attention on operations and computation for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with operations and computation reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Uses mental strategies (counting on, doubles, making 10). Recalls basic addition and subtraction facts. Understands multiplication as repeated groups. Uses arrays, skip counting for multiplication. Recognises inverse relationship.` },
        { tier: 3, text: `Applies operations and computation to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with operations and computation confidently across most contexts encountered.` },
        { tier: 2, text: `Computes fluently with all four operations using efficient strategies. Knows multiplication facts and uses them for division. Applies operations to multi-step problems. Estimates before computing. Selects most efficient strategy.` },
        { tier: 3, text: `Brings operations and computation to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Reasons abstractly about operations and computation, generalising patterns into formal representations.` },
        { tier: 2, text: `Constructs justifications for claims involving operations and computation; evaluates others' reasoning.` },
        { tier: 3, text: `Applies operations and computation to model real-world systems, refining models against data.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Combines two groups and counts total. Removes objects and counts remainder. Uses concrete materials for addition/subtraction. Recognises "putting together" and "taking away". Shares equally between two people.`,
      developing: `Uses mental strategies (counting on, doubles, making 10). Recalls basic addition and subtraction facts. Understands multiplication as repeated groups. Uses arrays, skip counting for multiplication. Recognises inverse relationship.`,
      demonstrating: `Computes fluently with all four operations using efficient strategies. Knows multiplication facts and uses them for division. Applies operations to multi-step problems. Estimates before computing. Selects most efficient strategy.`,
    },
  },
  {
    legacyV1Id: 'M3',
    title: `Fractional Thinking`,
    domainKey: 'mathematicalThinking',
    summary: `The child understands parts and wholes — fractions, decimals, and percentages as different representations of the same idea, and can operate with them in practical contexts.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about fractional thinking; engages briefly with adult support.` },
        { tier: 2, text: `Understands "half" as splitting into two equal parts. Identifies whether share is fair. Recognises halves and quarters in everyday contexts. Uses language of parts.` },
        { tier: 3, text: `Holds attention on fractional thinking for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with fractional thinking reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Names and recognises common unit fractions (½, ⅓, ¼, ⅕). Understands fractions represent equal parts. Locates simple fractions on number line. Compares and orders unit fractions. Connects fractions to division.` },
        { tier: 3, text: `Applies fractional thinking to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with fractional thinking confidently across most contexts encountered.` },
        { tier: 2, text: `Adds and subtracts fractions with related denominators. Connects fractions, decimals, percentages. Uses fractions in measurement and data contexts. Compares and orders different denominators.` },
        { tier: 3, text: `Brings fractional thinking to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Reasons abstractly about fractional thinking, generalising patterns into formal representations.` },
        { tier: 2, text: `Constructs justifications for claims involving fractional thinking; evaluates others' reasoning.` },
        { tier: 3, text: `Applies fractional thinking to model real-world systems, refining models against data.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Understands "half" as splitting into two equal parts. Identifies whether share is fair. Recognises halves and quarters in everyday contexts. Uses language of parts.`,
      developing: `Names and recognises common unit fractions (½, ⅓, ¼, ⅕). Understands fractions represent equal parts. Locates simple fractions on number line. Compares and orders unit fractions. Connects fractions to division.`,
      demonstrating: `Adds and subtracts fractions with related denominators. Connects fractions, decimals, percentages. Uses fractions in measurement and data contexts. Compares and orders different denominators.`,
    },
  },
  {
    legacyV1Id: 'M4',
    title: `Algebraic Thinking & Patterns`,
    domainKey: 'mathematicalThinking',
    summary: `The child recognises, describes, and extends patterns; understands the concept of equality and uses symbols to represent unknown quantities; thinks about relationships between quantities.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about algebraic thinking and patterns; engages briefly with adult support.` },
        { tier: 2, text: `Copies simple repeating pattern. Identifies what comes next. Sorts objects by one attribute. Recognises patterns in daily routines.` },
        { tier: 3, text: `Holds attention on algebraic thinking and patterns for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with algebraic thinking and patterns reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Creates own patterns using multiple attributes. Identifies and describes growing patterns (1, 3, 5, 7). Understands equals sign as "is the same as". Finds missing numbers in equations. Describes rule.` },
        { tier: 3, text: `Applies algebraic thinking and patterns to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with algebraic thinking and patterns confidently across most contexts encountered.` },
        { tier: 2, text: `Generates complex patterns and describes rule. Uses symbols or letters for unknowns. Understands and applies order of operations. Creates algorithms to solve problems. Identifies functional relationships.` },
        { tier: 3, text: `Brings algebraic thinking and patterns to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Reasons abstractly about algebraic thinking and patterns, generalising patterns into formal representations.` },
        { tier: 2, text: `Constructs justifications for claims involving algebraic thinking and patterns; evaluates others' reasoning.` },
        { tier: 3, text: `Applies algebraic thinking and patterns to model real-world systems, refining models against data.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Copies simple repeating pattern. Identifies what comes next. Sorts objects by one attribute. Recognises patterns in daily routines.`,
      developing: `Creates own patterns using multiple attributes. Identifies and describes growing patterns (1, 3, 5, 7). Understands equals sign as "is the same as". Finds missing numbers in equations. Describes rule for pattern.`,
      demonstrating: `Generates complex patterns and describes rule. Uses symbols or letters for unknowns. Understands and applies order of operations. Creates algorithms to solve problems. Identifies functional relationships.`,
    },
  },
  {
    legacyV1Id: 'M5',
    title: `Measurement Sense`,
    domainKey: 'mathematicalThinking',
    summary: `The child understands measurable attributes (length, mass, capacity, time, temperature), can compare and quantify them using informal and formal units, and applies measurement in practical contexts.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about measurement sense; engages briefly with adult support.` },
        { tier: 2, text: `Compares two objects directly (longer/heavier). Uses informal measurement language (big, small, heavy, light). Sequences events in time. Recognises different tools measure different things.` },
        { tier: 3, text: `Holds attention on measurement sense for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with measurement sense reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Measures using informal units (hand spans, cups) consistently. Understands need for standard units. Uses rulers, scales, measuring cups with increasing accuracy. Reads clocks (to half hour). Estimates measurements.` },
        { tier: 3, text: `Applies measurement sense to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with measurement sense confidently across most contexts encountered.` },
        { tier: 2, text: `Measures accurately using standard metric units (cm, m, kg, g, mL, L). Converts between related units. Calculates perimeter, area, volume using formulas. Uses timetables, calculates elapsed time.` },
        { tier: 3, text: `Brings measurement sense to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Reasons abstractly about measurement sense, generalising patterns into formal representations.` },
        { tier: 2, text: `Constructs justifications for claims involving measurement sense; evaluates others' reasoning.` },
        { tier: 3, text: `Applies measurement sense to model real-world systems, refining models against data.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Compares two objects directly (longer/heavier). Uses informal measurement language (big, small, heavy, light). Sequences events in time. Recognises different tools measure different things.`,
      developing: `Measures using informal units (hand spans, cups) consistently. Understands need for standard units. Uses rulers, scales, measuring cups with increasing accuracy. Reads clocks (to half hour). Estimates measurements.`,
      demonstrating: `Measures accurately using standard metric units (cm, m, kg, g, mL, L). Converts between related units. Calculates perimeter, area, volume using formulas. Uses timetables, calculates elapsed time.`,
    },
  },
  {
    legacyV1Id: 'M6',
    title: `Spatial Reasoning & Geometry`,
    domainKey: 'mathematicalThinking',
    summary: `The child understands shape, position, movement, and transformation — they can visualise, describe, and manipulate objects in space.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about spatial reasoning and geometry; engages briefly with adult support.` },
        { tier: 2, text: `Names basic 2D shapes (circle, square, triangle). Describes position (next to, behind, above). Sorts shapes by simple attributes. Follows basic directional instructions.` },
        { tier: 3, text: `Holds attention on spatial reasoning and geometry for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with spatial reasoning and geometry reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Identifies and describes properties of 2D and 3D shapes (faces, edges, corners). Recognises shapes regardless of orientation. Creates and interprets simple maps. Identifies lines of symmetry. Performs transformations.` },
        { tier: 3, text: `Applies spatial reasoning and geometry to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with spatial reasoning and geometry confidently across most contexts encountered.` },
        { tier: 2, text: `Classifies shapes using properties with reasoning. Uses coordinate system to describe position. Identifies and describes angle properties. Creates nets for 3D shapes. Visualises transformations mentally.` },
        { tier: 3, text: `Brings spatial reasoning and geometry to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Reasons abstractly about spatial reasoning and geometry, generalising patterns into formal representations.` },
        { tier: 2, text: `Constructs justifications for claims involving spatial reasoning and geometry; evaluates others' reasoning.` },
        { tier: 3, text: `Applies spatial reasoning and geometry to model real-world systems, refining models against data.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Names basic 2D shapes (circle, square, triangle). Describes position (next to, behind, above). Sorts shapes by simple attributes. Follows basic directional instructions.`,
      developing: `Identifies and describes properties of 2D and 3D shapes (faces, edges, corners). Recognises shapes regardless of orientation. Creates and interprets simple maps. Identifies lines of symmetry. Performs transformations.`,
      demonstrating: `Classifies shapes using properties with reasoning. Uses coordinate system to describe position. Identifies and describes angle properties. Creates nets for 3D shapes. Visualises transformations mentally.`,
    },
  },
  {
    legacyV1Id: 'M7',
    title: `Data & Statistical Thinking`,
    domainKey: 'mathematicalThinking',
    summary: `The child can pose questions, collect and organise data, represent it in appropriate forms, and draw conclusions — understanding that data tells a story.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about data and statistical thinking; engages briefly with adult support.` },
        { tier: 2, text: `Sorts objects into categories and counts each. Answers simple questions about picture graph. Participates in surveys. Understands we can count and compare to learn.` },
        { tier: 3, text: `Holds attention on data and statistical thinking for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with data and statistical thinking reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Poses own questions answerable with data. Collects data through observation, surveys, experiments. Creates simple displays (picture graphs, tally, bar graphs). Reads and interprets data. Identifies most/least common.` },
        { tier: 3, text: `Applies data and statistical thinking to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with data and statistical thinking confidently across most contexts encountered.` },
        { tier: 2, text: `Selects appropriate data display for data type. Uses mean, median, mode, range. Identifies trends, outliers, patterns. Draws conclusions and makes predictions. Evaluates reliability of methods.` },
        { tier: 3, text: `Brings data and statistical thinking to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Reasons abstractly about data and statistical thinking, generalising patterns into formal representations.` },
        { tier: 2, text: `Constructs justifications for claims involving data and statistical thinking; evaluates others' reasoning.` },
        { tier: 3, text: `Applies data and statistical thinking to model real-world systems, refining models against data.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Sorts objects into categories and counts each. Answers simple questions about picture graph. Participates in surveys. Understands we can count and compare to learn.`,
      developing: `Poses own questions answerable with data. Collects data through observation, surveys, experiments. Creates simple displays (picture graphs, tally, bar graphs). Reads and interprets data. Identifies most/least common.`,
      demonstrating: `Selects appropriate data display for data type. Uses mean, median, mode, range. Identifies trends, outliers, patterns. Draws conclusions and makes predictions. Evaluates reliability of methods.`,
    },
  },
  {
    legacyV1Id: 'M8',
    title: `Probability & Chance`,
    domainKey: 'mathematicalThinking',
    summary: `The child understands that some events are certain, some are impossible, and most fall somewhere in between — and can reason about likelihood using both intuition and mathematical tools.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about probability and chance; engages briefly with adult support.` },
        { tier: 2, text: `Uses language of chance (maybe, probably, definitely, no way). Identifies outcomes as certain, possible, impossible. Understands some things happen more often than others. Predicts simple outcomes.` },
        { tier: 3, text: `Holds attention on probability and chance for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with probability and chance reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Lists possible outcomes of simple chance events. Describes likelihood on scale (impossible to certain). Conducts simple experiments and records results. Compares expected and actual results.` },
        { tier: 3, text: `Applies probability and chance to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with probability and chance confidently across most contexts encountered.` },
        { tier: 2, text: `Assigns numerical probabilities (fractions, decimals, percentages). Compares theoretical and experimental probability. Identifies all possible outcomes of compound events. Uses probability for decisions.` },
        { tier: 3, text: `Brings probability and chance to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Reasons abstractly about probability and chance, generalising patterns into formal representations.` },
        { tier: 2, text: `Constructs justifications for claims involving probability and chance; evaluates others' reasoning.` },
        { tier: 3, text: `Applies probability and chance to model real-world systems, refining models against data.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Uses language of chance (maybe, probably, definitely, no way). Identifies outcomes as certain, possible, impossible. Understands some things happen more often than others. Predicts simple outcomes.`,
      developing: `Lists possible outcomes of simple chance events. Describes likelihood on scale (impossible to certain). Conducts simple experiments and records results. Compares expected and actual results.`,
      demonstrating: `Assigns numerical probabilities (fractions, decimals, percentages). Compares theoretical and experimental probability. Identifies all possible outcomes of compound events. Uses probability for decisions.`,
    },
  },
  {
    legacyV1Id: 'M9',
    title: `Mathematical Modelling & Problem Solving`,
    domainKey: 'mathematicalThinking',
    summary: `The child can take a real-world situation, represent it mathematically, work through it, and interpret the result back in context — the full cycle of applied mathematics.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about mathematical modelling and problem solving; engages briefly with adult support.` },
        { tier: 2, text: `Recognises when real situation involves mathematics. Represents simple problem with objects, drawings, numbers. Explains thinking when solving problem.` },
        { tier: 3, text: `Holds attention on mathematical modelling and problem solving for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with mathematical modelling and problem solving reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Identifies information needed to solve problem. Tries more than one strategy when stuck. Uses diagrams, tables, lists to organise approach. Checks answer makes sense in real-world context.` },
        { tier: 3, text: `Applies mathematical modelling and problem solving to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with mathematical modelling and problem solving confidently across most contexts encountered.` },
        { tier: 2, text: `Formulates mathematical representations of complex real problems. Selects and combines appropriate tools and strategies. Interprets and communicates results in context. Evaluates efficiency of methods.` },
        { tier: 3, text: `Brings mathematical modelling and problem solving to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Reasons abstractly about mathematical modelling and problem solving, generalising patterns into formal representations.` },
        { tier: 2, text: `Constructs justifications for claims involving mathematical modelling and problem solving; evaluates others' reasoning.` },
        { tier: 3, text: `Applies mathematical modelling and problem solving to model real-world systems, refining models against data.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Recognises when real situation involves mathematics. Represents simple problem with objects, drawings, numbers. Explains thinking when solving problem.`,
      developing: `Identifies information needed to solve problem. Tries more than one strategy when stuck. Uses diagrams, tables, lists to organise approach. Checks answer makes sense in real-world context.`,
      demonstrating: `Formulates mathematical representations of complex real problems. Selects and combines appropriate tools and strategies. Interprets and communicates results in context. Evaluates efficiency of methods.`,
    },
  },
  {
    legacyV1Id: 'S1',
    title: `Scientific Inquiry`,
    domainKey: 'scientificThinking',
    summary: `The child poses investigable questions, plans and conducts investigations, collects and records data, and draws evidence-based conclusions.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about scientific inquiry; engages briefly with adult support.` },
        { tier: 2, text: `Asks "what" and "why" questions about natural phenomena. Explores objects using senses. Notices changes in environment. Describes observations using everyday language.` },
        { tier: 3, text: `Holds attention on scientific inquiry for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with scientific inquiry reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Poses questions that can be investigated. Makes predictions before testing. Follows investigation steps and records observations. Uses informal measurements. Describes results and compares with predictions.` },
        { tier: 3, text: `Applies scientific inquiry to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with scientific inquiry confidently across most contexts encountered.` },
        { tier: 2, text: `Plans investigations with identified variables (change, measure, keep same). Records data systematically in tables/diagrams. Analyses patterns and draws conclusions. Evaluates fairness of investigation. Suggests improvements.` },
        { tier: 3, text: `Brings scientific inquiry to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Designs investigations into scientific inquiry with controlled variables and explicit hypotheses.` },
        { tier: 2, text: `Synthesises evidence about scientific inquiry across multiple sources, weighing reliability.` },
        { tier: 3, text: `Connects scientific inquiry to broader theoretical frameworks; identifies open questions.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Asks "what" and "why" questions about natural phenomena. Explores objects using senses. Notices changes in environment. Describes observations using everyday language.`,
      developing: `Poses questions that can be investigated. Makes predictions before testing. Follows investigation steps and records observations. Uses informal measurements. Describes results and compares with predictions.`,
      demonstrating: `Plans investigations with identified variables (change, measure, keep same). Records data systematically in tables/diagrams. Analyses patterns and draws conclusions. Evaluates fairness of investigation. Suggests improvements.`,
    },
  },
  {
    legacyV1Id: 'S2',
    title: `Living Systems`,
    domainKey: 'scientificThinking',
    summary: `The child understands living things — their characteristics, needs, life cycles, adaptations, and relationships within ecosystems.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about living systems; engages briefly with adult support.` },
        { tier: 2, text: `Identifies things as living or non-living. Names basic needs (food, water, shelter). Observes and describes features. Notices growth and change.` },
        { tier: 3, text: `Holds attention on living systems for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with living systems reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Describes life cycles of familiar organisms. Groups living things by observable features. Identifies structural features for survival. Explains simple food chains and relationships. Describes dependence on environment.` },
        { tier: 3, text: `Applies living systems to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with living systems confidently across most contexts encountered.` },
        { tier: 2, text: `Explains adaptations and survival in specific environments. Describes interdependence in ecosystems. Understands human activity impact. Compares life cycles across organisms.` },
        { tier: 3, text: `Brings living systems to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Designs investigations into living systems with controlled variables and explicit hypotheses.` },
        { tier: 2, text: `Synthesises evidence about living systems across multiple sources, weighing reliability.` },
        { tier: 3, text: `Connects living systems to broader theoretical frameworks; identifies open questions.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Identifies things as living or non-living. Names basic needs (food, water, shelter). Observes and describes features. Notices growth and change.`,
      developing: `Describes life cycles of familiar organisms. Groups living things by observable features. Identifies structural features for survival. Explains simple food chains and relationships. Describes dependence on environment.`,
      demonstrating: `Explains adaptations and survival in specific environments. Describes interdependence in ecosystems. Understands human activity impact. Compares life cycles across organisms.`,
    },
  },
  {
    legacyV1Id: 'S3',
    title: `Earth & Environmental Systems`,
    domainKey: 'scientificThinking',
    summary: `The child understands Earth's systems — weather, water cycle, geology, space — and the relationships between human activity and the natural environment.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about earth and environmental systems; engages briefly with adult support.` },
        { tier: 2, text: `Observes and describes daily weather and seasonal changes. Identifies natural features in local environment. Recognises Earth has day and night. Notices sky (sun, moon, clouds, stars).` },
        { tier: 3, text: `Holds attention on earth and environmental systems for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with earth and environmental systems reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Describes water cycle in simple terms. Identifies rocks, soil, landscapes. Understands weather and seasonal patterns. Describes Earth rotation and day/night. Identifies natural resources and uses.` },
        { tier: 3, text: `Applies earth and environmental systems to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with earth and environmental systems confidently across most contexts encountered.` },
        { tier: 2, text: `Explains geological processes (erosion, weathering). Understands Earth, Moon, Sun relationships. Analyses human activity impact on systems. Describes cycles (carbon, water, rock) in detail. Evaluates sustainability.` },
        { tier: 3, text: `Brings earth and environmental systems to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Designs investigations into earth and environmental systems with controlled variables and explicit hypotheses.` },
        { tier: 2, text: `Synthesises evidence about earth and environmental systems across multiple sources, weighing reliability.` },
        { tier: 3, text: `Connects earth and environmental systems to broader theoretical frameworks; identifies open questions.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Observes and describes daily weather and seasonal changes. Identifies natural features in local environment. Recognises Earth has day and night. Notices sky (sun, moon, clouds, stars).`,
      developing: `Describes water cycle in simple terms. Identifies rocks, soil, landscapes. Understands weather and seasonal patterns. Describes Earth rotation and day/night. Identifies natural resources and uses.`,
      demonstrating: `Explains geological processes (erosion, weathering). Understands Earth, Moon, Sun relationships. Analyses human activity impact on systems. Describes cycles (carbon, water, rock) in detail. Evaluates sustainability.`,
    },
  },
  {
    legacyV1Id: 'S4',
    title: `Physical & Chemical Sciences`,
    domainKey: 'scientificThinking',
    summary: `The child understands forces, energy, materials, and their properties — how things move, why they change, and what they're made of.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about physical and chemical sciences; engages briefly with adult support.` },
        { tier: 2, text: `Explores what objects are made of (wood, metal, fabric). Notices push/pull makes things move. Observes heating/cooling change materials. Groups materials by simple properties.` },
        { tier: 3, text: `Holds attention on physical and chemical sciences for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with physical and chemical sciences reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Describes properties and links to uses. Understands forces change shape, speed, direction. Investigates light, sound, heat behaviour. Identifies reversible and irreversible changes. Describes energy transformations.` },
        { tier: 3, text: `Applies physical and chemical sciences to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with physical and chemical sciences confidently across most contexts encountered.` },
        { tier: 2, text: `Explains how forces interact (gravity, friction, magnetism). Classifies changes (physical/chemical). Describes energy transfer and transformation. Understands particle model. Applies understanding to design.` },
        { tier: 3, text: `Brings physical and chemical sciences to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Designs investigations into physical and chemical sciences with controlled variables and explicit hypotheses.` },
        { tier: 2, text: `Synthesises evidence about physical and chemical sciences across multiple sources, weighing reliability.` },
        { tier: 3, text: `Connects physical and chemical sciences to broader theoretical frameworks; identifies open questions.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Explores what objects are made of (wood, metal, fabric). Notices push/pull makes things move. Observes heating/cooling change materials. Groups materials by simple properties.`,
      developing: `Describes properties and links to uses. Understands forces change shape, speed, direction. Investigates light, sound, heat behaviour. Identifies reversible and irreversible changes. Describes energy transformations.`,
      demonstrating: `Explains how forces interact (gravity, friction, magnetism). Classifies changes (physical/chemical). Describes energy transfer and transformation. Understands particle model. Applies understanding to design.`,
    },
  },
  {
    legacyV1Id: 'S5',
    title: `Scientific Observation`,
    domainKey: 'scientificThinking',
    summary: `The child observes carefully and systematically — slowing down, noticing details, recording what they see, and distinguishing observation from interpretation.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about scientific observation; engages briefly with adult support.` },
        { tier: 2, text: `Slows down to look when reminded. Points out single detail. Returns to look again. Asks "what's that?" about unexpected things.` },
        { tier: 3, text: `Holds attention on scientific observation for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with scientific observation reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Slows down without reminder. Notices changes over time. Compares similar things and identifies differences. Uses tools (magnifier, binoculars) effectively. Describes multiple details.` },
        { tier: 3, text: `Applies scientific observation to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with scientific observation confidently across most contexts encountered.` },
        { tier: 2, text: `Records observations systematically (journal, diagram, photo with notes). Distinguishes observed from interpreted. Notices patterns across observations. Designs observation protocols. Uses precise language.` },
        { tier: 3, text: `Brings scientific observation to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Designs investigations into scientific observation with controlled variables and explicit hypotheses.` },
        { tier: 2, text: `Synthesises evidence about scientific observation across multiple sources, weighing reliability.` },
        { tier: 3, text: `Connects scientific observation to broader theoretical frameworks; identifies open questions.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Slows down to look when reminded. Points out single detail. Returns to look again. Asks "what's that?" about unexpected things.`,
      developing: `Slows down without reminder. Notices changes over time. Compares similar things and identifies differences. Uses tools (magnifier, binoculars) effectively. Describes multiple details.`,
      demonstrating: `Records observations systematically (journal, diagram, photo with notes). Distinguishes observed from interpreted. Notices patterns across observations. Designs observation protocols. Uses precise language.`,
    },
  },
  {
    legacyV1Id: 'S6',
    title: `Science as Human Endeavour`,
    domainKey: 'scientificThinking',
    summary: `The child understands that science is a human activity — shaped by culture, curiosity, and collaboration — and that scientific knowledge changes over time as new evidence emerges.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about science as human endeavour; engages briefly with adult support.` },
        { tier: 2, text: `Shows curiosity about how things work and asks questions. Recognises people use science. Identifies scientists or inventors they've heard of.` },
        { tier: 3, text: `Holds attention on science as human endeavour for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with science as human endeavour reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Describes examples of science changing daily life. Understands First Nations have long-standing scientific knowledge. Recognises scientists work together and build on ideas. Identifies how science helps solve problems.` },
        { tier: 3, text: `Applies science as human endeavour to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with science as human endeavour confidently across most contexts encountered.` },
        { tier: 2, text: `Explains how scientific understanding changed with examples. Discusses ethical dimensions. Evaluates different claims using evidence. Understands peer review and reproducibility. Recognises diverse cultural contributions.` },
        { tier: 3, text: `Brings science as human endeavour to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Designs investigations into science as human endeavour with controlled variables and explicit hypotheses.` },
        { tier: 2, text: `Synthesises evidence about science as human endeavour across multiple sources, weighing reliability.` },
        { tier: 3, text: `Connects science as human endeavour to broader theoretical frameworks; identifies open questions.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Shows curiosity about how things work and asks questions. Recognises people use science. Identifies scientists or inventors they've heard of.`,
      developing: `Describes examples of science changing daily life. Understands First Nations have long-standing scientific knowledge. Recognises scientists work together and build on ideas. Identifies how science helps solve problems.`,
      demonstrating: `Explains how scientific understanding changed with examples. Discusses ethical dimensions. Evaluates different claims using evidence. Understands peer review and reproducibility. Recognises diverse cultural contributions.`,
    },
  },
  {
    legacyV1Id: 'H1',
    title: `Historical Thinking & Chronology`,
    domainKey: 'historicalCivicGeographic',
    summary: `The child understands time, change, and continuity — they can sequence events, understand cause and effect in human history, and appreciate how the past shapes the present.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about historical thinking and chronology; engages briefly with adult support.` },
        { tier: 2, text: `Sequences personal events (yesterday, last week). Identifies things as "old" or "new". Shows interest in family stories. Asks questions about the past.` },
        { tier: 3, text: `Holds attention on historical thinking and chronology for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with historical thinking and chronology reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Places events on simple timeline. Describes how daily life changed over time. Identifies significant events or people. Understands people in past lived differently. Explores family and community histories.` },
        { tier: 3, text: `Applies historical thinking and chronology to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with historical thinking and chronology confidently across most contexts encountered.` },
        { tier: 2, text: `Uses historical language (decade, century, era). Analyses cause and effect in events. Considers multiple perspectives. Identifies continuity and change. Connects local history to broader narratives.` },
        { tier: 3, text: `Brings historical thinking and chronology to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Constructs evidence-based arguments about historical thinking and chronology; acknowledges interpretive choices.` },
        { tier: 2, text: `Evaluates competing accounts of historical thinking and chronology, attending to authorship and context.` },
        { tier: 3, text: `Connects historical thinking and chronology across periods and places; identifies continuity and rupture.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Sequences personal events (yesterday, last week). Identifies things as "old" or "new". Shows interest in family stories. Asks questions about the past.`,
      developing: `Places events on simple timeline. Describes how daily life changed over time. Identifies significant events or people. Understands people in past lived differently. Explores family and community histories.`,
      demonstrating: `Uses historical language (decade, century, era). Analyses cause and effect in events. Considers multiple perspectives. Identifies continuity and change. Connects local history to broader narratives.`,
    },
  },
  {
    legacyV1Id: 'H2',
    title: `Source Analysis & Evidence`,
    domainKey: 'historicalCivicGeographic',
    summary: `The child can evaluate sources of information — distinguishing primary from secondary, identifying bias, and understanding that accounts of the same event can differ.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about source analysis and evidence; engages briefly with adult support.` },
        { tier: 2, text: `Identifies where information comes from (book, person, website). Recognises photos and objects can tell about past. Understands stories can be told differently.` },
        { tier: 3, text: `Holds attention on source analysis and evidence for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with source analysis and evidence reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Distinguishes primary (diary, letter, photo) from secondary sources. Identifies author/creator and their perspective. Compares accounts and notices differences. Asks "How do we know?".` },
        { tier: 3, text: `Applies source analysis and evidence to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with source analysis and evidence confidently across most contexts encountered.` },
        { tier: 2, text: `Evaluates reliability and usefulness of sources. Identifies bias, perspective, purpose. Cross-references multiple sources. Understands absence of sources creates knowledge gaps. Applies across disciplines.` },
        { tier: 3, text: `Brings source analysis and evidence to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Constructs evidence-based arguments about source analysis and evidence; acknowledges interpretive choices.` },
        { tier: 2, text: `Evaluates competing accounts of source analysis and evidence, attending to authorship and context.` },
        { tier: 3, text: `Connects source analysis and evidence across periods and places; identifies continuity and rupture.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Identifies where information comes from (book, person, website). Recognises photos and objects can tell about past. Understands stories can be told differently.`,
      developing: `Distinguishes primary (diary, letter, photo) from secondary sources. Identifies author/creator and their perspective. Compares accounts and notices differences. Asks "How do we know?".`,
      demonstrating: `Evaluates reliability and usefulness of sources. Identifies bias, perspective, purpose. Cross-references multiple sources. Understands absence of sources creates knowledge gaps. Applies across disciplines.`,
    },
  },
  {
    legacyV1Id: 'H3',
    title: `Geography & Environmental Awareness`,
    domainKey: 'historicalCivicGeographic',
    summary: `The child understands places, spaces, and environments — from local to global — and the relationships between people and their environments.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about geography and environmental awareness; engages briefly with adult support.` },
        { tier: 2, text: `Describes local environment and features. Identifies home and school on simple map. Names natural features. Notices differences between places.` },
        { tier: 3, text: `Holds attention on geography and environmental awareness for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with geography and environmental awareness reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Creates and interprets simple maps with keys. Describes how people use and change environment. Compares features of different places. Identifies weather/climate effects. Understands Indigenous names and histories.` },
        { tier: 3, text: `Applies geography and environmental awareness to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with geography and environmental awareness confidently across most contexts encountered.` },
        { tier: 2, text: `Analyses relationship between human activity and environmental change. Uses geographical tools (maps, globes, digital). Evaluates land use and management perspectives. Understands sustainability. Compares global communities.` },
        { tier: 3, text: `Brings geography and environmental awareness to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Constructs evidence-based arguments about geography and environmental awareness; acknowledges interpretive choices.` },
        { tier: 2, text: `Evaluates competing accounts of geography and environmental awareness, attending to authorship and context.` },
        { tier: 3, text: `Connects geography and environmental awareness across periods and places; identifies continuity and rupture.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Describes local environment and features. Identifies home and school on simple map. Names natural features. Notices differences between places.`,
      developing: `Creates and interprets simple maps with keys. Describes how people use and change environment. Compares features of different places. Identifies weather/climate effects. Understands Indigenous names and histories.`,
      demonstrating: `Analyses relationship between human activity and environmental change. Uses geographical tools (maps, globes, digital). Evaluates land use and management perspectives. Understands sustainability. Compares global communities.`,
    },
  },
  {
    legacyV1Id: 'H4',
    title: `Civic & Economic Understanding`,
    domainKey: 'historicalCivicGeographic',
    summary: `The child understands how communities and societies are organised — governance, rules, rights, responsibilities, and economic activity.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about civic and economic understanding; engages briefly with adult support.` },
        { tier: 2, text: `Identifies roles and responsibilities in family and community. Understands groups need rules. Recognises needs vs wants. Shows awareness people do different jobs.` },
        { tier: 3, text: `Holds attention on civic and economic understanding for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with civic and economic understanding reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Explains why communities have rules and laws. Describes how goods/services are produced and distributed. Identifies rights and responsibilities. Understands democratic concepts. Recognises different perspectives.` },
        { tier: 3, text: `Applies civic and economic understanding to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with civic and economic understanding confidently across most contexts encountered.` },
        { tier: 2, text: `Analyses how decisions affect different groups. Understands levels of government and roles. Evaluates economic choices and trade-offs. Considers global connections impact. Proposes solutions to issues.` },
        { tier: 3, text: `Brings civic and economic understanding to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Constructs evidence-based arguments about civic and economic understanding; acknowledges interpretive choices.` },
        { tier: 2, text: `Evaluates competing accounts of civic and economic understanding, attending to authorship and context.` },
        { tier: 3, text: `Connects civic and economic understanding across periods and places; identifies continuity and rupture.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Identifies roles and responsibilities in family and community. Understands groups need rules. Recognises needs vs wants. Shows awareness people do different jobs.`,
      developing: `Explains why communities have rules and laws. Describes how goods/services are produced and distributed. Identifies rights and responsibilities. Understands democratic concepts. Recognises different perspectives.`,
      demonstrating: `Analyses how decisions affect different groups. Understands levels of government and roles. Evaluates economic choices and trade-offs. Considers global connections impact. Proposes solutions to issues.`,
    },
  },
  {
    legacyV1Id: 'H5',
    title: `HASS Inquiry Skills`,
    domainKey: 'historicalCivicGeographic',
    summary: `The child can conduct humanities inquiries — posing questions, locating and analysing information, drawing conclusions, and communicating findings.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about hass inquiry skills; engages briefly with adult support.` },
        { tier: 2, text: `Asks questions about people, places, events. Finds information from provided source. Shares findings with others. Draws or writes about learning.` },
        { tier: 3, text: `Holds attention on hass inquiry skills for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with hass inquiry skills reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Develops own inquiry questions. Uses multiple sources to investigate. Sorts and records information. Presents findings appropriately. Identifies different viewpoints.` },
        { tier: 3, text: `Applies hass inquiry skills to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with hass inquiry skills confidently across most contexts encountered.` },
        { tier: 2, text: `Plans and conducts extended inquiry with multiple stages. Evaluates sources for reliability and relevance. Synthesises diverse information. Draws evidence-based conclusions. Reflects on process.` },
        { tier: 3, text: `Brings hass inquiry skills to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Constructs evidence-based arguments about hass inquiry skills; acknowledges interpretive choices.` },
        { tier: 2, text: `Evaluates competing accounts of hass inquiry skills, attending to authorship and context.` },
        { tier: 3, text: `Connects hass inquiry skills across periods and places; identifies continuity and rupture.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Asks questions about people, places, events. Finds information from provided source. Shares findings with others. Draws or writes about learning.`,
      developing: `Develops own inquiry questions. Uses multiple sources to investigate. Sorts and records information. Presents findings appropriately. Identifies different viewpoints.`,
      demonstrating: `Plans and conducts extended inquiry with multiple stages. Evaluates sources for reliability and relevance. Synthesises diverse information. Draws evidence-based conclusions. Reflects on process.`,
    },
  },
  {
    legacyV1Id: 'P1',
    title: `Gross Motor & Physical Coordination`,
    domainKey: 'physicalEmbodied',
    summary: `The child moves their whole body with increasing control, coordination, and confidence — running, jumping, climbing, balancing, throwing, catching.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about gross motor and physical coordination; engages briefly with adult support.` },
        { tier: 2, text: `Walks, runs, jumps with basic control. Catches large ball with two hands from close range. Balances on one foot briefly. Moves to music with some rhythm.` },
        { tier: 3, text: `Holds attention on gross motor and physical coordination for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with gross motor and physical coordination reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Demonstrates coordinated running, jumping, hopping, skipping. Throws overarm with increasing accuracy. Catches small ball from various distances. Maintains balance during dynamic activities. Performs movement sequences.` },
        { tier: 3, text: `Applies gross motor and physical coordination to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with gross motor and physical coordination confidently across most contexts encountered.` },
        { tier: 2, text: `Moves with fluency, control, efficiency across diverse activities. Combines locomotor and object control skills in games. Adapts movement to environments. Demonstrates spatial awareness. Shows stamina and endurance.` },
        { tier: 3, text: `Brings gross motor and physical coordination to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Refines gross motor and physical coordination through deliberate practice; integrates coach and self-feedback.` },
        { tier: 2, text: `Sustains gross motor and physical coordination as part of a coherent physical practice — fitness, skill, recovery.` },
        { tier: 3, text: `Adapts gross motor and physical coordination to novel contexts and constraints with composed response.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Walks, runs, jumps with basic control. Catches large ball with two hands from close range. Balances on one foot briefly. Moves to music with some rhythm.`,
      developing: `Demonstrates coordinated running, jumping, hopping, skipping. Throws overarm with increasing accuracy. Catches small ball from various distances. Maintains balance during dynamic activities. Performs movement sequences.`,
      demonstrating: `Moves with fluency, control, efficiency across diverse activities. Combines locomotor and object control skills in games. Adapts movement to environments. Demonstrates spatial awareness. Shows stamina and endurance.`,
    },
  },
  {
    legacyV1Id: 'P2',
    title: `Fine Motor & Manipulation`,
    domainKey: 'physicalEmbodied',
    summary: `The child uses their hands and fingers with increasing precision and control — manipulating tools, materials, and objects for purposeful tasks.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about fine motor and manipulation; engages briefly with adult support.` },
        { tier: 2, text: `Holds and uses tools (crayons, spoons, paintbrushes) with functional grip. Threads large beads, completes simple puzzles. Uses scissors to snip. Manipulates playdough or clay.` },
        { tier: 3, text: `Holds attention on fine motor and manipulation for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with fine motor and manipulation reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Cuts along line with reasonable accuracy. Draws recognisable shapes and pictures with detail. Ties knots, uses fasteners (buttons, zips). Uses construction materials with precision. Holds pencil with efficient grip.` },
        { tier: 3, text: `Applies fine motor and manipulation to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with fine motor and manipulation confidently across most contexts encountered.` },
        { tier: 2, text: `Completes intricate tasks (sewing, detailed drawing, model building). Uses range of tools confidently. Fine motor does not limit any activity. Adapts grip and pressure for different tools.` },
        { tier: 3, text: `Brings fine motor and manipulation to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Refines fine motor and manipulation through deliberate practice; integrates coach and self-feedback.` },
        { tier: 2, text: `Sustains fine motor and manipulation as part of a coherent physical practice — fitness, skill, recovery.` },
        { tier: 3, text: `Adapts fine motor and manipulation to novel contexts and constraints with composed response.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Holds and uses tools (crayons, spoons, paintbrushes) with functional grip. Threads large beads, completes simple puzzles. Uses scissors to snip. Manipulates playdough or clay.`,
      developing: `Cuts along line with reasonable accuracy. Draws recognisable shapes and pictures with detail. Ties knots, uses fasteners (buttons, zips). Uses construction materials with precision. Holds pencil with efficient grip.`,
      demonstrating: `Completes intricate tasks (sewing, detailed drawing, model building). Uses range of tools confidently. Fine motor does not limit any activity. Adapts grip and pressure for different tools.`,
    },
  },
  {
    legacyV1Id: 'P3',
    title: `Health & Body Awareness`,
    domainKey: 'physicalEmbodied',
    summary: `The child understands their body — nutrition, hygiene, growth, and the factors that contribute to physical and mental wellbeing.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about health and body awareness; engages briefly with adult support.` },
        { tier: 2, text: `Identifies basic body parts and functions. Understands simple hygiene routines. Recognises food gives energy and helps growth. Identifies when unwell and communicates it.` },
        { tier: 3, text: `Holds attention on health and body awareness for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with health and body awareness reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Describes factors for health (nutrition, exercise, sleep, hygiene). Makes increasingly independent healthy choices. Understands bodies change over time. Identifies safe and unsafe actions.` },
        { tier: 3, text: `Applies health and body awareness to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with health and body awareness confidently across most contexts encountered.` },
        { tier: 2, text: `Analyses relationship between lifestyle choices and health. Evaluates health information from sources. Demonstrates personal responsibility. Understands connection between physical and mental wellbeing. Identifies health resources.` },
        { tier: 3, text: `Brings health and body awareness to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Refines health and body awareness through deliberate practice; integrates coach and self-feedback.` },
        { tier: 2, text: `Sustains health and body awareness as part of a coherent physical practice — fitness, skill, recovery.` },
        { tier: 3, text: `Adapts health and body awareness to novel contexts and constraints with composed response.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Identifies basic body parts and functions. Understands simple hygiene routines. Recognises food gives energy and helps growth. Identifies when unwell and communicates it.`,
      developing: `Describes factors for health (nutrition, exercise, sleep, hygiene). Makes increasingly independent healthy choices. Understands bodies change over time. Identifies safe and unsafe actions.`,
      demonstrating: `Analyses relationship between lifestyle choices and health. Evaluates health information from sources. Demonstrates personal responsibility. Understands connection between physical and mental wellbeing. Identifies health resources.`,
    },
  },
  {
    legacyV1Id: 'P4',
    title: `Sport & Cooperative Games`,
    domainKey: 'physicalEmbodied',
    summary: `The child participates in structured physical activities, understands rules and fair play, and works cooperatively in team-based movement contexts.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about sport and cooperative games; engages briefly with adult support.` },
        { tier: 2, text: `Participates willingly in group physical activities. Follows basic game rules with reminding. Takes turns during games. Shows enjoyment of physical play with others.` },
        { tier: 3, text: `Holds attention on sport and cooperative games for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with sport and cooperative games reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Understands and follows rules independently. Co-constructs fair play rules. Works cooperatively with partner or team. Shows good sportsmanship. Applies movement skills in games.` },
        { tier: 3, text: `Applies sport and cooperative games to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with sport and cooperative games confidently across most contexts encountered.` },
        { tier: 2, text: `Develops and applies tactics and strategies. Supports and encourages others. Modifies games for inclusion or challenge. Demonstrates leadership. Reflects on performance and improves.` },
        { tier: 3, text: `Brings sport and cooperative games to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Refines sport and cooperative games through deliberate practice; integrates coach and self-feedback.` },
        { tier: 2, text: `Sustains sport and cooperative games as part of a coherent physical practice — fitness, skill, recovery.` },
        { tier: 3, text: `Adapts sport and cooperative games to novel contexts and constraints with composed response.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Participates willingly in group physical activities. Follows basic game rules with reminding. Takes turns during games. Shows enjoyment of physical play with others.`,
      developing: `Understands and follows rules independently. Co-constructs fair play rules. Works cooperatively with partner or team. Shows good sportsmanship. Applies movement skills in games.`,
      demonstrating: `Develops and applies tactics and strategies. Supports and encourages others. Modifies games for inclusion or challenge. Demonstrates leadership. Reflects on performance and improves.`,
    },
  },
  {
    legacyV1Id: 'P5',
    title: `Risk Assessment & Physical Safety`,
    domainKey: 'physicalEmbodied',
    summary: `The child identifies potential hazards, assesses risk relative to their own capability, and makes safe choices — developing independence through managed risk rather than avoidance.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about risk assessment and physical safety; engages briefly with adult support.` },
        { tier: 2, text: `Responds to "stop" or safety instructions. Identifies obviously dangerous situations. Understands basic safety rules in familiar environments. Seeks help when feeling unsafe.` },
        { tier: 3, text: `Holds attention on risk assessment and physical safety for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with risk assessment and physical safety reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Assesses risk before attempting challenges. Identifies potential hazards in new environments. Knows who to ask for help. Understands protective behaviours and boundaries. Makes safe choices with decreasing prompting.` },
        { tier: 3, text: `Applies risk assessment and physical safety to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with risk assessment and physical safety confidently across most contexts encountered.` },
        { tier: 2, text: `Independently assesses and manages physical risks. Adapts behaviour for different risk levels. Demonstrates emergency awareness. Helps others identify and manage risks. Articulates why safety measures exist.` },
        { tier: 3, text: `Brings risk assessment and physical safety to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Refines risk assessment and physical safety through deliberate practice; integrates coach and self-feedback.` },
        { tier: 2, text: `Sustains risk assessment and physical safety as part of a coherent physical practice — fitness, skill, recovery.` },
        { tier: 3, text: `Adapts risk assessment and physical safety to novel contexts and constraints with composed response.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Responds to "stop" or safety instructions. Identifies obviously dangerous situations. Understands basic safety rules in familiar environments. Seeks help when feeling unsafe.`,
      developing: `Assesses risk before attempting challenges. Identifies potential hazards in new environments. Knows who to ask for help. Understands protective behaviours and boundaries. Makes safe choices with decreasing prompting.`,
      demonstrating: `Independently assesses and manages physical risks. Adapts behaviour for different risk levels. Demonstrates emergency awareness. Helps others identify and manage risks. Articulates why safety measures exist.`,
    },
  },
  {
    legacyV1Id: 'PS1',
    title: `Empathy & Perspective-Taking`,
    domainKey: 'socialRelational',
    summary: `The child recognises, understands, and responds to the emotions and perspectives of others — seeing the world through different eyes.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about empathy and perspective-taking; engages briefly with adult support.` },
        { tier: 2, text: `Recognises basic emotions in others (happy, sad, angry). Shows concern when someone upset. Understands people have feelings. Responds to simple perspective prompts.` },
        { tier: 3, text: `Holds attention on empathy and perspective-taking for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with empathy and perspective-taking reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Identifies emotions from contextual cues. Considers another's perspective without prompting. Shows compassion through actions. Understands same event affects people differently. Discusses character feelings.` },
        { tier: 3, text: `Applies empathy and perspective-taking to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with empathy and perspective-taking confidently across most contexts encountered.` },
        { tier: 2, text: `Takes perspective of very different people. Navigates disagreements considering both sides. Shows awareness of actions' effects on others. Demonstrates cultural sensitivity. Advocates for fairness and inclusion.` },
        { tier: 3, text: `Brings empathy and perspective-taking to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Leads in contexts requiring empathy and perspective-taking; attends to multiple stakeholders.` },
        { tier: 2, text: `Navigates empathy and perspective-taking across diverse contexts — work, family, community — with consistent character.` },
        { tier: 3, text: `Repairs and deepens relationships involving empathy and perspective-taking after rupture.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Recognises basic emotions in others (happy, sad, angry). Shows concern when someone upset. Understands people have feelings. Responds to simple perspective prompts.`,
      developing: `Identifies emotions from contextual cues. Considers another's perspective without prompting. Shows compassion through actions. Understands same event affects people differently. Discusses character feelings.`,
      demonstrating: `Takes perspective of very different people. Navigates disagreements considering both sides. Shows awareness of actions' effects on others. Demonstrates cultural sensitivity. Advocates for fairness and inclusion.`,
    },
  },
  {
    legacyV1Id: 'PS2',
    title: `Social Skills & Cooperation`,
    domainKey: 'socialRelational',
    summary: `The child interacts positively with others — sharing, negotiating, collaborating, resolving conflicts, and building friendships.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about social skills and cooperation; engages briefly with adult support.` },
        { tier: 2, text: `Plays alongside others (parallel to interactive play). Shares materials when reminded. Responds to social cues (greetings, turn-taking). Seeks out company of peers or family.` },
        { tier: 3, text: `Holds attention on social skills and cooperation for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with social skills and cooperation reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Initiates social interaction and joins activities. Negotiates roles and resources with peers. Uses words to resolve simple conflicts with support. Works cooperatively on shared tasks. Identifies and maintains friendships.` },
        { tier: 3, text: `Applies social skills and cooperation to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with social skills and cooperation confidently across most contexts encountered.` },
        { tier: 2, text: `Resolves conflicts independently using multiple strategies. Adapts social behaviour for different contexts. Supports and encourages others. Demonstrates leadership and followership. Builds positive relationships across groups.` },
        { tier: 3, text: `Brings social skills and cooperation to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Leads in contexts requiring social skills and cooperation; attends to multiple stakeholders.` },
        { tier: 2, text: `Navigates social skills and cooperation across diverse contexts — work, family, community — with consistent character.` },
        { tier: 3, text: `Repairs and deepens relationships involving social skills and cooperation after rupture.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Plays alongside others (parallel to interactive play). Shares materials when reminded. Responds to social cues (greetings, turn-taking). Seeks out company of peers or family.`,
      developing: `Initiates social interaction and joins activities. Negotiates roles and resources with peers. Uses words to resolve simple conflicts with support. Works cooperatively on shared tasks. Identifies and maintains friendships.`,
      demonstrating: `Resolves conflicts independently using multiple strategies. Adapts social behaviour for different contexts. Supports and encourages others. Demonstrates leadership and followership. Builds positive relationships across groups.`,
    },
  },
  {
    legacyV1Id: 'PS3',
    title: `Self-Regulation & Wellbeing`,
    domainKey: 'personalEthical',
    summary: `The child manages their emotions, behaviour, and energy — coping with frustration, transitioning between activities, and maintaining a positive sense of self.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about self-regulation and wellbeing; engages briefly with adult support.` },
        { tier: 2, text: `Names current emotion with support. Accepts comfort from trusted person. Transitions between activities with support. Identifies situations affecting emotions.` },
        { tier: 3, text: `Holds attention on self-regulation and wellbeing for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with self-regulation and wellbeing reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Uses strategies to manage big emotions (deep breaths, walking away, asking for space). Transitions with minimal support. Persists through frustration with less intervention. Describes strengths and areas being worked on.` },
        { tier: 3, text: `Applies self-regulation and wellbeing to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with self-regulation and wellbeing confidently across most contexts encountered.` },
        { tier: 2, text: `Self-monitors emotional state and applies strategies independently. Recovers from setbacks with resilience. Maintains balanced and realistic self-assessment. Advocates for own needs. Shows sustained positive engagement.` },
        { tier: 3, text: `Brings self-regulation and wellbeing to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Self-directs self-regulation and wellbeing across extended periods without external scaffolding.` },
        { tier: 2, text: `Reflects metacognitively on self-regulation and wellbeing; articulates what works and what to try next.` },
        { tier: 3, text: `Integrates self-regulation and wellbeing into a coherent practice grounded in considered values.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Names current emotion with support. Accepts comfort from trusted person. Transitions between activities with support. Identifies situations affecting emotions.`,
      developing: `Uses strategies to manage big emotions (deep breaths, walking away, asking for space). Transitions with minimal support. Persists through frustration with less intervention. Describes strengths and areas being worked on.`,
      demonstrating: `Self-monitors emotional state and applies strategies independently. Recovers from setbacks with resilience. Maintains balanced and realistic self-assessment. Advocates for own needs. Shows sustained positive engagement.`,
    },
  },
  {
    legacyV1Id: 'PS4',
    title: `Identity & Belonging`,
    domainKey: 'personalEthical',
    summary: `The child has a developing sense of who they are — their family, culture, values, strengths, and place in their community and the world.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about identity and belonging; engages briefly with adult support.` },
        { tier: 2, text: `Identifies self as part of family and community. Recognises and names personal interests and preferences. Shows awareness of cultural or family traditions. Demonstrates pride in abilities.` },
        { tier: 3, text: `Holds attention on identity and belonging for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with identity and belonging reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Describes own cultural background and family stories. Recognises and respects others' different backgrounds. Identifies personal strengths and learning areas. Feels comfortable contributing in groups.` },
        { tier: 3, text: `Applies identity and belonging to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with identity and belonging confidently across most contexts encountered.` },
        { tier: 2, text: `Articulates personal values and what matters. Respects and celebrates diversity. Shows confidence in identity while open to new ideas. Connects identity to broader community and cultural contexts. Shows resilience.` },
        { tier: 3, text: `Brings identity and belonging to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Self-directs identity and belonging across extended periods without external scaffolding.` },
        { tier: 2, text: `Reflects metacognitively on identity and belonging; articulates what works and what to try next.` },
        { tier: 3, text: `Integrates identity and belonging into a coherent practice grounded in considered values.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Identifies self as part of family and community. Recognises and names personal interests and preferences. Shows awareness of cultural or family traditions. Demonstrates pride in abilities.`,
      developing: `Describes own cultural background and family stories. Recognises and respects others' different backgrounds. Identifies personal strengths and learning areas. Feels comfortable contributing in groups.`,
      demonstrating: `Articulates personal values and what matters. Respects and celebrates diversity. Shows confidence in identity while open to new ideas. Connects identity to broader community and cultural contexts. Shows resilience.`,
    },
  },
  {
    legacyV1Id: 'PS6',
    title: `Ethical Reasoning`,
    domainKey: 'personalEthical',
    summary: `The child thinks about right and wrong, fairness and justice — considering ethical dimensions of situations and making reasoned moral judgments.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about ethical reasoning; engages briefly with adult support.` },
        { tier: 2, text: `Identifies situations as "fair" or "unfair". Recognises when someone hurt or treated badly. Follows rules and understands purpose. Responds honestly about own actions.` },
        { tier: 3, text: `Holds attention on ethical reasoning for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with ethical reasoning reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Considers action impact on others before acting. Explains reasons for rules and suggests modifications. Recognises ethical dilemmas in stories and life. Understands fair doesn't always mean equal.` },
        { tier: 3, text: `Applies ethical reasoning to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with ethical reasoning confidently across most contexts encountered.` },
        { tier: 2, text: `Analyses ethical dilemmas using multiple perspectives. Defends moral position with reasoned arguments. Identifies ethical dimensions in apparently neutral situations. Considers stakeholder consequences.` },
        { tier: 3, text: `Brings ethical reasoning to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Self-directs ethical reasoning across extended periods without external scaffolding.` },
        { tier: 2, text: `Reflects metacognitively on ethical reasoning; articulates what works and what to try next.` },
        { tier: 3, text: `Integrates ethical reasoning into a coherent practice grounded in considered values.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Identifies situations as "fair" or "unfair". Recognises when someone hurt or treated badly. Follows rules and understands purpose. Responds honestly about own actions.`,
      developing: `Considers action impact on others before acting. Explains reasons for rules and suggests modifications. Recognises ethical dilemmas in stories and life. Understands fair doesn't always mean equal.`,
      demonstrating: `Analyses ethical dilemmas using multiple perspectives. Defends moral position with reasoned arguments. Identifies ethical dimensions in apparently neutral situations. Considers stakeholder consequences.`,
    },
  },
  {
    legacyV1Id: 'PS7',
    title: `Digital Citizenship`,
    domainKey: 'technologicalFluency',
    summary: `The child navigates digital environments responsibly — understanding online safety, digital identity, information literacy, and respectful online interaction.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about digital citizenship; engages briefly with adult support.` },
        { tier: 2, text: `Uses digital devices for simple purposes with supervision. Understands basic online safety rules. Recognises difference between online and offline interactions.` },
        { tier: 3, text: `Holds attention on digital citizenship for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with digital citizenship reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Follows agreed family rules independently. Understands online actions have real consequences. Identifies suspicious or uncomfortable content and tells adult. Uses digital tools purposefully. Understands digital footprint.` },
        { tier: 3, text: `Applies digital citizenship to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with digital citizenship confidently across most contexts encountered.` },
        { tier: 2, text: `Evaluates online information for credibility and bias. Manages digital identity and privacy thoughtfully. Demonstrates respectful and ethical online behaviour. Uses digital tools effectively and selectively. Helps others navigate safely.` },
        { tier: 3, text: `Brings digital citizenship to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Designs digital citizenship systems accounting for users, ethics, security, unintended consequences.` },
        { tier: 2, text: `Builds original work in digital citizenship from specification through testing, documenting reasoning.` },
        { tier: 3, text: `Evaluates digital citizenship critically — trade-offs, biases, impacts on people and systems.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Uses digital devices for simple purposes with supervision. Understands basic online safety rules. Recognises difference between online and offline interactions.`,
      developing: `Follows agreed family rules independently. Understands online actions have real consequences. Identifies suspicious or uncomfortable content and tells adult. Uses digital tools purposefully. Understands digital footprint.`,
      demonstrating: `Evaluates online information for credibility and bias. Manages digital identity and privacy thoughtfully. Demonstrates respectful and ethical online behaviour. Uses digital tools effectively and selectively. Helps others navigate safely.`,
    },
  },
  {
    legacyV1Id: 'C1',
    title: `Narrative & Storytelling`,
    domainKey: 'literaryTradition',
    summary: `The child creates and shares stories — across media (oral, written, visual, dramatic) — with increasing sophistication in plot, character, setting, and theme.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about narrative and storytelling; engages briefly with adult support.` },
        { tier: 2, text: `Tells simple stories with beginning and end. Uses imaginative play with toys or props. Contributes ideas to shared storytelling.` },
        { tier: 3, text: `Holds attention on narrative and storytelling for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with narrative and storytelling reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Creates stories with clear beginning, middle, end. Develops characters with distinct traits. Includes problems and resolutions. Uses descriptive language for setting. Tells stories across media.` },
        { tier: 3, text: `Applies narrative and storytelling to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with narrative and storytelling confidently across most contexts encountered.` },
        { tier: 2, text: `Creates complex narratives with subplots, themes, moral dilemmas. Develops multi-dimensional characters that change. Uses narrative techniques deliberately. Adapts storytelling for audiences. Revises based on feedback.` },
        { tier: 3, text: `Brings narrative and storytelling to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Reads and interprets narrative and storytelling with attention to form, tradition, texture of language.` },
        { tier: 2, text: `Situates works of narrative and storytelling within longer traditions; recognises influence and convention.` },
        { tier: 3, text: `Articulates considered judgments on narrative and storytelling, supporting claims from the text.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Tells simple stories with beginning and end. Uses imaginative play with toys or props. Contributes ideas to shared storytelling.`,
      developing: `Creates stories with clear beginning, middle, end. Develops characters with distinct traits. Includes problems and resolutions. Uses descriptive language for setting. Tells stories across media.`,
      demonstrating: `Creates complex narratives with subplots, themes, moral dilemmas. Develops multi-dimensional characters that change. Uses narrative techniques deliberately. Adapts storytelling for audiences. Revises based on feedback.`,
    },
  },
  {
    legacyV1Id: 'C2',
    title: `Musical Expression`,
    domainKey: 'musicalPerformative',
    summary: `The child engages with music — listening, creating, performing — with growing understanding of musical elements and their expressive potential.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about musical expression; engages briefly with adult support.` },
        { tier: 2, text: `Responds to music physically (clapping, swaying, dancing). Sings familiar songs with some accuracy. Identifies instruments or sound sources. Expresses preferences for music.` },
        { tier: 3, text: `Holds attention on musical expression for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with musical expression reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Keeps steady beat during activities. Creates simple patterns. Identifies musical elements (loud/soft, fast/slow, high/low). Performs with attention to expression. Listens to and discusses different cultures.` },
        { tier: 3, text: `Applies musical expression to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with musical expression confidently across most contexts encountered.` },
        { tier: 2, text: `Creates original compositions or arrangements. Uses notation or recording to capture ideas. Analyses and evaluates with appropriate vocabulary. Performs with technical skill and expression. Applies across genres and cultures.` },
        { tier: 3, text: `Brings musical expression to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Performs musical expression with expressive interpretation, responding to ensemble in real time.` },
        { tier: 2, text: `Sustains practice discipline in musical expression producing measurable refinement over years.` },
        { tier: 3, text: `Contributes original creative work in musical expression — composition, choreography, direction.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Responds to music physically (clapping, swaying, dancing). Sings familiar songs with some accuracy. Identifies instruments or sound sources. Expresses preferences for music.`,
      developing: `Keeps steady beat during activities. Creates simple patterns. Identifies musical elements (loud/soft, fast/slow, high/low). Performs with attention to expression. Listens to and discusses different cultures.`,
      demonstrating: `Creates original compositions or arrangements. Uses notation or recording to capture ideas. Analyses and evaluates with appropriate vocabulary. Performs with technical skill and expression. Applies across genres and cultures.`,
    },
  },
  {
    legacyV1Id: 'C3',
    title: `Poetic & Rhythmic Expression`,
    domainKey: 'musicalPerformative',
    summary: `The child plays with language — rhythm, rhyme, imagery, and the sounds and shapes of words — for aesthetic and expressive purposes.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about poetic and rhythmic expression; engages briefly with adult support.` },
        { tier: 2, text: `Enjoys rhyming words and wordplay. Repeats rhythmic phrases from songs, books, poems. Notices similar or interesting sounds. Claps or moves to language rhythm.` },
        { tier: 3, text: `Holds attention on poetic and rhythmic expression for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with poetic and rhythmic expression reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Creates simple rhymes or patterns. Experiments with alliteration, onomatopoeia, repetition. Reads poetry with attention to rhythm and expression. Describes how poem makes them feel. Writes simple poems.` },
        { tier: 3, text: `Applies poetic and rhythmic expression to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with poetic and rhythmic expression confidently across most contexts encountered.` },
        { tier: 2, text: `Writes original poetry with intentional use of devices. Analyses craft of published poems. Experiments with different forms (haiku, free verse, acrostic). Uses poetic language across contexts. Develops personal voice.` },
        { tier: 3, text: `Brings poetic and rhythmic expression to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Performs poetic and rhythmic expression with expressive interpretation, responding to ensemble in real time.` },
        { tier: 2, text: `Sustains practice discipline in poetic and rhythmic expression producing measurable refinement over years.` },
        { tier: 3, text: `Contributes original creative work in poetic and rhythmic expression — composition, choreography, direction.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Enjoys rhyming words and wordplay. Repeats rhythmic phrases from songs, books, poems. Notices similar or interesting sounds. Claps or moves to language rhythm.`,
      developing: `Creates simple rhymes or patterns. Experiments with alliteration, onomatopoeia, repetition. Reads poetry with attention to rhythm and expression. Describes how poem makes them feel. Writes simple poems.`,
      demonstrating: `Writes original poetry with intentional use of devices. Analyses craft of published poems. Experiments with different forms (haiku, free verse, acrostic). Uses poetic language across contexts. Develops personal voice.`,
    },
  },
  {
    legacyV1Id: 'C4',
    title: `Dramatic Expression`,
    domainKey: 'musicalPerformative',
    summary: `The child engages in dramatic play, role play, and performance — using voice, body, and imagination to explore ideas, stories, and emotions.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about dramatic expression; engages briefly with adult support.` },
        { tier: 2, text: `Engages in imaginative/pretend play spontaneously. Takes on roles (doctor, shopkeeper). Uses props and costumes. Watches and responds to performances.` },
        { tier: 3, text: `Holds attention on dramatic expression for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with dramatic expression reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Maintains character or role for extended period. Uses voice (volume, tone, expression) to convey character. Collaborates to create dramatic scenarios. Creates simple scripts. Responds to drama personally.` },
        { tier: 3, text: `Applies dramatic expression to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with dramatic expression confidently across most contexts encountered.` },
        { tier: 2, text: `Creates and performs original works. Uses techniques deliberately (pause, gesture, staging). Analyses and provides feedback. Takes on complex roles with commitment. Uses drama to explore issues.` },
        { tier: 3, text: `Brings dramatic expression to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Performs dramatic expression with expressive interpretation, responding to ensemble in real time.` },
        { tier: 2, text: `Sustains practice discipline in dramatic expression producing measurable refinement over years.` },
        { tier: 3, text: `Contributes original creative work in dramatic expression — composition, choreography, direction.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Engages in imaginative/pretend play spontaneously. Takes on roles (doctor, shopkeeper). Uses props and costumes. Watches and responds to performances.`,
      developing: `Maintains character or role for extended period. Uses voice (volume, tone, expression) to convey character. Collaborates to create dramatic scenarios. Creates simple scripts. Responds to drama personally.`,
      demonstrating: `Creates and performs original works. Uses techniques deliberately (pause, gesture, staging). Analyses and provides feedback. Takes on complex roles with commitment. Uses drama to explore issues.`,
    },
  },
  {
    legacyV1Id: 'C5',
    title: `Visual Expression & Design`,
    domainKey: 'visualPlasticArts',
    summary: `The child creates visual works — drawing, painting, sculpture, digital — with increasing technical skill, aesthetic awareness, and expressive intent.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about visual expression and design; engages briefly with adult support.` },
        { tier: 2, text: `Explores materials freely (paint, clay, pencils, collage). Creates images representing real or imagined things. Expresses preferences for colours, shapes, styles. Shows interest in visual art.` },
        { tier: 3, text: `Holds attention on visual expression and design for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with visual expression and design reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Uses range of materials and techniques purposefully. Creates works with recognisable subjects and increasing detail. Experiments with colour, line, shape, texture. Discusses art by others. Plans before creating.` },
        { tier: 3, text: `Applies visual expression and design to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with visual expression and design confidently across most contexts encountered.` },
        { tier: 2, text: `Creates visually effective works with deliberate aesthetic choices. Uses variety of media with skill. Analyses and evaluates visual art with vocabulary. Communicates ideas/stories/emotions through works. Develops personal style.` },
        { tier: 3, text: `Brings visual expression and design to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Develops personal voice in visual expression and design while drawing on tradition and considered influence.` },
        { tier: 2, text: `Achieves technical mastery in visual expression and design sufficient to realise intent without struggle.` },
        { tier: 3, text: `Critiques own and others' work in visual expression and design using vocabulary of form and tradition.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Explores materials freely (paint, clay, pencils, collage). Creates images representing real or imagined things. Expresses preferences for colours, shapes, styles. Shows interest in visual art.`,
      developing: `Uses range of materials and techniques purposefully. Creates works with recognisable subjects and increasing detail. Experiments with colour, line, shape, texture. Discusses art by others. Plans before creating.`,
      demonstrating: `Creates visually effective works with deliberate aesthetic choices. Uses variety of media with skill. Analyses and evaluates visual art with vocabulary. Communicates ideas/stories/emotions through works. Develops personal style.`,
    },
  },
  {
    legacyV1Id: 'C6',
    title: `Design & Construction`,
    domainKey: 'technologicalFluency',
    summary: `The child designs and builds things — using iterative processes of planning, making, testing, and improving to solve problems and create functional or aesthetic objects.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about design and construction; engages briefly with adult support.` },
        { tier: 2, text: `Builds with construction materials (blocks, Lego, boxes) with purpose. Talks about what they'll make before starting. Identifies problem to solve. Explores how things work.` },
        { tier: 3, text: `Holds attention on design and construction for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with design and construction reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Draws plans or designs before building. Selects materials based on properties and task. Tests creation and identifies what works. Modifies designs based on testing. Describes design process.` },
        { tier: 3, text: `Applies design and construction to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with design and construction confidently across most contexts encountered.` },
        { tier: 2, text: `Plans designs with clear specifications and constraints. Uses full design cycle (define→design→make→evaluate→improve). Considers user needs. Evaluates trade-offs. Documents process and explains decisions.` },
        { tier: 3, text: `Brings design and construction to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Designs design and construction systems accounting for users, ethics, security, unintended consequences.` },
        { tier: 2, text: `Builds original work in design and construction from specification through testing, documenting reasoning.` },
        { tier: 3, text: `Evaluates design and construction critically — trade-offs, biases, impacts on people and systems.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Builds with construction materials (blocks, Lego, boxes) with purpose. Talks about what they'll make before starting. Identifies problem to solve. Explores how things work.`,
      developing: `Draws plans or designs before building. Selects materials based on properties and task. Tests creation and identifies what works. Modifies designs based on testing. Describes design process.`,
      demonstrating: `Plans designs with clear specifications and constraints. Uses full design cycle (define→design→make→evaluate→improve). Considers user needs. Evaluates trade-offs. Documents process and explains decisions.`,
    },
  },
  {
    legacyV1Id: 'C7',
    title: `Digital Creation`,
    domainKey: 'technologicalFluency',
    summary: `The child uses digital tools creatively — from basic digital media creation to computational thinking, coding, and algorithmic problem-solving.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about digital creation; engages briefly with adult support.` },
        { tier: 2, text: `Uses digital tools for simple creative tasks (drawing apps, camera). Understands digital devices follow instructions. Follows step sequences. Identifies everyday digital technology.` },
        { tier: 3, text: `Holds attention on digital creation for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with digital creation reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Creates digital content (presentations, animations, programs). Writes simple algorithms or step-by-step instructions. Uses visual programming tools (Scratch). Organises data digitally. Debugs simple errors.` },
        { tier: 3, text: `Applies digital creation to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with digital creation confidently across most contexts encountered.` },
        { tier: 2, text: `Creates complex projects combining multiple tools. Applies computational thinking (decomposition, pattern, abstraction). Designs and tests algorithms. Understands data types and storage. Evaluates solutions.` },
        { tier: 3, text: `Brings digital creation to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Designs digital creation systems accounting for users, ethics, security, unintended consequences.` },
        { tier: 2, text: `Builds original work in digital creation from specification through testing, documenting reasoning.` },
        { tier: 3, text: `Evaluates digital creation critically — trade-offs, biases, impacts on people and systems.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Uses digital tools for simple creative tasks (drawing apps, camera). Understands digital devices follow instructions. Follows step sequences. Identifies everyday digital technology.`,
      developing: `Creates digital content (presentations, animations, programs). Writes simple algorithms or step-by-step instructions. Uses visual programming tools (Scratch). Organises data digitally. Debugs simple errors.`,
      demonstrating: `Creates complex projects combining multiple tools. Applies computational thinking (decomposition, pattern, abstraction). Designs and tests algorithms. Understands data types and storage. Evaluates solutions.`,
    },
  },
  {
    legacyV1Id: 'EF1',
    title: `Sustained Attention & Focus`,
    domainKey: 'personalEthical',
    summary: `The child can maintain focused attention on a task or activity — both during structured learning and self-directed exploration — with increasing duration and resistance to distraction.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about sustained attention and focus; engages briefly with adult support.` },
        { tier: 2, text: `Engages with activity for few minutes before seeking new thing. Returns to activity after interruption with prompting. Shows focused engagement in high-interest activities. Responds to redirection.` },
        { tier: 3, text: `Holds attention on sustained attention and focus for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with sustained attention and focus reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Sustains attention on task for 15-20+ minutes. Returns after interruption without prompting. Ignores minor distractions. Completes multi-step activities. Recognises when attention drifted.` },
        { tier: 3, text: `Applies sustained attention and focus to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with sustained attention and focus confidently across most contexts encountered.` },
        { tier: 2, text: `Sustains deep focus for extended periods (30+ minutes). Manages attention strategically (quiet spaces, removing distractions). Maintains focus during challenging tasks. Transitions attention efficiently. Demonstrates flow states.` },
        { tier: 3, text: `Brings sustained attention and focus to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Self-directs sustained attention and focus across extended periods without external scaffolding.` },
        { tier: 2, text: `Reflects metacognitively on sustained attention and focus; articulates what works and what to try next.` },
        { tier: 3, text: `Integrates sustained attention and focus into a coherent practice grounded in considered values.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Engages with activity for few minutes before seeking new thing. Returns to activity after interruption with prompting. Shows focused engagement in high-interest activities. Responds to redirection.`,
      developing: `Sustains attention on task for 15-20+ minutes. Returns after interruption without prompting. Ignores minor distractions. Completes multi-step activities. Recognises when attention drifted.`,
      demonstrating: `Sustains deep focus for extended periods (30+ minutes). Manages attention strategically (quiet spaces, removing distractions). Maintains focus during challenging tasks. Transitions attention efficiently. Demonstrates flow states.`,
    },
  },
  {
    legacyV1Id: 'EF2',
    title: `Working Memory`,
    domainKey: 'personalEthical',
    summary: `The child can hold and manipulate information in their mind — following multi-step instructions, solving problems mentally, and connecting ideas across time.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about working memory; engages briefly with adult support.` },
        { tier: 2, text: `Follows one-step instruction. Remembers where left familiar object. Recalls simple message to pass to person. Holds one piece of information while completing task.` },
        { tier: 3, text: `Holds attention on working memory for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with working memory reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Follows 2-3 step instructions without reminding. Holds question in mind while searching answer. Remembers and applies rule while working. Connects information from text beginning to end. Remembers what was doing.` },
        { tier: 3, text: `Applies working memory to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with working memory confidently across most contexts encountered.` },
        { tier: 2, text: `Follows complex multi-step procedures from memory. Solves problems holding multiple variables. Connects ideas across different contexts. Uses memory strategies deliberately. Manages multiple demands simultaneously.` },
        { tier: 3, text: `Brings working memory to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Self-directs working memory across extended periods without external scaffolding.` },
        { tier: 2, text: `Reflects metacognitively on working memory; articulates what works and what to try next.` },
        { tier: 3, text: `Integrates working memory into a coherent practice grounded in considered values.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Follows one-step instruction. Remembers where left familiar object. Recalls simple message to pass to person. Holds one piece of information while completing task.`,
      developing: `Follows 2-3 step instructions without reminding. Holds question in mind while searching answer. Remembers and applies rule while working. Connects information from text beginning to end. Remembers what was doing after interruption.`,
      demonstrating: `Follows complex multi-step procedures from memory. Solves problems holding multiple variables. Connects ideas across different contexts. Uses memory strategies deliberately. Manages multiple demands simultaneously.`,
    },
  },
  {
    legacyV1Id: 'EF3',
    title: `Memory & Recall`,
    domainKey: 'personalEthical',
    summary: `The child stores and retrieves information over time — remembering facts, events, procedures, and concepts and accessing them when needed.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about memory and recall; engages briefly with adult support.` },
        { tier: 2, text: `Recalls recent events when prompted. Remembers names of familiar people and places. Recognises previously encountered information. Recalls favourite stories or songs.` },
        { tier: 3, text: `Holds attention on memory and recall for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with memory and recall reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Recalls key facts from recent learning without prompting. Uses prior knowledge to make connections. Remembers procedures. Retrieves mathematical facts with increasing automaticity. Recalls information from weeks ago.` },
        { tier: 3, text: `Applies memory and recall to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with memory and recall confidently across most contexts encountered.` },
        { tier: 2, text: `Draws on broad base of prior knowledge across domains. Retrieves information quickly and accurately. Makes connections between stored knowledge and novel situations. Uses memory strategies deliberately. Demonstrates deep, flexible knowledge.` },
        { tier: 3, text: `Brings memory and recall to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Self-directs memory and recall across extended periods without external scaffolding.` },
        { tier: 2, text: `Reflects metacognitively on memory and recall; articulates what works and what to try next.` },
        { tier: 3, text: `Integrates memory and recall into a coherent practice grounded in considered values.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Recalls recent events when prompted. Remembers names of familiar people and places. Recognises previously encountered information. Recalls favourite stories or songs.`,
      developing: `Recalls key facts from recent learning without prompting. Uses prior knowledge to make connections. Remembers procedures. Retrieves mathematical facts with increasing automaticity. Recalls information from weeks ago.`,
      demonstrating: `Draws on broad base of prior knowledge across domains. Retrieves information quickly and accurately. Makes connections between stored knowledge and novel situations. Uses memory strategies deliberately. Demonstrates deep, flexible knowledge.`,
    },
  },
  {
    legacyV1Id: 'EF4',
    title: `Planning & Organisation`,
    domainKey: 'personalEthical',
    summary: `The child approaches tasks and projects systematically — setting goals, making plans, organising materials, managing time, and adjusting course when needed.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about planning and organisation; engages briefly with adult support.` },
        { tier: 2, text: `Gathers materials before starting when reminded. Follows provided sequence of steps. Identifies what needed to start. Accepts help breaking big task into steps.` },
        { tier: 3, text: `Holds attention on planning and organisation for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with planning and organisation reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Breaks task into steps with minimal guidance. Gathers necessary materials independently. Creates simple plans (lists, drawings, outlines). Manages time with support. Adjusts plans when not working.` },
        { tier: 3, text: `Applies planning and organisation to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with planning and organisation confidently across most contexts encountered.` },
        { tier: 2, text: `Plans multi-day or multi-week projects independently. Prioritises tasks and manages competing demands. Creates and maintains organisational systems. Anticipates problems and plans contingencies. Reflects and improves strategies.` },
        { tier: 3, text: `Brings planning and organisation to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Self-directs planning and organisation across extended periods without external scaffolding.` },
        { tier: 2, text: `Reflects metacognitively on planning and organisation; articulates what works and what to try next.` },
        { tier: 3, text: `Integrates planning and organisation into a coherent practice grounded in considered values.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Gathers materials before starting when reminded. Follows provided sequence of steps. Identifies what needed to start. Accepts help breaking big task into steps.`,
      developing: `Breaks task into steps with minimal guidance. Gathers necessary materials independently. Creates simple plans (lists, drawings, outlines). Manages time with support. Adjusts plans when not working.`,
      demonstrating: `Plans multi-day or multi-week projects independently. Prioritises tasks and manages competing demands. Creates and maintains organisational systems. Anticipates problems and plans contingencies. Reflects and improves strategies.`,
    },
  },
  {
    legacyV1Id: 'EF5',
    title: `Critical Thinking`,
    domainKey: 'personalEthical',
    summary: `The child analyses, evaluates, and synthesises information — questioning assumptions, identifying logic, weighing evidence, and forming reasoned judgments.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about critical thinking; engages briefly with adult support.` },
        { tier: 2, text: `Asks "why?" and "how do you know?" questions. Notices when something doesn't seem right. Compares two options and explains preference. Identifies real from imaginary.` },
        { tier: 3, text: `Holds attention on critical thinking for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with critical thinking reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Identifies assumptions in own and others' thinking. Evaluates evidence before accepting. Considers alternative explanations. Distinguishes strong and weak reasons. Asks probing questions.` },
        { tier: 3, text: `Applies critical thinking to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with critical thinking confidently across most contexts encountered.` },
        { tier: 2, text: `Analyses complex issues from multiple perspectives. Identifies logical fallacies and weak reasoning. Synthesises information from multiple sources. Evaluates quality and relevance of evidence. Forms and defends positions.` },
        { tier: 3, text: `Brings critical thinking to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Self-directs critical thinking across extended periods without external scaffolding.` },
        { tier: 2, text: `Reflects metacognitively on critical thinking; articulates what works and what to try next.` },
        { tier: 3, text: `Integrates critical thinking into a coherent practice grounded in considered values.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Asks "why?" and "how do you know?" questions. Notices when something doesn't seem right. Compares two options and explains preference. Identifies real from imaginary.`,
      developing: `Identifies assumptions in own and others' thinking. Evaluates evidence before accepting. Considers alternative explanations. Distinguishes strong and weak reasons. Asks probing questions.`,
      demonstrating: `Analyses complex issues from multiple perspectives. Identifies logical fallacies and weak reasoning. Synthesises information from multiple sources. Evaluates quality and relevance of evidence. Forms and defends positions.`,
    },
  },
  {
    legacyV1Id: 'EF6',
    title: `Collaboration & Teamwork`,
    domainKey: 'socialRelational',
    summary: `The child works effectively with others toward shared goals — contributing ideas, listening, compromising, and sharing responsibility for outcomes.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about collaboration and teamwork; engages briefly with adult support.` },
        { tier: 2, text: `Works alongside others on shared activity. Accepts role in group task. Shares materials willingly. Listens to others' ideas during activities.` },
        { tier: 3, text: `Holds attention on collaboration and teamwork for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with collaboration and teamwork reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Contributes ideas and listens to others. Negotiates roles and responsibilities. Stays on task during group work. Helps others struggling. Compromises when disagreements arise.` },
        { tier: 3, text: `Applies collaboration and teamwork to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with collaboration and teamwork confidently across most contexts encountered.` },
        { tier: 2, text: `Takes initiative and shows leadership in projects. Distributes work equitably and holds self accountable. Facilitates discussions and ensures all voices heard. Evaluates group processes. Adapts role to team needs.` },
        { tier: 3, text: `Brings collaboration and teamwork to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Leads in contexts requiring collaboration and teamwork; attends to multiple stakeholders.` },
        { tier: 2, text: `Navigates collaboration and teamwork across diverse contexts — work, family, community — with consistent character.` },
        { tier: 3, text: `Repairs and deepens relationships involving collaboration and teamwork after rupture.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Works alongside others on shared activity. Accepts role in group task. Shares materials willingly. Listens to others' ideas during activities.`,
      developing: `Contributes ideas and listens to others. Negotiates roles and responsibilities. Stays on task during group work. Helps others struggling. Compromises when disagreements arise.`,
      demonstrating: `Takes initiative and shows leadership in projects. Distributes work equitably and holds self accountable. Facilitates discussions and ensures all voices heard. Evaluates group processes. Adapts role to team needs.`,
    },
  },
  {
    legacyV1Id: 'EF7',
    title: `Metacognition & Reflective Practice`,
    domainKey: 'personalEthical',
    summary: `The child thinks about their own thinking and learning — understanding how they learn best, monitoring their understanding, and adjusting their approach.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about metacognition and reflective practice; engages briefly with adult support.` },
        { tier: 2, text: `Responds to "What did you learn?" with specific answers. Identifies activities they find easy or hard. Shows awareness that practice improves performance. Accepts feedback.` },
        { tier: 3, text: `Holds attention on metacognition and reflective practice for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with metacognition and reflective practice reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Describes strategies they use for learning. Identifies what they understand and what they're confused about. Adjusts approach when not working. Reflects on work and identifies what'd do differently. Seeks feedback.` },
        { tier: 3, text: `Applies metacognition and reflective practice to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with metacognition and reflective practice confidently across most contexts encountered.` },
        { tier: 2, text: `Monitors own understanding in real-time. Selects and applies strategies deliberately for different tasks. Sets personal learning goals and tracks progress. Provides constructive feedback to others. Articulates personal learning philosophy.` },
        { tier: 3, text: `Brings metacognition and reflective practice to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Self-directs metacognition and reflective practice across extended periods without external scaffolding.` },
        { tier: 2, text: `Reflects metacognitively on metacognition and reflective practice; articulates what works and what to try next.` },
        { tier: 3, text: `Integrates metacognition and reflective practice into a coherent practice grounded in considered values.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Responds to "What did you learn?" with specific answers. Identifies activities they find easy or hard. Shows awareness that practice improves performance. Accepts feedback.`,
      developing: `Describes strategies they use for learning. Identifies what they understand and what they're confused about. Adjusts approach when not working. Reflects on work and identifies what'd do differently. Seeks feedback.`,
      demonstrating: `Monitors own understanding in real-time. Selects and applies strategies deliberately for different tasks. Sets personal learning goals and tracks progress. Provides constructive feedback to others. Articulates personal learning philosophy.`,
    },
  },
  {
    legacyV1Id: 'EF8',
    title: `Creative Thinking & Innovation`,
    domainKey: 'personalEthical',
    summary: `The child generates novel ideas, sees possibilities, takes intellectual risks, and approaches problems with imagination and originality.`,
    stageBands: {
      foundational: [
        { tier: 1, text: `Shows early curiosity about creative thinking and innovation; engages briefly with adult support.` },
        { tier: 2, text: `Engages in imaginative play and "what if" scenarios. Suggests unusual ideas without self-censoring. Shows curiosity and asks original questions. Experiments with materials freely.` },
        { tier: 3, text: `Holds attention on creative thinking and innovation for short periods; needs occasional prompting.` },
      ],
      intermediate: [
        { tier: 1, text: `Engages with creative thinking and innovation reliably in familiar contexts and known materials.` },
        { tier: 2, text: `Generates multiple ideas when brainstorming. Combines existing ideas in new ways. Takes intellectual risks. Builds on others' ideas constructively. Sees problems as opportunities.` },
        { tier: 3, text: `Applies creative thinking and innovation to slightly novel situations; recovers from mild errors.` },
      ],
      advanced: [
        { tier: 1, text: `Engages with creative thinking and innovation confidently across most contexts encountered.` },
        { tier: 2, text: `Produces original and effective creative works or solutions. Applies creative thinking across domains (not just arts). Evaluates ideas for feasibility while maintaining ambition. Persists through creative process. Demonstrates personal creative.` },
        { tier: 3, text: `Brings creative thinking and innovation to unfamiliar problems; explains thinking to others.` },
      ],
      tertiary: [
        { tier: 1, text: `Self-directs creative thinking and innovation across extended periods without external scaffolding.` },
        { tier: 2, text: `Reflects metacognitively on creative thinking and innovation; articulates what works and what to try next.` },
        { tier: 3, text: `Integrates creative thinking and innovation into a coherent practice grounded in considered values.` },
      ],
    },
    v1LegacyTiers: {
      emerging: `Engages in imaginative play and "what if" scenarios. Suggests unusual ideas without self-censoring. Shows curiosity and asks original questions. Experiments with materials freely.`,
      developing: `Generates multiple ideas when brainstorming. Combines existing ideas in new ways. Takes intellectual risks. Builds on others' ideas constructively. Sees problems as opportunities.`,
      demonstrating: `Produces original and effective creative works or solutions. Applies creative thinking across domains (not just arts). Evaluates ideas for feasibility while maintaining ambition. Persists through creative process. Demonstrates personal creative voice.`,
    },
  },
];