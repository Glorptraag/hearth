<!-- Version: 1 | Date: 2026-06-10 | Changes: Initial creation. Compiled from a full repo/docs sweep (cloud session, PR #175 era). Operator-owned: update whenever a new local-run step is discovered. -->

# Hearth — Local Runs v1

> **Purpose:** The handoff contract between **cloud sessions** (plan, build, unit/integration tests in CI) and **local runs** (anything needing a browser, a live deploy, production credentials, or human editorial judgment). Cloud sessions append here instead of attempting these; the operator (Drew) executes and ticks off locally.
> **Companions:** `deployment-runbook.md` (env setup + first deploy), `incident-runbook.md` (triage), `test-pilot-runbook.md` (CI-side testing), `oncall-cheatsheet.md`.
> **Rule:** every item carries why-local, exact steps, and pass criteria. An item without pass criteria is a wish, not a job.

---

## 1. One-time pre-pilot verifications

### 1.1 Platform wiring audit
**Why local:** live keys + console access (Vercel, Neon, Clerk, Anthropic, Sanity, Sentry, PostHog).
**Steps:** verify all `.env.example` vars present in Vercel (`npx vercel env ls`); Neon PITR enabled; Clerk on live keys; Anthropic hard spend cap set; Sanity Studio reachable; Sentry DSN + PostHog key live.
**Pass:** every var present; each dashboard loads; spend cap visible in Anthropic console.
**Source:** `deployment-runbook.md` §1.1–1.2.

### 1.2 First-deploy smoke test (full)
**Why local:** validates the real deploy chain end-to-end with live services.
**Steps:** the 8-step path in `deployment-runbook.md` §1.6 — landing loads (theme auto-switch), sign-up → onboarding (family + 1 child + 4-step pedagogy wizard incl. demo activity), one entry ≥60-char observation → save, then verify in Neon: `learning_entries` row, `ai_pipeline_logs` row (`model_used` Haiku, `status` ok, within ~10s), `family_intelligence_snapshots.updated_at` recent. Sentry `captureMessage('deploy-smoke-test')` arrives; PostHog shows `entry_created` + `entry_enriched` on the same hashed id. Cron endpoints: `curl -H "Authorization: Bearer $CRON_SECRET" https://<prod>/api/admin/retention` (and `/api/admin/invitations/expire`) → 200; without header → 401. Delete the test user; confirm cascades.
**Pass:** all 8 steps clean; the entry→enrichment→snapshot chain observable in DB; test user fully gone.

### 1.3 Pedagogy wizard click-through (both entry points, both themes)
**Why local:** modal transitions, arrow-key value reordering, localStorage draft persistence, focus trap — never browser-QA'd end-to-end (`alpha-readiness-pickup.md` caveat 2).
**Steps:** onboarding Step 3 wizard: philosophy card → value ranking (↑↓ keys, Home/End) → practice selection → review + demo activity card; complete. Then `/settings` → Learning Approach → "Re-run wizard"; confirm draft persists in localStorage (`hearth-pedagogy-wizard-draft`) across close/reopen; Escape closes without saving. Repeat one pass in gathering theme.
**Pass:** all 4 steps navigate both directions; keyboard reordering works; demo activity renders; draft survives close/reopen; both themes clean.

### 1.4 Account export + delete dry-run
**Why local:** browser file download + verification of real cascade deletes.
**Steps:** seed a throwaway family (2 children, 5+ entries, 1 badge). Settings → export → inspect JSON (all root keys present, no secrets). Then delete account via the danger-zone flow; confirm redirect to sign-in, Clerk user gone, and in Neon: zero rows in `families`, `learning_entries`, `facilitator_notes`, `family_intelligence_snapshots` for that clerk id.
**Pass:** export complete + clean; every cascade verified zero. Known gap to document, not fix: evidence blobs orphan in Vercel Blob (Phase 2 cleanup).
**Source:** `/api/account/{export,delete}` routes.

### 1.5 Compliance report export vs. real QLD HEU template
**Why local:** jsPDF output needs human side-by-side comparison with the actual HEU template.
**Steps:** QLD test family, child with 5–8 multi-subject entries, 1–2 annotated work samples → `/our-story/report` → export PDF. Compare: header (family/child/registration), 8 work-sample slots, annotation fields render, sensible page breaks, QLD terminology only. Also export for a 0-entry child (empty-state behaviour).
**Pass:** valid PDF, structurally matching the real template; data cross-checks against logged entries; no other-state terminology.
**Source:** `src/app/api/report/export/route.ts`; PROJECT_STATUS priority list.

### 1.6 Module runner "End & Log" session QA
**Why local:** localStorage-only session lifecycle (ghost `module_runs` — see post-mortem).
**Steps:** start a module → confirm localStorage keys `hearth_module_<id>_session` / `hearth_module_<id>_start` appear; mid-session "End & Log" → Logger pre-fills module context; save; re-enter module → fresh session (no carryover).
**Pass:** End & Log routes to Logger with context; post-save reset verified; localStorage reflects lifecycle.
**Source:** `src/app/(auth)/module/[id]/page.tsx` (keys at :60-61).

### 1.7 Sample-pack editorial pass (content, not code)
**Why local:** human editorial judgment + AC9 mapping in Sanity Studio.
**Steps:** Studio → the 3 draft packs (`First Term Foundations`, `Outdoor Naturalist`, `Storytellers`) → per module: capability-thread refs present, AC9 descriptor codes per subject, target understanding clear, materials homeschool-feasible → flip to published → confirm marketplace visibility.
**Pass:** all 3 published with complete mappings.
**Source:** PROJECT_STATUS priorities; `src/scripts/{seed-sample-packs,promote-packs}/`.

---

## 2. Recurring ops cadence

### 2.1 Weekly — AI cost watch
`/admin/analytics` → AI Cost tab, 7-day window. **Pass:** weekly total under budget (~$50 at pilot scale); any single-family spike root-caused (legit growth vs noisy — kill switch is `DRAFT_INSIGHTS_ENABLED=false` in Vercel env). Fallback SQL over `ai_pipeline_logs` is in `incident-runbook.md` §2.

### 2.2 Quarterly — `SANITY_API_TOKEN` rotation
New token in Sanity console → update Vercel env → revoke old → verify a seed script succeeds with the new token and the old one 401s. Timestamp the rotation in the incident runbook.

### 2.3 Six-monthly — Neon PITR restore drill
Restore prod to a `restore-drill-<date>` branch → spot-check row counts + latest timestamps → run `db:check-drift` against it → delete the branch → log the outcome. **Pass:** restore works, data sane, drill documented. A restore that has never been rehearsed is not a backup strategy.

---

## 3. Per-deploy smoke steps (every production deploy)

```
[ ] 1. Vercel build log: search "[deploy-migrate]" — migrations applied + drift check
       passed, no "aborting build" (scripts/deploy-migrate.mjs output)
[ ] 2. From laptop: DATABASE_URL=<prod> npm run db:check-drift → exit 0,
       no missing tables/columns reported
[ ] 3. Cron auth: both admin cron endpoints 200 with Bearer CRON_SECRET, 401 without
[ ] 4. Landing loads, no console errors
[ ] 5. One entry end-to-end (abridged §1.2 step 4): save → enrichment log row → snapshot fresh
[ ] 6. PostHog live events show entry_created + entry_enriched
[ ] 7. Feedback modal: /settings → Send feedback → submit → row in `feedback` table
```

---

## 4. New-in-PR-175 QA (one-time, after merge + deploy)

### 4.1 FeedbackModal — interaction + themes + both entry points
**Why local:** focus trap, Escape, motion, theme-adaptive `backdrop-modal`, and the mobile tray→modal handoff are browser-only behaviours; CI covers the API, not the feel.
**Steps:** desktop `/settings` header button: all 4 category chips select with visual feedback; textarea (2000 cap); submit → "Sending…" → success state → auto-close ~1.6s → reopen resets form; Escape closes mid-form. Repeat once in gathering theme. Mobile (390px viewport): hamburger → tray (5 links + Send Feedback row, staggered enter) → Send Feedback closes tray and opens modal → submit → confirm tray did not reopen.
**Pass:** all of the above + a row lands in `feedback` (category/message/route correct) and `feedback_submitted` appears in PostHog (category only, no message content).

### 4.2 Jurisdiction-aware annotation draft (live Anthropic call)
**Why local:** needs a **non-QLD** family and a real Haiku call; the prompt itself isn't user-visible, so live QA verifies behaviour, not prompt text (the prompt contract is unit-tested in `src/lib/ai/annotation-draft.test.ts`).
**Steps:** two test families — `state: 'QLD'` and `state: 'NSW'` → `/our-story/report` → select entry in a work-sample slot → generate annotation. Also one family with no state set (should fall back to the default jurisdiction without error).
**Pass:** both families get coherent 4-field drafts (parent voice, child's name, grounded in the entry); no-state family doesn't error; nothing in the NSW family's UI says "HEU".

### 4.3 Migration 0024 on a real deploy
**Why local:** deploy-time migration application is only observable on an actual Vercel build.
**Steps:** covered by §3 steps 1–2 + 7 on the first deploy containing PR #175.
**Pass:** `feedback` table exists in prod; drift check clean; endpoint 201s.

---

## 5. Playwright e2e (local-only — CI has no browser job)

`e2e/critical-flows.spec.ts` (public routes, auth redirects) + `e2e/co-facilitator-flow.spec.ts` (invite/role flows). Run before any deploy that touches auth, nav, or onboarding:

```bash
npm run dev          # terminal 1
npx playwright test  # terminal 2 (BASE_URL env overrides localhost:3000)
npx playwright test --ui   # interactive mode
```

**Pass:** full suite green against the dev server (and ideally once against a preview-deploy BASE_URL).
**Standing gaps** (tracked in `hearth-research-log.md` coverage matrix): desktop-Chromium only — no mobile profile, no multi-session auth.

---

## Appendix — env needed locally

`DATABASE_URL` (prod, for drift checks), `CRON_SECRET` (cron smoke), Clerk live keys (e2e against preview), optional `ANTHROPIC_API_KEY` / `SANITY_API_TOKEN` for enrichment/seed checks. Pull from Vercel project env; never commit.

*First-move triage table for post-deploy breakage lives in `oncall-cheatsheet.md` and `incident-runbook.md` — not duplicated here.*
