<!-- Version: 1 | Date: 2026-10-19 | Changes: initial. Workable build plan for "Hearth — Launch Pivot v1 (Expo, 9 Nov 2026)", reconciled against the repo and four rounds of Drew's answers (19 Oct). -->

# Hearth — Launch Pivot Build Plan v1

> **Source:** "Hearth — Launch Pivot v1 (Expo, 9 November 2026)" (Claude.ai project, 16 Oct). That doc carries the *why*; this one carries the *what, in what order, gated on whom*.
> **Calendar:** today Mon 19 Oct · freeze Wed 4 Nov (13 working days) · go/no-go Fri 6 Nov · Expo Mon 9 Nov.
> **Execution:** pharao autonomous run (`.claude/plans/PLAN-launch-pivot.md` + `status-launch-pivot.json`). Every Drew gate below is a hard stop for its dependants, not for the whole run.

---

## 0. Reality check (what the pivot assumed vs what exists)

| Pivot assumed | Repo reality (19 Oct) | Consequence |
|---|---|---|
| S0–S2 of the notes handoff landed: `moments`, `moment_runs`, `moment_links`, Resolve/Propose | None of it exists. The nearest code is the **Logger Notice → Confirm rebuild** (D-LPS-14/15/16), and that is **uncommitted** in worktree `hearth-logger-rebuild-0b8907` (75 files, +1.5k/−6.2k, since 7 Oct). | The logger rebuild is the S0–S2 base. Committing it is task #1. |
| New `moments` tables | `learning_entries` + `enrichEntry` (one Haiku 4.5 call, text-only) + DLO proposals + `/api/capabilities/.../dlo/.../confirm` | **A2:** map onto existing tables. |
| `siteCopy` as a sentence source | Draft PR #284, not merged, and not chosen for merge | Use in-code copy files (`noticeCopy.ts` / `confirmCopy.ts` pattern). |
| Shelf, knowledge notes | Neither exists. Kindler only has activity-level `watchFor`. | Build both (A4, A5). |
| Native app at the stand | Xcode + `cap add` done. Apple enrolment, Play closed track and Sign in with Apple are **not** done. | **A6:** web app at the expo; stores after. |
| Insights / PKB / Constellation passes | Draft PRs #285–#288, CI-green, stacked | Merge as foundation (Drew, 19 Oct). |

---

## 1. Decisions (P1–P10 confirmed, with these amendments)

P1–P10 of the pivot stand, amended as follows. Log them all in `docs/hearth-decisions-log-v1.md` as **D-LP-1…10 + A1…A9**.

| # | Amendment | Replaces |
|---|---|---|
| **A1** | **Photo Read runs post-save, inside `enrichEntry`.** One vision call reads *and* proposes. The photo saves instantly. The Read draft line shows on the Confirm surface as **"Use this / Edit"**, and only an accepted or edited draft becomes the entry text (`drafted_by: 'read'`). | P2 pre-fill-before-save; P3's 2-call photo budget becomes **≤ 1 call per save, photo or not** (the Sonnet fallback stays the existing failure path). Architecture principle 4 stays intact. |
| **A2** | **No new `moments` tables.** `learning_entries` gains `drafted_by` (`parent \| read`, default `parent`) and `read_output` (jsonb, the validated Read schema). The run tape is the existing enrichment/AI-usage logging plus `stage = 'read'` tokens. `moment_links` = the existing DLO link/assertion rows. | Pivot §4.3 |
| **A3** | **Read is OFF in production until Anthropic zero-data-retention is in place.** Flag `PHOTO_READ_ENABLED` plus `PHOTO_READ_FAMILY_ALLOWLIST` (the stand demo family only, curated photos with no faces). The family opt-in (`families.photo_read_opt_in`, P4) is built regardless. | P4 go-live assumption. Demo step 6: a visitor's own photo is stored and confirmable, but not read, until ZDR lands. |
| **A4** | **Shelf = Sanity `shelfResource` document type.** Wave 1 has four: **Math-U-See, The Good and the Beautiful, All About Reading, Story of the World**, plus two universal sources: **My own plan** and **An AI-made plan** (P6). Matching is deterministic (alias + lesson-number regex on `read_output.printedText`, zero LLM). | Pivot "three resources" |
| **A5** | **DLO notes: Claude drafts about 50 F–Y3 "watch for next" notes into Sanity, and Drew confirms each one.** Only notes with `confirmedAt` render. Unconfirmed → block omitted, never generated at read time. Batches of about 10 from Fri 23 Oct. | Pivot §4 authoring source |
| **A6** | **Expo vehicle = the web app** (QR → `www` sign-up → add to home screen). Native submission runs after the expo. Drew starts Apple enrolment and the Play closed track this week. | Pivot assumed a native trial |
| **A7** | **Account deletion fixed before go-live, with D1 = transfer ownership.** If another adult member exists, ownership transfers and the deleting user leaves. A sole owner deletes the Hearth outright. Deletion also removes the Clerk user and every Blob evidence object. | D1 in `hearth-account-deletion-defect-v1.md` §3 |
| **A8** | **Merge #285 → #286 → #288 (stacked) and #287**, then rebase the logger rebuild onto the result. | — |
| **A9** | **P9 cuts are flags, not deletions.** Module Builder, Planner, Marketplace and badges are hidden from nav and routes behind `LAUNCH_SCOPE=expo`. `/ask` and cue suggestions were never built and stay unbuilt. | — |

---

## 2. Workstreams

IDs are referenced by the pharao PLAN. **[D]** = Drew gate. Times are working-day windows, not estimates.

### W0 · Foundation (19–21 Oct): blocks almost everything
- **W0.1** Commit the logger rebuild worktree as-is (WIP commit on `claude/hearth-logger-rebuild-0b8907`) and push it. No content changes.
- **W0.2** Merge #285 → #286 (migration `0030_logger_context.sql`) → #288, then #287. Confirm CI is green on `main` after each one.
- **W0.3** Rebase the logger rebuild onto the new `main`. Conflicts are expected in `dlo-persistence` (#288), the logger context (#286), the insights rail (#285) and motion classes (#290). Get CI green, open a PR, merge it.
- **W0.4** Log D-LP-1…10 + A1…A9 in the decisions log. Update `PROJECT_STATUS.md`.

### W1 · Photo Read inside enrichment (21–26 Oct) · after W0.3
- **W1.1** Migration: `learning_entries.drafted_by`, `learning_entries.read_output`, `families.photo_read_opt_in`. Update factories in lockstep.
- **W1.2** Client capture pipeline: downscale to 768 px long edge, strip GPS, keep the EXIF date (→ `dateOccurred` default). Unit-tested.
- **W1.3** `src/lib/ai/read.prompt.md` (versioned) + Zod schema for the Read output (pivot §4.2). Refusal or invalid output → empty, never invented.
- **W1.4** `enrichEntry`: when the flag allows it, the family has opted in and the entry has photo evidence, send image content blocks in the same Haiku call. The Read fields are added to the output schema and stored in `read_output`. Token cap: about 1,300 input for the image + 250 output for the Read section. The cost dashboard picks it up.
- **W1.5** Fixtures: a `fixtures/photos/` harness with 10 cases (pivot §4.5). Synthetic placeholders now; **[D]** swap in real photos when Drew supplies them.

### W2 · Shelf (21–27 Oct) · parallel with W1
- **W2.1** Sanity `shelfResource` schema (title, publisher, aliases[], lessonPattern, ageBand, isUniversal). **[D]** Drew approves before the Studio deploy.
- **W2.2** Seed doc set for the 6 resources, held as a script. **[D]** Drew approves before the prod publish (never auto-publish).
- **W2.3** `src/lib/shelf/match.ts`: deterministic printedText → `{resourceId, lesson?}`, with unit tests against the fixtures.
- **W2.4** `learning_entries.working_from` (jsonb `{resourceId, lesson, source: 'read'|'parent'}`). It is written only on parent confirm.

### W3 · Logger v4 + Confirm (26–30 Oct) · after W1.4, W2.3
- **W3.1** Photo-first capture: 📷 is the primary action on `/log` and the existing save gate is unchanged.
- **W3.2** First-photo disclosure sheet (P4) storing `photo_read_opt_in`. **[D]** Drew approves the copy (draft lands by 26 Oct). Pair it with PR #233's AI label.
- **W3.3** Confirm surface gains a **Read draft row** ("Use this / Edit" → PATCH text, `drafted_by: 'read'`) and a **Working-from chip** ("Working from: Math-U-See Alpha · Lesson 12?" → confirm / change / no). A new `pending` copy covers "reading your photo".
- **W3.4** *Stretch, first cut:* the catch-up-the-week queue (pivot §4.4), only if W3.1–3.3 are green by Mon 26 Oct + 2.

### W4 · DLO notes (23 Oct–3 Nov) · parallel
- **W4.1** Sanity: a `watchForNext` field on `discreteLearningObjective` (per-tradition variants optional, neutral default required) plus `confirmedAt` / `confirmedBy`. **[D]** schema approval.
- **W4.2** Rank the F–Y3 DLOs by fixture and wave-1 hits plus early literacy, early number, science/nature and art/making. Pick about 50.
- **W4.3** Draft in batches of 10 (as Sanity drafts, unpublished). **[D]** Drew confirms each batch in Studio. Batch 1 Fri 23 Oct, then about two per working day.
- **W4.4** Render "Watch for next" under confirmed chips (Confirm + moment detail). Unconfirmed notes are omitted, with a test pinning that.

### W5 · Report + Constellation story (27 Oct–2 Nov) · after W0.3, W3.3
- **W5.1** Annotated work samples (P7): an entry with a photo and a confirmed DLO renders as the parent's words + DLO plain-language line + band sentence, grouped per learning area in the report and the PDF. No data-model change.
- **W5.2** Constellation copy: "what's growing" vs the Report's "what's evidenced" (P10). Copy only.
- **W5.3** Dashboard: recent moments · chips to confirm · one watch-for line.

### W6 · Account deletion (20–30 Oct) · independent
- **W6.1** Implement D1 = transfer ownership per `hearth-account-deletion-defect-v1.md`: cover all 27 FKs, Clerk user delete and Blob `del()`. Flip the `it.fails` pin in `orphan-tables.integration.test.ts` to passing.
- **W6.2** UI: if co-members exist, show a transfer step before the delete confirms.

### W7 · Scope cuts + demo (28 Oct–3 Nov)
- **W7.1** `LAUNCH_SCOPE=expo` hides Module Builder, Planner, Marketplace and badges (nav + route guard). Reversible.
- **W7.2** Demo family seed: reset script + 6 photo moments with Read output pre-baked, so the stand works even if the API is slow. **[D]** Drew supplies the 6 photos.
- **W7.3** `/expo` landing: banner line "Any curriculum. Or none. Ready for the HEU." Remove Spark/Servo.

### W8 · Freeze (2–4 Nov)
- **W8.1** Flags set per environment, docs propagated (pivot §10), `COMPONENT_REGISTRY.md` updated.
- **W8.2** Go/no-go checklist for 6 Nov: golden replay, the 90-second demo run three times on the stand phone, the deletion test, and Read OFF in prod unless ZDR is confirmed.

**Never cut:** W0, W1.3 (schema + refusal), W3.3 Confirm, W5.1 annotated samples, W6.
**Cut order if the calendar slips:** W3.4 catch-up → W5.3 dashboard → W4 notes beyond the confirmed batches → W7.3 polish → Working-from chip on camera roll.

---

## 3. Drew's gates (the run stops on these, nothing else)

| By | Gate | Unblocks |
|---|---|---|
| **Now** | Request **zero data retention** from Anthropic for the API org | Read in production (A3) |
| **Now** | Start **Apple Developer enrolment** (D-U-N-S), the **Play Console + closed track** (12 testers × 14 days) and **Sign in with Apple in Clerk** | Post-expo store launch (A6) |
| 21 Oct | Approve the Sanity schema adds (`shelfResource`, DLO `watchForNext`) | W2.2, W4.3 |
| 22 Oct | Approve the Shelf seed publish to prod | W3.3 chip in prod |
| 23 Oct → 3 Nov | Confirm DLO note batches in Studio (~5 min each) | W4.4 renders |
| 23 Oct | 10 fixture photos + 6 demo photos (anonymised, no faces) | W1.5, W7.2 |
| 26 Oct | Approve the disclosure sheet copy + PR #233 AI label | W3.2 |
| Before go-live | PR #232 regulator disclaimer (legal) | Report PDF to a real HEU |
| 6 Nov | Go/no-go | Expo |

---

## 4. Risks specific to this plan

| Risk | Mitigation |
|---|---|
| The W0.3 rebase is large (−6k lines vs three merged passes) | Do it first, alone, in one session. If it isn't green by Wed 21 Oct, re-scope W3 onto the current `/log` rather than slip everything. |
| ZDR doesn't arrive before 9 Nov | The stand runs on the allowlisted demo family (curated, faceless photos). Visitors still get Confirm + Report, just without the Read draft. The pitch holds. |
| The note confirmation backlog | Batches stay small. Unconfirmed notes don't render, so a short list degrades gracefully. |
| Two writers on `/log` or the Confirm files | The pharao plan serialises W1.4 → W3 → W5. W2, W4, W6 and W7.1 touch disjoint files. |
