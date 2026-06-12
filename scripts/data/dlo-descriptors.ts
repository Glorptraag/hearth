/**
 * DLO descriptor fixture for the WS-3 eval harness.
 *
 * The 16 golden-set capability threads × 3 tiers = 48 DLO descriptors,
 * transcribed verbatim from `docs/hearth-capability-dlo-reference.md`
 * (the descriptor "contract"). Keyed by the canonical DLO id `dlo.{thread}.{tier}`.
 *
 * WHY THIS EXISTS (read before assuming the eval should hit Sanity):
 * The `g5zhwbxg/production` dataset is pre-migration for the capability layer —
 * it holds 0 `discreteLearningObjective` documents and its `capabilityThread`
 * docs are UUID-keyed without thread codes. So `getValidDlos()` returns no
 * descriptors there, and the production declared-thread path (assembleContext)
 * is dormant until the Sanity DLO/thread migration lands (parked task P-2/P-3,
 * "HUMAN: prod seed approval"). The eval therefore sources descriptors from this
 * in-repo fixture and primes the dlo-cache directly, so it measures the
 * PROMPT-level effect of descriptor injection reproducibly, with no Sanity or DB
 * dependency. The descriptor text here is the same canonical text production
 * will inject once seeded.
 */

export type DloTier = 'emerging' | 'developing' | 'demonstrating';

export interface DloDescriptorSpec {
  thread: string;
  tier: DloTier;
  descriptor: string;
}

export const GOLDEN_DLO_DESCRIPTORS: DloDescriptorSpec[] = [
  // H1 — Historical Thinking & Chronology
  { thread: 'H1', tier: 'emerging', descriptor: 'Sequences personal events (yesterday, last week). Identifies things as "old" or "new". Shows interest in family stories. Asks questions about the past.' },
  { thread: 'H1', tier: 'developing', descriptor: 'Places events on simple timeline. Describes how daily life changed over time. Identifies significant events or people. Understands people in past lived differently. Explores family and community histories.' },
  { thread: 'H1', tier: 'demonstrating', descriptor: 'Uses historical language (decade, century, era). Analyses cause and effect in events. Considers multiple perspectives. Identifies continuity and change. Connects local history to broader narratives.' },

  // H2 — Source Analysis & Evidence
  { thread: 'H2', tier: 'emerging', descriptor: 'Identifies where information comes from (book, person, website). Recognises photos and objects can tell about past. Understands stories can be told differently.' },
  { thread: 'H2', tier: 'developing', descriptor: 'Distinguishes primary (diary, letter, photo) from secondary sources. Identifies author/creator and their perspective. Compares accounts and notices differences. Asks "How do we know?".' },
  { thread: 'H2', tier: 'demonstrating', descriptor: 'Evaluates reliability and usefulness of sources. Identifies bias, perspective, purpose. Cross-references multiple sources. Understands absence of sources creates knowledge gaps. Applies across disciplines.' },

  // H3 — Geography & Environmental Awareness
  { thread: 'H3', tier: 'emerging', descriptor: 'Describes local environment and features. Identifies home and school on simple map. Names natural features. Notices differences between places.' },
  { thread: 'H3', tier: 'developing', descriptor: 'Creates and interprets simple maps with keys. Describes how people use and change environment. Compares features of different places. Identifies weather/climate effects. Understands Indigenous names and histories.' },
  { thread: 'H3', tier: 'demonstrating', descriptor: 'Analyses relationship between human activity and environmental change. Uses geographical tools (maps, globes, digital). Evaluates land use and management perspectives. Understands sustainability. Compares global communities.' },

  // L1 — Oral Communication & Listening
  { thread: 'L1', tier: 'emerging', descriptor: 'Responds with a relevant word or phrase. Takes turns with prompting. Follows simple one-two step instructions.' },
  { thread: 'L1', tier: 'developing', descriptor: 'Initiates conversation about experiences without prompting. Asks clarifying questions. Retells events in sequence. Adjusts volume/tone for different settings.' },
  { thread: 'L1', tier: 'demonstrating', descriptor: 'Presents ideas to groups with confidence. Adapts language for different audiences. Sustains conversation by building on what others say. Uses specific vocabulary from learning contexts.' },

  // L3 — Reading Comprehension
  { thread: 'L3', tier: 'emerging', descriptor: 'Points to pictures that match text. Answers "what happened?" questions. Makes connections to personal experience. Identifies main characters.' },
  { thread: 'L3', tier: 'developing', descriptor: 'Predicts what happens next based on clues. Retells story including beginning, middle, end. Identifies main idea in informational text. Makes simple inferences. Asks questions about unfamiliar words.' },
  { thread: 'L3', tier: 'demonstrating', descriptor: 'Compares ideas across multiple texts. Identifies author purpose or perspective. Distinguishes fact from opinion. Uses evidence to support interpretation. Monitors own comprehension and uses strategies when meaning breaks down.' },

  // L5 — Written Expression
  { thread: 'L5', tier: 'emerging', descriptor: 'Dictates ideas for an adult to write down. Writes or draws to convey simple message. Attempts sentences with capitals and full stops. Labels pictures or diagrams.' },
  { thread: 'L5', tier: 'developing', descriptor: 'Writes multiple connected sentences on topic. Includes beginning, middle, end. Uses descriptive language (adjectives, simple adverbs). Writes for different purposes when prompted. Re-reads and makes simple changes.' },
  { thread: 'L5', tier: 'demonstrating', descriptor: 'Plans before writing using notes, diagrams, or outlines. Writes sustained texts with clear structure and paragraphing. Varies sentence length and type for effect. Shows audience awareness. Edits and revises for clarity.' },

  // L8 — Persuasion & Argument
  { thread: 'L8', tier: 'emerging', descriptor: 'Expresses preference with simple reason. Recognises when someone is trying to convince them. Understands people can have different opinions.' },
  { thread: 'L8', tier: 'developing', descriptor: 'Gives multiple reasons to support opinion. Identifies persuasive techniques in advertisements. Writes simple persuasive text with clear position and reasons. Considers counter-argument when prompted.' },
  { thread: 'L8', tier: 'demonstrating', descriptor: 'Constructs sustained arguments with evidence and reasoning. Evaluates strength of evidence. Identifies bias, emotive language, rhetorical strategies. Acknowledges counter-arguments and addresses them. Distinguishes fact, opinion, reasoned judgment.' },

  // L9 — Literary Response & Appreciation
  { thread: 'L9', tier: 'emerging', descriptor: 'Shows enjoyment of stories being read aloud. Has favourite books, characters, or story types. Responds with personal reaction. Recognises story elements (character, setting, problem).' },
  { thread: 'L9', tier: 'developing', descriptor: 'Explains why they like or dislike text with reference to specific parts. Identifies with characters and discusses motivations. Recognises literary devices when pointed out. Compares texts by same author or on same topic. Recommends books.' },
  { thread: 'L9', tier: 'demonstrating', descriptor: 'Discusses themes and ideas across multiple texts. Analyses how authors create effect through language choices. Responds to literature with personal interpretation and evidence. Appreciates literary forms and conventions. Evaluates how texts reflect different cultural or historical contexts.' },

  // M1 — Number Sense & Place Value
  { thread: 'M1', tier: 'emerging', descriptor: 'Counts objects with one-to-one correspondence. Recognises last number counted tells "how many". Compares two groups (more/fewer). Recognises numerals. Understands numbers come in fixed order.' },
  { thread: 'M1', tier: 'developing', descriptor: 'Counts forwards and backwards from any starting point. Uses skip counting (2s, 5s, 10s) purposefully. Understands tens and ones (24 = 2 tens + 4 ones). Orders numbers on number line. Estimates quantities.' },
  { thread: 'M1', tier: 'demonstrating', descriptor: 'Composes and decomposes numbers flexibly (38 = 30+8 = 20+18). Understands place value across hundreds, thousands. Compares and orders large numbers. Rounds appropriately. Applies number sense to check reasonableness.' },

  // M2 — Operations & Computation
  { thread: 'M2', tier: 'emerging', descriptor: 'Combines two groups and counts total. Removes objects and counts remainder. Uses concrete materials for addition/subtraction. Recognises "putting together" and "taking away". Shares equally between two people.' },
  { thread: 'M2', tier: 'developing', descriptor: 'Uses mental strategies (counting on, doubles, making 10). Recalls basic addition and subtraction facts. Understands multiplication as repeated groups. Uses arrays, skip counting for multiplication. Recognises inverse relationship.' },
  { thread: 'M2', tier: 'demonstrating', descriptor: 'Computes fluently with all four operations using efficient strategies. Knows multiplication facts and uses them for division. Applies operations to multi-step problems. Estimates before computing. Selects most efficient strategy.' },

  // M9 — Mathematical Modelling & Problem Solving
  { thread: 'M9', tier: 'emerging', descriptor: 'Recognises when real situation involves mathematics. Represents simple problem with objects, drawings, numbers. Explains thinking when solving problem.' },
  { thread: 'M9', tier: 'developing', descriptor: 'Identifies information needed to solve problem. Tries more than one strategy when stuck. Uses diagrams, tables, lists to organise approach. Checks answer makes sense in real-world context.' },
  { thread: 'M9', tier: 'demonstrating', descriptor: 'Formulates mathematical representations of complex real problems. Selects and combines appropriate tools and strategies. Interprets and communicates results in context. Evaluates efficiency of methods.' },

  // EF5 — Critical Thinking
  { thread: 'EF5', tier: 'emerging', descriptor: 'Asks "why?" and "how do you know?" questions. Notices when something doesn\'t seem right. Compares two options and explains preference. Identifies real from imaginary.' },
  { thread: 'EF5', tier: 'developing', descriptor: 'Identifies assumptions in own and others\' thinking. Evaluates evidence before accepting. Considers alternative explanations. Distinguishes strong and weak reasons. Asks probing questions.' },
  { thread: 'EF5', tier: 'demonstrating', descriptor: 'Analyses complex issues from multiple perspectives. Identifies logical fallacies and weak reasoning. Synthesises information from multiple sources. Evaluates quality and relevance of evidence. Forms and defends positions.' },

  // EF7 — Metacognition & Reflective Practice
  { thread: 'EF7', tier: 'emerging', descriptor: 'Responds to "What did you learn?" with specific answers. Identifies activities they find easy or hard. Shows awareness that practice improves performance. Accepts feedback.' },
  { thread: 'EF7', tier: 'developing', descriptor: 'Describes strategies they use for learning. Identifies what they understand and what they\'re confused about. Adjusts approach when not working. Reflects on work and identifies what to do differently. Seeks feedback.' },
  { thread: 'EF7', tier: 'demonstrating', descriptor: 'Monitors own understanding in real-time. Selects and applies strategies deliberately for different tasks. Sets personal learning goals and tracks progress. Provides constructive feedback to others. Articulates personal learning philosophy.' },

  // PS3 — Self-Regulation & Wellbeing
  { thread: 'PS3', tier: 'emerging', descriptor: 'Names current emotion with support. Accepts comfort from trusted person. Transitions between activities with support. Identifies situations affecting emotions.' },
  { thread: 'PS3', tier: 'developing', descriptor: 'Uses strategies to manage big emotions (deep breaths, walking away, asking for space). Transitions with minimal support. Persists through frustration with less intervention. Describes strengths and areas being worked on.' },
  { thread: 'PS3', tier: 'demonstrating', descriptor: 'Self-monitors emotional state and applies strategies independently. Recovers from setbacks with resilience. Maintains balanced and realistic self-assessment. Advocates for own needs. Shows sustained positive engagement.' },

  // S1 — Scientific Inquiry
  { thread: 'S1', tier: 'emerging', descriptor: 'Asks "what" and "why" questions about natural phenomena. Explores objects using senses. Notices changes in environment. Describes observations using everyday language.' },
  { thread: 'S1', tier: 'developing', descriptor: 'Poses questions that can be investigated. Makes predictions before testing. Follows investigation steps and records observations. Uses informal measurements. Describes results and compares with predictions.' },
  { thread: 'S1', tier: 'demonstrating', descriptor: 'Plans investigations with identified variables (change, measure, keep same). Records data systematically in tables/diagrams. Analyses patterns and draws conclusions. Evaluates fairness of investigation. Suggests improvements.' },

  // S5 — Scientific Observation
  { thread: 'S5', tier: 'emerging', descriptor: 'Slows down to look when reminded. Points out single detail. Returns to look again. Asks "what\'s that?" about unexpected things.' },
  { thread: 'S5', tier: 'developing', descriptor: 'Slows down without reminder. Notices changes over time. Compares similar things and identifies differences. Uses tools (magnifier, binoculars) effectively. Describes multiple details.' },
  { thread: 'S5', tier: 'demonstrating', descriptor: 'Records observations systematically (journal, diagram, photo with notes). Distinguishes observed from interpreted. Notices patterns across observations. Designs observation protocols. Uses precise language.' },
];

/** Canonical DLO id for a thread+tier. */
export function dloId(thread: string, tier: DloTier): string {
  return `dlo.${thread}.${tier}`;
}

/**
 * Build the in-memory shape `getValidDlos()` returns, from this fixture.
 * Used by the eval harness to prime the dlo-cache without hitting Sanity.
 */
export function buildDloCacheData(): {
  ids: Set<string>;
  tierById: Map<string, DloTier>;
  descriptorById: Map<string, string>;
} {
  const ids = new Set<string>();
  const tierById = new Map<string, DloTier>();
  const descriptorById = new Map<string, string>();
  for (const d of GOLDEN_DLO_DESCRIPTORS) {
    const id = dloId(d.thread, d.tier);
    ids.add(id);
    tierById.set(id, d.tier);
    descriptorById.set(id, d.descriptor);
  }
  return { ids, tierById, descriptorById };
}
