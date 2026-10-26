# Hearth — Watch-fors, Morning Cards and the Educator Path v1

<!-- Version: 1 | Date: 2026-10-21 | Changes: initial. Adds the watch-for (one per session, composed from Constellation frontier + tradition), tailored watch-fors from loose plans, the morning card layer and notification, the conversational log that absorbs the watch-for, and the hidden educator path that grows the parent. Builds on hearth-learning-cycle-v1.md and hearth-pedagogy-layer-v1.md; retires the Logger's standalone `lens` and `felt` fields on session logs. -->

> **One line:** Teachers decide what they're looking for before the lesson, watch for that one thing, record what the child actually did, and use it to decide what's next. Hearth now does the same for parents. Before learning, a **watch-for** primes one observable thing. After learning, the log asks about that thing in a short conversation. The answer moves the child's Constellation and picks the next watch-for. Underneath, a hidden **educator path** notices how the parent is growing as a teacher and slowly deepens what Hearth offers them: more tools, more theory, more trust. The parent never sees a level, a score or a streak.

---

## 0. Decisions log

| # | Decision | Reverses / refines |
|---|---|---|
| D56 | **One watch-for per session.** It targets one DLO. Where children in the session are at different bands, the same watch-for carries a per-child line. | — |
| D57 | A watch-for is **composed, never generated**: *what* = the child's next band on a frontier DLO (`toNext[band].sign`, Constellation); *how* = the family tradition's `watchHow` line for the DLO's evidence kind (pedagogy). | Pedagogy layer D40 `lens` field (absorbed into `how`) |
| D58 | Three watch-for scopes: **session** (rhythm or plan), **everyday** (one per child, generic, for freeform and play), **week** (Monday with nothing planned). | — |
| D59 | **Loose plans** are a new session source. A plan's tailored watch-for is built at write time: cue index first, at most one Haiku constrained choice when ambiguous. Any context phrase must come from the plan's own words. | Learning cycle §7 (sessions only from rhythms) |
| D60 | **Morning cards**: an event-based layer shown once, on the first app open of the day, ≤ 3 cards, read from a precomputed day brief. **Morning notification** on days with planned learning, and on Mondays when nothing is planned. Max one notification per day. | Dashboard (already replaced by Today) |
| D61 | **The log is a short authored conversation** that opens with the watch-for. Chips plus optional words. "Saw it" confirms the DLO link directly; no separate Confirm step for that DLO. | Seven-field Logger for session logs; Confirm chip for declared targets |
| D62 | **Two loops, kept separate.** Method outcome → rhythm turn (never reads the Constellation, D54 holds). Watch-for result → Constellation evidence → next watch-for. | — |
| D63 | **Educator path**: a hidden four-stage model per parent across five strands, computed weekly from behaviour Hearth already records. Zero model calls. Never displayed as a number, level or badge. Never demotes. | — |
| D64 | **No question exists only to measure the parent.** Every log question has a functional consumer: the turn, the Constellation or the next watch-for. The educator path only reads what those already collect. | — |
| D65 | **Craft notes**: new `knowledgeNote` kind for teaching craft (neutral). Tradition practice notes gain a minimum educator stage. Theory depth is gated by stage. Cards are chosen by relevance to today and to recent log patterns, never at random. | — |
| D66 | **Parent control**: a "Teaching help" setting (Keep it simple · Adjusts as you go · Go deeper) with one honest line describing what it does. Starting stage comes from one onboarding question. | — |
| D67 | **Quiet mode**: after 14 days with no logs, cards drop to the simplest form with no reference to the gap. Stage is kept. Normal density returns after two logs. | — |
| D68 | `felt` (mood) is removed from session logs. It survives only as an optional reason chip on "Not today" / "Not yet" (tired · unwell · off day), where it changes the turn (reschedule rather than resize). | Notes architecture v1 §4.1 `felt` |

---

## 1. What this adds to the cycle

```
           ┌─────────────── Morning cards + notification (day brief) ◀──────────────┐
           ▼                                                                         │
   Watch-for primed ──▶ Session / play ──▶ Conversational log ──┬─▶ method outcome ──▶ Turn (rhythm)
                                                                │
                                                                └─▶ watch-for result ──▶ Constellation
                                                                                           │
                                                   next watch-for ◀── frontier + result ◀─┘
                                                         │
   Educator path (hidden) ◀── how the parent primed, noticed, recorded, responded
           │
           └──▶ which craft cards, how much theory, which tools, how deep the log goes
```

Learning cycle v1 gave Hearth the **apply** loop: every log writes the next session. This doc adds the **notice** loop, where every session is primed with what to watch for and every log answers it. It also adds the **grow** loop: the parent's own teaching gets a little sharper each month.

---

## 2. Principles for this feature

1. **Watch one thing.** A parent watching three things watches none. One watch-for per session.
2. **Prime before, answer after.** The watch-for is shown before learning (card, Today, session start) and asked about after (log). The same words both times.
3. **Evidence, not judgement.** The log asks what the child did or said, not how well the parent thinks it went.
4. **"Didn't come up" is a good answer.** It's information, not failure. It keeps the watch-for open for another day.
5. **Grow the parent without telling them they're being grown.** No levels, points, streaks, percentages, "you missed", or tests. Offers, not assignments. Every card can be dismissed with no consequence.
6. **Nothing irrelevant.** No card is better than a random card. A craft card shows only when it fits today's sessions or a recent pattern.
7. **Zero runtime AI.** All composition is lookup over authored notes. The one permitted model call is at plan write time, constrained to choosing IDs.

---

## 3. The watch-for

### 3.1 Anatomy

| Part | Source | Shown from stage | Example (counting, Sam 5, CM family) |
|---|---|---|---|
| **Look-for** — one observable sentence | DLO `toNext[band].sign` | E1 | "He counts each scoop once — touching or moving it as he goes." |
| **How** — how to draw it out, in the family's tradition | tradition `watchHow[evidenceKind]` | E1 | "Afterwards, ask him to tell you how he counted." |
| **Context** — where it'll happen | plan text or rhythm item | E1 | "while you bake" |
| **Not yet looks like** — what you'll see if it isn't there yet | DLO `toNext[band].notYet[]` (first 2) | E3 | "Skips some · counts one twice" |
| **Why** — one line on why this matters | DLO `why` (thread) or practice `why.short` | E2 (one line) · E3+ (fuller) | "One number for one thing is the base of all counting." |
| **Per-child line** — where siblings differ | each child's band on the same DLO | E1 | "Ivy: watch whether she points to each scoop as you count." |

At E1 the parent sees two lines and a context, readable in about ten seconds. More appears as the parent grows (§7.2).

### 3.2 Scopes

| Scope | When it exists | Selected from | Where it shows |
|---|---|---|---|
| **Session** | A rhythm session or plan session is due | The session's declared target DLO if any; otherwise the plan's resolved DLO (§4); otherwise the child's top frontier DLO in the session's domain | Morning card · Today session card · session start · log |
| **Everyday** | Always, one per child | Child's top frontier DLO not already targeted by a session this week, biased to play-friendly evidence kinds (`does`, `chooses`) | Today header (collapsed) · Capture a moment · Monday card |
| **Week** | Monday, nothing planned | The everyday watch-for, plus a "plan something" prompt | Monday morning card + notification |

### 3.3 Selecting the DLO (frontier)

For a child and a candidate set (declared targets, plan candidates, or a domain):

1. Keep DLOs the child hasn't yet **shown** (band rule: highest band confirmed on two different days).
2. Prefer DLOs with one confirmation ("noticed"), then those at an earlier band in an active thread, then any DLO whose `prereq` are shown.
3. Exclude DLOs with an open watch-for that has carried 3 times (rotation, §3.5).
4. Ties: tradition `nextBias` order, then the thread the family has logged least in 14 days.

The target band is the child's current band + 1. The look-for is that band's `toNext.sign`.

### 3.4 How pedagogy shapes the watch-for

DLOs stay neutral (D39). Each DLO gains one field, **`evidence`**, saying how the learning shows:

| Kind | Learning shows as… | Example DLOs |
|---|---|---|
| `does` | an action | one-to-one counting, pouring without spilling |
| `says` | words | retelling, naming a property, giving a reason |
| `makes` | a product | a drawing, a built thing, a written line |
| `chooses` | what they go back to | returning to a work, starting it themselves |

Each tradition note gains **`watchHow`**: four lines, one per kind, with `{child}` and optional stage overrides. That's 24 authored lines in total, rather than a variant per DLO.

| Tradition | `does` | `says` | `makes` | `chooses` |
|---|---|---|---|---|
| Charlotte Mason | Watch quietly, then ask {child} to tell you how they did it. | Afterwards, ask {child} to tell it back in their own words. | Let them finish, then ask them to tell you about it. | Notice what they go back to on their own. |
| Classical | Ask {child} to say each step aloud as they do it. | Ask the question and have them answer in a full sentence. | Have them name what they made, using the proper word. | Notice what they ask to repeat. |
| Montessori | Say nothing. Watch whether {child} notices and fixes their own mistake. | Use three steps: "This is…", "Show me…", "What is this?" | Watch whether they check their own work against the model. | Watch what they choose and how many times they repeat it. |
| Waldorf | Do it alongside {child} in a rhythm — clap, step or sing each one. | Tell it as a story first; listen for what they say back later. | Watch their hands, not the result. | Notice what they bring into their play. |
| Unschooling | Don't set it up. Notice if it shows up on its own. | Answer their questions honestly and listen for what they say. | Notice what they make without being asked. | Notice what they keep coming back to. |
| Eclectic | Uses the strongest-weighted tradition for the DLO's typical signal (pedagogy layer §5.6), named: "A Montessori way to watch:" | — | — | — |

Stage overrides use the tradition's existing stage keys (e.g. Waldorf `first`, under 7: `says` → "Don't ask for explanation. Notice if it turns up in their play.").

### 3.5 Carry-forward and rotation

| Result | Next watch-for for that child |
|---|---|
| **Saw it** (first day) | Same look-for next time; the link is "noticed". |
| **Saw it** (second different day) | Band shown → next band's look-for, or the DLO's `next`. Event card next morning (§5.2). |
| **Partly** | Same look-for. If a not-yet chip was chosen, the matching `respond` practice is offered (§6.1). |
| **Not yet** ×1 | Same look-for, with the `respond` practice for the chosen not-yet sign. |
| **Not yet** ×2 | Step back: the current band's look-for (consolidate) — "Let's watch for the step before." |
| **Didn't come up** | Same look-for, carry count +1. At 3, rotate to the next frontier DLO, silently. It returns after 14 days. |

---

## 4. Loose plans → tailored watch-for

The new piece. A parent jots what they're intending, and Hearth hands back the right thing to watch for in that activity.

### 4.1 Entry (≤ 60 s)

On Today or Week: **"Plan something."**
- **What are you planning?** Free text or voice. ("Tuesday we're baking bread, the kids will measure the flour and count scoops.")
- **When** (date, default tomorrow) and **who** (children, default all).
- Optional: pick a Shelf item or activity (makes targets declared, skips resolution).

Saved as a `session` with `source: plan`. If the plan matches a running rhythm's source or method signal, offer: "Count this as Tuesday's {rhythm}?"

### 4.2 Resolution (write time)

1. **Cue index (L2, zero calls)** over the plan text → ranked candidate DLOs (existing `resolve.ts`).
2. **Intersect with each child's frontier** (§3.3). Score = cue score × frontier weight (noticed 1.5 · active thread 1.2 · prereqs shown 1.0 · shown 0).
3. **Clear winner** (top score ≥ 1.5× second, and ≥ threshold): pick it, zero calls.
4. **Ambiguous**: one Haiku call, constrained. Input = plan text, ≤ 5 candidate DLO IDs with their `plain` and the child's band. Output = `{ dlo, context }`, where `context` is ≤ 8 words. **Validation:** the DLO must be in the candidate list, and every content word of `context` must appear in the plan text. If validation fails, drop `context` and use the top cue candidate.
5. **No candidate over threshold** (plan too thin — "maths tomorrow"): map plan words to a domain; use the child's top frontier DLO in that domain. If no domain matches, the session uses the child's everyday watch-for. Never invent.

The composed watch-for is stored as a snapshot row (§9). Screens read it; nothing is recomputed on open.

### 4.3 Worked plan

> "Tuesday we're baking bread, the kids will measure the flour and count scoops."

- Cues: *count, scoops, measure, flour* → N1-03 one-to-one counting, M2-01 compare amounts, PL1-02 follow a sequence.
- Sam (5): N1-03 at *noticed* (counted 7 apples once, 14 Oct) → frontier weight 1.5 → clear winner.
- Ivy (3): N1-03 not started; N1-01 rote counting is emerging → per-child line from N1-01.
- Watch-for: **"Sam counts each scoop once — touching or moving it as he goes."** How (CM, `does`): "Watch quietly, then ask him to tell you how he counted." Context: "while you bake". Ivy: "Watch whether she says the numbers in order as you count together."
- Zero model calls.

---

## 5. Morning cards and the morning notification

### 5.1 When

| Situation | Morning notification | Opening layer (first open of the day) |
|---|---|---|
| Sessions or plans due today | ✓ at the parent's chosen time (default 7:00) | ✓ |
| Monday, nothing planned this week | ✓ | ✓ (week card) |
| Other days, nothing planned | — | ✓ only if an event card is due (§5.2); otherwise nothing |
| Quiet mode (§7.5) | Monday only | ✓, simplest form |

The layer shows once per day per parent. After it's dismissed, the watch-fors stay where they're needed: on Today's session cards and at the start of each session. The layer is a primer, not the only place the information lives.

### 5.2 Card types

| Card | Trigger | Content | Stage |
|---|---|---|---|
| `watchfor.today` | sessions/plans due | One line per session: context + look-for + how. Max 3 sessions; extras collapse to "and 2 more on Today". | all |
| `watchfor.week` | Monday, nothing planned | Each child's everyday watch-for + **Plan something** · **Turn the week** | all |
| `event.shown` | a look-for confirmed on a second day | "Sam's counting each scoop now. Next, watch whether he knows the last number is how many." Credit sits with the child; the parent's role is implied, never praised. | all |
| `event.stuck` | same look-for Not yet ×2, or the same not-yet sign twice in 14 days | A relevant craft card (§7.7): "When it wobbles, shrink the step, not the expectation — count five scoops, not the whole bag." | E2+ |
| `craft.try` | stage frequency (§7.2) and relevance | One teaching tool to try today, tied to a session due today where possible | all |
| `craft.understand` | stage frequency, after the related tool was tried or shown twice | Theory, 3–6 sentences in Hearth's voice | E3+ (E2 gets one-line `why` inside `craft.try`) |
| `craft.notice` | stage frequency | A watch-for about the parent's own teaching, framed as curiosity: "Today, notice who asks more questions — you or them." | E3+ |
| `rhythm.rest` | rhythm missed ×3 (learning cycle §9) | "Rest it, change days, or close it?" | all |
| `welcome.back` | first open after quiet mode starts | "One thing to watch for today." + one watch-for. No mention of the gap. | all |
| `intro.new-kind` | the first time a card kind appears for this parent | One gentle line: "Something new: now and then, a short note on why this works." No mention of progress. | on stage change |

### 5.3 Selection and cap

Max **3 cards**, in this order:
1. `watchfor.today` or `watchfor.week` — always first when present.
2. At most one **event** card (priority: `rhythm.rest` > `event.stuck` > `event.shown` > `welcome.back`).
3. At most one **craft** card, if the stage frequency allows it today and a relevant one exists.

Rules:
- Each card has **Not now**, which hides it for the day with no consequence. Craft cards also have **Less of these**, which lowers that card kind's frequency for this parent.
- Craft cards have a 28-day cooldown per note, unless the parent tapped **Remind me**.
- Craft relevance (in order): a pattern trigger matches (§7.7) → its practice relates to a method or DLO due today → its strand is the parent's weakest. If none of these match, no craft card is shown.

### 5.4 The notification

One per day, built from the same day brief as the cards.

| Day | Copy pattern | Example |
|---|---|---|
| Planned | "Today: watch whether {child} {look-for, short} {context}." | "Today: watch whether Sam counts each scoop once while you bake." |
| Several sessions | Leads with the first session + "and 2 more" | "Today: listen for Sam telling the chapter back — and 2 more." |
| Monday, nothing planned | One everyday watch-for + a light invitation | "New week. One thing to notice in Sam's play: does he count things he can touch?" |
| Unschooling family | Noticing framing, Monday default | "This week, notice what Sam keeps coming back to." |

Fatigue rules: if 5 notifications in a row go unopened, drop to Mondays only. Normal cadence returns on the next app open. Parents can set the time or turn notifications off. No streaks, no "you haven't logged", no red badges.

### 5.5 Card anatomy (structure only — design later)

```
[emoji placeholder] KIND LABEL (sans, metadata)
Title line (serif, card title, 600)
Body: 1–3 short lines (serif)
Per-child lines, colour-keyed to each child's identifier
Actions (sans): primary · Not now · (craft) Less of these
```

---

## 6. The conversational log

### 6.1 The script

The log is a short stack of Hearth questions. The parent's chip taps appear as replies. Every question is authored and deterministic; the conversational shape is presentation, not a chatbot.

**Rhythm session (e.g. counting inside a baking plan, or a living-book reading):**

| # | Hearth asks | Parent answers | Required | Consumer |
|---|---|---|---|---|
| 1 | "How did {item} go?" (skipped for plan sessions) | method outcome chips, per child | ✓ one tap | Turn |
| 2 | "You were watching whether {look-for, short}. For Sam?" | **Saw it · Partly · Not yet · Didn't come up** | ✓ one tap per child | Constellation, next watch-for |
| 3a | after **Saw it**: "What did he do or say?" | voice/text; placeholder from DLO `looksLike` | optional | evidence, Report sample |
| 3b | after **Partly / Not yet**: "What did you see instead?" | not-yet chips (DLO `toNext[band].notYet`) + "Something else" | optional | next watch-for, `respond` practice |
| 3c | after 3b, **E3+**: "What did you try?" | parent-move chips: Waited · Showed again · Made it smaller · Did it together · Moved on | optional | turn modifier (§6.3), event.stuck |
| 3d | after **Didn't come up**: "No problem — what did happen?" | voice/text | optional | cue resolution → may link other DLOs |
| 4 | "Anything else, or a photo?" | photo · text · Done | optional | Report samples |

Minimum path: two taps per child. Typical: 20–40 seconds. The parent can type freely at any point; free text is cue-resolved like any moment.

**Depth by stage.** E1 asks 1, 2 and 4 only; 3a appears as a placeholder in 4. E2 adds 3a and 3b. E3+ adds 3c, and 3b's chips include the `respond` hint inline ("Skipped some → next time, move each scoop to a new pile").

### 6.2 What's absorbed

The answers become the Moment:

| Moment field | Filled from |
|---|---|
| `children`, `when`, `workingFrom` | the session |
| `happened` | assembled sentence + any free text: "Baking bread. Watching for: counts each scoop once. Sam — partly; lost track past five. Ivy — said the numbers with me to ten." |
| `said` | 3a text per child |
| `lookfor` (new, per child) | `{ watch_for_id, dlo, band, result, notYet[], parentMove[] }` |
| `outcome` (rhythm) | step 1 |
| links | **Saw it** → link `confirmed` at the target band, source `lookfor`. **Partly** → link `confirmed` at the current band (no advance). **Not yet / Didn't come up** → no link. |
| `photo` | step 4 |

**Saw it is a confirmation.** The parent is answering an authored, observable marker for that exact DLO, so it counts as the Confirm step for that link. Other DLOs surfaced by free-text cues still appear as chips to confirm.

The Moment renders as a short readable record. That record is what the portfolio and HEU report draw on: it states what was being watched for, what was seen, and the child's words.

### 6.3 Parent moves feed the turn

The 3c answer modifies the next session before the method's turn applies. This is why the question exists (D64):

| Parent move | Effect |
|---|---|
| Made it smaller | the turn's `size−` is already applied; don't shrink again |
| Showed again | next session suggests a different way rather than the same demonstration |
| Did it together | next watch-for how-line shifts to "beside them" (fade the support) |
| Waited | no change; supports `craft.understand` on wait time later |
| Moved on | the look-for carries to the next session unchanged |

### 6.4 Spontaneous capture with everyday watch-fors

Capture a moment opens: **"What happened?"** (voice/text, as now). Then: **"Did any of these show up?"** with each child's everyday watch-for and any open session watch-for as chips. A tap runs 3a–3c for that watch-for. If nothing fits, the existing spontaneous path runs (cue resolution, ≤ 1 Haiku call, attach/branch offers).

The tradition `lens` field (pedagogy layer D40) is replaced by the watch-for how-line on sessions. It survives only in spontaneous capture, as the label on the optional words field.

---

## 7. The educator path (hidden)

### 7.1 What it models

The path models the five habits that separate a confident home educator from an anxious one. They're tradition-neutral, observable, and all come from data Hearth already records.

| Strand | The habit | Observed as |
|---|---|---|
| **Prime** | Decides what to look for before learning | watch-for card or session expanded before that session's log, same day · plans entered ahead · Turn the week done |
| **Notice** | Actually sees the target | watch-for answered (not "Didn't come up") |
| **Record** | Keeps evidence, not impressions | child's words captured · not-yet signs chosen · photos |
| **Respond** | Adjusts teaching to what they saw | parent-move chips recorded on Partly/Not yet · next session done as the turn wrote it (not skipped or moved more than twice) |
| **Craft** | Uses teaching tools on purpose | "I'll try this" / "Tried it" on craft cards · practice moves from post-save used (session done after a swap) |

### 7.2 Stages

Internal names only. The parent never sees them.

| | **E1 · Getting started** | **E2 · Finding rhythm** | **E3 · Reading the child** | **E4 · Designing learning** |
|---|---|---|---|---|
| **Who** | New to home education or to observing | Logging steadily, answering watch-fors | Seeing patterns, adjusting on purpose | Shaping sessions and blocks from what they see |
| **Watch-for shows** | look-for · how · context | + one-line why | + not-yet signs · fuller why | + the parent can swap to another candidate or write their own |
| **Log depth** | 1 · 2 · 4 | + 3a · 3b | + 3c · respond hints | same, plus "Anything you'd change next time?" (feeds plan note) |
| **Craft cards** | `try` · Mondays (≈1/wk) | `try` with one-line why · ≈2/wk | `try` · `understand` · `notice` · ≈4/wk on planned days | all · daily on planned days · optional Sunday reflect in Turn the week |
| **Theory depth** | reassurance only ("Didn't come up is a real answer") | one sentence of why | a short paragraph naming the idea in plain words (spacing, scaffolding, self-correction) | names the idea and how it changes planning across weeks |
| **Tools offered** | watch one thing · write their words · look before helping | wait time · open questions · stop while keen · describe, don't praise | not-yet signs as information · with / beside / watch · smaller step · spaced return · let them teach a sibling | plan backwards from the watch-for · vary to generalise · read a thread over a month · plan a 3-week block |
| **Tradition practice notes** | each tradition's 2–3 foundational practices (`practice.stage: E1`) | + 3–4 more | + the subtler ones (e.g. `cm.masterly-inactivity`, `montessori.next-in-sequence`) | + advanced (e.g. `classical.socratic`, block planning) |

### 7.3 Evidence events

Append-only `educator_events`, written as side effects of things that already happen. No new questions.

| Event | Written when | Strand |
|---|---|---|
| `primed` | watch-for viewed ≥ 2 s or expanded, before the session log, same day | Prime |
| `planned` | a plan saved ≥ 6 h before its date, or Turn the week completed | Prime |
| `answered` | watch-for result ∈ {saw, partly, notyet} | Notice |
| `specific` | answered + (words ≥ 5 · not-yet chip · photo) | Record |
| `words` | child quote captured | Record |
| `moved` | parent-move chip on Partly/Not yet | Respond |
| `followed` | session done within 2 days of the turn's date, unchanged | Respond |
| `tried` | "Tried it" on a craft card, or a swapped practice session completed | Craft |

### 7.4 Advancement

Weekly job per parent. Strand scores are **rates over the last 28 days**, not counts, so a family that logs twice a week isn't held back by volume. Each stage also has a minimum volume, so two lucky logs can't jump a stage.

| Move | Minimum time at stage | Minimum volume (28 d) | Rates (28 d) |
|---|---|---|---|
| E1 → E2 | 2 weeks | 6 session logs | answered ≥ 50% |
| E2 → E3 | 3 weeks | 10 session logs | answered ≥ 60% · specific ≥ 40% · primed ≥ 40% · tried ≥ 2 |
| E3 → E4 | 6 weeks | 16 session logs | specific ≥ 60% · moved ≥ 30% of Partly/Not yet · followed ≥ 60% · tried ≥ 5 across ≥ 2 tool families |

The thresholds are a first draft (C22). They'll be tuned against the demo family and early users.

**Never demotes.** If rates fall, the stage holds and quiet mode handles absence (§7.5). A parent who has seen a tool doesn't lose access to it.

**No announcement.** A stage change shows up only as `intro.new-kind` the first time a new card kind appears.

### 7.5 Quiet mode

14 days with no logs → quiet. Cards drop to the E1 layout (one watch-for, no craft), notifications go to Mondays only, and the first open shows `welcome.back`. Stage is preserved. Two logs → normal density for the parent's stage. No copy anywhere refers to the gap.

### 7.6 Starting stage and parent control

**Onboarding (one question, ~5 s):** "How long have you been home educating?" with four options: Just starting · Under 2 years · 2 years or more · I've taught professionally (classroom or early childhood). These map to E1, E1, E2 and E3. The path then follows evidence from there.

**Settings → Teaching help:**
- *Keep it simple*: caps card density and theory at E2, whatever the stage.
- *Adjusts as you go* (default): follows the path.
- *Go deeper*: shows E3 theory and tools now; the evidence-based stage keeps running underneath.

Honest one-line description under the setting: "Hearth adjusts how much it explains as you use it. Change this any time." This keeps the tracker private without being deceptive, and it's covered in the APP privacy notice as a use of the family's logging data.

### 7.7 Tailoring: pattern → craft card

Craft notes carry `trigger` rules: queries over recent `moments.lookfor` and `outcome`, evaluated when the day brief is built. This is how help sharpens to the parent's actual situation.

| Pattern (last 14 d) | Card |
|---|---|
| same not-yet sign ×2 on one DLO (e.g. "skips some") | that sign's `respond` practice as `craft.try` ("Move each scoop to a new pile as you count") |
| "Didn't come up" ≥ 3 across watch-fors | `craft.try`: "Set it up so it can happen — put five things in front of them and wait." |
| living-book outcome "Needed prompting" ×2 | `craft.try`: "Read it once, then stop talking. Wait for them to start." (CM, E2) |
| Partly/Not yet with no parent move, E3+ | `craft.understand`: scaffolding, "with, beside, watch" |
| Saw-it rate > 80% over 3 weeks on one thread | `craft.try` (E3+): "It might be too easy. Try the next step sooner." |
| sessions often moved or skipped on one weekday | `craft.try`: "Mondays seem hard. Try a lighter rhythm that day." |
| `tried` on wait time + Partly rate dropping | `craft.understand`: why waiting works |

---

## 8. Content model

### 8.1 Sanity additions

| Note | Addition |
|---|---|
| **DLO** | `evidence: does \| says \| makes \| chooses` · `toNext[band].notYet[]`: 2–3 `{ id, label, respond: practiceId? }` · `toNext[band].sign` already exists (the look-for) |
| **Tradition** | `watchHow: { does, says, makes, chooses }` with optional `stages` overrides · `notifyDefault: planned \| monday` (Unschooling: `monday`) |
| **Practice** | `stage: E1–E4` (minimum) · `why: { short, deeper }` |
| **Craft** (new `knowledgeNote` kind) | see below |

```yaml
id: craft.wait-time
kind: craft
strand: notice
stage: E2                 # minimum stage
card: try                 # try | understand | notice
tradition: neutral        # or a tradition key; neutral shows to all
title: "Count to five before you help"
body: "After you ask a question, count to five in your head before you say anything. Most children answer in the gap."
why:
  short: "Thinking takes a moment; filling the silence takes the thinking away."
  deeper: "…"            # E3+ understand card
relates: { dlos: [], practices: [], methods: [] }   # relevance to today's sessions
trigger:                  # optional pattern rules (§7.7)
  - { kind: notyet-repeat, count: 2, days: 14 }
cooldown: 28
```

Validation: `body` ≤ 40 words for E1–E2 and ≤ 90 words for E3–E4. Every `trigger.kind` must come from a fixed list coded once. A note may omit `why.deeper`; honest density applies.

### 8.2 Starter catalogue (≈24 craft notes)

| Stage | Notes |
|---|---|
| E1 | `craft.one-thing` (watch one thing) · `craft.their-words` (write one thing they said, exactly) · `craft.look-before-help` (watch ten seconds before helping) · `craft.didnt-come-up` (reassurance) · `craft.set-it-up` (make space for it to happen) |
| E2 | `craft.wait-time` · `craft.open-question` · `craft.stop-while-keen` · `craft.same-again` (repeating isn't falling behind) · `craft.describe-not-praise` · `craft.lighter-day` |
| E3 | `craft.mistakes-are-information` · `craft.with-beside-watch` · `craft.smaller-step` · `craft.spaced-return` · `craft.let-them-teach` · `craft.notice-questions` (notice) · `craft.notice-help` (notice how often you step in) |
| E4 | `craft.plan-backwards` · `craft.vary-to-generalise` · `craft.read-a-month` · `craft.plan-a-block` · `craft.write-your-own` (unlocks authoring watch-fors) · `craft.too-easy` |

Tradition practice notes (pedagogy layer §5.7) are staged alongside these. For example: `cm.narration` E1, `cm.short-lesson` E2, `cm.masterly-inactivity` E3. `montessori.three-period` E2, `montessori.next-in-sequence` E3. `classical.memory-work` E1, `classical.socratic` E4. `waldorf.work-alongside` E1, `waldorf.main-lesson-picture` E3. `unschool.strew` E1, `unschool.connect-to-a-doer` E3.

### 8.3 Authoring load

| Item | Count | Notes |
|---|---|---|
| DLO `evidence` tag | 171 tags | one word each |
| DLO `notYet` chips | ≈ 2.5 per band transition | **expo: only DLOs targeted by Shelf content and starter rhythms (≈ 40–60 DLOs)** |
| Tradition `watchHow` | 24 lines + overrides | drafted in §3.4 |
| Craft notes | ≈ 24 | expo: E1–E2 only (11) |
| Practice `stage` + `why` | ≈ 42 | `stage` is one field; `why.short` one line |

---

## 9. Data and code

### 9.1 Postgres

| Table | Fields |
|---|---|
| `sessions` (extend) | + `source (rhythm \| plan)`, `plan_text`, `rhythm_id` nullable, `learner_ids[]` |
| `watch_fors` | id, family_id, learner_id, scope (session · everyday · week), session_id?, dlo_id, band, evidence_kind, lookfor, how, context?, why?, not_yet JSONB, source (declared · cue · model · frontier · parent), carry_count, status (open · saw · partly · notyet · nocome · rotated), for_date, created_at |
| `moments` (extend) | + `lookfor` JSONB per child, + `logged_by`; `felt` dropped from session logs |
| `educator_profiles` | user_id, family_id, stage, stage_since, preference (simple · auto · deeper), quiet_since?, strands JSONB, start_answer, evaluated_at |
| `educator_events` | user_id, kind, ref_id, at (append-only) |
| `day_briefs` | family_id, user_id, date, cards JSONB, push_text, built_at, shown_at? |
| `card_events` | user_id, card_kind, note_id?, action (shown · expanded · dismissed · tried · less · remind), at |

Educator data is **per parent** (Clerk user), not per family. Two parents grow separately, and logs record who logged.

### 9.2 Code (all pure functions except jobs)

| File | Signature / role |
|---|---|
| `src/lib/watch/select.ts` | `(child, candidates, bands, tradition) → { dlo, band }` (frontier rules §3.3) |
| `src/lib/watch/compose.ts` | `(dlo, band, tradition, stage, context) → WatchFor` |
| `src/lib/watch/plan.ts` | `(planText, children) → candidates` → optional Haiku propose → `WatchFor[]` (write time) |
| `src/lib/watch/carry.ts` | `(watchFor, result, history) → next WatchFor` (§3.5) |
| `src/lib/log/script.ts` | `(session, watchFors, method, stage) → Question[]` (§6.1) |
| `src/lib/log/absorb.ts` | `(answers) → Moment patch + links + educator events` |
| `src/lib/brief/build.ts` | `(family, user, date) → DayBrief` (§5.3) |
| `src/lib/educator/evaluate.ts` | `(events28d, profile) → profile'` (§7.4) |
| jobs | Vercel Cron hourly → build day briefs for families whose local time is 03:00; rebuild on writes affecting today (log, plan, turn). Weekly educator evaluation. Notification send at each parent's chosen time. |

### 9.3 AI budget

| Path | Calls |
|---|---|
| Watch-for selection, composition, carry | 0 |
| Plan resolution, clear winner (expected ~70%) | 0 |
| Plan resolution, ambiguous | 1 Haiku, ≤ 800 tokens, IDs + ≤ 8-word context, validated |
| Conversational log, day brief, cards, notifications, educator path | 0 |
| Spontaneous capture | unchanged (≤ 1 per save, existing cap) |

---

## 10. Worked example — Sam (5) and Ivy (3), a CM-leaning family, six weeks

**Onboarding.** "Under 2 years" → E1. Starter rhythms: living book (Sam), nature walk (both).

**Sunday, week 1.** The parent taps Plan something: "Tuesday we're baking bread, the kids will measure flour and count scoops." The watch-for resolves with zero calls (§4.3).

**Tuesday 7:00.** Notification: "Today: watch whether Sam counts each scoop once while you bake."
First open, one card:
> 🍞 TODAY
> **Baking bread**
> Sam: counts each scoop once — touching or moving it as he goes. Afterwards, ask him to tell you how he counted.
> Ivy: says the numbers in order as you count together.

**Tuesday, log (E1, 25 s).** "You were watching whether Sam counts each scoop once. For Sam?" → **Partly**. For Ivy → **Saw it**. "Anything else, or a photo?" → photo of the dough.
Absorbed: Sam N1-03 partly → link at current band; Ivy N1-01 saw it → confirmed, "noticed". Events: `answered` ×2, `primed`, `planned`.

**Week 2, Monday.** E1 craft card (Monday frequency): "Write down one thing they said, exactly." Thursday, the living book is logged "Needed prompting", and the parent types Sam's words.

**Week 3.** Six logs, answered rate 70% → **E2**. The next morning's card has an `intro.new-kind` line, and the watch-for now shows a one-line why. Logs now ask 3a/3b. Sam's counting: Not yet, with "Skips some" chosen twice → `event.stuck` + `craft.try`: "Move each scoop to a new pile as you count." The parent taps **Tried it**.

**Week 4.** Sam: Saw it on Monday and Thursday → N1-03 shown. Friday's card: "Sam's counting each one now. Next, watch whether he knows the last number is how many." Constellation updates. The rhythm turns are unaffected throughout.

**Week 6.** Specific 55%, primed 60%, tried 3 → **E3**. Cards now include `craft.understand` on spaced return, tied to the Classical-flavoured memory list the parent added. The log asks "What did you try?" after Partly. The watch-for shows not-yet signs.

At no point did the parent see a level, a score, a streak or a reminder of a missed day. What they experienced was that Hearth gradually started explaining more, offering more, and asking slightly sharper questions.

---

## 11. The 5-minute rule

| Interaction | Time |
|---|---|
| Morning cards (read, dismiss) | ≤ 30 s at E1 · ≤ 60 s at E4 |
| Plan something | ≤ 60 s |
| Session log | 10–40 s (two taps minimum) |
| Spontaneous capture | ≤ 3 min (unchanged) |
| Turn the week | ≤ 5 min (unchanged) |

---

## 12. Edge cases

| Case | Handling |
|---|---|
| Sibling under 2 | No watch-for unless a DLO exists for that band; the card shows older children only. |
| Siblings at very different bands | One DLO per session (D56), per-child lines. If no shared DLO fits, the younger child gets their everyday watch-for as the line. |
| Parent logs without opening the card | The log still opens with the watch-for. Priming isn't required, only offered. |
| Second parent runs the session | Watch-for shows for whoever opens; `logged_by` attributes events to the right educator profile. |
| Plan text in another session's language ("we did maths") | Domain fallback (§4.2 step 5). |
| Unschooling family | Watch-fors default to `chooses`/`does` kinds, how-lines are noticing-only, notifications default to Mondays, and craft cards never suggest setting up lessons. |
| Parent edits or rejects the watch-for (E4) | Stored with `source: parent`. If they pick a thread, it maps to a DLO (human-confirmed); otherwise it's a free note with no Constellation effect. |
| Web push on iOS | Requires the app installed to the home screen. Until then: in-app layer only, with an optional morning email (opt-in) as fallback. |

---

## 13. Expo scope (9 Nov)

**In:**
- session and everyday watch-fors on Today and at session start
- conversational log (E1–E2 depth)
- Plan something via the zero-call cue path, with domain fallback
- morning card layer: `watchfor.today`, `watchfor.week`, `event.shown`, `craft.try`
- E1–E2 craft notes (11)
- `watchHow` for CM, Classical, Eclectic
- `notYet` chips on demo-path DLOs
- onboarding starting-stage question
- educator path computing silently (E1–E2 transitions only)
- in-app layer, with push only if PWA push is already wired

**After:** Haiku plan fallback, E3–E4 content and card kinds, parent-authored watch-fors, full fatigue rules, Sunday reflect, remaining traditions' `watchHow`.

This sits on the Today and Log screens that learning cycle v1 already puts in scope for expo. The new surfaces are the card layer and Plan something. The demo moment at the stand is the Tuesday sequence in §10: plan, prime, two-tap log, child moves.

---

## 14. Propagation

| Target | Action |
|---|---|
| `hearth-learning-cycle-v1.md` | §7 Log a session → the conversational script (§6); Today cards carry the session watch-for; `sessions` gain `source: plan`. |
| `hearth-pedagogy-layer-v1.md` | D40 `lens` → tradition `watchHow` on sessions; `lens` kept only as the spontaneous capture words label. Practice notes gain `stage`, `why`. |
| `hearth-notes-architecture-v1.md` | §4.1 `felt` removed from session logs (D68); `lookfor` added to Moment; Saw it counts as Confirm (D61). |
| `hearth-notes-handoff-plan` | → next version: S2 adds the tables in §9.1; S3 adds `watch/*`, `log/*`, `brief/*`, `educator/*`; S4 adds card layer + Plan something; authoring adds `evidence`, `notYet`, `watchHow`, craft notes. |
| `decisions.md` | Add D56–D68 and C19–C25 resolutions. |
| `COMPONENT_REGISTRY.md` | New: Morning cards, Plan something, Conversational log (spec: this doc). Changed: Today session card, Capture a moment. |
| APP privacy notice | Add one line: logging data is used to adjust how much Hearth explains to each parent. |

---

## 15. Needs your confirmation

| # | Question | Default |
|---|---|---|
| C19 | One DLO per session, with per-child lines when siblings differ (rather than a separate watch-for per child). | Proceed |
| C20 | "Saw it" on the watch-for counts as confirming that DLO link — no separate chip. | Proceed |
| C21 | Remove `felt`/mood from session logs; keep only as a reason on Not today / Not yet. | Proceed |
| C22 | Advancement thresholds in §7.4 as a first draft, tuned after the demo family. | Proceed and tune |
| C23 | A visible "Teaching help" setting (Simple · Adjusts as you go · Go deeper) with an honest description, even though the stages stay hidden. | Proceed |
| C24 | Starting stage from one onboarding question, including "I've taught professionally" → E3. | Proceed |
| C25 | The parent-move question ("What did you try?") appears from E3, not E2 — the earliest point it reads as help rather than a check. | E3 |
