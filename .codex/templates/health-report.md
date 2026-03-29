# Repo Health Report Template

This is the general-purpose health report template. For the stricter pass/fail/warn version used by the Codex task, prefer `.codex/templates/health-report-passfail.md`.

## Scope

- Requested level: quick | standard | full
- Area checked: whole repo | targeted area
- Commit or branch context: what the checks were run against

## PASS

- checks or structural signals that look healthy

## FAIL

- actual failed commands or clearly broken repo conditions

## WARN

- missing scripts, env risks, skipped verification, or ambiguous repo signals

## Checks Run

Use one line per command.

Example:
- `git status --short`: completed, worktree dirty in `src/app/...` and `drizzle/...`
- `npm run lint`: passed
- `npx tsc --noEmit`: failed with route-type mismatch in `src/app/api/...`
- `npm run build`: skipped because the requested level did not require it

## Config / Integration Notes

List high-signal repo-structure observations:
- install state
- available scripts
- env references and local env-file coverage
- obvious config alignment or mismatch

## Recommended Next Action

State the smallest next step that meaningfully improves confidence.
