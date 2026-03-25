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
bg-surface-panel rounded-lg p-xl border border-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.3)]
hover:translate-y-[-2px] hover:border-border-medium hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
```

With ember top-line on hover via `::before` pseudo-element.

### Button Variants

- **Primary:** `bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm`
- **Secondary/Ghost:** `bg-transparent border border-border-subtle text-text-secondary font-sans`
- **Danger:** `bg-red-900/20 text-red-400 border border-red-900/30`

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
