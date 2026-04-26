# Production Readiness Tracker

> Disposable working tracker for the 30-step path to alpha pilot. Delete
> when the pilot launches. Updated as items land — check the git log
> first; this doc trails reality by a few minutes.

**Last touched:** 2026-04-26 — first fully-green CI run on commit `9407e69`.

---

## Status snapshot

- ✅ done · 🟡 in flight · ⏳ not started · 🚫 blocked

| # | Item | Status | Note |
|---|---|---|---|
| 1 | `npm run build` end-to-end with real env vars | ⏳ | Never verified per [alpha-readiness-pickup.md:55](alpha-readiness-pickup.md). Blocked by CI typecheck regression below. |
| 2 | Drizzle migration numbering / journal drift | ✅ | Resolved by side chat (commit `e4fc25c`). Journal + on-disk SQL reconciled; per-fork backfill removed. |
| 3 | Provision prod accounts (Vercel Pro, Neon prod, Clerk prod, etc.) | ⏳ | |
| 4 | Populate Vercel env vars + reconcile `ADMIN_CLERK_IDS`/`ADMIN_USER_IDS` | ⏳ | |
| 5 | Run §1.6 first-deploy smoke test | ⏳ | Gated on 1 + 3 + 4. |
| 6 | Re-enable CI on push/PR | ✅ | Commit `c9baf99` on main. First green run on 2026-04-26 (`9407e69`) after fixing lockfile drift. |
| 7 | Clear 22 ESLint errors → flip lint to required | ✅ | 36 warnings remain (cosmetic, no errors). `continue-on-error` removed in this pass. |
| 8 | Four-layer vitest pilot run end-to-end | ✅ | 2026-04-25. Full lifecycle: branch → migrate → vitest → delete. Documented in [test-pilot-issues.md](test-pilot-issues.md). |
| 9 | Neon integration secrets wired in GH Actions | ✅ | Verified — integration job ran green on `9407e69`. |
| 10 | Integration coverage on critical API routes | 🟡 | `entries` route done (5 cases, green). Still bare: snapshot rebuild, badge award, report export, account export/delete. |
| 11 | Manual QA pedagogy wizard (onboarding + Settings re-run) | ⏳ | Never clicked through. |
| 12 | Fix `handleSkipWizard` silent advance on PATCH failure | ⏳ | |
| 13 | Persist partial wizard progress on close | ⏳ | |
| 14 | Arrow-key tab cycling in wizard Review step | ⏳ | |
| 15 | Run Playwright `e2e/` specs against preview deploy | ⏳ | |
| 16 | PostHog family-level identification | ⏳ | Today: two Clerk users in one family = two PostHog persons. |
| 17 | Model-aware AI cost pricing in admin dashboard | ⏳ | Hardcoded to Haiku 4.5. |
| 18 | Hard Anthropic spend cap + weekly alert + kill-switch cheat sheet | ⏳ | |
| 19 | Verify `CRON_SECRET` header shape post-deploy | ⏳ | |
| 20 | Minimal oncall cheat sheet | ⏳ | |
| 21 | Dry-run `/api/account/export` + `/api/account/delete` | ⏳ | |
| 22 | Privacy Policy + T&Cs surface, linked from landing/onboarding | ⏳ | Required before any QLD family onboards. |
| 23 | HEU report export vs. actual QLD HEU template | ⏳ | |
| 24 | Neon PITR retention + restore drill | ⏳ | |
| 25 | Rotate `SANITY_API_TOKEN`; calendar quarterly | ⏳ | |
| 26 | Seed 2–3 additional Sanity packs beyond Starter | ⏳ | |
| 27 | Test-family onboarding packet | ⏳ | |
| 28 | Automated trigger for noisy-family rate-limit tightening | ⏳ | |
| 29 | Logger draft survives network drop (offline minimum) | ⏳ | |
| 30 | Move rate limiter to Redis / Upstash before multi-region | ⏳ | Phase 2 prep. |

**Done:** 5 / 30 · **In flight:** 1 · **Open:** 24

---

## Active blockers

None. CI is green; both 2026-04-26 blockers cleared:

- **Lockfile drift** → fixed by `d71bb90` (regenerated against current
  `package.json`).
- **Integration job skipped** → false alarm. The first run hit the gate
  before secrets propagated. Subsequent runs include all four jobs.

---

## Notes accumulated this sprint

Things worth keeping but not 30-step items:

- **GitHub branch-protection rulesets are advisory on private free-tier
  repos.** The "Require checks to pass" rule is configured but won't
  actually block merges until the repo upgrades to Team/Enterprise or
  goes public. Solo-dev pilot is fine; flag before adding collaborators.
- **Schema drift between `src/lib/db/schema.ts` and `drizzle/0007_dusty_ironclad.sql`**
  — schema uses `compliance_reports` / `work_sample_candidate`; migration
  writes `heu_reports` / `heu_candidate`. Parent dev branch had the
  rename applied out-of-band so tests pass, but a fresh DB created from
  `drizzle/*.sql` would not match the app. Separate cleanup task.
- **`package.json` + `package-lock.json` have unsynced hunks** that
  predate this work (typescript pin bump, `@vitest/coverage-v8` reorder).
  Don't bundle into unrelated commits.
- **date-fns 4.1.0 install can drop `index.d.ts`** even though the
  published tarball ships it. Forcing `rm -rf node_modules/date-fns &&
  npm install date-fns@4.1.0` doesn't always fix it — full clean
  reinstall sometimes does. Likely the cause of the CI typecheck red.
