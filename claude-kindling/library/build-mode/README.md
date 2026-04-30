# Build-mode orchestrator

> **Where:** `claude-kindling/library/build-mode/`
> **What:** Walks a single module from `specced` → `content_constructed` against
> `design/authoring-ruleset.md` v1.1 and the bucket model in `CLAUDE.md` §3.5.

This is the script Drew (or Cowork) runs once a module spec is complete. It produces
the actual Sanity documents — `module`, `approach`, `activity` — that families will
eventually consume.

It does **not** produce content from thin air. Activity content (instructions,
materials, observation prompts, threads, facilitator guidance) is collected from the
operator interactively at runtime via `@inquirer/prompts`. The orchestrator's role is
to enforce the gates, structure, and register events around that content collection.

---

## Files in this folder

| File | What it does |
|---|---|
| `orchestrator.ts` | The CLI entry. Parses CLI args, runs the gate, walks the spec, prompts, creates Sanity docs, fires register events. |
| `spec-parser.ts` | Pure parser: markdown spec doc → structured `ModuleSpec` object. No Sanity, no register, no I/O beyond `readFile`. |
| `sparse-content-checks.ts` | Implements the criteria in `design/sparse-content-detection.md`. Pure functions: `checkActivity`, `checkModule`, `checkPack`. Returns `{ hardFails, softWarnings }`. |

---

## How to run

From the hearth-main repo root (so `claude-kindling/` is a relative path):

```bash
npx tsx claude-kindling/library/build-mode/orchestrator.ts \
  --spec claude-kindling/design/specs/modules/module-1-1-looking-closely.md
```

CLI flags:

| Flag | What it does |
|---|---|
| `--spec <path>` | (Required) Path to the module spec doc. |
| `--session <slug>` | Override the session slug used in register events. Default: `YYYY-MM-DD-build-{P}-{M}` (Brisbane time). |
| `--dry-run` | Don't write to Sanity. Still parses, prompts, runs sparse checks, prints what would happen. Register events are still appended (so you can verify the trail) — pass `--no-register` if you want a fully read-only run (TODO; not implemented in v0). |
| `--non-interactive` | Skip prompting. Activities are filled with deliberately-sparse stubs that hard-fail every check. Useful only for testing the gate behaviour. |

Env required (when not `--dry-run`):

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_API_TOKEN`

`dotenv/config` is imported at the top of `orchestrator.ts`, so a `.env.local` at the
repo root (or the standard Next.js env loading) is honoured.

---

## What the orchestrator does, step-by-step

1. **Parses the spec doc** at the given path. Extracts kindlingId, pack ref, status,
   four pillars, approach lineup, resource list. The parser is tolerant of mixed
   `[LOCKED]` / `[SUGGESTION]` / `[GAP]` markers — it doesn't enforce the spec's
   formal structure, just harvests the fields it needs.

2. **Validates the bucket gate.** Reads `register/modules.jsonl`, finds the latest
   event for the module's kindlingId, and refuses to proceed unless that event is
   `specced`. The pillars-confirmed checklist in the spec doc is checked too, but
   informationally — the register is authoritative.

3. **Surfaces a module-level sparse-content preview.** Soft warnings or hard fails
   that are visible from the spec alone are printed before any prompts.

4. **Ensures the module Sanity document exists.** The kindlingId IS the Sanity
   `_id`, by deterministic-ID convention. If absent, the orchestrator creates the
   module with `createdVia: 'editorial'` and `authorFamilyId` unset (PR #6 editorial
   rule). Writes via direct mutations because `/api/modules/publish` violates the
   editorial rule (see `design/sanity-schema-reference.md` §7).

5. **Walks each approach in the spec.** For each:
   - Creates an `approach` Sanity document (deterministic ID:
     `approach.{P}.{M}.{letter}.{slug}`).
   - Fires a `created` register event for the approach.
   - For each activity slot the spec calls for (`approach.activityCount`):
     - Prompts the operator for activity content via `@inquirer/prompts`. The
       prompts cover: title, summary, instructions (opens an editor), three-part
       facilitator guidance, materials, duration, setting, energy, modality,
       observation prompts, reflection prompts, capability threads (≤3, ≤2
       primary), and asset/commons-text references drawn from the spec's resource
       list.
     - Runs sparse-content checks BEFORE the Sanity write. **Hard fails block
       creation** and fire a `flagged` event with `severity: 'hard-fail'`. Soft
       warnings allow creation but fire a `flagged` event with
       `severity: 'soft-warning'`.
     - Creates the `activity` Sanity document with the deterministic ID
       `activity.{P}.{M}.{letter}.{N}.{slug}`.
     - Fires a `created` register event for the activity.

6. **Patches references.** Once approaches and activities exist, the orchestrator
   patches `approach.activities` (in order) and `module.approaches`. This is a
   second pass because Sanity references can't point at non-existent docs, and the
   module → approach → activity tree has cycles in the back-references.

7. **Flags `[NEEDED]` resources.** For every resource in the spec at status
   `NEEDED`, fires a `flagged` event with `flag: 'asset-needed'` (or
   `'text-needed'`) on the corresponding register. Skips if a flag is already
   present (idempotent re-runs). Appends a section to
   `build-package/open-questions.md`.

8. **Fires `content_constructed` IF AND ONLY IF every activity passed sparse-content
   hard-fail checks.** If any hard-failed, the event is NOT fired and the module
   stays at `specced`. The blockers are listed in the close-out for Drew to act on.

9. **Prints a session close-out.** Created / skipped / hard fails / soft warnings /
   needed flags. This is the same shape `CLAUDE.md` §7 specifies for every session.

---

## Idempotency

Re-running the orchestrator on the same spec is safe:

- The module Sanity doc is checked for existence first; if present, skipped.
- Each approach Sanity doc is checked for existence first; if present, skipped.
- Each activity is checked at its deterministic ID; if present, skipped.
- `[NEEDED]` register flags are checked against existing register events; if a flag
  is already on the record for the given resource ID, it's skipped.

Register events are append-only — re-runs WILL append fresh `created`-shaped events
on the rare path where a previously-skipped doc doesn't fire (i.e. only newly-created
docs get a `created` event). Patrol mode can correlate by session slug.

---

## What it does NOT do (deliberately)

- **It does not advance the bucket past `content_constructed`.** Subsequent
  transitions (`assets_constructed`, `ready_for_check`, `checked`, `published`) are
  separate events fired by other tools or modes. See `CLAUDE.md` §3.5.
- **It does not write to platform-side files.** Only `claude-kindling/` and Sanity.
  Platform changes get flagged in `build-package/open-questions.md`.
- **It does not author content.** The operator answers the prompts; the orchestrator
  collects and validates. There is no LLM call inside the orchestrator.
- **It does not handle pack creation.** Pack docs are out of scope until the
  editorial endpoint lands; spec-driven pack production is a follow-up.
- **It does not assess six-test compliance for criteria the sparse-content checks
  don't cover** (e.g. "is the activity actually advancing the understanding goal?").
  Those are review-mode questions, not build-mode gates.

---

## Known gaps / TODOs

See the session note `design/sessions/2026-04-30-build-mode-orchestrator.md` for the
full list. Highlights:

- The `--no-register` flag (truly read-only run) is not implemented.
- Custom Portable Text block styles (`sayBlock`, `pauseNote`, `watchBlock`) are not
  surfaced in the prompts; instructions are converted via plain `blockText()` only.
- The orchestrator doesn't yet check for duplicate detection per
  `design/duplicate-detection.md`. That's a separate pass that should run before
  `specced` fires; build mode's role is to catch hard-fails on sparse content.
- The capability-thread prompt accepts free-form Sanity IDs without validating they
  exist as `capabilityThread` documents. A pre-pass that reads
  `library/capability-threads.md` and offers a typeahead would be much safer.
