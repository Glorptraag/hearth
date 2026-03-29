# Change Summary Workflow

Use this workflow when summarising:
- uncommitted working tree changes
- a single commit
- a commit range
- the diff between the current branch and another branch

Operating intent:
- this is a support workflow, not a feature-authoring workflow
- keep outputs in `.codex/` unless the user explicitly wants them elsewhere
- do not modify app code, `CLAUDE.md`, or canonical docs as part of producing a summary

Primary task spec:
- `.codex/tasks/commit-change-summariser.md`

Append-ready template:
- `.codex/templates/change-summary-entry.md`
- `.codex/templates/agent-log-summary-entry.md`

Suggested save target:
- `.codex/context/repo-context.md`
- `docs/agent-log.md`

Inputs to confirm:
- scope: working tree, commit, range, or branch diff
- audience: developer, reviewer, or non-technical stakeholder
- desired depth: terse, standard, or detailed

Primary helper:
```bash
./.codex/scripts/change-summary.sh
./.codex/scripts/change-summary.sh --staged
./.codex/scripts/change-summary.sh --commit HEAD~1
./.codex/scripts/change-summary.sh --range main HEAD
```

Default method:
1. Gather the raw facts with `./.codex/scripts/change-summary.sh` or the equivalent git commands.
2. Inspect the actual patch before summarising.
3. Separate user-facing behavior changes from refactors and mechanical edits.
4. Call out risk areas, missing tests, and open questions.
5. Note whether the worktree was already dirty before the requested scope.
6. If the scope is mixed, split the summary by subsystem instead of forcing one narrative.
7. After producing the main summary, append a concise structured entry to `docs/agent-log.md`.

Default output shape:
- Purpose of the change
- Files changed
- Key logic changes
- Schema / env / config impact
- Possible risks / regressions
- Suggested human review points

Rules:
- Do not claim behavior changes that are not visible in the diff.
- Distinguish confirmed facts from inference.
- If the repo was already dirty, say so explicitly.
- Keep summaries proportional to the size of the diff.
- Prefer citing concrete files over vague labels like "frontend" or "backend".
- If there is no user-facing impact, say that directly.
- When writing to `docs/agent-log.md`, append only. Never edit previous entries.
- Keep the agent-log entry concise because it is consumed by another agent for system mapping.

Agent-log append format:

```md
## [timestamp]

Agent: Codex  
Type: Summary  

- What changed:
- Files affected:
- Risk level:
- Notes for other agents:
```

Example opening:

`This change updates onboarding persistence and the pages that read onboarding state. The work is concentrated in the API route, schema, and the auth/public pages that depend on the new field.`
