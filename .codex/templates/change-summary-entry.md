# Change Summary Entry Template

Use this template for summaries intended to be pasted into `.codex/context/repo-context.md` or another Codex-owned note.

Pair this with a concise append-only entry in `docs/agent-log.md` using `.codex/templates/agent-log-summary-entry.md`.

## YYYY-MM-DD - <scope or short title>

### Scope

- Source: worktree | staged | commit | range
- Ref(s): `<sha>` or `<base>..<head>`
- Branch: `<branch>`
- Dirty worktree before summary: yes | no | unknown

### Purpose Of The Change

One short paragraph in plain English explaining what this change is trying to accomplish.

### Files Changed

- `<path>`: why this file matters in the change
- `<path>`: why this file matters in the change

### Key Logic Changes

- 
- 
- 

### Schema / Env / Config Impact

- Schema:
- Environment:
- Config:

Use `None observed` when there is no impact.

### Possible Risks / Regressions

- 
- 

### Suggested Human Review Points

- 
- 
- 

### Notes

Optional:
- follow-up checks that were not run
- assumptions made while interpreting the diff
- cross-references to related context notes
