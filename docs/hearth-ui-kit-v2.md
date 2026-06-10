# Hearth UI Kit — Canonical Component Reference v1

> **⚠️ PARTIALLY OUTDATED — v3 pending Dashboard Dark v3 rebuild.** This document still references v1 design fundamentals: deleted fonts (Crimson Text, Inter), v1 status hex values (`#4ADE80`, `#FBBF24`, etc.), v1 token names, and v1 shadow tokens. For tokens, fonts, shadows, and color values consult [hearth-canonical-design-tokens-v2.md](hearth-canonical-design-tokens-v2.md) + [hearth-design-system-v2.1-addendum.md](hearth-design-system-v2.1-addendum.md). Component patterns and anatomy described here remain useful as structural reference, but **do not copy color/font/shadow values verbatim** — translate through v2 tokens.

> **Date:** 18 March 2026  
> **Replaces:** `Hearth_LMS_UI_Kit.html` (retired — zero classes consumed by any prototype)  
> **Companion:** `hearth-canonical-design-tokens-v1.md` (full token spec with hex values and Tailwind mappings) — **archived; use v2**  
> **Source of truth:** `hearth-dashboard-dark.html` / `hearth-dashboard-evening.html`  
> **Role:** This is the build reference. Every component in the Next.js app conforms to the patterns described here.

---

## Design Philosophy — UX Rules

These aren't style preferences. They're product decisions baked into the visual system.

### The 5-Minute Rule
Every parent-facing interaction completes in under 5 minutes. This means: generous tap targets (44px minimum), minimal nesting, visible completion state, no multi-step modals where a single panel would do.

### Retrospective-First
The platform reveals structure in what already happened. Forward-planning tools exist but are secondary. The primary CTA on any hub screen is always "Log what you did" — never "Plan what to do."

### Serif for Memory, Sans for Action
Crimson Text (serif) is used for everything the parent reads as educational narrative: headings, descriptions, child names, Hearth's voice. Inter (sans) is used for everything the parent operates: buttons, labels, timestamps, tags, nav chrome. This isn't arbitrary — serif signals "this is worth reading slowly," sans signals "this is a control."

### Ember is Earned
`--ember` (#D97B3A) is reserved for primary actions and active states. It never appears as decoration, never colors body text, never fills a card background. When the parent sees ember, it means "tap here" or "this is where you are." Overuse dilutes the signal.

### Sage Means Growth
`--sage` (#4ADE80) marks positive states: progress, completion, growth milestones, encouraging prompts. It's the platform's way of saying "look what's happening." Not used for primary actions — that's ember's job.

### Half-Complete is the Hook
Notifications and nudges revolve around half-finished states: "You were partway through logging that creek walk — pick up where you left off?" The UI shows completeness meters, draft indicators, and "continue" CTAs. Never prescriptive "you should do X" reminders.

### Children are Shapes, Not Photos
Each child is represented by an abstract shape in their assigned color (Emma = rose, Liam = blue, Oliver = sage). No photos, no comparison anxiety. The shapes are consistent across all screens.

### Secondhand Delight
Badges are awarded through the parent's device. The parent discovers the badge, then shares the moment with the child. The UI is designed for the parent to hold the device and show the child — generous celebration screens, not small notifications.

### No Freemium Framing
Membership-included content carries zero transactional language. No "$0", no "Free" badges, no "Included in your plan" callouts. Pricing only appears for premium marketplace packs.

### Philosophy-Neutral at Rest
Content is created without pedagogical bias. Pedagogy overlays (Charlotte Mason, Classical, Montessori, etc.) apply at runtime per family profile. The UI never shows philosophy-specific language in content creation tools.

---

## Dual Theme Architecture

Hearth has two emotional temperature modes sharing the same structural tokens:

**Dark mode (default):** Mont Blanc dark coffee. Focused, everyday use. Deep surfaces, cream text, ember-tinted borders.

**Gathering mode:** Warm parchment. Family review, celebration, end-of-day sharing. Light surfaces, brown text, brown-tinted borders.

**When the parent encounters each:** she normally never chooses — themes switch automatically by time of day (Gathering 6am–6pm, Dark 6pm–6am, managed by `useTheme()` in `src/hooks/use-theme.ts`). The intent: daytime use is bright-room, kids-around, glanceable (Gathering); the canonical end-of-day logging session — tea, couch, the founding brief's relief moment — gets the warm low-light register (Dark). A manual override exists (persisted to `localStorage` key `hearth-theme`) for parents whose rhythm doesn't match the clock, and it sticks until cleared. Design implication: every screen must hold up in both themes, because *which* theme a parent sees is a function of when her day allows her to open the app, not of which screen she's on.

In Next.js: `data-theme="dark"` (default) or `data-theme="gathering"` on `<html>`. All color tokens are CSS custom properties that swap between themes. Structural tokens (spacing, radius, typography, transitions) are identical in both themes.

See `hearth-canonical-design-tokens-v1.md` §2 for complete color definitions in both themes.

---

## Token Quick Reference

Full spec with hex values, Tailwind mappings, and migration notes is in `hearth-canonical-design-tokens-v1.md`. This section is the shorthand.

### Surfaces (dark mode)
```
--surface-body:    #0F0D0B   Page background
--surface-panel:   #1A1612   Sidebar, card surface
--surface-raised:  #252117   Elevated cards, interactive panels
--surface-hover:   #2D2621   Hover states, highest elevation
```

### Text
```
--text-primary:    #E8DFD4   Headings, titles
--text-secondary:  #B0A094   Body, descriptions
--text-muted:      #6B5D52   Timestamps, metadata
--text-inverse:    #0F0D0B   On ember/sage buttons
```

### Accents
```
--ember:           #D97B3A   Primary actions, active states
--ember-hover:     #E88F4E   Hover
--ember-glow:      rgba(217,123,58,0.15)   Ambient glow
--ember-strong:    rgba(217,123,58,0.25)   Focus rings
--sage:            #4ADE80   Growth, success, positive
--sage-muted:      #22C55E   Borders, accents
```

### Spacing (8px base)
```
xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px | 3xl: 64px | 4xl: 96px
```

### Border Radius
```
sm: 6px | md: 10px | lg: 16px | xl: 24px | full: 9999px
```

### Borders
```
--border-subtle:   rgba(217,123,58,0.1)    Card/panel borders (ember-tinted)
--border-medium:   rgba(217,123,58,0.2)    Active/emphasis borders
```

### Shadows
```
--shadow-soft:     0 2px 8px rgba(0,0,0,0.3)
--shadow-medium:   0 4px 16px rgba(0,0,0,0.4)
--shadow-warm:     0 8px 32px rgba(0,0,0,0.5), 0 0 60px rgba(217,123,58,0.08)
--shadow-glow:     0 0 20px rgba(217,123,58,0.15)
```

### Transitions
```
--transition-quick:  200ms cubic-bezier(0.4, 0, 0.2, 1)   Hovers, micro-interactions
--transition-gentle: 400ms cubic-bezier(0.4, 0, 0.2, 1)   Cards, panels
```

---

## Components

### Card

The foundational surface for all content display.

**Anatomy:**
```
background:    var(--surface-panel)
border:        1px solid var(--border-subtle)
border-radius: var(--radius-lg)          16px
padding:       var(--space-xl)           32px
box-shadow:    var(--shadow-soft)
transition:    all var(--transition-gentle)
overflow:      hidden
position:      relative
```

**Hover (interactive cards only):**
```
transform:     translateY(-2px)
border-color:  var(--border-medium)
box-shadow:    var(--shadow-warm)
+ ember top-line gradient fades in via ::before pseudo-element
```

**Ember top-line effect (the Hearth signature):**
```css
.card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--ember), transparent);
  opacity: 0;
  transition: opacity var(--transition-gentle);
}
.card:hover::before { opacity: 1; }
```

**Size variants:**

| Variant | Padding | Radius | Background | Use |
|---|---|---|---|---|
| Comfortable | `--space-xl` (32px) | `--radius-lg` | `--surface-panel` | Content cards, nav cards, hero panels |
| Stat | `--space-xl` (32px) | `--radius-lg` | `--surface-raised` | Summary panels (lighter bg for distinction) |
| Compact | `--space-md` (16px) | `--radius-md` | `--surface-panel` | List items, settings rows |
| Dense | `xs`/`sm` | `--radius-sm` | `--surface-raised` | Tags, pills, mini-badges |
| Ghost | `--space-xl` (32px) | `--radius-lg` | transparent | Dashed-border "add new" placeholder |

**Ghost card (add-new):**
```
background: transparent
border: 1px dashed var(--text-muted)
:hover → border-color: var(--ember); background: var(--ember-glow)
```

### Card Interior Text Rules

| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Card title | Serif | 1.1rem | 600 | `--text-primary` |
| Card body | Serif | 0.95rem | 400 | `--text-secondary` |
| Card metadata | Sans | 0.75rem | 400–500 | `--text-muted` |
| Card tag/pill | Sans | 0.7rem | 500 | `--text-secondary` |

---

### Button

**Primary (ember):**
```
background:    var(--ember)
color:         var(--surface-body)
border:        none
border-radius: var(--radius-md)          10px
font:          var(--font-sans), 0.95rem, 600
padding:       var(--space-lg)           24px (lg size)
box-shadow:    0 4px 16px rgba(217,123,58,0.3), var(--shadow-glow)
:hover → bg: var(--ember-hover), translateY(-2px), stronger shadow
```

**Secondary (subtle surface):**
```
background:    var(--surface-raised)
color:         var(--text-primary)
border:        1px solid var(--border-subtle)
border-radius: var(--radius-md)
font:          var(--font-sans), 0.875rem, 500
:hover → bg: var(--surface-hover), translateY(-1px)
```

**Ghost (outlined):**
```
background:    transparent
color:         var(--ember)
border:        1px solid var(--ember)
border-radius: var(--radius-sm)          6px
font:          var(--font-sans), 0.8rem, 600
:hover → bg: var(--ember-glow)
```

**Link (text-only action):**
```
color:         var(--ember) or var(--sage)
font:          var(--font-sans), 0.8rem, 500
text-decoration: none
:hover → color: var(--ember-hover) or underline
```

**Danger (destructive):**
```
Same structure as ghost, using red instead of ember
```

**Size variants:**

| Size | Padding | Font-size |
|---|---|---|
| `sm` | 8px 16px | 0.8rem (13px) |
| `md` | 12px 24px | 0.875rem (14px) |
| `lg` | 24px (all) or 16px 32px | 0.95rem (15px) |
| `full` | Same as lg + width: 100% | 0.95rem |

---

### Section Header

```
Container: flex, space-between, align-center
margin-bottom: var(--space-lg)

Title:   serif, 1.1rem, 600, --text-primary
Action:  sans, 0.8rem, 500, --ember (:hover → --ember-hover)
```

---

### Nav Item (sidebar)

```
Container: flex, align-center, gap: --space-md, padding: --space-md
border-radius: var(--radius-md)
font:    sans, 0.9rem, 500, --text-secondary
border:  1px solid transparent
transition: var(--transition-quick)

:hover  → bg: var(--ember-glow), color: --text-primary, border: --border-subtle
:active → bg: var(--surface-raised), color: var(--ember), border: --border-medium, shadow: --shadow-soft

Icon: 18×18px, opacity 0.6 → 1 on hover/active
```

---

### Nav Label (overline)

```
font:    sans, 0.7rem, 600, --text-muted
text-transform: uppercase
letter-spacing: 0.08em
margin-bottom: var(--space-md)
```

---

### Pill / Mini-Badge

```
Container: inline-flex, align-center, gap: --space-xs
padding: var(--space-xs) var(--space-sm)     4px 8px
background: var(--surface-raised)
border-radius: var(--radius-sm)              6px
border: 1px solid var(--border-subtle)
font: sans, 0.7rem, 500, --text-secondary
Icon inside: 10px, color: var(--ember)
```

---

### Hearth Voice / AI Insight Card

The platform's personified voice. Always italic serif, always uses "I noticed" language.

```
background:    linear-gradient(135deg, var(--surface-raised), var(--surface-panel))
border:        1px solid var(--border-medium)
border-radius: var(--radius-lg)
padding:       var(--space-xl)
box-shadow:    inset 0 1px 0 rgba(255,255,255,0.03)

+ ember gradient line across top (::before):
  height: 2px, linear-gradient(90deg, transparent, var(--ember), transparent), opacity: 0.6

Voice icon: 32px circle, bg: var(--ember-glow), icon: 16px ember
Text:       serif, 0.95rem, 400, italic, --text-secondary, line-height: 1.65
Attribution: sans, 0.7rem, 400, --text-muted, uppercase, letter-spacing: 0.05em
```

---

### Gentle Prompt (sage nudge)

For encouragement and growth prompts. Never prescriptive — observational tone.

```
padding:       var(--space-lg)
background:    rgba(74, 222, 128, 0.08)       sage tint
border-radius: var(--radius-md)
border-left:   3px solid var(--sage-muted)

Text:   serif, 0.9rem, 400, --text-secondary, line-height: 1.6
Action: sans, 0.8rem, 500, --sage, inline-flex with icon
```

---

### Child Selector (tab strip)

Horizontal tab strip for switching per-child views. Each tab shows the child's abstract shape in their assigned color.

```
Container: flex, gap: --space-sm, overflow-x: auto
Tab:       flex, align-center, gap: --space-sm
           padding: --space-sm --space-md
           border-radius: --radius-full (pill shape)
           border: 1px solid transparent
           font: sans, 0.85rem, 500

:inactive → bg: transparent, color: --text-secondary
:active   → bg: child-color at 0.12 opacity, border: child-color at 0.3, color: child-color
```

Child colors: Emma → `--child-rose` (#F9A8D4), Liam → `--child-blue` (#60A5FA), Oliver → `--child-sage` (#4ADE80).

---

### Modal Overlay

```
Backdrop: fixed, inset 0, bg: rgba(0,0,0,0.6), backdrop-filter: blur(4px)
          display: flex, align-items: flex-end (mobile) or center (desktop)
          z-index: 100

Content:  bg: var(--surface-panel)
          border-radius: var(--radius-xl) var(--radius-xl) 0 0 (mobile)
                      or var(--radius-xl) (desktop centered)
          max-height: 85vh, overflow-y: auto
          padding: var(--space-xl)
          animation: slide-up 300ms ease

Close:    absolute top-right, 44×44px tap target, --text-muted, :hover → --text-primary
```

---

### Bottom Sheet

```
Same backdrop as Modal.
Content:  fixed bottom, full width
          bg: var(--surface-panel)
          border-radius: var(--radius-xl) var(--radius-xl) 0 0
          max-height: 60vh
          padding: var(--space-xl)
          animation: slide-up 300ms ease

Drag handle: centered, 40px × 4px, --surface-hover, radius-full, margin-bottom: --space-md
```

---

### Back Header (sub-screen navigation)

```
Container: flex, align-center, gap: --space-sm
           padding: var(--space-md) 0
           margin-bottom: var(--space-lg)

Back button: flex, align-center, gap: --space-xs
             font: sans, 0.85rem, 500, --text-secondary
             :hover → --text-primary
             Icon: 16px chevron-left

Screen title: serif, 1.1rem, 600, --text-primary (optional, right side or inline)
Right action: sans, 0.8rem, 500, --ember (optional)
```

---

### Toast Notification

```
position: fixed, bottom: --space-xl, left: 50%, transform: translateX(-50%)
padding: --space-md --space-lg
background: var(--surface-raised)
border: 1px solid var(--border-subtle)
border-radius: var(--radius-md)
box-shadow: var(--shadow-medium)
font: sans, 0.85rem, 500, --text-primary
z-index: 200
animation: fadeInUp 200ms, auto-dismiss after 3s

Success variant: border-left: 3px solid var(--sage)
Warning variant: border-left: 3px solid var(--ember)
```

---

### Empty State

```
Container: flex column, align-center, text-align center
           padding: var(--space-3xl) var(--space-xl)

Emoji:     font-size: 48px, margin-bottom: var(--space-lg)
Heading:   serif, 1.1rem, 600, --text-primary, margin-bottom: --space-sm
Body:      serif, 0.9rem, 400, --text-secondary, max-width: 280px, line-height: 1.6
CTA:       btn-primary (sm) or btn-link, margin-top: --space-lg
```

---

### Accordion Section

```
Header:  flex, space-between, align-center
         padding: var(--space-lg)
         cursor: pointer
         transition: var(--transition-quick)
         border-bottom: 1px solid var(--border-subtle)

Title:   serif, 1rem, 600, --text-primary
Chevron: 16px, --text-muted, transition: transform var(--transition-quick)
         :open → rotate(180deg)

Content: padding: var(--space-lg)
         animation: expand 200ms ease
```

---

### Progress Indicators

**Horizontal bar:**
```
Track:   height: 4px, bg: var(--surface-raised), radius: 2px
Fill:    bg: var(--sage) or var(--ember), radius: 2px, transition: width var(--transition-gentle)
```

**Completeness meter (Logger):**
```
Same as horizontal bar but height: 6px
Label:  sans, 0.75rem, 500, --text-muted, above bar
Threshold marker at 50%: small dot or line
```

**Circular progress ring:**
```
Background ring: stroke: var(--surface-raised)
Progress ring:   stroke: var(--ember) or var(--sage)
                 conic-gradient approach for filled variant
Center text:     sans, 0.875rem, 600, --text-primary
```

---

### Subject Tag Pill

Color-coded by subject area. Uses inline background + text color.

```
padding: 2px 8px
border-radius: var(--radius-sm)
font: sans, 0.7rem, 600
```

Subject colors (dark mode):
```
Science   → text: var(--sage), bg: rgba(74,222,128,0.12)
English   → text: var(--child-blue), bg: rgba(96,165,250,0.12)
Maths     → text: var(--ember), bg: var(--ember-glow)
HASS      → text: #FBBF24, bg: rgba(251,191,36,0.12)
Arts      → text: var(--child-violet), bg: rgba(167,139,250,0.12)
HPE       → text: var(--child-rose), bg: rgba(249,168,212,0.12)
```

---

### Tap Target Minimums

All interactive elements must meet these minimums per the 5-minute rule:

| Element | Minimum size |
|---|---|
| Buttons | 44px height |
| Nav items | 44px height |
| Checkbox/toggle tap area | 44×44px |
| Close/dismiss buttons | 44×44px |
| Card tap area | Full card surface |
| Swipe-to-dismiss | 44px row height |

---

### Icon Placeholder Convention

All icons are currently emoji placeholders. During the icon design phase, they'll be replaced with SVG line icons (24px grid, single-color stroke, 1.5px stroke-width matching the Dashboard Dark nav icon style).

Until then: emoji in UI is fine. No generated images, shapes, or decorative SVG in prototypes.

---

## What This Kit Does NOT Define

- **Pedagogy-specific content or labels.** Philosophy overlays are runtime concerns handled by the Pedagogy Engine.
- **Curriculum mapping UI.** Australian Curriculum V9 mapping is a backend concern — UI shows capability threads and plain-language descriptors only.
- **Learner-facing interfaces.** This kit is for the parent facilitator experience only. Student-facing views are Phase 2.
- **Content structure.** Pack → Module → Approach → Activity hierarchy is defined in `hearth-hcms-strategy-v1.md`, not here.

---

*UI Kit v1 — 18 March 2026. Source of truth: Dashboard Dark/Evening pair. Companion: `hearth-canonical-design-tokens-v1.md`.*
