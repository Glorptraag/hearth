# Kindling Handoff — populate `capabilityTargets` on activities (WS-6)

**Status:** handoff / not yet actioned in kindling. **Owner of the change:** kindling repo (sibling checkout, not part of hearth — see CLAUDE.md "External authoring path"). **Date:** 2026-06-15. **Hearth side:** schema landed in [#195](https://github.com/Glorptraag/hearth/pull/195) (D1); workbench/QA soft-flag landed in the WS-6 D2 PR.

## Why kindling has to do this

After D1, the authoring standard for "what an activity is built to develop" is **`capabilityTargets`**, not the legacy bare `capabilityThreads`:

```ts
// activity.capabilityTargets — src/sanity/schemas/activity.ts
capabilityTargets: Array<{
  thread: Reference<capabilityThread>;   // required
  tier: 'emerging' | 'developing' | 'demonstrating';   // required, initialValue 'developing'
}>
```

`capabilityThreads` (a bare `reference[]`, no tier) stays during migration as a fallback, but it is **superseded**. The runtime already prefers targets: `src/lib/ai/thread-links.ts` runs `capabilityTargets` first (Pass 1, author-declared tier) and only falls back to bare `capabilityThreads` at `DEFAULT_TIER = 'developing'` for threads no target covers (Pass 2). DLO-evidence provenance (`declared`) and the tier it writes at both come from the target's `tier`.

Official content is authored in kindling and written to Sanity via `library/build-mode/orchestrator.ts` (direct mutations with deterministic IDs + the `register/modules.jsonl` event trail). So kindling — not hearth's publish API — is where targets must start being populated. Hearth's `/api/modules/publish` already accepts `capabilityTargets` (parent path; see `src/app/api/modules/publish/route.ts`), and `src/lib/sanity/mutations.ts` already maps `capabilityTargets?: {threadId, tier}[]`. Kindling needs the equivalent.

## What kindling needs to change (three places)

### 1. Spec-doc template — capture the tier, not just the thread

The spec template already asks which threads an activity touches. Extend that to require a **tier per thread**. Concretely, the per-activity capability block in the spec doc should be authored as `(thread code, tier)` pairs, e.g.:

```
Capability targets:
  - M1 (Number Sense & Place Value) — developing
  - EF7 (Self-Regulation & Persistence) — emerging
```

Guidance for choosing the tier lives in `docs/hearth-capability-dlo-reference.md` (the DLO descriptor per tier is the contract — pick the tier whose descriptor matches the demonstration the activity actually gives the child an opportunity to show). The six-test gate in `kin-content-write` should fail an activity that names a thread without a tier.

### 2. Build-mode orchestrator — write the `capabilityTargets` array

When the orchestrator builds the activity document, emit `capabilityTargets` as an array of objects with a unique `_key`, a `thread` reference, and the `tier` string:

```ts
capabilityTargets: targets.map((t) => ({
  _key: t.code,                                  // stable per-activity key (thread code is fine)
  thread: { _type: 'reference', _ref: `capabilityThread.${t.code}` },
  tier: t.tier,                                  // 'emerging' | 'developing' | 'demonstrating'
}))
```

Keep writing `capabilityThreads` too for now (the migration fallback). Both reference the **same** deterministic thread IDs.

### 3. Deterministic thread IDs must resolve — the canonical-thread prerequisite ⚠️

Kindling references threads by deterministic ID: `capabilityThread.<CODE>` (e.g. `capabilityThread.M1`, `capabilityThread.S5`). **This convention is correct and matches what the runtime expects** (`thread-links.ts` dereferences `capabilityThread.L1`-style IDs).

But an audit of prod (`g5zhwbxg/production`, 2026-06-15) found the canonical `capabilityThread.<CODE>` documents **are not present** — only 17 mismatched thread docs exist (random UUIDs + `seed-ct-*` stubs, with duplicate titles), so the activities' `capabilityThread.<CODE>` references currently dangle and resolve to `null`. Populating `capabilityTargets` with the same deterministic refs is still correct, but **targets will contribute nothing to the constellation until the canonical 57 thread docs are seeded with their deterministic IDs.** That seed is WS-7 / hearth-side work (`scripts/seed-capability-threads.ts`; `scripts/cleanup-legacy-thread-stubs.ts` for the stubs) and is the gating prerequisite. See `docs/ws6-starter-pack-targets-proposal-v1.md` for the full audit.

## Sequencing (per plan §12 risk row "Kindling/hearth schema drift")

1. **Hearth first (done):** schema (#195) + QA soft-flag (D2) land and soak.
2. **WS-7 prerequisite:** seed the canonical `capabilityThread.<CODE>` docs into prod; retire the UUID/`seed-ct-*` stubs. Without this, both old and new fields dangle.
3. **Kindling consumes:** spec template + orchestrator populate `capabilityTargets` for new/rebuilt content.
4. **Reference doc:** `docs/hearth-capability-dlo-reference.md` regenerated with the authoring-guidance contract (done in the same PR as this note).

## Acceptance check for kindling-authored content

- Every activity the orchestrator writes has `capabilityTargets.length >= 1`, OR is explicitly exempt (e.g. a pure workbench addendum) and logged as such.
- Each target's `thread._ref` is `capabilityThread.<CODE>` for a code in the canonical 57 (`src/lib/capability-universe-v2.ts`).
- Each target's `tier` is one of `emerging` / `developing` / `demonstrating`.
- The hearth QA dashboard (`/admin/content/qa`) shows **no** "activity declares no capability targets" warning for the pack.
