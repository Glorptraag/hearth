# content/: authored drafts for the Hearth Cycle

This folder holds **authored content drafts**: parent-facing text that Hearth shows but never writes at read time. Each file is reviewed in a PR, confirmed by Drew, and then pushed to Sanity by a script.

**That script doesn't exist yet.** It's planned as `scripts/push-knowledge-notes.ts` in `docs/hearth-cycle-build-plan-v1.md` HC-2b (`content/**/*.yaml` → Sanity drafts, modelled on the pivot's `push-dlo-note-drafts.ts`). The tradition lines are pushed in HC-1b onto `pedagogicalFramework`. Until those land, these files are the source of truth for the text, and nothing in the app reads them.

## Lifecycle

```
draft (this folder, PR review)
  → Drew confirms: sets confirmedAt (ISO date) and confirmedBy, status stays draft until push
  → push script writes a Sanity draft
  → published in Sanity
  → the app reads it (GROQ filtered on status == "published" && defined(confirmedAt))
```

- **Unconfirmed content never renders.** A file with `confirmedAt: null` is a draft, whatever else it says.
- **Nothing is generated at read time.** Screens compose from these confirmed notes by lookup (WF §2.7, D57). The only model call in the Cycle is at plan write time and only picks IDs. It never writes the text here.
- Changing a confirmed note's text means setting `confirmedAt` back to `null` and confirming it again.

## What's here

| Path | What | Maps onto (planned) | Spec |
|---|---|---|---|
| `craft-notes/<id>.yaml` | The 11 E1–E2 craft notes | `knowledgeNote` with `kind: craft` | WF §8.1 (shape), §8.2 (catalogue), §7.7 (triggers) |
| `lesson-patterns/<id>.yaml` | The four expo lesson patterns | `knowledgeNote` with `kind: pattern` (a later kind in HC-2b; patterns are used by HC-13, the Lesson Builder) | Brief §4.1–4.2; build plan §3 (pattern vs method) |
| `traditions/watch-how.yaml` | The 20 `watchHow` lines + Waldorf stage override + Eclectic rule, and `notifyDefault` | Extension of `pedagogicalFramework`: `watchHow {does, says, makes, chooses}`, `stageOverrides`, `notifyDefault` (HC-1a schema, HC-1b push) | WF §3.4, §8.1 |
| `expo/hearth-cycle-section.md` | `/expo` section copy, the stand card and the research card | Pasted into the pivot's `expoCopy.ts`; not pushed to Sanity | Brief §1, §10 |

Abbreviations: **WF** = `docs/hearth-watch-for-v1.md` · **Brief** = `docs/hearth-cycle-brief-v1.md` · **LC** = `docs/hearth-learning-cycle-v1.md` · **PL** = `docs/hearth-pedagogy-layer-v1.md`.

### Shared fields

Every YAML file carries `id`, `kind`, `status: draft`, `confirmedAt`, `confirmedBy` and `source` (the spec section it comes from).

Cross-reference IDs:
- `relates.practices` and pattern `practices` use PL §5.7 practice-note IDs (e.g. `cm.narration`, `montessori.three-period`).
- `relates.methods` and `usedByMethods` use LC §5 method IDs (e.g. `cm.living-book`). LC §3 writes the full note ID as `method.cm.living-book`, and the push script adds that prefix.
- Tradition keys are the repo's `pedagogicalFramework.slug` values: `charlotte_mason`, `classical`, `montessori`, `waldorf_steiner`, `unschooling`, `eclectic`. See the slug-drift note at the top of `traditions/watch-how.yaml` (build plan G11).
- `relates.dlos` is empty in all of the craft notes for now. Craft notes reach today's sessions through practices and methods, and DLO links can come later.

## Validation rules

The push script and the Content QA entry for knowledge notes (HC-2b) enforce these. Until then, the PR reviewer checks them.

**Craft notes** (WF §8.1)
- `body` ≤ **40 words** at E1–E2, ≤ 90 words at E3–E4.
- `why.short` is one line of ≤ **15 words**. `why.deeper` is optional, belongs to E3+ `understand` cards, and is left out of all E1–E2 notes.
- `strand` ∈ `prime · notice · record · respond · craft` (WF §7.1).
- `stage` ∈ `E1 · E2 · E3 · E4` (minimum stage). `card` ∈ `try · understand · notice`. `tradition` is `neutral` or a tradition key.
- `cooldown`: days before the same note can show again (WF §5.3, default 28).
- Every `trigger[].kind` comes from the fixed list below. A note with no `trigger` is chosen only by relevance to today and by strand (WF §5.3).

**Trigger kinds (fixed list, coded once).** Each kind comes from one row of WF §7.7. All windows are the last 14 days unless the trigger sets `days`.

| Kind | WF §7.7 row (pattern) | Params |
|---|---|---|
| `notyet-repeat` | same not-yet sign ×2 on one DLO | `count`, `days` |
| `didnt-come-up-repeat` | "Didn't come up" ≥ 3 across watch-fors | `count`, `days` |
| `outcome-repeat` | a method outcome repeats (e.g. living-book "Needed prompting" ×2) | `count`, `days`, `method`, `outcome` |
| `no-parent-move` | Partly/Not yet with no parent move (E3+) | `count`, `days` |
| `saw-it-rate-high` | Saw-it rate > 80% over 3 weeks on one thread | `rate`, `days` |
| `weekday-skips` | sessions often moved or skipped on one weekday | `count`, `days` |
| `tried-then-partly-drops` | `tried` on a tool + Partly rate dropping | `note`, `days` |

In the 11 E1–E2 notes, only three triggers are used: `craft.set-it-up` (`didnt-come-up-repeat`), `craft.lighter-day` (`weekday-skips`) and `craft.wait-time` (`notyet-repeat`, as in the WF §8.1 example). The other kinds belong to E3+ notes and to tradition craft cards that haven't been written yet (e.g. the CM "Read it once, then stop talking" card, row 3).

**Lesson patterns** (Brief §4.1)
- 3–5 `moves`, each `{key, label, parentAction}`. `parentAction` ≤ **20 words**, and its only slots are `{activity}` and `{child}`. Any other slot would need text extraction, so the Lesson Builder asks the parent instead (build plan HC-13).
- `watchForSlot.evidenceKinds` ⊆ `does · says · makes · chooses` (WF §3.4).
- `whyItWorks` is 2–3 sentences. `commonMistakes` has 2–4 lines, written parent to parent.
- Pattern text is philosophy-neutral. Tradition specifics go only in `traditionFit[].note`.

**Tradition `watchHow`**
- The lines are transcribed **verbatim** from WF §3.4. Change the spec first, then re-transcribe.
- Each `watchHow` has exactly the four kinds. `stageOverrides` keys must be stage keys that tradition already has (PL §5).
- `notifyDefault` ∈ `planned · monday`.

**Voice (all files).** Hearth's own words, in Australian English. Short, warm and plain. No "should", no praise of the parent, no streaks, scores or gap language, and no "AI". Offers, not assignments. Methods are described in our words, and books are never quoted.

## Not here: DLO notes

`content/dlo-notes/` (50 DLO watch-for drafts, `batch-*.json`) lives on the unmerged pivot branch (`claude/hearth-launch-pivot-v1-175462`), not on this branch. Under decision **D-HC-5** (`docs/hearth-decisions-log-v1.md`), those drafts are being re-cut to neutral only. The per-tradition `variants` are dropped, and `traditions/watch-how.yaml` carries the tradition instead (build plan HC-1a/HC-1b).
