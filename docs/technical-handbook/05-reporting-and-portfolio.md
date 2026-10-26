<!-- Version: 1 | Date: 2026-10-26 | Changes: Initial creation. -->

# 05 — Reporting and portfolio

> Part of the [Hearth Technical Handbook](./README.md). Charted against `main` at `e6ca4b5`.

## In one paragraph

Homeschool families in Australia must periodically show their state regulator that learning is happening. Hearth turns the moments a family has already logged into that evidence, in two forms. The **compliance report** (Our Story → Report) is a structured, state-aware document: it summarises curriculum coverage, holds selected work samples with the parent's notes, and exports as a PDF. The **portfolio** (Our Story → Portfolio) is a browsable, printable view of the family's entries and evidence. Neither creates new data. Both are **views over the entries already logged**. Coverage numbers are computed by fixed rules, not AI, so the same report gives the same answer every time it's opened.

## How it works

### The two report shapes

Each state is configured in `src/config/jurisdictions.ts`. Each state's configuration chooses one of two report shapes:

| Shape | States | What's in it |
|---|---|---|
| **`cd_level`** (curriculum-descriptor level) | QLD, SA, NT | Compliance status → curriculum coverage table → **6 required work samples** → annotations → progression summaries → "areas to round out" → entry log |
| **`learning_area`** | NSW, VIC, WA, TAS, ACT | Learning summary → learning-areas table → portfolio section per learning area (up to 20 entries each) → "areas to explore" → entry log |

Labels such as the registration and review-date wording come from the state's configuration, so the report reads correctly for each regulator.

### The six work samples (`cd_level` states)

A report has one row per child per year (`compliance_reports`) and six slots (`work_samples`): **early writing, later writing, early maths, later maths, early choice, later choice**. The choice area is Science or HASS, picked by the parent.

- **The parent picks the entry for each slot.** Hearth never fills a slot automatically by date or subject. One entry can't be used in two slots.
- Each slot has an annotation (`work_sample_annotations`) with four short notes: **observations, needs and strengths, adjustment, planning**.
- A slot moves through `empty → selected → annotated → complete`.

### Where AI helps, and how parents' words are protected

The report has exactly two AI features. Both are started by the parent and both use Claude Haiku:

| Feature | What it does | Protection |
|---|---|---|
| **Draft annotation** | Writes a first draft of a slot's four notes from the chosen entry (and up to 4 related entries) | If the parent has edited or written **any** of the four notes, Hearth refuses to draft over them ("Refusing to overwrite parent-edited annotation") |
| **Progression summary** | Writes 1–2 sentences comparing the early and later samples for a subject | Only runs when both samples are confirmed by the parent. Once the parent edits the summary, Hearth refuses to regenerate it |

Every note records where it came from: **AI draft**, **parent edited** or **parent written**. The rule is simple. **The AI can write until the parent touches it. After that, it never overwrites the parent's words.**

### Coverage: how "how much of the curriculum" is worked out

Coverage answers "which curriculum areas does this child's evidence touch, and how strongly?" It is calculated by `getDeterministicCoverage()` in `src/lib/report/coverage.ts`, with **no AI involved**. It runs three checks in order:

1. **Has the family chosen their state?** If not, the report falls back to the older method (below). A family that never chose a state is **never** silently scored against Queensland's rules. (The report screen may still *display* Queensland wording as a default. That's cosmetic only.)
2. **Does that state have mappings written in Sanity?** Each learning objective needs curriculum mappings written for that state. If none exist for the state yet, the report falls back.
3. **Compute.** Only objectives at **developing** (half weight) or **demonstrating** (full weight) count. *Emerging* doesn't count toward coverage. The result is the same every time for the same evidence.

**The fallback** counts the curriculum descriptors the AI attached to each entry when it was saved. It still makes no live AI call. It's the older, less rigorous method: the counts depend on what the AI recalled at save time, not on the authored mappings. In either mode, a subject with entries but no counted codes shows **"Building"** and an untouched subject shows **"—"**, never a bare 0.

**Honest wording, never alarm.** The report never says "At Risk" or "Critical" and never shows a bare 0%. It chooses one of five gentle states (`pre_log`, `mapped`, `mapping_gap`, `emerging`, `observed`) and phrases gaps as "a few activities here would round out the picture". The report screen and the PDF use the **same wording code**, so they can't disagree.

### The PDF

`GET /api/report/export` builds the PDF on the server (with jsPDF), following the state's report shape. Every page has a footer with the child's name and page number. Exporting marks the report `exported` and records the time.

### The portfolio

`/our-story/portfolio` is a **filtered view** of entries and their evidence (photos with captions, quotes, notes, links), grouped and searchable, with its own PDF export (`/api/portfolio/export`). By design there's no "add to portfolio" button. Every entry is already in it, so it can never drift from the log (Architecture Principle 5). Entries whose enrichment failed can be **retried** from here.

## Where it lives

| Thing | Location |
|---|---|
| Report screen | `src/app/(auth)/our-story/report/page.tsx` |
| Portfolio screen | `src/app/(auth)/our-story/portfolio/page.tsx` |
| Report API | `src/app/api/report/…` (create, samples, draft, progression, coverage, export) |
| Coverage rules | `src/lib/report/coverage.ts`, `deterministic-coverage.ts`, `coverage-narrative.ts` |
| AI helpers | `src/lib/ai/annotation-draft.ts` |
| State configuration | `src/config/jurisdictions.ts` |
| Tables | `compliance_reports`, `work_samples`, `work_sample_annotations` (plus `learner_dlo_status` as input) |

## What can go wrong

| Parent asks… | What's happening | What to do |
|---|---|---|
| "My coverage just says *Building*" | Nothing in that subject has counted yet. Either it's still at the emerging level, or the report is in fallback mode (no state chosen, or no mappings written for that state) | Check the family's state in Settings. If it's set and the child has developing-level evidence, mapping content is probably missing for that state. That's a content task, not a bug. Recovery steps: [`hearth-reporting-pipeline-v1.md`](../hearth-reporting-pipeline-v1.md) §6 |
| "We've done lots of maths but coverage is low" | Coverage only counts objectives at *developing* or above. Lots of emerging-level activity reads as "emerging" | Explain the developing bar (see [04](./04-capabilities-and-evidence.md)). Confirming objectives in the Constellation helps |
| "The AI draft button refuses to work" | The parent has already edited that slot's notes | Expected: their words are protected. They can clear the notes and draft again, or keep writing |
| "Progression summary won't generate" | One of the pair's samples isn't confirmed, or the parent has edited the summary | Confirm both samples. An edited summary is locked on purpose |
| "My work sample slot is empty in the PDF" | No entry was chosen for that slot | Slots are never filled automatically. Pick an entry |
| "Is this report enough for the HEU?" | A judgement call, not a technical one | Hearth presents the evidence; it doesn't certify compliance. Don't promise outcomes. See [`docs/hearth-alpha-expectations-message-v1.md`](../hearth-alpha-expectations-message-v1.md) |

## Status and known gaps

- **Working:** both report shapes, the 6-slot flow, AI drafts with edit protection, rule-based coverage with honest wording, PDF export, and the portfolio with its own export.
- **Content-gated:** precise coverage needs each state's curriculum mappings written in Sanity. Whichever states lack them use the fallback method. Check Sanity for which states have `regulatoryMappings` authored before telling a family coverage is "precise".
- **Not built:** sending a report straight to a regulator. Parents download the PDF and submit it themselves.

> **Going deeper:** [`docs/hearth-reporting-pipeline-v1.md`](../hearth-reporting-pipeline-v1.md) (the authoritative engineering spec) · [`docs/hearth-heu-work-sample-curation-spec-v1.md`](../hearth-heu-work-sample-curation-spec-v1.md) · [`docs/hearth-portfolio-spec-v1.md`](../hearth-portfolio-spec-v1.md) · [`docs/hearth-report-interaction-spec.md`](../hearth-report-interaction-spec.md)
