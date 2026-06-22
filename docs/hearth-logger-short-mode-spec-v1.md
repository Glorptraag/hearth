<!-- Version: 1 (DRAFT — decision-draft, not approved) | Date: 2026-06-21 | Card: cr-logger-short-mode | Author: Cowork copy/content pass | Status: AWAITING DREW APPROVAL before any build -->

# Logger Short Mode — UX spec (proposal)

> **This is a decision-draft.** It proposes a genuinely short default Logger mode and
> names the code changes it implies. Nothing here is built. Drew approves (or
> reshapes) the interaction before a single line ships.

## 1. The problem this fixes

The Logger is the heartbeat of Hearth — the one screen a parent touches every day,
and the screen the whole product is staked on being completable in under five
minutes. Right now it doesn't feel that way on first contact.

Today there are two `loggerMode` values, `guided` and `quick`, and a parent's
intuition is that "Quick" hides things. It doesn't. Both modes render all six
sections — Who, What, Engagement, When & Where, Observe, Evidence — top to bottom.
The only things `quick` actually changes are:

- the save gate (`QUICK_THRESHOLD = 50` vs `GUIDED_THRESHOLD = 65` in
  `src/lib/logger/completeness.ts`), and
- a handful of scaffolding details inside sections (the Guided bonus gates in
  `scoreCompleteness`, and `ObserveSection`'s `isGuided` chip-unfold behaviour).

So a parent who picks "Quick" still scrolls past a six-section form. The mode name
promises brevity the layout never delivers. The card behind this spec calls that
out: the short mode isn't short, it's the long form with a lower bar to finish it.

The logger spec (`docs/hearth-logger-spec-v1.md` §3) already says the floor is
"children selected, a short description, and engagement ratings — roughly 90
seconds." The data model is fine with a 90-second entry. The *layout* is what asks
for more. This proposal makes the layout match the promise.

## 2. Who this is for

The cited persona docs (`hearth-pilot-personas-v1.md`,
`hearth-parent-journey-v1.md`) don't exist in the repo as named — the pointers have
drifted. So this grounds itself in sources that do exist:

- The onboarding packet (`docs/test-family-onboarding-packet.md` §4–5) sets the
  expectation directly: *"Log one learning moment per day. Two minutes each. Don't
  worry about being thorough."* And §5: *"If something takes longer than [five
  minutes]… it's a bug, not a learning curve."*
- The founding brief (`docs/hearth-founding-brief-v1.md`) frames the parent as
  someone to be *seen and supported*, not audited — "a more confident, more present
  educator," not a data-entry clerk.

The parent we're designing the default for is tired, logging at the end of the day
or one-handed on a phone, and wants to record that today's bushwalk turned into a
half-hour on tadpoles — without being marched through six sections to do it. The
parent who *wants* the full instrument is real too, and Guided keeps serving them.

## 3. The proposal in one screen

**Default the Logger to a short, two-block capture. Everything else folds away
behind one honest "Add more" affordance.**

What renders on load in short mode:

1. **Who was learning** — the existing `WhoSection`. Unchanged.
2. **What happened** — the existing `WhatSection` description field. Unchanged.
3. **One engagement tap** — a single "How did it go?" control. Not the per-child
   engagement grid; one tap for the entry. (See §5 for the per-child question.)

Below that: a quiet, full-width **"Add more — discoveries, time and place,
observations, evidence"** button. Tapping it expands the remaining sections inline,
in place, in the order they already appear. No navigation, no modal — the form
simply grows. A parent who taps it once is, in effect, in the full form.

And the **Save** button is reachable from the short state. With Who + What + one
engagement tap filled, a parent can save. That's the 90-second entry the spec
already blesses, now with a layout that stops there instead of scrolling on.

The six-section form stays exactly as it is today, opt-in, for parents who want the
fuller capture every time.

## 4. Three states, plainly

| State | What's visible | How you get there |
|---|---|---|
| **Short (new default)** | Who · What · one engagement tap · "Add more" · Save | Default for the family unless they've chosen otherwise |
| **Expanded** | All six sections, inline | Tap "Add more" from short — the same entry, grown |
| **Full (opt-in)** | All six sections on load, today's behaviour | Family sets it as their default, or per-entry toggle |

The current Guided/Quick toggle (`GuidedModeToggle.tsx`) is the seed of the control
that picks this, but its copy and meaning need to change — see §7.

## 5. Open questions for Drew (decide before build)

These are the genuine forks. Each changes the build.

**5a. One engagement tap, or per-child?**
Short mode shows *one* engagement control for the entry. But `scoreCompleteness`
and the snapshot pipeline think per-child (engagement is `Record<string, number>`).
Two options:
- *Apply the single tap to every selected child* (one tap → same rating for all).
  Simplest; slightly lossy when a family logs two kids at once with different
  energy. Fine for the common single-child or together-mode case.
- *Show per-child taps only when more than one child is selected.* Truer, one more
  tap in the two-kid case. Recommended, but it's Drew's call on whether the extra
  conditional is worth it for the alpha.

**5b. Does "Add more" remember itself?**
If a parent always taps "Add more," are we annoying them? Option: after N
consecutive expanded saves, gently offer to make Full their default (a one-line
nudge, not a modal). Keeps short as the floor without nagging the power user. Flag
for later — not alpha-blocking.

**5c. What happens to the word "Guided"?**
See §7. The current three-way conceptual muddle (Guided / Quick / "all sections
always show") collapses into something a parent can actually predict.

## 6. Code changes implied (for scoping, not prescriptive)

A short list so Drew can size this. None of it is written.

- **`src/app/(auth)/log/page.tsx`** — the composition root. Gate
  `EngagementSection` (full grid), `WhenWhereSection`, `ObserveSection`,
  `EvidenceSection`, and the per-child discovery fields inside `WhatSection`
  behind an `expanded` boolean. Add the single-tap engagement control and the
  "Add more" button for the short state. This is the bulk of the work.
- **`src/lib/logger/completeness.ts`** — `scoreCompleteness` currently rewards
  observations, evidence, duration, location. In short mode none of those are
  visible, so the score must reach the save gate from Who + What + engagement
  alone. Today: Who (20) + description >20 chars (15) + engagement rated (up to
  15) + date (3) = ~53, already over `QUICK_THRESHOLD` (50). So **the threshold
  may not need to move** — but confirm with the single-tap engagement change,
  since 5a affects the engagement term. If short-mode entries land just under 50,
  either nudge `QUICK_THRESHOLD` down a touch or add a small "short entry" base.
  Decide from real arithmetic once 5a is settled, not by guessing.
- **Mode naming** — rename or repurpose the `loggerMode` values. The persisted
  field is `loggerDefaultMode` on the family row (see
  `use-logger-mode-and-snapshot.ts` and the `GuidedModeToggle` PATCH to
  `/api/family`). Any rename needs a migration plan for existing values
  (`guided`/`quick`). Keep it backward-compatible: map old `quick` → short,
  `guided` → full, so no family loses their preference.
- **`GuidedModeToggle.tsx`** — new copy (§7), and it now genuinely changes what's
  on screen, not just the save bar.
- **Tests** — `completeness.test.ts` and `use-completeness-ui.test.tsx` assert the
  current scoring. They'll need new cases for the short-state score path. The
  behaviour-preserved refactor notes in CLAUDE.md mean these are well-covered
  already; extend, don't rewrite.

## 7. Copy (proposed, Australian English)

The toggle stops being "Guided / Quick" — neither word tells a parent what they'll
see. Proposed labels and the info popover:

**Toggle:** `Short` / `Full`

**Short — popover:**
> Capture the essentials — who, what, and how it went — in about a minute. Tap
> *Add more* anytime to note discoveries, time and place, what you observed, or
> attach evidence.

**Full — popover:**
> Every section, open from the start. Good for the days you want to capture the
> whole picture, or when you're building your observation eye.

**The "add more" button itself:**
> + Add more — discoveries, time & place, observations, evidence

Notes on voice: leads with the concrete ("who, what, and how it went"), no hype, no
"meets you where you are." "About a minute" is a promise we can keep given the
existing 90-second floor. Nothing here privileges a pedagogy — "building your
observation eye" is method-neutral (it's good practice for a Charlotte Mason parent
and an unschooler alike), and it's already the framing the current Guided popover
uses, so it's not new editorial ground.

## 8. What this deliberately does NOT do

- It doesn't remove the full form. Power users and thorough days keep it.
- It doesn't touch the enrichment pipeline, the snapshot, or any downstream read.
  A short entry produces the same shaped payload with fewer fields filled — which
  the model already tolerates (the spec's 90-second entry is exactly this).
- It doesn't add a runtime AI call or change the save → enrich → snapshot flow.
- It doesn't change Batch / CSV import paths.

## 9. Recommendation

Ship short-as-default for the alpha. It's the single change that makes the
five-minute rule *felt* on the first screen a parent meets, and it costs us nothing
downstream because the data model already accepts a thin entry. Settle 5a (the
engagement question) first — everything else sizes off that. Decline 5b for alpha
(nice-to-have), accept 5c (the rename is overdue).

---

*Decision-draft for cr-logger-short-mode. Pending Drew's sign-off on §5 before build.*
