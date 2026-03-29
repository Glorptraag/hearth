# Repo Health Workflow

Use this workflow for quick stability checks without changing project behavior.

Operating intent:
- this is a support and audit workflow
- it should inspect and report, not repair by default
- do not modify app code, `CLAUDE.md`, or canonical docs while running repo-health checks unless the user separately asks for fixes

Primary task spec:
- `.codex/tasks/repo-health-stability-checker.md`

Saved-report template:
- `.codex/templates/health-report-passfail.md`

Check levels:
- Quick: repository state and static checks
- Standard: quick checks plus typecheck/build where practical
- Targeted: checks only for the area touched by recent changes

Primary helper:
```bash
./.codex/scripts/repo-health.sh quick
./.codex/scripts/repo-health.sh standard
./.codex/scripts/repo-health.sh full
```

Underlying commands:
```bash
git status --short
npm run lint
npx tsc --noEmit
npm run build
```

Execution notes:
- Run the smallest useful set first.
- If a command is too expensive or blocked by environment issues, report that clearly.
- Treat existing worktree changes as context, not failure by default.
- Separate pre-existing failures from regressions introduced by the requested change when possible.
- Save a report only if the user wants an artifact. Otherwise return the findings inline.
- If a repo script does not exist, record that as `WARN` instead of inventing a fallback.

Default report headings:
- PASS
- FAIL
- WARN
- Checks run
- Config / integration notes
- Recommended next action

Heuristics:
- `git status --short` answers whether the tree is clean and what is in flight.
- `npm run lint` is the baseline code-health check already supported by the repo.
- `npx tsc --noEmit` is the safest type check without adding package scripts.
- `npm run build` is the strongest local stability check but may be slower and environment-sensitive.
- If there is no repo-defined test script, call that out instead of running guessed test commands.

Do not:
- add scripts or dependencies just to run checks
- rewrite project config for Codex convenience
- treat missing test infrastructure as a setup task unless explicitly requested

Decision rule:
- `quick` is the default when the user asks "is the repo healthy?"
- `standard` is the default after non-trivial code edits
- `full` is for release-like confidence or when the user explicitly asks for stronger verification
