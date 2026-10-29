<!-- Version: 1 | Date: 2026-10-21 | Changes: initial. Build plan for the Hearth Cycle and the 7–21 Oct spec chain, reconciled against main (40575ff) and the unmerged launch-pivot branch (4f2c861). Noun mapping, naming rulings, decisions, workstreams HC-0…HC-19, gap register G1…G58, calendar, measurement, risks, authoring load, compensating controls. -->

# Hearth Cycle — Build Plan v1

> **Status:** This is the plan of record for building the spec chain (`hearth-spec-chain-README.md`) and the Hearth Cycle brief (`hearth-cycle-brief-v1.md`). Nothing in it is built yet. Every slice in §5 is one PR.
> **Reconciled against:** `main` at `40575ff` and the unmerged pivot branch `claude/hearth-launch-pivot-v1-175462` at `4f2c861` (20 Oct).
> - Paths marked *(pivot)* exist only on that branch. Read them with `git show origin/claude/hearth-launch-pivot-v1-175462:<path>`.
> - Paths marked *(new)* don't exist yet.
> - Every other path was checked against `main` on 21 Oct.
>
> **Precedence:** the chain README's order applies: watch-for > learning cycle > pedagogy layer > launch pivot > Three Passes. The Cycle brief sits above the chain as direction, not build spec. Where the chain and shipped code disagree, §4 says which wins and who decides.
> **Execution house style:** `hearth-refactor-postmortem-v1.md` §4 applies:
> - one deliverable per PR, green on all four CI jobs, with tests at the right layer in the same PR
> - foundations soak before dependents
> - a flag is never a substitute for end-to-end verification
>
> D-HC-1 overrides the postmortem's §5 evidence gate. It does not override §4.
> **Short names used below:** WF = `hearth-watch-for-v1.md` · LC = `hearth-learning-cycle-v1.md` · PL = `hearth-pedagogy-layer-v1.md` · LP = `hearth-launch-pivot-v1.md` · TP = `hearth-coherent-system-passes-v1.md` ("Three Passes") · brief = `hearth-cycle-brief-v1.md` · pivot plan = `hearth-launch-pivot-plan-v1.md` *(pivot)*.
> **Companions:** the seven chain docs. Also `hearth-logger-spec-v2.md` *(pivot)*, `hearth-outcomes-spine-plan-v1.md`, `hearth-pedagogy-system-architecture-v1.md`, `hearth-pilot-personas-v1.md`, `hearth-parent-journey-v1.md`, `hearth-account-deletion-defect-v1.md`, `hearth-native-app-plan-v1.md` and `hearth-decisions-log-v1.md` (section "Spec chain and Hearth Cycle (21 Oct 2026)").

---

## 0. Summary

**What the Cycle is.** Every session runs **Prepare → Learn → Notice → Turn**. Before learning, a **watch-for** primes one observable thing (WF §3). After learning, the log asks about that thing (WF §6). The answer does two jobs:
- it moves the child's Constellation (the notice loop)
- the method's **turn** writes the next session (the apply loop, LC §4)

Underneath, a hidden **educator path** (WF §7) slowly deepens what Hearth offers the parent. The brief adds lesson patterns, a Lesson Builder, a Craft library, Know Your Child, My Teaching and linked community above that, as direction.

**Decided 21 Oct (D-HC-1…5, §4.1):**
1. Build on schedule. This overrides postmortem §5, with the compensating controls in §11.
2. At the expo, the record hooks and the Cycle deepens.
3. The chain's nouns map onto existing tables (§2).
4. The expo builds the pivot plan plus a thin watch-for slice.
5. The DLO watch-for = a neutral sign + the tradition's `watchHow`. Per-tradition variants are dropped now.

**What ships for the expo (HC-1).** The pivot plan W0–W8 stays the build. On top of it:
- the schema is corrected before Studio deploy: variants dropped, `watchHow` added, the shelf field renamed, and DLOs plus Shelf added to the Studio desk
- the 50 DLO notes are re-cut to neutral
- each child gets an everyday watch-for line inside W5.3
- the `/expo` page gets a Cycle section with four pattern cards and a stand research card

Everything else in LC §13 and WF §13 moves to right after the expo.

**The order after the expo:**

| Phase | Window | Slices |
|---|---|---|
| Phase 2a foundations | 17 Nov – Jan | attribution and timezone, `knowledgeNote`, tradition notes, DLO tags, rhythms engine, Today/Week, watch-fors in full |
| Phase 2b cycle surfaces | Jan – Feb | Plan something, conversational log, educator path, morning cards, craft cards and the `/craft` library, week shape, pedagogy-layer migration |
| Brief-only phase | after B1–B9 and its own spec | patterns and Lesson Builder, worked-example modules, Know Your Child, My Teaching |
| Phase 3 | Mar – May | linked community, curated resources |

**The ten biggest missing bits (§6):**

| # | Gap | Ref |
|---|---|---|
| 1 | The base notes-architecture docs don't exist anywhere. | G1 |
| 2 | DLOs and Shelf resources aren't in the Studio desk, so Drew can't easily confirm the notes he's due to confirm from Fri 23 Oct. | G8 |
| 3 | There's no cue index to resolve plan text against DLOs. | G6 |
| 4 | There's no adult attribution and no family timezone, which the educator path and morning cards need. | G14, G15 |
| 5 | There's no Today, Week or session model; the Planner is hidden for the expo. | G27 |
| 6 | There's no cron, push sender or email sender for morning cards. | G22, G23 |
| 7 | PL D45 retires the PKB and corpus that `main` shipped on 19 Oct. | G34 |
| 8 | CLAUDE.md principles 1 and 11 contradict LC turns and C14. | G32, G33 |
| 9 | Hearth-session photos are public today, and consent isn't enforced. | G42 |
| 10 | Account deletion is still broken, and every new table adds a foreign key. | G45 |

---

## 1. Reality check

What the chain or brief assumes, set against `main` and the pivot branch on 21 Oct.

| # | Chain / brief assumes | Repo reality | Consequence |
|---|---|---|---|
| 1 | `hearth-notes-architecture-v1.md`, `-v2.md` and `hearth-notes-handoff-plan-v1.md` are the base, "already in `docs/`" (chain README) | Absent from `docs/`, from every remote branch and from git history | D-HC-3: map the chain's nouns onto existing tables (§2). List what can't be resolved (§2.4). G1 |
| 2 | Handoff S0–S2 have landed: `moments`, `moment_runs`, `moment_links`, Resolve/Propose (LP §6) | None of these exist. Pivot plan §0 found the same and chose A2: `learning_entries` is the record and `observation_dlo_links` are the links | A2 extends to every chain noun (§2.1) |
| 3 | A cue index (`resolve.ts`, "L2"), `knowledge.json` and signal cue files (WF §4.2, PL §3, LC §11) | None of these exist. The nearest is `src/lib/pedagogy/situational-signals.ts`, which maps Logger chips to `tags.json` tokens for PKB retrieval. Interpretation today is Haiku enrichment (`src/lib/ai/enrich.ts`) | Build `src/lib/cues/` *(new)* in HC-6. G6 |
| 4 | DLO IDs like `N1-03`, each with `toNext[band]`, `plain`, `looksLike`, `prereq` and `next` (WF §3, §8.1) | The repo has 171 DLOs = 57 threads × 3 tiers, with IDs `dlo.<THREAD>.<tier>` and one multi-statement `descriptor`. The pivot adds `watchForNext` *(pivot)* | Band = tier (§2.2). Translate the worked examples' IDs into repo IDs for test fixtures. G5 |
| 5 | A `knowledgeNote` type with kinds `method`, `signal`, `craft`, practice and tradition | No such type. What exists: `pedagogicalFramework`, `practice` (12 cross-tradition keys), seven PKB types, lens bundles and methodology overlays | One new `knowledgeNote` type, plus an extended `pedagogicalFramework` (HC-2b, HC-2c). G7 |
| 6 | Today and Week replace the Dashboard and Planner (LC D50, C15) | The Dashboard is live. The Planner is live on `main` and hidden by `LAUNCH_SCOPE=expo` (`src/lib/launch-scope.ts` *(pivot)*). No Today, Week or session card exists | HC-4. G27 |
| 7 | Turns write the next **sessions** (LC §4, §11) | `planner_entries` has: date, title, moduleId, learnerIds, session (morning\|afternoon), subjects, and notes (never used). `learning_entries.plannerEntryId` is written only by the module runner | Extend `planner_entries` into the session table (§2.1, HC-3) |
| 8 | Morning cards and a notification, from day briefs built at the family's local 03:00 (WF §5, §9.2) | `vercel.json` has two crons only (retention, invitation expiry). There is no push sender: `src/app/api/device-tokens/route.ts` only registers tokens. There is no email sender and no family timezone. Quiet hours run 8pm–7am (`src/lib/notifications/triggers.ts:125`) | HC-9. G15, G22, G23, G24 |
| 9 | Educator data is per parent, and `moments.logged_by` records who logged (WF §9.1) | `learning_entries` has no adult attribution. `family_members.clerk_user_id` exists | HC-2a. G14 |
| 10 | A conversational log: Saw it · Partly · Not yet · Didn't come up, with not-yet chips and parent moves (WF §6) | The Logger is Notice → Confirm (D-LPS-14, `hearth-logger-spec-v2.md` *(pivot)*). There's no not-yet capture. `confirmProposal()` (`src/lib/logger/confirm-client.ts` *(pivot)*) is a usable seam for Saw it | HC-7. G19 |
| 11 | PL D45: traditions are described in Hearth's own words; the corpus docs are retired; lens bundles and the PKB go | `main` merged the corpus calibration batches (#287) and the PKB Logger context (#292) on 19 Oct. Lens bundles and methodology overlays sit on the `module` schema. CLAUDE.md principle 11 describes seven layers | A formal re-open is needed (Q-HC-1). HC-12 retires them as a strangler. G34 |
| 12 | PL D39: no per-DLO tradition variants | Pivot W4.1 added `watchForNext.variants`, and 50 drafts carry six variants each (`content/dlo-notes/` *(pivot)*) | D-HC-5: drop them now (HC-1a, HC-1b) |
| 13 | LP P3: a photo save may make ≤ 2 model calls | Pivot A1 amended this to ≤ 1 call per save, photo or not (Read folds into `enrichEntry`) | A1 stands, as the later, repo-recorded amendment. G57 |
| 14 | Expo scope (LC §13, WF §13): Today, Log a session, Turn, the Rhythm note, starters, the conversational log, Plan something, morning cards, 11 craft notes, `watchHow` and the educator path | The pivot plan W0–W8 is the expo build. Freeze is Wed 4 Nov. Most W tasks are still pending (`status-launch-pivot.json` *(pivot)* trails its own git log) | D-HC-4: the pivot plan plus a thin slice (HC-1c) |
| 15 | LC C14 rewords the locked principle ("Logging is the core act…") | CLAUDE.md Architecture Principle 1 and the `PROJECT_STATUS.md` core principles still read "Retrospective logging is the core interaction…" | Q-HC-2: Drew confirms. CLAUDE.md is edited in its own PR. G33 |
| 16 | The brief says "the Logger was reworked around watch-fors" | The pivot Logger is Notice → Confirm and not watch-for based. It deletes `WatchForTodayStrip.tsx` | HC-7 is where the watch-for log gets built |
| 17 | Brief §10: 3–4 lesson patterns on "Today session cards" at the expo | No Today exists, and the Planner is cut for the expo | Patterns ship as content plus `/expo` cards only (D-HC-2, HC-1d). G39 |
| 18 | Brief §7.4: re-review `prototypes/hearth-community-flow-v2.html` | That file isn't in the repo, git history or any branch | A new design (HC-17, HC-19). G41 |
| 19 | Brief §6.2 Know Your Child reads evidence kind, `chooses`, time of day and not-yet chips | None of these are captured today. `dateOccurred` is date-only and `createdAt` is the UTC save time | KYC lines ship as their data arrives (HC-15). G16–G19 |
| 20 | (Process) Structural work waits for evidence (postmortem §5) | 0 captured profiles (`hearth-pilot-personas-v1.md` §7). R7: the feedback channel has produced no UX findings | D-HC-1 overrides it, with the §11 controls. G58 |

---

## 2. Noun mapping (D-HC-3) — binding

The three base docs are absent, so the chain's nouns are mapped onto what exists. This extends pivot A2 ("no new `moments` tables").

Two rules hold for every PR:
1. New schema gets its write path in the same or the immediately following PR (outcomes-spine §4, "no new ghost schema").
2. Every new family-scoped table sets `ON DELETE CASCADE` on `family_id`, as `feedback`, `device_tokens` and the DLO tables already do. It adds a row to `src/app/api/account/delete/orphan-tables.integration.test.ts`, and it updates `src/test/factories.ts` and `src/test/db-factories.ts` in the same PR.

### 2.1 Postgres

| Chain noun | Repo home | Change | Lands in |
|---|---|---|---|
| **Moment** | `learning_entries` | + `created_by_clerk_user_id text` (chain `logged_by`) · + `lookfor jsonb` per child: `{ watchForId, dloId, tier, result, notYet[], parentMove[] }` · + `outcome jsonb` per child (rhythm outcome key) · + `rhythm_id uuid`. Chain `session_id` = the existing `planner_entry_id`. `drafted_by` / `read_output` / `working_from` are already in `drizzle/0031_photo_read.sql` *(pivot)* | HC-2a (attribution), HC-3 (outcome, rhythm_id), HC-7 (lookfor) |
| **moment_links** | `observation_dlo_links` | No schema change. **Saw it** → an `asserted` row at the target tier via `confirmProposal()` *(pivot)*. **Partly** → Q-HC-6. **Not yet / Didn't come up** → no row | HC-7 |
| **moment_runs** (the tape) | `ai_pipeline_logs` | `stage = 'read'` (pivot A2); `stage = 'plan'` for plan resolution | HC-6 |
| **sessions** | `planner_entries` | + `source text` (`parent` \| `rhythm` \| `plan`, default `parent`) · `rhythm_id` · `item_ref` · `step jsonb` · `plan_text` · `created_by_clerk_user_id`. `status` gains `done` \| `skipped` \| `moved`. The table name stays until a later cleanup PR, and existing rows become `source = 'parent'` | HC-2a (attribution), HC-3 (the rest) |
| **rhythms**, **rhythm_state** | new | As LC §11 | HC-3 |
| **watch_fors** | new | As WF §9.1, with `band` renamed `tier` and `dlo_id` = the repo DLO id (`dlo.<THREAD>.<tier>`) | HC-5 (HC-1c computes without a table) |
| **educator_profiles**, **educator_events** | new | As WF §9.1, keyed by Clerk user id, with a family cascade | HC-8 |
| **day_briefs**, **card_events** | new | As WF §9.1 | HC-9 |
| **moment_signals** | new | As PL §11 | HC-12 |
| family timezone | `family_settings.timezone` | + IANA string. Default derived from the onboarding state, editable in Settings | HC-2a |
| parent display identity | `family_members` | + `display_name` | HC-17 |

The next migration number is **0032**, because the pivot holds 0031. Migrations are hand-authored per `drizzle/META_README.md`.

### 2.2 Sanity

| Chain concept | Repo home | Notes |
|---|---|---|
| `knowledgeNote` | **new type** `knowledgeNote` with a `kind` discriminator: `method` (LC §3), `craft` (WF §8.1), `practice` (PL §5.7, plus WF `stage` and `why`), `signal` (PL §3), and later `pattern`, `guide`, `ageGuide` (brief) | Per-kind validation copies the chain's rules: method outcomes 3–4, steps ≤ 3, `why` ≤ 20 words; craft body ≤ 40 words at E1–E2 and ≤ 90 at E3–E4; a fixed trigger-kind list. IDs are dotted (`method.cm.living-book`, `craft.wait-time`), so browser reads go through `CLIENT_READ_QUERIES` (`src/lib/sanity/read-allowlist.ts`). |
| tradition note | **extend** `pedagogicalFramework` | Gains the PL §4 fields (stance, lens prompt and signal, stages, signal table, rules, balance, nextBias), the WF §8.1 fields (`watchHow` `{does, says, makes, chooses}` + stage overrides, `notifyDefault`) and LC §6 `weekShape`. The schema slug is `waldorf_steiner`, matching the pivot DLO notes and `content/traditions/watch-how.yaml`. `PedagogyKey` in `src/types/capability-universe.ts` uses `waldorf` (and `charlotte-mason`), so align it on `waldorf_steiner` (G11). |
| practice (PL §5.7, about 42 tradition-scoped notes such as `cm.narration`) | `knowledgeNote` kind `practice`, with `tags[]` drawn from `PRACTICE_KEYS` | The repo's `practice` document (12 cross-tradition keys, defined in `src/sanity/schemas/methodologyOverlay.ts`) stays as a tag set. One source of truth for the keys (G10). |
| DLO `toNext[band].sign` (the look-for) | DLO `watchForNext.neutral` *(pivot)* | One observable sentence per `dlo.<THREAD>.<tier>` |
| DLO `toNext[band].notYet[]` | DLO `watchForNext.notYet[]` `{ id, label, respond? }` *(new)* | `respond` references a practice note |
| DLO `evidence` | DLO `evidenceKind` (`does` \| `says` \| `makes` \| `chooses`) *(new)* | Named `evidenceKind` to avoid clashing with `learning_entry_evidence` and the TP ledger |
| DLO `why` | DLO `why` (short) *(new)* | Falls back to the thread summary |
| DLO `looksLike` (log placeholder, WF §6.1 3a) | derived from `descriptor` for now | A field only if authored text is needed |
| DLO `prereq` | `prerequisiteEdge` (`fromThread` / `fromStageBand` → `toThread` / `toStageBand`) | Same grain as thread × tier |
| DLO `next` | tier + 1 in the same thread, or the outgoing `prerequisiteEdge` from `demonstrating` | |
| LC list templates (catechism, skip counting, poems) | `knowledgeNote` kind `list` or a collection type | Decided in HC-3 |
| Shelf | `shelfResource` *(pivot)* | Field `lessonPattern` → `lessonNumberRegex` (HC-1a) |

### 2.3 Code

| Chain path | Repo path | Notes |
|---|---|---|
| `src/lib/cycle/turn.ts`, `schedule.ts`, `weekshape.ts`, `starters.ts` | same *(new)* | Pure. Golden turn fixtures run as unit tests. |
| `src/lib/watch/select.ts`, `compose.ts`, `plan.ts`, `carry.ts` | same *(new)* | `select` and `compose` land first, in HC-1c. |
| `src/lib/log/script.ts`, `absorb.ts` | `src/lib/logger/conversation/{script,absorb}.ts` *(new)* | Keeps one Logger namespace (`src/lib/logger/`). |
| `src/lib/brief/build.ts` | same *(new)* | Craft triggers go in `src/lib/brief/triggers.ts` *(new)*. |
| `src/lib/educator/evaluate.ts` | same *(new)* | |
| cue index (`resolve.ts`) | `src/lib/cues/` *(new)* | Built from DLO descriptors, `watchForNext` and authored cue files. Precedent for token mapping: `src/lib/pedagogy/situational-signals.ts`. |
| PL `lens.ts`, signal scoring | `src/lib/pedagogy/` | |
| PL `direction.ts` | folded into method `turn.pattern` and week shape | Per the README's conflict row |
| `POST /api/moments` | `POST /api/entries` (`src/app/api/entries/route.ts`) | |
| `nextDloToWatch` (constellation look-next) | moves from `src/app/(auth)/our-story/capabilities/_constellation/topology.ts:361` to `src/lib/capabilities/next-dlo.ts` *(new)* | The constellation imports it. Its existing topology tests pin the behaviour. |

### 2.4 Unresolved without the base docs

These are listed, not invented. If Drew has the files, uploading them resolves this section.

| Unresolved | What the chain says | Working assumption |
|---|---|---|
| The "seven-field Logger" (notes-arch v1 §4.1, cited by PL D40, WF D68) | Fields include `said` and `felt` | Mapped to the Logger v2 consumption set: who, what, when, felt, noticed, evidence, plus working-from *(pivot)*. `noticed` takes the PL D40 `lens` label. |
| Opportunity notes, "look next", the DLO `next` shape (TP §2.2, PL §7 block 5) | Not specified in the chain | DLO `next` = tier + 1 or a prerequisite edge (§2.2). No opportunity type in this plan. |
| `knowledge.json`, `signals.<hash>.json`, the golden set (PL §11, LC §11) | An index file and golden fixtures | Unit-test fixtures. `npm run verify:pkb:retrieval` remains the only golden-query harness until HC-12. |
| `siteCopy` as a sentence source | Draft PR #284 | Copy stays in code copy files, as the pivot chose (`noticeCopy.ts`, `confirmCopy.ts` *(pivot)*). |
| `hearth-expo-launch-plan-v2.md`, `hearth-marketing-content-plan-v1.md`, `hearth-complexity-map-v1.md`, `decisions.md` | Cited by LP §10 and TP | Absent. `hearth-decisions-log-v1.md` is the repo's decision record. G2 |

---

## 3. Naming rulings

These rulings bind identifiers in code and specs. Parent-facing copy follows each spec's own copy rules.

| Term | Existing meanings | Ruling |
|---|---|---|
| **watch-for** | (1) `pedagogyOverlay.lens.watchFor` in the module runner · (2) activity `observationPrompts` and the `watchBlock` style · (3) methodology `observationCue` and lens-bundle `observationCues` · (4) PKB `markersToLookFor` · (5) thread `whatItLooksLike` · (6) DLO `watchForNext` *(pivot)* · (7) constellation "Next to watch for" (`nextDloToWatch`) · (8) builder draft `watchFor` | "Watch-for" now means only the WF §3 object (look-for + how + context + per-child lines). The other seven are "look-fors" in code comments and specs. Parent copy in the module runner is unchanged. |
| **pattern** | (1) the brief's lesson patterns · (2) `pedagogyPracticePattern` (PKB situation → response) · (3) Interpretive Patterns `IP-*` (`module.methodAffinity`) · (4) `shelfResource.lessonPattern` *(pivot)*, a lesson-number regex | Rename (4) to `lessonNumberRegex` in HC-1a. A lesson pattern is `knowledgeNote` kind `pattern`, with identifier `lessonPattern` in code. (2) and (3) keep their names. |
| **pattern vs method** | Brief §4.1 patterns overlap LC §5 methods | **Recommended ruling for B4 (Q-HC-7).** A *pattern* is a philosophy-neutral session shape: 3–5 moves plus a watch-for slot. A *method* is tradition-owned and adds the outcome scale, turn table, sizes and cadence. A method's `session.steps` may reference a pattern. The four expo patterns map as follows: Read · Tell back → `cm.living-book`, `classical.history-story` · Show · Try · Repeat → `montessori.practical-life`, `classical.mastery-lesson` · Explore · Notice · Name → `cm.nature-walk`, `unschool.strewing` · Story · Draw · Recall → `waldorf.main-lesson-block`. |
| **session** | Cycle sessions (planned or rhythm) vs Hearth co-op `hearth_sessions` | No bare `session` identifiers in new code. Use `cycleSession` / `hearthSession`. No table rename now. |
| **thread** | Capability threads (`thread_id`, `custom_threads`, `learning_entries.thread_links`) vs the brief's community threads | Community tables are named `community_*` (§5 HC-17). UI copy says "discussion". |
| **Not yet** | Constellation "Not yet observed" (unobserved) · WF result "Not yet" (observed, not there yet) · the brief's "not-yet signs" | The WF result label stays, because it is always paired with a look-for. The constellation keeps "Not yet observed". Specs say "not-yet signs"; parent copy asks "What did you see instead?" (WF §6.1 3b). |
| **Library** | `/library` = the family module library | The Craft library route is `/craft`. Its parent-facing name is open under B-items. |
| **Rhythm** | LC C18 "Rhythm" vs the learner profile's "Learning Rhythms" section (`LearnerProfileClient.tsx`, attention windows) | Rename the profile section ("Daily patterns" or similar) in the PR that ships Rhythm (HC-4). |
| **Hearth** | The product · Hearths (co-op groups) · the Hearth Cycle · the "Hearth noticed" card | "The Cycle" after first use in docs. |
| **E1–E4** | Internal educator stages (WF §7.2) | Never in parent copy. Allowed in server-side analytics only. |
| **evidence** | WF `evidence` (does / says / makes / chooses) · `learning_entry_evidence` (photo / quote / note / link) · the TP §2.1 ledger | DLO field `evidenceKind`. Table names unchanged. |

---

## 4. Decisions

### 4.1 Decided 21 Oct 2026

These are logged in full in `hearth-decisions-log-v1.md`, section "Spec chain and Hearth Cycle (21 Oct 2026)".

| ID | Decision | Why |
|---|---|---|
| **D-HC-1** | **Build on schedule.** Phase 2 UI starts after the expo whatever the pilot evidence says. This explicitly overrides `hearth-refactor-postmortem-v1.md` §5, whose entry criteria are ≥ 3 captured profiles and a live evidence channel; today there are 0 profiles (R7). Postmortem §4's execution rules still bind. | Drew's call: the Cycle is the product direction, and the calendar matters more than waiting for pilot volume. §11 lists the compensating controls. |
| **D-HC-2** | **Expo message: the record hooks, the Cycle deepens.** "Snap · Confirm · Report" stays the hero (`expoCopy.ts` *(pivot)*). One Cycle section is added ("Every session makes the next one better"), plus four lesson-pattern cards, a printed stand card and a research card. Copy only, no in-app build. | The demo shows the record (LP P1, D-LP-1). The Cycle is the reason to stay, and it isn't buildable in 14 days. |
| **D-HC-3** | **The notes-architecture nouns map onto existing tables.** `hearth-notes-architecture-v1/-v2.md` and `hearth-notes-handoff-plan-v1.md` exist nowhere. §2 is binding and extends pivot A2. | Don't block on missing docs, and don't build parallel stores of the same record. |
| **D-HC-4** | **Expo build = pivot plan W0–W8 + a thin watch-for slice.** Inside pivot W5.3 ("Dashboard: recent moments, chips to confirm, one watch-for line"), the line becomes each child's composed everyday watch-for (WF §3.1–§3.4). It is computed by `src/lib/watch/{select,compose}.ts` *(new)*, and "Log it" goes to the existing check-in source. Rhythms, Today/Week, the conversational log, Plan something, morning cards and the educator path start straight after the expo. | The pivot plan is already full (freeze 4 Nov). The slice reuses data the pivot creates anyway: confirmed notes and `learner_dlo_status`. |
| **D-HC-5** | **DLO watch-for = a neutral sign + the tradition's `watchHow`.** Drop `watchForNext.variants` before the schema deploys. Re-cut the 50 drafts to neutral only. The 24 `watchHow` lines (WF §3.4, transcribed in `content/traditions/watch-how.yaml`) carry the tradition. | It implements PL D39 and WF D57 early, matches chain precedence, and cuts Drew's confirm load from about 350 texts to about 71. |

### 4.2 The README's known conflicts, resolved

| Topic | Use (README) | Repo action |
|---|---|---|
| Planner | Today and Week (LC D50, C15) | The Planner stays hidden for the expo (`LAUNCH_SCOPE`). It returns as the Week shell (HC-2e), and its content is replaced in HC-4. `planner_entries` becomes the session table (§2.1). |
| Logger fields | Session logs follow WF §6. Spontaneous capture keeps `lens` as the label for the words field | Spontaneous capture = Notice → Confirm *(pivot)*, with the `noticed` field labelled by the tradition's lens prompt (HC-7). Session logs = the conversational script (HC-7). |
| Confirm for declared targets | WF D61: "Saw it" is the confirmation | Saw it calls `confirmProposal()` → an `asserted` row. No separate chip for that DLO. Other cue-surfaced DLOs still show as chips. |
| Post-save blocks | LC D53: "through your lens" removed; one-line `why` per next step | The Turn state on ConfirmSurface shows "Next: … · why" plus declared DLO chips (HC-4). PL §7 block 2 is not built. |
| Direction rules | LC D48: folded into method `turn.pattern` and week shape; signals for spontaneous moments only | No `direction.ts`. Rules live in `src/lib/cycle/turn.ts` and `weekshape.ts` (HC-3, HC-11). |
| Locked principle | C14 wording once Drew confirms | Q-HC-2. CLAUDE.md is edited in its own PR before HC-3 merges. |
| Photo Read | LP P2–P4 stand | Superseded in detail by pivot A1/A3: ≤ 1 call per save, and off in production until ZDR. A1 stands (G57). |

### 4.3 Further conflicts found (Drew's call)

| # | Conflict | Recommendation | Blocks |
|---|---|---|---|
| **Q-HC-1** | PL D45 retires the PKB, the corpus and lens bundles. `main` shipped corpus calibration (#287) and PKB Logger context (#292) on 19 Oct, and CLAUDE.md principle 11 plus C-PL1, C-PM1, C-PA2 and C-PA5 describe the seven-layer system. | Confirm the D45 direction. Formally re-open C-PL1/C-PM1/C-PA2/C-PA5 in the decisions log. Freeze new corpus investment now: pause the wave 2–5 acks. `PEDAGOGY_KB_ENABLED` stays off. HC-12 retires the pieces as a strangler. | HC-12 |
| **Q-HC-2** | LC C14 rewords Architecture Principle 1. | Confirm. Edit CLAUDE.md and the `PROJECT_STATUS.md` core principles in one docs PR before HC-3. | HC-3, HC-4 |
| **Q-HC-3** | CLAUDE.md principle 11 ("does NOT … generate forward task lists, schedule the parent's week") and C-PA1/C-PA4 (the forward-prescription guard) contradict LC turns writing the week. | Amend to: "Pedagogy does not generate content or curriculum. A method may write the next step of a rhythm the family chose, from a fixed action vocabulary, deterministically." The guard keeps applying to authored text. | HC-3 |
| **Q-HC-4** | The Logger v2 forbidden-word list ("try this", "next time", "should", …) collides with WF §6.1 3b respond hints ("next time, move each scoop…"), the LC Turn screen ("Next: …") and `craft.try` cards. | Scope the D-LPS-14 list to the spontaneous Notice and Confirm surfaces. Session logs, Turn and cards get their own rules in Logger spec v3: no "should", no praise of the parent, `why` ≤ 20 words. | HC-4, HC-7 |
| **Q-HC-5** | Provenance: TP §1.2 has two values; the repo has four, plus #288's four states. WF D61 says Saw it = confirm. | No provenance change now. Saw it writes `asserted`. The TP §2.1 ledger stays a post-expo question behind the `confirmProposal()` seam. | — |
| **Q-HC-6** | What "Partly" writes. WF §6.2 says "confirmed at the current band", and under `PRODUCTION_TIER_BAR` an asserted row is corroboration. | Write `asserted` at the current tier only if the child already has observed evidence at that tier. Otherwise write no row, so a partial never grants a tier. | HC-7 |
| **Q-HC-7** | B4 lesson patterns vs LC methods. | Use the §3 ruling: a pattern is a neutral shape, and a method references a pattern. | HC-13 |
| **Q-HC-8** | `hearth-learner-profile-spec.md` says "an identity portrait… not a progress tracker". KYC (brief §6) and everyday watch-fors need a home. | Put KYC in a separate learner tab, "What we've noticed". The portrait stays untouched. | HC-15 |
| **Q-HC-9** | WF §5.4 defaults the morning notification to 7:00, but quiet hours end at 7:00 (`triggers.ts:125`). | Exempt the parent's chosen morning time from quiet hours, and move the default quiet-hours end to 6:30. | HC-9 |
| **Q-HC-10** | Push and email. iOS web push needs a home-screen install (WF §12), native push waits on the store launch, and no email sender exists. | In-app layer first. Add an email vendor only when WF's opt-in fallback is wanted, recorded in `external-services-guide.md`. | HC-9 |
| **Q-HC-11** | The `/expo` banner says "Ready for the HEU" to non-QLD visitors (Mei-Lin canary). | Note only. Pivot copy is Drew's call. | — |
| **Q-HC-12** | Brief §1: "You'll be a better teacher in three months…" | Don't use it as a claim without substantiation (Australian Consumer Law). Use "Every session makes the next one better". | HC-1d |
| **Q-HC-13** | The Planner's fate after the expo. | Un-cut as the Week shell (HC-2e). The Suggested / Library / Custom sheet becomes **Plan something** plus **Add a rhythm** (HC-4, HC-6). | HC-2e, HC-4 |
| **Q-HC-14** | Community naming, parent identity and legal (B6–B8). | `community_*` tables; `family_members.display_name`; UGC terms and a contributor licence before any promotion of answers. | HC-17 |

### 4.4 Assumptions pending confirmation

Per the chain README, every unconfirmed C- and B-item is treated as its stated default until Drew confirms it in `hearth-decisions-log-v1.md`. Nothing here is treated as locked.

| ID | Question (short) | Default | Where it bites |
|---|---|---|---|
| C10 | Remove per-DLO variants; pedagogy reads only the signal axis | Proceed | Already applied early by D-HC-5 |
| C11 | `said` becomes the tradition-worded `lens` field | Proceed | HC-7 (label on `noticed`) |
| C12 | Signals are removable, never confirmed, never in the Report or Constellation | Proceed | HC-12 |
| C13 | PL §5/§8 readings, moves, holds and rule copy as the first draft | Proceed and refine | HC-2c, HC-12 |
| C14 | Reword the locked principle | Proceed | Q-HC-2, HC-3 |
| C15 | Rhythm is the third parent-facing note; Today and Week replace the Planner and Dashboard | Proceed | HC-2e, HC-4 |
| C16 | Remove "through your lens"; one-line `why` per next step | Proceed | HC-4 |
| C17 | Onboarding ends with starter rhythms (skippable; Today nudges) | Proceed | HC-4 |
| C18 | Name "Rhythm" | Rhythm | HC-4 (profile section rename) |
| C19 | One DLO per session, with per-child lines | Proceed | HC-1c, HC-5 |
| C20 | "Saw it" confirms the DLO link | Proceed | HC-7 |
| C21 | Remove `felt` from session logs (kept as a reason chip only) | Proceed | HC-7 |
| C22 | WF §7.4 advancement thresholds as a first draft | Proceed and tune | HC-8 |
| C23 | A visible "Teaching help" setting | Proceed | HC-8 |
| C24 | Starting stage from one onboarding question ("taught professionally" → E3) | Proceed | HC-8 |
| C25 | The parent-move question appears from E3 | E3 | HC-7 |
| B1 | Name "The Hearth Cycle"; stages Prepare · Learn · Notice · Turn | Hearth Cycle | HC-1d copy |
| B2 | The parent is the primary learner Hearth serves | Proposed (no default stated) | Positioning; HC-1d |
| B3 | Re-balance authoring toward patterns, craft and child understanding | Proceed | §10 authoring plan |
| B4 | Lesson patterns as a content type, about 10 at launch | Proceed | Q-HC-7, HC-13 |
| B5 | A private, unscored My Teaching view, opt-in | My Teaching, opt-in | HC-16 |
| B6 | Community as linked threads first | Proceed | HC-17 |
| B7 | Child privacy in community is absolute | Proposed (no default stated) | HC-17 prerequisites |
| B8 | Experienced guides | Hearth team + a few volunteers | HC-17 |
| B9 | Expo: 3–4 patterns on Today cards | Proceed, **amended by D-HC-2/D-HC-4**: `/expo` cards only | HC-1d |

LP P1–P10 are logged on the pivot branch as D-LP-1…10, with amendments A1…A9. They are cross-referenced, not duplicated.

---

## 5. Workstreams

Each slice is one PR unless noted. **Gate** = Drew's call that the slice waits on. Personas and journey stages come from `hearth-pilot-personas-v1.md` and `hearth-parent-journey-v1.md`.

### HC-0 — Spec chain, build plan and expo content drafts *(this PR)*

| | |
|---|---|
| **What** | The seven chain docs into `docs/` verbatim (README + repo note); this plan; decisions-log section; `content/` drafts (11 E1–E2 craft notes, `traditions/watch-how.yaml`, four lesson patterns, `/expo` section copy); `.claude/plans/PLAN-hearth-cycle.md` + `status-hearth-cycle.json`; `PROJECT_STATUS.md` and `CLAUDE.md` pointers |
| **Data** | none |
| **Tests** | none (no code); CI runs unchanged |
| **Gate** | Drew reviews the content drafts (HC-1e) |

### Expo (on the pivot branch, before the Wed 4 Nov freeze)

#### HC-1a — Watch-for schema, fixed before the Studio deploy

| | |
|---|---|
| **Persona** | Mei-Lin, Stage 2 (the line tells her what to look for); Renee, Stage 2 |
| **What** | Drop `watchForNext.variants`. Add optional `watchForNext.notYet[]` `{id, label, respond?}`, optional DLO `evidenceKind`, and `pedagogicalFramework.watchHow` `{does, says, makes, chooses}` + `stageOverrides[]` + `notifyDefault`. Rename `shelfResource.lessonPattern` → `lessonNumberRegex`. Settle `waldorf` vs `waldorf_steiner`. **Add `discreteLearningObjective` and `shelfResource` to the desk in `sanity.config.ts`** (neither is listed on `main` or the pivot, so Drew can't browse them to confirm) |
| **Data** | Sanity schema only; nothing deployed has variants yet |
| **Files** | `src/sanity/schemas/discreteLearningObjective.ts`, `shelfResource.ts` *(pivot)*, `pedagogicalFramework.ts`, `sanity.config.ts`, `src/lib/shelf/match.ts` *(pivot)*, `scripts/seed-shelf.ts` *(pivot)* |
| **Tests** | unit: `src/lib/shelf/match.test.ts` *(pivot)* updated for the renamed field; `tsc` |
| **Depends** | none |
| **Gate** | Drew's schema approval (pivot plan §3, due 21 Oct) |

#### HC-1b — Re-cut the 50 DLO notes to neutral; seed `watchHow`

| | |
|---|---|
| **Persona** | Mei-Lin, Stage 2 |
| **What** | Strip `variants` from `content/dlo-notes/batch-*.json` *(pivot)*. `scripts/push-dlo-note-drafts.ts` *(pivot)* stops writing them. A push of `content/traditions/watch-how.yaml` (HC-0) writes `watchHow` onto the five `pedagogicalFramework` docs as drafts |
| **Data** | Sanity drafts only; never auto-published |
| **Tests** | unit: push-script mapping (yaml → patch payload) |
| **Depends** | HC-1a |
| **Gate** | Drew confirms note batches from Fri 23 Oct and the `watchHow` lines (≈ 71 texts in total) |

#### HC-1c — Everyday watch-for line on the Dashboard (inside pivot W5.3)

| | |
|---|---|
| **Persona** | Mei-Lin, Stage 2 → 3 ("tell me what to do until I trust myself"); Renee, Stage 3 |
| **What** | Pure `src/lib/watch/select.ts` *(new)*: WF §3.3 frontier over `learner_dlo_status`. It keeps DLOs not yet shown, prefers one confirmation → an earlier tier in an active thread → prerequisites shown, breaks ties by the thread least logged in 14 days, and **skips any DLO without a confirmed `watchForNext`**. Pure `src/lib/watch/compose.ts` *(new)* builds the line as look-for = `watchForNext.neutral`, how = `watchHow[evidenceKind ?? 'does']` with `{child}`, plus per-child lines for siblings. Eclectic uses a neutral how-line at the expo (G55). Move `nextDloToWatch` into `src/lib/capabilities/next-dlo.ts` *(new)*, with the constellation importing it. The Dashboard card "Watch for" shows one line per child; "Log it" → `/log?source=check-in&learner=&thread=`, which already makes that DLO's chip appear first on Confirm (`src/lib/logger/source.ts` *(pivot)*). Zero model calls and no snapshot change: computed in `src/app/(auth)/dashboard/page.tsx` from DLO status plus confirmed notes |
| **Data** | none |
| **Files** | reuse `src/lib/capability-alpha-suppression.ts` (H6 never shown), `LEARNER_COLOUR_MAP`, `sanityFetch` (`src/lib/sanity/server-fetch.ts`) |
| **Tests** | unit: `select.test.ts`, `compose.test.ts` (no confirmed note → omitted; shown DLO skipped; sibling lines; H6 dropped); component: the Dashboard card renders only confirmed notes; existing constellation topology tests stay green |
| **Depends** | HC-1a, HC-1b (at least one confirmed batch), pivot W0.3 merged |
| **Gate** | none. **First to cut** if the calendar slips (W5.3 is already in the pivot's cut order) |

#### HC-1d — `/expo` Cycle section, pattern cards, stand card, research card

| | |
|---|---|
| **Persona** | Stage 0 (deciding) visitors; the research card serves the persona profiles (§11 control 5) |
| **What** | Paste `content/expo/hearth-cycle-section.md` into `src/app/(public)/expo/expoCopy.ts` *(pivot)* and render one section after W7.3 lands. Print the stand card. Research-card answers become `hearth-research-log.md` R-entries and `hearth-pilot-personas-v1.md` §7 profiles |
| **Tests** | unit: an `/expo` page render snapshot if W7.3 added one |
| **Depends** | pivot W7.3 |
| **Gate** | Drew's copy approval (B1, B9 as amended, Q-HC-12) |

#### HC-1e — Confirm the expo content drafts (no render)

| | |
|---|---|
| **What** | Drew confirms the 11 craft notes and four lesson patterns in `content/`. They aren't rendered in the app at the expo. Confirmation lets the stand card and HC-2b's push use them |
| **Gate** | Drew (≈ 35 min, §10) |

#### HC-1f — Pivot bookkeeping

| | |
|---|---|
| **What** | Reconcile `.claude/plans/status-launch-pivot.json` *(pivot)* with its git log. Note in the pivot plan that W5.3 carries HC-1c and that W4.1/W2.1 carry HC-1a |
| **Tests** | none |

### Phase 2a — foundations (from Mon 17 Nov, after the 10–14 Nov soak)

#### HC-2a — Per-adult attribution and family timezone

| | |
|---|---|
| **Persona** | Two-parent households: Sandra, Stage 6; Renee, Stage 3. The prerequisite for the educator path (Mei-Lin) |
| **What** | Migration `0032`: `learning_entries.created_by_clerk_user_id text null` (+ index), `planner_entries.created_by_clerk_user_id text null`, `family_settings.timezone text`. Write sites: `POST /api/entries`, batch and CSV import, module-runner LogMode (`src/app/(auth)/module/[id]/_components/LogMode.tsx`), the hearth scaffold path. Timezone defaults from the onboarding state (Queensland → `Australia/Brisbane`, and so on) and is editable in Settings |
| **Data** | additive, nullable; history stays unattributed |
| **Files** | `src/lib/db/schema.ts`, `src/app/api/entries/route.ts`, `src/test/factories.ts`, `src/test/db-factories.ts` |
| **Tests** | integration: attribution written for owner and editor; viewer can't write; cross-family isolation (`asEditor`, `asOtherFamily`) |
| **Depends** | pivot merged |
| **Gate** | none |

#### HC-2b — The `knowledgeNote` type and its plumbing

| | |
|---|---|
| **Persona** | Mei-Lin, Stages 2–3 (craft and method content); Bec, Stage 6 |
| **What** | Schema with `kind` (`method`, `craft`, `practice`, `signal`, later `pattern`/`guide`/`ageGuide`/`list`) and per-kind validation (§2.2). A desk group "Knowledge notes" (+ DLOs if HC-1a didn't land them). GROQ queries in `src/lib/sanity/queries.ts` filtered on `status == "published" && defined(confirmedAt)`. `CLIENT_READ_QUERIES`, `GATED_TYPES` (`scripts/check-sanity-gating.mjs`), Content QA (widen `DocType` in `src/lib/content-qa/types.ts`; add a standalone, non-pack QA entry next to `src/lib/content-qa/rules.ts`). `scripts/push-knowledge-notes.ts` *(new)* (`content/**/*.yaml` → Sanity drafts, modelled on `push-dlo-note-drafts.ts` *(pivot)*) |
| **Data** | Sanity only |
| **Tests** | unit: QA rules for each kind; push-script mapping; read-allowlist test; CI: gating script |
| **Depends** | none |
| **Gate** | Drew approves the schema before the Studio deploy |

#### HC-2c — Tradition-note extension

| | |
|---|---|
| **Persona** | every family's tradition; Bec, Stage 6 (fidelity) |
| **What** | `pedagogicalFramework` gains the PL §4 fields (stance, lens prompt and signal, stages, signal table, rules, balance, nextBias) and LC §6 `weekShape` (plus anything from WF §8.1 not landed in HC-1a). One source for `PRACTICE_KEYS`, imported by its five-plus copies. Transcribe the PL §5 drafts for Drew's confirmation |
| **Files** | `src/sanity/schemas/pedagogicalFramework.ts`, `src/sanity/schemas/methodologyOverlay.ts`, `src/components/pedagogy/data.ts` |
| **Tests** | unit: practice-key single-source test; tradition validation (lens signal ∈ signals, ≥ 6 weighted signals, `read` ≤ 30 words, `hold` ≤ 25 words) |
| **Depends** | HC-2b |
| **Gate** | Drew confirms the six tradition notes (≈ 90 min) |

#### HC-2d — DLO tagging

| | |
|---|---|
| **Persona** | Mei-Lin and Renee, Stage 2 (sharper watch-fors) |
| **What** | `evidenceKind` on all 171 DLOs (one word each). `notYet` chips (≈ 2.5 per DLO) for the 50 noted DLOs first. Fix `parentVersion`'s two meanings: the schema says previous-version id, while `ALL_DLOS_QUERY` uses it as parent wording. Translate the WF/LC worked-example IDs into repo IDs for fixtures |
| **Files** | `scripts/seed-dlos.ts`, `src/lib/sanity/queries.ts`, `docs/hearth-capability-dlo-reference.md` (regenerate) |
| **Tests** | unit: every DLO id has an `evidenceKind`; the query no longer coalesces `parentVersion` |
| **Gate** | Drew confirms the tags and chips |

#### HC-2e — Standalone fixes; the Planner returns as the Week shell

| | |
|---|---|
| **Persona** | Mei-Lin, Stage 5 (first planner entry) |
| **What** | (1) `src/components/planner/BottomSheet.tsx` drops `moduleId` on Suggested/Library picks: send it. (2) `src/app/(auth)/dashboard/page.tsx` drops `subjects` from the planner projection: pass it. (3) Flip the Planner back on after the expo (`LAUNCH_SCOPE`) as the Week shell. (1) and (2) can land any time, each as its own PR |
| **Tests** | unit: BottomSheet `onAdd` payload; integration: a planner entry created from Library carries `moduleId`; the dashboard projection includes subjects |
| **Gate** | Q-HC-13 for (3) |

#### HC-3 — Rhythms engine

| | |
|---|---|
| **Persona** | Mei-Lin, Stage 3 (habit: "tell me what to do"); Bec, Stage 5 (space to dream) |
| **What** | Tables `rhythms` and `rhythm_state`. Extend `planner_entries` (§2.1). `learning_entries.outcome` and `rhythm_id`. Pure `src/lib/cycle/turn.ts` (the ten actions, LC §4), `schedule.ts`, `weekshape.ts` (checks only; UI in HC-11), `starters.ts`. About 15 method notes (LC §5) as `knowledgeNote` kind `method`. API: `/api/rhythms` (CRUD) and a transactional session-log route (outcome per child → turn → next sessions). Decide the list templates (§2.2) |
| **Data** | migration `0033` (or next) |
| **Tests** | unit: golden turn fixtures `(method, state, outcome, history) → next` per method, every action, every `turn.pattern`; validation of method notes. integration: log → next session row; cross-family; viewer 403 |
| **Depends** | HC-2a, HC-2b, HC-2c |
| **Gate** | Q-HC-2, Q-HC-3; Drew confirms the method notes (≈ 60 min) |

#### HC-4 — Today, Log a session, Turn, Rhythm note, Week, starters

| | |
|---|---|
| **Persona** | Mei-Lin, Stages 1–3; Renee, Stage 3 (Capture a moment stays one tap from Today, so retrospective capture never gets slower) |
| **What** | **Today** replaces the `/dashboard` content: session cards with one-tap outcomes, with "Hearth noticed" and the learners moved under it. **Week** replaces the `/planner` content (list first; drag later). **Turn** is a new ConfirmSurface state: "Next: … · why" plus declared DLO chips. **Rhythm note** at `/rhythm/[id]` *(new)*. **Onboarding starters** after `PedagogyWizard` (LC D55, ≤ 5 min, skippable). Spontaneous **attach** to a due session on Confirm; **branch** waits for HC-12's signals. Rename the profile's "Learning Rhythms" section. Old routes stay reachable behind a flag for a month (§11 control 7) |
| **Files** | `src/app/(auth)/dashboard/`, `src/app/(auth)/planner/`, `src/components/logger/confirm/ConfirmSurface.tsx` *(pivot)*, `src/app/(public)/onboarding/page.tsx`, `src/components/nav/navConfig.ts` |
| **Tests** | unit: component tests per card state; integration: the session-log route; e2e: onboarding → starter rhythm → Today card → one-tap log → next session visible on Week |
| **Depends** | HC-3, HC-19 design |
| **Gate** | C15, C16, C17 confirmed or held as defaults |

#### HC-5 — Watch-fors in full

| | |
|---|---|
| **Persona** | Mei-Lin and Renee, Stage 3 |
| **What** | `watch_fors` table. Session, everyday and week scopes (WF §3.2). `src/lib/watch/carry.ts` (WF §3.5 rotation and step-back). Composed at write time (session created, log saved, nightly) and read by screens; never recomputed on open. Watch-fors appear on Today session cards and at session start. HC-1c's Dashboard line switches to read the table |
| **Tests** | unit: the carry table for every result; integration: Saw it on two different days → shown → the next tier's look-for |
| **Depends** | HC-4, HC-2d |
| **Gate** | C19 |

### Phase 2b — the Cycle's surfaces (January–February)

#### HC-6 — Plan something and the cue index

| | |
|---|---|
| **Persona** | Mei-Lin, Stage 5 (first planned session); Bec, Stage 5 |
| **What** | `src/lib/cues/` *(new)*: an index built from DLO descriptors, `watchForNext` and authored cue files `content/cues/*.yaml` *(new)*. `src/lib/watch/plan.ts`: cue score × frontier weight (WF §4.2). When the result is ambiguous, **one constrained Haiku call at plan save** (≤ 800 tokens; output = a DLO id from the candidates plus a context of ≤ 8 words; every content word must appear in the plan text, otherwise the context is dropped). It is logged in `ai_pipeline_logs` with stage `plan` and shows up on the AI cost dashboard. Domain fallback, then the everyday watch-for. Never invent. UI: a "Plan something" sheet on Today and Week (≤ 60 s) |
| **Tests** | unit: golden plan fixtures (WF §4.3 translated to repo IDs), validation rejects, the zero-call path; integration: plan save → session row + watch-for |
| **Depends** | HC-5 |
| **Gate** | none (write-time AI stays within Architecture Principle 4) |

#### HC-7 — The conversational session log

| | |
|---|---|
| **Persona** | Renee, Stages 2–3 (two taps per child); Mei-Lin, Stage 2 (relief: "Didn't come up is a real answer") |
| **What** | **Logger spec v3 comes first** (session logs; it supersedes v2 for sessions only). `src/lib/logger/conversation/script.ts` (WF §6.1 questions by stage) and `absorb.ts` (answers → `lookfor`, links, `educator_events`). Saw it → `confirmProposal()`. Partly per Q-HC-6. Not-yet chips from the DLO. Parent-move chips from E3 (C25). `felt` is removed from session logs only (WF D68). Spontaneous capture keeps Notice → Confirm, plus a "Did any of these show up?" row of everyday watch-for chips (WF §6.4) and the tradition's lens label on `noticed` (PL D40) |
| **Data** | `learning_entries.lookfor` (migration) |
| **Tests** | unit: script per stage; absorb → links and events; integration: Saw it writes one `asserted` row; Partly follows Q-HC-6; e2e: Today card → log → Constellation moment |
| **Depends** | HC-5, HC-2d |
| **Gate** | Q-HC-4, Q-HC-6, C20, C21, C25 |

#### HC-8 — The educator path (hidden)

| | |
|---|---|
| **Persona** | Mei-Lin, E1 → E3 over Stages 2–5; Bec ("Go deeper", never patronised) |
| **What** | `educator_profiles` and `educator_events` (WF §9.1). Events are written as side effects of what already happens: `primed` needs a client view event, `answered`/`specific`/`words` come from absorb, `moved` from parent moves, `followed` from turns, `tried` from card actions. A weekly job in `vercel.json` runs `src/lib/educator/evaluate.ts`. The onboarding question (WF §7.6) follows the pedagogy wizard. **Settings → Teaching help** (Keep it simple · Adjusts as you go · Go deeper). Quiet mode (WF §7.5). One line in the APP privacy notice (`src/app/(public)/privacy`) |
| **Tests** | unit: table-driven `evaluate` (every threshold in WF §7.4; never demotes; minimum time at stage; quiet mode in and out); integration: events written by absorb; per-adult separation |
| **Depends** | HC-2a, HC-7 |
| **Gate** | C22, C23, C24 |

#### HC-9 — Day briefs, morning cards and the notification

| | |
|---|---|
| **Persona** | Mei-Lin, Stage 3 (habit); Renee, Stage 3 (one notification, never "you haven't logged") |
| **What** | `day_briefs` and `card_events`. `src/lib/brief/build.ts` (WF §5.3 selection: ≤ 3 cards, in order). An hourly cron builds briefs at the family's local 03:00 and rebuilds them on writes that affect today. The opening layer shows on the first open of the day. Channels: an in-app `notifications` row, plus web push where the PWA is installed; native push follows the native plan. Fatigue rules (WF §5.4) and the Unschooling Monday default. Wire or delete the unread `dailyReminder` / `weeklyDigest` toggles (`src/components/settings/NotificationPreferences.tsx`); fold or delete `prep_reminder` and `log_invitation` |
| **Tests** | unit: brief selection and cap; fatigue; quiet mode; timezone edges (QLD without DST vs NSW with DST, the DST changeover day); integration: the cron route builds one brief per family per day |
| **Depends** | HC-2a (timezone), HC-5, HC-8 |
| **Gate** | Q-HC-9, Q-HC-10 |

#### HC-10 — Craft cards and the Craft library

| | |
|---|---|
| **Persona** | Mei-Lin, Stages 2–5; Bec, Stage 6 (ungated, deep) |
| **What** | The WF §7.7 triggers as a fixed coded list in `src/lib/brief/triggers.ts` *(new)*, with 28-day cooldowns and Less of these / Remind me. A **`/craft`** route *(new)* with the brief §5 sections (How to watch · How to teach · How to build a lesson · Your tradition · Know your child), reading craft and practice `knowledgeNote`s and tradition notes. Ungated, with an Explore tray entry. Service-worker precache of the content routes only (`public/sw.js`): the native plan's airplane-mode rule applies, and child data is never cached |
| **Tests** | unit: each trigger query; integration: library rendering gated on `confirmedAt`; e2e: `/craft` offline |
| **Depends** | HC-2b, HC-9 |
| **Gate** | Drew confirms the E3–E4 craft notes |

#### HC-11 — Week shape and Turn the week

| | |
|---|---|
| **Persona** | Mei-Lin, Stage 5; Bec, Stage 5 |
| **What** | LC §6 checks (CM, Classical and Eclectic first, then Montessori, Waldorf and Unschooling) with one-tap fixes. A Sunday/Monday "Turn the week" prompt, ≤ 5 min (LC §7) |
| **Tests** | unit: every check against fixtures; e2e: Turn the week lays out the next week |
| **Depends** | HC-4, HC-2c |

#### HC-12 — Pedagogy-layer migration (PL D36–D45), strangler

| | |
|---|---|
| **Persona** | every tradition; Bec, Stage 6 (fidelity) |
| **What** | 17 signals as `knowledgeNote` kind `signal`, with cue lists. `moment_signals`. Scoring alongside cues at save. Tradition signal tables (from HC-2c). The spontaneous post-save per LC D53 (What this showed · Next with `why` · Hold back · chips) and the attach/branch offers (LC §8). Then retire lens bundles, methodology overlays, PKB retrieval and the corpus vault, **one PR per retirement**, each removing the read path before the data. `PedagogyAttribution` (`src/components/logger/PedagogyAttribution.tsx`) goes only when no CC-BY source can render |
| **Tests** | unit: signal detection per cue; Eclectic cross-table; integration: `moment_signals` written; each retirement PR proves the read path is gone |
| **Depends** | HC-7 |
| **Gate** | **Q-HC-1** (the formal re-open), C10–C13 |

### Brief-only phase (needs B1–B9 confirmed and its own spec, per the chain README)

#### HC-13 — Lesson patterns and the Lesson Builder

| | |
|---|---|
| **Persona** | Mei-Lin, Stage 5; Bec, Stage 6 (E4: build from scratch) |
| **What** | Patterns as `knowledgeNote` kind `pattern` (the drafts are in `content/lesson-patterns/`). The builder extends Plan something. Step 2 suggests a pattern deterministically: plan cues × the pattern's evidence kinds × the family tradition's natural fit. Step 3 fills the moves from templates: `{activity}` is the plan's own words, and **any slot that would need extraction becomes a parent prompt, with a default from the DLO watch-for**. No generated text (G38). Depth by educator stage: E1 accept · E2 pick one of two · E3 why and mistakes · E4 from scratch. "How this session is built" appears on Today cards. It replaces the hardcoded `SESSION_TEMPLATES` (`src/lib/module-builder/session-templates.ts`) |
| **Tests** | unit: suggest and fill fixtures; e2e: plan → pattern → Today card |
| **Depends** | HC-6, HC-8 |
| **Gate** | B4, Q-HC-7; its own spec |

#### HC-14 — Modules as worked examples

| | |
|---|---|
| **Persona** | Mei-Lin, Stage 5 (modules); Bec, Stage 6 (builder) |
| **What** | Approach `patternRef` + `howThisIsBuilt` (`src/sanity/schemas/approach.ts`), rendered in `PrepMode.tsx`. A re-tag script for the Starter Pack and the three sample packs (Claude drafts the map, Drew confirms). The Module Builder publishes `watchFor`, `pivot` and pattern choice (this closes the gap in `src/lib/module-builder/publish-payload.ts` and the `src/app/api/modules/publish/route.ts` zod). The kindling repo needs `patternRef` support (G37) |
| **Tests** | unit: publish-payload mapping; integration: published module carries `watchFor` |
| **Depends** | HC-13 |
| **Gate** | B3, B4 |

#### HC-15 — Know Your Child

| | |
|---|---|
| **Persona** | Renee, Stage 4 (what it counts for); Mei-Lin, Stage 3 |
| **What** | Age guides (`knowledgeNote` kind `ageGuide`, bands 2–3 … 8–10) on a new learner tab (Q-HC-8). Deterministic lines in `src/lib/know-your-child/lines.ts` *(new)*, computed at snapshot rebuild into `ChildSnapshot.know_your_child` (the same pattern as `src/lib/ai/insights-feed.ts`). Each line links to its evidence and to a suggested move. Honest-density thresholds |
| **Data readiness** | recently shown: **now** (`learner_dlo_status`, `first_evidence_date`) · weekday × outcome: after HC-3 · recurring not-yet: after HC-7 · how learning shows: after HC-7 + HC-2d · returns to: `chooses` after HC-7, `initiated` after HC-12 · time of day: decide (planner `session` morning/afternoon as a proxy, or drop the line) |
| **Tests** | unit: every line at, below and above threshold; integration: snapshot carries the block |
| **Depends** | HC-7 |
| **Gate** | Q-HC-8; its own spec |

#### HC-16 — My Teaching

| | |
|---|---|
| **Persona** | Bec, Stage 6 (something to look back on); Mei-Lin, Stage 5 |
| **What** | An opt-in `/settings/my-teaching` *(new)*, derived from `educator_events`, `card_events` (tried), sessions with patterns and watch-fors shown, plus one monthly line from a template. No scores, stages, streaks or comparisons. No new capture |
| **Tests** | unit: monthly line template; integration: per-adult view isolation |
| **Depends** | HC-8, HC-9 |
| **Gate** | B5 |

#### HC-17 — Linked community (Phase 3)

| | |
|---|---|
| **Persona** | Sandra, Stage 6 (adoption multiplier, mentor); Mei-Lin, Stage 2 (legitimacy via peers); Bec, Stage 6 (possible guide) |
| **Prerequisites** (each its own PR) | (1) account deletion fixed (pivot W6); (2) Hearth-session photos made private, with `consentEvidenceSharing` enforced (`src/app/api/hearths/[id]/sessions/[sessionId]/evidence/route.ts`, G42); (3) `src/lib/community/redact.ts` *(new)* that strips the poster's family's learner names plus common patterns; (4) `family_members.display_name`; (5) UGC terms, privacy policy and a contributor licence for promoted answers; (6) Apple 1.2 (filter, report, block, contact), eSafety Basic Online Safety Expectations, and the OAIC Children's Online Privacy Code |
| **What** | Tables `community_topics` (`topic_kind` not_yet_sign \| pattern \| craft \| method \| tradition \| age_band, `topic_ref`), `community_posts`, `community_topic_links`, `community_guide_roles`, `community_reports`, `community_blocks`, with a decided cascade-or-anonymise policy for authored posts. An `/admin/community` queue using `logAdminAction` (`src/lib/admin/audit.ts`) and the reason-required pattern in `src/app/api/admin/invitations/[id]/revoke/route.ts`. A `COMMUNITY_ENABLED` kill switch and rate limits (`src/lib/rate-limit.ts`). Then the UI: linked topics on craft notes, patterns, not-yet signs, traditions and age guides; "Ask other parents" from a Portfolio entry (watch-for + not-yet sign only; no names, photos or log text); guide roles; answer promotion with credit; social-proof counts only above a threshold (cold start at 10–20 families) |
| **Tests** | unit: redaction; integration: report/block/hide flows, cross-family isolation, deletion policy in the orphan-tables test; e2e: post from a topic |
| **Gate** | B6, B7, B8, Q-HC-14; legal review |

#### HC-18 — Curated resources

| | |
|---|---|
| **What** | A `resourceLink` object (url, title, kind, oneLineWhy) on guides, patterns and tradition notes. Regulator links come from `src/config/jurisdictions.ts` (`registrationUrl`, `reportingGuideUrl`) for the family's state. A link-rot check script. No affiliate or transactional framing |
| **Tests** | unit: jurisdiction link selection |

#### HC-19 — Design pass (cross-cutting)

| | |
|---|---|
| **What** | No prototype exists for Today, Week, Rhythm, Turn, morning cards, the conversational log, Plan something, the Craft library, KYC, My Teaching or the community. Each UI slice starts from a design reference (Figma, or an HTML prototype in `prototypes/`) built on the v2 tokens and the motion system. Today supersedes the pending Dashboard Dark v3 work |
| **Gate** | Drew signs off each reference before its UI PR |

---

## 6. Gap register

Owner: **D** = Drew, **C** = Claude (in a build session), **X** = external.

| # | Gap | Impact | Resolution | Owner | Blocks |
|---|---|---|---|---|---|
| G1 | `hearth-notes-architecture-v1/-v2.md` and `hearth-notes-handoff-plan-v1.md` absent everywhere | The chain's base is undocumented in the repo | D-HC-3 mapping (§2); upload if they exist | D | §2.4 items |
| G2 | `hearth-expo-launch-plan-v2.md`, `hearth-marketing-content-plan-v1.md`, `hearth-complexity-map-v1.md` and `decisions.md` absent | References in LP and TP dangle | Upload, or mark them external | D | — |
| G3 | Pivot branch unmerged; `status-launch-pivot.json` stale | Everything stacks on it | Land the pivot's W0.3 PR; HC-1f | C | HC-1, all |
| G4 | Chain decisions unconfirmed (C10–C25, B1–B9; P1–P10 logged on the pivot only) | Building on defaults | §4.4 working assumptions; Drew confirms in the log | D | per row |
| G5 | DLO identity: chain IDs like `N1-03` with bands vs repo thread × tier | Worked examples can't be used as fixtures | Band = tier (§2.2); translate examples in HC-2d | C | HC-5, HC-6 fixtures |
| G6 | No cue index | Deterministic plan resolution is impossible | `src/lib/cues/` (HC-6) | C | HC-6 |
| G7 | No `knowledgeNote` type | Methods, craft, practices and signals have no home | HC-2b | C | HC-3 onward |
| G8 | **DLOs and `shelfResource` missing from the Studio desk** (`sanity.config.ts`) | Drew can't browse the notes he must confirm from 23 Oct | HC-1a, before the first batch | C | HC-1b |
| G9 | DLO `parentVersion` has two meanings | Wrong descriptor shown where they diverge | HC-2d | C | — |
| G10 | `PRACTICE_KEYS` copied in 5+ places | Drift | Single source in HC-2c | C | — |
| G11 | Pedagogy key drift: the schema, pivot notes and `watch-how.yaml` use `waldorf_steiner`, but `PedagogyKey` (`src/types/capability-universe.ts`) uses `waldorf` and `charlotte-mason` | Keys mismatch across layers | Align `PedagogyKey` on the schema slugs in HC-2c | C | HC-2c |
| G12 | Content QA `DocType` closed; QA reads only pack trees | New types go unvalidated | HC-2b | C | — |
| G13 | Corpus vault compiler is framework-scoped (`src/lib/pedagogy/corpus/`) | Cross-tradition notes can't be authored there | Use `content/*.yaml` + push scripts (HC-0 pattern) | C | — |
| G14 | No adult attribution on entries | No educator path, My Teaching or per-parent briefs | HC-2a | C | HC-8, HC-9, HC-16 |
| G15 | No family timezone | Day briefs at local 03:00 and the notification time are impossible | HC-2a | C | HC-9 |
| G16 | No time of day on entries | KYC "when sessions go best" | Decide in HC-15 | D | HC-15 |
| G17 | No child-initiated signal | KYC "returns to"; the Unschooling reading | `chooses` (HC-7), `initiated` signal (HC-12) | C | HC-15 |
| G18 | Evidence and chips are per entry, not per child | Doing vs explaining can't be attributed | Per-child `lookfor` (HC-7) | C | HC-15 |
| G19 | No not-yet capture | No carry, rotation or craft triggers | HC-7 + HC-2d | C | HC-5, HC-10 |
| G20 | Nothing records that a watch-for was shown or followed | No Prime strand or My Teaching | `educator_events` (HC-8) | C | HC-8, HC-16 |
| G21 | No starting-stage or experience question | The educator path can't start | HC-8 | C | HC-8 |
| G22 | Crons cover retention and invitation expiry only | No day briefs or weekly evaluation | HC-8, HC-9 | C | HC-8, HC-9 |
| G23 | No push sender and no email sender | No morning notification outside the app | In-app first; Q-HC-10 | D | HC-9 |
| G24 | Quiet hours end at 7:00; the WF default is 7:00 | The first notification gets suppressed | Q-HC-9 | D | HC-9 |
| G25 | The `dailyReminder` / `weeklyDigest` toggles are read by nothing | Settings mislead parents | Wire in HC-9, or remove sooner | C | — |
| G26 | `prep_reminder` and `log_invitation` triggers are never called | Dead code | Fold into the day brief or delete (HC-9) | C | — |
| G27 | No Today; Dashboard planner cards inert; `subjects` dropped | The Cycle has no home | HC-2e fixes; HC-4 replaces | C | HC-4 |
| G28 | `BottomSheet.tsx` drops `moduleId` | Planned modules can't open the runner | HC-2e (standalone) | C | — |
| G29 | `nextDloToWatch` is client-only | Can't compose watch-fors on the server | HC-1c | C | HC-1c |
| G30 | `snapshot.planner_suggestions` and five snapshot subview APIs have no consumer | Dead or idle code | Reuse in Today or delete (HC-4) | C | — |
| G31 | Logger v2 forbidden words vs Cycle copy | Copy rules collide | Q-HC-4; Logger spec v3 | D | HC-4, HC-7 |
| G32 | CLAUDE.md principle 11 and C-PA1/C-PA4 vs turns | Architecture contradiction | Q-HC-3 | D | HC-3 |
| G33 | CLAUDE.md principle 1 vs C14 | Locked principle out of date | Q-HC-2 | D | HC-3 |
| G34 | PL D45 vs PKB and corpus shipped 19 Oct | Two pedagogy engines; wasted authoring | Q-HC-1; pause wave 2–5 acks | D | HC-12 |
| G35 | Learner-profile spec ("identity portrait") vs KYC | No agreed home | Q-HC-8 | D | HC-15 |
| G36 | Module Builder publish drops `watchFor` and `pivot` | Parent work lost on publish | HC-14, or a standalone fix | C | — |
| G37 | The kindling repo (external) doesn't know `patternRef`, methods or `knowledgeNote` | Official packs can't be re-tagged | Drew updates kindling | D/X | HC-14 |
| G38 | Lesson Builder fill implies text extraction (brief §4.2 example) | Conflicts with zero runtime AI | Parent prompts with defaults (HC-13) | C | HC-13 |
| G39 | The brief's expo items ("Today cards", a library page) are build tasks | Scope creep before the freeze | D-HC-2, D-HC-4: content only | — | — |
| G40 | No design prototypes for any new screen | UI built without a reference | HC-19 | D | every UI slice |
| G41 | `prototypes/hearth-community-flow-v2.html` doesn't exist | The brief's re-review can't happen | New design (HC-17, HC-19) | D | HC-17 |
| G42 | **Hearth-session photos are stored public; `consentEvidenceSharing` is never enforced** | Children's photos exposed today | Standalone fix now; HC-17 prerequisite | C | HC-17 |
| G43 | No name redaction; `src/lib/ai/hearth-narrative.ts` sends full learner names to Haiku | Privacy | Narrative fix standalone; redaction in HC-17 | C | HC-17 |
| G44 | No parent display identity | Community can't name authors | `family_members.display_name` (HC-17) | C | HC-17 |
| G45 | Account deletion broken (`hearth-account-deletion-defect-v1.md`); every new table adds an FK | Store rejection; privacy | Pivot W6; cascade + orphan test on every migration (§2) | C | HC-17 |
| G46 | "thread", "session" and "pattern" name collisions | Confusion and bugs | §3 rulings | C | — |
| G47 | UGC legal and regulatory: Apple 1.2, eSafety BOSE, OAIC Children's Online Privacy Code | Store and legal exposure | HC-17 prerequisites; legal review | D/X | HC-17 |
| G48 | The brief's metrics ("watch-for answer rate", "specific evidence rate") are undefined | Success can't be judged | §8 definitions | C | — |
| G49 | "Lesson Builder use falls over time" is ambiguous | Churn would look like success | Pair it with a sessions-held measure (§8) | C | — |
| G50 | "Better teacher in three months" membership promise | Australian Consumer Law substantiation | Q-HC-12 | D | HC-1d |
| G51 | Authoring and confirm load on one person | Drew becomes the bottleneck | §10 budget; batches; unconfirmed content is omitted, never generated | D | content slices |
| G52 | No flags framework | Ad-hoc env vars | Keep the env-var pattern (`NEXT_PUBLIC_LAUNCH_SCOPE`, `PEDAGOGY_KB_ENABLED`); add a small helper in HC-2b if a third Cycle flag appears | C | — |
| G53 | Native-plan airplane-mode rule for new surfaces | Store Guideline 4.2 | Today logs via the outbox; `/craft` precached (HC-10) | C | HC-4, HC-10 |
| G54 | iOS web push needs a home-screen install | Notification reach | In-app layer; native push later | X | HC-9 |
| G55 | The Eclectic how-line needs signal weights (PL §5.6) not yet authored | Eclectic families get a weaker line at the expo | Neutral how-line for the expo (HC-1c); full in HC-12 | C | — |
| G56 | The educator path infers things about adults | Privacy | APP notice line (HC-8, WF §7.6) | C | HC-8 |
| G57 | LP P3 (≤ 2 calls) vs pivot A1 (≤ 1 call) | Budget ambiguity | A1 stands (§4.2) | — | — |
| G58 | Postmortem §5 overridden | Risk of a June-style failure | §11 controls | D | — |

---

## 7. Calendar and dependency graph

| When | Work |
|---|---|
| Tue 21 Oct | HC-0 (this PR). HC-1a gate: Drew approves the schema (pivot plan §3) |
| Wed 22 – Thu 23 Oct | HC-1a, HC-1b on the pivot branch. Drew confirms the first note batch on Fri 23 Oct |
| Mon 27 Oct – Mon 3 Nov | HC-1c inside W5.3; HC-1d after W7.3; HC-1e confirmations; HC-1f |
| Wed 4 Nov · Fri 6 Nov · Mon 9 Nov | Freeze · go/no-go · **Expo** |
| 10 – 14 Nov | Soak. Stand research cards → research log and persona profiles. Drew confirms C- and B-items; Q-HC-1 to Q-HC-3 answered |
| 17 Nov – 12 Dec | Phase 2a: HC-2a → HC-2b → HC-2c / HC-2d (content in parallel) → HC-2e → HC-3 |
| 15 Dec – 23 Jan | HC-4 → HC-5 (with a Christmas break) |
| **Tue 27 Jan** | **Evidence checkpoint** (§11 control 6) |
| 27 Jan – 27 Feb | Phase 2b: HC-6, HC-7, HC-8, HC-9, HC-10, HC-11 |
| Mar – May | HC-12 (strangler); the brief-only phase HC-13 to HC-16 once specced; HC-17, HC-18 |

```
HC-1a ─▶ HC-1b ─▶ HC-1c (in W5.3)        HC-1d (after W7.3)   HC-1e, HC-1f
   │
pivot merged ─▶ HC-2a ─────────────┬──────────────▶ HC-8 ─▶ HC-9 ─▶ HC-10
               HC-2b ─▶ HC-2c ─┐   │                  ▲        ▲
               HC-2d ──────────┤   │                  │        │
               HC-2e ──────────┤   │                  │        │
                               ▼   ▼                  │        │
                              HC-3 ─▶ HC-4 ─▶ HC-5 ─▶ HC-6     │
                                       │       │               │
                                       │       └─▶ HC-7 ───────┴─▶ HC-12
                                       └─▶ HC-11
Brief-only:  HC-6 + HC-8 ─▶ HC-13 ─▶ HC-14      HC-7 ─▶ HC-15      HC-8 + HC-9 ─▶ HC-16
Phase 3:     pivot W6 + G42 + G43 + G44 + legal ─▶ HC-17 ─▶ HC-18
HC-19 design precedes every UI slice (HC-4, HC-6, HC-7, HC-9, HC-10, HC-13, HC-15, HC-16, HC-17).
```

---

## 8. Measurement

**Rule:** a surface's event lands in the same PR as the surface, or before it (§11 control 1). Server-side events identify on the Clerk user id, the same as the client (`src/lib/analytics/posthog-server.ts`).

### 8.1 Definitions

All rates use the WF §7.3 events, measured over 28 days.

| Signal (brief §11) | Definition |
|---|---|
| Parents prepare (primed rate) | session logs with a same-day `primed` event ÷ session logs |
| Parents prepare (planned ahead) | plans saved ≥ 6 h before their date ÷ plans |
| Parents notice (answered rate) | watch-fors resolved Saw it / Partly / Not yet ÷ watch-fors resolved (incl. Didn't come up) |
| Parents notice (specific rate) | answered with (words ≥ 5 · not-yet chip · photo) ÷ answered |
| Parents grow | educator stage changes per parent (server-only) · `tried` per parent · Lesson Builder internalisation: builder-planned sessions ÷ planned sessions **falling**, while planned + logged sessions per week stay within ± 20% (G49) |
| Children move | DLO tiers newly shown per active child per month (`learner_dlo_status`) |
| It's worth paying for | 3- and 6-month retention; post-expo conversion (pivot) |
| It doesn't feel like a test | quarterly single tap "Is Hearth helping you teach?", stored in `feedback` (`src/app/api/feedback/route.ts`) with category `teaching_pulse`; no follow-up question |

### 8.2 New `HearthEvent` members (`src/lib/analytics/posthog.ts`)

| Event | Props | Lands in |
|---|---|---|
| `watch_for_viewed` | scope, surface, tier | HC-1c |
| `watch_for_answered` | result, tier, scope, has_words, has_not_yet | HC-7 |
| `plan_created` | resolution (`cue` \| `model` \| `domain` \| `everyday`), compose_ms, learner_count | HC-6 |
| `session_logged` | method, outcome, compose_ms | HC-4 |
| `turn_viewed` | actions, has_dlo_chips | HC-4 |
| `rhythm_created` | method, source_kind, from (`onboarding` \| `branch` \| `manual`) | HC-4 |
| `day_brief_shown` | card_count, kinds | HC-9 |
| `card_action` | kind, action | HC-9, HC-10 |
| `craft_library_viewed` | section | HC-10 |
| `teaching_help_changed` | preference | HC-8 |
| `teaching_pulse_answered` | answer | HC-8 |

The educator stage itself is never a client event. An admin **"Cycle health"** panel in `/admin/analytics` reads the rates above (HC-9).

---

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Expo pressure pulls Cycle work into the freeze | The expo slips | D-HC-4 thin slice only; HC-1c is first to cut |
| Two pedagogy engines live at once (PKB + signal tables) | Incoherent advice; wasted authoring | Q-HC-1 freezes PKB investment; HC-12 strangler |
| Today replacing the Dashboard is a screen-purpose pivot without user evidence (postmortem §4.5) | Families lose their home screen | HC-19 design; events first; the 27 Jan checkpoint; the old route stays behind a flag for a month |
| Drew's confirm backlog | Watch-fors missing | Small batches; unconfirmed content is omitted, never generated (D-LP-8) |
| Watch-fors feel like homework or a test | Stage 2 relief lost | WF §2 principles; Not now; quiet mode; no streaks; "Didn't come up" is a good answer |
| Experienced parents feel patronised (Bec) | Builders leave | Starting-stage question; Go deeper; ungated `/craft` |
| Notification fatigue or creepiness | Uninstalls | One a day at most; WF §5.4 fatigue rules; Monday-only fallback; quiet mode |
| Per-adult inference raises privacy concerns | Trust | APP notice line; never displayed; per-adult data deleted with the account |
| Six-plus new tables on a broken deletion route | Store rejection; orphaned data | Pivot W6 before HC-2a; cascade + orphan test in every migration |
| Planner → Week migration breaks existing plans | Data loss | Existing rows become `source = 'parent'` sessions; no rows dropped |
| Rhythms don't fit Renee (retrospective, unschooling-leaning) | Tracker persona stranded | Capture a moment stays first-class; Unschooling methods are noticing-only; starters are skippable (C17) |
| Non-QLD families meet HEU copy (Mei-Lin) | Legitimacy anxiety | Jurisdiction labels from `src/config/jurisdictions.ts` in all new copy |
| Community moderation load on a solo developer | Burnout; safety | Phase 3 only; linked topics before open forums; kill switch; guides (B8) |
| Base docs never surface | Hidden assumptions resurface later | §2.4 lists them; D-HC-3 is binding until they arrive |

---

## 10. Authoring load

Drew's confirm time is estimated at about 5 minutes per batch of 10 short items (pivot A5), and more for long notes.

| Item | Count | Size | Drafted by | Drew confirm (est.) | When |
|---|---|---|---|---|---|
| DLO `watchForNext.neutral` (F–Y3) | 50 | ~35 words | Claude (done, pivot) | 25 min | 23 Oct – 3 Nov |
| `watchHow` lines + Waldorf stage override | 20 + 1 | one line | Drew (WF §3.4), transcribed in HC-0 | 10 min | before the expo |
| Craft notes E1–E2 | 11 | ≤ 40 words | Claude (HC-0) | 15 min | before the expo |
| Lesson patterns | 4 | ~150 words | Claude (HC-0) | 20 min | before the expo |
| DLO `evidenceKind` | 171 | one word | Claude | 30 min | HC-2d |
| DLO not-yet chips | ~125 | a few words | Claude | 45 min | HC-2d |
| Tradition notes | 6 | ~600 words | Drew (PL §5), transcribed | 90 min | HC-2c |
| Practice notes | ~42 | ~60 words + `how` / `ask` | Claude | 60 min | HC-2c |
| Method notes | ~15 | YAML (LC §5 drafted) | Drew, transcribed | 60 min | HC-3 |
| Signals | 17 | cue lists | Claude | 20 min | HC-12 |
| Craft notes E3–E4 | 13 | ≤ 90 words | Claude | 30 min | HC-10 |
| Brief content: 6 more patterns, ~12 guides, age guides (≈ 6 bands), not-yet library, module re-tag map | — | — | Claude | ~3 h | brief-only phase |

**Phase 2 total:** about 8–10 hours of Drew's time, spread over November to February. The estimates are rough.

---

## 11. Compensating controls (D-HC-1)

D-HC-1 overrides postmortem §5. These controls are the price.

1. **Events before meaning.** Each UI slice ships its success event before the surface or with it (§8).
2. **One deliverable per PR.** All four CI jobs green, with tests at the right layer in the same PR (postmortem §4.1).
3. **Foundations soak.** A schema PR merges and runs in production for at least three days before a UI PR depends on it.
4. **No flag as verification.** Every surface has an e2e or integration path that has been exercised before merge.
5. **Profiles from the stand.** The expo research card yields at least three captured profiles (`hearth-pilot-personas-v1.md` §7) and research-log entries.
6. **27 Jan checkpoint.** Drew and Claude review the research log, analytics and profiles. Phase 2b may be re-sequenced or cut. The outcome is logged as a decision either way.
7. **Reversible screen pivots.** When Today replaces the Dashboard and Week replaces the Planner, the old route stays reachable behind a flag for one month after launch.

---

*v1 — 21 October 2026. Companion to the spec chain (`hearth-spec-chain-README.md`). Update in the same PR as any slice it describes, or add a "trails reality" caveat.*
