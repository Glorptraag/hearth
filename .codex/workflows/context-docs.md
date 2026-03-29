# Human Context Docs Workflow

Use this workflow when creating manual documentation that explains how part of the codebase works for future humans.

Operating intent:
- this is a support documentation workflow
- keep context notes in `.codex/context/` by default
- do not rewrite `CLAUDE.md` or canonical product docs as part of context capture unless the user explicitly asks

Default location:
- stable subsystem notes: `.codex/context/subsystems/`
- time-bound investigations: `.codex/context/investigations/`

Primary task spec:
- `.codex/tasks/human-context-code-explainer.md`

Primary template:
- `.codex/templates/subsystem-context-doc.md`

Use `docs/` only when the user explicitly wants canonical product or architecture documentation updated.

Primary helpers:
```bash
./.codex/scripts/context-scan.sh src/app
./.codex/scripts/context-scan.sh src/lib
```

Good candidates:
- subsystem overviews
- data flow explanations
- dependency boundaries
- operational caveats
- "where to start" notes for complex areas

Suggested structure:
1. Purpose
2. Boundaries
3. Key files
4. Important entry points
5. Key functions, classes, or components
6. Data flow or control flow
7. External dependencies
8. Known risks or gaps
9. Important code sections with file references
10. Pointers to canonical docs

Rules:
- Prefer concrete file references over abstract descriptions.
- Document current reality, not intended future architecture, unless clearly labeled.
- Mark assumptions and stale areas explicitly.
- Keep notes small and focused by subsystem.
- Start from the code, then link outward to `docs/` where the product intent is already described.
- If a note becomes normative or product-facing, it belongs in `docs/` and should be user-approved first.

Naming:
- `subsystems/area-name.md` for stable subsystem notes
- `investigations/YYYY-MM-DD-topic.md` for time-bound investigation notes

Recommended process:
1. Run `context-scan.sh` for the area.
2. Read the top-level entry files and nearby dependencies.
3. Draft the note using `.codex/templates/subsystem-context-doc.md`.
4. Link any related canonical docs instead of duplicating them.
