# Hearth spec chain — 7 Oct to 21 Oct 2026

Drop every file in this folder into `docs/`. These are the specs that sit on top of `hearth-notes-architecture-v1.md`, `-v2.md` and `hearth-notes-handoff-plan-v1.md` (already in `docs/` per the handoff plan §1). If any of those three are missing, stop and ask Drew for them.

## Files

| File | Date | Role | Decision IDs |
|---|---|---|---|
| `hearth-coherent-system-passes-v1.md` ("Three Passes") | 7 Oct | Background. Diagnoses the six roots (R1–R6) and sets the coherence invariants. Pass 3 is the target; superseded by notes-architecture v1 wherever they differ. | — |
| `hearth-launch-pivot-v1.md` ("Launch Pivot v1") | 16 Oct | Expo positioning, Photo Read, scope cuts. Amends handoff plan S3–S6. | P1–P10 |
| `hearth-pedagogy-layer-v1.md` | 20 Oct | Traditions as signal tables; practice notes; neutral DLOs. Supersedes notes-architecture v2 §4, D19–D21. | D36–D45, C10–C13 |
| `hearth-learning-cycle-v1.md` | 21 Oct | Rhythms, method notes, the ten-action turn, Today/Week. Replaces Planner and Dashboard. | D46–D55, C14–C18 |
| `hearth-watch-for-v1.md` | 21 Oct | Watch-fors, loose-plan priming, morning cards, conversational log, hidden educator path (E1–E4). | D56–D68, C19–C25 |
| `hearth-cycle-brief-v1.md` | 21 Oct | Concept brief: the Hearth Cycle as product pillar. Lesson patterns, Lesson Builder, Craft library, Know Your Child, linked community, My Teaching. Proposed, not specced for build. | B1–B9 |

## Precedence

Newest wins where two docs conflict, in this order:

1. `hearth-watch-for-v1.md`
2. `hearth-learning-cycle-v1.md`
3. `hearth-pedagogy-layer-v1.md`
4. `hearth-launch-pivot-v1.md`
5. `hearth-notes-architecture-v2.md` → `-v1.md` → `hearth-notes-handoff-plan-v1.md`
6. `hearth-coherent-system-passes-v1.md`

`hearth-cycle-brief-v1.md` sits above the chain as direction, not build spec. Nothing in it is buildable until Drew confirms B1–B9 and it gets its own spec.

## Known conflicts the plan must resolve explicitly

| Topic | Older doc says | Newer doc says | Use |
|---|---|---|---|
| Planner | Launch pivot P9: cut from launch | Learning cycle D50/C15: Planner and Dashboard replaced by Today and Week | Today/Week (learning cycle) |
| Logger fields | Notes-arch v1 §4.1: seven fields incl. `said`, `felt` | Pedagogy layer D40: `said` → `lens`. Watch-for D57/D68: `lens` absorbed into watch-for `how` on sessions; `felt` removed from session logs | Session logs follow watch-for §6; spontaneous capture keeps `lens` as the words label |
| Confirm for declared targets | Notes-arch v1 §6 stage 4: chip per declared link | Watch-for D61: "Saw it" on the watch-for is the confirmation for that DLO | Watch-for D61 |
| Post-save blocks | Pedagogy layer §7: five blocks incl. "Through your lens" | Learning cycle D53/C16: "through your lens" removed; one-line `why` per next step | Learning cycle |
| Direction rules | Pedagogy layer §8 | Learning cycle D48: folded into method `turn.pattern` and week shape | Learning cycle; signals kept for spontaneous moments only |
| Locked project rule "Retrospective logging is the core interaction…" | CLAUDE.md / project instructions | Learning cycle C14: "Logging is the core act. Every log produces the next step; planning is what logging produces, never a blank page." | C14 wording once Drew confirms |
| Photo Read | Launch pivot P2–P4 (≤ 2 calls on photo saves) | Not contradicted by later docs | Stands |

## Decision status

All C-items (C10–C25) and B-items (B1–B9) are **proposed with defaults**; P1–P10 are proposed. Check `docs/hearth-decisions-log-v1.md` for Drew's confirmations. Where a decision isn't recorded as confirmed, the plan treats its stated default as a working assumption and lists it under "Assumptions pending confirmation" — it does not block on it and does not silently treat it as locked.

## Instruction for the plan

- Cite these files by name and section; they are now in the repo.
- Add every D/C/P/B ID above to the decisions log in the docs PR, marked proposed or confirmed.
- Anything the plan relies on that is only in `hearth-cycle-brief-v1.md` goes in a separate post-expo phase.

---

## Repo note (added 21 Oct 2026, on commit to `docs/`)

The six spec files above are committed byte-for-byte as uploaded. This note is the only addition.

- **The three base docs are not in the repo.** `hearth-notes-architecture-v1.md`, `-v2.md` and `hearth-notes-handoff-plan-v1.md` are absent from `docs/`, from every branch and from git history. Drew's call (21 Oct, D-HC-3 in `hearth-decisions-log-v1.md`): don't block. The chain's nouns map onto existing tables, which extends launch-pivot A2, and every unresolved concept is flagged. The mapping is binding and lives in `hearth-cycle-build-plan-v1.md` §2.
- **The build plan of record for this chain** is `hearth-cycle-build-plan-v1.md`. It reconciles the chain against `main` and against the unmerged launch-pivot branch (`claude/hearth-launch-pivot-v1-175462`, plan `hearth-launch-pivot-plan-v1.md`).
- **The decision IDs above are logged** in `hearth-decisions-log-v1.md` under "Spec chain and Hearth Cycle". All of them are proposed except the D-HC items Drew decided on 21 Oct.
