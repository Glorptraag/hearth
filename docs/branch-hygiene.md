<!-- Version: 1 | Date: 2026-04-20 | Changes: Initial branch hygiene + protection doc. Pairs with scripts/audit-stale-branches.mjs and complements deployment-runbook.md. -->

# Hearth — Branch Hygiene & Protection

> Solo operator. Alpha pilot. Goal: `main` is always green and deployable, stale branches don't pile up, and every push is traceable back to a PR.

## Setup (one-time)

### GitHub auto-delete on merge

- [ ] **Enable** `Settings → General → Pull Requests → Automatically delete head branches` on the `glorptraag/hearth` repo.
- [ ] Delete the corresponding local tracking branch the next time you pull: `git fetch --prune` (safe to add `--prune` to your default fetch config: `git config --global fetch.prune true`).

With this flag on, merged PRs clean themselves up server-side. Everything below targets the *unmerged* backlog.

### Branch protection on `main`

Set in GitHub: `Settings → Branches → Branch protection rules → Add rule`. Target `main`.

| Rule | State | Why |
|---|---|---|
| Require a pull request before merging | ✅ | Enforces the audit trail. |
| Require approvals | ⬜ (solo) | No one else to approve; skip until Phase 2. |
| Require status checks to pass before merging | ✅ — select `typecheck`, `unit-tests` | Both are required by `.github/workflows/test.yml`. Lint is intentionally not required yet (22 pre-existing errors — see `docs/alpha-readiness-pickup.md`). |
| Require branches to be up to date before merging | ⬜ | Would force rebases on every merge. Overkill at pilot scale. |
| Require conversation resolution before merging | ✅ | Catches dangling review comments. |
| Restrict who can push to matching branches | ✅ — allow only the operator | Prevents accidental direct pushes. |
| Allow force pushes | ⬜ | Off, full stop. |
| Allow deletions | ⬜ | Off. |

**Emergency override.** If a CI outage blocks a hotfix, temporarily disable "Require status checks" for one merge, then re-enable. Never disable force-push or deletion protection.

---

## Recurring hygiene

### Every PR you merge

With auto-delete on, nothing to do server-side. Locally:

```
git switch main
git pull --ff-only
git fetch --prune
```

### Weekly sweep (unmerged backlog)

Run the audit script from §Stale-branch audit. Anything older than **14 days and not merged** should be triaged:

1. **Still wanted?** → rebase on main, push.
2. **Superseded?** → delete: `git push origin --delete <branch>`.
3. **Unclear?** → open a PR-as-draft so CI reveals rot, then decide.

### Monthly sweep (all branches)

```
git fetch --prune
git branch -r --merged origin/main | grep -v ' main$' | head -20
```

Anything that shows up here and auto-delete didn't catch (rare — usually from pushes outside the PR flow) should be deleted manually.

---

## Stale-branch audit

Use [`scripts/audit-stale-branches.mjs`](../scripts/audit-stale-branches.mjs):

```
node scripts/audit-stale-branches.mjs
```

Output:

- **UNMERGED & STALE** — branches older than `STALE_DAYS` (default 14) that have not been merged to `origin/main`. These need triage.
- **UNMERGED & ACTIVE** — branches younger than `STALE_DAYS`. Informational.
- **MERGED** — branches that *have* been merged but weren't auto-deleted (shouldn't happen with the GitHub setting on; if this list is non-empty, the setting regressed).

Options:

```
STALE_DAYS=7  node scripts/audit-stale-branches.mjs   # tighter window
PROTECTED=main,release node scripts/audit-stale-branches.mjs   # skip specific refs
```

The script is read-only — it prints branches and suggested commands; it does not delete anything. Run the suggested commands deliberately after reviewing each branch.

---

## Naming convention

- Feature branches: `claude/<slug>` for Claude-authored work, `drew/<slug>` for your own.
- Hotfix branches: `fix/<short-description>`.
- Release tags (when the time comes): `v<YYYY>.<MM>.<patch>`.

Keep branch names short enough to read at a glance in `git branch -a`. If a branch name exceeds 50 characters, abbreviate — long names choke CI log UI.

---

## FAQ

**Q: What if auto-delete deletes a branch I was about to re-use?**
A: The commits are still reachable via `git reflog` on your local clone and via the GitHub UI for ~90 days. Push back up with the same name if you need it.

**Q: Can I disable the "up to date" requirement globally?**
A: It's already off in this config. Rebasing on every merge is overkill at this team size; the CI status checks are sufficient to catch real conflicts.

**Q: Why isn't `lint` a required check?**
A: 22 pre-existing ESLint errors in files this sprint didn't touch. Making lint required would block all merges until those are cleared. See `docs/alpha-readiness-pickup.md` Plan 6b for the cleanup plan; once those are fixed, flip lint to required.
