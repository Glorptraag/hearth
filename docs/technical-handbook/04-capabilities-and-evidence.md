<!-- Version: 1 | Date: 2026-10-26 | Changes: Initial creation. -->

# 04 — Capabilities and evidence

> Part of the [Hearth Technical Handbook](./README.md). Charted against `main` at `e6ca4b5`.

## In one paragraph

Hearth describes a child's learning in terms of **capabilities**, not school grades. The framework has **15 domains**, **57 capability threads** (strands such as early number sense or oral storytelling), and **171 learning objectives** called **DLOs**: three per thread, one for each tier (**emerging → developing → demonstrating**). Every logged moment can count as evidence towards a DLO. Hearth keeps a careful, rule-based record of which child has shown which objective, and how strongly. That record drives the **Constellation** (the visual map of a child's learning) and feeds curriculum coverage on the compliance report. The AI only *suggests* evidence. Fixed rules decide what counts, and a parent's confirmation always counts.

## How it works

### The framework

| Level | Count | Example | Lives in |
|---|---|---|---|
| Domain | 15 | Mathematics, Language, Executive Function… | Sanity `capabilityDomain` |
| Thread | 57 | `L3`, `M2`, `EF4`… | Sanity `capabilityThread` |
| DLO (objective) | 171 (3 per thread) | `dlo.L3.emerging` | Sanity `discreteLearningObjective` |

Each DLO also carries **regulatory mappings**: which Australian Curriculum v9 codes it supports, per state, and how strongly. These mappings let the report compute coverage without any AI (see [05](./05-reporting-and-portfolio.md)). The framework lives in Sanity and in code (`src/lib/capability-universe-v2.ts`). A readable snapshot is in [`docs/hearth-capability-dlo-reference.md`](../hearth-capability-dlo-reference.md).

The parent-facing app shows threads and plain-language descriptions only. **Curriculum codes stay behind the scenes** (Architecture Principle 6).

### How evidence is recorded

Each piece of evidence is a row in `observation_dlo_links`. Two labels on each row matter:

| Label | Values | Meaning |
|---|---|---|
| **Evidence state** | `observed` | Something was actually seen. **Counts.** |
| | `opportunity` | An activity was designed to target this objective, but no one has confirmed it happened. **Does not count yet.** |
| **Provenance** | `inferred` | The AI suggested it from an entry |
| | `asserted` | A parent confirmed it |

Where evidence comes from:
1. **AI enrichment** of a logged entry adds `observed` + `inferred` links. Each is credited only to the child the AI named (see [03](./03-the-learning-cycle.md#stage--enrichment)).
2. **Completing a targeted module activity** adds an `opportunity` link at the tier the author set. It becomes `observed` only when corroborated, either by the AI noticing it for that named child or by a parent confirming it.
3. **A parent tapping "confirm"** on an objective in the Constellation adds an `observed` + `asserted` link. It appears in the child's list of moments as "You confirmed this".

**Why the opportunity rule exists:** simply ticking off an activity must never move a child's progress by itself. Only corroborated evidence can (decision D-OS1). This protects the honesty of the record that a report rests on.

### How a child's status is decided

For each child and each DLO, `learner_dlo_status` is recalculated from **all** `observed` evidence to date (`src/lib/ai/dlo-persistence.ts`):

| Status | Rule |
|---|---|
| **demonstrating** | At least 1 piece of demonstrating-tier evidence |
| **developing** | At least 2 pieces of developing-tier evidence, **or** 1 that a parent confirmed or an author declared |
| **emerging** | At least 1 piece of emerging-tier evidence |
| **not started** | Nothing observed yet |

A **thread's** tier is then derived from its DLOs' statuses (`src/lib/ai/thread-tier.ts`). A parent can **override a thread's tier downwards** but never upwards. An override can only make the record more cautious, never inflate it.

### The Constellation

Our Story → Capabilities (`/our-story/capabilities`). It reads the snapshot plus `learner_dlo_status` and offers several views of the same data:

- **Constellation** (the default): a linked star graph. Every domain, thread and objective is a star, and every relationship is a line. Pan, pinch-zoom and drag. Selecting a domain, thread or objective "telescopes" into a cone showing what's nearby (1–3 links away), with the moments behind an objective hanging off it. Works at phone width.
- **Table:** a text-first view of every thread, with a tier, a "New" chip (first evidence within 14 days), a recent-activity dot (within 7 days), and the trajectory.
- **Explore:** an overview layout.

Old `?view=gallery` links still work and land on the Constellation.

Each objective appears in one of **four states**: confirmed (demonstrating), developing, emerging, not started. At the deepest level, the panel shows "**Next to watch for**", the next objective the child hasn't reached yet. Deep links work (`?view=constellation&d=3&focus=L3`). The graph is fully keyboard-operable.

### Suppressed threads

Thread **H6 (First Nations Australian Perspectives)** is hidden from every parent-facing screen during the pilot, pending cultural consultation. Evidence for it **is still recorded**, so nothing is lost when it is switched back on. The one switch is `ALPHA_SUPPRESSED_THREAD_IDS` in `src/lib/capability-alpha-suppression.ts`. Admin views don't hide it.

## Where it lives

| Thing | Location |
|---|---|
| Framework (code side) | `src/lib/capability-universe-v2.ts`, `src/types/capability-universe.ts` |
| Framework (content side) | Sanity `capabilityDomain` / `capabilityThread` / `discreteLearningObjective` |
| Evidence and status rules | `src/lib/ai/dlo-persistence.ts`, `src/lib/ai/thread-tier.ts` |
| Parent confirm / override | `POST /api/capabilities/[learnerId]/dlo/[dloId]/confirm`, `/api/capabilities/[learnerId]/override` |
| Constellation screen | `src/app/(auth)/our-story/capabilities/` (`_constellation/`) |
| Tables | `observation_dlo_links`, `learner_dlo_status`, `custom_threads` |

## What can go wrong

| Parent asks… | Answer |
|---|---|
| "Why is my child still *emerging* when we do this all the time?" | Developing needs **two** separate pieces of developing-level evidence, or one the parent confirms. They can open the objective in the Constellation and confirm it |
| "I finished the module activity. Why didn't it count?" | Completing an activity creates an *opportunity*, not evidence. It counts once it's seen in a logged moment or confirmed by the parent. This is deliberate |
| "My other child got credit for something they didn't do" | This shouldn't happen since D-OS2 (credit goes only to the named child). Capture the entry ID in `docs/hearth-research-log.md` and raise it as a bug |
| "I can't see the First Nations thread" | Hidden on purpose during the pilot. Their evidence is still being kept |
| "I confirmed something and it isn't in their moments" | Fixed in build 2026-10-19 (confirmations now appear as "You confirmed this"). If it still happens, raise it as a bug |
| "The star map is too fiddly on my phone" | Pinch to zoom, or switch to the Table view (the view switcher at the top). The Table shows the same information as text |

## Status and known gaps

- **Working:** the evidence chain end to end, four-state objectives, parent confirmations, lower-only overrides, recency and trajectory, deep links, the linked-graph Constellation (merged as `e6ca4b5`), and the suppression switch.
- **Open product decision (Drew):** what exactly moves a thread from one tier to the next, in words parents can read. Until that is decided, no parent-facing rubric copy ships. See [`docs/hearth-tier-rubric-drift-v1.md`](../hearth-tier-rubric-drift-v1.md). Support should explain the rules in the table above rather than promise a published rubric.
- **Leftover screen:** an old, unlinked `/constellation` route still exists. Nothing in the app links to it, and keep-or-delete is a pending Drew decision. It is not a second constellation. The real one is under Our Story.
- **Content dependency:** report coverage needs regulatory mappings to be written in Sanity for each state. Without them, the report uses an older fallback (see [05](./05-reporting-and-portfolio.md)).

> **Going deeper:** [`docs/hearth-outcomes-spine-plan-v1.md`](../hearth-outcomes-spine-plan-v1.md) · [`docs/hearth-constellation-architecture-v1.md`](../hearth-constellation-architecture-v1.md) · [`docs/hearth-capability-dlo-reference.md`](../hearth-capability-dlo-reference.md) · [`docs/hearth-capability-universe-v2-architecture-spec-v1.md`](../hearth-capability-universe-v2-architecture-spec-v1.md)
