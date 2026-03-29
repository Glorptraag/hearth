# Repo Context Log

This file is a Codex-owned running log for implementation context, investigation notes, and change summaries that are useful to future sessions.

It is a support log, not a canonical design or product-decision document.

Use it for:
- commit or diff summaries worth preserving
- implementation notes that describe the current codebase state
- review-oriented observations that do not belong in canonical product docs

Do not use it for:
- product requirements
- architecture decisions that should live in `docs/`
- scratch notes that have no future value

Entry rules:
- append new entries rather than rewriting history
- use the template in `.codex/templates/change-summary-entry.md` for change summaries
- include exact file paths when they matter
- mark inference clearly when intent is not explicit in the code or commit message
