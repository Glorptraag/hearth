# Hearth — Launch Pivot v1 (Expo, 9 November 2026)

<!-- Version: 1 | Date: 2026-10-16 | Changes: initial. Repositions Hearth against the 2026 wave of AI photo-logger and AI-curriculum apps. Adds Photo Read (vision reads, parent confirms, authored notes interpret), exits the curriculum race via the Shelf, narrows launch scope, re-ranks moats around the HEU report. Amends hearth-notes-handoff-plan-v1.md (S3/S4/S6) and hearth-expo-launch-plan-v2.md (cut line, collateral). -->

> **Read with:** `hearth-notes-architecture-v2.md`, `hearth-notes-handoff-plan-v1.md`, `hearth-expo-launch-plan-v2.md`.
> **Status:** every P-decision below is *proposed* until Drew confirms it in `decisions.md`.
> **Calendar:** today Fri 16 Oct · freeze Wed 4 Nov (13 working days) · go/no-go Fri 6 Nov · Expo Mon 9 Nov.

---

## 0. Decisions log (runs first)

| # | Decision | Replaces / amends | Why |
|---|---|---|---|
| **P1** | **Lead with the record, not the method.** Hearth's launch promise: *"Whatever you did today, Hearth turns it into a record the Home Education Unit will accept — and tells you what to watch for next."* Pedagogy, Constellation and Shelf are proof points under that promise, not the headline. | Founding-brief order of emphasis for marketing only; product principles unchanged | The HEU report is the one outcome a QLD family must produce every year. No photo-logger in the market produces it from confirmed curriculum links. |
| **P2** | **Photo Read.** When a photo is attached, one Haiku vision call *reads* it: what is visible, what the child is doing, any printed lesson/page header. It never interprets learning. The output pre-fills "What happened" as an editable draft; on save it is the parent's words. | Amends notes-arch v2 rule "every sentence comes from the parent, a confirmed link, or siteCopy" → adds "or a vision draft the parent accepted, flagged `drafted_by: read`" | Closes the photo-logger gap without giving up the safety moat. Line held: **AI may describe; only authored knowledge interprets.** |
| **P3** | **Call budget per save:** text-only spontaneous save ≤ 1 call (unchanged); photo save ≤ 2 calls (Read, then Propose only if Resolve routes weak); structured save 0 calls (unchanged). Read capped at ~1,300 input tokens (image downscaled to 768 px long edge) + 250 output. | Handoff D9 one-call rule, for photo saves only; consistent with the Sept "open to 2 calls with a cap" decision | Cost stays fixed and predictable per save. |
| **P4** | **Photo Read is opt-in at the first photo**, with one-screen disclosure (what is sent, that nothing is kept by Hearth beyond the run tape, how to turn it off). Off = photo stored, nothing read. GPS stripped client-side before upload; EXIF date kept for `when`. | APP 5 interstitial copy; #233 AI label | Children's photos. Disclosure is also a trust differentiator against apps that read silently. |
| **P5** | **Exit the curriculum race.** Hearth does not generate curriculum, lesson plans or worksheets at launch. Position: *"Use anything. Or nothing. We'll make it count."* The Shelf is the curriculum strategy: recognise what families already use. | Expo copy; Explore surface emphasis | Generators are now commodity (lesson plans in seconds, AC v9 "aligned"). Racing them burns authoring capacity Hearth needs for knowledge notes. |
| **P6** | **"Working from" gains two universal sources:** *My own plan* and *An AI-made plan* (free-text title + optional photo of the page). Both route through Photo Read and Resolve like any moment. | WS2 Tier 3 | A family using a competitor's generated curriculum still needs Hearth to make it count. Their output becomes Hearth's input. |
| **P7** | **HEU annotated work samples become the hero output.** A moment with a photo and a confirmed link renders as an annotated sample: parent's words + DLO plain-language line + band sentence (all authored or parent-owned). The Report collects them per learning area. | Report query (S5) unchanged in data; rendering changes | QLD HEU asks for annotated samples and an overview of progress. This is the exact artefact. |
| **P8** | **Narrow authored scope to F–Year 3 (ages 4–9)** for DLO notes before the expo, prioritised by what photos and Shelf wave 1 actually hit: early literacy, early number, science/nature, art/making. | Handoff §4 authoring (~50 DLO notes stays the count; targeting changes) | Depth beats breadth at the stand; matches Shelf Tier 1 age band. |
| **P9** | **Cut from launch scope:** `/ask` Q&A, cue-suggestion nightly job, coverage admin UI (keep the SQL), Hearths in the demo, Spark/Servo "coming soon" copy, tranche-3 mapping beyond F–Y3 threads, Shelf Tier 2, Marketplace, Module Builder, Planner, badges (flagged off, not deleted). | Expo plan v2 P1 list; handoff S6 | Pays for Photo Read inside the existing freeze date. Every cut is reversible. |
| **P10** | **Constellation stays, simplified, as the visual of the same rows the Report prints:** Constellation = *what's growing*, Report = *what's evidenced*. No separate store, no snapshot. | Already true in handoff S5; this fixes the story told at the stand | One data model, two views — the coherence Drew asked for. |

Pricing (E-3), membership model (E-2) and the no-free-tier stance are **not** reopened. See §8 risk on free-tier competitors.

---

## 1. What changed in the market

| Pattern | Examples seen (Oct 2026) | What it means for Hearth |
|---|---|---|
| Snap a photo → AI writes an "educational caption", sorts by subject, exports a PDF portfolio | Homeschool Moment, Homeschoolfolio (SA), Homeschool Moments (bulk import), a UK app tagging KS1–3 skills from photos | Photo-to-log is now table stakes. Hearth without it looks slower than a vibecoded app. |
| Light logging + AI "learning outcomes" + PDF report | Strew (UK, AU-adjacent pricing), Chalk, grovio, HomeTrail (free tier + paid assistant) | Generic outcomes, generic reports. None tie to confirmed AC v9 links or HEU annotation format. |
| AI curriculum / lesson plan generators "aligned to AC v9" | My Curriculum Mate, Kuraplan, Mentora, Unskool (AU, plans + evidence), app-store "generate a year in one tap" planners | Curriculum is commoditised. Racing here is unwinnable on authoring capacity. |
| Curriculum provider owns the report | Euka's Government Report Creator (premium add-on, tied to Euka programs) | Validates that families pay for the HEU report — but only inside one curriculum. Hearth does it for *any* curriculum. |

**Read:** the competitors are wide and shallow. They write captions; Hearth writes evidence. The pivot is to make that difference visible in under 90 seconds.

---

## 2. The redefined product

**One sentence:** Hearth turns whatever your family did today into an HEU-ready record, and tells you what to watch for next.

**Three verbs (the whole launch app):**

1. **Snap** — photo or a line; Hearth reads it; "Working from" predicts the lesson if it's a worksheet.
2. **Confirm** — tap the chips that are right. That tap is what makes it evidence.
3. **Report** — annotated samples and the progress overview assemble themselves; Constellation shows what's growing.

Plus one quiet fourth: **Watch for next** — the authored, tradition-flavoured line under every confirmed moment.

**Not at launch:** curriculum generation, planning, marketplace, building modules, badges, Q&A chat, co-op features, sister apps.

---

## 3. Moats, re-ranked

| Rank | Moat | Why it holds | How it shows at the stand |
|---|---|---|---|
| 1 | **HEU reporting** | Built on confirmed links × AC v9 behind the scenes; annotated samples in the HEU's own terms; works for any curriculum | The Report page growing by one annotated sample after the visitor confirms one chip |
| 2 | **Safe, structured AI** | AI reads and proposes; authored notes interpret; parent confirms; every sentence traceable (dev overlay); fixed cost per save | The "Not this?" alternatives and the confirm tap — nothing becomes record without the parent |
| 3 | **Quality (authored knowledge)** | Knowledge notes written once, reviewed by a human, consistent voice; sparse input gets "add one detail", never embellishment | The *Watch for next* line reading like a CM / Montessori teacher, not generic praise |
| 4 | **Constellation** | Visual of real, confirmed growth — not a gamified streak | A star lighting after confirm; tap → the moment |

Photo Read is **parity**, not a moat. Ship it so the moats get seen.

---

## 4. Photo Read — specification

### 4.1 Flow (fits the 5-minute rule: capture ≤ 90 s)

1. Parent taps 📷 (camera or camera roll). Client downscales to 768 px long edge, strips GPS, keeps EXIF date.
2. First time only: disclosure sheet (P4). Opt-in stored on `families`.
3. `POST /api/moments` with photo → `after()` runs **Read**.
4. Read returns structured fields (4.2). "What happened" pre-fills with `doing` as an editable draft; if printed text matches a Shelf alias, a **"Working from: Math-U-See Alpha · Lesson 12?"** chip appears (alias match, zero LLM).
5. Parent edits or accepts, adds per-child *said* / *felt* if they want, saves.
6. Resolve runs on parent line + `seen[]` + `doing` → strong (0 more calls) / weak (Propose, the second call) / none ("tap a thread").
7. Post-save: chips → confirm → four assembled blocks (unchanged from S4).

### 4.2 Read output schema (validated; refusal → empty, never invented)

```json
{
  "seen": ["up to 8 short noun phrases of visible things"],
  "doing": "one observable sentence, present tense, ≤ 20 words, no evaluation, no names",
  "artefact": "worksheet | book | writing | drawing | build | nature | cooking | screen | other",
  "printedText": "≤ 12 words: a visible title, lesson or page header only",
  "peopleVisible": 0,
  "confidence": "high | low"
}
```

Prompt rules (live in `src/lib/notes/read.prompt.md`, versioned like Propose): describe only what is visible; never name a skill, subject, outcome, age or quality; never guess identity; transcribe headers only, never body content of a page (copyright, E-9); low confidence → `doing` empty.

### 4.3 Data

- `moments.drafted_by` (`parent | read`) and `moments.read_run_id`.
- `moment_runs.stage = 'read'` rows with tokens and output (the tape).
- No new table. No change to `moment_links`.

### 4.4 Catch up the week (P1 — first thing cut if S4 slips)

Select up to 10 photos from the camera roll → each becomes a draft moment dated from EXIF → a swipe queue: accept / edit / skip, ~20 s each. This is retrospective logging in its most natural form and the direct answer to bulk-import competitors.

### 4.5 Fixtures

Add 10 photo fixtures to `fixtures/moments/`: worksheet with header, worksheet without header, child's drawing, LEGO build, creek/rocks, baking, reading a picture book, handwriting page, nature table, tablet screen. Each asserts `artefact`, Shelf match (where present), Resolve route.

---

## 5. Exiting the curriculum race

- **Stop:** no new pack authoring before the expo. Starter Pack and Jumpstart Classical stay live as membership-included *ideas to try* in Explore — never marketed as curriculum.
- **Shelf wave 1 only** (three resources Drew named for the demo). Breadth comes from the stand tally afterwards.
- **P6 sources** (*My own plan*, *An AI-made plan*) make every competitor's generated curriculum loggable in Hearth.
- **Post-expo opportunity (not before):** the HEU also asks for an updated program summary for next year. Assemble it from the family's Shelf + active threads — an assembly of what they already use, not a generated curriculum. This is the HEU moat extending forward without entering the race.

---

## 6. Scope delta and calendar (to freeze, 4 Nov)

Assumes S0–S2 of the handoff plan are landed or landing. **If they are not, Drew confirms where they stand before S3 starts — this changes the cut order, not the decisions.**

| Window | Session | Change from handoff plan v1 |
|---|---|---|
| 19–22 Oct | **S3** Resolve · Propose · Confirm · Assemble | **+ `read.ts` + `read.prompt.md`**, Read stage in the tape, Shelf alias match on `printedText`, 10 photo fixtures. Acceptance adds: worksheet fixture → Shelf chip; creek photo + one parent line → weak → Propose → S5-02 proposed; total ≤ 2 calls. |
| 22–28 Oct | **S4** Logger v4 + post-save | **+ photo-first capture, disclosure sheet, draft pre-fill, Working-from chip from Read.** Catch-up queue only if S4 core is green by 26 Oct. |
| 27–31 Oct | **S5** Show | **+ annotated-sample rendering in Report (P7)**; Constellation copy "what's growing" (P10). Dashboard = recent moments · chips to confirm · one watch-for line. |
| 2–4 Nov | **S6** (shrunk) | Flags + docs only. `/ask`, coverage UI, cue suggestions **removed** (P9). |
| From 10 Nov | **S7** | Unchanged, plus `/ask`, cue suggestions, catch-up queue if cut, program-summary assembly, Shelf Tier 2. |

**Never cut (updated):** S1 export integrity + golden replay, Read schema validation and refusal path, Confirm, post-save chips, Report query + annotated samples.

**Cut order if the calendar slips:** catch-up queue → context prior → family cues → weekly review → Constellation L3 thread note (keep counts + moments) → Photo Read on camera roll (keep camera only).

**Parallel workstreams unchanged:** stores (WS1), membership (WS4), demo family (WS5) — demo seed adds 6 photo moments so Read is visible in the reset family.

---

## 7. Expo

**Line on the banner:** *Any curriculum. Or none. Ready for the HEU.*

**90-second demo (stand phone, curated photos):**
1. Snap a worksheet photo → "Working from: [wave-1 resource] · Lesson N?" appears. (10 s)
2. Accept the draft line; tap the chip that's right. (15 s)
3. Read the *Watch for next* line aloud in the visitor's tradition. (15 s)
4. Open Report: the annotated sample is already there, under the right learning area. (20 s)
5. Constellation: the star that just lit. (10 s)
6. "Try it with a photo from your own week" → QR → trial on their own phone. (20 s)

Visitor photos only ever go into the visitor's own account, never the stand demo family.

**Collateral copy points (no competitor names):** other apps write a caption, Hearth writes evidence · nothing becomes the record until you confirm it · works with whatever you already use · one price, no ads, no upsell.

---

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Free-tier competitors make $16/mo look steep at the stand | Conversion | Founding $99/yr + 14-day trial already set; pitch the HEU report as the thing families currently pay a curriculum provider for. Revisit after the expo tally, not before. |
| Vision misreads (wrong lesson, wrong activity) | Trust | Read never writes record without parent edit/accept; Shelf chip is a question; fixtures pin regressions. |
| Children's photos sent to a model | Trust, compliance | P4 opt-in + disclosure; downscale; GPS stripped; tape retention per privacy model; check API data-retention terms before go-live. |
| Authoring backlog (≈50 DLO notes + threads + traditions) | Watch-for lines missing | P8 targeting; DLOs ranked by fixture + wave-1 hits; unauthored DLO → block omitted, never generated. |
| S0–S2 status unknown to this plan | Calendar | Drew confirms before S3; cut order in §6 absorbs up to ~4 days. |
| Project knowledge at ~98% of capacity | New docs fail to save | Prune the 35 superseded files flagged in COMPONENT_REGISTRY.md before the next planning doc. |

---

## 9. Drew's tasks

| When | Task |
|---|---|
| Now | Confirm or amend P1–P10 in `decisions.md`; say where S0–S2 actually stand. |
| Now | Choose Photo Read default at first photo: opt-in (recommended, P4) or opt-out. |
| This week | Pick the 10 real photos for fixtures and the 6 for the demo family (anonymised, no faces needed). |
| This week | Approve the disclosure sheet copy (Claude drafts in S4). |
| Ongoing | DLO note confirmations re-targeted to F–Y3 per P8. |
| Before 23 Oct | Prune superseded project files. |

---

## 10. Propagation

| Target | Change |
|---|---|
| `decisions.md` / `docs/hearth-decisions-log-v1.md` | P1–P10 |
| `hearth-notes-architecture-v2.md` → v3 | Read stage, `drafted_by`, the describe/interpret line, 2-call photo budget |
| `hearth-notes-handoff-plan-v1.md` → v2 | S3/S4/S5/S6 rows per §6; new paste-ready S3/S4 prompts |
| `hearth-expo-launch-plan-v2.md` → v3 | Cut line per P9; collateral and demo per §7; Spark/Servo removed from `/expo` |
| `hearth-marketing-content-plan-v1.md` → v2 | Positioning P1/P5; banner line; copy points |
| APP 5 interstitial, #233 AI label | Photo Read disclosure |
| `COMPONENT_REGISTRY.md` | Logger v4 (photo-first), Report annotated samples, flagged-off screens listed |

---

*v1 — 16 October 2026. Market evidence gathered the same day; ranking of competitors is indicative, not exhaustive.*
