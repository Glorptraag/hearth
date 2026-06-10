# Hearth — Marketplace UX & Functional Specification v1

**Addendum type:** New specification for undocumented screen
**Prototype:** `hearth-marketplace.html`
**Architecture references:** `Hearth_System_Interaction_Map.md` (Sections 2.3, 3.10), `hearth-hcms-strategy-v1.md`, `hearth-activity-discovery-docs.md`
**Last updated:** March 2026

---

## 1. Purpose

The Marketplace is where families discover, evaluate, and acquire content — packs and standalone modules — for their learning library. It is the **primary use case** for Hearth. Most families consume pre-made content rather than building their own. The Marketplace is the storefront; Activity Discovery is the family's personal bookshelf.

This spec documents the complete browse → evaluate → acquire flow as designed in the prototype, filling the gaps the prototype cannot express: state transitions, data requirements, edge cases, mobile behaviour, and payment infrastructure.

**We'll know this works when:** a family's time from browse to `module_added_to_library` reads as curation, not indecision (under 2 minutes to a decision, matching the Activity Discovery bar); added content actually gets *run* (library status board shows started, not shelf-ware); and no research-log entry ever quotes a family describing membership content in transactional terms — the "our bookshelf, not the bookshop" mental model (§2.6) holding is the real success state.

---

## 2. Design Decisions (with rationale)

### 2.1 One membership, one experience

No freemium tier separation. Every subscribing family sees the same catalogue. Membership-included content carries zero transactional framing — no pricing displayed, no "$0", no "Free" badges. The CTA for included content is "Add to Library," identical in visual weight to any other action. Premium content's price IS the only visual distinction. Rationale: families should feel they're curating a library, not shopping a clearance rack.

### 2.2 Pack-centric browsing

Packs are the primary content unit. They represent 2+ weeks of structured learning across 4–6 modules with coherent pedagogical progression. Standalone modules exist as secondary items — visible in the same grid, visually distinguished by card treatment, but not given equal prominence. Rationale: packs deliver more sustained educational value; standalone modules serve gap-filling and one-off interest exploration.

### 2.3 Editorial curation over algorithmic recommendation

The prototype features "Editor's Picks" as a horizontal scroll above the browse grid, with editorial badge types: Staff Pick, Specialist, and New. No ratings, reviews, or star systems in MVP. Trust signals come from creator credentials (verified badge, professional title, bio) and Hearth editorial selection. Rationale: the catalogue is small enough for editorial curation to be meaningful. Ratings become valuable once the catalogue exceeds ~50 packs and community feedback is genuinely informative.

### 2.4 "Add to Library" as intentional curation

Adding content to the family library is a deliberate curatorial act, not an impulse purchase. The "on deck" metaphor means families build a considered learning library. This distinction is reinforced by: the library being the pool the AI intelligence layer draws recommendations from, and smaller libraries producing cheaper AI processing (fewer tokens to scan).

### 2.5 Creator as trust signal, not browse dimension

Creator names and verified badges appear on cards and in the pack detail modal. There is no "browse by educator" view in MVP. Creators are credibility markers, not a first-class navigation path. Rationale: with fewer than 20 creators at launch, a creator browse path would feel empty. Revisit when the creator community grows.

### 2.6 Marketplace vs Activity Discovery — the distinction

| Dimension | Marketplace | Activity Discovery |
|-----------|------------|-------------------|
| What it shows | Everything in the catalogue | Only content in the family's library |
| Mental model | "The bookshop" | "Our bookshelf" |
| Entry point | Dashboard nav / Explore | Dashboard nav / Our Library |
| Primary action | Add to Library / Purchase | Start Session / Add to Day |
| Content not yet owned | Yes — this is the point | No — only owned/added content |
| Pricing visible | On premium items only | Never |

---

## 3. Page Structure

### 3.1 Layout hierarchy (top to bottom)

1. **Top nav bar** — back arrow to Dashboard (left), "My Library" button with item count badge (right)
2. **Page header** — title ("Browse Content") + subtitle ("Curate your family's learning library")
3. **Family Fit suggestion** — personalised banner showing subject areas where the family's coverage is thin, with subject pip badges
4. **Editor's Picks** — horizontal scroll of 3–5 featured pack cards with editorial badges
5. **Browse controls** — type tabs (All / Packs / Modules), filter dropdowns (Subject, Age, Availability), sort select
6. **Results count** — "Showing N items — X packs, Y standalone modules"
7. **Content grid** — responsive grid of pack cards and standalone module cards

### 3.2 Content grid layout

Desktop (>1100px): 3 columns. Tablet (768–1100px): 2 columns. Mobile (<600px): 1 column. Gap spacing: `--space-lg` (24px). Pack cards and standalone module cards intermix in the grid, sorted by the current sort order.

---

## 4. Card Anatomy

### 4.1 Pack card

A pack card has a hero section and a body section, both tappable to open the pack detail modal.

**Hero section** (80px height):
- Subject-tinted gradient background (primary subject drives the gradient hue)
- Emoji placeholder centred (replaced with imagery in later design phase)
- Type badge: "PACK" — positioned top-left, uppercase, small, muted treatment
- If featured: editorial badge overlays the hero (Staff Pick / Specialist / New)

**Body section:**
- Subject chips — coloured pills for each subject covered, consistent colour system across the platform
- Creator line — avatar (emoji placeholder), name, verified checkmark if applicable
- Pack title — Crimson Text serif, 1.1rem, 600 weight
- Description — 2-line clamp, Inter sans-serif, 13px, secondary text colour
- Meta line — module count, age range, duration estimate, separated by middot characters
- Footer row — creator info (left), action button (right)

**Action button states:**

| Content state | Button text | Button style |
|--------------|-------------|--------------|
| Included, not in library | "Add to Library" | Ghost ember (outline, ember text) |
| Premium, not purchased | Price string ("$14.99") | Solid ember (filled background) |
| Already in library | "✓ In Library" | Muted ghost (border colour, muted text, no hover effect) |

The action button has `event.stopPropagation()` to prevent the card tap from opening the detail modal when the button is tapped directly.

**In-library card dimming:** Cards where the content is already in the family's library render at `opacity: 0.65`, increasing to `0.8` on hover. This communicates "you have this" without removing it from the grid.

### 4.2 Standalone module card

Visually distinct from pack cards to communicate a different content scope:

- No hero section — card is flat with padding
- Top accent bar — 3px coloured line at card top, matching the primary subject colour
- "MODULE" label — uppercase, 9px, muted, positioned at top of body
- Subject chips, title (slightly smaller at 1.05rem), description (2-line clamp), meta line
- Meta line shows approach count and session duration instead of module count and week duration
- Footer row — same action button pattern as pack cards

The lack of hero section and the top accent bar are the primary visual signals that this is a single module, not a multi-module pack.

### 4.3 Featured card (Editor's Picks)

Larger than grid cards. Fixed width at 400px (min 320px on mobile: 85vw). Scroll-snap alignment. Same anatomy as pack card but with a taller hero (140px), larger title (1.3rem), and an editorial badge in the hero (Staff Pick / Specialist / New). Editorial badges use distinct colour treatments: Staff Pick in ember, New in science green, Specialist in HASS violet.

---

## 5. Browse Controls

### 5.1 Type tabs

Three mutually exclusive tabs: All (default), Packs, Modules. Active tab gets a filled background (`--coffee-light`) with a subtle border. Selecting a tab filters the grid to show only matching content types. The results count line updates to reflect the filtered set.

### 5.2 Filter dropdowns

Three filter dropdowns positioned after the type tabs, separated by a 1px vertical divider:

**Subject filter** — multi-select. Options: All Subjects (default selected), Science, English, Mathematics, HASS, HPE. Each option shows a coloured dot matching the subject's colour token. Multiple subjects can be selected simultaneously (additive OR — show content matching any selected subject). When a filter is active (not "All"), the filter button gains an `active-filter` class with ember border and text.

**Age filter** — multi-select. Options: All Ages, 5–6 years, 7–8 years, 9–10 years, 11–12 years. Uses checkbox visual (opt-check) instead of coloured dots. Multiple age ranges can be selected. Content matches if its age range overlaps any selected range.

**Availability filter** — multi-select. Options: All Content (default), Included with membership, Premium packs, Not yet in my library. The "Not yet in my library" option is particularly valuable — it hides content the family already has, showing only what's new to discover.

### 5.3 Sort control

A native `<select>` element positioned at the right end of the browse controls bar. Sort options:
- Best Fit (default) — family-fit algorithm considering age match, coverage gaps, and pedagogy profile
- Newest — publication date descending
- Most Modules — module count descending
- Age (youngest first) — lower age range ascending
- Age (oldest first) — lower age range descending

No price sort. This is intentional: sorting by price foregrounds the included/premium distinction in a way that contradicts the "one membership, one experience" principle. If a parent wants to see only premium or only included content, the Availability filter serves that purpose without creating a price hierarchy in the grid.

### 5.4 Search

The prototype does not include a search bar. For MVP with fewer than ~30 catalogue items, browse + filter is sufficient. Search becomes necessary when the catalogue exceeds ~50 items. When implemented, search should be a text input integrated into the browse controls bar, querying Sanity's full-text search across pack titles, descriptions, module titles, and creator names. Search results replace the grid content with a filtered set; the results count updates accordingly.

**Implementation note for search:** Sanity supports full-text search via GROQ's `match()` operator. The query pattern would be `*[_type in ['pack', 'module'] && (title match $query || description match $query)]`.

---

## 6. Pack Detail Modal

### 6.1 Presentation

Tapping a pack card opens a modal overlay. On mobile (<768px), the modal slides up from the bottom with top corners rounded and no bottom rounding (bottom-sheet pattern). On desktop (>=768px), the modal is centred vertically with full rounded corners. Maximum width: 680px. Maximum height: 90vh (mobile) / 85vh (desktop). Body content scrolls; the footer is sticky at the bottom.

The overlay background is a dark scrim (`rgba(10, 8, 6, 0.85)`) with an 8px backdrop blur. Escape key and overlay tap (outside modal content) close the modal. A close button is positioned top-right of the hero.

### 6.2 Modal content (top to bottom)

**Hero** — 120px height, subject-tinted gradient, large emoji placeholder (56px). Same gradient class as the card hero.

**Subject chips** — row of subject pills, same treatment as cards.

**Title** — Crimson Text serif, 1.5rem, 700 weight.

**Description** — full description (not clamped), 14px, secondary text, 1.6 line height. This is the extended sell copy that the card's 2-line clamp hides.

**Meta row** — module count, age range, duration. Same middot-separated format as cards but with emoji prefix icons and bolder values.

**Creator section** — card within the modal with dark background. Shows a larger avatar (36px), creator name with optional verified badge, and professional title/credentials. This is the primary trust signal in the absence of ratings/reviews. The creator title should communicate genuine expertise — "Wildlife Educator · 15 years field experience" rather than generic descriptions.

**Prerequisite notice** (conditional) — a warm-toned notice block shown only when the pack has prerequisites. Uses a warning-amber background tint. Contains the prerequisite pack name as a tappable link that opens that pack's detail modal. Language: "This pack builds on concepts from [Pack Name]. We suggest completing it first, but it's not required." Non-blocking — the parent can still add or purchase regardless.

**Module list** — section title ("Modules in this pack (N)"), then a vertical list of module cards. Each module card shows: a numbered circle, module title (Crimson Text serif), description, and meta tags (approach count, duration, or "Capstone" label). Module cards within the list are not individually tappable in MVP — they're preview-only. Individual module purchase or selective addition is not supported; packs are atomic units.

### 6.3 Modal footer (sticky)

The footer has two elements: an info label (left) and an action button (right).

**Three footer states:**

| State | Left label | Button |
|-------|-----------|--------|
| Included, not in library | "Included with your membership" | "Add to Library" (ghost ember) |
| Premium, not purchased | Price in serif/bold | "Purchase $X.XX" (solid ember) |
| Already in library | "Already in your library" | "In Library" (disabled ghost) |

After "Add to Library" is tapped, the button transitions to the "In Library" state, the label changes to "Already in your library", and a toast notification appears confirming the addition.

---

## 7. Acquire Flows

### 7.1 "Add to Library" (membership-included content)

**Interaction:** Single tap. No confirmation dialog. The add is instant.

**Feedback:** Button transitions to "In Library" state. Toast notification: "[Pack Name] added to your library". Library count badge in the top nav increments by 1.

**What happens in the data layer:**
- A `family_library` record is created in PostgreSQL with `content_type: 'pack'`, `content_id` pointing to the Sanity pack `_id`, `added_at` timestamp, and `source: 'marketplace'`.
- All modules within the pack become browsable in Activity Discovery. The pack is added as a unit — individual modules inherit library access from the parent pack record.
- The Family Intelligence Snapshot is queued for refresh so the AI layer accounts for the expanded library.

**No overwhelm protection in the add flow.** The prototype does not prompt "add to this week's plan?" or suggest starting points. This is intentional — adding to library and planning are separate cognitive tasks. The Weekly Planner and Activity Discovery handle sequencing. However, the pack detail modal's module list is numbered, and prerequisite notices communicate sequencing where it matters.

### 7.2 Purchase flow (premium content)

**MVP stub state:** The transition plan (`hearth-claude-code-transition-plan-v1.md`) specifies that purchase is stubbed for MVP. The price is displayed on cards and in the modal, but tapping the purchase button shows a toast: "Opening purchase flow…" (currently a stub). For test family launch, all content is membership-included. Premium pricing is visible to validate the visual treatment and mental model, but no real transactions occur.

**Target state (post-MVP):**

Tapping the purchase CTA initiates a Stripe Checkout session. The flow:

1. Parent taps "Purchase $X.XX" on card or in modal
2. A Stripe Checkout session is created server-side with the pack/module ID, price, and family ID
3. The UI navigates to Stripe's hosted checkout page (not an in-app embed for MVP — hosted checkout is faster to implement and handles PCI compliance)
4. Parent completes payment via Stripe (card, Apple Pay, Google Pay — Stripe handles method availability)
5. Stripe redirects back to a Hearth confirmation page
6. A `purchases` record is created in PostgreSQL with `content_id`, `family_id`, `amount`, `stripe_payment_id`, `purchased_at`
7. A `family_library` record is created (same as the "Add to Library" flow) with `source: 'purchase'`
8. The confirmation page shows: pack name, purchase amount, and a CTA to "Go to My Library" or "Browse More"

**Refund policy:** Not surfaced in the purchase flow for MVP. When implemented, a brief line on the checkout page: "30-day refund available if no modules have been started." Refund logic: if `module_completions` count for any module in the pack is zero, the refund is automatic. If any module has been started, the refund requires manual review.

**Payment method storage:** Stripe handles payment method storage via their Customer object. Family Settings should link to Stripe's customer portal for managing stored payment methods. Hearth does not store card numbers or payment details.

### 7.3 Pack module sequencing

Packs add all modules as a unit. The module list in the pack detail modal is numbered to suggest sequence. For packs where sequence matters (progressive skill building), the first module's description should communicate it's the starting point. The prerequisite notice on the pack detail modal handles cross-pack dependencies.

Within a pack, module sequencing is suggested, not enforced. Activity Discovery shows all modules in the pack once added. The module list order (from Sanity) communicates the intended sequence. A future enhancement could add "suggested next" indicators based on which modules the family has completed within the pack.

---

## 8. Content State Indicators

### 8.1 States on browse cards

| State | Visual treatment | How determined |
|-------|-----------------|---------------|
| Not added, included | Normal card. "Add to Library" ghost ember button | No `family_library` record for this `content_id` |
| Not purchased, premium | Normal card. Price on solid ember button | No `purchases` record for this `content_id` |
| In library (added or purchased) | Card at `opacity: 0.65`. Button reads "In Library", muted style | `family_library` record exists |
| In progress | Not visually distinct from "in library" on Marketplace cards | `module_completions` records exist but pack not fully complete |
| Completed | Not visually distinct from "in library" on Marketplace cards | All modules in pack have completion records |

The Marketplace does not surface in-progress or completion granularity. Its job is "do you have this or not?" — progress tracking belongs on Activity Discovery, Portfolio, and the Capabilities Constellation. This keeps the Marketplace focused on acquisition, not tracking.

### 8.2 Pack partially complete

A pack where 3 of 6 modules are done still shows "In Library" with the dimmed card treatment. No progress bar or fraction indicator appears on Marketplace cards. Rationale: the Marketplace is for browsing and acquiring, not monitoring progress. If a parent wants to see pack progress, they open Activity Discovery (which shows per-module completion within owned packs).

---

## 9. Membership-Included vs Premium — Visual Treatment

### 9.1 The constraint

Included content must carry zero transactional framing. No "Free" badge, no "$0", no strikethrough pricing, no "Included" badge on the card. The absence of a price IS the signal.

### 9.2 How the prototype implements this

- Included content: action button reads "Add to Library" with ghost ember styling (outline + ember text)
- Premium content: action button reads the price string ("$14.99") with solid ember styling (filled background + inverse text)

The button treatment is the only distinction. Card size, hero treatment, grid position, and text formatting are identical. A parent scanning the grid sees some cards with "Add to Library" and some with a price — no other indicator suggests a tier difference.

### 9.3 Mixed grid

Included and premium content appear in the same browse grid, intermixed based on the current sort order. They are not separated into sections ("Free Content" / "Premium Content"). The Availability filter allows parents to narrow to one type if they choose, but the default view is "All Content."

### 9.4 Featured section

Editor's Picks can include both included and premium packs. The featured card action button follows the same treatment: "Add to Library" for included, price string for premium. Editorial badges (Staff Pick, Specialist, New) are orthogonal to pricing.

---

## 10. Family Fit Suggestion

### 10.1 What it is

A banner below the page header that surfaces subject areas where the family's curriculum coverage has gaps, based on logged learning entries and module completions relative to the HEU Report's coverage expectations.

### 10.2 Content

The banner contains: a compass emoji, a bold label ("Suggested for your family"), an explanatory line referencing the family's learner ages, and subject pip badges for the under-covered areas. The prototype shows: "Your learners (ages 5-8) could use more coverage in these areas: Science, HPE."

### 10.3 Data source

The Family Intelligence Snapshot provides the coverage gap data. The `coverage_gaps` field in the snapshot lists subject areas where the family's logged evidence is below the expected threshold for their learners' year levels. If no gaps exist, the banner can either hide or show a positive message ("Your coverage is well-balanced across all areas").

### 10.4 Cold start

A new family with no logging history has no coverage data. The Family Fit banner shows a softened version: "Based on [Child]'s age, here are some great starting points" — driven by the family's learner ages and pedagogy profile rather than gap analysis. The sort order "Best Fit" similarly falls back to age-appropriate content when no usage history exists.

---

## 11. Data Model

### 11.1 Sanity (content side)

Pack detail modal data is fetched via GROQ. The canonical query from the HCMS strategy:

```groq
*[_type == 'pack' && _id == $packId][0] {
  title,
  description,
  price,
  "moduleCount": count(modules),
  "modules": modules[]->{
    title,
    targetUnderstanding,
    ageRange,
    "approachCount": count(approaches)
  },
  "totalActivities": count(modules[]->approaches[]->activities[]),
  creator->{name, bio, photo, verified, title}
}
```

Browse grid data uses a list query:

```groq
*[_type in ['pack', 'module'] && status == 'published'] | order(title) {
  _id,
  _type,
  title,
  description,
  price,
  ageRange,
  subjectAreas,
  "moduleCount": _type == 'pack' => count(modules),
  "approachCount": _type == 'module' => count(approaches),
  duration,
  creator->{name, verified, title}
}
```

### 11.2 PostgreSQL (state side)

**`family_library` table:**

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| family_id | uuid | FK to families |
| content_id | text | Sanity document `_id` |
| content_type | enum | 'pack' or 'module' |
| content_title | text | Denormalised for display without Sanity round-trip |
| source | enum | 'marketplace', 'purchase', 'module_builder' |
| added_at | timestamptz | When the content was added |

**`purchases` table:**

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| family_id | uuid | FK to families |
| content_id | text | Sanity document `_id` |
| content_type | enum | 'pack' or 'module' |
| amount_cents | integer | Purchase price in cents |
| currency | text | ISO 4217 currency code (AUD for launch) |
| stripe_payment_id | text | Stripe payment intent ID |
| stripe_checkout_session_id | text | Stripe checkout session ID |
| status | enum | 'completed', 'refunded', 'disputed' |
| purchased_at | timestamptz | Transaction timestamp |
| refunded_at | timestamptz | Null unless refunded |

### 11.3 Cross-system flow

```
BROWSE:  Sanity -> pack/module list (cached 1 day)
         PostgreSQL -> family_library records (to mark "in library" state)
         PostgreSQL -> family_intelligence_snapshot (for Family Fit banner)

ADD:     POST /api/library/add { content_id, content_type }
         -> Creates family_library record
         -> Queues intelligence snapshot refresh

PURCHASE: POST /api/purchases/create-checkout { content_id }
          -> Creates Stripe Checkout session
          -> Stripe webhook -> creates purchases + family_library records
```

---

## 12. Integration Points

### 12.1 Downstream: Activity Discovery

Content added to the library via Marketplace appears in Activity Discovery on the next page load. Activity Discovery queries `family_library` to determine its content pool, then fetches full content details from Sanity. The two screens share subject colour tokens, card layout patterns, and the "Add to Day" planner integration.

### 12.2 Downstream: Weekly Planner

Indirectly connected. Content goes Marketplace -> Library -> Activity Discovery -> "Add to Day" -> Planner. The Marketplace itself does not write to the planner.

### 12.3 Downstream: AI Intelligence Layer

The intelligence layer draws recommendations from the family's library. Adding a pack via Marketplace expands the recommendation pool. The snapshot refresh triggered by library additions ensures the next AI-powered screen load reflects the new content.

### 12.4 Upstream: Pedagogy Engine

The family's pedagogy profile influences sort order (Best Fit) and potentially future recommendation surfacing. The Marketplace does not render pedagogy overlays — it shows philosophy-neutral content descriptions. Overlay application happens at the Module Experience level when the family actually runs the content.

### 12.5 Upstream: HEU Report

Coverage gap data from the HEU Report's underlying calculations feeds the Family Fit suggestion banner. The Marketplace does not write to HEU Report data.

### 12.6 Upstream: Notification System

The notification system may trigger a Marketplace visit via nudges like "We noticed you haven't covered much Science this term — explore some options?" These route the parent to the Marketplace with a subject filter pre-applied. The notification passes the subject as a URL parameter (e.g., `/marketplace?subject=science`).

---

## 13. Mobile Considerations

### 13.1 Grid layout

Single column on screens below 600px. Cards stretch full width. Featured cards in the horizontal scroll shrink to `85vw` width (min 280px) to allow peek of the next card.

### 13.2 Filter controls

A "Filters & Sort" toggle button appears on mobile (<768px), replacing the inline filter bar. Tapping it reveals the filter controls in a vertical stack. The filter separator line hides. Sort control loses its `margin-left: auto` and stacks full-width.

### 13.3 Pack detail modal

Slides up from bottom on mobile with top-corner rounding only (bottom-sheet pattern). Maximum height 90vh. Scrollable body with sticky footer. Close button in hero, plus swipe-down to dismiss (future enhancement — not in current prototype).

### 13.4 Touch targets

All action buttons meet 44x44px minimum touch target. Filter dropdown items have 7px vertical padding ensuring adequate tap area. The modal close button is 32x32px — should be increased to 44x44px for production.

---

## 14. Empty and Edge States

### 14.1 No search results

When filters produce zero results, the grid area shows: "No content matches your filters." A "Reset Filters" action link clears all active filters and returns to the default "All" view.

### 14.2 All content in library

If every item in the filtered view is already in the family's library, the grid renders normally (all cards dimmed to 0.65). No special empty state — the parent can see they've been thorough. Optionally, a banner could say "You've added everything in this category — nice curation!" but this is a polish item, not MVP.

### 14.3 No pedagogy profile set

If the family hasn't run the Pedagogy Engine, the Family Fit banner falls back to age-based suggestions only. The "Best Fit" sort uses age matching as the primary signal. No blocking or redirect — the Marketplace is fully functional without a pedagogy profile, just less personalised.

### 14.4 Sanity content unavailable

If Sanity is down and cache is cold, the page shows the HCMS strategy's standard empty state: "Content is temporarily unavailable. Your logged learning and family data are safe." The top nav and Family Fit banner (from PostgreSQL) still render. The content grid is replaced with the friendly message. No alarm language.

### 14.5 Network failure during add/purchase

If the `POST /api/library/add` call fails, the button reverts to its pre-tap state and a toast shows: "Couldn't add to library — please try again." The optimistic UI update (button switching to "In Library") should revert on failure. For purchase failures, Stripe handles error states on their hosted checkout page.

---

## 15. Accessibility

### 15.1 Current prototype gaps

The prototype lacks ARIA labels on interactive elements. Production implementation requires:

- Pack cards: `role="article"` with `aria-label="[Pack Title] — [module count] modules, [age range]"`
- Action buttons: `aria-label` that includes the content name and action (e.g., "Add Poetry Playground to library")
- Filter dropdowns: `role="listbox"` with `aria-selected` on active options
- Modal: `role="dialog"`, `aria-modal="true"`, focus trap on open, focus return to trigger card on close
- Toast notifications: `role="status"`, `aria-live="polite"`
- Editorial badges: `aria-label` with badge type (e.g., "Staff Pick")

### 15.2 Keyboard navigation

Tab through cards, Enter to open detail modal, Escape to close. Filter dropdowns accessible via Enter/Space to toggle, arrow keys to navigate options. Sort select is a native `<select>` — keyboard accessible by default.

### 15.3 Colour contrast

All text meets AA minimum on dark backgrounds. The dimmed "in library" state at `opacity: 0.65` needs verification — the contrast of `--text-secondary` at 0.65 opacity against `--deep-coffee` may fall below AA threshold. If so, the dimming should be reduced or applied only to the hero section rather than the entire card.

---

## 16. Metrics to Track

| Metric | Purpose |
|--------|---------|
| Browse to Add conversion rate | % of Marketplace visits that result in at least one library addition |
| Average packs added per session | Library curation depth |
| Featured click-through rate | Editorial curation effectiveness |
| Filter usage by type | Which filters parents actually use |
| Pack detail modal open rate | % of card taps that reach the detail view |
| Modal to Add conversion | % of detail views that convert to library additions |
| Time in Marketplace per session | Engagement depth (target: under 5 minutes per the 5-minute rule) |
| Premium pack view rate | Interest in paid content (pre-revenue signal) |
| Family Fit banner engagement | Whether gap suggestions drive additions in the suggested subjects |
| Search usage (when implemented) | % of sessions using search vs browse |

---

## 17. Open Questions

### 17.1 Standalone module detail view

The prototype has a `openModulePreview()` function that currently shows a toast stub ("Opening preview: [title]"). Standalone modules need a detail view equivalent to the pack detail modal, but the content differs — there are no sub-modules to list. Instead, the module detail should show: description, approach list with modalities, time estimate, creator, subject coverage, and the same Add to Library / Purchase footer. This can be a variant of the pack detail modal template with the module list section replaced by an approach list.

### 17.2 "My Library" link destination

The top nav includes a "My Library" button with an item count. In the prototype, this is non-functional. The destination should be Activity Discovery (which shows the family's owned content). This creates a direct Marketplace to My Library navigation shortcut. Confirm whether this link should navigate to Activity Discovery with a "My Library" filter pre-applied, or to a dedicated library management view.

### 17.3 Removing content from library

No removal mechanism exists in the prototype. If a parent adds a pack and decides they don't want it cluttering their library, can they remove it? Recommendation: yes, via Activity Discovery (not Marketplace). A "Remove from Library" action on the Activity Discovery card or detail view, with a confirmation dialog. Removed included content can be re-added from Marketplace. Removed purchased content returns to "Purchased" state (owned but not in library). The Marketplace card state would revert from "In Library" to the appropriate add/purchase state.

### 17.4 Marketplace content loading strategy

With a small catalogue (<30 items), the entire catalogue can be loaded in a single Sanity query on page load. As the catalogue grows, pagination or infinite scroll becomes necessary. Recommendation: load all for MVP. Add cursor-based pagination when catalogue exceeds 50 items. The results count line already communicates total items, so the pagination UX would be a "Load More" button at the bottom of the grid, not numbered pages.

### 17.5 Currency and regional pricing

The prototype uses USD ($) pricing. For an Australian platform launching in Queensland, pricing should be in AUD. Stripe handles currency at the Checkout level. The Sanity `pack.price` field should store price in cents as an integer with a separate currency field, or use Stripe's Price object ID and fetch the display price from Stripe. Recommendation: store a Stripe Price ID on the Sanity pack document; fetch the localised price for display. This allows future multi-currency support without schema changes.

### 17.6 Creator profile expansion

The modal shows creator credentials inline. Should there be a tappable creator profile that expands to show a full bio, other packs by this creator, and qualifications? Not for MVP — the inline treatment is sufficient. When the catalogue grows and creators have multiple packs, a creator profile page becomes valuable. The `educator` document type in Sanity already supports this.

### 17.7 Content preview or sampling

Can a parent preview a module's first activity before adding a pack to their library? Not in the current design — the module list in the pack detail modal shows titles and descriptions but not activity content. This is intentional for MVP: the creator credentials, module descriptions, and editorial curation provide enough trust signal. Activity-level previews could be added as a pack detail enhancement later.

### 17.8 Pack bundles or seasonal promotions

Can multiple packs be bundled for a promotional price? Not in the current design. Stripe supports this via Products with multiple Prices, but the Marketplace UI would need a "Bundle" card type distinct from pack and module cards. Defer to post-MVP.

---

## 18. Implementation Sequence

| Step | Work | Depends on |
|------|------|-----------|
| 1 | Create `family_library` and `purchases` tables in PostgreSQL | Database schema access |
| 2 | Build Sanity schemas for `pack`, `module`, `educator` if not already done | Sanity project setup |
| 3 | Build `/api/library/add` endpoint | Step 1 |
| 4 | Build Marketplace browse page — grid, cards, filters, sort | Steps 2-3 |
| 5 | Build pack detail modal | Step 4 |
| 6 | Build standalone module detail variant | Step 5 |
| 7 | Connect Family Fit banner to intelligence snapshot | Intelligence layer |
| 8 | Build Stripe Checkout integration (`/api/purchases/create-checkout`) | Step 1 + Stripe account |
| 9 | Build Stripe webhook handler for purchase confirmation | Step 8 |
| 10 | Wire Activity Discovery to read from `family_library` | Step 3 |
| 11 | Add "My Library" navigation link | Step 10 |

Steps 1-6 are MVP-critical. Steps 7-9 are post-MVP. Steps 10-11 are integration pass items.

---

## 19. Related Documents

| Document | Relationship |
|----------|-------------|
| `Hearth_System_Interaction_Map.md` (S2.3, S3.10) | Content lifecycle, Marketplace screen definition |
| `hearth-hcms-strategy-v1.md` | Sanity document types, GROQ queries, caching, three-layer model |
| `hearth-activity-discovery-docs.md` | Downstream screen — what happens after content is in library |
| `hearth-notification-system-spec.md` | Upstream — nudge-to-Marketplace with filter pre-applied |
| `hearth-data-deletion-privacy-model-v1.md` | Library content and purchase record deletion behaviour |
| `hearth-claude-code-transition-plan-v1.md` (S4.5, S5) | Technical implementation plan for Marketplace + Activity Discovery |

---

## 20. COMPONENT_REGISTRY.md Update

The Marketplace entry should note this spec alongside the prototype:

```
| 17 | Marketplace | hearth-marketplace.html | Educator-created content discovery and acquisition |
  Spec: hearth-marketplace-spec-v1.md |
```

---

*This specification documents the Marketplace as designed in the prototype. Update when the purchase flow is built, when search is added, or when the catalogue grows beyond the current editorial curation model.*
