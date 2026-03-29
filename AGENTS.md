<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Codex Repo Guidance

This file is Codex-facing guidance for working safely in this repository. It is intended to coexist with `CLAUDE.md`, not replace it.

## Coexistence Rules

- Do not modify, rename, move, delete, or replace `CLAUDE.md` unless the user explicitly asks.
- Do not modify files under `.claude/` unless the user explicitly asks.
- Keep Codex-only operational guidance under `.codex/`.
- Treat `docs/` as canonical product and architecture documentation. Only update `docs/` when the user asks for canonical documentation changes.

## Operating Mode

- In this repository, Codex should default to support-mode first: summaries, repo-health checks, review support, and human-context documentation.
- Do not treat Codex as the default feature author here unless the user explicitly asks for product-code changes.
- If a request is ambiguous, prefer producing support artifacts under `.codex/` instead of editing app code.
- Never use Codex-owned guidance to override or reinterpret `CLAUDE.md`.

## First Read

Before substantial code work:
- Read the relevant Next.js docs under `node_modules/next/dist/docs/`.
- Review repo-local context in `CLAUDE.md` for product and architecture background.
- Check `.codex/README.md` and the relevant workflow under `.codex/workflows/` when the task is about summaries, repo checks, or human context documentation.

## Safe Operating Defaults

- Prefer additive, reversible changes.
- Do not change application logic, architecture, dependencies, config, or runtime behavior for Codex support tooling.
- Assume the worktree may already be dirty. Never revert unrelated changes.
- Prefer new Codex-specific files over edits to existing project files.
- Do not add `package.json` scripts for Codex convenience unless the user approves first.
- Do not edit `CLAUDE.md`, files under `.claude/`, or Claude-owned workflow material as part of Codex support tasks.

## Codex Workflow Map

- Change and commit summaries: `.codex/workflows/change-summary.md`
- Repo health and stability checks: `.codex/workflows/repo-health.md`
- Manual code-context explanation docs: `.codex/workflows/context-docs.md`

## Codex Output Placement

- Put Codex support material in `.codex/`.
- Put subsystem context notes in `.codex/context/` unless the user wants canonical docs updated.
- Keep generated reports ephemeral unless the user asks to save them.
