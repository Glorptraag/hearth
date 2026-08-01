# Hearth Reporting Pipeline — v1

> De-black-boxes the compliance reporting pipeline end to end: surfaces, DB tables, the
> deterministic-coverage gate order, the two runtime AI touchpoints and their edit-protection
> safeguards, per-tier PDF structure, and a recovery runbook for moving a family off the LLM
> fallback. Read this before touching anything under `src/lib/report/`, `src/app/api/report*`,
> or `src/lib/ai/annotation-draft.ts`.

Companion reading: `docs/hearth-outcomes-spine-plan-v1.md` (the outcome-evidence chain this
pipeline consumes), `docs/hearth-canonical-design-tokens-v2.md` (report/portfolio UI), and
`docs/hearth-constellation-architecture-v1.md` (the DLO/constellation surface upstream of
`learner_dlo_status`).

---

## 1. Surfaces

### Pages

| Route | Purpose |
|---|---|
| `src/app/(auth)/our-story/report/page.tsx` | The on-screen compliance report — jurisdiction-aware (CD-level vs learning-area), work-sample slot picker, annotation editing, coverage narrative. |
| `src/app/(auth)/our-story/portfolio/page.tsx` | Filtered view over the same entry data for a shareable/printable portfolio (not an independent data store — see Architecture Principle 5 in the root `CLAUDE.md`). |
| `src/app/demo/our-story/report/`, `src/app/demo/our-story/portfolio/` | Demo-mode mirrors of the above for unauthenticated/dev-preview walkthroughs. |

### API routes — `/api/report*`

| Route | Method(s) | Role |
|---|---|---|
| `/api/report` | `GET`, `POST` | Fetch or create a family's `complianceReports` row (+ 6 empty `workSamples` slots) for a learner/year. |
| `/api/report/[reportId]` | `PATCH` | Update report metadata — `choiceArea` (`science`\|`hass` for slots 5–6), `status` (`draft`\|`complete`\|`exported`; setting `exported` stamps `lastExportedAt`). |
| `/api/report/[reportId]/samples` | `GET`, `PATCH` | List all 6 slots with their annotations; assign/clear an entry on a slot (rejects cross-slot duplicate entry assignment with 409). |
| `/api/report/[reportId]/samples/[sampleId]` | `PATCH` | Upsert a `workSampleAnnotations` row (the 4 narrative fields + progression summary + `confirmed` flag); derives the sample's `status` from field completeness. |
| `/api/report/[reportId]/samples/[sampleId]/draft` | `POST` | **AI touchpoint 1** — generate a Haiku annotation draft for the slot's selected entry. |
| `/api/report/[reportId]/progression` | `POST` | **AI touchpoint 2** — generate a 1–2 sentence early→late progression summary for one subject pair. |
| `/api/report/coverage` | `GET` | Deterministic (or fallback) curriculum coverage for one learner — thin wrapper over `getDeterministicCoverage`. |
| `/api/report/export` | `GET` | Renders the full compliance PDF (jsPDF + jspdf-autotable) for a learner, tier-branched. |
| `/api/portfolio/export` | — | Portfolio's own PDF export (separate from the compliance report export; reads the same entry/evidence data as a filtered view). |

---

## 2. Database tables

| Table | File:line | Role |
|---|---|---|
| `complianceReports` (`compliance_reports`) | `src/lib/db/schema.ts:523` | One row per `(familyId, learnerId, reportYear)`. Carries `status` (`draft`\|`complete`\|`exported`), `lastExportedAt`, `choiceArea` (which subject fills slots 5–6: `science`\|`hass`). |
| `workSamples` (`work_samples`) | `src/lib/db/schema.ts:545` | 6 slots per report (`early_writing`, `later_writing`, `early_maths`, `later_maths`, `early_choice`, `later_choice`), unique on `(reportId, slot)`. `entryId` is **persisted-only** — a slot is filled solely by parent selection, never auto-matched by date/subject (see §5 and `src/lib/report/export-slots.ts`). `status`: `empty`\|`selected`\|`annotated`\|`complete`. |
| `workSampleAnnotations` (`work_sample_annotations`) | `src/lib/db/schema.ts:564` | One row per work sample (unique FK). Four narrative fields (`observations`, `needsStrengths`, `adjustment`, `planning`), each with its own `*Source` column (`ai_draft`\|`parent_edited`\|`parent_written`); plus `progressionSummary` + `progressionSummaryEdited` (boolean lock) and `confirmedAt`. |
| `learnerDloStatus` (`learner_dlo_status`) | `src/lib/db/schema.ts:849` | Rolled-up per-learner status (`emerging`\|`developing`\|`demonstrating`, or absent) per DLO id. This is the table `getDeterministicCoverage` reads — the input side of the coverage rollup. Populated by the AI enrichment/snapshot pipeline (`src/lib/ai/dlo-persistence.ts`, `src/lib/ai/snapshot-rebuild.ts`), not by report code. |
| `observationDloLinks` (`observation_dlo_links`) | `src/lib/db/schema.ts:871` | Per-observation evidence rows that roll up into `learnerDloStatus` (`provenance`: `inferred`\|`asserted`; `evidenceState`: `opportunity`\|`observed` — only `observed` rows count toward the rollup). Upstream of coverage, not read directly by report code. |

**Data-boundary note:** all five tables are Postgres/transactional (Architecture Principle 9).
DLO *definitions* and their `regulatoryMappings[]` (frameworkKey/codes/contribution/evidenceWeight)
live in Sanity as `discreteLearningObjective` documents, fetched via `DLO_MAPPINGS_QUERY`
(`src/lib/sanity/queries.ts:206`) — the coverage join is Postgres status × Sanity mapping content.

---

## 3. Coverage resolution — the deterministic gate, in order

Entry point: `getDeterministicCoverage({ learnerId, state })` in `src/lib/report/coverage.ts`.
Every gate below is load-bearing and must be read in order — this is the exact sequence, not a
paraphrase:

1. **Explicit non-blank state gate** (`coverage.ts:68`):
   ```ts
   if (!state || !state.trim()) return { mode: 'fallback' };
   ```
   A blank/missing `state` returns `{ mode: 'fallback' }` **before any framework key is
   derived**. This exists because of the #204 coverage-risk audit finding: 13/18 `ac-v9-qld`
   families reached the QLD framework only via `frameworkKeyForState`'s blank-state default,
   not an explicit QLD choice. A NSW/VIC family that never set `state` must never be silently
   scored against QLD's mappings. Note: the report *screen* still displays a QLD default via
   `getJurisdiction(null)` — that default is cosmetic UI only and is a separate code path from
   this coverage gate.

2. **Derive the framework key** — `frameworkKeyForState(state)` → `ac-v9-{state.toLowerCase()}`
   (e.g. `ac-v9-qld`, `ac-v9-nsw`). Only reached once step 1 has passed.

3. **`frameworkHasMappings` gate** — fetch `learnerDloStatus` rows for the learner and
   `DLO_MAPPINGS_QUERY` from Sanity (via `sanityServerClient` — an **authed** read; see the
   in-code warning at `coverage.ts:77-81` about dotted-id docs being invisible to the tokenless
   client in prod). If no DLO document has a `regulatoryMappings[]` entry whose `frameworkKey`
   matches, return `{ mode: 'fallback' }`. This keeps a framework's legacy LLM-derived path
   alive with zero visible change until mapping content is authored for it.

4. **Else — compute deterministic coverage.** `rollupCoverage()` + `deriveCoverageSignals()`
   (`src/lib/report/deterministic-coverage.ts`) produce `{ mode: 'deterministic', coverage,
   signals }`.

### The rollup itself (`rollupCoverage`)

- **Only `developing` (weight 0.5) and `demonstrating` (weight 1.0) DLO tiers contribute.**
  `emerging` and any other/absent status contribute **zero** (`TIER_WEIGHT` map,
  `deterministic-coverage.ts:125-128`).
- Alpha-suppressed threads (`isSuppressedThread`) never contribute, regardless of tier.
- For each counting DLO, each of its mappings targeting the resolved `frameworkKey` contributes
  `tierWeight × clamp01(evidenceWeight)` once per distinct subject its `codes[]` resolve to
  (via `descriptorToSubject`, backed by `AC9_SUBJECT_MAP`). The contribution also lands in a
  `byContribution` bucket (`primary`\|`partial`\|`incidental`) that sums to `weightedScore`.
- DLO ids are summed in sorted order specifically to keep floating-point summation
  deterministic — same history in, byte-identical output out, every time.
- Output is the full `SUBJECT_KEYS` set, zero-filled for untouched subjects, so shape is stable.

### Honest-framing signals (`deriveCoverageSignals` + `coverage-narrative.ts`)

Two failure classes the #204 audit identified, both distinguished with **no additional LLM
call** — purely a function of the same `learner_dlo_status` × mapping inputs:

- **Class A — mapping gap:** `countingDloCount > 0` but `mappedSubjectCount === 0`. The child
  has evidence at the developing/demonstrating bar, but on threads this framework hasn't
  mapped yet. Narrative state `mapping_gap`.
- **Class B — status-bar gap:** `countingDloCount === 0`. Nothing has reached the developing
  bar yet, even though the log may show real activity. Narrative state `emerging`.

`buildCoverageNarrative()` (`src/lib/report/coverage-narrative.ts`) turns these plus real
per-family activity counts (entries logged, subjects touched, evidence items, confirmed work
samples, threads observed) into one of five `CoverageState` values (`pre_log`, `mapped`,
`mapping_gap`, `emerging`, `observed`) and gentle copy (`derivePosture`, `POSTURE_LABEL`,
`subjectActivityLabel`) — deliberately never "At Risk"/"Critical"/a bare percentage. This is
shared verbatim between the report screen and the export PDF so the two never drift.

### Confirming: no read-time LLM in coverage

`getDeterministicCoverage`, `rollupCoverage`, `deriveCoverageSignals`, and
`buildCoverageNarrative` are all pure functions over Postgres rows + Sanity mapping docs — **no
Anthropic client is imported or called anywhere in this path.** The only LLM involvement
upstream of `learner_dlo_status` is at **write time**, during entry-save enrichment
(`src/lib/ai/dlo-persistence.ts`, `src/lib/ai/snapshot-rebuild.ts` — Phase 6 of the
two-layer-AI architecture, Architecture Principle 4). Coverage resolution itself never calls
out to Anthropic — this is the load-bearing "same report tomorrow says the same thing"
guarantee (Stage-4 promise).

---

## 4. The two runtime AI touchpoints

Both live in `src/lib/ai/annotation-draft.ts`, both use `claude-haiku-4-5-20251001`, and both
are the **only** place this pipeline makes a live Anthropic call — everything upstream
(coverage, narrative, PDF assembly) is pure/deterministic.

### 4.1 Annotation draft — `generateAnnotationDraft()`

- Invoked by `POST /api/report/[reportId]/samples/[sampleId]/draft`.
- Drafts the four work-sample-annotation fields (`observations`, `needsStrengths`,
  `adjustment`, `planning`) in the parent's voice, grounded in the entry's title/description
  and (optionally) up to 4 same-subject follow-up entries for grounding `adjustment`/`planning`.
- Saved with every field's `*Source` column set to `'ai_draft'`.

**Edit-protection safeguard:** before drafting, the route checks whether any existing
annotation field's source is `'parent_edited'` or `'parent_written'`
(`draft/route.ts:77-89`). If any field has been touched by the parent, the whole draft call is
refused with **409 "Refusing to overwrite parent-edited annotation"** — a fresh draft can only
land on an annotation the parent hasn't started writing themselves. There is no partial
overwrite; it's all-or-nothing per sample.

### 4.2 Progression summary — `generateProgressionSummary()`

- Invoked by `POST /api/report/[reportId]/progression` for one of the three subject pairs
  (`english`, `maths`, `choice` → early/late slot pairs).
- Requires **both** the early and late sample's annotation to already have `confirmedAt` set
  (400 otherwise) — the summary only ever compares confirmed, parent-vetted work samples.
- Writes the 1–2 sentence result to the **late** sample's `workSampleAnnotations.progressionSummary`.

**Edit-protection safeguard:** `progressionSummaryEdited` is a boolean lock, not a source enum.
If the late sample's annotation has `progressionSummaryEdited === true`, generation is refused
with **409 "Refusing to overwrite parent-edited progression summary"**
(`progression/route.ts:75-77`). A fresh AI-generated summary always resets the flag to `false`
so it stays editable until the parent actually edits it.

Both safeguards follow the same shape: **AI may write freely until a parent touches the field,
then the API becomes append-only from the parent's side and refuses to clobber their edit.**

---

## 5. PDF structure per tier

`GET /api/report/export` (`src/app/api/report/export/route.ts`) branches on
`getJurisdiction(state).reportTier` (`src/config/jurisdictions.ts`), which is exactly two
values:

- **`cd_level`** — QLD, SA, NT (Australian Curriculum V9 states with a CD-level/"curriculum
  descriptor" reporting expectation).
- **`learning_area`** — NSW, VIC, WA, TAS, ACT.

Shared header (both tiers): title = `config.reportScreenTitle`, generated date, Learner
Details block (name, age, `config.registrationLabel` value, family name, registration date,
`config.reviewDateLabel` + days until/overdue).

### `cd_level` branch (`route.ts:171-434`)

1. **Compliance Status** — posture label (shared `derivePosture`/`POSTURE_LABEL`), total
   entries, subject areas covered (`n of 8`).
2. **Curriculum Coverage table** — one row per subject: entries, `subjectActivityLabel`
   activity word, and a `curriculumCell` (a real count if `descriptors > 0`, else `'Building'`
   if the subject has any entries, else `'—'` — **never a bare `0`**). Preceded by an italic
   honest-framing note explaining a lighter count reflects "mapping in progress, not absence
   of learning."
3. **Required Work Samples table** — the 6-slot structure, **persisted-only** resolution via
   `resolveExportSlotData()` (`src/lib/report/export-slots.ts`) — a slot shows an entry only if
   the parent selected one for that `reportId`; the export never auto-matches by date/subject.
   Status column is `Empty`\|`Selected`\|`Confirmed`.
4. **Work Sample Annotations** (own page) — one block per sample with a confirmed annotation:
   entry title/date, then the 4 narrative fields (only non-empty ones render).
5. **Progression Summaries** — one paragraph per subject pair (English writing / Mathematics /
   Science-HASS) where the late slot's annotation carries a `progressionSummary`.
6. **Areas to round out** — subjects with `count <= 1`, gentle language ("a few activities here
   would round out the picture" / "one or two more would strengthen it") — never
   "Critical"/severity framing.

### `learning_area` branch (`route.ts:436-547`)

1. **Learning Summary** — total entries, learning areas covered (`n of 8`).
2. **Learning Areas table** — same 4 columns as the `cd_level` coverage table, headed
   "Learning Area"/"Curriculum Links" instead of "Subject"/"Curriculum outcomes"; same
   honest-framing note (referencing "the Learning Entry Log below" instead of work samples —
   this tier has no 6-slot work-sample requirement).
3. **Portfolio sections per learning area** — for every subject with `count > 0`, its own
   sub-table of up to 20 entries (date, title, evidence count), most recent first. This
   replaces the `cd_level` tier's work-sample-slot structure entirely; there is no work-sample
   section in this branch.
4. **Areas to Explore** — subjects with `count <= 1`, softer wording than the `cd_level` tier's
   equivalent section.

### Shared footer (both tiers)

Entry Log summary table (shared, `route.ts:549-576`) — up to 50 entries, most recent first,
date/title/subjects/evidence-count — appended after the tier-specific sections on every
export regardless of tier. Every page gets a footer: `Hearth LMS — {reportScreenTitle} —
{learner.name} — Page i of n`.

---

## 6. Coverage fallback recovery — runbook

**Symptom:** a family's `/api/report/coverage` (and the export PDF's curriculum-coverage
column) is stuck showing `{ mode: 'fallback' }` / `'Building'`/`'—'` cells instead of real
mapped-code counts, even though the learner has plenty of `developing`/`demonstrating` DLO
statuses.

Walk the three gates in `getDeterministicCoverage` (§3) in order to diagnose which one is
blocking activation, then resolve it:

1. **Gate 1 — explicit jurisdiction.** Check `familySettings.state` for the family. If it's
   null/blank/whitespace, this is the family's own onboarding gap: they must set an explicit
   state (via the onboarding/jurisdiction picker — not a QLD default, an actual choice) before
   anything downstream can activate. Confirm by re-running
   `getDeterministicCoverage({ learnerId, state: settings.state })` with the real value once set.

2. **Gate 2 — framework mappings authored.** Once `state` is explicit, `frameworkKeyForState`
   resolves e.g. `ac-v9-vic`. Query `DLO_MAPPINGS_QUERY` (or check via Sanity Studio) for any
   published `discreteLearningObjective` doc whose `regulatoryMappings[].frameworkKey` equals
   that value. If none exist yet, this is a **content-authoring gap**, not a code bug — mapping
   content must be authored per framework (see `docs/hearth-outcomes-spine-plan-v1.md` for the
   framework-transposer content model). Adding a second framework is authoring mapping data,
   not changing code (per the file-header comment in `deterministic-coverage.ts`).

3. **Gate 3 (implicit) — the learner needs `learner_dlo_status` rows at `developing`/
   `demonstrating` for DLOs that carry a mapping to that framework.** Even with gates 1–2
   satisfied, a learner with zero counting-tier DLOs still rolls up to all-zero (this is
   correct behaviour, surfaced honestly via `CoverageState.emerging`, not a bug). If the family
   has logged real activity but statuses look stale, the fix is a **snapshot rebuild** —
   `learner_dlo_status` is populated by the write-time enrichment pipeline
   (`src/lib/ai/dlo-persistence.ts`, driven by `src/lib/ai/snapshot-rebuild.ts`), not by any
   report-path code. Trigger a rebuild for the learner/family (per the rebuild trigger already
   wired for `library_change` and other snapshot triggers — see
   `docs/hearth-refactor-postmortem-v1.md` and the `project_snapshot_incremental_library_change`
   memory note) rather than editing `learner_dlo_status` by hand.

**Net activation sequence:** *family sets explicit jurisdiction* → *framework has authored
DLO mappings in Sanity* → *snapshot rebuild populates/refreshes `learner_dlo_status` for the
learner* → next `/api/report/coverage` call (and next PDF export) returns `{ mode:
'deterministic' }` with real counts, with zero code changes required for the family to see the
transition — same guarantee that made the blank-state gate (§3, item 1) safe to ship in the
first place: nothing changes for anyone until all three conditions are actually true.
