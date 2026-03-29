# Human-Context Code Explainer Task

Use this task when the goal is to help a human developer regain useful working context about a subsystem quickly.

This is not a product-spec task and not a vague overview task. It should explain the code as it exists today, with enough structure and concrete references that a developer can resume work safely.
This is a support documentation task. It should capture understanding, not compete with Claude-owned product guidance.

## Goal

Produce a subsystem document that explains:
- what this area does
- key files
- important entry points
- key functions, classes, or components
- how data flows through the area
- external dependencies and integrations
- risks or fragile spots
- plain-English explanations of important code sections, with file paths and line references where possible

## Output Standard

Write for a human developer who has been away from the codebase and needs to rebuild context quickly.

The output should be:
- concrete rather than abstract
- implementation-focused rather than aspirational
- structured enough to scan in a few minutes
- explicit about assumptions, gaps, and likely sharp edges

Avoid:
- repeating product requirements already captured in `docs/`
- vague statements like "this handles business logic"
- large copied code blocks
- speculative architecture claims that are not visible in the code

## Default Save Locations

Stable subsystem notes:
- `.codex/context/subsystems/`

Time-bound investigation notes:
- `.codex/context/investigations/`

Repo-wide running notes:
- `.codex/context/repo-context.md`

## Primary Helpers

Use the local scanner first:

```bash
./.codex/scripts/context-scan.sh src/app
./.codex/scripts/context-scan.sh src/lib
./.codex/scripts/context-scan.sh src/app/(auth)/planner
```

Use these references when writing:
- `.codex/workflows/context-docs.md`
- `.codex/templates/subsystem-context-doc.md`

## Procedure

1. Define the subsystem boundary clearly.
   Examples:
   - `src/app/(auth)/planner`
   - `src/lib/db`
   - `src/lib/sanity`
   - `src/app/api/notifications`

2. Run `context-scan.sh` for the target area.

3. Read the true entry points first.
   Look for:
   - `page.tsx`
   - `layout.tsx`
   - `route.ts`
   - `index.ts`
   - top-level exported client components
   - top-level library entry files

4. Identify the smallest set of key files that explain the area end-to-end.

5. Trace the main control flow or data flow.
   Questions to answer:
   - what starts the flow?
   - where is data fetched, transformed, or persisted?
   - what components or functions own the main decisions?
   - what leaves the subsystem as UI, JSON, or a side effect?

6. Record the important symbols.
   Include the functions, classes, or components that a future maintainer is most likely to touch.

7. Capture external dependencies and integration points.
   Examples:
   - database access
   - auth helpers
   - Sanity queries
   - environment variables
   - AI pipeline hooks

8. Note fragile spots and risks.
   Focus on:
   - hidden coupling
   - branching behavior spread across multiple files
   - assumptions about env/config/data shape
   - weak validation or missing tests
   - code paths that are easy to break accidentally

9. Add plain-English explanations of the most important code sections.
   Use exact file paths and line references where possible.
   Prefer the small number of code sections that explain most of the behavior.

10. Link relevant canonical docs in `docs/` rather than duplicating them.

## Required Sections

Every subsystem explainer should include:
- purpose
- boundaries
- key files
- entry points
- important functions / classes / components
- data flow
- dependencies and integrations
- risks / fragile spots
- important code sections
- canonical docs to read next

## File Reference Guidance

Where possible, reference files with line anchors in plain repo style:
- `src/app/(auth)/planner/page.tsx:1`
- `src/lib/db/schema.ts:120`

Use line references when:
- pointing to an entry point
- highlighting a key branch or transformation
- calling out a fragile section

If a line number would be noisy or unstable, use the file path alone.

## Naming

Stable subsystem note:
- `.codex/context/subsystems/<area-name>.md`

Investigation note:
- `.codex/context/investigations/YYYY-MM-DD-<topic>.md`

## Guardrails

- Document current reality, not intended future cleanup.
- If intent is inferred from code, say that explicitly.
- If behavior depends on unresolved product decisions, say that and link the relevant `docs/` file.
- Keep one subsystem per note when possible.
- Do not modify app code while writing the explainer unless the user separately asks for code changes.
- Do not modify `CLAUDE.md`, `.claude/`, or canonical `docs/` as part of routine context capture.
