# Hearth — The Learning Cycle v1 (Rhythms)

<!-- Version: 1 | Date: 2026-10-21 | Changes: initial. Moves pedagogy from interpreting logs to driving the next step. Introduces the Rhythm as the third parent-facing note (apply), method notes as the pedagogy unit, a fixed turn vocabulary, Today/Week screens and starter rhythms. Supersedes the Planner in hearth-notes-architecture-v1 §8, and §7–§8 of hearth-pedagogy-layer-v1.md (signals retained for spontaneous moments only). -->

> **One line:** Every log closes one step and opens the next. A family runs a few **rhythms** — a living book, memory work, a shelf, a nature walk, a main-lesson block. Each rhythm follows a **method** from a tradition. Logging a session is one tap on the method's own outcome scale; the method's **turn** decides what happens next time and puts it in the week. Pedagogy is the engine of the cycle, not a commentary on it. The Constellation tracks *what* is being learned; rhythms carry *how*.

---

## 0. Decisions log

| # | Decision | Reverses / refines |
|---|---|---|
| D46 | The three parent-facing notes are **Moment** (capture), **Thread** (track — the Constellation), **Rhythm** (apply — method and approach). Knowledge notes are the authored library underneath all three. | v1 D1 (Knowledge as the third note) |
| D47 | **Method** is the pedagogy unit: a `knowledgeNote` kind defining a unit of work, a session, a method-specific outcome scale, a turn table, a default cadence and a week shape. ~3 per tradition. | Pedagogy layer v1 D38 (tradition as signal table) — signal table kept for spontaneous moments only |
| D48 | **The turn**: each outcome maps to actions from a fixed vocabulary of ten (§4). The turn writes the next session. Zero model calls. | Direction rules (pedagogy layer v1 §8) folded in |
| D49 | Logging a rhythm session = one outcome tap per child + optional note/photo. Target ≤ 20 s. | — |
| D50 | Planning is never a blank page. The week is the set of next sessions the turns have written, laid onto each rhythm's cadence. Parents move, skip or add; they don't author from scratch. | v1 §8 Planner (opportunities with dates) |
| D51 | Each tradition supplies a **week shape**: checks run over the planned week that flag what its method would miss, with a one-tap fix. This is how pedagogy shapes planning. | — |
| D52 | Any rhythm can use any method. Eclectic is simply a family running methods from more than one tradition. The family's tradition sets defaults and suggestions only. | Pedagogy layer v1 D44 |
| D53 | Spontaneous moments still exist. Their post-save offers **attach** ("count this as today's nature walk") or **branch** ("make this a rhythm"). The "through your lens" reading block is removed; every next step carries a one-line `why` instead. | Pedagogy layer v1 §7 blocks 2 |
| D54 | Rhythms never read the Constellation. Sessions whose unit has declared targets produce DLO chips, which feed the Constellation. One direction only. | — |
| D55 | Onboarding ends with the family on the cycle: tradition → two or three starter rhythms → source attached → days set → Today screen populated. ≤ 5 minutes. | — |

### The locked principle this touches

**"Retrospective logging is the core interaction. Never design forward-planning as primary."**
Proposed refinement: *Logging is the core act. Every log produces the next step; planning is what logging produces, never a blank page.* The parent's daily interaction is still "did it happen, how did it go" — retrospective. What changes is that the answer now carries weight forward. Needs confirmation (C14).

---

## 1. The cycle

```
        ┌──────────── Week (next sessions on cadence, week-shape checks) ◀───────┐
        ▼                                                                          │
     Today ──▶ Session happens ──▶ Log: one outcome tap ──▶ Turn (method rules) ───┘
                                         │                         │
                                         │                         └─▶ "Next: … · why"
                                         └─▶ declared DLO chips ──▶ Constellation (what)

   Spontaneous moment ──▶ capture ──▶ attach to a rhythm  or  branch into a new one
```

Two things move: the **rhythm's position** (where we are in the book, the memory list, the shelf, the block) and the **week** (when the next step happens). Both are deterministic from the outcome tapped.

---

## 2. The Rhythm note

What a parent sees and keeps. Stored in Postgres; rendered as a note.

```md
# Paddle-to-the-Sea · Sam
method: Living book (Charlotte Mason)   cadence: Mon Wed Fri
## where we are
Chapter 4 of 27 · passage size: one chapter
## next
Wed — Read chapter 5 once, straight through. Ask Sam to tell it back.
why: A full narration last time means the passage was the right size.
## lately
Mon 20 Oct · Ch. 4 · told it fully
Fri 17 Oct · Ch. 3 · told part
Wed 15 Oct · Ch. 3 · needed prompting → passage shortened
```

| Field | Meaning |
|---|---|
| `children` | one or more; state is kept per child |
| `method` | method note ID |
| `source` | what the rhythm works through: a Shelf collection, a book (title + chapter count), a list (memory items), a shelf (works), a block (theme + days), an interest |
| `cadence` | days of week or N per week |
| `state` | per child: `cursor`, `size`, `activeSet`, `reviewQueue`, `missed` |
| `next` | the next session(s), already written |
| `status` | active · resting until {date} · closed |

---

## 3. The Method note

A Knowledge note (`kind: method`), authored once, confirmed by Drew.

```yaml
id: method.cm.living-book
tradition: cm
title: Living book
plain: "One good book, read a little at a time. They tell back what they heard."
source: [book, collection]
unit: passage
sizes: [half chapter, one chapter, two chapters]   # size ladder for size(±)
cadence: { perWeek: 3 }
session:
  steps: ["Read {item} once, straight through.", "Ask {child} to tell it back."]
  ask: "What did they tell back?"                  # optional note field label
outcomes:
  - { key: full,    label: "Told it fully" }
  - { key: part,    label: "Told part" }
  - { key: prompt,  label: "Needed prompting" }
  - { key: none,    label: "Not today" }
turn:
  full:   { do: [advance],            why: "A full telling means the passage was the right size." }
  part:   { do: [advance],            why: "Part is normal. The next reading builds on it." }
  prompt: { do: [advance, size(-1)],  why: "A shorter passage gives a fuller telling." }
  none:   { do: [reschedule],         why: "Try a different time of day before changing the book." }
  pattern:
    - { when: "none ×3", do: [pause(7)], why: "Rest the book a week. If it still doesn't land, it may not be a living book for this child." }
targets: from-source            # DLO chips come from the source's declared targets, if any
```

Validation: every outcome has a turn; every action is from the vocabulary; `why` ≤ 20 words; 3–4 outcomes; steps ≤ 3.

---

## 4. The turn vocabulary (ten actions, coded once)

| Action | Effect on state | Example |
|---|---|---|
| `advance` | cursor → next item | next chapter, next lesson |
| `repeat` | next session uses the same item | same lesson again |
| `review(ladder)` | item enters the review queue at the next interval (1 · 3 · 7 · 14 · 28 days · kept) | memory work |
| `size(±1)` | move one step on the method's size ladder | shorter passage, fewer problems |
| `swap(practice)` | next session runs with a different practice | re-teach with a chant |
| `rotate` | item leaves the active set; next item from source joins | shelf work out, new work in |
| `pause(n)` | rhythm rests n days | end of a block |
| `close` | rhythm ends; offer the method's successor | block complete |
| `branch(method)` | offer a new rhythm seeded from this one | an outing sparks an interest trail |
| `reschedule` | session moves to the next cadence slot, cursor unchanged | not today |

`turn.pattern` rules look at the last N outcomes for that child on that rhythm (e.g. `repeat ×3`, `none ×3`, `full ×4`). That covers what direction rules did, scoped to the rhythm.

`src/lib/cycle/turn.ts` is one pure function: `(method, state, outcome, history) → { state', nextSessions[], why }`.

---

## 5. Method catalogue (starters)

Outcome labels are the parent-facing buttons. Turn shorthand: `adv` advance · `rep` repeat · `rev` review · `size−` / `size+` · `swap` · `rot` rotate · `pause` · `close` · `branch` · `resch` reschedule.

### 5.1 Charlotte Mason

**`cm.living-book`** — as §3.

**`cm.nature-walk`** · source: a place · cadence 1/week
Steps: "Walk to {place}. Let {child} find one thing." (6+: "Draw it in the nature notebook; you write its name.")
| Outcome | Turn | Why |
|---|---|---|
| Found and named something | adv (same place) | "Same place again — familiar ground rewards a closer look." |
| Looked closely | rep | "Keep returning; naming comes after looking." |
| Wandered | rep + swap(`cm.one-focus`: "find three different leaves") | "One small focus gives attention somewhere to land." |
| Didn't go | resch | — |
Pattern: `named ×4` → branch(`cm.living-book` on a nature book) — "Ready for a book about what they're finding."

**`cm.short-lesson`** · source: a Shelf resource (maths, copywork, phonics) · sizes: 10 · 15 · 20 min
| Outcome | Turn | Why |
|---|---|---|
| Full attention, done | adv | "Short and complete is the goal." |
| Attention drifted | adv + size− | "Stop before attention goes, not after." |
| Ran over | rep + size− | "Split it — two short lessons beat one long one." |
| Stopped early | rep | "Same lesson, fresh mind." |

### 5.2 Classical

**`classical.memory-work`** · source: a list (catechism, poems, facts, skip counting) · cadence daily · items per session: all due reviews + one new when the queue is light
Outcomes are per item, tapped in a quick list.
| Outcome | Turn | Why |
|---|---|---|
| Perfect | rev (next interval) | "Known — review it less often now." |
| With a prompt | rev (same interval) | "Nearly there — same spacing." |
| Not yet | rev (back to daily) + swap(`classical.memory-chant`) | "Put it to a chant; rhythm carries memory." |
Pattern: review queue ≤ 3 due → add one new item. Item at "kept" → moves to the monthly recital list.

**`classical.mastery-lesson`** · source: a Shelf resource in sequence (Math-U-See, Primary Language Lessons…) · cadence daily
| Outcome | Turn | Why |
|---|---|---|
| Mastered | adv | "Mastery first, then the next step." |
| Nearly | rep (practice page) | "One more practice before moving on." |
| Not yet | rep + swap(`classical.reteach`) | "Teach it again a different way." |
Pattern: every 5th session → insert a review of the last mastered lesson.

**`classical.history-story`** · source: a history spine or collection · cadence 2/week
Steps: "Read the story. Ask {child} to tell it back. Place it on the timeline."
| Outcome | Turn | Why |
|---|---|---|
| Told it and placed it | adv | "Story, narration, peg — the three moves of history." |
| Told it | adv + note "add the peg next time" | — |
| Just listened | rep | "Hear it again before moving on." |
Pattern: every 4 sessions → timeline review session.

### 5.3 Montessori

**`montessori.shelf`** · source: a shelf (works, 4–8 active) · cadence: daily work period
Outcomes are per work used today.
| Outcome | Turn | Why |
|---|---|---|
| Repeated it | rep (keep on shelf) | "The repetition isn't finished." |
| Corrected own mistake | rep; pattern: `repeated + corrected` over 2 sessions → adv (present the next work in sequence) | "The work taught them. Time for the next difficulty." |
| Brief, moved on | rep | — |
| Not chosen this week | rot (after 2 weeks) | "Rotate it out; it can come back." |

**`montessori.presentation`** · source: a vocabulary or concept set · cadence 3/week
Steps: "This is ___. Show me ___. What is this?"
| Outcome | Turn | Why |
|---|---|---|
| Named it (third period) | adv | "They own the word." |
| Could point to it (second period) | rep (start at second period) | "More 'show me' before 'what is this'." |
| First period only | resch (different time) | "Try again on a fresh day." |

**`montessori.practical-life`** · source: a task list (pouring, spooning, sweeping, food prep) · cadence daily
| Outcome | Turn | Why |
|---|---|---|
| Did it independently | adv | "Independent — add the next step or a new task." |
| With a little help | rep | — |
| I did most of it | rep + size− (break into a smaller step) | "Smaller steps they can own completely." |

### 5.4 Waldorf / Steiner

**`waldorf.main-lesson-block`** · source: a block (theme, 3–4 weeks, a day sequence) · cadence 4–5/week
Steps follow a three-day rhythm per topic: day 1 story · day 2 recall and draw or model · day 3 verse, movement, lesson book.
| Outcome | Turn | Why |
|---|---|---|
| Lived in it | adv | "The picture took hold." |
| Joined in | adv | — |
| Restless | rep + swap(`waldorf.add-movement`) | "Bring it into the body first." |
Pattern: block end → close + pause(14) on the theme, offer the next block — "Let it rest. It comes back deeper after forgetting."

**`waldorf.daily-rhythm`** · source: a verse/song set for the season or block · cadence daily
| Outcome | Turn | Why |
|---|---|---|
| Joined fully | rep (same verse) | "Repetition is the point." |
| Partly | rep | — |
| Resisted | rep; pattern `resisted ×3` → swap time of day | — |
Pattern: same verse 3 weeks → adv (next verse) — "Time for a new verse."

**`waldorf.handwork`** · source: a project sequence (finger knitting → knitting → …) · cadence 2/week
| Outcome | Turn | Why |
|---|---|---|
| Worked steadily | rep (continue project) | — |
| A little | rep | — |
| Set it aside | rep; pattern ×2 → size− (simpler step) | "A simpler step keeps the hands willing." |
| Finished | adv (next project) | "Finished work, then the next." |

### 5.5 Unschooling

**`unschool.strewing`** · source: a strew list · cadence: weekly refresh
| Outcome | Turn | Why |
|---|---|---|
| Dived in | adv (strew something deeper) + branch(`unschool.interest-trail`) | "That's a lead. Follow it." |
| Picked it up | rep (leave it out) | — |
| Ignored | rot (after a week) | "No harm done — try something else." |

**`unschool.interest-trail`** · source: an interest · cadence: weekly check-in
Steps: "Check in on {interest}. What are they doing with it?"
| Outcome | Turn | Why |
|---|---|---|
| Still hot | adv + swap(`unschool.find-out-together` / `unschool.connect-to-a-doer`, alternating) | "Feed it — a book, a person, better tools." |
| Cooling | rep | "Leave the resources around." |
| Moved on | close | "Interests end. Notice what's next." |

**`unschool.outing`** · source: an outing list · cadence 1/week
| Outcome | Turn | Why |
|---|---|---|
| Sparked something | branch(`unschool.interest-trail`) | — |
| Pleasant | adv | — |
| Flat | adv | — |

### 5.6 Eclectic

No methods of its own. Onboarding offers starters from the traditions the parent ticks, and any rhythm can pick any method. The week shape combines the checks of every tradition in use.

---

## 6. Week shape — pedagogy in planning

Run when the parent opens **Week** and when "Turn the week" runs. Each check is a query over planned sessions; each flag has a one-tap fix (usually: add a starter rhythm or move a session).

| Tradition | Checks | Fix |
|---|---|---|
| Charlotte Mason | lessons ≤ 20 min each and morning-only · no subject twice in a day · a nature walk this week · ≥ 5 different subject areas across the week (the feast) | add `cm.nature-walk` · split · move |
| Classical | memory work every weekday · review queue < 15 due · mastery lessons on ≥ 4 days · history ≥ 2 | add/move · "pause new items until reviews catch up" |
| Montessori | one protected work period each weekday · shelf has works from ≥ 3 areas · ≤ 2 new presentations a day | protect a block · add a work · spread presentations |
| Waldorf | daily rhythm every day · one main lesson block active · each day has a breathing-out session after a breathing-in one · handwork this week | add · reorder |
| Unschooling | ≥ 1 outing · strew list refreshed · **≤ 3 fixed sessions** ("this is starting to look like school") | add outing · remove a session |

---

## 7. Screens

| Screen | What it is | Time |
|---|---|---|
| **Today** (home) | Sessions due today, one card each: rhythm · item · step · outcome buttons. Plus "Capture a moment". | — |
| **Log a session** | Tap an outcome per child on the card. Optional: the method's `ask` note, photo. Save. | ≤ 20 s |
| **Turn** (post-save) | "Next: {step} · {day}" + `why` · DLO chips if declared · nothing else. | ≤ 15 s |
| **Week** | Seven days of sessions; drag to move, swipe to skip; week-shape flags at top. | browse |
| **Turn the week** (Sunday/Monday prompt) | Last week's outcomes in one line per rhythm · untapped sessions to mark · next week laid out · ≤ 2 week-shape flags · one optional suggestion. | ≤ 5 min |
| **Rhythm** | The rhythm note (§2). Change source, cadence, method; pause; close. | — |
| **Capture a moment** | The spontaneous Logger (seven fields). Post-save offers **attach** to a due session or **branch** into a rhythm (from the signal → method map, §8). | ≤ 3 min |

---

## 8. Spontaneous moments in the cycle

The pedagogy layer v1 signal tables stay, with one change: each signal's `move` now points at a **method**, not just a practice.

| Signal (CM family example) | Post-save offer |
|---|---|
| `nature` | Attach: "Count this as Friday's nature walk?" — or branch: "Make the creek a fortnightly nature walk?" |
| `story` | Branch: "Start a living-book rhythm with this book?" |
| `question` | (Unschooling) Branch: "Start an interest trail on {thread}?" |
| `repetition` | (Montessori) Branch: "Put this on the shelf?" |
| `recall` | (Classical) Attach: "Add to memory work?" |

So a moment either strengthens a rhythm already running or seeds the next one. The post-save for spontaneous moments becomes: **What this showed** (DLO) · **Next** (attach / branch, with `why`) · **Hold back** (if any) · DLO chips.

---

## 9. Getting parents onto the cycle

**Onboarding (≤ 5 min):**
1. Children and ages (existing).
2. "Which approaches do you lean on?" — tick one or more of the six.
3. "Pick two or three to start" — starter cards from the ticked traditions, each one line ("Living book — one good book, a little at a time").
4. For each: attach a source — pick from the Shelf, type a book title and chapter count, choose a memory list template (e.g. Westminster Shorter Catechism Q1–20 for the Jumpstart Classical pack), or name an interest/place.
5. Set days. Today and Week are populated.

**Staying on it:**
- Today is the home screen; every card is a one-tap log.
- "Turn the week" is the single weekly ritual.
- A rhythm missed 3 times prompts: "Rest it, change days, or close it?" — never a guilt streak.
- After 2 weeks, the week shape offers one new starter if a tradition check is consistently unmet.

---

## 10. Separation from the Constellation

| | Rhythms (apply) | Constellation (track) |
|---|---|---|
| Question | How are we doing this, and what's next? | What has my child learned? |
| Unit | session, outcome, method | DLO link, band, thread |
| Driven by | method turns | confirmed links |
| Reads | rhythm history, method notes | `moment_links` |
| Writes | next sessions | nothing |
| Pedagogy | everywhere | nowhere |

The only bridge: a session's unit with declared targets produces DLO chips on the Turn screen. Confirmed chips feed the Constellation. The Constellation may offer "start a rhythm" from its look-next; it never changes a rhythm.

---

## 11. Data model

**Sanity:** `knowledgeNote.kind` adds `method` (§3 shape). Practice notes are referenced by `swap`. List templates (catechism, skip counting, poems) are `collection` docs with `kind: list`.

**Postgres:**

| Table | Fields |
|---|---|
| `rhythms` | id, family_id, learner_ids[], method_id, title, source JSONB, cadence JSONB, status, rest_until, created_at |
| `rhythm_state` | rhythm_id, learner_id, cursor, size, active_set JSONB, review_queue JSONB, missed |
| `sessions` | id, rhythm_id, due_on, item_ref, step JSONB, status (planned · done · skipped · moved), moment_id |
| `moments` | + rhythm_id, session_id, outcome JSONB (per child), item_ref |

**Code:** `src/lib/cycle/turn.ts` (pure), `schedule.ts` (cadence → dates), `weekshape.ts` (checks per tradition), `starters.ts` (onboarding). Zero model calls anywhere in the cycle.

**Index:** methods in `knowledge.json`. Golden set adds turn fixtures: `(method, state, outcome, history) → expected next`.

---

## 12. Worked example — a Classical family, one week

Sam (5) and Ivy (3). Rhythms: `classical.memory-work` (Sam, catechism Q1–20, daily), `classical.mastery-lesson` (Sam, Math-U-See Primer, daily), `waldorf.daily-rhythm` (both, a spring verse — they're eclectic-leaning).

**Monday, Today:** three cards.
- Memory work: due Q1 (rev), Q2 (rev), Q3 (new). Taps: Q1 Perfect → next review in 3 days. Q2 With a prompt → stays at 1 day. Q3 Not yet → daily + "Put it to a chant" on tomorrow's card.
- Math-U-See Lesson 6: Nearly → Tuesday's card: "Lesson 6 practice page D." Why: "One more practice before moving on."
- Spring verse: Joined fully (both) → same verse tomorrow.
Log time: about 40 seconds total.

**Turn the week (Sunday):** Lesson 6 → 7 → 8 mastered; Q1–3 in review, Q4 new Friday; verse in week 2 of 3. Week-shape: Classical — "History hasn't started. Add a history story rhythm?" One tap → `classical.history-story` on Tue/Thu with the Jumpstart pack's history collection. Waldorf (in use) — "No handwork this week." Parent dismisses.

**Wednesday, spontaneous:** creek moment (as before). Signals `nature`, `repetition`, `named`. Classical family → `named` → attach offer: "Add 'skipping stone, surface' to memory work?" Tap → two new list items join Sam's queue. DLO chip S5-02 → Constellation.

Every next step was written by a turn. Nothing was planned from a blank page, and nothing was generated.

---

## 13. Expo scope (9 Nov)

In: Today, Log a session, Turn, Rhythm note, onboarding starters, the ten actions, all methods in §5 as data, spontaneous attach/branch. Week view without drag (list only). Week-shape checks for the three traditions most likely at the stand (CM, Classical, Eclectic-combined).
After: drag-to-move, remaining week-shape checks, the 2-week starter nudge.

This is mostly data and one pure function; the screens replace the Planner rather than adding to the app. It does add scope inside an already full window, so it replaces handoff S5's Dashboard work (Today *is* the dashboard) and S6's `/ask`.

---

## 14. Propagation

| Target | Action |
|---|---|
| Project rule "Retrospective logging is the core interaction…" | Reword per C14. |
| `hearth-notes-architecture-v1.md` | D1 three notes → D46; §8 Planner and Dashboard rows → Today/Week/Rhythm. |
| `hearth-pedagogy-layer-v1.md` | §7 block 2 removed; §8 direction rules folded into method `turn.pattern` and week shape; signal `move` points to methods. |
| `hearth-notes-handoff-plan-v1.md` | → v2: S2 adds `rhythms`, `rhythm_state`, `sessions`; S3 adds `turn.ts`, `schedule.ts`; S4 becomes Today · Log a session · Turn · Capture; S5 Dashboard replaced by Today; S6 `/ask` deferred; authoring adds ~15 method notes and list templates. |
| `decisions.md` | Add D46–D55 and the C14 resolution. |
| `COMPONENT_REGISTRY.md` | New: Today, Week, Rhythm, Turn the week (spec: this doc). Retired: Planner, Dashboard. |

---

## 15. Needs your confirmation

| # | Question | Default |
|---|---|---|
| C14 | Refine the locked principle to: "Logging is the core act. Every log produces the next step; planning is what logging produces, never a blank page." | Proceed |
| C15 | Rhythm becomes the third parent-facing note; Planner and Dashboard are replaced by Today and Week. | Proceed |
| C16 | Remove the "through your lens" reading; each next step carries a one-line `why` instead. | Proceed |
| C17 | Onboarding ends with starter rhythms (skippable, but Today nudges until one exists). | Proceed |
| C18 | Name: "Rhythm" — common in homeschool language, though Waldorf-flavoured. Alternatives: "Routine", "Thread of practice", "Line". | Rhythm |
