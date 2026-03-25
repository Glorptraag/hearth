# Hearth Family Settings — UX & Functional Design Specification

> **Version:** 1  
> **Date:** 2026-03-11  
> **Priority:** CRITICAL — onboarding gate for every new family  
> **Prototype:** `hearth-family-settings.html`  
> **Architecture references:** `hearth-data-deletion-privacy-model-v1.md`, `Hearth_System_Interaction_Map.md` (Section 3.14), `hearth-notification-system-spec.md`  
> **Status:** First documentation pass — all sections specified, open questions flagged

---

## 1. Purpose

Family Settings is the central configuration hub for every Hearth family. It serves two distinct roles:

**Onboarding gate.** This is the first meaningful screen after Clerk authentication completes. A new family cannot reach the Dashboard until minimum configuration is met (family name + at least one child). Every subsequent platform feature depends on data configured here: child records flow into the Logger, Portfolio, Constellation, HEU Report, and Weekly Planner. The pedagogy profile configured here determines how content is framed across the entire platform.

**Ongoing administration.** Returning families use Settings to update learner details, adjust notification preferences, manage co-facilitator access, configure compliance reporting, and handle account-level operations (data export, deletion). The 5-minute rule applies: any settings change should be completable in under five minutes, most in under sixty seconds.

### What this screen produces

Family Settings is a data *producer* consumed by the entire platform:

- **Family configuration** — name, location, state/territory (determines compliance framework)
- **Child records** — name, DOB, year level, abstract shape identifier, learning style, facilitator notes. Referenced by Logger, Portfolio, HEU Report, Constellation, Weekly Planner, Module Experience, Badge Assessment
- **Pedagogy profile** — summary view here, full configuration via Pedagogy Engine link. The `familyPedagogicalProfile` object drives overlay behaviour on Dashboard, Activity Discovery, Logger, Portfolio, HEU Report, and Weekly Planner
- **Compliance configuration** — HEU registration, audit dates, reporting period, export preferences
- **Notification preferences** — consumed by the Notification Center's delivery engine
- **Co-facilitator records** — access grants consumed by the auth middleware
- **Account state** — subscription tier, data export requests, deletion state

---

## 2. Design Decisions

### 2.1 Accordion pattern: single-section expansion

**Decision:** One section open at a time. Opening a new section closes the previously open one.

**Rationale:** Settings screens invite aimless browsing when everything is visible. The single-open pattern creates a focused, task-oriented experience: the parent came here to do one thing, does it, leaves. This matches the 5-minute rule. The prototype implements this via `toggleSection()` which closes all sections before opening the clicked one.

**Scroll behaviour:** When a section opens, the view auto-scrolls to place the opened section header at the top of the viewport (100ms delay to allow animation start). This prevents the parent from losing context when a section lower on the page expands.

### 2.2 Auto-save with toast confirmation

**Decision:** All field changes auto-save. No explicit "Save" buttons on individual sections.

**Rationale:** Explicit save buttons add cognitive overhead and create a failure mode (parent makes changes, navigates away without saving). Auto-save with a brief toast notification ("Changes saved") provides confirmation without requiring action. This aligns with native iOS/Android settings patterns that parents already understand.

**Exception:** The Learner edit form retains explicit Save/Cancel buttons because the edit involves multiple related fields that should be committed as a group. A parent editing a child's name and DOB should be able to cancel the entire edit, not have partial saves.

### 2.3 Desktop-first with responsive collapse

**Decision:** Desktop layout uses a sidebar navigation (240px) + main content area. Mobile hides the sidebar and uses the platform's standard bottom navigation.

**Rationale:** Settings is a sit-down task, not a quick-capture task. Parents configure settings when they have a few minutes at a desktop or tablet. The sidebar provides wayfinding across the platform while the main area focuses on the settings content. On mobile (<900px), the sidebar is hidden — the parent arrived via the bottom nav's Settings icon and doesn't need duplicate navigation.

### 2.4 Section status badges

**Decision:** Each section header shows a status badge: "Configured" (green), "Pending" (amber), "2 learners" (blue count), "HEU Active" (green), "1 member" (blue count).

**Rationale:** Status badges provide at-a-glance completeness without opening sections. Critical during onboarding when the parent needs to know which sections still require attention. During ongoing use, they surface key configuration state (is HEU active? how many co-facilitators?).

### 2.5 Abstract shape identifiers for children

**Decision:** Children are represented by unique abstract SVG shapes with gradient colour palettes, not photographs.

**Rationale:** Documented platform-wide decision. Avoids comparison anxiety between siblings, respects child privacy, and creates a distinctive visual identity that carries across all screens. Shape assignment happens at child creation; shapes are intentionally incomparable (a spiral vs a polygon — you can't rank them).

### 2.6 Pedagogy as summary, not configuration

**Decision:** The Learning Approach section shows a read-only summary of the family's pedagogical profile with a link to the full Pedagogy Engine. It does not duplicate the Engine's configuration UI.

**Rationale:** The Pedagogy Engine is a 4-step onboarding wizard (Philosophy → Values → Practices → Review). Embedding this inside an accordion section would violate the 5-minute rule and create UI confusion. Settings shows the *result* of that configuration: the philosophy name, a description, and the key dimension sliders (Structure, Child-Led, Nature Focus, Assessment). The "Adjust in Pedagogy Engine" button navigates away to the full Engine experience.

### 2.7 Co-facilitator model: equal access, not granular permissions

**Decision:** MVP co-facilitators get full facilitator access. They can log activities, upload evidence, award badges, and view all family data. Only the Primary Facilitator can manage account settings and billing.

**Rationale:** A granular permission matrix (view-only, log-only, admin) adds complexity that isn't needed for the 10-20 family test launch. Most co-facilitators are partners/spouses who need full access. The Primary/Facilitator distinction covers the only permission boundary that matters at MVP: who controls the account.

### 2.8 Danger Zone isolation

**Decision:** Account deletion is visually isolated in a "Danger Zone" subsection within Account & Security, using red/destructive styling that breaks from the warm design language.

**Rationale:** Destructive actions must be visually distinct to prevent accidental triggers. The red styling is an intentional break from the Mont Blanc aesthetic — it signals danger through contrast. The multi-step confirmation flow (type family name to confirm) adds friction proportional to the severity.

---

## 3. Onboarding Gate Flow

### 3.1 Entry point

After a new user completes Clerk authentication (email/password or social login), they arrive at Family Settings in **onboarding mode**. The user arrives with:

- A Clerk user ID (authenticated identity)
- An email address
- Optionally, a display name from their auth provider

No family record exists yet. The platform creates an empty `family` row and `user` row linked to the Clerk ID.

### 3.2 Minimum viable configuration

The parent cannot access the Dashboard until two conditions are met:

1. **Family name** is provided (non-empty string, Section 1: Family Profile)
2. **At least one child** is added (name + DOB minimum, Section 2: Our Learners)

These are the only hard gates. Everything else can be deferred.

### 3.3 Onboarding mode behaviour

When minimum configuration is not yet met, Family Settings operates in **onboarding mode**:

- The page header shows a welcome message: "Welcome to Hearth — let's set up your family" instead of the standard "Family Settings" heading.
- A progress indicator appears below the header: "2 steps to get started" with visual checkmarks for Family Name and First Learner.
- Sections 1 (Family Profile) and 2 (Our Learners) are highlighted with amber "Required" badges. All other sections show "Optional — set up later" in their status badge position.
- The Family Profile section opens by default on first load.
- After the family name is saved, the Our Learners section auto-opens with the "Add a learner" form pre-expanded.
- After the first child is added, a "Go to Dashboard →" ember primary button appears at the top of the page, and all section status badges revert to their standard states.

### 3.4 Guided vs freeform

**Decision:** Soft guidance, not a locked wizard. The parent can jump between sections freely using the accordion headers. The progress indicator provides direction but doesn't enforce sequence.

**Rationale:** Parents arrive with different contexts. Some already have HEU registration numbers ready. Some want to set up notifications first. A locked step-by-step wizard would frustrate parents who want to configure in their own order. The soft guidance (highlighted required sections + progress indicator) communicates priority without constraining behaviour.

### 3.5 Deferrable sections

| Section | Deferrable? | Default if skipped |
|---------|------------|-------------------|
| Family Profile — name | No | Blocks Dashboard access |
| Family Profile — location, HEU reg | Yes | State defaults to Queensland (primary market). HEU fields empty |
| Our Learners — first child | No | Blocks Dashboard access |
| Learning Approach | Yes | Defaults to "Eclectic" profile until Pedagogy Engine completed |
| Compliance & Reporting | Yes | HEU toggle defaults to ON for Queensland families. Audit date empty (triggers reminder at 4 weeks) |
| Notifications | Yes | Defaults to "Balanced" frequency. All toggles ON except Weekly Summary Email |
| Family Access | Yes | Primary Facilitator only |
| Account & Security | Yes | Email from Clerk auth. Password managed by Clerk |
| Subscription & Billing | Yes | Trial/free tier until payment configured |

### 3.6 Post-onboarding transition

Once the parent taps "Go to Dashboard →", the platform records `onboarding_completed_at` on the family record. On subsequent visits, Family Settings shows its standard heading and layout with no onboarding-specific UI. The transition is one-way — once onboarding is complete, the parent accesses Settings as a returning user.

---

## 4. Section-by-Section Functional Specification

### 4.1 Family Profile

**Fields:**

| Field | Type | Required | Validation | Auto-save |
|-------|------|----------|------------|-----------|
| Family Name | Text input | Yes (onboarding gate) | 1-100 characters. No empty strings | Yes, on blur |
| Primary Facilitator | Text input | No (pre-filled from auth) | 1-80 characters | Yes, on blur |
| State / Territory | Select dropdown | No | 8 Australian states/territories | Yes, on change |
| Nearest City / Town | Text input | No | 1-60 characters. Free text | Yes, on blur |
| HEU Registration Number | Text input | No | Free text, no format enforcement at MVP. Hint shows expected pattern (HEU-YYYY-XXXXX) | Yes, on blur |
| Registration Date | Date picker | No | No future dates. Reasonable range: 2000-present | Yes, on change |
| Family Bio | Textarea | No | 0-500 characters | Yes, on blur |

**Interaction notes:**

- Family Name is the only blocking field. An inline validation message appears if the parent tries to navigate away with an empty Family Name during onboarding.
- HEU Registration Number format varies. The prototype shows "HEU-2025-08421" as a hint, but validation is not enforced because registration number formats have changed historically and interstate families may have different formats. Backend can add pattern matching per state once formats are confirmed.
- State/Territory defaults to Queensland for new families (primary launch market). Changing state to a non-Queensland value should show a contextual note: "HEU compliance features are currently optimised for Queensland. Support for [selected state] reporting is coming soon."
- Family Bio appears on Portfolio exports and shared reports. The hint communicates this visibility.

### 4.2 Our Learners

This section manages the family's child records. These records are the most consequential data in the platform — they flow into every screen that handles per-child data.

#### Add child flow

Triggered by the "Add a learner" dashed button at the bottom of the learner grid.

**Required fields:**
- First name (text, 1-40 characters)
- Date of birth (date picker, no future dates, reasonable range: child age 3-18)

**Optional fields (shown in expanded add form):**
- Year level (select: Foundation, Year 1-8)
- Learning style (select: Visual, Auditory, Kinesthetic, Reading/Writing, Mixed)
- Learning notes (textarea, 0-500 characters)

**Shape and colour assignment:**

When a child is added, the system automatically assigns an abstract shape and colour gradient from the available pool. The parent does not manually select shapes at creation time (this reduces friction during onboarding). The shape and colour can be changed later via the child's edit form.

**Shape inventory (MVP):**

The platform ships with 8 abstract shapes, each designed to be visually incomparable:
- Spiral/helix (Emma's default in prototype)
- Faceted polygon/crystal (Liam's default in prototype)
- Concentric circles
- Wave/flowing line
- Star cluster/scatter
- Nested triangles
- Organic blob/amoeba
- Interlocking arcs

**Colour gradient palette (MVP):**

Each shape uses a two-colour gradient. Available palettes:
- Blue → Violet (Emma's default)
- Sage → Amber (Liam's default)
- Rose → Coral
- Teal → Cyan
- Lavender → Pink
- Gold → Warm orange
- Mint → Forest
- Peach → Sunset

**Conflict handling:** Auto-assignment cycles through shapes and colours in order. If the first child gets Spiral + Blue→Violet, the second gets Polygon + Sage→Amber, and so on. No two siblings can share both the same shape AND the same colour palette. If a parent manually changes a child's colour to match a sibling, a gentle warning appears: "This colour is also used for [sibling]. Different colours help distinguish learners across Hearth." The system allows it (not blocked) but surfaces the collision.

**Maximum children per family:** 6 learners. The plan card in Section 8 states "Up to 6 learners." The "Add a learner" button disappears when the limit is reached, replaced by a note: "Your plan supports up to 6 learners."

#### Child card display (read state)

Each child card shows:
- Abstract shape SVG (56×56px)
- Full name (first + family surname)
- Age (calculated from DOB, displayed as integer years)
- Year level
- Badge count (from badge_awards table)
- Learning tags (derived from learning style + learning notes keywords)
- Edit button (pencil icon)

**Age calculation:** Age displays as the integer number of full years since DOB. Updated on each page load. Year level is independent of age — homeschool families often work at non-standard year levels. The platform never auto-adjusts year level based on age.

#### Child card edit state

Tapping the edit button toggles the card into edit mode:
- Card gains an ember border and subtle glow
- Learning tags hide
- Edit form expands below the card content
- Form shows: First Name, DOB, Year Level (select), Learning Style (select), Learning Notes (textarea)
- Shape and colour picker (not in prototype — to be added in a future version, currently shape/colour are system-assigned)
- Save Changes (ember primary) and Cancel (secondary) buttons

**What's editable here vs in Learner Profile:**

| Data point | Editable in Settings | Editable in Learner Profile |
|------------|--------------------|-----------------------------|
| First name | Yes | No (read-only, "edit in Settings" link) |
| DOB | Yes | No |
| Year level | Yes | No |
| Learning style | Yes | No |
| Learning notes | Yes (brief) | No |
| Abstract shape/colour | Future (not in MVP prototype) | No |
| Sparks (interests) | No | Yes |
| Learning rhythms | No | Yes |
| Facilitator private notes | No | Yes (encrypted, private) |

The distinction: Settings manages identity data (who is this child, what year level, what age). Learner Profile manages personality and preference data (what are their interests, when do they learn best, private observations).

#### Remove child flow

The "Remove learner" action is accessed via the edit form. It is visually separated from other form actions and uses destructive styling.

**Full flow (per privacy model):**

1. Parent taps "Remove learner" link within the edit form (not a primary button — it's a text link in destructive red colour, placed below the Save/Cancel buttons).

2. **Step 1 — Export offer:** Modal appears: "Before removing [Child], would you like to export their data?" Three options:
   - "Export all data first" — triggers full data export for this child (see Section 4.6), then returns to step 2
   - "Continue without exporting" — proceeds to step 2
   - "Cancel" — returns to edit form

3. **Step 2 — Confirmation:** "Removing [Child] will archive all their learning entries, badges, capability data, evidence, and facilitator notes. Their data will be held in archive for 90 days, then permanently deleted." Parent must type the child's first name to confirm. "Remove [Child]" destructive button activates only when typed name matches.

4. **Immediate effects:**
   - Child disappears from all active screens
   - Family Intelligence Snapshot rebuilds excluding this child
   - Multi-child learning entries: archived child's `per_child_data` hidden from active entry
   - Badge awards, module completions, facilitator notes archived
   - HEU Report for this child becomes inaccessible

5. **90-day archive period:** An "Archived Learners" subsection appears at the bottom of the Our Learners section showing archived children with "Restore" and "Delete permanently" options.

6. **After 90 days:** System sends notification 7 days before permanent deletion. If no action taken, hard delete proceeds.

### 4.3 Learning Approach

This section displays a read-only summary of the family's pedagogical profile.

**Content shown:**

- Philosophy badge (emoji placeholder, e.g. 🌿 for Charlotte Mason)
- Philosophy name and blend description (e.g. "Charlotte Mason — Eclectic Blend")
- Short description of what this means for the family
- Dimension sliders (read-only bars, not interactive):
  - Structure (0-100)
  - Child-Led (0-100)
  - Nature Focus (0-100)
  - Assessment (0-100)
- "Adjust in Pedagogy Engine" button (secondary style)
- "View what this means for activities →" link

**If Pedagogy Engine not yet completed:**

The section shows a default state:
- Philosophy badge: 🎨 (eclectic placeholder)
- Philosophy name: "Eclectic — Getting Started"
- Description: "You haven't configured your learning approach yet. Hearth is using a balanced eclectic default that works well for most families."
- Dimension sliders: all set to 50 (neutral centre)
- "Set up your learning approach" primary ember button (replaces the secondary "Adjust" button — elevated prominence because this is a recommended action)

The system defaults to an Eclectic profile with neutral dimension values. This ensures all screens that consume the `familyPedagogicalProfile` have valid data. The Eclectic default produces the most generic/neutral overlay language.

**Navigation behaviour:**

"Adjust in Pedagogy Engine" navigates away from Family Settings to the standalone Pedagogy Engine screen (`/settings/pedagogy`). The Engine is a separate React component (`hearth-pedagogy-engine-responsive.jsx`) with its own 4-step flow. On completion, the Engine saves the profile and navigates back to Family Settings, where the Learning Approach section reflects the updated configuration.

The Engine does NOT open inline within the accordion. The accordion's max-height animation and single-section pattern are not suited to housing a multi-step wizard.

### 4.4 Compliance & Reporting

**Fields and controls:**

| Control | Type | Default | Behaviour |
|---------|------|---------|-----------|
| Queensland HEU Reporting | Toggle | ON for QLD families, OFF for non-QLD | Master toggle. When OFF, all compliance-specific fields and HEU features across the platform are hidden |
| Next Audit / Review Date | Date picker | Empty | When set, triggers compliance deadline reminders at 8 weeks, 4 weeks, and 2 weeks before. When empty and HEU is ON, a persistent nudge appears: "Set your audit date to receive timely reminders" |
| Reporting Period | Select | "Annual (calendar year)" | Options: Annual (calendar year), Annual (school year — Feb to Dec), Custom dates |
| Auto-Generate Work Samples | Toggle | ON | When ON, the system suggests activities with uploaded evidence as potential work samples for HEU reporting |
| Content Descriptor Tagging | Toggle | ON | When ON, logged activities are auto-tagged with Australian Curriculum V9 content descriptors by the AI enrichment pipeline |
| Export Includes Photos | Toggle | ON | Controls whether evidence photos are bundled in exported PDF report packages |

**HEU toggle OFF behaviour:**

When the Queensland HEU Reporting toggle is switched OFF:
- A confirmation dialog appears: "Turning off HEU reporting will hide compliance features across Hearth. Your existing compliance data is preserved and will reappear if you turn this back on. Continue?"
- If confirmed: the HEU Report screen becomes inaccessible from Our Story navigation. Content descriptor tagging continues in the background (data is still valuable for portfolio purposes) but compliance-specific framing disappears from Dashboard messaging, gap alerts, and notification language.
- The compliance data (entries, descriptor mappings, work sample annotations) is not deleted — only the compliance UI layer is hidden.

This supports non-QLD families who use Hearth for learning management without Queensland-specific compliance tracking.

**Reporting period — Custom dates:**

When "Custom dates" is selected, two additional date pickers appear:
- Period start date
- Period end date

Custom dates allow families whose reporting period doesn't align with calendar or school year boundaries (e.g. families who registered mid-year with the HEU).

**Audit date → Notification system connection:**

The Next Audit Date feeds directly into the notification engine's compliance deadline reminder system. Reminders are sent at 8 weeks, 4 weeks, and 2 weeks before the audit date, with escalating priority. These reminders cannot be individually dismissed — they follow the "compliance-critical reminders always come through" principle noted in the Notifications section hint text. The audit date also determines when the HEU Report screen surfaces its "Review your report — audit approaching" contextual banner.

### 4.5 Notifications & Reminders

**Individual notification toggles:**

| Notification | Default | Category |
|-------------|---------|----------|
| Logging Reminders | ON | Reconnect tier — gentle nudges when no logging activity for configurable period |
| Coverage Gap Alerts | ON | Respond tier — triggered when a curriculum area hasn't been logged for 3+ weeks |
| Badge Milestones | ON | Resume tier — celebrates when learners earn badges or reach capability milestones |
| Weekly Summary Email | OFF | Digest — weekly email sent Sunday evening summarising the week's learning |
| Compliance Deadline Reminders | ON | Always-on when HEU active — escalating reminders at 8/4/2 weeks before audit date. Cannot be disabled while HEU toggle is ON |

**Frequency selector:**

| Level | Behaviour |
|-------|-----------|
| Minimal — only when it matters | Only compliance-critical and badge milestone notifications. No logging reminders or coverage gaps |
| Balanced — gentle weekly check-ins | All enabled notifications delivered. Logging reminders capped at 1/week. Coverage gaps capped at 1/week |
| Proactive — stay on top of everything | All enabled notifications delivered at full frequency. Logging reminders every 2 days of inactivity. Coverage gaps surfaced as they're detected |

The frequency selector controls the *cadence* of notifications, while individual toggles control *which types* are delivered. The combination means: if a parent sets frequency to Minimal but has Badge Milestones toggled ON, badge notifications still come through.

**Compliance deadline reminders override:** When HEU is active and an audit date is set, compliance deadline reminders always come through regardless of the frequency selector setting. The hint text below the frequency selector communicates this: "This controls the overall tone. Compliance-critical reminders always come through."

### 4.6 Family Access / Co-Facilitators

**Member list display:**

Shows all family members with:
- Avatar (initials on coloured circle — Primary gets ember gradient, Facilitators get sage, Pending gets amber)
- Full name
- Email address
- Role badge: "Primary" (ember), "Facilitator" (sage), "Pending" (amber)
- Remove button (× icon) — visible on all members except the Primary Facilitator

**Invite flow:**

1. Parent enters name + email in the invite row fields
2. Taps "Invite" button
3. Client-side validation: both fields required, email format valid
4. On success: new member appears in the list with "Pending" badge. Toast: "Invitation sent to [email]"
5. Backend sends invitation email with a unique accept link

**What the invitee receives:**

An email with: "Sarah has invited you to join The Morrison Family on Hearth — a homeschool learning companion. Accept this invitation to help document and support [children's names]'s learning journey." The email contains an accept link.

**Accept flow (invitee):**

1. Invitee clicks accept link
2. If they don't have a Clerk account: redirected to sign up (email/password or social). After auth, the accept completes automatically.
3. If they already have a Clerk account: redirected to sign in. After auth, the accept completes.
4. On accept: their role updates from "Pending" to "Facilitator" in the inviter's Family Settings. The invitee gains access to the family's platform with Facilitator permissions.

**Pending state:**

- Inviter sees the member in their list with "Pending" badge and a remove (×) button
- Invitee sees nothing until they accept
- Pending invitations expire after 14 days. Expired invitations are automatically removed from the list. The inviter can re-invite.
- No resend mechanism in MVP (inviter removes and re-adds)

**Permission model:**

| Action | Primary Facilitator | Co-Facilitator |
|--------|-------------------|----------------|
| Log activities | Yes | Yes |
| Upload evidence | Yes | Yes |
| Award badges | Yes | Yes |
| View all family data | Yes | Yes |
| Edit child profiles | Yes | Yes |
| Manage Family Settings | Yes | No (read-only access) |
| Manage billing/subscription | Yes | No |
| Invite/remove co-facilitators | Yes | No |
| Delete family account | Yes | No |
| Export family data | Yes | Yes (own data requests only) |

**Remove co-facilitator:**

1. Primary Facilitator taps × next to the co-facilitator
2. Confirmation dialog: "Remove [Name] from your family? They will lose access to all family data. Any activities they logged will remain attributed to your family."
3. On confirm: member removed from access list. Their Clerk account is unaffected — they just lose the family association. Any learning entries they created remain in the family's data (attributed to them by author_id). Their facilitator notes on learner profiles are retained.
4. No data is deleted when removing a co-facilitator. The removal is an access revocation, not a data deletion.

### 4.7 Account & Security

**Email address:** Editable text field. Changing email requires verification:
1. Parent enters new email address
2. On blur/save: system sends a verification code to the new email
3. Inline verification input appears: "Enter the code sent to [new email]"
4. On successful verification: email updated across Clerk and Hearth
5. If verification not completed within 15 minutes: change is cancelled, original email restored

**Password:** Displayed as masked dots. "Change" button opens a modal:
1. Enter current password
2. Enter new password
3. Confirm new password
4. Password requirements: minimum 8 characters, at least one number and one letter
5. On success: toast "Password updated" and all other sessions invalidated
6. Managed via Clerk's password change API

**Data export ("Export All Data"):**

The export button triggers a full family data export per the privacy model:

Contents of the export:
- **JSON package:** All learning entries, badge awards, capability observations, module completions, family profile data, learner profiles (excluding facilitator notes unless opted in)
- **PDF package:** Formatted portfolio documents per child, HEU compliance report snapshots, badge certificates
- **Original files:** All evidence files (photos, audio, documents) in their original upload format
- **Facilitator notes:** NOT included by default. A checkbox appears in the export modal: "Include private facilitator notes (these are normally excluded for your privacy)"

Export generation:
1. Parent taps "Export" button
2. Modal confirms: "Generate a complete archive of your family's data? This may take a few minutes."
3. On confirm: export job queued. Toast: "Preparing your data export. We'll notify you when it's ready."
4. Export generates as a ZIP file on the server
5. Notification delivered when ready: "Your data export is ready to download" with a secure, time-limited download link (expires after 7 days)
6. Download link accessible from the notification and from a "Download latest export" link that appears in the Account & Security section after generation

**Analytics opt-in toggle:**

"Help us improve Hearth by sharing anonymous usage patterns." Default: ON (opt-out model). When toggled OFF, all analytics collection stops for this family. Existing analytics data is anonymised and retained per the retention schedule (24 months rolling). The toggle state feeds into the consent management system documented in the privacy model.

**Danger Zone — Account deletion:**

Full confirmation sequence per privacy model:

1. Parent taps "Delete Family Account" (red destructive button)
2. **Step 1 — Warning modal:** "Deleting your account will permanently remove all family data, learner profiles, activity logs, badges, evidence, and reports. This action begins a 14-day cooling period. During those 14 days, you can log back in and cancel the deletion."
3. **Step 2 — Export offer:** "We strongly recommend exporting your data before deletion." Options:
   - "Export my data first" — triggers data export flow, then returns to step 3
   - "Continue without exporting" — proceeds to step 3
   - "Cancel" — returns to settings
4. **Step 3 — Confirmation:** "To confirm, type your family name: [The Morrison Family]". Input field with exact-match validation. "Delete My Account" destructive button activates only on match.
5. **Immediate effects:**
   - All sessions invalidated (family logged out)
   - Account marked as `pending_deletion`
   - 14-day cooling period begins
   - Email confirmation sent with cancel link: "Your Hearth account is scheduled for deletion on [date]. Changed your mind? Click here to cancel."
6. **During 14-day cooling period:** If parent logs back in via the cancel link or normal login, a banner appears: "Your account is scheduled for deletion on [date]. Cancel deletion?" with a "Keep My Account" button.
7. **After 14 days:** Hard delete of all family data across all storage systems. PostgreSQL rows deleted. S3 evidence files deleted. Auth provider account deleted via Clerk API. Cached data expires naturally.

### 4.8 Subscription & Billing

**Plan card display:**
- Current plan name and badge ("Hearth Family")
- Feature summary ("Up to 6 learners · Full compliance tools · Unlimited activity logs · Portfolio exports")
- Monthly price

**Payment method:**
- Card type indicator (VISA, Mastercard, etc.)
- Masked card number (•••• •••• •••• 4242)
- Expiry date
- "Update" link — opens Stripe customer portal or equivalent payment management

**Billing history:**
- Last 3 invoices displayed inline (date, description, amount in green)
- Each row is a link to the full invoice PDF

**Actions:**
- "View Plans" button — opens plan comparison modal showing available tiers
- "Cancel subscription" text link — triggers cancellation flow (confirmation dialog, effective date, data retention notification)

**Billing is managed via Stripe.** Family Settings does not handle raw payment data. The "Update" payment link redirects to Stripe's hosted customer portal. Plan changes and cancellations are processed through Stripe's API with webhook-driven state updates back to Hearth's PostgreSQL `subscriptions` table.

---

## 5. Auto-Save Behaviour

### 5.1 Which fields auto-save

All fields auto-save except:
- Fields within the Learner edit form (these use explicit Save/Cancel)
- The co-facilitator invite fields (these use the explicit Invite button)
- Danger zone actions (these use explicit confirmation flows)

### 5.2 Trigger mechanism

| Field type | Save trigger | Debounce |
|-----------|-------------|----------|
| Text input | On blur (focus leaves the field) | None — saves on blur |
| Textarea | On blur | None |
| Select/dropdown | On change (immediate) | None |
| Toggle switch | On change (immediate) | None |
| Date picker | On change (immediate) | None |

**Why blur, not keystroke debounce for text fields:** Saving on every keystroke (even debounced) creates unnecessary network traffic and toast notification noise. Blur-based saving means the parent types their full value, moves to the next field, and save fires once. This is the standard pattern for settings forms.

### 5.3 Toast notification

- **Content:** Checkmark icon + "Changes saved"
- **Position:** Bottom-centre of viewport, fixed position
- **Duration:** 2.2 seconds, then fades out
- **Animation:** Slides up from below viewport (200ms), holds, then fades out (200ms)
- **Stacking:** Only one toast visible at a time. Rapid saves reset the timer rather than stacking multiple toasts
- **Accessibility:** `role="status"` with `aria-live="polite"` for screen readers

### 5.4 Error handling

If an auto-save request fails:
1. The toast shows an error variant: warning icon + "Couldn't save — retrying..." in amber
2. Automatic retry after 3 seconds
3. If retry fails: toast changes to "Changes couldn't be saved. Check your connection." in rose/red. The field reverts to its last saved value with a subtle flash animation to draw attention to the revert.
4. No undo capability for auto-saved fields — the save-on-blur pattern means the parent intentionally left the field. The value they entered is the intended value.

### 5.5 Offline handling

If the client detects no network connectivity:
- Fields remain editable (changes stored in local component state)
- No save attempts are made
- A persistent banner appears below the page header: "You're offline. Changes will save when you reconnect."
- On reconnect: all pending changes save in sequence. Toast: "Back online — changes saved."

---

## 6. Data Model

### 6.1 Primary tables affected

```
families
├── family_id (PK, UUID)
├── family_name (text, required)
├── primary_facilitator_name (text)
├── state_territory (enum: QLD, NSW, VIC, SA, WA, TAS, NT, ACT)
├── nearest_city (text)
├── heu_registration_number (text, nullable)
├── heu_registration_date (date, nullable)
├── family_bio (text, nullable, max 500 chars)
├── heu_reporting_enabled (boolean, default: true for QLD)
├── next_audit_date (date, nullable)
├── reporting_period (enum: calendar_year, school_year, custom)
├── reporting_period_start (date, nullable — used when period=custom)
├── reporting_period_end (date, nullable)
├── auto_generate_work_samples (boolean, default: true)
├── content_descriptor_tagging (boolean, default: true)
├── export_includes_photos (boolean, default: true)
├── notification_frequency (enum: minimal, balanced, proactive)
├── onboarding_completed_at (timestamp, nullable)
├── created_at (timestamp)
├── updated_at (timestamp)
├── deleted_at (timestamp, nullable — soft delete)
└── deletion_scheduled_at (timestamp, nullable — 14-day cooling)

learner_profiles
├── learner_id (PK, UUID)
├── family_id (FK → families)
├── first_name (text, required, max 40 chars)
├── date_of_birth (date, required)
├── year_level (enum: foundation, year_1...year_8, nullable)
├── learning_style (enum: visual, auditory, kinesthetic, reading_writing, mixed, nullable)
├── learning_notes (text, nullable, max 500 chars)
├── shape_type (enum: spiral, polygon, circles, wave, star_cluster, triangles, blob, arcs)
├── colour_palette (enum: blue_violet, sage_amber, rose_coral, teal_cyan, lavender_pink, gold_orange, mint_forest, peach_sunset)
├── display_order (integer — position in learner grid)
├── archived_at (timestamp, nullable — 90-day archival)
├── created_at (timestamp)
└── updated_at (timestamp)

notification_preferences
├── family_id (FK → families, PK)
├── logging_reminders (boolean, default: true)
├── coverage_gap_alerts (boolean, default: true)
├── badge_milestones (boolean, default: true)
├── weekly_summary_email (boolean, default: false)
├── compliance_deadline_reminders (boolean, default: true)
└── updated_at (timestamp)

family_members
├── member_id (PK, UUID)
├── family_id (FK → families)
├── user_id (FK → users, nullable — null while pending)
├── email (text, required)
├── display_name (text, required)
├── role (enum: primary, facilitator)
├── status (enum: active, pending, removed)
├── invited_at (timestamp)
├── accepted_at (timestamp, nullable)
├── removed_at (timestamp, nullable)
└── invite_expires_at (timestamp — 14 days from invited_at)
```

### 6.2 Derived data

The Family Intelligence Snapshot (in `family_intelligence_snapshots` table) is rebuilt whenever Family Settings data changes that would affect platform behaviour:
- Child added/removed/archived → snapshot rebuilds to include/exclude child
- Pedagogy profile changed → snapshot updates overlay parameters
- HEU toggle changed → snapshot updates compliance context flags

---

## 7. Integration Points

### 7.1 Inbound (data consumed by Family Settings)

| Source | Data | When |
|--------|------|------|
| Clerk Auth | User email, display name, auth state | On page load |
| Pedagogy Engine | `familyPedagogicalProfile` object | On return from Engine |
| Badge system | Badge count per learner | On section expand (query badge_awards) |
| Stripe | Subscription status, payment method, billing history | On Billing section expand |

### 7.2 Outbound (data produced by Family Settings)

| Consumer | Data | Trigger |
|----------|------|---------|
| Dashboard | Family name, child records, pedagogy profile | Any settings change |
| Logger | Child records (for "Who participated?" multi-select) | Child add/edit/remove |
| Portfolio | Child identity, shape, colour | Child add/edit |
| HEU Report | HEU registration, audit date, reporting period, compliance toggles | Compliance settings change |
| Constellation | Child records, archived state | Child add/remove/archive |
| Weekly Planner | Child records, pedagogy profile | Child/pedagogy change |
| Activity Discovery | Child age/year level (for age-appropriate filtering), pedagogy profile | Child edit, pedagogy change |
| Module Experience | Child records (for "Who's joining?" selection) | Child add/edit |
| Notification engine | All notification preferences, audit date | Notification settings change |
| Auth middleware | Co-facilitator access grants | Invite accept/remove |

### 7.3 Deep-link targets

Notifications and other screens can link directly to specific Settings sections using URL hash fragments:

| Link | Opens |
|------|-------|
| `/settings#family` | Family Profile section |
| `/settings#learners` | Our Learners section |
| `/settings#pedagogy` | Learning Approach section |
| `/settings#compliance` | Compliance & Reporting section |
| `/settings#notifications` | Notifications section |
| `/settings#access` | Family Access section |
| `/settings#account` | Account & Security section |
| `/settings#billing` | Subscription & Billing section |

On load with a hash fragment: the target section opens automatically and the page scrolls to it. Other sections remain closed. This enables notification → settings flows: e.g. a notification saying "Your audit date is approaching — review your compliance settings" links to `/settings#compliance`.

---

## 8. States & Edge Cases

### 8.1 New family (onboarding mode)

- Welcome header variant shown
- Progress indicator for required steps
- Family Profile opens by default
- "Go to Dashboard →" appears after minimum configuration met
- All optional sections show "Optional — set up later" badges

### 8.2 Single-child family

- Learner grid shows one card + "Add a learner" button
- No child context switching complexity
- All per-child screens default to the single child without selection UI

### 8.3 Maximum children (6)

- "Add a learner" button replaced by "Your plan supports up to 6 learners" note
- All 6 cards display in the grid (scrollable on mobile)

### 8.4 All children archived

- Learner grid shows only the "Archived Learners" subsection and the "Add a learner" button
- Platform-wide: Dashboard shows empty state, Our Story has no child to select
- This state should trigger a gentle notification: "All your learners have been archived. Add a new learner or restore an archived learner to continue."

### 8.5 Co-facilitator viewing Settings

- All sections visible but non-editable (read-only mode)
- Toggle switches appear disabled
- Text fields appear as styled read-only text (not disabled inputs — disabled inputs have poor contrast)
- A subtle banner below the page header: "Only the primary facilitator can change settings. Contact [Primary name] to request changes."
- Billing section hidden entirely for co-facilitators

### 8.6 Expired/cancelled subscription

- Billing section shows cancellation date and reactivation CTA
- Platform behaviour during grace period: full access continues for the remainder of the billing period
- After expiry: read-only access to existing data. Logging, module creation, and new badge awards are blocked. Export remains available.
- Settings remains fully accessible (parent needs to be able to reactivate or export data)

### 8.7 Account pending deletion (14-day cooling)

- Banner at top of Settings: "Your account is scheduled for deletion on [date]. Cancel deletion?"
- "Keep My Account" primary button in banner
- All settings remain editable during cooling period (cancelling deletion restores normal state)
- Billing section shows suspended state

### 8.8 Network connectivity loss

- Offline banner below header
- Fields remain interactive (changes buffered in state)
- Save attempts paused
- On reconnect: buffered changes save, toast confirms

---

## 9. Accessibility

### 9.1 Keyboard navigation

- Tab order follows visual order: sidebar nav → page header → sections top to bottom
- Each section header is focusable and activates on Enter/Space
- Within an open section: Tab moves through form fields in natural order
- Escape key closes the currently open section
- Arrow keys within a select/dropdown follow native browser behaviour

### 9.2 Screen reader support

- Section headers use `role="button"` with `aria-expanded="true/false"`
- Section bodies use `role="region"` with `aria-labelledby` pointing to the section title
- Status badges use `aria-label` (e.g. "Status: Configured")
- Toast notifications use `role="status"` with `aria-live="polite"`
- Toggle switches use proper `<label>` association and `aria-checked`
- Learner shape SVGs use `aria-label="[Child]'s identifier shape"` (decorative — the shape itself isn't meaningful content)

### 9.3 Reduced motion

The prototype includes `@media (prefers-reduced-motion: reduce)` which sets all animation and transition durations to near-zero. This affects accordion open/close, toast slide-in, card hover states, and section expansion animations.

---

## 10. Mobile Considerations

### 10.1 Layout changes at <900px

- Sidebar navigation hidden (parent uses bottom nav to reach Settings)
- Main content area fills full width with reduced padding (24px → 16px)
- Field rows (`grid-template-columns: 1fr 1fr`) collapse to single column (`1fr`)
- Philosophy dimension sliders collapse from 2×2 grid to single column
- Plan card stacks vertically (badge, info, price)
- Learner cards stack vertically (shape above details)
- Invite row fields stack vertically
- Learner actions (edit button) move to below the card content

### 10.2 Touch targets

- Section headers: full-width tap target, minimum 48px height (current: 72px+ — compliant)
- Toggle switches: 44×24px (current) — meets minimum 44px touch target on the horizontal axis. Tap target extends to the full toggle-row for easier activation.
- Form inputs: minimum 44px height (current: ~40px — needs 4px padding increase on mobile)
- Action buttons: minimum 44×44px
- Learner edit/remove icons: 34×34px in prototype — increase to 44×44px on mobile via media query

### 10.3 Keyboard considerations

- Date pickers should use native mobile date selectors (not custom date pickers)
- Text inputs should specify appropriate `inputmode` attributes (`email` for email fields, `text` for names)
- Textarea fields should have adequate minimum height to avoid the "typing into a slit" problem (minimum 80px, current compliant)

---

## 11. Open Questions

### 11.1 Shape/colour editing

The prototype does not include shape or colour selection in the learner edit form. Should this be added to the Settings edit form, or should it be handled elsewhere (dedicated shape picker in a future Learner Profile update)? The current auto-assignment works for MVP but limits personalisation.

**Recommendation:** Add a simple shape + colour picker to the learner edit form in a v2 update. Low priority for test launch.

### 11.2 Interstate compliance frameworks

The current prototype is QLD-focused. When expanding to other states, the Compliance section needs to adapt based on State/Territory selection. Each state has different home education regulatory requirements. This is a Phase 2 concern but the data model should anticipate it (the `state_territory` field on the family record is already in place).

### 11.3 Subscription tier effects on Settings

The prototype shows a single "Hearth Family" plan. When multiple tiers exist, certain Settings sections may be gated or limited by plan tier (e.g. number of co-facilitators, number of learners, advanced compliance features). The billing section will need to show upgrade prompts contextually.

### 11.4 APP 5 collection notice placement

The privacy model requires APP 5 collection notices at onboarding. The exact UI for these notices (modal? inline? interstitial?) needs design work. Family Settings onboarding mode is the logical placement — a collection notice modal before the first section opens, explaining what data Hearth collects and why.

### 11.5 Pedagogy Engine routing for co-facilitators

If a co-facilitator views the Learning Approach section, should the "Adjust in Pedagogy Engine" button be visible (since they can't edit settings)? Or should it be hidden/replaced with a read-only note? Current recommendation: show as a disabled button with tooltip "Only the primary facilitator can change the learning approach."

### 11.6 Year level auto-suggestion

Should the system suggest a year level based on the child's DOB and the current date? Australian year level cutoffs vary by state (QLD uses June 30). Auto-suggestion (not auto-assignment) could reduce friction during onboarding while respecting that homeschool families often work at non-standard levels.

**Recommendation:** Show a suggested year level as helper text below the Year Level field: "Based on [Child]'s age, most QLD children are in Year [X]." Don't pre-select — let the parent choose.

---

*This specification documents the complete functional surface of Family Settings as designed. Update when interactions change or when open questions are resolved.*
