# Hearth — Portfolio / Learning Journey Spec v1

**Component:** Portfolio / Learning Journey  
**Prototype:** `hearth-portfolio-learning-journey.html`  
**Related specs:** `Hearth_Dashboard_Our_Story_Content_Spec.md`, `hearth-capabilities-connector-architecture.md`, `hearth-heu-work-sample-curation-spec-v1.md`, `Hearth_AI_Intelligence_Layer_Architecture.md`  
**Architecture:** `Hearth_System_Interaction_Map.md` §3.6  
**Date:** 2026-03-11  

---

## 1. Purpose

The Portfolio is the per-child evidence gallery within Our Story. It answers: "What has this child learned, and how has their understanding deepened over time?"

It serves two audiences simultaneously. For the parent, it provides emotional reassurance — a tangible record that learning is happening, growing, and connecting across domains. For external stakeholders (HEU reviewers, receiving schools, post-secondary institutions), it provides a documented progression narrative with verifiable evidence.

The Portfolio is not an activity log. An activity log says "we did these things." The Portfolio says "here is how understanding evolved through these experiences." The scaffolded progression display is the mechanism that makes this distinction visible.

### What the Portfolio Is Not

The Portfolio does not launch new logging — it is purely retrospective. There is no "add evidence from here" flow that opens the Logger. The Portfolio does not duplicate the Capabilities Constellation (which visualises the thread graph and progression tiers); instead it provides the narrative evidence trail that the Constellation summarises. The Portfolio does not replace the HEU Report (which is compliance-focused); it accompanies it with a growth-focused lens.

---

## 2. Design Decisions

### 2.1 Thread-first, not timeline-first

**Decision:** The default view organises entries by capability thread, not chronologically.

**Rationale:** A chronological feed answers "what did we do in March?" — useful, but not the Portfolio's primary job. Organising by thread answers "how has Emma's mathematical reasoning developed?" — which is the growth story parents need to tell HEU reviewers and receiving schools, and the emotional reassurance parents need for themselves. The prototype already implements this as the default, with threads as collapsible accordions containing interwoven evidence, journey, and milestone cards.

A chronological view is available as an alternate mode for parents who want a date-ordered retrospective.

### 2.2 Three card types with distinct visual identity

**Decision:** Evidence, Journey, and Milestone cards are visually differentiated by colour treatment and layout — not just labelled differently.

**Rationale:** Each card type plays a different role in the growth narrative. Evidence cards are documentary (neutral coffee treatment) — they record what happened. Journey cards are interpretive (warm ember treatment) — they capture the parent's or AI's observation about *why* a moment mattered. Milestone cards are celebratory (sage green treatment) — they mark a threshold crossing. The visual distinction lets a parent scanning the timeline instantly see the rhythm of activity, insight, and achievement.

### 2.3 Summary card as the monthly highlight

**Decision:** The top of the Portfolio shows a summary card for the current or most recent active month, including a narrative paragraph, active thread focus tags, and aggregate stats.

**Rationale:** Parents arrive at the Portfolio wanting reassurance first, detail second. The summary card delivers the headline — "Here's what's been happening for Emma this month" — before the parent dives into individual threads. This also serves external reviewers who may skim the top before drilling down.

### 2.4 AI generates, parent owns

**Decision:** Journey cards and the monthly summary narrative are AI-generated at write-time (when the underlying Learning Entry is saved), but stored as editable text the parent can revise.

**Rationale:** Most parents won't write growth narratives from scratch — they lack the pedagogical vocabulary and the time (5-minute rule). But they know their child. AI drafts narratives from entry data; the parent reads and can edit. Ownership stays with the parent. The AI is invisible to external stakeholders — the narrative reads as the parent's voice.

### 2.5 Portfolio is a view, not a separate data store

**Decision:** The Portfolio has no independent data layer. It is a filtered, enriched view of Learning Entries, badge awards, and capability thread mappings stored in PostgreSQL. The only Portfolio-specific data points are: starred/highlight flags on entries, and parent edits to AI-generated journey card text.

**Rationale:** Avoids data duplication and sync drift. A Learning Entry logged yesterday appears in the Portfolio immediately on snapshot rebuild, without a separate "add to portfolio" step. The Portfolio reads from the Family Intelligence Snapshot for aggregate data (thread states, narrative summaries) and from Learning Entries directly for card content.

### 2.6 Desktop-first, single-child view

**Decision:** The Portfolio is designed for a sit-down review session, not a quick mobile glance. Layout is desktop-first with a max-width of 1200px. Child switching is handled by tabs in the header (prototype already implements this with Emma/Liam tabs).

**Rationale:** The Portfolio's audience use case is a parent sitting down intentionally to review progress — not a quick check between activities. Mobile responsive design is still provided (the prototype includes breakpoints at 900px and 600px), but the primary design target is a desktop or tablet in landscape.

### 2.7 Pedagogy overlay active

**Decision:** The framing language used in summary narratives, journey card observations, and thread descriptions is adapted to the family's pedagogical philosophy (from the Pedagogy Engine profile).

**Rationale:** A Charlotte Mason family should see "living books and narration" language; an unschooling family should see "child-led discovery" language. The content (what the child did) is philosophy-neutral; the interpretation (how it's described) uses the family's preferred lens. Applied at runtime from the pedagogy overlay set in Sanity.

---

## 3. Card Types — Detailed Specification

### 3.1 Evidence Card

**Purpose:** Documents a concrete, verifiable learning moment with attached evidence.

**Source:** One Evidence card is generated for each Learning Entry (from the Logger or Module Log Mode) that has this child listed as a participant.

**Content fields:**
- Thumbnail: first evidence attachment (photo preview) or document type placeholder emoji (📄 for text, 📷 for photo, 🎵 for audio). 64×64px, rounded corners.
- Title: from Learning Entry title field.
- Date: entry date, formatted as "March 15, 2026".
- Description: first 120 characters of the entry description, with ellipsis if truncated.
- Subject chips: from the AI-enriched subject tags on the entry (e.g., "Science", "Collaboration"). Max 3 visible; "+N" overflow if more.
- Capability thread tags: from the entry's thread mappings. Shown as small muted tags below subject chips.
- Participating children indicator: if this is a multi-child entry, show the other child's colour dot beside the card (e.g., Liam's blue dot on an Emma+Liam entry). Not shown for single-child entries.

**Visual treatment:** `--coffee-light` background, `--border-subtle` border, neutral dot on timeline connector (muted grey). This is the documentary layer — factual, not interpretive.

**Tap behaviour:** Expands inline to show:
- Full description text (no truncation)
- All evidence attachments as a scrollable thumbnail strip
- All subject and capability thread tags
- Per-child engagement emoji and discoveries (from Logger per-child data)
- "View full entry" link — navigates to a read-only full entry view (does NOT open the Logger for editing)
- "Mark as HEU candidate" quick action — flags entry as `heu_potential_sample` (feeds HEU Report work sample curation flow)

A second tap collapses the card back to summary state.

**No separate detail modal or page navigation.** Inline expand keeps the parent in the Portfolio context and avoids disorienting page transitions (5-minute rule — don't make them navigate away and back).

### 3.2 Journey Card

**Purpose:** Captures an interpretive observation about a learning moment — the "why it matters" layer that transforms an activity log into a growth narrative.

**Source and creation trigger:** Journey cards are AI-generated at write-time as part of the NLP pipeline (AI Architecture §3, Stage 2). When a Learning Entry is saved and the AI detects a notable observation — a connection across domains, a shift from scaffolded to independent work, a question that reveals emerging understanding, or an unprompted application of a concept — it generates a journey card as a `journey_observation` field on the enriched entry.

Not every entry generates a journey card. The AI fires a journey observation when it detects one of these patterns in the entry description:
- Cross-domain connection ("used measuring skills from baking during the garden project")
- Independence marker ("did this without prompting for the first time")
- Metacognitive statement (child explaining their own thinking process)
- Transfer of learning (applying a concept in a novel context)
- Emotional engagement signal paired with conceptual insight

**Frequency target:** Roughly 1 journey card per 3–5 evidence cards. Too many dilutes their impact; too few makes the growth narrative feel sparse. The AI pipeline should apply this ratio as a soft constraint — if the last 4 entries all generated journey observations, raise the threshold for the next one.

**Content fields:**
- Observation text: 1–3 sentences of interpretive narrative, written in second person ("Emma asked 'why do some metals work and others don't?' — demonstrates emerging hypothesis formation"). Max 250 characters. Uses pedagogy overlay vocabulary.
- Connection line (optional): if the AI detects a link to a previous entry, a brief connection note ("Builds on kitchen chemistry questions from March 8"). This creates the visible thread between moments that makes scaffolded progression tangible.

**Visual treatment:** `--ember-glow` background, `--border-ember` border, ember-coloured dot on timeline connector with subtle glow. Warm, interpretive — distinct from the neutral evidence cards. "OBSERVATION" label in small caps above the text.

**Tap behaviour:** Inline expand to show:
- Editable text field: parent can revise the AI-generated observation. Changes save to PostgreSQL `journey_observation_edited` field. The original AI text is preserved separately for audit but never shown.
- "Remove from portfolio" action: hides this journey card from the Portfolio view without deleting the underlying entry. Sets a `portfolio_hidden` flag.
- Connection link: if a connected entry is referenced, tapping it scrolls to that entry in the thread timeline.

**Parent-created journey cards:** A parent can also create a manual journey observation by tapping "Add observation" at any point in a thread timeline. This opens a simple text input (max 250 characters) attached to the nearest evidence card. Manual observations are stored the same way as AI-generated ones but flagged as `source: parent`.

### 3.3 Milestone / Badge Card

**Purpose:** Marks a significant threshold crossing — a badge award, a tier promotion, or an AI-detected growth pattern.

**Source and creation trigger:** Three triggers produce milestone cards:
1. **Badge award:** When a badge is awarded through the Badge Assessment flow, a milestone card appears in every thread the badge maps to.
2. **Tier progression:** When the Family Intelligence Snapshot records a thread moving from Emerging → Developing or Developing → Demonstrating (as confirmed by the parent through a structured confidence check), a milestone card is generated.
3. **AI-detected growth synthesis:** At the end of each month (triggered by the snapshot rebuild cycle), the AI reviews the child's entries for that month and may generate a synthesis milestone if it detects a notable pattern across multiple threads ("Shows consistent inventive thinking" in the prototype's demo data). This fires only when evidence supports a genuine synthesis, not on a calendar schedule.

**Frequency:** Badges are awarded seldomly (a core platform principle). Tier progressions happen infrequently (a thread might move from Emerging to Developing once per term). Monthly synthesis milestones fire only when warranted. A child might accumulate 3–6 milestone cards per term — they should feel rare and significant.

**Content fields:**
- Milestone type indicator: badge emoji (🏅), tier-up emoji (🌱→🌿), or synthesis emoji (✦).
- Title: badge name ("Number Navigator") for badge awards, tier language ("Developing — Consistent questioning observed") for tier progressions, or synthesis statement for AI-detected patterns.
- Date: month-level for synthesis and tier milestones, specific date for badge awards.
- Capability threads: the threads this milestone touches.
- For badge awards: badge name and brief summary.

**Visual treatment:** `--sage-muted` background, `--sage-border` border, sage-green dot on timeline connector (larger than evidence/journey dots, 14px vs 10px) with green glow. Celebratory but restrained — not an animation or confetti moment (secondhand delight principle: the Portfolio is the parent's review surface, not the child's celebration surface).

**Tap behaviour:** Inline expand to show:
- For badge awards: badge summary, the 3–5 assessment questions and parent responses that led to the award, and links to the evidence entries that triggered the badge threshold detection.
- For tier progressions: the specific indicators that were met, with links to supporting evidence entries.
- For synthesis milestones: the entries that contributed to the synthesis, with the AI's reasoning (editable by parent, same pattern as journey cards).

---

## 4. View Modes

### 4.1 Thread View (Default)

Entries are grouped under capability thread accordion headers. Each thread shows its title, subtitle, thread-specific colour-coded icon background, and a count of moments ("14 moments"). Threads are ordered by recency of latest entry (most recently active thread first).

Within each thread, entries appear in reverse chronological order (newest first), interspersed with journey cards and milestone cards at their contextually appropriate positions.

**Thread accordion behaviour:**
- First two threads (most active) are expanded by default on page load.
- All others are collapsed, showing only the header row.
- Tapping the header toggles expand/collapse.
- Expand/collapse state is not persisted between sessions (resets to default on each visit).

**Empty threads:** Threads with no evidence for this child are not shown. The Portfolio only displays threads where at least one entry exists. Ghost threads and unreached capabilities are the Constellation's domain, not the Portfolio's.

### 4.2 Timeline View (Alternate)

A flat chronological list of all entries for this child, newest first, regardless of thread. Each card still shows its thread tag(s), so the parent can see which threads were active on a given day. Journey and milestone cards appear at their entry date position.

The timeline view does not group or section by week/month — it is a continuous scrollable list. Date headers appear as lightweight separators between entries on different days.

**Toggle:** A segmented control in the threads section header: "By Thread" | "Timeline". The prototype's `threads-header` area is the correct location.

### 4.3 No Other View Modes for MVP

A "by subject" view or "by date range" view could be added post-MVP. For now, thread and timeline are the two modes. Filtering (§6) provides the subset functionality that additional view modes would otherwise serve.

---

## 5. Scaffolded Progression Display

This is the Portfolio's key differentiator — the mechanism that transforms an evidence gallery into a growth narrative.

### 5.1 How It Works

Scaffolded progression is shown per-thread, within the thread view. It is not a separate visualisation — it is woven into the timeline of each thread.

The progression signal comes from two sources:
1. **Capability thread tier state** from the Family Intelligence Snapshot (`current_badge_level`, `next_badge_progress`, observation patterns). This provides the macro-level: where the child sits on the Emerging → Developing → Demonstrating spectrum.
2. **Journey card connections** within the thread. When a journey card references a previous entry ("Builds on kitchen chemistry questions from March 8"), the visible link between entries creates a micro-level progression trail.

### 5.2 Visual Model

At the top of each expanded thread (before the first entry card), a compact progression indicator shows:

- **Current tier:** Displayed as a plain-language label with tier-appropriate colour: "Emerging" (ember), "Developing" (amber), "Demonstrating" (sage). No progress bars or percentages — the Portfolio speaks in narrative, not metrics.
- **Tier summary:** A one-sentence AI-generated description of what this tier looks like for this child, using pedagogy overlay vocabulary. Example: "Emma is beginning to form hypotheses and test them — mostly in familiar contexts with some scaffolding." This sentence is pre-computed in the Family Intelligence Snapshot and read at render time (zero LLM cost).
- **Thread trajectory label:** "Steady growth" / "Accelerating" / "New thread" / "Quiet recently" — pulled directly from the snapshot's `trajectory` field. Presented as a small muted chip beside the tier label.

Within the thread timeline, the vertical connector line (already implemented in the prototype as `thread-timeline::before`) subtly shifts colour as the entries progress from older (bottom) to newer (top). Older entries sit in the muted zone; the connector line warms toward ember as it approaches recent entries. This creates an ambient visual sense of movement without requiring explicit "Level 1 → Level 2" markers.

Journey card connection lines are the primary micro-progression indicator. When a journey card says "Builds on kitchen chemistry questions from March 8," the parent can see the conceptual chain. The Portfolio does not draw literal connecting arrows between distant cards (that would create visual noise), but the textual connection within the journey card serves this purpose.

### 5.3 What the Portfolio Does NOT Show

The Portfolio does not show DLO-level progress, content descriptor coverage percentages, or badge threshold detection details. Those belong to the Capabilities Constellation (DLO drill-down) and HEU Report (curriculum coverage) respectively. The Portfolio's progression is narrative and observational, not metric-driven.

### 5.4 Who Generates the Progression Narrative

The tier summary sentence and trajectory label are pre-computed by the AI at snapshot rebuild time and stored in the Family Intelligence Snapshot. They read from the child's `capability_state.active_threads` data. The parent cannot directly edit the tier summary (it's a system-derived assessment), but they can override tier classifications through the Capabilities Constellation's structured confidence checks.

---

## 6. Evidence Curation

### 6.1 Automatic inclusion

Every Learning Entry where the child is a participant automatically appears in their Portfolio. There is no manual "add to portfolio" step — the Portfolio is the child's complete evidence gallery. This eliminates a curation burden that would violate the 5-minute rule.

### 6.2 Removing entries from Portfolio view

A parent can hide an entry from the Portfolio without deleting the underlying Learning Entry. The expanded card view includes a "Hide from portfolio" action that sets a `portfolio_hidden: true` flag on the entry for that child. Hidden entries remain in the database, still feed capability thread calculations, and still appear in the HEU Report if selected as work samples. They are simply excluded from the Portfolio render.

A "Show hidden entries" toggle in the filter bar reveals hidden entries with reduced opacity, allowing the parent to un-hide if needed.

### 6.3 Star / highlight

A parent can star an entry by tapping a star icon on the expanded card. Starred entries are marked with `portfolio_starred: true` in PostgreSQL. Starring has two effects:
- The entry appears with a subtle ember glow border in both thread and timeline views.
- The monthly summary card preferentially features starred entries when selecting its highlight content.

There is no limit on stars, but the UI does not present starring as a primary action — it is available in the expanded card state, not on the collapsed card.

### 6.4 Manual evidence upload

For MVP, the Portfolio does not support adding entries that aren't Learning Entries. All evidence flows through the Logger or Module Log Mode. If a parent has a photo or document they want in the Portfolio, the path is: open the Logger, create a quick retrospective entry, attach the evidence. This keeps the Logger as the single write entry point and avoids a parallel upload path that would need its own AI enrichment pipeline.

Post-MVP consideration: a lightweight "Quick add" from the Portfolio that creates a minimal Learning Entry (title + photo, no full Logger form) could reduce friction for parents who discover old photos they want to preserve.

### 6.5 Relationship to HEU work sample selection

The Portfolio is not the selection interface for HEU work samples — that flow lives on the HEU Report screen (per `hearth-heu-work-sample-curation-spec-v1.md`). However, the Portfolio supports the selection process in two ways:
- The "Mark as HEU candidate" quick action on expanded evidence cards flags entries as `heu_potential_sample`, surfacing them in the HEU Report's candidate panel.
- Entries already selected as HEU work samples show a small "📋 HEU sample" chip on their card, so the parent can see which Portfolio entries are doing double duty.

---

## 7. Summary Card (Monthly Highlight)

### 7.1 Content

The summary card appears at the top of the Portfolio, above the thread accordions. It shows:

- **Period label:** "THIS MONTH" or the month name if viewing a previous period. Styled as small caps ember text.
- **Title:** "Emma's Learning Journey" — uses the child's name.
- **Period selector:** A small date chip showing the current month (e.g., "March 2026") that, when tapped, opens a month picker for browsing previous months. Browsing changes the entire Portfolio view to show only entries from that month.
- **Focus tags:** Two sections — "Active threads" showing the 2–3 threads with the most evidence this month (ember tags), and "Developing" showing any threads that changed tier this month (amber tags).
- **Narrative paragraph:** A 2–4 sentence AI-generated narrative summarising the month's learning in warm, parent-facing language with pedagogy overlay applied. Displayed in serif italic with a left ember border. Read from the Family Intelligence Snapshot. The parent can edit this text; edits are stored in PostgreSQL and override the AI version.
- **Stats row:** Three stat items: "Moments" (count of entries this month), "Capabilities" (count of active threads), "Weeks active" (weeks with at least one entry). Simple numeric display, no graphs.

### 7.2 Selection Criteria for Featured Content

The narrative preferentially mentions:
1. Starred entries from this month (if any)
2. Entries that generated journey cards (notable moments)
3. Entries associated with milestone events (badge awards, tier changes)
4. The threads with the highest observation count this month

### 7.3 Empty State

If the selected month has no entries, the summary card shows a gentle message: "No learning moments captured in [Month]. That's OK — learning doesn't always get logged." No call to action to the Logger (Portfolio is retrospective, not a prompt to log).

---

## 8. Search and Filter

### 8.1 Search

Free-text search in the header search input (already present in prototype). Searches over entry titles and descriptions. Results filter the visible cards in real time (client-side, since the full entry set for a child is loaded). Matching text highlighted with ember underline within cards.

Search applies to the current view mode (thread or timeline). In thread view, threads with no matching entries collapse automatically; threads with matches stay expanded with only matching cards visible.

### 8.2 Filter Bar

Below the summary card, above the thread section, a horizontal filter bar with:

- **Subject filter:** Multi-select chips for subjects present in this child's entries (e.g., "Maths", "Science", "English"). Tapping a subject chip filters to entries tagged with that subject. Multiple selections use AND logic (entries must match all selected subjects).
- **Card type filter:** "Evidence" / "Observations" / "Milestones" — toggleable chips that show/hide card types. All active by default.
- **Date range:** "This term" / "This year" / "All time" segmented control. Defaults to "This term". Custom date range picker accessible from a "Custom…" option.
- **Thread filter:** Only visible in timeline view (in thread view, the thread accordions serve this purpose). Dropdown of available threads; selecting one filters the timeline to entries mapped to that thread.

### 8.3 Filter State Persistence

Filter state is not persisted between sessions. On each Portfolio visit, filters reset to defaults (all subjects, all card types, "This term", no search query). This avoids a parent returning to a filtered view and thinking entries are missing.

---

## 9. States and Edge Cases

### 9.1 Empty State — New Family, No Entries

The Portfolio shows a warm, encouraging message centred in the main content area:

> "Emma's learning journey starts here. As you log moments through the week, they'll appear in this portfolio — organised by the capability threads that emerge from her experiences."

No call to action pointing to the Logger. The parent arrived here from Our Story and knows how to navigate. A subtle link to "Learn about capability threads →" pointing to a help article or the Capabilities Constellation could be offered.

### 9.2 Early State — 1–5 Entries

The summary card appears but with a simplified narrative: "Emma's learning story is just beginning. Patterns will emerge as more moments are captured." Stats show actual counts. Thread accordions appear for any threads with evidence; only one thread is auto-expanded.

### 9.3 Rich State — 50+ Entries

Entries within each thread are paginated: the 10 most recent entries per thread are loaded initially, with a "Load earlier entries" link at the bottom of each thread timeline. Timeline view uses infinite scroll with lazy loading (20 entries per batch).

This prevents a single thread with 30 entries from dominating the page load. The summary card and thread headers load immediately; entry cards load progressively.

### 9.4 Per-Child Imbalance (Emma: 30 entries, Liam: 2)

Each child's Portfolio is independent. Switching from Emma's rich Portfolio to Liam's sparse one shows Liam's content with the early-state treatment (§9.2). No comparison language ("Liam has fewer entries than Emma") — each child's journey is their own.

### 9.5 Deleted Learning Entry

When a Learning Entry is soft-deleted (per the data deletion privacy model's 30-day grace period), its Portfolio card is immediately hidden. If the entry is restored within the grace period, the card reappears. If permanently deleted, the card is gone. Journey cards that referenced the deleted entry show the observation text but lose the connection link ("referenced entry no longer available"). Milestone cards are unaffected by individual entry deletions (they are synthesis-level, not entry-dependent).

### 9.6 Entries Without Evidence Attachments

Some entries are text-only (no photos or documents). These display with a document placeholder emoji (📝) in the thumbnail position. They are still valid Portfolio entries — not all learning produces a photo.

---

## 10. Data Model

### 10.1 No Independent Data Store

The Portfolio reads from existing data:

| Data Source | What It Provides | Storage |
|---|---|---|
| Learning Entries | Evidence card content (title, description, date, evidence attachments, per-child data) | PostgreSQL |
| AI Enrichment (on entries) | Subject tags, capability thread mappings, journey observations, HEU candidate flags | PostgreSQL (enriched entry fields) |
| Family Intelligence Snapshot | Monthly narrative, thread states (tier, trajectory, badge progress), focus tags, stats | PostgreSQL (JSON document) |
| Badge Awards | Milestone card content for badge-type milestones | PostgreSQL |
| Pedagogy Profile | Overlay vocabulary for narrative framing | Sanity CMS (read at runtime) |
| Learner Profile | Child name, abstract shape identifier, colour | PostgreSQL |

### 10.2 Portfolio-Specific Fields (on Learning Entries)

These fields are added to the Learning Entry record to support Portfolio features:

```
portfolio_starred: boolean (default false)
portfolio_hidden: boolean (default false), per-child (keyed by learner_id)
journey_observation_edited: text (null if parent hasn't edited the AI draft)
heu_potential_sample: boolean (set by AI or manual parent action)
```

### 10.3 Journey Card Storage

Journey observations are stored as a field on the enriched Learning Entry, not as separate records. This keeps the data model flat and avoids orphan records.

```
journey_observation: {
  text: string,             // AI-generated observation
  source: 'ai' | 'parent', // Who created it
  connection_entry_id: uuid | null,  // Referenced entry, if any
  created_at: timestamp,
  edited_text: string | null  // Parent's revision, if any
}
```

An entry may have zero or one journey observation. The AI pipeline decides at write-time whether to generate one (per the frequency criteria in §3.2).

### 10.4 Milestone Card Storage

Badge award milestones are derived directly from the `learner_badge_awards` table — no separate milestone record needed.

Tier progression milestones are derived from the Family Intelligence Snapshot's tier history (`tierHistory[]` in the capability thread learner state). When a thread's `currentTier` changes between snapshot versions, the Portfolio renders a milestone card at the date of the snapshot rebuild.

Monthly synthesis milestones are stored as a dedicated field on the Family Intelligence Snapshot:

```
monthly_synthesis: {
  month: "2026-03",
  child_id: uuid,
  synthesis_text: string,
  contributing_entry_ids: [uuid],
  edited_text: string | null
}
```

---

## 11. Integration Points

### 11.1 Incoming Data

| Source Screen | Data Flow | Mechanism |
|---|---|---|
| Retrospective Logger | New Learning Entry → appears as Evidence card | Automatic via entry save + snapshot rebuild |
| Module Experience (Log Mode) | Module log entry → appears as Evidence card | Same pipeline as Logger |
| Badge Assessment | Badge award → appears as Milestone card | Badge award record in PostgreSQL |
| Capabilities Constellation | Tier changes → appear as Milestone cards | Snapshot tier history comparison |
| Pedagogy Engine | Philosophy vocabulary → applied to narratives | Runtime overlay from Sanity |

### 11.2 Outgoing Navigation

| Destination | Trigger | Context Passed |
|---|---|---|
| HEU Report | "See compliance status" link in HEU companion notice | `child_id` |
| Capabilities Constellation | "See growth map" link (in summary card area) | `child_id` |
| Learner Profile | Child name/shape tap in header | `child_id` |

### 11.3 Outgoing Data Actions

| Action | Target | Mechanism |
|---|---|---|
| Star entry | Updates `portfolio_starred` on Learning Entry | Direct write to PostgreSQL |
| Hide entry | Updates `portfolio_hidden` on Learning Entry | Direct write to PostgreSQL |
| Mark HEU candidate | Updates `heu_potential_sample` on Learning Entry | Direct write to PostgreSQL |
| Edit journey text | Updates `journey_observation_edited` on Learning Entry | Direct write to PostgreSQL |
| Edit summary narrative | Updates `monthly_synthesis.edited_text` on Snapshot | Direct write to PostgreSQL |
| Export PDF | Generates PDF of visible Portfolio content | Client-side or server-rendered PDF |

---

## 12. Export

The "Export PDF" button in the header generates a print-formatted document of the current child's Portfolio. The export includes:

- Child name and date range header
- Monthly summary narrative
- All visible thread sections with their progression indicators and entry cards
- Journey observations inline
- Milestone cards inline

The export excludes hidden entries and respects current filters. If the parent has filtered to "This term, Maths only," the export contains only that subset.

The Portfolio PDF is a narrative document — distinct from the HEU Report export (which is compliance-formatted with content descriptor tables). The Portfolio export uses the Mont Blanc warm aesthetic (dark background, ember accents) converted to a print-friendly light layout.

---

## 13. Accessibility Notes

- Thread accordions use `aria-expanded` and keyboard-navigable toggle.
- Card expand/collapse uses `aria-expanded` with focus management (expanded card receives focus).
- Filter chips support keyboard selection with `role="checkbox"`.
- Colour-coded card types include text labels ("OBSERVATION", "MILESTONE") — colour is not the sole differentiator.
- The summary narrative and journey card text meet WCAG AA contrast against their backgrounds.
- The timeline connector line is decorative (`aria-hidden`).

---

## 14. Open Questions

1. **Month picker scope:** Should the month picker in the summary card show all months since the family joined, or only months with entries? Showing all months creates many empty states; showing only active months may confuse parents about gaps.

2. **Journey card frequency tuning:** The target ratio of 1 journey card per 3–5 evidence cards is a hypothesis. Post-launch analytics should track whether parents are editing or hiding AI-generated observations — high edit/hide rates suggest the AI is generating too many or too imprecisely.

3. **Portfolio PDF vs Portfolio sharing link:** MVP specifies PDF export. Post-MVP, a shareable link (with expiry and optional PIN) could let parents share a child's Portfolio with grandparents, tutors, or receiving schools without exporting a static file.

4. **Voice/read-aloud for secondhand delight:** The Portfolio is parent-facing, but some families may want to read the growth narrative to/with their child. A "read aloud" mode for the summary narrative could support secondhand delight — but this is post-MVP.

5. **Cross-child journey cards:** Currently, journey observations are per-child. A collaborative entry (Emma + Liam) generates separate journey cards for each child. Should there be a way to show cross-child observations ("Emma taught Liam how to measure — peer teaching emerging")? The current per-child model handles this by including the observation in both children's Portfolios, but the framing is child-specific, not relationship-specific.
