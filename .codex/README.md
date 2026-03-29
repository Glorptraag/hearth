# Codex Support Layer

This directory is an isolated support layer for Codex. It exists so Codex can help with repository operations without changing the existing Claude-oriented workflow.

## Support-First Mode

In this repository, Codex should operate as support and audit tooling first.

Default Codex jobs here are:
- change and commit summarisation
- repo health and stability checks
- manual human-context documentation
- review-oriented investigation notes

Non-default jobs here are:
- product feature implementation
- architecture rewrites
- canonical-doc rewrites

If a request is ambiguous, prefer creating or updating Codex-owned artifacts under `.codex/` instead of editing app code.

## What Lives Here

- `workflows/`: task instructions for repeatable Codex jobs
- `scripts/`: small local helper scripts that gather context or run existing checks
- `templates/`: reusable report and note formats
- `context/`: human-authored codebase notes that are useful to future sessions

## Intended Uses

### 1. Change and commit summarisation

Use:
- `.codex/workflows/change-summary.md`
- `.codex/scripts/change-summary.sh`

The workflow explains how to summarise diffs responsibly. The script gathers structured input from the repo so the summary can be based on actual changes rather than guesswork.

### 2. Repo health and stability checks

Use:
- `.codex/workflows/repo-health.md`
- `.codex/scripts/repo-health.sh`

The workflow defines check levels and reporting expectations. The script runs existing repo checks without requiring package-script changes.

### 3. Manual code-context documentation

Use:
- `.codex/workflows/context-docs.md`
- `.codex/scripts/context-scan.sh`
- `.codex/templates/context-note.md`

The workflow explains how to write human context docs that describe the current implementation without overwriting canonical product docs.

## Boundaries

- Do not use `.codex/` to replace `CLAUDE.md`.
- Do not modify `CLAUDE.md` or `.claude/` from Codex support workflows.
- Do not use `.codex/` to redefine product architecture that already belongs in `docs/`.
- Do not change runtime behavior, dependencies, or app code just to support Codex.
- If a saved report would be redundant with an existing canonical doc, prefer linking to that doc.

## Practical Defaults

- Keep Codex-only material under `.codex/`.
- Keep saved context notes narrow and subsystem-specific.
- Prefer scripts here over adding package scripts.
- If the worktree is already dirty, say so in any report.
