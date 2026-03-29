# Commit / Change Summariser Task

Use this task when the user wants a plain-English summary of:
- current unstaged changes
- staged changes
- a recent commit
- a commit range
- the difference between two refs

This task is repo-local and non-invasive. It does not assume CI, GitHub Actions, or any hosted tooling.

This is a support task. It should produce understanding and review material, not expand into unsolicited implementation work.

## Goal

Produce:
- a structured summary that a human can read quickly and that is suitable for appending to `.codex/context/repo-context.md` or another Codex-owned context file
- a concise append-only entry in `docs/agent-log.md` for other agents

## Required Output

Every summary must include:
- purpose of the change
- files changed
- key logic changes
- schema, environment, or config impact
- possible risks or regressions
- suggested human review points

Every summary run must also produce an append-only agent-log entry with:
- timestamp
- agent name
- type
- what changed
- files affected
- risk level
- notes for other agents

Write in plain English. Prefer short paragraphs and flat bullet lists. Do not copy raw diffs into the final summary.

## Inputs

Confirm or infer one scope:
- `worktree`: all current unstaged changes
- `staged`: only staged changes
- `commit <sha>`: a single commit
- `range <base> <head>`: a commit or ref range

Optional:
- audience: developer, reviewer, stakeholder
- depth: terse, standard, detailed

## Primary Helper

Use the local summary input script to gather facts before writing:

```bash
./.codex/scripts/change-summary.sh
./.codex/scripts/change-summary.sh --staged
./.codex/scripts/change-summary.sh --commit HEAD~1
./.codex/scripts/change-summary.sh --range main HEAD
```

The script is a fact-gathering aid, not the final deliverable.

## Procedure

1. Determine the exact summary scope.
2. Gather the raw diff, file list, and worktree state with `change-summary.sh`.
3. Inspect the patch, not just the file names or `--stat` output.
4. Group files by subsystem or responsibility when the scope spans multiple areas.
5. Infer the purpose of the change from the code, commit message, and nearby files.
6. Identify concrete logic changes, especially:
   - route behavior
   - data flow
   - schema writes or reads
   - validation changes
   - feature flags or gating behavior
7. Check for schema, environment, or config impact by looking for changes in:
   - `drizzle/`
   - `src/lib/db/`
   - `.env*` references
   - `next.config.*`
   - `tsconfig.*`
   - `eslint.config.*`
   - `package.json`
   - middleware, auth, or API route boundaries
8. Call out likely risks and regressions based on the changed paths and logic.
9. End with specific human review points, not generic "review everything" guidance.
10. Append a concise companion entry to `docs/agent-log.md` using the agent-log template.

## Output Format

Use the structure in `.codex/templates/change-summary-entry.md`.

Minimum expectations by section:

### Purpose

State why the change exists in one short paragraph. If the purpose is inferred rather than explicit, say that.

### Files Changed

List changed files grouped by area, with a short explanation of why each file matters.

### Key Logic Changes

Explain what actually changed in behavior or code flow. Prefer statements like:
- "The onboarding completion route now persists a completion flag."
- "Planner pages now read the new field and branch on it."

### Schema / Env / Config Impact

Be explicit:
- `none`
- `database schema changed`
- `new env var required`
- `config touched but runtime behavior unchanged`

If there is a migration file or a new route/config surface, name it directly.

### Possible Risks / Regressions

List plausible failure modes introduced by the change. Focus on what a reviewer should verify, not hypothetical edge cases with no connection to the diff.

### Suggested Human Review Points

Give 3 to 7 concrete review prompts. Examples:
- verify the migration matches the new schema field type and nullability
- confirm all read paths handle missing legacy data
- check that the new route behavior is consistent for authenticated and unauthenticated requests

## Guardrails

- Do not invent intent that the diff does not support.
- Distinguish confirmed behavior from inference.
- If the worktree was already dirty, say so.
- If there is no schema, env, or config impact, say `None observed`.
- If a change is mechanical only, say so directly.
- Do not claim tests or CI ran unless they actually ran.
- Do not assume GitHub Actions, CI, or deployment automation exists.
- Do not edit `CLAUDE.md`, `.claude/`, or app code just to improve the summary artifact.
- Do not rewrite or compress older entries in `docs/agent-log.md`. Append only.

## Save Target

If the user wants the summary saved, append it to:
- `.codex/context/repo-context.md`
- `docs/agent-log.md` as a concise structured entry

Do not write to canonical product docs unless the user explicitly asks.
