# Build-mode orchestrator — implementation session

> **Date:** 2026-04-30 (Australia/Brisbane)
> **Mode:** Build-mode tooling (a one-step-removed scribe pass — the work IS the
> tooling, not content production)
> **Author:** Cowork (sub-agent worktree off `claude/goofy-mcnulty-4b6ba1`)
> **Branch:** `worktree-agent-af7c5918`
> **Files created:**
> - `claude-kindling/library/build-mode/orchestrator.ts`
> - `claude-kindling/library/build-mode/spec-parser.ts`
> - `claude-kindling/library/build-mode/sparse-content-checks.ts`
> - `claude-kindling/library/build-mode/README.md`
> - `claude-kindling/design/sessions/2026-04-30-build-mode-orchestrator.md` (this file)

---

## Goal

Stand up `claude-kindling/library/build-mode/orchestrator.ts` — the script that walks a
single module from `specced` to `content_constructed`, enforcing the v1.1 ruleset and the
bucket model. The brief is in the spawning message: parse a module spec, verify the
register gate, walk approaches and activities, prompt the operator for activity content,
run sparse-content checks before each create, fire register events, patch references,
fire `content_constructed` if and only if every activity passed hard-fail checks, surface
a close-out summary.

This is calibration tooling. Until it exists, build mode is a manual procedure described
in `CLAUDE.md` §4.2 and there's no enforcement layer for the sparse-content criteria, the
[NEEDED] flow, or the bucket gate.

---

## What landed

Three TypeScript files, one README, this session note. Files documented inline; key
design decisions captured below.

### Architecture

```
spec-parser.ts          ─┐
                         │  pure parsing, no I/O beyond readFile
                         │
sparse-content-checks.ts ─┤  pure validation, no I/O
                         │
orchestrator.ts          ─┴─→ register helper, @sanity/client, @inquirer/prompts
```

The two pure modules can be unit-tested in isolation (no Sanity creds, no terminal,
no register touch) and reused by patrol-mode and review-mode tools later.

### Spec parser

Tolerant of the spec's mixed formal/narrative shape. It harvests:

- Header (kindlingId, packRef, status, last revised, spec authored by)
- "Module at a glance" block (subjects, age range, approach count, worldview)
- Pillar 1: target understanding + three-tier indicators
- Pillar 2: duration labels (free-form text — durations are summarized in prose)
- Pillar 3: AC codes (regex-extracted) + capability threads (table-row-extracted)
- Pillar 4: every deterministic resource ID found ANYWHERE in the document, deduped,
  with status pulled from the `[NEEDED] summary` table when present
- Approach lineup (modality, angle, texture, activity count, duration label)
- Pillars-confirmed checklist (the four checkboxes at the bottom)

Decisions:
- **Resources are harvested by regex over the whole doc, not just from a single
  table.** Spec docs scatter resource references throughout the per-approach sections
  AND in the summary table. Trying to enforce one canonical location was brittle;
  the union-of-all-IDs approach is robust to format drift.
- **The parser does not validate the spec.** It returns `null` / `[]` for missing
  fields. The orchestrator decides how to react. This keeps the parser as a reference
  implementation that can be reused by patrol mode without any hard-coded gating.

### Sparse-content checks

Three entry points: `checkActivity`, `checkModule`, `checkPack`. Each returns
`{ hardFails: string[], softWarnings: string[] }`. Criteria codes match
`design/sparse-content-detection.md` §5 verbatim.

Decisions:
- **Hard-fails block; soft warnings record.** This matches the doc's severity model
  exactly. `combineResults` and `passes` helpers provided so callers don't need to
  recompute.
- **Two heuristics that the doc says "needs human judgment" are still implemented as
  soft warnings**: `topic-label-not-insight` (very-short understanding goal or
  starts-with-"Understand") and `tier-indicators-too-similar` (Jaccard token-overlap
  >0.7 between any two tiers). Heuristic, conservative, soft only — Drew can
  override.
- **Emoji detection** uses Unicode pictographic ranges. Conservative; will flag
  decorative glyphs but won't catch every variant. The ruleset's emoji prohibition is
  absolute, so erring on flagging is correct.

### Orchestrator

`@inquirer/prompts`-driven, runs from the hearth-main root. Highlights:

- **Idempotency** via `sanity.getDocument()` checks at deterministic IDs before each
  create.
- **Direct mutations** (createOrReplace) instead of `/api/modules/publish` — that
  endpoint sets `authorFamilyId` and inserts into `family_library`, violating the
  editorial rule (`design/sanity-schema-reference.md` §7). The orchestrator inlines
  enough of the Sanity primitives to avoid importing platform-side helpers (which
  would require platform-side env loading at module-init time, defeating
  `--dry-run`).
- **Register events fired in lockstep with Sanity writes**, not retroactively. If a
  Sanity write fails, the corresponding `created` event isn't fired — drift is
  contained to incomplete tail rather than ghost events.
- **Hard-fail blocks creation AND fires a flagged event**, so the failure is on the
  audit trail even though no Sanity doc exists. Drew can re-run after revising the
  prompt answers.
- **`[NEEDED]` flags are written once.** If a `flagged: asset-needed` event already
  exists for an ID, the orchestrator skips re-flagging.

---

## Decisions worth flagging back to Drew

1. **The orchestrator creates the module Sanity document if absent.** The brief says
   "validates the spec is at `specced`" and "for each approach in the spec... creates
   an approach". It doesn't say what to do if the module doc itself is missing. The
   spec for module-1-1 is currently at `ideated → draft spec` — nothing's in Sanity
   yet. The orchestrator infers: if the module isn't in Sanity, create it (with
   `createdVia: 'editorial'`, `authorFamilyId` unset). If you'd prefer the
   orchestrator to refuse and surface this as a separate handoff to a "module-doc
   creator" tool, change the `ensureModuleDoc` function to throw.

2. **The orchestrator uses the kindlingId AS the Sanity `_id`.** This matches the
   convention in `design/sanity-schema-reference.md` §8 and how `build-resources.ts`
   already does it. Caveat: kindlingId for a module is `module.1.1.looking-closely`,
   which has dots — Sanity tolerates dots in `_id` (we already use them for
   `template:nile-map-blank` etc.). The deterministic-ID convention is treated as
   load-bearing throughout.

3. **The instructions field is collected via `@inquirer/prompts.editor`.** This opens
   the operator's `$EDITOR` for multi-line prose entry. Because the editor returns
   plain text, the orchestrator converts via `blockText()` — only `style: 'normal'`
   blocks. **Custom block styles (`sayBlock`, `pauseNote`, `watchBlock`) are not
   yet surfaced in the prompt.** This is consistent with `mutations.ts` today, but
   the schema reference §11 OQ #3 asks whether the helper should be extended.
   Flagged in `build-package/open-questions.md` (see the section appended by this
   work).

4. **Pack documents are out of scope.** The orchestrator handles modules and below.
   Pack creation requires the editorial endpoint or direct-mutation path that
   handles the rich `pack.intro` object and the modules array — both of which are
   pack-spec-driven, not module-spec-driven. This belongs in a sibling `pack-mode`
   tool.

---

## Open contradictions

I scanned the design specs against each other while building. **No outright
contradictions found**, but two ambiguities I resolved with documented defaults:

### Ambiguity 1 — what to do when the spec doc has stale checkboxes

The spec doc `module-1-1-looking-closely.md` has the pillars-confirmed checklist all
unticked, even though Drew may have separately fired a `specced` event. The
register-vs-doc precedence isn't explicitly stated in `register/README.md` or
`CLAUDE.md` §3.5.

**Default applied:** the register is authoritative. The orchestrator allows the build
to proceed if the latest event is `specced`, and prints a warning when the doc's
checkboxes disagree. The doc is the human-facing artifact; the register is the
machine-readable source of truth. This matches the more general principle in
`CLAUDE.md` §3 ("Sanity is the source of truth for current content; the register is
the source of truth for history").

If Drew prefers the doc to be the gate, change the `checkSpecGate` function to refuse
when `pillarsConfirmed` has unticked entries.

### Ambiguity 2 — `kindlingId` vs `sanityId` on a `created` event

`register/README.md` says "Once Sanity write happens, both fields are populated for
joinability." But the example for `created` only includes `sanityId` and `slug` /
`title` / `packRef`. The `helper.ts` `appendEvent` requires "at least one" of the
two.

**Default applied:** the orchestrator sets BOTH `sanityId` and `kindlingId` to the
deterministic ID for module / approach / activity / asset / commonsText creation
events. This is consistent with what `build-resources.ts` does for assets. If the
Sanity `_id` ever diverges from the kindlingId (e.g. when an existing
random-ID Sanity doc is being adopted), the convention will need to evolve, but for
greenfield editorial content the two are the same string by construction.

---

## What's stubbed / TODO

| Item | Why | Where |
|---|---|---|
| `--no-register` truly read-only flag | `--dry-run` skips Sanity but still fires register events. A fully read-only mode for development would be useful but isn't critical. | `orchestrator.ts` |
| Custom Portable Text blocks (`sayBlock` / `pauseNote` / `watchBlock`) | Schema-ref OQ #3 hasn't been resolved. Plain `blockText()` is consistent with the existing helper. | `orchestrator.ts` `blockText` |
| Capability-thread typeahead from `library/capability-threads.md` | Would require parsing that doc; not core to the orchestrator. Operator is currently expected to know the thread Sanity ID. | `orchestrator.ts` `promptForActivity` |
| Duplicate detection per `design/duplicate-detection.md` | That's a separate gate — should fire on the `ideated → specced` transition. The orchestrator only enforces the build-time gate (`specced → content_constructed`). | (out of scope for this session) |
| Pack-mode equivalent | Pack docs need their own orchestrator; the per-pack spec template is in place. | (follow-up session) |
| `assets_constructed` / `ready_for_check` / `checked` / `published` transitions | Build mode does not fire these; they're separate tools. The bucket model in `CLAUDE.md` §3.5 explicitly assigns them to other modes. | (out of scope, by design) |
| Tests | The two pure modules (`spec-parser.ts`, `sparse-content-checks.ts`) are designed to be unit-testable; no tests written yet. The integration test for the orchestrator would need a real Sanity dataset or a heavy mock. | follow-up session |

---

## Honest assessment

**What works:**

- `spec-parser.ts` reads the real `module-1-1-looking-closely.md` and extracts the
  fields the orchestrator needs (verified by reading the parser logic against the
  spec doc structure; no integration test run because the worktree's Node toolchain
  isn't reachable from this agent shell).
- `sparse-content-checks.ts` implements every code listed in
  `design/sparse-content-detection.md` §5 except the ones explicitly marked "needs
  human judgment" (where heuristics are conservative).
- The orchestrator's flow matches the brief: gate check → ensure module → for each
  approach → for each activity slot → prompt → check → create → fire events →
  patch references → flag NEEDED → maybe fire `content_constructed` → close-out.
- The register-events shape matches `register/README.md` for `created`, `flagged`,
  `content_constructed`. The Brisbane timestamp is provided by `helper.ts`
  unchanged.

**What's stubbed:**

- The orchestrator hasn't been executed end-to-end. The Bash sandbox in this
  worktree denies most commands and there's no Sanity test dataset wired in. A
  first run by Drew is needed to shake out parser edge cases on the real spec doc.
- The `non-interactive` mode is a deliberate sparse stub used to test the
  hard-fail path; it doesn't try to read content from anywhere.

**What's risky:**

- The deterministic-ID convention (`kindlingId === Sanity _id`) is load-bearing.
  If existing Sanity docs were ever created with random IDs and then matched to a
  kindlingId via slug, the orchestrator's idempotency check (`getDocument(id)`)
  would create duplicates. For Module 1.1 this is fine — nothing's in Sanity yet
  for `module.1.1.looking-closely`.
- The spec parser's regex-driven approach is brittle to format drift. If a future
  spec doc deviates from the template's heading structure, parsing will partially
  fail. The orchestrator surfaces parse-emptiness via the module-level sparse
  preview, but a structurally-broken spec might silently parse to mostly-null
  fields.
- The `editor` prompt for instructions opens the operator's `$EDITOR`. If the
  operator doesn't have `$EDITOR` set (uncommon on dev workstations but possible),
  the prompt fails. `@inquirer/prompts/editor` documents this; we don't paper over
  it.

---

## Session Close-Out

**Modes:** build-mode tooling (a Drew-style scribe pass on the build-mode
infrastructure itself)
**Duration:** ~1 hour Drew-equivalent (single sub-agent session)
**Sanity writes:** 0 (no orchestrator run yet; this session is the build of the tool)
**Repo commits:** TBD (worktree branch — agent commits in close-out)

### Changed

- `claude-kindling/library/build-mode/orchestrator.ts` — new build-mode orchestrator
- `claude-kindling/library/build-mode/spec-parser.ts` — new parser
- `claude-kindling/library/build-mode/sparse-content-checks.ts` — new check library
- `claude-kindling/library/build-mode/README.md` — usage docs
- `claude-kindling/design/sessions/2026-04-30-build-mode-orchestrator.md` — this note

### Needed

- A first end-to-end run on `module.1.1.looking-closely` once the spec's `specced`
  event is fired, to shake out parser and prompt edge cases.
- Resolution of `sanity-schema-reference.md` §11 OQ #3 (custom Portable Text block
  styles) so the orchestrator's instruction-collection prompt can be enriched.
- Decision on whether the orchestrator should refuse to create the module doc when
  it doesn't exist in Sanity, OR continue the current default (create it
  ensure-style). See "Decisions worth flagging" item 1.

### Precedents

None proposed at the ruleset level. The orchestrator is enforcement infrastructure
for the existing v1.1 ruleset, not new doctrine.

### Blocked

Nothing structural. The orchestrator is ready for a first run when Drew is.
