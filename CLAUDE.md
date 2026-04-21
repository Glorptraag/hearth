# Hearth LMS — Claude Code Context

> Homeschool learning management platform for Australian families. Queensland HEU compliance focus.
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
X
## Project Structure

```
src/
  app/
    (auth)/          # Clerk-protected routes (dashboard, log, our-story, etc.)
    (public)/        # Landing, onboarding
    api/             # API routes
  components/
    ui/              # Shared primitives (buttons, cards, inputs)
    layout/          # Nav, header
    screens/         # Screen-specific component groups
  lib/
    db/              # Drizzle schema, client, migrations
    sanity/          # Sanity client, GROQ queries
    ai/              # Write-time enrichment pipeline
    utils/           # Design tokens, constants
  hooks/
  types/
prototypes/          # Original HTML/JSX prototypes (VISUAL REFERENCE ONLY)
docs/                # Architecture specs, design system docs
```

## Reference Files (read before building)

| File | When to read |
|------|-------------|
| `docs/hearth-canonical-design-tokens-v1.md` | **Every UI task.** The source of truth for all design values. |
| `docs/hearth-ui-kit-v2.md` | Component patterns, card anatomy, button variants |
| `docs/Hearth_System_Interaction_Map.md` | Cross-screen data flows, navigation |
| `docs/hearth-data-architecture-overview-v1.md` | Sanity vs Postgres data boundaries |
| `docs/hearth-pack-data-architecture-v1.md` | Content hierarchy: Pack → Module → Approach → Activity |
| `docs/lms-database-schema.js` | PostgreSQL table definitions |
| `docs/lms-api-endpoints.js` | API route reference |
| `docs/Hearth_AI_Intelligence_Layer_Architecture.md` | AI enrichment pipeline (Phase 6) |
| `docs/alpha-readiness-pickup.md` | Current alpha-readiness status + honest caveats. Read first on any pilot-ops task. |
| `docs/deployment-runbook.md` | First-deploy + recurring deploy checklist. |
| `docs/incident-runbook.md` | Triage flows for enrichment failures, cost spikes, rate limits, AI outages. |
| `docs/branch-hygiene.md` | Branch protection + GitHub auto-delete + stale-branch audit (`scripts/audit-stale-branches.mjs`). |

When building a specific screen, also read its spec doc (e.g., `docs/hearth-logger-spec-v1.md`) and look at its prototype in `prototypes/`.

## Design System: Mont Blanc Dark Coffee

The design system is LOCKED. Do not improvise values. When in doubt, `hearth-canonical-design-tokens-v1.md` is right and everything else is wrong.

### Tailwind Config — Canonical Token Mapping

**IMPORTANT:** The token names below come from the conformance pass (March 2026). If you see older names like `bg-primary`, `bg-secondary`, `coffee-mid`, `deep-coffee` in prototypes, they are DEPRECATED. Use the canonical names.

Design tokens are defined in src/app/globals.css via @theme inline. No tailwind.config.ts exists.

### Design Rules — Violations Will Be Caught

1. **Ember is for actions ONLY.** Buttons, active nav, progress bars, badge celebrations. Never body text, never decorative, never domain identity colors.
2. **Sage is for growth/success ONLY.** Progress, positive states, achievements.
3. **Font-weight 700:** Brand wordmark ("Hearth") and display greeting `<strong>` ONLY. Section titles = 600. Card titles = 600.
4. **Serif (Crimson Text):** Content the parent READS — headings, body, card titles, section titles, descriptions, names.
5. **Sans (Inter):** Interface the parent OPERATES — buttons, nav, labels, tags, timestamps, metadata, overlines, action links.
6. **Radius:** 6 / 10 / 16 / 24px only. No arbitrary values.
7. **Transitions:** `transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]` (quick) or `duration-[400ms]` (gentle).
8. **Borders:** `border-border-subtle` (ember-tinted). Never `border-white/5` or similar white-tinted borders.
9. **No decorative images, icons, or custom SVG shapes.** Use emoji as placeholders. Structure and logic only.
10. **Mobile-first.** All layouts start mobile, scale up.

### Card Pattern (canonical)

```
bg-surface-panel rounded-lg p-xl border border-border-subtle shadow-soft
hover:translate-y-[-2px] hover:border-border-medium hover:shadow-warm
transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
```

With ember top-line on hover via `::before` pseudo-element.

### Shadow Utilities

Shadows are defined in `@theme inline` and generate Tailwind utilities:
- `shadow-soft` — card resting state
- `shadow-medium` — elevated panels
- `shadow-warm` — card hover, featured elements
- `shadow-glow` — ember ambient glow

Do NOT use hardcoded `shadow-[0_2px_8px_rgba(...)]` — use the token classes.
**Exception:** Ember accent glows on primary CTAs (`shadow-[0_4px_16px_rgba(217,123,58,0.3)]`) are intentionally inline.

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

### Token value exceptions (WCAG AA)

Two token values deviate from the original design spec for accessibility:
- Dark `--text-muted`: `#726458` (was `#6B5D52`) — 3.15:1 on panel
- Gathering `--text-inverse`: `#FFFFFF` (was `#F5F5F0`) — 4.57:1 on ember

See `docs/hearth-canonical-design-tokens-v1.md` Appendix A for details.

## Accessibility

- **Target:** WCAG AA across all screens in both themes.
- **Modals:** Use `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. Use `useFocusTrap()` hook from `src/hooks/use-focus-trap.ts`.
- **Modal backdrops:** Use `bg-overlay-backdrop` (theme-adaptive). Never `bg-black/50`.
- **Progress indicators:** Use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` zeroes all animation/transition durations in `globals.css`.
- **Nav blur backgrounds:** Use `var(--color-surface-nav-blur)` for frosted nav overlays.

## Architecture Principles — Do Not Violate

1. **Retrospective logging is the core interaction.** Parents capture learning AFTER it happens. Logger is the heartbeat. Forward planning (Weekly Planner, Module Builder) is supported but never primary.
2. **5-minute rule.** Every parent-facing interaction completable in under 5 minutes.
3. **Philosophy-neutral content.** Content is created without pedagogical bias. Pedagogy overlays apply at runtime per family profile. 6 pedagogies: Charlotte Mason, Classical, Montessori, Waldorf/Steiner, Unschooling, Eclectic.
4. **Two-layer AI.** Expensive LLM at write-time only (entry save → Haiku enrichment → snapshot). All screens read from pre-computed Family Intelligence Snapshots in Postgres. No runtime AI calls.
5. **Portfolio is a filtered view,** not an independent data store. No "add to portfolio" button. No sync drift.
6. **Australian Curriculum mapping is backend.** UI shows capability threads and plain-language descriptors only.
7. **No freemium language.** Membership-included content has zero transactional UI.
8. **Content hierarchy:** Pack → Module → Approach → Activity. Four independent Sanity document types.
9. **Sanity = reusable content. Postgres = user/transactional data.** Never store user data in Sanity. Never store portable content in Postgres.

## Key implementation surfaces

Non-obvious locations for features that come up often:

| Feature | Code |
|---|---|
| Pedagogy wizard (onboarding Step 3 + Settings re-run modal) | `src/components/pedagogy/PedagogyWizard.tsx` (component) + `src/components/pedagogy/data.ts` (catalogs + demo insights). Specs in `docs/hearth-pedagogy-engine-spec-v1.md`. |
| Pedagogy language adapter (overlay vocabulary at runtime) | `src/lib/pedagogy/adapter.ts`; tests `adapter.test.ts` (also enforces wizard↔adapter contract). |
| Client analytics (PostHog) | `src/lib/analytics/posthog.ts`. Add new events to the `HearthEvent` union. |
| Server analytics (fires from API routes) | `src/lib/analytics/posthog-server.ts`. Identify on the SAME id as the client (Clerk userId) so funnels join. |
| Admin AI cost dashboard | `/api/admin/analytics/ai-cost/route.ts` + `src/app/(admin)/admin/analytics/_components/AiCostPanel.tsx`. Pricing constants live in the route. |
| Stale-branch audit | `scripts/audit-stale-branches.mjs`. Configurable via `STALE_DAYS`, `PROTECTED`, `BASE` env vars. |

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
- Generating decorative SVGs or custom icons (use emoji)
- Making runtime API calls to Anthropic (write-time only)
- Building philosophy-specific content (always philosophy-neutral)
- Using hardcoded `shadow-[...]` instead of `shadow-soft`/`shadow-warm`/`shadow-medium`/`shadow-glow` token classes
- Using `bg-black/50` for modal backdrops instead of `bg-overlay-backdrop`
- Using hardcoded `rgba(15,13,11,0.85)` for nav blur instead of `var(--color-surface-nav-blur)`
- Creating duplicate child color maps instead of importing `LEARNER_COLOUR_MAP` from `LearnerAvatar.tsx`
- Using `text-white` on colored backgrounds instead of `text-surface-body` or `text-text-inverse` (exception: danger confirm buttons)
- Hardcoding `data-theme="dark"` — theme is managed by the inline script and `useTheme()` hook
