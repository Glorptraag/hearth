# WS-6 — Starter Pack `capabilityTargets` proposal (gated on Drew)

**Date:** 2026-06-15. **Author:** D2 (outcomes-spine Phase 2). **Status:** PROPOSAL — nothing has been written to prod. **Decision owner:** Drew.

This is the reviewable proposal called for in WS-6 Part 2: identify which Starter Pack activities lack `capabilityTargets` and propose additions. The companion tool is [`scripts/propose-capability-targets.mjs`](../scripts/propose-capability-targets.mjs) (dry-run by default).

## TL;DR

- **0 of 274 prod activities have `capabilityTargets`.** D1 (#195) shipped the field; no content uses it yet.
- The script can **mechanically migrate 154 activities** (those carrying legacy `capabilityThreads`) into `capabilityTargets` at tier `developing` — behaviour-preserving (see below). **91 activities have no threads** and need genuine authoring.
- **⚠️ Hard prerequisite (WS-7):** the canonical `capabilityThread.<CODE>` docs referenced by activities **do not exist in prod**. Targets would dangle exactly like the threads do today until those are seeded. **Do not apply the migration until WS-7 lands.**
- **Recommended first scope:** the "Hearth Starter Collection" pack (9 activities) and/or The Golden Years (96, all mechanical). Drew picks.

## Dataset reality (audited 2026-06-15, `g5zhwbxg/production`)

| Fact | Value |
|---|---|
| Pack docs (`status=="published"`) | 30 |
| …truly live (no `drafts.` overlay, served to families) | **3** — Music Makers, Story Architects, The Golden Years |
| …Sanity-draft only (`drafts.` prefix; not served) | 27 *(intentional — see content-hierarchy audit)* |
| Activities total | 274 |
| Activities with `capabilityTargets` | **0** |
| Activities with legacy `capabilityThreads` | 154 |
| Activities with neither (the QA soft-flag fires here) | 120 |

The 27 draft packs are intentional (not a bug — do not "republish-fix"). Because they're Sanity-drafts, the forward `modules[]->approaches[]->activities[]->` walk only resolves activities for trees whose nodes exist as published docs. The script resolved **245 of 274** activities across 9 packs; the remaining ~29 live in draft-only trees and need the WS-7 draft cleanup before they can be tabulated cleanly.

## Per-pack breakdown (what the script resolved)

### Mechanically migratable (carry legacy threads → propose targets at `developing`)

| Pack | Activities to migrate |
|---|---|
| The Golden Years *(live)* | 96 |
| Backyard Scientist *(draft)* | 38 |
| Faithful Thinkers *(draft)* | 14 |
| Hearth Starter Collection *(draft)* | 6 |
| **Total** | **154** |

### Needs authoring (no threads to seed from — human/Kindler pass)

| Pack | Activities needing authored targets |
|---|---|
| The Pilgrim's Progress *(draft)* | 22 |
| Cracking Katakana *(draft)* | 18 |
| The Lion, the Witch and the Wardrobe *(draft)* | 17 |
| Music Makers *(live)* | 16 |
| Story Architects *(live)* | 15 |
| Hearth Starter Collection *(draft)* | 3 |
| **Total** | **91** |

## The mechanical migration is behaviour-preserving

`src/lib/ai/thread-links.ts` already assigns bare `capabilityThreads` the tier `DEFAULT_TIER = 'developing'` (Pass 2). The proposal sets one target per existing thread, **reusing the same thread `_ref`**, at `developing`. So after applying, the constellation output is byte-identical to today — the migration only makes the implicit tier explicit in the authoring field. Authors then promote/demote individual tiers where `developing` is wrong (the DLO descriptors in `docs/hearth-capability-dlo-reference.md` are the guide).

The 91 no-thread activities cannot be migrated this way (nothing to seed from) and contribute nothing to the constellation today — they need an author to choose `{thread, tier}` per activity.

## ⚠️ Why you cannot apply this yet (WS-7 blocker)

Activities reference threads by deterministic id (`capabilityThread.M1`, `capabilityThread.S5`, …). **Those documents are absent from prod** — only 17 mismatched thread docs exist (random UUIDs + `seed-ct-*` stubs, with duplicate titles like two "Scientific Observation"). So today the threads dangle and resolve to `null`; the proposed targets would reuse the same refs and dangle identically. No regression, but no gain.

**Sequence:** seed the canonical 57 threads with deterministic ids (`scripts/seed-capability-threads.ts`) and retire the stubs (`scripts/cleanup-legacy-thread-stubs.ts`) — WS-7 — **then** apply this migration. The script enforces this: it refuses `--apply` while referenced threads don't resolve (override only with `--force-dangling` + explicit sign-off).

## How to review / run

```bash
# dry run — prints the per-pack breakdown + sample patches, writes nothing
node scripts/propose-capability-targets.mjs --json /tmp/ws6-proposal.json

# scope to the Starter Pack only
node scripts/propose-capability-targets.mjs --pack hearth-starter-collection

# AFTER WS-7 seeds the canonical threads, and with Drew's sign-off:
node scripts/propose-capability-targets.mjs --apply            # migratable packs only
```

`--apply` only writes population (1) (threads → targets), only `setIfMissing` (never overwrites existing targets), and never touches `capabilityThreads`.

## Decisions for Drew

1. **Scope of the first content pass** — "Hearth Starter Collection" (9), The Golden Years (96, all mechanical), or all 154 migratable? (Recommend: Golden Years first — biggest behaviour-preserving win, and it's live.)
2. **Tier policy** — accept the mechanical `developing` default and refine later, or author tiers up front for the headline packs?
3. **Authoring the 91 no-thread activities** — kindling rebuild (preferred, per the handoff note) vs. a one-off authored proposal here.
4. **WS-7 ordering** — confirm the canonical-thread seed lands before any `--apply`.

See `docs/kindling-capability-targets-handoff-v1.md` for how new/rebuilt content gets targets at source.
