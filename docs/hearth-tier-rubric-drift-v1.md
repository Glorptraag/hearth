# Tier rubric — drift note & decision needed (cr-tier-rubric)

> **Status:** blocked on a product decision. No parent-facing rubric copy ships
> until the canonical "what moves a thread" bar is chosen. This note exists so
> Drew can make that call with the real code in front of him.
> **Date:** 2026-06-21. **Owner of the decision:** Drew.

## The card

cr-tier-rubric (from the 2026-06-19 prelaunch council, Learning Designer seat)
asks us to tell parents *what* moves a capability thread from
emerging → developing → demonstrating, instead of only promising that threads
"grow as evidence builds".

The original plan was to write a short plain-language rubric and surface it in
the Constellation. While confirming the tier logic before writing that copy, a
material drift turned up: **the bar the rubric would describe is not the bar the
code enforces.** Writing the rubric now would either describe behaviour we don't
want to stand behind, or promise behaviour the code doesn't do. So the rubric is
held pending the decision below.

## What the UI currently promises

`src/app/(auth)/our-story/capabilities/page.tsx:130` (Constellation empty state):

> "As you log learning moments, Hearth maps them to capability threads
> automatically. Each thread grows from emerging to demonstrating as evidence
> builds."

`GalleryView.tsx:587` reinforces it visually: *"Left → right reads as tier
progression. The right edge is mastery."* Nowhere is "as evidence builds"
defined for the parent.

## What the code actually does

There are **two** different tier mechanisms in play, and they disagree with each
other as well as with the handoff's stated bar.

1. **Thread tier (the headline emerging/developing/demonstrating on a thread)** —
   `src/lib/ai/snapshot-rebuild.ts` (~line 144). Pure observation **count**:

   - `count >= 8` → demonstrating
   - `count >= 4` → developing
   - otherwise → emerging

   Every enrichment match on a thread is `+1`, **regardless of confidence or
   evidence type** — an AI-inferred mention counts the same as a corroborated,
   parent-declared moment with a work sample. A parent `tierOverride` exists but
   can only *lower* a tier, never raise it.

2. **Per-tier "moments" pips inside a thread drill-down** —
   `GalleryView.tsx` `GalleryDLOs` (~line 540). Buckets each moment by AI
   **confidence**: `>= 0.8` demonstrating, `>= 0.65` developing, else emerging;
   anything below `0.5` is dropped. This is a *different* rule from the thread
   tier above, shown on the same screen.

(There is a `computeEvidenceQuality` / `recent_evidence_quality` signal in
snapshot-rebuild, but it does **not** gate the tier — it's surfaced separately.)

## The bar the handoff/council actually wants

The handoff describes the intended bar as: **"demonstrating = corroborated
declared/asserted only, never inference."** The Learning Designer's review
(`docs/reviews/prelaunch-council-2026-06-19/01-learning-designer.md`, §"The
progression is asserted, not assessed") makes the same point sharply:

> "A thread advances from 'emerging' to 'demonstrating' as *evidence
> accumulates* — but accumulation is a count, not a judgement of depth… the
> progression ladder the Constellation promises ('grows… as evidence builds') is
> really 'grows as evidence is *counted*'. The tier bands exist; the rubric that
> should govern movement between them does not."

That bar is **not implemented.** Neither mechanism above checks whether evidence
is declared/asserted vs inferred.

## The decision Drew needs to make

Pick the canonical bar **before** any rubric copy ships:

- **Option A — Describe the count bar honestly.** Cheapest. But the rubric would
  read "a thread reaches demonstrating after roughly eight logged moments", which
  is gameable, invites thin-logging to chase tiers, and is the behaviour the LD
  review calls "backwards". Not recommended as the public promise.

- **Option B — Build the corroboration bar, then write the rubric to it.**
  Requires a code change in `snapshot-rebuild.ts` so tier movement weights
  evidence type/confidence (corroborated declared/asserted moves a thread;
  low-confidence inference does not). Aligns the headline thread tier with the
  per-tier confidence bucketing already in `GalleryDLOs`, removing the
  two-mechanism disagreement. The rubric then describes something we're proud of.
  Recommended, but it's engineering work, not a copy pass.

- **Option C — Soften the UI promise for alpha, defer the rubric.** Change the
  empty-state line so it doesn't over-claim a depth judgement (e.g. "Each thread
  fills in as you log moments that touch it"), and ship the real rubric once the
  bar is built. Lowest-risk holding position for the pilot.

## What this note deliberately does **not** do

- It does not edit the Constellation UI or add rubric copy.
- It does not change any tier logic.

Once Drew picks A / B / C, the follow-up is a normal scoped change: a copy edit
for A or C, or a `snapshot-rebuild.ts` change plus rubric copy for B.

## Pointers (confirmed 2026-06-21)

| Thing | Location |
|---|---|
| UI promise ("as evidence builds") | `src/app/(auth)/our-story/capabilities/page.tsx:130` |
| "right edge is mastery" rail | `src/app/(auth)/our-story/capabilities/_constellation/GalleryView.tsx:587` |
| Thread tier = count (4 / 8) | `src/lib/ai/snapshot-rebuild.ts` (~144) |
| Per-tier pips = confidence (0.65 / 0.8) | `GalleryView.tsx` `GalleryDLOs` (~540) |
| Tier labels / glyphs | `…/_constellation/topology.ts:143-155` |
| Council source for the card | `docs/reviews/prelaunch-council-2026-06-19/01-learning-designer.md` |

> Note: the handoff referenced a `PRODUCTION_TIER_BAR` constant and
> `docs/hearth-pilot-personas-v1.md` / `docs/hearth-parent-journey-v1.md`. None
> of those exist in the repo as of this date — the bar lives implicitly in
> `snapshot-rebuild.ts`, and the persona/journey docs are absent.
