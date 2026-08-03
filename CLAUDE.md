# Hearth LMS — Claude Code Context

> Homeschool learning management platform for Australian families. Multi-jurisdiction compliance (all 8 states/territories via `src/config/jurisdictions.ts`); QLD/HEU is the pilot anchor.
> 10-20 test families target. Solo developer (Drew).

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS (utility classes only, no CSS-in-JS)
- **Auth:** Clerk (`@clerk/nextjs`)
- **Database:** Neon serverless Postgres + Drizzle ORM
- **CMS:** Sanity (headless, content layer)
- **AI:** Anthropic Haiku (write-time enrichment ONLY — no runtime LLM calls in UI)
- **Hosting:** Vercel
- **Validation:** Zod
- **Dates:** date-fns
- **Icons:** Phosphor Icons (`@phosphor-icons/react`) — single curated re-export at `src/components/icons/index.tsx`

## Project Structure

```
src/
  app/
    (auth)/          # Clerk-protected routes (dashboard, log, our-story, etc.)
    (public)/        # Landing, onboarding
    api/             # API routes
  components/
    ui/              # Shared primitives (buttons, cards, inputs)
    nav/             # Mobile bottom nav (5-tab, trayed Plan/Explore)
    icons/           # Phosphor re-export surface + IconProvider
    layout/          # Nav, header
    screens/         # Screen-specific component groups
  lib/
    db/              # Drizzle schema, client, migrations
    sanity/          # Sanity client, GROQ queries, typed mutations
    content-qa/      # Read-only content validation (completeness + cross-field rules) → /admin/content/qa
    ai/              # Write-time enrichment pipeline
    utils/           # Design tokens, constants
  sanity/
    schemas/         # 19 Sanity document type definitions
  hooks/
  types/
prototypes/          # Original HTML/JSX prototypes (VISUAL REFERENCE ONLY)
docs/                # Architecture specs, design system docs
```

## Reference Files (read before building)

| File | When to read |
|------|-------------|
| `docs/hearth-canonical-design-tokens-v2.md` | **Every UI task.** The source of truth for all design values (v2 — 2026-04-30). Supersedes v1. |
| `docs/hearth-design-system-v2.1-addendum.md` | Gathering theme values + new tokens (`--surface-input`, `--backdrop-modal*`, `--backdrop-success*`). Read alongside tokens v2. |
| `docs/hearth-motion-system-v1.md` | Motion language — durations, easings, application rules per pattern, special cases. Read before adding any animation. |
| `docs/hearth-ui-kit-v2.md` | Component patterns, card anatomy, button variants (revision to v3 pending Dashboard Dark v3) |
| `docs/Hearth_System_Interaction_Map.md` | Cross-screen data flows, navigation |
| `docs/hearth-data-architecture-overview-v1.md` | Sanity vs Postgres data boundaries |
| `docs/hearth-pack-data-architecture-v1.md` | Content hierarchy: Pack → Module → Approach → Activity |
| Capability threads / DLOs / Constellation | Source of truth lives in **Sanity** (`capabilityDomain`, `capabilityThread`, `discreteLearningObjective`) and **code** (`src/lib/capability-universe-v2.ts`, `src/types/capability-universe.ts`). 15 domains, 57 canonical threads, 171 DLOs (3 tier bands per thread: emerging/developing/demonstrating). AU/QLD do not mandate a finer-grained DLO scheme. When building learning modules and you need the full DLO contract per thread, read `docs/hearth-capability-dlo-reference.md` (derived snapshot from Sanity — regenerate when descriptors change). Historical reference docs live in `docs/archive/` — read those only if you need to understand the *origin* of the taxonomy, not to make changes. |
| `docs/hearth-outcomes-spine-plan-v1.md` | **Read before any capability/DLO/constellation/reporting work.** Product + UX brief and phased plan for the outcome-evidence chain (declared thread links, DLO provenance, unified progression, framework transposer). Workstream PRs must cite a persona + journey stage. |
| `docs/hearth-reporting-pipeline-v1.md` | **Read before touching `src/lib/report/`, `src/app/api/report*`, or `src/lib/ai/annotation-draft.ts`.** End-to-end reporting spec: report/portfolio surfaces, the `complianceReports`/`workSamples`/`workSampleAnnotations`/`learnerDloStatus`/`observationDloLinks` tables, the exact deterministic-coverage gate order, the two runtime AI touchpoints (annotation drafts, progression summaries) and their edit-protection safeguards, per-tier PDF structure (`cd_level` vs `learning_area`), and the coverage-fallback recovery runbook. |
| `docs/hearth-constellation-architecture-v1.md` | Constellation architecture — the DLO/capability-thread visualisation surface upstream of `learner_dlo_status`. Read alongside the reporting pipeline doc for how DLO evidence reaches the coverage rollup. |
| `docs/Hearth_AI_Intelligence_Layer_Architecture.md` | AI enrichment pipeline (Phase 6) |
| `docs/alpha-readiness-pickup.md` | Current alpha-readiness status + honest caveats. Read first on any pilot-ops task. |
| `docs/hearth-native-app-plan-v1.md` | **Read before any PWA / offline / service-worker / Capacitor / store-compliance work.** Phased plan for shipping to the iOS App Store and Google Play. Two rules that bind ordinary feature work: digital purchases must stay absent from native builds (AU storefront mandates IAP), and the app must survive airplane mode. |
| `docs/deployment-runbook.md` | First-deploy + recurring deploy checklist. |
| `docs/incident-runbook.md` | Triage flows for enrichment failures, cost spikes, rate limits, AI outages. |
| `docs/branch-hygiene.md` | Branch protection + GitHub auto-delete + stale-branch audit (`scripts/audit-stale-branches.mjs`). |
| `docs/hearth-refactor-postmortem-v1.md` | **Read before proposing any multi-phase/structural work.** June 2026 refactor incident: what failed, the verified delta (incl. ghost `module_runs` schema), binding re-land pattern, and entry criteria for the next structural pass. |
| `docs/test-pilot-runbook.md` | **Canonical testing setup.** Read before writing or running any test. |
| `docs/hearth-research-log.md` | **Append-only pilot-evidence log.** Every user-reported finding lands here; every confirmed bug gets a regression test at the right layer (the convention lives in its header). Check before claiming a behaviour is or isn't a known issue. |
| `docs/hearth-pilot-personas-v1.md` + `docs/hearth-parent-journey-v1.md` | Who Hearth serves (composite personas, `[TO VALIDATE]`-tagged) and the staged anxiety→joy journey with per-stage success signals. Read on any UX-facing task; cite personas by name in specs. |
| `docs/PROJECT_STATUS.md` | **Single source of truth for project status + priorities.** Updated in the same PR as the work, or claims carry a "trails reality" caveat. The closed alpha trackers live in `docs/archive/`. |
| `docs/external-services-guide.md` | All-in-one reference for every external service Hearth depends on (Clerk, Neon, Sanity, Anthropic, PostHog, Sentry, Vercel, Upstash) — rationale + alternatives. |
| `docs/oncall-cheatsheet.md` | One-page on-call reference: dashboards, kill-switches, symptom→first-move table. |
| `docs/hearth-icon-system-v1.md` | Phosphor icon rules — weight, size tokens (`--icon-xs..xl`), colour, placement, custom-mark specs. |

When building a specific screen, also read its spec doc (e.g., `docs/hearth-logger-spec-v1.md`) and look at its prototype in `prototypes/`.

## Design System: Mont Blanc Dark Coffee — v2 (in flight)

The v2 token system landed 2026-04-30. Source of truth is `docs/hearth-canonical-design-tokens-v2.md` + `docs/hearth-design-system-v2.1-addendum.md` + `docs/hearth-motion-system-v1.md`. v1 is superseded but retained for archival reference. Do not improvise values.

**v2 conformance status:** Tokens, motion utilities, fonts, colours, shadows, modal backdrops landed. Reference Dashboard rebuild (Dashboard Dark v3) and per-screen visual review pending.

### Tailwind Config — Canonical Token Mapping

**IMPORTANT:** Old token names (`bg-primary`, `coffee-mid`, `deep-coffee`, `shadow-soft/medium/warm/glow`, `bg-overlay-backdrop`) are DEPRECATED. Use the v2 names. Tokens are defined in `src/app/globals.css` via `@theme`. No `tailwind.config.ts` exists.

### Design Rules — Violations Will Be Caught

1. **Ember is for actions ONLY.** Buttons, active nav, progress bars, badge celebrations, focus rings. Never body text, never decorative, never default card glow, never default border.
2. **Default cards have no shadow.** v2 strips ember halos from cards entirely. Elevation comes from surface step + cream-tinted border. The `shadow-card` token is `none`.
3. **Sage is for growth/success ONLY.** Progress, positive states, achievements.
4. **Font-weight 700:** Brand wordmark ("Hearth") and display greeting `<strong>` ONLY. Section titles = 600. Card titles = 600.
5. **Serif (Fraunces, variable with SOFT axis):** Content the parent READS — headings, body, card titles, section titles, descriptions, names. Use `.display`, `.heading`, `.body-serif` utility classes for canonical SOFT/opsz settings.
6. **Sans (DM Sans, variable):** Interface the parent OPERATES — buttons, nav, labels, tags, timestamps, metadata, overlines, action links.
7. **Radius:** 6 / 10 / 16 / 24px only. No arbitrary values.
8. **Transitions:** Always consume motion tokens. Five duration tokens — `--motion-instant` (100ms), `--motion-quick` (200ms), `--motion-base` (300ms), `--motion-gentle` (400ms), `--motion-slow` (600ms). Four easings — `--ease-default`, `--ease-out`, `--ease-in`, `--ease-soft-spring`. Use Tailwind arbitrary form `duration-[var(--motion-quick)]` and `ease-[var(--ease-default)]`. **Never** inline `cubic-bezier(...)` or `duration-[NNNms]`. Prefer the `.hearth-*` utility classes from `src/app/hearth-motion-utilities.css` (e.g. `.hearth-press`, `.hearth-lift-card`, `.hearth-modal-enter`, `.hearth-thinking`, `.hearth-skeleton`).
9. **Borders:** `border-border-subtle` (cream-tinted) is the default. `border-border-medium` for hover/elevated. `border-border-active` and `border-border-focus` are reserved as state signals (selected / focused / active). Ember on a border = something is happening.
10. **Insets:** dark uses cream insets (`shadow-inset-highlight`); gathering is the only place pure white insets are permitted. Never `rgba(255,255,255,...)` insets in dark mode.
11. **No decorative images, icons, or custom SVG shapes.** Use emoji as placeholders or icon library glyphs. Structure and logic only.
12. **Mobile-first.** All layouts start mobile, scale up.

### Card Pattern (canonical, v2)

```
bg-surface-panel rounded-lg p-xl border border-border-subtle
hover:border-border-medium
transition-[transform,border-color,box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-default)]
hover:-translate-y-[2px] hover:shadow-hover
```

Or apply `.hearth-lift-card` from `src/app/hearth-motion-utilities.css` to consume the canonical lift transition in one class.

Default cards have NO shadow. Hover lift uses `shadow-hover`. Featured/selected state uses `border-border-active`.

### Shadow Utilities (v2)

Defined in `@theme` and generate Tailwind utilities:

- `shadow-card` — default card (none — lift via surface step + border)
- `shadow-hover` — clickable card hover
- `shadow-float` — modals, FAB, bottom sheets (genuine float)
- `shadow-ember` — Quick Log button + primary CTAs only
- `shadow-ember-strong` — earned-badge moment, hero CTA active
- `shadow-focus` — focus ring (3px ember at 0.4 alpha)
- `shadow-inset-highlight` / `shadow-inset-strong` — cream rim-light

Do NOT use hardcoded `shadow-[0_2px_8px_rgba(...)]` — use the token classes.

### Button Variants

- **Primary:** `bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm`
- **Secondary/Ghost:** `bg-transparent border border-border-subtle text-text-secondary font-sans`
- **Danger:** `bg-red-900/20 text-red-400 border border-red-900/30` — uses `text-white` on `bg-red-600` for destructive confirm buttons (intentional exception, not themed)

## Theme System

Hearth has two visual modes that swap via `data-theme` attribute on `<html>`:

- **Dark (default):** Mont Blanc dark coffee. `data-theme=""` or absent.
- **Gathering:** Warm parchment. `data-theme="gathering"`.

### Auto time-of-day switching

By default, themes switch automatically: **Gathering 6am–6pm, Dark 6pm–6am**. Manual override persists to `localStorage` key `hearth-theme`. The `useTheme()` hook (`src/hooks/use-theme.ts`) manages all theme state.

### Flash prevention

Root `layout.tsx` includes an inline `<script>` that sets the theme attribute before React hydrates. Do not remove this.

### Clerk theming

Clerk components cannot read CSS custom properties. `src/app/clerk-theme.ts` exports `getClerkAppearance(theme)` which returns hardcoded palette objects for each theme. `src/components/ClerkThemeProvider.tsx` wraps `ClerkProvider` and passes the correct appearance based on current theme.

### Key theme files

| File | Role |
|------|------|
| `src/hooks/use-theme.ts` | Theme state, auto-switch, manual override |
| `src/app/clerk-theme.ts` | `getClerkAppearance(theme)` for Clerk components |
| `src/components/ClerkThemeProvider.tsx` | Wraps ClerkProvider with dynamic theme |
| `src/app/globals.css` | All token definitions and `[data-theme="gathering"]` overrides |

### Child identity colors

A single centralized map lives in `src/components/ui/LearnerAvatar.tsx` (`LEARNER_COLOUR_MAP`). It exports Tailwind classes (`bg`, `border`, `text`, `pill`) and `cssVar` references for each child color. **Do not create duplicate color maps** — import from LearnerAvatar.

### Theme default convention (deliberate divergence from v2.1)

The v2.1 addendum specifies gathering as the default theme (`[data-theme="dark"]` opt-in). This implementation **keeps dark as default** (`data-theme=""` or absent → dark; `data-theme="gathering"` → light) for production stability. Auto time-of-day switching (gathering 6am–6pm, dark 6pm–6am) covers the addendum's daytime intent. Do not flip the inline flash-prevention script or the `useTheme()` default value without explicit decision.

### Token value exceptions (WCAG AA)

Two token values deviate from the original design spec for accessibility:
- Dark `--text-muted`: `#877565` (v2 spec is `#6B5D52`) — ~4.1:1 on panel, raised from `#726458` (3.15:1) in commit `4dfdd5b`. Clears WCAG AA for large/bold text (3:1) but still falls short of the 4.5:1 AA threshold for normal-size text.
- Gathering `--text-inverse`: `#FFFFFF` (v2 spec is `#FDF6F0`) — keeps WCAG AA on ember backgrounds

See `docs/hearth-canonical-design-tokens-v1.md` Appendix A for details.

### Icon library

Per S8 the spec calls for Lucide; this implementation uses **Phosphor Icons** (`@phosphor-icons/react`) per S14. Adopted across all UI surfaces 2026-05-01 (commit `64cd9df`).

- **Single curated re-export:** `src/components/icons/index.tsx` (~140 icons). App code imports from `@/components/icons`, never from `@phosphor-icons/react` directly.
- **IconProvider** mounted in `src/app/layout.tsx` defaults every icon to `size 18` / `regular` weight.
- **Size tokens** in `globals.css`: `--icon-xs` (14) / `--icon-sm` (16) / `--icon-md` (18) / `--icon-lg` (22) / `--icon-xl` (32).
- **Custom-mark slots** (`ChildShape*`, `HearthBrandMark`) are placeholders for illustrator-bespoke marks — not Phosphor.
- **Legacy emoji registry** (`src/lib/icon-registry.ts`, `<HearthIcon>`) coexists; components migrate as touched.
- Full rules in `docs/hearth-icon-system-v1.md`. Do not generate decorative SVGs or AI-generated icons.

## Accessibility

- **Target:** WCAG AA across all screens in both themes.
- **Modals:** Use `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. Use `useFocusTrap()` hook from `src/hooks/use-focus-trap.ts`.
- **Modal backdrops:** Use `bg-overlay-backdrop` (theme-adaptive). Never `bg-black/50`.
- **Progress indicators:** Use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` zeroes all animation/transition durations in `globals.css`.
- **Nav blur backgrounds:** Use `var(--color-surface-nav-blur)` for frosted nav overlays.
- **Horizontal-scroll guard:** `html, body` carry `overflow-x: clip` in `globals.css` — a mobile safety net so no element can introduce a sideways page scroll on 320–768px. `clip` (not `hidden`) is deliberate: it preserves `position: sticky`. Do not remove it. Genuine horizontal scrollers (carousels, the planner week-grid) must own their own `overflow-x-auto` wrapper rather than relying on the page.
- **Hiding carousel scrollbars:** Use the `.scrollbar-none` utility (defined in `globals.css`). Do not re-inline `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`.
- **Flex layout columns need `min-w-0`:** The shell content column and `<main>` in `(auth)/layout.tsx` (mirrored in `demo`/`dev-preview`) carry `min-w-0`. A flex item defaults to `min-width: auto`, so without this a horizontal `overflow-x-auto` scroller (e.g. an Editor's Picks carousel) stretches the whole column past the viewport on iOS — the page then lays out wide and the `overflow-x: clip` guard merely *clips* it. Keep `min-w-0` on any flex item that contains, or is an ancestor of, a horizontal scroller or long text.

## Architecture Principles — Do Not Violate

1. **Retrospective logging is the core interaction.** Parents capture learning AFTER it happens. Logger is the heartbeat. Forward planning (Weekly Planner, Module Builder) is supported but never primary.
2. **5-minute rule.** Every parent-facing interaction completable in under 5 minutes.
3. **Philosophy-neutral content.** Content is created without pedagogical bias. Pedagogy overlays apply at runtime per family profile. 6 pedagogies: Charlotte Mason, Classical, Montessori, Waldorf/Steiner, Unschooling, Eclectic.
4. **Two-layer AI.** Expensive LLM at write-time only (entry save → Haiku enrichment → snapshot). All screens read from pre-computed Family Intelligence Snapshots in Postgres. No runtime AI calls.
5. **Portfolio is a filtered view,** not an independent data store. No "add to portfolio" button. No sync drift.
6. **Australian Curriculum mapping is backend.** UI shows capability threads and plain-language descriptors only.
7. **No freemium language.** Membership-included content has zero transactional UI.
8. **Content hierarchy:** Pack → Module → Approach → Activity. Four independent Sanity document types (plus 15 supporting schemas — projects, badges, capability threads, pedagogy knowledge base, assets, commons text, module skeletons).
9. **Sanity = reusable content. Postgres = user/transactional data.** **Modules, approaches, activities, packs, projects, badges, capability threads, and the pedagogy knowledge base all live in Sanity.** The Next.js app reads them via GROQ at runtime through `src/lib/sanity/{client,queries}.ts`. Never store user data in Sanity. Never store portable content in Postgres.
10. **Two authoring paths into Sanity, by writer:**
    - **In-app parent path** (operator UI): Module Builder → `/api/modules/publish` (parent / family-authored). Uses `src/lib/sanity/mutations.ts` (auto-sets `authorFamilyId`). The in-app admin **Content Studio** editorial route (`/api/admin/content/publish` + `src/lib/content-studio/`) was retired (#117, commit `0baa3d8`); editorial authoring now happens directly in **Sanity Studio**, with the publish guardrails ported into the Sanity schemas. The surviving read-only validation surface is **Content QA** (`src/lib/content-qa/`, dashboard `/admin/content/qa`) — it flags non-blocking issues and does NOT gate publish.
    - **External authoring path** (kindling repo, fully separate from hearth): module spec docs → kindling's `library/build-mode/orchestrator.ts` → direct Sanity mutations with deterministic IDs and `register/modules.jsonl` event trail. Used by Drew / Cowork to build official content packs. Writes via direct mutations because `/api/modules/publish` violates the editorial rule (it auto-sets `authorFamilyId`). See the kindling repo's `design/sanity-schema-reference.md` and `library/build-mode/README.md`. The kindling repo lives as a sibling checkout on Drew's machine — it is not part of this repo.
11. **Pedagogy system — interpretive, not prescriptive.** The methodology layer makes the catalogue legible in the family's tradition and lets accumulated reads inform later surfacing. It does NOT branch modules, generate forward task lists, schedule the parent's week, or make read-time LLM calls. Seven layers: Profile (Postgres) → PKB (Sanity + pgvector) → Lens Bundle (Sanity, per module per pedagogy) → Per-screen overlays → Lens Accumulated Signals (FIS, per child) → Method Affinity (Sanity, per module) → Tag-match recommender (read-time JSONB overlap). Three-layer content model **(1) pedagogy / (2) methodology / (3) content)** sits inside this: layers 1–2 are baked at content time by the Kindler — `pedagogyLensBundles[]` keyed by `pedagogyKey`, `methodologyOverlays[]` keyed by `practiceKey` (twelve practices), affordance-filtered via `methodologyAffordances[]`. User-facing copy says "practices"; "methodology" is architecture-internal. **Authoritative architecture:** `docs/hearth-pedagogy-system-architecture-v1.md`. Component specs: `docs/hearth-pedagogy-lens-bundle-v1.md`, `docs/hearth-methodology-overlay-bundle-v1.md`, `docs/hearth-pedagogy-engine-spec-v1.md`, `docs/hearth-pedagogy-knowledge-base-architecture-v1.md`. Decisions: C-PL1, C-PM1, C-PA1…C-PA5.

## Key implementation surfaces

Non-obvious locations for features that come up often:

| Feature | Code |
|---|---|
| Pedagogy wizard (onboarding Step 3 + Settings re-run modal) | `src/components/pedagogy/PedagogyWizard.tsx` (component) + `src/components/pedagogy/data.ts` (catalogs + demo insights). Specs in `docs/hearth-pedagogy-engine-spec-v1.md`. |
| Pedagogy language adapter (overlay vocabulary at runtime) | `src/lib/pedagogy/adapter.ts`; tests `adapter.test.ts` (also enforces wizard↔adapter contract). |
| Client analytics (PostHog) | `src/lib/analytics/posthog.ts`. Add new events to the `HearthEvent` union. |
| Server analytics (fires from API routes) | `src/lib/analytics/posthog-server.ts`. Identify on the SAME id as the client (Clerk userId) so funnels join. |
| Admin AI cost dashboard | `/api/admin/analytics/ai-cost/route.ts` + `src/app/(admin)/admin/analytics/_components/AiCostPanel.tsx`. Pricing constants live in the route. Model-aware: `priceFor()` resolves any `model_used` value via exact / prefix / family-only fallback. |
| Stale-branch audit | `scripts/audit-stale-branches.mjs`. Configurable via `STALE_DAYS`, `PROTECTED`, `BASE` env vars. |
| Mobile bottom nav | `src/components/nav/` — 5-tab (Home/Story/Log/Plan/Explore). Plan + Explore are trayed tabs (anchored vertical tray above bar). Single source of truth: `navConfig.ts`. Mounted from `src/app/(auth)/layout.tsx`. Spec: `docs/hearth-mobile-bottom-nav-spec-v1.md`. |
| Content QA (validation dashboard) | `src/lib/content-qa/` — `rules.ts` (`completenessRules` + `crossFieldRules`), `run.ts` (pack summaries / detail / flat issues), `tree.ts` (`fetchPackTree`). Reads the Sanity pack tree and emits non-blocking `error`/`warning` issues; dashboard at `/admin/content/qa`. Does NOT gate publish. The in-app editorial Content Studio (`src/lib/content-studio/`) + `/api/admin/content/publish` were retired (#117, commit `0baa3d8`); editorial authoring moved to Sanity Studio. The parent path `/api/modules/publish` is unchanged. |
| Logger offline minimum | `useOnlineStatus()` hook + offline banner on `/log`. 10s autosave to `localStorage`; save-failure toast distinguishes offline from server error. Full PWA / sync queue stays Phase 2. |
| Logger screen architecture | `/log` (`src/app/(auth)/log/page.tsx`) is a thin composition root wiring hooks + section components — **not** a monolith (decomposed from ~1566 lines over refactor phases 1–5, 2026-06; behaviour preserved verbatim). **State hooks** (`src/hooks/use-logger-*`): `useLoggerDraft`, `useLearnersFetch`, `useScaffoldFetch`, `useLoggerModeAndSnapshot`, `useKeywordMatch`, `useCoachHints`, `useCompletenessUi`. **Save/derivation logic** (`src/lib/logger/`, all unit-tested): `entry-payload` (`buildEntrySavePayload`, `isThinEntry`, subject/title/evidence derivations), `badge-check` (`checkBadgeThresholds`, `buildBadgeReadyToast`), `enrichment-poll` (`pollEntryEnrichment`), `draft`, `completeness`. **Form sections** (`src/app/(auth)/log/_components/`): `WhoSection`, `WhatSection`, `EngagementSection`, `WhenWhereSection`, `ObserveSection`, `EvidenceSection` + `EvidenceModal`, `InsightsContent`, `SectionHeader`; shared option catalogs in `loggerConstants.ts`, child colours in `childColors.ts`. `handleSave` stays in the page as the orchestrator but delegates payload-build / badge-check / enrichment-poll to the tested lib. |
| Noisy-family detection | Daily retention cron runs `detectNoisyFamilies()`. Above `NOISY_FAMILY_TOKEN_THRESHOLD` (default 200k tokens / 24h, env-tweakable) → `admin_audit_log` row + Sentry breadcrumb. |
| Pedagogy corpus vault (PKB intake) | `corpus/pedagogy/` — one md file = one PKB entry = one Sanity doc, licence registry in `sources.json` (copyright is a lookup, never a debate — PKB11 mechanised). Compiler lib `src/lib/pedagogy/corpus/`; CLI `scripts/compile-pedagogy-corpus.ts` (`npm run corpus:check` / `seed:pedagogy:corpus`); vault validity pinned in CI by `vault.test.ts`. Engine consuming it: `src/lib/pedagogy/{retrieval,embedding,chunk-builder}.ts` + `src/lib/ai/pedagogy-context.ts`, gated by `PEDAGOGY_KB_ENABLED`. Read `corpus/pedagogy/README.md` before authoring corpus entries; architecture in `docs/hearth-pedagogy-corpus-vault-architecture-v1.md`. |

## Testing

**This is the canonical testing setup for the repo.** Do not improvise alternatives (Jest, Mocha, ad-hoc mocks, etc.). Full step-by-step pilot in `docs/test-pilot-runbook.md`.

### Two configs, two extensions

- **Unit** — `vitest.config.ts`, file pattern `*.test.{ts,tsx}`, environment jsdom, everything external mocked. Run: `npm test` (alias: `npm run test:unit`).
- **Integration** — `vitest.integration.config.ts`, file pattern `*.integration.test.{ts,tsx}`, environment node, **real Postgres** (local Docker container; `pgvector/pgvector:pg16`) + real Drizzle, everything else still mocked. Run: `npm run test:integration:local` (spins up the container, migrates, runs, tears down). Isolation is **transaction rollback** — each test runs inside `BEGIN…ROLLBACK` on a pinned `node-postgres` client, so nothing it writes survives. The `@/lib/db` import is aliased to `src/test/db-test-shim.ts` so handlers under test write through the same transaction. A Neon ephemeral-branch path (`npm run test:integration`) still exists for on-demand cloud validation but is not the default. See `docs/test-pilot-runbook.md`.

Never collapse these into one config. Integration tests using mocks, or unit tests hitting a real DB, would both silently defeat the point.

### Mocks live in the setup files, not in individual tests

- `vitest.setup.ts` registers Clerk v7 async mocks (`auth`, `currentUser`, `clerkClient`, `clerkMiddleware`, `createRouteMatcher`) plus Anthropic, Sanity, Blob, `next/headers`, `next/navigation`. Default state: signed-in owner of `TEST_FAMILY_ID`.
- `vitest.integration.setup.ts` re-uses those mocks **and** wraps each test in a transaction it rolls back afterward (via `src/test/integration-db.ts`). The DB itself is NOT mocked in integration — that is the whole point.
- **Clerk v7 is async.** Always `mockResolvedValue()`, never `mockReturnValue()`. Mocking `auth()` with a sync return is the #1 cause of "userId is undefined" failures.

### Per-test identity overrides — use the helpers

Import from `@/test/clerk-helpers`:

- `asUser({ userId?, familyId?, role?, email? })` — default owner
- `asSignedOut()` — 401-path tests
- `asEditor({...})` / `asViewer({...})` — role-based access tests
- `asOtherFamily()` — cross-family isolation tests

Do not hand-roll Clerk mock overrides inside a test file. Every ad-hoc override is an invitation for mock drift.

### Factories

- `src/test/factories.ts` — pure objects. Types come from `InferSelectModel<typeof families>` etc. Schema drift surfaces as a compile error.
- `src/test/db-factories.ts` — `createFamily(db, {...})`, `createLearner`, `createEntry`, … — insert real rows via Drizzle and return the result. Use only in integration tests. Scenario seeders like `seedBasicFamily(db)` bundle common setups.

### When the schema changes

Update these two places in lockstep (CI will usually catch a mismatch, but it's cheap to do proactively):

1. `src/test/factories.ts` — `InferSelectModel` drift will surface in `tsc`, but default values still need updating.
2. `src/test/db-factories.ts` — only if you add a new seeder for the new table.

(No truncate list to maintain — rollback isolation means a new table is wiped automatically. New migrations are applied by `drizzle-kit migrate` against the fresh container before the suite runs.)

### CI

`.github/workflows/test.yml` runs four parallel jobs on every PR and push to main: **lint** (continue-on-error until debt clears), **typecheck**, **unit**, **integration** (stands up a `pgvector/pgvector:pg16` service container, applies the schema with `drizzle-kit migrate`, then runs the suite — no cloud credentials, always runs). All jobs run Node 24 (LTS), selected from `.nvmrc` via `actions/setup-node`'s `node-version-file`; the runtime is also declared in `package.json` `engines.node` (`24.x`), which Vercel honors.

## Writing Sanity Content Programmatically

To create modules (with approaches and activities) in Sanity, use the publish API or the mutations layer directly.

### Publish API — `POST /api/modules/publish`

Accepts a full module tree and writes all documents to Sanity. Auth required (Clerk). Zod-validated.

```json
{
  "title": "Module Title",
  "targetUnderstanding": "What the child will understand",
  "subjects": ["science", "mathematics"],
  "ageRange": { "min": 5, "max": 8 },
  "duration": { "min": 30, "max": 60 },
  "status": "published",
  "approaches": [{
    "title": "Approach Title",
    "modality": "kinesthetic",
    "description": "How this approach enters the understanding",
    "activities": [{
      "title": "Activity Title",
      "summary": "1-2 sentence card overview",
      "instructions": "Plain text converted to Portable Text automatically",
      "facilitatorGuidance": { "before": "...", "during": "...", "challenges": "..." },
      "materials": [{ "name": "Item", "required": true, "alternative": "Alt" }],
      "duration": { "min": 15, "max": 30 },
      "setting": "indoor",
      "energyLevel": "moderate",
      "modality": "kinesthetic"
    }]
  }]
}
```

Returns `{ moduleId, approaches: [{ approachId, activityIds }] }`.

### Direct mutations — `src/lib/sanity/mutations.ts`

Typed creators: `createModule()`, `createApproach()`, `createActivity()`, `createFullModule()` (handles circular refs). Use `keyedRefs()` from `helpers.ts` for all array reference fields (provides required `_key`).

### Helpers — `src/lib/sanity/helpers.ts`

- `ref(id)` — single reference (for back-refs like `approach.module`)
- `keyedRef(id)` / `keyedRefs(ids)` — array references with `_key` (for `module.approaches`, `approach.activities`, etc.)
- `blockText(text)` — plain text → Portable Text
- `material(name, required?, alternative?)` — material object
- `autoSlug(title)` — auto-generate slug from title
- `range(min, max)` — `{ min, max }` object

## File & Versioning Rules

- Prototype files: `hearth-{component}-v{N}.{ext}` — reference only, do not modify.
- When building a screen from a prototype: read the structure, translate inline styles to Tailwind classes using canonical tokens. Do not copy styles verbatim.
- Commit messages: descriptive, scoped. e.g., `feat(logger): build entry form component`

## Session Scoping

Each session should target ONE focused deliverable:
- "Build the Drizzle schema for all tables"
- "Build the Logger form component"  
- "Wire up entry save → enrichment → snapshot pipeline"

Do not span multiple phases in one session.

## Common Mistakes to Avoid

- Using old token names (`bg-primary`, `coffee-mid`, `deep-coffee`) instead of canonical (`surface-body`, `surface-panel`, `surface-raised`)
- Using white-tinted borders instead of ember-tinted
- Setting font-weight 700 on anything other than brand/greeting
- Using sans-serif for content headings (should be serif)
- Using serif for buttons/labels (should be sans)
- Generating decorative SVGs or custom icons (use emoji or chosen icon library)
- Making runtime API calls to Anthropic (write-time only)
- Building philosophy-specific content (always philosophy-neutral)
- Using v1 shadow tokens (`shadow-soft`/`medium`/`warm`/`glow`) — DELETED; use v2 set (`shadow-card`/`hover`/`float`/`ember`/`ember-strong`/`focus`)
- Putting an ember halo on a default card — v2 strips ember from default surfaces; ember = action signal only
- Using hardcoded `shadow-[...]` for canonical patterns instead of v2 token classes
- Using `bg-black/50` or `bg-overlay-backdrop` for modal backdrops — use `backdrop-modal` (v2.1 token-driven, theme-aware blur)
- Inline `cubic-bezier(...)` or `duration-[NNNms]` arbitrary values — use `var(--motion-*)` and `var(--ease-*)` tokens or `.hearth-*` motion utility classes
- White-tinted insets (`rgba(255,255,255,...)`) in dark mode — use `shadow-inset-highlight`/`shadow-inset-strong` (cream); pure white insets are only valid in gathering theme
- Using v1 status hex (`#4ADE80`, `#FBBF24`, `#FB7185`, `#60A5FA`, `#A78BFA`) — replaced by v2 dusty palette (`#7BBF8A`, `#E0B569`, `#D88894`, `#7BA3C9`, `#9E8FB8`)
- Loading Crimson Text or Inter — DELETED; v2 uses Fraunces (variable, SOFT axis) + DM Sans (variable)
- Using hardcoded `rgba(15,13,11,0.85)` for nav blur instead of `var(--color-surface-nav-blur)`
- Creating duplicate child color maps instead of importing `LEARNER_COLOUR_MAP` from `LearnerAvatar.tsx`
- Using `text-white` on colored backgrounds instead of `text-surface-body` or `text-text-inverse` (exception: danger confirm buttons)
- Hardcoding `data-theme="dark"` — theme is managed by the inline script and `useTheme()` hook
- Re-inlining `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` instead of the `.scrollbar-none` utility
- Fixed-width (`w-[NNNpx]`) or fixed grid tracks (`grid-cols-[…px…]`) that apply at the mobile base without a responsive prefix or an `overflow-x-auto` wrapper — they clip/overflow on phones. Gate them behind `sm:`/`lg:` or pair fixed slide-overs with `w-full max-w-[NNNpx]`
