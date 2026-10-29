<!-- Version: 1 | Date: 2026-10-26 | Changes: Initial creation. -->

# 06 — Content, modules and planning

> Part of the [Hearth Technical Handbook](./README.md). Charted against `main` at `e6ca4b5`.

## In one paragraph

Alongside logging what already happened, Hearth offers **ready-made learning content** that families can use when they want it. Content is organised as **Pack → Module → Approach → Activity**: a pack is a themed bundle, a module is a unit aimed at one understanding, an approach is one way into it (hands-on, story-led…), and an activity is one concrete thing to do. All content lives in **Sanity** and is written to be **philosophy-neutral**. Hearth changes the *vocabulary* to match each family's teaching philosophy when it's displayed, never the content itself. Families add packs to their **library**, work through modules (a **module run**), plan a week in the **Weekly Planner**, and can author their own modules in the **Module Builder**. Forward planning is supported but is never the main path. Logging is.

## How it works

### The content library

| Part | What it is | Where |
|---|---|---|
| **Packs, modules, approaches, activities** | The four core content types, plus projects (multi-stage), badges, assets and shared texts. 19 Sanity document types in total | Sanity; schemas in `src/sanity/schemas/` |
| **Explore** | Browse and discover content; editor's picks; recommendations | `/explore`, `/library` |
| **Library** | The packs a family has added. Removing a pack soft-deletes it (`removed_at` is set), so it can be restored | `family_library`, `/api/library` |
| **Recommendations** | Modules are matched to the family by tag overlap with their children's threads and their pedagogy. **No AI call.** Worked out during the snapshot rebuild | `src/lib/ai/recommend.ts` |
| **Marketplace / paid packs** | Paid packs bought by card through **Stripe**, on the web only. The price is always re-read from Sanity, never trusted from the browser. A successful payment writes an `entitlements` row | `/api/stripe/checkout`, `/api/stripe/webhook` |

**Who writes content:**
1. **Editorial content** (official packs) is written by Drew in **Sanity Studio**, or built by the separate *kindling* pipeline (a different repository, run on Drew's machine), which writes straight to Sanity.
2. **Family-authored modules** come from the in-app Module Builder via `/api/modules/publish`, which stamps the family as author.
3. **Content QA** (`/admin/content/qa`) checks content for missing fields and inconsistencies. It **flags** issues but does **not** block publishing.

### Using a module: the module run

When a family starts a module, Hearth creates a **module run** (`module_runs`) to track their progress.

| Run state | Meaning |
|---|---|
| `active` | In progress |
| `paused` | Set aside, can be resumed |
| `finished` | Completed |
| `abandoned` | Dropped |

Modules are either **sustained** (a set run with an end) or **open-ended** (long-lived practices such as nature journals or instrument practice, which outlive individual logs). The module page has three modes:
- **Prep:** materials, facilitator guidance, what understanding to look for.
- **Facilitate:** a session timer and the activity steps.
- **Log:** opens the Logger with the module attached. The entry then goes through the normal [Learning Cycle](./03-the-learning-cycle.md), and also picks up the activity's **declared** threads and learning-objective *opportunities* (see [04](./04-capabilities-and-evidence.md)).

### The Module Builder (Plan → Module Builder)

Parents can create their own modules through **five entry pathways**, each starting from a different place:

| Pathway | Starting point |
|---|---|
| Material-anchored | "I want to teach through something" (a book, a kit, an object) |
| Process / steps | "I know how this goes" |
| Inquiry | "A question came up" |
| Retrospective lift | "We've been doing this already" (turns logged practice into a module) |
| Goal-forward | "I have a learning goal" |

All five lead to the same short editor and produce the same module shape. The AI helps fill fields **when a draft is saved** (`src/lib/ai/enrich-module.ts`), not live. Drafts are stored in `module_drafts` and can be resumed. A scheduled job deletes drafts untouched for **90 days**.

### The Weekly Planner (Plan → Weekly Planner)

A simple week grid (`planner_entries`) for families who like to plan ahead. It can suggest modules from the snapshot, and a logged entry can be linked back to its planned slot. It's deliberately lightweight: Hearth never generates a schedule or a to-do list for the parent.

### Badges and projects

- **Badges:** families can create their own badges (Plan → Badge Creator) or use library badges. The snapshot rebuild checks thresholds and notifies the parent when a child is ready; the parent then runs a short assessment to award it. Tables: `badge_definitions`, `badge_awards`, `badge_assessment_logs`.
- **Projects:** multi-stage content. Each stage can be logged, and its artifacts are captured as evidence.

### The pedagogy layer

Each family picks a teaching philosophy in onboarding (and can re-run the wizard in Settings): **Charlotte Mason, Classical, Montessori, Waldorf/Steiner, Unschooling or Eclectic**. That choice:

- **Changes words, not content.** A vocabulary adapter (`src/lib/pedagogy/adapter.ts`) swaps terms on screen. For example, a Charlotte Mason family sees narration-flavoured language.
- **Adds per-module lenses.** Each module can carry a lens for each philosophy and overlays for twelve "practices", written in advance by the content pipeline. These are never generated live.
- **Grounds the AI (optional).** The **Pedagogy Knowledge Base** is a reviewed, licence-checked library of passages about each philosophy. Its source files live in `corpus/pedagogy/`, and every source must be cleared in `sources.json` before use. Reviewed entries are published to Sanity and indexed for search. With `PEDAGOGY_KB_ENABLED=true`, enrichment and coaching draw on these passages, and parents see which sources were used.

The pedagogy system is **interpretive, not prescriptive**. It never branches content, never schedules the week, and never calls the AI when a screen is viewed.

### Community hearths

A **hearth** is a small group of families who meet for shared sessions (`hearths`, `hearth_memberships`, `hearth_sessions`, `session_attendance`, `session_evidence`, `session_reflections`). A session can open each family's Logger pre-filled ("scaffolded"). Afterwards, reflections from the session can be summarised by AI at write time (`src/lib/ai/hearth-narrative.ts`).

## Where it lives

| Thing | Location |
|---|---|
| Sanity client, queries, mutations | `src/lib/sanity/{client,queries,mutations,helpers}.ts` |
| Module page | `src/app/(auth)/module/[id]/` |
| Module runs API | `src/app/api/module-runs/` |
| Module Builder | `src/app/(auth)/build/modules/`, `src/lib/module-builder/`, `/api/modules/publish`, `/api/modules/drafts` |
| Planner | `src/app/(auth)/planner/`, `/api/planner` |
| Pedagogy | `src/lib/pedagogy/`, `src/components/pedagogy/`, `corpus/pedagogy/` |
| Content QA | `src/lib/content-qa/`, `/admin/content/qa` |
| Payments | `src/app/api/stripe/`, `src/lib/stripe/`, `entitlements` table |

## What can go wrong

| Symptom | Likely cause | What to do |
|---|---|---|
| A module looks wrong for everyone | A content issue in Sanity | Check `/admin/content/qa`, then fix in Sanity Studio. No deploy needed: content changes go live when published |
| A family can't find a pack they added | It was removed (soft-deleted) | It can be re-added; the earlier state is kept |
| "I paid but the pack isn't there" | The Stripe webhook didn't write the entitlement | Check the Stripe dashboard for the `checkout.session.completed` event and its delivery to `/api/stripe/webhook`, then check the `entitlements` table for the family |
| "There's no way to buy packs in the app" | They're on the native app build | Expected: store rules for the Australian storefront mean digital purchases are left out of native builds. Buy on the web |
| My module draft disappeared | Untouched for 90+ days, so the retention job deleted it | Not recoverable |
| The vocabulary feels wrong for our philosophy | Pedagogy setting, or a gap in the adapter's terms | Re-run the pedagogy wizard in Settings. Report terminology gaps for the adapter |

## Status and known gaps

- **Working:** the content hierarchy and library, Explore and recommendations, module runs, the five-pathway builder with resumable drafts, the planner, badges, projects, the pedagogy adapter, hearths, and web payments.
- **Content volume:** the Starter Pack is seeded (121 Sanity documents, 79 activities). Further packs come from the kindling pipeline.
- **Retired:** the in-app editorial "Content Studio" (#117, commit `0baa3d8`). Editorial work now happens in Sanity Studio.
- **Off by default:** the pedagogy knowledge base retrieval (`PEDAGOGY_KB_ENABLED`).

> **Going deeper:** [`docs/hearth-pack-data-architecture-v1.md`](../hearth-pack-data-architecture-v1.md) · [`docs/hearth-module-builder-pathways-architecture-v2.md`](../hearth-module-builder-pathways-architecture-v2.md) · [`docs/hearth-weekly-planner-spec-v1.md`](../hearth-weekly-planner-spec-v1.md) · [`docs/hearth-pedagogy-system-architecture-v1.md`](../hearth-pedagogy-system-architecture-v1.md) · [`corpus/pedagogy/README.md`](../../corpus/pedagogy/README.md) · [`docs/hearth-marketplace-spec-v1.md`](../hearth-marketplace-spec-v1.md)
