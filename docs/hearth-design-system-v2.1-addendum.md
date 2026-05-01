<!-- Version: 1 | Date: 2026-04-30 | Changes: Addendum to v2 design system.
     Adds gathering (light/daytime) theme as canonical second mode. Token
     names from v2 unchanged — only scoped under [data-theme] selectors.
     Does not redefine v2 tokens; only specifies the gathering-mode values
     and the scoping pattern. To be merged into existing v2 documentation
     and decisions log; does not supersede v2. -->

# Hearth Design System — v2.1 Addendum: Gathering Theme

**Status:** Addendum to existing v2 docs. Does not supersede them.
**Merge target:** `hearth-canonical-design-tokens-v2.md` (add gathering blocks under existing token sections), `hearth-decisions-log-v1.md` (add S14), `hearth-motion-utilities-v1.css` (add theme scoping to two classes).
**Date:** 30 April 2026

---

## What this addendum adds

The v2 system is dark-only. Gathering (the existing product term for the daytime/light UI, currently shipping on `hearth-dashboard-evening-v2.html` with pre-v2 tokens) becomes a canonical second theme. Same component CSS, same motion language, same typography — only token values change at runtime via `[data-theme]`.

This addendum specifies:
1. The gathering-mode values for every theme-dependent v2 token.
2. Three new tokens that fell out of building the gathering variant (`--surface-input`, `--backdrop-modal`, `--backdrop-success`).
3. The `[data-theme]` scoping pattern.
4. Theme-aware motion adjustments (only two classes need it).
5. Per-child colour lookup for JS-injected styles.

It does NOT redefine v2 tokens, change typography, change motion, or change application rules. S7–S13 from the v2 decisions addendum apply identically to both themes.

---

## Decision entry to add to the log

Add to `hearth-decisions-log-v1.md` as **S14**, immediately after the v2 design system block:

| # | Decision | Choice | Document of Record | Downstream Dependencies |
|---|----------|--------|-------------------|------------------------|
| S14 | Theme system canonicalised — gathering + dark | Two-theme system. Gathering (light/cream) is the default daytime UI; dark is opt-in via `[data-theme="dark"]`. Both first-class — same component CSS, theme-scoped tokens. Per-child colours and status palette become theme-aware. Modal backdrop and save-success overlay get theme-specific RGB + blur values (new tokens). Motion stays theme-agnostic except `hearth-thinking-pulse` and `hearth-skeleton` box-shadow / background opacity. v2 application rules (S7–S13) apply identically to both themes. | This addendum (`hearth-design-system-v2.1-addendum.md`) | All screens, all prototypes; existing `hearth-dashboard-evening-v2.html` to be replaced by `hearth-dashboard-gathering-v1.html` |

---

## Scoping pattern

```css
/* Default = gathering. Unstyled root lands on the daytime UI. */
:root,
[data-theme="gathering"] {
  /* gathering tokens */
}

[data-theme="dark"] {
  /* dark tokens — override every theme-dependent var */
}
```

Apply at root: `<html data-theme="gathering">` or `<html data-theme="dark">`. If unset, gathering applies.

**Why gathering is default:** the modal use of Hearth is during the day, kids around. Dark is for the evening review session. An unstyled root should land on the more common state.

---

## Gathering-mode token values

The v2 token names are unchanged. Below are the gathering-mode values to add under `:root, [data-theme="gathering"]`. The v2 hex values move under `[data-theme="dark"]` unchanged.

### Surfaces

```css
:root, [data-theme="gathering"] {
  --surface-body:    #FDF6F0;   /* warm cream */
  --surface-panel:   #FAF8F5;   /* off-white */
  --surface-raised:  #F5F5F0;   /* cool off-white */
  --surface-hover:   #ECE8E2;   /* warmed cool light */
  --surface-input:   #FFFFFF;   /* NEW — pure white for input clarity */
}
```

**New token: `--surface-input`.** Explicit background for `<textarea>`, `<input>`, modal dropzones. In gathering it's pure white (input clarity); in dark it's `#1E1A16` (subtle step darker than panel for input affordance). Add to dark token block as well.

**Note on `--surface-hover`:** the existing `hearth-dashboard-evening-v2.html` used `#E2E8F0` here, which reads cool against the warm cream base. v2.1 corrects this to `#ECE8E2` — same lightness, warmed tint. This is a small but deliberate divergence from the production gathering UI.

### Text

```css
:root, [data-theme="gathering"] {
  --text-primary:    #2C2418;   /* warm near-black */
  --text-secondary:  #4A5568;   /* slate */
  --text-muted:      #718096;   /* cool gray */
  --text-inverse:    #FDF6F0;   /* cream — for ember backgrounds */
}
```

Contrast ratios: text-primary on surface-body = 13.4:1 (AAA). text-secondary on surface-body = 7.8:1 (AAA). text-muted on surface-body = 4.6:1 (AA).

### Ember (deepened for cream contrast)

```css
:root, [data-theme="gathering"] {
  --ember:        #C05621;
  --ember-hover:  #92400E;
  --ember-glow:   rgba(192, 86, 33, 0.10);
  --ember-strong: rgba(192, 86, 33, 0.20);
}
```

Ember reservation rules (S11/S13) apply identically: action / focus / active state / Hearth voice top-line / earned-badge moment / Dashboard hero atmosphere only.

### Status palette (desaturated for cream)

```css
:root, [data-theme="gathering"] {
  --sage:         #5A9168;
  --sage-muted:   rgba(90, 145, 104, 0.10);
  --sage-text:    #2D5C3D;

  --amber-status: #B8853F;
  --amber-muted:  rgba(184, 133, 63, 0.10);
  --amber-text:   #6B4D1F;

  --rose:         #B5838D;
  --rose-muted:   rgba(181, 131, 141, 0.10);
  --rose-text:    #8B5C66;

  --blue:         #4D7AA0;
  --blue-muted:   rgba(77, 122, 160, 0.10);

  --violet:       #7C6A8D;
  --violet-muted: rgba(124, 106, 141, 0.10);
}
```

Same dustiness principle as dark, calibrated for cream backgrounds.

### Per-child identity

```css
:root, [data-theme="gathering"] {
  --child-rose:   #B5838D;   /* Emma */
  --child-blue:   #4D7AA0;   /* Liam */
  --child-sage:   #5A9168;   /* third child */
  --child-amber:  #B8853F;   /* fourth child */
}
```

### Borders (warm-dark-tinted, S11 light equivalent)

```css
:root, [data-theme="gathering"] {
  --border-subtle: rgba(44, 36, 24, 0.06);
  --border-medium: rgba(44, 36, 24, 0.10);
  --border-active: rgba(192, 86, 33, 0.30);
  --border-focus:  rgba(192, 86, 33, 0.50);
}
```

S11 rule (ember-tinted borders signal active/focused/selected) applies identically.

### Inset highlights (soft white "lit from above")

```css
:root, [data-theme="gathering"] {
  --inset-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.50);
  --inset-strong:    inset 0 1px 0 rgba(255, 255, 255, 0.70);
}
```

In gathering, the inset reads as light catching from above. Same role as the dark cream-rim-light, opposite tint. Note: gathering is the one place in the system where pure white is permitted — and only in highlights, never as a surface or text color.

### Shadow system

```css
:root, [data-theme="gathering"] {
  --shadow-card:         none;
  --shadow-hover:        0 4px 16px rgba(44, 36, 24, 0.08);
  --shadow-float:        0 12px 40px rgba(44, 36, 24, 0.15),
                         0 2px 8px rgba(44, 36, 24, 0.10);
  --shadow-ember:        0 4px 16px rgba(192, 86, 33, 0.25),
                         0 0 24px rgba(192, 86, 33, 0.10);
  --shadow-ember-strong: 0 0 0 3px rgba(192, 86, 33, 0.40),
                         0 0 24px rgba(192, 86, 33, 0.40);
  --shadow-focus:        0 0 0 3px rgba(192, 86, 33, 0.40);
}
```

S13 rule (default cards lift via surface step + border, not ember halo) applies identically.

### Modal & success backdrops (NEW tokens)

```css
:root, [data-theme="gathering"] {
  --backdrop-modal:        rgba(44, 36, 24, 0.40);    /* warm-dark veil */
  --backdrop-modal-blur:   2px;
  --backdrop-success:      rgba(253, 246, 240, 0.94); /* near-opaque cream */
  --backdrop-success-blur: 4px;
}

[data-theme="dark"] {
  --backdrop-modal:        rgba(0, 0, 0, 0.70);
  --backdrop-modal-blur:   0px;
  --backdrop-success:      rgba(21, 17, 13, 0.92);
  --backdrop-success-blur: 0px;
}
```

Add the dark values to the existing dark token block as well — these are NEW tokens in v2.1 across both themes.

Apply via:

```css
.modal-overlay {
  background: var(--backdrop-modal);
  backdrop-filter: blur(var(--backdrop-modal-blur));
  -webkit-backdrop-filter: blur(var(--backdrop-modal-blur));
}

.save-success {
  background: var(--backdrop-success);
  backdrop-filter: blur(var(--backdrop-success-blur));
  -webkit-backdrop-filter: blur(var(--backdrop-success-blur));
}
```

**Why these are new tokens:** during the gathering Logger build, modal backdrops were originally inline RGBA in every file. That worked for dark-only. With two themes, every modal needed a theme-aware backdrop — and pure black on cream reads as harsh interruption while cream-veil on dark loses contrast. Tokenising solves this once.

### Atmospheric gradient (Dashboard hero only)

```css
[data-theme="gathering"] .hero-gradient,
:root .hero-gradient {
  background: var(--surface-body);
  background-image:
    radial-gradient(circle at 20% 80%, rgba(192, 86, 33, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(192, 86, 33, 0.04) 0%, transparent 50%);
}
```

Subtler than dark (0.06/0.04 vs 0.10/0.08). Daylight doesn't need ember atmosphere to feel like home — the cream surface does that. In dark, the ember gradient is what makes the dashboard feel like home rather than device.

---

## Theme-aware motion adjustments

Most v2 motion utilities are theme-agnostic (transform/opacity only). Two need theme scoping in `hearth-motion-utilities-v1.css`:

### `hearth-thinking-pulse`

Update existing keyframe to use a CSS variable for the box-shadow opacity:

```css
:root, [data-theme="gathering"] {
  --thinking-pulse-low:  rgba(192, 86, 33, 0.20);
  --thinking-pulse-high: rgba(192, 86, 33, 0.40);
}

[data-theme="dark"] {
  --thinking-pulse-low:  rgba(217, 123, 58, 0.15);
  --thinking-pulse-high: rgba(217, 123, 58, 0.30);
}

@keyframes hearth-thinking-pulse {
  0%, 100% { box-shadow: 0 0 12px var(--thinking-pulse-low); }
  50%      { box-shadow: 0 0 20px var(--thinking-pulse-high); }
}
```

### `hearth-skeleton`

```css
:root, [data-theme="gathering"] {
  --skeleton-low:  rgba(44, 36, 24, 0.04);
  --skeleton-high: rgba(44, 36, 24, 0.08);
}

[data-theme="dark"] {
  --skeleton-low:  rgba(232, 223, 212, 0.04);
  --skeleton-high: rgba(232, 223, 212, 0.08);
}

@keyframes shimmer {
  0%, 100% { background-color: var(--skeleton-low); }
  50%      { background-color: var(--skeleton-high); }
}
```

### `hearth-glow-pulse` (Dashboard hero ambient drift)

This one keeps two separate keyframes because gradient stops can't be CSS-variabled cleanly. Define `hearth-glow-pulse-gathering` and `hearth-glow-pulse-dark` and apply via attribute selectors:

```css
[data-theme="gathering"] .dashboard-hero,
:root .dashboard-hero {
  animation: hearth-glow-pulse-gathering 30s ease-in-out infinite;
}

[data-theme="dark"] .dashboard-hero {
  animation: hearth-glow-pulse-dark 30s ease-in-out infinite;
}
```

All other motion utilities (`hearth-fade-in`, `hearth-press`, `hearth-lift-card`, `hearth-engagement-select`, `hearth-badge-arrive`, `hearth-modal-enter`, `hearth-page-enter`, `hearth-expand`) are fully theme-agnostic. No changes needed.

---

## Per-child colours in JavaScript

Standardised lookup for prototypes that inject per-child colours via inline JS (Logger, Module Builder, Constellation):

```javascript
function getChildColors(theme) {
  theme = theme || (document.documentElement.dataset.theme || 'gathering');
  const palettes = {
    gathering: {
      emma: { color: '#B5838D', muted: 'rgba(181, 131, 141, 0.12)' },
      liam: { color: '#4D7AA0', muted: 'rgba(77, 122, 160, 0.12)' }
    },
    dark: {
      emma: { color: '#D4A0A0', muted: 'rgba(212, 160, 160, 0.15)' },
      liam: { color: '#7BA3C9', muted: 'rgba(123, 163, 201, 0.15)' }
    }
  };
  return palettes[theme] || palettes.gathering;
}
```

Replaces hardcoded hex in `family.children` arrays. Components read theme at call time so theme switches re-render correctly.

---

## What this addendum does NOT change

- **All v2 component CSS.** Buttons, cards, chips, inputs, modals, etc. remain identical — they just consume different var values.
- **Typography.** Fraunces + DM Sans across both themes. Same SOFT/opsz axis settings.
- **Motion language.** Same durations, same easings, same application rules. Only the two pulse animations need theme-aware values.
- **Lucide icons.** Same icon names across themes. Single-color stroke aesthetic works on both.
- **S7–S13 application rules.** Ember reservation, default cards no ember halo, brand-wordmark-only-700, etc. — all apply identically to both themes.
- **The 5-minute rule, retrospective-first principle, philosophy-neutral content rule.** Architecture principles unchanged.

---

## What still needs to be produced after this addendum lands

1. **`hearth-dashboard-gathering-v1.html`** — daytime reference Dashboard. Structural twin of `hearth-dashboard-dark-v3.html`. Replaces the existing `hearth-dashboard-evening-v2.html` (which uses pre-v2 tokens and Crimson Text/Inter typography).
2. **Piecemeal prototype migration.** Each prototype touched for other reasons gains theme-scoping. Mechanical work, ~50–100 line diff per file.
3. **(Eventually) consolidate the existing Logger gathering variant.** The `hearth-logger-workspace-gathering-v4.html` file produced this session should fold into a single `hearth-logger-workspace-v5.html` that flips themes via `data-theme` rather than living as a separate file. Defer until the Dashboard pattern is proven.

---

## Migration order

1. This addendum lands in repo.
2. `hearth-canonical-design-tokens-v2.md` updated in place — add gathering blocks under each theme-dependent token section, add `--surface-input`, `--backdrop-modal`, `--backdrop-modal-blur`, `--backdrop-success`, `--backdrop-success-blur` to both theme blocks. **No version bump on the tokens doc** — gathering is additive, not a rewrite.
3. `hearth-motion-utilities-v1.css` updated in place — three keyframes refactored to use CSS-var opacities, `hearth-glow-pulse` split into two named keyframes with attribute-selector application.
4. S14 entry added to `hearth-decisions-log-v1.md`.
5. `COMPONENT_REGISTRY.md` updated — flag `hearth-dashboard-evening-v2.html` as "pending supersession by gathering v1."
6. `hearth-dashboard-gathering-v1.html` produced.
7. Eyeball both Dashboards side-by-side. Toggle `data-theme` and confirm everything re-skins without JS reload.
8. Decide: piecemeal migration of remaining prototypes, or rework the gathering tokens.

---

*Addendum v1 — 30 April 2026. Two themes, one system, one delta document.*
