# Hearth Projects â€” Multi-Stage Scaffolded Learning Experiences

## Design Specification & Content Architecture

---

## 1. What is a Project?

A **Project** is a new content type in Hearth that sits alongside (and above) Packs in the content hierarchy. Projects are sequential, scaffolded builds where each stage produces an artifact that feeds the next stage, progressively increasing in complexity and building toward a capstone showcase and badge.

### How Projects Differ from Packs

| Dimension | Pack | Project |
|-----------|------|---------|
| **Structure** | Themed collection of related modules | Sequential stages with strict dependencies |
| **Order** | Suggested but flexible | Required â€” each stage builds on previous |
| **Artifacts** | Each module produces independent evidence | Each stage produces an artifact used by the next |
| **Duration** | 2+ weeks of content | 3â€“6 weeks with defined pacing |
| **Subjects** | Usually 1â€“2 primary subjects | Cross-domain by design (3â€“5 subjects) |
| **Badge model** | Entry â†’ Capstone (2 badges) | Stage badges accumulate â†’ Capstone (8â€“10 badges) |
| **Commitment** | Drop in, do any module | Commit to the arc, stages compound |
| **Portfolio** | Standalone evidence items | Auto-compiled portfolio sequence |
| **Metaphor** | A recipe box (pick what you like) | A master recipe (follow the process) |

### The Expanded Content Hierarchy

```
Content Types:
â”œâ”€â”€ Activity (standalone, single session, 15â€“45 min)
â”‚   â””â”€â”€ e.g., "Texture Rubbing Walk"
â”‚   â””â”€â”€ Smallest unit. No dependencies. Quick win.
â”‚
â”œâ”€â”€ Module (multi-session, single understanding target)
â”‚   â””â”€â”€ e.g., "Observing Closely" â€” 4â€“6 sessions
â”‚   â””â”€â”€ Multiple approaches, same target understanding.
â”‚
â”œâ”€â”€ Pack (themed collection of related modules)
â”‚   â””â”€â”€ e.g., "Little Nature Scientists" â€” 5 modules, 2+ weeks
â”‚   â””â”€â”€ Modules are related but mostly independent.
â”‚
â””â”€â”€ Project (sequential multi-stage build toward capstone artifact)
    â””â”€â”€ e.g., "My Imaginary Friend" â€” 8 stages, 3â€“4 weeks
    â””â”€â”€ Stages are strictly sequential. Artifacts compound.
    â””â”€â”€ Cross-domain coverage. Rich portfolio output.
```

---

## 2. Project Data Model

### Sanity Schema: `hearthProject`

```javascript
hearthProject {
  // Identity
  title: string                    // "My Imaginary Friend"
  slug: slug                       // URL-safe identifier
  description: richText            // Marketing/discovery description
  coverImage: image                // Visual for cards and hero
  
  // Target Understanding (UbD)
  targetUnderstanding: {
    statement: string              // Parent-facing understanding
    childFriendlyVersion: string   // Child-facing version
    parentExplanation: string      // Why this project matters
  }
  
  // Classification
  ageRange: { min: number, max: number }
  estimatedSpan: {
    weeks: { min: number, max: number }  // 3â€“4 weeks
    totalSessions: { min: number, max: number }  // 8â€“12 sessions
  }
  subjects: string[]               // ['english', 'visual-arts', 'technologies', 'hpe', 'hass']
  primarySubject: string           // 'visual-arts'
  setting: 'indoor' | 'outdoor' | 'either'
  commitmentLevel: 'light' | 'moderate' | 'deep'  // Signals investment upfront
  
  // Stages (ordered)
  stages: [reference to hearthProjectStage]  // Strict order
  
  // Badge Journey
  capstoneBadge: {
    title: string                  // "Imaginary Friend Maker"
    icon: string                   // Emoji or asset reference
    description: string            // What earning this means
    awardCriteria: string          // "Complete all 8 stages and present showcase"
  }
  
  // Discovery
  tags: string[]                   // For search/filter
  difficulty: 'gentle' | 'moderate' | 'ambitious'
  
  // Curriculum Mapping
  curriculumCoverage: [{
    subject: string
    skills: string[]               // Human-readable skill descriptions
    contentDescriptors: string[]   // AC V9 codes (optional, auto-suggested)
  }]
  
  // Marketplace
  pricing: { isFree: boolean, price: number, currency: string }
  author: reference to hearthCreator
}
```

### Sanity Schema: `hearthProjectStage`

```javascript
hearthProjectStage {
  // Identity
  stageNumber: number              // 1â€“N, strict order
  title: string                    // "The Spark â€” Who Will My Friend Be?"
  subtitle: string                 // "Imagination, personality, identity"
  description: richText            // What happens in this stage
  
  // Classification
  stageType: string                // See Stage Type Taxonomy below
  primaryDomain: string            // 'imagination', 'narrative', 'visual-arts', etc.
  duration: { min: number, max: number, unit: 'minutes' }
  sessionSpan: number              // How many sessions this might take (1â€“3)
  setting: 'indoor' | 'outdoor' | 'either'
  energyLevel: 'calm' | 'moderate' | 'active'
  
  // Artifact System (KEY DIFFERENTIATOR)
  produces: {
    artifactType: string           // See Artifact Type Taxonomy
    artifactDescription: string    // "A 2D character portrait"
    isPortfolioEvidence: boolean   // Almost always true
    portfolioCategory: string      // 'writing' | 'visual' | 'construction' | 'presentation'
  }
  
  dependsOn: [{
    stageRef: reference to hearthProjectStage
    artifactNeeded: string         // "Character profile from Stage 2"
    instruction: string            // "Pull out the written profile so you can reference it"
  }]
  
  // Content (reuses existing Module content blocks)
  materials: [{ item: string, required: boolean, substitute: string }]
  activities: richText             // Step-by-step instructions (philosophy-neutral Layer 1)
  
  // Facilitation
  watchFor: string[]               // Observable learning indicators
  sayThis: [{ label: string, text: string }]  // Key phrases
  pauseNotes: string[]             // "Let them lead" moments
  
  // Pedagogical Lenses (Layer 3)
  pedagogicalLenses: [{
    framework: string              // 'charlotte-mason', 'montessori', 'waldorf', etc.
    guidance: richText
    environmentPrep: string[]
    languageToUse: string
  }]
  
  // Badge
  stageBadge: {
    title: string                  // "Portrait Artist"
    icon: string
    awardCriteria: string
  }
  
  // Navigation
  comingNext: {
    preview: string                // "Stage 4: Your child will draw from multiple angles..."
    whatToKeep: string             // "Keep the 2D drawing accessible for reference"
  }
}
```

### Stage Type Taxonomy

| Type | Description | Typical Activities |
|------|-------------|-------------------|
| `brainstorm` | Idea generation, imagination, concept development | Question prompts, mind maps, story dice |
| `writing` | Narrative, descriptive, or informational text creation | Profiles, stories, field guide entries, labels |
| `drawing-2d` | Flat visual representation | Portraits, illustrations, diagrams, maps |
| `drawing-3d` | Multi-angle or perspective drawing | Turnarounds, blueprints, technical sketches |
| `construction` | Physical 3D building | Sculpture, dioramas, models, structures |
| `research` | Information gathering and synthesis | Observation, reading, interviewing, collecting |
| `documentation` | Recording and organising evidence | Photography, journaling, cataloguing |
| `design` | Planning and prototyping | Layouts, mockups, material selection |
| `performance` | Live demonstration or presentation | Showcase, reading aloud, exhibition, audio recording |
| `reflection` | Looking back, evaluating, planning forward | Self-assessment, portfolio review, goal-setting |
| `experimentation` | Testing, iterating, problem-solving | Science experiments, recipe testing, material trials |
| `composition` | Combining multiple elements into a whole | Editing, sequencing, arranging, binding |

### Artifact Type Taxonomy

| Type | Description | Portfolio Display |
|------|-------------|------------------|
| `concept-notes` | Brainstorm output, recorded ideas | Text/audio snippet |
| `written-text` | Story, profile, guide entry, letter | Formatted text |
| `drawing` | 2D visual artwork | Image (photo of work) |
| `blueprint` | Multi-angle or technical drawings | Image gallery |
| `sculpture` | Physical 3D construction | Photo(s) from multiple angles |
| `scene` | Diorama, backdrop, environment | Photo(s) |
| `illustrated-book` | Combined text and images | Image gallery / PDF |
| `recording` | Audio or video capture | Embedded media |
| `presentation` | Live showcase documentation | Photo + reflection notes |
| `collection` | Curated set of items or specimens | Photo grid + descriptions |

---

## 3. UX Flow

### Project Discovery

Projects appear in the Activity Discovery browse screen alongside Modules. They are visually distinguished by:

- A **"Multi-Stage Project"** type badge (purple/lavender) instead of session count
- **Week estimate** instead of per-session duration
- **Subject pill array** showing cross-domain coverage
- **Stage count** ("8 stages Â· 3â€“4 weeks")

```
Module Card:                       Project Card:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ â–“â–“â–“ SCIENCE          â”‚          â”‚ â—† MULTI-STAGE PROJECTâ”‚
â”‚ Observing Closely    â”‚          â”‚ My Imaginary Friend  â”‚
â”‚ 4 sessions Â· 15 min  â”‚          â”‚ 8 stages Â· 3â€“4 weeksâ”‚
â”‚                      â”‚          â”‚                      â”‚
â”‚ [Kinesthetic] 5â€“7    â”‚          â”‚ [Eng][Art][Tech] 5â€“8 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Project Overview Screen

When a parent taps a Project card, they see:

1. **Hero**: Title, subtitle, key metadata (weeks, ages, setting), subject pills
2. **Understanding block**: Target understanding + child-friendly version
3. **Stage journey map**: Vertical timeline of all stages with status (completed / active / upcoming / locked)
4. **Badge journey**: Horizontal track showing milestone badges â†’ capstone
5. **Curriculum coverage grid**: Visual breakdown of subjects covered
6. **CTA**: "Start Stage 1" or "Continue Stage N"

### Stage Detail Screen

Tapping a stage opens the detail view with:

**Main column:**
- Artifact dependencies ("You'll need your character profile from Stage 2")
- Step-by-step activities (philosophy-neutral Layer 1)
- Watch For indicators
- Pedagogical lenses

**Sidebar:**
- Materials checklist
- What this stage produces (artifact description)
- Badge milestone
- What comes next preview

**CTA**: "Start This Stage â†’" launches the existing Module Experience (Prep â†’ Facilitate â†’ Log) for this stage.

### Stage Completion Flow

When a parent completes the Log phase of a stage:

1. **Artifact capture prompt**: "Take a photo of the character drawing" / "Save the written profile"
2. **Badge award**: Stage badge animation + congratulations
3. **Portfolio auto-add**: Artifact added to the project's portfolio sequence
4. **Next stage unlocked**: Journey map updates, dependency note shows ("You'll need today's drawing for Stage 4")
5. **Return to Project Overview**: Updated progress ring, next stage highlighted

---

## 4. Project Blueprints

### Project 1: My Imaginary Friend

**Target understanding**: Creative ideas can be developed and expressed through multiple mediums, and each medium reveals different aspects of the same idea.

**Ages**: 5â€“8 Â· **Duration**: 3â€“4 weeks Â· **Subjects**: English, Visual Arts, Technologies, HPE, HASS

| Stage | Title | Type | Duration | Produces | Badge |
|-------|-------|------|----------|----------|-------|
| 1 | The Spark â€” Who Will My Friend Be? | `brainstorm` | 20â€“30 min | Concept notes | Character Dreamer |
| 2 | The Profile â€” Writing My Friend's Story | `writing` | 20â€“40 min | Written character profile | Story Writer |
| 3 | First Sight â€” Drawing My Friend in 2D | `drawing-2d` | 25â€“40 min | 2D character portrait | Portrait Artist |
| 4 | Taking Shape â€” Drawing in 3D | `drawing-3d` | 25â€“40 min | Multi-angle blueprint | Designer |
| 5 | Coming to Life â€” Sculpting | `construction` | 30â€“60 min | Physical sculpture | Sculptor |
| 6 | My Friend's World â€” Habitat | `construction` | 25â€“45 min | Diorama / scene | World Builder |
| 7 | The Adventure â€” Story Together | `composition` | 30â€“45 min | Illustrated story | Story Weaver |
| 8 | Introducing My Friend â€” Showcase | `performance` | 15â€“25 min | Presentation | **â˜… Imaginary Friend Maker** |

**Dependency chain**: 1 â†’ 2 â†’ 3 â†’ 4 â†’ 5; 2+5 â†’ 6; 1-6 â†’ 7; All â†’ 8

---

### Project 2: Our Backyard Nature Guide

**Target understanding**: Scientific observation and clear writing can help others understand and appreciate the natural world around us.

**Ages**: 6â€“10 Â· **Duration**: 4â€“5 weeks Â· **Subjects**: Science, English, Visual Arts, Technologies

| Stage | Title | Type | Duration | Produces | Badge |
|-------|-------|------|----------|----------|-------|
| 1 | Becoming a Naturalist | `research` | 20â€“30 min | Observation toolkit | Nature Watcher |
| 2 | Species Spotting â€” Field Observations | `documentation` | 30â€“45 min Ã— 3â€“4 sessions | Field notes + photos | Field Recorder |
| 3 | Research Station â€” Learning More | `research` | 25â€“40 min | Species fact sheets | Nature Researcher |
| 4 | Writing Field Guide Entries | `writing` | 30â€“45 min | Written entries with habitat, behaviour, ID tips | Guide Writer |
| 5 | Illustrating Your Specimens | `drawing-2d` | 25â€“40 min | Scientific illustrations | Nature Illustrator |
| 6 | Designing the Guide | `design` | 20â€“35 min | Layout, cover, contents page | Book Designer |
| 7 | Binding the Book | `construction` | 30â€“45 min | Physical bound book | Book Maker |
| 8 | The Launch â€” Presenting Your Guide | `performance` | 15â€“25 min | Presentation + donated copy | **â˜… Field Guide Author** |

---

### Project 3: The Family Cookbook

**Target understanding**: Recipes are a form of procedural writing that combines measurement, science, and cultural storytelling.

**Ages**: 5â€“9 Â· **Duration**: 4â€“6 weeks Â· **Subjects**: Maths, Science, English, Technologies, HASS

| Stage | Title | Type | Duration | Produces | Badge |
|-------|-------|------|----------|----------|-------|
| 1 | Family Food Stories | `research` | 20â€“30 min | Interview notes, family favourites list | Food Historian |
| 2 | Recipe Testing Lab | `experimentation` | 45â€“60 min Ã— 3â€“4 sessions | Tested recipes with notes | Kitchen Scientist |
| 3 | Measurement Mastery | `experimentation` | 20â€“35 min | Measurement conversion card | Measure Master |
| 4 | Writing Recipes Clearly | `writing` | 30â€“40 min | Formatted recipe cards | Recipe Writer |
| 5 | Food Photography & Illustration | `documentation` | 25â€“40 min | Photos and/or illustrations | Food Photographer |
| 6 | Designing the Layout | `design` | 25â€“40 min | Page layouts, cover, section dividers | Layout Designer |
| 7 | Assembling the Cookbook | `composition` | 30â€“45 min | Bound or printed cookbook | Book Maker |
| 8 | The Family Feast | `performance` | 60â€“90 min | Cooked meal from the book + presentation | **â˜… Master Chef Publisher** |

---

### Project 4: Build a Mini Town

**Target understanding**: The places where people live are shaped by geography, community needs, and the decisions of the people who build them.

**Ages**: 5â€“9 Â· **Duration**: 3â€“4 weeks Â· **Subjects**: Maths, HASS, Technologies, Visual Arts

| Stage | Title | Type | Duration | Produces | Badge |
|-------|-------|------|----------|----------|-------|
| 1 | Town Walk â€” Observing Our Neighbourhood | `research` | 30â€“45 min | Photo walk + observation notes | Neighbourhood Explorer |
| 2 | Mapping the Land | `drawing-2d` | 25â€“40 min | Hand-drawn town map / plan | Cartographer |
| 3 | Designing Buildings | `drawing-3d` | 25â€“40 min | Building blueprints with measurements | Architect |
| 4 | Building Scale Models | `construction` | 30â€“60 min Ã— 2â€“3 sessions | Cardboard/craft buildings | Model Maker |
| 5 | Streets and Spaces | `construction` | 25â€“40 min | Road layout, parks, public spaces | Town Planner |
| 6 | The People â€” Who Lives Here? | `writing` | 20â€“35 min | Character profiles for town residents | Story Creator |
| 7 | Signs, Details and Life | `construction` | 20â€“35 min | Signs, gardens, vehicles, finishing touches | Detail Artist |
| 8 | Town Tour â€” The Grand Opening | `performance` | 15â€“25 min | Guided tour presentation | **â˜… Town Planner** |

---

### Project 5: Stop Motion Movie

**Target understanding**: Animated storytelling combines writing, visual design, technical skills, and patience to create the illusion of movement from still images.

**Ages**: 7â€“12 Â· **Duration**: 4â€“5 weeks Â· **Subjects**: Technologies, Visual Arts, English, Music (optional)

| Stage | Title | Type | Duration | Produces | Badge |
|-------|-------|------|----------|----------|-------|
| 1 | Movie School â€” How Animation Works | `research` | 20â€“30 min | Flipbook + animation notes | Animation Apprentice |
| 2 | Writing the Script | `writing` | 30â€“40 min | Script with scenes and dialogue | Screenwriter |
| 3 | Character and Set Design | `design` | 30â€“45 min | Character models + set plans | Production Designer |
| 4 | Building Characters and Sets | `construction` | 30â€“60 min | Physical characters + set pieces | Set Builder |
| 5 | Camera and Lighting Setup | `experimentation` | 20â€“30 min | Test shots, lighting plan | Cinematographer |
| 6 | Filming Scene by Scene | `documentation` | 30â€“45 min Ã— 2â€“3 sessions | Raw photo sequences | Director |
| 7 | Editing and Sound | `composition` | 30â€“45 min | Assembled movie with titles + sound | Film Editor |
| 8 | Premiere Night | `performance` | 20â€“30 min | Screening event + Q&A | **â˜… Film Director** |

---

### Project 6: My Own Museum

**Target understanding**: Museums are places where people preserve, organise, and share knowledge â€” and anyone can curate a collection that teaches others about something they care about.

**Ages**: 6â€“10 Â· **Duration**: 3â€“4 weeks Â· **Subjects**: HASS, Science, English, Visual Arts, Technologies

| Stage | Title | Type | Duration | Produces | Badge |
|-------|-------|------|----------|----------|-------|
| 1 | What Makes a Museum? | `research` | 20â€“30 min | Museum observation notes | Museum Visitor |
| 2 | Choosing Your Collection | `research` | 25â€“35 min | Collection theme + item list | Collector |
| 3 | Researching Your Exhibits | `research` | 30â€“40 min | Research notes per item | Researcher |
| 4 | Writing Museum Labels | `writing` | 25â€“40 min | Exhibition labels and descriptions | Museum Writer |
| 5 | Designing the Display | `design` | 25â€“40 min | Floor plan, display layout, signage | Exhibition Designer |
| 6 | Building Display Cases | `construction` | 30â€“45 min | Physical display arrangements | Display Builder |
| 7 | Creating the Audio Guide | `composition` | 25â€“35 min | Recorded audio tour (phone/tablet) | Audio Guide Creator |
| 8 | Opening Night | `performance` | 20â€“30 min | Exhibition event with guest book | **â˜… Museum Curator** |

---

## 5. Implementation Approach

### Phase 1: Schema + Data Model (Now)

1. Define Sanity schemas for `hearthProject` and `hearthProjectStage`
2. Extend `hearthPack` schema if needed for backwards compatibility
3. Add `artifactType` and `stageType` taxonomies to reference data
4. Create the dependency graph structure

### Phase 2: Hand-Craft First Project (Next)

Following the established "hand-crafted first" principle:

1. Write complete content for "My Imaginary Friend" in Sanity
2. All 8 stages with full Layer 1 content (philosophy-neutral activities)
3. Layer 3 pedagogical lenses for Charlotte Mason, Montessori, and Waldorf
4. Materials lists, watch-for indicators, say-this prompts
5. Badge definitions and criteria

### Phase 3: UI Implementation

1. **Project Card** variant for Activity Discovery browse
2. **Project Overview** screen (hero, stage journey, badge track, curriculum)
3. **Stage Detail** screen (artifact deps, activities, sidebar)
4. **Stage Completion** flow additions to existing Log mode
5. **Portfolio integration** â€” auto-compiled project artifact sequence

### Phase 4: Test with Families

Deploy "My Imaginary Friend" to test families and validate:

- Do families commit to multi-week projects?
- Is the artifact dependency model clear and motivating?
- Does the badge journey sustain engagement across stages?
- Is the portfolio output genuinely impressive for HEU reporting?
- What's the dropout pattern â€” where do families stall?

### Phase 5: Expand Catalogue

Based on learnings, build out remaining project blueprints, prioritising by family demand and curriculum coverage gaps.

---

## 6. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Projects vs. Packs | Separate content type, not an extension | Different structural needs (strict sequence, artifact deps) |
| Stage flexibility | Stages are sequential but internally flexible | Each stage can have multiple approaches like modules |
| Artifact capture | Photo-based, parent-managed | Keeps it simple for MVP; structured capture later |
| Badge granularity | One badge per stage + capstone | Sustains motivation across multi-week commitment |
| Dependency enforcement | Soft (show warning, don't block) | Trust families; some may adapt the order |
| Stage duration | Per-session estimate + session span | Honest about multi-session stages (sculpting) |
| Commitment signalling | "3â€“4 weeks" prominently displayed | Parents need to opt in knowing the investment |
| Portfolio compilation | Automatic sequence from completed stages | Reduces logging burden; artifacts build the portfolio |
| Module Experience reuse | Stages launch into existing Prep/Facilitate/Log flow | No new facilitation UI needed; just wrapper + dependencies |

---

## 7. Relationship to Existing Systems

### Module Experience (Prep â†’ Facilitate â†’ Log)
Each Project stage IS a module experience. The Project wrapper adds context (where you are, what you've made, what's next) but the actual facilitation uses the existing system. No new facilitation UI needed.

### Badge System
Project badges extend the existing badge model. Stage badges are standard badges. The capstone badge has a `requiresAllStages: true` flag and references the project. The badge creation component already supports this.

### Retrospective Logger
Projects create natural retrospective logging moments. Each stage completion triggers a log entry. Families who do project stages without the platform can still log them retrospectively â€” the logger should recognise project stages as a log type.

### Capabilities Constellation
Project stages map to multiple capability threads simultaneously. A single project like "My Imaginary Friend" might touch Fine Motor, Narrative, Observation, Creative Expression, Spatial Reasoning, and Communication threads. This is the constellation system's strongest use case â€” showing how one project illuminates multiple parts of the map.

### HEU Compliance
Projects are compliance goldmines. One "My Imaginary Friend" project generates evidence across 5 subject areas over 3â€“4 weeks. The portfolio sequence tells a clear story of learning progression that any HEU reviewer would find compelling. The curriculum coverage grid makes this explicit.

---

## 8. Content Creation Guidelines for Projects

### The Golden Rules

1. **Every stage must produce something tangible.** No "reflect and discuss" stages without an artifact. Even reflection produces a written reflection or recorded audio.

2. **Artifacts must compound.** Stage 5 uses Stage 4's output which uses Stage 3's output. If removing a stage wouldn't affect later stages, it shouldn't be a stage â€” it should be optional enrichment.

3. **Cross-domain by default.** A project touching only one subject is just a Pack. Projects earn their complexity by naturally spanning 3+ subjects.

4. **The capstone must be shareable.** The final stage produces something the child can show to someone outside the family â€” a book, a presentation, a screening, an exhibition. This is what makes the badge meaningful.

5. **Honest about commitment.** Display weeks, not just minutes. Parents need to opt in knowing this is a multi-week journey. Under-promise and over-deliver on time estimates.

6. **Philosophy-neutral at Layer 1.** Write activities the same way as modules â€” neutral verbs, practical instructions, no embedded philosophy. Layer 3 lenses do the pedagogical adaptation.

7. **Stage badges must feel earned.** Each badge should represent a genuine new skill or milestone, not just "you did the next step." Portrait Artist means something different from Story Writer.

8. **Difficulty should escalate naturally.** Stage 1 should be the easiest, lowest-commitment entry point. If a family drops off after Stage 3, they've still gained something. The project should be front-loaded with quick wins.

---

*Document Version: 1.0*
*Created: February 2026*
*Status: Design specification ready for implementation*
*Next: Hand-craft "My Imaginary Friend" content in Sanity*
