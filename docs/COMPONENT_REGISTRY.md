# Hearth LMS — Component Registry

> **Purpose:** Single source of truth for every UI screen, its canonical file, status, and role.
> **Rule:** Before proposing new work, check this file. Before creating a new screen, update this file.
> **Cross-screen coherence:** `Hearth_System_Interaction_Map.md` is the canonical document for navigation flows, data relationships, and inter-screen dependencies.
> **Last verified:** 2 April 2026

---

## Design System

### Reference Documents
| Document | Purpose | Status |
|---|---|---|
| `hearth-canonical-design-tokens-v1.md` | Full token spec (colors, spacing, radius, shadows, transitions, typography) | Active |
| `hearth-ui-kit-v2.md` | Canonical component reference (buttons, cards, inputs, modals, nav) — replaces dead `Hearth_LMS_UI_Kit.html` | Active |
| `hearth-ui-token-deep-audit-v1.md` | Per-screen drift audit documenting every fix applied | Active (reference) |

### Reference Implementation
`hearth-dashboard-dark-v2.html` — source of truth for all visual patterns. When in doubt, the Dashboard is right.

### Conformance Status
**22 / 22 screens confirmed conformant** as of 2026-03-20.

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
| 3 | **Dashboard (Evening)** | `hearth-dashboard-evening-v2.html` | (shares Dashboard spec) | Adaptive time-of-day variant of dashboard | Same nav structure, warmer palette |

**Additional Dashboard prototypes:** `hearth-dashboard-mobile-v2.html` (Option C glanceable mobile layout)

#### Nav Group: Our Story
> **RETAINED** as a distinct top-level navigation group — not collapsed into Dashboard. Presents the learner's unfolding educational narrative across four complementary lenses.

| # | Screen | Canonical File | Spec | Role | Key Interactions |
|---|--------|---------------|------|------|-----------------|
| 5 | **Portfolio / Learning Journey** | `hearth-portfolio-learning-journey-v2.html` | `hearth-portfolio-spec-v1.md` | Evidence gallery showing learning evolution over time | Thread-first default view with Evidence, Journey, and Milestone card types. Per-child filtered view with scaffolded progression display |
| 6 | **HEU Compliance Report** | `hearth-report-screen-v2.html` | `hearth-report-interaction-spec.md`, `hearth-heu-work-sample-curation-spec-v1.md` (addendum) | Queensland HEU compliance documentation | Curriculum coverage %, work sample annotations, posture badge, export. Six-work-sample curation flow in addendum |
| 7 | **Capabilities Constellation** | `hearth-capabilities-v4.html` (design prototype), `hearth-constellation-map-v2.jsx` (React DAG implementation) | `hearth-constellation-spec-v1.md` | Visual map of capability threads and growth patterns — 4-level zoom model | Level 1: domain overview. Level 2: thread view with DAG edges. Level 3: badge/DLO view. Level 4: moment detail with evidence trail. Per-child selector. Production target: unified `hearth-constellation-v4.jsx` merging both prototypes |
| 8 | **Learner Profile** | `hearth-learner-profile-v2.html` | `hearth-learner-profile-spec.md` | Individual child identity portrait — who they are as a learner | Character, working style, interests. NOT progress tracking (that is Capabilities) |

**Additional Our Story prototypes:** `hearth-our-story-hub-v2.html` (Our Story landing/hub page — "Emma's Story"). Spec: `Hearth_Dashboard_Our_Story_Content_Spec.md`

#### Nav Group: Log

| # | Screen | Canonical File | Spec | Role | Key Interactions |
|---|--------|---------------|------|------|-----------------|
| 9 | **Retrospective Logger v3** | `hearth-logger-workspace-v3.html` | `hearth-logger-spec-v1.md` | Core interaction — capture spontaneous learning after it happens | Two-column workspace: tap-driven form (left) + live AI insights (right). Completeness gate at 50%. Per-child differentiation with color-coded engagement emojis + per-child discovery fields keyed by learner_id. Voice input via Web Speech API (en-AU) |

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

### Shelved — MVP Scope Reduction

These screens were designed or planned but removed from MVP scope. Preserved here for Phase 2+ reference.

| Screen | Reason | Revisit When |
|--------|--------|--------------|
| **Facilitator Pedagogical Dashboard** | No distinct facilitator role in MVP — all users are family facilitators using the standard Dashboard. Over-engineered for current scope. | Community hubs built (Phase 2+), when external facilitators / co-ops are a real user type |
| **Learner-facing views** | Learner-facing interface is out of scope for Phase 1. Parents facilitate and log on behalf of children. Scoping brief exists: `hearth-student-module-experience-scoping-brief.md` | Phase 2 when direct learner engagement is validated |
| **Community features** | Co-op tools, group modules, educator forums not needed for solo family validation | Phase 2 community build-out |

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
| `hearth-constellation-spec-v1.md` | Capabilities Constellation — resolves dual-file ambiguity, defines canonical 4-level zoom model, per-child data flow, cross-domain edge rendering, badge proximity indicators, mobile adaptation, accessibility |
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
| `hearth-module-builder-pathways-architecture-v2.md` | Five-pathway Module Builder architecture: Understanding-First, Material-Anchored, Process/Steps, Inquiry-Driven, Retrospective Lift. Supersedes v1 (six-pathway) |
| `hearth-decisions-log-v1.md` | Comprehensive decisions audit: confirmed decisions, parked questions, assumed answers, unanswered questions across entire project |
| `hearth-founding-brief-v1.md` | Canonical purpose/mission/vision/values document. Supersedes scattered purpose references in Brand Guide and Design Philosophy docs. All product and content decisions measured against it |
| `hearth-module-builder-pathways-design-brief-v1.md` | Design brief for multi-pathway Module Builder build: shared patterns, per-pathway entry screens, divergence map, build sequence |
| `hearth-documentation-traceability-map-v1.mermaid` | Component-to-documentation traceability graph — which docs govern which screens |
| `hearth-pedagogy-integration-framework.md` | How pedagogy engine connects to all screens |
| `hearth-capabilities-connector-architecture.md` | Capability thread data model and connection points |
| `hearth-capability-thread-library.md` | Full 57-thread taxonomy across 8 domains |
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
| `lms-database-schema.js` | PostgreSQL schema for user data |
| `lms-api-endpoints.js` | API endpoint definitions |
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

---

## Phase Summary

| Phase | Status | Screens |
|-------|--------|---------|
| **Phase 1 MVP** | **19 of 19 built** (100%) + Badge Assessment as 20th screen. Design system conformance complete. All screens have dedicated specs. | All core screens complete, conformant, and documented |
| Test Family Launch | Next milestone | 10-20 families, requires data persistence + Next.js deployment |
| Phase 2 Community | Planned | 50-100 families. Shelved items revisited here |
| Phase 3 Scale | Planned | 500+ families |

---

*Registry updated 2 April 2026 — pedagogy engine implementation clarified, verified date updated. Update when adding or modifying screens.*
