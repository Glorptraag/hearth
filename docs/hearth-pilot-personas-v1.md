<!-- Version: 1 | Date: 2026-06-10 | Changes: Initial creation. Composite hypothesis personas drawn from founding-brief archetypes + pilot evidence, with capture template for real pilot-family data. -->

# Hearth — Pilot Personas v1

> **Status:** Hypothesis. These personas are **composites synthesized from the founding brief's three archetypes** (`hearth-founding-brief-v1.md` §2) and the limited pilot evidence to date — **not yet grounded in interviews with real pilot families.** Every empirical claim is tagged `[TO VALIDATE]`. As real profiles arrive via the capture template (§6) and the research log (`hearth-research-log.md`), validated claims lose their tag and contradicted claims are corrected with a log reference. A persona with no validations after the first pilot term should be treated as fiction and rewritten or retired.
>
> **Method:** The founding brief names three points on a confidence spectrum — a parent with existing resources who needs tracking, a parent who wants structured content, and a parent growing toward designing her own learning. Personas 1–3 give each a face. Persona 4 covers the community (Hearth groups) and co-facilitator surface, which the archetypes predate.
>
> **Rule:** Specs cite personas by name ("Renee opens the Logger one-handed"). When a design decision serves no persona, that is a signal worth examining.

---

## 1. Renee — "I'm already doing it; show me what it counts for" (Tracker)

**Founding-brief archetype:** parent with existing resources who needs tracking + the AI-assisted pedagogical lens.

| Field | Hypothesis |
|---|---|
| Household | Mother, 36; three children (9, 7, 3); partner works FIFO roster `[TO VALIDATE]` |
| Location / jurisdiction | Regional QLD — HEU registration, renewal cycle anxiety `[TO VALIDATE]` |
| Homeschool experience | Third year; deregistered eldest after a difficult Year 1 `[TO VALIDATE]` |
| Pedagogy | Eclectic, leaning unschooling; suspicious of anything that looks like "school at home" `[TO VALIDATE]` |
| Tech comfort | High-mid; phone-first, rarely at a desktop during the day `[TO VALIDATE]` |
| Core anxiety | Not *whether* learning happens — whether she can **prove** it. "We read a book about frogs" vs. the form that wants "learning areas." |
| Job-to-be-done | End-of-day capture in minutes; translation of lived learning into compliance-legible evidence; reassurance that sparse weeks aren't failure. |
| Failure mode if Hearth doesn't serve her | Keeps a guilt-ridden Google Doc she never opens; panic-assembles evidence the week before renewal. |

**Design decisions that serve Renee:** retrospective-first logging (Architecture Principle 1); the 5-minute rule; completeness gate framed as evidence-protection not punishment (`hearth-logger-spec-v1.md` §4.2); assume-good-faith / no streak-shaming (founding brief §4.5); automatic portfolio (no curation burden, `hearth-portfolio-spec-v1.md` §6); jurisdiction-aware report generation.

**Watch for:** Renee is the persona most likely to log one-handed while catching a toddler — mobile UX findings land on her first. `[TO VALIDATE: actual device mix + time-of-day logging pattern from PostHog `entry_created` timestamps]`

---

## 2. Mei-Lin — "Tell me what to do until I trust myself" (Consumer)

**Founding-brief archetype:** parent who wants structured content — packs, modules, curated pathways.

| Field | Hypothesis |
|---|---|
| Household | Mother, 31; two children (6, 4); first-generation migrant family, both parents in the home business `[TO VALIDATE]` |
| Location / jurisdiction | NSW — NESA registration, *not* HEU; terminology differences are visible to her, not theoretical `[TO VALIDATE]` |
| Homeschool experience | First year; withdrew her 6-year-old mid-Kindergarten `[TO VALIDATE]` |
| Pedagogy | Classical-curious via online communities; hasn't formed her own view yet `[TO VALIDATE]` |
| Tech comfort | High; expects app-store polish, abandons clunky flows silently `[TO VALIDATE]` |
| Core anxiety | Legitimacy. "Am I qualified? Is this even allowed? What does the department expect from me?" Highest compliance fear of the four — and her regulator is **not** the HEU. |
| Job-to-be-done | A credible starting structure (packs, modules); plain-language explanation of her state's requirements; early wins that build legitimacy. |
| Failure mode | Buys three competing curricula in panic; burns out on schedule-keeping; concludes she "can't do this" within two terms. |

**Design decisions that serve Mei-Lin:** Starter Pack + marketplace with zero freemium anxiety (founding brief §4.3); pedagogy wizard that teaches while profiling; jurisdiction config (`src/config/jurisdictions.ts`) speaking *her* regulator's language — this persona is the reason the HEU decoupling matters; onboarding state/territory capture (`5a07b3a`).

**Watch for:** Mei-Lin is the canary for any copy that says "HEU" to a non-QLD family. `[TO VALIDATE: whether non-QLD pilot families exist yet; if none, recruit at least one before personas v2]`

---

## 3. Bec — "I have ideas now" (Builder)

**Founding-brief archetype:** parent growing in confidence, beginning to design her own learning.

| Field | Hypothesis |
|---|---|
| Household | Mother, 41; four children (13, 11, 8, 5); eldest approaching tertiary-pathway questions `[TO VALIDATE]` |
| Location / jurisdiction | SE QLD; veteran of two HEU renewal cycles, no longer frightened of them `[TO VALIDATE]` |
| Homeschool experience | Sixth year `[TO VALIDATE]` |
| Pedagogy | Charlotte Mason, internalized — she'd keep the practices if the label vanished `[TO VALIDATE]` |
| Tech comfort | Mid; desktop in the evening, phone during the day `[TO VALIDATE]` |
| Core anxiety | Not compliance — **ceiling.** Will the platform grow with her, or is it training wheels? Also: capability evidence that tertiary institutions will actually respect (founding brief §3, long-term vision). |
| Job-to-be-done | Module Builder that respects her competence; Constellation/capability threads as a thinking tool, not a report card; evidence trail strong enough for non-traditional university entry. |
| Failure mode | Outgrows the product and leaves, taking the most credible community voice with her. |

**Design decisions that serve Bec:** the "mature user" commitment (founding brief §3 — "he doesn't outgrow a hammer"); Module Builder five-pathway system; pedagogy layer as interpretive-not-prescriptive (C-PA1) — Bec produces her own CM-shaped next-moves, the platform makes threads visible and she pulls them; badge creator; parent-authored marketplace publishing.

**Watch for:** Bec generates the feature requests that sound like roadmap. Log them in the research log; do not treat one Bec email as a mandate. `[TO VALIDATE: whether any current pilot family is actually at builder stage, or whether this persona is 12 months early]`

---

## 4. Sandra — "Our families do this together" (Gatherer / co-facilitator)

**Not from the founding-brief archetypes** — covers the Hearth community feature (multi-family groups, sessions, co-facilitators) which shipped after the brief.

| Field | Hypothesis |
|---|---|
| Household | Mother, 45; two teens; hosts a weekly co-op of 5 families `[TO VALIDATE]` |
| Location / jurisdiction | QLD `[TO VALIDATE]` |
| Homeschool experience | Eighth year; informal mentor to newer families (the Renees and Mei-Lins come to her) `[TO VALIDATE]` |
| Pedagogy | Pragmatic blend; pedagogy-agnostic when organizing group sessions `[TO VALIDATE]` |
| Tech comfort | Mid-low; will follow a clear flow, will not explore; whatever she adopts, five other families adopt `[TO VALIDATE]` |
| Core anxiety | Coordination load. Group sessions produce learning for many children; capturing it per-family is nobody's job and everybody's loss. |
| Job-to-be-done | Run a Hearth group session; have evidence flow to each attending family without re-typing; invite/onboard families without being IT support. |
| Failure mode | Keeps the co-op on a Facebook group + paper sign-in sheet; Hearth's community feature goes unused. |

**Design decisions that serve Sandra:** Hearth groups (sessions, scaffold logging, cross-family observations, collective Our Story narrative); co-facilitator invite flow (the one surface with full e2e coverage — `e2e/co-facilitator-flow.spec.ts`); session evidence → family entry provenance (`sourceSessionId`).

**Watch for:** Sandra is the adoption multiplier and the accessibility floor. If a flow needs exploration to discover, she never finds it. `[TO VALIDATE: does any pilot family actually run a multi-family group yet?]`

---

## 5. Anti-personas

From founding brief §6 — Hearth is explicitly **not** designed for:

- **The manual-control compliance author** — wants to write every HEU/NESA submission from scratch with zero platform interpretation. Hearth's interpretation layer *is* the product.
- **The blank-spreadsheet tracker** — wants no platform content of any kind.
- **The static practitioner** — no drive to improve or formalize their approach over time.
- **The label-only "homeschooler"** — not actually educating. The platform assumes good faith and never accuses; it is simply not built for this case (risk-register item, not a product feature).

Do not bend specs to serve anti-personas. When a feature request arrives, check it against this list before the persona list.

---

## 6. Profile-capture template (fill from real pilot households)

One block per consenting pilot family. Anonymize: first name or alias only, no surnames, no children's names (use ages). Store completed profiles in this doc under §7; cite them from persona fields to clear `[TO VALIDATE]` tags.

```markdown
### P<n> — <alias> (captured YYYY-MM-DD, source: <call / email / onboarding packet response>)
- Jurisdiction + registration status:
- Children (ages only):
- Years homeschooling / what prompted the start:
- Pedagogy self-description (their words, verbatim):
- Tech comfort + primary device / when in the day they'd realistically log:
- Biggest anxiety (their words, verbatim):
- What they tried before Hearth:
- Closest persona (Renee / Mei-Lin / Bec / Sandra / none):
- Surprises (anything that contradicts the persona set):
- Linked research-log entries: R<n>, R<m>
```

## 7. Captured profiles

_(none yet — first capture target: before the end of the first pilot term)_

---

*Cross-references: `hearth-founding-brief-v1.md` (archetypes, values), `hearth-parent-journey-v1.md` (the stages these personas move through), `hearth-research-log.md` (evidence that validates or breaks these hypotheses), `hearth-decisions-log-v1.md` PR-1 (the convention binding them together).*
