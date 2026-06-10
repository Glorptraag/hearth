# Hearth LMS — Component Registry

> **Purpose:** Single source of truth for every UI screen, its canonical file, status, and role.
> **Rule:** Before proposing new work, check this file. Before creating a new screen, update this file.
> **Cross-screen coherence:** `Hearth_System_Interaction_Map.md` is the canonical document for navigation flows, data relationships, and inter-screen dependencies.
> **Last verified:** 10 June 2026 (light pass — see footer; deep per-screen re-verification pending the v3 reference build)

---

## Design System

### Design System v2 — Applied to codebase (landed 2026-04-30 / 2026-05-01)
| Document | Purpose | Status |
|---|---|---|
| `hearth-canonical-design-tokens-v2.md` | **Source of truth.** Supersedes v1. Typography swap (Crimson Text→Fraunces, Inter→DM Sans), desaturated status palette, cream-tinted default borders, warmed body surface, ember reserved for action, motion tokens added | Active — **applied in `src/app/globals.css`** |
| `hearth-motion-system-v1.md` | First canonical motion language — five durations, four easings, application rules per pattern, special cases (engagement emoji, badge earned, constellation, dashboard ambient), don't-animate list | Active — **applied in `src/app/hearth-motion-utilities.css`** |
| `hearth-design-system-v2-decisions-addendum.md` | Decisions S7–S13 covering typography, icon library, status palette, motion, borders, body warmth, shadow application. To be merged into `hearth-decisions-log-v1.md` | Active |
| `hearth-v2-claude-code-prompts.md` | Claude Code rollout prompts — Prompt A (setup + motion utilities CSS) and Prompt B (Dashboard Dark v3 reference build) | Active (process doc) |
| `hearth-design-system-v2.1-addendum.md` | **v2.1 addendum** — canonicalises gathering (light/daytime) as second theme. Adds `[data-theme]` scoping pattern, gathering-mode values for every theme-dependent v2 token, three new tokens (`--surface-input`, `--backdrop-modal`, `--backdrop-success`), theme-aware motion adjustments for `hearth-thinking-pulse` / `hearth-skeleton` / `hearth-glow-pulse`, per-child JS lookup. Adds **S14** to decisions log. Does NOT supersede v2 — additive | Active — **applied in `src/app/globals.css` + motion utilities** |

**Implementation files (live in `src/app/`):**
- `src/app/globals.css` — v2 dark + v2.1 gathering tokens, all status/surface/border/shadow/motion tokens. Imports the motion utilities CSS.
- `src/app/hearth-motion-utilities.css` — 13 `.hearth-*` motion utility classes consuming `--motion-*` and `--ease-*` tokens. `hearth-thinking-pulse` / `hearth-skeleton` / `hearth-glow-pulse` are theme-aware.
- `src/app/layout.tsx` — Fraunces (with SOFT + opsz axes) + DM Sans loaded via `next/font/google`.
- `src/app/clerk-theme.ts` — palette objects updated to v2 hex for both themes.

**Implementation deviations from spec:**
- **Theme default convention:** v2.1 says gathering is default; this implementation keeps **dark as default** (`data-theme=""` or absent → dark; `data-theme="gathering"` → light) for production stability. Auto time-of-day switching covers the addendum's daytime intent. Documented in `CLAUDE.md`.
- **Icon library:** S8 specifies Lucide; the implementation uses **Phosphor Icons** (`@phosphor-icons/react`) per S14. **Adopted across all UI surfaces 2026-05-01** (commit `64cd9df`). Same single-color stroke aesthetic and 24px grid.
- **`--text-muted` value:** v2 spec is `#6B5D52`; implementation keeps WCAG-override `#877565` (~4.1:1 on panel, raised from `#726458`/3.15:1 in commit `4dfdd5b`) per `hearth-canonical-design-tokens-v1.md` Appendix A. Clears AA for large/bold text only; still short of the 4.5:1 normal-text AA threshold.

**Pending v2 / v2.1 deliverables (not yet produced):**
- `hearth-dashboard-dark-v3.html` — dark-mode reference HTML prototype (Prompt B output)
- `hearth-dashboard-gathering-v1.html` — daytime/light reference HTML prototype, structural twin of dark v3, replaces `hearth-dashboard-evening-v2.html`
- In-place markdown updates to `hearth-canonical-design-tokens-v2.md` (gathering blocks under each theme-dependent section + new tokens) — no version bump per addendum migration order
- `hearth-ui-kit-v2.md` → revised to v3 once Dashboard Dark v3 is locked
- Per-screen visual review across the 22 prototypes / built screens to catch any leftover drift

### Reference Documents (v1 — superseded by v2 above; retained until v3 reference build lands)
| Document | Purpose | Status |
|---|---|---|
| `hearth-canonical-design-tokens-v1.md` | Full token spec (colors, spacing, radius, shadows, transitions, typography) | **Superseded by v2** — retained per versioning rules |
| `hearth-ui-kit-v2.md` | Canonical component reference (buttons, cards, inputs, modals, nav) — replaces dead `Hearth_LMS_UI_Kit.html` | Active (will be revised to v3 after Dashboard Dark v3 lands) |
| `hearth-ui-token-deep-audit-v1.md` | Per-screen drift audit documenting every fix applied | Active (reference) |
| `hearth-icon-system-v1.md` | Phosphor icon rules: weight, size tokens, colour, placement, custom-mark specs, Lucide→Phosphor migration map | Active (April 2026) |
| `hearth-decisions-log-v1.md` | Append-only decision record (S14: icon library) | Active (April 2026) |

### Production Code
| Path | Purpose |
|---|---|
| `src/components/icons/index.tsx` | Central Phosphor re-export surface (~140 icons + IconProvider). App code imports from here, never from `@phosphor-icons/react` directly. Holds placeholder slots for illustrator-bespoke marks (`ChildShape*`, `HearthBrandMark`). Mounted in root `layout.tsx`; defaults every icon to `size 18` / `regular` weight. |
| `src/lib/icon-registry.ts` | Legacy emoji registry (`<HearthIcon>`). Coexists with Phosphor system; components migrate as touched. |
| `src/components/nav/` | **Mobile bottom nav** (built 2026-05-06). 5-tab parent-facing bar (Home / Story / Log / Plan / Explore). Plan + Explore are trayed tabs that anchor a vertical column of destinations above the bar. Single source of truth: `navConfig.ts`. Components: `MobileBottomNav.tsx`, `NavTab.tsx`, `TrayedTab.tsx`, `NavTray.tsx`, `TrayRow.tsx`, `LogButton.tsx`. Replaces the inline 5-tab bar previously in `(auth)/layout.tsx`. |
| `src/lib/content-studio/` | **Editorial workbench** (built 2026-05-08, commit `2493d5e`). Optional `workbench` on activities + `workbenches` on packs per `workbench-claude-code-addendum`. Soft-flag helpers (`workbenchIdResolutionFlags`, `workbenchContentFlags`) surface non-blocking validation in `/api/admin/content/publish` response. Files: `types.ts`, `factories.ts`, `validation.ts` (Zod), `sanity-transform.ts`, `reducer.ts`, `workbench.test.ts` (15 cases). `/api/modules/publish` (parent path) is unchanged. |

### Content runtime + authoring

**All published learning content (modules, approaches, activities, packs, projects, badges, capability threads, pedagogy knowledge base) lives in Sanity** and is read at runtime via `src/lib/sanity/{client,queries}.ts`. Sanity Studio is mounted at `/studio`. Postgres holds only user/transactional data.

| Authoring path | Location | Entry / API |
|---|---|---|
| **In-app editorial — family** | `src/app/(auth)/build/modules` (Module Builder UI) | `POST /api/modules/publish` — sets `authorFamilyId` |
| **In-app editorial — admin** | `src/app/(admin)/admin/content` + `src/lib/content-studio/` | `POST /api/admin/content/publish` — accepts `workbench` shape, returns soft `workbenchFlags` |
| **External authoring** | kindling repo — **separate git repo**, not part of this codebase (sibling checkout on Drew's machine) | kindling's `library/build-mode/orchestrator.ts` CLI → direct Sanity mutations with deterministic IDs + `register/modules.jsonl` event trail. Used by Drew / Cowork to build official content packs from spec docs. Dropped 1 May 2026 (commits `306e4fc`, `f8ee5c7`, `f9e6e5c`). Bypasses `/api/modules/publish` because that endpoint violates the editorial rule (auto-stamps `authorFamilyId`). |

### Reference Implementation
`hearth-dashboard-dark-v2.html` — current source of truth for all visual patterns. **Will be superseded by `hearth-dashboard-dark-v3.html` once v2 token system is applied (per Prompt B in `hearth-v2-claude-code-prompts.md`).** Until v3 lands, v2 remains canonical.

### Conformance Status
**22 / 22 parent-facing screens confirmed conformant** as of 2026-03-20. Admin panel (8 screens) added post-conformance — uses admin-density spacing tokens, not fully audited.

All prototype screens use canonical token names (`--surface-body/panel/raised/hover`, `--ember`, `--sage`, `--border-subtle` as `rgba(217,123,58,0.1)`), canonical radius scale (6/10/16/24px), canonical transitions (`cubic-bezier(0.4,0,0.2,1)`), and correct font-weight rules (700 display/brand only, 600 section titles).

---

## Core Screens

### Built — Phase 1 MVP

All 19 screens confirmed built as of March 2026. Phase 1 MVP complete. Design system conformance pass complete 2026-03-20 — all screens revised to v2/v3/v4. Organised below by navigation group.

#### Nav Group: Dashboard

| # | Screen | Canonical File | Spec | Role | Key Interactions |
|---|--------|---------------|------|------|-----------------|
| 1 | **Onboarding Demo** | `hearth-complete-demo-v2.html` | — | First-run experience with 5 branching paths: Log, Plan, Progress, Explore, Account Creation | Smart triage, path selection, account creation |
| 2 | **Dashboard (Dark)** | `hearth-dashboard-dark-v2.html` | `hearth_dashboard_design_decisions.md`, `Hearth_Dashboard_Our_Story_Content_Spec.md` | Primary family hub — Mont Blanc dark coffee theme. **Design system reference implementation.** | Nav to all branches: Our Story, Explore, Log, Settings, Build |
| 3 | **Dashboard (Evening)** | `hearth-dashboard-evening-v2.html` | (shares Dashboard spec) | Adaptive time-of-day variant of dashboard. **Pending supersession by `hearth-dashboard-gathering-v1.html`** per v2.1 addendum — current file uses pre-v2 tokens (Crimson Text/Inter, ember-tinted defaults) and will be replaced by the structural twin of Dashboard Dark v3 with `[data-theme]` scoping | Same nav structure, warmer palette |

**Additional Dashboard prototypes:** `hearth-dashboard-mobile-v2.html` (Option C glanceable mobile layout)

#### Nav Group: Our Story
> **RETAINED** as a distinct top-level navigation group — not collapsed into Dashboard. Presents the learner's unfolding educational narrative across four complementary lenses.

| # | Screen | Canonical File | Spec | Role | Key Interactions |
|---|--------|---------------|------|------|-----------------|
| 5 | **Portfolio / Learning Journey** | `hearth-portfolio-learning-journey-v2.html` | `hearth-portfolio-spec-v1.md` | Evidence gallery showing learning evolution over time | Thread-first default view with Evidence, Journey, and Milestone card types. Per-child filtered view with scaffolded progression display |
| 6 | **HEU Compliance Report** | `hearth-report-screen-v2.html` | `hearth-report-interaction-spec.md`, `hearth-heu-work-sample-curation-spec-v1.md` (addendum) | Queensland HEU compliance documentation | Curriculum coverage %, work sample annotations, posture badge, export. Six-work-sample curation flow in addendum |
| 7 | **Capabilities Constellation** | `hearth-capabilities-v4.html` (design prototype), `hearth-constellation-map-v2.jsx` (React DAG implementation) | `src/app/(auth)/our-story/capabilities/_constellation/` (live implementation; historical spec: `docs/archive/hearth-constellation-spec-v1.md`) | Visual map of capability threads and growth patterns — 4-level zoom model | Level 1: domain overview. Level 2: thread view with DAG edges. Level 3: badge/DLO view. Level 4: moment detail with evidence trail. Per-child selector. |
| 8 | **Learner Profile** | `hearth-learner-profile-v2.html` | `hearth-learner-profile-spec.md` | Individual child identity portrait — who they are as a learner | Character, working style, interests. NOT progress tracking (that is Capabilities) |

**Additional Our Story prototypes:** `hearth-our-story-hub-v2.html` (Our Story landing/hub page — "Emma's Story"). Spec: `Hearth_Dashboard_Our_Story_Content_Spec.md`

#### Nav Group: Log

| # | Screen | Canonical File | Spec | Role | Key Interactions |
|---|--------|---------------|------|------|-----------------|
| 9 | **Retrospective Logger v3** | `hearth-logger-workspace-v3.html` | `hearth-logger-spec-v1.md` | Core interaction — capture spontaneous learning after it happens | Two-column workspace: tap-driven form (left) + live AI insights (right). Completeness gate at 50%. Per-child differentiation with color-coded engagement emojis + per-child discovery fields keyed by learner_id. Voice input via Web Speech API (en-AU). **Post-save second screen:** `PostSaveSurface` (`src/components/logger/PostSaveSurface.tsx`) — inline morph, three density branches (thin / substantive-pending / substantive-enriched / failed). Source: `hearth-logger-post-save-resolution-v1.md` §2 Item 2; decisions D-LPS-1..7. **Implementation (refactored 2026-06):** `src/app/(auth)/log/page.tsx` is a thin composition root — state in `src/hooks/use-logger-*`, save/derivation logic in `src/lib/logger/{entry-payload,badge-check,enrichment-poll,draft,completeness}.ts` (unit-tested), and the six form sections in `src/app/(auth)/log/_components/{Who,What,Engagement,WhenWhere,Observe,Evidence}Section.tsx` (+ `loggerConstants.ts`, `childColors.ts`). See CLAUDE.md → "Logger screen architecture". |

#### Nav Group: Explore / Build

| # | Screen | Canonical File | Spec | Role | Key Interactions |
|---|--------|---------------|------|------|-----------------|
| 10 | **Weekly Planner v4** | `hearth-weekly-planner-v4.html` | `hearth-weekly-planner-spec-v1.md` | 7-day calendar for scheduling activities | Day selection, activity library, subject balance stats, energy-matched time slots, module completion toggle routing to Logger |
| 11 | **Module Experience v3** | `hearth-module-experience-v3.html` | `Hearth_Module_Experience_UX_Flows.md` | Shell for running any content module | Prep, Chunks (step-by-step), Log (participation/engagement/discoveries/media) |
| 12 | **Module Builder** | `hearth-module-builder-v3.jsx` | `Hearth_Module_Builder_Design_Specification.md`, `hearth-module-builder-pathways-architecture-v2.md` | Content creation tool — UbD backward design enforced | Linear 5-stage flow: Topic, Understanding, Evidence, Approaches, Review. Five-pathway system in v2 architecture |
| 13 | **Badge Creator** | `badge-creation-component-v2.tsx` | — | Badge design + curriculum descriptor linking | Name/icon, capability description, curriculum link, save |
| 14 | **Badge Assessment** | `hearth-badge-assessment-v2.html` | `hearth-badge-assessment-spec.md` | Secondary assessment interface — triggered post-log when badge threshold is crossed | 3-5 confidence-building questions, award or defer, secondhand delight moment, physical badge ordering |
| 15 | **Pedagogy Engine** | `hearth-pedagogy-engine-v2.jsx` | `hearth-pedagogy-engine-spec-v1.md` | Mobile-first philosophy selection and emphasis adjustment. **React implementation:** integrated into Family Settings (`/settings`), not a standalone route. Vocabulary adapter at `src/lib/pedagogy/adapter.ts` drives UI terminology across overlay-active screens via `usePedagogy()` hook | Onboarding wizard (6 philosophies + Eclectic) then values/practices selection. Settings view for post-onboarding adjustments. Produces familyPedagogicalProfile consumed by all overlay-active screens |
| 16 | **Activity Discovery v3** | `hearth-activity-discovery-v3.html` | `hearth-activity-discovery-docs.md` | Module browser for family's content library | Filter by subject/age/duration, preview modal, start now or save for later. Under 2 min to decision |
| 17 | **Marketplace v2** | `hearth-marketplace-v2.html` | `hearth-marketplace-spec-v1.md` | Content discovery and acquisition — primary content use case | Browse/filter/sort, pack detail modal with module list, included vs premium pricing, Stripe checkout for premium, Family Fit AI banner |
| 18 | **Project Experience v3** | `hearth-project-experience-v3.html` | `hearth-project-design-specification.md` | Multi-stage scaffolded learning — sits above Packs in content hierarchy | Sequential stages with artifact dependencies, 3-6 week pacing, cross-domain |

**Module Builder pathway prototypes** (all built 2026-03-21, spec: `hearth-module-builder-pathways-architecture-v2.md`, design brief: `hearth-module-builder-pathways-design-brief-v1.md`):

| Pathway | File | Entry Pattern |
|---------|------|--------------|
| Process / Steps | `hearth-module-builder-process-v1.html` | Activity name + description + product toggle. Deferred AI inference on scroll/save. No loading screen |
| Material-Anchored | `hearth-module-builder-material-v1.html` | Resource type chips, name, description, "what drew you", usage intent multi-select (max 3). Session template steps pre-populated |
| Inquiry-Driven | `hearth-module-builder-inquiry-v1.html` | Question text, child selector, prior knowledge, investigation approach cards (dynamic, max 2). Steps from investigation type template |
| Retrospective Lift | `hearth-module-builder-retrospective-v1.html` | 3-stage wizard: pattern selection, evidence review with deselect, synthesis preview. Editor fully pre-populated |
| Goal-Forward | Not yet built as standalone file | Aspiration mode (freeform goal) + capability mode (thread-matched, skeleton library). Merges former Understanding-First and Capability-Targeted paths |

#### Nav Group: Settings

| # | Screen | Canonical File | Spec | Role | Key Interactions |
|---|--------|---------------|------|------|-----------------|
| 19 | **Family Settings** | `hearth-family-settings-v2.html` | `hearth-family-settings-spec-v1.md` | Account admin, learner management, compliance setup, pedagogy prefs | Six accordion sections: Family Members, Learning Approach, Compliance, Notifications, Account, Data/Privacy. Onboarding mode as first-run gate. Co-facilitator invite flow |

#### Nav Group: Notifications

| # | Screen | Canonical File | Spec | Role | Key Interactions |
|---|--------|---------------|------|------|-----------------|
| 20 | **Notification Center** | `hearth-notification-centre-v2.html` | `hearth-notification-system-spec.md` | Compliance reminders, logging nudges, weekly digests, streak prompts, capability growth moments | Filter tabs, gentle "I noticed" language, swipe-to-dismiss |

#### Nav Group: Community (Hearths) — Built 3 April 2026

| # | Screen | Canonical File | Spec | Role | Key Interactions |
|---|--------|---------------|------|------|-----------------|
| 21 | **Hearth Home** | `src/components/hearth/HearthHomeClient.tsx` | `hearth-community-architecture-v1.md`, `hearth-community-handoff-v1.md` | Multi-family group hub with 4 tabs: Our Story, Sessions, Members, Settings | AI-generated term narrative, session timeline with reflections, shared gallery, session CRUD, member grid, invite flow, consent management |
| 22 | **Session Detail** | `src/app/(auth)/hearths/[hearthId]/sessions/[sessionId]/page.tsx` | (shares community spec) | Session shared record with evidence grid and privacy-filtered observations | Scaffold action ("Log this session"), observation review, evidence display |
| 23 | **Join / Invite** | `src/app/(auth)/hearths/join/[code]/page.tsx` + `JoinClient.tsx` | (shares community spec) | Invite acceptance with consent toggles | Code validation, consent checkboxes (cross-family observations, evidence sharing), Clerk auth redirect for unauthenticated users |

**Community components:** `HearthDashboardCard.tsx`, `ObservationCard.tsx`, `CreateSessionModal.tsx`, `InviteModal.tsx`, `ReflectionModal.tsx`

**Integration points:**
- Sidebar: dynamic "Community" section with per-hearth nav items and scaffold count badges
- Dashboard: "My Hearths" section with HearthDashboardCard (next session + pending scaffolds)
- Logger: scaffold mode via `?scaffold=sessionId` (pre-fills form, evidence toggles, reflection modal)
- Notifications: 5 new trigger types (hearth_invite, session_created/completed, observation_received, scaffold_expiring)
- Entry provenance: "From community" pills on entries with `source: 'hearth_session'`

#### Nav Group: Admin Panel — Built April 2026

| # | Screen | Canonical File | Role | Key Features |
|---|--------|---------------|------|--------------|
| 24 | **Admin Dashboard** | `src/app/(admin)/admin/page.tsx` | Ops summary, quick links to all admin tools | System health, family count, active invitations |
| 25 | **Analytics** | `src/app/(admin)/admin/analytics/page.tsx` | Thread coverage, abandonment, activity heat, pack adoption | 4 analytics panels |
| 26 | **Content Management** | `src/app/(admin)/admin/content/page.tsx` | Content studio draft CRUD, publish to Sanity | Draft list, create/edit/delete, publish workflow |
| 27 | **Content QA** | `src/app/(admin)/admin/content/qa/page.tsx` | Pack quality assurance | Pack-level QA checks, issue list, recheck |
| 28 | **Families** | `src/app/(admin)/admin/families/page.tsx` | Family search, view, snapshot management | Search, admin view, per-family snapshot rebuild |
| 29 | **Invitations** | `src/app/(admin)/admin/invitations/page.tsx` | Beta invitation code management | Create, revoke, expire, status tracking |
| 30 | **Snapshots** | `src/app/(admin)/admin/snapshots/page.tsx` | Snapshot health monitoring | Stale detection, health check, bulk rebuild |
| 31 | **Audit Log** | `src/app/(admin)/admin/audit-log/page.tsx` | Admin action audit trail | Filterable log of all admin actions |

**Note:** Admin screens use `requireAdmin()` guard. Design system conformance not yet audited — admin section uses functional UI with admin-density spacing tokens.

### Shelved — MVP Scope Reduction

These screens were designed or planned but removed from MVP scope. Preserved here for Phase 2+ reference.

| Screen | Reason | Revisit When |
|--------|--------|--------------|
| **Facilitator Pedagogical Dashboard** | No distinct facilitator role in MVP — all users are family facilitators using the standard Dashboard. Over-engineered for current scope. | Community hubs built (Phase 2+), when external facilitators / co-ops are a real user type |
| **Learner-facing views** | Learner-facing interface is out of scope for Phase 1. Parents facilitate and log on behalf of children. Scoping brief exists: `hearth-student-module-experience-scoping-brief.md` | Phase 2 when direct learner engagement is validated |
| **Facilitator capture UI** | API routes exist for observations, session completion, attendance. UI for quick-capture during sessions deferred | Phase 2 — when coordinator workflow validated with test families |
| **Planner hearth sessions** | Hearth sessions as distinct card type in weekly planner | Phase 2 — API ready, UI integration deferred |

---

## Example Content Modules

These are content instances using the Module Experience shell — not unique screens.

| Module | File | Purpose |
|--------|------|---------|
| Bread Module v2 | `hearth-bread-module-v2.html` | Hands-on baking — demonstrates multi-subject module |
| Bridge Builder Challenge | `hearth-bridge-builder-challenge.html` | Engineering/physics challenge module |
| Nature Journal | `hearth-nature-journal-module.html` | Observation-based outdoor module |

---

## Design System and Reference

| File | Role | Status |
|------|------|--------|
| `hearth-canonical-design-tokens-v1.md` | **Canonical** token spec — colors, spacing, radius, shadows, transitions, typography | Active |
| `hearth-ui-kit-v2.md` | **Canonical** component reference — buttons, cards, inputs, modals, nav | Active |
| `hearth-ui-token-deep-audit-v1.md` | Per-screen drift audit — documents every fix applied in conformance pass | Active (reference) |
| `hearth-design-consistency-audit-v1.md` | Cross-screen consistency audit — pre-conformance analysis that identified all drift | Active (reference) |
| `mont-blanc-style-guide.md` | Original design tokens — superseded by canonical tokens but retained for brand context | Legacy reference |
| `Hearth_LMS_Brand_Guide.md` | Brand voice, tone, visual identity principles | Active reference |
| `Hearth_LMS_Design_Philosophy___Decision_Summary.md` | Why decisions were made — rationale archive | Active reference |
| `Hearth_LMS_Design_Specification.md` | Platform-wide design spec | Active reference |

---

## Design and Architecture Documentation

### Screen-Specific Specs

| Doc | Covers |
|-----|--------|
| `hearth-logger-spec-v1.md` | Retrospective Logger — complete field-level spec: workspace layout, completeness gate, per-child differentiation, observation chips, evidence capture, voice input, AI insights panel, mobile drawer, data schema |
| `hearth-weekly-planner-spec-v1.md` | Weekly Planner — day cards, activity library, energy-matched time slots, module completion toggle, balance bar, recommendation engine, term awareness |
| `hearth-family-settings-spec-v1.md` | Family Settings — six accordion sections, onboarding mode, co-facilitator invite, compliance deadline setup, pedagogy summary, data/privacy controls, Australian Privacy Principles compliance |
| `hearth-marketplace-spec-v1.md` | Marketplace — browse/filter/sort flow, pack detail modal, included vs premium pricing, Stripe checkout integration, Family Fit AI banner, library management |
| `hearth-pedagogy-engine-spec-v1.md` | Pedagogy Engine — onboarding wizard, 6+1 philosophy model, values/practices selection, familyPedagogicalProfile data structure, settings view, skip/defer handling, demo activity preview |
| `hearth-heu-work-sample-curation-spec-v1.md` | HEU work sample curation flow — addendum to report interaction spec. Candidate browsing, selection, annotation (parent/AI/hybrid), quality scoring, six-sample compliance check, export integration. Resolves System Interaction Map Open Question #6 |
| `hearth-portfolio-spec-v1.md` | Portfolio / Learning Journey — thread-first default view, three card types (Evidence/Journey/Milestone), per-child filtered view, scaffolded progression, summary card with month picker, AI-generated journey observations, PDF export |
| `docs/archive/hearth-constellation-spec-v1.md` | Capabilities Constellation — historical spec (4-level zoom model, per-child data flow, cross-domain edges, badge proximity). Live implementation in `src/app/(auth)/our-story/capabilities/_constellation/`. |
| `hearth-badge-assessment-spec.md` | Badge Assessment secondary interface — post-log trigger, 3-5 confidence-building questions, award moment with secondhand delight, physical badge ordering. Resolves System Interaction Map Open Questions #1 and #2 |
| `Hearth_Dashboard_Our_Story_Content_Spec.md` | Dashboard vs Our Story content differentiation spec |
| `hearth-notification-system-spec.md` | Notification system design + integration spec |
| `hearth-activity-discovery-docs.md` | Activity Discovery design + integration spec |
| `hearth-report-interaction-spec.md` | HEU Report screen interaction patterns |
| `hearth-learner-profile-spec.md` | Learner Profile UX + functional spec |
| `hearth-project-design-specification.md` | Project Experience content architecture |
| `Hearth_Module_Builder_Design_Specification.md` | Module Builder detailed design spec |
| `Hearth_Module_Experience_UX_Flows.md` | Module Experience user flows |
| `hearth_dashboard_design_decisions.md` | Dashboard design rationale |
| `hearth-complete-user-flow.md` | DEPRECATED — superseded by `Hearth_System_Interaction_Map.md` |

### Architecture and Framework

| Doc | Covers |
|-----|--------|
| `Hearth_System_Interaction_Map.md` | Canonical cross-screen coherence: navigation, data lifecycles, interaction specs, open questions |
| `Hearth_AI_Intelligence_Layer_Architecture.md` | AI service architecture: data flows, token optimisation, write-time processing, logger intelligence pipeline |
| `hearth-data-deletion-privacy-model-v1.md` | Data deletion cascade rules, privacy model, Australian Privacy Principles compliance |
| `hearth-data-architecture-overview-v1.md` | Stakeholder-facing database overview: Sanity vs PostgreSQL split, table descriptions, single-entry data flow diagram |
| `hearth-pack-data-architecture-v1.md` | Pack data architecture: document boundaries, manifest structure, app integration, authoring format, weight audit |
| `hearth-hcms-strategy-v1.md` | Sanity content architecture and data boundary. Supersedes `03_CMS_Usage_Mapping.md`, `04_Quick_Reference_Guide.md`, `05_Visual_Architecture_Guide.md` |
| `hearth-module-builder-pathways-architecture-v2.md` | Five-pathway Module Builder architecture: Understanding-First, Material-Anchored, Process/Steps, Inquiry-Driven, Retrospective Lift. Supersedes v1 (six-pathway). Kindler v6 cut planned to incorporate Pedagogy Lens + Methodology Overlay generation |
| `hearth-pedagogy-system-architecture-v1.md` | **Foundational.** Top-level architecture for the full pedagogy system: seven layers, six pedagogies, write-time/read-time discipline, honest-density principle, interpretive-not-prescriptive scope. Sits above component specs. Supersedes the architectural framing in `hearth-pedagogy-integration-framework.md`. Decisions: C-PA1…C-PA5 (2026-05-13) |
| `hearth-pedagogy-lens-bundle-v1.md` | **Canonical spec.** Per-pedagogy lens bundles baked at content time by the Kindler. Five-field, honest-density. Replaces single `pedagogyQuestionOverlay`. Schema lives in `src/sanity/schemas/pedagogyLensBundle.ts` + module fields. Decision: C-PL1 |
| `hearth-methodology-overlay-bundle-v1.md` | **Canonical spec.** Sibling to pedagogy lens bundle. Per-practice overlays, affordance-filtered, twelve practice keys. Introduces three-layer content model (pedagogy / methodology / content). Schema lives in `src/sanity/schemas/methodologyOverlay.ts` + `practice.ts` + module fields. Decision: C-PM1 |
| `hearth-kindler-methodology-integration-brief-v1.md` | Workstream brief — Kindler (CLI orchestrator) generation side. Affordance inference, overlay generation prompt, validation pipeline integration |
| `hearth-runtime-methodology-integration-brief-v1.md` | Workstream brief — Hearth runtime (family app) consumption side. Read paths, surface integration (Logger, Module Experience, Constellation), silent-fallback rules |
| `hearth-decisions-log-v1.md` | Comprehensive decisions audit: confirmed decisions, parked questions, assumed answers, unanswered questions across entire project |
| `hearth-founding-brief-v1.md` | Canonical purpose/mission/vision/values document. Supersedes scattered purpose references in Brand Guide and Design Philosophy docs. All product and content decisions measured against it |
| `hearth-module-builder-pathways-design-brief-v1.md` | Design brief for multi-pathway Module Builder build: shared patterns, per-pathway entry screens, divergence map, build sequence |
| `hearth-documentation-traceability-map-v1.mermaid` | Component-to-documentation traceability graph — which docs govern which screens |
| `hearth-pedagogy-integration-framework.md` | How pedagogy engine connects to all screens. **Architectural framing superseded by `hearth-pedagogy-system-architecture-v1.md` (2026-05-13).** Retained as historical reference for voice-per-philosophy detail. |
| `docs/archive/hearth-capabilities-connector-architecture.md` | Historical — capability thread data model. Layer 4 (AC9-mapped DLOs) not shipped, not planned. Live model: Sanity + `src/lib/capability-universe-v2.ts`. |
| `docs/archive/hearth-capability-thread-library.md` | Historical — 57-thread taxonomy across 8 domains (production uses 15-domain v2 grouping in `src/lib/capability-universe-v2.ts`). |
| `Hearth_Capabilities_Constellation_Design_Exploration.md` | Constellation visualization design sprint findings |
| `Hearth_LMS_Content_Creation_Framework.md` | Three-layer content architecture |
| `Hearth_LMS_Assessment_Engine_Framework.md` | Parent-controlled assessment with confidence-building |
| `K-12_Formative_Assessment_System.md` | Formative assessment reference framework |
| `Expanded_Learning_Activities_System_with_Flow_Design.md` | Activity system flow patterns |

### Implementation and Technical

| Doc | Covers |
|-----|--------|
| `hearth-claude-code-transition-plan-v1.md` | 7-phase Next.js transition plan: Foundations, Skeleton App, Database, Core Value Loop, Sanity/Content, Supporting Screens, AI Layer, Integration/Polish |
| `hearth-prompt-execution-plan-v1.md` | Sequenced prompt execution plan: 11 pre-drafted prompts organised by dependency for Opus Project and Claude Code sessions |
| `module-builder-v3-design-spec.md` | Module Builder v3 parent-facing lightweight builder design spec |
| `module-builder-implementation-brief.md` | Module Builder technical implementation — 7-stage creation pipeline, Sanity schemas, quality gates |
| `stress-test-scenarios.md` | 100 real-world scenarios stress-testing the five-pathway Module Builder routing system |
| `hearth-jumpstart-classical-pack-plan-v2.md` | Jumpstart Classical content pack plan — 10-week QLD term, 12 modules across 6 strands, Genesis 1-11 anchor, Christian classical worldview |
| `hearth-starter-pack-plan-v3.md` | Starter Pack content plan v3 — ages 4-8, 7 modules (~203 activities), balanced experiential + structured content. Rebalanced from v2 to include structured literacy and number work |
| `02_Hearth_Implementation_Guide.md` | Technical implementation roadmap |
| `lms-terms-and-concepts.md` | Domain glossary |
| `Hearth_LMS_Pre-Development_Checklist.md` | Pre-dev verification checklist |
| `platform-app-documentation-guide.md` | Documentation standards |
| `Code_Instructions.txt` | Dev environment instructions |
| `Brief.txt` | Original project brief |

### Persona, Market, and Scoping

| Doc | Covers |
|-----|--------|
| `Persona-Specific_Tool_Mapping_for_Homeschool_LMS.md` | User persona to feature mapping |
| `home-education-fact-sheet.docx` | Queensland home education regulatory context |
| `Onboarding_Design_Challenge_-_FOR_OPUS` | Onboarding design challenge brief |
| `hearth-student-module-experience-scoping-brief.md` | Student-facing module experience scoping — Phase 2 feature, dual-device model |

---

## Superseded Files

These files have been superseded. Candidates for removal to reduce project file count and token overhead.

| File | Superseded By | Notes |
|------|--------------|-------|
| `hearth-dashboard-dark.html` | `hearth-dashboard-dark-v2.html` | Design system conformance pass 2026-03-20 |
| `hearth-dashboard-evening.html` | `hearth-dashboard-evening-v2.html` | Design system conformance pass 2026-03-20 |
| `hearth-dashboard-mobile-v1.html` | `hearth-dashboard-mobile-v2.html` | Design system conformance pass 2026-03-20 |
| `hearth-logger-workspace-v2.html` | `hearth-logger-workspace-v3.html` | Design system conformance pass 2026-03-20 |
| `hearth-logger-workspace.html` | `hearth-logger-workspace-v3.html` | v1 Logger — two versions behind |
| `hearth-weekly-planner-v3.html` | `hearth-weekly-planner-v4.html` | Design system conformance pass 2026-03-20 |
| `hearth-weekly-planner.html` | `hearth-weekly-planner-v4.html` | v1 Planner — two versions behind |
| `hearth-module-builder-v4.html` | `hearth-module-builder-v3.jsx` | Design system conformance pass 2026-03-20 |
| `hearth-module-builder-v2.jsx` | `hearth-module-builder-v3.jsx` | Pre-conformance builder |
| `hearth-pedagogy-engine-responsive.jsx` | `hearth-pedagogy-engine-v2.jsx` | Design system conformance pass 2026-03-20 |
| `hearth-portfolio-learning-journey.html` | `hearth-portfolio-learning-journey-v2.html` | Design system conformance pass 2026-03-20 |
| `hearth-learner-profile.html` | `hearth-learner-profile-v2.html` | Design system conformance pass 2026-03-20 |
| `hearth-report-screen.html` | `hearth-report-screen-v2.html` | Design system conformance pass 2026-03-20 |
| `hearth-activity-discovery-v2.html` | `hearth-activity-discovery-v3.html` | Design system conformance pass 2026-03-20 |
| `hearth-activity-discovery.html` | `hearth-activity-discovery-v3.html` | v1 Activity Discovery — two versions behind |
| `hearth-marketplace.html` | `hearth-marketplace-v2.html` | Design system conformance pass 2026-03-20 |
| `hearth-project-experience-v2.html` | `hearth-project-experience-v3.html` | Design system conformance pass 2026-03-20 |
| `hearth-project-experience.html` | `hearth-project-experience-v3.html` | v1 Project Experience — two versions behind |
| `hearth-family-settings.html` | `hearth-family-settings-v2.html` | Design system conformance pass 2026-03-20 |
| `hearth-notification-centre-v1.html` | `hearth-notification-centre-v2.html` | Design system conformance pass 2026-03-20 |
| `hearth-module-experience-v2.html` | `hearth-module-experience-v3.html` | Design system conformance pass 2026-03-20 |
| `hearth-capabilities-v3.html` | `hearth-capabilities-v4.html` | Design system conformance pass 2026-03-20 |
| `hearth-constellation-map.jsx` | `hearth-constellation-map-v2.jsx` | Design system conformance pass 2026-03-20 |
| `hearth-badge-assessment.html` | `hearth-badge-assessment-v2.html` | Design system conformance pass 2026-03-20 |
| `badge-creation-component.tsx` | `badge-creation-component-v2.tsx` | Design system conformance pass 2026-03-20 |
| `hearth-our-story-hub.html` | `hearth-our-story-hub-v2.html` | Design system conformance pass 2026-03-20 |
| `hearth-complete-demo.html` | `hearth-complete-demo-v2.html` | Design system conformance pass 2026-03-20 |
| `hearth-module-builder-understanding-v1.html` | Goal-Forward pathway (not yet built) | Pre-merge prototype — Understanding-First and Capability-Targeted merged into Goal-Forward per v2 architecture |
| `hearth-starter-pack-plan-v2.md` | `hearth-starter-pack-plan-v3.md` | v3 rebalances content mix: adds structured literacy, structured number work, removes experiential-only bias |
| `Hearth_LMS_UI_Kit.html` | `hearth-ui-kit-v2.md` | Dead HTML file replaced by markdown component reference |
| `hearth-module-builder-pathways-architecture-v1.md` | `hearth-module-builder-pathways-architecture-v2.md` | Six-pathway system replaced by five-pathway |
| `03_CMS_Usage_Mapping.md` | `hearth-hcms-strategy-v1.md` | Per HCMS strategy header: "Supersedes 03, 04, 05" |
| `04_Quick_Reference_Guide.md` | `hearth-hcms-strategy-v1.md` | Per HCMS strategy header |
| `05_Visual_Architecture_Guide.md` | `hearth-hcms-strategy-v1.md` | Per HCMS strategy header |
| `hearth-complete-user-flow.md` | `Hearth_System_Interaction_Map.md` | Deprecated flow doc |
| `hearth-canonical-design-tokens-v1.md` | `hearth-canonical-design-tokens-v2.md` | Design System v2 rollout 2026-04-30 — typography swap, status palette desaturation, cream-tinted borders, warmed body, ember reserved for action, motion tokens added. v1 retained per versioning rules |
| `hearth-dashboard-evening-v2.html` | `hearth-dashboard-gathering-v1.html` (pending) | v2.1 addendum 2026-04-30 — evening dashboard uses pre-v2 tokens; will be replaced by gathering v1 (structural twin of Dashboard Dark v3 with `[data-theme]` scoping). Evening file remains canonical until gathering v1 lands |

---

## Phase Summary

| Phase | Status | Screens |
|-------|--------|---------|
| **Phase 1 MVP** | **19 of 19 built** (100%) + Badge Assessment as 20th screen. Design system conformance complete. All screens have dedicated specs. | All core screens complete, conformant, and documented |
| **Phase 2 Community** | **3 screens built** (3 Apr 2026) + 5 reusable components + 4 integration points. 19 API routes, 8 DB tables, AI narrative pipeline | Hearth Home, Session Detail, Join/Invite |
| Test Family Launch | Next milestone | 10-20 families, requires data persistence + Next.js deployment |
| Phase 3 Scale | Planned | 500+ families |

---

*Registry updated 1 June 2026 — Logger god-component refactor complete (PRs #110–114, #120, #122–129): `src/app/(auth)/log/page.tsx` decomposed from a ~1566-line monolith into a thin composition root (~958 lines). Phases: (1–2) pure logic → `src/lib/logger/*` + presentational → `_components/`; (3) state → seven `src/hooks/use-logger-*` hooks; (4) save orchestration (`buildEntrySavePayload`, `checkBadgeThresholds`/`buildBadgeReadyToast`, `pollEntryEnrichment`) → tested lib; (5) the six form sections (Who / What / Engagement / When&Where / Observe / Evidence) → `_components/` with shared `loggerConstants.ts` + `childColors.ts`. Behaviour preserved verbatim; +unit tests, all CI green. See CLAUDE.md → "Logger screen architecture".*

*Registry updated 9 May 2026 — Editorial workbench shipped (PR #37, commit `2493d5e`): optional `workbench` on activity schema + `workbenches` array on pack schema per `workbench-claude-code-addendum`. `src/lib/content-studio/{types,factories,validation,sanity-transform}.ts` adds `WorkbenchDraft` + `WorkbenchPackDraft` with Zod schemas and soft-flag helpers (id resolution, restrictive/duration/completion language, word cap). `/api/admin/content/publish` returns `workbenchFlags` alongside published ids (non-blocking). `/api/modules/publish` unchanged.*

*Registry updated 6 May 2026 — Mobile bottom nav shipped (PR #36, commit `1ba1203`): 5-tab parent-facing bar (Home / Story / Log / Plan / Explore). Plan + Explore are trayed tabs that anchor a vertical column of destinations above the bar. Components in `src/components/nav/` with single-source-of-truth `navConfig.ts`. Replaces the inline bar previously in `(auth)/layout.tsx`. Spec: `docs/hearth-mobile-bottom-nav-spec-v1.md`.*

*Registry updated 1 May 2026 — Phosphor adopted across all UI surfaces (PR #32, commit `64cd9df`, S14): `@phosphor-icons/react` installed; `src/components/icons/index.tsx` (~140 icons + IconProvider) mounted at root. 75+ files migrated from emoji to Phosphor `regular` weight. `--icon-*` size tokens added to `globals.css`. `docs/hearth-icon-system-v1.md` is the rules doc.*

*Registry updated 1 May 2026 — Design System v2 + v2.1 applied to live code (PR #31, commit `781c0c9`): font swap (Crimson Text → Fraunces variable; Inter → DM Sans variable), status palette desaturated, body surface warmed (`#0F0D0B → #15110D`), borders flipped from ember-tinted to cream-tinted, v1 shadow tokens deleted, motion tokens + 13-class `hearth-motion-utilities.css` shipped, three v2.1 tokens (`--surface-input`, `--backdrop-modal`, `--backdrop-success`) live.*

*Registry updated 30 April 2026 — v2.1 addendum landed: gathering (light/daytime) canonicalised as second theme via `[data-theme]` scoping. Adds S14 to decisions log; introduces three new tokens (`--surface-input`, `--backdrop-modal`, `--backdrop-success`). `hearth-dashboard-evening-v2.html` flagged as pending supersession by `hearth-dashboard-gathering-v1.html`.*

*Registry updated 30 April 2026 — Design System v2 landed: tokens v2, motion v1, decisions addendum (S7–S13), and Claude Code rollout prompts added under new "Design System v2" group. v1 tokens marked superseded but retained per versioning rules.*

*Registry updated 3 April 2026 — Community (Hearth) feature added: 3 screens, 5 components, 19 API routes, 8 tables. Update when adding or modifying screens.*

*Registry updated 9 May 2026 — Phase 3 three-layer content composition (P+M Phase 3) landed at runtime. New runtime modules: `src/lib/pedagogy/lens-bundle-types.ts`, `src/lib/pedagogy/get-active-bundle-and-overlays.ts`. New surfaces: `src/components/logger/ModuleLensHints.tsx` (wired into Logger under module-link guard), `src/components/module/LensPrepHints.tsx`, `src/components/module/LensObservationCues.tsx`, and minimal `src/app/(auth)/constellation/page.tsx` (composite-weighted thread list — full interactive map is a follow-up phase, prototype: `prototypes/hearth-constellation-map-v2.jsx`). Module sidebar now renders lensStatus + methodologyStatus pills. Specs: `docs/hearth-pedagogy-lens-bundle-v1.md`, `docs/hearth-methodology-overlay-bundle-v1.md`, `docs/hearth-runtime-methodology-integration-brief-v1.md`.*

*Registry updated 10 June 2026 (light pass) — Surfaces landed since the May verification: Library status board (`src/app/(auth)/library/_components/BrowseTab.tsx`, `RecentlyRemovedDrawer.tsx`, status logic in `/api/library/status`); mobile Settings downward tray (`src/components/nav/SettingsMenu.tsx` + `settings-menu.module.css`); evidence capture upgrades in `src/app/(auth)/log/_components/EvidenceModal.tsx` (client-side compression, private-blob read proxy via `/api/evidence`); module runner updates in `src/app/(auth)/module/[id]/_components/` (mid-session End & Log, completion tracking via `src/lib/modules/completion.ts`); Explore split into `/explore/activities` + `/explore/marketplace` (`MarketplaceShell.tsx`). Context for what was added vs reset in the June refactor incident: `docs/hearth-refactor-postmortem-v1.md`.*
