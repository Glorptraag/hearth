# Subsystem Context Notes

This folder is for stable, durable code explainers for individual subsystems.

These files should help humans regain implementation context quickly. They are not a replacement for `CLAUDE.md` or canonical product docs.

Use this folder for notes that remain useful across multiple sessions, such as:
- routing areas
- API surfaces
- data-layer slices
- auth boundaries
- content integration layers

Naming guidance:
- `planner.md`
- `data-layer.md`
- `sanity-integration.md`
- `notifications.md`

Writing rules:
- one subsystem per file
- prefer concrete file references
- include line references where they materially help
- link to `docs/` for product intent instead of duplicating it
- update the note when implementation changes substantially
