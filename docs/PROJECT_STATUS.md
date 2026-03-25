# Hearth LMS — Project Status

> **Purpose:** Current state, priorities, and strategic context. Read this first before any new work.
> **Companion files:** `COMPONENT_REGISTRY.md` for screen-level detail. `Hearth_System_Interaction_Map.md` for cross-screen coherence (canonical navigation flows, data relationships, open design questions)
> **Last updated:** 24 March 2026

---

## Current Phase: Prototype Phase Complete. Transitioning to Next.js Deployment.

**Build progress:** 19 of 19 screens complete (100%) + Badge Assessment as 20th screen
**Documentation:** All screens have dedicated spec documents. Documentation sprint complete.
**Design system:** Conformance pass complete — all 22 screens revised to canonical tokens (2026-03-20).
**Module Builder pathways:** 4 of 5 pathway prototypes built (Process, Material, Inquiry, Retrospective Lift). Goal-Forward not yet built as standalone file.
**Founding Brief:** `hearth-founding-brief-v1.md` is the canonical purpose/mission/vision/values document. All product decisions measured against it.
**Content:** Starter Pack v3 (`hearth-starter-pack-plan-v3.md`) rebalanced to include structured academic content alongside experiential learning.
**Launch target:** 10-20 test families in Queensland, Australia

---

## Immediate Priorities (ordered)

1. **Transition to deployable Next.js app** — `hearth-claude-code-transition-plan-v1.md` defines the 7-phase build. This subsumes data persistence and inter-screen navigation as the deployment vehicle. Prompt execution plan ready: `hearth-prompt-execution-plan-v1.md`
2. **Core value loop integration** — Logger to Portfolio to HEU Report to Capabilities pipeline. This is what makes Hearth work. Build first within the Next.js skeleton.
3. **Family Settings as onboarding gate** — spec complete (`hearth-family-settings-spec-v1.md`). Entry point for test families configuring their account.
4. **Content production** — Jumpstart Classical pack (`hearth-jumpstart-classical-pack-plan-v2.md`) and Starter Pack (`hearth-starter-pack-plan-v3.md`). Families need content to use at launch. Can run parallel to dev work.
5. **Resolve remaining open design questions** — 5 still fully open from System Interaction Map (see below). Regression handling (#7) affects data integrity and should be resolved before launch.

---

## Design System Conformance — COMPLETE

**Completed:** 2026-03-20
**Scope:** All 22 Phase 1 prototype screens

### What Happened
A systematic audit and conformance pass was applied to every prototype screen to eliminate design drift that had accumulated during rapid HTML/JSX prototyping. Three new reference documents were created, and every screen was revised to conform to the canonical token set derived from the Dashboard Dark/Evening pair.

### Reference Documents Created
- `hearth-canonical-design-tokens-v1.md` — Full token spec (the source of truth)
- `hearth-ui-kit-v2.md` — Component reference replacing dead `Hearth_LMS_UI_Kit.html`
- `hearth-ui-token-deep-audit-v1.md` — Per-screen audit log documenting every fix

### Key Design Decisions Locked
1. **Variable naming:** `--surface-body/panel/raised/hover` (not `--bg-*`, `--deep-coffee`, `--coffee-*`)
2. **Border-subtle value:** `rgba(217,123,58,0.1)` — ember-tinted, not white-tinted (`rgba(255,255,255,0.06)`)
3. **Sage hex:** `#4ADE80` (not `#059669` or other greens)
4. **Section title weight:** 600 (700 reserved for brand wordmark and display greeting only)
5. **Section title font:** Serif (Crimson Text) — sans reserved for buttons, nav, labels, metadata
6. **Dual theme architecture:** Dark mode (default) + Gathering mode, sharing structural tokens, swapping color tokens via `data-theme` attribute
7. **Ember restriction:** Action contexts only (buttons, active states, progress indicators, badge celebrations) — never body text, decorative elements, or domain identity colors
8. **Radius scale:** 6px / 10px / 16px / 24px (not arbitrary values)
9. **Transition curve:** `cubic-bezier(0.4, 0, 0.2, 1)` at 200ms (quick) or 400ms (gentle)

### Conformance Status
22 / 22 screens confirmed conformant. No remaining drift issues.

### Impact on Next.js Build
- Token spec maps directly to Tailwind config (`tailwind.config.ts` extend section)
- JSX prototype token objects map to CSS custom properties in `globals.css`
- No design decisions remain ambiguous — every value is codified

---

## Next.js Deployment Preparation

| Checklist Item | Status |
|---|---|
| Design system audit | Complete (2026-03-20) |
| Canonical token spec | `hearth-canonical-design-tokens-v1.md` |
| Component reference | `hearth-ui-kit-v2.md` |
| All screens conformant | 22/22 |
| Transition plan | `hearth-claude-code-transition-plan-v1.md` |
| Prompt execution plan | `hearth-prompt-execution-plan-v1.md` |
| Database schema | `lms-database-schema.js` + `hearth-data-architecture-overview-v1.md` |
| Pack data architecture | `hearth-pack-data-architecture-v1.md` |
| Decisions audit | `hearth-decisions-log-v1.md` |
| Data persistence | Not started — Phase 2 of transition plan |
| Sanity CMS initialisation | Not started — Phase 0 of transition plan |

---

## Architecture Decisions (Made)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CMS | Sanity (headless) | Content management without building custom CMS. Omnichannel delivery |
| User data | PostgreSQL (Neon serverless) | Transactional user-specific data separate from portable content |
| Content model | Three-layer: portable content to Hearth journey structure to pedagogical overlay | Philosophy-neutral content with runtime interpretation |
| Module design | UbD backward design (Understanding to Evidence to Approaches to Activities) | Enforces pedagogical coherence. Linear, not open-ended |
| Module Builder pathways | Five-pathway system: Understanding-First, Material-Anchored, Process/Steps, Inquiry-Driven, Retrospective Lift | All paths converge on universal module schema. Stress-tested against 100 real scenarios |
| Primary interaction | Retrospective logging, not forward planning | Matches how families actually homeschool — spontaneous then document |
| Child representation | Abstract incomparable shapes, no photos by default | Avoids comparison anxiety and privacy issues |
| Assessment | Parent-controlled with structured confidence-building questions | Respects family autonomy while providing pedagogical guidance |
| Mobile vs desktop | Mobile for quick capture/logging, desktop for reflection/planning | Different experiences, not responsive scaling |
| Content worldview | Christian worldview in Layer 1 content; Layer 3 overlays address teaching method only | Platform built for Christian families without neutering content for non-Christian users |
| Framework | Next.js 14 (App Router) + TypeScript + Tailwind CSS | File-based routing maps to 19 screens, API routes eliminate separate backend |
| Auth | Clerk | Family account model, good free tier, excellent Next.js middleware |
| ORM | Drizzle | TypeScript-native, works with Neon serverless driver |
| AI | Anthropic Haiku (write-time only) | Expensive operations on save; screens read from pre-computed Family Intelligence Snapshots |
| Design system tokens | Canonical spec in `hearth-canonical-design-tokens-v1.md` | Eliminates design drift. Maps to Tailwind config and CSS custom properties |
| Design system theme | Dual-theme (Dark default + Gathering mode) via `data-theme` attribute | Structural tokens shared, color tokens swapped |

---

## Design System

**Theme:** Mont Blanc Dark Coffee
**Canonical tokens:** `hearth-canonical-design-tokens-v1.md`
**Component reference:** `hearth-ui-kit-v2.md`
**Reference implementation:** `hearth-dashboard-dark-v2.html`
**Approach:** Tailwind utility classes only. Mobile-first. No custom decorative assets — emoji placeholders until design phase.

---

## Core Principles (Enforce These)

- **5-minute rule** — every parent-facing interaction completable in under 5 minutes
- **Retrospective-first** — log what happened, not what you plan to do
- **Philosophy-neutral content** — pedagogy is a runtime lens, never baked into content
- **Never stuck** — learners move laterally, not blocked at checkpoints
- **Curriculum mapping is backend** — UI shows capability threads and plain-language descriptors only
- **Parent empowerment** — build confidence and teach frameworks, don't create dependency
- **First-person gentle friend tone** — warm, never clinical or institutional

---

## Development Workflow

| Concern | Tool | Notes |
|---------|------|-------|
| Architecture, design, specs, review | Claude Projects (this project) | Superior project knowledge continuity |
| File creation, code writing, registry updates | Claude Code | Separate from design work. Transition plan: `hearth-claude-code-transition-plan-v1.md` |
| Content management | Sanity CMS | Not yet configured — Phase 0 of transition plan |
| User data | PostgreSQL (Neon) | Schema defined in `lms-database-schema.js` and `hearth-data-architecture-overview-v1.md` |
| Content scaling (Phase 2) | MiniMax Agent (`agent.minimax.io`) | For generating Sanity-ready JSON module packages at volume after first 5 packs hand-crafted |

---

## Navigation Architecture

Hearth's primary navigation groups (confirmed in System Interaction Map):

| Group | Screens |
|-------|---------|
| **Dashboard** | Dashboard (Dark + Evening variants), Onboarding |
| **Our Story** | Portfolio/Learning Journey, HEU Report, Capabilities Constellation, Learner Profile |
| **Log** | Retrospective Logger |
| **Explore / Build** | Activity Discovery, Weekly Planner, Module Experience, Module Builder, Badge Creator, Badge Assessment, Project Experience, Marketplace, Pedagogy Engine |
| **Settings** | Family Settings |
| **Notifications** | Notification Center |

**Our Story is RETAINED** as a distinct top-level nav group — not collapsed into Dashboard. It is the learner narrative layer: the four screens together present who a child is, how they're growing, what they've evidenced, and whether they're on track for compliance.

---

## Shelved (Out of MVP Scope)

These items are documented here to prevent re-proposal during Phase 1 work.

| Item | Reason | Revisit |
|------|--------|---------|
| **Facilitator Pedagogical Dashboard** | No distinct facilitator role in MVP. All users are family facilitators using the standard Dashboard. | Phase 2+ when community hubs and external facilitator roles exist |
| **Learner-facing views** | Phase 1 is parent-operated. Direct learner UI not validated yet. Scoping brief exists: `hearth-student-module-experience-scoping-brief.md` | Phase 2 when learner autonomy is a tested need |
| **Community features** | Co-ops, group modules, educator forums — out of scope for solo family validation. | Phase 2 community build |

---

## Phase Summary

| Phase | Milestone | Families | Status |
|-------|-----------|----------|--------|
| **1 — MVP** | Core screens built, documentation complete, design system conformant, test family launch | 10-20 | Prototype phase complete. Next.js deployment next. |
| **2 — Community** | User feedback incorporated, community features | 50-100 | Planned |
| **3 — Scale** | Infrastructure hardening, performance | 500+ | Planned |
| **4 — Seed** | Funding readiness, growth metrics | 500+ | Planned |

---

## Known Gaps

### Structural / Technical
- **No data persistence** — all screens are static prototypes. Highest priority blocker. Addressed by transition plan Phase 2 (Database) and Phase 3 (Core Value Loop).
- **No inter-screen navigation** — screens don't link to each other in a running app. Addressed by transition plan Phase 1 (Skeleton App).
- **Superseded project files** — 35 files flagged in `COMPONENT_REGISTRY.md` for removal: 22 pre-conformance prototypes, legacy UI kit, v1 prototypes replaced by v2/v3, CMS mapping docs superseded by HCMS strategy, deprecated user flow doc, pathway architecture v1, understanding-v1 prototype, starter pack v2.

### Cross-Screen Coherence (Open Design Questions)
> **Source:** `Hearth_System_Interaction_Map.md` Part 6 — 16 open questions. Status updated based on documentation sprint.

| # | Question | Impact | Status | Resolution |
|---|----------|--------|--------|------------|
| 1 | **Badge secondary logging interface** | High | RESOLVED | `hearth-badge-assessment-v2.html` + `hearth-badge-assessment-spec.md` |
| 2 | **Badge award moment** | High | RESOLVED | Badge assessment spec Screen 4a — secondhand delight design, physical badge ordering |
| 3 | **Dashboard vs Our Story content spec** | High | RESOLVED | `Hearth_Dashboard_Our_Story_Content_Spec.md` |
| 4 | **AI/Intelligence layer architecture** | High | RESOLVED | `Hearth_AI_Intelligence_Layer_Architecture.md` |
| 5 | **Notification system detailed design** | High | RESOLVED | `hearth-notification-centre-v2.html` + `hearth-notification-system-spec.md` |
| 6 | **HEU six-work-sample curation flow** | High | RESOLVED | `hearth-heu-work-sample-curation-spec-v1.md` |
| 7 | **Regression handling** — can parents un-confirm a DLO? | Medium | OPEN | Not addressed in any spec. Affects data integrity — resolve before launch |
| 8 | **Historical data import / batch retrospective logging** | Medium | PARTIAL | Logger spec mentions 30-day backdating with Custom date option. Bulk import for onboarding not designed |
| 9 | **Constellation to logged moments drill-down** | Medium | RESOLVED | Constellation spec defines Level 4 Moment Detail — full evidence trail from DLO to observations |
| 10 | **Repeat module logging evolution** | Medium | OPEN | No spec addresses how prompts shift on 2nd/3rd attempt |
| 11 | **Voice input integration** | Medium | PARTIAL | Logger spec Section 2.7 defines Web Speech API for Logger. Other screens not addressed |
| 12 | **Empty / first-use states per screen** | Medium | PARTIAL | Logger spec Section 10, Family Settings spec onboarding mode. Other screens not addressed |
| 13 | **Gentle migration from retro logging to modules** | Low | OPEN | Not addressed |
| 14 | **Data deletion and privacy model** | Medium | RESOLVED | `hearth-data-deletion-privacy-model-v1.md` |
| 15 | **Learner-facing views** | Low | SCOPED | `hearth-student-module-experience-scoping-brief.md` — design deferred to Phase 2 |
| 16 | **Offline / poor connectivity** | Low | OPEN | Not addressed |

**Summary: 8 resolved, 3 partially addressed, 5 open.**

### Documentation Coverage

All 19 MVP screens now have at least one dedicated spec document. The documentation sprint surfaced new open questions within each spec. These replace the previous gap of unspecified screens as the current design gap inventory.

**Open questions by screen (compiled from spec Open Questions sections):**

**Retrospective Logger** (8 questions in `hearth-logger-spec-v1.md` Section 14):
- Title field: auto-generate from description or explicit input?
- "Earlier" date picker range (30 days recommended)
- Draft persistence: localStorage vs PostgreSQL
- Photo storage sizing and cloud infrastructure
- Observation chip extensibility (fixed for MVP, custom Phase 2)
- Insight card dismissed state: store as rejected or delete?
- Multi-session logging scope
- Accessibility audit needed (ARIA labels, keyboard nav, focus trapping)

**Weekly Planner** (5 questions in `hearth-weekly-planner-spec-v1.md` Section 17):
- Family energy pattern override vs learned patterns
- Ad-hoc free-text planner entries not linked to modules
- Term/holiday awareness display
- Print view (Phase 2)
- Recommendation algorithm cold start strategy

**Family Settings** (6 questions in `hearth-family-settings-spec-v1.md` Section 11):
- Shape/colour editing for learner profiles
- Interstate compliance framework adaptation
- Subscription tier effects on Settings
- APP 5 collection notice UI placement
- Pedagogy Engine button visibility for co-facilitators
- Year level auto-suggestion based on DOB

**Marketplace** (8 questions in `hearth-marketplace-spec-v1.md` Section 17):
- Standalone module detail view
- My Library link destination
- Content removal from library mechanism
- Catalogue loading strategy (all for MVP, paginate at 50+)
- Currency and regional pricing (AUD, Stripe Price IDs)
- Creator profile expansion (post-MVP)
- Content preview/sampling before acquisition
- Pack bundles and seasonal promotions (post-MVP)

**Pedagogy Engine** (7 questions in `hearth-pedagogy-engine-spec-v1.md` Section 10):
- "I don't know" helper text for uncertain parents
- Multi-facilitator guidance note
- Post-skip re-engagement timing (3 entries recommended)
- Reggio Emilia: keep as 7th option? (recommend yes)
- Synthesis text quality: template vs Haiku generation
- Demo activity localisation for international expansion
- Observed patterns bootstrap minimum entries

**HEU Work Sample Curation** (5 questions in `hearth-heu-work-sample-curation-spec-v1.md` Section 12):
- Multiple children: one child at a time with selector?
- AI annotation ethics safeguards
- Evidence format requirements
- Offline annotation editing
- Progression summary in export default inclusion

**Portfolio / Learning Journey** (5 questions in `hearth-portfolio-spec-v1.md` Section 14):
- Month picker scope: all months or only active months?
- Journey card frequency tuning
- PDF export vs shareable link with expiry (post-MVP)
- Voice/read-aloud mode for secondhand delight
- Cross-child journey card observations

**Capabilities Constellation** (7 questions in `hearth-constellation-spec-v1.md` Section 11):
- Entry animation: lighting up or immediate render?
- Custom capability threads placement (Phase 2)
- Cross-domain navigation at Level 2
- Thread comparison across children (firm no)
- Historical timeline toggle at Level 2
- Performance at scale with thousands of observations
- Opening Up section placement in 4-level zoom

**Total: 51 open questions across 8 specs.** Most have recommended resolutions within the spec. Priority items for pre-launch resolution: Logger draft persistence, photo infrastructure, Family Settings APP 5 notice, Marketplace currency/pricing.

---

## Market Context

- **Target:** Australian homeschool families, specifically Queensland HEU compliance
- **Differentiator:** Retrospective logging + pedagogy-neutral content + automated compliance documentation
- **Competitors:** Generic LMS platforms not designed for homeschool; manual compliance tracking via spreadsheets/folders
- **Regulatory:** Queensland Home Education Unit requires documented learning plans, work samples, and curriculum coverage evidence

---

*Updated 24 March 2026. Update this file when priorities shift or major decisions are made.*
