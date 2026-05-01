<!-- Version: 1 | Date: 2026-04-30 | Changes: First version. Motion system principles, application rules per pattern, special cases (engagement emoji, badge earned, constellation, dashboard ambient), don't-animate list, performance and accessibility. -->

# Hearth Motion System — v1

**Status:** First canonical motion spec.
**Companion:** `hearth-canonical-design-tokens-v2.md` (motion tokens live there).
**Implementation utility:** `hearth-motion-utilities-v1.css` (to be produced — see prompts file).

---

## Mental model

Motion in Hearth has to do something specific: it has to feel like *the kitchen at five in the morning*, not the app store.

Steam rises slowly. A ceramic cup gets set down with weight. The ember in the kettle plate glows brighter, then settles. Things have mass. Nothing is in a hurry. When something happens, you notice it, but it doesn't perform for you.

Translated into rules: motion is **slow-side of normal, soft-eased, almost no spring, almost no looping, GPU-only.** Where iOS is 250ms with bounce, Hearth is 350–400ms with gentle deceleration and no overshoot. Animations should feel like setting a ceramic cup down — not tapping a plastic button.

---

## Universal rules

1. **Animate `transform` and `opacity` only.** These run on the GPU compositor. Everything else paints and costs frames.
2. **No spring overshoot.** The soft-spring token (`cubic-bezier(0.34, 1.2, 0.64, 1)`) tops out at 1.2 — Hearth nudges, never bounces.
3. **No spinners.** Loading states use skeleton screens or contemplative pulses.
4. **No looping decorative motion** except the Dashboard hero ambient gradient. Loops are visual noise; they exhaust the eye.
5. **No attention-grab animations** on screens that aren't the Dashboard. The bell doesn't shake, the badge doesn't wiggle.
6. **No motion during the parent's typing flow** in the Logger. The Logger is sacred quiet space.
7. **`prefers-reduced-motion` strips everything.** The UI must work perfectly without motion. Motion is enhancement, never information.

---

## Application rules by pattern

### Acknowledgement (every interactive element)

Press feedback within 100ms. Buttons get `scale(0.98)` on `:active` for the duration of the press. This is the **only "snappy" moment in the system** — physical feedback should feel immediate.

```css
.btn:active {
  transform: scale(0.98);
  transition: transform var(--motion-instant) var(--ease-default);
}
```

Border and background colour transitions stay at `--motion-quick` (200ms).

### Card hover (clickable cards only)

```css
.card-clickable {
  transition: transform var(--motion-quick) var(--ease-default),
              border-color var(--motion-quick) var(--ease-default),
              box-shadow var(--motion-quick) var(--ease-default);
}

.card-clickable:hover {
  transform: translateY(-2px);
  border-color: var(--border-medium);
  box-shadow: var(--shadow-hover);
}
```

No scale, no glow. Read-only cards don't move at all — hover that doesn't lead anywhere is just noise.

### Modal / bottom sheet

**Backdrop:** opacity 0 → 0.6 over `--motion-base` (300ms).

**Modal content:** `translateY(8px)` and `opacity 0` → `translateY(0)` and `opacity 1` over `--motion-gentle` (400ms), `--ease-out`.

**Closing:** reverse, but at 250ms — dismissals should feel decisive, not lingering.

**Mobile bottom sheets:** `translateY(100%)` → `translateY(0)`, 400ms ease-out. Use `transform`, never animate `top` or `height`.

### Expand / collapse (accordions, "show more", AI insight panels)

Use the modern grid-rows technique:

```css
.expand-container {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--motion-gentle) var(--ease-default);
}

.expand-container.is-open {
  grid-template-rows: 1fr;
}

.expand-content {
  overflow: hidden;
}

.expand-content > * {
  opacity: 0;
  transition: opacity var(--motion-base) var(--ease-default) 100ms;
}

.expand-container.is-open .expand-content > * {
  opacity: 1;
}
```

Container opens, *then* content arrives — the 100ms delay is intentional. Chevron icons rotate 180° at `--motion-quick`.

### Page transitions (Next.js route changes)

Fade only. Opacity 0 → 1 with `translateY(4px)` over `--motion-base`, ease-out. **No slide-from-right** (too iOS-native), **no scale** (too Material). The page comes into focus, the way you look up from your phone to your kettle.

### Tab switching

The active indicator slides between tab positions over 250ms `--ease-default`. Content cross-fades: outgoing fades out at 150ms, incoming fades in at 200ms with a 50ms delay. **The indicator slide is the only "tracking" motion in the entire system.**

### Form fields

- Border colour transitions at `--motion-quick`.
- Focus ring (3px ember glow) appears at 150ms.
- **Error states do NOT shake.** The field border colours to `--rose` and the error message fades in below at `--motion-base`. Punitive motion is wrong for the brand.

### Toggle / checkbox

Colour change at `--motion-quick`. The check or dot appears with `scale(0.6) → 1` and `opacity 0 → 1` over 250ms using `--ease-soft-spring`. **One of the few places spring eases are warranted.**

### Loading states

**Never use spinners.** Spinners signal "the system is busy"; Hearth signals "I'm thinking with you."

**Skeleton screens** — gentle cream shimmer, 1.5s loop, very low contrast:

```css
@keyframes shimmer {
  0%, 100% { background-color: rgba(232, 223, 212, 0.04); }
  50%      { background-color: rgba(232, 223, 212, 0.08); }
}

.skeleton {
  animation: shimmer 1.5s ease-in-out infinite;
}
```

**AI processing** (Voice from the Hearth working on an insight) — ember glow on the voice icon pulses at 2.5s cycle, opacity 0.15 → 0.30 → 0.15. Slow, contemplative, not anxious:

```css
@keyframes hearth-thinking {
  0%, 100% { box-shadow: 0 0 12px rgba(217, 123, 58, 0.15); }
  50%      { box-shadow: 0 0 20px rgba(217, 123, 58, 0.30); }
}

.voice-icon.is-thinking {
  animation: hearth-thinking 2.5s ease-in-out infinite;
}
```

---

## Special cases

### Engagement emoji selection (Logger)

One of the rare moments where micro-delight is appropriate — the parent is committing a small judgement, and the UI should acknowledge it.

```css
.engagement-emoji.is-selected {
  animation: engagement-select 300ms var(--ease-soft-spring);
}

@keyframes engagement-select {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.engagement-emoji.is-not-selected {
  opacity: 0.4;
  transition: opacity var(--motion-quick) var(--ease-default);
}
```

That's it. No glow, no haptic-feel-via-animation tricks.

### Badge earned

The biggest moment in the parent's loop. Hearth's version of celebration is **recognition, not fireworks**.

- Badge fades in at `scale(0.9) → 1` over 500ms ease-out.
- A single ember glow pulse — one cycle, 1.2s, then settles to default.
- The descriptor below fades in 200ms after the badge: *"Pattern recognition — first appeared three weeks ago."*
- **No confetti. No sparkle particles. No sound.**

The dignity of the moment comes from the words, not the show.

```css
@keyframes badge-arrive {
  0%   { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1);   opacity: 1; }
}

@keyframes badge-glow-once {
  0%   { box-shadow: 0 0 0 0 rgba(217, 123, 58, 0); }
  40%  { box-shadow: 0 0 24px 4px rgba(217, 123, 58, 0.5); }
  100% { box-shadow: 0 0 12px 0 rgba(217, 123, 58, 0.15); }
}

.badge-earned {
  animation: badge-arrive 500ms var(--ease-out),
             badge-glow-once 1200ms var(--ease-default) 200ms;
}
```

### Constellation map

The one screen where richer choreography earns its place — the motion *is* the information.

- Nodes stagger-in 50ms apart, 400ms each, ease-out.
- Edges draw from parent to child node over 600ms (animate `stroke-dashoffset`).
- Hovering a node brightens it and its connected edges over `--motion-quick`.

This screen warrants Framer Motion. Everything else stays CSS.

### Dashboard ambient gradient

The radial ember gradients on the Dashboard hero can drift — but slowly. **A 30-second loop where gradient centres shift by 5–8% then return.** Like firelight flicker at quarter speed.

```css
@keyframes hearth-glow {
  0%, 100% {
    background-position: 20% 80%, 80% 20%, 40% 40%;
  }
  50% {
    background-position: 23% 76%, 77% 23%, 43% 37%;
  }
}

.dashboard-hero {
  animation: hearth-glow 30s ease-in-out infinite;
}
```

This is the **only looping decorative animation in the system**, and it's locked to the Dashboard greeting area.

---

## Don't-animate list

- **Font weight, font size, letter spacing.** Reflows text, looks broken.
- **Page scroll position.** Let the browser do its thing.
- **Hover states on read-only content.**
- **The bell icon when notifications arrive.** No shake, no wiggle. Badge dot scaling 0 → 1 is enough.
- **Anything during typing in the Logger.**
- **`width`, `height`, `top`, `left`, `padding`, `margin`.** Use transforms.
- **`box-shadow` on continuous animations.** OK on hover (one-shot, 200ms). Not OK on scroll-linked or looping.
- **`background-color` on large surfaces during interaction.** Causes paint storms on mobile.

---

## Performance contract

Every transition and animation in the system must satisfy:

1. Animates `transform` and/or `opacity` only — OR is acceptably scoped (hover shadow, focus ring, single one-shot).
2. Runs at 60fps on a mid-range Android phone (Pixel 4a class).
3. Respects `prefers-reduced-motion`.
4. Has no JS dependency for the animation itself — JS triggers state changes; CSS handles the motion.

Framer Motion is permitted only for the Constellation map and any future viz that genuinely needs orchestrated multi-element choreography. It is not the default; CSS is.

---

## Implementation: `hearth-motion-utilities-v1.css`

A single CSS module that defines reusable motion classes. Components import the class names rather than re-declaring transitions. Spec for this file is in the prompts document — Claude Code produces it as part of the v2 system rollout.

Class surface (preview):

```
.hearth-fade-in
.hearth-fade-out
.hearth-lift-card
.hearth-press
.hearth-expand
.hearth-modal-enter
.hearth-modal-exit
.hearth-page-enter
.hearth-skeleton
.hearth-thinking
.hearth-engagement-select
.hearth-badge-arrive
.hearth-glow-pulse
```

---

*Motion v1 — 30 April 2026. Apply slowly. Apply rarely. When in doubt, don't.*
