# Hearth UI Token Deep Audit — v1

> **Date:** 18 March 2026  
> **Scope:** 14 core production screens (excludes Badge Assessment + Complete Demo as known outliers using deprecated `--accent` convention)  
> **Purpose:** Extract the actual token values, class names, and patterns in use — then identify where they diverge and what the canonical value should be for the Tailwind build.

---

## 1. SURFACE / BACKGROUND COLORS

The background hierarchy is mostly consistent but has naming collisions.

### Hex values (consistent across all files)

| Hex | Purpose |
|---|---|
| `#0A0806` | Deepest dark — page body on some screens |
| `#0F0D0B` | Primary page body background on most screens |
| `#1A1612` | Card/panel surface (the main "container" color) |
| `#252117` | Elevated surface, lighter cards, interactive elements |
| `#2D2621` | Highest elevation — hover states, raised panels |

### Variable name collision

Every file uses the same hex values, but maps them to different variable names:

| Hex | Dashboard, Report, Capabilities, Module Exp, Project Exp, Family Settings, Our Story | Portfolio, Logger, Planner, Activity Discovery, Marketplace | Learner Profile | Notification Centre |
|---|---|---|---|---|
| `#0A0806` | *(not defined)* | `--deep-coffee` | `--coffee-deep` | `--deep-coffee` |
| `#0F0D0B` | `--deep-coffee` | `--coffee-dark` | `--coffee-dark` | `--coffee-dark` |
| `#1A1612` | `--coffee-mid` | `--coffee-mid` | `--coffee-mid` | `--coffee-mid` |
| `#252117` | `--coffee-light` | `--coffee-light` | `--coffee-light` | ⚠️ *not defined* |
| `#2D2621` | `--surface-elevated` | `--surface-elevated` | `--surface` | `--coffee-light` ⚠️ AND `--surface-elevated` |

**Problems:**
- Notification Centre maps `--coffee-light` to `#2D2621` instead of `#252117` — so `border: 1px solid var(--coffee-light)` renders completely differently on that screen
- Learner Profile uses `--coffee-deep` instead of `--deep-coffee`, `--surface-raised` instead of `--surface-elevated`, and adds a bare `--surface` variable
- Half the screens define a 5-level hierarchy (with `#0A0806`), the other half only define 4 levels

### Canonical for build

```
--coffee-darkest: #0A0806     // page body
--coffee-dark:    #0F0D0B     // recessed panels, insets
--coffee-mid:     #1A1612     // card surfaces (primary container)
--coffee-light:   #252117     // elevated cards, interactive panels
--surface:        #2D2621     // hover states, highest elevation
```

---

## 2. BORDER VARIABLES

Three different `--border-subtle` definitions exist:

| Definition | Files |
|---|---|
| `rgba(217, 123, 58, 0.1)` — ember-tinted | Dashboard, Report, Capabilities, Module Exp, Project Exp, Family Settings, Our Story |
| `rgba(255, 255, 255, 0.06)` — white-tinted | Portfolio, Logger, Activity Discovery, Marketplace |
| `rgba(45, 38, 33, 0.5)` — dark brown-tinted | Notification Centre |

The `--border` (non-subtle) variable also splits:

| Definition | Files |
|---|---|
| `#2D2621` — solid hex | Planner, Activity Discovery, Marketplace |
| `rgba(255, 255, 255, 0.06)` | Learner Profile |
| `rgba(45, 38, 33, 0.8)` | Notification Centre |

Additional border variants appear per-screen: `--border-medium`, `--border-warm`, `--border-strong`, `--border-ember` — each defined locally.

**Impact:** Card borders look visibly different across screens. The ember-tinted borders have a warm glow; the white-tinted ones are cooler and more neutral; the Notification Centre borders are nearly invisible.

### Canonical for build

```
--border:        rgba(255, 255, 255, 0.06)   // default card/element border
--border-medium: rgba(255, 255, 255, 0.12)   // emphasised borders
--border-ember:  rgba(217, 123, 58, 0.15)    // active/selected states
--border-strong: rgba(217, 123, 58, 0.3)     // focus rings, strong emphasis
```

Decision needed: warm (ember) or cool (white) as the default card border? The ember tint is more distinctive to the brand. The white tint is more neutral/modern. I'd recommend the ember tint (`rgba(217, 123, 58, 0.1)`) as the default since it reinforces the coffee aesthetic, with white-tint reserved for study-mode contexts if that distinction resurfaces.

---

## 3. TEXT COLORS

**Consistent across all 14 screens** — this is the one token set that's already aligned.

```
--text-primary:   #E8DFD4   // headings, titles, high-emphasis content
--text-secondary: #9B8B7E   // body text, descriptions
--text-muted:     #6B5D52   // timestamps, metadata, disabled text
--text-inverse:   #0F0D0B   // text on ember/sage buttons (defined in 7/14 screens)
```

No action needed. Add `--text-inverse` to the remaining 7 screens during build.

---

## 4. CARD ANATOMY

### Background

All cards use `var(--coffee-mid)` (`#1A1612`) as the primary card background. Exceptions:
- Logger `.activity-type-card` uses `var(--coffee-dark)` (recessed/inset appearance)
- Logger `.insight-card` and Planner `.module-card` use `var(--coffee-light)` (elevated appearance)
- Family Settings `.learner-card` and `.philosophy-card` use `var(--deep-coffee)` (recessed)

### Border

All cards use `1px solid` — but split between `var(--border-subtle)` and `var(--border)` (see §2 above for the underlying value divergence).

### Border-radius

| Value | Screens using it for main cards |
|---|---|
| `var(--radius-lg)` (16px) | Dashboard, Module Experience, Activity Discovery, Marketplace, Project Experience, Our Story Hub |
| `var(--radius-md)` (10px) | Report (sample cards), Family Settings, Notification Centre, Logger (activity types) |
| Hardcoded `10px` | Capabilities |
| Hardcoded `6px` | Planner (module cards — intentionally compact) |

**Pattern:** Large standalone cards get `radius-lg`. Smaller inline cards, list items, and settings cards get `radius-md`. The Planner's `6px` is justified by the draggable card's compact form factor — it should map to `--radius-sm`.

### Padding

This is where it gets messy:

| Padding | Screens |
|---|---|
| `var(--space-xl)` (32px) | Dashboard moment cards, Module Experience cards, Our Story nav cards |
| `var(--space-lg)` (24px) | Activity Discovery module cards, Project Experience stage cards, Project Experience detail cards, Family Settings learner/philosophy cards, Report sample cards, Notification cards |
| `var(--space-md)` (16px) | Portfolio timeline cards (compact) |
| Hardcoded `18px` | Logger insight cards |
| Hardcoded `16px 20px` | Capabilities opening cards |
| Hardcoded `14px 10px` | Logger activity-type cards |
| Hardcoded `10px 16px` | Planner insight cards |
| Hardcoded `8px 10px` | Planner module cards |

**Pattern:** Two standard card sizes are emerging:
- **Comfortable card** (`--space-xl` / 32px padding) — hero/feature cards on hub screens
- **Standard card** (`--space-lg` / 24px padding) — content list cards, settings panels
- **Compact card** (`--space-md` / 16px padding) — timeline items, thumbnails
- **Dense card** (`--space-sm` / 8px padding) — draggable items, inline chips

### Box-shadow

Only some cards define shadows. Dashboard and Module Experience use `var(--shadow-soft)`. Most other cards rely on border alone, no shadow.

### Canonical card anatomy for build

```
Card.comfortable  → padding: 32px, radius: 16px, bg: coffee-mid, border: 1px solid border-subtle, shadow: shadow-soft
Card.standard     → padding: 24px, radius: 16px, bg: coffee-mid, border: 1px solid border-subtle
Card.compact      → padding: 16px, radius: 10px, bg: coffee-mid, border: 1px solid border-subtle
Card.dense        → padding: 8px 12px, radius: 6px, bg: coffee-light, border: 1px solid border
```

---

## 5. TYPOGRAPHY

### Font family usage

Broadly consistent across core screens:

| Role | Font | Convention |
|---|---|---|
| Page titles, section headings, card titles, body descriptions | `var(--font-serif)` (Crimson Text) | Used for "content that should be remembered" |
| Buttons, labels, metadata, timestamps, tags, interface chrome | `var(--font-sans)` (Inter) | Used for functional/interactive text |

**One exception:** Family Settings uses `var(--font-sans)` for `.section-title`, breaking the serif-for-headings rule. This should be corrected.

Notification Centre `.notif-title` also omits `font-family` (inherits from body, which is sans-serif by default in that file — inconsistent).

### Font weight usage

All screens use the same four weights, applied to similar roles:

| Weight | Role |
|---|---|
| 700 | Page-level titles only (Activity Discovery, Marketplace, Report section titles) |
| 600 | Card titles, section headings, button labels, nav items — the workhorse weight |
| 500 | Secondary buttons, metadata labels, filter tabs |
| 400 | Body text, descriptions, form inputs |

Planner also uses 300 (extra-light) for time labels — a one-off that should use 400.

**Key decision:** Report uses 700 for `.section-title` while Dashboard uses 600 for the same semantic role. The majority pattern is 600 for section-level headings and 700 only for the largest page title. Recommend standardising on this.

### Font size — the real problem

No two screens share a type scale. Here's what each role actually uses across screens:

**Page title** (largest text on screen):
- Dashboard: `2.25rem`
- Activity Discovery + Marketplace: `clamp(1.75rem, 4vw, 2.25rem)` 
- Portfolio: `1.35rem`
- Report: `2.2rem` (page) / `1.3rem` (section)
- Our Story Hub: `2.5rem`
- Logger: `1.125rem` (header-title — this screen doesn't have a large page title)
- Family Settings: `1.8rem`

**Card title** (heading inside a card):
- Dashboard: `1.1rem` (serif, 600)
- Portfolio: `0.95rem` (serif, 600)
- Activity Discovery: `1.15rem` (serif, 600)
- Module Experience: `1.0625rem` (serif, 600)
- Project Experience: `1.125rem` (serif, 600)
- Family Settings (learner name): `1.15rem` (serif, 600)
- Planner: `12px` (serif, 600)
- Notification Centre: `14px` (sans, 600) ⚠️

**Body/description text:**
- Dashboard: `0.95rem` (serif, secondary color)
- Portfolio: `0.85rem` (no family specified, secondary color)
- Activity Discovery: `13px` (no family, secondary color)
- Notification Centre: `14px` (serif, secondary color)

**Metadata/timestamp:**
- Dashboard: `0.8rem` (sans, muted color)
- Portfolio: `0.75rem` (no family, muted color)
- Planner: `10px`–`11px` (px-based)

### Canonical type scale for build

```
--text-page-title:   1.75rem  (28px)  serif  700  — screen-level headings
--text-section-title: 1.125rem (18px)  serif  600  — section headings
--text-card-title:   1rem     (16px)  serif  600  — card/item headings
--text-body:         0.875rem (14px)  serif  400  — descriptions, prose
--text-label:        0.75rem  (12px)  sans   600  — button labels, tag text
--text-caption:      0.75rem  (12px)  sans   400  — timestamps, metadata
--text-micro:        0.625rem (10px)  sans   500  — badge pills, tiny annotations
```

For responsive page titles, the `clamp()` pattern from Activity Discovery is solid: `clamp(1.5rem, 4vw, 1.75rem)`.

---

## 6. BUTTONS

### The problem

10 of 14 core screens don't define `.btn-primary` at all. They create bespoke class names per screen: `.quick-log-btn` (Dashboard), `.save-btn` (Logger), `.export-btn` (Portfolio), `.focus-btn` (Report), `.featured-action` (Marketplace), `.pack-action` (Marketplace), `.filter-btn` (Marketplace), `.notif-action` (Notification Centre), `.complete-toggle` (Planner), `.quiet-day-btn` (Notification Centre).

The 4 screens that do define `.btn-primary` (Module Experience, Activity Discovery, Project Experience, Family Settings) each define it differently:

| Property | Module Exp | Activity Discovery | Project Exp | Family Settings |
|---|---|---|---|---|
| padding | `--space-md --space-xl` (16px 32px) | `12px --space-lg` (12px 24px) | `12px 28px` | *(inherits from .btn)* |
| border-radius | `--radius-md` (10px) | `--radius-sm` (6px) | `--radius-md` (10px) | *(inherits)* |
| font-size | `0.9375rem` (15px) | `14px` | `0.875rem` (14px) | *(inherits)* |
| font-family | `--font-sans` | *(not set)* | `--font-sans` | *(inherits)* |
| color | *(not set — inherits)* | `--text-inverse` | `--deep-coffee` | `--deep-coffee` |

### What they agree on

- **Background:** ember (`--ember-orange` or `--ember`)
- **Font weight:** 600
- **Hover:** background changes to `--ember-hover`, adds `translateY(-1px)` lift
- **Border:** none
- **Box-shadow:** some variant of `0 4px 12px rgba(217, 123, 58, 0.3)`

### Secondary button patterns

Similarly fragmented. Some screens use a bordered ghost style (Marketplace `.featured-action`: `border: 1px solid var(--ember); color: var(--ember); background: transparent`). Others use a filled background (Module Experience `.btn-secondary`: `background: var(--coffee-light)`).

### Canonical button system for build

**Primary (ember):**
```
bg: var(--ember)
color: var(--coffee-darkest)
font: sans, 600, 14px
padding: 10px 24px
radius: 10px (--radius-md)
border: none
shadow: 0 4px 12px rgba(217, 123, 58, 0.3)
hover: bg → --ember-hover, translateY(-1px)
```

**Secondary (subtle):**
```
bg: var(--coffee-light)
color: var(--text-primary)
font: sans, 500, 14px
padding: 10px 24px
radius: 10px (--radius-md)
border: 1px solid var(--border)
hover: bg → --surface, translateY(-1px)
```

**Ghost (outline):**
```
bg: transparent
color: var(--ember)
font: sans, 600, 13px
padding: 8px 16px
radius: 6px (--radius-sm)
border: 1px solid var(--ember)
hover: bg → rgba(217, 123, 58, 0.08)
```

**Danger (destructive):**
```
bg: transparent
color: var(--red)
font: sans, 600, 13px
padding: 8px 16px
radius: 6px (--radius-sm)
border: 1px solid var(--red)
```

**Size variants:**
- `sm`: padding 6px 14px, font-size 12px
- `md`: padding 10px 24px, font-size 14px (default)
- `lg`: padding 14px 32px, font-size 15px
- `full`: width 100%, padding 14px (Dashboard quick-log pattern)

---

## 7. BORDER-RADIUS

### Values actually in use (post-cleanup)

| Token | Value | Where used |
|---|---|---|
| `--radius-sm` | 6px | Small pills, tags, filter buttons, compact cards (Planner), chip borders |
| `--radius-md` | 10px | Buttons, inputs, settings cards, notification cards, list items |
| `--radius-lg` | 16px | Main content cards, modals, panels, nav cards |
| `--radius-xl` | 20px | *(proposed)* Large feature cards, bottom sheets — currently hardcoded as `20px` in 7 screens |
| `--radius-full` | 9999px | Pills, avatar circles, toggle handles |

Rogue values to eliminate: `3px` → `--radius-sm`, `8px` → `--radius-sm` or `--radius-md`, `9px` → `--radius-md`, `12px` → `--radius-md`, `14px` → `--radius-lg`, `24px` → `--radius-xl`.

---

## 8. SHADOWS

Mostly consistent where defined. 6 of 14 screens define shadow tokens:

```
--shadow-soft:   0 2px 8px rgba(0, 0, 0, 0.3)        // default card shadow
--shadow-medium: 0 4px 16px rgba(0, 0, 0, 0.4)        // hover / emphasis
--shadow-warm:   0 8px 32px rgba(0, 0, 0, 0.5),
                 0 0 60px rgba(217, 123, 58, 0.08)     // hero cards, modals
--shadow-glow:   0 0 20px rgba(217, 123, 58, 0.15)     // ember glow effect
```

8 screens don't define shadow variables at all — they either use inline shadows or no shadows. This is fine; most cards rely on border rather than shadow for definition on dark backgrounds.

---

## 9. TRANSITIONS

Three naming conventions:

| Convention | Screens | Values |
|---|---|---|
| `--transition-gentle` + `--transition-quick` | Dashboard, Report, Module Exp, Family Settings | 400ms / 200ms, `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--transition` + `--transition-slow` | Logger | 250ms / 400ms, same bezier |
| `--transition` (single) | Notification Centre | `0.2s ease` ⚠️ different easing |
| No transition vars (inline values) | Marketplace, Activity Discovery, Planner, Portfolio, Capabilities, Learner Profile, Our Story | Various: `0.2s`, `0.25s`, `0.3s` |

### Canonical for build

```
--transition-quick:  150ms cubic-bezier(0.4, 0, 0.2, 1)   // micro-interactions, hovers
--transition:        250ms cubic-bezier(0.4, 0, 0.2, 1)   // standard (default)
--transition-gentle: 400ms cubic-bezier(0.4, 0, 0.2, 1)   // panels, page transitions
```

All three use the same easing curve. This matches Tailwind's default `ease-in-out` behavior closely enough.

---

## 10. HEADING / TITLE RULES

Based on what the screens actually do, here's the implicit hierarchy:

| Semantic role | Font | Weight | Size (proposed canonical) | Color | Example |
|---|---|---|---|---|---|
| Screen title | Serif | 700 | 1.75rem (28px) | `--text-primary` | "Your Hearth", "Explore Activities" |
| Section heading | Serif | 600 | 1.125rem (18px) | `--text-primary` | "This Week", "Recent Moments" |
| Card title | Serif | 600 | 1rem (16px) | `--text-primary` | Module name, notification title |
| Card body | Serif | 400 | 0.875rem (14px) | `--text-secondary` | Description, prose content |
| Label / tag | Sans | 600 | 0.75rem (12px) | `--text-muted` or contextual | Subject pills, filter labels |
| Caption | Sans | 400 | 0.75rem (12px) | `--text-muted` | Timestamps, "3 days ago" |
| Micro | Sans | 500 | 0.625rem (10px) | varies | Badge pill text, counts |

**Font family rule:** Serif for anything the parent reads as educational content. Sans for anything the parent operates as interface. The only violation in the codebase is Family Settings `.section-title` which uses sans — should be serif for visual consistency with other screens' section headers.

**Weight rule:** 700 is restricted to the single largest text element on a screen. 600 is the workhorse for all sub-headings and interactive text. 500 for secondary interface elements. 400 for readable content.

---

## 11. SUMMARY TABLE — CURRENT STATE VS CANONICAL

| Token | Current state | Screens consistent | Canonical value |
|---|---|---|---|
| `--coffee-mid` | `#1A1612` | 14/14 ✅ | `#1A1612` |
| `--coffee-light` | `#252117` (13), `#2D2621` (1) | 13/14 ⚠️ | `#252117` |
| `--text-primary` | `#E8DFD4` | 14/14 ✅ | `#E8DFD4` |
| `--text-secondary` | `#9B8B7E` | 14/14 ✅ | `#9B8B7E` |
| `--text-muted` | `#6B5D52` | 14/14 ✅ | `#6B5D52` |
| `--ember` | `#D97B3A` | 14/14 ✅ | `#D97B3A` |
| `--ember-hover` | `#E88F4E` | 14/14 ✅ | `#E88F4E` |
| `--sage` | `#4ADE80` | 14/14 ✅ | `#4ADE80` |
| `--border-subtle` | 3 different values | 0/14 ❌ | `rgba(217, 123, 58, 0.1)` |
| `--border` | 3 different values | 0/14 ❌ | `#2D2621` |
| `--deep-coffee` name | 2 naming conventions | ~7/14 ⚠️ | `--coffee-dark: #0F0D0B` |
| Ember var name | `--ember` vs `--ember-orange` | ~8/14 ⚠️ | `--ember` |
| `--transition` name | 3 conventions | ~4/14 ⚠️ | See §9 |
| Card radius | `radius-lg` or `radius-md` | ~10/14 ⚠️ | `radius-lg` for content cards |
| Card padding | 8 different values | 0/14 ❌ | 4-tier system (see §4) |
| Section title weight | 600 (11) vs 700 (3) | 11/14 ⚠️ | 600 |
| Section title family | serif (13) vs sans (1) | 13/14 ⚠️ | serif |
| Card title size | 7 different values | 0/14 ❌ | `1rem` (16px) |
| Body text size | 5 different values | 0/14 ❌ | `0.875rem` (14px) |
| `.btn-primary` defined? | Only 4 screens | 4/14 ❌ | Shared component needed |

---

*Deep audit conducted 18 March 2026. Ready for Tailwind config extraction.*
