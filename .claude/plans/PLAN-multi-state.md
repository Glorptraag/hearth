# Plan: Multi-State Jurisdiction Support

> Pharao output — generated 2026-04-06. Review before executing.

## Overview

Adapt Hearth from QLD-only to all 8 Australian states/territories. The Constellation/AI/pedagogy layer is national and untouched. This plan modifies the **presentation layer** — a static jurisdiction config drives all reporting labels, settings UI, notification copy, and report screen rendering. Two report tiers: `cd_level` (QLD, SA, NT) keeps current granular CD tracking; `learning_area` (NSW, VIC, WA, TAS, ACT) shows aggregated learning area cards.

---

## Phases

### Phase 1: Foundation (Config + Schema)

#### Task 1.1: Create jurisdiction config `[SONNET]`
- **Description**: Create `src/config/jurisdictions.ts` with `ReportTier` type, `JurisdictionConfig` interface, `JURISDICTIONS` record for all 8 states (QLD, NSW, VIC, SA, WA, TAS, NT, ACT), and `getJurisdiction(stateId: string | null)` helper defaulting to QLD. All config values are fully specified in the architecture spec at `/Users/drewdouglas/Downloads/hearth-multi-state-architecture-v1.md` — transcribe the complete config objects verbatim from that file.
- **Files**: `src/config/jurisdictions.ts` (create)
- **Done when**: File exists, exports `JURISDICTIONS`, `getJurisdiction`, `JurisdictionConfig`, and `ReportTier`. `getJurisdiction('NSW')` returns learning_area tier. `getJurisdiction(null)` returns QLD config. `npx tsc --noEmit` passes.
- **Parallel group**: A

#### Task 1.2: Schema migration + ripple renames `[SONNET]`
- **Description**: Rename Drizzle schema columns on `familySettings` table: `heuRegistrationNumber` → `registrationNumber` (column `registration_number`), `heuNextReportDate` → `nextReportDate` (column `next_report_date`). Remove `.default('QLD')` from `state`. Create SQL migration file. Then mechanically rename every reference to the old property names across the codebase. This is a find-and-replace task — the property names change but behavior is identical.
- **Files**: `src/lib/db/schema.ts`, `src/lib/db/migrations/0008_multi_state_rename.sql` (create), `src/app/api/settings/route.ts`, `src/app/(auth)/settings/SettingsClient.tsx`, `src/components/settings/HEUFields.tsx`, `src/app/api/report/export/route.ts`, `src/app/api/account/export/route.ts`, `src/app/(auth)/settings/page.tsx`, `src/app/demo/mock-data.ts`
- **Done when**: No references to `heuRegistrationNumber` or `heuNextReportDate` remain outside migration files and out-of-scope tables (`heuReports`, `heuCandidate`). `npx tsc --noEmit` passes.
- **Parallel group**: A

---

### Phase 2: Settings UI + Report Screen

#### Task 2.1: Update Family Settings — state selection + reporting section `[SONNET]`
- **Description**: Overhaul the settings compliance tab to be config-driven. (1) Rename `src/components/settings/HEUFields.tsx` → `src/components/settings/ReportingFields.tsx`. Import `getJurisdiction`. Add placeholder option "Select your state or territory" for null/empty state. Labels become config-driven: registration label → `config.registrationLabel`, hint → `config.registrationHint`, date label → `config.reviewDateLabel`. When state is null, show "Select your state in Family Profile to see reporting options for your area." (2) In `SettingsClient.tsx`: rename tab id from `'heu'` to `'reporting'`, tab label to `'Reporting'`, section overline from "Queensland HEU" to `${config.abbreviation} ${config.regulatoryBodyShort}`, heading from "Compliance & Reporting" to "Reporting". Update component import. The `saveSettings` body field names were already renamed in 1.2.
- **Files**: `src/components/settings/HEUFields.tsx` (delete), `src/components/settings/ReportingFields.tsx` (create), `src/app/(auth)/settings/SettingsClient.tsx`
- **Done when**: Settings tab shows "Reporting" label. Selecting different states changes registration label and hint dynamically. Null state shows prompt message. `npx tsc --noEmit` passes.
- **Gate**: Blocked on 1.1 (needs `getJurisdiction` from config) and 1.2 (needs renamed property names in SettingsClient)
- **Parallel group**: B

#### Task 2.2: Update report screen — conditional tier rendering `[OPUS]`
- **Description**: This is the largest change. The report page at `src/app/(auth)/our-story/report/page.tsx` must conditionally render based on `config.reportTier`. Fetch family settings (already done in the component) and derive jurisdiction config. Change h1 to `config.reportScreenTitle`. For `cd_level`: keep current behavior (work sample slots, gap analysis, CD coverage). Change "Export PDF for HEU" to "Export PDF". For `learning_area`: build a new view with 8 learning area cards (reuse existing `SUBJECT_DOMAIN_CLASSES` for colors and `subjectCounts` for data), each showing area name + emoji + entry count + strand summary. Replace "Gap Analysis" with "Areas to Explore" (softer language). Work samples section shows all flagged samples without the 6-slot QLD structure. Export button says "Export Learning Report". The timeline hero, ChildSelector, and EmptyState are shared across both tiers. Also update the empty state body text to remove "HEU compliance evidence" reference.
- **Files**: `src/app/(auth)/our-story/report/page.tsx`
- **Done when**: QLD/SA/NT families see current CD-level report. NSW/VIC/WA/TAS/ACT families see learning area cards. Title adapts per state. No "HEU" text visible for non-QLD states. `npx tsc --noEmit` passes.
- **Gate**: Blocked on 1.1 (needs `getJurisdiction`) and 1.2 (needs renamed property names for settings data)
- **Parallel group**: B

#### Task 2.3: Update report PDF export — conditional tier rendering `[SONNET]`
- **Description**: Update `src/app/api/report/export/route.ts` to be config-driven. Import `getJurisdiction`. Replace "HEU Compliance Report" title (line 218) with `config.reportScreenTitle`. Replace registration label (line 235) with `config.registrationLabel`. Replace footer text (line 419). For `learning_area` tier, generate a portfolio-style PDF grouped by learning area instead of the 6-slot work sample structure. Rename filename from `hearth-heu-report-` to `hearth-report-`.
- **Files**: `src/app/api/report/export/route.ts`
- **Done when**: PDF export for QLD shows "HEU Compliance Report". PDF for NSW shows "Learning Report". Registration label adapts. Footer uses config values. `npx tsc --noEmit` passes.
- **Gate**: Blocked on 1.1 (needs `getJurisdiction`) and 1.2 (needs `registrationNumber` property name)
- **Parallel group**: B

---

### Phase 3: Navigation, Notifications, and Peripheral UI

#### Task 3.1: Update Our Story Hub + notifications + notification preferences `[SONNET]`
- **Description**: Three small changes. (1) `src/components/our-story/OurStoryHubClient.tsx` lines 322-327: NavCard title changes from "HEU Report" to `config.reportScreenTitle`. Stat changes: `cd_level` → "Compliance view", `learning_area` → "Learning summary". Need to thread jurisdiction config — derive from settings data already available in the component. (2) `src/lib/notifications/triggers.ts` line 273: Replace `"Your HEU check-in"` with `"Your ${config.regulatoryBodyShort} ${config.reviewTerminology}"`. The function needs `state` from family settings — fetch it inline or add as parameter. (3) `src/components/settings/NotificationPreferences.tsx` line 28: Change description from "Reminders before your HEU reporting date." to "Reminders before your reporting date."
- **Files**: `src/components/our-story/OurStoryHubClient.tsx`, `src/lib/notifications/triggers.ts`, `src/components/settings/NotificationPreferences.tsx`
- **Done when**: Our Story Hub shows config-driven report card title. Notification nudge uses state-specific terminology. Notification preferences label is generic. `npx tsc --noEmit` passes.
- **Gate**: Blocked on 1.1 (needs `getJurisdiction`)
- **Parallel group**: C

#### Task 3.2: Update public pages, welcome wizard, demo pages `[SONNET]`
- **Description**: Replace all QLD-specific marketing/onboarding copy. (1) `src/app/(public)/page.tsx` line 71: "Queensland HEU compliant" → "All Australian states supported". Line 93: "Queensland HEU documentation" → "Home education documentation that builds itself". (2) `src/app/(public)/welcome/welcome-wizard.tsx` lines 29-30: "Queensland HEU compliance, handled" → "Reporting, handled" and remove "HEU" from body. (3) Demo pages: `src/app/demo/page.tsx` line 41 and `src/app/demo/our-story/page.tsx` line 61: "HEU Report" → "Learning Report".
- **Files**: `src/app/(public)/page.tsx`, `src/app/(public)/welcome/welcome-wizard.tsx`, `src/app/demo/page.tsx`, `src/app/demo/our-story/page.tsx`
- **Done when**: No "Queensland HEU" text on landing page, welcome wizard, or demo pages. `npx tsc --noEmit` passes.
- **Parallel group**: C

#### Task 3.3: Update AI narrative term labels `[SONNET]`
- **Description**: In `src/lib/ai/hearth-narrative.ts`, the `getCurrentTermLabel()` function (lines 179-186) hardcodes QLD term boundaries (month <= 4, <= 6, <= 9). Update to accept an optional `yearLevelCutoffMonth` parameter from jurisdiction config. Import `getJurisdiction`. Default to QLD boundaries for backward compatibility. This is a low-risk change since term labels are cosmetic in narrative text.
- **Files**: `src/lib/ai/hearth-narrative.ts`
- **Done when**: Function accepts state-aware cutoff parameter. Default behavior unchanged (QLD). `npx tsc --noEmit` passes.
- **Gate**: Blocked on 1.1 (needs `getJurisdiction`)
- **Parallel group**: C

### Phase 4: Verification

#### Task 4.1: Final hardcoded string sweep + type check `[SONNET]`
- **Description**: Grep the entire codebase for remaining hardcoded instances of: `HEU` (case-sensitive), `heuRegistration`, `heuNextReport`, `Home Education Unit`, `Queensland` (in reporting/compliance context), `month <= 6` (in half-year logic), `"audit"` (in compliance context). Replace any remaining instances with config-driven values. Explicitly ignore out-of-scope items: `heuReports` table, `heuCandidate` column, `workSamples` table. Run `npx tsc --noEmit` to confirm full type safety. Report all findings.
- **Files**: Various (sweep)
- **Done when**: No unexpected HEU/Queensland hardcoded strings remain. TypeScript compiles cleanly. A summary of all changes is produced.
- **Gate**: Blocked on all Phase 2 and Phase 3 tasks (2.1, 2.2, 2.3, 3.1, 3.2, 3.3)
- **Parallel group**: D

---

## Dependency Graph

```
1.1 (config) ─────┬──► 2.1 (settings UI) ──────────┐
                   ├──► 2.2 (report screen) ────────┤
                   ├──► 2.3 (report PDF) ───────────┤
                   ├──► 3.1 (hub + notifications) ──┼──► 4.1 (sweep)
                   ├──► 3.3 (AI narrative) ──────────┤
                   │                                 │
1.2 (schema) ─────┼──► 2.1                          │
                   ├──► 2.2                          │
                   ├──► 2.3                          │
                   │                                 │
           3.2 (public pages) ───────────────────────┘
```

## Parallel Execution Guide

| Terminal | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|----------|---------|---------|---------|---------|
| T1       | 1.1     | 2.2     | 3.1     | 4.1     |
| T2       | 1.2     | 2.1     | 3.2     | —       |
| T3       | —       | 2.3     | 3.3     | —       |

**Max parallelism: 3 terminals.** Phase 1 uses 2 terminals. Phase 2 uses 3 (all gated on Phase 1). Phase 3 uses 3 (3.1 and 3.3 gated on 1.1 only; 3.2 has no gates). Phase 4 is single-terminal sweep after everything lands.

**Note:** 3.2 (public pages) has no gates — it can run during Phase 1 or Phase 2 if a terminal is free. It's placed in Phase 3 for simplicity but is safe to start anytime.

---

## Status

| Task | Status | Completed By |
|------|--------|-------------|
| 1.1  | ⬜     |             |
| 1.2  | ⬜     |             |
| 2.1  | ✅     | T2 (Sonnet) |
| 2.2  | ✅     | T1 (Opus)   |
| 2.3  | ✅     | T3 (Sonnet) |
| 3.1  | ⬜     |             |
| 3.2  | ⬜     |             |
| 3.3  | ⬜     |             |
| 4.1  | ⬜     |             |

---

## Session Prompts

### Terminal 1 — Start with Task 1.1, then 2.2, 3.1, 4.1

```
Read `.claude/plans/PLAN-multi-state.md` and `.claude/plans/status.json`.

Execute task 1.1: Create `src/config/jurisdictions.ts`. The full config data for all 8 states
is in `/Users/drewdouglas/Downloads/hearth-multi-state-architecture-v1.md` — read that file
and transcribe the JURISDICTIONS record verbatim. Export ReportTier type, JurisdictionConfig
interface, JURISDICTIONS record, and getJurisdiction(stateId: string | null) helper that
defaults to QLD.

When done: run `npx tsc --noEmit`, then update status.json — set 1.1 to "done" with timestamp
and "T1". Check if gated tasks are unblocked and proceed to your next task (2.2).
```

### Terminal 2 — Start with Task 1.2, then 2.1, 3.2

```
Read `.claude/plans/PLAN-multi-state.md` and `.claude/plans/status.json`.

Execute task 1.2: Schema migration + ripple renames.

1. Edit `src/lib/db/schema.ts` lines 65-67: rename heuRegistrationNumber → registrationNumber
   (column registration_number), heuNextReportDate → nextReportDate (column next_report_date),
   remove .default('QLD') from state.

2. Create `src/lib/db/migrations/0008_multi_state_rename.sql` with ALTER TABLE statements.

3. Find-and-replace all references to the old property names across the codebase. Key files:
   - src/app/api/settings/route.ts (zod schema keys lines 38-39)
   - src/app/(auth)/settings/SettingsClient.tsx (SettingsData interface lines 301-302,
     saveSettings body lines 361-362, HEU tab props lines 639-640)
   - src/components/settings/HEUFields.tsx (onChange field strings lines 44, 57)
   - src/app/api/report/export/route.ts (property access line 235)
   - src/app/api/account/export/route.ts (property access)
   - src/app/(auth)/settings/page.tsx (initial data mapping)
   - src/app/demo/mock-data.ts (mock data keys)

   Do NOT rename: heuReports table, heuCandidate column, heu_reports table name.

When done: run `npx tsc --noEmit`, then update status.json — set 1.2 to "done" with timestamp
and "T2". Check if gated tasks are unblocked and proceed to your next task (2.1).
```

### Terminal 3 — Start with Task 3.2 (no gate), then 2.3, 3.3

```
Read `.claude/plans/PLAN-multi-state.md` and `.claude/plans/status.json`.

Execute task 3.2 first (no gates — can start immediately): Update public pages, welcome wizard,
and demo pages. Replace all QLD-specific marketing/onboarding copy:

- src/app/(public)/page.tsx line 71: "Queensland HEU compliant" → "All Australian states supported"
- src/app/(public)/page.tsx line 93: "Queensland HEU documentation" → "Home education documentation
  that builds itself"
- src/app/(public)/welcome/welcome-wizard.tsx lines 29-30: Remove "Queensland HEU" references
- src/app/demo/page.tsx line 41: "HEU Report" → "Learning Report"
- src/app/demo/our-story/page.tsx line 61: "HEU Report" → "Learning Report"

When done: update status.json — set 3.2 to "done". Then check gates for 2.3 — it needs 1.1
and 1.2 to be done. If they are, proceed to 2.3. If not, wait.
```

### Terminal 1 — Task 2.2 (after 1.1 done, wait for 1.2)

```
Read `.claude/plans/PLAN-multi-state.md` and `.claude/plans/status.json`.
Check that tasks 1.1 and 1.2 are both "done" before starting.

Execute task 2.2: Update report screen with conditional tier rendering.
Edit `src/app/(auth)/our-story/report/page.tsx`.

Use /model opus for this task — it requires designing the learning_area view.

Key decisions:
- Import getJurisdiction, derive config from family settings state
- h1 title: config.reportScreenTitle
- cd_level (QLD/SA/NT): keep current behavior, just change "Export PDF for HEU" → "Export PDF"
- learning_area (NSW/VIC/WA/TAS/ACT): NEW VIEW with:
  - 8 learning area cards using existing SUBJECT_DOMAIN_CLASSES for colors
  - Each card: area name, emoji, entry count from subjectCounts, strand summary
  - "Areas to Explore" section (not "Gap Analysis") with softer language
  - Work samples without 6-slot structure
  - Export button: "Export Learning Report"
- Empty state body: remove "HEU compliance evidence" text
- Share: timeline hero, ChildSelector, EmptyState across both tiers
- Do NOT create separate components per state — one component, conditional rendering

When done: run `npx tsc --noEmit`, update status.json — set 2.2 to "done" with "T1".
Proceed to 3.1.
```

### Terminal 2 — Task 2.1 (after 1.1 and 1.2 done)

```
Read `.claude/plans/PLAN-multi-state.md` and `.claude/plans/status.json`.
Check that tasks 1.1 and 1.2 are both "done" before starting.

Execute task 2.1: Update Family Settings UI.

1. Create `src/components/settings/ReportingFields.tsx` (replacing HEUFields.tsx):
   - Import getJurisdiction from src/config/jurisdictions
   - Derive config = getJurisdiction(state)
   - Add placeholder <option value="">Select your state or territory</option>
   - Registration label: config.registrationLabel, hint: config.registrationHint
   - Date label: config.reviewDateLabel
   - Helper text: "Used to calculate your reporting countdown. Hearth never shares this data."
   - When state is null/empty: show "Select your state in Family Profile to see reporting
     options for your area." instead of the form fields
   - onChange fields: 'registrationNumber' and 'nextReportDate' (already renamed in 1.2)
   - Delete old HEUFields.tsx

2. Edit `src/app/(auth)/settings/SettingsClient.tsx`:
   - Tab type: 'heu' → 'reporting'
   - Tab label: 'Compliance' → 'Reporting'
   - Section overline: "Queensland HEU" → `${config.abbreviation} ${config.regulatoryBodyShort}`
   - Section heading: "Compliance & Reporting" → "Reporting"
   - Import ReportingFields instead of HEUFields
   - Import getJurisdiction, derive config from settings.state

When done: run `npx tsc --noEmit`, update status.json — set 2.1 to "done" with "T2".
Proceed to 3.2 (if not already done) or wait for Phase 4.
```

### Terminal 3 — Task 2.3 (after 1.1 and 1.2 done)

```
Read `.claude/plans/PLAN-multi-state.md` and `.claude/plans/status.json`.
Check that tasks 1.1 and 1.2 are both "done" before starting.

Execute task 2.3: Update report PDF export.
Edit `src/app/api/report/export/route.ts`.

- Import getJurisdiction from src/config/jurisdictions
- Get state from family settings, derive config
- Line 218: "HEU Compliance Report" → config.reportScreenTitle
- Line 235: heuRegistrationNumber → registrationNumber, label → config.registrationLabel
- Line 419: footer text → use config.reportScreenTitle
- Filename: "hearth-heu-report-" → "hearth-report-"
- For learning_area tier: generate portfolio-style PDF sections grouped by learning area
  instead of the 6-slot work sample structure. Reuse subject area data.
- For cd_level tier: keep current PDF structure

When done: run `npx tsc --noEmit`, update status.json — set 2.3 to "done" with "T3".
Proceed to 3.3.
```

### Terminal 1 — Task 3.1 (after 1.1 done)

```
Read `.claude/plans/PLAN-multi-state.md` and `.claude/plans/status.json`.

Execute task 3.1: Update Our Story Hub, notifications, and notification preferences.

1. src/components/our-story/OurStoryHubClient.tsx (lines 322-327):
   - Import getJurisdiction, derive config from settings
   - NavCard title: config.reportScreenTitle (not "HEU Report")
   - NavCard stat1: cd_level → "Compliance view", learning_area → "Learning summary"

2. src/lib/notifications/triggers.ts (line 273):
   - Import getJurisdiction
   - In triggerComplianceNudge: fetch family settings to get state, derive config
   - Replace "Your HEU check-in" with "Your ${config.regulatoryBodyShort} ${config.reviewTerminology}"

3. src/components/settings/NotificationPreferences.tsx (line 28):
   - Change "Reminders before your HEU reporting date." → "Reminders before your reporting date."

When done: run `npx tsc --noEmit`, update status.json — set 3.1 to "done" with "T1".
Proceed to 4.1 once all other tasks are done.
```

### Terminal 3 — Task 3.3 (after 1.1 done)

```
Read `.claude/plans/PLAN-multi-state.md` and `.claude/plans/status.json`.

Execute task 3.3: Update AI narrative term labels.
Edit `src/lib/ai/hearth-narrative.ts`.

The getCurrentTermLabel() function (lines 179-186) hardcodes QLD term boundaries.
Update it to accept an optional state parameter. Import getJurisdiction. Use
config.yearLevelCutoffMonth to inform term boundary logic. Default to QLD boundaries
for backward compatibility.

When done: run `npx tsc --noEmit`, update status.json — set 3.3 to "done" with "T3".
```

### Terminal 1 — Task 4.1 (after ALL tasks done)

```
Read `.claude/plans/PLAN-multi-state.md` and `.claude/plans/status.json`.
Check that ALL tasks (1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3) are "done".

Execute task 4.1: Final hardcoded string sweep.

Grep the entire src/ directory for:
- "HEU" (case-sensitive)
- "heuRegistration" and "heuNextReport"
- "Home Education Unit"
- "Queensland" (in reporting/compliance context — not in jurisdiction config)
- "month <= 6" or "month >= 7" (half-year logic)
- "audit" (in compliance notification context)

For each finding: replace with config-driven value OR confirm it's in the expected
out-of-scope list (heuReports table, heuCandidate column).

Run `npx tsc --noEmit` to confirm everything compiles.
Report a summary of all findings and changes.

When done: update status.json — set 4.1 to "done" with "T1".
```
