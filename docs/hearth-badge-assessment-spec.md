# Hearth LMS — Badge Assessment Secondary Interface
## Design Specification

> **Status:** Design complete — companion to `hearth-badge-assessment.html` prototype
> **Date:** 2 March 2026
> **Resolves:** System Interaction Map Open Questions #1 and #2
> **Updates needed after this:** COMPONENT_REGISTRY.md (move from Planned to Built), MODULE EXPERIENCE log mode (add transition trigger), RETROSPECTIVE LOGGER (add transition trigger)

---

## Purpose

This document specifies the Badge Assessment Secondary Interface — the flow that appears **after** a parent completes a learning entry (via Retrospective Logger or Module Log Mode) when the Capabilities Constellation detects that a badge threshold has been crossed.

This is **not** the Badge Creator (which lives in Settings for custom/user badges). This is the **system badge assessment** — a parent-facing interaction that determines whether a child has earned a meaningful milestone within a capability thread.

---

## Design Principles Applied

| Principle | How It Applies |
|-----------|---------------|
| **5-minute rule** | Entire assessment flow (intro → 4 questions → decision) completable in under 2 minutes. Each question is a single tap + optional note. |
| **Retrospective-first** | Assessment is triggered by logged evidence, not scheduled. The parent already did the learning; this just confirms it. |
| **Philosophy-neutral** | Questions assess capability, not methodology. "Can she partition 47 into tens and ones?" — not "Has she completed the Montessori bead work?" |
| **Parent empowerment** | Parent makes the award decision. System recommends but never overrides. Defer is always available and positively framed. |
| **Secondhand delight** | The parent holds the device. The award moment is designed for the parent to share with the child, not for the child to watch an animation. |

---

## Trigger Conditions

### When Does This Interface Appear?

The badge assessment is triggered when **all** of these conditions are met:

1. A learning entry has just been saved (Retrospective Logger or Module Log Mode)
2. The saved entry maps to DLOs within a capability thread
3. The Capabilities Constellation's background check detects that a badge threshold has been crossed for a specific learner
4. The badge has not been previously awarded to this learner
5. The badge has not been deferred within the last 14 days (cooling period)

### What Constitutes "Threshold Crossed"?

A badge threshold is crossed when the **required number of DLOs** within the badge's scope reach `confirmed` or `emerging` status. The specific threshold is defined per badge in Sanity CMS via `awardCriteria.requiredDLOsComplete`.

Example: Number Navigator requires 4 of 5 DLOs. If a newly logged observation maps to M1-DLO-10 and that pushes the count from 3 to 4 confirmed DLOs, the threshold is crossed.

**DLO status sources:**
- `confirmed` — previously confirmed via badge assessment, module completion, or direct parent confirmation in Constellation
- `emerging` — inferred from 1–3 logged observations with keyword matches
- The threshold check uses `confirmed` count only; `emerging` DLOs inform the "sometimes" option in assessment questions

### Transition Mechanism

After the learning entry save animation completes:

1. System checks badge thresholds (backend, < 500ms)
2. If triggered: full-screen transition (not modal, not overlay) to badge assessment intro
3. The original log entry is already saved — the assessment is additive, never blocking
4. If the parent dismisses: the entry is saved normally, badge check queued for next relevant session

---

## Screen Flow

### Screen 1: Intro

**Purpose:** Announce the badge opportunity warmly. Give the parent context and agency to proceed or skip.

**Content:**
- Badge emoji placeholder (in production: badge artwork)
- Badge name and capability thread name
- Personalised message: "Based on what you've been logging, it looks like [Child] might be ready for [Badge Name]. Let's find out together — just a few quick questions."

**Actions:**
- "Let's check →" — proceeds to questions
- "Not now" — dismisses, saves entry normally, queues badge for next session (14-day cooling period applies)
- "← Back to log" — same as "Not now"

**Multi-badge queue:** If multiple badges are triggered simultaneously, a queue indicator appears: "📋 2 badges ready for review — starting with the first." Badges are assessed sequentially, not simultaneously.

### Screen 2: Assessment Questions (×3–5)

**Purpose:** Parent answers simple check questions about the child's capabilities. These are drawn from the badge's `assessmentQuestions` array in Sanity CMS.

**Per question:**
- Question number and progress dots
- Question text (parent-friendly phrasing, always about the child, never about curriculum)
- "What we're looking for" hint panel (helps parent understand what constitutes a "yes")
- Three response options:
  - "Yes — [confident confirmation]"
  - "Sometimes, but not always"
  - "Not yet"
- Optional note field (free text, auto-saved)

**Navigation:**
- Progress dots show current position and completion
- "Next →" requires a selection (no skipping)
- "← Back" to review previous answers
- Final question shows "Review →" instead of "Next →"

**Data captured per question:**
```
{
  questionId: string,
  dloId: string,
  response: 'yes' | 'sometimes' | 'no',
  note: string | null,
  answeredAt: timestamp
}
```

### Screen 3: Decision

**Purpose:** Show summary of responses and let the parent make the award decision.

**Content:**
- Badge emoji and name
- Summary message
- DLO checklist showing each assessed capability with status icon:
  - ✅ = "yes" response
  - 🟡 = "sometimes" response
  - ⬜ = "not yet" response
- Score line: "X of Y check questions confirmed"

**Actions:**
- "🏅 Award [Badge Name] to [Child]" — primary action, proceeds to award moment
- "Not quite yet" — proceeds to defer screen
- Defer explanation below button: "No pressure — we'll check again as more evidence comes in."

**Award criteria (system recommendation):** The system does NOT enforce a minimum score. The parent always has authority to award. However, the UI naturally communicates readiness through the visual summary. A parent seeing 1/4 confirmed will likely choose to defer without being told to.

### Screen 4a: Award Moment

**Purpose:** Celebrate the achievement in a way the parent can share with the child.

**Design philosophy:** The parent is holding the device. The celebration is designed for a secondhand moment — "Show [Child] what they've earned" — not a screen animation the child watches passively.

**Content:**
- Large badge emoji with subtle glow animation
- "[Child] earned [Badge Name]!"
- Badge capability summary (what this means in plain language)
- Badge card with: name, thread, level, summary, award date, awarded by

**Actions:**
- "📱 Show [Child] what they've earned" — primary action. In production: transitions to a simplified, child-friendly view with large text and the badge displayed prominently. The parent physically turns the device toward the child.
- Hint text: "Turn the screen toward [Child] — this moment is for her."
- Physical badge card: "Want a physical badge? Order a real badge [Child] can pin, stick, or display." Links to fulfilment flow (available when badge is part of a purchased module pack).
- "Done — back to dashboard" — returns to originating screen

**What happens on award:**
- `learner_badge_awards` record created in PostgreSQL
- `assessment_responses` stored (parent's answers to check questions)
- All DLOs assessed as "yes" are confirmed if not already
- Portfolio updated with badge entry
- Constellation updated with badge milestone marker
- Achievement Standard mapping refreshed for HEU report

### Screen 4b: Defer

**Purpose:** Reassure the parent that deferring is completely fine. No judgment, no urgency.

**Content:**
- 🌱 emoji (growth metaphor, not failure)
- "No rush at all"
- "Skills grow at their own pace. We'll keep an eye on [Child]'s progress and check again when more evidence comes in."
- "What happens next?" card explaining: log entry saved normally, badge check returns when future logging suggests readiness
- "Done — back to dashboard"

**What happens on defer:**
- Badge threshold remains flagged in the system
- 14-day cooling period starts — badge won't re-trigger for this learner during this window
- Assessment responses are saved (useful for future comparison — "last time, 2/4 confirmed; now 3/4")
- DLOs answered "yes" ARE still confirmed (partial progress is real progress)
- No negative signal in any report or constellation view

---

## Edge Cases

### 1. Two or More Badges Trigger Simultaneously

**Scenario:** A single log entry maps to DLOs across multiple threads, crossing thresholds for two badges at once.

**Behaviour:**
- Queue indicator appears on intro screen: "📋 2 badges ready for review — starting with the first"
- Parent assesses badges sequentially (one at a time)
- After completing first badge (award or defer), "Done" button changes to "Next badge →"
- Each badge is independently assessable — awarding one doesn't affect the other
- Parent can dismiss the entire queue at any point ("Not now" on any intro)
- If dismissed, remaining badges queue for next relevant session

**Ordering:** Badges are ordered by: (1) highest DLO confirmation percentage first, (2) alphabetical by thread name as tiebreaker.

**Maximum queue:** Cap at 3 badges per session. If more trigger, prioritise top 3 by DLO confirmation % and queue remainder for next session. Rationale: 3 badges × 4 questions × ~30 seconds = ~6 minutes, which pushes against the 5-minute rule. Three is the responsible upper bound.

### 2. Parent Defers, Then Logs More Evidence Later

**Scenario:** Badge was deferred 3 weeks ago. Parent logs a new entry that maps to the same thread.

**Behaviour:**
- 14-day cooling period has passed → badge is eligible to re-trigger
- Constellation re-checks threshold (it may have improved due to new evidence)
- If still at/above threshold: badge assessment appears again after the new log entry
- Previous assessment responses are available to the system (but NOT shown to the parent — no "you said X last time" shaming)
- The assessment questions are the same (drawn from badge definition) but the parent's perspective may have changed

**Key principle:** Each assessment is a fresh evaluation. The system tracks history for its own analysis but never confronts the parent with past deferrals.

### 3. Parent Defers Within Cooling Period

**Scenario:** Badge was deferred 5 days ago. Parent logs a new entry with evidence for the same thread.

**Behaviour:**
- 14-day cooling period is active → badge does NOT re-trigger
- Entry is saved normally, DLO mappings are updated
- Badge will re-trigger after cooling period expires AND a relevant entry is logged

### 4. Badge Triggered During Module Log Mode (Not Retrospective Logger)

**Scenario:** Parent completes the Log phase of Module Experience, which maps to DLOs that cross a badge threshold.

**Behaviour:** Identical to retrospective logger trigger. The transition happens after the module log save, before returning to the module experience screen. On completion, "Done" returns to the module experience screen (not dashboard).

### 5. Child Has Already Earned This Badge

**Scenario:** Due to a race condition or data sync issue, a badge is triggered for a child who already has it.

**Behaviour:** System checks `learner_badge_awards` before showing the assessment. If badge already awarded, the trigger is silently suppressed. No UI shown.

### 6. DLO Confirmed Through Assessment Without Prior Logged Moments

**Scenario:** A parent confirms a DLO via badge assessment ("Yes — she gets this consistently") but there are zero logged moments mapped to that DLO.

**Behaviour:** The DLO is confirmed as `confirmed_by: 'parent-assessment'`. This is valid and intentional — the badge assessment questions ARE sufficient evidence. The connector architecture explicitly supports this: "DLO confirmation without moments: YES — the check questions are sufficient. Moments are supporting evidence, not requirements."

### 7. Multi-Child Entry Triggers Badges for Multiple Children

**Scenario:** A multi-child log entry maps to DLOs for both Emma and Liam. Emma crosses a badge threshold, Liam doesn't.

**Behaviour:**
- Only Emma's badge assessment appears
- If both children crossed thresholds: assessments are queued per-child. Emma's assessment first, then Liam's. Child context is always clear in the UI ("It looks like Emma might be ready..." then "It looks like Liam might be ready...").
- Maximum queue remains 3 total across all children per session.

### 8. Parent Dismisses at Intro ("Not Now")

**Scenario:** Parent sees the badge intro but taps "Not now" because they're in a hurry.

**Behaviour:**
- Learning entry is already saved (it was saved before the assessment appeared)
- Badge threshold flag remains active
- Standard 14-day cooling period starts from dismissal
- No assessment responses saved (nothing was answered)
- Badge will re-appear after cooling period + next relevant log entry

### 9. Parent Navigates Away Mid-Assessment

**Scenario:** Parent answers 2 of 4 questions, then closes the app or navigates away.

**Behaviour:**
- Partial responses are auto-saved to local state (not yet committed to server)
- On next app open: if the session is still valid (< 24 hours), resume from where they left off
- If session expired: treat as dismissal, start fresh next time
- Never lose the underlying log entry (already saved before assessment started)

### 10. Badge with Only 3 Questions (Minimum)

**Scenario:** A simpler badge (e.g., early foundation level) has only 3 assessment questions.

**Behaviour:** Flow is identical but shorter. Progress dots show 3 instead of 4–5. The 5-minute rule is easily met. Minimum is 3 questions per badge (defined in Sanity CMS badge schema).

---

## Data Requirements

### Reads (from Sanity CMS)

| Data | Source | Fields Needed |
|------|--------|---------------|
| Badge definition | `badgeLevel` | badgeId, name, thread, level, summary, assessmentQuestions[], awardCriteria |
| Assessment questions | `badgeLevel.assessmentQuestions` | question, lookingFor, dloMapping |
| Capability thread | `capabilityThread` | name, domain |
| DLO statements | `discreteLearningObjective` | parentVersion, statement |

### Reads (from PostgreSQL)

| Data | Source | Fields Needed |
|------|--------|---------------|
| Learner DLO status | `learner_dlo_status` | learner_id, dlo_id, status, confirmed_date |
| Existing badge awards | `learner_badge_awards` | learner_id, badge_id, awarded_date |
| Badge deferral history | `badge_assessment_log` (new table) | learner_id, badge_id, deferred_at, responses |
| Recent observations | `observations` | id, learner_id, dlo_mappings |

### Writes (to PostgreSQL)

| Event | Table | Data Written |
|-------|-------|-------------|
| Badge awarded | `learner_badge_awards` | learner_id, badge_id, awarded_date, awarded_by, assessment_responses, evidence_ids[] |
| Badge deferred | `badge_assessment_log` | learner_id, badge_id, deferred_at, assessment_responses, cooling_until |
| DLO confirmed via assessment | `learner_dlo_status` | learner_id, dlo_id, status='confirmed', confirmed_by='parent-assessment' |
| Badge dismissed | `badge_assessment_log` | learner_id, badge_id, dismissed_at, cooling_until |

### New Table: `badge_assessment_log`

```sql
CREATE TABLE badge_assessment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  learner_id UUID NOT NULL REFERENCES learners(id),
  badge_id TEXT NOT NULL,
  
  -- Outcome
  outcome TEXT NOT NULL CHECK (outcome IN ('awarded', 'deferred', 'dismissed')),
  
  -- Assessment data (null if dismissed without answering)
  assessment_responses JSONB,  -- [{questionId, dloId, response, note, answeredAt}]
  
  -- Cooling period
  cooling_until TIMESTAMP WITH TIME ZONE,
  
  -- Trigger context
  triggered_by_entry_id UUID,  -- the log entry that caused the trigger
  trigger_source TEXT CHECK (trigger_source IN ('retrospective_logger', 'module_log', 'project_capstone')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_badge_assessment_learner ON badge_assessment_log(learner_id, badge_id);
CREATE INDEX idx_badge_assessment_cooling ON badge_assessment_log(learner_id, badge_id, cooling_until);
```

---

## API Endpoints Required

### Badge Threshold Check (called after log entry save)

```
POST /api/badges/check-thresholds
Body: { learner_id, entry_id, dlo_mappings[] }
Response: { triggered_badges: [{ badge_id, badge_data, questions }] }
```

### Submit Badge Assessment

```
POST /api/badges/assess
Body: {
  learner_id,
  badge_id,
  outcome: 'awarded' | 'deferred' | 'dismissed',
  assessment_responses: [{ questionId, dloId, response, note }],
  triggered_by_entry_id
}
Response: { success, badge_award_id?, cooling_until? }
```

---

## Integration Points

### Retrospective Logger → Badge Assessment

After `hearth-logger-workspace.html` saves an entry:
1. Call `/api/badges/check-thresholds`
2. If `triggered_badges` is non-empty: full-screen transition to badge assessment
3. After badge assessment completes: return to post-save state (dashboard or logger)

### Module Experience → Badge Assessment

After `hearth-module-experience-v2.html` Log mode saves:
1. Same threshold check
2. Full-screen transition to badge assessment
3. After completion: return to module experience screen

### Project Experience → Badge Assessment

After `hearth-project-experience.html` capstone log saves:
1. Same threshold check (may include project-specific badge criteria)
2. Full-screen transition
3. After completion: return to project experience

### Portfolio ← Badge Assessment

On badge award, create portfolio entry:
```
{
  type: 'badge_award',
  learner_id,
  badge_id,
  badge_name,
  thread_id,
  thread_name,
  awarded_date,
  assessment_summary,
  dlos_confirmed: []
}
```

### Constellation ← Badge Assessment

On badge award, update constellation state:
- Mark badge level as `awarded` on thread
- Update visual representation (filled node vs hollow)
- Recalculate thread tier if applicable

### HEU Report ← Badge Assessment

Badge awards contribute to Achievement Standard coverage:
- Each confirmed DLO maps to AC V9 content descriptors
- Badge award confirms a cluster of DLOs, improving coverage percentage
- No additional HEU-specific action needed — the existing report pipeline reads from `learner_dlo_status`

---

## Accessibility

| Concern | Implementation |
|---------|---------------|
| Focus management | Focus moves to first interactive element on each screen transition |
| Screen readers | All emoji have aria-labels. Progress dots have aria-current. Response buttons have role="radio" |
| Keyboard navigation | All actions reachable via Tab. Response selection via Enter/Space. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables badge glow animation |
| Colour contrast | All text meets AA minimum on dark backgrounds (text-primary on bg-primary = 10.2:1) |
| Touch targets | All tap targets minimum 44×44px |

---

## Metrics to Track

| Metric | Purpose |
|--------|---------|
| Assessment completion rate | % of triggered assessments that reach decision screen (vs dismissed at intro) |
| Award vs defer ratio | Understanding if thresholds are well-calibrated |
| Time to complete assessment | Validating the 5-minute rule |
| "Show child" tap rate | Whether parents are using the share moment |
| Physical badge order rate | Commercial signal for badge fulfilment |
| Re-trigger conversion | % of deferred badges that are later awarded |
| Questions per badge (avg) | Content quality signal |
| Note usage rate | Whether parents find the optional notes useful |

---

## Implementation Sequence

| Step | Work | Depends On |
|------|------|-----------|
| 1 | Create `badge_assessment_log` table | Database schema access |
| 2 | Build `/api/badges/check-thresholds` endpoint | DLO status data, badge definitions in Sanity |
| 3 | Build `/api/badges/assess` endpoint | Step 1 |
| 4 | Implement badge assessment UI component (from prototype) | Steps 2–3 |
| 5 | Add transition trigger to Retrospective Logger | Step 4 |
| 6 | Add transition trigger to Module Experience log mode | Step 4 |
| 7 | Add transition trigger to Project Experience capstone | Step 4 |
| 8 | Connect award event to Portfolio feed | Step 3 |
| 9 | Connect award event to Constellation state | Step 3 |
| 10 | Build "Show child" simplified view | Step 4 |
| 11 | Build physical badge ordering flow | Step 4 (can be deferred to Phase 2) |

---

*This specification resolves System Interaction Map Open Questions #1 (Badge secondary logging interface) and #2 (Badge award moment). The companion HTML prototype `hearth-badge-assessment.html` demonstrates the complete interaction flow.*
