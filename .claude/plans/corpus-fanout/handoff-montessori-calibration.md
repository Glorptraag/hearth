# Montessori pt1 rebuild — calibration batch (W2-CAL) — handoff

Scope delivered: the load-bearing entries lost in the stalled April 2026 session. 14 files, all `status: published`, all `suggestedDraft: true`. Source texts were checked against the actual Project Gutenberg plain-text files (#39863 Anne E. George translation, #29635 Handbook), retrieved via the GITenberg GitHub mirror because gutenberg.org, archive.org and wikisource are blocked at the session's egress proxy. Every `isParaphrase: false` block was then machine-compared to the source text (whitespace, italics and dash normalisation only) and every quoted phrase inside the practice-pattern and marker prose was checked the same way. No novel tags were needed.

## 1. Entries

| filename | id | layer | source (SE only) | verbatim / paraphrase | confidence in source fidelity | novel tags |
|---|---|---|---|---|---|---|
| source-excerpts/montessori-001-discipline-through-liberty.md | montessori.001 | SE | montessori-method-1912 | verbatim | high (machine-checked) | — |
| source-excerpts/montessori-002-limit-of-liberty-teacher-as-observer.md | montessori.002 | SE | montessori-method-1912 | verbatim (one marked omission) | high | — |
| source-excerpts/montessori-003-auto-education-control-of-error.md | montessori.003 | SE | montessori-method-1912 | verbatim (four marked omissions) | high | — |
| source-excerpts/montessori-004-handbook-motor-education-disorderly-movement.md | montessori.004 | SE | montessori-own-handbook-1914 | verbatim | high | — |
| source-excerpts/montessori-005-handbook-cylinders-control-of-error-repetition.md | montessori.005 | SE | montessori-own-handbook-1914 | verbatim (one marked omission) | high | — |
| source-excerpts/montessori-006-handbook-freedom-wait-while-observing.md | montessori.006 | SE | montessori-own-handbook-1914 | verbatim | high | — |
| source-excerpts/montessori-007-child-defends-his-work.md | montessori.007 | SE | montessori-method-1912 | verbatim (one marked omission) | high | — |
| source-excerpts/montessori-008-handbook-moral-factors-eliminate-disorder.md | montessori.008 | SE | montessori-own-handbook-1914 | verbatim (one marked omission) | high | — |
| source-excerpts/montessori-009-handbook-dressing-frames-defend-themselves.md | montessori.009 | SE | montessori-own-handbook-1914 | verbatim (one marked omission) | high | — |
| practice-patterns/montessori-003-material-misuse.md | montessori.003 | PP | — | — | high (every quoted phrase traced to the 1912/1914 texts) | — |
| practice-patterns/montessori-004-gross-motor-before-fine-motor.md | montessori.004 | PP | — | — | high (as above) | — |
| observational-markers/montessori-001-spontaneous-repetition-work-cycle.md | montessori.001 | OM | — | — | high | — |
| observational-markers/montessori-002-normalisation-signs.md | montessori.002 | OM | — | — | high for the 1912/1914 description; see note on the term | — |
| observational-markers/montessori-003-sensitive-period-defence.md | montessori.003 | OM | — | — | high for the 1912/1914 description; medium for the order-insistence clause (see below) | — |

Counts: 9 SE, 2 PP, 3 OM. SEs 001–003 and 004–006 are the ones the brief asked for; **SEs 007–009 go beyond the brief** and exist because the three markers needed direct 1912/1914 ground (the child's defence of his work; disorder eliminated vs. liberty for the orderly; the dressing frames). Drop them if the review budget is tight — the markers' `## Grounded in` lists would then need those three links removed.

## 2. What I could not do / what Drew should check

- **Page numbers.** The 1912 and 1914 contents pages give the start page of each section (e.g. "Discipline through liberty" p. 86; Handbook "Motor Education" p. 20, "Sensory Education" p. 29, "Freedom" p. 77, "Moral Factors" p. 114). I cite those section-start pages and say so in each `pageOrChapter`; I have not invented a page for passages that sit deeper in a section. If Drew wants exact pages, the Stokes 1912/1914 scans on archive.org will give them (blocked from this session).
- **"Sensitive periods" and "normalisation" are later Montessori vocabulary.** Neither phrase occurs in the 1912 Method or the 1914 Handbook; they come from the post-1929 books (The Secret of Childhood, The Absorbent Mind), which are Montessori-Pierson controlled and unregistered. The existing `sensitive_periods` and `normalisation` tags are applied to 1912/1914 passages that describe the phenomena the later terms name, and each affected entry says so in its text or `## Context`. Review question: is Drew comfortable with the markers using the later names in `markerName` (with the 1912/1914 names given alongside), or should they be renamed to the period-faithful "spontaneous discipline" / "defence of developmental work"?
- **OM 003, order-insistence clause.** The "Look for" bullet on exact sequence/placement and the sentence "Montessori's later writing treats the insistence on exact order as the same phenomenon" rest on the later sensitive-period-for-order material, not on a registered source. The 1912/1914 texts ground the *defence* (dressing frames, "defend themselves with all their might", the Chapter XXI rebellion passage) fully; they do not ground order-insistence. Confidence medium on that clause; delete it if a registered source is required for every claim.
- **Chapter XXI is an American-edition addition.** Montessori wrote it for the 1912 English edition ("since the publication of the Italian version"), so SE 007 has no Italian original to compare against. Noted in its `## Context`.
- **The brown stair is called "brown prisms" and "the broad stair" in the 1914 text, "pink tower" is "the tower".** I used the modern names in PP/OM prose and the period names only inside verbatim text.
- **Unquoted paraphrases inside PP/OM prose** (e.g. the Pincian Gardens baby, the pink-tower "building and destroying" description, "True rest for muscles…") are attributed to Montessori in-line. The baby-with-the-pail story is from Method Chapter XXI; I chose not to make it a tenth SE to limit review load — it would be a strong one if the SE layer wants it later.
- **No contraindications, worked examples or FV changes** were in scope and none were written. The surviving FV micro-script ("The cubes are not for bashing. They go back on the shelf.") is quoted in PP 003 as Hearth's Montessori voice so the two cohere.
- **Not run:** `npm run corpus:check`. A Python mirror of `LAYER_CONTRACTS` + the frontmatter grammar + tag/wikilink/thread/ageRange checks + verbatim comparison passed on all 14 files; the real compiler should still be the gate.

## 3. Practice patterns — interpretive, not prescriptive

- **PP montessori.003 (material misuse):** the Response explains how Montessori *reads* misuse (the one limit her liberty has; misuse as information — wrong moment, body needs movement, fatigue, forgotten presentation, or not misuse at all) and describes what a directress "would typically do" as the tradition's practice. No "you must"; the only imperative-shaped sentence is the quoted facilitation-vocabulary micro-script, attributed as Hearth's Montessori voice.
- **PP montessori.004 (gross motor before fine motor):** the Response explains how Montessori reads restlessness (movement seeking order; large before small; movement as rest), with the tradition's typical sequencing described as what "a Montessori adult would typically do". The Anti-pattern names moves the tradition rejects, with its reasons, rather than instructing the parent.

## 4. Coherence with the survivors

- WE 006 (pink tower misuse) → PP 003 reproduces its reading and its one-sentence response; PP 003 also supplies the "across many materials → more gross-motor release" branch WE 006 points to via PP 004.
- WE 005 (no, me do it) → OM 003 is the marker it cites; SE 007 and SE 009 are its ground.
- WE 004 (interrupted cycle), WE 001 (button frame), CI 002 → OM 001.
- OM 004–006, WE 007 → OM 002 (normalisation) names them as its constituent signs.
- FV restraints ("do not re-present the same material the same day", "observe from distance") are respected and quoted where relevant.
