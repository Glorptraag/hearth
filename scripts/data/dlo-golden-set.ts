/**
 * Golden set for the DLO mapping eval harness (WS-3).
 *
 * 15 synthetic entries spanning thin/rich text, single/multi-child, and
 * with/without sourceActivityIds. Gold labels are hand-authored and grounded
 * in the descriptor text from docs/hearth-capability-dlo-reference.md.
 *
 * Gold rationale convention: cite the specific descriptor phrase that
 * justifies the mapping so a reviewer can validate against the source doc.
 *
 * NOTE FOR DREW: These gold labels need your review before they are treated
 * as a hard gate. They are grounded in the reference doc but the tier
 * boundary calls (e.g. developing vs demonstrating) are editorial judgements
 * that you should confirm against your pilot observations. Flag is in
 * docs/audits/dlo-mapping-eval-baseline.md.
 */

export type GoldenChildRecord = {
  name: string;
  ageYears: number;
};

export type GoldenEntry = {
  id: string;
  title: string;
  description: string;
  childRecords: GoldenChildRecord[];
  sourceActivityIds: string[];
  activeThreads: Record<string, string[]>;
  expected_dlo_ids: string[];
  expected_tiers: Record<string, 'emerging' | 'developing' | 'demonstrating'>;
  notes: string;
};

export const GOLDEN_SET: GoldenEntry[] = [
  // ─── Thin entries — expect [] or minimal ──────────────────────────────────

  {
    id: 'gs-01-thin',
    title: 'Emma counted today',
    description: 'Emma counted to 20.',
    childRecords: [{ name: 'Emma', ageYears: 5 }],
    sourceActivityIds: [],
    activeThreads: { Emma: [] },
    expected_dlo_ids: [],
    expected_tiers: {},
    notes:
      'Fewer than 20 words — rule says minimal mappings with low confidence. ' +
      'Even if M1.emerging fires, confidence should be < 0.4 and we expect nothing above the threshold.',
  },

  {
    id: 'gs-02-thin-multi',
    title: 'Kids outside',
    description: 'Kids played outside for an hour.',
    childRecords: [
      { name: 'Jake', ageYears: 7 },
      { name: 'Lily', ageYears: 9 },
    ],
    sourceActivityIds: [],
    activeThreads: { Jake: [], Lily: [] },
    expected_dlo_ids: [],
    expected_tiers: {},
    notes: 'Ultra-thin. Physical activity implied but zero observational detail — no DLO warranted.',
  },

  // ─── Number sense ─────────────────────────────────────────────────────────

  {
    id: 'gs-03-number-sense-emerging',
    title: 'Counting and sorting buttons',
    description:
      'Maya sorted buttons into groups and counted each pile carefully, touching each one. She got to 12 and said "that pile has MORE". She also figured out that five red and three blue gave her eight total by counting all of them.',
    childRecords: [{ name: 'Maya', ageYears: 4 }],
    sourceActivityIds: [],
    activeThreads: { Maya: [] },
    expected_dlo_ids: ['dlo.M1.emerging', 'dlo.M2.emerging'],
    expected_tiers: { 'dlo.M1.emerging': 'emerging', 'dlo.M2.emerging': 'emerging' },
    notes:
      'M1.emerging: "Counts objects with one-to-one correspondence. Compares two groups (more/fewer)." ' +
      'M2.emerging: "Combines two groups and counts total. Uses concrete materials for addition/subtraction."',
  },

  {
    id: 'gs-04-number-sense-developing',
    title: 'Skip counting and place value',
    description:
      'Oscar practised skip counting by 2s and 5s to 100. He then explained to me that 47 means "four tens and seven ones" and ordered the numbers 23, 45, 12, 67 on his whiteboard number line without help.',
    childRecords: [{ name: 'Oscar', ageYears: 6 }],
    sourceActivityIds: [],
    activeThreads: { Oscar: ['M1'] },
    expected_dlo_ids: ['dlo.M1.developing'],
    expected_tiers: { 'dlo.M1.developing': 'developing' },
    notes:
      'M1.developing: "Uses skip counting (2s, 5s, 10s) purposefully. Understands tens and ones. Orders numbers on number line."',
  },

  // ─── Operations ───────────────────────────────────────────────────────────

  {
    id: 'gs-05-operations-demonstrating',
    title: 'Multi-step word problems',
    description:
      'Isabelle solved three multi-step word problems involving all four operations. She estimated first each time ("should be around 200"), then computed, then checked reasonableness. Chose the most efficient strategy for each — mental maths for one, column method for another.',
    childRecords: [{ name: 'Isabelle', ageYears: 10 }],
    sourceActivityIds: [],
    activeThreads: { Isabelle: ['M1', 'M2'] },
    expected_dlo_ids: ['dlo.M2.demonstrating', 'dlo.M9.developing'],
    expected_tiers: {
      'dlo.M2.demonstrating': 'demonstrating',
      'dlo.M9.developing': 'developing',
    },
    notes:
      'M2.demonstrating: "Computes fluently with all four operations. Estimates before computing. Selects most efficient strategy." ' +
      'M9.developing: "Tries more than one strategy when stuck. Checks answer makes sense in real-world context."',
  },

  // ─── Reading comprehension ────────────────────────────────────────────────

  {
    id: 'gs-06-reading-comp-developing',
    title: 'Predicting and retelling Charlotte\'s Web',
    description:
      "Sophie spent 30 minutes reading Charlotte's Web independently. Before each chapter she predicted what would happen based on clues in the chapter title and last paragraph. After finishing she retold the whole story in sequence — beginning, middle, and end — and connected Wilbur's fear of death to something she'd felt before.",
    childRecords: [{ name: 'Sophie', ageYears: 8 }],
    sourceActivityIds: [],
    activeThreads: { Sophie: ['L3'] },
    expected_dlo_ids: ['dlo.L3.developing', 'dlo.L9.developing'],
    expected_tiers: {
      'dlo.L3.developing': 'developing',
      'dlo.L9.developing': 'developing',
    },
    notes:
      'L3.developing: "Predicts what happens next based on clues. Retells story including beginning, middle, end. Makes simple inferences." ' +
      'L9.developing: "Explains why they like or dislike text with reference to specific parts. Identifies with characters and discusses motivations."',
  },

  // ─── Written expression ───────────────────────────────────────────────────

  {
    id: 'gs-07-written-expression-demonstrating',
    title: 'Dragon story with planning and revision',
    description:
      'Ethan planned a dragon story using a mind map, wrote three paragraphs with a clear beginning, conflict, and resolution, and revised the ending twice because "it felt too easy". He varied his sentence lengths deliberately — mixing short punchy sentences with longer descriptive ones. Worked for 90 minutes without stopping.',
    childRecords: [{ name: 'Ethan', ageYears: 11 }],
    sourceActivityIds: [],
    activeThreads: { Ethan: ['L5'] },
    expected_dlo_ids: ['dlo.L5.demonstrating'],
    expected_tiers: { 'dlo.L5.demonstrating': 'demonstrating' },
    notes:
      'L5.demonstrating: "Plans before writing using notes, diagrams, or outlines. Writes sustained texts with clear structure. Varies sentence length and type for effect. Edits and revises for clarity."',
  },

  // ─── Oral communication ───────────────────────────────────────────────────

  {
    id: 'gs-08-oral-multi-child',
    title: 'Family debate — pets',
    description:
      "Jake and Lily had a structured debate about whether dogs or cats make better pets. Jake gave three reasons and listened while Lily spoke, then countered each of her points specifically. Lily adjusted her argument mid-debate when she heard a point she hadn't considered. Both sustained the conversation for 20 minutes.",
    childRecords: [
      { name: 'Jake', ageYears: 7 },
      { name: 'Lily', ageYears: 9 },
    ],
    sourceActivityIds: [],
    activeThreads: { Jake: ['L1'], Lily: ['L1'] },
    expected_dlo_ids: ['dlo.L1.developing', 'dlo.L8.developing'],
    expected_tiers: {
      'dlo.L1.developing': 'developing',
      'dlo.L8.developing': 'developing',
    },
    notes:
      'L1.developing: "Asks clarifying questions. Sustains conversation by building on what others say." ' +
      'L8.developing: "Gives multiple reasons to support opinion. Considers counter-argument when prompted." ' +
      'Both children. Haiku should produce per_child_signals for Jake and Lily.',
  },

  // ─── Scientific inquiry ───────────────────────────────────────────────────

  {
    id: 'gs-09-scientific-inquiry-demonstrating',
    title: 'Paper towel absorption experiment',
    description:
      'Zoe designed an experiment to test which of three paper towel brands absorbs water fastest. She wrote a hypothesis first, set up identical test conditions for each brand, recorded results in a table, and wrote a conclusion explaining which brand performed best and why, noting one confounding variable she noticed (towel thickness). Worked entirely independently for 45 minutes.',
    childRecords: [{ name: 'Zoe', ageYears: 12 }],
    sourceActivityIds: [],
    activeThreads: { Zoe: ['S1'] },
    expected_dlo_ids: ['dlo.S1.demonstrating'],
    expected_tiers: { 'dlo.S1.demonstrating': 'demonstrating' },
    notes:
      'S1 descriptor not shown in reference snippet but inferred as Scientific Inquiry — full inquiry cycle: hypothesis, controlled test, data collection, conclusion with variable identification.',
  },

  // ─── Historical thinking ──────────────────────────────────────────────────

  {
    id: 'gs-10-historical-emerging',
    title: 'Family photos — old and new',
    description:
      'Liam looked at old family photos from great-grandma\'s childhood and sorted them into "old" and "new". He noticed the clothes looked different and that everything was black and white. He asked why people looked so serious and wanted to know what great-grandma\'s house looked like back then.',
    childRecords: [{ name: 'Liam', ageYears: 5 }],
    sourceActivityIds: [],
    activeThreads: { Liam: [] },
    expected_dlo_ids: ['dlo.H1.emerging'],
    expected_tiers: { 'dlo.H1.emerging': 'emerging' },
    notes:
      'H1.emerging: "Sequences personal events. Identifies things as \'old\' or \'new\'. Shows interest in family stories. Asks questions about the past."',
  },

  // ─── Metacognition ────────────────────────────────────────────────────────

  {
    id: 'gs-11-metacognition-demonstrating',
    title: 'Self-directed remediation — long division',
    description:
      'After struggling with long division for 20 minutes, Isla stopped herself and said "I think my multiplication tables aren\'t solid enough — that\'s the real problem." She made herself flash cards, practised for 20 minutes without prompting, then returned to the division problems and completed them. Later told me "I should check the thing underneath when I\'m stuck, not just try harder on the hard thing."',
    childRecords: [{ name: 'Isla', ageYears: 10 }],
    sourceActivityIds: [],
    activeThreads: { Isla: ['EF7', 'M2'] },
    expected_dlo_ids: ['dlo.EF7.demonstrating', 'dlo.M2.developing'],
    expected_tiers: {
      'dlo.EF7.demonstrating': 'demonstrating',
      'dlo.M2.developing': 'developing',
    },
    notes:
      'EF7.demonstrating: "Monitors own understanding in real-time. Selects and applies strategies deliberately for different tasks." ' +
      'M2.developing: "Recalls basic addition and subtraction facts" — flash card remediation shows this is the working tier.',
  },

  // ─── Self-regulation ─────────────────────────────────────────────────────

  {
    id: 'gs-12-self-regulation-developing',
    title: 'Ruby manages frustration',
    description:
      'Ruby got very frustrated with her maths and said she wanted to throw the book. She recognised she was too dysregulated to keep going, told me "I need a minute", took herself outside for five minutes, came back calm and completed the remaining problems. She has started doing this fairly consistently.',
    childRecords: [{ name: 'Ruby', ageYears: 8 }],
    sourceActivityIds: [],
    activeThreads: { Ruby: ['PS3'] },
    expected_dlo_ids: ['dlo.PS3.developing'],
    expected_tiers: { 'dlo.PS3.developing': 'developing' },
    notes:
      'PS3.developing: "Uses strategies to manage big emotions (deep breaths, walking away, asking for space). Transitions with minimal support."',
  },

  // ─── Multi-subject rich entry ─────────────────────────────────────────────

  {
    id: 'gs-13-rich-multi-subject',
    title: 'Museum — Ancient Egypt deep dive',
    description:
      'Oliver spent 2+ hours at the Ancient Egypt exhibit. He took notes on index cards and asked the guide "how do historians know this if no one was alive then?" — then followed up by comparing what a diary (primary) versus the guide\'s commentary (secondary) told him about daily life. At home he wrote a one-page summary distinguishing what was fact from what was interpretation, citing two specific artefacts.',
    childRecords: [{ name: 'Oliver', ageYears: 12 }],
    sourceActivityIds: [],
    activeThreads: { Oliver: ['H1', 'H2'] },
    expected_dlo_ids: ['dlo.H1.developing', 'dlo.H2.developing'],
    expected_tiers: {
      'dlo.H1.developing': 'developing',
      'dlo.H2.developing': 'developing',
    },
    notes:
      'H1.developing: "Describes how daily life changed over time. Identifies significant events or people." ' +
      'H2.developing: "Distinguishes primary from secondary sources. Identifies author/creator and their perspective. Compares accounts and notices differences. Asks \'How do we know?\'"',
  },

  // ─── sourceActivityIds present ────────────────────────────────────────────

  {
    id: 'gs-14-with-activity-id',
    title: 'Nature walk and map-making',
    description:
      'Followed the Starter Pack nature walk activity. We walked the local park trail and Nadia drew a simple map of the route with landmarks labelled (big tree, creek, picnic table). She noticed which areas looked "worn out" from people walking on them and asked why the path was muddy near the creek.',
    childRecords: [{ name: 'Nadia', ageYears: 7 }],
    sourceActivityIds: ['activity-nature-walk-01'],
    activeThreads: { Nadia: ['H3', 'S5'] },
    expected_dlo_ids: ['dlo.H3.developing', 'dlo.S5.emerging'],
    expected_tiers: { 'dlo.H3.developing': 'developing', 'dlo.S5.emerging': 'emerging' },
    notes:
      'H3.developing: "Creates and interprets simple maps with keys. Describes how people use and change environment." ' +
      'S5 = Scientific Observation — noticing environmental detail and asking causal question.',
  },

  // ─── Critical thinking ────────────────────────────────────────────────────

  {
    id: 'gs-15-critical-thinking',
    title: 'Evaluating news sources — climate',
    description:
      'Oliver read a newspaper article about climate change and a pamphlet arguing against solar panel subsidies. He explained which source he found more reliable and why, identified two examples of emotive language in the pamphlet ("green zealots", "job-killing policies"), and noted the newspaper cited a university study while the pamphlet had no references. Said he needed to check whether the university study was real.',
    childRecords: [{ name: 'Oliver', ageYears: 12 }],
    sourceActivityIds: [],
    activeThreads: { Oliver: ['EF5', 'L3', 'H2'] },
    expected_dlo_ids: ['dlo.EF5.developing', 'dlo.L3.demonstrating'],
    expected_tiers: {
      'dlo.EF5.developing': 'developing',
      'dlo.L3.demonstrating': 'demonstrating',
    },
    notes:
      'EF5.developing: "Evaluates evidence before accepting. Identifies assumptions. Asks probing questions." ' +
      'L3.demonstrating: "Identifies author purpose or perspective. Distinguishes fact from opinion. Uses evidence to support interpretation."',
  },
];
