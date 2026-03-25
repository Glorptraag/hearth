# Hearth Design System — Canonical Token Spec v1

> **Date:** 18 March 2026  
> **Source of truth:** `hearth-dashboard-dark.html` (primary) and `hearth-dashboard-evening.html` (alternate theme)  
> **Purpose:** Every token, rule, and pattern for the Next.js / Tailwind build. All 17 other screens conform to this — not the other way around.

---

## Why This File Exists

The Dashboard Dark/Evening pair was the first and most deliberate implementation of Hearth's visual design. As subsequent screens were built as rapid HTML mockups, design drift accumulated: variable names changed, hardcoded values replaced tokens, bespoke button classes proliferated. This spec extracts the original intent and codifies it as the canonical reference.

Where later screens drifted, the Dashboard is right and the drift is wrong.

---

## 1. THEME ARCHITECTURE

Hearth has two emotional temperature modes, designed as complete theme palettes sharing the same structural tokens (spacing, radius, typography, transitions). The modes swap color variables only.

- **Dark mode (default):** Mont Blanc dark coffee. For focused, everyday use.
- **Gathering mode:** Warm parchment. For family review, celebration, end-of-day sharing.

The two themes share: `--font-*`, `--space-*`, `--radius-*`, `--transition-*`.  
The two themes diverge: surfaces, text, accent, shadow, border colors.

In the Next.js build, this maps to a `data-theme="dark"` / `data-theme="gathering"` attribute on `<html>`, swapping CSS custom properties.

---

## 2. COLOR TOKENS

### Dark Mode (primary — from Dashboard Dark)

```css
/* Surfaces — depth hierarchy, darkest to lightest */
--surface-body:     #0F0D0B;    /* Page background */
--surface-panel:    #1A1612;    /* Sidebar, right panel, card surface */
--surface-raised:   #252117;    /* Elevated cards, interactive panels */
--surface-hover:    #2D2621;    /* Hover states, highest elevation */

/* Text — three-tier hierarchy */
--text-primary:     #E8DFD4;    /* Headings, titles, high-emphasis */
--text-secondary:   #9B8B7E;    /* Body text, descriptions */
--text-muted:       #6B5D52;    /* Timestamps, metadata, disabled */
--text-inverse:     #0F0D0B;    /* Text on ember/sage buttons */

/* Ember — primary action color */
--ember:            #D97B3A;    /* Buttons, active states, brand accent */
--ember-hover:      #E88F4E;    /* Hover state */
--ember-glow:       rgba(217, 123, 58, 0.15);   /* Ambient glow, icon backgrounds */
--ember-strong:     rgba(217, 123, 58, 0.25);   /* Strong glow, focus rings */

/* Sage — growth/success/positive states */
--sage:             #4ADE80;    /* Success indicators, progress, growth */
--sage-muted:       #22C55E;    /* Secondary sage for borders, accents */

/* Child identity colors */
--child-rose:       #F9A8D4;    /* Emma */
--child-blue:       #60A5FA;    /* Liam */
--child-sage:       #4ADE80;    /* Oliver (reuses sage) */
--child-violet:     #A78BFA;    /* Reserved for 4th child */

/* Supporting accents */
--deep-blue:        #60A5FA;    /* Informational, foundational badges */

/* Borders */
--border-subtle:    rgba(217, 123, 58, 0.1);    /* Default card/panel borders */
--border-medium:    rgba(217, 123, 58, 0.2);    /* Emphasis, active cards */

/* Shadows */
--shadow-soft:      0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-medium:    0 4px 16px rgba(0, 0, 0, 0.4);
--shadow-warm:      0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px rgba(217, 123, 58, 0.08);
--shadow-glow:      0 0 20px rgba(217, 123, 58, 0.15);
```

### Gathering Mode (from Dashboard Evening)

```css
/* Surfaces */
--surface-body:     #FDF6F0;    /* Warm gathering background */
--surface-panel:    #FAF8F5;    /* Parchment panels */
--surface-raised:   #F5F5F0;    /* Warm white cards */
--surface-hover:    #E2E8F0;    /* Cool light hover */

/* Text */
--text-primary:     #2C2418;    /* Deep brown */
--text-secondary:   #4A5568;    /* Slate */
--text-muted:       #718096;    /* Cool gray */
--text-inverse:     #F5F5F0;    /* Text on dark buttons */

/* Ember — shifts darker/richer in gathering mode */
--ember:            #C05621;
--ember-hover:      #92400E;

/* Sage — shifts to emerald in gathering mode */
--sage:             #059669;

/* Child identity colors — muted for light backgrounds */
--child-rose:       #B5838D;
--child-blue:       #3182CE;
--child-violet:     #7C6A8D;

/* Borders */
--border-subtle:    rgba(44, 36, 24, 0.08);
--border-medium:    rgba(44, 36, 24, 0.12);

/* Shadows — lighter, brown-tinted */
--shadow-soft:      0 2px 8px rgba(44, 36, 24, 0.06);
--shadow-medium:    0 4px 16px rgba(44, 36, 24, 0.08);
--shadow-warm:      0 8px 32px rgba(192, 86, 33, 0.08);
```

### Migration notes

Screens that use `--deep-coffee` → rename to `--surface-body`.  
Screens that use `--coffee-mid` → rename to `--surface-panel`.  
Screens that use `--coffee-light` → rename to `--surface-raised`.  
Screens that use `--surface-elevated` → rename to `--surface-hover`.  
Screens that use `--ember-orange` → rename to `--ember`.  
Screens that use `--accent` → rename to `--ember`.  
Screens that use `--sage-green` → rename to `--sage`.  

The naming shift to `--surface-*` is intentional: it's theme-agnostic. `--coffee-mid` implies dark mode; `--surface-panel` works for both.

---

## 3. SPACING

Identical in both themes. 8px base unit.

```css
--space-xs:   4px;
--space-sm:   8px;
--space-md:   16px;
--space-lg:   24px;
--space-xl:   32px;
--space-2xl:  48px;
--space-3xl:  64px;
--space-4xl:  96px;
```

**Tailwind mapping:**

```js
spacing: {
  xs:  '4px',    // 0.25rem
  sm:  '8px',    // 0.5rem
  md:  '16px',   // 1rem
  lg:  '24px',   // 1.5rem
  xl:  '32px',   // 2rem
  '2xl': '48px', // 3rem
  '3xl': '64px', // 4rem
  '4xl': '96px', // 6rem
}
```

**Usage rules from Dashboard Dark:**

| Context | Spacing |
|---|---|
| Between inline items (icon + text, pill gap) | `--space-xs` to `--space-sm` |
| Inside compact elements (pills, tags, mini-badges) | `--space-xs` vertical, `--space-sm` horizontal |
| Inside form fields, nav items | `--space-md` all sides |
| Inside standard cards, panel sections | `--space-xl` all sides |
| Between cards / grid gap | `--space-lg` |
| Between major sections | `--space-3xl` |
| Main content area padding | `--space-3xl` vertical, `--space-4xl` horizontal (desktop) |

---

## 4. BORDER RADIUS

Identical in both themes.

```css
--radius-sm:   6px;     /* Tags, pills, mini-badges, compact buttons */
--radius-md:   10px;    /* Buttons, inputs, nav items, settings cards */
--radius-lg:   16px;    /* Content cards, panels, modals */
--radius-xl:   24px;    /* Feature cards, hero elements, bottom sheets */
--radius-full: 9999px;  /* Avatars, circular indicators */
```

**Tailwind mapping:**

```js
borderRadius: {
  sm:   '6px',
  md:   '10px',
  lg:   '16px',
  xl:   '24px',
  full: '9999px',
}
```

**Usage rules from Dashboard Dark:**

| Element | Radius |
|---|---|
| Mini-badge, subject pill | `--radius-sm` |
| Brand icon, nav items, user badge, buttons, inputs, gentle-prompt | `--radius-md` |
| Cards (moment, week-summary, hearth-voice), panels | `--radius-lg` |
| Avatars, circular indicators, time-dot | `50%` / `--radius-full` |

Note: Dashboard Dark doesn't use `--radius-xl` (24px). It exists in the `:root` declaration but no element references it. It's reserved for hero-scale elements (Marketplace featured cards, bottom sheet corners).

---

## 5. TYPOGRAPHY

### Font stack

```css
--font-serif: 'Crimson Text', Georgia, serif;
--font-sans:  'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

Google Fonts import includes weights: Crimson Text 400, 400i, 600, 700; Inter 300, 400, 500, 600.

### Type scale (extracted from Dashboard Dark)

| Role | Class suggestion | Font | Size | Weight | Color | Letter-spacing | Line-height | Used for |
|---|---|---|---|---|---|---|---|---|
| **Brand** | `.text-brand` | Serif | 1.5rem (24px) | 700 | `--text-primary` | -0.02em | — | "Hearth" wordmark |
| **Greeting** | `.text-display` | Serif | 2.25rem (36px) | 400 (bold spans: 700) | `--text-primary` | — | 1.3 | Page hero greeting |
| **Hearth message** | `.text-lead` | Serif | 1.15rem (~18px) | 400 | `--text-secondary` | — | 1.7 | Warm voice/AI insight prose |
| **Section title** | `.text-section` | Serif | 1.1rem (~18px) | 600 | `--text-primary` | — | — | "Family Members", "Recent Moments" |
| **Card title** | `.text-card-title` | Serif | 1.1rem (~18px) | 600 | `--text-primary` | — | — | Moment title, panel title, stat value |
| **Member name** | `.text-card-title` | Serif | 1rem (16px) | 600 | `--text-primary` | — | — | Child name under symbol |
| **Card body** | `.text-body` | Serif | 0.95rem (~15px) | 400 | `--text-secondary` | — | 1.6 | Moment description, voice text |
| **Nav item** | `.text-nav` | Sans | 0.9rem (~14px) | 500 | `--text-secondary` | — | — | Sidebar nav links |
| **Button label** | `.text-button` | Sans | 0.95rem (~15px) | 600 | `--text-inverse` | — | — | Quick log btn |
| **Stat label** | `.text-label` | Sans | 0.85rem (~14px) | 400–500 | `--text-secondary` | — | — | "Activities logged", "Hours" |
| **Action link** | `.text-action` | Sans | 0.8rem (~13px) | 500 | `--ember` | — | — | "View all", section actions |
| **Caption** | `.text-caption` | Sans | 0.75rem (12px) | 400–600 | `--text-muted` | — | 1.4 | Timestamps, age, member activity |
| **Nav label** | `.text-overline` | Sans | 0.7rem (~11px) | 600 | `--text-muted` | 0.08em | — | "HOME", "LEARNING", "DISCOVER" — uppercase |
| **Mini-badge** | `.text-micro` | Sans | 0.7rem (~11px) | 400–500 | `--text-secondary` | — | — | Tag labels, tiny metadata |
| **Attribution** | `.text-overline` | Sans | 0.7rem (~11px) | 400 | `--text-muted` | 0.05em | — | "THE HEARTH" — uppercase |

### Font-family rule

**Serif** for: all content the parent reads as educational narrative — greetings, descriptions, card titles, section titles, voice text, names.  
**Sans** for: all interface chrome the parent operates — buttons, nav, labels, tags, timestamps, overlines, action links.

### Font-weight rule

| Weight | Role | Where in Dashboard |
|---|---|---|
| **700** | Brand wordmark and display greeting `<strong>` only | `.brand-text`, `.hearth-greeting strong` |
| **600** | Section titles, card titles, names, button labels, nav overlines, user-name | The workhorse weight for emphasis |
| **500** | Nav items, action links, secondary interface text | Interactive but not primary |
| **400** | Body prose, descriptions, form inputs, captions | Readable content |
| 300 | Not used in Dashboard Dark | Reserved for display-weight light type if needed |

---

## 6. CARD ANATOMY

From Dashboard Dark's `.moment-card` — the canonical content card:

```css
.card {
  background:    var(--surface-panel);           /* #1A1612 */
  border-radius: var(--radius-lg);               /* 16px */
  padding:       var(--space-xl);                /* 32px */
  border:        1px solid var(--border-subtle);  /* ember-tinted, 0.1 opacity */
  box-shadow:    var(--shadow-soft);             /* 0 2px 8px rgba(0,0,0,0.3) */
  transition:    all var(--transition-gentle);    /* 400ms ease */
  cursor:        pointer;                        /* if interactive */
  position:      relative;
  overflow:      hidden;
}

.card:hover {
  transform:    translateY(-2px);
  border-color: var(--border-medium);
  box-shadow:   var(--shadow-warm);
}
```

**Ember top-line on hover** (the Dashboard's distinctive touch):
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
.card:hover::before {
  opacity: 1;
}
```

### Card size variants

| Variant | Padding | Radius | Background | Use case |
|---|---|---|---|---|
| **Comfortable** | `--space-xl` (32px) | `--radius-lg` (16px) | `--surface-panel` | Main content cards (moments, hearth-voice, nav-cards) |
| **Stat panel** | `--space-xl` (32px) | `--radius-lg` (16px) | `--surface-raised` | Summary panels (week-summary — uses lighter bg for distinction) |
| **Compact** | `--space-md` (16px) | `--radius-md` (10px) | `--surface-panel` | List items, nav items, settings rows |
| **Mini** | `xs`/`sm` (4px/8px) | `--radius-sm` (6px) | `--surface-raised` | Tags, pills, mini-badges |
| **Ghost/Add** | `--space-xl` (32px) | `--radius-lg` (16px) | transparent | Dashed-border "add new" card |

### Card title inside a card

```
font-family: var(--font-serif)
font-size: 1.1rem
font-weight: 600
color: var(--text-primary)
margin-bottom: var(--space-sm)
```

### Card body text inside a card

```
font-family: var(--font-serif)
font-size: 0.95rem
color: var(--text-secondary)
line-height: 1.6
```

### Card metadata inside a card

```
font-family: var(--font-sans)
font-size: 0.75rem
color: var(--text-muted)
```

---

## 7. BUTTON ANATOMY

Dashboard Dark defines one primary button (`.quick-log-btn`). Extracting the canonical rules:

### Primary button (ember)

```css
.btn-primary {
  display:       flex;
  align-items:   center;
  justify-content: center;
  gap:           var(--space-md);                /* 16px between icon + text */
  padding:       var(--space-lg);                /* 24px — generous for primary CTA */
  background:    var(--ember);
  color:         var(--surface-body);            /* dark text on ember bg */
  border:        none;
  border-radius: var(--radius-md);               /* 10px */
  font-family:   var(--font-sans);
  font-size:     0.95rem;                        /* ~15px */
  font-weight:   600;
  cursor:        pointer;
  transition:    all var(--transition-quick);     /* 200ms */
  box-shadow:    0 4px 16px rgba(217, 123, 58, 0.3), var(--shadow-glow);
}

.btn-primary:hover {
  background:    var(--ember-hover);
  transform:     translateY(-2px);
  box-shadow:    0 6px 24px rgba(217, 123, 58, 0.4), 0 0 32px rgba(217, 123, 58, 0.2);
}
```

### Secondary button / action link

From `.section-action` and `.prompt-action`:

```css
/* Text-style action (no background) */
.btn-link {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--ember);                           /* or --sage for growth actions */
  text-decoration: none;
  transition: color var(--transition-quick);
}
.btn-link:hover {
  color: var(--ember-hover);
}
```

### Ghost button (outlined)

Not in Dashboard Dark but needed — derive from the established patterns:

```css
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);      /* 8px 16px */
  background: transparent;
  border: 1px solid var(--ember);
  border-radius: var(--radius-sm);               /* 6px — tighter for ghost */
  color: var(--ember);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-quick);
}
.btn-ghost:hover {
  background: var(--ember-glow);
}
```

### Button size variants

| Size | Padding | Font-size | Use case |
|---|---|---|---|
| `sm` | `8px 16px` | 0.8rem (13px) | Inline actions, card footer buttons, ghost buttons |
| `md` | `12px 24px` | 0.875rem (14px) | Standard form actions, modal buttons |
| `lg` | `24px` (all sides) or `16px 32px` | 0.95rem (15px) | Primary CTA (Quick Log, Save, Continue) |
| `full` | Same as `lg` + `width: 100%` | 0.95rem | Full-width CTA in panels |

---

## 8. NAV ITEM

From Dashboard Dark's `.nav-item`:

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);                          /* 16px */
  padding: var(--space-md);                      /* 16px all sides */
  border-radius: var(--radius-md);               /* 10px */
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition-quick);
  border: 1px solid transparent;
}

.nav-item:hover {
  background: var(--ember-glow);
  color: var(--text-primary);
  border-color: var(--border-subtle);
}

.nav-item.active {
  background: var(--surface-raised);
  color: var(--ember);
  border-color: var(--border-medium);
  box-shadow: var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.03);
}
```

Icon inside nav: `18×18px`, `opacity: 0.6` default → `1` on hover/active.

---

## 9. SECTION HEADER

From Dashboard Dark:

```css
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);                /* 24px below */
}

.section-title {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.section-action {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--ember);
  font-weight: 500;
}
```

---

## 10. MINI-BADGE / TAG / PILL

From Dashboard Dark's `.mini-badge`:

```css
.pill {
  display: flex;
  align-items: center;
  gap: var(--space-xs);                          /* 4px */
  padding: var(--space-xs) var(--space-sm);       /* 4px 8px */
  background: var(--surface-raised);
  border-radius: var(--radius-sm);               /* 6px */
  font-family: var(--font-sans);
  font-size: 0.7rem;
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}
```

---

## 11. TRANSITIONS

```css
--transition-quick:  200ms cubic-bezier(0.4, 0, 0.2, 1);   /* Hovers, micro-interactions */
--transition-gentle: 400ms cubic-bezier(0.4, 0, 0.2, 1);   /* Cards, panels, page-level */
```

Both use the same easing curve. No other timing values should exist.

**Usage rules from Dashboard:**
- Card hover: `--transition-gentle`
- Button hover: `--transition-quick`
- Nav item hover: `--transition-quick`
- Link color change: `--transition-quick`
- Family member translateY: `--transition-gentle`
- Page entrance: custom `@keyframes fadeInUp` at 600ms with staggered delays

---

## 12. AMBIENT EFFECTS

Dashboard Dark establishes two atmospheric effects that are part of the brand:

**Ember radial glow** (on `body::before`):
```css
background:
  radial-gradient(ellipse at 20% 80%, rgba(217, 123, 58, 0.06) 0%, transparent 50%),
  radial-gradient(ellipse at 80% 20%, rgba(217, 123, 58, 0.04) 0%, transparent 50%),
  radial-gradient(ellipse at 50% 50%, rgba(217, 123, 58, 0.02) 0%, transparent 70%);
```

**Subtle noise texture** (on `body::after`):
```css
/* SVG noise filter at 3% opacity */
opacity: 0.03;
```

These are page-level effects applied once in the app shell, not per-component.

---

## 13. EMBER USAGE RULES

From Dashboard Dark, ember appears in exactly these contexts:

| Context | Element | Pattern |
|---|---|---|
| **Primary CTA** | `.quick-log-btn` | Solid ember background, dark text |
| **Active nav** | `.nav-item.active` | Ember text color |
| **Action links** | `.section-action` | Ember text color |
| **Brand icon** | `.brand-icon` | Solid ember background |
| **Card hover accent** | `.moment-card::before` | Gradient top-line, appears on hover |
| **Active border** | `.nav-item.active` | `--border-medium` (ember at 0.2) |
| **Glowing dot** | `.time-dot` | Solid ember with animated glow |
| **Mini-badge icon** | `.mini-badge svg` | Ember fill/stroke |
| **User avatar** | `.user-avatar` | Ember gradient background |

**Ember is NOT used for:** body text, card backgrounds, card titles, section titles, borders at rest, description text, or any decorative/content-level coloring.

---

## 14. SAGE USAGE RULES

From Dashboard Dark, sage appears in:

| Context | Element | Pattern |
|---|---|---|
| **Positive stat** | `.stat-value.positive` | Sage text color |
| **Growth prompt** | `.gentle-prompt` | Sage left-border, sage bg tint |
| **Growth action** | `.prompt-action` | Sage text color |
| **Child identity** | `.member-oliver` | Sage symbol bg/border |

Sage is for growth, success, and positive states. Not for primary actions.

---

## 15. RESPONSIVE BREAKPOINTS

From Dashboard Dark:

```css
@media (max-width: 1400px) {
  /* Compress sidebar and padding */
  grid-template-columns: 220px 1fr 280px;
  main-content padding: var(--space-2xl) var(--space-xl);
}

@media (max-width: 1200px) {
  /* Drop right panel, sidebar + content only */
  grid-template-columns: 200px 1fr;
  right-panel: display: none;
}
```

Below 1200px the design needs a mobile nav pattern (bottom bar or hamburger). Dashboard Mobile (`hearth-dashboard-mobile-v1.html`) provides this reference.

---

## 16. WHAT LATER SCREENS GOT WRONG

A quick reference for the build team — common drift patterns to watch for:

| Drift | Correct value (from Dashboard) | Common wrong value |
|---|---|---|
| `--border-subtle` as `rgba(255,255,255,0.06)` | `rgba(217, 123, 58, 0.1)` — ember-tinted | White-tinted is colder than intended |
| `--ember-orange` variable name | `--ember` | Verbose; blocks Tailwind shorthand |
| `--deep-coffee` meaning `#0A0806` | Dashboard uses `--deep-coffee: #0F0D0B` as page body | Some screens push body darker |
| Section title weight `700` | `600` | 700 is reserved for display/brand only |
| Section title font `sans` | Serif | Family Settings is the sole violator |
| Card title size ranging `0.95rem`–`1.15rem` | `1.1rem` | Screens drifted in both directions |
| Body text size ranging `0.85rem`–`0.95rem` | `0.95rem` | Portfolio drifted down |
| Hardcoded `padding: 18px` | `var(--space-xl)` (32px) or `var(--space-lg)` (24px) | Many screens use px values not on the spacing scale |
| Border-radius `8px`, `12px`, `20px` | Only `6/10/16/24px` exist in the system | Intermediate values are drift |
| `transition: 0.2s ease` | `var(--transition-quick)` — same duration, proper easing | Inline transition with different curve |
| Notification Centre `--coffee-light: #2D2621` | `--coffee-light: #252117` | NC remapped the variable to the wrong hex |

---

*Canonical spec extracted 18 March 2026 from the Dashboard Dark/Evening pair. This is the source of truth for the Tailwind build.*
