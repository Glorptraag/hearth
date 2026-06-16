# WS-6 — Starter Pack `capabilityTargets` proposal (per-tier, editorial)

**Date:** 2026-06-16 · **Author:** D2 (outcomes-spine Phase 2) · **Status:** PROPOSAL — nothing written to prod · **Decision owner:** Drew
**Persona / stage:** Bec (Builder, QLD veteran) — **Stage 6**, "modules writing to standards". This is the long-horizon keystone: a published activity declares which outcomes it offers, and completing it grows a `declared`-provenance DLO in the drill-down.

This is the reviewable proposal called for in the D2 brief: make the WS-6 authoring contract **live** on real content, starting with the Starter Pack. Unlike the #199 dry-run (a blanket mechanical migrate-all-threads-to-`developing`), this proposal reads each activity's actual content against the per-tier DLO descriptor and assigns the tier the activity gives a child an opportunity to demonstrate.

## TL;DR

- **The WS-7 blocker is RESOLVED.** Prod (`g5zhwbxg/production`, audited 2026-06-16) now has all **57 canonical `capabilityThread.<CODE>` docs** — the #199 audit (2026-06-15) found them absent; they have since been seeded (Track A / canonical-thread seed). So targets will resolve and fire, not dangle.
- The **Starter Pack = "Hearth Starter Collection"** (`drafts.seed-pack-starter-collection`): **9 published activities** across 3 modules. **0 have `capabilityTargets` today.**
- This proposes **17 targets across all 9 activities** (every activity gets ≥1). All 9 threads + all 11 implied `dlo.<thread>.<tier>` ids are verified present and published in prod.
- **6 targets are high-confidence** (Bread module — threads were already correct; we chose the tier). **11 are flagged for review** (Stars had no threads; Patterns' legacy `C1` is a mistag).
- Apply is gated: `scripts/apply-capability-targets.ts` is **dry-run by default**, `setIfMissing` only (never overwrites), and refuses to write while any thread/DLO ref dangles.

## Editorial method

- **Descriptor is the contract.** For each thread the activity touches, the tier = the band whose descriptor (`docs/hearth-capability-dlo-reference.md`) matches what an observer would actually see in the child's behaviour during *this* activity.
- **Tie-break low (B1 gold-label principle).** When a capability only shows in a single familiar context, prefer the LOWER tier. No activity here is tagged `demonstrating` — nothing in a foundational Starter Pack generalises a capability across contexts.
- **Don't propagate mistags.** Where a legacy `capabilityThreads` entry is wrong for the content (Patterns → `C1` Narrative), we do not carry it into the new authoritative field; we propose the correct thread and flag it.

## The Starter Pack tree (audited 2026-06-16)

| Module | Activity (`_id`) | Legacy threads | Content |
|---|---|---|---|
| Kitchen Chemistry: The Magic of Bread | Measure & Mix (`seed-act-measure-mix`) | M5, S5 | Measure flour/water with cups, estimate first, talk fractions; notice texture change |
| | Knead & Wait (`seed-act-knead-wait`) | S5 | Knead 8–10 min; observe & **record dough size** every 10–15 min; predict the rise |
| | Shape, Bake & Discover (`seed-act-shape-bake`) | S5, M5 | Divide into **8 equal pieces**; time 2nd rise; bake; taste & compare |
| Stories in the Stars | Find the Southern Cross (`seed-act-stars-a1`) | — | Go outside after dark, locate the Southern Cross |
| | Draw Your Own Constellation (`seed-act-stars-a2`) | — | Connect dots on black paper, write its story |
| | Constellation Stories… (`seed-act-stars-a3`) | — | Read & compare Indigenous Australian and Greek star stories |
| Nature's Patterns | Nature Pattern Hunt (`seed-act-patterns-a1`) | M1, **C1** | Collect/photograph 5 patterns in nature |
| | Pattern Rubbings (`seed-act-patterns-a2`) | M1, **C1** | Rub crayon over textured objects to reveal patterns |
| | Fibonacci in the Garden (`seed-act-patterns-a3`) | M1, **C1** | Count spirals on sunflowers/pinecones, discover Fibonacci |

## Proposed targets

### Bread / Kitchen Chemistry — HIGH confidence (threads correct; tier chosen)

| Activity | Proposed `capabilityTargets` | Why |
|---|---|---|
| Measure & Mix | **M5 developing**, **S5 emerging** | M5: measures with cups/teaspoons, estimates before measuring, fractions talk = informal+standard units, growing accuracy → developing. S5: one scaffolded observation ("notice if they comment on texture changes") — single detail in a familiar context → emerging. |
| Knead & Wait | **S5 developing** | Observes the dough every 10–15 min and **records its size**, notices texture change over time, predicts the rise = "notices changes over time + describes multiple details" → developing. |
| Shape, Bake & Discover | **M5 developing**, **S5 developing** | M5: divides into 8 equal pieces (informal-unit judgement), times 2nd rise, sets oven temp. S5: connects 2nd rise to 1st (pattern across observations), sensory tasting language (multiple details). |

### Stars — REVIEW (no legacy threads; threads proposed)

| Activity | Proposed `capabilityTargets` | Why / flag |
|---|---|---|
| Find the Southern Cross | **S3 emerging**, **S5 emerging** | S3 emerging descriptor is literally "Notices sky (sun, moon, clouds, **stars**)". S5: slows down to pick a star pattern out of the sky. |
| Draw Your Own Constellation | **C5 emerging**, **C1 emerging** | C5: connects dots to create an image of an imagined thing. C1: "write its story" = a simple invented story. |
| Constellation Stories… | **H6 developing**, **L9 emerging** | H6: "read and **compare** Indigenous Australian and Greek stories" structures a respectful cross-cultural comparison (developing). **⚠️ Confirm H6 tier** — drop to `emerging` ("notices cultural difference") if the comparison stays light. L9: enjoys/responds to stories read aloud (comparing-texts is the upgrade path). |

### Patterns — REVIEW (legacy `C1` is a mistag; `M4` is the right maths thread)

| Activity | Legacy | Proposed `capabilityTargets` | Change |
|---|---|---|---|
| Nature Pattern Hunt | M1, C1 | **M4 emerging**, **M1 emerging** | +M4 (correct pattern thread), keep M1 (counts 5), **drop C1** |
| Pattern Rubbings | M1, C1 | **M4 emerging**, **C5 emerging** | +M4, +C5 (texture/visual), **drop C1**, drop M1 (no counting) |
| Fibonacci in the Garden | M1, C1 | **M4 developing**, **M1 emerging** | +M4 (Fibonacci = "growing pattern" → developing), keep M1 (counts spirals), **drop C1** |

**Why `C1` is dropped, not carried:** `C1` = *Narrative & Storytelling*. There is no storytelling in a pattern hunt / rubbing / spiral-count — it is a seed-data mistag. Writing a narrative target onto these would make the constellation dishonest, which is exactly what the outcomes-spine plan exists to fix. The correct maths thread for pattern work is **M4 (Algebraic Thinking & Patterns)**, whose descriptors name "patterns" directly.

## Two decisions for Drew

1. **Patterns re-thread (C1 → M4).** Approve replacing the legacy `C1` mistag with `M4` (+ `C5` on the rubbing)? *Recommended: yes.* Alternative (more conservative): apply Bread + Stars now, defer Patterns to the content re-thread pass.
2. **H6 tier on `stars-a3`** — `developing` (the activity says "compare") vs `emerging` (thin one-line content; tie-break low). *Recommended: `developing`, with a note to downgrade if the guided comparison turns out light.*

> Note on the legacy field: this apply is **purely additive** — it writes only `capabilityTargets`, never touches `capabilityThreads`. The `declared`-DLO-opportunity write path reads **only** `capabilityTargets`, so dropping `C1` from the *targets* keeps the DLO layer clean. The legacy `C1` still lives in `capabilityThreads` and continues to feed the older snapshot thread-count fallback exactly as it does today — cleaning that is part of the follow-up re-thread pass, not this PR.

## How to review / run

```bash
# DRY RUN (default — writes nothing; prints every patch + integrity check)
npx tsx scripts/apply-capability-targets.ts

# scope/stage to specific activities
npx tsx scripts/apply-capability-targets.ts --only seed-act-knead-wait,seed-act-measure-mix

# APPLY (gated on Drew). setIfMissing only; refuses while any thread/DLO ref dangles.
npx tsx scripts/apply-capability-targets.ts --apply
```

Source of truth for the targets: [`scripts/data/starter-pack-targets.ts`](../../scripts/data/starter-pack-targets.ts).

## Verification plan (on apply)

1. `--apply` → re-query: `activitiesWithTargets > 0` for the Starter Pack (expect 9); spot-check one activity's `capabilityTargets[].thread->{_id}` resolves.
2. Simulate the entry-save path (per D-OS1): a completed run on a targeted activity (e.g. `seed-act-knead-wait` → `S5 developing`) writes a `provenance: 'declared'`, `evidence_state: 'opportunity'` row at `dlo.S5.developing` in `observation_dlo_links`, and **does not** move `learner_dlo_status` (opportunity ≠ evidence until corroborated). Exercised through the integration harness (local Postgres; real prod targets), not by polluting prod data.

## Out of scope (follow-up for Drew)

- **The other 154 thread-bearing activities** across the non-Starter-Pack packs (The Golden Years 96, Backyard Scientist 38, Faithful Thinkers 14, …) — the #199 mechanical `developing` migration (`scripts/propose-capability-targets.mjs --apply`) covers these behaviour-preservingly; a per-tier editorial pass like this one is the higher-quality option.
- **~120 thread-less activities** (Pilgrim's Progress, Cracking Katakana, Music Makers, Story Architects, …) need genuine authoring.
- **Kindling-side population at source** for new/rebuilt content — see `docs/kindling-capability-targets-handoff-v1.md`.
- **Patterns `C1` cleanup in `capabilityThreads`** (the legacy snapshot-fallback layer) — part of the re-thread content pass.
