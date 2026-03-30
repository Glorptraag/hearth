# Commit Crossover Handoff

Date: 2026-03-30
Scope: Review of the last 48 hours of commits plus the current dirty worktree to determine whether recent work was accidentally undone or split across overlapping plans.

## Current Branch State

- Branch: `main`
- Head: `0e549dc`
- Remote position: `main` is ahead of `origin/main` by 1 commit
- Worktree: dirty before this note was written

Current modified files:

- `.claude/launch.json`
- `src/app/(auth)/dashboard/DashboardClient.tsx`
- `src/app/(auth)/explore/marketplace/page.tsx`
- `src/app/(auth)/log/page.tsx`
- `src/app/(auth)/module/[id]/page.tsx`
- `src/app/(auth)/planner/PlannerClient.tsx`
- `src/app/(auth)/project/[id]/page.tsx`
- `src/app/(public)/onboarding/page.tsx`
- `src/app/dev-preview/explore/marketplace/DevMarketplaceClient.tsx`
- `src/app/dev-preview/explore/marketplace/page.tsx`
- `src/app/globals.css`
- `src/components/screens/MarketplaceCard.tsx`
- `src/components/settings/PedagogySelector.tsx`
- `src/lib/sanity/mutations.ts`
- `src/lib/sanity/queries.ts`
- `src/sanity/schemas/pedagogyOverlay.ts`
- `src/types/index.ts`

## Commit Timeline

All commits in scope landed on 2026-03-30.

1. `235600b` at 2026-03-30 00:25:28 +1000
   Add dev-preview bypass routes, onboarding flow, and Sanity seed expansion.

2. `532c90a` at 2026-03-30 00:34:55 +1000
   Rebuild dashboard to match prototype with learner row, moments grid, and desktop right panel.

3. `0e549dc` at 2026-03-30 09:50:21 +1000
   `feat(pedagogy): wire approach picker and overlay system`

## What Still Looks Intact

- The dev-preview and onboarding work from `235600b` is still present.
- The dashboard rebuild from `532c90a` is still present.
- The module pedagogy architecture from `0e549dc` is still present:
  - approach-pick mode exists
  - batch overlay query exists
  - overlay fetch on approach selection still exists
  - lens panel rendering still exists

No evidence was found that those larger feature slices were broadly reverted.

## What Changed After The Pedagogy Commit

The dirty worktree is partially rolling back one part of `0e549dc`: the temporary addition of `Reggio Emilia` as a seventh pedagogy.

Dirty files removing `reggio` from the active code:

- `src/app/(public)/onboarding/page.tsx`
- `src/components/settings/PedagogySelector.tsx`
- `src/lib/sanity/mutations.ts`
- `src/sanity/schemas/pedagogyOverlay.ts`
- `src/types/index.ts`
- `src/app/(auth)/module/[id]/page.tsx` removes the label entry

Important detail:

- This rollback is internally consistent. `rg -n "reggio" src` returned no remaining matches at review time.
- This looks more like corrective cleanup than accidental undo.
- It also means the local commit message/body for `0e549dc` no longer matches the intended pushed state if this rollback is committed separately.

## Second Stream In Flight

The dirty worktree also contains a separate product stream that is not just pedagogy cleanup.

Main signals:

- Marketplace route is moving from inline mock data to live Sanity-backed packs:
  - `src/app/(auth)/explore/marketplace/page.tsx`
  - `src/components/screens/MarketplaceCard.tsx`
  - `src/app/dev-preview/explore/marketplace/DevMarketplaceClient.tsx`
  - `src/app/dev-preview/explore/marketplace/page.tsx`
  - `src/lib/sanity/queries.ts`

- A new project detail flow exists:
  - `src/app/(auth)/project/[id]/page.tsx`
  - `src/lib/sanity/queries.ts` adds `PROJECT_DETAIL_QUERY`

- Logger and planner are being extended:
  - `src/app/(auth)/log/page.tsx` adds draft autosave
  - `src/app/(auth)/planner/PlannerClient.tsx` adds empty-week nudge

- Dashboard and global styling are being refined:
  - `src/app/(auth)/dashboard/DashboardClient.tsx`
  - `src/app/globals.css`

This appears to be a broader “replace prototype/mock-only paths with integrated content flows” pass.

## Confirmed Incomplete Integration

The new project flow is not wired through to logging yet.

- `src/app/(auth)/project/[id]/page.tsx` links to:
  - `/log?source=project_stage&projectId=...&stageNumber=...`
- `src/app/(auth)/log/page.tsx` does not currently read search params or use `projectId` / `stageNumber`.

Interpretation:

- The project route is not an undone feature.
- It is an unfinished feature slice.

## Repo Check Results

Checks run:

- `git diff --check HEAD`: pass
- `npx tsc --noEmit`: pass
- `npm run lint`: fail

Lint context:

- Most failures are repo-wide or in `prototypes/` and existing files not central to the current branch story.
- There are also active-file lint issues in:
  - `src/app/(auth)/explore/marketplace/page.tsx`
  - `src/app/(auth)/project/[id]/page.tsx`
  - `src/app/(auth)/module/[id]/page.tsx`
  - `src/app/(auth)/log/page.tsx`

## Working Interpretation

The branch still has a coherent direction, but two planning threads are interleaved in the working tree:

1. Pedagogy overlay cleanup and scope correction
2. Marketplace/project/logger integration work

The feeling of “crossed plans” is real, but it does not look like a broad rollback. It looks like:

- one local commit that overshot on pedagogy scope
- followed by a dirty cleanup of that scope
- while a second larger integration pass was also started

## Suggested Planning Questions For Claude Opus

Ask Claude Opus to produce a plan that answers these in order:

1. What should be the final pedagogy scope right now: six pedagogies per `CLAUDE.md`, or seven including Reggio?
2. Should the current dirty rollback of `reggio` be committed as a small corrective commit before any other work continues?
3. How should the in-flight integration work be split into coherent commits?
4. What is the minimum completion bar for the new project flow so it is not a dead-end?
5. Which active-file lint issues should be fixed now versus deferred with explicit acknowledgment?

## Recommended Commit Boundaries

Likely clean split:

1. Corrective pedagogy scope commit
   - remove `reggio` consistently if six pedagogies is the intended product scope
   - keep module overlay architecture

2. Marketplace + card data-model alignment commit
   - Sanity-backed packs
   - card prop model updates
   - dev-preview marketplace alignment

3. Project flow commit
   - project detail page
   - project query
   - logger integration for `projectId` / `stageNumber`

4. Optional polish commit
   - dashboard animation/panel tweaks
   - planner empty-state nudge
   - logger draft autosave if not folded into the project/logging slice

## Read First If Continuing This Work

- `CLAUDE.md`
- `src/app/(auth)/module/[id]/page.tsx`
- `src/app/(auth)/explore/marketplace/page.tsx`
- `src/components/screens/MarketplaceCard.tsx`
- `src/app/(auth)/project/[id]/page.tsx`
- `src/app/(auth)/log/page.tsx`
- `src/lib/sanity/queries.ts`
- `src/sanity/schemas/pedagogyOverlay.ts`

## Bottom Line

No evidence of a large accidental undo was found.

The current state is best described as:

- one intact dashboard commit
- one intact dev-preview/onboarding commit
- one local pedagogy commit whose `Reggio` scope is being actively corrected
- one separate unfinished integration stream around marketplace and project flows
