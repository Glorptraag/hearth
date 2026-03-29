# Subsystem Context Document Template

Use this template for a durable subsystem explainer in `.codex/context/subsystems/`.

## <Subsystem Name>

### What This Area Does

Give a short plain-English description of the subsystem's real responsibility in the current codebase.

Good example:
- `src/app/(auth)/planner` renders the planner experience, loads planner-related data for the current family, and hands interactive state to the client-side planner UI.

### Boundaries

- In scope:
- Out of scope:

State what this document covers and what neighboring areas it intentionally does not cover.

### Key Files

List the smallest useful reading set first.

Example format:
- `src/app/(auth)/planner/page.tsx:1` - server entry point for the planner route
- `src/app/(auth)/planner/PlannerClient.tsx:1` - main interactive planner component
- `src/components/planner/PlannerGrid.tsx:1` - planner grid presentation
- `src/app/api/planner/route.ts:1` - planner read/write API surface

### Important Entry Points

List the files or exported symbols that start the main flows in this area.

Example prompts:
- route entry files
- API handlers
- top-level components
- library entry functions

### Key Functions / Classes / Components

List the symbols that matter most and explain why each one matters.

Example format:
- `PlannerClient` in `src/app/(auth)/planner/PlannerClient.tsx` - owns client-side planner interactions and local state
- `GET` in `src/app/api/planner/route.ts` - returns planner data for the current family
- `getFamilyByClerkId` in `src/lib/auth/helpers.ts` - resolves the family context used by planner routes

### Data Flow

Explain the main flow in plain English.

Suggested prompts:
- what triggers the flow?
- where does data come from?
- where is it transformed?
- where is it persisted?
- what is returned or rendered?

### Dependencies And Integrations

Split internal and external dependencies.

- Internal:
- External:

Examples:
- Drizzle database access
- Clerk auth
- Sanity content queries
- env vars
- AI enrichment hooks

### Risks / Fragile Spots

List the parts that are easiest to break or most likely to confuse a future maintainer.

Examples:
- duplicated logic between page and API route
- assumptions about missing legacy data
- reliance on env vars without local validation
- cross-file coupling between shared helpers and route behavior

### Important Code Sections

Explain a few high-value code sections in plain English, with file references and line numbers where possible.

Example format:
- `src/app/(auth)/planner/page.tsx:12` - this is where the route loads planner entries for the current family before handing them to the client component
- `src/app/api/planner/route.ts:30` - this branch handles create vs update behavior and is a likely regression point if the planner payload changes
- `src/components/planner/PlannerGrid.tsx:1` - this component is mostly presentational, so behavior bugs are more likely upstream than here

### External Config / Env Considerations

List any external configuration or environment assumptions that matter for this area.

Use `None observed` if there are no notable external requirements.

### Canonical Docs To Read Next

Link related files in `docs/` instead of repeating them.

### Open Questions

Only include questions that are still unresolved in the implementation or nearby docs.
