/**
 * Seeds the 57 v1 capability threads into Sanity, mapped onto the 15 canonical
 * v2 domains per the v1→v2 thread migration table.
 *
 * Source content: extracted verbatim from scripts/seed-capability-threads.ts
 *   (the archived v1 seed file at the time of v2 substrate migration).
 * Source mapping: hearth-v1-to-v2-thread-migration-table-v1.md, primary domain
 *   only for split cases.
 *
 * Run order:
 *   1. seed-capability-domains.ts (MUST run first — threads carry a required
 *      domain reference; absent domains will reject with ref-integrity error)
 *   2. seed-capability-threads.ts (this file)
 *   3. seed-dlos.ts (DLO refs to capabilityThread.{id} resolve once threads exist)
 *
 * Idempotent: uses createOrReplace with deterministic IDs of the form
 *   capabilityThread.{legacyV1Id}, e.g. capabilityThread.L1, capabilityThread.M3.
 *
 * Transitional semantics: these threads carry v1 content under v2 IDs and v2
 * domain references. `legacyV1Id` is populated so the future v2 migration script
 * can re-tag observations as v2-native threads are authored. `canonStatus` is
 * 'active' for now; when a v2 successor thread is authored, the v1 thread is
 * flipped to 'deprecated' with `deprecationReplacement` pointing across.
 *
 * Stage-bands are emitted as the required four-band skeleton (per spec D4)
 * with `isPopulatedInThisVersion: false` on each band — v1 content is flat,
 * not stage-banded.
 *
 * Usage:
 *   SANITY_API_TOKEN=<write-token> npx tsx scripts/seed-capability-threads.ts
 *
 * Field-shape note for Claude Code: this script writes fields per
 * capabilityThread.ts as supplied. If the deployed schema diverges, adapt the
 * `toSanityDoc` function — do NOT change the _id values, since downstream
 * DLO refs depend on them.
 */

import { createClient } from '@sanity/client';

// ─── Sanity client ──────────────────────────────────────────────────────
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID ?? 'g5zhwbxg',
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// ─── Seed data type ─────────────────────────────────────────────────────
interface V1ThreadSeed {
  legacyV1Id: string;        // 'L1', 'M3', 'PS4', etc.
  title: string;
  domainKey: string;         // matches capabilityDomain.{key} suffix
  summary: string;
  whatItLooksLike: string[]; // up to 3 examples derived from v1 DLO titles
}

// ─── Slug helper ────────────────────────────────────────────────────────
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── 57 v1 threads with v2 domain mapping ───────────────────────────────
const V1_THREADS: V1ThreadSeed[] = [
  {
    legacyV1Id: 'L1',
    title: `Oral Communication & Listening`,
    domainKey: 'languageLiteracy',
    summary: `The child can listen actively, respond meaningfully in conversation, share ideas clearly, and adapt their communication to different situations and audiences.`,
    whatItLooksLike: [
      `Listens when spoken to directly and responds with relevant contributions`,
      `Initiates conversation and asks clarifying questions`,
      `Adapts language for different audiences and sustains multi-turn conversation`,
    ],
  },
  {
    legacyV1Id: 'L2',
    title: `Phonological Awareness & Decoding`,
    domainKey: 'languageLiteracy',
    summary: `The child understands that spoken words are made up of sounds, can manipulate those sounds, and uses this knowledge to decode (read) and encode (spell) words.`,
    whatItLooksLike: [
      `Recognises rhyming words and identifies first sounds`,
      `Blends phonemes and reads high-frequency words`,
      `Reads unfamiliar words fluently using phonics and patterns`,
    ],
  },
  {
    legacyV1Id: 'L3',
    title: `Reading Comprehension`,
    domainKey: 'languageLiteracy',
    summary: `The child makes meaning from texts — understanding what is stated explicitly, making inferences, connecting ideas across a text, and bringing their own experience to interpretation.`,
    whatItLooksLike: [
      `Points to pictures and answers simple comprehension questions`,
      `Predicts and retells with beginning, middle, end; makes simple inferences`,
      `Compares texts, identifies author purpose, and uses text evidence for interpretation`,
    ],
  },
  {
    legacyV1Id: 'L4',
    title: `Spelling & Word Knowledge`,
    domainKey: 'languageLiteracy',
    summary: `The child understands how English words are structured — morphemes, etymology, spelling patterns — and applies this knowledge when writing.`,
    whatItLooksLike: [
      `Uses plausible letter choices and recognises high-frequency words`,
      `Applies spelling patterns and uses morphemic knowledge`,
      `Applies prefixes, suffixes, root words, and uses etymology`,
    ],
  },
  {
    legacyV1Id: 'L5',
    title: `Written Expression`,
    domainKey: 'languageLiteracy',
    summary: `The child communicates ideas, experiences, and arguments in writing with increasing control over structure, voice, and audience awareness.`,
    whatItLooksLike: [
      `Dictates ideas and writes simple messages with capital letters and full stops`,
      `Writes multiple connected sentences with beginning, middle, end; uses descriptive language`,
      `Plans before writing; uses clear structure, varied sentences, and audience awareness`,
    ],
  },
  {
    legacyV1Id: 'L6',
    title: `Handwriting & Text Production`,
    domainKey: 'languageLiteracy',
    summary: `The child produces legible written text — whether through handwriting, typing, or other tools — with increasing fluency and automaticity.`,
    whatItLooksLike: [
      `Holds writing tool with functional grip and forms recognisable letters`,
      `Forms letters correctly with consistent size and spacing; writes fluently`,
      `Produces text fluently; writing tool does not limit expression`,
    ],
  },
  {
    legacyV1Id: 'L7',
    title: `Text Structure & Purpose`,
    domainKey: 'languageLiteracy',
    summary: `The child understands that different text types are structured differently depending on their purpose, and can both recognise and use these structures.`,
    whatItLooksLike: [
      `Recognises difference between story and information text`,
      `Names and recognises common text types; uses appropriate structure`,
      `Explains how structure supports purpose; chooses and creates appropriate text types`,
    ],
  },
  {
    legacyV1Id: 'L8',
    title: `Persuasion & Argument`,
    domainKey: 'logicRhetoric',
    summary: `The child can construct and evaluate arguments — identifying claims, supporting evidence, and rhetorical strategies in others' texts and their own.`,
    whatItLooksLike: [
      `Expresses preference with simple reason and recognises persuasive attempts`,
      `Gives multiple reasons and identifies persuasive techniques`,
      `Constructs sustained arguments with evidence and evaluates argument strength`,
    ],
  },
  {
    legacyV1Id: 'L9',
    title: `Literary Response & Appreciation`,
    domainKey: 'literaryTradition',
    summary: `The child engages with literature — responding personally, aesthetically, and critically to stories, poems, and other literary forms.`,
    whatItLooksLike: [
      `Shows enjoyment of stories and has favourite books and characters`,
      `Explains why they like a text; identifies characters and literary devices`,
      `Discusses themes, analyses author choices, and evaluates cultural perspectives`,
    ],
  },
  {
    legacyV1Id: 'M1',
    title: `Number Sense & Place Value`,
    domainKey: 'mathematicalThinking',
    summary: `The child has an intuitive understanding of quantity, can compose and decompose numbers, understands the structure of our number system, and can work flexibly with numbers.`,
    whatItLooksLike: [
      `Counts with one-to-one correspondence and recognises numerals`,
      `Counts forwards/backwards; uses skip counting; understands tens and ones`,
      `Composes/decomposes numbers flexibly; understands place value; applies number sense`,
    ],
  },
  {
    legacyV1Id: 'M2',
    title: `Operations & Computation`,
    domainKey: 'mathematicalThinking',
    summary: `The child understands the four operations (addition, subtraction, multiplication, division), their relationships to each other, and can compute fluently using a range of strategies.`,
    whatItLooksLike: [
      `Combines and removes groups; uses concrete materials for operations`,
      `Uses mental strategies; recalls facts; understands multiplication and inverse relationships`,
      `Computes fluently with all operations; applies to multi-step problems`,
    ],
  },
  {
    legacyV1Id: 'M3',
    title: `Fractional Thinking`,
    domainKey: 'mathematicalThinking',
    summary: `The child understands parts and wholes — fractions, decimals, and percentages as different representations of the same idea, and can operate with them in practical contexts.`,
    whatItLooksLike: [
      `Understands "half" as equal parts; identifies halves and quarters`,
      `Names unit fractions; compares and orders; identifies equivalent fractions`,
      `Adds/subtracts fractions; connects fractions, decimals, percentages`,
    ],
  },
  {
    legacyV1Id: 'M4',
    title: `Algebraic Thinking & Patterns`,
    domainKey: 'mathematicalThinking',
    summary: `The child recognises, describes, and extends patterns; understands the concept of equality and uses symbols to represent unknown quantities; thinks about relationships between quantities.`,
    whatItLooksLike: [
      `Copies simple patterns; identifies what comes next`,
      `Creates own patterns; describes growing patterns; understands equals sign`,
      `Generates complex patterns; uses symbols for unknowns; understands functional relationships`,
    ],
  },
  {
    legacyV1Id: 'M5',
    title: `Measurement Sense`,
    domainKey: 'mathematicalThinking',
    summary: `The child understands measurable attributes (length, mass, capacity, time, temperature), can compare and quantify them using informal and formal units, and applies measurement in practical contexts.`,
    whatItLooksLike: [
      `Compares objects; uses informal measurement language`,
      `Measures using informal units; understands need for standard units`,
      `Measures accurately using metric units; converts between units; calculates area/volume`,
    ],
  },
  {
    legacyV1Id: 'M6',
    title: `Spatial Reasoning & Geometry`,
    domainKey: 'mathematicalThinking',
    summary: `The child understands shape, position, movement, and transformation — they can visualise, describe, and manipulate objects in space.`,
    whatItLooksLike: [
      `Names basic 2D shapes; describes position; sorts shapes by attributes`,
      `Identifies and describes shape properties; recognises shapes in different orientations`,
      `Classifies shapes using properties; uses coordinate systems; visualises transformations`,
    ],
  },
  {
    legacyV1Id: 'M7',
    title: `Data & Statistical Thinking`,
    domainKey: 'mathematicalThinking',
    summary: `The child can pose questions, collect and organise data, represent it in appropriate forms, and draw conclusions — understanding that data tells a story.`,
    whatItLooksLike: [
      `Sorts into categories; answers simple data questions`,
      `Poses questions; collects and displays data; reads and interprets`,
      `Selects appropriate display; uses statistics; identifies trends and draws conclusions`,
    ],
  },
  {
    legacyV1Id: 'M8',
    title: `Probability & Chance`,
    domainKey: 'mathematicalThinking',
    summary: `The child understands that some events are certain, some are impossible, and most fall somewhere in between — and can reason about likelihood using both intuition and mathematical tools.`,
    whatItLooksLike: [
      `Uses language of chance; identifies certain/possible/impossible`,
      `Lists possible outcomes; describes likelihood on scale; conducts experiments`,
      `Assigns numerical probabilities; compares theoretical and experimental`,
    ],
  },
  {
    legacyV1Id: 'M9',
    title: `Mathematical Modelling & Problem Solving`,
    domainKey: 'mathematicalThinking',
    summary: `The child can take a real-world situation, represent it mathematically, work through it, and interpret the result back in context — the full cycle of applied mathematics.`,
    whatItLooksLike: [
      `Recognises when situation involves mathematics; represents with objects/drawings`,
      `Identifies needed information; tries multiple strategies; checks in context`,
      `Formulates and selects appropriate mathematical representations and tools`,
    ],
  },
  {
    legacyV1Id: 'S1',
    title: `Scientific Inquiry`,
    domainKey: 'scientificThinking',
    summary: `The child poses investigable questions, plans and conducts investigations, collects and records data, and draws evidence-based conclusions.`,
    whatItLooksLike: [
      `Asks questions about phenomena; explores using senses; observes changes`,
      `Poses investigable questions; predicts; records observations; compares with predictions`,
      `Plans investigations with identified variables; records systematically; draws evidence-based conclusions`,
    ],
  },
  {
    legacyV1Id: 'S2',
    title: `Living Systems`,
    domainKey: 'scientificThinking',
    summary: `The child understands living things — their characteristics, needs, life cycles, adaptations, and relationships within ecosystems.`,
    whatItLooksLike: [
      `Identifies living vs non-living; names basic needs; observes features`,
      `Describes life cycles; groups organisms; identifies survival features; explains food chains`,
      `Explains adaptations; describes ecosystem interdependence; evaluates human impact`,
    ],
  },
  {
    legacyV1Id: 'S3',
    title: `Earth & Environmental Systems`,
    domainKey: 'scientificThinking',
    summary: `The child understands Earth's systems — weather, water cycle, geology, space — and the relationships between human activity and the natural environment.`,
    whatItLooksLike: [
      `Observes and describes weather and seasonal changes; identifies natural features`,
      `Describes water cycle; identifies rocks/soil; understands patterns and Earth's rotation`,
      `Explains geological processes; understands Earth/Moon/Sun relationships; analyses human impact`,
    ],
  },
  {
    legacyV1Id: 'S4',
    title: `Physical & Chemical Sciences`,
    domainKey: 'scientificThinking',
    summary: `The child understands forces, energy, materials, and their properties — how things move, why they change, and what they're made of.`,
    whatItLooksLike: [
      `Explores materials; notices effects of push/pull; observes heating/cooling changes`,
      `Describes material properties and uses; understands forces; investigates light/sound/heat`,
      `Explains force interactions; classifies changes; describes energy transfer; applies to design`,
    ],
  },
  {
    legacyV1Id: 'S5',
    title: `Scientific Observation`,
    domainKey: 'scientificThinking',
    summary: `The child observes carefully and systematically — slowing down, noticing details, recording what they see, and distinguishing observation from interpretation.`,
    whatItLooksLike: [
      `Slows down to look; points out details; returns to look; asks about details`,
      `Slows down without prompting; notices changes; compares; uses observation tools`,
      `Records observations systematically; distinguishes observation from interpretation; notices patterns`,
    ],
  },
  {
    legacyV1Id: 'S6',
    title: `Science as Human Endeavour`,
    domainKey: 'scientificThinking',
    summary: `The child understands that science is a human activity — shaped by culture, curiosity, and collaboration — and that scientific knowledge changes over time as new evidence emerges.`,
    whatItLooksLike: [
      `Shows curiosity about how things work; recognises science use; identifies scientists`,
      `Describes how science changed daily life; recognises First Nations knowledge; understands collaboration`,
      `Explains how understanding changed over time; discusses ethics; evaluates claims using evidence`,
    ],
  },
  {
    legacyV1Id: 'H1',
    title: `Historical Thinking & Chronology`,
    domainKey: 'historicalCivicGeographic',
    summary: `The child understands time, change, and continuity — they can sequence events, understand cause and effect in human history, and appreciate how the past shapes the present.`,
    whatItLooksLike: [
      `Sequences personal events; identifies old vs new; shows interest in family stories`,
      `Places events on timeline; describes how daily life changed; identifies significant events/people`,
      `Uses historical language; analyses cause and effect; considers multiple perspectives`,
    ],
  },
  {
    legacyV1Id: 'H2',
    title: `Source Analysis & Evidence`,
    domainKey: 'historicalCivicGeographic',
    summary: `The child can evaluate sources of information — distinguishing primary from secondary, identifying bias, and understanding that accounts of the same event can differ.`,
    whatItLooksLike: [
      `Identifies where information comes from; recognises sources can tell us about the past`,
      `Distinguishes primary and secondary sources; identifies author perspective; compares accounts`,
      `Evaluates reliability and usefulness; identifies bias and perspective; cross-references sources`,
    ],
  },
  {
    legacyV1Id: 'H3',
    title: `Geography & Environmental Awareness`,
    domainKey: 'historicalCivicGeographic',
    summary: `The child understands places, spaces, and environments — from local to global — and the relationships between people and their environments.`,
    whatItLooksLike: [
      `Describes local environment; identifies home/school on map; names natural features`,
      `Creates and interprets maps; describes how people use/change environments; compares places`,
      `Analyses human/environmental relationships; uses geographical tools; evaluates sustainability`,
    ],
  },
  {
    legacyV1Id: 'H4',
    title: `Civic & Economic Understanding`,
    domainKey: 'historicalCivicGeographic',
    summary: `The child understands how communities and societies are organised — governance, rules, rights, responsibilities, and economic activity.`,
    whatItLooksLike: [
      `Identifies roles and responsibilities; understands groups need rules; recognises needs vs wants`,
      `Explains why communities have rules; describes goods/services; identifies rights and responsibilities`,
      `Analyses how decisions affect groups; understands government levels; evaluates economic trade-offs`,
    ],
  },
  {
    legacyV1Id: 'H5',
    title: `HASS Inquiry Skills`,
    domainKey: 'historicalCivicGeographic',
    summary: `The child can conduct humanities inquiries — posing questions, locating and analysing information, drawing conclusions, and communicating findings.`,
    whatItLooksLike: [
      `Asks questions about people/places; finds information from provided sources`,
      `Develops own inquiry questions; uses multiple sources; organises and presents findings`,
      `Plans and conducts extended inquiry; evaluates sources; synthesises information; draws conclusions`,
    ],
  },
  {
    legacyV1Id: 'H6',
    title: `First Nations Australian Perspectives`,
    domainKey: 'historicalCivicGeographic',
    summary: `The child demonstrates understanding of and respect for Aboriginal and Torres Strait Islander histories, cultures, and contributions — the world's oldest continuing cultures.`,
    whatItLooksLike: [
      `Recognises Indigenous peoples have lived in Australia long; shows respect for practices`,
      `Describes Indigenous connection to Country; identifies Indigenous knowledge; uses appropriate language`,
      `Explains significance of Country; analyses colonisation impact; evaluates representation`,
    ],
  },
  {
    legacyV1Id: 'P1',
    title: `Gross Motor & Physical Coordination`,
    domainKey: 'physicalEmbodied',
    summary: `The child moves their whole body with increasing control, coordination, and confidence — running, jumping, climbing, balancing, throwing, catching.`,
    whatItLooksLike: [
      `Walks, runs, jumps with basic control; catches large ball from close range`,
      `Demonstrates coordinated running/jumping/hopping; throws accurately; catches small ball`,
      `Moves with fluency and efficiency; combines skills in games and sports; shows stamina`,
    ],
  },
  {
    legacyV1Id: 'P2',
    title: `Fine Motor & Manipulation`,
    domainKey: 'physicalEmbodied',
    summary: `The child uses their hands and fingers with increasing precision and control — manipulating tools, materials, and objects for purposeful tasks.`,
    whatItLooksLike: [
      `Holds and uses tools with functional grip; threads beads; uses scissors to snip`,
      `Cuts along lines with scissors; draws recognisable shapes; ties knots; uses construction materials`,
      `Completes intricate tasks; uses tools confidently; fine motor does not limit participation`,
    ],
  },
  {
    legacyV1Id: 'P3',
    title: `Health & Body Awareness`,
    domainKey: 'physicalEmbodied',
    summary: `The child understands their body — nutrition, hygiene, growth, and the factors that contribute to physical and mental wellbeing.`,
    whatItLooksLike: [
      `Identifies body parts and functions; understands simple hygiene; recognises food gives energy`,
      `Describes health factors; makes healthy choices; understands body changes and safety`,
      `Analyses lifestyle and health outcomes; evaluates health information; understands physical/mental connection`,
    ],
  },
  {
    legacyV1Id: 'P4',
    title: `Sport & Cooperative Games`,
    domainKey: 'physicalEmbodied',
    summary: `The child participates in structured physical activities, understands rules and fair play, and works cooperatively in team-based movement contexts.`,
    whatItLooksLike: [
      `Participates willingly; follows basic game rules with reminding; takes turns`,
      `Understands and follows rules independently; co-constructs fair play; works cooperatively`,
      `Develops and applies tactics; supports others; modifies games; shows leadership`,
    ],
  },
  {
    legacyV1Id: 'P5',
    title: `Risk Assessment & Physical Safety`,
    domainKey: 'physicalEmbodied',
    summary: `The child identifies potential hazards, assesses risk relative to their own capability, and makes safe choices — developing independence through managed risk rather than avoidance.`,
    whatItLooksLike: [
      `Responds to safety instructions; identifies dangerous situations and basic safety rules`,
      `Assesses risk before physical challenges; identifies hazards; makes safe choices independently`,
      `Independently assesses and manages risks; adapts for different environments; shows emergency awareness`,
    ],
  },
  {
    legacyV1Id: 'PS1',
    title: `Empathy & Perspective-Taking`,
    domainKey: 'socialRelational',
    summary: `The child recognises, understands, and responds to the emotions and perspectives of others — seeing the world through different eyes.`,
    whatItLooksLike: [
      `Recognises basic emotions in others; shows concern when upset; responds to perspective prompts`,
      `Identifies emotions from contextual cues; considers perspectives without prompting; shows compassion`,
      `Takes perspective of people different from self; navigates disagreements; advocates for fairness`,
    ],
  },
  {
    legacyV1Id: 'PS2',
    title: `Social Skills & Cooperation`,
    domainKey: 'socialRelational',
    summary: `The child interacts positively with others — sharing, negotiating, collaborating, resolving conflicts, and building friendships.`,
    whatItLooksLike: [
      `Plays alongside others; shares when reminded; responds to social cues; seeks company`,
      `Initiates interaction; negotiates with peers; uses words to resolve conflicts; works cooperatively`,
      `Resolves conflicts independently; adapts behaviour for contexts; supports others; demonstrates leadership`,
    ],
  },
  {
    legacyV1Id: 'PS3',
    title: `Self-Regulation & Wellbeing`,
    domainKey: 'personalEthical',
    summary: `The child manages their emotions, behaviour, and energy — coping with frustration, transitioning between activities, and maintaining a positive sense of self.`,
    whatItLooksLike: [
      `Names emotion with support; accepts comfort when distressed; transitions with support`,
      `Uses strategies to manage emotions; transitions with minimal support; persists through frustration`,
      `Self-monitors and applies strategies independently; recovers from setbacks; maintains realistic self-view`,
    ],
  },
  {
    legacyV1Id: 'PS4',
    title: `Identity & Belonging`,
    domainKey: 'personalEthical',
    summary: `The child has a developing sense of who they are — their family, culture, values, strengths, and place in their community and the world.`,
    whatItLooksLike: [
      `Identifies self as part of family/community; names interests; shows awareness of traditions`,
      `Describes cultural background and family stories; respects others' differences; identifies strengths`,
      `Articulates personal values; respects diversity; shows confidence in identity; connects to community`,
    ],
  },
  {
    legacyV1Id: 'PS5',
    title: `Environmental Stewardship`,
    domainKey: 'personalEthical',
    summary: `The child demonstrates care and responsibility for the natural world — understanding their impact and taking action to protect environments.`,
    whatItLooksLike: [
      `Shows care for living things; participates in activities with guidance; notices damage`,
      `Explains why environment matters; identifies human impacts; takes responsibility; connects choices to outcomes`,
      `Analyses environmental issues and evaluates actions; initiates projects; considers perspectives; applies sustainability`,
    ],
  },
  {
    legacyV1Id: 'PS6',
    title: `Ethical Reasoning`,
    domainKey: 'personalEthical',
    summary: `The child thinks about right and wrong, fairness and justice — considering ethical dimensions of situations and making reasoned moral judgments.`,
    whatItLooksLike: [
      `Identifies fair/unfair; recognises hurt; follows rules; responds honestly`,
      `Considers action impact before acting; explains rules and suggests modifications; recognises dilemmas`,
      `Analyses ethical dilemmas from multiple perspectives; defends moral positions; identifies ethical dimensions`,
    ],
  },
  {
    legacyV1Id: 'PS7',
    title: `Digital Citizenship`,
    domainKey: 'technologicalFluency',
    summary: `The child navigates digital environments responsibly — understanding online safety, digital identity, information literacy, and respectful online interaction.`,
    whatItLooksLike: [
      `Uses digital devices for simple purposes with supervision; understands basic online safety`,
      `Follows family rules independently; understands online consequences; identifies suspicious content`,
      `Evaluates online information for credibility; manages digital identity; behaves ethically online`,
    ],
  },
  {
    legacyV1Id: 'C1',
    title: `Narrative & Storytelling`,
    domainKey: 'literaryTradition',
    summary: `The child creates and shares stories — across media (oral, written, visual, dramatic) — with increasing sophistication in plot, character, setting, and theme.`,
    whatItLooksLike: [
      `Tells simple stories with beginning and end; uses imaginative play`,
      `Creates stories with clear structure; develops characters; includes problems and resolutions`,
      `Creates complex narratives with subplots and themes; develops multi-dimensional characters`,
    ],
  },
  {
    legacyV1Id: 'C2',
    title: `Musical Expression`,
    domainKey: 'musicalPerformative',
    summary: `The child engages with music — listening, creating, performing — with growing understanding of musical elements and their expressive potential.`,
    whatItLooksLike: [
      `Responds physically to music; sings familiar songs; identifies instruments`,
      `Keeps steady beat; creates rhythmic/melodic patterns; identifies musical elements`,
      `Creates original compositions; uses notation; analyses with vocabulary; performs with skill`,
    ],
  },
  {
    legacyV1Id: 'C3',
    title: `Poetic & Rhythmic Expression`,
    domainKey: 'musicalPerformative',
    summary: `The child plays with language — rhythm, rhyme, imagery, and the sounds and shapes of words — for aesthetic and expressive purposes.`,
    whatItLooksLike: [
      `Enjoys rhyming words and wordplay; repeats rhythmic phrases; notices interesting sounds`,
      `Creates simple rhymes; experiments with literary devices; reads poetry with attention`,
      `Writes original poetry with intentional literary devices; analyses published poems`,
    ],
  },
  {
    legacyV1Id: 'C4',
    title: `Dramatic Expression`,
    domainKey: 'musicalPerformative',
    summary: `The child engages in dramatic play, role play, and performance — using voice, body, and imagination to explore ideas, stories, and emotions.`,
    whatItLooksLike: [
      `Engages in imaginative play; takes on roles; uses props and costumes`,
      `Maintains character for extended period; uses voice for expression; collaborates on scenarios`,
      `Creates and performs original dramatic works; uses techniques deliberately; analyses performances`,
    ],
  },
  {
    legacyV1Id: 'C5',
    title: `Visual Expression & Design`,
    domainKey: 'visualPlasticArts',
    summary: `The child creates visual works — drawing, painting, sculpture, digital — with increasing technical skill, aesthetic awareness, and expressive intent.`,
    whatItLooksLike: [
      `Explores materials freely; creates images; expresses colour/shape preferences`,
      `Uses materials and techniques purposefully; creates recognisable works with detail`,
      `Creates visually effective works with deliberate aesthetic choices; uses variety of media`,
    ],
  },
  {
    legacyV1Id: 'C6',
    title: `Design & Construction`,
    domainKey: 'practicalMastery',
    summary: `The child designs and builds things — using iterative processes of planning, making, testing, and improving to solve problems and create functional or aesthetic objects.`,
    whatItLooksLike: [
      `Builds with materials with purpose; talks about plans; identifies problems to solve`,
      `Draws plans or designs before building; selects materials; tests and modifies`,
      `Plans with clear specifications; uses full design cycle; considers user needs; documents process`,
    ],
  },
  {
    legacyV1Id: 'C7',
    title: `Digital Creation`,
    domainKey: 'technologicalFluency',
    summary: `The child uses digital tools creatively — from basic digital media creation to computational thinking, coding, and algorithmic problem-solving.`,
    whatItLooksLike: [
      `Uses digital tools for simple creative tasks; understands devices follow instructions`,
      `Creates digital content; writes simple algorithms; uses visual programming tools`,
      `Creates complex digital projects; applies computational thinking; designs and tests algorithms`,
    ],
  },
  {
    legacyV1Id: 'EF1',
    title: `Sustained Attention & Focus`,
    domainKey: 'personalEthical',
    summary: `The child can maintain focused attention on a task or activity — both during structured learning and self-directed exploration — with increasing duration and resistance to distraction.`,
    whatItLooksLike: [
      `Engages for few minutes before seeking something new; returns to activity with prompting`,
      `Sustains attention for 15-20+ minutes; returns without prompting; ignores minor distractions`,
      `Sustains deep focus for extended periods; manages attention strategically; demonstrates flow`,
    ],
  },
  {
    legacyV1Id: 'EF2',
    title: `Working Memory`,
    domainKey: 'personalEthical',
    summary: `The child can hold and manipulate information in their mind — following multi-step instructions, solving problems mentally, and connecting ideas across time.`,
    whatItLooksLike: [
      `Follows one-step instructions; remembers where left objects; recalls simple messages`,
      `Follows 2-3 step instructions; holds question in mind while searching for answer`,
      `Follows complex multi-step procedures; solves problems with multiple variables`,
    ],
  },
  {
    legacyV1Id: 'EF3',
    title: `Memory & Recall`,
    domainKey: 'personalEthical',
    summary: `The child stores and retrieves information over time — remembering facts, events, procedures, and concepts and accessing them when needed.`,
    whatItLooksLike: [
      `Recalls recent events when prompted; remembers names; recognises previously encountered information`,
      `Recalls key facts from recent learning; uses prior knowledge; remembers procedures`,
      `Draws on broad knowledge base; retrieves quickly and accurately; makes connections`,
    ],
  },
  {
    legacyV1Id: 'EF4',
    title: `Planning & Organisation`,
    domainKey: 'personalEthical',
    summary: `The child approaches tasks and projects systematically — setting goals, making plans, organising materials, managing time, and adjusting course when needed.`,
    whatItLooksLike: [
      `Gathers materials before starting when reminded; follows provided sequence`,
      `Breaks task into steps with minimal guidance; gathers materials independently; creates simple plans`,
      `Plans multi-day/week projects independently; prioritises; creates organisational systems`,
    ],
  },
  {
    legacyV1Id: 'EF5',
    title: `Critical Thinking`,
    domainKey: 'personalEthical',
    summary: `The child analyses, evaluates, and synthesises information — questioning assumptions, identifying logic, weighing evidence, and forming reasoned judgments.`,
    whatItLooksLike: [
      `Asks "why" and "how do you know" questions; notices when something doesn't make sense`,
      `Identifies assumptions; evaluates evidence before accepting claims; considers alternative explanations`,
      `Analyses complex issues from multiple perspectives; identifies logical fallacies`,
    ],
  },
  {
    legacyV1Id: 'EF6',
    title: `Collaboration & Teamwork`,
    domainKey: 'socialRelational',
    summary: `The child works effectively with others toward shared goals — contributing ideas, listening, compromising, and sharing responsibility for outcomes.`,
    whatItLooksLike: [
      `Works alongside others on shared activity; accepts role; shares materials willingly`,
      `Contributes ideas and listens; negotiates roles; stays on task; helps others`,
      `Takes initiative and leadership; distributes work equitably; facilitates discussions`,
    ],
  },
  {
    legacyV1Id: 'EF7',
    title: `Metacognition & Reflective Practice`,
    domainKey: 'personalEthical',
    summary: `The child thinks about their own thinking and learning — understanding how they learn best, monitoring their understanding, and adjusting their approach.`,
    whatItLooksLike: [
      `Responds to "What did you learn?" with specific answers; identifies easy/hard activities`,
      `Describes learning strategies used; identifies understanding and confusion; adjusts approach`,
      `Monitors understanding in real-time; selects and applies learning strategies deliberately`,
    ],
  },
  {
    legacyV1Id: 'EF8',
    title: `Creative Thinking & Innovation`,
    domainKey: 'personalEthical',
    summary: `The child generates novel ideas, sees possibilities, takes intellectual risks, and approaches problems with imagination and originality.`,
    whatItLooksLike: [
      `Engages in imaginative play; suggests unusual ideas; shows curiosity and experiments`,
      `Generates multiple ideas when brainstorming; combines existing ideas in new ways`,
      `Produces original and effective creative works; applies creative thinking across domains`,
    ],
  },
];

// ─── Sanity document construction ───────────────────────────────────────
const STAGE_BAND_KEYS = ['foundational', 'intermediate', 'advanced', 'tertiary'] as const;

function toSanityDoc(thread: V1ThreadSeed) {
  return {
    _id: `capabilityThread.${thread.legacyV1Id}`,
    _type: 'capabilityThread',
    title: thread.title,
    shortName: thread.title,
    slug: { _type: 'slug', current: slugify(thread.title) },
    legacyV1Id: thread.legacyV1Id,
    domain: {
      _type: 'reference',
      _ref: `capabilityDomain.${thread.domainKey}`,
    },
    introducedInVersion: '2.0.0',
    canonStatus: 'active',
    summary: thread.summary,
    whatItLooksLike: thread.whatItLooksLike,
    // Four required stage-bands per spec D4. All marked unpopulated in v2.0.0
    // because v1 content is flat (single description, three DLO tiers — not
    // stage-banded). Stage-bands fill in as v2-native authoring proceeds.
    stageBands: STAGE_BAND_KEYS.map((key) => ({
      _key: key,
      _type: 'threadStageBand',
      key,
      isPopulatedInThisVersion: false,
    })),
  };
}

// ─── Run ────────────────────────────────────────────────────────────────
async function run() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('SANITY_API_TOKEN is required. Set it in .env.local or pass inline.');
    process.exit(1);
  }

  console.log(`Seeding ${V1_THREADS.length} v1 capability threads into v2 domain structure...`);

  // Sanity 'transaction' allows batching createOrReplace operations atomically
  // and benefits from server-side ref validation BEFORE commit. If any domain
  // doc is missing, the whole transaction rejects — a useful signal that
  // seed-capability-domains.ts hasn't run.
  const transaction = client.transaction();
  for (const thread of V1_THREADS) {
    transaction.createOrReplace(toSanityDoc(thread));
  }

  try {
    const result = await transaction.commit();
    console.log(`✓ Committed ${result.results.length} thread documents.`);

    // Distribution report
    const byDomain = V1_THREADS.reduce<Record<string, number>>((acc, t) => {
      acc[t.domainKey] = (acc[t.domainKey] ?? 0) + 1;
      return acc;
    }, {});
    console.log('  v2 domain distribution:');
    for (const [k, n] of Object.entries(byDomain).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${k}: ${n}`);
    }

    console.log('\nNext: npx tsx scripts/seed-dlos.ts');
    console.log('(That script seeds 171 DLO documents referencing capabilityThread.{id} ' +
                'as written here. Refs will resolve.)');
  } catch (err: any) {
    console.error('✗ Seed failed:', err.message ?? err);
    if (err.message?.includes('non-existent document')) {
      console.error('\nLikely cause: seed-capability-domains.ts has not run yet.');
      console.error('Run it first, then re-run this script.');
    }
    process.exit(1);
  }
}

run();
