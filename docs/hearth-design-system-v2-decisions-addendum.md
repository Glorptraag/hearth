<!-- Version: 1 | Date: 2026-04-30 | Changes: Addendum to hearth-decisions-log-v1.md. New design system entries S7-S13 covering typography swap, icon library, status palette, motion system, borders, body warmth, and shadow application. -->

# Hearth Decisions Log — Addendum: Design System v2

**To be merged into:** `hearth-decisions-log-v1.md` under the Design System table.
**Date:** 30 April 2026
**Context:** Design system review surfaced font fatigue, ember over-application, status palette synthetic-ness, and total absence of motion language. Decisions below resolve these as a coherent v2 token bump.

---

## New entries — Design System

| # | Decision | Choice | Document of Record | Downstream Dependencies |
|---|----------|--------|-------------------|------------------------|
| S7 | Typography family swap | Crimson Text → **Fraunces** (variable, SOFT axis). Inter → **DM Sans** (variable). Both via Google Fonts / `next/font/google`. | `hearth-canonical-design-tokens-v2.md` (§ Typography) | All screens, all prototypes, Next.js `layout.tsx` font imports, Tailwind config |
| S8 | Icon library | **Lucide** (`lucide-react` for production, CDN script for HTML prototypes). Default weight, 24px grid, single-color stroke. Custom icons (5–10 max, e.g. learner shapes, brand wordmark glyph) produced in Figma later. | `hearth-canonical-design-tokens-v2.md`, this addendum (S8 rationale below) | All UI components, all prototype emoji replacements, Storybook |
| S9 | Status palette desaturation | Sage `#4ADE80` → `#7BBF8A`. Amber `#FBBF24` → `#E0B569`. Rose `#FB7185` → `#D88894`. Blue `#60A5FA` → `#7BA3C9` (now matches `--child-blue`). Violet `#A78BFA` → `#9E8FB8`. | `hearth-canonical-design-tokens-v2.md` (§ Status palette) | All screens with status indicators, badge assessment, weekly planner, notification centre |
| S10 | Motion system | First canonical motion language. Five durations (100/200/300/400/600ms), four easings. Slow-side, soft, no spring overshoot, GPU-only. CSS-first; Framer Motion only for Constellation. | `hearth-motion-system-v1.md`, `hearth-canonical-design-tokens-v2.md` (§ Motion tokens) | All screens, all interactive components, `hearth-motion-utilities-v1.css` |
| S11 | Border colour default | Default borders cream-tinted (`rgba(232,223,212,0.06)`). Ember-tinted borders reserved as signal — active, focused, selected. v1's `--border-subtle: rgba(217,123,58,0.1)` is removed from the system. | `hearth-canonical-design-tokens-v2.md` (§ Borders) | All cards, panels, form fields, navigation |
| S12 | Body surface warmth | `--surface-body` warmed from `#0F0D0B` → `#15110D`. Same depth, more obvious coffee character on OLED. | `hearth-canonical-design-tokens-v2.md` (§ Surfaces) | All screens (page background) |
| S13 | Shadow application | Default cards lose ember halo. Ember in shadows reserved for: Quick Log button, primary CTAs, earned-badge moment, Dashboard hero atmospheric gradient. Default cards lift via surface step + cream-tinted border, no shadow. White inset highlights swapped to cream. | `hearth-canonical-design-tokens-v2.md` (§ Shadow system, § Inset highlights) | All cards across all screens |

---

## Rationale notes

### S7 — why Fraunces + DM Sans

Crimson Text was drawn for printed pages. At 14–16px against `#0F0D0B` on a backlit OLED, its thin strokes lose weight and high thick-to-thin contrast reads anaemic, not literary. Inter is fine but it's the SaaS-default workhorse — it doesn't characterise anything.

Fraunces solves both problems with one family: variable weight (300–700), variable optical sizing (9–144), and a SOFT axis (0–100) for tuning warmth screen-by-screen. Holds its weight on dark surfaces. DM Sans is a degree warmer than Inter (rounder o, friendlier r) and pairs more sympathetically with Fraunces.

Both are Google Fonts, both are free, both work cleanly with `next/font/google`. No licensing, no self-hosting hassle.

### S8 — why Lucide over custom or AI-generated

For a 50+ icon UI kit, consistency is the entire game. AI image generation (Nano Banana, etc.) drifts between prompts; QA cost compounds. A purpose-built designer set takes a designer, weeks, and a budget that doesn't exist yet.

Lucide gives ~1500 icons, MIT-licensed, tree-shakeable per-icon, npm-installable, single-color stroke aesthetic that already matches Mont Blanc minimalism. Default weight is 1.5px — same as the abstract icons already in `hearth-module-builder-v2.jsx`. The 5–10 icons that genuinely don't exist (learner shape glyphs, custom Hearth marks) get drawn in Figma at 15 minutes apiece, perfectly matched to Lucide stroke weight.

This frees AI image generation for what it's actually good at: pack cover illustration, hero art, Constellation domain visual language. UI icons are the wrong tool for that job.

### S9 — why desaturate the status palette

The system colours in v1 were Tailwind 500s lifted off the shelf — tuned for white backgrounds, synthetic against warm coffee surfaces. Meanwhile the per-child colours (`--child-rose`, `--child-blue`) were already painterly and on-brand. Two different design vocabularies on the same screens.

The fix pulls system colours into the per-child dustiness family. Same hue identity, same semantic meaning, less screaming. Notably, blue now equals child-blue exactly — one less colour to maintain.

### S10 — why now

The system shipped 22 prototypes with effectively no motion language. Every screen has hand-tuned `transition: all 0.2s` somewhere; nothing is consistent; nothing carries brand. Motion is one of the strongest ways a digital product communicates personality, and its absence has been a quiet but significant gap.

The right time to add motion is *before* the Next.js build phase, so production components inherit the language from day one rather than retrofitting later.

### S11 — why ember stops being a default

When every card has a faint ember halo and an ember-tinted border, ember stops reading as "action." The eye habituates. The actual ember CTA loses punch because the entire room is already tinted ember.

Pulling ember out of default borders and default shadows restores its role as signal. A card with an ember border now *means something* — selected, focused, active. That's the original design intent; v1 application diluted it.

### S12 — why warm the body

`#0F0D0B` is near-true-black with a whisper of warmth. On OLED phones, true-black goes pure black; the warmth is what we're paying for visually. `#15110D` is six hex points warmer — barely visible side-by-side, but on a phone screen at 5am it tips the room from "device" to "kitchen."

Small change, free win.

### S13 — why white insets are wrong

`inset 0 1px 0 rgba(255, 255, 255, 0.2)` reads as polished plastic or chrome trim — Apple Music Pro aesthetic. The Hearth brand is ceramic-matte, kitchen-bulb-warm. Swapping to cream `rgba(232, 223, 212, 0.05)` is a tonal shift, not a structural one — same gloss/highlight role, but the highlight is now warm light catching ceramic, not fluorescent reflecting plastic.

---

## Migration sequence

1. Land `hearth-canonical-design-tokens-v2.md`.
2. Land `hearth-motion-system-v1.md`.
3. Merge this addendum into `hearth-decisions-log-v1.md`.
4. Produce `hearth-motion-utilities-v1.css`.
5. Produce `hearth-dashboard-dark-v3.html` as reference implementation, applying every v2 token + motion utility.
6. **Eyeball check.** If Dashboard v3 lands (visual feel matches "kitchen at 5am" intent), batch the remaining 21 prototypes piecemeal as they're touched for other reasons.
7. Revise `hearth-ui-kit-v2.md` → v3 once Dashboard v3 is locked.
8. **No big-bang prototype migration.** The cost-benefit doesn't support it; piecemeal updates spread the visual review load.

---

## Update tracker

After Claude Code applies this addendum:

- [ ] `hearth-decisions-log-v1.md` updated with S7–S13 (or replaced with v2 if scope warrants — Claude Code's call).
- [ ] `COMPONENT_REGISTRY.md` updated with new architecture documents.
- [ ] `PROJECT_STATUS.md` updated to reflect design system v2 in flight.
- [ ] Superseded files table notes `hearth-canonical-design-tokens-v1.md` superseded by v2.

---

*Decisions addendum — 30 April 2026. Lock these before any v3 prototype work begins.*
