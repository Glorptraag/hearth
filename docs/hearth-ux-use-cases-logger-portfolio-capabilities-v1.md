# Hearth LMS — UX Use-Case Compendium

### Logger → Portfolio → Capabilities

> **Author hat:** UX Lead / UX Research
> **Version:** v1 — 2026-06-08
> **Scope:** The three surfaces that form Hearth's evidence spine — the **Logger** (capture), the **Portfolio / Learning Journey** (reflection + compliance), and the **Capabilities Constellation** (growth model). These three are deliberately treated as one continuous experience because they are one continuous *data object* seen through three lenses.
> **Grounding:** Every use case below is grounded in the live implementation (`src/app/(auth)/log`, `.../our-story/portfolio`, `.../our-story/report`, `.../our-story/capabilities`), the enrichment pipeline, and the canonical specs (`Hearth_System_Interaction_Map.md`, `hearth-data-architecture-overview-v1.md`, `hearth-heu-work-sample-curation-spec-v1.md`, `hearth-logger-post-save-resolution-v1.md`). Where a behaviour is spec'd-but-not-built it is flagged **[SPEC]**; where it is live it is flagged **[BUILT]**.

---

## 0. How to read this document

This is a use-case compendium, not a spec. Its job is to make the *intent* behind each surface legible to design, engineering, content, and QA — to answer "who is here, what are they trying to do, what does success feel like, and where does it break."

Each use case uses a consistent template:

| Field | Meaning |
|---|---|
| **ID / Name** | Stable handle (`UC-L-01` etc.) |
| **Primary actor** | The persona at the centre (see §1) |
| **JTBD** | The job-to-be-done this serves, in the actor's voice |
| **Trigger** | What starts the scenario |
| **Preconditions** | What must be true before it can run |
| **Main flow** | The happy path, step by step |
| **Alternate / exception flows** | Branches, recoveries, edge handling |
| **Postconditions** | The durable state change |
| **Frequency / intensity** | How often this happens, how loaded the moment is |
| **Success signal** | What "it worked" looks like — behaviourally and emotionally |
| **Friction / risk** | Where it hurts or fails |
| **Design rationale** | Why it is shaped the way it is |

The compendium is organised **capture → reflect → model**, mirroring the data lifecycle, because no Portfolio or Capability use case is reachable until a Logger use case has run at least once. The cold-start dependency is the single most important fact about this product's UX.

---

## 1. Personas & actors

Hearth has **one real user type at MVP** — the home-educating parent who is also the facilitator, the record-keeper, and the compliance officer. But that one person shows up in materially different *states*, and those states are what actually drive the design. Treating them as distinct personas keeps us honest.

### P1 — "Mara," the Reflective Logger (the spine persona)
The end-of-day or in-the-moment capturer. Logs retrospectively: something already happened, she's recording it. She is time-poor but values the ritual. She is the persona the Logger's 5-minute rule and retrospective philosophy are built around. **Mid expertise, high motivation, low time.**

### P2 — "Dan," the Time-Pressured Multi-Child Parent
Three kids, learning often happens together, the day is chaotic. He needs the *single-entry-multi-child* path to be frictionless or he won't log at all. His failure mode is the dropped log, not the bad log. **High pragmatism, very low patience for forms.**

### P3 — "Steph," the Compliance-Anxious Registrant
Queensland HEU registration is live or imminent. Her dominant emotion is *fear of an inadequate report*. She doesn't trust that "playing with tadpoles" counts. The HEU Report surface, the work-sample curation flow, and the "On Track / Needs Attention / At Risk" posture badge exist for her. **High anxiety, deadline-driven, episodic (spikes near renewal).**

### P4 — "New-week Nadia," the Onboarding Skeptic
First two weeks. Hasn't yet seen value. Lands in **Guided mode** (the <20-entries default). Everything she sees is empty states. The single biggest churn risk in the product. Every empty state, every coaching hint, every first-save celebration is aimed at her. **Low trust, low data, high abandonment risk.**

### P5 — "Reflective-Sunday Rachel," the Meaning-Seeker
Same person as Mara, different mode. Once a week (often Sunday), she opens the Portfolio and Capabilities not to *do compliance* but to *feel the story* — to see her child's growth, read the monthly narrative, watch a thread move from emerging to demonstrating. This is the retention engine. If this persona is never satisfied, logging feels like data entry into a void. **High motivation, reflective, the "why I keep doing this" persona.**

### P6 — The Child (secondary / future actor) **[SPEC — Phase 2]**
Children are subjects of the record, not yet users of it. Learner-facing views are explicitly deferred. Named here only so use cases don't accidentally assume a child reader.

### S1 — The AI Enrichment Pipeline (system actor)
Not a person, but it behaves like one in every flow: it reads what the parent wrote, tags subjects and capability threads, flags milestones and journey moments, drafts HEU annotations, and computes the snapshot. It is the invisible co-author. Its **fallibility is a first-class UX concern** — every surface has to degrade honestly when it fails.

### S2 — The QLD HEU Reviewer (external, off-platform)
Never touches Hearth, but their expectations shape the entire Report surface: six work samples, early/late progression, parent-authored observations. The Report is a document *for them*, assembled *by* Steph, *with help from* S1.

---

## 2. Jobs-to-be-done map

The use cases cluster around six jobs. Keeping them visible prevents feature-think.

| JTBD | "When I… I want to… so that…" | Served primarily by |
|---|---|---|
| **J1 — Capture before I forget** | When a learning moment just happened, I want to record it in under five minutes, so that it isn't lost and I don't have to remember it later. | Logger |
| **J2 — Capture without judgment paralysis** | When I'm not sure something "counts," I want to log it anyway and let the system find the value, so that I don't under-record real learning. | Logger + Enrichment |
| **J3 — See that it mattered** | When I've logged, I want quick, warm confirmation that this moment meant something, so that logging feels rewarding, not bureaucratic. | Logger post-save + Portfolio |
| **J4 — Feel the story** | When I reflect (often weekly), I want to see my child's learning as a growing narrative, so that home education feels like progress, not chaos. | Portfolio + Capabilities |
| **J5 — Prove it to the regulator** | When my HEU report is due, I want to assemble a defensible, parent-authored record with minimum panic, so that I keep my registration. | HEU Report |
| **J6 — Know where the gaps are** | When I plan loosely, I want to see which capabilities are thin, so that I can nudge balance without rigid scheduling. | Capabilities + Report gap analysis |

---

# PART A — THE LOGGER

> **Surface:** `src/app/(auth)/log/page.tsx` + `_components/*`
> **Core philosophy:** Retrospective capture. The parent records what *already happened*. Forward planning is never primary here.
> **The governing constraint:** the 5-minute rule. Minimum viable save (one child + a >20-char description + one engagement rating = 50%) is reachable in ~60–90 seconds.
> **Two operating modes:** **Guided** (default <20 family entries, 65% save gate, activity-type required, detail bonuses) and **Quick** (default after 20 entries, 50% gate). Plus context modes: **Scaffold** (pre-filled from a Hearth session) and **Snapshot** (reads Family Intelligence Snapshot to power coaching).

---

## UC-L-01 — The 90-second retrospective capture (the spine use case)

- **Primary actor:** P1 Mara (Quick mode)
- **JTBD:** J1 — capture before I forget.
- **Trigger:** A learning moment ended ("we baked, she measured everything"); Mara taps **Log a Moment** from the Dashboard.
- **Preconditions:** Signed in; ≥1 learner on the family; family has logged 20+ entries (so Quick mode is the default).
- **Main flow:**
  1. **Who** — taps one child chip; chip gains ember glow + checkmark; Section 1 ✓ (20 pts).
  2. **What** — types a short description into the serif textarea ("Emma measured flour and sugar for pancakes and worked out we needed to double the recipe"). At >20 chars she earns 15 pts; an 800ms-debounced keyword match begins surfacing a "Subjects Detected" card (maths, cooking).
  3. **Engagement** — taps 😊 *Loved it* in Emma's row (15 pts).
  4. The completeness ring crosses 50%; the Save button flips from disabled-muted to ember-enabled; the tier label reads "Good → Rate engagement / add observations."
  5. Taps **Save**. Button shows "Saving…"; entry POSTs to `/api/entries` with `loggerMode: 'quick'`.
- **Alternate / exception flows:**
  - *Voice instead of typing:* taps the mic; speaks (en-AU, continuous); transcript appends to the textarea. (UC-L-09.)
  - *Thin entry:* if the description stays <60 chars, no observation details, no evidence, and completeness <55, the save is classified **thin** → fast toast only, no second screen. (UC-L-07.)
  - *Offline at save:* save fails → "You're offline. Your draft is saved locally — try again when you're back online." Draft persists. (UC-L-10.)
- **Postconditions:** One `learning_entry` row, `status: complete`, `ai_enrichment: { status: pending }`, async enrichment enqueued.
- **Frequency / intensity:** The highest-frequency action in the entire product. Often daily, often one-handed, often while supervising a child. Cognitively *low* (recall mode, not analysis mode).
- **Success signal:** Save completes inside ~90s; Mara feels she "got it down" and moves on. Behaviourally: she comes back tomorrow.
- **Friction / risk:** Any field that *feels* mandatory but isn't will tax the moment. The 50% gate must never read as "incomplete = bad."
- **Design rationale:** The completeness ring is a *clarity* device, not a gamified score — it tells Mara when she's allowed to leave, not how good a parent she is. Retrospective framing removes the planning burden that kills most LMS logging.

---

## UC-L-02 — The guided first log (onboarding skeptic's make-or-break)

- **Primary actor:** P4 New-week Nadia (Guided mode)
- **JTBD:** J2 + J3 — log without knowing if it counts, and feel it mattered.
- **Trigger:** First-ever log, prompted from onboarding or the empty Dashboard.
- **Preconditions:** Family has <20 entries → Guided mode auto-selected; 65% save gate; activity type **required** (−5 penalty if missing).
- **Main flow:**
  1. Selects child; types description.
  2. Hits the activity-type requirement — taps one of the 8 cards (Nature Study, Kitchen Science, Reading, Creative Arts, Physical, Social, Lesson, Free Play). If she picks **Lesson**, a subject sub-picker (English/Maths/Science/HASS/Arts/Tech/HPE/Languages) unlocks.
  3. Rates engagement.
  4. Guided mode nudges depth: a detail-capable observation chip ("Persisted through difficulty") reveals a small detail editor; filling it earns a +5 bonus. Writing a per-child discovery ≥20 chars earns another +5.
  5. Crosses the higher 65% gate; saves.
  6. Because the entry is substantive, the form **morphs in place** to the post-save second screen with detected subjects, a warm one-line reflection, and the top capability thread.
- **Alternate / exception flows:**
  - *She abandons mid-form:* 10s idle autosave to `localStorage`; if she returns within 4h, "Draft restored from your last session"; if >4h, a `draft_resume` notification fires.
  - *Enrichment is slow:* second screen shows "Saved — reading this moment…" skeleton, polling every 1.5s up to 30s.
- **Postconditions:** First entry persisted; first taste of the reflect-phase payoff.
- **Frequency / intensity:** Once per family, but disproportionately important. High cognitive load (everything is new).
- **Success signal:** Nadia reads the post-save reflection and thinks "oh — *that's* what this does." The single best leading indicator of retention.
- **Friction / risk:** Guided mode is *more* demanding exactly when trust is *lowest*. The required activity type is a calculated bet: structure-as-scaffolding for the unsure, at the cost of a few seconds. If the post-save payoff doesn't land, the extra friction is pure cost.
- **Design rationale:** Guided mode front-loads quality while the parent is still learning the model, then gets out of the way (auto-switch to Quick at 20 entries). The post-save second screen is the *reward* that justifies the capture.

---

## UC-L-03 — The multi-child shared moment (one entry, divergent experiences)

- **Primary actor:** P2 Dan
- **JTBD:** J1 — capture a moment three kids shared, without logging it three times.
- **Trigger:** A single activity involved 2+ children ("all three built the fort").
- **Preconditions:** ≥2 learners on the family.
- **Main flow:**
  1. Taps multiple child chips. A **"Learning together"** toggle appears (hidden until 2+ selected).
  2. Writes one shared description.
  3. The Engagement and Discoveries sections render **one row per child** — Dan can give the 8-year-old 😊 and the 4-year-old 😐, and write distinct discoveries ("Eldest engineered the load-bearing wall; youngest narrated a story about who lived there").
  4. Saves a single entry with `learnerIds: [...]`, `engagementPerLearner`, `discoveriesPerLearner`.
- **Alternate / exception flows:**
  - *Deselects a child after rating:* that child's per-child data is purged; completeness recalculates; if it drops below the gate, Save re-disables.
  - *Drops back to one child:* the "Learning together" toggle hides and resets to false.
- **Postconditions:** One entry that will **fan out** — it appears in each child's Portfolio showing *only that child's* engagement and discovery (see UC-P-03), and can be selected as a work sample independently per child.
- **Frequency / intensity:** Very common for multi-child families; medium load (per-child differentiation takes thought).
- **Success signal:** Dan logs a shared morning once and trusts that each child's record is individually true.
- **Friction / risk:** Per-child rows multiply the form. For 4+ kids the Engagement + Discoveries sections get long; the 5-minute rule strains. **[Risk]** Watch fan-out comprehension — parents may not realise one entry feeds N portfolios.
- **Design rationale:** Siblings in the same activity have genuinely different experiences; collapsing them into one rating would make entries feel generic and false. The per-child split is what makes a multi-child entry *honest* rather than merely *efficient*.

---

## UC-L-04 — Logging from a Hearth session (scaffold mode)

- **Primary actor:** P1 Mara
- **JTBD:** J1 — turn a structured session straight into a record without re-typing.
- **Trigger:** A Hearth session ends and routes the parent to the Logger.
- **Preconditions:** Entry carries a `scaffoldSessionId`.
- **Main flow:**
  1. Logger opens **pre-filled**: `description` from the session's shared record, `location` from session data, `selectedLearners` from attendees.
  2. Mara edits/augments rather than authoring from scratch.
  3. On save, a session-specific **ReflectionModal** overlays with reflective copy tuned to that session.
- **Alternate flows:** She clears pre-filled fields and writes her own — scaffold is a starting point, not a lock.
- **Postconditions:** Entry linked back to the session via `scaffoldSessionId`.
- **Frequency / intensity:** As often as the family runs Hearth sessions; low load (most fields pre-filled).
- **Success signal:** The log feels like a 20-second confirmation, not a fresh form.
- **Friction / risk:** Pre-fill that's subtly wrong is worse than blank — parents may save inaccurate text they didn't write. Pre-filled fields need a clear "this came from your session, edit freely" affordance.
- **Design rationale:** Capture should ride on work the parent already did. Scaffold mode is the clearest expression of "the record is a by-product of learning, not extra labour."

---

## UC-L-05 — "Did this even count?" — letting enrichment find the value

- **Primary actor:** P4 Nadia / P3 Steph
- **JTBD:** J2 — log the messy thing and let the system surface what's pedagogically real.
- **Trigger:** Parent logs something they suspect is "just play" ("we dug for worms for an hour").
- **Preconditions:** Description long enough (≥50 chars) to trigger server draft-insight.
- **Main flow:**
  1. While typing, the **instant keyword matcher** (1.5s debounce, client-side) lights up "Subjects Detected" (nature/science).
  2. At ≥50 chars, a **Haiku draft-insight** (800ms debounce, one call/session, capped 20) adds a "Hearth is noticing…" card — a warm 1–2 sentence reflection plus suggested capability threads.
  3. The parent sees worm-digging reframed as scientific inquiry / biological observation *before they even save*.
- **Alternate flows:** Keywords don't match → falls back to the chosen activity type; no false precision.
- **Postconditions:** Parent's confidence shifts; they save what they'd otherwise have dropped.
- **Frequency / intensity:** Common in early weeks; the anxiety-reduction moment.
- **Success signal:** The "oh, that counts" realisation — directly attacks under-logging.
- **Friction / risk:** Over-claiming. If the AI calls a snack break "advanced chemistry," trust craters. Reflective copy must stay modest and observational, never grandiose.
- **Design rationale:** The product's central insight is that home-ed parents *under*-value ordinary learning. Pre-save enrichment is a confidence intervention, not a feature flourish.

---

## UC-L-06 — Attaching evidence (photo, quote, note, link, audio)

- **Primary actor:** P1 Mara / P3 Steph (Steph logs *for* the eventual report)
- **JTBD:** J1 + J5 — capture proof now so the Portfolio and HEU report have real artifacts.
- **Trigger:** There's a photo of the work, or the child said something quotable.
- **Preconditions:** None (evidence is optional, worth up to 10 pts; ≥2 items = full 10).
- **Main flow:**
  1. From the Evidence tools grid, taps **📷 Add Photo** → dropzone modal, 16:10 preview, caption field.
  2. Or **💬 Child's Words** (quote), **📝 Note** (context), **🔗 Link Resource** (name + optional URL), or **🎤 Record Audio** (MediaRecorder with duration metadata) [Phase 2].
  3. Evidence items list below the grid with type badge, preview, thumbnail (photos), and remove control.
- **Alternate / exception flows:**
  - *Offline / slow upload:* photo stored as a `local://` placeholder; on reconnect the queue drains and a post-save PATCH swaps in the real URL.
  - *Large photo:* client-side resize before base64 encode [production].
  - *Non-image:* file picker is `accept="image/*"` so non-images aren't selectable.
- **Postconditions:** `evidence[]` rows persisted; these become Portfolio thumbnails and candidate HEU work-sample artifacts.
- **Frequency / intensity:** Medium; spikes for compliance-minded parents.
- **Success signal:** Steph later opens the Report and her best photos are *already there*, captioned.
- **Friction / risk:** Upload reliability on poor rural connections is the make-or-break; the `local://` queue is the safety net but must visibly reassure ("saved locally, will upload").
- **Design rationale:** Evidence captured at the moment of learning is infinitely better than evidence reconstructed at report time. The Logger is the cheapest place to bank it.

---

## UC-L-07 — The thin-entry fast path (quality gate as kindness)

- **Primary actor:** P2 Dan (rushed) / any parent on a low-signal day
- **JTBD:** J1 — get a sparse moment down without being dragged into a reflection screen.
- **Trigger:** Save of an entry that is short (<60 chars), detail-less, evidence-less, and <55% complete.
- **Preconditions:** Meets all four thin criteria.
- **Main flow:**
  1. Save succeeds.
  2. A **fast toast** ("Learning entry saved! ✨") appears and auto-dismisses in ~2s.
  3. No post-save second screen, no enrichment surfacing.
- **Alternate flows:** Badge threshold checks still run silently in the background; a ready badge surfaces via notification, not an in-your-face toast.
- **Postconditions:** Entry saved and enriched in the background; it will still appear in the Portfolio.
- **Frequency / intensity:** Common on busy days; very low load by design.
- **Success signal:** Dan logs five quick things in a row without ever being interrupted by a reflection screen.
- **Friction / risk:** A thin entry produces weaker enrichment → weaker capability mapping. **Honest trade:** a sparse-but-real record beats a coerced-rich one. The risk is that *only* thin entries get logged, starving the Portfolio of substance.
- **Design rationale:** The reflective post-save screen is a *reward for richness*, not a tax on brevity. Forcing it on a one-line log would punish the exact behaviour (frequent capture) we want to encourage.

---

## UC-L-08 — Earning the post-save reflection (substantive entry)

- **Primary actor:** P5 Reflective Rachel
- **JTBD:** J3 — feel that a rich log meant something, immediately.
- **Trigger:** Save of a substantive entry (rich description, details, and/or evidence).
- **Preconditions:** Fails the thin test → qualifies for the second screen.
- **Main flow:**
  1. Form morphs in place to "Saved — reading this moment…" (skeleton).
  2. Client polls `/api/entries/[id]` every 1.5s; on `status: enriched` the header becomes "Saved — and here's what we noticed."
  3. Shows: detected subject chips (primary ember), a serif italic reflection from the enrichment, the top capability thread, evidence chips, and an exit row ("Back to Dashboard" / "Log Another").
- **Alternate / exception flows:**
  - *Timeout (30s) / failure:* header reads "Saved."; copy: "We couldn't draw insights this time. This moment is safe in your sessions — you can return to it any time." Never a spinner-forever, never an apology spiral.
  - *Badge ready:* a toast offers a 2-minute assessment with a deep link (UC-C-09).
  - *Proactive module attach:* if the entry has no `sourceModuleId`, an `AttachToModuleModal` offers to link it to a library module (one prompt/session; "Skip" suppresses for the session). (UC-L-12.)
- **Postconditions:** Parent leaves on a controlled exit (no auto-dismiss on the substantive path).
- **Frequency / intensity:** Whenever the parent invests in a richer log; the emotional peak of the capture loop.
- **Success signal:** Rachel reads the reflection and feels *seen* — the system noticed something she half-noticed.
- **Friction / risk:** Forbidden patterns (spec D-LPS-4): no forward-prescription ("try this next time"), no apology copy, no second LLM call, no auto-dismiss. Violating any of these turns reflection into nagging.
- **Design rationale:** Capture and reflection are deliberately *two phases*. During logging the parent is in recall mode; the second screen flips them to meaning mode only once the data is rich enough to support it.

---

## UC-L-09 — Hands-busy voice capture

- **Primary actor:** P2 Dan (supervising a toddler) / P1 Mara (driving-home dictation)
- **JTBD:** J1 — log without free hands.
- **Trigger:** Taps the mic button under the description field.
- **Main flow:** Button turns ember and pulses; `webkitSpeechRecognition`/`SpeechRecognition` runs `lang: en-AU`, continuous, interim results; transcript **appends** to existing text (never overwrites).
- **Alternate flows:** Unsupported browser → alert ("Voice not supported. Try Chrome or Edge."); button remains but inert.
- **Postconditions:** Description populated by speech.
- **Frequency / intensity:** Situational; high value in exactly the moments typing is impossible.
- **Success signal:** A usable description appears without a keyboard.
- **Friction / risk:** AU-accent transcription accuracy; child names mangled. Append-not-overwrite is the right call but can produce run-ons.
- **Design rationale:** The 5-minute rule assumes free hands the parent often doesn't have; voice is the pressure-release valve for the hardest capture moments.

---

## UC-L-10 — Offline / poor-connectivity capture

- **Primary actor:** P1 Mara (rural Queensland, patchy signal)
- **JTBD:** J1 — never lose a log to a dropped connection.
- **Trigger:** `navigator.onLine` flips false, or a save fails on the network.
- **Main flow:**
  1. An offline banner appears: "Offline — your draft is being saved locally."
  2. Form remains fully usable (no API calls during input).
  3. 10s idle autosave continues to `localStorage` regardless of connection.
  4. On a failed save: toast "Failed to save. Your draft is safe — please try again." Draft stays current.
  5. On reconnect, the parent retries and the save succeeds; queued photo placeholders drain.
- **Alternate flows:** Stale draft (>4h) → `draft_resume` notification on next session.
- **Postconditions:** No data loss across an offline interval.
- **Frequency / intensity:** Common for the target geography; the trust-defining edge case.
- **Success signal:** Mara closes the lid mid-log on a no-signal bushwalk and finds her draft intact that evening.
- **Friction / risk:** **[SPEC gap]** Full PWA/offline *sync queue* is Phase 2 — today the safety net is `localStorage` draft + photo placeholder queue, not background submission. Save itself still needs connectivity.
- **Design rationale:** For a Queensland rural user base, offline tolerance isn't a nicety — it's the difference between a trusted tool and an abandoned one.

---

## UC-L-11 — Draft resume across a broken session

- **Primary actor:** Any parent interrupted mid-log (the universal homeschool condition)
- **JTBD:** J1 — pick up exactly where I was forced to stop.
- **Trigger:** Returns to `/log` (or follows a resume notification) with a saved draft present.
- **Main flow:** On mount the draft is read from `localStorage[hearth:logger:draft]`, all fields restored, and a dismissible banner says "Draft restored from your last session."
- **Alternate flows:** Draft >4h old → also fires a `draft_resume` push so the parent is reminded it exists.
- **Postconditions:** No re-typing.
- **Frequency / intensity:** Frequent (interruption is the norm); near-zero load.
- **Success signal:** The parent never re-enters the same description twice.
- **Friction / risk:** Device-locked (`localStorage`). A draft started on the phone won't appear on the tablet. **[Open]** Postgres-backed cross-device draft is a recommended Phase 2 upgrade.
- **Design rationale:** Homeschool logging happens in 30-second windows between interruptions; resilience to interruption *is* the feature.

---

## UC-L-12 — Proactive module attachment after save

- **Primary actor:** P1 Mara, P5 Rachel
- **JTBD:** J4 — connect a spontaneous log to structured content I'm using.
- **Trigger:** Substantive save with no existing `sourceModuleId`, on a non-scaffold entry.
- **Main flow:** An `AttachToModuleModal` appears (once per session); parent searches the library, confirms a module link, or taps **Skip** (a sessionStorage flag suppresses further prompts that session).
- **Postconditions:** Entry gains `sourceModuleId`; in the Portfolio it later shows a "View activity materials" link.
- **Frequency / intensity:** Occasional; low load (one prompt, skippable).
- **Success signal:** A loose log becomes part of a coherent module thread.
- **Friction / risk:** Modal fatigue — hence the one-per-session cap and easy skip.
- **Design rationale:** Bridges retrospective capture with the planned-content side without making planning primary.

---

## UC-L-13 — Reading the completeness signal (the ambient guidance loop)

- **Primary actor:** All Logger personas
- **JTBD:** J3 — know when I've done "enough," without anxiety.
- **Trigger:** Any field change.
- **Main flow:** The 40×40 SVG ring animates; section indicators (1–6) flip from number to checkmark as each is satisfied; a two-line desktop label names the tier ("Getting Started → Excellent") and gives the next best action ("Add observations"); on mobile a "Before you save" checklist lists missing items as pills when the gate isn't met.
- **Postconditions:** Parent always knows the cheapest path to a saveable entry.
- **Frequency / intensity:** Continuous, ambient.
- **Success signal:** No parent ever wonders "why can't I save?"
- **Friction / risk:** A percentage can read as a grade. Copy and colour (ember < 90, sage ≥ 90) must signal *readiness*, not *worth*.
- **Design rationale:** This is wayfinding, not scoring. It converts an open-ended form into a guided, bounded task — the operational backbone of the 5-minute rule.

---

# PART B — THE PORTFOLIO / LEARNING JOURNEY

> **Surface:** `src/app/(auth)/our-story/portfolio/page.tsx` (live), within the **Our Story** hub (`/our-story`).
> **Architectural law:** *Portfolio is a filtered view, not an independent store.* There is **no "add to portfolio" button.** Entries flow Logger → enrichment → snapshot → Portfolio automatically. One entry serves Portfolio, HEU Report, and Capabilities with no duplication and no sync drift.
> **Always per-child.** A child selector scopes everything; the Dashboard is the family-wide view, the Portfolio is the per-child reflective layer.
> **Card types** (assigned by enrichment): **Evidence** (tan, baseline), **Journey** (ember, cross-domain/independence/metacognition/transfer), **Milestone** (sage, badge-threshold/capability leap).

---

## UC-P-01 — The Sunday reflection scroll (the retention ritual)

- **Primary actor:** P5 Reflective Rachel
- **JTBD:** J4 — feel my child's learning as a story, not a spreadsheet.
- **Trigger:** Opens **Our Story → Learning Journey** for a child, typically on a quiet evening/weekend.
- **Preconditions:** Some enriched entries exist this month.
- **Main flow:**
  1. **Monthly Summary card** greets her: session count, subject count, capability-thread count, and (if present) an **AI monthly narrative** — one prose paragraph in her family's pedagogy voice ("Emma has explored three new subjects this month with strong focus on nature discovery…").
  2. She scrolls the **entry cards** (default **By Thread** grouping). The visual story arc reveals itself: lots of tan **Evidence** cards, punctuated by ember **Journey** cards, crowned by the occasional sage **Milestone**.
  3. She expands a Journey card and reads the AI **journey observation** ("Emma applied her counting to a real shopping problem — transfer of mathematical thinking to practical contexts").
- **Alternate / exception flows:**
  - *No entries yet:* empty state — "Your story starts here" + "Add your first log." (UC-P-08.)
  - *Filter yields nothing:* "Nothing logged this period" + "Clear filters."
- **Postconditions:** None (read-only); the durable output is *motivation*.
- **Frequency / intensity:** ~weekly; low load, high emotional payoff.
- **Success signal:** Rachel comes away thinking "we're actually doing this" — and logs more next week.
- **Friction / risk:** If the monthly narrative is generic or absent, the ritual falls flat. Narrative quality is a retention lever, not a nice-to-have.
- **Design rationale:** This is the *why* that powers the *what* (logging). Without a satisfying reflect-phase, capture decays into joyless data entry. The card-type colour arc turns a flat list into a felt narrative.

---

## UC-P-02 — Filtering and reframing the record (lenses, not stores)

- **Primary actor:** P5 Rachel / P3 Steph
- **JTBD:** J4 + J6 — slice the same record different ways to answer different questions.
- **Trigger:** Wants to see "just science," "just last month," or "by capability thread."
- **Main flow:**
  1. **Date filters:** This Month / Last Month / All Time / Pick Month.
  2. **Subject filter:** 8 domain icons; tapping the active one toggles it off.
  3. **View mode:** **By Thread** (grouped, sorted by observation count desc, accordion per thread) or **Timeline** (flat, newest-first, paginated 20/page with "Load earlier").
  4. **Desktop thread sidebar** (sticky, 300px): every active thread with observation count and tier badge (emerging/developing/demonstrating); clicking a thread filters the entries.
- **Alternate flows:** Filters compose (subject ∩ date); changing learner or clearing a filter resets pagination.
- **Postconditions:** A re-scoped view; underlying data untouched (memoised client-side recompute).
- **Frequency / intensity:** Every reflective or compliance session.
- **Success signal:** Steph can isolate "science, this term" in two taps to check coverage; Rachel can watch one thread's evidence accumulate.
- **Friction / risk:** Discoverability of the thread sidebar on mobile (it's desktop-only) — mobile parents lose the capability lens here.
- **Design rationale:** The "filtered view" law made literal: every lens is a query over one canonical entry set. No curation, no drift, no second source of truth.

---

## UC-P-03 — One shared moment, two private records (multi-child fan-out)

- **Primary actor:** P2 Dan
- **JTBD:** J4 — see each child's individual story even when learning was shared.
- **Trigger:** Opens child A's Portfolio; a multi-child entry (UC-L-03) is present.
- **Main flow:** The shared entry appears in **each** child's Portfolio, but renders **only that child's** engagement emoji and discovery text (keyed by `selectedLearnerId`). The same fort-building morning reads as an engineering story in the elder's journey and a narrative-play story in the younger's.
- **Postconditions:** Each child's portfolio is individually true; either can flag the entry as a work sample independently.
- **Frequency / intensity:** Constant for multi-child families.
- **Success signal:** Dan never sees the wrong child's data on the wrong child's page.
- **Friction / risk:** Mental model — a parent editing the shared description in one child's view is editing it for both. **[Watch]** Edit-scope clarity.
- **Design rationale:** Honours the multi-child reality without duplicating data; the fan-out is the read-side payoff of the per-child capture split.

---

## UC-P-04 — Curating evidence in place (inline edit, no separate editor)

- **Primary actor:** P1 Mara / P3 Steph
- **JTBD:** J5 — polish a record I dashed off, so it reads well later.
- **Trigger:** Expands a card and taps edit.
- **Main flow:** Title and description become inline-editable; saves via `PATCH /api/entries/{id}`. Evidence URLs, the full engagement table (multi-child), and the journey observation are visible in the expanded state.
- **Alternate flows:** Editing description re-feeds enrichment context on the next rebuild.
- **Postconditions:** Entry refined; still the same single source object.
- **Frequency / intensity:** Occasional; pre-report cleanup spikes.
- **Success signal:** A rushed log becomes report-ready without leaving the Portfolio.
- **Friction / risk:** No undo/version history surfaced; an over-zealous edit overwrites the original capture.
- **Design rationale:** Editing where you read avoids a separate "manage entries" surface and reinforces that the Portfolio *is* the record, just filtered.

---

## UC-P-05 — Flagging a work-sample candidate (the Portfolio→Report bridge)

- **Primary actor:** P3 Steph
- **JTBD:** J5 — earmark strong moments for compliance while I'm already reflecting.
- **Trigger:** While reading, recognises an entry as HEU-worthy.
- **Main flow:** In the expanded card, toggles **Mark as work sample**; `workSampleCandidate` flips true via PATCH; a `WorkSamplePill` marks the card.
- **Postconditions:** The entry becomes a *candidate* the HEU Report surfaces when filling its six slots — it is **not** hidden, exported, or moved.
- **Frequency / intensity:** Ongoing, low-stakes; an investment against future panic.
- **Success signal:** At report time the six slots are pre-stocked with candidates Steph already vetted.
- **Friction / risk:** Flagging is metadata only — parents may expect "marking" to *do* more. The mental link from flag → report slot must be obvious.
- **Design rationale:** Spreads compliance effort across the year instead of concentrating it into a deadline crunch; keeps Portfolio read-only while still feeding the Report.

---

## UC-P-06 — Recovering a failed enrichment ("Generate now")

- **Primary actor:** Any parent; surfaces for P5 Rachel mid-scroll
- **JTBD:** J3 — get the insight that didn't generate, without losing the entry.
- **Trigger:** A card shows `aiEnrichment.status: failed`, or is 2+ minutes old with no enrichment.
- **Main flow:** Expanded card reads "Insights weren't generated for this moment." with a **Generate now** button → `POST /api/entries/{id}/enrich`; client marks pending and polls ~30s (20×1.5s) until terminal.
- **Alternate flows:** Fails again → option to retry (rate-limited 10/hour/family).
- **Postconditions:** On success, threads/journey observation appear and the card may re-type (Evidence→Journey/Milestone).
- **Frequency / intensity:** Uncommon but inevitable at scale; the honesty test.
- **Success signal:** A previously bare entry gains its insight on demand; no alarm, no data loss.
- **Friction / risk:** Over-eager retrying burns rate limits and cost; copy must stay calm ("weren't generated," not "broken").
- **Design rationale:** Enrichment is async and fallible; the read surface owns graceful recovery so a pipeline hiccup never reads as a lost moment.

---

## UC-P-07 — The badge shelf (recognising milestones)

- **Primary actor:** P5 Rachel; meaningful to P4 Nadia (proof of progress)
- **JTBD:** J4 — see earned milestones collected in one warm place.
- **Trigger:** Scrolls to the Badges section.
- **Main flow:** A grid of earned badges (emoji, serif title, award date) from `GET /api/badges/awards?...&includeArchived=true`; each badge can be **archived/restored** (soft-delete; archived shown greyed + italic).
- **Alternate flows:** None earned → "Milestones will appear here" with explanatory copy.
- **Postconditions:** Archive state toggled if the parent curates the shelf.
- **Frequency / intensity:** Occasional; emotional high point.
- **Success signal:** Nadia sees her first badge and feels the home-ed path is *working*.
- **Friction / risk:** Badges must feel *earned*, never participation-trophy — credibility is everything (hence assessment, not auto-award; UC-C-09).
- **Design rationale:** Milestones live in the Portfolio because that's where the story is read; archive control respects parents who want a true, uncluttered record.

---

## UC-P-08 — The cold-start Portfolio (empty-state stewardship)

- **Primary actor:** P4 Nadia
- **JTBD:** J3/J4 — understand what this surface will *become*.
- **Trigger:** Opens the Portfolio before logging anything.
- **Main flow:** A `BookOpenText` empty state: "Your story starts here" + a promise of what accrues + "Add your first log" → `/log`.
- **Postconditions:** Routed back to capture (the only thing that unlocks this surface).
- **Frequency / intensity:** Once per family, but high-stakes for retention.
- **Success signal:** Nadia leaves understanding the loop instead of bouncing.
- **Friction / risk:** Every Our Story sub-surface is empty at once for a new family — a wall of empty states. The copy must inspire, not deflate.
- **Design rationale:** With a hard cold-start dependency, empty states *are* the onboarding. They sell the future state to a parent with no data.

---

## UC-P-09 — Assembling the HEU work-sample set (the compliance crunch)

- **Primary actor:** P3 Steph
- **JTBD:** J5 — build a defensible Queensland HEU report with minimum panic.
- **Trigger:** Opens **Our Story → Report**; renewal approaches.
- **Preconditions:** Jurisdiction = QLD (CD-Level tier → 6 mandatory slots). (NSW/VIC/WA/TAS/ACT get the lighter Learning-Area tier; UC-P-12.)
- **Main flow:**
  1. The report auto-provisions: 6 slots across 3 subject pairs — Early/Later **Writing** (English), Early/Later **Maths**, Early/Later **Choice** (Science *or* HASS).
  2. A **Timeline hero** (registration → due date, pulsing if ≤30 days) and an **overall posture badge** ("On Track / Needs Attention / At Risk", computed from subject coverage + entry count) set the stakes.
  3. For an **empty slot** Steph taps **Select sample** → a **Candidate Panel** of entries where `heu_potential_sample` is true, filtered to that subject + term window, sorted by quality (strong/moderate/weak — visual, not numeric), with a "browse all entries" escape hatch.
  4. She picks an entry, then enters the **Annotation Interface** (UC-P-10).
  5. Repeats until "6 of 6 complete."
- **Alternate / exception flows:**
  - *<6 viable candidates:* banner — "You have N entries that could be work samples. Keep logging — you need 6 across English, Maths, and one other." Manual override always available.
  - *Same entry for two slots:* conflict warning ("already selected for [slot]").
  - *Wrong term window:* soft amber warning, not a block ("some families have legitimate reasons for atypical timing").
- **Postconditions:** Six slots filled and annotated; report ready to export.
- **Frequency / intensity:** Episodic, ~annual, **extremely high stress** — the single most anxious moment in the product.
- **Success signal:** Steph reaches "6 of 6," posture "On Track," and exports without a panic spiral.
- **Friction / risk:** The whole flow depends on a year of upstream logging + flagging. A parent who didn't log faces an empty grid at the worst possible time → the deadline-notification ladder (30/14/7/3 days) and year-round candidate flagging both exist to prevent this.
- **Design rationale:** "AI reduces the search space; parents decide." The system never auto-fills a regulatory document — it ranks, filters, and drafts, but the parent selects and authors. That boundary is both an ethics stance and a compliance necessity (the HEU wants *parent* observation).

---

## UC-P-10 — Authoring a work-sample annotation (AI drafts, parent owns)

- **Primary actor:** P3 Steph
- **JTBD:** J5 — write four credible reflective annotations per sample without starting from blank.
- **Trigger:** Opens a sample's Annotation Interface.
- **Main flow:**
  1. Evidence context shows on one side (image at readable size, title, date, original description, subject tags).
  2. Four fields, each AI-pre-seeded and labelled "AI draft — review and edit":
     - **What did you observe?** (80–250 words)
     - **Needs & strengths** (60–200)
     - **What did you adjust?** (60–200)
     - **Planning next steps** (60–200)
  3. As Steph edits, the "AI draft" label disappears and `*_source` flips `ai_draft → parent_edited → parent_written`. A live quality indicator (Strong / Consider expanding / Needs attention) responds to specificity and length.
  4. Auto-save on a 5s debounce; a subtle "Saved" flash. **Mark as complete** requires all four non-empty.
- **Alternate / exception flows:**
  - *All four still `ai_draft` at completion:* non-blocking warning — "These annotations haven't been reviewed yet. The HEU expects your own observations."
  - *Late slot:* a **progression summary** field appears (UC-P-11).
- **Postconditions:** Annotation stored with per-field provenance + `confirmed_at`.
- **Frequency / intensity:** Six times per report cycle; medium-high load each.
- **Success signal:** Steph turns an AI scaffold into her own words quickly and feels the result is *defensibly hers*.
- **Friction / risk:** The pre-seed is a double-edged sword — too good and parents rubber-stamp it (and the HEU can tell). The provenance tracking + soft warning is the integrity guardrail.
- **Design rationale:** Blank-page paralysis is the enemy; rubber-stamping is the failure mode. The design threads between them with editable drafts, visible provenance, and an honest nudge — never a hard block (parents must stay in control of a legal document).

---

## UC-P-11 — Showing growth (progression summaries + export)

- **Primary actor:** P3 Steph
- **JTBD:** J5 — demonstrate progression and walk away with a PDF.
- **Trigger:** Both Early and Later samples in a subject reach Complete.
- **Main flow:**
  1. A `ProgressionConnector` surfaces an AI-drafted growth sentence ("From basic sentences in Term 1 to structured paragraphs with punctuation in Term 3…"), editable inline and toggleable for export (`progression_summary_edited` tracks edits).
  2. The report also renders curriculum coverage bars, gap analysis ("Areas to Explore" with suggested actions), and recommended actions.
  3. **Export** → `GET /api/report/export?...` generates a server-side PDF: cover, posture, timeline, 6 sample pages (evidence image + 4 annotations), optional progression pages, coverage, gaps. Fires `report_exported` analytics; stamps `lastExportedAt`.
- **Alternate flows:** Edits after export → badge flips to "Edited since last export"; re-export anytime (no version lock, no in-app submission — Steph downloads and submits to the HEU portal herself).
- **Postconditions:** A shareable PDF; report stays fully editable.
- **Frequency / intensity:** Once or twice per cycle; the relief moment.
- **Success signal:** A clean PDF Steph trusts to submit.
- **Friction / risk:** PDF fidelity (image quality, page breaks) under real-world messy evidence; **Portfolio-level** PDF export is **[SPEC, not built]** — only the HEU Report exports today.
- **Design rationale:** Progression is exactly what a reviewer looks for; surfacing it automatically (but editably) does the parent's hardest narrative work while leaving authorship with them.

---

## UC-P-12 — The lighter-jurisdiction report (non-QLD)

- **Primary actor:** A non-QLD parent (the platform is QLD-first but jurisdiction-aware)
- **JTBD:** J5 — meet a lighter compliance bar without the 6-slot machinery.
- **Trigger:** `getJurisdiction(state)` resolves to NSW/VIC/WA/TAS/ACT → **Learning-Area tier**.
- **Main flow:** Learning-area cards (per-subject entry counts, coverage bars, strand counts), an "Areas to Explore" list, and an optional flat list of `workSampleCandidate` entries — no mandatory slots, no required annotations. Same PDF export, lighter structure.
- **Postconditions:** A lighter report PDF.
- **Frequency / intensity:** Episodic; far lower stress than CD-Level.
- **Success signal:** No parent is forced through QLD-grade rigour their state doesn't require.
- **Friction / risk:** Maintaining accurate per-jurisdiction rules as regulations shift.
- **Design rationale:** The compliance surface scales its demands to the actual regulator — over-asking would punish parents outside QLD.

---

# PART C — THE CAPABILITIES CONSTELLATION

> **Surface:** `src/app/(auth)/our-story/capabilities/page.tsx` → `ConstellationRoute` (live), within Our Story.
> **The model:** 15 domains → 57 canonical threads → 171 DLOs (3 tier bands each: **emerging / developing / demonstrating**). Source of truth in Sanity + `src/lib/capability-universe-v2.ts`.
> **The metaphor:** a night sky. Domains are clusters, threads are stars that light as evidence accrues, DLOs are the fill within a star, prerequisite/enables edges are the lines between them.
> **The law:** Australian Curriculum / QLD codes stay **backend-only**. Parents see plain-language descriptors and thread names — never `AC9M3N01`. All intelligence is computed at **write-time**; the Constellation only *reads* the precomputed snapshot (zero read-time LLM).
> **Two view modes:** **Gallery** (visual starfield) and **Table** (structured rows), both supporting a four-level drill: Domains → Threads → DLOs → Moments.

---

## UC-C-01 — Reading the sky (domain-level overview)

- **Primary actor:** P5 Reflective Rachel
- **JTBD:** J4 + J6 — see, at a glance, where my child is growing and where it's quiet.
- **Trigger:** Opens **Our Story → Capabilities** for a child.
- **Preconditions:** Some enriched entries exist (the sky is lit by logging).
- **Main flow:**
  1. **Level 1** renders all 15 domains as a starfield; domains with thread activity glow, dormant ones dim. (Note: a few super-domains are v2 substrate placeholders with 0 threads and render unlit.)
  2. Rachel reads the balance instantly — Language and Maths bright, Musical/Performative dim.
  3. Taps a bright domain to drill in (→ UC-C-02).
- **Alternate flows:** **Table view** toggle for a text-first read of the same data.
- **Postconditions:** None (read-only); output is orientation.
- **Frequency / intensity:** ~weekly/monthly; low load, reflective.
- **Success signal:** "Ah, we're light on the arts this term" — a felt insight in one glance.
- **Friction / risk:** The 15-domain colour palette is **not yet colour-blind-safe [SPEC gap]** — mitigated by shape-based tier glyphs (○ ◐ ●). Empty/placeholder domains can confuse ("why is this one always dark?").
- **Design rationale:** A spatial, glanceable model beats a grade book for a philosophy-neutral, anxiety-prone audience — growth as light accruing, not boxes ticked.

---

## UC-C-02 — Drilling a domain into its threads (the DAG)

- **Primary actor:** P5 Rachel / P6-adjacent planning by P1
- **JTBD:** J6 — understand how capabilities within a domain relate and progress.
- **Trigger:** Taps a domain at Level 1.
- **Main flow:** **Level 2** lays out the domain's threads as a directed graph: foundational threads on top, downstream threads positioned by topological column following prerequisite/enables edges. Each thread node shows its name, a subtle ID, a progress fill (dim if unobserved → partial → full glow), a badge indicator if awarded, and a recent-activity pulse. Solid lines = within-domain prereqs; dashed = cross-domain enables.
- **Alternate flows:** **Ghost threads** appear semi-transparent — threads the child hasn't evidenced yet but whose prerequisites are all met ("opening up next").
- **Postconditions:** None.
- **Frequency / intensity:** Occasional, exploratory.
- **Success signal:** Rachel sees that Reading Comprehension is glowing *because* Decoding is solid — the dependency reads visually.
- **Friction / risk:** DAG legibility on mobile; the layout assumes a true DAG (a circular edge would break topological sort — validation is **[TBD]**).
- **Design rationale:** Capabilities aren't a flat checklist; the graph teaches parents the *structure* of growth (what enables what) without curriculum jargon. Ghost threads gently suggest "what's next" without prescribing it.

---

## UC-C-03 — Reading a thread's learning objectives (DLO level)

- **Primary actor:** P5 Rachel / P3 Steph (checking depth before report)
- **JTBD:** J6 — see, in plain language, what this capability actually looks like across stages.
- **Trigger:** Taps a thread at Level 2.
- **Main flow:** **Level 3** lists the thread's DLOs grouped by badge level (starter/intermediate/advanced), each row showing the plain-language descriptor, an observation-status glyph (○ not observed / ◐ emerging / ● confirmed), and an observation count ("3 moments"). Example for L3 Reading Comprehension, *developing* band: "Predicts what happens next based on clues. Retells beginning/middle/end. Makes simple inferences."
- **Alternate flows:** A near-complete badge section is highlighted ("most indicators confirmed").
- **Postconditions:** None.
- **Frequency / intensity:** Occasional; the "what does mastery mean here" moment.
- **Success signal:** Rachel reads a demonstrating-tier descriptor and recognises her child in it — concrete, jargon-free.
- **Friction / risk:** **Explicit** parent confirmation of a DLO ("Yes, I've seen this") is **[SPEC, not built]** — today confirmation is *implicit* (3+ high-confidence AI mappings). Parents can't yet override the AI's read.
- **Design rationale:** DLOs translate the Australian Curriculum into observable, plain-language indicators — the parent-facing skin over a backend standard. Plain language is non-negotiable; codes never surface.

---

## UC-C-04 — Following a thread back to its evidence (moments) **[SPEC]**

- **Primary actor:** P5 Rachel / P3 Steph
- **JTBD:** J5/J4 — see the actual logged moments behind a capability claim.
- **Trigger:** Taps a DLO at Level 3.
- **Main flow (spec'd):** **Level 4** lists the entries mapped to that DLO, reverse-chronological — title, date, snippet, evidence thumbnail, AI confidence (High/Moderate), source ("From Logger" / "From [Module]") — each linking back to the full Portfolio entry.
- **Postconditions:** Navigation into the Portfolio entry.
- **Frequency / intensity:** Occasional; the "prove it to me" drill.
- **Success signal:** A capability claim is always one tap from its evidence — credibility by traceability.
- **Friction / risk:** **Not built** — an open question is whether L4 belongs here or whether evidence navigation should live entirely in the Portfolio. Heavily-evidenced DLOs could list 100+ entries with no pagination yet.
- **Design rationale:** Closes the loop entry→thread→DLO→entry, making the whole model auditable — important both emotionally (trust) and for compliance (defensibility).

---

## UC-C-05 — Per-child constellation switching

- **Primary actor:** P2 Dan
- **JTBD:** J4 — read each child's growth separately.
- **Trigger:** Taps a different child in the selector.
- **Main flow:** At Level 1, a crossfade to the new child's sky. At Levels 2–4, the drill **resets to Level 1** for the new child — a deliberate choice to discourage side-by-side comparison.
- **Postconditions:** Constellation re-scoped per child.
- **Frequency / intensity:** Common in multi-child families.
- **Success signal:** Dan reads each child on their own terms.
- **Friction / risk:** The reset-to-L1 can feel like lost context to a parent who wanted to compare the *same* thread across siblings — but that friction is intentional.
- **Design rationale:** Comparison between siblings is pedagogically corrosive; the reset quietly protects each child's record from becoming a leaderboard.

---

## UC-C-06 — Seeing tier progression (emerging → developing → demonstrating)

- **Primary actor:** P5 Rachel / P4 Nadia (proof of motion)
- **JTBD:** J4 — watch a capability *move*.
- **Trigger:** Returns over time and notices a thread's fill/tier has advanced.
- **Main flow:** Tier is computed at snapshot-rebuild from observation count (0 → unobserved; <3 → emerging; <8 → developing; 8+ → demonstrating — soft thresholds). The thread node's fill deepens and the tier badge changes (surface → ember-glow → sage); the Portfolio thread sidebar mirrors the same badge.
- **Postconditions:** None.
- **Frequency / intensity:** Slow-burn; the long-arc reward.
- **Success signal:** Nadia sees her first thread hit "developing" and feels tangible progress.
- **Friction / risk:** Count-based tiers can be gamed by volume; depth (DLO confirmation across tiers) is the truer signal and should temper raw counts over time.
- **Design rationale:** A visible, earned progression replaces grades with growth — motivating without being competitive or numeric.

---

## UC-C-07 — Spotting and closing capability gaps

- **Primary actor:** P1 Mara (loose planning) / P3 Steph (coverage anxiety)
- **JTBD:** J6 — find thin areas and nudge balance without a rigid schedule.
- **Trigger:** Notices dim domains/threads at L1–L2; or reads the Report's gap analysis.
- **Main flow:**
  1. In the Constellation, dim domains and dormant/ghost threads visually flag under-exploration.
  2. The **HEU Report** carries the *operational* gap view today: per-subject coverage bars, "Areas to Explore" (Critical = 0 entries / Moderate = 1), suggested actions, and "Explore" links into the library filtered by subject.
- **Alternate flows:** **[SPEC gap]** A dedicated Constellation gap-analysis / subject-balance *screen* is computed in the snapshot (`curriculum_coverage`) but **not yet surfaced as its own UI** — only the visual dimness and the Report's analysis exist.
- **Postconditions:** Parent forms a loose intention to explore a thin area.
- **Frequency / intensity:** Periodic; planning-adjacent.
- **Success signal:** "We've done no geography in months — let's go to the museum," prompted by a dim cluster.
- **Friction / risk:** Gap-spotting must never read as guilt or a deficit scorecard — framing is "areas to explore," never "areas you've failed."
- **Design rationale:** Hearth supports loose forward nudging without becoming a scheduler (Architecture Principle 1). Gaps inform; they don't prescribe.

---

## UC-C-08 — Cold-start constellation (the dark sky)

- **Primary actor:** P4 Nadia
- **JTBD:** J4 — understand what this will become before I've earned it.
- **Trigger:** Opens Capabilities before/with very few logs.
- **Main flow:** All domains dim; a Sparkle empty state: "Capabilities emerge from logging… Each thread grows from emerging to demonstrating as evidence builds." CTA "Log your first moment" → `/log`.
- **Postconditions:** Routed back to capture.
- **Frequency / intensity:** Once; retention-critical.
- **Success signal:** Nadia grasps that the sky lights up *because she logs* — the core loop, made visible.
- **Friction / risk:** A wall of darkness can read as "nothing here" rather than "this fills as you go" — copy must promise, not apologise.
- **Design rationale:** The empty constellation is the clearest single illustration of the capture→model loop; it sells the payoff to a parent with no data.

---

## UC-C-09 — The earned badge assessment (threshold → invitation, not auto-award)

- **Primary actor:** P5 Rachel / P4 Nadia
- **JTBD:** J3/J4 — have milestones recognised credibly, on my terms.
- **Trigger:** Accumulated DLO evidence crosses a badge threshold; the Constellation queues an assessment (it does **not** interrupt).
- **Main flow:**
  1. **After the next relevant log**, a secondary interface appears: "It looks like [Child] might be ready for [Badge]. Let's find out together."
  2. 3–5 assessment questions; the parent confirms (**Award**) or **Defer**.
  3. Awarded badges land on the Portfolio badge shelf (UC-C-09 feeds UC-P-07).
- **Alternate flows:** From the Logger save path, a "Badge ready" toast offers the 2-minute assessment with a deep link (and queues multiples).
- **Postconditions:** A badge awarded (or deferred) by an explicit parent decision; never auto-granted.
- **Frequency / intensity:** Periodic; a designed celebratory peak.
- **Success signal:** The badge feels *earned and confirmed*, not handed out — which is the only way it carries meaning.
- **Friction / risk:** Mistimed or too-frequent prompts feel like nagging; the "queue for after the next session, never interrupt" rule is the guardrail.
- **Design rationale:** Auto-awarding would cheapen the milestone and risk false positives on a credibility-sensitive record. Human-in-the-loop assessment keeps badges trustworthy.

---

## UC-C-10 — Module-focused capability view **[narrow/BUILT]**

- **Primary actor:** P1 Mara, planning with a specific module
- **JTBD:** J6 — see which capabilities a given module tends to develop.
- **Trigger:** Opens the module-scoped constellation (`src/app/(auth)/constellation/page.tsx`).
- **Main flow:** Reads capability weights from the module's pedagogy bundle to show which threads the module emphasises.
- **Postconditions:** None.
- **Frequency / intensity:** Niche; planning-time.
- **Success signal:** Mara picks a module knowing what it'll likely grow.
- **Friction / risk:** Easy to confuse with the per-child Constellation; the two serve different questions (content potential vs. child evidence).
- **Design rationale:** Connects the planned-content side to the capability model without making either primary.

---

# PART D — Cross-surface journeys

The three surfaces are one loop. These end-to-end journeys are where the architecture either sings or shows its seams.

## J-01 — The daily loop (capture → confirm)
`Dashboard → Logger (UC-L-01) → post-save reflection (UC-L-08) → back to Dashboard.`
The 90-second heartbeat. If this loop is heavy, nothing downstream gets data. **Health metric:** entries/active-family/week; thin-vs-substantive ratio.

## J-02 — The weekly meaning loop (reflect → motivate)
`Our Story → Portfolio scroll (UC-P-01) → expand a Journey card → Capabilities sky (UC-C-01) → watch a thread advance (UC-C-06).`
The retention engine. Converts accumulated capture into felt progress, which fuels more capture. **Health metric:** Our-Story sessions/family/month; correlation with subsequent logging.

## J-03 — The compliance loop (bank → assemble → prove)
`Year-round: flag work samples while reflecting (UC-P-05). At renewal: HEU Report (UC-P-09) → annotate (UC-P-10) → progression + export (UC-P-11).`
The do-or-die loop for registered families. Its success is overwhelmingly determined *months earlier* by whether J-01 ran consistently. **Health metric:** % of slots fillable from existing candidates at report-open; time-to-export; pre-deadline panic (notification-tier escalation rate).

## J-04 — The milestone loop (evidence → threshold → celebration)
`Logging (UC-L-*) → enrichment maps DLOs → Constellation queues a threshold → post-log assessment (UC-C-09) → badge on the shelf (UC-P-07).`
The dopamine loop. Must stay credible (human-confirmed) and well-timed (never interruptive). **Health metric:** assessment acceptance rate; badge-award→next-login retention.

## J-05 — The recovery loop (failure → honesty → repair)
`Enrichment fails → Portfolio "Generate now" (UC-P-06)` / `offline save → local draft → reconnect retry (UC-L-10).`
The trust loop. Every AI/network failure has an honest, recoverable surface. **Health metric:** enrichment failure rate; successful manual re-enrich rate; zero-data-loss across offline intervals.

---

# Appendix A — Consolidated edge-case catalogue

| # | Surface | Edge | Handling | Status |
|---|---|---|---|---|
| E1 | Logger | Save below the gate | No override; gate is absolute (50% quick / 65% guided) | BUILT |
| E2 | Logger | Deselect all children after rating | Per-child data purged; completeness recomputed; Save may re-disable | BUILT |
| E3 | Logger | Thin entry | Fast toast, no second screen; badge checks still run silently | BUILT |
| E4 | Logger | Enrichment timeout (30s) | Honest "couldn't draw insights" — never an infinite spinner | BUILT |
| E5 | Logger | Offline at save | Error toast; `localStorage` draft preserved; retry on reconnect | BUILT |
| E6 | Logger | Stale draft (>4h) | Restore banner + `draft_resume` notification | BUILT |
| E7 | Logger | Voice unsupported | Alert + inert button | BUILT |
| E8 | Logger | Large/non-image photo | `accept=image/*`; client resize before encode | PARTIAL |
| E9 | Logger | Cross-device draft | Device-locked `localStorage` only | OPEN |
| E10 | Portfolio | No entries / filtered-empty | Distinct empty states ("Your story starts here" / "Nothing logged this period") | BUILT |
| E11 | Portfolio | Multi-child entry | Appears per child, shows only that child's data | BUILT |
| E12 | Portfolio | Enrichment failed/stuck | "Generate now" + ~30s poll; rate-limited 10/hr/family | BUILT |
| E13 | Portfolio | Edit scope on shared entry | Edits the shared description for all children | WATCH |
| E14 | Report | <6 viable candidates | Banner + manual "browse all"; never blocks | BUILT |
| E15 | Report | Same entry, two slots | Conflict warning | BUILT |
| E16 | Report | Wrong term window | Soft amber warning, not a block | BUILT |
| E17 | Report | All annotations still AI-draft | Non-blocking integrity warning | BUILT |
| E18 | Report | Edit after export | "Edited since last export" badge; re-export anytime | BUILT |
| E19 | Report | Facilitator (private) notes | Encrypted; excluded from all exports and AI | BUILT |
| E20 | Capabilities | Empty/placeholder domains | Render unlit; substrate placeholders have 0 threads | BUILT |
| E21 | Capabilities | Colour-blind palette | Not yet safe; mitigated by shape glyphs ○◐● | OPEN |
| E22 | Capabilities | Explicit DLO confirmation | Implicit only (3+ high-confidence mappings); no parent "I saw this" | SPEC |
| E23 | Capabilities | L4 moments / heavy DLO lists | L4 not built; no pagination spec'd | SPEC |
| E24 | Capabilities | Circular DAG edge | Topo sort would break; validation absent | TBD |
| E25 | Cross | Stale snapshot across devices | No live update; refresh-bound | KNOWN |

---

# Appendix B — Suggested success metrics by job

| JTBD | Leading indicator | Lagging indicator |
|---|---|---|
| J1 Capture | Median time-to-save (target ≤90s quick) | Entries/active-family/week |
| J2 No-judgment | Pre-save insight view rate | Reduction in abandoned-draft rate |
| J3 Felt mattered | Post-save second-screen read-through | D1/D7 return after first log |
| J4 Feel the story | Our-Story session frequency | 4-week+ retention |
| J5 Prove it | % slots pre-fillable at report-open | On-time export rate; renewal retention |
| J6 Find gaps | Gap-view engagement | Coverage breadth growth over a term |

---

# Appendix C — Open questions for design & research

1. **Mobile capability lens.** The thread sidebar is desktop-only; mobile parents lose the per-thread Portfolio lens. Where does it go on small screens? (UC-P-02)
2. **Explicit DLO confirmation.** Should parents be able to confirm/override an AI DLO read? The spec assumes yes; nothing's built. Trust vs. effort trade-off. (UC-C-03, E22)
3. **L4 moments — here or in Portfolio?** Resolve the duplication: does evidence-from-capability live in the Constellation or only the Portfolio? (UC-C-04)
4. **Edit-scope clarity on shared entries.** Parents may not realise an edit fans out to all children. (UC-P-03, E13)
5. **Cross-device drafts.** `localStorage` is device-locked; Postgres-backed drafts would fix it but add network dependence. (UC-L-11, E9)
6. **Colour-blind-safe domain palette.** Currently leaning on shape glyphs; a true 15-domain accessible palette is owed. (UC-C-01, E21)
7. **Portfolio PDF export.** Spec'd, not built — would serve sharing with co-educators/grandparents distinct from the HEU PDF. (UC-P-11)
8. **Over-claiming guardrails.** How modest must pre-save and journey-observation copy be to avoid eroding trust? Needs qualitative testing with skeptical parents. (UC-L-05)
9. **Multi-child form length.** 4+ children make Engagement/Discoveries long; does the 5-minute rule survive large families? (UC-L-03)
10. **Cold-start wall.** Every Our-Story sub-surface is empty at once for a new family. Should there be a unified "your story is just beginning" onboarding state across all three? (UC-P-08, UC-C-08)

---

*End of compendium. This document is a living UX artifact — revise alongside `Hearth_System_Interaction_Map.md` and the per-surface specs as features move from SPEC to BUILT.*
