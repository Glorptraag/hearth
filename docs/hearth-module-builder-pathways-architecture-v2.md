# Hearth Module Builder — Multi-Pathway Architecture Specification

> **Version:** 2 | **Date:** 2026-03-16
> **Status:** Architecture specification — five-pathway system replacing the six-pathway v1 spec
> **Predecessor:** `hearth-module-builder-pathways-architecture-v1.md` (six-pathway system, 2026-03-10)
> **Predecessor:** `module-builder-v3-design-spec.md` (parent-facing lightweight builder, single-path)
> **Predecessor:** `module-builder-implementation-brief.md` (professional UbD 7-stage pipeline)
> **Runner alignment:** `hearth-module-experience-v2.html`
> **AI layer dependency:** `Hearth_AI_Intelligence_Layer_Architecture.md`
> **Capability thread reference:** `hearth-capability-thread-library.md`
> **Entry selector prototype:** `hearth-module-builder-v4.html` (to be updated for five-path layout)

---

## Changelog from v1

**Structural change: six paths → five paths.** Understanding-First and Capability-Targeted merged into a single "Goal-Forward" path with two modes (aspiration mode and capability mode). The merge was driven by the observation that both paths share the same cognitive starting point — the parent arrives with a forward-looking educational target — and differ only in abstraction level. The merged path detects which mode to activate based on whether the parent's input maps to a capability thread.

**Card language finalised** across all paths. Parent voice + system promise pattern: each card names what the parent brings (label) and what the system will do (hint). Transition CTAs follow the same voice.

**Schema updated:** `createdVia` enum reduced from six values to five. `sourceCapability` now populated by Goal-Forward capability mode (was Capability-Targeted only). New `sourceGoal` field captures aspiration-mode text.

**Boundary definitions added** between every adjacent path pair, with cross-path redirect nudges specified.

**Material-Anchored usage intent expanded:** Added "🧠 Memorise / learn by heart" chip with authored session templates for Book + Memorise and Audio + Memorise. Serves scripture memory, poetry recitation, catechism, and similar patterns.

**Session template library fully specced:** Coverage matrix for 7 resource types × 8 usage intents. 26 authored templates with full step structures and observation hints. Storage in application code for MVP, migrating to Sanity post-launch. Template selection logic and authoring effort estimated.

**Skeleton library architecture defined:** Three-tier coverage strategy (curated thread-specific → domain-generic → AI-generated). 138 Phase 1 skeleton records. Schema, selection logic, authoring pipeline, and Sanity CMS storage decision documented.

**Entry selector fallback added:** "Not sure where to start?" link to Activity Discovery for parents who arrive without a starting point.

**100-scenario stress test completed** (documented separately in `stress-test-scenarios.md`). 86% clear or lean routing. Key findings: topic fascinations need Inquiry broadening (parked for application), "inspire me" parents redirected to Activity Discovery, memorisation intent added, social-emotional thread coverage flagged for audit.

**Implementation sequencing updated** for five paths.

---

## 1. Purpose & Problem Statement

### 1.1 The Problem

Module Builder v3 solved one thing well: letting a parent who thinks in *steps* capture a procedure as a module in under 5 minutes. But "I have steps to follow" is only one of the cognitive entry points parents arrive at when they want to create or formalise a learning experience. Others arrive with a resource they love, a question their child asked, a gap they've noticed, or scattered logs they want to consolidate. Forcing all of these starting points through a single "list your steps" interface means either the parent does mental translation work the system should handle, or they abandon the builder entirely.

### 1.2 The Solution

Five distinct entry pathways, each designed around a specific cognitive starting point. Each pathway asks different questions, collects different initial inputs, and uses AI inference differently — but all five produce the identical universal module schema that the Module Experience runner consumes.

The metaphor: five ramps onto the same road. The ramps have different gradients and approaches. The road is one road.

### 1.3 Design Principles

**Meet the parent where their thinking starts.** Don't ask them to translate their mental model into ours. If they're holding a book, ask about the book. If they have a question, ask about the question.

**Infer what they can't articulate.** Most parents can't write a formal learning intention or map capability threads. The system does this from whatever the parent *does* naturally provide — a resource description, a driving question, a process description, their own logged observations.

**Every path produces educational spine.** The invisible upgrade: parents who would never design backward from understanding goals still end up with modules that have proper `targetUnderstanding` statements, observation prompts, and capability thread mapping — because the system generated those fields from the parent's natural input.

**5-minute rule still applies.** Each pathway's entry screen collects its path-specific inputs quickly. The shared editing view that follows is the same lightweight v3-style single-page layout, pre-populated based on the entry path. Total time budget remains under 5 minutes.

**Philosophy-neutral at all layers.** Entry paths don't assume pedagogy. A Charlotte Mason parent and an Unschooling parent using the Material-Anchored path both describe their resource; the system generates philosophy-neutral module content that the runtime overlay system interprets through their family's lens.

### 1.4 The Five-Path System as a Coherent Whole

Each path exists because a parent arrives in a different cognitive state — not a different goal (they all want to create a module), but a different relationship to the learning they're about to formalise. The system's value proposition per path is always the same: "You bring what you have, we reveal the educational structure you couldn't see." What differs is what the parent brings and what the system has to infer.

| Path | Parent brings | System infers | Direction of inference |
|------|--------------|---------------|----------------------|
| Material-Anchored | A resource + excitement about it | Steps, understanding, capabilities | Down from resource to activity |
| Process | A procedure they already know | Understanding, capabilities, observation prompts | Up from steps to educational spine |
| Inquiry | A child's question | Understanding (reverse-engineered), investigation structure, steps | Backward from question to conceptual goal |
| Retrospective Lift | Nothing — system brings the data | Coherent module from scattered evidence | Synthesis across existing data points |
| Goal-Forward | A learning target (conceptual or curriculum-aligned) | Activities, steps, materials — the *how* | Forward from target to concrete experience |

The entry selector's visual layout reflects a gradient: the "Most natural" section holds paths where parents bring concrete, tangible inputs. Moving down, inputs become more abstract and the system does more work. This ordering helps parents self-select without needing to understand the architectural differences.

---

## 2. Universal Module Schema

All five paths produce the same output structure. This is the contract between the builder and the runner.

```javascript
{
  // === IDENTITY ===
  id: String,                    // Generated at creation
  title: String,                 // Required
  description: String,           // Required (1-2 sentences)
  createdVia: String,            // 'material' | 'process' | 'inquiry' | 'retrospective' | 'goal'
  createdAt: DateTime,
  updatedAt: DateTime,
  status: 'draft' | 'complete',

  // === CONTEXT ===
  duration: Number,              // Minutes (dropdown: 15/30/45/60/90/120/180/360)
  setting: 'either' | 'indoor' | 'outdoor',
  ageRange: {                    // Optional — parent modules often omit
    min: Number,
    max: Number,
  },

  // === THE STEPS ===
  steps: [{
    id: String,
    title: String,               // Required
    instructions: String,        // Required
    sayThis: String,             // Optional facilitator prompt
    observationHint: String,     // Optional "watch for this" per step — AI can populate
    materials: String[],         // Optional per-step materials (denormalised from materials list)
  }],

  // === MATERIALS ===
  materials: [{
    id: String,
    name: String,
    alternative: String,         // Optional substitute
    isCore: Boolean,             // true = required, false = nice-to-have
  }],

  // === THE LEARNING (educational spine) ===
  targetUnderstanding: String,   // What are they learning? (parent language or AI-inferred)
  watchFor: String,              // Signs it's working (observation prompts)
  pivot: String,                 // If it's not landing (adaptation guidance)

  // === CAPABILITY MAPPING (optional, AI-enrichable) ===
  capabilities: [{
    threadId: String,            // e.g., 'S5', 'M1', 'EF4'
    confidence: 'explicit' | 'inferred',  // Parent tagged vs AI suggested
  }],

  // === CONNECTIONS ===
  prereqs: String[],             // Module IDs — user's own modules only

  // === PATH-SPECIFIC PROVENANCE ===
  sourceResource: {              // Only populated by Material-Anchored path
    title: String,
    type: 'book' | 'documentary' | 'kit' | 'app' | 'place' | 'card' | 'website' | 'other',
    description: String,
  } | null,
  sourceLogs: String[] | null,   // Learning entry IDs — only populated by Retrospective Lift path
  sourceQuestion: String | null, // Driving question — only populated by Inquiry path
  sourceGoal: String | null,     // Original goal text — only populated by Goal-Forward aspiration mode
  sourceCapability: {            // Only populated by Goal-Forward capability mode
    threadId: String,
    targetTier: 'emerging' | 'developing' | 'demonstrating',
  } | null,

  // === AI ENRICHMENT METADATA ===
  aiEnrichment: {
    suggestedUnderstanding: String | null,
    suggestedCapabilities: String[],
    enrichmentModel: String,     // 'haiku' | 'sonnet'
    enrichedAt: DateTime | null,
    parentAccepted: Boolean,     // Did parent keep AI suggestions or override?
  },
}
```

### 2.1 Runner Format Export

The `toRunnerFormat()` transformation (defined in v3 spec) converts this schema to the Module Experience runner's expected structure. All path-specific source fields are metadata — the runner doesn't consume them. They exist for provenance tracking and future re-inference.

### 2.2 Schema Changes from v1

| Field | v1 | v2 (this spec) | Rationale |
|-------|-----|----------------|-----------|
| `createdVia` | `'understanding' \| 'material' \| 'process' \| 'inquiry' \| 'retrospective' \| 'capability'` | `'material' \| 'process' \| 'inquiry' \| 'retrospective' \| 'goal'` | Understanding-First and Capability-Targeted merged into Goal-Forward |
| `sourceGoal` | Not present | Optional string | Captures aspiration-mode free text for Goal-Forward path |
| `sourceCapability` | Capability-Targeted only | Goal-Forward capability mode | Same structure, now populated by capability mode of merged path |

All other schema fields remain unchanged from v1.

---

## 3. The Five Pathways — Detailed Architecture

Each pathway is specified with: cognitive context, who uses it, entry screen structure, AI processing, field population strategy, edge cases, boundary definitions with adjacent paths, and transition to shared editor.

---

### 3.1 PATH 1: Material-Anchored ("I want to teach through something")

**Entry card label:** "I have something to teach through"
**Entry card hint:** Describe a book, kit, video, or place — we'll build the learning
**Entry card emoji:** 📖
**`createdVia` value:** `'material'`

#### 3.1.1 Cognitive Context

The parent found something they're excited about: a picture book about ecosystems, a nature documentary series, a science kit from a marketplace, a museum they want to visit, a set of Yoto cards about ancient civilisations. They don't start with "what should children understand?" — they start with "this thing is wonderful and I want to teach through it."

This is an extremely common homeschool pattern. Charlotte Mason families build entire terms around living books. Resource-rich families accumulate materials and need help turning them into structured learning. Parents who browse the marketplace or a bookshop think in materials, not learning intentions.

The system's unique contribution: **understanding inference from a resource description** and **structured session templates** that suggest how to use the resource. The parent describes the thing; the system reveals the learning and suggests the structure.

#### 3.1.2 Who Uses This

Charlotte Mason families (living books as the primary teaching tool). Parents returning from library visits or bookshop trips. Parents who've purchased marketplace content and want to extend it with their own materials. Parents who've discovered a place (nature reserve, museum, historical site) and want to build a visit into a learning module.

Estimated usage: 25-30% of parent-created modules. This may be the single most common pathway.

#### 3.1.3 Entry Screen Structure

**Section A: The Resource**
- "What is it?" — resource type selector (pills/chips):
  - 📚 Book
  - 🎬 Documentary / Video
  - 🧰 Kit / Materials Pack
  - 📱 App / Website
  - 📍 Place to Visit
  - 🎵 Audio (Yoto, podcast, audiobook)
  - 📦 Other
- "What's it called?" — text input
  - Placeholder: *"e.g., 'The Very Hungry Caterpillar' by Eric Carle"*
- "Tell us about it in a sentence or two" — textarea
  - Placeholder: *"e.g., A picture book about a caterpillar eating through different foods before becoming a butterfly"*

**Section B: Your Vision**
- "What drew you to this?" — textarea
  - Placeholder: *"e.g., Emma loves caterpillars and I thought we could explore lifecycles"*
  - Field hint: *"This helps us understand what you want the learning to focus on"*
- "How do you imagine using it?" — multi-select chips (pick 1-3):
  - 📖 Read / watch together
  - 🎨 Use as inspiration for a project
  - 🔍 Explore a topic it introduces
  - 🗣️ Discuss and reflect
  - 🧪 Do the activity / experiment it describes
  - ✍️ Use as a starting point for writing / drawing
  - 🧠 Memorise / learn by heart
  - Other: [freeform]

**Section C: Quick Settings**
- Duration dropdown
- Setting pills (Indoor / Outdoor / Either)

**Transition:** "Let's build the learning around this →"

#### 3.1.4 AI Processing

**Timing:** On transition from entry screen to shared editor.

**What the AI does — the critical inference step:**

1. **Understanding inference:** Combine resource description + "What drew you to this?" + usage intent to generate a `targetUnderstanding` statement. This is the invisible upgrade. The parent said "A picture book about a caterpillar eating through foods before becoming a butterfly" + "Emma loves caterpillars and I thought we could explore lifecycles" + selected "Read together" and "Explore a topic." The AI generates: "Living things go through stages of change as they grow, and we can observe these stages in the world around us."

2. **Session structure suggestion:** Based on resource type + usage intent, generate a suggested step sequence from the session template library. Template selection is a lookup, not generation. AI customises template placeholders based on the specific resource.

3. **Capability thread suggestion:** From resource description + inferred understanding, suggest relevant capability threads.

4. **Watch-for generation:** From the inferred understanding, generate a "Signs it's working" statement.

5. **Materials pre-population:** The named resource itself becomes the first material (marked `isCore: true`).

**Token budget:** ~1,200 tokens round-trip. The understanding inference is the expensive part.

**Model:** Haiku with Sonnet fallback. The understanding inference task is more open-ended than Logger classification, so Sonnet fallback is more likely to trigger here (confidence threshold check on the generated understanding).

#### 3.1.5 Session Structure Templates

Pre-authored step structures indexed by resource type × usage intent. The AI selects the matching template and customises placeholder text based on the specific resource description and inferred understanding. This is a fill-in-the-blanks task, not open generation — cheap and reliable on Haiku.

**Storage:** Application code for MVP (ships with the builder, no external dependency). Migrate to Sanity CMS when a content team exists to iterate on templates without deploys.

##### Coverage Matrix

7 resource types × 8 usage intents = 56 possible cells. Many combinations are unrealistic. The coverage strategy targets ~26 meaningful combinations with authored templates. All other combinations fall through to the `other.default` template.

| | Read/Watch | Inspire project | Explore topic | Discuss | Do activity | Writing/Drawing | Memorise | 
|---|---|---|---|---|---|---|---|
| **Book** | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| **Video** | — | ✅ | ✅ | ✅ | — | ✅ | — |
| **Kit** | — | — | ✅ | — | ✅ | — | — |
| **App** | — | — | ✅ | — | ✅ | — | — |
| **Place** | — | — | ✅ | ✅ | ✅ | ✅ | — |
| **Audio** | ✅ | — | ✅ | ✅ | — | — | ✅ |
| **Other** | — | — | — | — | — | — | — |

✅ = authored template (26 total) | — = falls to `other.default`

##### Template Catalogue

```javascript
const SESSION_TEMPLATES = {
  book: {
    'read-together': [
      { title: 'Before reading', instructions: 'Look at the cover together. What do you think this will be about?', observationHint: 'Notice what predictions they make and what details they pick up on' },
      { title: 'Read aloud', instructions: 'Read through the book together. Pause at natural points to wonder aloud.', observationHint: 'Watch for questions they ask or connections they make' },
      { title: 'Talk about it', instructions: 'Ask what they noticed, what surprised them, or what they want to know more about. Follow their lead.', observationHint: 'Listen for new understanding — are they connecting the story to the wider world?' },
      { title: 'Extend', instructions: '[AI customises: activity inspired by the book]', observationHint: '[AI customises based on inferred understanding]' },
    ],
    'inspire-project': [
      { title: 'Read together', instructions: 'Read the book. As you go, wonder aloud: what could we make or do inspired by this?', observationHint: 'Notice which ideas they respond to most' },
      { title: 'Plan the project', instructions: 'Choose one idea. What will you need? How will you start?', observationHint: 'Watch for planning skills — can they break it into steps?' },
      { title: 'Create', instructions: '[AI customises: project activity based on book content]', observationHint: 'Notice problem-solving and creative choices' },
      { title: 'Connect back', instructions: 'How does your creation connect to the book? What did you learn by making it?', observationHint: 'Listen for connections between the story and their project' },
    ],
    'explore-topic': [
      { title: 'Introduce the topic', instructions: 'Read the book together. Then ask: what do we want to find out more about?', observationHint: 'Notice what questions they form' },
      { title: 'Investigate', instructions: '[AI customises: investigation activity based on book topic]', observationHint: 'Watch for curiosity and sustained attention' },
      { title: 'Record findings', instructions: 'Draw, write, or photograph what you discovered.', observationHint: 'Notice the detail in their recording' },
      { title: 'Share', instructions: 'Present your findings to someone — a family member, a friend, or a stuffed animal audience.', observationHint: 'Listen for how they explain what they learned in their own words' },
    ],
    'discuss': [
      { title: 'Read together', instructions: 'Read the book aloud. Don\'t rush — let silences happen.', observationHint: 'Watch for emotional reactions, laughter, confusion' },
      { title: 'First impressions', instructions: 'What did you think? What was the best part? Anything you didn\'t like?', observationHint: 'Notice whether they express opinions or wait for yours' },
      { title: 'Go deeper', instructions: '[AI customises: 2-3 discussion questions based on the book\'s themes]', observationHint: 'Listen for reasoning — are they supporting their views with evidence from the story?' },
      { title: 'Personal connection', instructions: 'Has anything like this happened to you? What would you have done?', observationHint: 'Watch for empathy and perspective-taking' },
    ],
    'writing-drawing': [
      { title: 'Read and notice', instructions: 'Read the book together. Pay attention to the illustrations, the language, or the structure.', observationHint: 'Notice what they respond to — the words, the pictures, or the story shape' },
      { title: 'Choose a starting point', instructions: 'What would you like to write or draw? A new ending, a different character, a picture of your favourite scene, your own version?', observationHint: 'Watch for creative initiative — do they need prompting or jump in?' },
      { title: 'Create', instructions: 'Write, draw, or both. There\'s no wrong way.', observationHint: 'Notice their process — are they planning or discovering as they go?' },
      { title: 'Share and celebrate', instructions: 'Read it aloud or show your drawing. What are you most proud of?', observationHint: 'Listen for confidence and self-awareness about their creative choices' },
    ],
    'memorise': [
      { title: 'First encounter', instructions: 'Read the passage together slowly. What stands out? What do they notice?', observationHint: 'Notice which phrases catch their attention naturally' },
      { title: 'Understand it', instructions: 'Talk about what it means. Ask: what is this saying in your own words?', observationHint: 'Listen for comprehension — can they paraphrase before memorising?' },
      { title: 'Start learning it', instructions: 'Read it aloud together 2-3 times. Try covering a line and seeing if they can fill in the missing words.', observationHint: 'Watch for which sections they pick up quickly and which need more repetition' },
      { title: 'Practice and celebrate', instructions: 'Over the next few days, practise together. When they can say it from memory, celebrate!', observationHint: 'Notice their confidence growing — are they reciting with meaning or just words?' },
    ],
  },
  documentary: {
    'inspire-project': [
      { title: 'Watch a segment', instructions: 'Watch together. Pause when something sparks an idea.', observationHint: 'Notice what excites them — what do they want to try or make?' },
      { title: 'Plan the project', instructions: 'What did the video inspire? Choose a project. What do you need?', observationHint: 'Watch for connections between what they saw and what they want to create' },
      { title: 'Create', instructions: '[AI customises: project based on video content]', observationHint: 'Notice whether they reference what they watched as they work' },
      { title: 'Reflect', instructions: 'How is your project connected to what we watched? What did you learn by doing it?', observationHint: 'Listen for transfer — are they applying ideas from the video?' },
    ],
    'explore-topic': [
      { title: 'Pre-watch questions', instructions: 'What do you already know about this topic? What do you expect to learn?', observationHint: 'Notice their prior knowledge and assumptions' },
      { title: 'Watch together', instructions: 'Watch the relevant section. Pause to discuss or replay moments that surprise.', observationHint: 'Watch for engagement — what grabs their attention?' },
      { title: 'Investigate further', instructions: '[AI customises: follow-up activity extending the video topic]', observationHint: 'Watch for deeper questions that go beyond what the video covered' },
      { title: 'Record and share', instructions: 'Draw, write, or explain what you discovered. Could you teach someone else?', observationHint: 'Listen for understanding in their own words, not just repeating the video' },
    ],
    'discuss': [
      { title: 'Before watching', instructions: 'What do you already know about this topic? What do you expect to see?', observationHint: 'Notice their prior knowledge and assumptions' },
      { title: 'Watch a segment', instructions: 'Watch together. Pause at natural points — don\'t try to get through the whole thing.', observationHint: 'Watch for their reactions — what surprises them, what confuses them' },
      { title: 'Discuss', instructions: 'What stood out? What was surprising? Do you agree with everything?', observationHint: 'Listen for critical thinking — are they questioning or accepting?' },
      { title: 'Follow up', instructions: '[AI customises: extend the discussion into an activity]', observationHint: '[AI customises based on documentary topic]' },
    ],
    'writing-drawing': [
      { title: 'Watch for inspiration', instructions: 'Watch together. Ask: what would you like to draw, write about, or create from this?', observationHint: 'Notice what visuals or ideas capture their imagination' },
      { title: 'Plan', instructions: 'What will you create? A diagram, a comic, a story, a poster? Sketch your idea.', observationHint: 'Watch for how they translate moving images into their own medium' },
      { title: 'Create', instructions: 'Make it. Rewatch sections if you need reference.', observationHint: 'Notice their attention to detail — are they capturing key ideas?' },
      { title: 'Present', instructions: 'Show what you made. Explain the connection to what we watched.', observationHint: 'Listen for how they articulate what they learned through creating' },
    ],
  },
  kit: {
    'do-activity': [
      { title: 'Unbox and explore', instructions: 'Look at the materials together. What do you see? What do you think each piece is for?', observationHint: 'Notice prediction-making and curiosity about materials' },
      { title: 'Build / create / do', instructions: '[AI customises based on kit description]', observationHint: 'Watch for problem-solving when things don\'t go as expected' },
      { title: 'What happened?', instructions: 'Talk about what you made, what worked, and what was tricky.', observationHint: 'Listen for cause-and-effect reasoning' },
      { title: 'Connect the dots', instructions: '[AI customises: Why does this matter? What does this remind you of?]', observationHint: '[AI customises based on inferred understanding]' },
    ],
    'explore-topic': [
      { title: 'What\'s in the box?', instructions: 'Look at everything before starting. What topic does this kit explore? What do you already know about it?', observationHint: 'Notice their predictions and prior knowledge' },
      { title: 'Do the activity', instructions: '[AI customises based on kit description]', observationHint: 'Watch for moments of discovery during the activity' },
      { title: 'Dig deeper', instructions: '[AI customises: investigation that extends beyond what the kit covers]', observationHint: 'Notice whether they form new questions from what they experienced' },
      { title: 'Record what you learned', instructions: 'Draw, photograph, or write about what you discovered. What surprised you?', observationHint: 'Watch for understanding that goes beyond the kit\'s instructions' },
    ],
  },
  app: {
    'do-activity': [
      { title: 'Explore the app', instructions: 'Open it together. What do you notice? What can you do?', observationHint: 'Watch for independent navigation and curiosity' },
      { title: 'Focused task', instructions: '[AI customises based on app description and intent]', observationHint: 'Notice problem-solving and persistence' },
      { title: 'Step away from the screen', instructions: 'What did you learn or create? Can you show or explain it without the device?', observationHint: 'Listen for transfer — can they explain the concept without the app?' },
      { title: 'Extend offline', instructions: '[AI customises: connect digital learning to a physical activity]', observationHint: 'Watch for connections between digital and physical understanding' },
    ],
    'explore-topic': [
      { title: 'Explore freely', instructions: 'Spend a few minutes exploring the app. What can it do? What interests you?', observationHint: 'Notice what they gravitate toward without direction' },
      { title: 'Guided exploration', instructions: '[AI customises: specific task or challenge within the app]', observationHint: 'Watch for how they approach a structured task vs free exploration' },
      { title: 'Go further', instructions: '[AI customises: extend the digital topic into a real-world investigation]', observationHint: 'Notice whether they connect what they saw on screen to the real world' },
      { title: 'Share your findings', instructions: 'What did you discover? Teach someone else what you learned.', observationHint: 'Listen for understanding beyond app interaction' },
    ],
  },
  place: {
    'explore-topic': [
      { title: 'Before we go', instructions: 'What do you think we\'ll see? What do you want to find out?', observationHint: 'Notice what they predict and what questions they form' },
      { title: 'Explore and observe', instructions: 'Walk around with curiosity. Sketch, photograph, or note things that stand out.', observationHint: 'Watch for detail-oriented observation and question-asking' },
      { title: 'Deep focus', instructions: '[AI customises: Find one thing to study closely / do the guided activity / talk to the guide]', observationHint: 'Notice sustained attention and follow-up questions' },
      { title: 'Reflect on the way home', instructions: 'What was the best part? What did you learn that surprised you?', observationHint: 'Listen for connections to prior knowledge and new questions' },
    ],
    'discuss': [
      { title: 'Before we go', instructions: 'What do you know about this place? What questions do you have?', observationHint: 'Notice their expectations and curiosity' },
      { title: 'Experience the place', instructions: 'Explore together. Take photos of things you want to talk about later.', observationHint: 'Watch for what they choose to document — that shows what matters to them' },
      { title: 'Discuss what you saw', instructions: 'Look at your photos. What surprised you? What do you want to know more about?', observationHint: 'Listen for critical thinking and follow-up questions' },
      { title: 'Connect', instructions: '[AI customises: how does this place connect to what we\'re learning?]', observationHint: 'Watch for connections to broader themes or other experiences' },
    ],
    'do-activity': [
      { title: 'Prepare', instructions: 'What are we going to do there? What do we need to bring?', observationHint: 'Notice their planning and preparation skills' },
      { title: 'Do the activity', instructions: '[AI customises: specific activity at the place — guided walk, nature survey, sketching, etc.]', observationHint: 'Watch for engagement and focus during the activity' },
      { title: 'Record', instructions: 'Photograph, sketch, or write about what you did and what you noticed.', observationHint: 'Notice the detail and care in their recording' },
      { title: 'Reflect', instructions: 'What was the best part? What would you do differently next time?', observationHint: 'Listen for self-reflection and iteration thinking' },
    ],
    'writing-drawing': [
      { title: 'Observe carefully', instructions: 'Before drawing or writing, spend a few quiet minutes just looking. What do you notice?', observationHint: 'Watch for the quality of their observation — are they slowing down?' },
      { title: 'Sketch or write', instructions: 'Draw what you see, or write about what you notice. Capture the place as you experience it.', observationHint: 'Notice their choices — what do they include, what do they leave out?' },
      { title: 'Add detail', instructions: 'Go back to your sketch or writing. What can you add? Look again more carefully.', observationHint: 'Watch for revision and deepening — are they willing to look more closely?' },
      { title: 'Share your work', instructions: 'Show someone what you created. What was the hardest part to capture?', observationHint: 'Listen for self-awareness about their creative process' },
    ],
  },
  audio: {
    'read-together': [
      { title: 'Set the scene', instructions: 'Get comfortable. What do you think this will be about?', observationHint: 'Notice their predictions and attention readiness' },
      { title: 'Listen together', instructions: 'Listen to the audio. Pause if they have questions or reactions.', observationHint: 'Watch for engagement — are they absorbed, fidgeting, asking to replay?' },
      { title: 'Talk about it', instructions: 'What did you hear? What was your favourite part? What do you want to know more about?', observationHint: 'Listen for comprehension and personal connections' },
      { title: 'Extend', instructions: '[AI customises: activity inspired by the audio content]', observationHint: '[AI customises based on inferred understanding]' },
    ],
    'explore-topic': [
      { title: 'Listen', instructions: 'Listen to the audio together. What topic does it cover?', observationHint: 'Notice what captures their attention and what confuses them' },
      { title: 'Discuss and question', instructions: 'What did you learn? What do you want to know more about?', observationHint: 'Listen for questions that go beyond what the audio covered' },
      { title: 'Investigate', instructions: '[AI customises: follow-up activity extending the audio topic]', observationHint: 'Watch for connections between what they heard and what they discover' },
      { title: 'Share', instructions: 'Explain what you learned to someone who didn\'t hear the audio.', observationHint: 'Listen for their ability to summarise and explain independently' },
    ],
    'discuss': [
      { title: 'Listen together', instructions: 'Listen to the audio. It\'s okay to pause and react as you go.', observationHint: 'Watch for spontaneous reactions — laughter, surprise, disagreement' },
      { title: 'First thoughts', instructions: 'What did you think? What stood out?', observationHint: 'Notice whether they have strong opinions or are still processing' },
      { title: 'Go deeper', instructions: '[AI customises: discussion questions based on the audio content]', observationHint: 'Listen for reasoning and perspective-taking' },
      { title: 'Connect', instructions: 'Does this remind you of anything? How does it relate to your life?', observationHint: 'Watch for personal connections and empathy' },
    ],
    'memorise': [
      { title: 'Listen together', instructions: 'Play the audio all the way through. Just listen.', observationHint: 'Watch for natural engagement — do they start mouthing along?' },
      { title: 'Understand what you hear', instructions: 'Play it again, pausing after each section. What does this part mean?', observationHint: 'Listen for questions or connections they make' },
      { title: 'Learn section by section', instructions: 'Play one section at a time. Pause. Repeat it together. Move on when ready.', observationHint: 'Notice their strategy — are they using melody, rhythm, or meaning as memory hooks?' },
      { title: 'Recite without the audio', instructions: 'Turn it off and try from memory. Use the audio to check. Celebrate progress!', observationHint: 'Watch for confidence and accuracy. Meaning matters more than perfection.' },
    ],
  },
  other: {
    'default': [
      { title: 'Introduce it', instructions: 'Show them the resource. What do they notice?', observationHint: 'Watch for initial curiosity and questions' },
      { title: 'Dive in', instructions: 'Spend time with it together. Follow their lead.', observationHint: 'Notice what they gravitate toward' },
      { title: 'Reflect', instructions: 'What did we learn? What was interesting?', observationHint: 'Listen for new understanding' },
    ],
  },
};
```

##### Template Selection Logic

When a parent selects a resource type and one or more usage intents:
1. Look up `SESSION_TEMPLATES[resourceType][primaryIntent]`
2. If the parent selected multiple intents, use the first as the primary template and incorporate elements from others (e.g., "read-together" + "explore-topic" merges into a read-then-investigate sequence)
3. If no template exists for the combination, fall through to `other.default`
4. AI customises all `[AI customises]` placeholder fields using the resource description and inferred understanding

This is a fill-in-the-blanks task — cheap and reliable on Haiku.

##### Authoring Effort

26 authored templates × ~15-20 minutes each = approximately 8-10 hours of focused content work. Authoring should be completed during the pre-launch content sprint alongside the Jumpstart Classical pack.

#### 3.1.6 Field Population Matrix

| Field | Source | Confidence |
|-------|--------|------------|
| title | AI suggests from resource title + topic, parent edits | Medium-high |
| description | AI generates from resource + intent, parent edits | Medium |
| targetUnderstanding | **AI infers from resource + "what drew you" + intent** | Medium (the critical inference) |
| watchFor | AI generates from inferred understanding | Medium |
| pivot | AI suggests based on resource type | Low-medium |
| steps | Template selected by resource type × intent, AI customises details | High (template) + Medium (customised parts) |
| materials | Resource auto-added as core material; parent adds others | High for core, parent for rest |
| capabilities | AI suggests from resource description + understanding | Inferred |
| sourceResource | Captured directly from entry screen | Explicit |

#### 3.1.7 Edge Cases

- **Parent selects multiple usage intents:** System picks the primary template from first selection and incorporates elements from others. E.g., "Read together" + "Explore a topic" merges into a read-then-investigate sequence.
- **Resource type is ambiguous:** "Other" catch-all with generic template. AI leans harder on the description text for customisation.
- **Resource has no clear learning angle:** Parent says "It's just a fun toy." System responds warmly: "Even fun play builds skills! What kinds of things does your child do with it?" — tries to surface the implicit learning. If parent insists it's just fun, system creates a minimal module with observation-focused steps and defers understanding inference.
- **Parent wants multiple sessions from one resource:** "We'll read this over a week." System suggests: "Would you like to create one module per session, or one module with multiple steps for the full experience?" Guides toward one module with natural break points marked in steps.
- **Parent describes actions, not the resource:** If the "tell us about it" field contains process-oriented language ("We mix the ingredients, then pour into moulds..."), the system nudges: "It sounds like you already know what you'll do with this — the 'I know how this goes' path might be a better fit. Want to switch, or stay here?"

#### 3.1.8 Yoto Card Integration Note

For resource type "Audio" with description mentioning Yoto, the system can optionally prompt: "Is this from a Yoto card?" If yes, future integration with Yoto MYO export pipeline could auto-populate resource metadata. For now, this is just a metadata flag in `sourceResource.type = 'card'`.

#### 3.1.9 Boundary Definitions

| Adjacent path | Distinction | Redirect signal |
|--------------|-------------|-----------------|
| **Process** | Material-Anchored: parent has a resource and wants help structuring the experience. Process: parent already knows the steps. The test — would they be annoyed if the system suggested steps, or grateful? | Parent writes step-by-step actions in the description field → nudge toward Process |
| **Inquiry** | Material-Anchored: the resource anchors the module. Inquiry: a question from the resource has taken on its own life. Both valid — parent chooses based on what they want the module centred on. | No redirect needed — the choice is intentional |
| **Goal-Forward** | Material-Anchored: parent has a vehicle (the resource). Goal-Forward: parent has a target but no vehicle. If they have both a resource and a specific goal, Material-Anchored is usually better because the resource provides concrete structure. | No redirect needed |

---

### 3.2 PATH 2: Process/Steps ("I know how this goes")

**Entry card label:** "I know how this activity goes"
**Entry card hint:** Capture your steps — we'll show you what they're teaching
**Entry card emoji:** 🔧
**`createdVia` value:** `'process'`

#### 3.2.1 Cognitive Context

The parent has a procedure: bake sourdough, build a birdhouse, plant a garden bed, conduct a science experiment, sew a costume, fix a bike tyre. They think in ordered actions with materials and a tangible outcome. This is the most concrete, practical mental model — the parent knows *exactly what they're going to do*, they just need help seeing and capturing the learning in it.

The system's unique contribution: **deferred AI inference** that reads the parent's steps after they write them and reveals the educational depth hiding inside practical activity. This is the only path where AI runs *after* the parent provides the primary content, not before.

#### 3.2.2 Who Uses This

Hands-on, project-oriented families. Parents whose homeschooling is heavily activity-based. Practical/trade-skill-oriented parents. Parents who say "we just do things" and don't naturally frame activities as learning.

Estimated usage: 25-30% of parent-created modules. Tied with Material-Anchored as the most common pathway.

#### 3.2.3 Entry Screen Structure

This is essentially the current v3 builder with a refined entry framing. The entry screen collects minimal metadata before dropping into the step editor.

**Section A: What Are You Making / Doing?**
- "What's the activity?" — text input (becomes module title)
  - Placeholder: *"e.g., Building a birdhouse"*
- "In a sentence, what happens?" — textarea
  - Placeholder: *"e.g., We build a simple wooden birdhouse from a kit, paint it, and hang it in the garden"*

**Section B: Quick Settings**
- Duration dropdown
- Setting pills
- "Is there a finished product?" — Yes/No toggle
  - If Yes: "What do they end up with?" — text input (optional, e.g., "A painted birdhouse")
  - This informs the AI that evidence capture should include the product

**Transition:** "Let's capture the steps →" (drops directly into shared editor with step entry expanded)

#### 3.2.4 AI Processing

**Timing:** Deferred — AI runs after the parent has entered steps (triggered on first save or on transition to the "Learning" section of the shared editor).

**What the AI does:**

1. **Understanding inference from process:** The signature move of this pathway. The parent described "Build a wooden birdhouse from a kit, paint it, hang it in the garden" and wrote steps like "Measure and mark the wood / Cut pieces / Sand edges / Assemble with nails / Paint / Choose location and hang." The AI generates: "Planning, measuring, and building teaches us that creating something useful requires patience, precise measurement, and step-by-step thinking."

   The inference strategy: look at the *skills embedded in the process*, not just the topic. Building a birdhouse isn't about birdhouses — it's about measurement, planning, fine motor control, tool use, patience, and design thinking. The AI must surface the educational depth in practical activities.

2. **Capability thread mapping from step analysis:** Each step implies capabilities. "Measure and mark" → M5 Measurement Sense. "Sand edges" → P2 Fine Motor. "Choose location" → S5 Scientific Observation (if related to habitat) or EF4 Planning. The AI analyses the full step sequence and suggests 3-5 threads.

3. **Watch-for generation:** From inferred understanding + step analysis, generate observation prompts. "Watch for how they handle measurement — are they estimating or being precise? Do they check their work before cutting?"

4. **Per-step observation hints:** The AI generates a brief `observationHint` for each step. These are the invisible value-add — the parent wrote "Sand the edges until smooth" and the AI adds "Notice their fine motor control and patience. Are they rushing or being careful?"

**Token budget:** ~1,000 tokens. Step text is usually concise; the inference task is similar to Logger pipeline classification.

**Model:** Haiku. Step sequences are structured input — good fit for smaller models.

#### 3.2.5 Field Population Matrix

| Field | Source | Confidence |
|-------|--------|------------|
| title | Parent writes directly (entry screen) | High |
| description | Parent writes directly (entry screen) | High |
| targetUnderstanding | **AI infers from steps + description** | Medium |
| watchFor | AI generates from understanding + steps | Medium |
| pivot | AI suggests ("If they lose interest at step X, try simplifying to...") | Low-medium |
| steps | **Parent writes directly** (this is the entry point) | High |
| materials | Parent writes in shared editor | — |
| capabilities | AI suggests from step analysis | Inferred |

#### 3.2.6 The Critical Upgrade Moment

The parent finishes entering their steps and scrolls to "The Learning" section. They see the AI-generated understanding statement pre-filled in the "What are they learning?" field. This is the moment where a list of instructions becomes a learning module. Many parents will read this and think "oh — I hadn't thought of it that way, but that's exactly right." Some will edit it. A few will delete it and write their own. All outcomes are valid.

The observation hints per step work similarly. The parent scrolls back through their steps and notices the grey italic text beneath each one. "Watch for how they approach the measuring — are they estimating or trying to be precise?" These were invisible to the parent when they wrote "Measure and mark the pieces." Now the educational depth is visible.

#### 3.2.7 Edge Cases

- **Very few steps (1-2):** AI inference is thin. System nudges: "Could you break this into more steps? Even simple activities usually have 3-4 natural stages."
- **Very many steps (10+):** System suggests grouping into phases. "This looks like it might work as a multi-session project. Would you like to group these into sessions?" (Connects to Project Experience architecture.)
- **Steps with no clear learning:** "Step 1: Drive to the shop. Step 2: Buy the thing." System recognises low educational density and prompts: "What skills are involved in this activity? Even practical tasks teach something."
- **Process is dangerous:** Steps involving sharp tools, heat, chemicals. System doesn't restrict but adds safety observation hints: "Supervise closely during cutting. Watch for safe tool handling — are they holding the saw correctly?"
- **Parent names a specific resource:** If the activity description mentions a specific product or kit ("We're using the Kiwi Crate engineering kit"), the system can surface: "Want to add this as the core resource?" — pulling in Material-Anchored resource metadata without switching paths.

#### 3.2.8 Boundary Definitions

| Adjacent path | Distinction | Redirect signal |
|--------------|-------------|-----------------|
| **Material-Anchored** | Process: parent has the steps. Material-Anchored: parent has the resource and wants help figuring out steps. If they've done this activity before and have their own refined procedure, Process. If the resource is new and they want guidance, Material-Anchored. | Parent names an unfamiliar resource and asks "how should we use this?" → suggest Material-Anchored |
| **Retrospective Lift** | Process is the manual version of what Retrospective Lift does automatically. If the parent has been doing this activity repeatedly and it's already in their logs, Retrospective Lift synthesises from existing data. Process is for when the parent wants to manually articulate their procedure. | If pattern detection has flagged this activity → mention: "We've spotted this in your logs — want to start from your evidence instead?" |
| **Goal-Forward** | Process starts from *doing*. Goal-Forward starts from *wanting*. A parent who knows what to do belongs in Process. A parent who knows what they want the child to learn but hasn't figured out the activity belongs in Goal-Forward. | No redirect needed |

---

### 3.3 PATH 3: Inquiry ("A question came up")

**Entry card label:** "Something sparked a question"
**Entry card hint:** Share a wonder — we'll structure the investigation
**Entry card emoji:** ❓
**`createdVia` value:** `'inquiry'`

#### 3.3.1 Cognitive Context

A child asked "Why do stars twinkle?" or "How do fish breathe underwater?" or "Why is that building so old?" The parent has a *question* — often the child's exact words. They don't have a plan. They don't have materials (yet). They have a moment of curiosity and the instinct that this could become something valuable.

This is the most natural homeschool entry point. The wonder-driven moment. Every pedagogy Hearth supports values this: Charlotte Mason's nature study, Montessori's following the child, classical education's Socratic method, unschooling's interest-led philosophy. A question is philosophy-neutral raw material.

The system's unique contribution: **reverse-engineering understanding from a question** and providing an **investigation type taxonomy** that structures the exploration. No other path works backward from a question to a conceptual goal.

#### 3.3.2 Who Uses This

Unschooling and interest-led families (this IS their curriculum). Charlotte Mason families (nature study begins with wondering). Parents of highly curious children. Parents who are new to homeschooling and don't yet have structured content — they're following their children's lead.

Estimated usage: 15-20% of parent-created modules. Higher among unschooling families and families with younger children.

#### 3.3.3 Entry Screen Structure

**Section A: The Question**
- "What came up?" — text input (generous, single-line)
  - Placeholder: *"e.g., Why do leaves change colour in autumn?"*
  - Field hint: *"Use their exact words if you remember them — it doesn't need to be perfect"*
- "Who's wondering?" — child selector (multi-select from family's children)
  - Pre-selects all children if family has only one child
  - Helps system understand developmental context for investigation suggestions

**Section B: What You Already Know**
- "What do you or your children already know (or think) about this?" — textarea
  - Placeholder: *"e.g., We know leaves fall off trees. Emma thinks it's because they get old. Liam thinks the wind blows them off."*
  - Field hint: *"Starting from what you know helps build the exploration"*
  - This becomes the module's starting context and helps AI calibrate investigation depth

**Section C: How Might You Explore This?**

This section is semi-AI-assisted. On entering the question text (debounced 1.5s), the system analyses the question domain and presents 2-4 investigation approach suggestions as selectable cards.

Investigation approach cards are generated from a taxonomy of investigation types, filtered by question domain:

```javascript
const INVESTIGATION_TYPES = {
  observe: {
    label: '🔍 Observe closely',
    description: 'Go look at the real thing',
    bestFor: ['natural phenomena', 'living things', 'physical properties', 'places'],
    suggestedSteps: ['Find examples', 'Observe and record', 'Compare observations', 'Form a theory'],
  },
  experiment: {
    label: '🧪 Test it out',
    description: 'Design a simple experiment',
    bestFor: ['cause-effect questions', 'physical science', 'predictions'],
    suggestedSteps: ['Make a prediction', 'Set up the test', 'Record what happens', 'Was our prediction right?'],
  },
  research: {
    label: '📚 Look it up',
    description: 'Find answers in books or reliable sources',
    bestFor: ['historical questions', 'how-things-work', 'factual questions', 'geography'],
    suggestedSteps: ['Gather sources', 'Read and take notes', 'Summarise findings', 'Share what you learned'],
  },
  askSomeone: {
    label: '🗣️ Ask an expert',
    description: 'Talk to someone who knows',
    bestFor: ['specialist topics', 'community questions', 'career/trade questions'],
    suggestedSteps: ['Identify who to ask', 'Prepare questions', 'Have the conversation', 'Reflect on what they said'],
  },
  visit: {
    label: '📍 Go somewhere',
    description: 'Visit a place to find out',
    bestFor: ['places', 'nature', 'cultural questions', 'how-things-work'],
    suggestedSteps: ['Research the destination', 'Plan what to look for', 'Visit and explore', 'Record and reflect'],
  },
  make: {
    label: '🔧 Build or make something',
    description: 'Learn by creating',
    bestFor: ['how-things-work', 'engineering', 'design questions'],
    suggestedSteps: ['Research how it works', 'Plan your build', 'Make it', 'Test and improve'],
  },
};
```

The system presents 2-4 relevant types as selectable cards. The parent picks 1-2. This selection drives the step template generation.

**Section D: Quick Settings**
- Duration dropdown
- Setting pills

**Transition:** "Let's plan the exploration →"

#### 3.3.4 AI Processing

**Timing:** Two phases — lightweight on entry (for investigation suggestions), fuller on transition to shared editor.

**Phase 1: Question analysis (on question input, debounced 1.5s):**

This is **not** an LLM call. It's a keyword/domain classifier (similar to Logger live panel's debounced keyword matcher). Rule-based classification:

```
"Why do leaves change colour?" → domain: natural_phenomena
  → suggest: observe, research, experiment
  → exclude: askSomeone, make

"How did people live in ancient Rome?" → domain: historical
  → suggest: research, visit, make
  → exclude: experiment, observe

"How do bridges hold up heavy things?" → domain: engineering
  → suggest: make, experiment, research
  → exclude: askSomeone
```

This classification runs client-side with a domain keyword dictionary. No token cost.

**Phase 2: Full inference (on transition to shared editor):**

1. **Understanding reverse-engineering:** The signature move of this pathway. "Why do leaves change colour in autumn?" + prior knowledge "Emma thinks it's because they get old" + selected investigation "Observe closely" → AI generates: "Plants respond to seasonal changes in daylight and temperature by withdrawing nutrients from their leaves, causing the colour change we observe."

   The understanding is calibrated by the prior knowledge field. If the parent wrote "We've already studied photosynthesis," the understanding targets a deeper level than if they wrote "We know leaves fall off trees."

2. **Step generation from investigation type:** The selected investigation type provides the step template. AI customises steps to the specific question. "Observe closely" for leaf colour → (1) "Go outside and collect 5-6 leaves in different stages of colour change" (2) "Sort them from greenest to most changed — what patterns do you notice?" (3) "Look closely with a magnifying glass — can you see the colour underneath the green?" (4) "Draw or photograph your sorting. What's your theory about why the colour changes?"

3. **Capability thread mapping:** Question domain + investigation type → threads. Nature observation + scientific inquiry → S5 Scientific Observation, S2 Living Systems, EF1 Sustained Attention, PS4 Curiosity.

4. **Watch-for generation:** "What would finding out look like?" — AI generates from the understanding: "Watch for whether they start forming their own theories about why the colour changes. Do they connect it to the seasons?"

5. **Endpoint definition:** "How will you know the exploration is done?" — AI suggests a natural endpoint: "When they can explain in their own words why leaves change colour, or when they've recorded their observations in a way they're proud of."

**Token budget:** ~1,400 tokens. The understanding reverse-engineering is more open-ended than Logger classification, and the step customisation requires contextual awareness.

**Model:** Haiku with Sonnet fallback. The understanding reverse-engineering is the most creatively demanding inference in the entire builder, so Sonnet fallback threshold should be lower here (confidence < 0.6 triggers Sonnet retry).

#### 3.3.5 Field Population Matrix

| Field | Source | Confidence |
|-------|--------|------------|
| title | AI suggests from question ("Exploring: Why Leaves Change Colour"), parent edits | Medium |
| description | AI generates from question + investigation approach | Medium |
| targetUnderstanding | **AI reverse-engineers from question + prior knowledge** | Medium (the critical inference) |
| watchFor | AI generates as "What would finding out look like?" | Medium |
| pivot | AI generates as "If the question leads elsewhere..." | Low-medium |
| steps | **Template from investigation type × question domain, AI customises** | High (template) + Medium (customised) |
| materials | AI suggests from investigation type + question topic | Low-medium |
| capabilities | AI suggests from question domain + investigation type | Inferred |
| sourceQuestion | Captured directly from entry screen | Explicit |

#### 3.3.6 The Branching Problem

Inquiry is inherently non-linear. The child asks "Why do leaves change colour?" and during the investigation discovers that some trees are evergreen, and now wants to know why. The module as built covers the original question — but the branching is where the richest learning happens.

**Design response:** The pivot field for inquiry modules isn't "if they're not getting it" — it's "if the question leads somewhere new." The AI pre-populates this with: "If new questions come up during the investigation (they will!), note them down. Each one could become its own module. For now, gently steer back to the original question and save the new ones for later."

This also connects to the Retrospective Lift pathway: logged inquiry modules naturally generate follow-up questions, which can themselves become new Inquiry modules. An organic inquiry chain.

#### 3.3.7 Edge Cases

- **Unfocused question:** "Why is everything?" System asks: "Can you narrow this down to one specific thing they're wondering about?"
- **Factual question with simple answer:** "What's the tallest mountain?" System responds: "That's a great factual question! You could look it up together. Would you rather build a module exploring *why* mountains are different heights, or *how* we measure them? Those lead to richer investigation." Offers to pivot to a deeper question or just answer it.
- **Sensitive question:** "Why did grandma die?" System recognises sensitive domain. Handles with care: generates a module focused on understanding loss, life cycles, or memory-making, depending on the parent's prior knowledge input. Does NOT generate clinical content.
- **Question parent can't answer:** "How does a computer work?" Prior knowledge field empty. System calibrates to foundational level and suggests investigation types that build understanding incrementally.

#### 3.3.8 Boundary Definitions

| Adjacent path | Distinction | Redirect signal |
|--------------|-------------|-----------------|
| **Material-Anchored** | Inquiry: the question drives the module. Material-Anchored: the resource drives it. If a book sparked the question but the question has taken on its own life, Inquiry. If the parent wants to build the experience around the book itself, Material-Anchored. | No redirect needed — the choice is about what the parent wants to anchor to |
| **Goal-Forward** | "Why do leaves change colour?" (Inquiry) vs "I want them to understand why leaves change colour" (Goal-Forward). Inquiry preserves child ownership of the question. Goal-Forward is parent-directed. | If the parent rewrites the child's question as a learning goal → no redirect, both are valid framings |
| **Process** | Inquiry: starting from not-knowing. Process: starting from knowing-how. If the parent already knows the answer and the investigation steps, Process might be more efficient. | No redirect needed |

---

### 3.4 PATH 4: Retrospective Lift ("We've been doing this already")

**Entry card label:** "We've been doing this already"
**Entry card hint:** We noticed patterns in your logs — ready to formalise?
**Entry card emoji:** 🔁
**`createdVia` value:** `'retrospective'`

#### 3.4.1 Cognitive Context

The parent has been logging activities in the Retrospective Logger for weeks. They notice a pattern: they keep going on nature walks, they keep doing cooking activities, they keep reading about ancient civilisations. The learning is already happening — it's just not structured. They want to give it shape so they can be more intentional, track growth, and get HEU coverage credit.

This is the most *Hearth-native* pathway. It embodies the retrospective-first philosophy: capture what happened, recognise its value, then optionally formalise it into a repeatable structure. No other homeschool tool offers this.

The system's unique contribution: this is the **only system-initiated path.** The parent doesn't bring an input — the system brings pre-analysed data. Pattern detection runs in the background, and the system surfaces recurring activity patterns for the parent to formalise.

#### 3.4.2 Who Uses This

Families who've been using the Logger for 2+ weeks and have accumulated entries. Parents who feel like they're "just doing stuff" and want validation that it's real learning. Unschooling families who philosophically resist pre-planning but want structure for compliance. Any family whose HEU Report shows thin coverage in an area where they've actually been doing plenty of relevant work (just not through modules).

Estimated usage: 10-15% of parent-created modules. Lower initially (requires Logger history), growing over time as families accumulate data.

#### 3.4.3 Precondition: Pattern Detection

This pathway doesn't start from the builder. It starts from a **system prompt** that surfaces when the AI detects recurring patterns in Logger entries.

**Pattern detection logic** (runs as part of the Family Intelligence Snapshot rebuild, zero additional LLM cost):

```javascript
function detectModulePatterns(recentEntries, windowDays = 30) {
  // Look for subject tag clusters
  const subjectCounts = {};
  const capabilityCounts = {};
  const activityDescriptions = [];

  recentEntries
    .filter(e => e.createdAt > Date.now() - windowDays * 86400000)
    .forEach(entry => {
      entry.subjects_detected.forEach(s => {
        subjectCounts[s] = (subjectCounts[s] || 0) + 1;
      });
      entry.capability_threads.forEach(c => {
        capabilityCounts[c] = (capabilityCounts[c] || 0) + 1;
      });
      activityDescriptions.push(entry.description);
    });

  // Threshold: 3+ entries with the same subject OR 3+ entries with the same capability thread
  const candidates = [];
  Object.entries(subjectCounts).forEach(([subject, count]) => {
    if (count >= 3) {
      candidates.push({
        type: 'subject_cluster',
        label: subject,
        count,
        entries: recentEntries.filter(e => e.subjects_detected.includes(subject)),
      });
    }
  });

  // Also detect activity pattern clusters (similar titles/descriptions)
  // Uses keyword overlap, not LLM — simple TF-IDF style matching
  // ...

  return candidates;
}
```

**Surfacing:** When a pattern is detected, it appears as:
- A card in the **Dashboard** ("Looks like you've been doing a lot of nature observation lately. Want to turn it into a repeatable module?")
- An option in the **Logger** after saving an entry that matches a pattern ("You've logged 4 nature walks this month. Would you like to create a Nature Walk module?")
- The Retrospective Lift card in the builder entry selector (always visible, but shows a badge count if patterns are detected: "🔁 We've been doing this already (3 patterns found)")

**Availability:** This path should only be fully active when patterns have been detected. If no patterns exist, the entry selector shows the card in a dimmed state with the explanation: "Keep logging — we'll spot patterns as they form."

#### 3.4.4 Entry Screen Structure

**Section A: Detected Patterns**

If the parent arrives from a Dashboard/Logger prompt, the specific pattern is pre-selected. If they arrive from the builder entry selector, they see all detected patterns.

Each pattern is a card showing:
- Pattern label (e.g., "Nature Observation Walks")
- Entry count (e.g., "Based on 5 recent logs")
- Date range (e.g., "Feb 12 – Mar 8")
- Subject tags (e.g., "Science, Maths, Physical")
- Snippet from a representative entry

Parent selects one pattern.

**Section B: Review the Evidence**

After selecting a pattern, the system shows a scrollable summary of the matching entries:

Each entry card shows:
- Date
- Title
- 1-2 line excerpt from description
- Subject tags
- Per-child engagement (emoji indicators from Logger)
- Per-child discoveries (brief text from Logger)

Parent can deselect entries that don't belong ("That one was unrelated, remove it").

**Section C: Does This Look Right?**

After review, the system presents its synthesis:

- **Suggested title:** Generated from pattern label + recurring activity terms
- **Suggested understanding:** Synthesised from AI insights across the matching entries
- **Suggested steps:** Derived from the common structure of the matching entries
- **Suggested "Signs it's working":** Pre-filled from the parent's own per-child discovery notes
- **Suggested capabilities:** Already tagged from Logger pipeline enrichment

All fields are editable. The parent can accept, modify, or replace any suggestion.

**Transition:** "This looks like a solid module. Want to refine it?" → Opens shared editor with all fields pre-populated.

#### 3.4.5 AI Processing

**Timing:** The heavy lifting is already done. Logger entries are already enriched at write-time. Pattern detection runs during Snapshot rebuild. The only new AI call is the synthesis step.

**Synthesis AI call (on pattern selection):**

Input: Array of enriched Logger entry data for the selected pattern (titles, descriptions, subject tags, capability threads, per-child discoveries, per-child engagement).

Output: Synthesised module draft.

```json
{
  "suggestedTitle": "Nature Observation Walks",
  "suggestedDescription": "Regular outdoor walks with focused observation and recording of local wildlife and plant life",
  "suggestedUnderstanding": "Careful observation of our local environment reveals patterns, changes, and connections between living things that we can learn to notice and understand",
  "suggestedWatchFor": "They start noticing things without being prompted — pointing out a bird behaviour, asking about a plant, or wanting to go back to check on something they noticed last time",
  "suggestedPivot": "If the walk feels routine, try a new location or give them a specific challenge — count all the different types of leaves, or listen for bird calls",
  "suggestedSteps": [
    {
      "title": "Choose your focus",
      "instructions": "Before heading out, pick one thing to pay special attention to today — birds, insects, plants, or tracks.",
      "observationHint": "Notice whether they can choose a focus independently or need suggestions"
    },
    {
      "title": "Walk and observe",
      "instructions": "Walk your usual route slowly. Stop when something catches your attention. Look, listen, touch, smell.",
      "observationHint": "Watch for the quality of their observation — are they noticing details? Asking questions?"
    },
    {
      "title": "Record",
      "instructions": "Draw, photograph, or write about what you found. Even a quick sketch counts.",
      "observationHint": "Notice the detail in their recording. Are they capturing what they actually observed or what they think they should draw?"
    },
    {
      "title": "Reflect",
      "instructions": "On the way home or at the table: What was the most interesting thing? Any new questions?",
      "observationHint": "Listen for connections to previous walks — 'Remember when we saw...'"
    }
  ],
  "suggestedCapabilities": ["S5", "S2", "EF1", "L1", "P1"]
}
```

**Token budget:** ~1,200 tokens. The input is pre-structured (enriched entries), and the output is a constrained JSON format.

**Model:** Haiku. The synthesis task is well-constrained — taking structured inputs and producing a structured summary.

#### 3.4.6 Field Population Matrix

| Field | Source | Confidence |
|-------|--------|------------|
| title | AI synthesises from entry pattern, parent edits | Medium-high |
| description | AI synthesises from entries | Medium-high |
| targetUnderstanding | **AI synthesises from enriched entry insights** | Medium-high (multiple data points) |
| watchFor | **Pre-filled from parent's own discovery notes** | High (parent's own words, aggregated) |
| pivot | AI generates from entry variety/adaptations | Medium |
| steps | AI derives from common entry structure | Medium |
| materials | Extracted from entry descriptions | Low-medium |
| capabilities | **Already tagged by Logger pipeline** | High (pre-computed) |
| sourceLogs | Entry IDs captured directly | Explicit |

#### 3.4.7 The "Oh, We Were Already Doing This" Moment

This pathway's emotional payoff is unique. The parent sees their scattered, logged-as-we-go activities synthesised into a coherent module with an understanding goal, observation prompts, and capability mapping. The message is: "You've been doing real, valuable teaching. Here it is, structured."

For families who feel impostor syndrome about homeschooling — "Are we doing enough? Is this real education?" — the Retrospective Lift provides powerful validation. This is a brand-differentiating moment for Hearth.

#### 3.4.8 Edge Cases

- **Too few entries (1-2):** Pattern detection threshold is 3. If parent navigates to this pathway manually with <3 matching entries, system shows: "We need a bit more to work with. Keep logging, and we'll spot the patterns as they form."
- **Entries are too varied:** Pattern detected by subject tag but entries are actually quite different activities. System shows the review screen and the parent deselects non-matching entries. If only 1-2 remain after deselection, system suggests switching to a different pathway.
- **Pattern spans multiple children at different levels:** The synthesised module captures the common activity. Per-child differentiation is handled at the Module Experience runner level (per-child engagement tracking), not in the module definition itself.
- **Entries contain contradictory information:** One entry says "Emma loved it" and another says "Emma was bored." System acknowledges this in the pivot field: "Interest levels may vary — try adjusting the focus or difficulty between sessions."

#### 3.4.9 Boundary Definitions

| Adjacent path | Distinction | Redirect signal |
|--------------|-------------|-----------------|
| **Process** | Retrospective Lift is the automated version of Process for recurring activities. If the parent has been doing this activity repeatedly and it's in their logs, Retrospective Lift synthesises from evidence. Process is for when the parent wants to manually articulate a procedure (either a new one, or one not yet in their logs). | If parent opens Process and describes an activity that matches a detected pattern → "We've spotted this in your logs — want to start from your evidence instead?" |
| **Goal-Forward** | Retrospective Lift works forward from evidence. Goal-Forward works forward from aspiration. If the parent wants to formalise what they've already done, Retrospective Lift. If they want to build something new toward a target, Goal-Forward. | No redirect needed |

---

### 3.5 PATH 5: Goal-Forward ("I have a learning goal")

**Entry card label:** "I have a learning goal"
**Entry card hint:** Tell us the target — we'll help you get there
**Entry card emoji:** 🎯
**`createdVia` value:** `'goal'`

> **Merge note:** This path combines the v1 Understanding-First (Path 1) and Capability-Targeted (Path 6) pathways. The merge was driven by the shared cognitive starting point: both parent profiles arrive with a forward-looking educational target. The system detects which mode to activate based on whether the parent's input maps to a capability thread.

#### 3.5.1 Cognitive Context

The parent has a learning target. This manifests in two distinct modes:

**Aspiration mode:** The parent has a loose educational goal — "I want to do more science," "I want them to understand how money works," "I want them to be better at writing." They don't have a resource, steps, or a question. They have a direction. This is everyday behaviour — spontaneous, less structured, motivated by parental intuition.

**Capability mode:** The parent has identified a specific gap — "Emma's measurement skills need work," or the Constellation shows "Emerging" on a thread, or the HEU Report shows thin coverage in an area. This is review-period behaviour — periodic, structured, often motivated by compliance requirements or development targets.

What unites them: both parents are thinking forward from a target, not backward from an experience they've already had or a resource they're holding. The system's unique contribution: **working backward from a target to concrete activities** — the only path that starts from educational structure and works outward.

#### 3.5.2 Who Uses This

**Aspiration mode:** Experienced homeschoolers who've internalised backward design. Parents who think in understanding goals. Parents with a sense of what they want but no specific vehicle or plan yet.

**Capability mode:** Parents concerned about curriculum gaps (HEU compliance motivation). Parents preparing for school re-entry. Parents who've seen the Constellation and want to intentionally develop a specific thread. Families with specific learning goals (e.g., preparing for a maths assessment). Parents who say "we need more X" but don't know how to get there.

Estimated usage: 15-20% of parent-created modules (combined). Aspiration mode skews toward experienced homeschoolers; capability mode skews toward HEU-compliance-focused families.

#### 3.5.3 Entry Screen Structure

The parent sees a single entry screen with a primary text input at the top:

**Section A: What's the Goal?**

- "What do you want them to learn or get better at?" — freeform text field
  - Placeholder: *"e.g., 'I want them to understand that living things depend on their environment' or 'better at measurement'"*
  - Field hint: *"This can be a specific concept or a general skill area — whatever's on your mind"*

**Below the text input, the system responds in real-time** (debounced keyword matching against the 57-thread library, no LLM call):

**If the input maps to a capability thread** (e.g., "measurement," "reading comprehension," "handwriting"): The system surfaces the matched thread as a suggestion card below the input.

```
"It sounds like you're thinking about M5: Measurement Sense"
[✓ Yes, that's it]  [✕ Not quite]
```

If confirmed → flow enters **capability mode** (see Section B below).
If dismissed → flow stays in **aspiration mode** (see Section C below).

**If the input reads as a conceptual understanding statement** (heuristic: contains "understand that," "learn that," "grasp how," or is a complete sentence about a concept): The system treats it as a direct `targetUnderstanding` entry. No thread matching required. Flow stays in **aspiration mode.**

**If it's ambiguous** (could be either): The system shows both options. Thread match suggestion appears but isn't pre-selected.

---

**Section B: Capability Mode** (shown when thread is confirmed)

**B.1: Where Are They Now?**

If Constellation data exists for the selected thread + family's children, pre-populate:
- Per child: current tier (Emerging / Developing / Demonstrating)
- Recent observations count

If no Constellation data:
- "Where would you say [child] is with this?" — selectable tier cards per child:
  - **Just starting** (Emerging): Brief description from thread's emerging indicators
  - **Getting there** (Developing): Brief description from thread's developing indicators
  - **Solid** (Demonstrating): Brief description from thread's demonstrating indicators

**B.2: What Does Your Family Enjoy?**

Activity preference filter — multi-select chips:
- 🌿 Outdoors / nature
- 🎨 Art / craft / making
- 📚 Books / reading
- 🎲 Games / puzzles
- 🧑‍🍳 Cooking / baking
- 🔬 Experiments / science
- 💻 Digital / apps
- 🏃 Active / physical
- 🗣️ Discussion / storytelling

This filter ensures the generated module skeletons match the family's actual preferences.

**B.3 Transition:** "Here are some ideas →" (shows skeleton selection, then shared editor)

---

**Section C: Aspiration Mode** (shown when no thread confirmed)

**C.1: How Will You Know?**
- "What would you see if they're getting it?" — textarea
  - Placeholder: *"e.g., They start noticing how animals and plants are adapted to where they live"*
- "What would you try if they're not?" — textarea (optional)
  - Placeholder: *"e.g., Simplify to just one animal and its habitat"*

**C.2: Quick Settings**
- Duration dropdown
- Setting pills

**C.3 Transition:** "Now let's plan the activities →" (shared editor, steps section empty)

---

**Contextual entry from Constellation/HEU Report:**

When a parent arrives from tapping "Build a module for this" on a Constellation thread or HEU Report gap, the thread is pre-selected, the text field is pre-populated with the thread's plain-language description, and the flow drops directly into capability mode (Section B) with B.1 pre-filled from Constellation data.

#### 3.5.4 Skeleton Generation (Capability Mode Only)

Before the shared editor, the system presents 2-3 module skeletons as selectable cards. This is the unique intermediate step for capability mode.

**Storage:** Sanity CMS from the start. Reasons: the skeleton library will grow over time, content team needs to author/edit without deploys, skeletons reference thread definitions that also live in the content layer, and GROQ queries can efficiently filter by thread × tier × preference.

##### Coverage Strategy

57 capability threads × 3 tiers × 9 activity preferences = 1,539 possible combinations. Full pre-authoring is infeasible. The library uses a three-tier coverage strategy:

**Tier 1: Curated skeletons (thread-specific)**

Focus on the highest-traffic threads and preferences. Target: **top 15 threads × top 6 preferences × developing tier** = 90 curated skeletons.

Priority threads (based on stress-test scenarios and QLD HEU reporting patterns):
- Mathematical: M1 Number Sense, M3 Operations, M5 Measurement Sense
- Language: L1 Oral Communication, L3 Reading Comprehension, L5 Writing
- Scientific: S2 Living Systems, S5 Scientific Observation
- Creative: C1 Visual Expression, C3 Creative Problem-Solving
- Executive Function: EF1 Sustained Attention, EF4 Planning
- Physical: P1 Gross Motor, P2 Fine Motor
- Social-Emotional: SE1 (to be confirmed — see thread library audit note)

Priority preferences: Outdoors/nature, Cooking/baking, Art/craft, Books/reading, Games/puzzles, Active/physical.

Authoring effort: ~15-20 minutes per skeleton × 90 = approximately 25-30 hours. Part of the pre-launch content sprint.

**Tier 2: Domain-generic skeletons**

For threads outside the top 15, the system falls back to domain-level skeletons. Instead of "M5: Measurement Sense × Cooking × Developing," the system offers "Mathematical Thinking × Cooking × Developing" — a broader skeleton that AI customises with the specific thread's indicator text.

Domains: Language, Mathematical, Scientific, Digital, Creative, Social-Emotional, Executive Function, Physical = 8 domains × 6 preferences × 1 tier (developing) = **48 domain-generic skeletons**.

Authoring effort: ~10 minutes each (more generic) × 48 = approximately 8 hours.

**Tier 3: AI-generated skeletons**

For any combination not covered by Tier 1 or Tier 2 (uncommon thread × preference pairs, emerging/demonstrating tiers without curated content), the AI generates a skeleton from:
- The thread's indicator definitions (from the capability thread library)
- The selected activity preference
- A Tier 2 domain-generic skeleton as structural template

These are flagged as `confidence: 'generated'` in the UI — transparently marked as suggestions rather than expert-authored content.

##### Skeleton Schema

```javascript
{
  // Identity
  id: String,               // e.g., 'M5-developing-cooking'
  threadId: String,          // e.g., 'M5' (null for domain-generic)
  domain: String,            // e.g., 'mathematical' (always populated)
  targetTier: String,        // 'emerging' | 'developing' | 'demonstrating'
  activityPreference: String, // e.g., 'cooking'
  confidence: String,        // 'curated' | 'domain-generic' | 'generated'

  // Content
  title: String,             // e.g., "Measurement in the Kitchen"
  description: String,       // 1-2 sentences
  suggestedUnderstanding: String,
  suggestedSteps: [{
    title: String,
    instructions: String,
    observationHint: String,
  }],
  indicatorsFocused: String[], // From thread's tier indicators
  suggestedMaterials: [{
    name: String,
    isCore: Boolean,
  }],

  // Metadata
  estimatedDuration: Number, // Minutes
  setting: String,           // 'indoor' | 'outdoor' | 'either'
  authoredBy: String,        // 'content-team' | 'ai-generated'
  lastUpdated: DateTime,
}
```

##### Skeleton Selection Logic

1. Query Sanity for skeletons matching `threadId + targetTier + activityPreference` (Tier 1)
2. If no Tier 1 match, query for `domain + targetTier + activityPreference` (Tier 2)
3. If no Tier 2 match, AI generates skeleton using thread indicators + domain template as structural reference (Tier 3)
4. Present 2-3 skeletons to the parent as selectable cards (may mix tiers — e.g., one curated + one domain-generic + one generated)
5. Parent selects one → populates the shared editor

##### Authoring Pipeline

**Phase 1 (pre-launch):** Author 90 Tier 1 + 48 Tier 2 = **138 skeleton records**. Content sprint alongside Jumpstart Classical pack. Estimated total effort: ~35-40 hours.

**Phase 2 (post-launch):** Expand Tier 1 based on analytics — which thread × preference combinations are most requested? Which AI-generated skeletons get the highest parent acceptance rates? Promote high-performing generated skeletons to curated status after human review.

**Phase 3 (scale):** MiniMax Agent or similar tool generates skeleton candidates in bulk. Human review filters and polishes. The `confidence` field enables quality monitoring: track acceptance rates by confidence level to measure AI generation quality over time.

##### Example Skeleton

```javascript
{
  id: 'M5-developing-cooking',
  threadId: 'M5',
  domain: 'mathematical',
  targetTier: 'developing',
  activityPreference: 'cooking',
  confidence: 'curated',
  title: "Measurement in the Kitchen",
  description: "Build measurement skills through cooking — weighing, measuring liquids, comparing quantities",
  suggestedUnderstanding: "Measurement helps us be precise about quantities, and estimating before measuring helps us develop number sense",
  suggestedSteps: [
    { title: 'Choose a recipe', instructions: 'Pick a recipe that uses cups and grams. Read through the ingredients together.', observationHint: 'Notice whether they can identify the units and what they mean' },
    { title: 'Estimate first', instructions: 'Before measuring, guess how much you need. How heavy does 100g feel? How full is a cup?', observationHint: 'Watch for their estimation strategies — are they using body references or prior experience?' },
    { title: 'Measure and compare', instructions: 'Now measure properly. How close was your estimate? Record both numbers.', observationHint: 'Notice precision — are they reading the scale carefully or rushing?' },
    { title: 'Reflect', instructions: 'Look at your estimates vs measurements. Where were you closest? What helped you guess well?', observationHint: 'Listen for number sense developing — are they getting a feel for quantities?' },
  ],
  indicatorsFocused: [
    "Uses standard units (cm, m, kg, L) to measure and record accurately",
    "Estimates before measuring and refines estimates over time",
  ],
  suggestedMaterials: [
    { name: 'Recipe with varied measurements', isCore: true },
    { name: 'Kitchen scales', isCore: true },
    { name: 'Measuring cups and spoons', isCore: true },
    { name: 'Notebook for recording', isCore: false },
  ],
  estimatedDuration: 45,
  setting: 'indoor',
  authoredBy: 'content-team',
}
```

**Token budget for skeleton generation:** ~1,000 tokens total (not per skeleton). For Tier 1/2 skeletons, AI customises existing content (very cheap). For Tier 3, AI generates from thread indicators + template (moderate cost, still within budget).

#### 3.5.5 AI Processing

**Varies by mode:**

**Aspiration mode:**
- **Timing:** On transition to shared editor
- **Tasks:** Capability thread suggestion from understanding text (same approach as Logger pipeline — keyword extraction + thread ID matching). Per-step observation hints once parent adds steps. Coherence check after steps are written (do steps serve the stated understanding?).
- **Token budget:** ~800 tokens
- **Model:** Haiku

**Capability mode:**
- **Timing:** On transition from entry screen to skeleton selection
- **Tasks:** Skeleton assembly (select and customise 2-3 from library). Understanding generation per skeleton (connecting activity to thread's educational goal). Watch-for from indicator definitions. Secondary capability thread suggestions.
- **Token budget:** ~1,000 tokens
- **Model:** Haiku

**Fallback between modes:** If a parent enters aspiration mode and the AI later matches their understanding text to a thread with high confidence, the system can surface: "This looks like it connects to [thread name]. Would you like to see some activity suggestions?" — offering a bridge to capability mode features without forcing a restart.

#### 3.5.6 Field Population Matrix

**Aspiration mode:**

| Field | Source | Confidence |
|-------|--------|------------|
| title | Parent writes | — |
| description | Parent writes | — |
| targetUnderstanding | Parent writes directly (this is the entry point) | High |
| watchFor | Parent writes directly | High |
| pivot | Parent writes (optional) | Medium |
| steps | Parent writes in shared editor | — |
| materials | Parent writes in shared editor | — |
| capabilities | AI suggests from understanding text | Inferred |
| sourceGoal | Captured from entry screen text | Explicit |

**Capability mode:**

| Field | Source | Confidence |
|-------|--------|------------|
| title | From skeleton, parent edits | High (curated) |
| description | From skeleton, parent edits | High (curated) |
| targetUnderstanding | AI generates from thread definition + skeleton approach | High |
| watchFor | **Directly from capability thread indicator definitions** | High (curriculum-aligned) |
| pivot | AI suggests from thread definitions ("If not progressing, try...") | Medium |
| steps | From skeleton, parent edits | High (curated) |
| materials | From skeleton's activity type | Medium |
| capabilities | **Primary thread is the entry point** (explicit). Secondary threads AI-suggested | Primary: Explicit, Secondary: Inferred |
| sourceCapability | Captured from entry screen (thread + tier) | Explicit |

#### 3.5.7 Constellation Integration (Capability Mode)

This mode has the tightest integration with the Capabilities Constellation:

- **Entry from Constellation:** Tapping a thread node with low coverage shows an action: "Build a module to develop this." Pre-fills the path.
- **Exit to Constellation:** After a module created via capability mode is run and logged, the resulting observations feed back into the Constellation.
- **HEU Report integration:** Capability-mode modules are tagged with their target curriculum area, improving HEU coverage metrics. These modules have the strongest coverage contribution of any path because their thread mappings are explicit and curriculum-aligned.

#### 3.5.8 Edge Cases

**Aspiration mode:**
- **Parent writes vague understanding:** "I want them to learn about science." System nudges: "Can you make this more specific? What aspect of science, and what would understanding look like?"
- **Parent writes activity, not understanding:** "I want them to build a birdhouse." System recognises this as a process/activity description and suggests: "That sounds like a great activity! The 'I know how this goes' path might be a better fit. Or can you tell us what building a birdhouse teaches — that's the understanding goal."
- **Parent writes multiple understandings:** System flags: "It looks like there might be more than one learning goal here. Modules work best with one clear focus — which is the main one?"

**Capability mode:**
- **Freeform text doesn't map to a thread:** "I want them to be more confident." System responds: "Confidence shows up in lots of areas. Can you tell me more about where? Is it social situations, academic work, physical challenges, or something else?" Helps narrow to a specific thread.
- **Child is already at Demonstrating:** The system shows: "It looks like [child] is already solid in this area. Would you like to create a module that challenges them further, or focus on a different area?" Option to create an enrichment module or redirect.
- **Multiple children at different tiers:** Skeleton generation targets the *lower* tier as the module's focus, with enrichment notes for the more advanced child.
- **No curated skeletons for preferences:** AI generates a fully custom skeleton. Marked as "Suggestion" rather than "Recommended."

#### 3.5.9 Boundary Definitions

| Adjacent path | Distinction | Redirect signal |
|--------------|-------------|-----------------|
| **Material-Anchored** | Goal-Forward: parent has a target but no vehicle. Material-Anchored: parent has a vehicle (resource). If they have both, Material-Anchored is usually better because the resource provides concrete structure. | If parent mentions a specific resource in goal text → "Sounds like you have a resource in mind — want to start there instead?" |
| **Inquiry** | "I want them to understand why leaves change colour" (Goal-Forward) vs "Why do leaves change colour?" (Inquiry). Goal-Forward is parent-directed. Inquiry preserves child ownership. | No redirect needed — the framing choice is intentional |
| **Process** | Goal-Forward starts from *wanting*. Process starts from *doing*. A parent who knows what they want but hasn't figured out the activity → Goal-Forward. A parent who already knows the activity → Process. | If parent writes steps in the aspiration-mode textarea → suggest Process |

---

## 4. The Shared Editor (Post-Entry Convergence)

After the path-specific entry screen, all five paths converge on a single editing view. This is the v3-style single-page scrollable layout, enhanced to show which fields were parent-authored vs AI-suggested.

### 4.1 Layout

The shared editor is identical across paths. The only difference is which fields arrive pre-populated and which are empty. The editor is the same component regardless of origin.

Sections (in scroll order):

1. **The Basics** — Title, description, duration, setting (always editable)
2. **The Steps** — Ordered step list with add/remove/reorder. Per step: title, instructions, optional "What to say", optional observation hint (grey italic if AI-generated)
3. **Materials Needed** — Name + alternative, add/remove
4. **The Learning** — targetUnderstanding, watchFor, pivot
5. **Capabilities** — Tag display with add/remove. AI-suggested tags shown with "suggested" indicator. Parent can accept (promoting to "explicit") or dismiss.
6. **Connect** — Prerequisites (own modules only)

### 4.2 AI Suggestion Display Pattern

Fields populated by AI are shown with a subtle indicator. Design language:

- **AI-suggested text:** Displayed in the field with a thin left border (ember glow). A small "✨ Suggested" label appears below the field. The parent can edit (which removes the label) or clear the field.
- **AI-suggested capability tags:** Shown with a dashed border rather than solid. Tapping/clicking promotes to explicit (solid border) or dismisses.
- **AI-suggested observation hints per step:** Shown as grey italic text beneath the step's instructions. Not in a separate field — inline, subordinate. Parent can edit or remove.

This pattern is consistent with Hearth's principle that AI suggestions are advisory — the parent makes all decisions. The visual language communicates "the system thought this, but it's yours to decide."

### 4.3 Completeness Gate

| Field | Weight | Notes |
|-------|--------|-------|
| Title | 20% | Always required |
| Description | 10% | Required but brief |
| At least one step with title + instructions | 20% | Core content |
| targetUnderstanding | 20% | May be AI-generated — counts if populated regardless of source |
| watchFor | 15% | May be AI-generated |
| At least one capability tag | 15% | May be AI-suggested |

**Save enabled at 60%.** This means title + one step + understanding = save-ready. Everything else is gravy.

### 4.4 Re-Entry & Editing Existing Modules

When a parent opens a saved module for editing, the `createdVia` field determines which entry screen is shown if they want to "restart" the module. However, the shared editor is always the default editing view for existing modules — the entry screen is only re-shown if the parent explicitly requests it.

---

## 5. AI Processing Architecture

### 5.1 Builder-Time vs Write-Time AI

The existing AI architecture (documented in `Hearth_AI_Intelligence_Layer_Architecture.md`) defines write-time as the only LLM touchpoint. The Module Builder introduces a second touchpoint: **builder-time AI**.

```
EXISTING ARCHITECTURE:
  Logger entry save → Write-time NLP pipeline → Enriched entry → Snapshot rebuild

NEW ADDITION:
  Builder pathway transition → Builder-time inference → Pre-populated module fields
  Builder module save → (no additional LLM call — module data is already structured)
```

Builder-time AI is a new cost centre. Key differences from write-time:

| | Write-time (Logger) | Builder-time (Module Builder) |
|---|---|---|
| **Trigger** | Entry save | Pathway transition (entry screen → shared editor) |
| **Frequency** | 1-5x daily per family | Occasional — families create modules infrequently |
| **Latency budget** | <3 seconds | <5 seconds (can show loading state) |
| **Token budget** | <2,000 tokens | <1,500 tokens per pathway |
| **Model** | Haiku (Sonnet fallback) | Haiku (Sonnet fallback, lower threshold for Inquiry path) |
| **Output** | Enriched entry fields | Pre-populated module fields |

### 5.2 Token Budget by Pathway

| Pathway | Estimated Tokens | AI Tasks | Notes |
|---------|-----------------|----------|-------|
| Material-Anchored | ~1,200 | Understanding inference, template customisation, capability suggestion | Medium cost — understanding inference is the expensive part |
| Process/Steps | ~1,000 | Understanding inference from steps, capability mapping, per-step hints | Medium cost — deferred until steps are entered |
| Inquiry | ~1,400 | Understanding reverse-engineering, step customisation, capability mapping | Highest cost — most open-ended inference |
| Retrospective Lift | ~1,200 | Synthesis across entries (entries already enriched) | Medium cost — leverages pre-computed enrichments |
| Goal-Forward (aspiration) | ~800 | Capability suggestion, per-step hints (deferred), coherence check | Lowest cost — parent provides most fields |
| Goal-Forward (capability) | ~1,000 | Skeleton assembly, understanding generation | Medium cost — largely pre-authored components |

### 5.3 Caching & Cost Optimisation

**Capability thread taxonomy:** Cached in the builder-time prompt using the same compressed format as the Logger pipeline (thread IDs + keywords, not full definitions). ~500 tokens in system prompt, shared across all paths.

**Session templates:** Stored client-side (Material-Anchored, Inquiry). No token cost for template lookup.

**Skeleton library:** Stored server-side but loaded on demand (Goal-Forward capability mode). No token cost for skeleton retrieval — only for customisation.

**Repeat inference avoidance:** If a parent enters the entry screen, gets AI suggestions, goes back to change something, and re-transitions, the system caches the previous inference result and only re-runs if the input changed meaningfully (debounce + input hash comparison).

### 5.4 Fallback Behaviour

If AI inference fails (API error, timeout, low confidence):

- **Fields that would have been AI-populated show as empty** with a hint: "We couldn't suggest anything — you can write this yourself, or try again."
- **The module is still fully saveable.** AI enrichment is additive, never blocking.
- **No error modals.** The builder degrades gracefully to the v3 experience — all fields are parent-editable.
- **Retry button** per field group: "✨ Try suggesting again"

### 5.5 Pre-Authored Content Systems

Two pre-authored content libraries power the builder's ability to suggest steps rather than requiring the parent to write from scratch. They share a design philosophy: human-authored structures that AI customises, not AI-generated from scratch.

| | Session Templates | Skeleton Library |
|---|---|---|
| **Serves** | Material-Anchored | Goal-Forward (capability mode) |
| **Indexed by** | Resource type × usage intent | Capability thread × tier × activity preference |
| **Total records (Phase 1)** | ~26 templates | ~138 skeletons (90 curated + 48 domain-generic) |
| **AI role** | Fill in `[AI customises]` placeholders | Assemble from library + customise with thread indicators |
| **Parent experience** | Steps pre-populated in shared editor, parent refines | 2-3 skeleton cards to choose from, then shared editor |
| **Storage** | Application code (migrate to Sanity later) | Sanity CMS from the start |
| **Authoring effort** | ~8-10 hours | ~35-40 hours |
| **Fallback for gaps** | `other.default` generic template | AI-generated skeleton (Tier 3, flagged as `confidence: 'generated'`) |

Both systems are authored during the pre-launch content sprint alongside the Jumpstart Classical pack. Total content authoring for the builder: approximately 45-50 hours.

---

## 6. Cross-System Integration Points

### 6.1 Logger → Builder (Retrospective Lift)

**Data flow:** Logger entries (enriched) → Pattern detection (Snapshot rebuild) → Surfacing (Dashboard, Logger post-save) → Retrospective Lift entry screen → Synthesis AI call → Shared editor.

**Key constraint:** The builder reads from enriched Logger entries but never modifies them. The `sourceLogs` field stores entry IDs for provenance — not for ongoing sync.

### 6.2 Constellation → Builder (Goal-Forward Capability Mode)

**Data flow:** Capability thread state (per-learner, in PostgreSQL) → Constellation display → "Build a module" action → Goal-Forward entry screen (pre-populated, capability mode) → Skeleton generation → Shared editor.

**Key constraint:** The Constellation provides read-only context. The builder doesn't write to Constellation state. Constellation updates happen when modules are *run and logged* — through the normal Logger → Snapshot pipeline.

### 6.3 Builder → Runner

**Data flow:** Saved module → `toRunnerFormat()` transformation → Module Experience runner.

All five pathways produce the same schema. The runner doesn't know or care which pathway created the module.

### 6.4 Builder → HEU Report

Modules with capability thread mappings contribute to HEU curriculum coverage metrics when they're run and logged. Modules created via Goal-Forward capability mode have the strongest coverage contribution because their thread mappings are explicit and curriculum-aligned.

### 6.5 Builder → Dashboard

The Dashboard surfaces:
- Module creation prompts (Retrospective Lift pattern detection)
- Recently created modules in the "Continue" section
- Nudges to run created modules ("You made 'Nature Walks' last week — ready to try it?")

### 6.6 Builder → Activity Discovery

Parent-created modules appear in Activity Discovery alongside marketplace content. They're tagged with a "Created by you" badge (not a price — membership framing applies). The `createdVia` field allows filtering by creation pathway (future enhancement).

---

## 7. Entry Selector Layout

The entry selector presents five cards in three sections, ordered by cognitive concreteness:

```
┌──────────────────────────────────────────────┐
│  Create a Module                             │
│  How would you like to start?                │
│                                              │
│  ── Most natural ──────────────────────────  │
│                                              │
│  📖  I have something to teach through       │
│      Describe a book, kit, video, or place   │
│      — we'll build the learning              │
│                                              │
│  🔧  I know how this activity goes           │
│      Capture your steps — we'll show you     │
│      what they're teaching                   │
│                                              │
│  ❓  Something sparked a question            │
│      Share a wonder — we'll structure        │
│      the investigation                       │
│                                              │
│  ── From your learning ────────────────────  │
│                                              │
│  🔁  We've been doing this already           │
│      We noticed patterns in your logs —      │
│      ready to formalise?                     │
│      [3 patterns found]                      │
│                                              │
│  ── More structured ───────────────────────  │
│                                              │
│  🎯  I have a learning goal                 │
│      Tell us the target — we'll help you     │
│      get there                               │
│                                              │
│  ─────────────────────────────────────────── │
│  Not sure where to start? Browse Activity    │
│  Discovery for ideas →                       │
│                                              │
└──────────────────────────────────────────────┘
```

### 7.1 Card Language Pattern

Every card follows the structure: **parent voice label** (what I'm bringing) + **system promise hint** (what we'll do with it). This makes each card a mini contract.

| Path | Label (parent voice) | Hint (system promise) | Transition CTA |
|------|---------------------|----------------------|----------------|
| Material-Anchored | "I have something to teach through" | Describe a book, kit, video, or place — we'll build the learning | "Build the learning around this →" |
| Process | "I know how this activity goes" | Capture your steps — we'll show you what they're teaching | "Capture the steps →" |
| Inquiry | "Something sparked a question" | Share a wonder — we'll structure the investigation | "Plan the exploration →" |
| Retrospective Lift | "We've been doing this already" | We noticed patterns in your logs — ready to formalise? | "Review the evidence →" |
| Goal-Forward (aspiration) | "I have a learning goal" | Tell us the target — we'll help you get there | "Plan the activities →" |
| Goal-Forward (capability) | "I have a learning goal" | Tell us the target — we'll help you get there | "See some ideas →" |

### 7.2 Section Rationale

**Most natural:** These three paths start from things parents naturally hold — a resource, a known process, a child's question. They require the least educational vocabulary and are where most parents will start.

**From your learning:** Retrospective Lift sits alone because it's system-initiated. The section heading signals that this isn't about bringing something new — it's about recognising what's already there.

**More structured:** Goal-Forward requires the parent to articulate an educational target. It's the most educationally intentional path and the one most likely to be chosen by experienced homeschoolers or parents reviewing their Constellation/HEU data.

### 7.3 Conditional States

- **Retrospective Lift:** Shows badge count when patterns are detected. Dimmed with hint text when no patterns exist.
- **Goal-Forward:** If the parent arrives from Constellation or HEU Report via contextual action, the entry selector is skipped — the parent lands directly on the Goal-Forward entry screen in capability mode.

### 7.4 Fallback / "Inspire Me" Prompt

A small link below the five cards directs parents who arrive empty-handed: "Not sure where to start? Browse Activity Discovery for ideas →". This addresses the stress-test finding (Scenario 41) that no path serves a parent with no starting point. The builder assumes the parent brings *something*; Activity Discovery is the right feature for inspiration and browsing.

---

## 8. Analytics & Learning

The `createdVia` field enables valuable analytics:

- **Pathway popularity:** Which paths are most used? (Hypothesis: Material-Anchored and Process lead.)
- **Completion rates by pathway:** Do some paths produce more drafts that never get completed? (Hypothesis: Inquiry may have lower completion because the exploration itself becomes the activity, not the module.)
- **AI acceptance rates:** How often do parents keep AI-suggested understanding statements vs rewrite them? Per pathway.
- **Module quality by pathway:** Are modules from certain pathways run more often? Logged more richly? Generate more capability observations?
- **Conversion funnel:** Entry screen → Shared editor → Save draft → Complete → Run module. Per pathway.
- **Goal-Forward mode split:** What percentage of Goal-Forward usage is aspiration vs capability mode? Does thread-match acceptance increase over time as families build Constellation data?
- **Cross-path redirects:** How often do redirect nudges fire? Are they accepted or dismissed? This validates whether the boundary definitions are correct.

---

## 9. Implementation Sequencing

### Phase A: Entry Selector Update + Process Path
- Update entry selector from six to five cards
- Process path is already 90% built as v3 — needs entry screen framing and AI enrichment hooks

### Phase B: Material-Anchored Path
- Session template system
- Understanding inference from resource description
- Resource type selector + usage intent UI

### Phase C: Inquiry Path
- Question domain classifier (client-side keyword matching)
- Investigation type taxonomy
- Understanding reverse-engineering AI prompt
- Step generation from investigation type × question domain

### Phase D: Goal-Forward Path
- Entry screen with dual-mode detection (thread keyword matching)
- Aspiration mode: coherence check AI, capability suggestion
- Capability mode: skeleton library, tier assessment, preference filter
- Constellation contextual entry integration

### Phase E: Retrospective Lift Path
- Pattern detection integration (requires Logger + Snapshot to be live)
- Synthesis AI call
- Entry screen with entry review/deselect UX
- Dashboard and Logger surfacing integration

### Rationale for sequencing:
- Process is already built (v3) — lowest effort to complete
- Material-Anchored is highest-usage — next priority
- Inquiry is the most pedagogically distinctive — builds brand differentiation
- Goal-Forward combines two v1 paths and introduces the skeleton library — moderate effort
- Retrospective Lift requires Logger data — can't test without usage history; last because of data dependency

---

## 10. Open Questions

| # | Question | Affects | Notes |
|---|----------|---------|-------|
| 1 | Should builder-time AI calls count toward the family's daily token budget, or have a separate allocation? | Cost model | Module creation is infrequent — separate allocation may be simpler |
| 2 | Can the Material-Anchored path accept a photo of the resource (book cover, kit box) and use vision to populate fields? | Phase 3 AI | Aligns with Phase 3 vision recognition work. Not MVP. |
| 3 | Should the Retrospective Lift pathway create a "smart module" that updates its understanding statement as more entries are logged? | Architecture | Exciting but complex. Deferred. |
| 4 | How should multi-child families handle capability mode when children are at different tiers? | UX | Current answer: target the lower tier with enrichment notes. May need refinement. |
| 5 | Should module templates (session templates, skeletons) be Sanity-managed or application code? | CMS architecture | Sanity = content team can update without deploys. App code = simpler initially. |
| 6 | What's the maximum number of Logger entries the Retrospective Lift synthesis can consume before token budget is exceeded? | AI cost | Estimate: 8-10 entries × ~100 tokens each = 800-1000 tokens of input. Cap at 10 entries. |
| 7 | Should the entry selector remember the parent's last-used pathway? | UX | Could reduce selection friction but might also create a rut. |
| 8 | Should Goal-Forward aspiration mode offer an "upgrade to capability mode" mid-flow if AI detects a thread match in the shared editor? | UX | Could surface skeleton suggestions to parents who didn't initially match a thread. |

---

## 11. Files & References

| File | Role |
|------|------|
| `hearth-module-builder-v4.html` | Entry selector prototype (to be updated for five-path layout) |
| `hearth-module-builder-v3.html` | Previous version — lightweight process builder (preserved) |
| `hearth-module-builder-v2.jsx` | Previous version — professional UbD tool (preserved) |
| `module-builder-v3-design-spec.md` | v3 spec (predecessor) |
| `module-builder-implementation-brief.md` | Professional 7-stage pipeline spec |
| `hearth-module-builder-pathways-architecture-v1.md` | **Previous version of this document** (six-pathway system, preserved) |
| `hearth-module-builder-pathways-architecture-v2.md` | **This document** |
| `stress-test-scenarios.md` | 100-scenario stress test with routing analysis and findings |
| `Hearth_AI_Intelligence_Layer_Architecture.md` | AI service architecture |
| `hearth-capability-thread-library.md` | 57-thread taxonomy (audit social-emotional coverage) |
| `hearth-capabilities-connector-architecture.md` | Constellation data model |
| `Hearth_Module_Experience_UX_Flows.md` | Runner UX flows |

---

## 12. COMPONENT_REGISTRY.md Updates

Row 9 should change to:

| 9 | Module Builder v5 | hearth-module-builder-v5.html (when built) | Entry selector for 5-pathway module creation system | Five entry paths (Material, Process, Inquiry, Retrospective, Goal-Forward) each producing universal module schema. Spec: hearth-module-builder-pathways-architecture-v2.md |

Previous versions preserved:
- hearth-module-builder-v4.html (six-path entry selector)
- hearth-module-builder-v3.html (parent lightweight process builder)
- hearth-module-builder-v2.jsx (professional UbD tool)

---

*This document captures the five-pathway module builder architecture as of 17 March 2026. It supersedes the six-pathway v1 spec following the merger of Understanding-First and Capability-Targeted into the Goal-Forward path. Stress-tested against 100 real-world parent scenarios with 86% clear/lean routing. Card language, session template library (26 templates), and skeleton library architecture (138 Phase 1 records) are locked. Each pathway will be designed and built in dedicated sessions, referencing this spec as the authoritative source for schema, AI processing, and cross-system integration.*
