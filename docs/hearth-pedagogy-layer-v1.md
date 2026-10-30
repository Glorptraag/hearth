# Hearth — Pedagogy Layer v1

<!-- Version: 1 | Date: 2026-10-20 | Changes: initial. Replaces Pass 3 of hearth-notes-architecture-v2.md (§4, D19–D21) and removes per-DLO variants. Pedagogy moves off the DLO and onto a shared set of moment signals. Six traditions authored in full (§5). Logger capture, post-save insight and ongoing direction re-specified (§6–§8). -->

> **One line:** Traditions mostly agree on *what* children learn. They disagree on *how* learning shows, what it means, what to do next, what to avoid, and what rhythm to keep. So Hearth reads **what** from the DLO (neutral, shared) and **how** from a small set of **moment signals**. Each tradition is a table over those signals. Insight is a lookup in that table. No model, no corpus at runtime.

---

## 0. Decisions log

| # | Decision | Reverses |
|---|---|---|
| D36 | Two axes on every moment: **what** (DLO links — tracked, reported) and **how** (signals — read through the family's tradition). Pedagogy only ever reads the *how* axis. | v2 D19: pedagogy as variant blocks on DLO and opportunity notes |
| D37 | **17 moment signals** (§3) are the shared vocabulary between moments and traditions. Detected by the same typed-cue machinery as DLOs, at zero calls. New `knowledgeNote` kind: `signal`. | — |
| D38 | A **tradition note** is a full spec across six dimensions: stance · capture ask · stages · signal table (weight, reading, move, hold back) · direction rules · balance map. | v2 tradition note (evidence, nextBias, practices only) |
| D39 | DLO notes are **neutral only**. `variants` removed from DLO and opportunity notes. DLO gains a neutral `showed`. | v2 D19, §4.3 |
| D40 | The Logger's `said` field becomes **`lens`**: one per-child prompt worded by the family's tradition. Field count stays seven. | v1 §4.1 `said` |
| D41 | Post-save insight is five fixed blocks in a fixed order (§7). Each block has exactly one source. | v2 §3.4 |
| D42 | Ongoing direction is **seven rule kinds** in code, enabled and parameterised per tradition, with authored copy (§8). The weekly review and thread `watching` read them. | v2 D18 (watching from DLO only) |
| D43 | Stage is computed from the child's age at the moment and changes weights, readings and holds per tradition. | — |
| D44 | **Eclectic** reads every tradition's table and shows the strongest fit for that moment, named. | v2 D21 (Eclectic as flat bias) |
| D45 | Traditions are described by their methods in Hearth's own words. Methods aren't owned; no source text is quoted or retrieved. The corpus docs are retired, not demoted. | Corpus as author reference |

---

## 1. Rationale

**Why v2's pedagogy was weak.** Variants sat on the DLO, so a tradition could only *reword* what the DLO already said. Charlotte Mason and Montessori would both say "your child compared things by a property", in different vocabulary. That is the vocabulary substitution the locked learnings rule out. It also meant 171 DLOs × 6 traditions of authoring, most of it thin.

**Where pedagogy actually operates.** A tradition is not a vocabulary. It changes five things:

| Point | Question it answers | Where it lands in Hearth |
|---|---|---|
| Notice | What should I have been watching for? | the Logger's `lens` prompt |
| Read | What does this moment mean in our approach? | post-save "through your lens" |
| Move | What do I do next time? | post-save "next time" |
| Hold back | What should I *not* do? | post-save "hold back" |
| Rhythm | What should happen over the next weeks? | thread `watching`, weekly review |

**Why signals.** Every one of those five depends on *how* the learning happened — did they repeat it, tell it back, start it themselves, make something, imagine something. Those features are observable, finite and tradition-neutral. Each tradition values them differently and responds to them differently. A 17 × 6 table captures that difference far more truly than 171 × 6 rewrites, and it is computable from cues.

**Why stage.** Several traditions are developmental at their core. Waldorf under seven and Waldorf at nine give different advice about the same moment; Classical grammar stage and logic stage do too. Ignoring age is the fastest way to give advice a practitioner would reject.

**What stays the same.** DLOs, bands, threads, the Constellation and the Report are untouched and tradition-free. The record is neutral; the reading is personal.

---

## 2. How it fits the notes architecture

```
Moment ─Resolve─▶ DLO links (what)        ─▶ Confirm ─▶ Thread notes, Report, Constellation
        │
        └───────▶ signals per child (how) ─▶ tradition table ─▶ read · move · hold back
                                                  │
                         moment history ─▶ direction rules ─▶ watching · weekly review
```

Same Resolve pass, same index, same zero-call path. Signals are not confirmed (they never enter the record); the parent can untick one.

---

## 3. The 17 moment signals

| ID | Signal | Detected from (examples, not exhaustive) |
|---|---|---|
| `attention` | Stayed with it, absorbed | "ages", "wouldn't stop", "so focused", "an hour", `felt: absorbed` |
| `repetition` | Did it again by choice | "again", "kept", "over and over", "ten times", "every day this week" |
| `selfcorrect` | Noticed and fixed their own mistake | "fixed", "realised", "tried another way", "no wait", "rubbed out" |
| `initiated` | Started it themselves | "on his own", "asked to", "wanted to", "found", "decided", no `workingFrom` + "he/she" subject |
| `question` | Asked why / how / what | "?", "asked", "why does", "how come", "wondered" |
| `toldback` | Told it back in their own words | "told me", "explained to", "narrated", "retold", `lens` answer present (CM, Classical) |
| `reason` | Gave a cause or reason | "because", "so that", "that's why", "if … then" |
| `recall` | Remembered, recited, said from memory | "remembered", "recited", "knew all", "said the whole", "from memory" |
| `named` | Used the right word, sorted into kinds | "called", "the word for", "sorted", "the [x] ones", "named" |
| `made` | Built, drew, crafted something | "made", "built", "drew", "painted", "knitted", "constructed" |
| `imagined` | Pretend play, invented story or role | "pretended", "was a", "game where", "made up", "story about" |
| `nature` | Outdoors or with living things | creek, garden, bugs, birds, beach, weather, plants, walk |
| `movement` | Whole-body, rhythm, song | ran, climbed, threw, danced, sang, clapped, balance |
| `persisted` | Kept going through difficulty | "frustrated but", "kept trying", "didn't give up", "hard" |
| `together` | With others, or taught someone | sibling, friend, "showed", "taught", "together", co-op |
| `story` | Heard or read a story or book | read, book, chapter, story, audiobook, "listened to" |
| `practical` | Real work of the household | cooked, baked, washed, folded, fed, planted, swept, shopped |

Detection: typed cues (`do`, `say`, `things`, `not`) on each `signal` note, scored exactly like DLO cues (v2 §2.1), threshold **3**. Structural sources add directly: `felt: absorbed` → `attention`; a `lens` answer → the tradition's `lensSignal`; no `workingFrom` and a child as sentence subject of the opening verb → `initiated` +2. Family cues learn signals the same way they learn DLOs. When the one Propose call runs, it may return up to two signal IDs from this fixed list (≈80 extra tokens).

---

## 4. The tradition note standard

```yaml
id: tradition.cm
title: Charlotte Mason
stance:          # one sentence each, shown on the family's profile page
  child: …
  adult: …
  learning: …
lens:            # the Logger's per-child prompt
  prompt: "What did they tell back, in their own words?"
  signal: toldback
stages:          # age → stage key; per-cell overrides use these keys
  - { key: early, from: 0, to: 6 }
  - { key: formal, from: 6, to: 99 }
signals:         # only signals this tradition genuinely weights (≥2). Silence is valid.
  nature:
    weight: 3
    read: "…"            # one sentence, may use {child}
    move: practice.cm.return-to-the-place
    hold: "…"            # optional
    stage: { early: { read: "…", move: …, hold: "…" } }   # optional overrides
rules:           # direction rules enabled for this tradition (§8)
  - { kind: return, params: {…}, copy: "…" }
balance:         # the tradition's own map of a full education, signal → group
  groups: …
nextBias: [ … ]  # opportunity mode order for look-next
```

Validation (adds to v2 §5.1): `lens.signal` ∈ signals; every `move` resolves to a practice note; every stage key in an override exists; `read` ≤ 30 words; `hold` ≤ 25 words; at least 6 signals at weight ≥ 2.

Practice notes keep v2's shape (`plain`, `how`, `ask`, `fits`) and add `stages` (where suitable).

---

## 5. The six traditions

Readings are written for the parent, in the one Hearth voice. Moves point to practice notes (§5.7). Only weighted signals appear; an absent signal means the tradition has nothing distinctive to say and the neutral DLO copy carries the moment.

### 5.1 Charlotte Mason

**Stance.** The child is a whole person, born with a mind able to take in real ideas. The adult supplies an atmosphere, good habits and living ideas, then gets out of the way. Learning is the child forming their own relation with real things, people and great books.
**Lens prompt.** "What did they tell back, in their own words?" → `toldback`
**Stages.** `early` 0–6 (outdoor life, habits, stories; no formal lessons) · `formal` 6+ (short lessons, narration, copywork, nature notebook).

| Signal | W | Read | Move | Hold back |
|---|---|---|---|---|
| `toldback` | 3 | {child} did the work of knowing — the idea went in once and came back out in their own words. | `cm.narration` | Don't correct the telling. A wrong detail now is fixed by the next reading, not by you. |
| `attention` | 3 | Full attention on a real thing is the habit every other lesson rests on. | `cm.short-lesson` | Stop while attention is still full, not when it fades. |
| `nature` | 3 | First-hand acquaintance with a real place — the kind of knowing no book can give. | `cm.return-to-the-place` · formal: `cm.nature-notebook` | Don't explain what they found. Let them keep the discovery. |
| `story` | 3 | A living book is feeding them ideas, not just facts. | `cm.read-once` | One reading, no summary from you, no questions until they've told it back. |
| `question` | 2 | An idea has taken hold and is asking for more. | `cm.masterly-inactivity` | Answer briefly or point to the thing itself. A lecture smothers the question. |
| `practical` | 2 | Daily work done well is how habits are laid. | `cm.one-habit` | Choose one habit at a time. |
| `made` | 2 | Handicraft that produces something real and useful, done carefully. | `cm.handicraft-well` | Quality over quantity — one careful piece beats three rushed. |
| `recall` | 2 | Beautiful words held by heart — poetry, verse, scripture. | `cm.recitation` | Recitation is for beautiful words, not drilled facts. |

Stage overrides — `early`: `nature` move → `cm.return-to-the-place` only; `toldback` read → "At this age the telling is play — that it happened at all is the point."; `story` hold → "Read, don't teach."

### 5.2 Classical

**Stance.** Children move through three stages of mind — absorbing (grammar), arguing (logic), expressing (rhetoric). The adult leads a sequential, language-rich curriculum and builds the foundations in order. Learning is ordered knowledge, precisely named, mastered, then reasoned with.
**Lens prompt.** "What did they recall, name or say accurately?" → `recall`
**Stages.** `pre` 0–6 · `grammar` 6–10 · `logic` 10–14 · `rhetoric` 14+.

| Signal | W | Read | Move | Hold back |
|---|---|---|---|---|
| `recall` | 3 | {child} is storing pegs of knowledge — what's held now is what they'll reason with later. | `classical.memory-work` | Review before adding more. |
| `named` | 3 | Precise words and clear kinds — the grammar of a subject being laid down. | `classical.proper-term` | Use the real word, not a cute one. |
| `toldback` | 2 | Narration is the start of composition. | `classical.narration-to-copywork` | — |
| `repetition` | 2 | Practice toward mastery. | `classical.mastery-first` | Don't move on until it's automatic. |
| `persisted` | 2 | Diligence — a habit of work that the whole curriculum depends on. | `classical.hold-the-standard` | Praise the effort, keep the standard. |
| `story` | 2 | A great story is also a place in history. | `classical.timeline-peg` | — |
| `question` | 2 | Curiosity is a hook to hang a fact on. | `classical.answer-with-a-peg` | Give the fact; save the debate for later. |
| `reason` | 2 | A reason given — logic-stage thinking arriving. | `classical.answer-with-a-peg` | — |

Stage overrides — `logic`: `reason` weight 3, read "{child} is ready to argue — that's the logic stage arriving.", move `classical.socratic`; `question` move `classical.socratic`. `pre`: `recall` read "Songs, rhymes and chants are how this age stores things."; move `classical.memory-chant`.

### 5.3 Montessori

**Stance.** The child constructs themselves through purposeful work in a prepared environment. The adult observes, prepares the environment, presents briefly and steps back. Learning shows as concentration, repetition, independence and self-correction.
**Lens prompt.** "Did they repeat it, or fix a mistake on their own?" → `repetition`
**Stages.** `first` 0–6 (absorbent mind, sensorial, practical life) · `second` 6–12 (reasoning mind, imagination, the big picture).

| Signal | W | Read | Move | Hold back |
|---|---|---|---|---|
| `attention` | 3 | Deep concentration — the clearest sign the work matches what {child} needs right now. | `montessori.protect-the-work` | Don't interrupt, not even to praise. |
| `repetition` | 3 | Repeating by choice is how mastery forms on the inside. | `montessori.shelf-it` | Let them stop when they're done, not when you are. |
| `selfcorrect` | 3 | The work itself told them it was wrong — that's independence. | `montessori.next-in-sequence` | Don't correct. If something needs fixing, it's the material, not the child. |
| `practical` | 3 | Real work builds coordination, order and independence. | `montessori.child-sized` | Don't do for them what they can do themselves. |
| `initiated` | 2 | Free choice — {child} picked the work that called to them. | `montessori.observe-then-add` | Watch before you offer. |
| `named` | 2 | New words are best given in three clear steps. | `montessori.three-period` | Few words. |
| `movement` | 2 | Hand and mind develop together. | `montessori.purposeful-movement` | — |
| `nature` | 2 | The living world is part of the prepared environment. | `montessori.cultural-tray` | — |

Stage overrides — `second`: `question` weight 3, read "The reasoning mind wants the whole story of how things came to be.", move `montessori.big-picture`; `together` weight 2, read "At this age work is social.", move `montessori.small-group-work`.

### 5.4 Waldorf / Steiner

**Stance.** Head, heart and hands develop in three seven-year phases: willing (imitation, play), feeling (imagination, pictures), thinking. The adult models work worth imitating and keeps the rhythm. Learning lives first in the body and the imagination, and only later in concepts.
**Lens prompt.** "What did they make or play, and how did they seem?" → `made`
**Stages.** `first` 0–7 · `second` 7–14 · `third` 14+.

| Signal | W | Read | Move | Hold back |
|---|---|---|---|---|
| `imagined` | 3 | Imaginative play is {child}'s thinking at this age — it lives in pictures. | `waldorf.open-ended-things` | Don't steer the play or add a lesson to it. |
| `made` | 3 | Hands at work — the will being educated. | `waldorf.handwork` | Don't fix their work for them. |
| `movement` | 3 | Rhythm and movement carry learning into the body. | `waldorf.verse-and-movement` | — |
| `nature` | 3 | Connection to the season and the living world. | `waldorf.nature-table` | — |
| `practical` | 3 | Imitating meaningful adult work is how this age learns. | `waldorf.work-alongside` | Model, don't instruct. |
| `story` | 3 | A told story gives the picture they'll live inside for days. | `waldorf.tell-it-again` | Tell, don't read; don't ask what it meant. |
| `attention` | 2 | Absorbed — the breathing-in part of the day. | `waldorf.rhythm-anchor` | Balance it with a breathing-out activity. |
| `reason` | 1 | (see stage overrides) | — | — |

Stage overrides — `first`: `reason` read "{child} found an answer in their own body. At this age that's where it should stay for now.", hold "Don't explain the why. Let the question live."; `question` hold "Answer with a picture or a story, not an explanation." · `second`: `reason` weight 2, read "Understanding now arrives through pictures and stories first.", move `waldorf.main-lesson-picture`.

### 5.5 Unschooling

**Stance.** Children learn by living, following what they care about. The adult trusts, provides access and resources, and stays available. Learning shows as self-chosen pursuit, real questions and depth of interest.
**Lens prompt.** "What were they chasing, and where did it lead?" → `initiated`
**Stages.** none.

| Signal | W | Read | Move | Hold back |
|---|---|---|---|---|
| `initiated` | 3 | {child} chose this — the most reliable kind of learning there is. | `unschool.strew` | Don't turn it into a lesson. |
| `question` | 3 | A real question is a lead worth following. | `unschool.find-out-together` | Answer honestly; don't quiz back. |
| `practical` | 3 | Real life is the curriculum. | `unschool.real-responsibility` | — |
| `persisted` | 2 | Motivation from the inside — the kind that lasts. | `unschool.stay-available` | Don't rescue. |
| `repetition` | 2 | An interest deepening. | `unschool.better-tools` | — |
| `together` | 2 | Learning through people who actually do this. | `unschool.connect-to-a-doer` | — |
| `made` | 2 | Making is thinking. | `unschool.better-tools` | — |
| `imagined` | 2 | Play is how they work things out. | `unschool.stay-available` | — |

### 5.6 Eclectic

**Stance.** The family draws on whatever works for this child, this week.
**Lens prompt.** "What worked today, and why do you think it did?" → none (cues only)
**Rule.** For each detected signal, take the highest weight across the other five traditions (stage-adjusted). The winning cell supplies read, move and hold, prefixed: "This reads most like a {tradition} moment." Ties prefer the family's `secondary` tradition if set.
**Rules.** Runs every tradition's direction rules and shows the top-scoring one (§8).

### 5.7 Practice notes (≈40)

| ID | Plain |
|---|---|
| `cm.narration` | After one reading or look, ask them to tell it back. Listen without correcting. Write one line of what they said. |
| `cm.short-lesson` | Keep it to 10–15 minutes and stop while they're still keen. |
| `cm.return-to-the-place` | Go back to the same spot within two weeks. Familiar places reward a closer look. |
| `cm.nature-notebook` | They draw one thing they saw, from life, and you write its name. |
| `cm.read-once` | Read the next passage once, straight through. Then ask them to tell it. |
| `cm.masterly-inactivity` | Say less. Point to the thing or a good book and let them find out. |
| `cm.one-habit` | Name one habit and practise it every day for six weeks. |
| `cm.handicraft-well` | One useful thing, made carefully, finished properly. |
| `cm.recitation` | Choose a short poem; read it aloud daily until they say it with you. |
| `classical.memory-work` | Add it to the memory list. Review daily this week, weekly this month. |
| `classical.memory-chant` | Put it to a tune or a chant and sing it together. |
| `classical.proper-term` | Give the precise word, have them say it, write or copy it. |
| `classical.narration-to-copywork` | Take one sentence of their narration and have them copy it neatly. |
| `classical.mastery-first` | Practise until it's automatic, then move on. |
| `classical.hold-the-standard` | Keep the expectation. Name the effort you saw. |
| `classical.timeline-peg` | Place it on the family timeline. |
| `classical.answer-with-a-peg` | Answer with one clear fact they can hold. |
| `classical.socratic` | Ask them to defend it. Offer a counterexample and see what they do. |
| `montessori.protect-the-work` | Leave the same work available and protect an uninterrupted stretch for it. |
| `montessori.shelf-it` | Set it up on a low shelf on a tray, complete and ready, so they can return without asking. |
| `montessori.next-in-sequence` | Offer the next material — one that isolates one new difficulty. |
| `montessori.child-sized` | Give real, child-sized tools and show the steps slowly, with few words. |
| `montessori.observe-then-add` | Watch for a few days, then add one related thing to the shelf. |
| `montessori.three-period` | "This is ___." "Show me ___." "What is this?" — over separate moments. |
| `montessori.purposeful-movement` | Give the movement a purpose — carrying, pouring, walking a line. |
| `montessori.cultural-tray` | A tray with real objects from the topic for sorting and naming. |
| `montessori.big-picture` | Tell the big story of how this came to be, then let them research a piece of it. |
| `montessori.small-group-work` | Let them do it with a sibling or friend. |
| `waldorf.open-ended-things` | Simple natural materials — cloths, wood, stones — that can become anything. |
| `waldorf.handwork` | A small handwork project carried over several days. |
| `waldorf.verse-and-movement` | A short verse or song with movement for this theme, said daily. |
| `waldorf.nature-table` | Bring a few finds home for the season's nature table. |
| `waldorf.work-alongside` | Do the real task yourself, slowly and well, and let them join in. |
| `waldorf.tell-it-again` | Tell the story again tomorrow, the same way. They may draw it after. |
| `waldorf.rhythm-anchor` | Give this activity a regular place in the week. |
| `waldorf.main-lesson-picture` | Bring the idea as a story or picture, then let them draw it into a lesson book. |
| `unschool.strew` | Leave something related where they'll find it. Say nothing. |
| `unschool.find-out-together` | Find out together — a book, a video, someone who knows. |
| `unschool.real-responsibility` | Hand them a real piece of it to own. |
| `unschool.stay-available` | Stay close and interested. Help only when asked. |
| `unschool.better-tools` | Get better tools or materials for the thing they keep coming back to. |
| `unschool.connect-to-a-doer` | Find a person who does this for real and visit or call. |

Each practice note carries `how` (2–3 steps), `ask` (one question for the parent to use) and `stages`.

---

## 6. Capture — where pedagogy shapes noticing

The Logger keeps seven fields (v1 §4.1). `said` becomes **`lens`**: one short field per child, labelled with the family tradition's prompt.

| Tradition | Field label | Feeds |
|---|---|---|
| Charlotte Mason | What did they tell back, in their own words? | `toldback` + DLO cues |
| Classical | What did they recall, name or say accurately? | `recall` + DLO cues |
| Montessori | Did they repeat it, or fix a mistake on their own? | `repetition` / `selfcorrect` cues |
| Waldorf | What did they make or play, and how did they seem? | `made` / `imagined` cues |
| Unschooling | What were they chasing, and where did it lead? | `initiated` / `question` cues |
| Eclectic | What worked today, and why do you think it did? | cues only |

Over weeks, the prompt trains the parent's eye toward what their tradition values — which is itself the pedagogy working. Optional; never required; adds no time if skipped.

---

## 7. Post-save — where pedagogy shapes insight

Five blocks, fixed order, one source each. Any block with no source is omitted.

| # | Block | Source | Example (creek, Montessori) |
|---|---|---|---|
| 1 | **What this showed** | DLO neutral `showed` (or `deepened` on repeat) | "Sam noticed a difference between things and worked out what causes it." |
| 2 | **Through your lens** | tradition `signals[top].read` (stage-adjusted) | "Repeating by choice is how mastery forms on the inside." |
| 3 | **Next time** | `practice[move].plain` + "Look for: " DLO `toNext[band].sign` | "Set it up on a low shelf on a tray… Look for: he names the property — 'the flat ones'." |
| 4 | **Hold back** | tradition `signals[top].hold` | "Let them stop when they're done, not when you are." |
| 5 | **Look next** | DLO `next` → family library opportunities, ranked by tradition `nextBias` | up to 3 cards |

**Top signal** = detected signal with the highest tradition weight (stage-adjusted); ties broken by the order in the tradition's table. If no detected signal carries weight ≥ 2, blocks 2 and 4 are omitted and block 3 uses the DLO's neutral `toNext.try`.

Blocks 1 and 3's "Look for" carry the curriculum direction. Blocks 2, 3's practice and 4 carry the pedagogy. Each is a separately authored sentence, so nothing is templated beyond `{child}`.

---

## 8. Over time — where pedagogy shapes direction

Seven rule kinds, written once in `src/lib/notes/direction.ts`, each a query over `moments`, `moment_links` and `moment_signals`. A tradition enables the kinds it believes in, sets parameters, and supplies copy.

| Kind | Fires when | Output |
|---|---|---|
| `return` | a thread or signal has had no moment for ≥ N days after a confirmed one | go back to it |
| `review` | a DLO with `recall` evidence hasn't recurred for N days | review it |
| `advance` | a DLO meets the tradition's readiness condition | move to `next` |
| `stay` | repetition without the readiness condition | keep it available |
| `rest` | a thread has had moments on ≥ N of the last M days | let it rest |
| `balance` | a balance group's share of moments over 14 days < X% | bring in the missing group |
| `follow` | `initiated` on ≥ N moments in one thread within 21 days | follow the interest |

| Tradition | Enabled rules (params → copy) |
|---|---|
| Charlotte Mason | `return` (nature/story, 14d) → "It's been a while since the {thread} — go back to the same place." · `rest` (same thread 8 of 10 days) → "Vary the feast — a different subject tomorrow keeps attention fresh." · `balance` (groups: books, nature, handicraft, music/art, maths/language; any group 0 in 14d) → "Nothing from {group} lately — the feast is meant to be wide." |
| Classical | `review` (recall DLOs, 7d / 28d) → "Time to review {dlo} — what's reviewed is what's kept." · `advance` (DLO at demonstrating on 2 days) → "{dlo} is mastered. Ready for {next}." · `stay` (repetition, not yet demonstrating) → "Keep practising {dlo} before adding more." |
| Montessori | `advance` (repetition ≥3 + selfcorrect on the DLO) → "{child} has mastered this — offer {next}." · `stay` (repetition, no selfcorrect) → "Keep it on the shelf; the repetition isn't finished." · `follow` (initiated ≥3 in 21d) → "{child} keeps choosing {thread} — add one new piece of work there." · `balance` (practical life, sensorial, language, maths, cultural; any 0 in 14d) → "No {group} work lately — put something on the shelf." |
| Waldorf | `balance` (head: named/reason/recall; heart: story/imagined/together; hands: made/practical/movement; any < 20% in 14d) → "A {group}-heavy fortnight — bring in some {missing}." · `rest` (same thread 20 of 28 days) → "This block has had its time. Let it rest; it will come back deeper." · `return` (nature, 7d) → "Back outside — the season's moved on." |
| Unschooling | `follow` (initiated ≥2 in 21d) → "{child} keeps coming back to {thread}. Strew something new there." · `return` (a followed thread silent 21d) → "{thread} has gone quiet — leave something from it lying around." |
| Eclectic | all of the above; shows the highest-scoring firing, named by tradition |

**Thread `watching`** = DLO `toNext[band].sign` (neutral) + any rule firing on that thread (tradition). **Weekly review** = the three highest-priority firings across the child's threads + unconfirmed chips. Priority: `advance` > `follow` > `stay` > `review` > `return` > `balance` > `rest`.

---

## 9. Worked example — the creek, Sam, age 5, six families

Moment: *"At the creek, Sam kept throwing rocks. He noticed the flat ones skip and the round ones just plunk. Tried about ten."* Lens answer differs by family. DLO links (all families, neutral): S5-02 developing.
Signals detected (common): `nature` (creek), `repetition` (kept, about ten), `named` (flat ones / round ones), `movement` (throwing), `attention` (kept). Plus `initiated` +2 structural (no `workingFrom`, Sam as subject) → detected for families whose lens answer adds to it.

| Family | Top signal | Through your lens | Next time | Hold back | Ongoing rule |
|---|---|---|---|---|---|
| **CM** (early) | `nature` | First-hand acquaintance with a real place — the kind of knowing no book can give. | Go back to the same creek within two weeks. *Look for: he names the property.* | Don't explain why flat stones skip. Let him keep the discovery. | `return` in 14 days |
| **Classical** (pre) | `named` | Precise words and clear kinds — the grammar of a subject being laid down. | Give the precise word ("skipping stone", "surface"), have him say it. *Look for: …* | Use the real word, not a cute one. | `review` in 7 days |
| **Montessori** (first) | `repetition` | Repeating by choice is how mastery forms on the inside. | A low tray of stones to sort by shape and weight, ready for him to return to. | Let him stop when he's done, not when you are. | `stay` until `selfcorrect` appears, then `advance` |
| **Waldorf** (first) | `nature` | Connection to the season and the living world. | Bring a few stones home for the nature table. | (stage) Don't explain the why. Let the question live. | `return` in 7 days; `balance` checks hands vs head |
| **Unschooling** | `initiated` | Sam chose this — the most reliable kind of learning there is. | Leave a book about rivers or a bucket of different stones where he'll find them. Say nothing. | Don't turn it into a lesson. | `follow` if he returns to it |
| **Eclectic** | `repetition` (Montessori 3 wins tie on order) | This reads most like a Montessori moment: repeating by choice is how mastery forms on the inside. | (Montessori move) | (Montessori hold) | top firing across all |

Six genuinely different pieces of advice from the same moment, none generated, every line addressable by ID. Block 1 ("noticed a difference and worked out what causes it") and the "Look for" are identical across all six, because the learning is the same; what differs is how each tradition would meet it.

---

## 10. Authoring load

| Notes | Count | Words |
|---|---|---|
| Signal | 17 | cues only |
| Tradition | 6 | ≈600 each — drafted in §5, needs Drew's confirm and polish |
| Practice | ≈42 | ≈60 each — drafted in §5.7, `how`/`ask` to add |
| DLO variants | **0** | removed |

Total new pedagogy authoring ≈ 6,000 words, against ≈ 60,000 for DLO variants at v2 density. All of §5 is the first draft.

---

## 11. Data and code changes

| Area | Change |
|---|---|
| Sanity | `knowledgeNote.kind` adds `signal`. `tradition` shape per §4. `practice` adds `stages`. DLO and opportunity drop `variants`; DLO adds neutral `showed`. |
| Postgres | `moment_signals (moment_id, learner_id, signal_id, source: cue \| lens \| structural \| model, removed boolean)`. `moments.said` → `moments.lens` (per child JSONB). `family_profile.pedagogy { primary, secondary? }` (exists). |
| Code | `resolve.ts` scores signals alongside DLOs. `lens.ts` (tradition, stage, signals → read/move/hold; Eclectic cross-table). `direction.ts` (seven kinds). `assemble.ts` uses §7 order. `variant.ts` deleted. |
| Index | `signals.<hash>.json` cue index; traditions and practices in `knowledge.json`. Golden set adds `expectedSignals` and, per tradition, `expectedTop`. |
| AI | Unchanged. Pedagogy layer is zero calls. Propose may return ≤ 2 signal IDs. |

---

## 12. Propagation

| Target | Action |
|---|---|
| `hearth-notes-architecture-v2.md` | §4 (Pass 3), D19–D21 and the `variants` rows of §7 superseded by this document. |
| `hearth-notes-handoff-plan-v1.md` | → v2: S1 adds `signal` kind and tradition validation; S3 adds `lens.ts`, signal scoring; S4 `lens` field + five-block post-save; S5 `direction.ts` behind `watching` and the weekly review; authoring table swaps DLO variants for §5 confirmation. |
| `decisions.md` | Add D36–D45; mark lens bundles, PKB corpus, DLO variants retired. |
| Pedagogy corpus docs | Archived. |

---

## 13. Needs your confirmation

| # | Question | Default |
|---|---|---|
| C10 | Remove per-DLO variants entirely; pedagogy reads only the signal axis. | Proceed |
| C11 | `said` becomes the tradition-worded `lens` field. | Proceed |
| C12 | Signals are removable but not confirmed, and never enter the Report or Constellation. | Proceed |
| C13 | Readings, moves, holds and rule copy in §5 and §8 as the first draft — mark any cell you'd change. | Proceed and refine |
