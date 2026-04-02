import { createCapabilityThread } from '@/lib/sanity/mutations';

interface ThreadData {
  id: string;
  title: string;
  domain: 'english' | 'mathematics' | 'science' | 'hass' | 'hpe' | 'arts' | 'languages' | 'technologies';
  description: string;
  dlos: Array<{
    title: string;
    tier: 'emerging' | 'developing' | 'demonstrating';
    description: string;
  }>;
  prerequisites?: string[];
  enables?: string[];
  curriculumCodes?: string[];
}

const THREADS: ThreadData[] = [
  // ─────────────────────────────────────────────────────────────────
  // DOMAIN 1: LANGUAGE & LITERACY (9 threads)
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'L1',
    title: 'Oral Communication & Listening',
    domain: 'english',
    description:
      'The child can listen actively, respond meaningfully in conversation, share ideas clearly, and adapt their communication to different situations and audiences.',
    dlos: [
      {
        title: 'Listens when spoken to directly and responds with relevant contributions',
        tier: 'emerging',
        description: 'Responds with a relevant word or phrase. Takes turns with prompting. Follows simple one-two step instructions.',
      },
      {
        title: 'Initiates conversation and asks clarifying questions',
        tier: 'developing',
        description:
          'Initiates conversation about experiences without prompting. Asks clarifying questions. Retells events in sequence. Adjusts volume/tone for different settings.',
      },
      {
        title: 'Adapts language for different audiences and sustains multi-turn conversation',
        tier: 'demonstrating',
        description:
          'Presents ideas to groups with confidence. Adapts language for different audiences. Sustains conversation by building on what others say. Uses specific vocabulary from learning contexts.',
      },
    ],
    enables: ['L3', 'L5', 'L8', 'PS1', 'C1', 'C3', 'C4'],
    curriculumCodes: [
      'AC9EFLY01',
      'AC9EFLY02',
      'AC9E1LY01',
      'AC9E1LY02',
      'AC9E2LY01',
      'AC9E2LY02',
      'AC9E3LY01',
      'AC9E3LY02',
      'AC9E4LY01',
      'AC9E4LY02',
      'AC9E5LY01',
      'AC9E5LY02',
      'AC9E6LY01',
      'AC9E6LY02',
    ],
  },

  {
    id: 'L2',
    title: 'Phonological Awareness & Decoding',
    domain: 'english',
    description:
      'The child understands that spoken words are made up of sounds, can manipulate those sounds, and uses this knowledge to decode (read) and encode (spell) words.',
    dlos: [
      {
        title: 'Recognises rhyming words and identifies first sounds',
        tier: 'emerging',
        description: 'Recognises rhyming words in songs. Claps syllables. Identifies first sound in words. Recognises some letters by name.',
      },
      {
        title: 'Blends phonemes and reads high-frequency words',
        tier: 'developing',
        description:
          'Blends 2-3 phonemes to read CVC words. Segments words into sounds. Matches letters to sounds. Reads familiar high-frequency words. Self-corrects when decoded word does not make sense.',
      },
      {
        title: 'Reads unfamiliar words fluently using phonics and patterns',
        tier: 'demonstrating',
        description:
          'Reads unfamiliar words by applying phonics fluently. Handles consonant blends, digraphs, vowel patterns. Reads with phrasing and expression. Recognises and reads multisyllabic words.',
      },
    ],
    prerequisites: ['L1'],
    enables: ['L3', 'L4', 'L6'],
    curriculumCodes: [
      'AC9EFLY09',
      'AC9EFLY10',
      'AC9E1LY09',
      'AC9E1LY10',
      'AC9E2LY09',
      'AC9E2LY10',
      'AC9E3LY09',
      'AC9E3LY10',
      'AC9E4LY09',
      'AC9E4LY10',
    ],
  },

  {
    id: 'L3',
    title: 'Reading Comprehension',
    domain: 'english',
    description:
      'The child makes meaning from texts — understanding what is stated explicitly, making inferences, connecting ideas across a text, and bringing their own experience to interpretation.',
    dlos: [
      {
        title: 'Points to pictures and answers simple comprehension questions',
        tier: 'emerging',
        description:
          'Points to pictures that match text. Answers "what happened?" questions. Makes connections to personal experience. Identifies main characters.',
      },
      {
        title: 'Predicts and retells with beginning, middle, end; makes simple inferences',
        tier: 'developing',
        description:
          'Predicts what happens next based on clues. Retells story including beginning, middle, end. Identifies main idea in informational text. Makes simple inferences. Asks questions about unfamiliar words.',
      },
      {
        title: 'Compares texts, identifies author purpose, and uses text evidence for interpretation',
        tier: 'demonstrating',
        description:
          'Compares ideas across multiple texts. Identifies author purpose or perspective. Distinguishes fact from opinion. Uses evidence to support interpretation. Monitors own comprehension and uses strategies when meaning breaks down.',
      },
    ],
    prerequisites: ['L1', 'L2'],
    enables: ['L5', 'L7', 'L8', 'H1', 'H2', 'EF5'],
    curriculumCodes: [
      'AC9EFLY04',
      'AC9EFLY05',
      'AC9E1LY04',
      'AC9E1LY05',
      'AC9E2LY04',
      'AC9E2LY05',
      'AC9E3LY04',
      'AC9E3LY05',
      'AC9E4LY04',
      'AC9E4LY05',
      'AC9E5LY04',
      'AC9E5LY05',
      'AC9E6LY04',
      'AC9E6LY05',
    ],
  },

  {
    id: 'L4',
    title: 'Spelling & Word Knowledge',
    domain: 'english',
    description:
      'The child understands how English words are structured — morphemes, etymology, spelling patterns — and applies this knowledge when writing.',
    dlos: [
      {
        title: 'Uses plausible letter choices and recognises high-frequency words',
        tier: 'emerging',
        description:
          'Represents sounds in words with plausible letter choices (invented spelling). Spells some high-frequency words. Recognises when word "doesn\'t look right".',
      },
      {
        title: 'Applies spelling patterns and uses morphemic knowledge',
        tier: 'developing',
        description:
          'Applies common spelling patterns consistently. Uses word families to spell related words. Spells most high-frequency words correctly. Begins to use morphemic knowledge (adding -ed, -ing, -s). Uses references to check spelling.',
      },
      {
        title: 'Applies prefixes, suffixes, root words, and uses etymology',
        tier: 'demonstrating',
        description:
          'Applies prefixes, suffixes, and root words. Spells words with complex patterns. Self-edits for spelling. Uses etymological knowledge. Demonstrates precise word choice in writing.',
      },
    ],
    prerequisites: ['L2'],
    enables: ['L5', 'L6'],
    curriculumCodes: ['AC9EFLA03', 'AC9E1LA03', 'AC9E2LA03', 'AC9E3LA03', 'AC9E4LA03', 'AC9E5LA03', 'AC9E6LA03'],
  },

  {
    id: 'L5',
    title: 'Written Expression',
    domain: 'english',
    description:
      'The child communicates ideas, experiences, and arguments in writing with increasing control over structure, voice, and audience awareness.',
    dlos: [
      {
        title: 'Dictates ideas and writes simple messages with capital letters and full stops',
        tier: 'emerging',
        description:
          'Dictates ideas for an adult to write down. Writes or draws to convey simple message. Attempts sentences with capitals and full stops. Labels pictures or diagrams.',
      },
      {
        title: 'Writes multiple connected sentences with beginning, middle, end; uses descriptive language',
        tier: 'developing',
        description:
          'Writes multiple connected sentences on topic. Includes beginning, middle, end. Uses descriptive language (adjectives, simple adverbs). Writes for different purposes when prompted. Re-reads and makes simple changes.',
      },
      {
        title: 'Plans before writing; uses clear structure, varied sentences, and audience awareness',
        tier: 'demonstrating',
        description:
          'Plans before writing using notes, diagrams, or outlines. Writes sustained texts with clear structure and paragraphing. Varies sentence length and type for effect. Shows audience awareness. Edits and revises for clarity.',
      },
    ],
    prerequisites: ['L1', 'L2', 'L6'],
    enables: ['L7', 'L8'],
    curriculumCodes: [
      'AC9EFLY06',
      'AC9E1LY06',
      'AC9E2LY06',
      'AC9E3LY06',
      'AC9E4LY06',
      'AC9E5LY06',
      'AC9E6LY06',
    ],
  },

  {
    id: 'L6',
    title: 'Handwriting & Text Production',
    domain: 'english',
    description:
      'The child produces legible written text — whether through handwriting, typing, or other tools — with increasing fluency and automaticity.',
    dlos: [
      {
        title: 'Holds writing tool with functional grip and forms recognisable letters',
        tier: 'emerging',
        description:
          'Holds writing tool with functional grip. Forms recognisable letters (may be inconsistent). Writes own name. Distinguishes between drawing and writing.',
      },
      {
        title: 'Forms letters correctly with consistent size and spacing; writes fluently',
        tier: 'developing',
        description:
          'Forms most letters correctly with consistent size. Writes on lines with appropriate spacing. Produces legible text others can read. Writes with sufficient fluency that ideas aren\'t lost. Begins to use joined/cursive writing or efficient keyboard skills.',
      },
      {
        title: 'Produces text fluently; writing tool does not limit expression',
        tier: 'demonstrating',
        description:
          'Produces text fluently in chosen mode (handwriting or typing). Writing tool no longer limits complexity or length of expression. Adapts presentation for purpose. Uses digital tools for text production when appropriate.',
      },
    ],
    prerequisites: ['P2'],
    enables: ['L5'],
    curriculumCodes: [
      'AC9EFLY08',
      'AC9E1LY08',
      'AC9E2LY08',
      'AC9E3LY08',
      'AC9E4LY08',
    ],
  },

  {
    id: 'L7',
    title: 'Text Structure & Purpose',
    domain: 'english',
    description:
      'The child understands that different text types are structured differently depending on their purpose, and can both recognise and use these structures.',
    dlos: [
      {
        title: 'Recognises difference between story and information text',
        tier: 'emerging',
        description:
          'Recognises difference between story and information text. Identifies basic text features (title, pictures, page numbers). Understands texts are written for different reasons.',
      },
      {
        title: 'Names and recognises common text types; uses appropriate structure',
        tier: 'developing',
        description:
          'Names and recognises common text types (narrative, procedure, report). Uses appropriate structure when writing familiar text type. Identifies text features (headings, captions, diagrams). Understands purpose of contents pages and glossaries.',
      },
      {
        title: 'Explains how structure supports purpose; chooses and creates appropriate text types',
        tier: 'demonstrating',
        description:
          'Explains how structure supports author purpose. Chooses appropriate text type for given need. Analyses how language features differ across text types. Creates texts combining or adapting structures for effect. Evaluates whether structure serves purpose.',
      },
    ],
    prerequisites: ['L3', 'L5'],
    enables: ['L8', 'H2'],
    curriculumCodes: [
      'AC9E1LA01',
      'AC9E1LA02',
      'AC9E2LA01',
      'AC9E2LA02',
      'AC9E3LA01',
      'AC9E3LA02',
      'AC9E4LA01',
      'AC9E4LA02',
      'AC9E5LA01',
      'AC9E5LA02',
      'AC9E6LA01',
      'AC9E6LA02',
    ],
  },

  {
    id: 'L8',
    title: 'Persuasion & Argument',
    domain: 'english',
    description:
      'The child can construct and evaluate arguments — identifying claims, supporting evidence, and rhetorical strategies in others\' texts and their own.',
    dlos: [
      {
        title: 'Expresses preference with simple reason and recognises persuasive attempts',
        tier: 'emerging',
        description:
          'Expresses preference with simple reason ("I think cats are better because they\'re soft"). Recognises when someone is trying to convince them. Understands people can have different opinions.',
      },
      {
        title: 'Gives multiple reasons and identifies persuasive techniques',
        tier: 'developing',
        description:
          'Gives multiple reasons to support opinion. Identifies persuasive techniques in advertisements. Writes simple persuasive text with clear position and reasons. Considers counter-argument when prompted.',
      },
      {
        title: 'Constructs sustained arguments with evidence and evaluates argument strength',
        tier: 'demonstrating',
        description:
          'Constructs sustained arguments with evidence and reasoning. Evaluates strength of evidence. Identifies bias, emotive language, rhetorical strategies. Acknowledges counter-arguments and addresses them. Distinguishes fact, opinion, reasoned judgment.',
      },
    ],
    prerequisites: ['L3', 'L5', 'L7', 'EF5'],
    enables: ['H2', 'EF5'],
    curriculumCodes: [
      'AC9E3LE03',
      'AC9E4LE03',
      'AC9E5LE03',
      'AC9E6LE03',
      'AC9E5LA06',
      'AC9E6LA06',
    ],
  },

  {
    id: 'L9',
    title: 'Literary Response & Appreciation',
    domain: 'english',
    description:
      'The child engages with literature — responding personally, aesthetically, and critically to stories, poems, and other literary forms.',
    dlos: [
      {
        title: 'Shows enjoyment of stories and has favourite books and characters',
        tier: 'emerging',
        description:
          'Shows enjoyment of stories being read aloud. Has favourite books, characters, or story types. Responds with personal reaction. Recognises story elements (character, setting, problem).',
      },
      {
        title: 'Explains why they like a text; identifies characters and literary devices',
        tier: 'developing',
        description:
          'Explains why they like or dislike text with reference to specific parts. Identifies with characters and discusses motivations. Recognises literary devices when pointed out. Compares texts by same author or on same topic. Recommends books with reasons.',
      },
      {
        title: 'Discusses themes, analyses author choices, and evaluates cultural perspectives',
        tier: 'demonstrating',
        description:
          'Discusses themes and ideas across multiple texts. Analyses how authors create effect through language choices. Responds to literature with personal interpretation and evidence. Appreciates literary forms and conventions. Evaluates how texts reflect different cultural or historical perspectives.',
      },
    ],
    prerequisites: ['L1', 'L3'],
    enables: ['C1', 'C3'],
    curriculumCodes: [
      'AC9EFLE01',
      'AC9EFLE02',
      'AC9E1LE01',
      'AC9E1LE02',
      'AC9E2LE01',
      'AC9E2LE02',
      'AC9E3LE01',
      'AC9E3LE02',
      'AC9E4LE01',
      'AC9E4LE02',
      'AC9E5LE01',
      'AC9E5LE02',
      'AC9E6LE01',
      'AC9E6LE02',
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // DOMAIN 2: MATHEMATICAL THINKING (9 threads)
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'M1',
    title: 'Number Sense & Place Value',
    domain: 'mathematics',
    description:
      'The child has an intuitive understanding of quantity, can compose and decompose numbers, understands the structure of our number system, and can work flexibly with numbers.',
    dlos: [
      {
        title: 'Counts with one-to-one correspondence and recognises numerals',
        tier: 'emerging',
        description:
          'Counts objects with one-to-one correspondence. Recognises last number counted tells "how many". Compares two groups (more/fewer). Recognises numerals. Understands numbers come in fixed order.',
      },
      {
        title: 'Counts forwards/backwards; uses skip counting; understands tens and ones',
        tier: 'developing',
        description:
          'Counts forwards and backwards from any starting point. Uses skip counting (2s, 5s, 10s) purposefully. Understands tens and ones (24 = 2 tens + 4 ones). Orders numbers on number line. Estimates quantities.',
      },
      {
        title: 'Composes/decomposes numbers flexibly; understands place value; applies number sense',
        tier: 'demonstrating',
        description:
          'Composes and decomposes numbers flexibly (38 = 30+8 = 20+18). Understands place value across hundreds, thousands. Compares and orders large numbers. Rounds appropriately. Applies number sense to check reasonableness.',
      },
    ],
    enables: ['M2', 'M3', 'M4', 'M5', 'M7'],
    curriculumCodes: [
      'AC9MFN01',
      'AC9MFN02',
      'AC9MFN03',
      'AC9M1N01',
      'AC9M1N02',
      'AC9M2N01',
      'AC9M2N02',
      'AC9M3N01',
      'AC9M4N01',
      'AC9M5N01',
      'AC9M6N01',
    ],
  },

  {
    id: 'M2',
    title: 'Operations & Computation',
    domain: 'mathematics',
    description:
      'The child understands the four operations (addition, subtraction, multiplication, division), their relationships to each other, and can compute fluently using a range of strategies.',
    dlos: [
      {
        title: 'Combines and removes groups; uses concrete materials for operations',
        tier: 'emerging',
        description:
          'Combines two groups and counts total. Removes objects and counts remainder. Uses concrete materials for addition/subtraction. Recognises "putting together" and "taking away". Shares equally between two people.',
      },
      {
        title: 'Uses mental strategies; recalls facts; understands multiplication and inverse relationships',
        tier: 'developing',
        description:
          'Uses mental strategies (counting on, doubles, making 10). Recalls basic addition and subtraction facts. Understands multiplication as repeated groups. Uses arrays, skip counting for multiplication. Recognises inverse relationship.',
      },
      {
        title: 'Computes fluently with all operations; applies to multi-step problems',
        tier: 'demonstrating',
        description:
          'Computes fluently with all four operations using efficient strategies. Knows multiplication facts and uses them for division. Applies operations to multi-step problems. Estimates before computing. Selects most efficient strategy.',
      },
    ],
    prerequisites: ['M1'],
    enables: ['M3', 'M4', 'M5', 'M7'],
    curriculumCodes: [
      'AC9MFN04',
      'AC9MFN05',
      'AC9M1N03',
      'AC9M1N04',
      'AC9M2N03',
      'AC9M2N04',
      'AC9M3N03',
      'AC9M3N04',
      'AC9M4N03',
      'AC9M4N04',
      'AC9M5N03',
      'AC9M5N04',
      'AC9M6N03',
      'AC9M6N04',
    ],
  },

  {
    id: 'M3',
    title: 'Fractional Thinking',
    domain: 'mathematics',
    description:
      'The child understands parts and wholes — fractions, decimals, and percentages as different representations of the same idea, and can operate with them in practical contexts.',
    dlos: [
      {
        title: 'Understands "half" as equal parts; identifies halves and quarters',
        tier: 'emerging',
        description:
          'Understands "half" as splitting into two equal parts. Identifies whether share is fair. Recognises halves and quarters in everyday contexts. Uses language of parts.',
      },
      {
        title: 'Names unit fractions; compares and orders; identifies equivalent fractions',
        tier: 'developing',
        description:
          'Names and recognises common unit fractions (½, ⅓, ¼, ⅕). Understands fractions represent equal parts. Locates simple fractions on number line. Compares and orders unit fractions. Connects fractions to division.',
      },
      {
        title: 'Adds/subtracts fractions; connects fractions, decimals, percentages',
        tier: 'demonstrating',
        description:
          'Adds and subtracts fractions with related denominators. Connects fractions, decimals, percentages. Uses fractions in measurement and data contexts. Compares and orders different denominators.',
      },
    ],
    prerequisites: ['M1', 'M2'],
    enables: ['M5', 'M4'],
    curriculumCodes: [
      'AC9M1N05',
      'AC9M2N05',
      'AC9M3N02',
      'AC9M4N02',
      'AC9M5N02',
      'AC9M5N05',
      'AC9M6N02',
      'AC9M6N05',
    ],
  },

  {
    id: 'M4',
    title: 'Algebraic Thinking & Patterns',
    domain: 'mathematics',
    description:
      'The child recognises, describes, and extends patterns; understands the concept of equality and uses symbols to represent unknown quantities; thinks about relationships between quantities.',
    dlos: [
      {
        title: 'Copies simple patterns; identifies what comes next',
        tier: 'emerging',
        description: 'Copies simple repeating pattern. Identifies what comes next. Sorts objects by one attribute. Recognises patterns in daily routines.',
      },
      {
        title: 'Creates own patterns; describes growing patterns; understands equals sign',
        tier: 'developing',
        description:
          'Creates own patterns using multiple attributes. Identifies and describes growing patterns (1, 3, 5, 7). Understands equals sign as "is the same as". Finds missing numbers in equations. Describes rule for pattern.',
      },
      {
        title: 'Generates complex patterns; uses symbols for unknowns; understands functional relationships',
        tier: 'demonstrating',
        description:
          'Generates complex patterns and describes rule. Uses symbols or letters for unknowns. Understands and applies order of operations. Creates algorithms to solve problems. Identifies functional relationships.',
      },
    ],
    prerequisites: ['M1', 'M2'],
    enables: ['EF5', 'S1'],
    curriculumCodes: [
      'AC9MFA01',
      'AC9MFA02',
      'AC9M1A01',
      'AC9M1A02',
      'AC9M2A01',
      'AC9M2A02',
      'AC9M3A01',
      'AC9M3A02',
      'AC9M4A01',
      'AC9M4A02',
      'AC9M5A01',
      'AC9M5A02',
      'AC9M6A01',
      'AC9M6A02',
    ],
  },

  {
    id: 'M5',
    title: 'Measurement Sense',
    domain: 'mathematics',
    description:
      'The child understands measurable attributes (length, mass, capacity, time, temperature), can compare and quantify them using informal and formal units, and applies measurement in practical contexts.',
    dlos: [
      {
        title: 'Compares objects; uses informal measurement language',
        tier: 'emerging',
        description:
          'Compares two objects directly (longer/heavier). Uses informal measurement language (big, small, heavy, light). Sequences events in time. Recognises different tools measure different things.',
      },
      {
        title: 'Measures using informal units; understands need for standard units',
        tier: 'developing',
        description:
          'Measures using informal units (hand spans, cups) consistently. Understands need for standard units. Uses rulers, scales, measuring cups with increasing accuracy. Reads clocks (to half hour). Estimates measurements.',
      },
      {
        title: 'Measures accurately using metric units; converts between units; calculates area/volume',
        tier: 'demonstrating',
        description:
          'Measures accurately using standard metric units (cm, m, kg, g, mL, L). Converts between related units. Calculates perimeter, area, volume using formulas. Uses timetables, calculates elapsed time.',
      },
    ],
    prerequisites: ['M1', 'M2'],
    enables: ['M3', 'S3', 'M7'],
    curriculumCodes: [
      'AC9MFM01',
      'AC9MFM02',
      'AC9M1M01',
      'AC9M1M02',
      'AC9M1M03',
      'AC9M2M01',
      'AC9M2M02',
      'AC9M2M03',
      'AC9M2M04',
      'AC9M3M01',
      'AC9M3M02',
      'AC9M3M03',
      'AC9M4M01',
      'AC9M4M02',
      'AC9M4M03',
      'AC9M5M01',
      'AC9M5M02',
      'AC9M6M01',
      'AC9M6M02',
    ],
  },

  {
    id: 'M6',
    title: 'Spatial Reasoning & Geometry',
    domain: 'mathematics',
    description:
      'The child understands shape, position, movement, and transformation — they can visualise, describe, and manipulate objects in space.',
    dlos: [
      {
        title: 'Names basic 2D shapes; describes position; sorts shapes by attributes',
        tier: 'emerging',
        description: 'Names basic 2D shapes (circle, square, triangle). Describes position (next to, behind, above). Sorts shapes by simple attributes. Follows basic directional instructions.',
      },
      {
        title: 'Identifies and describes shape properties; recognises shapes in different orientations',
        tier: 'developing',
        description:
          'Identifies and describes properties of 2D and 3D shapes (faces, edges, corners). Recognises shapes regardless of orientation. Creates and interprets simple maps. Identifies lines of symmetry. Performs transformations.',
      },
      {
        title: 'Classifies shapes using properties; uses coordinate systems; visualises transformations',
        tier: 'demonstrating',
        description:
          'Classifies shapes using properties with reasoning. Uses coordinate system to describe position. Identifies and describes angle properties. Creates nets for 3D shapes. Visualises transformations mentally.',
      },
    ],
    enables: ['M5', 'P1', 'C5'],
    curriculumCodes: [
      'AC9MFSP01',
      'AC9MFSP02',
      'AC9M1SP01',
      'AC9M1SP02',
      'AC9M2SP01',
      'AC9M2SP02',
      'AC9M3SP01',
      'AC9M3SP02',
      'AC9M4SP01',
      'AC9M4SP02',
      'AC9M5SP01',
      'AC9M5SP02',
      'AC9M6SP01',
      'AC9M6SP02',
    ],
  },

  {
    id: 'M7',
    title: 'Data & Statistical Thinking',
    domain: 'mathematics',
    description:
      'The child can pose questions, collect and organise data, represent it in appropriate forms, and draw conclusions — understanding that data tells a story.',
    dlos: [
      {
        title: 'Sorts into categories; answers simple data questions',
        tier: 'emerging',
        description:
          'Sorts objects into categories and counts each. Answers simple questions about picture graph. Participates in surveys. Understands we can count and compare to learn.',
      },
      {
        title: 'Poses questions; collects and displays data; reads and interprets',
        tier: 'developing',
        description:
          'Poses own questions answerable with data. Collects data through observation, surveys, experiments. Creates simple displays (picture graphs, tally, bar graphs). Reads and interprets data. Identifies most/least common.',
      },
      {
        title: 'Selects appropriate display; uses statistics; identifies trends and draws conclusions',
        tier: 'demonstrating',
        description:
          'Selects appropriate data display for data type. Uses mean, median, mode, range. Identifies trends, outliers, patterns. Draws conclusions and makes predictions. Evaluates reliability of methods.',
      },
    ],
    prerequisites: ['M1', 'M2'],
    enables: ['S1', 'EF5', 'H4'],
    curriculumCodes: [
      'AC9MFST01',
      'AC9M1ST01',
      'AC9M2ST01',
      'AC9M3ST01',
      'AC9M3ST02',
      'AC9M4ST01',
      'AC9M4ST02',
      'AC9M5ST01',
      'AC9M5ST02',
      'AC9M6ST01',
      'AC9M6ST02',
    ],
  },

  {
    id: 'M8',
    title: 'Probability & Chance',
    domain: 'mathematics',
    description:
      'The child understands that some events are certain, some are impossible, and most fall somewhere in between — and can reason about likelihood using both intuition and mathematical tools.',
    dlos: [
      {
        title: 'Uses language of chance; identifies certain/possible/impossible',
        tier: 'emerging',
        description:
          'Uses language of chance (maybe, probably, definitely, no way). Identifies outcomes as certain, possible, impossible. Understands some things happen more often than others. Predicts simple outcomes.',
      },
      {
        title: 'Lists possible outcomes; describes likelihood on scale; conducts experiments',
        tier: 'developing',
        description:
          'Lists possible outcomes of simple chance events. Describes likelihood on scale (impossible to certain). Conducts simple experiments and records results. Compares expected and actual results.',
      },
      {
        title: 'Assigns numerical probabilities; compares theoretical and experimental',
        tier: 'demonstrating',
        description:
          'Assigns numerical probabilities (fractions, decimals, percentages). Compares theoretical and experimental probability. Identifies all possible outcomes of compound events. Uses probability for decisions.',
      },
    ],
    prerequisites: ['M1', 'M3'],
    enables: ['M7', 'EF5'],
    curriculumCodes: [
      'AC9M3P01',
      'AC9M4P01',
      'AC9M5P01',
      'AC9M6P01',
    ],
  },

  {
    id: 'M9',
    title: 'Mathematical Modelling & Problem Solving',
    domain: 'mathematics',
    description:
      'The child can take a real-world situation, represent it mathematically, work through it, and interpret the result back in context — the full cycle of applied mathematics.',
    dlos: [
      {
        title: 'Recognises when situation involves mathematics; represents with objects/drawings',
        tier: 'emerging',
        description:
          'Recognises when real situation involves mathematics. Represents simple problem with objects, drawings, numbers. Explains thinking when solving problem.',
      },
      {
        title: 'Identifies needed information; tries multiple strategies; checks in context',
        tier: 'developing',
        description:
          'Identifies information needed to solve problem. Tries more than one strategy when stuck. Uses diagrams, tables, lists to organise approach. Checks answer makes sense in real-world context.',
      },
      {
        title: 'Formulates and selects appropriate mathematical representations and tools',
        tier: 'demonstrating',
        description:
          'Formulates mathematical representations of complex real problems. Selects and combines appropriate tools and strategies. Interprets and communicates results in context. Evaluates efficiency of methods.',
      },
    ],
    prerequisites: ['M2', 'M5', 'EF4'],
    enables: ['S1', 'EF5'],
    curriculumCodes: [
      'AC9M2N06',
      'AC9M3N05',
      'AC9M4N05',
      'AC9M5N06',
      'AC9M6N06',
      'AC9M6M03',
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // DOMAIN 3: SCIENTIFIC THINKING (6 threads)
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'S1',
    title: 'Scientific Inquiry',
    domain: 'science',
    description:
      'The child poses investigable questions, plans and conducts investigations, collects and records data, and draws evidence-based conclusions.',
    dlos: [
      {
        title: 'Asks questions about phenomena; explores using senses; observes changes',
        tier: 'emerging',
        description:
          'Asks "what" and "why" questions about natural phenomena. Explores objects using senses. Notices changes in environment. Describes observations using everyday language.',
      },
      {
        title: 'Poses investigable questions; predicts; records observations; compares with predictions',
        tier: 'developing',
        description:
          'Poses questions that can be investigated. Makes predictions before testing. Follows investigation steps and records observations. Uses informal measurements. Describes results and compares with predictions.',
      },
      {
        title: 'Plans investigations with identified variables; records systematically; draws evidence-based conclusions',
        tier: 'demonstrating',
        description:
          'Plans investigations with identified variables (change, measure, keep same). Records data systematically in tables/diagrams. Analyses patterns and draws conclusions. Evaluates fairness of investigation. Suggests improvements.',
      },
    ],
    prerequisites: ['EF1', 'M7'],
    enables: ['S2', 'S3', 'S4', 'EF5'],
    curriculumCodes: [
      'AC9SFI01',
      'AC9SFI02',
      'AC9SFI03',
      'AC9SFI04',
      'AC9SFI05',
      'AC9S1I01',
      'AC9S1I02',
      'AC9S1I03',
      'AC9S1I04',
      'AC9S1I05',
      'AC9S2I01',
      'AC9S2I02',
      'AC9S2I03',
      'AC9S2I04',
      'AC9S2I05',
      'AC9S3I01',
      'AC9S3I02',
      'AC9S3I03',
      'AC9S3I04',
      'AC9S3I05',
      'AC9S4I01',
      'AC9S4I02',
      'AC9S4I03',
      'AC9S4I04',
      'AC9S4I05',
      'AC9S5I01',
      'AC9S5I02',
      'AC9S5I03',
      'AC9S5I04',
      'AC9S5I05',
      'AC9S6I01',
      'AC9S6I02',
      'AC9S6I03',
      'AC9S6I04',
      'AC9S6I05',
    ],
  },

  {
    id: 'S2',
    title: 'Living Systems',
    domain: 'science',
    description:
      'The child understands living things — their characteristics, needs, life cycles, adaptations, and relationships within ecosystems.',
    dlos: [
      {
        title: 'Identifies living vs non-living; names basic needs; observes features',
        tier: 'emerging',
        description:
          'Identifies things as living or non-living. Names basic needs (food, water, shelter). Observes and describes features. Notices growth and change.',
      },
      {
        title: 'Describes life cycles; groups organisms; identifies survival features; explains food chains',
        tier: 'developing',
        description:
          'Describes life cycles of familiar organisms. Groups living things by observable features. Identifies structural features for survival. Explains simple food chains and relationships. Describes dependence on environment.',
      },
      {
        title: 'Explains adaptations; describes ecosystem interdependence; evaluates human impact',
        tier: 'demonstrating',
        description:
          'Explains adaptations and survival in specific environments. Describes interdependence in ecosystems. Understands human activity impact. Compares life cycles across organisms.',
      },
    ],
    prerequisites: ['S1', 'S5'],
    enables: ['S3', 'H3'],
    curriculumCodes: [
      'AC9SFU01',
      'AC9S1U01',
      'AC9S2U01',
      'AC9S3U01',
      'AC9S4U01',
      'AC9S5U01',
      'AC9S6U01',
    ],
  },

  {
    id: 'S3',
    title: 'Earth & Environmental Systems',
    domain: 'science',
    description:
      'The child understands Earth\'s systems — weather, water cycle, geology, space — and the relationships between human activity and the natural environment.',
    dlos: [
      {
        title: 'Observes and describes weather and seasonal changes; identifies natural features',
        tier: 'emerging',
        description:
          'Observes and describes daily weather and seasonal changes. Identifies natural features in local environment. Recognises Earth has day and night. Notices sky (sun, moon, clouds, stars).',
      },
      {
        title: 'Describes water cycle; identifies rocks/soil; understands patterns and Earth\'s rotation',
        tier: 'developing',
        description:
          'Describes water cycle in simple terms. Identifies rocks, soil, landscapes. Understands weather and seasonal patterns. Describes Earth rotation and day/night. Identifies natural resources and uses.',
      },
      {
        title: 'Explains geological processes; understands Earth/Moon/Sun relationships; analyses human impact',
        tier: 'demonstrating',
        description:
          'Explains geological processes (erosion, weathering). Understands Earth, Moon, Sun relationships. Analyses human activity impact on systems. Describes cycles (carbon, water, rock) in detail. Evaluates sustainability.',
      },
    ],
    prerequisites: ['S1', 'S5'],
    enables: ['H3', 'EF5'],
    curriculumCodes: [
      'AC9SFU03',
      'AC9S1U03',
      'AC9S2U03',
      'AC9S3U03',
      'AC9S4U03',
      'AC9S5U03',
      'AC9S6U03',
    ],
  },

  {
    id: 'S4',
    title: 'Physical & Chemical Sciences',
    domain: 'science',
    description:
      'The child understands forces, energy, materials, and their properties — how things move, why they change, and what they\'re made of.',
    dlos: [
      {
        title: 'Explores materials; notices effects of push/pull; observes heating/cooling changes',
        tier: 'emerging',
        description:
          'Explores what objects are made of (wood, metal, fabric). Notices push/pull makes things move. Observes heating/cooling change materials. Groups materials by simple properties.',
      },
      {
        title: 'Describes material properties and uses; understands forces; investigates light/sound/heat',
        tier: 'developing',
        description:
          'Describes properties and links to uses. Understands forces change shape, speed, direction. Investigates light, sound, heat behaviour. Identifies reversible and irreversible changes. Describes energy transformations.',
      },
      {
        title: 'Explains force interactions; classifies changes; describes energy transfer; applies to design',
        tier: 'demonstrating',
        description:
          'Explains how forces interact (gravity, friction, magnetism). Classifies changes (physical/chemical). Describes energy transfer and transformation. Understands particle model. Applies understanding to design.',
      },
    ],
    prerequisites: ['S1', 'M5'],
    enables: ['M9', 'C6'],
    curriculumCodes: [
      'AC9SFU02',
      'AC9S1U02',
      'AC9S2U02',
      'AC9S3U02',
      'AC9S4U02',
      'AC9S5U02',
      'AC9S6U02',
    ],
  },

  {
    id: 'S5',
    title: 'Scientific Observation',
    domain: 'science',
    description:
      'The child observes carefully and systematically — slowing down, noticing details, recording what they see, and distinguishing observation from interpretation.',
    dlos: [
      {
        title: 'Slows down to look; points out details; returns to look; asks about details',
        tier: 'emerging',
        description:
          'Slows down to look when reminded. Points out single detail. Returns to look again. Asks "what\'s that?" about unexpected things.',
      },
      {
        title: 'Slows down without prompting; notices changes; compares; uses observation tools',
        tier: 'developing',
        description:
          'Slows down without reminder. Notices changes over time. Compares similar things and identifies differences. Uses tools (magnifier, binoculars) effectively. Describes multiple details.',
      },
      {
        title: 'Records observations systematically; distinguishes observation from interpretation; notices patterns',
        tier: 'demonstrating',
        description:
          'Records observations systematically (journal, diagram, photo with notes). Distinguishes observed from interpreted. Notices patterns across observations. Designs observation protocols. Uses precise language.',
      },
    ],
    prerequisites: ['EF1'],
    enables: ['S1', 'S2', 'S3', 'S4'],
    curriculumCodes: [
      'AC9SFI01',
      'AC9SFI02',
      'AC9S1I01',
      'AC9S1I02',
      'AC9S2I01',
      'AC9S2I02',
      'AC9SFH01',
      'AC9S1H01',
      'AC9S2H01',
    ],
  },

  {
    id: 'S6',
    title: 'Science as Human Endeavour',
    domain: 'science',
    description:
      'The child understands that science is a human activity — shaped by culture, curiosity, and collaboration — and that scientific knowledge changes over time as new evidence emerges.',
    dlos: [
      {
        title: 'Shows curiosity about how things work; recognises science use; identifies scientists',
        tier: 'emerging',
        description:
          'Shows curiosity about how things work and asks questions. Recognises people use science. Identifies scientists or inventors they\'ve heard of.',
      },
      {
        title: 'Describes how science changed daily life; recognises First Nations knowledge; understands collaboration',
        tier: 'developing',
        description:
          'Describes examples of science changing daily life. Understands First Nations have long-standing scientific knowledge. Recognises scientists work together and build on ideas. Identifies how science helps solve problems.',
      },
      {
        title: 'Explains how understanding changed over time; discusses ethics; evaluates claims using evidence',
        tier: 'demonstrating',
        description:
          'Explains how scientific understanding changed with examples. Discusses ethical dimensions. Evaluates different claims using evidence. Understands peer review and reproducibility. Recognises diverse cultural contributions.',
      },
    ],
    prerequisites: ['S1', 'L3'],
    enables: ['H2', 'EF5'],
    curriculumCodes: [
      'AC9SFH01',
      'AC9SFH02',
      'AC9S1H01',
      'AC9S1H02',
      'AC9S2H01',
      'AC9S2H02',
      'AC9S3H01',
      'AC9S3H02',
      'AC9S4H01',
      'AC9S4H02',
      'AC9S5H01',
      'AC9S5H02',
      'AC9S6H01',
      'AC9S6H02',
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // DOMAIN 4: HUMANITIES & SOCIAL UNDERSTANDING (6 threads)
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'H1',
    title: 'Historical Thinking & Chronology',
    domain: 'hass',
    description:
      'The child understands time, change, and continuity — they can sequence events, understand cause and effect in human history, and appreciate how the past shapes the present.',
    dlos: [
      {
        title: 'Sequences personal events; identifies old vs new; shows interest in family stories',
        tier: 'emerging',
        description:
          'Sequences personal events (yesterday, last week). Identifies things as "old" or "new". Shows interest in family stories. Asks questions about the past.',
      },
      {
        title: 'Places events on timeline; describes how daily life changed; identifies significant events/people',
        tier: 'developing',
        description:
          'Places events on simple timeline. Describes how daily life changed over time. Identifies significant events or people. Understands people in past lived differently. Explores family and community histories.',
      },
      {
        title: 'Uses historical language; analyses cause and effect; considers multiple perspectives',
        tier: 'demonstrating',
        description:
          'Uses historical language (decade, century, era). Analyses cause and effect in events. Considers multiple perspectives. Identifies continuity and change. Connects local history to broader narratives.',
      },
    ],
    prerequisites: ['L1', 'EF3'],
    enables: ['H2', 'H4'],
    curriculumCodes: [
      'AC9HSFK01',
      'AC9HSFK02',
      'AC9HS1K01',
      'AC9HS1K02',
      'AC9HS2K01',
      'AC9HS2K02',
      'AC9HS3K01',
      'AC9HS3K02',
      'AC9HS4K01',
      'AC9HS4K02',
      'AC9HS5K01',
      'AC9HS5K02',
      'AC9HS6K01',
      'AC9HS6K02',
    ],
  },

  {
    id: 'H2',
    title: 'Source Analysis & Evidence',
    domain: 'hass',
    description:
      'The child can evaluate sources of information — distinguishing primary from secondary, identifying bias, and understanding that accounts of the same event can differ.',
    dlos: [
      {
        title: 'Identifies where information comes from; recognises sources can tell us about the past',
        tier: 'emerging',
        description:
          'Identifies where information comes from (book, person, website). Recognises photos and objects can tell about past. Understands stories can be told differently.',
      },
      {
        title: 'Distinguishes primary and secondary sources; identifies author perspective; compares accounts',
        tier: 'developing',
        description:
          'Distinguishes primary (diary, letter, photo) from secondary sources. Identifies author/creator and their perspective. Compares accounts and notices differences. Asks "How do we know?"',
      },
      {
        title: 'Evaluates reliability and usefulness; identifies bias and perspective; cross-references sources',
        tier: 'demonstrating',
        description:
          'Evaluates reliability and usefulness of sources. Identifies bias, perspective, purpose. Cross-references multiple sources. Understands absence of sources creates knowledge gaps. Applies across disciplines.',
      },
    ],
    prerequisites: ['L3', 'H1', 'EF5'],
    enables: ['L8', 'EF5'],
    curriculumCodes: [
      'AC9HSFS01',
      'AC9HSFS02',
      'AC9HS1S01',
      'AC9HS2S01',
      'AC9HS3S01',
      'AC9HS3S02',
      'AC9HS4S01',
      'AC9HS4S02',
      'AC9HS5S01',
      'AC9HS5S02',
      'AC9HS6S01',
      'AC9HS6S02',
    ],
  },

  {
    id: 'H3',
    title: 'Geography & Environmental Awareness',
    domain: 'hass',
    description:
      'The child understands places, spaces, and environments — from local to global — and the relationships between people and their environments.',
    dlos: [
      {
        title: 'Describes local environment; identifies home/school on map; names natural features',
        tier: 'emerging',
        description:
          'Describes local environment and features. Identifies home and school on simple map. Names natural features. Notices differences between places.',
      },
      {
        title: 'Creates and interprets maps; describes how people use/change environments; compares places',
        tier: 'developing',
        description:
          'Creates and interprets simple maps with keys. Describes how people use and change environment. Compares features of different places. Identifies weather/climate effects. Understands Indigenous names and histories.',
      },
      {
        title: 'Analyses human/environmental relationships; uses geographical tools; evaluates sustainability',
        tier: 'demonstrating',
        description:
          'Analyses relationship between human activity and environmental change. Uses geographical tools (maps, globes, digital). Evaluates land use and management perspectives. Understands sustainability. Compares global communities.',
      },
    ],
    prerequisites: ['M6', 'S5'],
    enables: ['S3', 'H4', 'PS5'],
    curriculumCodes: [
      'AC9HSFK03',
      'AC9HSFK04',
      'AC9HS1K03',
      'AC9HS1K04',
      'AC9HS2K03',
      'AC9HS2K04',
      'AC9HS3K03',
      'AC9HS3K04',
      'AC9HS4K03',
      'AC9HS4K04',
      'AC9HS5K03',
      'AC9HS5K04',
      'AC9HS6K03',
      'AC9HS6K04',
    ],
  },

  {
    id: 'H4',
    title: 'Civic & Economic Understanding',
    domain: 'hass',
    description:
      'The child understands how communities and societies are organised — governance, rules, rights, responsibilities, and economic activity.',
    dlos: [
      {
        title: 'Identifies roles and responsibilities; understands groups need rules; recognises needs vs wants',
        tier: 'emerging',
        description:
          'Identifies roles and responsibilities in family and community. Understands groups need rules. Recognises needs vs wants. Shows awareness people do different jobs.',
      },
      {
        title: 'Explains why communities have rules; describes goods/services; identifies rights and responsibilities',
        tier: 'developing',
        description:
          'Explains why communities have rules and laws. Describes how goods/services are produced and distributed. Identifies rights and responsibilities. Understands democratic concepts. Recognises different perspectives.',
      },
      {
        title: 'Analyses how decisions affect groups; understands government levels; evaluates economic trade-offs',
        tier: 'demonstrating',
        description:
          'Analyses how decisions affect different groups. Understands levels of government and roles. Evaluates economic choices and trade-offs. Considers global connections impact. Proposes solutions to issues.',
      },
    ],
    prerequisites: ['PS1', 'L1'],
    enables: ['PS6', 'L8'],
    curriculumCodes: [
      'AC9HSFK05',
      'AC9HSFK06',
      'AC9HS1K05',
      'AC9HS1K06',
      'AC9HS2K05',
      'AC9HS2K06',
      'AC9HS3K05',
      'AC9HS3K06',
      'AC9HS4K05',
      'AC9HS4K06',
      'AC9HS5K05',
      'AC9HS5K06',
      'AC9HS6K05',
      'AC9HS6K06',
    ],
  },

  {
    id: 'H5',
    title: 'HASS Inquiry Skills',
    domain: 'hass',
    description:
      'The child can conduct humanities inquiries — posing questions, locating and analysing information, drawing conclusions, and communicating findings.',
    dlos: [
      {
        title: 'Asks questions about people/places; finds information from provided sources',
        tier: 'emerging',
        description:
          'Asks questions about people, places, events. Finds information from provided source. Shares findings with others. Draws or writes about learning.',
      },
      {
        title: 'Develops own inquiry questions; uses multiple sources; organises and presents findings',
        tier: 'developing',
        description:
          'Develops own inquiry questions. Uses multiple sources to investigate. Sorts and records information. Presents findings appropriately. Identifies different viewpoints.',
      },
      {
        title: 'Plans and conducts extended inquiry; evaluates sources; synthesises information; draws conclusions',
        tier: 'demonstrating',
        description:
          'Plans and conducts extended inquiry with multiple stages. Evaluates sources for reliability and relevance. Synthesises diverse information. Draws evidence-based conclusions. Reflects on process.',
      },
    ],
    prerequisites: ['L3', 'EF4'],
    enables: ['H1', 'H2', 'H3', 'H4'],
    curriculumCodes: [
      'AC9HSFS01',
      'AC9HSFS02',
      'AC9HSFS03',
      'AC9HSFS04',
      'AC9HSFS05',
      'AC9HSFS06',
      'AC9HS1S01',
      'AC9HS1S02',
      'AC9HS1S03',
      'AC9HS1S04',
      'AC9HS1S05',
      'AC9HS1S06',
      'AC9HS2S01',
      'AC9HS2S02',
      'AC9HS2S03',
      'AC9HS2S04',
      'AC9HS2S05',
      'AC9HS2S06',
      'AC9HS3S01',
      'AC9HS3S02',
      'AC9HS3S03',
      'AC9HS3S04',
      'AC9HS3S05',
      'AC9HS3S06',
      'AC9HS4S01',
      'AC9HS4S02',
      'AC9HS4S03',
      'AC9HS4S04',
      'AC9HS4S05',
      'AC9HS4S06',
      'AC9HS5S01',
      'AC9HS5S02',
      'AC9HS5S03',
      'AC9HS5S04',
      'AC9HS5S05',
      'AC9HS5S06',
      'AC9HS6S01',
      'AC9HS6S02',
      'AC9HS6S03',
      'AC9HS6S04',
      'AC9HS6S05',
      'AC9HS6S06',
    ],
  },

  {
    id: 'H6',
    title: 'First Nations Australian Perspectives',
    domain: 'hass',
    description:
      'The child demonstrates understanding of and respect for Aboriginal and Torres Strait Islander histories, cultures, and contributions — the world\'s oldest continuing cultures.',
    dlos: [
      {
        title: 'Recognises Indigenous peoples have lived in Australia long; shows respect for practices',
        tier: 'emerging',
        description:
          'Recognises Aboriginal and Torres Strait Islander peoples have lived in Australia long. Shows respect for Indigenous places, names, cultural practices. Listens to Dreaming stories with interest.',
      },
      {
        title: 'Describes Indigenous connection to Country; identifies Indigenous knowledge; uses appropriate language',
        tier: 'developing',
        description:
          'Describes connection between Indigenous peoples and Country/Place. Identifies Indigenous knowledge contributions. Uses Acknowledgement of Country appropriately. Compares Indigenous and non-Indigenous perspectives.',
      },
      {
        title: 'Explains significance of Country; analyses colonisation impact; evaluates representation',
        tier: 'demonstrating',
        description:
          'Explains significance of Country to Indigenous peoples. Analyses colonisation impact. Identifies ongoing Indigenous contributions. Examines how Indigenous perspectives are represented. Applies understanding to environmental and social issues.',
      },
    ],
    prerequisites: ['L1', 'PS1'],
    enables: ['H1', 'H3', 'PS6'],
    curriculumCodes: [
      'AC9HSFK01',
      'AC9HSFK03',
      'AC9HS1K01',
      'AC9HS2K01',
      'AC9HS3K01',
      'AC9HS4K01',
      'AC9SFH01',
      'AC9S1H01',
      'AC9S2H01',
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // DOMAIN 5: PHYSICAL CAPABILITY (5 threads)
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'P1',
    title: 'Gross Motor & Physical Coordination',
    domain: 'hpe',
    description:
      'The child moves their whole body with increasing control, coordination, and confidence — running, jumping, climbing, balancing, throwing, catching.',
    dlos: [
      {
        title: 'Walks, runs, jumps with basic control; catches large ball from close range',
        tier: 'emerging',
        description:
          'Walks, runs, jumps with basic control. Catches large ball with two hands from close range. Balances on one foot briefly. Moves to music with some rhythm.',
      },
      {
        title: 'Demonstrates coordinated running/jumping/hopping; throws accurately; catches small ball',
        tier: 'developing',
        description:
          'Demonstrates coordinated running, jumping, hopping, skipping. Throws overarm with increasing accuracy. Catches small ball from various distances. Maintains balance during dynamic activities. Performs movement sequences.',
      },
      {
        title: 'Moves with fluency and efficiency; combines skills in games and sports; shows stamina',
        tier: 'demonstrating',
        description:
          'Moves with fluency, control, efficiency across diverse activities. Combines locomotor and object control skills in games. Adapts movement to environments. Demonstrates spatial awareness. Shows stamina and endurance.',
      },
    ],
    enables: ['P3', 'P4', 'C6'],
    curriculumCodes: [
      'AC9HPFM01',
      'AC9HPFM02',
      'AC9HP1M01',
      'AC9HP1M02',
      'AC9HP2M01',
      'AC9HP2M02',
      'AC9HP2M03',
      'AC9HP3M01',
      'AC9HP3M02',
      'AC9HP4M01',
      'AC9HP4M02',
      'AC9HP5M01',
      'AC9HP5M02',
      'AC9HP6M01',
      'AC9HP6M02',
    ],
  },

  {
    id: 'P2',
    title: 'Fine Motor & Manipulation',
    domain: 'hpe',
    description:
      'The child uses their hands and fingers with increasing precision and control — manipulating tools, materials, and objects for purposeful tasks.',
    dlos: [
      {
        title: 'Holds and uses tools with functional grip; threads beads; uses scissors to snip',
        tier: 'emerging',
        description:
          'Holds and uses tools (crayons, spoons, paintbrushes) with functional grip. Threads large beads, completes simple puzzles. Uses scissors to snip. Manipulates playdough or clay.',
      },
      {
        title: 'Cuts along lines with scissors; draws recognisable shapes; ties knots; uses construction materials',
        tier: 'developing',
        description:
          'Cuts along line with reasonable accuracy. Draws recognisable shapes and pictures with detail. Ties knots, uses fasteners (buttons, zips). Uses construction materials with precision. Holds pencil with efficient grip.',
      },
      {
        title: 'Completes intricate tasks; uses tools confidently; fine motor does not limit participation',
        tier: 'demonstrating',
        description:
          'Completes intricate tasks (sewing, detailed drawing, model building). Uses range of tools confidently. Fine motor does not limit any activity. Adapts grip and pressure for different tools.',
      },
    ],
    enables: ['L6', 'C5', 'C6'],
    curriculumCodes: [
      'AC9EFLY08',
      'AC9E1LY08',
      'AC9E2LY08',
      'AC9E3LY08',
      'AC9E4LY08',
    ],
  },

  {
    id: 'P3',
    title: 'Health & Body Awareness',
    domain: 'hpe',
    description:
      'The child understands their body — nutrition, hygiene, growth, and the factors that contribute to physical and mental wellbeing.',
    dlos: [
      {
        title: 'Identifies body parts and functions; understands simple hygiene; recognises food gives energy',
        tier: 'emerging',
        description:
          'Identifies basic body parts and functions. Understands simple hygiene routines. Recognises food gives energy and helps growth. Identifies when unwell and communicates it.',
      },
      {
        title: 'Describes health factors; makes healthy choices; understands body changes and safety',
        tier: 'developing',
        description:
          'Describes factors for health (nutrition, exercise, sleep, hygiene). Makes increasingly independent healthy choices. Understands bodies change over time. Identifies safe and unsafe actions.',
      },
      {
        title: 'Analyses lifestyle and health outcomes; evaluates health information; understands physical/mental connection',
        tier: 'demonstrating',
        description:
          'Analyses relationship between lifestyle choices and health. Evaluates health information from sources. Demonstrates personal responsibility. Understands connection between physical and mental wellbeing. Identifies health resources.',
      },
    ],
    prerequisites: ['PS1'],
    enables: ['PS3', 'P4'],
    curriculumCodes: [
      'AC9HPFP01',
      'AC9HPFP02',
      'AC9HP1P01',
      'AC9HP1P02',
      'AC9HP2P01',
      'AC9HP2P02',
      'AC9HP2P06',
      'AC9HP3P01',
      'AC9HP3P02',
      'AC9HP4P01',
      'AC9HP4P02',
      'AC9HP5P01',
      'AC9HP5P02',
      'AC9HP6P01',
      'AC9HP6P02',
    ],
  },

  {
    id: 'P4',
    title: 'Sport & Cooperative Games',
    domain: 'hpe',
    description:
      'The child participates in structured physical activities, understands rules and fair play, and works cooperatively in team-based movement contexts.',
    dlos: [
      {
        title: 'Participates willingly; follows basic game rules with reminding; takes turns',
        tier: 'emerging',
        description:
          'Participates willingly in group physical activities. Follows basic game rules with reminding. Takes turns during games. Shows enjoyment of physical play with others.',
      },
      {
        title: 'Understands and follows rules independently; co-constructs fair play; works cooperatively',
        tier: 'developing',
        description:
          'Understands and follows rules independently. Co-constructs fair play rules. Works cooperatively with partner or team. Shows good sportsmanship. Applies movement skills in games.',
      },
      {
        title: 'Develops and applies tactics; supports others; modifies games; shows leadership',
        tier: 'demonstrating',
        description:
          'Develops and applies tactics and strategies. Supports and encourages others. Modifies games for inclusion or challenge. Demonstrates leadership. Reflects on performance and improves.',
      },
    ],
    prerequisites: ['P1', 'PS2'],
    enables: ['PS2', 'EF4'],
    curriculumCodes: [
      'AC9HPFM03',
      'AC9HP1M03',
      'AC9HP2M04',
      'AC9HP2M05',
      'AC9HP3M03',
      'AC9HP3M04',
      'AC9HP4M03',
      'AC9HP4M04',
      'AC9HP5M03',
      'AC9HP5M04',
      'AC9HP6M03',
      'AC9HP6M04',
    ],
  },

  {
    id: 'P5',
    title: 'Risk Assessment & Physical Safety',
    domain: 'hpe',
    description:
      'The child identifies potential hazards, assesses risk relative to their own capability, and makes safe choices — developing independence through managed risk rather than avoidance.',
    dlos: [
      {
        title: 'Responds to safety instructions; identifies dangerous situations and basic safety rules',
        tier: 'emerging',
        description:
          'Responds to "stop" or safety instructions. Identifies obviously dangerous situations. Understands basic safety rules in familiar environments. Seeks help when feeling unsafe.',
      },
      {
        title: 'Assesses risk before physical challenges; identifies hazards; makes safe choices independently',
        tier: 'developing',
        description:
          'Assesses risk before attempting challenges. Identifies potential hazards in new environments. Knows who to ask for help. Understands protective behaviours and boundaries. Makes safe choices with decreasing prompting.',
      },
      {
        title: 'Independently assesses and manages risks; adapts for different environments; shows emergency awareness',
        tier: 'demonstrating',
        description:
          'Independently assesses and manages physical risks. Adapts behaviour for different risk levels. Demonstrates emergency awareness. Helps others identify and manage risks. Articulates why safety measures exist.',
      },
    ],
    prerequisites: ['P1', 'PS3'],
    enables: ['EF4', 'PS3'],
    curriculumCodes: [
      'AC9HPFP03',
      'AC9HP1P03',
      'AC9HP2P03',
      'AC9HP2P04',
      'AC9HP2P05',
      'AC9HP3P03',
      'AC9HP4P03',
      'AC9HP5P03',
      'AC9HP6P03',
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // DOMAIN 6: PERSONAL & SOCIAL DEVELOPMENT (7 threads)
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'PS1',
    title: 'Empathy & Perspective-Taking',
    domain: 'hpe',
    description:
      'The child recognises, understands, and responds to the emotions and perspectives of others — seeing the world through different eyes.',
    dlos: [
      {
        title: 'Recognises basic emotions in others; shows concern when upset; responds to perspective prompts',
        tier: 'emerging',
        description:
          'Recognises basic emotions in others (happy, sad, angry). Shows concern when someone upset. Understands people have feelings. Responds to simple perspective prompts.',
      },
      {
        title: 'Identifies emotions from contextual cues; considers perspectives without prompting; shows compassion',
        tier: 'developing',
        description:
          'Identifies emotions from contextual cues. Considers another\'s perspective without prompting. Shows compassion through actions. Understands same event affects people differently. Discusses character feelings.',
      },
      {
        title: 'Takes perspective of people different from self; navigates disagreements; advocates for fairness',
        tier: 'demonstrating',
        description:
          'Takes perspective of very different people. Navigates disagreements considering both sides. Shows awareness of actions\' effects on others. Demonstrates cultural sensitivity. Advocates for fairness and inclusion.',
      },
    ],
    enables: ['PS2', 'PS6', 'L8', 'H6'],
    curriculumCodes: [
      'AC9HPFP04',
      'AC9HP1P04',
      'AC9HP2P04',
      'AC9E2LE01',
      'AC9E3LE01',
      'AC9E4LE01',
    ],
  },

  {
    id: 'PS2',
    title: 'Social Skills & Cooperation',
    domain: 'hpe',
    description:
      'The child interacts positively with others — sharing, negotiating, collaborating, resolving conflicts, and building friendships.',
    dlos: [
      {
        title: 'Plays alongside others; shares when reminded; responds to social cues; seeks company',
        tier: 'emerging',
        description:
          'Plays alongside others (parallel to interactive play). Shares materials when reminded. Responds to social cues (greetings, turn-taking). Seeks out company of peers or family.',
      },
      {
        title: 'Initiates interaction; negotiates with peers; uses words to resolve conflicts; works cooperatively',
        tier: 'developing',
        description:
          'Initiates social interaction and joins activities. Negotiates roles and resources with peers. Uses words to resolve simple conflicts with support. Works cooperatively on shared tasks. Identifies and maintains friendships.',
      },
      {
        title: 'Resolves conflicts independently; adapts behaviour for contexts; supports others; demonstrates leadership',
        tier: 'demonstrating',
        description:
          'Resolves conflicts independently using multiple strategies. Adapts social behaviour for different contexts. Supports and encourages others. Demonstrates leadership and followership. Builds positive relationships across groups.',
      },
    ],
    prerequisites: ['PS1', 'L1'],
    enables: ['P4', 'EF6'],
    curriculumCodes: [
      'AC9HPFP05',
      'AC9HP1P05',
      'AC9HP2P04',
      'AC9HP2P05',
    ],
  },

  {
    id: 'PS3',
    title: 'Self-Regulation & Wellbeing',
    domain: 'hpe',
    description:
      'The child manages their emotions, behaviour, and energy — coping with frustration, transitioning between activities, and maintaining a positive sense of self.',
    dlos: [
      {
        title: 'Names emotion with support; accepts comfort when distressed; transitions with support',
        tier: 'emerging',
        description:
          'Names current emotion with support. Accepts comfort from trusted person. Transitions between activities with support. Identifies situations affecting emotions.',
      },
      {
        title: 'Uses strategies to manage emotions; transitions with minimal support; persists through frustration',
        tier: 'developing',
        description:
          'Uses strategies to manage big emotions (deep breaths, walking away, asking for space). Transitions with minimal support. Persists through frustration with less intervention. Describes strengths and areas being worked on.',
      },
      {
        title: 'Self-monitors and applies strategies independently; recovers from setbacks; maintains realistic self-view',
        tier: 'demonstrating',
        description:
          'Self-monitors emotional state and applies strategies independently. Recovers from setbacks with resilience. Maintains balanced and realistic self-assessment. Advocates for own needs. Shows sustained positive engagement.',
      },
    ],
    enables: ['EF1', 'EF2', 'PS2', 'P5'],
    curriculumCodes: [
      'AC9HPFP01',
      'AC9HPFP02',
      'AC9HP1P01',
      'AC9HP2P03',
    ],
  },

  {
    id: 'PS4',
    title: 'Identity & Belonging',
    domain: 'hpe',
    description:
      'The child has a developing sense of who they are — their family, culture, values, strengths, and place in their community and the world.',
    dlos: [
      {
        title: 'Identifies self as part of family/community; names interests; shows awareness of traditions',
        tier: 'emerging',
        description:
          'Identifies self as part of family and community. Recognises and names personal interests and preferences. Shows awareness of cultural or family traditions. Demonstrates pride in abilities.',
      },
      {
        title: 'Describes cultural background and family stories; respects others\' differences; identifies strengths',
        tier: 'developing',
        description:
          'Describes own cultural background and family stories. Recognises and respects others\' different backgrounds. Identifies personal strengths and learning areas. Feels comfortable contributing in groups.',
      },
      {
        title: 'Articulates personal values; respects diversity; shows confidence in identity; connects to community',
        tier: 'demonstrating',
        description:
          'Articulates personal values and what matters. Respects and celebrates diversity. Shows confidence in identity while open to new ideas. Connects identity to broader community and cultural contexts. Shows resilience.',
      },
    ],
    prerequisites: ['L1'],
    enables: ['PS6', 'H6'],
    curriculumCodes: [
      'AC9HPFP01',
      'AC9HPFP02',
      'AC9HSFK01',
      'AC9HSFK05',
      'AC9HS1K01',
    ],
  },

  {
    id: 'PS5',
    title: 'Environmental Stewardship',
    domain: 'hpe',
    description:
      'The child demonstrates care and responsibility for the natural world — understanding their impact and taking action to protect environments.',
    dlos: [
      {
        title: 'Shows care for living things; participates in activities with guidance; notices damage',
        tier: 'emerging',
        description:
          'Shows care for living things (watering plants, gentle with animals). Participates in composting, recycling, gardening with guidance. Notices litter or damage.',
      },
      {
        title: 'Explains why environment matters; identifies human impacts; takes responsibility; connects choices to outcomes',
        tier: 'developing',
        description:
          'Explains why environment matters. Identifies how people affect environment (positive and negative). Takes responsibility for environmental actions. Connects human choices to environmental outcomes.',
      },
      {
        title: 'Analyses environmental issues and evaluates actions; initiates projects; considers perspectives; applies sustainability',
        tier: 'demonstrating',
        description:
          'Analyses environmental issues and evaluates potential actions. Initiates or leads projects. Considers multiple perspectives (economic, cultural, ecological). Applies sustainability thinking. Articulates and defends values.',
      },
    ],
    prerequisites: ['S5', 'H3', 'PS1'],
    enables: ['S3', 'PS6'],
    curriculumCodes: [
      'AC9HSFK04',
      'AC9HS1K04',
      'AC9HS2K04',
      'AC9SFH02',
      'AC9S1H02',
      'AC9S2H02',
    ],
  },

  {
    id: 'PS6',
    title: 'Ethical Reasoning',
    domain: 'hpe',
    description:
      'The child thinks about right and wrong, fairness and justice — considering ethical dimensions of situations and making reasoned moral judgments.',
    dlos: [
      {
        title: 'Identifies fair/unfair; recognises hurt; follows rules; responds honestly',
        tier: 'emerging',
        description:
          'Identifies situations as "fair" or "unfair". Recognises when someone hurt or treated badly. Follows rules and understands purpose. Responds honestly about own actions.',
      },
      {
        title: 'Considers action impact before acting; explains rules and suggests modifications; recognises dilemmas',
        tier: 'developing',
        description:
          'Considers action impact on others before acting. Explains reasons for rules and suggests modifications. Recognises ethical dilemmas in stories and life. Understands fair doesn\'t always mean equal.',
      },
      {
        title: 'Analyses ethical dilemmas from multiple perspectives; defends moral positions; identifies ethical dimensions',
        tier: 'demonstrating',
        description:
          'Analyses ethical dilemmas using multiple perspectives. Defends moral position with reasoned arguments. Identifies ethical dimensions in apparently neutral situations. Considers stakeholder consequences.',
      },
    ],
    prerequisites: ['PS1', 'L1', 'EF5'],
    enables: ['H4'],
    curriculumCodes: [
      'AC9HS3K05',
      'AC9HS4K05',
      'AC9HS5K05',
      'AC9HP3P03',
      'AC9HP4P03',
    ],
  },

  {
    id: 'PS7',
    title: 'Digital Citizenship',
    domain: 'hpe',
    description:
      'The child navigates digital environments responsibly — understanding online safety, digital identity, information literacy, and respectful online interaction.',
    dlos: [
      {
        title: 'Uses digital devices for simple purposes with supervision; understands basic online safety',
        tier: 'emerging',
        description:
          'Uses digital devices for simple purposes with supervision. Understands basic online safety rules. Recognises difference between online and offline interactions.',
      },
      {
        title: 'Follows family rules independently; understands online consequences; identifies suspicious content',
        tier: 'developing',
        description:
          'Follows agreed family rules independently. Understands online actions have real consequences. Identifies suspicious or uncomfortable content and tells adult. Uses digital tools purposefully. Understands digital footprint.',
      },
      {
        title: 'Evaluates online information for credibility; manages digital identity; behaves ethically online',
        tier: 'demonstrating',
        description:
          'Evaluates online information for credibility and bias. Manages digital identity and privacy thoughtfully. Demonstrates respectful and ethical online behaviour. Uses digital tools effectively and selectively. Helps others navigate safely.',
      },
    ],
    prerequisites: ['L3', 'PS2'],
    enables: ['EF5', 'H2'],
    curriculumCodes: [
      'AC9TDI2P01',
      'AC9TDI2P02',
      'AC9TDI2P03',
      'AC9TDI2P04',
      'AC9TDI2P05',
      'AC9HP3P03',
      'AC9HP4P03',
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // DOMAIN 7: CREATIVE EXPRESSION (7 threads)
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'C1',
    title: 'Narrative & Storytelling',
    domain: 'arts',
    description:
      'The child creates and shares stories — across media (oral, written, visual, dramatic) — with increasing sophistication in plot, character, setting, and theme.',
    dlos: [
      {
        title: 'Tells simple stories with beginning and end; uses imaginative play',
        tier: 'emerging',
        description:
          'Tells simple stories with beginning and end. Uses imaginative play with toys or props. Contributes ideas to shared storytelling.',
      },
      {
        title: 'Creates stories with clear structure; develops characters; includes problems and resolutions',
        tier: 'developing',
        description:
          'Creates stories with clear beginning, middle, end. Develops characters with distinct traits. Includes problems and resolutions. Uses descriptive language for setting. Tells stories across media.',
      },
      {
        title: 'Creates complex narratives with subplots and themes; develops multi-dimensional characters',
        tier: 'demonstrating',
        description:
          'Creates complex narratives with subplots, themes, moral dilemmas. Develops multi-dimensional characters that change. Uses narrative techniques deliberately. Adapts storytelling for audiences. Revises based on feedback.',
      },
    ],
    prerequisites: ['L1', 'L9'],
    enables: ['L5', 'C3', 'C4'],
    curriculumCodes: [
      'AC9EFLE02',
      'AC9E1LE02',
      'AC9E2LE02',
      'AC9E3LE02',
      'AC9E4LE02',
      'AC9E5LE02',
      'AC9E6LE02',
    ],
  },

  {
    id: 'C2',
    title: 'Musical Expression',
    domain: 'arts',
    description:
      'The child engages with music — listening, creating, performing — with growing understanding of musical elements and their expressive potential.',
    dlos: [
      {
        title: 'Responds physically to music; sings familiar songs; identifies instruments',
        tier: 'emerging',
        description:
          'Responds to music physically (clapping, swaying, dancing). Sings familiar songs with some accuracy. Identifies instruments or sound sources. Expresses preferences for music.',
      },
      {
        title: 'Keeps steady beat; creates rhythmic/melodic patterns; identifies musical elements',
        tier: 'developing',
        description:
          'Keeps steady beat during activities. Creates simple patterns. Identifies musical elements (loud/soft, fast/slow, high/low). Performs with attention to expression. Listens to and discusses different cultures.',
      },
      {
        title: 'Creates original compositions; uses notation; analyses with vocabulary; performs with skill',
        tier: 'demonstrating',
        description:
          'Creates original compositions or arrangements. Uses notation or recording to capture ideas. Analyses and evaluates with appropriate vocabulary. Performs with technical skill and expression. Applies across genres and cultures.',
      },
    ],
    prerequisites: ['L1'],
    enables: ['C3', 'PS3'],
    curriculumCodes: [
      'AC9AMU2C01',
      'AC9AMU2R01',
      'AC9AMU4C01',
      'AC9AMU4R01',
      'AC9AMU6C01',
      'AC9AMU6R01',
    ],
  },

  {
    id: 'C3',
    title: 'Poetic & Rhythmic Expression',
    domain: 'arts',
    description:
      'The child plays with language — rhythm, rhyme, imagery, and the sounds and shapes of words — for aesthetic and expressive purposes.',
    dlos: [
      {
        title: 'Enjoys rhyming words and wordplay; repeats rhythmic phrases; notices interesting sounds',
        tier: 'emerging',
        description:
          'Enjoys rhyming words and wordplay. Repeats rhythmic phrases from songs, books, poems. Notices similar or interesting sounds. Claps or moves to language rhythm.',
      },
      {
        title: 'Creates simple rhymes; experiments with literary devices; reads poetry with attention',
        tier: 'developing',
        description:
          'Creates simple rhymes or patterns. Experiments with alliteration, onomatopoeia, repetition. Reads poetry with attention to rhythm and expression. Describes how poem makes them feel. Writes simple poems.',
      },
      {
        title: 'Writes original poetry with intentional literary devices; analyses published poems',
        tier: 'demonstrating',
        description:
          'Writes original poetry with intentional use of devices. Analyses craft of published poems. Experiments with different forms (haiku, free verse, acrostic). Uses poetic language across contexts. Develops personal voice.',
      },
    ],
    prerequisites: ['L1', 'L2', 'L9'],
    enables: ['L5', 'C2'],
    curriculumCodes: [
      'AC9EFLE01',
      'AC9E1LE01',
      'AC9E2LE01',
      'AC9E1LY06',
      'AC9E2LY06',
    ],
  },

  {
    id: 'C4',
    title: 'Dramatic Expression',
    domain: 'arts',
    description:
      'The child engages in dramatic play, role play, and performance — using voice, body, and imagination to explore ideas, stories, and emotions.',
    dlos: [
      {
        title: 'Engages in imaginative play; takes on roles; uses props and costumes',
        tier: 'emerging',
        description:
          'Engages in imaginative/pretend play spontaneously. Takes on roles (doctor, shopkeeper). Uses props and costumes. Watches and responds to performances.',
      },
      {
        title: 'Maintains character for extended period; uses voice for expression; collaborates on scenarios',
        tier: 'developing',
        description:
          'Maintains character or role for extended period. Uses voice (volume, tone, expression) to convey character. Collaborates to create dramatic scenarios. Creates simple scripts. Responds to drama personally.',
      },
      {
        title: 'Creates and performs original dramatic works; uses techniques deliberately; analyses performances',
        tier: 'demonstrating',
        description:
          'Creates and performs original works. Uses techniques deliberately (pause, gesture, staging). Analyses and provides feedback. Takes on complex roles with commitment. Uses drama to explore issues.',
      },
    ],
    prerequisites: ['L1', 'PS1'],
    enables: ['C1', 'PS1', 'L1'],
    curriculumCodes: [
      'AC9ADR2C01',
      'AC9ADR2R01',
      'AC9ADR4C01',
      'AC9ADR4R01',
      'AC9ADR6C01',
      'AC9ADR6R01',
    ],
  },

  {
    id: 'C5',
    title: 'Visual Expression & Design',
    domain: 'arts',
    description:
      'The child creates visual works — drawing, painting, sculpture, digital — with increasing technical skill, aesthetic awareness, and expressive intent.',
    dlos: [
      {
        title: 'Explores materials freely; creates images; expresses colour/shape preferences',
        tier: 'emerging',
        description:
          'Explores materials freely (paint, clay, pencils, collage). Creates images representing real or imagined things. Expresses preferences for colours, shapes, styles. Shows interest in visual art.',
      },
      {
        title: 'Uses materials and techniques purposefully; creates recognisable works with detail',
        tier: 'developing',
        description:
          'Uses range of materials and techniques purposefully. Creates works with recognisable subjects and increasing detail. Experiments with colour, line, shape, texture. Discusses art by others. Plans before creating.',
      },
      {
        title: 'Creates visually effective works with deliberate aesthetic choices; uses variety of media',
        tier: 'demonstrating',
        description:
          'Creates visually effective works with deliberate aesthetic choices. Uses variety of media with skill. Analyses and evaluates visual art with vocabulary. Communicates ideas/stories/emotions through works. Develops personal style.',
      },
    ],
    prerequisites: ['P2', 'M6'],
    enables: ['C6', 'L6'],
    curriculumCodes: [
      'AC9AVA2C01',
      'AC9AVA2R01',
      'AC9AVA4C01',
      'AC9AVA4R01',
      'AC9AVA6C01',
      'AC9AVA6R01',
    ],
  },

  {
    id: 'C6',
    title: 'Design & Construction',
    domain: 'technologies',
    description:
      'The child designs and builds things — using iterative processes of planning, making, testing, and improving to solve problems and create functional or aesthetic objects.',
    dlos: [
      {
        title: 'Builds with materials with purpose; talks about plans; identifies problems to solve',
        tier: 'emerging',
        description:
          'Builds with construction materials (blocks, Lego, boxes) with purpose. Talks about what they\'ll make before starting. Identifies problem to solve. Explores how things work.',
      },
      {
        title: 'Draws plans or designs before building; selects materials; tests and modifies',
        tier: 'developing',
        description:
          'Draws plans or designs before building. Selects materials based on properties and task. Tests creation and identifies what works. Modifies designs based on testing. Describes design process.',
      },
      {
        title: 'Plans with clear specifications; uses full design cycle; considers user needs; documents process',
        tier: 'demonstrating',
        description:
          'Plans designs with clear specifications and constraints. Uses full design cycle (define→design→make→evaluate→improve). Considers user needs. Evaluates trade-offs. Documents process and explains decisions.',
      },
    ],
    prerequisites: ['P2', 'M5', 'S4'],
    enables: ['M9', 'S4', 'EF4'],
    curriculumCodes: [
      'AC9TDE2P01',
      'AC9TDE2P02',
      'AC9TDE2P03',
      'AC9TDE2P04',
      'AC9TDE4P01',
      'AC9TDE4P02',
      'AC9TDE4P03',
      'AC9TDE4P04',
      'AC9TDE6P01',
      'AC9TDE6P02',
      'AC9TDE6P03',
      'AC9TDE6P04',
    ],
  },

  {
    id: 'C7',
    title: 'Digital Creation',
    domain: 'technologies',
    description:
      'The child uses digital tools creatively — from basic digital media creation to computational thinking, coding, and algorithmic problem-solving.',
    dlos: [
      {
        title: 'Uses digital tools for simple creative tasks; understands devices follow instructions',
        tier: 'emerging',
        description:
          'Uses digital tools for simple creative tasks (drawing apps, camera). Understands digital devices follow instructions. Follows step sequences. Identifies everyday digital technology.',
      },
      {
        title: 'Creates digital content; writes simple algorithms; uses visual programming tools',
        tier: 'developing',
        description:
          'Creates digital content (presentations, animations, programs). Writes simple algorithms or step-by-step instructions. Uses visual programming tools (Scratch). Organises data digitally. Debugs simple errors.',
      },
      {
        title: 'Creates complex digital projects; applies computational thinking; designs and tests algorithms',
        tier: 'demonstrating',
        description:
          'Creates complex projects combining multiple tools. Applies computational thinking (decomposition, pattern, abstraction). Designs and tests algorithms. Understands data types and storage. Evaluates solutions.',
      },
    ],
    prerequisites: ['EF4', 'M4'],
    enables: ['C6', 'M9'],
    curriculumCodes: [
      'AC9TDI2P01',
      'AC9TDI2P02',
      'AC9TDI2P03',
      'AC9TDI2P04',
      'AC9TDI2P05',
      'AC9TDI4P01',
      'AC9TDI4P02',
      'AC9TDI4P03',
      'AC9TDI4P04',
      'AC9TDI4P05',
      'AC9TDI6P01',
      'AC9TDI6P02',
      'AC9TDI6P03',
      'AC9TDI6P04',
      'AC9TDI6P05',
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // DOMAIN 8: EXECUTIVE FUNCTION & LEARNING-TO-LEARN (8 threads)
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'EF1',
    title: 'Sustained Attention & Focus',
    domain: 'english',
    description:
      'The child can maintain focused attention on a task or activity — both during structured learning and self-directed exploration — with increasing duration and resistance to distraction.',
    dlos: [
      {
        title: 'Engages for few minutes before seeking something new; returns to activity with prompting',
        tier: 'emerging',
        description:
          'Engages with activity for few minutes before seeking new thing. Returns to activity after interruption with prompting. Shows focused engagement in high-interest activities. Responds to redirection.',
      },
      {
        title: 'Sustains attention for 15-20+ minutes; returns without prompting; ignores minor distractions',
        tier: 'developing',
        description:
          'Sustains attention on task for 15-20+ minutes. Returns after interruption without prompting. Ignores minor distractions. Completes multi-step activities. Recognises when attention drifted.',
      },
      {
        title: 'Sustains deep focus for extended periods; manages attention strategically; demonstrates flow',
        tier: 'demonstrating',
        description:
          'Sustains deep focus for extended periods (30+ minutes). Manages attention strategically (quiet spaces, removing distractions). Maintains focus during challenging tasks. Transitions attention efficiently. Demonstrates flow states.',
      },
    ],
    enables: ['L3', 'S5', 'EF2'],
    curriculumCodes: [],
  },

  {
    id: 'EF2',
    title: 'Working Memory',
    domain: 'english',
    description:
      'The child can hold and manipulate information in their mind — following multi-step instructions, solving problems mentally, and connecting ideas across time.',
    dlos: [
      {
        title: 'Follows one-step instructions; remembers where left objects; recalls simple messages',
        tier: 'emerging',
        description:
          'Follows one-step instruction. Remembers where left familiar object. Recalls simple message to pass to person. Holds one piece of information while completing task.',
      },
      {
        title: 'Follows 2-3 step instructions; holds question in mind while searching for answer',
        tier: 'developing',
        description:
          'Follows 2-3 step instructions without reminding. Holds question in mind while searching answer. Remembers and applies rule while working. Connects information from text beginning to end. Remembers what was doing after interruption.',
      },
      {
        title: 'Follows complex multi-step procedures; solves problems with multiple variables',
        tier: 'demonstrating',
        description:
          'Follows complex multi-step procedures from memory. Solves problems holding multiple variables. Connects ideas across different contexts. Uses memory strategies deliberately. Manages multiple demands simultaneously.',
      },
    ],
    prerequisites: ['EF1'],
    enables: ['M2', 'L3'],
    curriculumCodes: [],
  },

  {
    id: 'EF3',
    title: 'Memory & Recall',
    domain: 'english',
    description:
      'The child stores and retrieves information over time — remembering facts, events, procedures, and concepts and accessing them when needed.',
    dlos: [
      {
        title: 'Recalls recent events when prompted; remembers names; recognises previously encountered information',
        tier: 'emerging',
        description:
          'Recalls recent events when prompted. Remembers names of familiar people and places. Recognises previously encountered information. Recalls favourite stories or songs.',
      },
      {
        title: 'Recalls key facts from recent learning; uses prior knowledge; remembers procedures',
        tier: 'developing',
        description:
          'Recalls key facts from recent learning without prompting. Uses prior knowledge to make connections. Remembers procedures. Retrieves mathematical facts with increasing automaticity. Recalls information from weeks ago.',
      },
      {
        title: 'Draws on broad knowledge base; retrieves quickly and accurately; makes connections',
        tier: 'demonstrating',
        description:
          'Draws on broad base of prior knowledge across domains. Retrieves information quickly and accurately. Makes connections between stored knowledge and novel situations. Uses memory strategies deliberately. Demonstrates deep, flexible knowledge.',
      },
    ],
    prerequisites: ['EF1'],
    enables: ['M2', 'L4', 'H1'],
    curriculumCodes: [],
  },

  {
    id: 'EF4',
    title: 'Planning & Organisation',
    domain: 'english',
    description:
      'The child approaches tasks and projects systematically — setting goals, making plans, organising materials, managing time, and adjusting course when needed.',
    dlos: [
      {
        title: 'Gathers materials before starting when reminded; follows provided sequence',
        tier: 'emerging',
        description:
          'Gathers materials before starting when reminded. Follows provided sequence of steps. Identifies what needed to start. Accepts help breaking big task into steps.',
      },
      {
        title: 'Breaks task into steps with minimal guidance; gathers materials independently; creates simple plans',
        tier: 'developing',
        description:
          'Breaks task into steps with minimal guidance. Gathers necessary materials independently. Creates simple plans (lists, drawings, outlines). Manages time with support. Adjusts plans when not working.',
      },
      {
        title: 'Plans multi-day/week projects independently; prioritises; creates organisational systems',
        tier: 'demonstrating',
        description:
          'Plans multi-day or multi-week projects independently. Prioritises tasks and manages competing demands. Creates and maintains organisational systems. Anticipates problems and plans contingencies. Reflects and improves strategies.',
      },
    ],
    prerequisites: ['EF1', 'PS3'],
    enables: ['M9', 'S1', 'H5', 'C6'],
    curriculumCodes: [],
  },

  {
    id: 'EF5',
    title: 'Critical Thinking',
    domain: 'english',
    description:
      'The child analyses, evaluates, and synthesises information — questioning assumptions, identifying logic, weighing evidence, and forming reasoned judgments.',
    dlos: [
      {
        title: 'Asks "why" and "how do you know" questions; notices when something doesn\'t make sense',
        tier: 'emerging',
        description:
          'Asks "why?" and "how do you know?" questions. Notices when something doesn\'t seem right. Compares two options and explains preference. Identifies real from imaginary.',
      },
      {
        title: 'Identifies assumptions; evaluates evidence before accepting claims; considers alternative explanations',
        tier: 'developing',
        description:
          'Identifies assumptions in own and others\' thinking. Evaluates evidence before accepting. Considers alternative explanations. Distinguishes strong and weak reasons. Asks probing questions.',
      },
      {
        title: 'Analyses complex issues from multiple perspectives; identifies logical fallacies',
        tier: 'demonstrating',
        description:
          'Analyses complex issues from multiple perspectives. Identifies logical fallacies and weak reasoning. Synthesises information from multiple sources. Evaluates quality and relevance of evidence. Forms and defends positions.',
      },
    ],
    prerequisites: ['L3', 'EF2'],
    enables: ['L8', 'H2', 'S6', 'M9'],
    curriculumCodes: [],
  },

  {
    id: 'EF6',
    title: 'Collaboration & Teamwork',
    domain: 'english',
    description:
      'The child works effectively with others toward shared goals — contributing ideas, listening, compromising, and sharing responsibility for outcomes.',
    dlos: [
      {
        title: 'Works alongside others on shared activity; accepts role; shares materials willingly',
        tier: 'emerging',
        description:
          'Works alongside others on shared activity. Accepts role in group task. Shares materials willingly. Listens to others\' ideas during activities.',
      },
      {
        title: 'Contributes ideas and listens; negotiates roles; stays on task; helps others',
        tier: 'developing',
        description:
          'Contributes ideas and listens to others. Negotiates roles and responsibilities. Stays on task during group work. Helps others struggling. Compromises when disagreements arise.',
      },
      {
        title: 'Takes initiative and leadership; distributes work equitably; facilitates discussions',
        tier: 'demonstrating',
        description:
          'Takes initiative and shows leadership in projects. Distributes work equitably and holds self accountable. Facilitates discussions and ensures all voices heard. Evaluates group processes. Adapts role to team needs.',
      },
    ],
    prerequisites: ['PS2', 'L1'],
    enables: ['P4', 'S1'],
    curriculumCodes: [
      'AC9HP2M05',
      'AC9HP3M04',
      'AC9HP4M04',
    ],
  },

  {
    id: 'EF7',
    title: 'Metacognition & Reflective Practice',
    domain: 'english',
    description:
      'The child thinks about their own thinking and learning — understanding how they learn best, monitoring their understanding, and adjusting their approach.',
    dlos: [
      {
        title: 'Responds to "What did you learn?" with specific answers; identifies easy/hard activities',
        tier: 'emerging',
        description:
          'Responds to "What did you learn?" with specific answers. Identifies activities they find easy or hard. Shows awareness that practice improves performance. Accepts feedback.',
      },
      {
        title: 'Describes learning strategies used; identifies understanding and confusion; adjusts approach',
        tier: 'developing',
        description:
          'Describes strategies they use for learning. Identifies what they understand and what they\'re confused about. Adjusts approach when not working. Reflects on work and identifies what\'d do differently. Seeks feedback.',
      },
      {
        title: 'Monitors understanding in real-time; selects and applies learning strategies deliberately',
        tier: 'demonstrating',
        description:
          'Monitors own understanding in real-time. Selects and applies strategies deliberately for different tasks. Sets personal learning goals and tracks progress. Provides constructive feedback to others. Articulates personal learning philosophy.',
      },
    ],
    prerequisites: ['L1', 'PS3'],
    enables: [],
    curriculumCodes: [],
  },

  {
    id: 'EF8',
    title: 'Creative Thinking & Innovation',
    domain: 'english',
    description:
      'The child generates novel ideas, sees possibilities, takes intellectual risks, and approaches problems with imagination and originality.',
    dlos: [
      {
        title: 'Engages in imaginative play; suggests unusual ideas; shows curiosity and experiments',
        tier: 'emerging',
        description:
          'Engages in imaginative play and "what if" scenarios. Suggests unusual ideas without self-censoring. Shows curiosity and asks original questions. Experiments with materials freely.',
      },
      {
        title: 'Generates multiple ideas when brainstorming; combines existing ideas in new ways',
        tier: 'developing',
        description:
          'Generates multiple ideas when brainstorming. Combines existing ideas in new ways. Takes intellectual risks. Builds on others\' ideas constructively. Sees problems as opportunities.',
      },
      {
        title: 'Produces original and effective creative works; applies creative thinking across domains',
        tier: 'demonstrating',
        description:
          'Produces original and effective creative works or solutions. Applies creative thinking across domains (not just arts). Evaluates ideas for feasibility while maintaining ambition. Persists through creative process. Demonstrates personal creative voice.',
      },
    ],
    prerequisites: ['EF1', 'PS3'],
    enables: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'M9', 'C6'],
    curriculumCodes: [],
  },
];

/**
 * Seed all 57 capability threads into Sanity.
 * Run with: npx ts-node src/scripts/seed-capability-threads.ts
 */
export async function seedCapabilityThreads() {
  console.log('🌱 Seeding capability threads...\n');

  let created = 0;
  let failed = 0;

  for (const threadData of THREADS) {
    try {
      const result = await createCapabilityThread({
        _id: `capability-thread-${threadData.id}`,
        title: threadData.title,
        domain: threadData.domain,
        description: threadData.description,
        dlos: threadData.dlos,
        prerequisites: threadData.prerequisites,
        enables: threadData.enables,
        curriculumCodes: threadData.curriculumCodes,
      });

      console.log(`✓ ${threadData.id}: ${threadData.title}`);
      created++;
    } catch (error) {
      console.error(`✗ ${threadData.id}: ${threadData.title}`, error);
      failed++;
    }
  }

  console.log(`\n✨ Seeding complete: ${created} created, ${failed} failed`);
  return { created, failed };
}

// Run if this is the main module
if (require.main === module) {
  seedCapabilityThreads().then((result) => {
    process.exit(result.failed > 0 ? 1 : 0);
  });
}
