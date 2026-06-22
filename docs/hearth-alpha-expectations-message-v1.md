<!-- Version: 1 (DRAFT — decision-draft, not approved) | Date: 2026-06-21 | Card: cr-alpha-frame | Author: Cowork copy/content pass | Status: AWAITING DREW REVIEW. Pairs with docs/test-family-onboarding-packet.md -->

# Alpha expectations message — "what's polished, what's wobbly, what's coming"

> **Decision-draft.** This is the explicit expectations-setting copy for pilot
> families, written so that when a family hits an unfinished corner they think
> *"ah — that's one of the bits they told me about,"* not *"this thing is broken."*
> It's meant to slot into `docs/test-family-onboarding-packet.md` as a new section
> (proposed **§2a**, immediately after "What 'alpha pilot' means in practice"),
> or go out as the second screen of the welcome email. Drew picks placement and
> signs off the area-by-area honesty before it ships.

---

## Why this exists (note for Drew, not for families)

The packet already says Hearth is "actively being built" (§2). That's the right
posture, but it's abstract — a family reads it, nods, and still gets a jolt when the
pedagogy wizard stutters or only one content pack has real depth. This message makes
the unevenness *specific and predictable*. A named rough edge reads as candour. An
unnamed one reads as a shaky launch. Same bug, opposite feeling.

The three buckets below are mapped to the actual readiness state
(`docs/production-readiness-tracker.md`, `docs/alpha-readiness-pickup.md`) as of this
draft. **Re-check them against the tracker before each invite wave** — the line
between "wobbly" and "solid" moves week to week, and the whole point is that this
list is true on the day a family reads it.

---

## The family-facing copy

### Where Hearth is solid, where it's still wobbly, and what's not built yet

We'd rather you know this going in than discover it the hard way. Here's an honest
map of the app you're about to use.

**Lean on these — they're solid.**

- **Logging a learning moment.** This is the heart of Hearth and the part we've
  worked hardest on. Write a few honest sentences about what your child did, and it
  saves. If you lose signal mid-entry, your draft is kept on the device — finish it
  when you're back online.
- **The AI making sense of your entry.** When you save, Hearth reads what you wrote
  and tags the subjects and capability threads behind it, then writes a short
  summary. It runs once, on save. This works, and it's the bit that makes the daily
  two minutes worth it.
- **Watching capability threads grow.** Open **Our Story** after a few entries and
  you'll see the threads start to glow for each child, down to the specific
  learning objectives underneath them. This is built and working.
- **Exporting your documentation.** The Portfolio and report export from
  **Settings → Reports** produce a real PDF you can hold. (More on what to do with
  it under "wobbly" — please read that part.)
- **Your data, in and out.** Export everything or delete everything from
  **Settings → Account**, one click each, effective immediately. Privacy is spelled
  out in plain language in §7 of your welcome packet.

**Expect some wobble here — it's newer.**

- **The pedagogy setup.** When you choose your philosophy during onboarding (or
  re-run it later from Settings), you're using the newest part of the app. It's been
  built and checked, but you're among the first humans to actually click through it.
  If a step feels stuck or a choice doesn't save, that's worth a quick note to us —
  you've probably found something we couldn't.
- **The report, as a compliance document.** The PDF Hearth generates is *our*
  format — it's designed around what Home Education Units ask for, but it hasn't been
  signed off against an official Queensland (or your state's) template. **Treat it as
  strong supporting documentation, and cross-check it against your own judgement
  before you submit anything to a regulator.** As real families submit real reports,
  we'll tighten it against what actually comes back.
- **The depth of ready-made content.** The Starter pack is properly built out.
  A few more packs are in the app but still in draft — lighter, less polished, and
  not yet mapped the way the Starter pack is. If a module feels thin, it probably is,
  and that's on our list, not a sign you've done something wrong.

**Not built yet — it's coming.**

- **A proper offline / installable app.** Right now Hearth keeps your draft safe if
  you drop signal mid-entry, but it isn't yet a full offline app you can install and
  use on the train with no connection. That's planned, not present.
- **Anything that needs more than one region.** Behind the scenes, a few protections
  are tuned for the pilot's size. They'll be rebuilt before Hearth grows beyond it.
  You won't see this — it's a note so you know we know.

**One promise that won't wobble:** the pilot is free, there's nothing to buy inside
it, and there are no ads — not now, and not as a surprise later. If paid plans ever
arrive down the track, you'll hear about it first and you'll get to choose.

**And the deal that makes the wobble worth it:** when you hit one of these rough
edges, telling us is the single most useful thing you can do. You're not a
complaining customer — you're the reason the next family won't hit it. Every report
goes straight to Drew (channels and response times in §6 of your packet).

---

## Operator notes (internal — strip before sending)

- **Tone check:** this leads with strengths, names weaknesses without flinching, and
  hands the family a job (tell us) rather than an apology. Keep that order if you
  edit — strengths first earns the honesty that follows.
- **Philosophy-neutral:** the pedagogy bullet names the *setup flow* as wobbly, never
  a philosophy. Don't let an edit imply one tradition is better-supported than
  another — they're meant to be equal citizens.
- **No freemium language:** the "won't wobble" paragraph restates the packet's §2
  no-purchase / no-ads promise. Keep it; it's load-bearing for trust and it matches
  the Terms (tracker #22).
- **Keep it current — this is the maintenance burden:** the three buckets are only
  reassuring while they're true. Before each invite wave, reconcile against
  `production-readiness-tracker.md`. Specific things that will move:
  - When the 3 draft packs (tracker #26) get their editorial pass, move "depth of
    ready-made content" up to solid.
  - When the pedagogy wizard gets real browser QA across a few families
    (tracker #11), soften or retire the "you're among the first" line.
  - When the report's been validated against regulator feedback (tracker #23 is
    "ship our own format and iterate"), revisit the compliance-document caveat.
  - When PWA / offline sync lands (tracker #29 notes it as Phase 2), move it out of
    "not built yet."
- **Placement recommendation:** in the packet as §2a. It reads as a natural
  deepening of §2's "actively being built," and §5's five-minute rule then lands as
  the standard we're holding *ourselves* to — which is exactly the frame we want.

---

*Decision-draft for cr-alpha-frame. Pending Drew's area-by-area accuracy check and
placement decision before it goes to families.*
