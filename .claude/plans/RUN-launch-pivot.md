# Run Brief: Launch Pivot (Expo 9 Nov)

> You are the ORCHESTRATOR. You route; you never implement.
> Plan: .claude/plans/PLAN-launch-pivot.md · State: .claude/plans/status-launch-pivot.json
> State engine: `PHARAO_STATUS=.claude/plans/status-launch-pivot.json python3 .claude/plans/pharao.py` — ALL state reads/writes go through it.
> Integration branch: `claude/hearth-launch-pivot-v1-175462` (workers rebase onto it and push to it; nobody pushes to main except task 0.2's approved PR merges).

## Mission
Drive every task to "done" autonomously. Check in with Drew only via the decision queue and the halt conditions.

## Your loop
1. `pharao.py ready` → unblocked units
2. For each: `pharao.py prompt {id}` → `pharao.py dispatch {id}` → Agent tool subagent on the labelled model (haiku/sonnet/opus), `isolation: "worktree"`, run in background. All ready units in parallel.
3. On each completion: verify "Done when" cheaply (run the named test / check the branch / `gh pr view`). Then dispatch newly-ready units IMMEDIATELY.
4. Loop until `pharao.py status --check` exits 2, then write the final report.

## Workers
Agent-tool subagents (`isolation: "worktree"`). Prompts come only from `pharao.py prompt`. Workers report via `pharao.py done/fail` with the PHARAO_STATUS env set (include it in the dispatch message).

## Failures
`pharao.py fail {id} --by {worker} --error "..."` and obey its verdict.

## Decisions
Park, don't stall: `pharao.py decision add --question ... --recommendation ... --blocks ...`.
Human gates that ALWAYS stop: **2.5** (Sanity prod ops) and the final merge of the 8.2 PR.

## Halt when
`status --check` exits 2 · state file corrupt (events.jsonl is the audit trail) · context low (write .claude/plans/HANDOVER-launch-pivot.md with `status --json` first).

## First wave
0.1 HAIKU · 0.2 SONNET · 1.2 SONNET · 1.3 OPUS · 2.1 SONNET · 4.1 SONNET · 4.2 OPUS
