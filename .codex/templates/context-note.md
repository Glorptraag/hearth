# Context Note Template

Use this template for a durable subsystem note in `.codex/context/`.

Prefer `.codex/templates/subsystem-context-doc.md` for new subsystem explainers. Keep this older template only for very small notes.

## Purpose

State what this area is responsible for today. Keep it implementation-focused rather than aspirational.

Example:
- `src/app/(auth)/our-story` assembles learner narrative views from database-backed snapshots and supporting presentation components.

## Key Files

List the smallest set of files someone should read first.

Example format:
- `src/app/(auth)/planner/page.tsx`: route entry point and server-side composition
- `src/app/(auth)/planner/PlannerClient.tsx`: interactive planner UI
- `src/components/planner/*`: planner-specific presentation pieces
- `src/app/api/planner/route.ts`: planner API surface

## Control Flow

Explain the real request or render path in plain language.

Prompt:
- What is the entry point?
- Where does data come from?
- Which component or function owns the main decision-making?
- Where does the response or rendered UI end up?

## Inputs And Outputs

Capture the main inputs this area expects and the outputs it produces.

Prompt:
- Inputs: route params, request body, DB rows, Sanity content, auth context
- Outputs: rendered pages, JSON payloads, database writes, derived view models

## Dependencies

List the most important internal and external dependencies.

Prompt:
- Internal: nearby routes, shared components, `src/lib/*` helpers
- External: Clerk, Neon/Postgres, Drizzle, Sanity, Anthropic

## Risks Or Sharp Edges

Record the issues a future contributor should know before changing this area.

Prompt:
- hidden coupling
- duplicated logic
- stale assumptions versus product docs
- missing validation or tests

## Canonical References

Link related files in `docs/` instead of re-explaining them.

Example:
- `docs/hearth-weekly-planner-spec-v1.md`
- `docs/hearth-data-architecture-overview-v1.md`

## Open Questions

Only include questions that are still unresolved in the implementation or docs.
