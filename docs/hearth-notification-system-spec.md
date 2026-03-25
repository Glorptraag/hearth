# Hearth LMS — Notification / Nudge System Design Specification

> **Version:** 1 | **Date:** 2026-03-03 | **Status:** New artifact
> **Companion files:** `Hearth_System_Interaction_Map.md` (canonical), `Hearth_AI_Intelligence_Layer_Architecture.md`, `hearth_dashboard_design_decisions.md`
> **Prototype:** `hearth-notification-centre-v1.html`

---

## 1. Design Philosophy

Hearth's notification system is the connective tissue between screens. It exists to **gently close loops**, not to create new obligations.

**Core principle:** Notifications revolve around the half-completed state. The most common notification is "you started something — here's a gentle invitation to finish it." NOT "you should be doing something."

**Anti-patterns (never do these):**
- Daily task lists or "you haven't done X today"
- Streak anxiety ("don't break your streak!")
- Progress bars that imply falling behind
- Multiple simultaneous alerts competing for attention
- Push notifications for anything except compliance deadlines (MVP)

**Voice:** First-person gentle friend. "I noticed…" not "Action required." Observational, never prescriptive. The system sees what's happening and offers a hand — it never wags a finger.

---

## 2. Notification Types — Complete Taxonomy

### 2.1 Priority Tiers

Notifications are grouped into three priority tiers. Within each tier, items are ordered by recency (newest first).

```
TIER 1 — RESUME (half-completed work)
  These always surface first. They represent work the parent already started.

TIER 2 — RESPOND (system-detected opportunities)
  Badge thresholds, compliance nudges. The system noticed something.

TIER 3 — RECONNECT (re-engagement)
  Streak prompts, prep reminders. Gentle invitations back.
```

**Rationale:** Tier 1 items represent the parent's own momentum. Completing a half-finished log entry takes 2 minutes and delivers immediate value. Tier 2 items require a decision. Tier 3 items are ambient — the parent may or may not act on them.

### 2.2 Type Definitions

| ID | Type | Tier | Trigger | Copy Pattern | Action | Destination |
|----|------|------|---------|-------------|--------|-------------|
| `draft_resume` | Draft resume | 1 | Auto-saved incomplete entry exists | "You were logging [title] — pick up where you left off?" | Opens Logger/Module with draft loaded | Logger or Module Experience |
| `pause_ack` | Pause acknowledgment | 1 | ~10 min inactivity during logging/module | "Looks like life called — we've saved your spot in [title]." | Opens Logger/Module at exact position | Logger or Module Experience |
| `badge_ready` | Badge ready | 2 | Evidence threshold ≥90% for a capability thread | "[Child] might be ready for their [Badge Name] badge — want to check?" | Opens badge assessment secondary interface | Badge Assessment |
| `compliance_nudge` | Compliance nudge | 2 | HEU deadline ≤4 weeks away AND coverage gaps detected | "Your HEU check-in is [X weeks] away. A few areas could use attention." | Opens HEU Report with gaps highlighted | HEU Report |
| `log_invitation` | Log invitation | 3 | Module session completed OR end-of-day with unlogged planned activity | "You ran [Module Name] today — want to capture what happened?" | Opens Logger or Module Log mode | Logger or Module Experience (Log mode) |
| `prep_reminder` | Prep reminder | 3 | Planned activity within next 2 hours | "[Module Name] is coming up — materials list ready when you are." | Opens Module Experience Prep mode | Module Experience (Prep mode) |
| `streak_prompt` | Streak prompt | 3 | ≥5 days since last logged activity | "It's been a little while — even a quick note keeps the story going." | Opens Logger | Logger |

### 2.3 Copy Voice Examples

All notification copy follows the "I noticed…" pattern. Never imperative, never urgent (except compliance within 2 weeks of deadline, which shifts to direct but still warm).

**Draft resume:**
- "You were partway through logging that creek walk — pick up where you left off?"
- "There's an unfinished entry about [title]. Ready to wrap it up?"

**Pause acknowledgment:**
- "Looks like life called — we've saved your spot in [title]."
- "No rush. [title] is exactly where you left it."

**Badge ready:**
- "Emma might be ready for her Number Navigator badge — want to check?"
- "Liam's been showing strong pattern thinking. Time for a badge check?"

**Compliance nudge (≥3 weeks out):**
- "Your HEU check-in is coming up in [X] weeks. A couple of areas could use some evidence."
- "Looking ahead to your reporting date — Science and HASS could use a session or two."

**Compliance nudge (<2 weeks out):**
- "Your HEU check-in is in [X] days. Let's make sure your story is complete."
- "Reporting is close — here's where you stand and what might help."

**Log invitation:**
- "You ran Bread Mathematics today — want to capture what happened?"
- "Looks like a full afternoon. A quick log keeps the learning visible."

**Prep reminder:**
- "Bridge Builder Challenge is coming up — materials list ready when you are."
- "Heads up: you've got [Module] planned for this afternoon."

**Streak prompt:**
- "It's been a little while — even a quick note keeps the story going."
- "Your family's learning didn't stop, even if logging did. Want to catch up?"

---

## 3. Notification Behaviour Rules

### 3.1 Frequency Caps

Each notification type has a maximum frequency to prevent nagging.

| Type | Max Frequency | Cooldown After Dismiss |
|------|--------------|----------------------|
| `draft_resume` | 1 per draft, per day | 24 hours after snooze; permanent after dismiss |
| `pause_ack` | 1 per interrupted session | Does not repeat if dismissed |
| `badge_ready` | 1 per badge per week | 7 days; re-triggers if new evidence added |
| `compliance_nudge` | 1 per week (≥3 weeks out), 1 every 3 days (<2 weeks out) | Scales with urgency, cannot be permanently dismissed |
| `log_invitation` | 1 per completed module, max 2 per day | 24 hours |
| `prep_reminder` | 1 per planned activity | Does not repeat |
| `streak_prompt` | 1 per week | 7 days |

**Global daily cap:** Maximum 4 new notifications per day across all types. Tier 1 items always fit within the cap. If Tier 2 + Tier 3 would exceed the cap, Tier 3 items queue for the next day.

### 3.2 Suppression Rules

Certain conditions suppress notifications entirely:

- **Quiet hours:** No notifications between 8pm and 7am (family-configurable in Family Settings). Queued notifications surface at the start of the next active window.
- **Active session:** While the parent is actively in Logger or Module Experience, no notifications appear. The system waits until they return to Dashboard or another non-input screen.
- **Weekend behaviour:** Prep reminders and log invitations are suppressed on weekends unless the family has weekend activities planned. Streak prompts never fire on weekends. Compliance nudges and badge-ready notifications are unaffected.
- **Snooze all:** A global "Quiet day" toggle available from the notification centre header. Suppresses all notifications for 24 hours. Compliance nudges within 2 weeks of deadline override this.
- **First week:** New families see zero notifications for 7 days after account creation. Let them explore without pressure.

### 3.3 Notification Lifecycle

Each notification moves through states:

```
CREATED → QUEUED → VISIBLE → { ACTIONED | SNOOZED | DISMISSED }
                                    │          │          │
                                    ▼          ▼          ▼
                                 Removed    Re-queue    Archive
                                           (cooldown)  (gone)
```

**CREATED:** System detects trigger condition, generates notification record.
**QUEUED:** Notification waiting for delivery window (respects quiet hours, active session, daily cap).
**VISIBLE:** Notification appears in notification centre and optionally on Dashboard.
**ACTIONED:** Parent tapped the notification's action button → navigated to destination. Notification removed.
**SNOOZED:** Parent swiped or tapped "Later" → notification re-queues after cooldown period.
**DISMISSED:** Parent swiped or tapped "×" → notification archived. Respects cooldown rules per type.

### 3.4 Stale Notification Cleanup

Notifications that are no longer relevant auto-archive:

- `draft_resume` → archived when draft is completed or deleted
- `pause_ack` → archived when session is resumed or draft is completed
- `badge_ready` → archived when badge is awarded or deferred
- `compliance_nudge` → archived after HEU reporting date passes
- `log_invitation` → archived after 48 hours (the moment has passed)
- `prep_reminder` → archived after the planned activity time passes
- `streak_prompt` → archived when any new entry is logged

---

## 4. Surface Strategy — Where Notifications Appear

### 4.1 Notification Centre (Primary Surface)

A dedicated screen accessible from the Dashboard header. Shows all current notifications grouped by tier, with filter tabs.

```
┌─────────────────────────────────────────────┐
│  ← Dashboard           Notifications    ⏸   │
├─────────────────────────────────────────────┤
│  [ All ]  [ Resume ]  [ Respond ]  [ Info ] │
├─────────────────────────────────────────────┤
│                                             │
│  📝 You were logging "Creek Walk"           │
│     Pick up where you left off?             │
│     [ Continue ]              2h ago   ×    │
│                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                             │
│  🏅 Emma might be ready for Number          │
│     Navigator — want to check?              │
│     [ Check Now ]             1d ago   ×    │
│                                             │
│  📋 HEU check-in is 3 weeks away.          │
│     Science and HASS need attention.        │
│     [ View Report ]           2d ago   ×    │
│                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                             │
│  💡 You ran Bread Maths today —             │
│     want to capture what happened?          │
│     [ Log It ]                4h ago   ×    │
│                                             │
│  🌿 It's been a little while — even a      │
│     quick note keeps the story going.       │
│     [ Quick Log ]             3d ago   ×    │
│                                             │
└─────────────────────────────────────────────┘
```

**Filter tabs:**
- **All** — everything, grouped by tier with dividers
- **Resume** — Tier 1 only (drafts and paused sessions)
- **Respond** — Tier 2 only (badges and compliance)
- **Info** — Tier 3 only (invitations and prompts)

**Interactions:**
- Tap notification body → navigate to destination
- Tap action button → navigate to destination
- Tap × → dismiss (archive)
- Swipe left → reveal snooze/dismiss options (mobile)

### 4.2 Dashboard Integration (Secondary Surface)

The Dashboard shows a **notification indicator** in the header and a **condensed notification card** in the right panel (desktop) or inline (mobile).

**Header indicator:**
- Bell emoji with count badge showing number of pending notifications
- Warm dot (ember glow) when Tier 1 items exist; neutral dot otherwise
- Tap → opens Notification Centre

**Dashboard notification card:**
- Shows the single highest-priority notification
- Same card format as notification centre but with less chrome
- "View all →" link to Notification Centre
- Only visible when notifications exist; section collapses to zero-height when empty

### 4.3 Channel Strategy (MVP vs. Future)

| Channel | MVP (Phase 1) | Phase 2 | Phase 3 |
|---------|--------------|---------|---------|
| In-app notification centre | ✅ All types | ✅ All types | ✅ All types |
| Dashboard card | ✅ Top priority item | ✅ Top priority item | ✅ Smart summary |
| Push notifications (mobile) | ❌ Not MVP | ✅ Tier 1 + compliance only | ✅ Configurable per type |
| Email | ❌ Not MVP | ✅ Compliance only (2 weeks out) | ✅ Weekly digest option |

**MVP rationale:** In-app only for Phase 1. Push notifications and email require infrastructure and permission management not warranted for 10–20 test families.

---

## 5. Data Model

### 5.1 Notification Record

```javascript
{
  id: "notif_abc123",
  family_id: "fam_xyz",
  type: "draft_resume",           // One of the 7 type IDs
  tier: 1,                        // 1, 2, or 3
  state: "visible",               // created | queued | visible | actioned | snoozed | dismissed
  
  // Content
  title: "Continue logging?",
  body: "You were partway through logging that creek walk — pick up where you left off?",
  emoji: "📝",
  action_label: "Continue",
  action_destination: "/logger",
  action_context: {
    draft_entry_id: "entry_draft_456"
  },
  
  // Targeting
  child_id: null,                 // null = family-wide, or specific child_id
  
  // Timing
  created_at: "2026-03-03T14:22:00Z",
  queued_until: null,
  visible_at: "2026-03-03T14:22:00Z",
  actioned_at: null,
  snoozed_until: null,
  dismissed_at: null,
  expires_at: "2026-03-05T14:22:00Z",
  
  // Deduplication
  source_id: "entry_draft_456",
  cooldown_key: "draft_resume:entry_draft_456"
}
```

### 5.2 Notification Preferences (in Family Settings)

```javascript
{
  family_id: "fam_xyz",
  notification_preferences: {
    quiet_hours: {
      enabled: true,
      start: "20:00",
      end: "07:00"
    },
    quiet_day: {
      active: false,
      expires_at: null
    },
    type_toggles: {
      draft_resume: true,
      pause_ack: true,
      badge_ready: true,
      compliance_nudge: true,     // Cannot be disabled (always on)
      log_invitation: true,
      prep_reminder: true,
      streak_prompt: true
    },
    weekend_logging: false
  }
}
```

**Note:** `compliance_nudge` cannot be fully disabled — the toggle controls frequency reduction only. Compliance notifications are the one exception to full parent control because HEU deadlines are non-negotiable legal requirements. The system frames this transparently: "Compliance reminders can be reduced but not turned off — we want to make sure you're never caught off guard."

---

## 6. Integration Points

### 6.1 Notification Sources

| Source System | Notification Types Created | Trigger Mechanism |
|--------------|---------------------------|-------------------|
| Auto-save system | `draft_resume`, `pause_ack` | Inactivity timer (~10 min) or explicit pause |
| Snapshot rebuild (async worker) | `badge_ready` | Badge threshold detection during rebuild |
| Snapshot rebuild | `compliance_nudge` | Gap analysis + HEU deadline calculation |
| Planner | `prep_reminder` | Scheduled activity within 2-hour window |
| Module Experience | `log_invitation` | Session end without log completion |
| Cron job (daily) | `streak_prompt` | Days-since-last-entry check at morning start |
| Cron job (daily) | `log_invitation` (end-of-day) | Unlogged planned activities at 6pm |

### 6.2 Notification Consumers

| Consumer | What It Reads | How |
|----------|--------------|-----|
| Notification Centre | All visible notifications for family | Query: `state = visible`, sorted by tier then recency |
| Dashboard header | Count of visible notifications | Query: `COUNT WHERE state = visible` |
| Dashboard card | Single highest-priority notification | Query: `state = visible ORDER BY tier ASC, created_at DESC LIMIT 1` |

### 6.3 Snapshot Integration

The Family Intelligence Snapshot already contains fields that feed the notification system:

- `dashboard_summary.nudge` → becomes the `streak_prompt` or `compliance_nudge` notification
- `badge_thresholds.ready[]` → each ready badge becomes a `badge_ready` notification
- `gap_analysis` → feeds compliance nudge body text

The snapshot rebuild worker creates notification records as a side effect of its computation.

---

## 7. Family Settings Integration

The existing Family Settings "Notifications & Reminders" section needs these controls:

```
┌─────────────────────────────────────────────────────┐
│  NOTIFICATIONS & REMINDERS                          │
│                                                     │
│  Quiet Hours                                        │
│  No notifications between [ 8:00 PM ] and [ 7:00 AM ]
│                                                     │
│  Notification Types                                 │
│                                                     │
│  📝 Draft reminders                      [ on  ]   │
│     When you have unfinished log entries            │
│                                                     │
│  🏅 Badge alerts                         [ on  ]   │
│     When a child may be ready for a badge           │
│                                                     │
│  📋 Compliance reminders                 [ on  ]   │
│     HEU deadline approaching                        │
│     (i) Can be reduced but not turned off           │
│                                                     │
│  💡 Logging invitations                  [ on  ]   │
│     After completed sessions or at end of day       │
│                                                     │
│  📅 Prep reminders                       [ on  ]   │
│     Before planned activities                       │
│                                                     │
│  🌿 Re-engagement prompts               [ on  ]   │
│     When it's been a while since logging            │
│                                                     │
│  Weekend notifications                   [ off ]   │
│     Include prep and log reminders on weekends      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 8. Edge Cases & Resolved Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Priority ordering when multiple pending | Three tiers: Resume > Respond > Reconnect. Within tier, newest first. | Parent's own momentum first, system observations second, ambient invitations third. |
| Maximum concurrent notifications visible | No hard limit in notification centre. Dashboard shows top 1 only. Global daily cap of 4 new per day. | Don't hide information, but control the flow rate. |
| Quiet hours / snooze all | Configurable quiet hours (default 8pm-7am). "Quiet day" toggle for 24h suppression. Compliance within 2 weeks overrides quiet day. | Respect family rhythms. HEU deadlines are the one exception. |
| Channel strategy | In-app only for MVP. Push and email deferred to Phase 2. | Infrastructure overhead not justified for 10-20 active test families. |
| Frequency caps | Per-type caps ranging from "once per event" to "once per week." Global daily cap of 4. | Prevent nagging while ensuring compliance deadlines aren't missed. |
| Dashboard vs. system-level alerts | Notification centre is a screen. Dashboard shows a condensed card for top-priority item. No system-level OS alerts in MVP. | Keeps everything within Hearth's warm tone. |

---

## 9. Empty States & First-Use Experience

**Zero notifications:** "All caught up. Your family's learning story is unfolding beautifully."

**First week (new family):** No notifications for 7 days. Shows: "Welcome to your first week. Take your time exploring — we'll start sending gentle nudges once you've settled in."

---

## 10. Accessibility

- All notification cards tappable with minimum 44px touch targets
- Screen reader: notifications announced as "notification from Hearth" with type and age
- Swipe-to-dismiss on mobile; × button always visible on desktop
- Filter tabs horizontally scrollable on small screens
- Notification count badge uses aria-live="polite"
- Reduced motion: fade transitions only

---

## 11. Correction Record

*No corrections yet — this is the initial specification.*

---

*Spec created March 2026. This resolves Open Design Question #5 from the System Interaction Map.*
