# Hearth Capabilities Constellation — Interaction Specification v1

> **Version:** 1 | **Date:** 2026-03-11  
> **Status:** Specification — resolves dual-file ambiguity, documents canonical interaction model  
> **Route:** `/our-story/capabilities`  
> **Dependencies:** hearth-capabilities-connector-architecture.md, hearth-capability-thread-library.md, Hearth_Capabilities_Constellation_Design_Exploration.md  
> **Parent document:** Hearth_System_Interaction_Map.md §3.9

---

## 1. Canonical File Resolution

### The Problem

Two files exist in the registry for what appears to be one screen:

| # | Registry Name | File | What It Actually Does |
|---|--------------|------|----------------------|
| 13 | Capabilities Constellation v3 | `hearth-capabilities-v3.html` | Per-child observation timeline — individual logged moments rendered as nodes on vertical thread-colored spines. Includes narrative block, "Opening Up" ghost capabilities, and tooltip interaction. Data-rich, retrospective. |
| 14 | Constellation Map | `hearth-constellation-map.jsx` | Structural thread taxonomy DAG — all 57 capability threads displayed as a directed graph with `enables` edges, organized by domain rows. Tap to expand a node and see its DLO list. No per-child data, no child selector, no observations. |

### Analysis

These are **genuinely different views** that serve different purposes, but they both represent partial implementations of the same screen. Neither implements the 4-level galaxy zoom model defined in the connector architecture.

| Aspect | v3 HTML | JSX Map |
|--------|---------|---------|
| Shows per-child data | ✅ Yes (Emma, Liam, Oliver) | ❌ No — static taxonomy only |
| Shows observations | ✅ Yes (individual moments as nodes) | ❌ No |
| Shows thread relationships | ❌ Partially (cross-thread lines within an observation) | ✅ Yes (full DAG with `enables` edges) |
| Shows DLOs | ❌ No | ✅ Yes (on node expand) |
| Child selector | ✅ Yes | ❌ No |
| Implements zoom levels | ❌ One flat view (effectively Level 5) | ❌ One flat view (effectively Level 2) |
| Badge proximity | ❌ No | ❌ No |
| Evidence drill-down | ❌ Tooltip only | ❌ No |

**Mapping to the 4 zoom levels from the connector architecture:**

- Level 1 (Domain Overview): Neither implements this.
- Level 2 (Thread View): The JSX map covers this — threads within domains, with connection edges.
- Level 3 (Badge & DLO View): The JSX map partially covers this — DLOs appear on node expand, but without observation evidence or badge proximity.
- Level 4 (Moment Detail): The v3 HTML partially covers this — observations display in a timeline, but without DLO mapping context.

### Recommendation

**Merge into one screen.** The production Constellation is a single React component at `/our-story/capabilities` that implements the 4-level zoom. The two prototypes contribute different layers to the unified design:

- From the v3 HTML: child selector, narrative block, observation data model, "Opening Up" section, per-child color system, tooltip interaction pattern.
- From the JSX map: thread taxonomy data (all 57 threads with DLOs), DAG layout engine, domain-grouped positioning, `enables` edge rendering, tap-to-expand interaction.

**COMPONENT_REGISTRY.md update:**
- Merge entries #13 and #14 into a single entry: `Capabilities Constellation`
- Canonical file for production: to be created as `hearth-constellation-v4.jsx` (or `.html` depending on build pipeline decision)
- Archive both `hearth-capabilities-v3.html` and `hearth-constellation-map.jsx` as superseded prototypes with a note that each contributed to the unified design
- Spec reference: `hearth-constellation-spec-v1.md` (this document)

---

## 2. Purpose

The Capabilities Constellation is the visual representation of a child's growth across capability threads. It answers: **"What is [child] growing at, and where is the evidence?"**

It is:
- **Read-only** — parents view the constellation, they do not directly edit it. All data flows in from Learning Entries (via AI enrichment at write-time) and badge awards.
- **Retrospective** — it reveals patterns in learning that has already happened, consistent with Hearth's retrospective-first model.
- **Per-child** — always viewed through the lens of one child at a time. No cross-child comparison.
- **Forward-indicating** — while retrospective in data source, it surfaces "Opening Up" capabilities and badge proximity to suggest natural next growth areas.

It is not:
- A logging interface (that's the Logger)
- A progress tracker with completion percentages (that framing is intentional avoidance)
- A curriculum map (Achievement Standards are a backend concern; the Constellation shows capability threads and plain-language DLOs only)

---

## 3. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Zoom model | 4 discrete levels with animated transitions | Connector architecture mandates this. Galaxy metaphor: zoomed out = domains as clusters; zoomed in = individual moments. |
| Primary view | Per-child, selected via child tabs | Avoids comparison. Consistent with Our Story hub and all other per-child screens. |
| Visual aesthetic | Night sky — dark background, glowing nodes, domain-colored thread paths | Matches Mont Blanc Dark Coffee system. Capabilities as "stars" in a child's constellation. |
| Thread visualization | Domain-colored nodes with gradient fill indicating progress | Fill level communicates growth at a glance without numerical percentages. |
| Observation → DLO mapping | AI-assigned at write-time, stored in Family Intelligence Snapshot | No read-time AI calls. Constellation reads pre-computed mappings. |
| Badge threshold | Visual indicator when approaching award, but no interruption | Badge assessment is queued for next relevant logging session, not triggered from the Constellation itself. |
| "Opening Up" capabilities | Ghost nodes + curated list below constellation | Dual affordance: visual (ghost nodes in the map) + readable (card list with prerequisite tracking). |
| Scroll vs. zoom | Zoom transitions between levels; vertical scroll within each level | Level 1 fits in viewport. Levels 2–4 may require vertical scroll depending on data density. |

---

## 4. Zoom Level Specifications

### Level 1: Domain Overview

**What the parent sees:** All 8 domains arranged as constellation clusters. This is the entry point — "the galaxy view."

**Layout:** A 2×4 or responsive grid of domain clusters, each represented by a labeled region with aggregate visual indicators. The layout should feel organic — not a rigid grid — but positions are deterministic (same domains always appear in the same relative position for spatial memory).

**Domain cluster anatomy:**
- Domain name (plain language, e.g. "Language & Literacy")
- Domain color (from the 8-domain color system defined in the JSX map)
- Thread count indicator: e.g. "9 threads" (subtle, secondary text)
- Aggregate growth indicator: a circular or radial glyph showing the proportion of threads with activity. Not a percentage — a visual density signal. Threads with observations glow; threads with no data are dim.
- Recent activity dot: a small pulse animation if new observations were mapped to this domain since the parent's last visit
- 🏅 emoji placeholder for badge count within domain

**Interaction:**
- Tap a domain cluster → zoom to Level 2 (Thread View) for that domain
- No other actions at this level — it exists for orientation and quick triage

**Empty state:** A new child with no logged data sees all 8 domains in their dim/unlit state with a brief message: "As you log learning, [child]'s constellation will light up here."

---

### Level 2: Thread View (within a domain)

**What the parent sees:** The capability threads within a single domain, arranged as a skill-tree / DAG structure. This is the "Skyrim skill tree" level.

**Layout:** Threads are positioned using the DAG layout engine from the JSX prototype. Foundational threads (marked `foundational: true` in the thread data) anchor the top; downstream threads flow downward following `enables` relationships. Within-domain edges are solid lines; cross-domain edges are dashed and muted.

**Thread node anatomy:**
- Thread name (plain language, e.g. "Reading Comprehension")
- Thread ID (subtle, e.g. "L3" — useful for cross-referencing but not primary label)
- Progress fill: a gradient bar or radial fill reflecting DLO confirmation ratio for this child. Uses a 3-tier visual language:
  - **Dim/outline only** = no observations mapped yet
  - **Partial fill** = some DLOs emerging or confirmed, expressed as gradient from domain color at confirmed end to transparent at unobserved end
  - **Full glow** = all DLOs at demonstrating tier
- Badge indicator: if any badge within this thread has been awarded, show 🏅 emoji placeholder. If approaching threshold, show a pulsing ring (see §4.5 Badge Threshold below).
- Recent activity dot: subtle pulse if new observations mapped since last visit
- Foundational marker: a small filled circle for foundational threads (carried from JSX prototype)

**Connection edges:**
- Within-domain: solid lines with domain color, opacity 0.12 default, 0.6 when connected to tapped node
- Cross-domain (outgoing to other domains): dashed lines, very muted (opacity 0.06), with a subtle label showing destination domain. These indicate "this thread enables threads in other domains" without requiring navigation away.

**Interaction:**
- Tap a thread node → zoom to Level 3 (Badge & DLO View) for that thread
- Tap-and-hold or hover (desktop): highlight all connected nodes (prerequisites + enables) with increased edge opacity. Connected nodes in other domains show a ghost outline at the edge of the viewport with an arrow indicating direction.
- Back button / breadcrumb → return to Level 1

---

### Level 3: Badge & DLO View (within a thread)

**What the parent sees:** The interior of a single capability thread — its badge levels and discrete learning objectives.

**Layout:** Vertical stack, organized by badge level. Each badge level is a section containing its constituent DLOs.

**Badge level section:**
- Badge name (e.g. "Number Navigator")
- Badge summary (one sentence from Sanity CMS)
- Award status: Awarded ✅ with date | In Progress | Not Yet Started
- Badge threshold indicator (see §4.5)

**DLO list within each badge level:**

Each DLO is a row showing:
- DLO statement in plain language (the `parentVersion` field, not the technical statement)
- Observation status, using a 3-state indicator:
  - ○ **Not yet observed** — no observations mapped to this DLO for this child. Dim text.
  - ◐ **Emerging** — at least one observation mapped with AI confidence, but not yet confirmed by parent or badge assessment. Domain-colored, partial opacity.
  - ● **Confirmed** — either confirmed via badge assessment question or via multiple high-confidence observation mappings. Full domain color with glow.
- Observation count: a small number badge showing how many logged moments have been mapped to this DLO (e.g. "3 moments"). Only shown for Emerging and Confirmed states.
- Tap target → zoom to Level 4 (Moment Detail)

**Interaction:**
- Tap a DLO row → zoom to Level 4 (Moment Detail) showing contributing observations
- Tap a badge section header → no action (the badge assessment is triggered from the Logger, not from here). But if the badge is "In Progress" and close to threshold, show a contextual note: "This badge may be ready for assessment soon."
- Back button / breadcrumb → return to Level 2

---

### Level 4: Moment Detail (evidence for a DLO)

**What the parent sees:** The evidence trail — which logged moments contributed to this specific DLO.

**Layout:** A reverse-chronological list of learning entry snippets that the AI mapped to this DLO at write-time.

**Entry snippet anatomy:**
- Entry title (from the Learning Entry)
- Date
- Brief description (first ~100 characters of the entry description)
- 📷 emoji placeholder for evidence thumbnail (photo, if attached)
- AI confidence indicator: a subtle label showing mapping confidence (High / Moderate). This is informational, not interactive — parents don't need to action it.
- Source indicator: "From Logger" or "From [Module Name]" — where the observation originated

**Interaction:**
- Tap an entry snippet → navigate to the full entry in read mode. **Navigation target:** the Portfolio / Learning Journey screen (`hearth-portfolio-learning-journey.html`) filtered to that specific entry. This maintains the principle that the Constellation is read-only and doesn't host its own entry viewer.
- Back button / breadcrumb → return to Level 3

**Empty state for a DLO with no moments:** "No observations mapped to this yet. When you log learning that relates to '[DLO statement]', it will appear here."

---

### 4.5: Badge Threshold Detection

The connector architecture specifies that the Constellation flags when a thread approaches badge-award threshold. This is a visual treatment applied at Level 2 and Level 3.

**At Level 2 (Thread View):**
- When a badge within a thread is within ~80% of its required DLOs being confirmed (e.g. 4 of 5 DLOs confirmed), the thread node displays a pulsing ring in the domain color, slightly brighter than the normal border.
- A small label appears below the node: "Badge approaching" (no specific count — we don't want parents to game the system).

**At Level 3 (Badge & DLO View):**
- The approaching badge section gets a highlighted border and a contextual message: "Most indicators for [Badge Name] are confirmed. This badge may be ready for assessment after your next logging session."
- The unconfirmed DLOs within the approaching badge are visually distinguished (slightly brighter, with a ◐ pulse animation) to draw attention without creating a checklist feeling.

**What does NOT happen:**
- No push notification from the Constellation itself. Badge assessment is queued via the notification system and surfaces after the next relevant logging session.
- No "Assess Now" button on the Constellation. The assessment flow is accessed through the Logger's secondary interface or the Notification Center.

---

## 5. Animation and Transition Model

### Zoom In (Level N → Level N+1)

The tapped element (domain cluster, thread node, or DLO row) becomes the anchor point. The surrounding context fades and scales away while the tapped element grows to fill the viewport. New content for the deeper level fades in from the center outward.

- Duration: 400ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (the standard `--transition-gentle` from the design system)
- The anchor element maintains its position on screen during the first ~200ms, then smoothly repositions to its new location in the deeper level layout

### Zoom Out (Level N+1 → Level N)

Triggered by back button or breadcrumb tap. The current level content shrinks toward the element that will represent it at the parent level, while the parent level context fades in from the edges.

- Duration: 350ms (slightly faster than zoom-in — returning feels quicker)
- Easing: same as zoom-in

### Breadcrumb Trail

A persistent breadcrumb bar sits below the child selector, showing the zoom path:

```
Domains  >  Language & Literacy  >  Reading Comprehension  >  "Makes inferences from text clues"
```

Each segment is tappable to jump directly to that zoom level. The breadcrumb updates during zoom transitions — the new segment slides in from the right as the animation plays.

**At Level 1:** Breadcrumb shows only "Domains" (non-tappable, just context).
**At Level 4:** Full 4-segment breadcrumb. The DLO statement is truncated if needed.

---

## 6. Child Selector

**Position:** Fixed at the top of the screen, above the breadcrumb. Uses the same tab pattern as v3 HTML — abstract shape + color per child (Emma = rose, Liam = blue).

**Switching behavior:** When the parent taps a different child tab:
- If currently at Level 1: re-render domain overview with the new child's data. Smooth crossfade, 200ms.
- If at Level 2–4: **reset to Level 1** for the new child. Rationale: the deeper zoom levels are contextual to a specific child's data. Jumping from Emma's "Reading Comprehension" DLOs to Liam's at the same level would invite comparison. Resetting to Level 1 forces the parent to navigate into Liam's constellation freshly.

**Empty state:** A child with no logged data at all sees the Level 1 empty state (dim domains + message). Children with partial data see domains light up proportionally.

---

## 7. Data Flow

### Data Source

The Constellation reads from the **Family Intelligence Snapshot** in PostgreSQL — the pre-computed data layer described in the AI Intelligence Layer Architecture. It does not make API calls to Sanity CMS at read time (thread definitions are bundled at app build time or cached on first load).

**Snapshot data consumed by the Constellation:**

| Data Point | Source | Update Frequency |
|-----------|--------|-----------------|
| Thread definitions (57 threads, DLOs, edges) | Sanity CMS (cached/bundled) | At app deploy |
| Per-child DLO statuses | Family Intelligence Snapshot (PostgreSQL) | After each Learning Entry save (write-time AI processing updates the snapshot) |
| Per-child observation → DLO mappings | Family Intelligence Snapshot | After each Learning Entry save |
| Badge awards | `learner_badge_awards` table | After badge assessment completion |
| Badge threshold proximity | Computed from DLO statuses at read time (lightweight calculation, not AI) | Derived — always current when snapshot is current |

### Update Timing

- **After a Learning Entry is saved:** Write-time AI (Haiku) processes the entry, maps observations to DLOs, and updates the Family Intelligence Snapshot. The Constellation reflects this the next time the parent navigates to it. There is no live-update animation — the Constellation shows the state as of the last snapshot write.
- **After a badge is awarded:** The badge appears immediately in the Constellation because the badge_awards table is written synchronously during the assessment flow.
- **No daily batch processing.** Updates are event-driven (entry save, badge award). The snapshot is always current to the last write event.

### Suggested vs. Confirmed Observations

The AI maps observations to DLOs with a confidence score. The Constellation distinguishes:

- **High confidence (≥0.8):** Shown as a solid mapping. Counts toward the DLO's "emerging" status. Multiple high-confidence mappings from different entries can collectively move a DLO to "confirmed" without badge assessment.
- **Moderate confidence (0.5–0.79):** Shown with a subtle visual distinction (e.g., slightly lower opacity on the connecting line at Level 4). Still counts as a mapping but doesn't auto-confirm.
- **Low confidence (<0.5):** Not shown in the Constellation. These are stored in the snapshot for potential future re-evaluation but are not surfaced to the parent.

### Badge Award Visual Treatment

When a parent navigates to the Constellation and a new badge has been awarded since their last visit:
- At Level 1: the domain containing the newly-badged thread shows a brief celebratory pulse (a single 1-second glow animation, not repeating).
- At Level 2: the thread node with the new badge has a "New" indicator that persists until the parent taps into it.
- At Level 3: the badge section shows an "Awarded [date]" label with the 🏅 placeholder.

No full-screen animation or confetti. The badge award ceremony happens at the point of assessment (via the Badge Assessment secondary interface). The Constellation reflects it retroactively with quiet pride.

---

## 8. Integration Points

### Navigation To (inbound)

| Origin Screen | Trigger | Context Passed | Destination |
|--------------|---------|----------------|-------------|
| Our Story Hub | "Capabilities" card tap | `child_id` (from the child selector on Our Story) | Level 1, with the passed child pre-selected |
| Dashboard | "Constellation" quick link (if present in dashboard cards) | `child_id` | Level 1 |
| Portfolio / Learning Journey | "View in Constellation" link on a capability thread tag | `child_id`, `thread_id` | Level 2, scrolled to and highlighting the specific thread |
| HEU Report | "See capability details" link on a coverage row | `child_id`, `domain_id` | Level 2 for the relevant domain |
| Logger (post-save insight) | "See this in the Constellation" contextual link | `child_id`, `thread_id`, optionally `dlo_id` | Level 2 or Level 3 depending on depth of context |

### Navigation From (outbound)

| Destination | Trigger | Context Passed |
|------------|---------|----------------|
| Portfolio / Learning Journey | Tap an entry snippet at Level 4 | `child_id`, `entry_id` → Portfolio opens filtered to that entry |
| HEU Report | "See compliance mapping" link (shown at Level 2 as a subtle footer link per domain) | `child_id` |
| Back to Our Story Hub | Back navigation from Level 1 | `child_id` |

### Data Produced

The Constellation does not write data. It is purely a read surface. All data modifications happen through:
- The Retrospective Logger (observations → DLO mappings via write-time AI)
- The Badge Assessment flow (badge awards)
- Family Settings (if capability thread customization is added in Phase 2+)

---

## 9. Mobile Considerations

The Constellation is inherently spatial. Mobile constraints require careful adaptation.

### Level 1 (Domain Overview)

The 8 domains fit comfortably in a 2×4 grid on mobile. Each domain cluster occupies ~50% viewport width and ~20% viewport height. This is the most mobile-friendly level.

### Level 2 (Thread View)

This is the most challenging level on mobile. Domains with many threads (Language has 9, Maths has 9) create a wide DAG that may not fit in viewport width.

**Approach:** Horizontal scroll within a domain's thread view, with the currently-focused thread centered. Thread nodes are sized for touch (minimum 48×48dp tap target). Edge lines remain visible but very subtle when scrolled off-screen — a "you can scroll for more" gradient fade at the edges signals more content.

Pinch-to-zoom is **not supported** as a navigation mechanism (it conflicts with the 4-level zoom model and creates ambiguous intermediate states). Instead, the level transitions handle all zoom semantics. Standard browser pinch-to-zoom for accessibility remains enabled but is separate from the constellation's zoom model.

### Level 3 (Badge & DLO View)

Vertical list layout — naturally mobile-friendly. DLO rows are full-width with generous padding. Touch targets are comfortably large.

### Level 4 (Moment Detail)

Vertical list of entry snippets — naturally mobile-friendly. Same card pattern used in Portfolio and Logger.

### Touch Target Minimums

All interactive elements maintain a minimum of 44×44pt (iOS) / 48×48dp (Android) tap area, even if the visual element is smaller. At Level 2 where thread nodes may be visually compact, invisible hit areas extend beyond the visible node boundary.

---

## 10. Accessibility

### Screen Reader Alternative

The visual constellation is inherently inaccessible to screen readers. A parallel accessible structure is required:

- At Level 1: An unordered list of 8 domains, each announced with domain name, thread count, and activity summary (e.g. "Language & Literacy. 9 threads. 4 with recent activity."). List items are buttons that navigate to Level 2.
- At Level 2: A nested list of threads within the domain, each announced with thread name, progress tier (emerging/developing/demonstrating), and badge status. List items are buttons that navigate to Level 3.
- At Level 3: DLOs listed under badge-level headings. Each DLO announced with statement, status (not observed / emerging / confirmed), and observation count. List items are buttons for Level 4.
- At Level 4: Entry snippets as a list with title, date, and description.

SVG elements carry `role="img"` with `aria-label` summaries. Interactive nodes carry `role="button"` with descriptive labels.

### Keyboard Navigation

- Tab moves between nodes at each level
- Enter/Space activates a node (equivalent to tap → zoom in)
- Escape zooms out one level (equivalent to back)
- Arrow keys move between adjacent nodes at Level 2 (following the DAG layout order)

### Color-Blind Considerations

The 8-domain color system must be distinguishable under protanopia, deuteranopia, and tritanopia. The current palette from the JSX prototype:

| Domain | Color | Concern |
|--------|-------|---------|
| Language & Literacy | #60A5FA (blue) | Safe |
| Mathematical Thinking | #D97B3A (ember/orange) | Safe |
| Scientific Thinking | #4ADE80 (green) | Confusable with red under deuteranopia |
| Humanities & Social | #A78BFA (violet) | Safe |
| Physical Capability | #FB7185 (pink-red) | Confusable with green under deuteranopia |
| Personal & Social | #F9A8D4 (soft pink) | May confuse with the above |
| Creative Expression | #5EEAD4 (teal) | Safe |
| Executive Function | #9B8B7E (warm gray) | Safe |

**Mitigation:** Each domain should carry a secondary identifier beyond color alone — either a distinct shape for its cluster glyph at Level 1, or a short label that's always visible (not just on hover). The 3-tier DLO states (○ ◐ ●) are shape-based, which is good — they don't rely solely on color.

---

## 11. Open Questions

1. **Constellation entry animation:** Should the Constellation have a brief "lighting up" animation when first opened (stars appearing one by one), or should it render fully immediately? The animation could reinforce the "constellation of growth" metaphor, but it delays information access and may violate the 5-minute-rule spirit if it takes more than 1–2 seconds.

2. **Custom capability threads (Phase 2):** The connector architecture mentions "57 pre-defined + custom" threads. Where do custom threads appear in the constellation layout? As a 9th domain cluster? Appended to the most relevant existing domain? This needs design when custom threads are scoped.

3. **Cross-domain navigation at Level 2:** When a thread has cross-domain `enables` edges (e.g. "Reading Comprehension enables Source Analysis in Humanities"), should tapping the dashed cross-domain edge navigate the parent to the target domain's Level 2? Or just highlight the connection? Navigating would break spatial context; highlighting is informational but not actionable.

4. **Thread comparison across children (explicitly avoided but may be requested):** Some parents will want to see "how does Emma compare to Liam in Numeracy." The per-child model intentionally prevents this. Should there be any aggregate family view, or is this a firm no? Current recommendation: firm no, consistent with the abstract-shapes-not-photos philosophy.

5. **Historical timeline at Level 2:** The v3 HTML prototype was a timeline (observations ordered by date). The proposed Level 2 is a static DAG (threads arranged by dependency). Should there be a toggle between "structure view" (DAG) and "timeline view" (chronological observations within a domain)? Or is the timeline adequately served by Level 4?

6. **Performance at scale:** A family that has been homeschooling for 3+ years may have thousands of observations. At Level 4, the moment list for a heavily-evidenced DLO could be very long. Pagination? "Show most recent 20" with a "load more" affordance? Or is this a non-issue for MVP given typical data volumes?

7. **"Opening Up" section placement:** In the v3 HTML, "Opening Up" (ghost capabilities approaching readiness) appears below the constellation as a card list. In the 4-level zoom model, where does this live? Options: (a) Persistent section below Level 1, (b) Integrated as ghost nodes at Level 1 and Level 2, (c) A separate "Emerging" tab or filter. Recommendation: (b) ghost nodes at Level 1/2 plus a summary accessible from Level 1.

---

## 12. Prototype Lineage

| Version | File | Date | What It Explored |
|---------|------|------|-----------------|
| v1 | (not in registry — referenced in design exploration) | ~Feb 2026 | Wide SVG constellation, spatial 2D layout |
| v2 | (not in registry — referenced in design exploration) | ~Feb 2026 | Vertical card-based, readable but lost spatial feel |
| v3 | `hearth-capabilities-v3.html` | Feb 2026 | Vertical SVG with observation nodes on thread spines, per-child data, narrative block, "Opening Up" |
| JSX map | `hearth-constellation-map.jsx` | Feb 2026 | All 57 threads as DAG with DLO expansion, domain-grouped layout, edge rendering |
| **v4 (next)** | `hearth-constellation-v4.jsx` | TBD | Unified 4-level zoom implementation merging v3 and JSX map contributions |

---

*This specification resolves the dual-file ambiguity, documents the canonical interaction model for all 4 zoom levels, and captures the data flow, integration, mobile, and accessibility requirements for the Capabilities Constellation. It should be used as the build reference alongside the connector architecture (data model) and thread library (taxonomy).*
