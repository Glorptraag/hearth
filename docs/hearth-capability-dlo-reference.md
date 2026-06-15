# Hearth Capability DLO Reference

**Generated:** 2026-05-26 from Sanity production (`g5zhwbxg/production`).
**Purpose:** Hand to Claude (or any session) when building learning modules so module activities can be tagged to capability threads with confidence in what the child is expected to demonstrate.

## How to use this

- **15 domains** (some empty — classical languages, theology/scripture). Don't invent threads for empty domains; they're v2 substrate placeholders.
- **57 threads** total, each with a short code (e.g. `M1`, `EF7`). Treat the code as the stable ID — slugs and titles may change.
- **3 DLOs per thread**, one per tier: `emerging`, `developing`, `demonstrating`. These are growth bands, not age levels. A 5-year-old can be `demonstrating` in one thread and `emerging` in another.
- **DLO descriptors are the contract.** When designing a module activity, identify which thread(s) it targets and which tier(s) it gives a child an opportunity to demonstrate. The descriptor text is what an observer would look for in the child's behaviour.
- **AU/QLD do NOT mandate a finer-grained DLO scheme.** Don't map activities to AC9 codes — that grain is not shipped and not planned.

## Authoring contract: `capabilityTargets` (WS-6)

Since D1 (#195), the way an activity declares what it develops is the **`capabilityTargets`** field — a thread paired with the tier the author is targeting:

```ts
// src/sanity/schemas/activity.ts
capabilityTargets: Array<{
  thread: Reference<capabilityThread>;                 // required — capabilityThread.<CODE>, e.g. capabilityThread.M1
  tier: 'emerging' | 'developing' | 'demonstrating';   // required — pick by DLO descriptor below
}>
```

- **One target per (thread, tier) the activity gives the child a chance to demonstrate.** Use the per-tier DLO descriptors in this document to choose the tier: pick the band whose descriptor matches what an observer would actually see in the child's behaviour during the activity. When in doubt, `developing`.
- **What completion writes.** A completed run with declared targets logs an **opportunity** at that (thread, tier) with `declared` provenance — it becomes observed evidence only when corroborated (a per-child signal or a parent tap). Targets do not auto-assert mastery.
- **`capabilityThreads` (the old bare `reference[]`, no tier) is legacy.** It still works as a fallback — the runtime treats a bare thread as tier `developing` — but it is superseded. Populate `capabilityTargets` on new content; keep `capabilityThreads` during migration only.
- **Threads are referenced by stable code, as a deterministic id.** `thread._ref = capabilityThread.<CODE>` (e.g. `capabilityThread.EF7`). The code is the contract; titles/slugs may drift.
- **Soft-flagged when absent.** An activity with neither `capabilityThreads` nor `capabilityTargets` raises a non-blocking warning in Content QA (`/admin/content/qa`): *"activity declares no capability targets (won't contribute to the constellation)."* It never blocks publish.
- **Kindling-authored content** populates this at source — see `docs/kindling-capability-targets-handoff-v1.md`.

## Tier definitions (global, all threads)

| Tier | What it means |
|---|---|
| **Emerging** | First signs of the capability. Child shows interest, attempts simple forms, needs scaffolding. |
| **Developing** | Capability is reliably present in familiar contexts. Child operates with growing independence. |
| **Demonstrating** | Capability is generalised across contexts. Child applies, adapts, and reflects on it. |

---

## Domain: Historical, Civic & Geographic Understanding

*Slug:* `historicalCivicGeographic` · 6 thread(s)

### H1 — Historical Thinking & Chronology

*Slug:* `historical-thinking-and-chronology`

- **Emerging.** Sequences personal events (yesterday, last week). Identifies things as "old" or "new". Shows interest in family stories. Asks questions about the past.
- **Developing.** Places events on simple timeline. Describes how daily life changed over time. Identifies significant events or people. Understands people in past lived differently. Explores family and community histories.
- **Demonstrating.** Uses historical language (decade, century, era). Analyses cause and effect in events. Considers multiple perspectives. Identifies continuity and change. Connects local history to broader narratives.

### H2 — Source Analysis & Evidence

*Slug:* `source-analysis-and-evidence`

- **Emerging.** Identifies where information comes from (book, person, website). Recognises photos and objects can tell about past. Understands stories can be told differently.
- **Developing.** Distinguishes primary (diary, letter, photo) from secondary sources. Identifies author/creator and their perspective. Compares accounts and notices differences. Asks "How do we know?".
- **Demonstrating.** Evaluates reliability and usefulness of sources. Identifies bias, perspective, purpose. Cross-references multiple sources. Understands absence of sources creates knowledge gaps. Applies across disciplines.

### H3 — Geography & Environmental Awareness

*Slug:* `geography-and-environmental-awareness`

- **Emerging.** Describes local environment and features. Identifies home and school on simple map. Names natural features. Notices differences between places.
- **Developing.** Creates and interprets simple maps with keys. Describes how people use and change environment. Compares features of different places. Identifies weather/climate effects. Understands Indigenous names and histories.
- **Demonstrating.** Analyses relationship between human activity and environmental change. Uses geographical tools (maps, globes, digital). Evaluates land use and management perspectives. Understands sustainability. Compares global communities.

### H4 — Civic & Economic Understanding

*Slug:* `civic-and-economic-understanding`

- **Emerging.** Identifies roles and responsibilities in family and community. Understands groups need rules. Recognises needs vs wants. Shows awareness people do different jobs.
- **Developing.** Explains why communities have rules and laws. Describes how goods/services are produced and distributed. Identifies rights and responsibilities. Understands democratic concepts. Recognises different perspectives.
- **Demonstrating.** Analyses how decisions affect different groups. Understands levels of government and roles. Evaluates economic choices and trade-offs. Considers global connections impact. Proposes solutions to issues.

### H5 — HASS Inquiry Skills

*Slug:* `hass-inquiry-skills`

- **Emerging.** Asks questions about people, places, events. Finds information from provided source. Shares findings with others. Draws or writes about learning.
- **Developing.** Develops own inquiry questions. Uses multiple sources to investigate. Sorts and records information. Presents findings appropriately. Identifies different viewpoints.
- **Demonstrating.** Plans and conducts extended inquiry with multiple stages. Evaluates sources for reliability and relevance. Synthesises diverse information. Draws evidence-based conclusions. Reflects on process.

### H6 — First Nations Australian Perspectives

*Slug:* `first-nations-australian-perspectives`

- **Emerging.** Notices cultural difference
- **Developing.** Compares cultures respectfully
- **Demonstrating.** Engages cultures as living things

## Domain: Language & Literacy

*Slug:* `languageLiteracy` · 7 thread(s)

### L1 — Oral Communication & Listening

*Slug:* `oral-communication-and-listening`

- **Emerging.** Responds with a relevant word or phrase. Takes turns with prompting. Follows simple one-two step instructions.
- **Developing.** Initiates conversation about experiences without prompting. Asks clarifying questions. Retells events in sequence. Adjusts volume/tone for different settings.
- **Demonstrating.** Presents ideas to groups with confidence. Adapts language for different audiences. Sustains conversation by building on what others say. Uses specific vocabulary from learning contexts.

### L2 — Phonological Awareness & Decoding

*Slug:* `phonological-awareness-and-decoding`

- **Emerging.** Recognises rhyming words in songs. Claps syllables. Identifies first sound in words. Recognises some letters by name.
- **Developing.** Blends 2-3 phonemes to read CVC words. Segments words into sounds. Matches letters to sounds. Reads familiar high-frequency words. Self-corrects when decoded word does not make sense.
- **Demonstrating.** Reads unfamiliar words by applying phonics fluently. Handles consonant blends, digraphs, vowel patterns. Reads with phrasing and expression. Recognises and reads multisyllabic words.

### L3 — Reading Comprehension

*Slug:* `reading-comprehension`

- **Emerging.** Points to pictures that match text. Answers "what happened?" questions. Makes connections to personal experience. Identifies main characters.
- **Developing.** Predicts what happens next based on clues. Retells story including beginning, middle, end. Identifies main idea in informational text. Makes simple inferences. Asks questions about unfamiliar words.
- **Demonstrating.** Compares ideas across multiple texts. Identifies author purpose or perspective. Distinguishes fact from opinion. Uses evidence to support interpretation. Monitors own comprehension and uses strategies when meaning breaks down.

### L4 — Spelling & Word Knowledge

*Slug:* `spelling-and-word-knowledge`

- **Emerging.** Represents sounds in words with plausible letter choices (invented spelling). Spells some high-frequency words. Recognises when word "doesn't look right".
- **Developing.** Applies common spelling patterns consistently. Uses word families to spell related words. Spells most high-frequency words correctly. Begins to use morphemic knowledge (adding -ed, -ing, -s). Uses references to check spelling.
- **Demonstrating.** Applies prefixes, suffixes, and root words. Spells words with complex patterns. Self-edits for spelling. Uses etymological knowledge. Demonstrates precise word choice in writing.

### L5 — Written Expression

*Slug:* `written-expression`

- **Emerging.** Dictates ideas for an adult to write down. Writes or draws to convey simple message. Attempts sentences with capitals and full stops. Labels pictures or diagrams.
- **Developing.** Writes multiple connected sentences on topic. Includes beginning, middle, end. Uses descriptive language (adjectives, simple adverbs). Writes for different purposes when prompted. Re-reads and makes simple changes.
- **Demonstrating.** Plans before writing using notes, diagrams, or outlines. Writes sustained texts with clear structure and paragraphing. Varies sentence length and type for effect. Shows audience awareness. Edits and revises for clarity.

### L6 — Handwriting & Text Production

*Slug:* `handwriting-and-text-production`

- **Emerging.** Holds writing tool with functional grip. Forms recognisable letters (may be inconsistent). Writes own name. Distinguishes between drawing and writing.
- **Developing.** Forms most letters correctly with consistent size. Writes on lines with appropriate spacing. Produces legible text others can read. Writes with sufficient fluency that ideas aren't lost. Begins to use joined/cursive writing or efficient keyboard.
- **Demonstrating.** Produces text fluently in chosen mode (handwriting or typing). Writing tool no longer limits complexity or length of expression. Adapts presentation for purpose. Uses digital tools for text production when appropriate.

### L7 — Text Structure & Purpose

*Slug:* `text-structure-and-purpose`

- **Emerging.** Recognises difference between story and information text. Identifies basic text features (title, pictures, page numbers). Understands texts are written for different reasons.
- **Developing.** Names and recognises common text types (narrative, procedure, report). Uses appropriate structure when writing familiar text type. Identifies text features (headings, captions, diagrams). Understands purpose of contents pages and glossaries.
- **Demonstrating.** Explains how structure supports author purpose. Chooses appropriate text type for given need. Analyses how language features differ across text types. Creates texts combining or adapting structures for effect. Evaluates whether structure serves purpose.

## Domain: Literary & Narrative Tradition

*Slug:* `literaryTradition` · 2 thread(s)

### C1 — Narrative & Storytelling

*Slug:* `narrative-and-storytelling`

- **Emerging.** Tells simple stories with beginning and end. Uses imaginative play with toys or props. Contributes ideas to shared storytelling.
- **Developing.** Creates stories with clear beginning, middle, end. Develops characters with distinct traits. Includes problems and resolutions. Uses descriptive language for setting. Tells stories across media.
- **Demonstrating.** Creates complex narratives with subplots, themes, moral dilemmas. Develops multi-dimensional characters that change. Uses narrative techniques deliberately. Adapts storytelling for audiences. Revises based on feedback.

### L9 — Literary Response & Appreciation

*Slug:* `literary-response-and-appreciation`

- **Emerging.** Shows enjoyment of stories being read aloud. Has favourite books, characters, or story types. Responds with personal reaction. Recognises story elements (character, setting, problem).
- **Developing.** Explains why they like or dislike text with reference to specific parts. Identifies with characters and discusses motivations. Recognises literary devices when pointed out. Compares texts by same author or on same topic. Recommends books.
- **Demonstrating.** Discusses themes and ideas across multiple texts. Analyses how authors create effect through language choices. Responds to literature with personal interpretation and evidence. Appreciates literary forms and conventions. Evaluates how texts reflect different cultural or.

## Domain: Logic & Rhetoric

*Slug:* `logicRhetoric` · 1 thread(s)

### L8 — Persuasion & Argument

*Slug:* `persuasion-and-argument`

- **Emerging.** Expresses preference with simple reason ("I think cats are better because they're soft"). Recognises when someone is trying to convince them. Understands people can have different opinions.
- **Developing.** Gives multiple reasons to support opinion. Identifies persuasive techniques in advertisements. Writes simple persuasive text with clear position and reasons. Considers counter-argument when prompted.
- **Demonstrating.** Constructs sustained arguments with evidence and reasoning. Evaluates strength of evidence. Identifies bias, emotive language, rhetorical strategies. Acknowledges counter-arguments and addresses them. Distinguishes fact, opinion, reasoned judgment.

## Domain: Mathematical Thinking

*Slug:* `mathematicalThinking` · 9 thread(s)

### M1 — Number Sense & Place Value

*Slug:* `number-sense-and-place-value`

- **Emerging.** Counts objects with one-to-one correspondence. Recognises last number counted tells "how many". Compares two groups (more/fewer). Recognises numerals. Understands numbers come in fixed order.
- **Developing.** Counts forwards and backwards from any starting point. Uses skip counting (2s, 5s, 10s) purposefully. Understands tens and ones (24 = 2 tens + 4 ones). Orders numbers on number line. Estimates quantities.
- **Demonstrating.** Composes and decomposes numbers flexibly (38 = 30+8 = 20+18). Understands place value across hundreds, thousands. Compares and orders large numbers. Rounds appropriately. Applies number sense to check reasonableness.

### M2 — Operations & Computation

*Slug:* `operations-and-computation`

- **Emerging.** Combines two groups and counts total. Removes objects and counts remainder. Uses concrete materials for addition/subtraction. Recognises "putting together" and "taking away". Shares equally between two people.
- **Developing.** Uses mental strategies (counting on, doubles, making 10). Recalls basic addition and subtraction facts. Understands multiplication as repeated groups. Uses arrays, skip counting for multiplication. Recognises inverse relationship.
- **Demonstrating.** Computes fluently with all four operations using efficient strategies. Knows multiplication facts and uses them for division. Applies operations to multi-step problems. Estimates before computing. Selects most efficient strategy.

### M3 — Fractional Thinking

*Slug:* `fractional-thinking`

- **Emerging.** Understands "half" as splitting into two equal parts. Identifies whether share is fair. Recognises halves and quarters in everyday contexts. Uses language of parts.
- **Developing.** Names and recognises common unit fractions (½, ⅓, ¼, ⅕). Understands fractions represent equal parts. Locates simple fractions on number line. Compares and orders unit fractions. Connects fractions to division.
- **Demonstrating.** Adds and subtracts fractions with related denominators. Connects fractions, decimals, percentages. Uses fractions in measurement and data contexts. Compares and orders different denominators.

### M4 — Algebraic Thinking & Patterns

*Slug:* `algebraic-thinking-and-patterns`

- **Emerging.** Copies simple repeating pattern. Identifies what comes next. Sorts objects by one attribute. Recognises patterns in daily routines.
- **Developing.** Creates own patterns using multiple attributes. Identifies and describes growing patterns (1, 3, 5, 7). Understands equals sign as "is the same as". Finds missing numbers in equations. Describes rule for pattern.
- **Demonstrating.** Generates complex patterns and describes rule. Uses symbols or letters for unknowns. Understands and applies order of operations. Creates algorithms to solve problems. Identifies functional relationships.

### M5 — Measurement Sense

*Slug:* `measurement-sense`

- **Emerging.** Compares two objects directly (longer/heavier). Uses informal measurement language (big, small, heavy, light). Sequences events in time. Recognises different tools measure different things.
- **Developing.** Measures using informal units (hand spans, cups) consistently. Understands need for standard units. Uses rulers, scales, measuring cups with increasing accuracy. Reads clocks (to half hour). Estimates measurements.
- **Demonstrating.** Measures accurately using standard metric units (cm, m, kg, g, mL, L). Converts between related units. Calculates perimeter, area, volume using formulas. Uses timetables, calculates elapsed time.

### M6 — Spatial Reasoning & Geometry

*Slug:* `spatial-reasoning-and-geometry`

- **Emerging.** Names basic 2D shapes (circle, square, triangle). Describes position (next to, behind, above). Sorts shapes by simple attributes. Follows basic directional instructions.
- **Developing.** Identifies and describes properties of 2D and 3D shapes (faces, edges, corners). Recognises shapes regardless of orientation. Creates and interprets simple maps. Identifies lines of symmetry. Performs transformations.
- **Demonstrating.** Classifies shapes using properties with reasoning. Uses coordinate system to describe position. Identifies and describes angle properties. Creates nets for 3D shapes. Visualises transformations mentally.

### M7 — Data & Statistical Thinking

*Slug:* `data-and-statistical-thinking`

- **Emerging.** Sorts objects into categories and counts each. Answers simple questions about picture graph. Participates in surveys. Understands we can count and compare to learn.
- **Developing.** Poses own questions answerable with data. Collects data through observation, surveys, experiments. Creates simple displays (picture graphs, tally, bar graphs). Reads and interprets data. Identifies most/least common.
- **Demonstrating.** Selects appropriate data display for data type. Uses mean, median, mode, range. Identifies trends, outliers, patterns. Draws conclusions and makes predictions. Evaluates reliability of methods.

### M8 — Probability & Chance

*Slug:* `probability-and-chance`

- **Emerging.** Uses language of chance (maybe, probably, definitely, no way). Identifies outcomes as certain, possible, impossible. Understands some things happen more often than others. Predicts simple outcomes.
- **Developing.** Lists possible outcomes of simple chance events. Describes likelihood on scale (impossible to certain). Conducts simple experiments and records results. Compares expected and actual results.
- **Demonstrating.** Assigns numerical probabilities (fractions, decimals, percentages). Compares theoretical and experimental probability. Identifies all possible outcomes of compound events. Uses probability for decisions.

### M9 — Mathematical Modelling & Problem Solving

*Slug:* `mathematical-modelling-and-problem-solving`

- **Emerging.** Recognises when real situation involves mathematics. Represents simple problem with objects, drawings, numbers. Explains thinking when solving problem.
- **Developing.** Identifies information needed to solve problem. Tries more than one strategy when stuck. Uses diagrams, tables, lists to organise approach. Checks answer makes sense in real-world context.
- **Demonstrating.** Formulates mathematical representations of complex real problems. Selects and combines appropriate tools and strategies. Interprets and communicates results in context. Evaluates efficiency of methods.

## Domain: Musical & Performative Arts

*Slug:* `musicalPerformative` · 3 thread(s)

### C2 — Musical Expression

*Slug:* `musical-expression`

- **Emerging.** Responds to music physically (clapping, swaying, dancing). Sings familiar songs with some accuracy. Identifies instruments or sound sources. Expresses preferences for music.
- **Developing.** Keeps steady beat during activities. Creates simple patterns. Identifies musical elements (loud/soft, fast/slow, high/low). Performs with attention to expression. Listens to and discusses different cultures.
- **Demonstrating.** Creates original compositions or arrangements. Uses notation or recording to capture ideas. Analyses and evaluates with appropriate vocabulary. Performs with technical skill and expression. Applies across genres and cultures.

### C3 — Poetic & Rhythmic Expression

*Slug:* `poetic-and-rhythmic-expression`

- **Emerging.** Enjoys rhyming words and wordplay. Repeats rhythmic phrases from songs, books, poems. Notices similar or interesting sounds. Claps or moves to language rhythm.
- **Developing.** Creates simple rhymes or patterns. Experiments with alliteration, onomatopoeia, repetition. Reads poetry with attention to rhythm and expression. Describes how poem makes them feel. Writes simple poems.
- **Demonstrating.** Writes original poetry with intentional use of devices. Analyses craft of published poems. Experiments with different forms (haiku, free verse, acrostic). Uses poetic language across contexts. Develops personal voice.

### C4 — Dramatic Expression

*Slug:* `dramatic-expression`

- **Emerging.** Engages in imaginative/pretend play spontaneously. Takes on roles (doctor, shopkeeper). Uses props and costumes. Watches and responds to performances.
- **Developing.** Maintains character or role for extended period. Uses voice (volume, tone, expression) to convey character. Collaborates to create dramatic scenarios. Creates simple scripts. Responds to drama personally.
- **Demonstrating.** Creates and performs original works. Uses techniques deliberately (pause, gesture, staging). Analyses and provides feedback. Takes on complex roles with commitment. Uses drama to explore issues.

## Domain: Personal & Ethical Formation

*Slug:* `personalEthical` · 11 thread(s)

### EF1 — Sustained Attention & Focus

*Slug:* `sustained-attention-and-focus`

- **Emerging.** Engages with activity for few minutes before seeking new thing. Returns to activity after interruption with prompting. Shows focused engagement in high-interest activities. Responds to redirection.
- **Developing.** Sustains attention on task for 15-20+ minutes. Returns after interruption without prompting. Ignores minor distractions. Completes multi-step activities. Recognises when attention drifted.
- **Demonstrating.** Sustains deep focus for extended periods (30+ minutes). Manages attention strategically (quiet spaces, removing distractions). Maintains focus during challenging tasks. Transitions attention efficiently. Demonstrates flow states.

### EF2 — Working Memory

*Slug:* `working-memory`

- **Emerging.** Follows one-step instruction. Remembers where left familiar object. Recalls simple message to pass to person. Holds one piece of information while completing task.
- **Developing.** Follows 2-3 step instructions without reminding. Holds question in mind while searching answer. Remembers and applies rule while working. Connects information from text beginning to end. Remembers what was doing after interruption.
- **Demonstrating.** Follows complex multi-step procedures from memory. Solves problems holding multiple variables. Connects ideas across different contexts. Uses memory strategies deliberately. Manages multiple demands simultaneously.

### EF3 — Memory & Recall

*Slug:* `memory-and-recall`

- **Emerging.** Recalls recent events when prompted. Remembers names of familiar people and places. Recognises previously encountered information. Recalls favourite stories or songs.
- **Developing.** Recalls key facts from recent learning without prompting. Uses prior knowledge to make connections. Remembers procedures. Retrieves mathematical facts with increasing automaticity. Recalls information from weeks ago.
- **Demonstrating.** Draws on broad base of prior knowledge across domains. Retrieves information quickly and accurately. Makes connections between stored knowledge and novel situations. Uses memory strategies deliberately. Demonstrates deep, flexible knowledge.

### EF4 — Planning & Organisation

*Slug:* `planning-and-organisation`

- **Emerging.** Gathers materials before starting when reminded. Follows provided sequence of steps. Identifies what needed to start. Accepts help breaking big task into steps.
- **Developing.** Breaks task into steps with minimal guidance. Gathers necessary materials independently. Creates simple plans (lists, drawings, outlines). Manages time with support. Adjusts plans when not working.
- **Demonstrating.** Plans multi-day or multi-week projects independently. Prioritises tasks and manages competing demands. Creates and maintains organisational systems. Anticipates problems and plans contingencies. Reflects and improves strategies.

### EF5 — Critical Thinking

*Slug:* `critical-thinking`

- **Emerging.** Asks "why?" and "how do you know?" questions. Notices when something doesn't seem right. Compares two options and explains preference. Identifies real from imaginary.
- **Developing.** Identifies assumptions in own and others' thinking. Evaluates evidence before accepting. Considers alternative explanations. Distinguishes strong and weak reasons. Asks probing questions.
- **Demonstrating.** Analyses complex issues from multiple perspectives. Identifies logical fallacies and weak reasoning. Synthesises information from multiple sources. Evaluates quality and relevance of evidence. Forms and defends positions.

### EF7 — Metacognition & Reflective Practice

*Slug:* `metacognition-and-reflective-practice`

- **Emerging.** Responds to "What did you learn?" with specific answers. Identifies activities they find easy or hard. Shows awareness that practice improves performance. Accepts feedback.
- **Developing.** Describes strategies they use for learning. Identifies what they understand and what they're confused about. Adjusts approach when not working. Reflects on work and identifies what'd do differently. Seeks feedback.
- **Demonstrating.** Monitors own understanding in real-time. Selects and applies strategies deliberately for different tasks. Sets personal learning goals and tracks progress. Provides constructive feedback to others. Articulates personal learning philosophy.

### EF8 — Creative Thinking & Innovation

*Slug:* `creative-thinking-and-innovation`

- **Emerging.** Engages in imaginative play and "what if" scenarios. Suggests unusual ideas without self-censoring. Shows curiosity and asks original questions. Experiments with materials freely.
- **Developing.** Generates multiple ideas when brainstorming. Combines existing ideas in new ways. Takes intellectual risks. Builds on others' ideas constructively. Sees problems as opportunities.
- **Demonstrating.** Produces original and effective creative works or solutions. Applies creative thinking across domains (not just arts). Evaluates ideas for feasibility while maintaining ambition. Persists through creative process. Demonstrates personal creative voice.

### PS3 — Self-Regulation & Wellbeing

*Slug:* `self-regulation-and-wellbeing`

- **Emerging.** Names current emotion with support. Accepts comfort from trusted person. Transitions between activities with support. Identifies situations affecting emotions.
- **Developing.** Uses strategies to manage big emotions (deep breaths, walking away, asking for space). Transitions with minimal support. Persists through frustration with less intervention. Describes strengths and areas being worked on.
- **Demonstrating.** Self-monitors emotional state and applies strategies independently. Recovers from setbacks with resilience. Maintains balanced and realistic self-assessment. Advocates for own needs. Shows sustained positive engagement.

### PS4 — Identity & Belonging

*Slug:* `identity-and-belonging`

- **Emerging.** Identifies self as part of family and community. Recognises and names personal interests and preferences. Shows awareness of cultural or family traditions. Demonstrates pride in abilities.
- **Developing.** Describes own cultural background and family stories. Recognises and respects others' different backgrounds. Identifies personal strengths and learning areas. Feels comfortable contributing in groups.
- **Demonstrating.** Articulates personal values and what matters. Respects and celebrates diversity. Shows confidence in identity while open to new ideas. Connects identity to broader community and cultural contexts. Shows resilience.

### PS5 — Environmental Stewardship

*Slug:* `environmental-stewardship`

- **Emerging.** Looks after own belongings
- **Developing.** Follows through on a task
- **Demonstrating.** Owns the outcome of a choice

### PS6 — Ethical Reasoning

*Slug:* `ethical-reasoning`

- **Emerging.** Identifies situations as "fair" or "unfair". Recognises when someone hurt or treated badly. Follows rules and understands purpose. Responds honestly about own actions.
- **Developing.** Considers action impact on others before acting. Explains reasons for rules and suggests modifications. Recognises ethical dilemmas in stories and life. Understands fair doesn't always mean equal.
- **Demonstrating.** Analyses ethical dilemmas using multiple perspectives. Defends moral position with reasoned arguments. Identifies ethical dimensions in apparently neutral situations. Considers stakeholder consequences.

## Domain: Physical & Embodied Capability

*Slug:* `physicalEmbodied` · 5 thread(s)

### P1 — Gross Motor & Physical Coordination

*Slug:* `gross-motor-and-physical-coordination`

- **Emerging.** Walks, runs, jumps with basic control. Catches large ball with two hands from close range. Balances on one foot briefly. Moves to music with some rhythm.
- **Developing.** Demonstrates coordinated running, jumping, hopping, skipping. Throws overarm with increasing accuracy. Catches small ball from various distances. Maintains balance during dynamic activities. Performs movement sequences.
- **Demonstrating.** Moves with fluency, control, efficiency across diverse activities. Combines locomotor and object control skills in games. Adapts movement to environments. Demonstrates spatial awareness. Shows stamina and endurance.

### P2 — Fine Motor & Manipulation

*Slug:* `fine-motor-and-manipulation`

- **Emerging.** Holds and uses tools (crayons, spoons, paintbrushes) with functional grip. Threads large beads, completes simple puzzles. Uses scissors to snip. Manipulates playdough or clay.
- **Developing.** Cuts along line with reasonable accuracy. Draws recognisable shapes and pictures with detail. Ties knots, uses fasteners (buttons, zips). Uses construction materials with precision. Holds pencil with efficient grip.
- **Demonstrating.** Completes intricate tasks (sewing, detailed drawing, model building). Uses range of tools confidently. Fine motor does not limit any activity. Adapts grip and pressure for different tools.

### P3 — Health & Body Awareness

*Slug:* `health-and-body-awareness`

- **Emerging.** Identifies basic body parts and functions. Understands simple hygiene routines. Recognises food gives energy and helps growth. Identifies when unwell and communicates it.
- **Developing.** Describes factors for health (nutrition, exercise, sleep, hygiene). Makes increasingly independent healthy choices. Understands bodies change over time. Identifies safe and unsafe actions.
- **Demonstrating.** Analyses relationship between lifestyle choices and health. Evaluates health information from sources. Demonstrates personal responsibility. Understands connection between physical and mental wellbeing. Identifies health resources.

### P4 — Sport & Cooperative Games

*Slug:* `sport-and-cooperative-games`

- **Emerging.** Participates willingly in group physical activities. Follows basic game rules with reminding. Takes turns during games. Shows enjoyment of physical play with others.
- **Developing.** Understands and follows rules independently. Co-constructs fair play rules. Works cooperatively with partner or team. Shows good sportsmanship. Applies movement skills in games.
- **Demonstrating.** Develops and applies tactics and strategies. Supports and encourages others. Modifies games for inclusion or challenge. Demonstrates leadership. Reflects on performance and improves.

### P5 — Risk Assessment & Physical Safety

*Slug:* `risk-assessment-and-physical-safety`

- **Emerging.** Responds to "stop" or safety instructions. Identifies obviously dangerous situations. Understands basic safety rules in familiar environments. Seeks help when feeling unsafe.
- **Developing.** Assesses risk before attempting challenges. Identifies potential hazards in new environments. Knows who to ask for help. Understands protective behaviours and boundaries. Makes safe choices with decreasing prompting.
- **Demonstrating.** Independently assesses and manages physical risks. Adapts behaviour for different risk levels. Demonstrates emergency awareness. Helps others identify and manage risks. Articulates why safety measures exist.

## Domain: Practical Mastery

*Slug:* `practicalMastery` · 1 thread(s)

### C6 — Design & Construction

*Slug:* `design-and-construction`

- **Emerging.** Builds with construction materials (blocks, Lego, boxes) with purpose. Talks about what they'll make before starting. Identifies problem to solve. Explores how things work.
- **Developing.** Draws plans or designs before building. Selects materials based on properties and task. Tests creation and identifies what works. Modifies designs based on testing. Describes design process.
- **Demonstrating.** Plans designs with clear specifications and constraints. Uses full design cycle (define→design→make→evaluate→improve). Considers user needs. Evaluates trade-offs. Documents process and explains decisions.

## Domain: Scientific Thinking

*Slug:* `scientificThinking` · 6 thread(s)

### S1 — Scientific Inquiry

*Slug:* `scientific-inquiry`

- **Emerging.** Asks "what" and "why" questions about natural phenomena. Explores objects using senses. Notices changes in environment. Describes observations using everyday language.
- **Developing.** Poses questions that can be investigated. Makes predictions before testing. Follows investigation steps and records observations. Uses informal measurements. Describes results and compares with predictions.
- **Demonstrating.** Plans investigations with identified variables (change, measure, keep same). Records data systematically in tables/diagrams. Analyses patterns and draws conclusions. Evaluates fairness of investigation. Suggests improvements.

### S2 — Living Systems

*Slug:* `living-systems`

- **Emerging.** Identifies things as living or non-living. Names basic needs (food, water, shelter). Observes and describes features. Notices growth and change.
- **Developing.** Describes life cycles of familiar organisms. Groups living things by observable features. Identifies structural features for survival. Explains simple food chains and relationships. Describes dependence on environment.
- **Demonstrating.** Explains adaptations and survival in specific environments. Describes interdependence in ecosystems. Understands human activity impact. Compares life cycles across organisms.

### S3 — Earth & Environmental Systems

*Slug:* `earth-and-environmental-systems`

- **Emerging.** Observes and describes daily weather and seasonal changes. Identifies natural features in local environment. Recognises Earth has day and night. Notices sky (sun, moon, clouds, stars).
- **Developing.** Describes water cycle in simple terms. Identifies rocks, soil, landscapes. Understands weather and seasonal patterns. Describes Earth rotation and day/night. Identifies natural resources and uses.
- **Demonstrating.** Explains geological processes (erosion, weathering). Understands Earth, Moon, Sun relationships. Analyses human activity impact on systems. Describes cycles (carbon, water, rock) in detail. Evaluates sustainability.

### S4 — Physical & Chemical Sciences

*Slug:* `physical-and-chemical-sciences`

- **Emerging.** Explores what objects are made of (wood, metal, fabric). Notices push/pull makes things move. Observes heating/cooling change materials. Groups materials by simple properties.
- **Developing.** Describes properties and links to uses. Understands forces change shape, speed, direction. Investigates light, sound, heat behaviour. Identifies reversible and irreversible changes. Describes energy transformations.
- **Demonstrating.** Explains how forces interact (gravity, friction, magnetism). Classifies changes (physical/chemical). Describes energy transfer and transformation. Understands particle model. Applies understanding to design.

### S5 — Scientific Observation

*Slug:* `scientific-observation`

- **Emerging.** Slows down to look when reminded. Points out single detail. Returns to look again. Asks "what's that?" about unexpected things.
- **Developing.** Slows down without reminder. Notices changes over time. Compares similar things and identifies differences. Uses tools (magnifier, binoculars) effectively. Describes multiple details.
- **Demonstrating.** Records observations systematically (journal, diagram, photo with notes). Distinguishes observed from interpreted. Notices patterns across observations. Designs observation protocols. Uses precise language.

### S6 — Science as Human Endeavour

*Slug:* `science-as-human-endeavour`

- **Emerging.** Shows curiosity about how things work and asks questions. Recognises people use science. Identifies scientists or inventors they've heard of.
- **Developing.** Describes examples of science changing daily life. Understands First Nations have long-standing scientific knowledge. Recognises scientists work together and build on ideas. Identifies how science helps solve problems.
- **Demonstrating.** Explains how scientific understanding changed with examples. Discusses ethical dimensions. Evaluates different claims using evidence. Understands peer review and reproducibility. Recognises diverse cultural contributions.

## Domain: Social & Relational Formation

*Slug:* `socialRelational` · 3 thread(s)

### EF6 — Collaboration & Teamwork

*Slug:* `collaboration-and-teamwork`

- **Emerging.** Works alongside others on shared activity. Accepts role in group task. Shares materials willingly. Listens to others' ideas during activities.
- **Developing.** Contributes ideas and listens to others. Negotiates roles and responsibilities. Stays on task during group work. Helps others struggling. Compromises when disagreements arise.
- **Demonstrating.** Takes initiative and shows leadership in projects. Distributes work equitably and holds self accountable. Facilitates discussions and ensures all voices heard. Evaluates group processes. Adapts role to team needs.

### PS1 — Empathy & Perspective-Taking

*Slug:* `empathy-and-perspective-taking`

- **Emerging.** Recognises basic emotions in others (happy, sad, angry). Shows concern when someone upset. Understands people have feelings. Responds to simple perspective prompts.
- **Developing.** Identifies emotions from contextual cues. Considers another's perspective without prompting. Shows compassion through actions. Understands same event affects people differently. Discusses character feelings.
- **Demonstrating.** Takes perspective of very different people. Navigates disagreements considering both sides. Shows awareness of actions' effects on others. Demonstrates cultural sensitivity. Advocates for fairness and inclusion.

### PS2 — Social Skills & Cooperation

*Slug:* `social-skills-and-cooperation`

- **Emerging.** Plays alongside others (parallel to interactive play). Shares materials when reminded. Responds to social cues (greetings, turn-taking). Seeks out company of peers or family.
- **Developing.** Initiates social interaction and joins activities. Negotiates roles and resources with peers. Uses words to resolve simple conflicts with support. Works cooperatively on shared tasks. Identifies and maintains friendships.
- **Demonstrating.** Resolves conflicts independently using multiple strategies. Adapts social behaviour for different contexts. Supports and encourages others. Demonstrates leadership and followership. Builds positive relationships across groups.

## Domain: Technological Fluency

*Slug:* `technologicalFluency` · 2 thread(s)

### C7 — Digital Creation

*Slug:* `digital-creation`

- **Emerging.** Uses digital tools for simple creative tasks (drawing apps, camera). Understands digital devices follow instructions. Follows step sequences. Identifies everyday digital technology.
- **Developing.** Creates digital content (presentations, animations, programs). Writes simple algorithms or step-by-step instructions. Uses visual programming tools (Scratch). Organises data digitally. Debugs simple errors.
- **Demonstrating.** Creates complex projects combining multiple tools. Applies computational thinking (decomposition, pattern, abstraction). Designs and tests algorithms. Understands data types and storage. Evaluates solutions.

### PS7 — Digital Citizenship

*Slug:* `digital-citizenship`

- **Emerging.** Uses digital devices for simple purposes with supervision. Understands basic online safety rules. Recognises difference between online and offline interactions.
- **Developing.** Follows agreed family rules independently. Understands online actions have real consequences. Identifies suspicious or uncomfortable content and tells adult. Uses digital tools purposefully. Understands digital footprint.
- **Demonstrating.** Evaluates online information for credibility and bias. Manages digital identity and privacy thoughtfully. Demonstrates respectful and ethical online behaviour. Uses digital tools effectively and selectively. Helps others navigate safely.

## Domain: Visual & Plastic Arts

*Slug:* `visualPlasticArts` · 1 thread(s)

### C5 — Visual Expression & Design

*Slug:* `visual-expression-and-design`

- **Emerging.** Explores materials freely (paint, clay, pencils, collage). Creates images representing real or imagined things. Expresses preferences for colours, shapes, styles. Shows interest in visual art.
- **Developing.** Uses range of materials and techniques purposefully. Creates works with recognisable subjects and increasing detail. Experiments with colour, line, shape, texture. Discusses art by others. Plans before creating.
- **Demonstrating.** Creates visually effective works with deliberate aesthetic choices. Uses variety of media with skill. Analyses and evaluates visual art with vocabulary. Communicates ideas/stories/emotions through works. Develops personal style.

---

## Empty domains (v2 substrate placeholders)

These domains exist in the substrate but have no threads or DLOs. Do not invent activities for them — flag if a module clearly belongs here and we'll seed real content.

- **Classical Languages** (`classicalLanguages`)
- **Theology & Scriptural Literacy** (`theologyScripture`)

---

## Quick-lookup index

| Code | Thread | Domain |
|---|---|---|
| `C1` | Narrative & Storytelling | Literary & Narrative Tradition |
| `C2` | Musical Expression | Musical & Performative Arts |
| `C3` | Poetic & Rhythmic Expression | Musical & Performative Arts |
| `C4` | Dramatic Expression | Musical & Performative Arts |
| `C5` | Visual Expression & Design | Visual & Plastic Arts |
| `C6` | Design & Construction | Practical Mastery |
| `C7` | Digital Creation | Technological Fluency |
| `EF1` | Sustained Attention & Focus | Personal & Ethical Formation |
| `EF2` | Working Memory | Personal & Ethical Formation |
| `EF3` | Memory & Recall | Personal & Ethical Formation |
| `EF4` | Planning & Organisation | Personal & Ethical Formation |
| `EF5` | Critical Thinking | Personal & Ethical Formation |
| `EF6` | Collaboration & Teamwork | Social & Relational Formation |
| `EF7` | Metacognition & Reflective Practice | Personal & Ethical Formation |
| `EF8` | Creative Thinking & Innovation | Personal & Ethical Formation |
| `H1` | Historical Thinking & Chronology | Historical, Civic & Geographic Understanding |
| `H2` | Source Analysis & Evidence | Historical, Civic & Geographic Understanding |
| `H3` | Geography & Environmental Awareness | Historical, Civic & Geographic Understanding |
| `H4` | Civic & Economic Understanding | Historical, Civic & Geographic Understanding |
| `H5` | HASS Inquiry Skills | Historical, Civic & Geographic Understanding |
| `H6` | First Nations Australian Perspectives | Historical, Civic & Geographic Understanding |
| `L1` | Oral Communication & Listening | Language & Literacy |
| `L2` | Phonological Awareness & Decoding | Language & Literacy |
| `L3` | Reading Comprehension | Language & Literacy |
| `L4` | Spelling & Word Knowledge | Language & Literacy |
| `L5` | Written Expression | Language & Literacy |
| `L6` | Handwriting & Text Production | Language & Literacy |
| `L7` | Text Structure & Purpose | Language & Literacy |
| `L8` | Persuasion & Argument | Logic & Rhetoric |
| `L9` | Literary Response & Appreciation | Literary & Narrative Tradition |
| `M1` | Number Sense & Place Value | Mathematical Thinking |
| `M2` | Operations & Computation | Mathematical Thinking |
| `M3` | Fractional Thinking | Mathematical Thinking |
| `M4` | Algebraic Thinking & Patterns | Mathematical Thinking |
| `M5` | Measurement Sense | Mathematical Thinking |
| `M6` | Spatial Reasoning & Geometry | Mathematical Thinking |
| `M7` | Data & Statistical Thinking | Mathematical Thinking |
| `M8` | Probability & Chance | Mathematical Thinking |
| `M9` | Mathematical Modelling & Problem Solving | Mathematical Thinking |
| `P1` | Gross Motor & Physical Coordination | Physical & Embodied Capability |
| `P2` | Fine Motor & Manipulation | Physical & Embodied Capability |
| `P3` | Health & Body Awareness | Physical & Embodied Capability |
| `P4` | Sport & Cooperative Games | Physical & Embodied Capability |
| `P5` | Risk Assessment & Physical Safety | Physical & Embodied Capability |
| `PS1` | Empathy & Perspective-Taking | Social & Relational Formation |
| `PS2` | Social Skills & Cooperation | Social & Relational Formation |
| `PS3` | Self-Regulation & Wellbeing | Personal & Ethical Formation |
| `PS4` | Identity & Belonging | Personal & Ethical Formation |
| `PS5` | Environmental Stewardship | Personal & Ethical Formation |
| `PS6` | Ethical Reasoning | Personal & Ethical Formation |
| `PS7` | Digital Citizenship | Technological Fluency |
| `S1` | Scientific Inquiry | Scientific Thinking |
| `S2` | Living Systems | Scientific Thinking |
| `S3` | Earth & Environmental Systems | Scientific Thinking |
| `S4` | Physical & Chemical Sciences | Scientific Thinking |
| `S5` | Scientific Observation | Scientific Thinking |
| `S6` | Science as Human Endeavour | Scientific Thinking |
