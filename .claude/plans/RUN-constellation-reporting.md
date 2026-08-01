# Run Brief: Constellation + Reporting Robustness

> You are the ORCHESTRATOR. You route; you never implement.
> Plan: .claude/plans/PLAN-constellation-reporting.md · State: .claude/plans/status.json
> State engine: python3 .claude/plans/pharao.py — ALL state reads/writes go through it.

## Mission
Drive every task in status.json to "done" autonomously. Do not check in with the
human except via the decision queue and halt conditions below. Never open an editor
on a task file — dispatch it.

## Your loop
1. `python3 .claude/plans/pharao.py ready` → the unblocked units.
2. For each: `pharao.py prompt {id}` → `pharao.py dispatch {id}` → send the brief to a
   worker on its labelled model (all SONNET here). Dispatch ALL ready units in parallel.
3. On each completion: verify "Done when" cheaply (run the named test / grep the file —
   NOT a diff review). The worker's `done` call already printed what's newly ready —
   dispatch it IMMEDIATELY. A completion is a trigger, not a milestone. When 3.3 lands
   and verifies, 3.4 unblocks — dispatch it at once.
4. Loop until `pharao.py status --check` exits 2, then write the final report.

## Workers
Recruit via, in order of preference:
1. Task-tool subagents (default here) — one `Agent` call per ready unit, `subagent_type: general-purpose`, model per label (all sonnet). Send the units in a single message so they run concurrently.
2. Background `claude -p` workers if the Task tool is unavailable.
Prompts come from `pharao.py prompt {id}` ONLY — never paste the plan, this brief, or
other tasks' specs. Give each worker a stable id (W-1.1, W-2.1, …). Workers report via
`pharao.py done/fail`, never by editing status.json.

## Verification cheatsheet (per task)
- 1.1 / 1.2 / 1.3 — `test -f {doc}` and grep the required section headings; for 1.2 grep that "5 sequential PRs in flight" is gone.
- 2.1 — `npm test -- "src/app/(auth)/our-story/capabilities/_constellation"` on node@24.
- 2.2 — `npm test -- "src/app/(auth)/our-story/capabilities/page.test.tsx"` on node@24.
- 3.1 / 3.2 / 3.4 — `npm run test:integration:local` (real Postgres; node@24).
- 3.3 — `npm test -- src/lib/report/deterministic-coverage.test.ts` on node@24; confirm the seed script does NOT write to prod (no top-level publish call).
- Tests run on Homebrew node@24, not local Node 26 (false localStorage failures otherwise).

## Failures
`pharao.py fail {id} --by {worker} --error "..."` and obey its verdict:
retry same tier → escalate one tier → failed + decision queued + dependents parked.
Keep everything unaffected moving.

## Decisions — park, don't stall
`pharao.py decision add --question ... --recommendation ... --confidence ... --blocks ...`
Known-in-advance decisions already parked: D-sidebar-1/2/3 (do NOT build them).
If task 3.4 finds `frameworkKeyForState('NSW')` does not resolve to `ac-v9-nsw`, that is a
real code gap — queue a decision, do NOT let the worker edit report logic silently.

## Human gates that ALWAYS stop
- **D-publish** — do not run either seed script against production Sanity. The scripts and
  their tests are the deliverable; publishing is Drew's action (Sanity auth + review).
  This gate blocks no coding task, so it never stalls the loop.

## Halt when
`status --check` exits 2 · state file corrupt (events.jsonl is the audit trail) ·
context low (write HANDOVER.md with `status --json` output first, tell the user to
restart a fresh orchestrator from this brief).

## First wave (dispatch now, all SONNET, in parallel)
1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3  — (3.4 unblocks when 3.3 verifies)
