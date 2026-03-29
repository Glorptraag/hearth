# Repo Health / Stability Checker Task

Use this task after feature work when the user wants a safe, repo-local assessment of whether the repository still looks healthy.

This task must not change app logic, install packages, upgrade dependencies, or invent missing scripts.
This is a support and audit task. It should report current repo health, not quietly turn into repair or feature work.

## Goal

Produce a human-readable report with `PASS`, `FAIL`, and `WARN` sections that summarizes the repository's current health using the commands and config surfaces that actually exist in the repo.

## Required Inspection Areas

Every report should inspect and comment on:
- install state
- lint
- typecheck
- tests if available
- build if available
- obvious config mismatches
- likely broken imports or missing references
- likely env/config risks
- any failing integration points discoverable from the repo structure

## Primary Helpers

Use:

```bash
./.codex/scripts/repo-health.sh quick
./.codex/scripts/repo-health.sh standard
./.codex/scripts/repo-health.sh full
```

Reference docs:
- `.codex/workflows/repo-health.md`
- `.codex/templates/health-report-passfail.md`

The script is the default fact-gathering path. If a command fails for environmental reasons, report that instead of forcing a workaround.

## Scope Levels

### quick

Use when the user asks for a fast repo-health check.

Inspect:
- install state
- worktree state
- lint if available
- static config/env risk signals

### standard

Use after most feature work.

Inspect:
- everything in `quick`
- typecheck if available
- tests if there is a clear repo-defined test command

### full

Use when the user wants stronger confidence.

Inspect:
- everything in `standard`
- build if available

## Procedure

1. Read `package.json` and identify the scripts that actually exist.
2. Read repo config surfaces such as:
   - `tsconfig.*`
   - `next.config.*`
   - `eslint.config.*`
   - lockfiles
   - `.env*` presence
3. Use `repo-health.sh` at the requested level.
4. Treat missing scripts as `WARN`, not as a reason to invent or add new commands.
5. Interpret failures from actual command output before making conclusions.
6. Call out likely broken imports or missing references based on:
   - typecheck output
   - build output
   - alias/path configuration versus import style
   - obviously missing local config surfaces
7. Identify environment and integration risks from actual repo structure, for example:
   - database integration files plus `DATABASE_URL` usage
   - Sanity config plus required Sanity env references
   - auth middleware or auth dependency presence
8. Separate:
   - hard failures
   - warnings / missing coverage
   - unresolved but likely-safe observations

## Command Selection Rules

- Prefer repo-declared scripts from `package.json`.
- Do not invent commands like `npm test` when there is no test script.
- Use `npx tsc --noEmit` only if TypeScript config and dependency support are present.
- Only run build if a build script exists.
- Never install or upgrade dependencies unless the user explicitly asks.

## Output Requirements

Use the structure in `.codex/templates/health-report-passfail.md`.

Minimum content:

### PASS

List the checks or structural signals that look healthy.

### FAIL

List actual failed commands or clearly broken repo conditions.

### WARN

List missing scripts, env risks, ambiguous integration points, and areas that could not be verified.

### Checks Run

For each executed command, include:
- the exact command
- result: pass | fail | skipped
- a short interpretation

### Config / Integration Notes

Summarize notable repo-structure signals such as:
- lockfile present but install state uncertain
- Next + React versions aligned
- alias imports present and path mapping exists
- Sanity or database env vars referenced but missing locally

### Recommended Next Action

State the smallest useful follow-up step for a human reviewer.

## Guardrails

- Do not claim a repo is healthy if key checks failed.
- Do not claim tests passed if no test command exists.
- Do not claim CI status unless CI is actually present and checked.
- Do not expose secret env values; report variable names only.
- Distinguish missing verification from failing verification.
- If the worktree is already dirty, say so explicitly.
- Do not edit `CLAUDE.md`, `.claude/`, app code, or canonical docs as part of running this task unless the user separately asks for fixes.
