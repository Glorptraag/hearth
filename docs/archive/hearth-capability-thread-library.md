# Hearth Capability Thread Library
## Foundational Data Architecture for Learning Progression

> **⚠️ Read this banner first (added 2026-05-26):**
>
> - **Thread contents below are canonical.** All 57 threads (L1–L9, M1–M9, S1–S6, H1–H6, P1–P5, PS1–PS7, C1–C7, EF1–EF8) match Sanity production.
> - **Domain grouping below is stale.** This doc still describes 8 domains. Production runs the **15-domain v2 taxonomy** — see `src/lib/capability-universe-v2.ts` and Sanity `capabilityDomain` docs. Threads have been re-distributed across the 15 domains.
> - **DLO model:** 3 tier bands per thread (emerging / developing / demonstrating), 171 docs total in Sanity. This is the only DLO grain that ships. The fine-grained AC9-mapped Layer 4 in `hearth-capabilities-connector-architecture.md` is **not** shipped and **not** planned — AU/QLD do not mandate that grain.
> - **Substrate scaffolding only:** `strand`, `atomicCapability`, and `prerequisiteEdge` Sanity schemas exist but are unseeded. Treat as Phase 2.
>
> Do not rewrite this doc until thread *contents* change. Domain mapping lives in code.

> **Status:** Phase A â€” Content Architecture (pre-implementation)
> **Date:** 14 February 2026
> **Purpose:** Define the complete capability thread library that powers the constellation visualization, scaffolding engine, observation tagging, and progression reporting.
> **Audience:** Development team, content designers, curriculum consultants

---

## Design Principles

### The Right Granularity

Capability threads sit at the **transferable skill** level â€” broad enough to span multiple year levels and accumulate hundreds of observations over a child's learning journey, but specific enough that a parent can recognise what the thread means and identify when their child is demonstrating it.

**Too granular (reject):** "Can count to 20" â€” this is a single milestone, not a thread. It gets checked off and has no further life.

**Too broad (reject):** "Learning maths" â€” this is a domain, not an observable capability. It tells stakeholders nothing about what the child can actually do.

**Right level (target):** "Number Sense & Place Value" â€” spans Foundation through Year 6+, scaffolds from "recognises that numbers represent quantity" through "composes and decomposes multi-digit numbers fluently." A parent can observe this in daily life. A school receiving a transfer student can understand what it means. A post-secondary institution can see the trajectory.

### Scaffolding Philosophy

Every thread has **prerequisite threads** (what typically needs to be in place first) and **enables threads** (what this thread opens up). This creates a directed acyclic graph (DAG) of learning progression.

The scaffolding is **probabilistic, not absolute**. A child might demonstrate "Fractional Thinking" before fully consolidating "Number Sense" â€” the system flags this as unusual and interesting, not wrong. The prerequisite graph informs recommendations and ghost nodes, not gates.

### Tier Definitions (Global)

| Tier | Label | Definition | Evidence Pattern |
|------|-------|------------|-----------------|
| **Emerging** | First signs | Child is beginning to engage with the concept. May need prompting, scaffolding, or a specific context to demonstrate the behaviour. | 1â€“3 observations, often with support noted |
| **Developing** | Growing | Child shows the capability in supported or familiar contexts. Becoming more consistent but may not transfer to new situations yet. | 4â€“8 observations across 2+ contexts |
| **Demonstrating** | Solid | Child shows the capability independently, in new contexts, and can often explain or teach it to others. | 8+ observations including novel contexts |

Tier progression is **suggested by the system, confirmed by the parent**. The parent always has final authority (trust-based design).

### Curriculum Mapping Approach

Each thread maps to multiple Australian Curriculum V9 content descriptors across year levels. The mapping is **many-to-many**: a single content descriptor might touch 2â€“3 threads, and a single thread covers content descriptors across Foundation through Year 6+.

Content descriptor codes follow AC V9 format: `AC9[Subject][Year][Strand][Number]`
- English: E, strands LA (Language), LE (Literature), LY (Literacy)
- Mathematics: M, strands N (Number), A (Algebra), M (Measurement), SP (Space), ST (Statistics), P (Probability)
- Science: S, strands SU (Science Understanding), SHE (Science as Human Endeavour), SIS (Science Inquiry Skills)
- HASS: HS, strands K (Knowledge), S (Skills)
- HPE: HP, strands P (Personal), M (Movement)

### Philosophy Neutrality

All threads describe **what** a child can do, never **how** they learned it. A Charlotte Mason family's nature journal observations and a Montessori family's structured material work can both generate observations against the same "Scientific Observation" thread. The pedagogical lens is applied at the activity/module level, never at the capability level.

---

## Domain Structure

The thread library is organised into **8 domains** containing **57 capability threads** total.

| Domain | Thread Count | Colour | Primary AC V9 Mapping |
|--------|-------------|--------|----------------------|
| Language & Literacy | 9 | Blue (#60A5FA) | English |
| Mathematical Thinking | 9 | Ember (#D97B3A) | Mathematics |
| Scientific Thinking | 6 | Sage (#4ADE80) | Science |
| Humanities & Social Understanding | 6 | Violet (#A78BFA) | HASS |
| Physical Capability | 5 | Rose (#FB7185) | HPE (Movement) |
| Personal & Social Development | 7 | Rose (#FB7185) | HPE (Personal) + General Capabilities |
| Creative Expression | 7 | Teal (#5EEAD4) | Cross-curricular (Arts, English, Technologies) |
| Executive Function & Learning | 8 | Warm Grey (#9B8B7E) | General Capabilities |

The first 5 domains map directly to HEU reporting requirements (the 5 mandated learning areas). Domains 6â€“8 capture essential developmental capabilities that enrich the learning narrative and demonstrate holistic growth â€” critical for post-secondary transitions and school transfer documentation.

---

## Domain 1: Language & Literacy

### Thread L1: Oral Communication & Listening

**What it looks like:** The child can listen actively, respond meaningfully in conversation, share ideas clearly, and adapt their communication to different situations and audiences.

**Prerequisite threads:** None (foundational)
**Enables threads:** L3 Reading Comprehension, L5 Written Expression, L8 Persuasion & Argument, PS1 Empathy & Perspective-Taking

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9EFLY01, AC9EFLY02, AC9E1LY01, AC9E1LY02, AC9E2LY01, AC9E2LY02
- Y3â€“Y6: AC9E3LY01, AC9E3LY02, AC9E4LY01, AC9E4LY02, AC9E5LY01, AC9E5LY02, AC9E6LY01, AC9E6LY02

**Observable Indicators:**

*Emerging:*
- Listens when spoken to directly and responds with a relevant word or phrase
- Shares a preference or opinion when asked ("I like the blue one")
- Follows a simple instruction with one or two steps
- Takes turns in a conversation with prompting

*Developing:*
- Initiates conversation about experiences or interests without prompting
- Asks clarifying questions when they don't understand something
- Retells a simple event or story in approximate sequence
- Adjusts volume or tone for different settings (library vs playground)
- Listens to a peer's idea and responds to it (not just waiting to talk)

*Demonstrating:*
- Presents ideas to a small group with confidence and coherence
- Adapts language for different audiences (explaining to a younger child vs an adult)
- Sustains a multi-turn conversation on a topic, building on what others say
- Uses specific vocabulary from learning contexts in conversation
- Can listen to a complex set of instructions and carry them out independently

---

### Thread L2: Phonological Awareness & Decoding

**What it looks like:** The child understands that spoken words are made up of sounds, can manipulate those sounds, and uses this knowledge to decode (read) and encode (spell) words.

**Prerequisite threads:** L1 Oral Communication
**Enables threads:** L3 Reading Comprehension, L4 Spelling & Word Knowledge, L6 Handwriting & Text Production

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9EFLY09, AC9EFLY10, AC9E1LY09, AC9E1LY10, AC9E2LY09, AC9E2LY10
- Y3â€“Y4: AC9E3LY09, AC9E3LY10, AC9E4LY09, AC9E4LY10

**Observable Indicators:**

*Emerging:*
- Recognises rhyming words in songs or stories
- Claps or taps out syllables in familiar words
- Identifies the first sound in a spoken word
- Recognises some letters of the alphabet by name

*Developing:*
- Blends 2â€“3 phonemes to read simple CVC words (c-a-t â†’ cat)
- Segments spoken words into individual sounds
- Matches most letters to their common sounds
- Reads familiar high-frequency words by sight
- Self-corrects when a decoded word doesn't make sense

*Demonstrating:*
- Reads unfamiliar words by applying phonics knowledge fluently
- Handles consonant blends, digraphs, and common vowel patterns
- Reads with phrasing and expression, not word-by-word
- Applies knowledge of word families and patterns to decode new words
- Recognises and reads multisyllabic words by breaking them into parts

---

### Thread L3: Reading Comprehension

**What it looks like:** The child makes meaning from texts â€” understanding what is stated explicitly, making inferences, connecting ideas across a text, and bringing their own experience to interpretation.

**Prerequisite threads:** L1 Oral Communication, L2 Phonological Awareness (developing)
**Enables threads:** L5 Written Expression, L7 Text Structure & Purpose, L8 Persuasion & Argument, H2 Source Analysis, EF5 Critical Thinking

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9EFLY04, AC9EFLY05, AC9E1LY04, AC9E1LY05, AC9E2LY04, AC9E2LY05
- Y3â€“Y6: AC9E3LY04, AC9E3LY05, AC9E4LY04, AC9E4LY05, AC9E5LY04, AC9E5LY05, AC9E6LY04, AC9E6LY05

**Observable Indicators:**

*Emerging:*
- Points to pictures that relate to what's being read
- Answers "what happened?" questions about a story just read aloud
- Makes connections to personal experience ("That happened to me too!")
- Identifies main characters in a narrative

*Developing:*
- Predicts what might happen next based on text clues
- Retells a story including beginning, middle, and end
- Identifies the main idea in a short informational text
- Asks questions about unfamiliar words or concepts while reading
- Makes simple inferences ("She must be sad because she's crying")

*Demonstrating:*
- Compares ideas or information across two or more texts
- Identifies the author's purpose or perspective
- Distinguishes between fact and opinion in informational texts
- Uses evidence from the text to support an interpretation
- Monitors own comprehension and uses strategies when meaning breaks down
- Reads and comprehends texts independently for sustained periods

---

### Thread L4: Spelling & Word Knowledge

**What it looks like:** The child understands how English words are structured â€” morphemes, etymology, spelling patterns â€” and applies this knowledge when writing.

**Prerequisite threads:** L2 Phonological Awareness
**Enables threads:** L5 Written Expression, L6 Handwriting & Text Production

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9EFLA03, AC9E1LA03, AC9E2LA03
- Y3â€“Y6: AC9E3LA03, AC9E4LA03, AC9E5LA03, AC9E6LA03

**Observable Indicators:**

*Emerging:*
- Represents sounds in words with plausible letter choices (invented spelling)
- Spells some high-frequency words correctly
- Recognises when a word "doesn't look right"
- Attempts to write unfamiliar words using sound knowledge

*Developing:*
- Applies common spelling patterns consistently (silent e, double consonants)
- Uses word families to spell related words
- Spells most high-frequency words for their year level correctly
- Begins to use morphemic knowledge (adding -ed, -ing, -s)
- Uses a dictionary, word wall, or digital tool to check spelling

*Demonstrating:*
- Applies understanding of prefixes, suffixes, and root words
- Spells words with complex patterns (vowel digraphs, unusual combinations)
- Self-edits for spelling errors in own writing
- Uses etymological knowledge to predict spelling of unfamiliar words
- Demonstrates growing vocabulary through precise word choice in writing

---

### Thread L5: Written Expression

**What it looks like:** The child communicates ideas, experiences, and arguments in writing with increasing control over structure, voice, and audience awareness.

**Prerequisite threads:** L1 Oral Communication (developing), L2 Phonological Awareness (emerging), L6 Handwriting & Text Production (emerging)
**Enables threads:** L7 Text Structure & Purpose, L8 Persuasion & Argument

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9EFLY06, AC9E1LY06, AC9E2LY06
- Y3â€“Y6: AC9E3LY06, AC9E4LY06, AC9E5LY06, AC9E6LY06

**Observable Indicators:**

*Emerging:*
- Dictates ideas for an adult to write down
- Writes or draws to convey a simple message
- Attempts sentences with a capital letter and full stop
- Labels pictures or diagrams with words

*Developing:*
- Writes multiple connected sentences on a topic
- Includes a beginning, middle, and end in narratives
- Uses some descriptive language (adjectives, simple adverbs)
- Writes for different purposes when prompted (list, letter, story)
- Re-reads own writing and makes simple changes

*Demonstrating:*
- Plans before writing using notes, diagrams, or outlines
- Writes sustained texts with clear structure and paragraphing
- Varies sentence length and type for effect
- Shows awareness of audience in word choice and tone
- Edits and revises own work for clarity, not just correctness
- Writes effectively across multiple text types (narrative, informational, persuasive)

---

### Thread L6: Handwriting & Text Production

**What it looks like:** The child produces legible written text â€” whether through handwriting, typing, or other tools â€” with increasing fluency and automaticity.

**Prerequisite threads:** P2 Fine Motor & Manipulation (emerging)
**Enables threads:** L5 Written Expression

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9EFLY08, AC9E1LY08, AC9E2LY08
- Y3â€“Y4: AC9E3LY08, AC9E4LY08

**Observable Indicators:**

*Emerging:*
- Holds a writing tool with a functional grip
- Forms recognisable letters (may be inconsistent in size/placement)
- Writes own name
- Distinguishes between drawing and writing

*Developing:*
- Forms most letters correctly with consistent size
- Writes on lines with appropriate spacing between words
- Produces legible text that others can read without assistance
- Writes with sufficient fluency that ideas aren't lost while forming letters
- Begins to use joined/cursive writing or efficient keyboard skills

*Demonstrating:*
- Produces text fluently in chosen mode (handwriting or typing)
- Writing tool no longer limits the complexity or length of written expression
- Adapts presentation for purpose (neat copy vs quick notes)
- Uses digital tools for text production when appropriate

---

### Thread L7: Text Structure & Purpose

**What it looks like:** The child understands that different text types are structured differently depending on their purpose, and can both recognise and use these structures.

**Prerequisite threads:** L3 Reading Comprehension (developing), L5 Written Expression (developing)
**Enables threads:** L8 Persuasion & Argument, H2 Source Analysis

**AC V9 Content Descriptors:**
- Y1â€“Y2: AC9E1LA01, AC9E1LA02, AC9E2LA01, AC9E2LA02
- Y3â€“Y6: AC9E3LA01, AC9E3LA02, AC9E4LA01, AC9E4LA02, AC9E5LA01, AC9E5LA02, AC9E6LA01, AC9E6LA02

**Observable Indicators:**

*Emerging:*
- Recognises the difference between a story and an information text
- Identifies basic text features (title, pictures, page numbers)
- Understands that texts are written for different reasons

*Developing:*
- Names and recognises common text types (narrative, procedure, report)
- Uses appropriate structure when writing a familiar text type
- Identifies text features that help readers (headings, captions, diagrams)
- Understands the purpose of features like contents pages and glossaries

*Demonstrating:*
- Explains how text structure supports the author's purpose
- Chooses appropriate text type for a given communication need
- Analyses how language features differ across text types
- Creates texts that deliberately combine or adapt structures for effect
- Evaluates whether a text's structure effectively serves its purpose

---

### Thread L8: Persuasion & Argument

**What it looks like:** The child can construct and evaluate arguments â€” identifying claims, supporting evidence, and rhetorical strategies in others' texts and their own.

**Prerequisite threads:** L3 Reading Comprehension (developing), L5 Written Expression (developing), L7 Text Structure & Purpose (emerging), EF5 Critical Thinking (emerging)
**Enables threads:** H2 Source Analysis, EF5 Critical Thinking

**AC V9 Content Descriptors:**
- Y3â€“Y6: AC9E3LE03, AC9E4LE03, AC9E5LE03, AC9E6LE03, AC9E5LA06, AC9E6LA06

**Observable Indicators:**

*Emerging:*
- Expresses a preference with a simple reason ("I think cats are better because they're soft")
- Recognises when someone is trying to convince them of something
- Understands that people can have different opinions about the same thing

*Developing:*
- Gives multiple reasons to support an opinion
- Identifies persuasive techniques in advertisements or familiar texts
- Writes a simple persuasive text with a clear position and reasons
- Considers a counter-argument when prompted ("But what would someone else say?")

*Demonstrating:*
- Constructs sustained arguments with evidence and reasoning
- Evaluates the strength of evidence in others' arguments
- Identifies bias, emotive language, and rhetorical strategies
- Acknowledges counter-arguments and addresses them
- Distinguishes between fact, opinion, and reasoned judgment

---

### Thread L9: Literary Response & Appreciation

**What it looks like:** The child engages with literature â€” responding personally, aesthetically, and critically to stories, poems, and other literary forms.

**Prerequisite threads:** L1 Oral Communication, L3 Reading Comprehension (emerging)
**Enables threads:** C1 Narrative & Storytelling, C3 Poetic & Rhythmic Expression

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9EFLE01, AC9EFLE02, AC9E1LE01, AC9E1LE02, AC9E2LE01, AC9E2LE02
- Y3â€“Y6: AC9E3LE01, AC9E3LE02, AC9E4LE01, AC9E4LE02, AC9E5LE01, AC9E5LE02, AC9E6LE01, AC9E6LE02

**Observable Indicators:**

*Emerging:*
- Shows enjoyment of stories being read aloud (engagement, requests for re-reading)
- Has favourite books, characters, or types of stories
- Responds to "What did you think?" with a personal reaction
- Recognises story elements (character, setting, problem)

*Developing:*
- Explains why they like or dislike a text with reference to specific parts
- Identifies with characters and discusses motivations and feelings
- Recognises literary devices (rhyme, repetition, imagery) when pointed out
- Compares two texts by the same author or on the same topic
- Recommends books to others with reasons

*Demonstrating:*
- Discusses themes and ideas across multiple texts
- Analyses how authors create effect through language choices
- Responds to literature with personal interpretation and evidence
- Appreciates literary forms (poetry, drama, prose) and their conventions
- Evaluates how texts reflect different cultural or historical perspectives

---

## Domain 2: Mathematical Thinking

### Thread M1: Number Sense & Place Value

**What it looks like:** The child has an intuitive understanding of quantity, can compose and decompose numbers, understands the structure of our number system, and can work flexibly with numbers.

**Prerequisite threads:** None (foundational)
**Enables threads:** M2 Operations & Computation, M3 Fractional Thinking, M5 Measurement Sense, M7 Data & Statistical Thinking

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9MFN01, AC9MFN02, AC9MFN03, AC9M1N01, AC9M1N02, AC9M2N01, AC9M2N02
- Y3â€“Y6: AC9M3N01, AC9M4N01, AC9M5N01, AC9M6N01

**Observable Indicators:**

*Emerging:*
- Counts objects with one-to-one correspondence (touching each one)
- Recognises that the last number counted tells "how many"
- Compares two groups and identifies which has more or fewer
- Recognises numerals and connects them to quantities
- Understands that numbers come in a fixed order

*Developing:*
- Counts forwards and backwards from any starting point
- Uses skip counting (2s, 5s, 10s) purposefully
- Understands tens and ones (24 is two tens and four ones)
- Orders numbers on a number line with reasonable accuracy
- Estimates quantities and checks by counting
- Recognises patterns in number sequences

*Demonstrating:*
- Composes and decomposes numbers flexibly (38 = 30+8 = 20+18)
- Understands place value across hundreds, thousands, and beyond
- Uses place value understanding to compare and order large numbers
- Rounds numbers to appropriate benchmarks
- Applies number sense to check reasonableness of calculations
- Reads, writes, and orders numbers to at least 10,000

---

### Thread M2: Operations & Computation

**What it looks like:** The child understands the four operations (addition, subtraction, multiplication, division), their relationships to each other, and can compute fluently using a range of strategies.

**Prerequisite threads:** M1 Number Sense & Place Value
**Enables threads:** M3 Fractional Thinking, M4 Algebraic Thinking, M5 Measurement Sense, M7 Data & Statistical Thinking

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9MFN04, AC9MFN05, AC9M1N03, AC9M1N04, AC9M2N03, AC9M2N04
- Y3â€“Y6: AC9M3N03, AC9M3N04, AC9M4N03, AC9M4N04, AC9M5N03, AC9M5N04, AC9M6N03, AC9M6N04

**Observable Indicators:**

*Emerging:*
- Combines two groups and counts the total
- Removes objects from a group and counts what remains
- Uses concrete materials to model simple addition and subtraction
- Recognises situations as "putting together" or "taking away"
- Shares objects equally between two people

*Developing:*
- Uses mental strategies for addition and subtraction (counting on, doubles, making 10)
- Recalls basic addition and subtraction facts with increasing fluency
- Understands multiplication as repeated groups ("3 groups of 4")
- Uses arrays, skip counting, or concrete materials for multiplication
- Recognises the inverse relationship between addition and subtraction
- Solves simple word problems by choosing the correct operation

*Demonstrating:*
- Computes fluently with all four operations using efficient strategies
- Knows multiplication facts and uses them to derive division facts
- Applies operations to solve multi-step problems
- Estimates answers before computing and checks for reasonableness
- Selects the most efficient strategy for a given computation
- Uses the relationship between operations to check answers

---

### Thread M3: Fractional Thinking

**What it looks like:** The child understands parts and wholes â€” fractions, decimals, and percentages as different representations of the same idea, and can operate with them in practical contexts.

**Prerequisite threads:** M1 Number Sense & Place Value (developing), M2 Operations & Computation (emerging)
**Enables threads:** M5 Measurement Sense, M4 Algebraic Thinking

**AC V9 Content Descriptors:**
- Y1â€“Y2: AC9M1N05, AC9M2N05
- Y3â€“Y6: AC9M3N02, AC9M4N02, AC9M5N02, AC9M5N05, AC9M6N02, AC9M6N05

**Observable Indicators:**

*Emerging:*
- Understands "half" as splitting something into two equal parts
- Identifies whether a share is fair or unfair
- Recognises halves and quarters in everyday contexts (half an apple, quarter of a pizza)
- Uses language of parts: "a piece of," "a bit of," "half"

*Developing:*
- Names and recognises common unit fractions (Â½, â…“, Â¼, â…•)
- Understands that fractions represent equal parts of a whole
- Locates simple fractions on a number line
- Compares and orders unit fractions (Â¼ is smaller than Â½)
- Connects fractions to division ("Â¼ means dividing by 4")
- Identifies equivalent fractions using concrete or visual models

*Demonstrating:*
- Adds and subtracts fractions with related denominators
- Connects fractions, decimals, and percentages
- Uses fractions in measurement and data contexts
- Compares and orders fractions with different denominators
- Applies fractional thinking to solve practical problems
- Understands and uses improper fractions and mixed numbers

---

### Thread M4: Algebraic Thinking & Patterns

**What it looks like:** The child recognises, describes, and extends patterns; understands the concept of equality and uses symbols to represent unknown quantities; thinks about relationships between quantities.

**Prerequisite threads:** M1 Number Sense & Place Value, M2 Operations & Computation (emerging)
**Enables threads:** EF5 Critical Thinking, S1 Scientific Inquiry

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9MFA01, AC9MFA02, AC9M1A01, AC9M1A02, AC9M2A01, AC9M2A02
- Y3â€“Y6: AC9M3A01, AC9M3A02, AC9M4A01, AC9M4A02, AC9M5A01, AC9M5A02, AC9M6A01, AC9M6A02

**Observable Indicators:**

*Emerging:*
- Copies a simple repeating pattern (red-blue-red-blue)
- Identifies what comes next in a simple pattern
- Sorts objects by one attribute (colour, size, shape)
- Recognises patterns in daily routines (before/after)

*Developing:*
- Creates their own patterns using multiple attributes
- Identifies and describes growing patterns (1, 3, 5, 7â€¦)
- Understands the equals sign as "is the same as" (not just "the answer is")
- Finds missing numbers in simple equations (__ + 3 = 7)
- Describes a rule for a number pattern in words

*Demonstrating:*
- Generates complex patterns and describes the rule
- Uses symbols or letters to represent unknown quantities
- Understands and applies order of operations
- Creates and uses algorithms to solve problems
- Identifies functional relationships between two quantities
- Applies pattern thinking to solve novel problems across domains

---

### Thread M5: Measurement Sense

**What it looks like:** The child understands measurable attributes (length, mass, capacity, time, temperature), can compare and quantify them using informal and formal units, and applies measurement in practical contexts.

**Prerequisite threads:** M1 Number Sense & Place Value (emerging), M2 Operations & Computation (emerging)
**Enables threads:** M3 Fractional Thinking, S3 Earth & Environmental Systems, M7 Data & Statistical Thinking

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9MFM01, AC9MFM02, AC9M1M01, AC9M1M02, AC9M1M03, AC9M2M01, AC9M2M02, AC9M2M03, AC9M2M04
- Y3â€“Y6: AC9M3M01, AC9M3M02, AC9M3M03, AC9M4M01, AC9M4M02, AC9M4M03, AC9M5M01, AC9M5M02, AC9M6M01, AC9M6M02

**Observable Indicators:**

*Emerging:*
- Compares two objects directly (this one is longer/heavier)
- Uses informal language of measurement (big, small, heavy, light, long)
- Sequences events in time (morning, afternoon, night)
- Recognises that different tools measure different things

*Developing:*
- Measures using informal units (hand spans, cups) with consistency
- Understands the need for standard units and can explain why
- Uses rulers, scales, and measuring cups with increasing accuracy
- Reads clocks (at least to the half hour) and uses calendars
- Estimates measurements before checking
- Chooses appropriate units for what's being measured

*Demonstrating:*
- Measures accurately using standard metric units (cm, m, kg, g, mL, L)
- Converts between related units (cm â†” m, g â†” kg)
- Calculates perimeter, area, and volume using formulas
- Uses timetables and schedules, calculates elapsed time
- Applies measurement to solve practical multi-step problems
- Understands the relationship between units in the metric system

---

### Thread M6: Spatial Reasoning & Geometry

**What it looks like:** The child understands shape, position, movement, and transformation â€” they can visualise, describe, and manipulate objects in space.

**Prerequisite threads:** None (foundational, develops in parallel with number)
**Enables threads:** M5 Measurement Sense, P1 Gross Motor & Physical Coordination, C5 Visual Expression & Design

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9MFSP01, AC9MFSP02, AC9M1SP01, AC9M1SP02, AC9M2SP01, AC9M2SP02
- Y3â€“Y6: AC9M3SP01, AC9M3SP02, AC9M4SP01, AC9M4SP02, AC9M5SP01, AC9M5SP02, AC9M6SP01, AC9M6SP02

**Observable Indicators:**

*Emerging:*
- Names basic 2D shapes (circle, square, triangle)
- Describes position using words (next to, behind, above)
- Sorts shapes by simple attributes
- Follows and gives basic directional instructions

*Developing:*
- Identifies and describes properties of 2D and 3D shapes (faces, edges, corners)
- Recognises shapes in the environment regardless of orientation
- Creates and interprets simple maps and plans
- Identifies lines of symmetry
- Describes and performs transformations (slides, flips, turns)

*Demonstrating:*
- Classifies shapes using properties and explains reasoning
- Uses a coordinate system to describe position
- Identifies and describes the properties of angles
- Creates nets for 3D shapes and predicts the result
- Applies spatial reasoning to solve problems in other domains
- Visualises and describes transformations mentally

---

### Thread M7: Data & Statistical Thinking

**What it looks like:** The child can pose questions, collect and organise data, represent it in appropriate forms, and draw conclusions â€” understanding that data tells a story.

**Prerequisite threads:** M1 Number Sense & Place Value (emerging), M2 Operations & Computation (emerging)
**Enables threads:** S1 Scientific Inquiry, EF5 Critical Thinking, H4 Civic & Economic Understanding

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9MFST01, AC9M1ST01, AC9M2ST01
- Y3â€“Y6: AC9M3ST01, AC9M3ST02, AC9M4ST01, AC9M4ST02, AC9M5ST01, AC9M5ST02, AC9M6ST01, AC9M6ST02

**Observable Indicators:**

*Emerging:*
- Sorts objects into categories and counts how many in each
- Answers simple questions about a picture graph ("Which has more?")
- Participates in class/family surveys ("What's your favourite?")
- Understands that we can count and compare things to learn about the world

*Developing:*
- Poses their own questions that can be answered with data
- Collects data through observation, surveys, or experiments
- Creates simple data displays (picture graphs, tally charts, bar graphs)
- Reads and interprets data from tables and graphs
- Identifies the most common or least common item in a dataset
- Compares their predictions with actual data

*Demonstrating:*
- Selects appropriate data display for the type of data
- Describes data using mean, median, mode, and range
- Identifies trends, outliers, and patterns in data
- Draws conclusions and makes predictions based on data
- Evaluates the reliability and fairness of data collection methods
- Uses data to support arguments and decision-making

---

### Thread M8: Probability & Chance

**What it looks like:** The child understands that some events are certain, some are impossible, and most fall somewhere in between â€” and can reason about likelihood using both intuition and mathematical tools.

**Prerequisite threads:** M1 Number Sense & Place Value (emerging), M3 Fractional Thinking (emerging)
**Enables threads:** M7 Data & Statistical Thinking, EF5 Critical Thinking

**AC V9 Content Descriptors:**
- Y3â€“Y6: AC9M3P01, AC9M4P01, AC9M5P01, AC9M6P01

**Observable Indicators:**

*Emerging:*
- Uses language of chance (maybe, probably, definitely, no way)
- Identifies outcomes as certain, possible, or impossible
- Understands that some things happen more often than others
- Predicts outcomes of simple chance experiments (coin flips)

*Developing:*
- Lists possible outcomes of simple chance events
- Describes likelihood using a scale from impossible to certain
- Conducts simple chance experiments and records results
- Compares expected and actual results
- Understands that more trials give more reliable results

*Demonstrating:*
- Assigns numerical probabilities to events (fractions, decimals, percentages)
- Compares theoretical and experimental probability
- Identifies all possible outcomes of compound events
- Uses probability to make informed decisions
- Recognises that randomness produces patterns over large samples

---

### Thread M9: Mathematical Modelling & Problem Solving

**What it looks like:** The child can take a real-world situation, represent it mathematically, work through it, and interpret the result back in context â€” the full cycle of applied mathematics.

**Prerequisite threads:** M2 Operations & Computation (developing), M5 Measurement Sense (emerging), EF4 Planning & Organisation (emerging)
**Enables threads:** S1 Scientific Inquiry, EF5 Critical Thinking

**AC V9 Content Descriptors:**
- Y2â€“Y6: AC9M2N06, AC9M3N05, AC9M4N05, AC9M5N06, AC9M6N06, AC9M6M03

**Observable Indicators:**

*Emerging:*
- Recognises when a real situation involves mathematics
- Represents a simple problem with objects, drawings, or numbers
- Explains their thinking when solving a problem, even if the method is inefficient

*Developing:*
- Identifies what information is needed to solve a practical problem
- Tries more than one strategy when stuck
- Uses diagrams, tables, or lists to organise their approach
- Checks whether their answer makes sense in the real-world context
- Explains their method to someone else

*Demonstrating:*
- Formulates mathematical representations of complex real problems
- Selects and combines appropriate mathematical tools and strategies
- Interprets and communicates results in context, including limitations
- Evaluates the efficiency and appropriateness of different solution methods
- Applies mathematical thinking to financial, scientific, and design contexts
- Persists through multi-step problems and manages complexity

---

## Domain 3: Scientific Thinking

### Thread S1: Scientific Inquiry

**What it looks like:** The child poses investigable questions, plans and conducts investigations, collects and records data, and draws evidence-based conclusions.

**Prerequisite threads:** EF1 Sustained Attention & Focus (emerging), M7 Data & Statistical Thinking (emerging)
**Enables threads:** S2 Living Systems, S3 Earth & Environmental Systems, S4 Physical & Chemical Sciences, EF5 Critical Thinking

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9SFI01, AC9SFI02, AC9SFI03, AC9SFI04, AC9SFI05, AC9S1I01â€“05, AC9S2I01â€“05
- Y3â€“Y6: AC9S3I01â€“05, AC9S4I01â€“05, AC9S5I01â€“05, AC9S6I01â€“05

**Observable Indicators:**

*Emerging:*
- Asks "what" and "why" questions about natural phenomena
- Explores objects and materials using senses (touching, looking, smelling)
- Notices changes and differences in the environment
- Describes what they observe using everyday language

*Developing:*
- Poses questions that can be investigated ("What would happen ifâ€¦?")
- Makes predictions before testing
- Follows simple investigation steps and records observations
- Uses informal measurements or counts in data collection
- Describes results and compares them with predictions

*Demonstrating:*
- Plans investigations with identified variables (what to change, what to measure, what to keep the same)
- Records data systematically in tables, diagrams, or digital tools
- Analyses patterns in data and draws evidence-based conclusions
- Evaluates the fairness and reliability of their investigation
- Communicates findings clearly with appropriate scientific vocabulary
- Suggests improvements or further questions based on results

---

### Thread S2: Living Systems

**What it looks like:** The child understands living things â€” their characteristics, needs, life cycles, adaptations, and relationships within ecosystems.

**Prerequisite threads:** S1 Scientific Inquiry (emerging), S5 Scientific Observation (emerging)
**Enables threads:** S3 Earth & Environmental Systems, H3 Geography & Environmental Awareness

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9SFU01, AC9S1U01, AC9S2U01
- Y3â€“Y6: AC9S3U01, AC9S4U01, AC9S5U01, AC9S6U01

**Observable Indicators:**

*Emerging:*
- Identifies things as living or non-living
- Names basic needs of living things (food, water, shelter)
- Observes and describes features of plants and animals
- Notices growth and change in living things over time

*Developing:*
- Describes life cycles of familiar organisms
- Groups living things based on observable features
- Identifies structural features that help organisms survive
- Explains simple food chains and predator-prey relationships
- Describes how living things depend on their environment

*Demonstrating:*
- Explains adaptations and how they help organisms survive in specific environments
- Describes the interdependence within ecosystems
- Understands the impact of human activity on living systems
- Compares life cycles across different organisms
- Applies understanding of living systems to environmental and ethical questions

---

### Thread S3: Earth & Environmental Systems

**What it looks like:** The child understands Earth's systems â€” weather, water cycle, geology, space â€” and the relationships between human activity and the natural environment.

**Prerequisite threads:** S1 Scientific Inquiry (emerging), S5 Scientific Observation (emerging)
**Enables threads:** H3 Geography & Environmental Awareness, EF5 Critical Thinking

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9SFU03, AC9S1U03, AC9S2U03
- Y3â€“Y6: AC9S3U03, AC9S4U03, AC9S5U03, AC9S6U03

**Observable Indicators:**

*Emerging:*
- Observes and describes daily weather and seasonal changes
- Identifies natural features in the local environment (hills, rivers, soil)
- Recognises that the Earth has day and night
- Notices the sky (sun, moon, clouds, stars)

*Developing:*
- Describes the water cycle in simple terms
- Identifies different types of rocks, soil, or landscapes
- Understands that weather and seasons follow patterns
- Describes Earth's rotation and its relationship to day/night
- Identifies natural resources and how people use them

*Demonstrating:*
- Explains geological processes (erosion, weathering, sedimentation)
- Understands the relationship between Earth, Moon, and Sun
- Analyses the impact of human activity on Earth's systems
- Describes the carbon cycle, water cycle, or rock cycle in detail
- Evaluates sustainability practices and environmental stewardship

---

### Thread S4: Physical & Chemical Sciences

**What it looks like:** The child understands forces, energy, materials, and their properties â€” how things move, why they change, and what they're made of.

**Prerequisite threads:** S1 Scientific Inquiry (emerging), M5 Measurement Sense (emerging)
**Enables threads:** M9 Mathematical Modelling, C6 Design & Construction

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9SFU02, AC9S1U02, AC9S2U02
- Y3â€“Y6: AC9S3U02, AC9S4U02, AC9S5U02, AC9S6U02

**Observable Indicators:**

*Emerging:*
- Explores what objects are made of (wood, metal, fabric)
- Notices that pushing and pulling makes things move
- Observes that heating and cooling change materials (ice melting, bread baking)
- Groups materials by simple properties (hard/soft, rough/smooth)

*Developing:*
- Describes properties of materials and links to uses
- Understands that forces can change the shape, speed, or direction of objects
- Investigates how light, sound, or heat behave
- Identifies reversible and irreversible changes in materials
- Describes simple energy transformations (e.g., electrical â†’ light)

*Demonstrating:*
- Explains how forces interact (gravity, friction, magnetism)
- Classifies changes as physical or chemical with reasoning
- Describes energy transfer and transformation in systems
- Understands the particle model of matter at a basic level
- Applies understanding of materials and forces to design and engineering contexts

---

### Thread S5: Scientific Observation

**What it looks like:** The child observes carefully and systematically â€” slowing down, noticing details, recording what they see, and distinguishing observation from interpretation.

**Prerequisite threads:** EF1 Sustained Attention & Focus (emerging)
**Enables threads:** S1 Scientific Inquiry, S2 Living Systems, S3 Earth & Environmental Systems, S4 Physical & Chemical Sciences

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9SFI01, AC9SFI02, AC9S1I01, AC9S1I02, AC9S2I01, AC9S2I02
- Also mapped through Science as Human Endeavour: AC9SFH01, AC9S1H01, AC9S2H01

**Observable Indicators:**

*Emerging:*
- Slows down to look at something when reminded
- Points out a single detail ("Look, it has spots!")
- Returns to look at something they saw before
- Asks "what's that?" about something small or unexpected

*Developing:*
- Slows down without being reminded
- Notices changes over time ("It wasn't there yesterday")
- Compares two similar things and identifies differences
- Uses observation tools (magnifier, binoculars) effectively
- Describes multiple details about one thing

*Demonstrating:*
- Records observations systematically (nature journal, diagram, photo with notes)
- Distinguishes between what they observed and what they think it means
- Notices patterns across multiple observations
- Designs observation protocols (what to look for, when, how to record)
- Uses precise language to describe observations

---

### Thread S6: Science as Human Endeavour

**What it looks like:** The child understands that science is a human activity â€” shaped by culture, curiosity, and collaboration â€” and that scientific knowledge changes over time as new evidence emerges.

**Prerequisite threads:** S1 Scientific Inquiry (developing), L3 Reading Comprehension (developing)
**Enables threads:** H2 Source Analysis, EF5 Critical Thinking

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9SFH01, AC9SFH02, AC9S1H01, AC9S1H02, AC9S2H01, AC9S2H02
- Y3â€“Y6: AC9S3H01, AC9S3H02, AC9S4H01, AC9S4H02, AC9S5H01, AC9S5H02, AC9S6H01, AC9S6H02

**Observable Indicators:**

*Emerging:*
- Shows curiosity about how things work and asks questions
- Recognises that people use science to learn about the world
- Identifies scientists or inventors they've heard of

*Developing:*
- Describes examples of how science has changed daily life
- Understands that First Nations Australians have long-standing scientific knowledge
- Recognises that scientists work together and build on each other's ideas
- Identifies how science helps solve community problems

*Demonstrating:*
- Explains how scientific understanding has changed over time with examples
- Discusses ethical dimensions of scientific discoveries
- Evaluates different claims using scientific evidence
- Understands the role of peer review and reproducibility
- Recognises the contributions of diverse cultures to scientific knowledge

---

## Domain 4: Humanities & Social Understanding

### Thread H1: Historical Thinking & Chronology

**What it looks like:** The child understands time, change, and continuity â€” they can sequence events, understand cause and effect in human history, and appreciate how the past shapes the present.

**Prerequisite threads:** L1 Oral Communication (emerging), EF3 Memory & Recall (emerging)
**Enables threads:** H2 Source Analysis, H4 Civic & Economic Understanding

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9HSFK01, AC9HSFK02, AC9HS1K01, AC9HS1K02, AC9HS2K01, AC9HS2K02
- Y3â€“Y6: AC9HS3K01, AC9HS3K02, AC9HS4K01, AC9HS4K02, AC9HS5K01, AC9HS5K02, AC9HS6K01, AC9HS6K02

**Observable Indicators:**

*Emerging:*
- Sequences personal events (what we did yesterday, last week)
- Identifies things as "old" or "new"
- Shows interest in family stories and traditions
- Asks questions about the past ("What was it like when you were little?")

*Developing:*
- Places events on a simple timeline
- Describes how daily life has changed over time (then vs now)
- Identifies significant events or people in local/national history
- Understands that people in the past lived differently
- Explores family and community histories

*Demonstrating:*
- Uses historical language (decade, century, era, ancient, modern)
- Analyses cause and effect in historical events
- Considers multiple perspectives on historical events
- Identifies continuity and change across time periods
- Connects local history to broader national and global narratives

---

### Thread H2: Source Analysis & Evidence

**What it looks like:** The child can evaluate sources of information â€” distinguishing primary from secondary, identifying bias, and understanding that accounts of the same event can differ.

**Prerequisite threads:** L3 Reading Comprehension (developing), H1 Historical Thinking (emerging), EF5 Critical Thinking (emerging)
**Enables threads:** L8 Persuasion & Argument, EF5 Critical Thinking

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9HSFS01, AC9HSFS02, AC9HS1S01, AC9HS2S01
- Y3â€“Y6: AC9HS3S01, AC9HS3S02, AC9HS4S01, AC9HS4S02, AC9HS5S01, AC9HS5S02, AC9HS6S01, AC9HS6S02

**Observable Indicators:**

*Emerging:*
- Identifies where information comes from (a book, a person, a website)
- Recognises that photos and objects can tell us about the past
- Understands that stories can be told differently by different people

*Developing:*
- Distinguishes between primary sources (diary, letter, photo) and secondary sources (textbook, documentary)
- Identifies the author/creator of a source and considers their perspective
- Compares two accounts of the same event and notices differences
- Asks "How do we know this?" about historical claims

*Demonstrating:*
- Evaluates the reliability and usefulness of sources
- Identifies bias, perspective, and purpose in sources
- Cross-references multiple sources to build understanding
- Understands that absence of sources creates gaps in knowledge
- Applies source analysis skills across disciplines (science, media, everyday life)

---

### Thread H3: Geography & Environmental Awareness

**What it looks like:** The child understands places, spaces, and environments â€” from local to global â€” and the relationships between people and their environments.

**Prerequisite threads:** M6 Spatial Reasoning (emerging), S5 Scientific Observation (emerging)
**Enables threads:** S3 Earth & Environmental Systems, H4 Civic & Economic Understanding, PS5 Environmental Stewardship

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9HSFK03, AC9HSFK04, AC9HS1K03, AC9HS1K04, AC9HS2K03, AC9HS2K04
- Y3â€“Y6: AC9HS3K03, AC9HS3K04, AC9HS4K03, AC9HS4K04, AC9HS5K03, AC9HS5K04, AC9HS6K03, AC9HS6K04

**Observable Indicators:**

*Emerging:*
- Describes their local environment and its features
- Identifies their home, school/learning space on a simple map
- Names natural features (river, mountain, forest, beach)
- Notices differences between familiar places

*Developing:*
- Creates and interprets simple maps with keys/legends
- Describes how people use and change their environment
- Compares features of different places (urban/rural, local/distant)
- Identifies how weather and climate affect how people live
- Understands that places have Indigenous names and histories

*Demonstrating:*
- Analyses the relationship between human activity and environmental change
- Uses geographical tools (maps, globes, digital mapping) to investigate places
- Evaluates different perspectives on land use and environmental management
- Understands the concept of sustainability and its application
- Compares how different communities interact with their environments globally

---

### Thread H4: Civic & Economic Understanding

**What it looks like:** The child understands how communities and societies are organised â€” governance, rules, rights, responsibilities, and economic activity.

**Prerequisite threads:** PS1 Empathy & Perspective-Taking (emerging), L1 Oral Communication (developing)
**Enables threads:** PS6 Ethical Reasoning, L8 Persuasion & Argument

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9HSFK05, AC9HSFK06, AC9HS1K05, AC9HS1K06, AC9HS2K05, AC9HS2K06
- Y3â€“Y6: AC9HS3K05, AC9HS3K06, AC9HS4K05, AC9HS4K06, AC9HS5K05, AC9HS5K06, AC9HS6K05, AC9HS6K06

**Observable Indicators:**

*Emerging:*
- Identifies roles and responsibilities in their family and community
- Understands that groups need rules to function
- Recognises needs vs wants in everyday contexts
- Shows awareness that people do different jobs

*Developing:*
- Explains why communities have rules and laws
- Describes how goods and services are produced, distributed, and consumed
- Identifies rights and responsibilities of community members
- Understands basic democratic concepts (voting, fairness, representation)
- Recognises that different people have different needs and perspectives on community issues

*Demonstrating:*
- Analyses how decisions affect different groups in a community
- Understands levels of government and their roles
- Evaluates economic choices and trade-offs
- Considers the impact of global connections on local communities
- Proposes and defends solutions to community or societal issues

---

### Thread H5: HASS Inquiry Skills

**What it looks like:** The child can conduct humanities inquiries â€” posing questions, locating and analysing information, drawing conclusions, and communicating findings.

**Prerequisite threads:** L3 Reading Comprehension (emerging), EF4 Planning & Organisation (emerging)
**Enables threads:** H1 Historical Thinking, H2 Source Analysis, H3 Geography, H4 Civic & Economic Understanding

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9HSFS01â€“06, AC9HS1S01â€“06, AC9HS2S01â€“06
- Y3â€“Y6: AC9HS3S01â€“06, AC9HS4S01â€“06, AC9HS5S01â€“06, AC9HS6S01â€“06

**Observable Indicators:**

*Emerging:*
- Asks questions about people, places, or events
- Finds information from a provided source (book, image, video)
- Shares what they found out with others
- Draws or writes about what they learned

*Developing:*
- Develops their own inquiry questions
- Uses multiple sources to investigate a question
- Sorts and records information in organised ways
- Presents findings using appropriate format (poster, oral presentation, written report)
- Identifies different points of view on an issue

*Demonstrating:*
- Plans and conducts an extended inquiry with multiple stages
- Evaluates sources for reliability and relevance
- Synthesises information from diverse sources
- Draws evidence-based conclusions and presents them persuasively
- Reflects on their inquiry process and identifies how to improve

---

### Thread H6: First Nations Australian Perspectives

**What it looks like:** The child demonstrates understanding of and respect for Aboriginal and Torres Strait Islander histories, cultures, and contributions â€” the world's oldest continuing cultures.

**Prerequisite threads:** L1 Oral Communication (emerging), PS1 Empathy & Perspective-Taking (emerging)
**Enables threads:** H1 Historical Thinking, H3 Geography, PS6 Ethical Reasoning

**AC V9 Content Descriptors:**
- Cross-curricular priority mapped across all learning areas
- Specific HASS: AC9HSFK01, AC9HSFK03, AC9HS1K01, AC9HS2K01, AC9HS3K01, AC9HS4K01
- Specific Science: AC9SFH01, AC9S1H01, AC9S2H01 (First Nations science knowledge)

**Observable Indicators:**

*Emerging:*
- Recognises that Aboriginal and Torres Strait Islander peoples have lived in Australia for a very long time
- Shows respect for Indigenous places, names, and cultural practices
- Listens to Dreaming stories or traditional narratives with interest

*Developing:*
- Describes the connection between Indigenous peoples and Country/Place
- Identifies ways Indigenous knowledge contributes to understanding (e.g., fire management, seasonal calendars)
- Uses Acknowledgement of Country language appropriately
- Compares aspects of Indigenous and non-Indigenous perspectives on events

*Demonstrating:*
- Explains the significance of Country/Place to Aboriginal and Torres Strait Islander peoples
- Analyses the impact of colonisation on Indigenous communities
- Identifies ongoing contributions of Indigenous Australians to society
- Critically examines how Indigenous perspectives are represented in texts and media
- Applies understanding of Indigenous perspectives to environmental and social issues

---

## Domain 5: Physical Capability

### Thread P1: Gross Motor & Physical Coordination

**What it looks like:** The child moves their whole body with increasing control, coordination, and confidence â€” running, jumping, climbing, balancing, throwing, catching.

**Prerequisite threads:** None (foundational, developmental)
**Enables threads:** P3 Health & Body Awareness, P4 Sport & Cooperative Games, C6 Design & Construction

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9HPFM01, AC9HPFM02, AC9HP1M01, AC9HP1M02, AC9HP2M01, AC9HP2M02, AC9HP2M03
- Y3â€“Y6: AC9HP3M01, AC9HP3M02, AC9HP4M01, AC9HP4M02, AC9HP5M01, AC9HP5M02, AC9HP6M01, AC9HP6M02

**Observable Indicators:**

*Emerging:*
- Walks, runs, and jumps with basic control
- Catches a large ball with two hands from close range
- Balances on one foot briefly
- Moves to music with some rhythm

*Developing:*
- Demonstrates coordinated running, jumping, hopping, and skipping
- Throws overarm with increasing accuracy
- Catches a small ball from various distances
- Maintains balance during dynamic activities
- Performs sequences of movements (dance, obstacle course)

*Demonstrating:*
- Moves with fluency, control, and efficiency across diverse activities
- Combines locomotor and object control skills in games and sports
- Adapts movement to different environments and situations
- Demonstrates spatial awareness while moving in groups
- Shows stamina and endurance in sustained physical activity

---

### Thread P2: Fine Motor & Manipulation

**What it looks like:** The child uses their hands and fingers with increasing precision and control â€” manipulating tools, materials, and objects for purposeful tasks.

**Prerequisite threads:** None (foundational, developmental)
**Enables threads:** L6 Handwriting & Text Production, C5 Visual Expression & Design, C6 Design & Construction

**AC V9 Content Descriptors:**
- Not directly addressed in AC V9 as standalone CDs but underpins literacy and technology CDs
- Links to: AC9EFLY08 (handwriting), Technologies curriculum (Fâ€“2)

**Observable Indicators:**

*Emerging:*
- Holds and uses tools (crayons, spoons, paintbrushes) with a functional grip
- Threads large beads, completes simple puzzles
- Uses scissors to snip (may not follow a line yet)
- Manipulates playdough, clay, or similar materials

*Developing:*
- Cuts along a line with scissors with reasonable accuracy
- Draws recognisable shapes and pictures with detail
- Ties knots, uses fasteners (buttons, zips)
- Uses construction materials (Lego, blocks) with precision
- Holds and controls a pencil with an efficient grip

*Demonstrating:*
- Completes intricate tasks requiring hand-eye coordination (sewing, detailed drawing, model building)
- Uses a range of tools confidently (rulers, compasses, craft knives with supervision)
- Fine motor control does not limit participation in any learning activity
- Adapts grip and pressure for different tools and materials

---

### Thread P3: Health & Body Awareness

**What it looks like:** The child understands their body â€” nutrition, hygiene, growth, and the factors that contribute to physical and mental wellbeing.

**Prerequisite threads:** PS1 Empathy & Perspective-Taking (emerging)
**Enables threads:** PS3 Self-Regulation & Wellbeing, P4 Sport & Cooperative Games

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9HPFP01, AC9HPFP02, AC9HP1P01, AC9HP1P02, AC9HP2P01, AC9HP2P02, AC9HP2P06
- Y3â€“Y6: AC9HP3P01, AC9HP3P02, AC9HP4P01, AC9HP4P02, AC9HP5P01, AC9HP5P02, AC9HP6P01, AC9HP6P02

**Observable Indicators:**

*Emerging:*
- Identifies basic body parts and their functions
- Understands simple hygiene routines (handwashing, dental care)
- Recognises that food gives us energy and helps us grow
- Can identify when they feel unwell and communicates it

*Developing:*
- Describes factors that contribute to health (nutrition, exercise, sleep, hygiene)
- Makes increasingly independent healthy choices
- Understands that bodies change and grow over time
- Identifies actions that are safe or unsafe for their body
- Understands the importance of sun safety, water safety

*Demonstrating:*
- Analyses the relationship between lifestyle choices and health outcomes
- Evaluates health information and messages from various sources
- Demonstrates personal responsibility for health and safety routines
- Understands the connection between physical health and mental wellbeing
- Identifies community health resources and when to seek help

---

### Thread P4: Sport & Cooperative Games

**What it looks like:** The child participates in structured physical activities, understands rules and fair play, and works cooperatively in team-based movement contexts.

**Prerequisite threads:** P1 Gross Motor (developing), PS2 Social Skills & Cooperation (emerging)
**Enables threads:** PS2 Social Skills & Cooperation, EF4 Planning & Organisation

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9HPFM03, AC9HP1M03, AC9HP2M04, AC9HP2M05
- Y3â€“Y6: AC9HP3M03, AC9HP3M04, AC9HP4M03, AC9HP4M04, AC9HP5M03, AC9HP5M04, AC9HP6M03, AC9HP6M04

**Observable Indicators:**

*Emerging:*
- Participates willingly in group physical activities
- Follows basic game rules with reminding
- Takes turns during games
- Shows enjoyment of physical play with others

*Developing:*
- Understands and follows rules of simple games independently
- Co-constructs rules for fair play in invented games
- Works cooperatively with a partner or small team
- Shows good sportsmanship (handling winning and losing)
- Applies movement skills in game contexts

*Demonstrating:*
- Develops and applies tactics and strategies in games
- Supports and encourages others during team activities
- Modifies games to be more inclusive or challenging
- Demonstrates leadership during physical activities
- Reflects on performance and identifies areas for improvement

---

### Thread P5: Risk Assessment & Physical Safety

**What it looks like:** The child identifies potential hazards, assesses risk relative to their own capability, and makes safe choices â€” developing independence through managed risk rather than avoidance.

**Prerequisite threads:** P1 Gross Motor (emerging), PS3 Self-Regulation (emerging)
**Enables threads:** EF4 Planning & Organisation, PS3 Self-Regulation

**AC V9 Content Descriptors:**
- Foundationâ€“Y2: AC9HPFP03, AC9HP1P03, AC9HP2P03, AC9HP2P04, AC9HP2P05
- Y3â€“Y6: AC9HP3P03, AC9HP4P03, AC9HP5P03, AC9HP6P03

**Observable Indicators:**

*Emerging:*
- Responds to "stop" or safety instructions from adults
- Identifies obviously dangerous situations (fire, water, traffic)
- Understands basic safety rules in familiar environments
- Seeks help when feeling unsafe

*Developing:*
- Assesses risk before attempting physical challenges (climbing, water, tools)
- Identifies potential hazards in new environments
- Knows who to ask for help and how to seek it
- Understands protective behaviours and body boundaries
- Makes safe choices with decreasing adult prompting

*Demonstrating:*
- Independently assesses and manages physical risks
- Adapts behaviour for different risk levels in different environments
- Demonstrates emergency awareness (what to do in an emergency)
- Helps others identify and manage risks
- Articulates why safety measures exist (reasoning, not just rule-following)

---

## Domain 6: Personal & Social Development

### Thread PS1: Empathy & Perspective-Taking

**What it looks like:** The child recognises, understands, and responds to the emotions and perspectives of others â€” seeing the world through different eyes.

**Prerequisite threads:** L1 Oral Communication (emerging)
**Enables threads:** PS2 Social Skills, PS6 Ethical Reasoning, L8 Persuasion & Argument, H6 First Nations Perspectives

**AC V9 Content Descriptors:**
- HPE Personal: AC9HPFP04, AC9HP1P04, AC9HP2P04
- English Literature (character study): AC9E2LE01, AC9E3LE01, AC9E4LE01

**Observable Indicators:**

*Emerging:*
- Recognises basic emotions in others (happy, sad, angry)
- Shows concern when someone is upset
- Understands that other people have feelings
- Responds to simple perspective prompts ("How do you think she feels?")

*Developing:*
- Identifies emotions in others from contextual cues (not just facial expression)
- Considers another person's perspective without prompting
- Shows compassion through actions (comforting, helping, sharing)
- Understands that the same event can make different people feel differently
- Discusses characters' feelings and motivations in stories

*Demonstrating:*
- Takes the perspective of people very different from themselves
- Navigates disagreements by considering both sides
- Shows awareness of how their actions affect others' feelings
- Demonstrates cultural sensitivity and respect for difference
- Advocates for fairness and inclusion based on empathetic understanding

---

### Thread PS2: Social Skills & Cooperation

**What it looks like:** The child interacts positively with others â€” sharing, negotiating, collaborating, resolving conflicts, and building friendships.

**Prerequisite threads:** PS1 Empathy & Perspective-Taking (emerging), L1 Oral Communication (emerging)
**Enables threads:** P4 Sport & Cooperative Games, EF6 Collaboration & Teamwork

**AC V9 Content Descriptors:**
- HPE Personal: AC9HPFP05, AC9HP1P05, AC9HP2P04, AC9HP2P05
- Cross-curricular General Capabilities: Personal and Social Capability

**Observable Indicators:**

*Emerging:*
- Plays alongside others (parallel play transitioning to interactive)
- Shares materials when reminded
- Responds to social cues (greetings, turn-taking)
- Seeks out company of peers or family members for activities

*Developing:*
- Initiates social interaction and joins group activities
- Negotiates roles and resources with peers
- Uses words to resolve simple conflicts with some support
- Works cooperatively on a shared task
- Identifies and maintains friendships

*Demonstrating:*
- Resolves conflicts independently using multiple strategies
- Adapts social behaviour for different contexts and groups
- Supports and encourages others in group settings
- Demonstrates leadership and followership as appropriate
- Builds and sustains positive relationships across diverse groups

---

### Thread PS3: Self-Regulation & Wellbeing

**What it looks like:** The child manages their emotions, behaviour, and energy â€” coping with frustration, transitioning between activities, and maintaining a positive sense of self.

**Prerequisite threads:** None (developmental, supported)
**Enables threads:** EF1 Sustained Attention, EF2 Working Memory, PS2 Social Skills, P5 Risk Assessment

**AC V9 Content Descriptors:**
- HPE Personal: AC9HPFP01, AC9HPFP02, AC9HP1P01, AC9HP2P03
- Cross-curricular: Personal and Social Capability

**Observable Indicators:**

*Emerging:*
- Names their current emotion with support
- Accepts comfort from a trusted person when distressed
- Transitions between activities with support
- Identifies situations that make them feel different emotions

*Developing:*
- Uses strategies to manage big emotions (deep breaths, walking away, asking for space)
- Transitions between activities with minimal support
- Persists through frustration with decreasing need for intervention
- Describes their own strengths and areas they're working on
- Recognises when they need help and asks for it

*Demonstrating:*
- Self-monitors emotional state and applies regulation strategies independently
- Recovers from setbacks and disappointment with resilience
- Maintains a balanced and realistic self-assessment
- Advocates for their own needs and wellbeing
- Demonstrates sustained positive engagement across challenging contexts

---

### Thread PS4: Identity & Belonging

**What it looks like:** The child has a developing sense of who they are â€” their family, culture, values, strengths, and place in their community and the world.

**Prerequisite threads:** L1 Oral Communication (emerging)
**Enables threads:** PS6 Ethical Reasoning, H6 First Nations Perspectives

**AC V9 Content Descriptors:**
- HPE Personal: AC9HPFP01, AC9HPFP02
- HASS: AC9HSFK01, AC9HSFK05, AC9HS1K01

**Observable Indicators:**

*Emerging:*
- Identifies themselves as part of a family and community
- Recognises and names personal interests and preferences
- Shows awareness of cultural or family traditions
- Demonstrates pride in something they can do

*Developing:*
- Describes their own cultural background and family stories
- Recognises and respects that others have different backgrounds and traditions
- Identifies personal strengths and things they're learning to do
- Feels comfortable contributing in group settings

*Demonstrating:*
- Articulates personal values and what matters to them
- Respects and celebrates diversity in their community
- Shows confidence in their identity while being open to new ideas
- Connects personal identity to broader community and cultural contexts
- Demonstrates resilience in their sense of self when facing challenges or criticism

---

### Thread PS5: Environmental Stewardship

**What it looks like:** The child demonstrates care and responsibility for the natural world â€” understanding their impact and taking action to protect environments.

**Prerequisite threads:** S5 Scientific Observation (emerging), H3 Geography (emerging), PS1 Empathy (developing)
**Enables threads:** S3 Earth & Environmental Systems, PS6 Ethical Reasoning

**AC V9 Content Descriptors:**
- HASS: AC9HSFK04, AC9HS1K04, AC9HS2K04
- Science: AC9SFH02, AC9S1H02, AC9S2H02
- Cross-curricular: Sustainability

**Observable Indicators:**

*Emerging:*
- Shows care for living things (watering plants, gentle with animals)
- Participates in activities like composting, recycling, or gardening with guidance
- Notices litter or damage to natural environments

*Developing:*
- Explains why caring for the environment matters
- Identifies ways people affect the environment (positive and negative)
- Takes responsibility for environmental actions (reducing waste, conserving water)
- Connects human choices to environmental outcomes

*Demonstrating:*
- Analyses environmental issues and evaluates potential actions
- Initiates or leads environmental projects
- Considers multiple perspectives on environmental issues (economic, cultural, ecological)
- Applies sustainability thinking to daily decisions
- Articulates and defends their environmental values

---

### Thread PS6: Ethical Reasoning

**What it looks like:** The child thinks about right and wrong, fairness and justice â€” considering ethical dimensions of situations and making reasoned moral judgments.

**Prerequisite threads:** PS1 Empathy (developing), L1 Oral Communication (developing), EF5 Critical Thinking (emerging)
**Enables threads:** H4 Civic & Economic Understanding

**AC V9 Content Descriptors:**
- Cross-curricular: Ethical Understanding (General Capability)
- HASS: AC9HS3K05, AC9HS4K05, AC9HS5K05
- HPE: AC9HP3P03, AC9HP4P03

**Observable Indicators:**

*Emerging:*
- Identifies situations as "fair" or "unfair"
- Recognises when someone has been hurt or treated badly
- Follows rules and understands their purpose
- Responds honestly when asked about their actions

*Developing:*
- Considers the impact of actions on others before acting
- Explains reasons for rules and can suggest modifications
- Recognises ethical dilemmas in stories and real life
- Understands that being fair doesn't always mean being equal

*Demonstrating:*
- Analyses ethical dilemmas using multiple perspectives
- Defends a moral position with reasoned arguments
- Identifies ethical dimensions in apparently neutral situations
- Considers consequences for different stakeholders
- Demonstrates consistency between stated values and actions

---

### Thread PS7: Digital Citizenship

**What it looks like:** The child navigates digital environments responsibly â€” understanding online safety, digital identity, information literacy, and respectful online interaction.

**Prerequisite threads:** L3 Reading Comprehension (emerging), PS2 Social Skills (developing)
**Enables threads:** EF5 Critical Thinking, H2 Source Analysis

**AC V9 Content Descriptors:**
- Cross-curricular: Digital Literacy, ICT Capability
- Technologies: AC9TDI2P01â€“05 (Digital Technologies Fâ€“2)
- HPE: AC9HP3P03, AC9HP4P03 (online safety)

**Observable Indicators:**

*Emerging:*
- Uses digital devices for simple purposes with supervision
- Understands basic online safety rules (don't share personal info)
- Recognises the difference between online and offline interactions

*Developing:*
- Follows agreed family rules for digital use independently
- Understands that online actions have real consequences
- Can identify suspicious or uncomfortable online content and tells a trusted adult
- Uses digital tools purposefully for learning
- Understands the concept of a digital footprint

*Demonstrating:*
- Evaluates online information for credibility and bias
- Manages digital identity and privacy thoughtfully
- Demonstrates respectful and ethical online behaviour
- Uses digital tools effectively and selectively for learning and communication
- Helps others navigate digital environments safely

---

## Domain 7: Creative Expression

### Thread C1: Narrative & Storytelling

**What it looks like:** The child creates and shares stories â€” across media (oral, written, visual, dramatic) â€” with increasing sophistication in plot, character, setting, and theme.

**Prerequisite threads:** L1 Oral Communication (developing), L9 Literary Response (emerging)
**Enables threads:** L5 Written Expression, C3 Poetic Expression, C4 Dramatic Expression

**AC V9 Content Descriptors:**
- English: AC9EFLE02, AC9E1LE02, AC9E2LE02, AC9E3LE02, AC9E4LE02, AC9E5LE02, AC9E6LE02

**Observable Indicators:**

*Emerging:*
- Tells simple stories with a beginning and end
- Uses imaginative play to create narratives with toys or props
- Contributes ideas to shared storytelling

*Developing:*
- Creates stories with clear beginning, middle, and end
- Develops characters with distinct traits or motivations
- Includes problems and resolutions in narratives
- Uses descriptive language to build setting and atmosphere
- Tells stories across media (drawing, oral, writing, acting)

*Demonstrating:*
- Creates complex narratives with subplots, themes, or moral dilemmas
- Develops multi-dimensional characters that change over the story
- Uses narrative techniques deliberately (foreshadowing, flashback, suspense)
- Adapts storytelling for different audiences and purposes
- Revises and refines stories based on feedback or reflection

---

### Thread C2: Musical Expression

**What it looks like:** The child engages with music â€” listening, creating, performing â€” with growing understanding of musical elements and their expressive potential.

**Prerequisite threads:** L1 Oral Communication (emerging)
**Enables threads:** C3 Poetic & Rhythmic Expression, PS3 Self-Regulation

**AC V9 Content Descriptors:**
- Arts (Music): AC9AMU2C01, AC9AMU2R01, AC9AMU4C01, AC9AMU4R01, AC9AMU6C01, AC9AMU6R01

**Observable Indicators:**

*Emerging:*
- Responds to music physically (clapping, swaying, dancing)
- Sings familiar songs with some accuracy in pitch and rhythm
- Identifies different instruments or sound sources
- Expresses preferences for types of music

*Developing:*
- Keeps a steady beat during music activities
- Creates simple rhythmic or melodic patterns
- Identifies musical elements (loud/soft, fast/slow, high/low)
- Performs songs or pieces with attention to dynamics and expression
- Listens to and discusses music from different cultures and traditions

*Demonstrating:*
- Creates original musical compositions or arrangements
- Uses musical notation or recording to capture ideas
- Analyses and evaluates musical works with appropriate vocabulary
- Performs with technical skill, expression, and confidence
- Applies musical understanding across genres and cultural contexts

---

### Thread C3: Poetic & Rhythmic Expression

**What it looks like:** The child plays with language â€” rhythm, rhyme, imagery, and the sounds and shapes of words â€” for aesthetic and expressive purposes.

**Prerequisite threads:** L1 Oral Communication (developing), L2 Phonological Awareness (emerging), L9 Literary Response (emerging)
**Enables threads:** L5 Written Expression, C2 Musical Expression

**AC V9 Content Descriptors:**
- English Literature: AC9EFLE01, AC9E1LE01, AC9E2LE01
- English Literacy: AC9E1LY06, AC9E2LY06 (creating literary texts)

**Observable Indicators:**

*Emerging:*
- Enjoys rhyming words and wordplay
- Repeats rhythmic phrases from songs, books, or poems
- Notices when words sound similar or interesting
- Claps or moves to the rhythm of language

*Developing:*
- Creates simple rhymes or word patterns
- Experiments with alliteration, onomatopoeia, or repetition
- Reads poetry with attention to rhythm and expression
- Describes how a poem makes them feel and why
- Writes simple poems using a model or framework

*Demonstrating:*
- Writes original poetry with intentional use of literary devices
- Analyses the craft of published poems
- Experiments with different poetic forms (haiku, free verse, acrostic, concrete)
- Uses poetic language across writing contexts for effect
- Develops a personal voice in poetic expression

---

### Thread C4: Dramatic Expression

**What it looks like:** The child engages in dramatic play, role play, and performance â€” using voice, body, and imagination to explore ideas, stories, and emotions.

**Prerequisite threads:** L1 Oral Communication (developing), PS1 Empathy (emerging)
**Enables threads:** C1 Narrative & Storytelling, PS1 Empathy, L1 Oral Communication

**AC V9 Content Descriptors:**
- Arts (Drama): AC9ADR2C01, AC9ADR2R01, AC9ADR4C01, AC9ADR4R01, AC9ADR6C01, AC9ADR6R01

**Observable Indicators:**

*Emerging:*
- Engages in imaginative/pretend play spontaneously
- Takes on a role in play (being the doctor, the shopkeeper)
- Uses props and costumes to support dramatic play
- Watches and responds to performances by others

*Developing:*
- Maintains a character or role for an extended period
- Uses voice (volume, tone, expression) to convey character
- Collaborates with others to create dramatic scenarios
- Creates simple scripts or performance plans
- Responds to drama (live or recorded) with personal reactions

*Demonstrating:*
- Creates and performs original dramatic works
- Uses dramatic techniques deliberately (pause, gesture, staging)
- Analyses performances and provides constructive feedback
- Takes on complex or unfamiliar roles with commitment
- Uses drama to explore issues, perspectives, or emotions

---

### Thread C5: Visual Expression & Design

**What it looks like:** The child creates visual works â€” drawing, painting, sculpture, digital â€” with increasing technical skill, aesthetic awareness, and expressive intent.

**Prerequisite threads:** P2 Fine Motor (emerging), M6 Spatial Reasoning (emerging)
**Enables threads:** C6 Design & Construction, L6 Handwriting

**AC V9 Content Descriptors:**
- Arts (Visual Arts): AC9AVA2C01, AC9AVA2R01, AC9AVA4C01, AC9AVA4R01, AC9AVA6C01, AC9AVA6R01

**Observable Indicators:**

*Emerging:*
- Explores materials freely (paint, clay, pencils, collage)
- Creates images that represent real or imagined things
- Expresses preferences for colours, shapes, or styles
- Shows interest in visual art in the environment (books, galleries, nature)

*Developing:*
- Uses a range of materials and techniques purposefully
- Creates works with recognisable subjects and increasing detail
- Experiments with colour, line, shape, and texture
- Discusses art by others and identifies what they notice or like
- Plans visual works before creating

*Demonstrating:*
- Creates visually effective works with deliberate aesthetic choices
- Uses a variety of media and techniques with skill
- Analyses and evaluates visual art using arts vocabulary
- Communicates ideas, stories, or emotions through visual works
- Develops a personal style while exploring different approaches

---

### Thread C6: Design & Construction

**What it looks like:** The child designs and builds things â€” using iterative processes of planning, making, testing, and improving to solve problems and create functional or aesthetic objects.

**Prerequisite threads:** P2 Fine Motor (developing), M5 Measurement Sense (emerging), S4 Physical & Chemical Sciences (emerging)
**Enables threads:** M9 Mathematical Modelling, S4 Physical & Chemical Sciences, EF4 Planning & Organisation

**AC V9 Content Descriptors:**
- Technologies (Design & Technologies): AC9TDE2P01â€“04, AC9TDE4P01â€“04, AC9TDE6P01â€“04

**Observable Indicators:**

*Emerging:*
- Builds with construction materials (blocks, Lego, boxes) with a purpose
- Talks about what they're going to make before starting
- Identifies a problem that could be solved with making
- Explores how things work by taking apart and reassembling

*Developing:*
- Draws plans or designs before building
- Selects materials based on their properties and the task
- Tests their creation and identifies what works and what doesn't
- Modifies designs based on testing
- Describes the design process they followed

*Demonstrating:*
- Plans designs with clear specifications and constraints
- Uses the full design cycle (define â†’ design â†’ make â†’ evaluate â†’ improve)
- Considers the needs of the user in their designs
- Evaluates trade-offs between competing requirements
- Documents the design process and explains decisions

---

### Thread C7: Digital Creation

**What it looks like:** The child uses digital tools creatively â€” from basic digital media creation to computational thinking, coding, and algorithmic problem-solving.

**Prerequisite threads:** EF4 Planning & Organisation (emerging), M4 Algebraic Thinking (emerging)
**Enables threads:** C6 Design & Construction, M9 Mathematical Modelling

**AC V9 Content Descriptors:**
- Technologies (Digital Technologies): AC9TDI2P01â€“05, AC9TDI4P01â€“05, AC9TDI6P01â€“05

**Observable Indicators:**

*Emerging:*
- Uses digital tools for simple creative tasks (drawing apps, camera)
- Understands that digital devices follow instructions
- Follows a sequence of steps to complete a digital task
- Identifies everyday things that use digital technology

*Developing:*
- Creates digital content (presentations, animations, simple programs)
- Writes simple algorithms or step-by-step instructions for a task
- Uses visual programming tools (Scratch, etc.) to create interactive projects
- Understands that data can be organised and represented digitally
- Debugs simple programs by identifying and fixing errors

*Demonstrating:*
- Creates complex digital projects combining multiple tools and skills
- Applies computational thinking (decomposition, pattern recognition, abstraction)
- Designs and tests algorithms for real problems
- Understands data types, storage, and transformation
- Evaluates digital solutions for effectiveness and improvement

---

## Domain 8: Executive Function & Learning-to-Learn

### Thread EF1: Sustained Attention & Focus

**What it looks like:** The child can maintain focused attention on a task or activity â€” both during structured learning and self-directed exploration â€” with increasing duration and resistance to distraction.

**Prerequisite threads:** PS3 Self-Regulation (emerging)
**Enables threads:** L3 Reading Comprehension, S5 Scientific Observation, EF2 Working Memory, all learning threads

**AC V9 Content Descriptors:**
- Not directly mapped to specific CDs but underpins all achievement standards
- Cross-curricular: Personal and Social Capability

**Observable Indicators:**

*Emerging:*
- Engages with an activity for a few minutes before seeking something new
- Returns to an activity after a brief interruption with prompting
- Shows focused engagement during high-interest activities
- Responds to redirection back to a task

*Developing:*
- Sustains attention on a task for 15â€“20+ minutes
- Returns to a task after interruption without adult prompting
- Ignores minor distractions while working
- Completes a multi-step activity from start to finish
- Recognises when their attention has drifted and refocuses

*Demonstrating:*
- Sustains deep focus for extended periods (30+ minutes)
- Manages their own attention strategically (choosing quiet spaces, removing distractions)
- Maintains focus during challenging or less interesting tasks
- Transitions attention efficiently between different types of tasks
- Demonstrates "flow" states during engaging work

---

### Thread EF2: Working Memory

**What it looks like:** The child can hold and manipulate information in their mind â€” following multi-step instructions, solving problems mentally, and connecting ideas across time.

**Prerequisite threads:** EF1 Sustained Attention (emerging)
**Enables threads:** M2 Operations & Computation, L3 Reading Comprehension, all learning threads

**AC V9 Content Descriptors:**
- Not directly mapped but underpins all CDs requiring mental manipulation
- Critical for: mental computation, reading comprehension, following instructions

**Observable Indicators:**

*Emerging:*
- Follows a one-step instruction
- Remembers where they left a familiar object
- Recalls a simple message to pass to another person
- Holds one piece of information while completing a task

*Developing:*
- Follows 2â€“3 step instructions without reminding
- Holds a question in mind while searching for the answer
- Remembers and applies a rule while working (e.g., "carry the one")
- Connects information from the beginning of a text to the end
- Remembers what they were doing after a brief interruption

*Demonstrating:*
- Follows complex, multi-step procedures from memory
- Solves problems that require holding multiple variables in mind
- Connects ideas across different contexts or time periods
- Uses memory strategies deliberately (rehearsal, chunking, visualisation)
- Manages multiple demands simultaneously (e.g., taking notes while listening)

---

### Thread EF3: Memory & Recall

**What it looks like:** The child stores and retrieves information over time â€” remembering facts, events, procedures, and concepts and accessing them when needed.

**Prerequisite threads:** EF1 Sustained Attention (emerging)
**Enables threads:** M2 Operations (fact fluency), L4 Spelling, H1 Historical Thinking, all knowledge-based threads

**AC V9 Content Descriptors:**
- Underpins all CDs requiring knowledge retrieval
- Especially: mathematics fact recall, spelling, vocabulary, historical knowledge

**Observable Indicators:**

*Emerging:*
- Recalls recent events when prompted ("What did we do at the park?")
- Remembers names of familiar people and places
- Recognises previously encountered information ("We read about that!")
- Recalls favourite stories or songs

*Developing:*
- Recalls key facts from recent learning without prompting
- Uses prior knowledge to make connections to new information
- Remembers procedures (how to do long division, how to write a letter)
- Retrieves mathematical facts with increasing automaticity
- Recalls and applies information from weeks or months ago

*Demonstrating:*
- Draws on a broad base of prior knowledge across domains
- Retrieves information quickly and accurately when needed
- Makes connections between stored knowledge and novel situations
- Uses memory strategies (mnemonics, spaced practice) deliberately
- Demonstrates deep, flexible knowledge rather than rote memorisation

---

### Thread EF4: Planning & Organisation

**What it looks like:** The child approaches tasks and projects systematically â€” setting goals, making plans, organising materials, managing time, and adjusting course when needed.

**Prerequisite threads:** EF1 Sustained Attention (emerging), PS3 Self-Regulation (emerging)
**Enables threads:** M9 Mathematical Modelling, S1 Scientific Inquiry, H5 HASS Inquiry, C6 Design & Construction

**AC V9 Content Descriptors:**
- Cross-curricular: Personal and Social Capability, Critical and Creative Thinking
- Underpins all project-based and inquiry CDs

**Observable Indicators:**

*Emerging:*
- Gathers materials before starting a task when reminded
- Follows a provided sequence of steps
- Identifies what they need to start an activity
- Accepts help in breaking a big task into steps

*Developing:*
- Breaks a task into steps with minimal guidance
- Gathers necessary materials independently before starting
- Creates simple plans (lists, drawings, outlines) before beginning work
- Manages time with support (timers, schedules)
- Adjusts plans when something isn't working

*Demonstrating:*
- Plans multi-day or multi-week projects independently
- Prioritises tasks and manages competing demands
- Creates and maintains organisational systems
- Anticipates potential problems and plans contingencies
- Reflects on their planning process and improves strategies over time

---

### Thread EF5: Critical Thinking

**What it looks like:** The child analyses, evaluates, and synthesises information â€” questioning assumptions, identifying logic, weighing evidence, and forming reasoned judgments.

**Prerequisite threads:** L3 Reading Comprehension (developing), EF2 Working Memory (developing)
**Enables threads:** L8 Persuasion & Argument, H2 Source Analysis, S6 Science as Human Endeavour, M9 Mathematical Modelling

**AC V9 Content Descriptors:**
- Cross-curricular: Critical and Creative Thinking (General Capability)
- Embedded across all learning areas at higher year levels

**Observable Indicators:**

*Emerging:*
- Asks "why?" and "how do you know?" questions
- Notices when something doesn't seem right or make sense
- Compares two options and explains a preference with a reason
- Identifies the difference between real and imaginary

*Developing:*
- Identifies assumptions in their own and others' thinking
- Evaluates evidence before accepting a claim
- Considers alternative explanations for observations
- Distinguishes between strong and weak reasons
- Asks questions that probe beneath the surface

*Demonstrating:*
- Analyses complex issues from multiple perspectives
- Identifies logical fallacies and weak reasoning
- Synthesises information from multiple sources to form new understanding
- Evaluates the quality and relevance of evidence
- Forms and defends well-reasoned positions while remaining open to new evidence

---

### Thread EF6: Collaboration & Teamwork

**What it looks like:** The child works effectively with others toward shared goals â€” contributing ideas, listening, compromising, and sharing responsibility for outcomes.

**Prerequisite threads:** PS2 Social Skills (developing), L1 Oral Communication (developing)
**Enables threads:** P4 Sport & Cooperative Games, S1 Scientific Inquiry (group investigations)

**AC V9 Content Descriptors:**
- Cross-curricular: Personal and Social Capability
- HPE: AC9HP2M05, AC9HP3M04, AC9HP4M04

**Observable Indicators:**

*Emerging:*
- Works alongside others on a shared activity
- Accepts a role in a group task
- Shares materials willingly
- Listens to others' ideas during group activities

*Developing:*
- Contributes ideas and listens to others' contributions
- Negotiates roles and responsibilities within a group
- Stays on task during group work
- Helps others who are struggling
- Compromises when there are disagreements

*Demonstrating:*
- Takes initiative and shows leadership in group projects
- Distributes work equitably and holds themselves accountable
- Facilitates group discussions and ensures all voices are heard
- Evaluates group processes and suggests improvements
- Adapts their role to suit the needs of the team

---

### Thread EF7: Metacognition & Reflective Practice

**What it looks like:** The child thinks about their own thinking and learning â€” understanding how they learn best, monitoring their understanding, and adjusting their approach.

**Prerequisite threads:** L1 Oral Communication (developing), PS3 Self-Regulation (developing)
**Enables threads:** All learning threads (metacognition enhances all learning)

**AC V9 Content Descriptors:**
- Cross-curricular: Critical and Creative Thinking, Personal and Social Capability
- Embedded in all "reflecting" components of inquiry processes

**Observable Indicators:**

*Emerging:*
- Responds to "What did you learn?" questions with specific answers
- Identifies activities they find easy or hard
- Shows awareness that practice improves performance
- Accepts feedback from others

*Developing:*
- Describes strategies they use for learning (e.g., "I drew a picture to help me remember")
- Identifies what they understand and what they're confused about
- Adjusts their approach when something isn't working
- Reflects on their work and identifies what they'd do differently
- Seeks feedback actively

*Demonstrating:*
- Monitors their own understanding in real-time ("I need to re-read that")
- Selects and applies learning strategies deliberately for different tasks
- Sets personal learning goals and tracks progress
- Provides constructive feedback to others
- Articulates a personal learning philosophy ("I learn best when...")

---

### Thread EF8: Creative Thinking & Innovation

**What it looks like:** The child generates novel ideas, sees possibilities, takes intellectual risks, and approaches problems with imagination and originality.

**Prerequisite threads:** EF1 Sustained Attention (emerging), PS3 Self-Regulation (emerging)
**Enables threads:** C1â€“C7 (all Creative Expression threads), M9 Mathematical Modelling, C6 Design & Construction

**AC V9 Content Descriptors:**
- Cross-curricular: Critical and Creative Thinking (General Capability)
- Embedded across all Arts CDs and design/technology CDs

**Observable Indicators:**

*Emerging:*
- Engages in imaginative play and "what if" scenarios
- Suggests unusual ideas without self-censoring
- Shows curiosity and asks original questions
- Experiments with materials and approaches freely

*Developing:*
- Generates multiple ideas when brainstorming
- Combines existing ideas in new ways
- Takes intellectual risks (trying approaches that might not work)
- Builds on others' ideas constructively
- Sees problems as opportunities for creative solutions

*Demonstrating:*
- Produces original and effective creative works or solutions
- Applies creative thinking across domains (not just arts)
- Evaluates ideas for feasibility while maintaining creative ambition
- Persists through the creative process including revision and iteration
- Demonstrates a personal creative voice or approach

---

## Prerequisite Graph Summary

The following table shows the complete prerequisite web. Read as "Thread requires prerequisites to be at least Emerging."

### Foundation Threads (No Prerequisites)
These threads can begin being observed from the earliest ages:

| Thread | Domain |
|--------|--------|
| L1: Oral Communication | Language |
| M1: Number Sense & Place Value | Mathematical |
| M6: Spatial Reasoning & Geometry | Mathematical |
| P1: Gross Motor & Physical Coordination | Physical |
| P2: Fine Motor & Manipulation | Physical |
| PS3: Self-Regulation & Wellbeing | Personal & Social |

### High-Impact Enabler Threads
These threads, once established, unlock the most downstream capabilities:

| Thread | Enables (Direct) | Total Downstream |
|--------|-----------------|-----------------|
| L1: Oral Communication | 8 threads | 25+ threads |
| M1: Number Sense & Place Value | 6 threads | 18+ threads |
| EF1: Sustained Attention | 5 threads | All learning threads |
| PS3: Self-Regulation | 5 threads | 15+ threads |
| L3: Reading Comprehension | 6 threads | 20+ threads |
| S5: Scientific Observation | 4 threads | 12+ threads |

### Cross-Domain Connections
The most interesting educational patterns emerge at domain boundaries:

| Connection | Threads Linked | Why It Matters |
|-----------|----------------|---------------|
| Maths â†” Science | M5, M7 â†” S1, S3, S4 | Measurement and data underpin all scientific inquiry |
| Language â†” Humanities | L3, L7, L8 â†” H2, H5 | Source analysis and argument require literacy foundations |
| Physical â†” Creative | P1, P2 â†” C5, C6 | Motor skills enable creative expression and construction |
| Executive â†” Everything | EF1â€“EF8 â†” All domains | Executive function is the substrate for all learning |
| Social â†” Collaborative Learning | PS1, PS2 â†” EF6, P4 | Social skills enable group-based learning across domains |

---

## Implementation Notes

### Data Structure (Sanity CMS)

Each thread is stored as a Sanity document:

```javascript
// capabilityThread schema
{
  name: 'capabilityThread',
  type: 'document',
  fields: [
    { name: 'threadId', type: 'string' },         // e.g., 'L1', 'M3', 'EF5'
    { name: 'name', type: 'string' },              // e.g., 'Oral Communication & Listening'
    { name: 'domain', type: 'string' },            // e.g., 'language-literacy'
    { name: 'domainColour', type: 'string' },      // hex colour for UI
    { name: 'summary', type: 'text' },             // "What it looks like" paragraph
    
    // Three-tier indicators
    { name: 'emergingIndicators', type: 'array', of: [{ type: 'string' }] },
    { name: 'developingIndicators', type: 'array', of: [{ type: 'string' }] },
    { name: 'demonstratingIndicators', type: 'array', of: [{ type: 'string' }] },
    
    // Parent-friendly tier descriptions
    { name: 'emergingParentLanguage', type: 'text' },
    { name: 'developingParentLanguage', type: 'text' },
    { name: 'demonstratingParentLanguage', type: 'text' },
    
    // Scaffolding relationships
    { name: 'prerequisiteThreads', type: 'array', 
      of: [{ type: 'reference', to: [{ type: 'capabilityThread' }] }] },
    { name: 'enablesThreads', type: 'array', 
      of: [{ type: 'reference', to: [{ type: 'capabilityThread' }] }] },
    
    // Curriculum mapping
    { name: 'curriculumMappings', type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'code', type: 'string' },          // e.g., 'AC9E2LY01'
        { name: 'description', type: 'string' },
        { name: 'yearLevel', type: 'string' },     // e.g., 'Year 2'
        { name: 'learningArea', type: 'string' }   // e.g., 'English'
      ]}]
    },
    
    // Age relevance (for progressive disclosure)
    { name: 'typicalEmergingAge', type: 'number' },   // youngest age typically emerging
    { name: 'typicalDemonstratingAge', type: 'number' }, // age typically demonstrating
    
    // Custom thread flag
    { name: 'isCustom', type: 'boolean' },          // family-created thread
    { name: 'createdByFamily', type: 'reference', to: [{ type: 'family' }] }
  ]
}
```

### Observation Tagging Engine

When a parent logs an observation (via Retrospective Logger or Module Experience), the system:

1. **Analyses the description** using keyword matching and NLP to suggest relevant threads
2. **Suggests 1â€“4 threads** with confidence scores
3. **Infers tier** based on context clues (independence, novelty, consistency)
4. **Parent confirms/adjusts** with single-tap interaction (stays within 5-minute rule)

Example keyword â†’ thread mappings for the suggestion engine:

| Keywords / Phrases | Suggested Thread(s) |
|-------------------|---------------------|
| counted, numbers, how many, more than, less than | M1: Number Sense |
| added, subtracted, plus, minus, times, shared equally | M2: Operations |
| half, quarter, fraction, split equally, portion | M3: Fractional Thinking |
| measured, ruler, weighed, timer, how long, how heavy | M5: Measurement |
| pattern, sequence, what comes next, rule | M4: Algebraic Thinking |
| read, book, story, chapter, understood | L3: Reading Comprehension |
| wrote, writing, sentence, paragraph, letter | L5: Written Expression |
| observed, noticed, looked closely, magnifying glass | S5: Scientific Observation |
| experiment, tested, predicted, hypothesis | S1: Scientific Inquiry |
| shared, took turns, played together, team | PS2: Social Skills |
| frustrated, calmed down, managed, big feelings | PS3: Self-Regulation |
| built, designed, made, constructed, created | C6: Design & Construction |

### Progressive Disclosure Strategy

Parents don't see all 57 threads. Visibility is controlled by:

1. **Active threads** â€” any thread with at least one observation â†’ always visible
2. **Age-relevant threads** â€” threads where `typicalEmergingAge` â‰¤ child's age â†’ visible in discovery
3. **Ghost threads** â€” threads that are "opening up" (prerequisites nearly met) â†’ shown as ghost nodes in constellation
4. **Hidden threads** â€” threads too far ahead or not yet relevant â†’ invisible until prerequisites develop

A 5-year-old's constellation might show 15â€“20 active threads. A 10-year-old's might show 35â€“40. This keeps the experience manageable while allowing the full library to grow with the child.

### Stakeholder Reporting Views

| Stakeholder | What They See | Format |
|-------------|--------------|--------|
| **Parent (daily)** | Constellation with active threads, ghost nodes, narrative | Visual constellation + text summary |
| **Parent (HEU report)** | Thread â†” content descriptor coverage map | Coverage table with evidence counts |
| **School (transfer)** | Thread tier summary with evidence highlights | Formal report document |
| **Post-secondary** | Capability profile with demonstrated threads and evidence portfolio | Digital capability credential |

---

## Custom Thread Template

Families can create custom threads for capabilities not covered by the library. These follow the same structure but are family-defined.

**Common custom threads families might create:**
- Cooking & Kitchen Skills
- Bushcraft & Outdoor Skills
- Animal Husbandry
- Musical Instrument Proficiency (specific instrument)
- Language Learning (specific language)
- Religious or Spiritual Studies
- Community Service & Volunteering

Custom threads don't map to AC V9 content descriptors but still contribute to the constellation visualization and the learning narrative. They demonstrate holistic education â€” which is exactly what homeschool families want to show.

```javascript
// Custom thread template
{
  threadId: 'custom-[familyId]-[slug]',
  name: '[Family-defined name]',
  domain: 'family-defined',
  domainColour: '[family-chosen colour]',
  summary: '[Family writes what this capability looks like]',
  
  emergingIndicators: ['[Family defines 3+ indicators]'],
  developingIndicators: ['[Family defines 3+ indicators]'],
  demonstratingIndicators: ['[Family defines 3+ indicators]'],
  
  // No curriculum mappings
  // No prerequisite enforcement (family manages this)
  isCustom: true,
  createdByFamily: '[familyId]'
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 14 Feb 2026 | Initial thread library â€” 57 threads across 8 domains |

---

*This document defines the capability thread library for Hearth LMS. It is the content foundation for Phase A of the capabilities system, feeding into the observation logging engine (Phase B), constellation visualization (Phase C), and platform integration (Phase D). All threads are philosophy-neutral and designed to demonstrate learning progression to stakeholders including HEU, receiving schools, and post-secondary institutions.*
