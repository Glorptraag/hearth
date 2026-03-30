/**
 * Hearth Sanity Seed — Starter Pack
 * 13 capability threads · 6 badges · 79 activities · 19 approaches · 3 modules · 1 pack
 *
 * Run: npx tsx scripts/seed-content.ts
 * Idempotent — uses createOrReplace throughout.
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function block(text: string, key = 'b1') {
  return {
    _type: 'block' as const,
    _key: key,
    style: 'normal',
    markDefs: [] as never[],
    children: [{ _type: 'span' as const, _key: 's1', text, marks: [] as never[] }],
  }
}

function blocks(...texts: string[]) {
  return texts.map((t, i) => block(t, `b${i + 1}`))
}

function ref(id: string, key: string) {
  return { _type: 'reference' as const, _ref: id, _key: key }
}

function singleRef(id: string) {
  return { _type: 'reference' as const, _ref: id }
}

function slug(current: string) {
  return { _type: 'slug' as const, current }
}

// ─── Capability Threads ───────────────────────────────────────────────────────

const THREADS = [
  {
    _id: 'capabilityThread.S1',
    _type: 'capabilityThread',
    title: 'Scientific Observation',
    slug: slug('scientific-observation'),
    domain: 'science',
    description:
      'The child observes natural and made phenomena carefully, noticing details, patterns, and changes over time. Uses multiple senses and simple tools to extend observation.',
    dlos: [
      {
        _key: 'd1',
        title: 'Notices and describes observable features with support',
        tier: 'emerging',
        description: 'Needs prompting to look closely or use multiple senses. Describes what they see in simple terms.',
      },
      {
        _key: 'd2',
        title: 'Independently notices details and compares observations over time',
        tier: 'developing',
        description: 'Returns to subjects to notice change. Uses multiple senses deliberately. Starting to look for patterns.',
      },
      {
        _key: 'd3',
        title: 'Observes systematically across contexts and records findings independently',
        tier: 'demonstrating',
        description: 'Distinguishes observation from interpretation. Records and communicates findings clearly to others.',
      },
    ],
    status: 'published',
  },
  {
    _id: 'capabilityThread.S2',
    _type: 'capabilityThread',
    title: 'Questioning & Predicting',
    slug: slug('questioning-and-predicting'),
    domain: 'science',
    description:
      'The child forms questions about what they observe and makes predictions based on evidence, developing the habit of wondering before knowing.',
    dlos: [
      {
        _key: 'd1',
        title: 'Asks simple questions and makes basic predictions with prompting',
        tier: 'emerging',
        description: 'Questions are often "what is that?" rather than "why". Predictions are intuitive rather than evidence-based.',
      },
      {
        _key: 'd2',
        title: 'Forms questions that drive exploration and bases predictions on prior observation',
        tier: 'developing',
        description: 'Connects predictions to things noticed before. Checks whether predictions were right.',
      },
      {
        _key: 'd3',
        title: 'Generates specific, testable questions and explains the reasoning behind predictions',
        tier: 'demonstrating',
        description: 'Understands predictions can be wrong. Revises questions in response to new evidence.',
      },
    ],
    status: 'published',
  },
  {
    _id: 'capabilityThread.L1',
    _type: 'capabilityThread',
    title: 'Oral Communication & Listening',
    slug: slug('oral-communication-and-listening'),
    domain: 'english',
    description:
      'The child listens with attention and communicates ideas orally with increasing clarity, detail, and confidence across different contexts and audiences.',
    dlos: [
      {
        _key: 'd1',
        title: 'Listens with some attention and communicates simple ideas orally',
        tier: 'emerging',
        description: 'Communicates needs and basic observations. Language is simple and sometimes incomplete.',
      },
      {
        _key: 'd2',
        title: 'Listens actively and communicates ideas clearly in familiar contexts',
        tier: 'developing',
        description: 'Stays on topic. Describes experiences and observations in sequence. Asks clarifying questions.',
      },
      {
        _key: 'd3',
        title: 'Listens carefully and communicates complex ideas with clarity and confidence',
        tier: 'demonstrating',
        description: 'Adjusts language for audience and purpose. Uses detail and precision. Responds thoughtfully to what others say.',
      },
    ],
    status: 'published',
  },
  {
    _id: 'capabilityThread.L3',
    _type: 'capabilityThread',
    title: 'Reading Comprehension & Response',
    slug: slug('reading-comprehension-and-response'),
    domain: 'english',
    description:
      'The child understands what they read or hear read aloud, recalling key information, making inferences, and responding thoughtfully to texts.',
    dlos: [
      {
        _key: 'd1',
        title: 'Understands basic events in a text and recalls simple details when prompted',
        tier: 'emerging',
        description: 'Can tell you what happened but may miss why. Recalls memorable details, especially sensory or dramatic ones.',
      },
      {
        _key: 'd2',
        title: 'Retells key details and responds to texts through discussion, drawing, or writing',
        tier: 'developing',
        description: "Understands cause and effect in familiar stories. Notices when something doesn't make sense.",
      },
      {
        _key: 'd3',
        title: 'Makes inferences, connections, and personal responses with supporting evidence',
        tier: 'demonstrating',
        description: 'Reads between the lines. Connects texts to personal experience and to other texts. Expresses and defends opinions.',
      },
    ],
    status: 'published',
  },
  {
    _id: 'capabilityThread.L9',
    _type: 'capabilityThread',
    title: 'Literary Response & Appreciation',
    slug: slug('literary-response-and-appreciation'),
    domain: 'english',
    description:
      'The child responds to literature with personal feeling and developing aesthetic judgement — noticing what works, why certain stories stay, and what makes language beautiful or powerful.',
    dlos: [
      {
        _key: 'd1',
        title: 'Shows preferences and begins to notice features of stories',
        tier: 'emerging',
        description: 'Knows what they like without necessarily knowing why. Notices when something is funny, scary, or sad.',
      },
      {
        _key: 'd2',
        title: 'Responds emotionally and notices characters, settings, and narrative structure',
        tier: 'developing',
        description: 'Can say what they enjoyed and identify specific moments. Beginning to notice how a story is shaped.',
      },
      {
        _key: 'd3',
        title: 'Evaluates stories, forms opinions with reasons, and makes connections across texts',
        tier: 'demonstrating',
        description: 'Articulates aesthetic responses with reasons. Compares books, authors, and styles. Recognises recurring themes.',
      },
    ],
    status: 'published',
  },
  {
    _id: 'capabilityThread.C1',
    _type: 'capabilityThread',
    title: 'Visual Expression & Design',
    slug: slug('visual-expression-and-design'),
    domain: 'arts',
    description:
      'The child creates visual work with increasing intentionality, using drawing, making, and design to represent ideas, observations, and imaginative responses.',
    dlos: [
      {
        _key: 'd1',
        title: 'Creates visual representations with beginning intentionality',
        tier: 'emerging',
        description: "Drawing and making are explorative rather than planned. Happy to share work but doesn't always plan in advance.",
      },
      {
        _key: 'd2',
        title: 'Creates with increasing skill and intention and describes their work to others',
        tier: 'developing',
        description: 'Makes deliberate choices about what to include. Can explain what they were trying to do.',
      },
      {
        _key: 'd3',
        title: 'Creates detailed, expressive visual work and reflects on their own practice',
        tier: 'demonstrating',
        description: 'Works towards a specific aesthetic outcome. Considers composition and detail. Reflects on what worked.',
      },
    ],
    status: 'published',
  },
  {
    _id: 'capabilityThread.C3',
    _type: 'capabilityThread',
    title: 'Imaginative Play & Storytelling',
    slug: slug('imaginative-play-and-storytelling'),
    domain: 'arts',
    description:
      'The child uses imagination to create and sustain narratives — in play, in oral storytelling, and in creative response to literature and experience.',
    dlos: [
      {
        _key: 'd1',
        title: 'Engages in imaginative play and tells simple stories',
        tier: 'emerging',
        description: 'Stories are often improvised in the moment. Characters and events are straightforward. Narrative is present but brief.',
      },
      {
        _key: 'd2',
        title: 'Creates stories with characters, settings, and problems',
        tier: 'developing',
        description: 'Stories have a beginning, middle, and end. Can hold a narrative thread over time and invite others in.',
      },
      {
        _key: 'd3',
        title: 'Develops rich narratives and uses storytelling to explore complex ideas and emotions',
        tier: 'demonstrating',
        description: 'Characters have depth. Stories address real emotional or moral questions. Narrative craft is developing consciously.',
      },
    ],
    status: 'published',
  },
  {
    _id: 'capabilityThread.E1',
    _type: 'capabilityThread',
    title: 'Attention & Focus',
    slug: slug('attention-and-focus'),
    domain: 'hpe',
    description:
      'The child can sustain focused attention on a chosen task — staying with difficulty, managing distraction, and returning to focus after interruption.',
    dlos: [
      {
        _key: 'd1',
        title: 'Can sustain attention for short periods with support',
        tier: 'emerging',
        description: 'Attention may drift after a few minutes. Benefits from a quiet environment and clear materials.',
      },
      {
        _key: 'd2',
        title: 'Sustains attention on chosen tasks and returns to focus after interruption',
        tier: 'developing',
        description: 'Can stay with an engaging task. Manages short distractions. Developing awareness of when attention slips.',
      },
      {
        _key: 'd3',
        title: 'Sustains deep focus on complex tasks and manages attention independently',
        tier: 'demonstrating',
        description: 'Focuses for extended periods on self-chosen or assigned tasks. Knows what helps them focus.',
      },
    ],
    status: 'published',
  },
  {
    _id: 'capabilityThread.E3',
    _type: 'capabilityThread',
    title: 'Planning & Organisation',
    slug: slug('planning-and-organisation'),
    domain: 'hpe',
    description:
      'The child plans and organises tasks with increasing independence — thinking ahead, managing materials, sequencing steps, and adjusting plans when needed.',
    dlos: [
      {
        _key: 'd1',
        title: 'Begins to plan simple tasks with support and understands sequence',
        tier: 'emerging',
        description: 'Can describe what comes next. Needs help thinking more than one step ahead or gathering materials.',
      },
      {
        _key: 'd2',
        title: 'Plans and organises familiar tasks independently and checks progress against goals',
        tier: 'developing',
        description: 'Can sequence a multi-step task. Gathers what is needed before starting. Checks back on the plan.',
      },
      {
        _key: 'd3',
        title: 'Plans complex tasks, anticipates challenges, and adjusts plans when needed',
        tier: 'demonstrating',
        description: 'Thinks through contingencies before starting. Adjusts mid-plan without frustration. Reflects on the planning process.',
      },
    ],
    status: 'published',
  },
  {
    _id: 'capabilityThread.M1',
    _type: 'capabilityThread',
    title: 'Number Sense & Place Value',
    slug: slug('number-sense-and-place-value'),
    domain: 'mathematics',
    description:
      'The child builds an intuitive understanding of number — counting, comparing, composing, and decomposing quantities, and understanding how our number system works.',
    dlos: [
      {
        _key: 'd1',
        title: 'Counts with one-to-one correspondence and recognises small quantities',
        tier: 'emerging',
        description: 'Counts reliably to at least 10. Beginning to recognise small groups without counting.',
      },
      {
        _key: 'd2',
        title: 'Counts in sequence, recognises numerals, and knows some number facts',
        tier: 'developing',
        description: 'Counts forward and backward. Knows number bonds to 5. Beginning to understand tens and ones.',
      },
      {
        _key: 'd3',
        title: 'Works flexibly with numbers and uses facts fluently',
        tier: 'demonstrating',
        description: 'Adds and subtracts mentally using known facts. Understands place value. Estimates with reasonable accuracy.',
      },
    ],
    status: 'published',
  },
  {
    _id: 'capabilityThread.M3',
    _type: 'capabilityThread',
    title: 'Measurement & Comparison',
    slug: slug('measurement-and-comparison'),
    domain: 'mathematics',
    description:
      'The child measures and compares attributes of objects — length, mass, capacity, and time — using both informal and standard units, and developing estimation skills.',
    dlos: [
      {
        _key: 'd1',
        title: 'Compares objects directly and uses non-standard units with support',
        tier: 'emerging',
        description: 'Can tell which is longer or heavier by direct comparison. Beginning to use informal units (hands, steps) with guidance.',
      },
      {
        _key: 'd2',
        title: 'Measures using informal and standard units and compares measurements',
        tier: 'developing',
        description: 'Chooses appropriate informal units. Beginning to use rulers and scales. Can order three or more measurements.',
      },
      {
        _key: 'd3',
        title: 'Selects appropriate units and tools, estimates before measuring, and reflects on accuracy',
        tier: 'demonstrating',
        description: 'Uses standard units appropriately. Estimates with reasonable accuracy. Understands why standard units matter.',
      },
    ],
    status: 'published',
  },
  {
    _id: 'capabilityThread.H3',
    _type: 'capabilityThread',
    title: 'Community & Belonging',
    slug: slug('community-and-belonging'),
    domain: 'hass',
    description:
      'The child understands how people live together in communities — the roles, relationships, and shared practices that create belonging and social cohesion.',
    dlos: [
      {
        _key: 'd1',
        title: 'Identifies own family and community and recognises differences between families',
        tier: 'emerging',
        description: 'Knows who is in their family and immediate community. Beginning to notice that other families are different.',
      },
      {
        _key: 'd2',
        title: 'Describes how communities are structured and explores roles and responsibilities',
        tier: 'developing',
        description: 'Understands that communities have different roles. Can describe how rules and responsibilities help communities work.',
      },
      {
        _key: 'd3',
        title: 'Analyses how communities meet needs and connects personal experience to broader patterns',
        tier: 'demonstrating',
        description: 'Understands that communities change over time. Makes connections between local and broader social structures.',
      },
    ],
    status: 'published',
  },
  {
    _id: 'capabilityThread.H4',
    _type: 'capabilityThread',
    title: 'Place & Environment',
    slug: slug('place-and-environment'),
    domain: 'hass',
    description:
      'The child develops knowledge of places — their features, the people who inhabit them, and how human activity shapes and is shaped by natural environments.',
    dlos: [
      {
        _key: 'd1',
        title: 'Describes familiar places and notices features of natural and made environments',
        tier: 'emerging',
        description: 'Can describe their home and local area. Notices plants, animals, and human-made features.',
      },
      {
        _key: 'd2',
        title: 'Compares different places and describes how places change over time',
        tier: 'developing',
        description: 'Understands that places are different from one another. Recognises that human activity changes environments.',
      },
      {
        _key: 'd3',
        title: 'Analyses connections between people and environments',
        tier: 'demonstrating',
        description: 'Understands that people depend on their environments. Can discuss environmental change and its effects on communities.',
      },
    ],
    status: 'published',
  },
]

// ─── Badges ───────────────────────────────────────────────────────────────────

const BADGES = [
  {
    _id: 'badge.starter.keen-observer',
    _type: 'badge',
    title: 'Keen Observer',
    slug: slug('keen-observer'),
    emoji: '🔭',
    description:
      'Awarded for sustained, careful observation of the natural world. Your child has watched closely, noticed patterns, and come back to look again.',
    criteriaSummary:
      'Completed at least 3 observation activities from What Lives Outside · Returned to observe the same subject more than once · Described observations in their own words without prompting',
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    observationThreshold: 3,
    status: 'published',
  },
  {
    _id: 'badge.starter.nature-recorder',
    _type: 'badge',
    title: 'Nature Recorder',
    slug: slug('nature-recorder'),
    emoji: '📓',
    description:
      'Awarded for capturing the natural world through drawing, writing, or describing. A record of careful looking over time.',
    criteriaSummary:
      'Recorded observations through drawing, writing, or dictation in at least 3 nature activities · Showed specific detail rather than generalising · Can point to something they noticed and captured',
    capabilityThreads: [
      ref('capabilityThread.S1', 'ct1'),
      ref('capabilityThread.L1', 'ct2'),
      ref('capabilityThread.C1', 'ct3'),
    ],
    observationThreshold: 3,
    status: 'published',
  },
  {
    _id: 'badge.starter.story-listener',
    _type: 'badge',
    title: 'Story Listener',
    slug: slug('story-listener'),
    emoji: '👂',
    description:
      'Awarded for listening to stories with real attention — remembering details, noticing what matters, and responding with genuine feeling.',
    criteriaSummary:
      'Listened attentively to at least 3 stories · Retold key details of a story when asked · Responded with a personal opinion or emotional reaction',
    capabilityThreads: [
      ref('capabilityThread.L1', 'ct1'),
      ref('capabilityThread.L3', 'ct2'),
      ref('capabilityThread.L9', 'ct3'),
    ],
    observationThreshold: 3,
    status: 'published',
  },
  {
    _id: 'badge.starter.story-maker',
    _type: 'badge',
    title: 'Story Maker',
    slug: slug('story-maker'),
    emoji: '✍️',
    description:
      "Awarded for creating stories — through telling, making, drawing, or acting. Not just receiving stories, but making them.",
    criteriaSummary:
      'Created an original story or story extension in at least 2 activities · Shared a story with someone else · Story included a character, a setting, or a problem',
    capabilityThreads: [ref('capabilityThread.C3', 'ct1'), ref('capabilityThread.L1', 'ct2')],
    observationThreshold: 2,
    status: 'published',
  },
  {
    _id: 'badge.starter.number-explorer',
    _type: 'badge',
    title: 'Number Explorer',
    slug: slug('number-explorer'),
    emoji: '🔢',
    description:
      'Awarded for finding numbers in the real world — in the kitchen, in building, in measuring. Maths is everywhere once you start looking.',
    criteriaSummary:
      'Applied number or measurement thinking in at least 3 real-world activities · Used counting, comparing, or measuring in context · Could explain their mathematical thinking to someone else',
    capabilityThreads: [ref('capabilityThread.M1', 'ct1'), ref('capabilityThread.M3', 'ct2')],
    observationThreshold: 3,
    status: 'published',
  },
  {
    _id: 'badge.starter.fact-builder',
    _type: 'badge',
    title: 'Fact Builder',
    slug: slug('fact-builder'),
    emoji: '🧮',
    description:
      'Awarded for building number fact fluency through deliberate practice. Not just understanding numbers in theory, but knowing them fast and reliably.',
    criteriaSummary:
      'Completed at least 2 Number Fluency activities · Demonstrated knowledge of number bonds to 5 or 10 · Can recall at least 5 addition facts without counting on fingers',
    capabilityThreads: [ref('capabilityThread.M1', 'ct1')],
    observationThreshold: 2,
    status: 'published',
  },
]

// ─── Activities: What Lives Outside ──────────────────────────────────────────

// Kit A: Creature Watch (5)
const WLO_CW = [
  {
    _id: 'activity.starter.wlo-cw-find-and-watch',
    _type: 'activity',
    title: 'Find a Creature and Watch',
    slug: slug('find-a-creature-and-watch'),
    approach: singleRef('approach.starter.wlo-creature-watch'),
    instructions: blocks(
      'Find a creature — any creature. An ant, a bird, a spider, a lizard. Watch it for 2 minutes without touching it.',
      'What is it doing? What happens when you move closer? What does it do with its legs, its wings, its antennae?',
    ),
    facilitatorGuidance: {
      before: 'Let the child choose the creature. Resist steering toward "interesting" ones — the practice is in the watching, not the subject.',
      during: 'Stay quiet during the observation. If the child narrates, let them. After 2 minutes, ask open questions: "What did you notice?" "What was it doing with its legs?"',
      challenges: 'Short attention is normal. Start with 1 minute if needed. The goal is sustained attention, not a specific duration.',
    },
    duration: { min: 15, max: 30 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'How long did the child sustain attention on the creature without prompting?',
      'Did they describe what they saw in their own words?',
      'Did they show curiosity about why the creature was behaving that way?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.L1', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-cw-return-visit',
    _type: 'activity',
    title: 'Return Visit',
    slug: slug('return-visit'),
    approach: singleRef('approach.starter.wlo-creature-watch'),
    instructions: blocks(
      'Go back to the same spot where you found the creature yesterday or earlier. Is it still there?',
      'What is the same? What is different? If the creature is gone, look for signs it was there — tracks, webs, shells, markings.',
    ),
    facilitatorGuidance: {
      before: "Help the child remember exactly where they were yesterday. If they kept a drawing or notes, bring those along for comparison.",
      during: 'Give the child time to look before offering any observations yourself. If the creature is gone, that\'s interesting too — "where do you think it went?"',
      challenges: "The creature won't always be there. Frame absence as a discovery: something changed. What might explain it?",
    },
    duration: { min: 15, max: 30 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child remember specific details from the previous visit to compare against?',
      'How did they respond when things had changed or the creature was absent?',
      'Did they generate ideas about why things were different?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-cw-different-creature',
    _type: 'activity',
    title: 'Watch a Different Creature',
    slug: slug('watch-a-different-creature'),
    approach: singleRef('approach.starter.wlo-creature-watch'),
    instructions: blocks(
      'Find a creature that is different from the one you watched before — a different type, a different size, a different way of moving.',
      'Watch it for 2 minutes. How does it move differently? Eat differently? Respond to you differently?',
    ),
    facilitatorGuidance: {
      before: 'If the child has been watching ants, suggest looking for something that flies or swims. The contrast deepens the observation.',
      during: 'Encourage comparison as you go: "Remember how the ant moved? How is this one different?" Let the child lead the comparison.',
      challenges: 'Some children fixate on one creature type. That\'s fine — encourage them to notice differences within the same type.',
    },
    duration: { min: 15, max: 30 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child spontaneously compare this creature to the previous one?',
      'Could they describe specific differences in movement, feeding, or behaviour?',
      'Did they ask questions about why the differences exist?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-cw-draw-describe',
    _type: 'activity',
    title: 'Draw or Describe Two Creatures',
    slug: slug('draw-or-describe-two-creatures'),
    approach: singleRef('approach.starter.wlo-creature-watch'),
    instructions: blocks(
      'Draw or describe two creatures you have watched. Try to include details that someone who wasn\'t there would need to know.',
      'What would you tell someone about each one? What made them different from each other?',
    ),
    facilitatorGuidance: {
      before: 'Have paper and pencils available, but leave the choice of drawing vs. describing entirely to the child. Either is valid.',
      during: 'If they draw, ask them to tell you about the drawing as they go. If they describe, you can scribe for younger children. Prompt for specific detail: "What colour were its legs?"',
      challenges: 'Children often want to draw ideals rather than observations. Gently redirect: "What did this particular one look like — not all ants, just the one you watched?"',
    },
    duration: { min: 10, max: 20 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'visual',
    observationPrompts: [
      'Did the drawing or description include specific observed details rather than generic features?',
      'Could the child identify at least two differences between the two creatures?',
      'Did they communicate something that surprised or interested them about what they watched?',
    ],
    capabilityThreads: [
      ref('capabilityThread.S1', 'ct1'),
      ref('capabilityThread.L1', 'ct2'),
      ref('capabilityThread.C1', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-cw-surprising-behaviour',
    _type: 'activity',
    title: 'Find a Creature Doing Something Surprising',
    slug: slug('find-a-creature-doing-something-surprising'),
    approach: singleRef('approach.starter.wlo-creature-watch'),
    instructions: blocks(
      'Go outside and watch until you find a creature doing something that surprises you or that you don\'t understand.',
      'Why do you think it did that? What might it do next? Watch and see if your prediction is right.',
    ),
    facilitatorGuidance: {
      before: 'This activity works best when the child has already done some creature watching and has a sense of what "normal" looks like for familiar creatures.',
      during: 'Resist explaining the behaviour. Let the child sit with the question first — "why do you think it\'s doing that?" Predictions don\'t need to be right.',
      challenges: 'Children may struggle to identify what is "surprising." Help them notice: "Does it always do that? Have you seen another one do that?"',
    },
    duration: { min: 15, max: 25 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'What behaviour did the child identify as surprising, and why?',
      'Did they make a prediction about what the creature would do next?',
      'Did they sustain observation long enough to test their prediction?',
    ],
    capabilityThreads: [
      ref('capabilityThread.S1', 'ct1'),
      ref('capabilityThread.S2', 'ct2'),
      ref('capabilityThread.E1', 'ct3'),
    ],
    status: 'published',
  },
]

// Kit B: Plant Life (4)
const WLO_PL = [
  {
    _id: 'activity.starter.wlo-pl-three-plants',
    _type: 'activity',
    title: 'Find Three Different Plants',
    slug: slug('find-three-different-plants'),
    approach: singleRef('approach.starter.wlo-plant-life'),
    instructions: blocks(
      'Find three different plants near your home. They could be in the garden, in a crack in the footpath, or growing wild.',
      'How are they different? Look at the leaves, the height, the colour, where they grow. What do they all have in common?',
    ),
    facilitatorGuidance: {
      before: 'No plant identification required. The goal is comparison, not naming. Let the child choose which plants to look at.',
      during: 'Encourage the child to touch leaves gently, smell flowers, and look at roots if visible. Ask comparison questions: "Which one feels rougher? Which grows in the shadiest spot?"',
      challenges: "Children often want to know plant names. That's lovely to follow up, but keep the focus today on observation and comparison rather than classification.",
    },
    duration: { min: 15, max: 30 },
    setting: 'outdoor',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Could the child describe specific differences between the three plants using sensory detail?',
      'Did they notice anything that surprised them about any of the plants?',
      'Did they make any connections between the plants and where they were growing?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-pl-check-over-time',
    _type: 'activity',
    title: 'Check on a Plant Over Time',
    slug: slug('check-on-a-plant-over-time'),
    approach: singleRef('approach.starter.wlo-plant-life'),
    instructions: blocks(
      'Choose one plant near your home. Check on it every few days for two weeks.',
      'Each time you visit, notice: has it grown? Has anything changed — a new leaf, a bud, something eaten, something dry?',
    ),
    facilitatorGuidance: {
      before: 'Help the child choose a plant that is likely to show change — a fast-growing weed, a flowering plant, or a vegetable if you have one. Mark or photograph it so they return to the same plant.',
      during: 'Each check-in can be just 5-10 minutes. Encourage the child to record what they see — a quick drawing or a sentence is enough. Build the habit of returning.',
      challenges: 'It can be hard to sustain interest over two weeks. Help the child set a simple reminder and make the visits feel special rather than obligatory.',
    },
    duration: { min: 10, max: 15 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child notice change between visits without being told what to look for?',
      'Could they describe specifically what had changed?',
      'Did they begin to develop expectations about what might happen next?',
    ],
    capabilityThreads: [
      ref('capabilityThread.S1', 'ct1'),
      ref('capabilityThread.S2', 'ct2'),
      ref('capabilityThread.E1', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-pl-same-plant-two-spots',
    _type: 'activity',
    title: 'Same Plant, Two Different Spots',
    slug: slug('same-plant-two-different-spots'),
    approach: singleRef('approach.starter.wlo-plant-life'),
    instructions: blocks(
      'Find the same kind of plant growing in two different spots — one in sun and one in shade, or one in wet soil and one in dry.',
      'What\'s different about them? Same type of plant — but do they look the same? Why might they be different?',
    ),
    facilitatorGuidance: {
      before: 'Dandelions, clover, or grasses often grow in varied conditions and work well for this. You don\'t need to travel far — a sunny vs. shady side of the same path will do.',
      during: 'Let the child notice first. After they\'ve looked, offer the question: "Why do you think this one is different?" Don\'t rush to explain about sunlight and water.',
      challenges: 'Some children want a definitive answer about why. Acknowledge the question and help them think through what the two plants have in common and what is different around them.',
    },
    duration: { min: 15, max: 25 },
    setting: 'outdoor',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child notice specific differences between the two plants?',
      'Did they generate any explanations for why the plants might look different?',
      'Did they consider the environment around each plant as a possible cause?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-pl-record-change',
    _type: 'activity',
    title: 'Make a Record of Change',
    slug: slug('make-a-record-of-change'),
    approach: singleRef('approach.starter.wlo-plant-life'),
    instructions: blocks(
      'Make a record of your plant over time — draw it, describe it, photograph it on different days.',
      'At the end, look at your records together. What changed? Show someone how the plant changed and what you think caused it.',
    ),
    facilitatorGuidance: {
      before: 'This works best as a culminating activity after the child has been checking on a plant for a week or more. Gather their drawings or notes before you begin.',
      during: 'Help the child lay out their records in order. Ask them to narrate: "What does this one show? And then what happened?" Let them do the explaining.',
      challenges: 'If the child has few records, treat that as a learning point: "What would have been helpful to write down?" Not a criticism — a genuine question for next time.',
    },
    duration: { min: 15, max: 25 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'visual',
    observationPrompts: [
      'Could the child narrate the change they observed using their records as evidence?',
      'Did they offer any explanation for why the plant changed?',
      'Did they communicate the change to someone else with clarity?',
    ],
    capabilityThreads: [
      ref('capabilityThread.S1', 'ct1'),
      ref('capabilityThread.L1', 'ct2'),
      ref('capabilityThread.C1', 'ct3'),
    ],
    status: 'published',
  },
]

// Chunk A: Sensory Walks (3)
const WLO_SW = [
  {
    _id: 'activity.starter.wlo-sw-sound-walk',
    _type: 'activity',
    title: 'Sound Walk',
    slug: slug('sound-walk'),
    approach: singleRef('approach.starter.wlo-sensory-walks'),
    instructions: blocks(
      'Go outside and stand still for 1 minute. Eyes open or closed — whichever helps you hear better.',
      'How many different sounds can you hear? Try to separate close sounds from far-away sounds. What\'s the furthest sound you can identify?',
    ),
    facilitatorGuidance: {
      before: 'Find a spot away from traffic if possible — a garden, a park, or even a quiet street. Early morning tends to offer the most varied sounds.',
      during: 'Model the stillness. Stand with them, quiet. After the minute, compare notes: "What did you hear that I didn\'t hear?" Let the child\'s list be longer than yours.',
      challenges: 'Some children find stillness very difficult. Offer the option of lying on the grass, which can help. One minute is genuinely enough.',
    },
    duration: { min: 10, max: 20 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'auditory',
    observationPrompts: [
      'How many distinct sounds did the child identify?',
      'Did they distinguish between close and far sounds?',
      'Did they identify any sounds they couldn\'t explain or that surprised them?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.E1', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-sw-smell-walk',
    _type: 'activity',
    title: 'Smell Walk',
    slug: slug('smell-walk'),
    approach: singleRef('approach.starter.wlo-sensory-walks'),
    instructions: blocks(
      'Walk slowly through a garden, park, or neighbourhood street. What can you smell?',
      'Where is a smell strongest? Does it change as you move? Can you find a smell you can\'t identify?',
    ),
    facilitatorGuidance: {
      before: 'After rain is a wonderful time for this activity. Gardens, herb beds, compost, and even pavement offer rich olfactory material.',
      during: 'Walk slowly. Pause often. Smell things deliberately — leaves, bark, soil, flowers. Let the child lead the route.',
      challenges: 'Smell is often an underused sense in formal learning. Some children are initially dismissive. Ask: "What does this smell remind you of?" to open it up.',
    },
    duration: { min: 10, max: 20 },
    setting: 'outdoor',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child actively seek out smells rather than waiting to notice them?',
      'Could they describe smells using comparison or association ("smells like...") rather than just "good" or "bad"?',
      'Did they find a smell they couldn\'t identify or name?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-sw-texture-walk',
    _type: 'activity',
    title: 'Texture Walk',
    slug: slug('texture-walk'),
    approach: singleRef('approach.starter.wlo-sensory-walks'),
    instructions: blocks(
      'Find 10 different natural surfaces to touch. Bark, leaves, soil, stone, grass, seed pods, moss — anything you can find.',
      'Describe each one: rough or smooth? Thick or thin? Wet or dry? Warm or cool? Which was the most surprising texture?',
    ),
    facilitatorGuidance: {
      before: 'Remind the child to touch gently and not to pick living things unnecessarily. No need for gloves — the point is direct sensory contact.',
      during: 'Describe textures alongside the child. Use precise words: "scratchy", "powdery", "waxy", "spongy". The vocabulary is part of the learning.',
      challenges: 'Some children are texture-sensitive. Offer alternatives — they can describe what something looks like it would feel like, or touch through a piece of cloth.',
    },
    duration: { min: 10, max: 20 },
    setting: 'outdoor',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child use specific descriptive language rather than just "soft" or "hard"?',
      'Did they seek out unusual or unexpected surfaces?',
      'Did they make comparisons between surfaces?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.L1', 'ct2')],
    status: 'published',
  },
]

// Chunk B: Weather Watching (2)
const WLO_WW = [
  {
    _id: 'activity.starter.wlo-ww-sky-today',
    _type: 'activity',
    title: 'Sky Today',
    slug: slug('sky-today'),
    approach: singleRef('approach.starter.wlo-weather-watching'),
    instructions: blocks(
      'Look at today\'s sky. Describe the clouds — their shape, colour, how high they are. Describe the light and the wind.',
      'Make a prediction: will the sky look the same this afternoon? Why do you think so?',
    ),
    facilitatorGuidance: {
      before: 'Morning is a good time — the sky often changes significantly by afternoon. Take a photo of the sky at the start so you can compare later.',
      during: 'Ask for precise description: "Not just cloudy — what kind of clouds? What shape? How many?" Predictions don\'t need to be correct, but they do need reasons.',
      challenges: 'Weather vocabulary can feel unfamiliar. Spend a moment on cloud types if the child is interested — but the key skill here is description and prediction, not naming.',
    },
    duration: { min: 10, max: 15 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child use specific descriptive language about the sky rather than just "cloudy" or "sunny"?',
      'Did they make a prediction with a reason behind it?',
      'Did they check back later and notice whether the sky had changed as they predicted?',
    ],
    capabilityThreads: [
      ref('capabilityThread.S1', 'ct1'),
      ref('capabilityThread.S2', 'ct2'),
      ref('capabilityThread.L1', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-ww-three-checks',
    _type: 'activity',
    title: 'Three Sky Checks',
    slug: slug('three-sky-checks'),
    approach: singleRef('approach.starter.wlo-weather-watching'),
    instructions: blocks(
      'Choose a spot and check it three times today — morning, midday, and afternoon or evening.',
      'Each time, describe what you see: clouds, light, shadow, temperature, wind. What changed? What stayed the same?',
    ),
    facilitatorGuidance: {
      before: 'Set a simple reminder or make it part of an existing routine — first thing after breakfast, before lunch, after afternoon tea. Three minutes each time is enough.',
      during: 'Keep a simple log — even just three sentences or three drawings. The physical record of three observations makes the comparison concrete.',
      challenges: 'Keeping up with three checks in one day requires commitment. If the child misses one, that\'s fine — even two comparisons is valuable.',
    },
    duration: { min: 5, max: 5 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child return to the same spot independently for all three checks?',
      'Did they notice specific changes between observations?',
      'Did they begin to develop any expectations about how the sky tends to change through the day?',
    ],
    capabilityThreads: [
      ref('capabilityThread.S1', 'ct1'),
      ref('capabilityThread.S2', 'ct2'),
      ref('capabilityThread.E1', 'ct3'),
    ],
    status: 'published',
  },
]

// Chunk C: Tiny Worlds (3)
const WLO_TW = [
  {
    _id: 'activity.starter.wlo-tw-under-a-rock',
    _type: 'activity',
    title: 'Under a Rock',
    slug: slug('under-a-rock'),
    approach: singleRef('approach.starter.wlo-tiny-worlds'),
    instructions: blocks(
      'Find a rock or log that has been sitting in place for a while. Carefully lift it.',
      'What lives there? How many different kinds of creatures? What does the ground look like underneath? Replace the rock gently when you\'re done.',
    ),
    facilitatorGuidance: {
      before: 'Choose a rock in a garden, bush, or park that has not been recently disturbed. Remind the child to replace it carefully — it\'s a home.',
      during: 'Give the child time to observe before replacing the rock. Count together: "How many different kinds of things can we see?" Note behaviour — what do the creatures do when exposed to light?',
      challenges: 'Some children are hesitant around insects or worms. That\'s fine — observe from a comfortable distance. Never force close contact.',
    },
    duration: { min: 10, max: 20 },
    setting: 'outdoor',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'How many different types of creature or organism did the child identify?',
      'Did they notice how the creatures responded to being exposed?',
      'Did they treat the habitat with care — replacing the rock gently?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-tw-square-metre',
    _type: 'activity',
    title: 'One Square Metre',
    slug: slug('one-square-metre'),
    approach: singleRef('approach.starter.wlo-tiny-worlds'),
    instructions: blocks(
      'Mark out one square metre of ground — use sticks, string, or just estimate. Look at it closely for 10 minutes.',
      'Use a magnifying glass, a phone camera on zoom, or just your eyes very close to the ground. What\'s happening down there?',
    ),
    facilitatorGuidance: {
      before: 'A square of lawn, garden bed, or bush undergrowth works well. Avoid paving — you want living ground. The smaller the better to encourage real looking.',
      during: 'Stay silent for the first few minutes. Then ask: "How many different things can you count in this square?" Let the number grow as they look more carefully.',
      challenges: 'Children often sweep the surface quickly and declare themselves done. Ask "Look lower. Look under the leaf. Look at the soil itself." Slow down the looking.',
    },
    duration: { min: 15, max: 25 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child\'s attention deepen over the 10 minutes rather than fading?',
      'How many distinct living things did they find in the square metre?',
      'Did they notice anything they genuinely hadn\'t seen before?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.E1', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-tw-smallest-biggest',
    _type: 'activity',
    title: 'Smallest and Biggest',
    slug: slug('smallest-and-biggest'),
    approach: singleRef('approach.starter.wlo-tiny-worlds'),
    instructions: blocks(
      'Find the smallest living thing you can see outside. Then find the biggest living thing you can see.',
      'How do they move differently? How do they live differently? What do they both need to survive?',
    ),
    facilitatorGuidance: {
      before: 'No preparation needed. This is a free-ranging activity that works in almost any outdoor space — garden, park, or bush.',
      during: 'Let the child define "smallest" and "biggest" themselves. A debate about whether a tall tree or a wide tree is bigger is a genuine thinking exercise.',
      challenges: 'If the child goes for obvious choices (ant / tree), push gently: "Is there anything smaller than the ant? Is there anything bigger in sight?"',
    },
    duration: { min: 10, max: 20 },
    setting: 'outdoor',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child look carefully for the smallest possible thing, or settle for the first small thing they saw?',
      'Could they describe specific differences in how the two creatures or organisms live?',
      'Did they make any connection between size and what each organism needs?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    status: 'published',
  },
]

// Loose: Quick Nature Moments (8)
const WLO_QN = [
  {
    _id: 'activity.starter.wlo-qn-first-thing',
    _type: 'activity',
    title: 'First Thing Outside',
    slug: slug('first-thing-outside'),
    approach: singleRef('approach.starter.wlo-quick-nature'),
    instructions: blocks('Step outside right now. What\'s the first living thing you notice? Watch it for 30 seconds. Log it.'),
    facilitatorGuidance: {
      before: 'No preparation. This is a doorstep activity.',
      during: 'Don\'t guide or point. Let whatever catches the child\'s attention be the subject.',
      challenges: 'If nothing presents itself immediately, wait. Something almost always appears within a minute.',
    },
    duration: { min: 5, max: 5 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'What did the child notice first, and how did they describe it?',
      'Did they sustain 30 seconds of attention?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-qn-new-thing',
    _type: 'activity',
    title: 'Find Something New',
    slug: slug('find-something-new'),
    approach: singleRef('approach.starter.wlo-quick-nature'),
    instructions: blocks('Find something outside that wasn\'t there yesterday — or that you\'ve never noticed before. What is it?'),
    facilitatorGuidance: {
      before: 'Works well as a morning activity when the garden or outdoor space looks fresh.',
      during: 'Accept whatever the child identifies, even if you\'re not sure it\'s new. "How can we check?" is a good follow-up.',
      challenges: "If the child can't find anything new, that's a valid response. Ask: \"What usually changes overnight? What could we look for tomorrow?\"",
    },
    duration: { min: 5, max: 10 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'What did the child find and how did they know it was new?',
      'Did they show genuine curiosity about what they found?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-qn-bird-count',
    _type: 'activity',
    title: 'Five-Minute Bird Count',
    slug: slug('five-minute-bird-count'),
    approach: singleRef('approach.starter.wlo-quick-nature'),
    instructions: blocks('Stand or sit still for 5 minutes. Count how many different birds you can see or hear. Different songs count as different birds.'),
    facilitatorGuidance: {
      before: 'Early morning or late afternoon are best. Any outdoor space works.',
      during: 'Help the child distinguish between the same bird seen twice and two different birds. "Have you heard that call before in these 5 minutes?"',
      challenges: 'Identifying birds by sound is a real skill. Emphasise that you\'re counting types, not identifying species. Counting is the skill, not naming.',
    },
    duration: { min: 5, max: 5 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'auditory',
    observationPrompts: [
      'How many distinct birds did the child count, and how did they distinguish between them?',
      'Did they use both sight and sound?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.E1', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-qn-same-colour',
    _type: 'activity',
    title: 'Same Colour in Nature',
    slug: slug('same-colour-in-nature'),
    approach: singleRef('approach.starter.wlo-quick-nature'),
    instructions: blocks(
      'Find three things the same colour in nature — not made things, only natural ones.',
      'Are they related to each other, or just the same colour by coincidence?',
    ),
    facilitatorGuidance: {
      before: 'No preparation. Good for any season.',
      during: 'The second question is the interesting one. Let the child speculate without correcting.',
      challenges: 'Some children want to use made objects. Gently redirect: "Just the natural things."',
    },
    duration: { min: 5, max: 10 },
    setting: 'outdoor',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child look carefully for the colour rather than settling for the first three things?',
      'Did they engage with the question of whether the same-colour things are related?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-qn-touch-leaf',
    _type: 'activity',
    title: 'Touch a Leaf',
    slug: slug('touch-a-leaf'),
    approach: singleRef('approach.starter.wlo-quick-nature'),
    instructions: blocks('Find a leaf and touch it. Is it smooth or rough? Thick or thin? Wet or dry? What does it smell like?'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'Encourage precise vocabulary. Not just "soft" — "waxy" or "velvety" or "papery".',
      challenges: 'Children often rush this. One leaf, described well, is worth more than five leaves described quickly.',
    },
    duration: { min: 3, max: 5 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child use more than one sense?',
      'Did they use specific descriptive language?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.L1', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-qn-symmetry',
    _type: 'activity',
    title: 'Find Natural Symmetry',
    slug: slug('find-natural-symmetry'),
    approach: singleRef('approach.starter.wlo-quick-nature'),
    instructions: blocks('Find something in nature that is perfectly symmetrical — or as close as you can get. A leaf, a flower, a spider web, a butterfly wing.'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'Test symmetry by imagining a fold down the middle. "If you folded it here, would both sides match?" Not all things are perfectly symmetrical — that\'s interesting too.',
      challenges: 'Perfect symmetry is rare in nature. That\'s a discovery worth noting: "Why might it be almost, but not quite, symmetrical?"',
    },
    duration: { min: 5, max: 10 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'visual',
    observationPrompts: [
      'What did the child find, and how did they test for symmetry?',
      'Did they notice imperfect symmetry and find it interesting rather than frustrating?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.M1', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-qn-furthest-living',
    _type: 'activity',
    title: 'Furthest Living Thing',
    slug: slug('furthest-living-thing'),
    approach: singleRef('approach.starter.wlo-quick-nature'),
    instructions: blocks('Stand at your front door. What\'s the furthest-away living thing you can see from here?'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'Debate is fine: "Is that bird in that tree, or is it the tree itself?" Both answers are interesting.',
      challenges: 'Urban environments can make this tricky. Help the child look for trees in the distance, birds in the sky, or even insects on a nearby wall.',
    },
    duration: { min: 3, max: 5 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'What did the child identify, and how did they determine it was the furthest?',
      'Did they show interest in what might be even further away?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1')],
    status: 'published',
  },
  {
    _id: 'activity.starter.wlo-qn-lie-look-up',
    _type: 'activity',
    title: 'Lie Down and Look Up',
    slug: slug('lie-down-and-look-up'),
    approach: singleRef('approach.starter.wlo-quick-nature'),
    instructions: blocks('Lie on the grass and look straight up. What\'s happening above you? Stay for at least 5 minutes.'),
    facilitatorGuidance: {
      before: 'A clear or partly cloudy day makes this richest. Lie down alongside the child.',
      during: 'Silence first. Then: "What\'s moving? What\'s the highest thing you can see?" Give this time — the longer you look, the more appears.',
      challenges: 'Some children find lying still difficult. A comfortable spot and permission to wiggle helps. The looking is the goal, not the stillness.',
    },
    duration: { min: 5, max: 10 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'What did the child notice that they wouldn\'t normally see from a standing position?',
      'Did their attention deepen as the minutes passed?',
    ],
    capabilityThreads: [ref('capabilityThread.S1', 'ct1'), ref('capabilityThread.E1', 'ct2')],
    status: 'published',
  },
]

const WLO_ACTIVITIES = [...WLO_CW, ...WLO_PL, ...WLO_SW, ...WLO_WW, ...WLO_TW, ...WLO_QN]

// ─── Activities: Stories That Stay ───────────────────────────────────────────

// Kit A: Deep Read (5)
const STS_DR = [
  {
    _id: 'activity.starter.sts-dr-first-read',
    _type: 'activity',
    title: 'First Read',
    slug: slug('first-read'),
    approach: singleRef('approach.starter.sts-deep-read'),
    instructions: blocks(
      'Read a story aloud — any story you both enjoy. Read it all the way through without stopping to quiz or explain.',
      'Afterwards, ask: "Tell me what happened." Then: "What was your favourite part? Why?"',
    ),
    facilitatorGuidance: {
      before: 'Choose a book you both want to read, or let the child choose. The quality of the read-aloud matters more than the book level.',
      during: 'Read with expression but don\'t over-perform. Pause at dramatic moments. After the story, let the child respond before asking questions.',
      challenges: 'Young children often retell stories in the wrong order. That\'s fine — sequence can come later. What matters first is that they engage with the story at all.',
    },
    duration: { min: 20, max: 30 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'auditory',
    observationPrompts: [
      'How much of the story could the child retell unprompted?',
      'Did they identify a favourite part and give a reason for it?',
      'Did they show emotional engagement during or after the reading?',
    ],
    capabilityThreads: [
      ref('capabilityThread.L1', 'ct1'),
      ref('capabilityThread.L3', 'ct2'),
      ref('capabilityThread.L9', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-dr-re-read',
    _type: 'activity',
    title: 'Read It Again',
    slug: slug('read-it-again'),
    approach: singleRef('approach.starter.sts-deep-read'),
    instructions: blocks(
      'Read the same story again — the one you read last time.',
      'Ask: "Was there anything you noticed that you missed before? Did anything mean something different the second time?"',
    ),
    facilitatorGuidance: {
      before: 'Use the same book from the First Read activity. Don\'t introduce a new story — the whole point is the return.',
      during: 'You might notice things you missed too. Model genuine re-discovery: "Oh, I didn\'t notice that the first time." That normalises looking again.',
      challenges: 'Some children resist re-reading because they already know the story. Reframe: "Let\'s see what we missed." The second read nearly always reveals something new.',
    },
    duration: { min: 15, max: 25 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'auditory',
    observationPrompts: [
      'Did the child notice anything genuinely new on the second reading?',
      'Did they connect something from earlier in the story to how it ended?',
      'Did the re-read deepen their engagement rather than diminish it?',
    ],
    capabilityThreads: [
      ref('capabilityThread.L3', 'ct1'),
      ref('capabilityThread.L9', 'ct2'),
      ref('capabilityThread.E1', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-dr-draw-favourite',
    _type: 'activity',
    title: 'Draw Your Favourite Moment',
    slug: slug('draw-your-favourite-moment'),
    approach: singleRef('approach.starter.sts-deep-read'),
    instructions: blocks(
      'Draw your favourite moment from the story. Try to include details that show exactly which moment it is — not just the characters, but what is happening.',
      'Tell someone about your drawing when you\'re done.',
    ),
    facilitatorGuidance: {
      before: 'Offer plain paper and pencils or whatever drawing materials the child prefers. No template or colouring page.',
      during: 'Let the child draw without intervention. Afterwards, ask them to tell you about the drawing — what moment is it? Why was it their favourite?',
      challenges: 'Some children struggle to "choose a favourite" and want to draw everything. That\'s fine — ask them to pick one scene and go deep rather than broad.',
    },
    duration: { min: 15, max: 25 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'visual',
    observationPrompts: [
      'Did the drawing reflect a specific scene from the story rather than a generic character image?',
      'Could the child articulate why that moment was their favourite?',
      'Did the drawing show detail that indicated genuine recall of the story?',
    ],
    capabilityThreads: [
      ref('capabilityThread.C1', 'ct1'),
      ref('capabilityThread.L1', 'ct2'),
      ref('capabilityThread.L9', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-dr-act-it-out',
    _type: 'activity',
    title: 'Act It Out',
    slug: slug('act-it-out'),
    approach: singleRef('approach.starter.sts-deep-read'),
    instructions: blocks(
      'Act out part of the story — with toys, with siblings, with different voices, or just on your own.',
      'What do the characters sound like? What do they do with their hands and faces? You choose which scene.',
    ),
    facilitatorGuidance: {
      before: 'This needs no props, though toys or costumes can enrich it. Let the child choose what to act out — don\'t assign scenes.',
      during: 'Participate if invited. If the child is self-directing, give them space. The performance doesn\'t need to be perfect or complete.',
      challenges: 'Some children are shy about dramatic play. Suggest they use toys or stuffed animals as the characters rather than playing the roles themselves.',
    },
    duration: { min: 15, max: 30 },
    setting: 'either',
    energyLevel: 'active',
    modality: 'social',
    observationPrompts: [
      'Did the child demonstrate understanding of the characters through their portrayal?',
      'Did they use voice, movement, or dialogue to bring the scene to life?',
      'Did their re-enactment show comprehension of the story beyond just surface events?',
    ],
    capabilityThreads: [
      ref('capabilityThread.C3', 'ct1'),
      ref('capabilityThread.L1', 'ct2'),
      ref('capabilityThread.L9', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-dr-tell-someone',
    _type: 'activity',
    title: 'Tell Someone the Story',
    slug: slug('tell-someone-the-story'),
    approach: singleRef('approach.starter.sts-deep-read'),
    instructions: blocks(
      'Tell someone who hasn\'t heard the story what it\'s about. Not just what happened — tell them why it matters, what it made you feel, what you\'ll remember.',
      'The person can ask questions when you\'re done.',
    ),
    facilitatorGuidance: {
      before: 'Find a genuine audience — another parent, a sibling, a grandparent. The child knowing someone genuinely hasn\'t heard the story raises the quality of the telling.',
      during: 'Let the child tell it their way. Don\'t correct omissions mid-telling. The audience can ask clarifying questions afterwards.',
      challenges: 'Some children will just list events. Prompt afterwards: "What did you feel when that happened?" and "What do you think the story was really about?"',
    },
    duration: { min: 10, max: 20 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'narrative',
    observationPrompts: [
      'Did the child go beyond plot summary to convey meaning or feeling?',
      'Did they sequence the story clearly enough for someone unfamiliar to follow?',
      'Did they hold the listener\'s attention?',
    ],
    capabilityThreads: [
      ref('capabilityThread.L1', 'ct1'),
      ref('capabilityThread.L3', 'ct2'),
      ref('capabilityThread.L9', 'ct3'),
    ],
    status: 'published',
  },
]

// Kit B: Story into Making (4)
const STS_SM = [
  {
    _id: 'activity.starter.sts-sm-make-something',
    _type: 'activity',
    title: 'Make Something from the Story',
    slug: slug('make-something-from-the-story'),
    approach: singleRef('approach.starter.sts-story-into-making'),
    instructions: blocks(
      'After reading a story, make something from it. Draw a character. Build the setting from blocks. Create a map of where the story happened.',
      'The making should help you understand or remember the story better.',
    ),
    facilitatorGuidance: {
      before: 'Have basic making materials available — paper, pencils, blocks, clay, whatever you have. The medium is less important than the connection to the story.',
      during: 'Ask questions as the child makes: "Where does this character live?" "What does this place look like?" The making is a thinking tool.',
      challenges: 'Some children want to make something only loosely related to the story. That\'s fine — ask them to explain the connection, and that explanation is the learning.',
    },
    duration: { min: 20, max: 40 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the making deepen their engagement with the story or help them recall details?',
      'Could the child explain the connection between what they made and the story?',
      'Did the process raise new questions about the story for them?',
    ],
    capabilityThreads: [
      ref('capabilityThread.C1', 'ct1'),
      ref('capabilityThread.C3', 'ct2'),
      ref('capabilityThread.L9', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-sm-new-ending',
    _type: 'activity',
    title: 'A New Ending',
    slug: slug('a-new-ending'),
    approach: singleRef('approach.starter.sts-story-into-making'),
    instructions: blocks(
      'What happens after "the end"? Create a new ending for the story, or continue it past where the book stops.',
      'Tell it, draw it, write it, or act it out — whatever feels right.',
    ),
    facilitatorGuidance: {
      before: 'This works best with stories the child knows well and cares about. Let them choose which story to extend.',
      during: 'Accept any direction the story takes — dark, silly, unexpected. The child\'s autonomy over the narrative is the point.',
      challenges: 'Some children feel uncertain about "changing" a story. Reassure them: "It\'s yours to play with. The original stays the same — this is your version."',
    },
    duration: { min: 15, max: 25 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'narrative',
    observationPrompts: [
      'Did the new ending stay true to the characters and world of the original story?',
      'Did the child show creative autonomy in their choices?',
      'Was there narrative logic in their continuation — a sense of cause and effect?',
    ],
    capabilityThreads: [
      ref('capabilityThread.C3', 'ct1'),
      ref('capabilityThread.L1', 'ct2'),
      ref('capabilityThread.L9', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-sm-puppet',
    _type: 'activity',
    title: 'Make a Puppet or Figure',
    slug: slug('make-a-puppet-or-figure'),
    approach: singleRef('approach.starter.sts-story-into-making'),
    instructions: blocks(
      'Make a puppet or figure of a character from a story you know well. Use whatever you have — paper, socks, cardboard, sticks.',
      'Use your puppet to retell part of the story, or invent a new adventure for the character.',
    ),
    facilitatorGuidance: {
      before: 'The puppet doesn\'t need to be elaborate. A paper bag, a sock, a paper cutout — anything that represents the character is enough.',
      during: 'Let the making be part of the activity, not a detour from it. Ask about the character while they\'re making: "What is this character like? What do they want?"',
      challenges: "Some children get absorbed in the making and don't get to the storytelling. That's fine — set a gentle expectation that the puppet will perform when it's done.",
    },
    duration: { min: 20, max: 35 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the puppet reflect specific character traits from the story?',
      'Did the child use the puppet to tell a coherent story — even a short one?',
      'Did they show pleasure in bringing the character to life through the puppet?',
    ],
    capabilityThreads: [
      ref('capabilityThread.C1', 'ct1'),
      ref('capabilityThread.C3', 'ct2'),
      ref('capabilityThread.L1', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-sm-share-story',
    _type: 'activity',
    title: 'Share Your New Story',
    slug: slug('share-your-new-story'),
    approach: singleRef('approach.starter.sts-story-into-making'),
    instructions: blocks(
      'Tell your new story — the one you invented or the new ending you created — to someone else.',
      'What do they think? Would they change anything? What was their favourite part?',
    ),
    facilitatorGuidance: {
      before: 'Find a genuine audience. The child knowing someone will actually listen changes how they prepare and tell the story.',
      during: 'The audience should listen generously and respond honestly. Questions like "What happened to the other character?" can open the story further.',
      challenges: 'If the child is nervous, let them use their puppet or drawing as a prop. The object gives them something to hold and look at rather than the audience.',
    },
    duration: { min: 10, max: 20 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'social',
    observationPrompts: [
      'Did the child hold the audience\'s attention?',
      'Did they respond to questions or feedback about their story?',
      'Did they show pride or satisfaction in sharing their creation?',
    ],
    capabilityThreads: [ref('capabilityThread.L1', 'ct1'), ref('capabilityThread.C3', 'ct2')],
    status: 'published',
  },
]

// Chunk A: Story Types (3)
const STS_ST = [
  {
    _id: 'activity.starter.sts-st-fable',
    _type: 'activity',
    title: 'A Fable and Its Lesson',
    slug: slug('a-fable-and-its-lesson'),
    approach: singleRef('approach.starter.sts-story-types'),
    instructions: blocks(
      'Read a fable — Aesop\'s are a good starting point, but any short moral story will work.',
      'What lesson does it teach? Do you agree with the lesson? Can you think of a time the lesson was true in real life?',
    ),
    facilitatorGuidance: {
      before: 'Choose a short fable — no more than a page or two. The Tortoise and the Hare, The Lion and the Mouse, The Boy Who Cried Wolf all work well.',
      during: 'After the reading, give the child time to respond before asking the lesson question. Their first reaction often tells you more than their considered answer.',
      challenges: 'Some children see the lesson immediately and find discussion superfluous. Push deeper: "Do you always agree with that lesson? Can you think of a time it wasn\'t true?"',
    },
    duration: { min: 15, max: 25 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'narrative',
    observationPrompts: [
      'Could the child identify the lesson of the fable?',
      'Did they engage critically — agreeing or disagreeing with a reason?',
      'Did they connect the lesson to their own experience?',
    ],
    capabilityThreads: [
      ref('capabilityThread.L3', 'ct1'),
      ref('capabilityThread.L9', 'ct2'),
      ref('capabilityThread.L1', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-st-fairy-tale',
    _type: 'activity',
    title: 'A Fairy Tale: Real and Made-Up',
    slug: slug('a-fairy-tale-real-and-made-up'),
    approach: singleRef('approach.starter.sts-story-types'),
    instructions: blocks(
      'Read a fairy tale or folk tale. When you\'re done, ask: what\'s real in this story and what\'s made up?',
      'How can you tell the difference? Why do you think people have told this story for so long?',
    ),
    facilitatorGuidance: {
      before: 'Use an original or relatively unmodified version of a traditional tale. Cinderella, Jack and the Beanstalk, or an Australian indigenous story all work well.',
      during: 'The "how can you tell the difference" question is rich. Let the child work through it. Real feelings in a made-up world, realistic consequences of magical events — these are sophisticated observations.',
      challenges: 'Young children may not yet reliably distinguish real from fictional. That\'s fine — explore the question without forcing a conclusion.',
    },
    duration: { min: 15, max: 25 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'auditory',
    observationPrompts: [
      'Did the child engage with the distinction between what is real and what is fictional in the story?',
      'Did they offer a reason for why the story has lasted?',
      'Did they show any appreciation for the craft or strangeness of the tale?',
    ],
    capabilityThreads: [ref('capabilityThread.L3', 'ct1'), ref('capabilityThread.L9', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-st-poem',
    _type: 'activity',
    title: 'A Poem, Read Slowly',
    slug: slug('a-poem-read-slowly'),
    approach: singleRef('approach.starter.sts-story-types'),
    instructions: blocks(
      'Choose a poem and read it aloud slowly. Then read it again.',
      'Which words sound best? What picture does the poem make in your mind? What do you think it\'s about?',
    ),
    facilitatorGuidance: {
      before: 'Choose a poem that rewards listening — something with strong rhythm, striking images, or surprising words. A.A. Milne, Mary Oliver, or any verse the child already loves works well.',
      during: 'Read slowly enough for the words to land. After the second reading, wait before asking questions. Silence after a poem is appropriate.',
      challenges: 'Some children want a poem to be about something concrete. "I\'m not sure what it means" is a valid and honest response — model that it\'s okay not to be certain.',
    },
    duration: { min: 10, max: 20 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'auditory',
    observationPrompts: [
      'Did the child identify specific words or lines that stood out to them?',
      'Did they describe a mental image the poem created?',
      'Did they tolerate or enjoy the ambiguity of poetry, or did they find it frustrating?',
    ],
    capabilityThreads: [
      ref('capabilityThread.L9', 'ct1'),
      ref('capabilityThread.L1', 'ct2'),
      ref('capabilityThread.E1', 'ct3'),
    ],
    status: 'published',
  },
]

// Chunk B: Storytelling Without Books (2)
const STS_SB = [
  {
    _id: 'activity.starter.sts-sb-own-story',
    _type: 'activity',
    title: 'Tell a Story from Your Own Life',
    slug: slug('tell-a-story-from-your-own-life'),
    approach: singleRef('approach.starter.sts-storytelling-without-books'),
    instructions: blocks(
      'Tell a story from your own life — something funny, something that surprised you, something you remember clearly.',
      'Tell it as if you were telling it to someone who wasn\'t there. Include enough detail that they can picture it.',
    ),
    facilitatorGuidance: {
      before: 'Start by modelling — tell your own brief personal story first. It removes the performance pressure and shows the child how to do it.',
      during: 'Listen without interrupting. Ask questions when they\'re done: "What happened just before that?" "How did you feel when...?" Help them add detail.',
      challenges: 'Some children struggle to identify a story from their own life. Prompt with specifics: "Tell me about something surprising that happened this week." or "Tell me about a time something went wrong."',
    },
    duration: { min: 10, max: 20 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'narrative',
    observationPrompts: [
      'Did the child tell a story with a beginning, middle, and end?',
      'Did they include enough detail for a listener to picture what happened?',
      'Did they show awareness of narrative — building to something rather than just listing events?',
    ],
    capabilityThreads: [ref('capabilityThread.L1', 'ct1'), ref('capabilityThread.C3', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-sb-round-robin',
    _type: 'activity',
    title: 'Round-Robin Story',
    slug: slug('round-robin-story'),
    approach: singleRef('approach.starter.sts-storytelling-without-books'),
    instructions: blocks(
      'Invent a story together — one person starts with a sentence or two, the next person adds a sentence or two, and so on.',
      'Keep going until the story finds a natural ending. No planning allowed — just listen and add.',
    ),
    facilitatorGuidance: {
      before: 'No preparation. All you need is two or more willing participants.',
      during: 'Model good collaborative storytelling: yes-and rather than no-but. Accept whatever the child adds, even if it takes the story somewhere unexpected.',
      challenges: 'Children sometimes try to "win" the story by ending it too quickly or introducing random elements to derail it. Reframe: the goal is the longest, richest story you can make together.',
    },
    duration: { min: 10, max: 20 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'social',
    observationPrompts: [
      'Did the child listen to what others contributed and build on it?',
      'Did they develop characters or situations across multiple turns rather than introducing something new each time?',
      'Did they show narrative instinct — a sense of where a story needs to go?',
    ],
    capabilityThreads: [
      ref('capabilityThread.C3', 'ct1'),
      ref('capabilityThread.L1', 'ct2'),
      ref('capabilityThread.L9', 'ct3'),
    ],
    status: 'published',
  },
]

// Chunk C: Listening Skills (3)
const STS_LS = [
  {
    _id: 'activity.starter.sts-ls-retell',
    _type: 'activity',
    title: 'Retell What You Heard',
    slug: slug('retell-what-you-heard'),
    approach: singleRef('approach.starter.sts-listening-skills'),
    instructions: blocks(
      'Read a short passage aloud — a paragraph or two from any book, article, or story.',
      'The child retells it in their own words. How many details can they remember? What did they notice most?',
    ),
    facilitatorGuidance: {
      before: 'Choose a passage that is interesting and within reach — not so easy it offers no challenge, not so hard they lose the thread.',
      during: 'Read at a natural pace — not artificially slowly. After the reading, give the child a moment to gather their thoughts before they begin retelling.',
      challenges: "Some children will retell every detail they remember in a rush. Others will give only the gist. Both are worth noting — depth and accuracy are different skills.",
    },
    duration: { min: 10, max: 15 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'auditory',
    observationPrompts: [
      'How much of the passage could the child retell without prompting?',
      'Was their retelling accurate in the details they included?',
      'Did they retell in sequence, or jump around?',
    ],
    capabilityThreads: [
      ref('capabilityThread.L1', 'ct1'),
      ref('capabilityThread.L3', 'ct2'),
      ref('capabilityThread.E1', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-ls-surprise-twist',
    _type: 'activity',
    title: 'The Surprise Twist',
    slug: slug('the-surprise-twist'),
    approach: singleRef('approach.starter.sts-listening-skills'),
    instructions: blocks(
      'Read a story that has a surprise, a twist, or an unexpected ending.',
      'Afterward: did you see it coming? What clues were there? Could you find them if you read it again?',
    ),
    facilitatorGuidance: {
      before: 'Many picture books and short stories have effective twists — Wolves by Emily Gravett, The True Story of the Three Little Pigs, or any mystery story.',
      during: 'After the reveal, pause before asking questions. Let the surprise land. Then: "Did you expect that?" and "Looking back, were there any clues you missed?"',
      challenges: 'Some children catch on early and feel proud of it. Others are completely surprised. Both are valid. The exercise is in going back for the clues either way.',
    },
    duration: { min: 15, max: 25 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'auditory',
    observationPrompts: [
      'Did the child show genuine surprise, or had they anticipated the twist?',
      'Could they identify retrospective clues in the story?',
      'Did the twist change how they understood earlier parts of the story?',
    ],
    capabilityThreads: [ref('capabilityThread.L3', 'ct1'), ref('capabilityThread.L9', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-ls-compare-stories',
    _type: 'activity',
    title: 'Compare Two Stories',
    slug: slug('compare-two-stories'),
    approach: singleRef('approach.starter.sts-listening-skills'),
    instructions: blocks(
      'Read two very short stories or passages — they could be similar in theme or very different.',
      'Which was better? Why? What made the difference? This is first steps in literary judgement.',
    ),
    facilitatorGuidance: {
      before: 'Choose two short, contrasting pieces. Two retellings of the same fairy tale, two poems on the same subject, or two very different kinds of opening sentences work well.',
      during: 'There is no right answer. The goal is that the child develops and articulates a preference with reasons — not that they reach a particular conclusion.',
      challenges: 'Some children feel uncomfortable making a judgement about books. Reassure: "It\'s your opinion — there\'s no wrong answer." But press for a reason.',
    },
    duration: { min: 15, max: 25 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'auditory',
    observationPrompts: [
      'Did the child express a clear preference?',
      'Did they give a specific reason for preferring one over the other?',
      'Did their reason go beyond "it was more fun" — did they identify something about the writing itself?',
    ],
    capabilityThreads: [ref('capabilityThread.L9', 'ct1'), ref('capabilityThread.L1', 'ct2')],
    status: 'published',
  },
]

// Loose: Story Sparks (8)
const STS_SS = [
  {
    _id: 'activity.starter.sts-ss-one-page',
    _type: 'activity',
    title: 'One Page',
    slug: slug('one-page'),
    approach: singleRef('approach.starter.sts-story-sparks'),
    instructions: blocks('Pick up any book. Read one page aloud together. Talk about what might happen next.'),
    facilitatorGuidance: {
      before: 'No preparation. Works with any book.',
      during: 'The speculation is the activity. Let the child\'s prediction be as wild as they like.',
      challenges: 'If the book is familiar, ask: "What would happen if the story went somewhere completely different?"',
    },
    duration: { min: 5, max: 10 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'auditory',
    observationPrompts: [
      'Did the child engage with the page on its own terms?',
      'Was their speculation grounded in what they had heard, or entirely independent?',
    ],
    capabilityThreads: [ref('capabilityThread.L3', 'ct1'), ref('capabilityThread.L9', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-ss-day-as-story',
    _type: 'activity',
    title: 'Your Day as a Story',
    slug: slug('your-day-as-a-story'),
    approach: singleRef('approach.starter.sts-story-sparks'),
    instructions: blocks('Tell the story of your day so far — as if it were a story in a book. Give it a title.'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'Encourage them to narrate, not just list: "What was the interesting part? What happened next? How did you feel?" The title is a fun prompt — what would this chapter be called?',
      challenges: 'Children often say "nothing happened." Ask: "What was the first thing you did? Then what?"',
    },
    duration: { min: 5, max: 5 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'narrative',
    observationPrompts: [
      'Did the child frame their day as a narrative rather than a list?',
      'Did they identify what was interesting or dramatic?',
    ],
    capabilityThreads: [ref('capabilityThread.L1', 'ct1'), ref('capabilityThread.C3', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-ss-best-story',
    _type: 'activity',
    title: 'The Best Story You\'ve Heard',
    slug: slug('the-best-story-youve-heard'),
    approach: singleRef('approach.starter.sts-story-sparks'),
    instructions: blocks('What\'s the best story you\'ve ever heard or read? Tell someone why.'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'Ask for a reason beyond "it was good." "What made it stay with you?" is a good prompt.',
      challenges: 'Children sometimes can\'t choose. "Which story do you think about when you\'re not reading?" often helps them land on the real answer.',
    },
    duration: { min: 5, max: 10 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'narrative',
    observationPrompts: [
      'Did the child identify a specific story rather than a genre or character?',
      'Did they articulate why it stayed with them?',
    ],
    capabilityThreads: [ref('capabilityThread.L9', 'ct1'), ref('capabilityThread.L1', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-ss-make-character',
    _type: 'activity',
    title: 'Make Up a Character',
    slug: slug('make-up-a-character'),
    approach: singleRef('approach.starter.sts-story-sparks'),
    instructions: blocks('Make up a character. What\'s their name? What do they look like? What\'s the one thing they want most? What\'s standing in their way?'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'The "what do they want" and "what\'s in their way" questions are the ones that make a character interesting. Stay with those.',
      challenges: "Children often describe appearance at length and skip motivation. Ask: \"And what does this character really want?\"",
    },
    duration: { min: 5, max: 10 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'narrative',
    observationPrompts: [
      'Did the character have a clear desire or problem?',
      'Did the child develop their character beyond appearance?',
    ],
    capabilityThreads: [ref('capabilityThread.C3', 'ct1'), ref('capabilityThread.L1', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-ss-picture-story',
    _type: 'activity',
    title: 'Tell the Story of a Picture',
    slug: slug('tell-the-story-of-a-picture'),
    approach: singleRef('approach.starter.sts-story-sparks'),
    instructions: blocks('Find a picture — in a book, on the wall, anywhere. Tell the story of what is happening in it. What happened just before? What happens next?'),
    facilitatorGuidance: {
      before: 'No preparation. Any image will do — the more ambiguous, the richer.',
      during: 'Ask about before and after as well as the moment in the image. The best stories come from the edges of the picture.',
      challenges: 'Some children describe rather than narrate. Prompt: "What happened just before this moment? Why is the person looking like that?"',
    },
    duration: { min: 5, max: 10 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'narrative',
    observationPrompts: [
      'Did the child construct a narrative rather than just describe what they saw?',
      'Did their story go beyond the frame of the image?',
    ],
    capabilityThreads: [
      ref('capabilityThread.C3', 'ct1'),
      ref('capabilityThread.L1', 'ct2'),
      ref('capabilityThread.L9', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-ss-whisper-story',
    _type: 'activity',
    title: 'Whisper a Story',
    slug: slug('whisper-a-story'),
    approach: singleRef('approach.starter.sts-story-sparks'),
    instructions: blocks('Tell a story — any story — as quietly as you can. Use a whisper the whole way through.'),
    facilitatorGuidance: {
      before: 'No preparation. Works well as a wind-down activity.',
      during: 'Lean in and listen. The quiet changes how the story feels — and how the teller shapes it.',
      challenges: 'Some children giggle their way through this. That\'s fine — the laughter is also a response to the strangeness of the constraint.',
    },
    duration: { min: 5, max: 5 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'narrative',
    observationPrompts: [
      'Did the child maintain the constraint through the whole story?',
      'Did the whisper change the tone or content of the story at all?',
    ],
    capabilityThreads: [ref('capabilityThread.L1', 'ct1'), ref('capabilityThread.C3', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-ss-villain-hero',
    _type: 'activity',
    title: 'The Villain as Hero',
    slug: slug('the-villain-as-hero'),
    approach: singleRef('approach.starter.sts-story-sparks'),
    instructions: blocks('Choose a villain from a story you know. What if they were actually the hero all along? Retell the story from their side.'),
    facilitatorGuidance: {
      before: 'No preparation. Works best with a villain the child already knows and has strong feelings about.',
      during: 'Encourage genuine empathy for the character. "What did they want? Why did they do what they did? What would have happened differently if people had understood them?"',
      challenges: 'Some children refuse to humanise a villain they strongly dislike. That resistance is itself interesting — "Why is it hard to see it from their side?"',
    },
    duration: { min: 10, max: 15 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'narrative',
    observationPrompts: [
      'Did the child show genuine perspective-taking, not just a surface retelling?',
      'Did they find any genuine sympathy for the villain\'s position?',
    ],
    capabilityThreads: [ref('capabilityThread.C3', 'ct1'), ref('capabilityThread.L9', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.sts-ss-upside-down',
    _type: 'activity',
    title: 'Everything Was Upside Down',
    slug: slug('everything-was-upside-down'),
    approach: singleRef('approach.starter.sts-story-sparks'),
    instructions: blocks('Finish this sentence and keep going: "One morning I woke up and everything was upside down…"'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'Let the story go wherever it goes. Don\'t guide the direction — just listen.',
      challenges: 'If the child stops quickly, ask: "And then what happened?" repeatedly until the story finds momentum.',
    },
    duration: { min: 5, max: 10 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'narrative',
    observationPrompts: [
      'Did the child sustain the story beyond one or two sentences?',
      'Did they develop an internal logic for their upside-down world?',
    ],
    capabilityThreads: [ref('capabilityThread.C3', 'ct1'), ref('capabilityThread.L1', 'ct2')],
    status: 'published',
  },
]

const STS_ACTIVITIES = [...STS_DR, ...STS_SM, ...STS_ST, ...STS_SB, ...STS_LS, ...STS_SS]

// ─── Activities: Numbers and Measure ─────────────────────────────────────────

// Kit A: Kitchen Maths (4)
const NM_KM = [
  {
    _id: 'activity.starter.nm-km-make-together',
    _type: 'activity',
    title: 'Make Something Together',
    slug: slug('make-something-together'),
    approach: singleRef('approach.starter.nm-kitchen-maths'),
    instructions: blocks(
      'Make something together in the kitchen — a simple recipe you both enjoy.',
      'Count the ingredients as you go. Measure cups and spoons. Ask: what\'s half a cup? What\'s a quarter? What if we needed more?',
    ),
    facilitatorGuidance: {
      before: 'Choose something simple — biscuits, a smoothie, a salad dressing. The cooking itself is secondary; the counting and measuring is the point.',
      during: 'Let the child do the measuring. Ask them to read the number on the measuring cup. Ask before each step: "How much do we need? Can you measure that?"',
      challenges: 'Young children often want to pour freely rather than measure. Make the measuring feel important: "The recipe needs exactly this much or it won\'t work."',
    },
    duration: { min: 30, max: 45 },
    setting: 'indoor',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child measure with care and accuracy?',
      'Did they understand the concept of "half" or "quarter" of a unit?',
      'Did they count ingredients independently?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1'), ref('capabilityThread.M3', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-km-double',
    _type: 'activity',
    title: 'Double the Recipe',
    slug: slug('double-the-recipe'),
    approach: singleRef('approach.starter.nm-kitchen-maths'),
    instructions: blocks(
      'Take a recipe you\'ve used before and double it. What changes? What does doubling mean for each ingredient?',
      'Work through each measurement: if the recipe needs 1 cup, how much do we need now? If it needs 3 eggs?',
    ),
    facilitatorGuidance: {
      before: 'Use a recipe the child already knows. The familiarity lets them focus on the doubling rather than the cooking.',
      during: 'Go ingredient by ingredient. Let the child work out each double — with fingers, counters, or mental maths. Record the new amounts.',
      challenges: 'Doubling odd numbers (3 eggs) can be tricky. "What\'s half of 3? So double 3 is...?" Treat this as a genuine puzzle rather than a test.',
    },
    duration: { min: 30, max: 45 },
    setting: 'indoor',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Could the child work out doubles for numbers up to at least 5?',
      'Did they understand that doubling applies to every ingredient consistently?',
      'Did they check their doubled recipe against the original?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1'), ref('capabilityThread.M3', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-km-halve',
    _type: 'activity',
    title: 'Halve the Recipe',
    slug: slug('halve-the-recipe'),
    approach: singleRef('approach.starter.nm-kitchen-maths'),
    instructions: blocks(
      'Take a recipe and halve it. What happens to each measurement?',
      'What about odd numbers? If the recipe needs 3 eggs, can you halve it exactly? What would you do?',
    ),
    facilitatorGuidance: {
      before: 'Choose a recipe with some awkward quantities to make the halving genuinely interesting — not everything should divide neatly.',
      during: 'The odd-number problem is the best bit. Let the child sit with the difficulty of halving 3 eggs. "You can\'t cut an egg in half easily — so what do bakers usually do?" (Use 2 and adjust, or use 1 extra.)',
      challenges: 'Fractions can feel abstract. Keep everything physical — halving a cup of flour in front of them is worth more than any explanation.',
    },
    duration: { min: 25, max: 40 },
    setting: 'indoor',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Could the child halve even numbers with confidence?',
      'How did they approach the challenge of halving an odd number?',
      'Did they connect "half" to a physical measurement rather than an abstract concept?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1'), ref('capabilityThread.M3', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-km-sort-pantry',
    _type: 'activity',
    title: 'Sort the Pantry Shelf',
    slug: slug('sort-the-pantry-shelf'),
    approach: singleRef('approach.starter.nm-kitchen-maths'),
    instructions: blocks(
      'Choose one shelf or section of the pantry or fridge. Sort everything on it by size, colour, or type.',
      'How many of each group? Which group has the most? Which has the fewest? Can you sort the same things two different ways?',
    ),
    facilitatorGuidance: {
      before: 'Pick a shelf with enough variety to make sorting interesting. Tinned foods, dry goods, or condiments all work well.',
      during: 'Let the child choose the sorting rule. If they choose colour, follow that through. Then ask: "How else could we sort these same things?"',
      challenges: "Some children want to sort arbitrarily. That's fine — ask them to explain their rule. A rule that makes sense to them is a valid sorting criterion.",
    },
    duration: { min: 15, max: 25 },
    setting: 'indoor',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child apply a consistent sorting rule to all items?',
      'Did they count each group accurately?',
      'Did they manage to sort the same items using a different rule?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1'), ref('capabilityThread.S1', 'ct2')],
    status: 'published',
  },
]

// Kit B: Building and Measuring (5)
const NM_BM = [
  {
    _id: 'activity.starter.nm-bm-tallest-tower',
    _type: 'activity',
    title: 'Build the Tallest Tower',
    slug: slug('build-the-tallest-tower'),
    approach: singleRef('approach.starter.nm-building-measuring'),
    instructions: blocks(
      'Build the tallest tower you can from whatever materials you have — blocks, books, tins, cardboard, cushions.',
      'Before you start, guess how tall it will be. Build it. Measure it. How close was your guess?',
    ),
    facilitatorGuidance: {
      before: 'Gather whatever stackable materials are available. Agree on the measuring tool — a ruler, a tape measure, or a string cut to the guessed height.',
      during: 'The guessing before building is the key part. Help the child articulate their guess in units: "About how many Lego blocks high? About how many handspans?" Then measure and compare.',
      challenges: 'Towers fall. That\'s expected. If a tower falls, measure where it got to before falling and start again. The record is the final standing height.',
    },
    duration: { min: 20, max: 30 },
    setting: 'either',
    energyLevel: 'active',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child make a specific guess before building, and did they use a unit?',
      'How close was their final tower to their prediction?',
      'Did they learn anything about what makes towers stable?',
    ],
    capabilityThreads: [
      ref('capabilityThread.M3', 'ct1'),
      ref('capabilityThread.S2', 'ct2'),
      ref('capabilityThread.E3', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-bm-hand-foot-ruler',
    _type: 'activity',
    title: 'Measure with Hand, Foot, and Ruler',
    slug: slug('measure-with-hand-foot-and-ruler'),
    approach: singleRef('approach.starter.nm-building-measuring'),
    instructions: blocks(
      'Choose three things to measure. Measure each one using: (1) your hand span, (2) your foot length, (3) a ruler.',
      'Record all three numbers for each object. Are they the same? Why not?',
    ),
    facilitatorGuidance: {
      before: 'Choose things that can be measured lengthwise — the table, a book, the window, a sibling. Have a ruler or tape measure ready.',
      during: 'Let the child do all the measuring. Ask after each: "So it\'s 4 hands long. Is that the same as 4 of my hands?" The different numbers for different measurers is the key insight.',
      challenges: 'Young children may not immediately understand why different people get different non-standard measurements. That confusion is productive — sit with it.',
    },
    duration: { min: 15, max: 25 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child measure carefully, placing hand or foot accurately rather than estimating?',
      'Did they notice that non-standard units give different results for different people?',
      'Did they begin to understand why we use standard units?',
    ],
    capabilityThreads: [ref('capabilityThread.M3', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-bm-arm-length',
    _type: 'activity',
    title: 'Build Something Exactly Arm-Length',
    slug: slug('build-something-exactly-arm-length'),
    approach: singleRef('approach.starter.nm-building-measuring'),
    instructions: blocks(
      'Build or make something that is exactly as long as your arm — from fingertip to shoulder.',
      'You cannot use a ruler. Think about how you\'ll check.',
    ),
    facilitatorGuidance: {
      before: 'Gather building materials — Lego, cardboard strips, blocks, rolled newspaper. The challenge is interesting with any of them.',
      during: 'Don\'t suggest the method — let the child work out how to check. They might lay their arm alongside the build, use a piece of string, or mark a piece of paper.',
      challenges: "If the child can't think of a checking method, ask: \"How could you compare the build to your arm without measuring?\" A string or paper strip as an intermediary often comes naturally.",
    },
    duration: { min: 15, max: 25 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'What method did the child devise for checking length without a ruler?',
      'Did they adjust and refine their build to reach the target?',
      'Did they show confidence in their own body as a measuring tool?',
    ],
    capabilityThreads: [ref('capabilityThread.M3', 'ct1'), ref('capabilityThread.E3', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-bm-two-bridges',
    _type: 'activity',
    title: 'Build Two Bridges',
    slug: slug('build-two-bridges'),
    approach: singleRef('approach.starter.nm-building-measuring'),
    instructions: blocks(
      'Build two bridges from different materials — one from cardboard, one from blocks, sticks, or whatever you have.',
      'Which holds more weight? How will you test fairly? Use the same test for both.',
    ),
    facilitatorGuidance: {
      before: 'Set up a gap to bridge — two stacks of books work well. Gather two different building materials. Have small objects to use as weights (coins, small tins).',
      during: 'The "fair test" question is key. Let the child work out what "fair" means: same gap width, same weight placed in the same spot. This is genuine scientific thinking.',
      challenges: 'One bridge will probably fail dramatically. Celebrate rather than mourn: "That\'s useful information. Why do you think it failed?"',
    },
    duration: { min: 20, max: 35 },
    setting: 'either',
    energyLevel: 'active',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child design a fair test — same conditions for both bridges?',
      'Did they make a prediction before testing?',
      'Did they analyse why one bridge held more than the other?',
    ],
    capabilityThreads: [
      ref('capabilityThread.M3', 'ct1'),
      ref('capabilityThread.S2', 'ct2'),
      ref('capabilityThread.E3', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-bm-beat-record',
    _type: 'activity',
    title: 'Beat Your Tower Record',
    slug: slug('beat-your-tower-record'),
    approach: singleRef('approach.starter.nm-building-measuring'),
    instructions: blocks(
      'Rebuild your tallest tower. Can you beat your previous record?',
      'Before you start: what would you change? What made it fall last time? What might help it go higher?',
    ),
    facilitatorGuidance: {
      before: 'Know the child\'s previous record. If it wasn\'t recorded, have them estimate.',
      during: 'The planning conversation before building is the most valuable part. "What did you learn last time? What would you do differently?" Let this shape the new attempt.',
      challenges: 'Some children just replicate their previous build. Ask: "Is there anything you could change to make it more stable or taller?" Push for genuine iteration.',
    },
    duration: { min: 15, max: 25 },
    setting: 'either',
    energyLevel: 'active',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child apply learning from their previous attempt?',
      'Did they measure and compare to their record?',
      'Did they show iterative thinking — trying something, assessing, trying again?',
    ],
    capabilityThreads: [ref('capabilityThread.M3', 'ct1'), ref('capabilityThread.E3', 'ct2')],
    status: 'published',
  },
]

// Kit C: Number Fluency (4)
const NM_NF = [
  {
    _id: 'activity.starter.nm-nf-counting-chain',
    _type: 'activity',
    title: 'Counting Chain',
    slug: slug('counting-chain'),
    approach: singleRef('approach.starter.nm-number-fluency'),
    instructions: blocks(
      'Count forward to 20 (or 50, or 100 for older children). Then count backward from 10 (or 20, or 50).',
      'How far can you go without a mistake? Try again tomorrow and see if you can go further.',
    ),
    facilitatorGuidance: {
      before: 'Set a starting target that is achievable but slightly challenging. If the child can already count to 20 easily, try 50 or backward from 20.',
      during: 'Count alongside them. If they make a mistake, note where and ask them to try again from 5 before that point rather than from the beginning.',
      challenges: 'Counting backward is significantly harder than counting forward. Start small — backward from 5, then 10 — and build gradually.',
    },
    duration: { min: 5, max: 10 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'visual',
    observationPrompts: [
      'How far could the child count forward without error?',
      'How far backward? Where did they tend to make mistakes?',
      'Did they show improvement on a second or third attempt?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-nf-number-bonds',
    _type: 'activity',
    title: 'Number Bonds',
    slug: slug('number-bonds'),
    approach: singleRef('approach.starter.nm-number-fluency'),
    instructions: blocks(
      'Using counters, fingers, or drawn dots, find all the ways to make 5: (1+4, 2+3, 5+0, and so on).',
      'Record each pair. When you\'ve found them all, try the same for 10.',
    ),
    facilitatorGuidance: {
      before: 'Have counters, buttons, or pennies available. A simple recording sheet — two columns — helps the child track which pairs they\'ve found.',
      during: 'Let the child discover the pairs through manipulation rather than recall. Ask: "How many here and how many there? Does that make 5?" Celebrate when they spot that 1+4 and 4+1 are related.',
      challenges: 'Children often miss 0+5 and 5+0. Ask: "Is there a way to make 5 with none on one side?" That\'s often a breakthrough moment.',
    },
    duration: { min: 10, max: 20 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'visual',
    observationPrompts: [
      'Did the child find all the number bond pairs for 5?',
      'Did they notice the symmetry (1+4 = 4+1)?',
      'Could they apply the same process to find bonds for 10?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-nf-addition-practice',
    _type: 'activity',
    title: 'Addition Practice',
    slug: slug('addition-practice'),
    approach: singleRef('approach.starter.nm-number-fluency'),
    instructions: blocks(
      'Roll two dice (or draw two number cards from a shuffled pack). Add them together. Say the answer as fast as you can.',
      'Do 10 rounds. Write down the sums. Are you getting faster? Which sums are easy and which are hard?',
    ),
    facilitatorGuidance: {
      before: 'Have two standard dice or a set of numbered cards 1–6. A pencil and paper for recording keeps the child engaged across 10 rounds.',
      during: 'The speed element is important but should feel fun, not pressured. Frame it as "beating your own time" rather than racing against anyone else.',
      challenges: 'Some children count on fingers for every sum, even familiar ones. After a few rounds, ask: "Can you try saying that one without counting? Just see if it\'s in your head."',
    },
    duration: { min: 10, max: 15 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'visual',
    observationPrompts: [
      'Which addition facts did the child recall instantly and which required counting?',
      'Did they show any improvement in speed or confidence across the 10 rounds?',
      'Did they identify which sums felt "hard" — a sign of genuine metacognition about their own knowledge?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-nf-show-someone',
    _type: 'activity',
    title: 'Show Someone What You Know',
    slug: slug('show-someone-what-you-know'),
    approach: singleRef('approach.starter.nm-number-fluency'),
    instructions: blocks(
      'Show someone what you know about numbers: "I can count to ___, I know that ___ + ___ = ___, and the hardest number fact I can do is ___."',
      'You can use objects, fingers, or just talking.',
    ),
    facilitatorGuidance: {
      before: 'Find a genuine audience — another parent, a sibling, a grandparent. The child explaining their own knowledge is both assessment and consolidation.',
      during: 'Let the child lead. Don\'t prompt with the answers. The gaps in their explanation are valuable information.',
      challenges: 'Some children are reluctant to "perform." Frame it as showing rather than testing: "I want to see what you\'ve been learning — you pick what to show me."',
    },
    duration: { min: 5, max: 10 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'narrative',
    observationPrompts: [
      'What did the child choose to demonstrate — what do they feel confident about?',
      'Did their explanation show genuine understanding or surface recall?',
      'Did the exercise reveal any gaps or misconceptions worth addressing?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1'), ref('capabilityThread.L1', 'ct2')],
    status: 'published',
  },
]

// Chunk A: Patterns Everywhere (3)
const NM_PT = [
  {
    _id: 'activity.starter.nm-pt-find-patterns',
    _type: 'activity',
    title: 'Find Patterns Around the House',
    slug: slug('find-patterns-around-the-house'),
    approach: singleRef('approach.starter.nm-patterns'),
    instructions: blocks(
      'Find patterns in your house — in tiles, fences, fabric, wallpaper, leaves, or brickwork.',
      'Draw or describe two of them. Could you continue either pattern? What comes next?',
    ),
    facilitatorGuidance: {
      before: 'No preparation. Patterns are everywhere once you start looking. Floors, textiles, and garden features are often rich sources.',
      during: 'For each pattern found, ask: "What\'s the repeating unit? If I covered part of it, could you continue it?" The extension question deepens the understanding.',
      challenges: 'Children sometimes confuse symmetry with pattern. That\'s fine — both are worth exploring. Ask: "Is this one repeating, or is it mirrored?"',
    },
    duration: { min: 15, max: 25 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'visual',
    observationPrompts: [
      'Did the child identify the repeating unit in each pattern?',
      'Could they extend a pattern correctly?',
      'Did they find patterns in unexpected places?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1'), ref('capabilityThread.C1', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-pt-make-pattern',
    _type: 'activity',
    title: 'Make Your Own Pattern',
    slug: slug('make-your-own-pattern'),
    approach: singleRef('approach.starter.nm-patterns'),
    instructions: blocks(
      'Make a pattern using objects — buttons, Lego pieces, food items, stones, or anything you can arrange.',
      'Can someone else continue your pattern? Can you make a more complex one they can still follow?',
    ),
    facilitatorGuidance: {
      before: 'Gather a collection of objects in at least two types or colours. The more variety, the more interesting the patterns can become.',
      during: 'Start simple and encourage complexity: "That\'s an AB pattern. Can you make an ABB pattern? Or one with three elements?" Build the language alongside the pattern.',
      challenges: 'Children sometimes make arrangements they find aesthetically pleasing but which have no repeating rule. Ask: "What\'s the rule? Can you tell me the pattern?"',
    },
    duration: { min: 15, max: 20 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'visual',
    observationPrompts: [
      'Did the child\'s pattern have a clear, consistent rule?',
      'Could another person continue it correctly?',
      'Did the child attempt a pattern more complex than a simple AB repeat?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1'), ref('capabilityThread.E3', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-pt-clap-rhythm',
    _type: 'activity',
    title: 'Clap a Rhythm Pattern',
    slug: slug('clap-a-rhythm-pattern'),
    approach: singleRef('approach.starter.nm-patterns'),
    instructions: blocks(
      'Clap a rhythm pattern — a sequence of loud and soft claps, fast and slow, or claps and stomps.',
      'Can someone copy it? Can you make it more complex and have them still follow?',
    ),
    facilitatorGuidance: {
      before: 'No materials needed. Works anywhere.',
      during: 'Model a simple pattern first: clap-clap-CLAP, clap-clap-CLAP. Then ask the child to make one. The challenge is making it regular enough to be a pattern rather than just a rhythm.',
      challenges: 'Children sometimes create something so complex that it can\'t be replicated. That\'s an interesting discovery: "Why is this one too hard to copy?"',
    },
    duration: { min: 10, max: 15 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'auditory',
    observationPrompts: [
      'Did the child create a pattern with a clear, repeating structure?',
      'Could they maintain it consistently across multiple repetitions?',
      'Did they adjust complexity in response to whether the other person could follow?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1'), ref('capabilityThread.L1', 'ct2')],
    status: 'published',
  },
]

// Chunk B: Estimation Games (2)
const NM_EG = [
  {
    _id: 'activity.starter.nm-eg-guess-first',
    _type: 'activity',
    title: 'Guess First',
    slug: slug('guess-first'),
    approach: singleRef('approach.starter.nm-estimation'),
    instructions: blocks(
      'Before measuring anything today, guess first. How many steps to the front door? How heavy is the apple? How long is the table?',
      'Then measure or check. How close were you? What helped you guess well?',
    ),
    facilitatorGuidance: {
      before: 'No preparation. Build this into a day as a habit rather than a standalone activity — guess before every measurement.',
      during: 'Record guesses before checking. Ask for a reason with every guess: "Why did you say 10?" The reasoning is more valuable than the number.',
      challenges: 'Some children refuse to guess because they\'re afraid of being wrong. Reframe: "The whole point is to see how close we can get — wrong guesses teach you just as much."',
    },
    duration: { min: 10, max: 15 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child offer a reason for each guess?',
      'Did their guesses improve in accuracy as the activity went on?',
      'Did they reflect on what made some guesses closer than others?',
    ],
    capabilityThreads: [ref('capabilityThread.M3', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-eg-jar-count',
    _type: 'activity',
    title: 'Guess the Jar',
    slug: slug('guess-the-jar'),
    approach: singleRef('approach.starter.nm-estimation'),
    instructions: blocks(
      'Fill a clear jar or container with small objects — buttons, coins, dried pasta, pebbles.',
      'Guess how many are inside. Then count them. How close? Try again with different objects.',
    ),
    facilitatorGuidance: {
      before: 'Use a container where the objects are partly visible. The guessing is more interesting if the child can see some of the contents.',
      during: 'Ask the child to explain their estimate: "How did you decide on that number?" Strategies like "I can see about 10 on this side, so maybe 40 total" are worth celebrating.',
      challenges: 'Counting a large number of small objects accurately is slow work. Make it methodical: group into tens before counting. The counting itself is part of the learning.',
    },
    duration: { min: 10, max: 20 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'visual',
    observationPrompts: [
      'Did the child use a strategy for their estimate, or just guess randomly?',
      'How close was their estimate to the actual count?',
      'Did they develop a better strategy for the second attempt?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    status: 'published',
  },
]

// Chunk C: Sorting and Classifying (3)
const NM_SC = [
  {
    _id: 'activity.starter.nm-sc-empty-drawer',
    _type: 'activity',
    title: 'Sort the Drawer',
    slug: slug('sort-the-drawer'),
    approach: singleRef('approach.starter.nm-sorting'),
    instructions: blocks(
      'Empty a drawer or container with a mixed collection of items. Sort the contents three different ways.',
      'Which way makes most sense? Which way creates the most useful categories?',
    ),
    facilitatorGuidance: {
      before: 'A junk drawer, a craft supplies box, or a kitchen utensil drawer all work well. The sorting rule must be chosen by the child.',
      during: 'After each sort, ask: "What\'s the rule? How did you decide which group each thing belongs to?" Three sorts is usually enough to surface a genuinely useful system.',
      challenges: 'Some objects resist easy categorisation. That\'s interesting: "Where does this go? Could it belong in more than one group?"',
    },
    duration: { min: 10, max: 20 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child apply each sorting rule consistently?',
      'Could they articulate why each rule made sense?',
      'Did they evaluate which sort was most useful?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1'), ref('capabilityThread.S1', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-sc-two-attributes',
    _type: 'activity',
    title: 'Sort by Two Things at Once',
    slug: slug('sort-by-two-things-at-once'),
    approach: singleRef('approach.starter.nm-sorting'),
    instructions: blocks(
      'Take a mixed collection and try to sort it by two attributes at the same time — big AND red, small AND blue, smooth AND round.',
      'How many groups do you end up with? Which group is biggest? Are there any objects that don\'t fit anywhere?',
    ),
    facilitatorGuidance: {
      before: 'Buttons, Lego bricks, or a mixed bag of small household objects work well. Two attributes to sort by means at least four possible groups.',
      during: 'This is genuinely harder than single-attribute sorting. Let the child work through the logic slowly. A simple grid on paper can help: big/small as rows, red/blue as columns.',
      challenges: 'Objects that have neither attribute (not big or small — medium? not red or blue?) create useful confusion. "Where does this one go?" is a great thinking question.',
    },
    duration: { min: 10, max: 20 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'visual',
    observationPrompts: [
      'Did the child maintain both sorting rules simultaneously?',
      'How did they handle objects that fell into ambiguous categories?',
      'Did they correctly identify which group was largest?',
    ],
    capabilityThreads: [
      ref('capabilityThread.M1', 'ct1'),
      ref('capabilityThread.S1', 'ct2'),
      ref('capabilityThread.E3', 'ct3'),
    ],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-sc-shape-hunt',
    _type: 'activity',
    title: 'Shape Hunt',
    slug: slug('shape-hunt'),
    approach: singleRef('approach.starter.nm-sorting'),
    instructions: blocks(
      'Find every circle you can see in one room. Count them. Then find every square. Then every triangle.',
      'Which shape wins — which appears most often? Are there any shapes with more than four sides?',
    ),
    facilitatorGuidance: {
      before: 'No preparation. Any room will do — the more varied the better.',
      during: 'Encourage the child to look at edges, not just flat surfaces: "Is the rim of the cup a circle?" "What shape is the door frame?"',
      challenges: 'Some shapes are ambiguous — an oval vs. a circle, a rectangle vs. a square. These edge cases are worth discussing rather than resolving too quickly.',
    },
    duration: { min: 10, max: 15 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'visual',
    observationPrompts: [
      'Did the child look carefully for less obvious examples of each shape?',
      'Did they count accurately?',
      'Did they notice shapes with more than four sides?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1')],
    status: 'published',
  },
]

// Loose: Number Moments (8)
const NM_NM = [
  {
    _id: 'activity.starter.nm-nm-count-steps',
    _type: 'activity',
    title: 'Count the Steps',
    slug: slug('count-the-steps'),
    approach: singleRef('approach.starter.nm-number-moments'),
    instructions: blocks('Count the steps from your bed to the front door. Guess first, then count.'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'The guess before counting is the most important part.',
      challenges: 'Children sometimes lose count and want to start over. That\'s fine — try again from halfway if needed.',
    },
    duration: { min: 3, max: 3 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child guess before counting?',
      'Were they able to count without losing track?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-nm-biggest-number',
    _type: 'activity',
    title: 'Biggest Number in the House',
    slug: slug('biggest-number-in-the-house'),
    approach: singleRef('approach.starter.nm-number-moments'),
    instructions: blocks('What\'s the biggest number you can find written on something in your house? Where is it?'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'Guide the child to look at unexpected places: the back of appliances, expiry dates, barcodes.',
      challenges: 'A barcode number is technically the largest number in most houses. Discussing whether that "counts" is a fun tangent.',
    },
    duration: { min: 5, max: 5 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'visual',
    observationPrompts: [
      'Where did the child find their number?',
      'Did they compare multiple candidates before deciding?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-nm-count-red',
    _type: 'activity',
    title: 'Count the Red Things',
    slug: slug('count-the-red-things'),
    approach: singleRef('approach.starter.nm-number-moments'),
    instructions: blocks('How many red things are in this room? Guess first, then count every red thing you can see.'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'The guess before counting is key. Ask for a reason: "Why did you guess 7?"',
      challenges: 'Children often miss small or partial red items. "What about the tiny red bit on that label? Does that count?"',
    },
    duration: { min: 5, max: 5 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'visual',
    observationPrompts: [
      'Did the child count systematically rather than randomly?',
      'How close was their guess to the actual count?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-nm-heavier',
    _type: 'activity',
    title: 'Which Is Heavier',
    slug: slug('which-is-heavier'),
    approach: singleRef('approach.starter.nm-number-moments'),
    instructions: blocks('Hold a book in one hand and a shoe in the other. Which feels heavier? Guess — then check with kitchen scales if you have them.'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'Swap hands after the first guess: "Does it still feel heavier in the other hand?" Then check with scales if available.',
      challenges: 'Without scales, the answer is the guess. That\'s fine — talk about how reliable our hands are as measuring tools.',
    },
    duration: { min: 5, max: 5 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child make a reasoned guess based on feel?',
      'Were they surprised by the result?',
    ],
    capabilityThreads: [ref('capabilityThread.M3', 'ct1'), ref('capabilityThread.S2', 'ct2')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-nm-letterbox-time',
    _type: 'activity',
    title: 'Time to the Letterbox',
    slug: slug('time-to-the-letterbox'),
    approach: singleRef('approach.starter.nm-number-moments'),
    instructions: blocks('How long does it take to walk to the letterbox and back? Count "one-Mississippi, two-Mississippi" as you go.'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'Count alongside the child. Compare: "How long if you walk faster? How long if you walk slowly?"',
      challenges: 'Children often rush the counting. Model a steady one-per-second pace.',
    },
    duration: { min: 3, max: 5 },
    setting: 'outdoor',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child count at a consistent pace?',
      'Did they connect time-counting to distance in any way?',
    ],
    capabilityThreads: [ref('capabilityThread.M3', 'ct1')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-nm-longer-shorter',
    _type: 'activity',
    title: 'Longer and Shorter',
    slug: slug('longer-and-shorter'),
    approach: singleRef('approach.starter.nm-number-moments'),
    instructions: blocks('Find something longer than your arm and something shorter than your hand. You have 3 minutes.'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'Check each item found by direct comparison with arm or hand. "Lay your arm alongside it — is it really longer?"',
      challenges: 'The hand/arm benchmark shifts if the child uses the wrong hand or an extended position. Be consistent about the measuring posture.',
    },
    duration: { min: 3, max: 5 },
    setting: 'either',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child verify each find using direct comparison?',
      'Did they look creatively, or choose the most obvious options?',
    ],
    capabilityThreads: [ref('capabilityThread.M3', 'ct1')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-nm-share-snack',
    _type: 'activity',
    title: 'Share the Snack',
    slug: slug('share-the-snack'),
    approach: singleRef('approach.starter.nm-number-moments'),
    instructions: blocks('Share a snack equally between two people. What if there\'s one left over? What if there are three people?'),
    facilitatorGuidance: {
      before: 'Use an actual snack — crackers, grapes, or anything divisible.',
      during: 'Let the child physically distribute the items. The "one left over" question is the interesting one. "Is it fair if someone gets one more?"',
      challenges: 'Children often just give the extra to themselves. Ask: "Is there a fair way to handle the leftover?" This can introduce the idea of halving or taking turns.',
    },
    duration: { min: 5, max: 5 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'Did the child distribute items equally?',
      'How did they reason about the remainder?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1')],
    status: 'published',
  },
  {
    _id: 'activity.starter.nm-nm-mental-maths',
    _type: 'activity',
    title: 'Mental Maths Challenge',
    slug: slug('mental-maths-challenge'),
    approach: singleRef('approach.starter.nm-number-moments'),
    instructions: blocks('What\'s 7 + 5? Work it out in your head. Then 8 + 6. Then make up one of your own to challenge someone else.'),
    facilitatorGuidance: {
      before: 'No preparation.',
      during: 'Allow thinking time. Don\'t jump in with the answer — let the child work it through. Making up their own question is the most revealing part.',
      challenges: 'If 7+5 is too hard, start with 3+4 or 5+5. If it\'s too easy, move to 13+7 or 25+5.',
    },
    duration: { min: 3, max: 3 },
    setting: 'either',
    energyLevel: 'calm',
    modality: 'visual',
    observationPrompts: [
      'Which facts did the child know instantly and which required working out?',
      'What sum did they choose to set as a challenge?',
    ],
    capabilityThreads: [ref('capabilityThread.M1', 'ct1')],
    status: 'published',
  },
]

const NM_ACTIVITIES = [...NM_KM, ...NM_BM, ...NM_NF, ...NM_PT, ...NM_EG, ...NM_SC, ...NM_NM]

const ALL_ACTIVITIES = [...WLO_ACTIVITIES, ...STS_ACTIVITIES, ...NM_ACTIVITIES]

// ─── Approaches ───────────────────────────────────────────────────────────────

const APPROACHES = [
  // WLO
  {
    _id: 'approach.starter.wlo-creature-watch',
    _type: 'approach',
    title: 'Creature Watch',
    slug: slug('creature-watch'),
    module: singleRef('module.starter.what-lives-outside'),
    modality: 'exploratory',
    description: 'Sustained observation of a single creature across multiple encounters. Find, observe, return, compare, record.',
    activities: [
      ref('activity.starter.wlo-cw-find-and-watch', 'a1'),
      ref('activity.starter.wlo-cw-return-visit', 'a2'),
      ref('activity.starter.wlo-cw-different-creature', 'a3'),
      ref('activity.starter.wlo-cw-draw-describe', 'a4'),
      ref('activity.starter.wlo-cw-surprising-behaviour', 'a5'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.wlo-plant-life',
    _type: 'approach',
    title: 'Plant Life',
    slug: slug('plant-life'),
    module: singleRef('module.starter.what-lives-outside'),
    modality: 'exploratory',
    description: 'Observation of plants over time — growth, change, response to conditions. Slower timescale than creature watching.',
    activities: [
      ref('activity.starter.wlo-pl-three-plants', 'a1'),
      ref('activity.starter.wlo-pl-check-over-time', 'a2'),
      ref('activity.starter.wlo-pl-same-plant-two-spots', 'a3'),
      ref('activity.starter.wlo-pl-record-change', 'a4'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.wlo-sensory-walks',
    _type: 'approach',
    title: 'Sensory Walks',
    slug: slug('sensory-walks'),
    module: singleRef('module.starter.what-lives-outside'),
    modality: 'kinesthetic',
    description: 'Observation of the outdoors through different senses. Three independent walks, each focusing on one sense.',
    activities: [
      ref('activity.starter.wlo-sw-sound-walk', 'a1'),
      ref('activity.starter.wlo-sw-smell-walk', 'a2'),
      ref('activity.starter.wlo-sw-texture-walk', 'a3'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.wlo-weather-watching',
    _type: 'approach',
    title: 'Weather Watching',
    slug: slug('weather-watching'),
    module: singleRef('module.starter.what-lives-outside'),
    modality: 'exploratory',
    description: 'Sky observation, weather prediction, and noticing change over the course of a day.',
    activities: [
      ref('activity.starter.wlo-ww-sky-today', 'a1'),
      ref('activity.starter.wlo-ww-three-checks', 'a2'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.wlo-tiny-worlds',
    _type: 'approach',
    title: 'Tiny Worlds',
    slug: slug('tiny-worlds'),
    module: singleRef('module.starter.what-lives-outside'),
    modality: 'exploratory',
    description: 'Close-up observation of small ecosystems and miniature life. Getting low and looking carefully.',
    activities: [
      ref('activity.starter.wlo-tw-under-a-rock', 'a1'),
      ref('activity.starter.wlo-tw-square-metre', 'a2'),
      ref('activity.starter.wlo-tw-smallest-biggest', 'a3'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.wlo-quick-nature',
    _type: 'approach',
    title: 'Quick Nature Moments',
    slug: slug('quick-nature-moments'),
    module: singleRef('module.starter.what-lives-outside'),
    modality: 'kinesthetic',
    description: 'Standalone one-off nature observations. Five minutes or less. No preparation. Log it and move on.',
    activities: [
      ref('activity.starter.wlo-qn-first-thing', 'a1'),
      ref('activity.starter.wlo-qn-new-thing', 'a2'),
      ref('activity.starter.wlo-qn-bird-count', 'a3'),
      ref('activity.starter.wlo-qn-same-colour', 'a4'),
      ref('activity.starter.wlo-qn-touch-leaf', 'a5'),
      ref('activity.starter.wlo-qn-symmetry', 'a6'),
      ref('activity.starter.wlo-qn-furthest-living', 'a7'),
      ref('activity.starter.wlo-qn-lie-look-up', 'a8'),
    ],
    status: 'published',
  },
  // STS
  {
    _id: 'approach.starter.sts-deep-read',
    _type: 'approach',
    title: 'Deep Read',
    slug: slug('deep-read'),
    module: singleRef('module.starter.stories-that-stay'),
    modality: 'auditory',
    description: 'One story, multiple encounters and response modes. Listen, respond, return, go deeper, share.',
    activities: [
      ref('activity.starter.sts-dr-first-read', 'a1'),
      ref('activity.starter.sts-dr-re-read', 'a2'),
      ref('activity.starter.sts-dr-draw-favourite', 'a3'),
      ref('activity.starter.sts-dr-act-it-out', 'a4'),
      ref('activity.starter.sts-dr-tell-someone', 'a5'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.sts-story-into-making',
    _type: 'approach',
    title: 'Story into Making',
    slug: slug('story-into-making'),
    module: singleRef('module.starter.stories-that-stay'),
    modality: 'kinesthetic',
    description: 'Responding to stories through creative acts. Hear, make, extend, share.',
    activities: [
      ref('activity.starter.sts-sm-make-something', 'a1'),
      ref('activity.starter.sts-sm-new-ending', 'a2'),
      ref('activity.starter.sts-sm-puppet', 'a3'),
      ref('activity.starter.sts-sm-share-story', 'a4'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.sts-story-types',
    _type: 'approach',
    title: 'Story Types',
    slug: slug('story-types'),
    module: singleRef('module.starter.stories-that-stay'),
    modality: 'narrative',
    description: 'Different genres — fable, fairy tale, poetry. Three independent activities, each exploring a different literary form.',
    activities: [
      ref('activity.starter.sts-st-fable', 'a1'),
      ref('activity.starter.sts-st-fairy-tale', 'a2'),
      ref('activity.starter.sts-st-poem', 'a3'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.sts-storytelling-without-books',
    _type: 'approach',
    title: 'Storytelling Without Books',
    slug: slug('storytelling-without-books'),
    module: singleRef('module.starter.stories-that-stay'),
    modality: 'narrative',
    description: 'Oral storytelling and collaborative narrative. No books, no reading materials needed.',
    activities: [
      ref('activity.starter.sts-sb-own-story', 'a1'),
      ref('activity.starter.sts-sb-round-robin', 'a2'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.sts-listening-skills',
    _type: 'approach',
    title: 'Listening Skills',
    slug: slug('listening-skills'),
    module: singleRef('module.starter.stories-that-stay'),
    modality: 'auditory',
    description: 'Structured listening comprehension — retelling, spotting twists, comparing texts. Building the skills beneath reading.',
    activities: [
      ref('activity.starter.sts-ls-retell', 'a1'),
      ref('activity.starter.sts-ls-surprise-twist', 'a2'),
      ref('activity.starter.sts-ls-compare-stories', 'a3'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.sts-story-sparks',
    _type: 'approach',
    title: 'Story Sparks',
    slug: slug('story-sparks'),
    module: singleRef('module.starter.stories-that-stay'),
    modality: 'narrative',
    description: 'Standalone one-off story and language moments. Quick, low-commitment, high-yield.',
    activities: [
      ref('activity.starter.sts-ss-one-page', 'a1'),
      ref('activity.starter.sts-ss-day-as-story', 'a2'),
      ref('activity.starter.sts-ss-best-story', 'a3'),
      ref('activity.starter.sts-ss-make-character', 'a4'),
      ref('activity.starter.sts-ss-picture-story', 'a5'),
      ref('activity.starter.sts-ss-whisper-story', 'a6'),
      ref('activity.starter.sts-ss-villain-hero', 'a7'),
      ref('activity.starter.sts-ss-upside-down', 'a8'),
    ],
    status: 'published',
  },
  // NM
  {
    _id: 'approach.starter.nm-kitchen-maths',
    _type: 'approach',
    title: 'Kitchen Maths',
    slug: slug('kitchen-maths'),
    module: singleRef('module.starter.numbers-and-measure'),
    modality: 'kinesthetic',
    description: 'Cooking as the context for number, measurement, and fractions. Count, measure, halve, double, reflect.',
    activities: [
      ref('activity.starter.nm-km-make-together', 'a1'),
      ref('activity.starter.nm-km-double', 'a2'),
      ref('activity.starter.nm-km-halve', 'a3'),
      ref('activity.starter.nm-km-sort-pantry', 'a4'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.nm-building-measuring',
    _type: 'approach',
    title: 'Building and Measuring',
    slug: slug('building-and-measuring'),
    module: singleRef('module.starter.numbers-and-measure'),
    modality: 'kinesthetic',
    description: 'Construction as context for spatial reasoning, measurement, and estimation. Guess, build, measure, compare, improve.',
    activities: [
      ref('activity.starter.nm-bm-tallest-tower', 'a1'),
      ref('activity.starter.nm-bm-hand-foot-ruler', 'a2'),
      ref('activity.starter.nm-bm-arm-length', 'a3'),
      ref('activity.starter.nm-bm-two-bridges', 'a4'),
      ref('activity.starter.nm-bm-beat-record', 'a5'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.nm-number-fluency',
    _type: 'approach',
    title: 'Number Fluency',
    slug: slug('number-fluency'),
    module: singleRef('module.starter.numbers-and-measure'),
    modality: 'visual',
    description: 'Structured number work — counting sequences, number bonds, addition facts. Count, combine, practise, demonstrate.',
    activities: [
      ref('activity.starter.nm-nf-counting-chain', 'a1'),
      ref('activity.starter.nm-nf-number-bonds', 'a2'),
      ref('activity.starter.nm-nf-addition-practice', 'a3'),
      ref('activity.starter.nm-nf-show-someone', 'a4'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.nm-patterns',
    _type: 'approach',
    title: 'Patterns Everywhere',
    slug: slug('patterns-everywhere'),
    module: singleRef('module.starter.numbers-and-measure'),
    modality: 'visual',
    description: 'Finding, making, and extending patterns in the world and through objects and sound.',
    activities: [
      ref('activity.starter.nm-pt-find-patterns', 'a1'),
      ref('activity.starter.nm-pt-make-pattern', 'a2'),
      ref('activity.starter.nm-pt-clap-rhythm', 'a3'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.nm-estimation',
    _type: 'approach',
    title: 'Estimation Games',
    slug: slug('estimation-games'),
    module: singleRef('module.starter.numbers-and-measure'),
    modality: 'kinesthetic',
    description: 'Guessing before measuring. Developing number intuition and the habit of estimating first.',
    activities: [
      ref('activity.starter.nm-eg-guess-first', 'a1'),
      ref('activity.starter.nm-eg-jar-count', 'a2'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.nm-sorting',
    _type: 'approach',
    title: 'Sorting and Classifying',
    slug: slug('sorting-and-classifying'),
    module: singleRef('module.starter.numbers-and-measure'),
    modality: 'kinesthetic',
    description: 'Organising objects by attributes. Mathematical thinking through categorisation.',
    activities: [
      ref('activity.starter.nm-sc-empty-drawer', 'a1'),
      ref('activity.starter.nm-sc-two-attributes', 'a2'),
      ref('activity.starter.nm-sc-shape-hunt', 'a3'),
    ],
    status: 'published',
  },
  {
    _id: 'approach.starter.nm-number-moments',
    _type: 'approach',
    title: 'Number Moments',
    slug: slug('number-moments'),
    module: singleRef('module.starter.numbers-and-measure'),
    modality: 'kinesthetic',
    description: 'Standalone one-off number encounters. Three to five minutes. No preparation. Log it and move on.',
    activities: [
      ref('activity.starter.nm-nm-count-steps', 'a1'),
      ref('activity.starter.nm-nm-biggest-number', 'a2'),
      ref('activity.starter.nm-nm-count-red', 'a3'),
      ref('activity.starter.nm-nm-heavier', 'a4'),
      ref('activity.starter.nm-nm-letterbox-time', 'a5'),
      ref('activity.starter.nm-nm-longer-shorter', 'a6'),
      ref('activity.starter.nm-nm-share-snack', 'a7'),
      ref('activity.starter.nm-nm-mental-maths', 'a8'),
    ],
    status: 'published',
  },
]

// ─── Modules ──────────────────────────────────────────────────────────────────

const MODULES = [
  {
    _id: 'module.starter.what-lives-outside',
    _type: 'module',
    title: 'What Lives Outside',
    slug: slug('what-lives-outside'),
    targetUnderstanding:
      'Living things respond to their environment in observable ways, and careful watching reveals patterns that are not obvious at first glance.',
    understandingIndicators: {
      emerging:
        'Your child is beginning to notice the living world around them. They are learning to slow down and look — a foundational skill that underpins all scientific thinking.',
      developing:
        'Your child is becoming a careful observer. They are starting to compare observations, describe with precision, and return to subjects to notice change over time.',
      demonstrating:
        'Your child observes the natural world with genuine skill. They notice patterns, make predictions, and communicate what they have found — to you, to others, and to themselves.',
    },
    approaches: [
      ref('approach.starter.wlo-creature-watch', 'ap1'),
      ref('approach.starter.wlo-plant-life', 'ap2'),
      ref('approach.starter.wlo-sensory-walks', 'ap3'),
      ref('approach.starter.wlo-weather-watching', 'ap4'),
      ref('approach.starter.wlo-tiny-worlds', 'ap5'),
      ref('approach.starter.wlo-quick-nature', 'ap6'),
    ],
    subjects: ['science'],
    ageRange: { min: 4, max: 8 },
    duration: { min: 5, max: 30 },
    capabilityThreads: [
      ref('capabilityThread.S1', 'ct1'),
      ref('capabilityThread.S2', 'ct2'),
      ref('capabilityThread.L1', 'ct3'),
      ref('capabilityThread.C1', 'ct4'),
      ref('capabilityThread.E1', 'ct5'),
    ],
    badges: [
      ref('badge.starter.keen-observer', 'b1'),
      ref('badge.starter.nature-recorder', 'b2'),
    ],
    status: 'published',
  },
  {
    _id: 'module.starter.stories-that-stay',
    _type: 'module',
    title: 'Stories That Stay',
    slug: slug('stories-that-stay'),
    targetUnderstanding:
      'Stories carry meaning beyond the words — listening carefully and responding builds comprehension, empathy, and the ability to express ideas.',
    understandingIndicators: {
      emerging:
        'Your child is learning to listen to and enjoy stories. They are building the attention and memory that deeper comprehension requires.',
      developing:
        'Your child engages actively with stories — retelling, responding, noticing. They are building genuine comprehension skills.',
      demonstrating:
        'Your child thinks about stories with real depth. They narrate well, connect stories to life, and form their own literary opinions.',
    },
    approaches: [
      ref('approach.starter.sts-deep-read', 'ap1'),
      ref('approach.starter.sts-story-into-making', 'ap2'),
      ref('approach.starter.sts-story-types', 'ap3'),
      ref('approach.starter.sts-storytelling-without-books', 'ap4'),
      ref('approach.starter.sts-listening-skills', 'ap5'),
      ref('approach.starter.sts-story-sparks', 'ap6'),
    ],
    subjects: ['english'],
    ageRange: { min: 4, max: 8 },
    duration: { min: 5, max: 30 },
    capabilityThreads: [
      ref('capabilityThread.L1', 'ct1'),
      ref('capabilityThread.L3', 'ct2'),
      ref('capabilityThread.L9', 'ct3'),
      ref('capabilityThread.C1', 'ct4'),
      ref('capabilityThread.C3', 'ct5'),
      ref('capabilityThread.E1', 'ct6'),
    ],
    badges: [
      ref('badge.starter.story-listener', 'b1'),
      ref('badge.starter.story-maker', 'b2'),
    ],
    status: 'published',
  },
  {
    _id: 'module.starter.numbers-and-measure',
    _type: 'module',
    title: 'Numbers and Measure',
    slug: slug('numbers-and-measure'),
    targetUnderstanding:
      'Mathematical thinking includes both concrete, hands-on experience with real objects and the ability to work with numbers fluently — counting, calculating, recognising patterns, and building number facts through practice.',
    understandingIndicators: {
      emerging:
        'Your child is building their first mathematical foundations — counting, comparing, and beginning to measure the world around them.',
      developing:
        'Your child is gaining real number confidence. They are building facts, measuring with intention, and starting to see maths in everyday life.',
      demonstrating:
        'Your child thinks mathematically. They work with numbers fluently, estimate and check, and apply what they know to new problems.',
    },
    approaches: [
      ref('approach.starter.nm-kitchen-maths', 'ap1'),
      ref('approach.starter.nm-building-measuring', 'ap2'),
      ref('approach.starter.nm-number-fluency', 'ap3'),
      ref('approach.starter.nm-patterns', 'ap4'),
      ref('approach.starter.nm-estimation', 'ap5'),
      ref('approach.starter.nm-sorting', 'ap6'),
      ref('approach.starter.nm-number-moments', 'ap7'),
    ],
    subjects: ['mathematics'],
    ageRange: { min: 4, max: 8 },
    duration: { min: 3, max: 45 },
    capabilityThreads: [
      ref('capabilityThread.M1', 'ct1'),
      ref('capabilityThread.M3', 'ct2'),
      ref('capabilityThread.S1', 'ct3'),
      ref('capabilityThread.S2', 'ct4'),
      ref('capabilityThread.E3', 'ct5'),
    ],
    badges: [
      ref('badge.starter.number-explorer', 'b1'),
      ref('badge.starter.fact-builder', 'b2'),
    ],
    status: 'published',
  },
]

// ─── Pack ─────────────────────────────────────────────────────────────────────

const PACK = {
  _id: 'pack.starter',
  _type: 'pack',
  title: 'Starter Pack',
  slug: slug('starter-pack'),
  description:
    'Your first steps with Hearth. A rich collection of activities across science, literacy, and mathematics — designed to work with any teaching approach and seed your family\'s Capabilities Constellation.',
  modules: [
    ref('module.starter.what-lives-outside', 'm1'),
    ref('module.starter.stories-that-stay', 'm2'),
    ref('module.starter.numbers-and-measure', 'm3'),
  ],
  badges: [
    ref('badge.starter.keen-observer', 'b1'),
    ref('badge.starter.nature-recorder', 'b2'),
    ref('badge.starter.story-listener', 'b3'),
    ref('badge.starter.story-maker', 'b4'),
    ref('badge.starter.number-explorer', 'b5'),
    ref('badge.starter.fact-builder', 'b6'),
  ],
  ageRange: { min: 4, max: 8 },
  subjects: ['english', 'mathematics', 'science'],
  moduleCount: 3,
  totalActivities: 79,
  worldview: 'neutral',
  availability: 'included',
  creator: 'hearth-team',
  version: '1.0.0',
  status: 'published',
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const total =
    THREADS.length +
    BADGES.length +
    ALL_ACTIVITIES.length +
    APPROACHES.length +
    MODULES.length +
    1

  console.log(`Seeding ${total} documents to dataset "${client.config().dataset}"…\n`)

  console.log(`  Capability threads (${THREADS.length})…`)
  for (const doc of THREADS) await client.createOrReplace(doc)

  console.log(`  Badges (${BADGES.length})…`)
  for (const doc of BADGES) await client.createOrReplace(doc)

  console.log(`  Activities (${ALL_ACTIVITIES.length})…`)
  for (const doc of ALL_ACTIVITIES) await client.createOrReplace(doc as { _id: string; _type: string; [key: string]: unknown })

  console.log(`  Approaches (${APPROACHES.length})…`)
  for (const doc of APPROACHES) await client.createOrReplace(doc as { _id: string; _type: string; [key: string]: unknown })

  console.log(`  Modules (${MODULES.length})…`)
  for (const doc of MODULES) await client.createOrReplace(doc as { _id: string; _type: string; [key: string]: unknown })

  console.log('  Pack (1)…')
  await client.createOrReplace(PACK as { _id: string; _type: string; [key: string]: unknown })

  console.log(`\nDone. ${total} documents seeded.`)
  console.log('\nVerify:')
  console.log('  - Sanity Studio (/admin) → all document types populated')
  console.log('  - Marketplace shows "Starter Pack" with 3 modules, 79 activities')
  console.log('  - Re-running this script produces no errors (idempotent)')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
