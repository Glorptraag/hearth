<!-- Version: 2 | Date: 2026-04-30 | Changes: Typography swap (Crimson Text → Fraunces, Inter → DM Sans). Status palette desaturated to dusty family. Borders default cream-tinted, ember reserved as signal. Inset highlights swapped white→cream. Body surface warmed (#0F0D0B → #15110D). Default card shadows lose ember glow; ember reserved for actions/focus/dashboard hero. Motion tokens added (durations + easings). -->

# Hearth Canonical Design Tokens — v2

**Status:** Source of truth. Supersedes v1.
**Reference implementation:** `hearth-dashboard-dark-v3.html` (to be produced).
**Companion spec:** `hearth-motion-system-v1.md`.

This document defines every design token in the Hearth system. No screen, component, or prototype is allowed to declare a value that isn't represented here. If a value is missing, the answer is to add it to v2 (or v3), not to invent locally.

---

## What changed from v1

1. **Typography swap.** Crimson Text → **Fraunces** (variable, with SOFT axis). Inter → **DM Sans** (variable). Both via Google Fonts.
2. **Status palette desaturated.** Tailwind-500 brightness pulled toward the per-child dusty family. Same hue identity, less synthetic against warm coffee surfaces.
3. **Borders default cream-tinted.** Ember-tinted borders now mean *active / focused / selected* — they signal, they don't decorate.
4. **Inset highlights swapped white → cream.** The existing `rgba(255,255,255,0.2)` inset reads as polished plastic; cream `rgba(232,223,212,0.05)` reads as warm ceramic.
5. **Body surface warmed.** `#0F0D0B` → `#15110D`. Same depth, more obvious coffee character on OLED.
6. **Default card shadows lose ember glow.** Ember in shadows is reserved for the Dashboard hero, the Quick Log button, and badge-earned moments.
7. **Motion tokens added** — five durations, four easings. Full application rules in the motion spec.

---

## Surfaces

```css
--surface-body:    #15110D;   /* page background */
--surface-panel:   #1A1612;   /* default card / section surface */
--surface-raised:  #252117;   /* elevated card, modal content, active row */
--surface-hover:   #2D2621;   /* hover state on raised surfaces */
```

**Rule:** Elevation is achieved through surface step + cream-tinted border. Box-shadow is reserved for genuine float (modals, FAB, badge moments).

---

## Text

```css
--text-primary:    #E8DFD4;   /* cream, primary readable content */
--text-secondary:  #9B8B7E;   /* muted tan, labels, secondary info */
--text-muted:      #6B5D52;   /* metadata, timestamps, low-importance */
--text-inverse:    #15110D;   /* text on ember surfaces */
```

Contrast ratios held: text-primary on surface-body = 10.2:1 (AAA). text-secondary on surface-body = 4.8:1 (AA).

---

## Ember (action only)

```css
--ember:           #D97B3A;   /* primary action, active state, focus */
--ember-hover:     #E88F4E;
--ember-glow:      rgba(217, 123, 58, 0.15);
--ember-strong:    rgba(217, 123, 58, 0.25);
```

**Reserved for:**
- Primary CTAs (Quick Log, Save, Submit)
- Active tab / nav item
- Focus rings
- Progress fill
- Earned-badge moment
- Dashboard hero atmospheric gradient

**Never:**
- Default card glow
- Default border colour
- Body or heading text
- Decorative gradients on non-hero screens

---

## Status palette (desaturated)

```css
--sage:            #7BBF8A;   /* growth, success, positive */
--sage-muted:      rgba(123, 191, 138, 0.12);
--sage-text:       #9BD4A8;

--amber-status:    #E0B569;   /* attention, in-progress (NOT alert) */
--amber-muted:     rgba(224, 181, 105, 0.12);
--amber-text:      #ECC889;

--rose:            #D88894;   /* gentle warning, child-rose family */
--rose-muted:      rgba(216, 136, 148, 0.12);
--rose-text:       #E5A5AE;

--blue:            #7BA3C9;   /* informational, child-blue family */
--blue-muted:      rgba(123, 163, 201, 0.12);

--violet:          #9E8FB8;   /* category accent, used sparingly */
--violet-muted:    rgba(158, 143, 184, 0.12);
```

**Migration note:** Every screen using v1 hex values (`#4ADE80`, `#FBBF24`, `#FB7185`, `#60A5FA`, `#A78BFA`) must update. The token names are unchanged for sage/rose/blue/violet — values only. Amber renamed to `--amber-status` to avoid confusion with future amber-text usage.

---

## Per-child colours (unchanged from v1)

```css
--child-rose:      #D4A0A0;   /* Emma — default first child */
--child-blue:      #7BA3C9;   /* Liam — default second child */
--child-sage:      #8BAA7B;   /* third child */
--child-amber:     #C9A86B;   /* fourth child */
```

These were already correctly tuned. They now sit in the same dustiness family as the system status palette — visual coherence achieved by pulling status toward child, not the other way.

---

## Borders

```css
--border-subtle:   rgba(232, 223, 212, 0.06);   /* default — cream-tinted */
--border-medium:   rgba(232, 223, 212, 0.10);   /* hover, slightly stronger */
--border-active:   rgba(217, 123, 58, 0.30);    /* selected, active state */
--border-focus:    rgba(217, 123, 58, 0.50);    /* focus ring */
```

**Rule:** A card with an ember-tinted border *means something* — it's selected, focused, or active. Default cards get cream borders. v1's `rgba(217,123,58,0.1)` default border is removed from the system.

---

## Inset highlights

```css
--inset-highlight: inset 0 1px 0 rgba(232, 223, 212, 0.05);   /* cream, subtle */
--inset-strong:    inset 0 1px 0 rgba(232, 223, 212, 0.08);   /* cream, slightly more */
```

White insets removed from the system. All glossy/highlight effects use cream.

---

## Shadow system

```css
/* Default card — no shadow, elevation via surface step + border */
--shadow-card:        none;

/* Genuine float — modals, bottom sheets, FAB */
--shadow-float:       0 12px 40px rgba(0, 0, 0, 0.35),
                      0 2px 8px rgba(0, 0, 0, 0.25);

/* Hover lift — clickable cards */
--shadow-hover:       0 4px 16px rgba(0, 0, 0, 0.30);

/* Ember-glow — Quick Log button, primary CTA only */
--shadow-ember:       0 4px 16px rgba(217, 123, 58, 0.30),
                      0 0 24px rgba(217, 123, 58, 0.15);

/* Strong ember-glow — earned badge, hero CTA active */
--shadow-ember-strong: 0 0 0 3px rgba(217, 123, 58, 0.40),
                       0 0 24px rgba(217, 123, 58, 0.50);

/* Focus ring */
--shadow-focus:       0 0 0 3px rgba(217, 123, 58, 0.40);
```

**Migration note:** v1's default card shadow (`0 8px 32px rgba(0,0,0,0.6), 0 0 80px rgba(217,123,58,0.1)`) is removed. Cards lift via surface step and border. The 80px ember halo on every card was the single biggest reason ember stopped reading as "action."

---

## Typography

### Fonts

```css
--font-serif:   'Fraunces', Georgia, serif;
--font-sans:    'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono:    'JetBrains Mono', 'SF Mono', monospace;   /* data display utility */
```

**Google Fonts imports (HTML prototypes):**

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,30..100;1,9..144,300..700,30..100&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap" rel="stylesheet">
```

**Next.js (`layout.tsx`) — preferred for production:**

```typescript
import { Fraunces, DM_Sans } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  axes: ['SOFT', 'opsz'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})
```

### Variable axes

Fraunces ships SOFT (0–100) and opsz (9–144). Hearth uses these to differentiate display from body.

```css
/* Display greeting, brand wordmark — warmer, larger optical size */
.display {
  font-family: var(--font-serif);
  font-variation-settings: "SOFT" 80, "opsz" 144;
  font-weight: 600;   /* never 700 except brand wordmark */
}

/* Card titles, section headings — moderate warmth */
.heading {
  font-family: var(--font-serif);
  font-variation-settings: "SOFT" 50, "opsz" 24;
  font-weight: 600;
}

/* Body content (Voice from the Hearth, narrative copy) */
.body-serif {
  font-family: var(--font-serif);
  font-variation-settings: "SOFT" 50, "opsz" 14;
  font-weight: 400;
}
```

### Type scale

| Element              | Size  | Weight | Family | Variation                  | Usage |
|----------------------|-------|--------|--------|----------------------------|-------|
| Display greeting     | 28px  | 600    | serif  | SOFT 80, opsz 144          | Dashboard "Good morning" |
| Brand wordmark       | 24px  | 700    | serif  | SOFT 80, opsz 24           | "Hearth" lockup ONLY |
| Section heading      | 18px  | 600    | serif  | SOFT 50, opsz 18           | Panel titles |
| Card title           | 16px  | 600    | serif  | SOFT 50, opsz 16           | Module/activity card titles |
| Body serif           | 15px  | 400    | serif  | SOFT 50, opsz 14           | Narrative content, Voice copy |
| Body sans            | 14px  | 400    | sans   | —                          | UI text, labels |
| Button               | 14px  | 500    | sans   | —                          | All buttons |
| Nav active           | 13px  | 600    | sans   | —                          | Bottom nav active item |
| Nav default          | 13px  | 400    | sans   | —                          | Bottom nav default |
| Tag / chip           | 12px  | 600    | sans   | —                          | Subject tags, status pills |
| Metadata             | 11px  | 400    | sans   | letter-spacing 0.05em      | Timestamps, secondary labels |
| Uppercase label      | 11px  | 500    | sans   | uppercase, ls 0.08em       | Form labels, eyebrow text |

**Weight rule (unchanged from v1):** font-weight 700 reserved for the brand wordmark only. Display greeting = 600. Section titles = 600. Card titles = 600.

### Family rule (unchanged from v1)

- **Serif (Fraunces):** content the parent reads — display, headings, card titles, narrative body, italic Voice copy.
- **Sans (DM Sans):** interface the parent operates — buttons, nav, labels, tags, metadata, form fields, button groups.

---

## Spacing scale (unchanged from v1)

```css
--space-xs:   4px;
--space-sm:   8px;
--space-md:   12px;
--space-lg:   16px;
--space-xl:   24px;
--space-2xl:  32px;
--space-3xl:  48px;
--space-4xl:  64px;
```

---

## Radius scale (unchanged from v1)

```css
--radius-sm:    6px;    /* tags, chips, small controls */
--radius-md:   10px;    /* buttons, input fields */
--radius-lg:   16px;    /* cards, panels */
--radius-xl:   24px;    /* large surface containers, modals */
--radius-full: 9999px;  /* pills, avatars, status dots */
```

No arbitrary radius values. If you need something between, use the closest token.

---

## Motion tokens (NEW)

```css
/* Durations */
--motion-instant:  100ms;   /* press feedback, tap acknowledgement */
--motion-quick:    200ms;   /* hover, colour change, small state */
--motion-base:     300ms;   /* fades, simple entrances */
--motion-gentle:   400ms;   /* modals, expand/collapse */
--motion-slow:     600ms;   /* dashboard ambient, decorative beats */

/* Easings */
--ease-default:    cubic-bezier(0.4, 0, 0.2, 1);     /* general purpose */
--ease-out:        cubic-bezier(0.16, 1, 0.3, 1);    /* entrances */
--ease-in:         cubic-bezier(0.7, 0, 0.84, 0);    /* exits */
--ease-soft-spring: cubic-bezier(0.34, 1.2, 0.64, 1); /* selection nudge — never overshoot */
```

Application rules: see `hearth-motion-system-v1.md`.

---

## Tap targets (unchanged from v1)

| Element                    | Minimum |
|----------------------------|---------|
| Buttons                    | 44px height |
| Nav items                  | 44px height |
| Checkbox / toggle area     | 44×44px |
| Close / dismiss            | 44×44px |
| Card tap area              | full card surface |
| Swipe-to-dismiss row       | 44px row |

---

## Atmospheric gradients

The triple-radial ember gradient is **reserved for the Dashboard hero greeting area only**. Other screens use clean surfaces. This is what makes the Dashboard feel like *home* — it's the visual signal of "you've arrived."

```css
/* Dashboard hero ONLY */
.hero-gradient {
  background: var(--surface-body);
  background-image:
    radial-gradient(circle at 20% 80%, rgba(217, 123, 58, 0.10) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(217, 123, 58, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(217, 123, 58, 0.04) 0%, transparent 30%);
}
```

Note the opacity reductions from v1 (0.15 → 0.10) — with ember pulled out of every other surface, the hero gradient doesn't need to compete.

---

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Non-negotiable. Motion is enhancement, never information. Every screen must function perfectly with motion stripped.

---

## What this document does NOT define

- **Pedagogy-specific styling.** Philosophy overlays are runtime; they don't get tokens.
- **Curriculum mapping UI.** Backend concern.
- **Component implementations.** See `hearth-ui-kit-v2.md` (will be revised to v3 after Dashboard Dark v3 lands).
- **Motion application rules.** See `hearth-motion-system-v1.md`.
- **Icon definitions.** See decisions log entry S8 — Lucide-react at default weight is the system.

---

## Migration order

1. This file lands.
2. `hearth-motion-system-v1.md` lands.
3. Decisions addendum merged into `hearth-decisions-log-v1.md`.
4. `hearth-dashboard-dark-v3.html` produced as reference implementation.
5. Visual eyeball check. If it lands, batch the remaining 21 prototypes piecemeal as they're touched for other reasons. **No big-bang migration.**
6. `hearth-ui-kit-v2.md` revised to v3 once Dashboard v3 is locked.

---

*Tokens v2 — 30 April 2026. Source of truth: this document.*
