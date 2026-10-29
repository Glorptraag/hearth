<!-- Version: 1 | Date: 2026-10-26 | Changes: Initial creation. Section-by-section technical handbook for service-level roles, written against main e6ca4b5. -->

# Hearth Technical Handbook

> **Who this is for:** anyone in a service-level role — support, operations, pilot coordination, a future hire picking up the platform — who needs to understand *what the technology does and why* without reading the code.
> **What it is for:** making the technology transparent and recorded in one place, so the project can move into the product phase and support work can be handed over and reallocated.
> **Charted against:** `main` at `e6ca4b5` (26 October 2026). Where this handbook and the code disagree, the code wins; where it and `docs/PROJECT_STATUS.md` disagree on *status*, PROJECT_STATUS wins.

---

## How to read this handbook

Each section covers one part of the system and follows the same layout, so you can jump straight to what you need:

1. **In one paragraph:** what it is, in plain words.
2. **How it works:** the steps, in order.
3. **Where it lives:** the screens, services and code paths (for when you hand over to an engineer).
4. **What can go wrong:** symptoms, the likely cause, and what to tell a parent.
5. **Status and known gaps:** what is finished, what is not, and what is deliberately left out.

You do not need to read the sections in order. If you only read one, read **[03 — The Learning Cycle](./03-the-learning-cycle.md)**. Nearly every support question ends up there.

## The sections

| # | Section | Covers | Read it when… |
|---|---|---|---|
| 01 | [Platform and services](./01-platform-and-services.md) | The building blocks: hosting, sign-in, databases, content system, AI, storage, monitoring | You need to know what Hearth runs on, or who to contact when a provider has an outage |
| 02 | [The Logger](./02-the-logger.md) | The capture screen where parents record learning, incl. voice, drafts and offline saving | A parent says "I couldn't save", "my entry disappeared", or "voice didn't work" |
| 03 | [The Learning Cycle](./03-the-learning-cycle.md) | What happens after Save: AI enrichment → family snapshot → dashboard, constellation and notifications | A parent says "I saved it but nothing showed up", or "Hearth noticed something odd" |
| 04 | [Capabilities and evidence](./04-capabilities-and-evidence.md) | Capability threads, learning objectives (DLOs), tiers, the Constellation, parent confirmations | A parent asks "why is my child at *emerging*?" or "why didn't this count?" |
| 05 | [Reporting and portfolio](./05-reporting-and-portfolio.md) | The compliance report, the six work samples, coverage, PDF export, the portfolio | Report season, or a parent asks whether their report is "enough" |
| 06 | [Content, modules and planning](./06-content-modules-and-planning.md) | The content library (packs, modules, activities), module runs, the Module Builder, the Weekly Planner, the pedagogy layer | A parent can't find content, a module looks wrong, or a pack purchase didn't arrive |
| 07 | [Families, accounts and access](./07-families-accounts-and-access.md) | Family accounts, roles (owner/editor/viewer), invites, settings, payments, data export and deletion | Access problems, co-facilitator invites, account deletion requests |
| 08 | [Operations and support](./08-operations-and-support.md) | Monitoring, kill switches, scheduled jobs, deploys, costs, the support playbook and the handover checklist | Something is broken *now*, or you are taking over support |

---

## Hearth in two minutes

Hearth is a learning record for Australian homeschool families. Its core idea is **retrospective logging**: parents write down learning *after* it happens ("we baked bread and talked about fractions"), and the system does the work of turning those notes into a structured record that satisfies their state's homeschool reporting rules.

The whole product rests on one loop:

```
Parent logs a moment  →  Saved to the database  →  AI reads it once, in the background
        ↑                                                       ↓
Parent sees it reflected  ←  Screens read the summary  ←  Family summary ("snapshot") is rebuilt
(dashboard, constellation,
 report, portfolio)
```

Three design rules explain most of how the technology behaves. If you remember nothing else, remember these:

1. **AI runs when something is *written*, not when something is *viewed*.** When a parent saves an entry, the AI reads it once and the result is stored. Every screen afterwards reads the stored result. This keeps screens fast and cheap, keeps the AI bill predictable, and means a report says the same thing tomorrow as it does today. (There are a small number of deliberate exceptions, listed in [03](./03-the-learning-cycle.md#the-deliberate-exceptions).)
2. **Saving never waits for the AI.** The entry is saved first and the parent is told so. The AI runs afterwards. If the AI fails, the entry is still safe; only the "insights" are missing, and the parent can retry.
3. **Content and family data live in different places.** Reusable learning content (packs, modules, activities, the capability framework) lives in **Sanity**, a content system. Everything about a family (children, entries, reports, settings) lives in **Postgres**, a database. They never mix.

---

## Glossary

Plain-language definitions of terms you will meet in the other sections, in support tickets, and in the code.

| Term | Meaning |
|---|---|
| **Entry** / **learning moment** | One thing a parent logged. Stored as a row in `learning_entries`. |
| **Logger** | The capture screen at `/log`. |
| **Enrichment** | The background AI pass over a saved entry: detects subjects, maps it to capability threads and learning objectives, suggests insights. |
| **Snapshot** (Family Intelligence Snapshot) | A pre-computed summary of everything Hearth knows about a family, rebuilt after each save. Every screen reads from it. Table: `family_intelligence_snapshots`. |
| **Capability thread** | One of 57 strands of capability (e.g. a strand of numeracy or oral language), grouped into 15 domains. The child-facing "map" of learning. |
| **DLO** (Discrete Learning Objective) | A specific, observable objective inside a thread. Each thread has three, one per tier. 171 in total. |
| **Tier** | How far along a thread a child is: **emerging → developing → demonstrating**. |
| **Constellation** | The visual map of a child's threads and DLOs, under Our Story → Capabilities. |
| **Observed vs opportunity** | An *observed* DLO link is evidence. An *opportunity* means an activity was designed to target that DLO, but nobody has seen it happen yet. Only observed links count. |
| **Inferred vs asserted** | *Inferred* = the AI suggested the link. *Asserted* = a parent confirmed it. |
| **HEU** | Home Education Unit, Queensland's regulator. QLD is the pilot's anchor state; all 8 states/territories are configured. |
| **Work sample** | One of the six evidence slots on the annual compliance report (early/later writing, maths, and a choice area). |
| **Coverage** | How much of the state curriculum a child's evidence touches, computed by fixed rules (not AI) for the report. |
| **Pack → Module → Approach → Activity** | The content hierarchy. A pack is a bundle; a module is a unit of learning; an approach is one way into it; an activity is one thing to do. |
| **Module run** | A family's instance of working through a module (active, paused, finished or abandoned). |
| **Pedagogy** | The family's teaching philosophy (Charlotte Mason, Classical, Montessori, Waldorf/Steiner, Unschooling, Eclectic). Changes the *words* Hearth uses, never the content itself. |
| **PKB** | Pedagogy Knowledge Base: a reviewed library of passages about each philosophy that the AI can draw on when enriching an entry. |
| **Hearth (community)** | A small group of families who run shared sessions together. Lower-case "a hearth" is the group; "Hearth" is the product. |
| **Owner / editor / viewer** | The three roles on a family account. Owners manage everything; editors can log and edit; viewers can only look. |
| **Kill switch** | A setting that turns a feature off instantly without a code change. Listed in [08](./08-operations-and-support.md#kill-switches). |

---

## Corrections this handbook makes to older docs

Writing this handbook meant checking the older runbooks against the code. Where the two disagree, this handbook follows the code. The older docs need updating to match:

| Older claim | Where | What the code actually does (`e6ca4b5`) |
|---|---|---|
| "Anthropic outage → `enrich.ts` falls back to the keyword matcher; entries persist." | `docs/oncall-cheatsheet.md` symptom table | Entries do persist. But **there is no server-side keyword fallback.** The keyword matcher (`src/lib/ai/keyword-matcher.ts`) only runs in the parent's browser while they type, to show live hints. If Anthropic is down, the enrichment call is retried once and then the entry is marked `failed`. The parent sees a "couldn't add insights" state and can retry later (limited to 10 retries per hour per family). See [03](./03-the-learning-cycle.md#what-can-go-wrong). |
| "No runtime LLM calls in UI." | `CLAUDE.md`, `docs/system-map.md` | This is the rule, with **four deliberate, documented exceptions**: live draft insights in the Logger, voice transcription (Deepgram, not Anthropic), and the two report-annotation helpers. See [03](./03-the-learning-cycle.md#the-deliberate-exceptions). |
| "Daily retention cron runs `detectNoisyFamilies()`." | `CLAUDE.md` (Key implementation surfaces) | `vercel.json` schedules `/api/admin/retention` **weekly**, Sundays at 02:00 UTC (`0 2 * * 0`). The noisy-family check only looks at the 24 hours before it runs, so a spike on any other day isn't flagged automatically. Either change the schedule to daily or fix the doc; until then, watch the AI Cost panel. See [08](./08-operations-and-support.md#scheduled-jobs). |
| Upstash listed as an external dependency | `CLAUDE.md` → external services guide | Rate limiting is **in-memory** today (`src/lib/rate-limit.ts`). Upstash/Redis is designed but deferred (`docs/redis-rate-limiter-plan.md`). It only becomes necessary if Hearth runs in more than one Vercel region. |

---

## Keeping this handbook current

- Update the relevant section **in the same pull request** as any change to the behaviour it describes, like `docs/PROJECT_STATUS.md`.
- Bump the version line at the top of the file you change.
- If you find a new failure mode while supporting a family, add it to that section's "What can go wrong" table **and** to `docs/hearth-research-log.md`, per its convention.
- The engineering-depth docs listed in each section's "Going deeper" box stay the source of truth for engineers. This handbook summarises them and points to them; it should never contradict them silently.
