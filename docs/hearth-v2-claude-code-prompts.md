# Claude Code Prompts — Hearth Design System v2 Rollout

**Date:** 30 April 2026
**Prerequisite:** The following three architecture documents must be saved into the project repo at `/docs/` (or wherever the project's design system docs live) before either prompt runs:

- `hearth-canonical-design-tokens-v2.md`
- `hearth-motion-system-v1.md`
- `hearth-design-system-v2-decisions-addendum.md`

Run **Prompt A** first. Verify Dashboard Dark v2 still works after Prompt A (it should — Prompt A only adds new files). Then run **Prompt B**.

---

## Prompt A — Set up the v2 design system

```
Hearth design system v2 rollout — setup phase.

Three architecture docs have just landed in the repo:
- hearth-canonical-design-tokens-v2.md
- hearth-motion-system-v1.md
- hearth-design-system-v2-decisions-addendum.md

Your job in this session: file these properly, produce the motion utilities
CSS module they reference, and update the project tracking files. Do not
touch any prototype HTML/JSX yet — that's a separate session.

WORK ITEMS

1. Read all three new architecture docs in full. Read the current
   COMPONENT_REGISTRY.md and PROJECT_STATUS.md. Read
   hearth-decisions-log-v1.md so you understand the existing structure
   before merging the addendum.

2. Merge the decisions addendum entries (S7–S13) into
   hearth-decisions-log-v1.md. Preserve everything else. Do not version
   the decisions log to v2 — it's a living document; new entries append
   per the existing convention. Add a note at the top of the new entries
   block: "Added 30 April 2026 — Design System v2 rollout."

3. Produce hearth-motion-utilities-v1.css. Top of file:

   /* Version: 1 | Date: 2026-04-30 | Changes: First version. Reusable
      motion utility classes. Maps to motion tokens in
      hearth-canonical-design-tokens-v2.md per
      hearth-motion-system-v1.md. */

   The file must define every class listed in the motion spec's
   "Implementation" section:
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

   Use the motion tokens (--motion-*, --ease-*) by var() reference, not
   hardcoded values. Each class should be self-contained and applicable
   without additional setup. Include @media (prefers-reduced-motion:
   reduce) at the bottom of the file as the canonical implementation.

4. Update COMPONENT_REGISTRY.md:
   - Add the three new architecture docs under a "Design System v2" group.
   - Add hearth-motion-utilities-v1.css under the same group.
   - Mark hearth-canonical-design-tokens-v1.md as superseded by v2 in the
     superseded files table (do not delete v1 — it stays untouched per
     versioning rules).
   - Note that hearth-ui-kit-v2.md will be revised to v3 after Dashboard
     Dark v3 lands (do not revise it now).

5. Update PROJECT_STATUS.md:
   - Add a "Design System v2 in flight" section at the top of current
     work, listing the three docs and the motion utilities as landed,
     and Dashboard Dark v3 as the next pending reference build.

6. Font and icon library setup — DO NOT install or import yet in any
   prototype or app file. Just confirm the following are correct paths
   for the next session, and surface any issues:
   - Google Fonts URL (Fraunces + DM Sans) given in tokens v2 doc.
   - lucide-react npm package and Lucide CDN script URL (verify both
     are reachable from the project context).
   Note any blockers in PROJECT_STATUS.md "Known issues" if found.

OUTPUT FORMAT

- Complete file contents for any file you create or modify, never diffs.
- Versioned filename for the new CSS file (hearth-motion-utilities-v1.css).
- Comment block at top of any new file per the project versioning rule.
- Brief summary at the end listing every file touched and what changed.

NON-NEGOTIABLES

- Do not touch any prototype HTML or JSX in this session.
- Do not delete v1 files. v1 stays.
- Do not write motion classes that animate anything other than transform,
  opacity, or scoped one-shot box-shadow per the motion spec.
- Do not invent motion values not in the token system.
```

---

## Prompt B — Dashboard Dark v3 reference rebuild

```
Hearth design system v2 — reference implementation.

The v2 token system, motion system, and motion utilities have landed.
Your job in this session: produce hearth-dashboard-dark-v3.html as the
canonical reference implementation. Every other prototype will be
checked against this one.

WORK ITEMS

1. Read in full:
   - hearth-canonical-design-tokens-v2.md
   - hearth-motion-system-v1.md
   - hearth-motion-utilities-v1.css
   - hearth-design-system-v2-decisions-addendum.md
   - hearth-dashboard-dark-v2.html (the file you'll be replacing)
   - hearth-decisions-log-v1.md (S7–S13 entries especially)

2. Produce hearth-dashboard-dark-v3.html. Top of file:

   <!-- Version: 3 | Date: 2026-04-30 | Changes: Design System v2 rollout
        reference implementation. Typography swap (Crimson Text→Fraunces,
        Inter→DM Sans). Status palette desaturated. Borders default cream-
        tinted. Inset highlights cream not white. Body warmed (#0F0D0B→
        #15110D). Default card shadows lose ember glow — ember reserved
        for Quick Log button + hero gradient + earned-badge moments.
        Motion utilities applied per spec. Lucide icons replace emoji
        nav and section icons. -->

3. Apply all v2 changes. Specifically:

   TOKENS — replace inline :root values with the full v2 token set from
   hearth-canonical-design-tokens-v2.md. Every token in v2, even ones
   this screen doesn't currently use. Future-proofs the file.

   FONTS — Google Fonts <link> in <head> using the URL specified in
   tokens v2. Apply variable axis settings (SOFT, opsz) on the display
   greeting, brand wordmark, section headings, and card titles per the
   type scale table.

   ICONS — every emoji on this screen is replaced with the Lucide CDN
   approach:
     <script src="https://unpkg.com/lucide@latest"></script>
     <i data-lucide="ICON_NAME"></i>
     ...
     <script>lucide.createIcons()</script>

   Map for this screen specifically:
     🏠 (nav home)              → home
     📖 (nav our story)         → book-open
     🔍 (nav explore)           → compass
     ✏️ (nav log / Quick Log)   → pen-line
     🔧 (nav build)             → wrench (verify; if too literal, use
                                  hammer)
     ⚙️ (nav settings)          → settings
     🤖 (Voice from the Hearth) → sparkles  (Hearth voice icon — NOT
                                              robot)
     📝 (recent activity)       → notebook-pen
     🎯 (focus / target)        → target
     📊 (insights)              → trending-up
     🔔 (notifications bell)    → bell

   If a section emoji isn't on this list, use your best judgement from
   the Lucide icon set and document the choice in a comment near the
   icon usage.

   COLOURS — apply the desaturated status palette throughout. Verify any
   subject tags use the v2 status colours, not the v1 hex values.

   BORDERS — default cards: border-color var(--border-subtle).
   Active/selected cards or nav items: border-color var(--border-active).
   Focus states: var(--border-focus). Verify nothing in the file still
   uses the v1 ember-tinted default.

   SHADOWS — default cards: no shadow. Use surface-step + border for
   elevation. Quick Log button: var(--shadow-ember). Voice from the
   Hearth panel: subtle gradient surface, no glow. The hero greeting
   area gets the atmospheric ember gradient (per tokens v2 § Atmospheric
   gradients).

   INSETS — every white inset highlight (rgba(255,255,255,0.x)) replaced
   with cream (rgba(232,223,212,0.05) or 0.08).

   MOTION — apply motion utility classes (.hearth-*) from the utilities
   CSS rather than re-declaring transitions inline. Specifically:
     - Quick Log button: .hearth-press for active state.
     - Recent activity / clickable cards: .hearth-lift-card for hover.
     - Voice from the Hearth icon when AI is generating: .hearth-thinking
       (set up a class toggle so it's demonstrable in the prototype).
     - Page entrance: .hearth-page-enter on body or main wrapper.
     - Skeleton loaders if any: .hearth-skeleton.

   AMBIENT GRADIENT — the hero greeting area applies the 30s
   .hearth-glow-pulse drift animation per the motion spec.

4. After producing the file, walk through every interactive element
   mentally and confirm:
   - Every transition uses var(--motion-*) and var(--ease-*).
   - No animation outside transform/opacity except scoped one-shots.
   - prefers-reduced-motion handled (covered by the utilities CSS, but
     verify nothing in the inline styles bypasses it).
   - Tap targets ≥ 44px.
   - Mobile layout intact.

5. Update COMPONENT_REGISTRY.md:
   - Dashboard Dark current version: v3 (was v2). Date 2026-04-30.
   - v2 file moved to superseded.

OUTPUT FORMAT

- Complete file contents for hearth-dashboard-dark-v3.html.
- Updated COMPONENT_REGISTRY.md.
- Brief summary of what changed visually vs v2 and any judgement calls
  you made (icon name choices, gradient opacity tweaks, etc.).

NON-NEGOTIABLES

- Do not touch hearth-dashboard-dark-v2.html. It stays as the v2 record.
- Do not introduce values not in the v2 token system.
- Do not animate width, height, top, left, padding, margin, font size,
  or letter spacing.
- No spinner anywhere. AI processing uses .hearth-thinking. Loading
  uses .hearth-skeleton.
- Brand wordmark is the only font-weight 700 in the file. Display
  greeting and section/card titles are font-weight 600.
- Ember on a border or shadow must mean something. Default cards do
  not have ember anywhere.

VALIDATION QUESTIONS BEFORE YOU FINISH

Answer these in the summary at the end:

- "Open this dashboard at 5am with the kettle on. Does it feel warmer
  than v2, the same, or colder?"
- "Pick three places ember appears. For each, justify why it's there."
- "Pick one place where motion is applied. Explain what it communicates
  to the parent and why that's the right cue at that moment."
- "If a parent has prefers-reduced-motion enabled, does any
  functionality break?"
```

---

## After Prompt B — eyeball check

Don't run any further migration prompts until you've opened
`hearth-dashboard-dark-v3.html` on a phone, in low light, and decided
whether it lands.

If it lands: a third prompt batches the remaining 21 prototypes
piecemeal as they're touched for other reasons. There is no big-bang
migration prompt — that's by design. The visual review load is too
high to do all at once, and prototypes that don't need other changes
yet shouldn't be touched solely for token renames.

If it doesn't land: tweak the tokens v2 doc, version Dashboard to v4,
and try again. The cost of one rework is far lower than the cost of
batch-migrating 22 files in the wrong direction.

---

## Quick reference — prompt order at a glance

1. Save the three architecture docs into the project repo.
2. Run **Prompt A** (setup — adds files, produces motion CSS, updates trackers, doesn't touch prototypes).
3. Run **Prompt B** (Dashboard Dark v3 reference build).
4. Eyeball check.
5. Decide: piecemeal migration of remaining prototypes, or rework v2 tokens.
