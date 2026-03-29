# Context Notes

This folder is for Codex-assisted human context notes about the current codebase.

These notes are support artifacts, not canonical product instructions.

Suggested structure:
- `subsystems/` for durable area explainers
- `investigations/` for dated, narrow notes
- `repo-context.md` for repo-wide running notes and appended summaries

Rules:
- Keep notes descriptive, not normative.
- Prefer one subsystem per file.
- Link to canonical docs in `docs/` when they already exist.
- Do not duplicate product specs unless local implementation diverges and that divergence matters.
- Prefer stable notes like `planner.md` over sprawling catch-all files.
- If a note is just temporary investigation scratch work, date it and keep it narrow.

Suggested first notes:
- subsystems/app-routing.md
- subsystems/data-layer.md
- subsystems/content-layer.md
- subsystems/auth-and-protected-routes.md
