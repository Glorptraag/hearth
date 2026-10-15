# Hearth — Site Copy System v1

> **Status:** Landed (October 2026). Source of truth for how non-generative web copy is stored, swapped and migrated.
> **Persona + journey stage:** Serves every persona at every stage indirectly — this is the mechanism that lets Drew re-tune wording for Bec ("anxious first-weeker") on the landing/onboarding funnel and for Mel ("fifth-year veteran") on the dashboard without a deploy.
> **Related:** `hearth-data-architecture-overview-v1.md` (Sanity vs Postgres boundary), `Hearth_Dashboard_Our_Story_Content_Spec.md` (copy voice rules), `CLAUDE.md` → "Key implementation surfaces".

---

## 1. The one-sentence model

**Code owns the keys and the fallback. Sanity owns the live value.**

Every static string a parent reads on a migrated surface has a key in `src/lib/copy/defaults.ts`. One published Sanity `siteCopy` document per **surface** (landing, welcome, onboarding, auth, dashboard, …) holds the editable values. The app merges Sanity values over the code defaults at request time, so:

- an editor can swap wording in Studio → **Site Copy** → publish, and it is live within seconds (the existing Sanity publish webhook expires the content cache tag);
- a missing document, missing key, empty value, Sanity outage or unset env var can **never** blank a screen — the code default renders instead;
- a developer adding a string adds it in code first (typed key, fallback, editor note), runs `npm run seed:copy`, and the key appears in Studio.

This is the same shape as the pedagogy knowledge base and capability universe: Sanity for the content layer, code for structure and contracts.

## 2. Pieces

| Piece | Path | Role |
|---|---|---|
| Schema | `src/sanity/schemas/siteCopy.ts` | `siteCopy` document: `surface` (read-only), `title`, `description`, `entries[] { key (read-only), value, note (read-only) }`. Keys/notes are code-owned and read-only in Studio; only `value` is editable. |
| Studio | `sanity.config.ts` → "Site Copy" | Top-level desk section listing one doc per surface. |
| Defaults | `src/lib/copy/defaults.ts` | `COPY_DEFAULTS` — the typed dictionary. Types `CopySurface`, `CopyKey<S>`, `CopyBundle<S>` derive from it, so a typo in a key is a compile error. |
| Resolve | `src/lib/copy/resolve.ts` | Pure merge (`resolveCopy`), Sanity-row normalisation (`normaliseSiteCopyRows`), placeholder fill (`formatCopy`). Client-safe. |
| Server loader | `src/lib/copy/server.ts` | `fetchCopyOverrides()` (tagged, cached, never throws) and `getCopy(surface)` for React Server Components. |
| Client hook | `src/lib/copy/CopyProvider.tsx` | `CopyProvider` (mounted once in `src/app/layout.tsx`) and `useCopy(surface)` for client components. |
| Query | `src/lib/sanity/queries.ts` → `SITE_COPY_QUERY` | All published `siteCopy` docs. Not a gated type (Sanity draft/publish is the gate). |
| Seed | `scripts/seed-site-copy.ts` (`npm run seed:copy`, `npm run copy:check`) | Pushes keys to Sanity. Non-destructive by default. Planning logic is pure + unit-tested in `src/lib/copy/seed-plan.ts`. |
| Tests | `src/lib/copy/*.test.ts(x)` | Defaults contract (keys well-formed, every placeholder documented in its note, ids dot-free), merge rules, tolerance to garbage, server fallback, hook with/without provider, seed merge/reset/drift. |

### Document ids

`siteCopy-<surface>` — **hyphen, not dot**. A dot in a Sanity `_id` makes the document private to tokenless readers, and the server copy fetch is tokenless (same client the browse content uses). This is the same trap that made `capabilityThread`/`pedagogicalFramework` "dark" documents (see `src/lib/sanity/read-allowlist.ts`).

## 3. How to

**Swap wording (editor, no deploy).** Studio → Site Copy → open the surface → edit `Value` → Publish. The entry's `Editor note` says where it shows and which `{placeholders}` it supports. Keep placeholders verbatim; an unknown placeholder renders literally (visible, not silently blank) so a typo is caught on the page.

**Add a string (developer).**
1. Add the key under the right surface in `src/lib/copy/defaults.ts`. If it has placeholders, use the `{ value, note }` form and name every placeholder in the note (a unit test enforces this).
2. Read it: server component → `const c = await getCopy('surface'); c['the.key']`; client component → `const c = useCopy('surface')`. Fill placeholders with `formatCopy(c['the.key'], { name })`.
3. `npm run seed:copy` — adds the new key to Sanity with its default; existing edited values are untouched.

**Add a surface.** Add a top-level entry to `COPY_DEFAULTS` with `title`, `description`, `entries`. Everything else (types, seed, Studio listing) follows.

**Remove a string.** Delete the key from code; the next `seed:copy` drops it from the Sanity document. Nothing reads it in between.

**Re-seed after a deploy.** `npm run seed:copy` is idempotent and safe. `npm run copy:check` reports drift (exit 1 if a seed would change Sanity) — suitable for a deploy checklist step. `--reset` overwrites every value with the code default (use deliberately). `--dry-run` prints the plan.

**Drafts.** The seed writes **published** documents. An unpublished Studio draft of a Site Copy doc shadows the seeded values in Studio only — the seed prints a warning naming such drafts; publish or discard them.

## 4. What is and isn't site copy

**In (Sanity-swappable):** marketing and explanatory copy, headings and sub-headings, empty-state titles/bodies/CTAs, greeting templates, prompt/tip cards, button labels that carry voice ("Set up my family", "Log a moment"), footer lines.

**Out (stays in code), with reasons:**

| Category | Why it stays in code |
|---|---|
| Nav / IA labels (`navConfig.ts`, tray destinations, settings tabs) | They are the information architecture, tied to routes, analytics event names and e2e selectors. Renaming is a product decision, not a copy swap. |
| `aria-label`s and screen-reader text | Accessibility contracts tested by Playwright; must not drift from the visible control. |
| Validation and API error messages | Pinned by unit/integration tests; wording encodes which failure branch fired. |
| Legal pages (`/terms`, `/privacy`) | Long-form, dated, structured with internal links; changes need legal review, not a Studio edit. Follow-up: a `legalPage` Portable Text type with `lastUpdated`, rendered via `@portabletext/react` (already a dependency). |
| Pedagogy catalogue (`src/components/pedagogy/data.ts`), framework `uiCopy` on `pedagogicalFramework` docs | Already Sanity-native per framework (the adapter contract in `src/lib/pedagogy/adapter.test.ts`). Don't duplicate. |
| Capability thread names / DLO descriptors | Sanity-native (`capabilityThread`, `discreteLearningObjective`). The constellation's `dlo-descriptors.ts` stand-ins are a separate, already-documented migration. |
| Anything AI-generated (hearth voice, annotation drafts, progression summaries) | Generative — by definition not site copy. |

## 5. Migration status and backlog

Migrated in v1 (all strings on these surfaces are Sanity-swappable):

- `landing` — `/` public page (48 keys)
- `auth` — chrome around Clerk sign-in / sign-up
- `welcome` — `/welcome` six-slide wizard
- `onboarding` — `/onboarding` steps 1, 2, 4 (step 3 is the pedagogy wizard, see §4)
- `dashboard` — greeting templates, empty states, section labels, sidebar labels, pedagogy prompt/tip cards

Remaining signed-in surfaces, ranked by amount of inline copy (inventory 2026-10-06; copy is inline in JSX with no central constant in any of them). Migrate one surface per PR using the recipe in §3:

1. `src/app/(auth)/build/modules/page.tsx` — Module Builder entry pathways, hints, step intros, success message (~50 strings). Largest single win.
2. `src/app/(auth)/settings/SettingsClient.tsx` — ~10 explanatory paragraphs (account, export, deletion, invites, roles, pedagogy, billing) + `components/settings/*`.
3. `src/app/(auth)/our-story/portfolio/page.tsx` — ~6 empty states, filter hints, edit warning.
4. `src/app/(auth)/our-story/report/page.tsx` — 7-entry subject-nudge map + empty state; `components/report/CoverageInContext.tsx` (4 narrative templates), `WorkSampleCuration.tsx`.
5. `src/components/pedagogy/PedagogyWizard.tsx` — step intros and helper lines (the catalogue itself stays, §4).
6. `src/app/(auth)/log/page.tsx` + `log/_components/*`, `components/logger/*` — section headings, voice/transcription toasts, guided hints (`src/lib/logger/guided-copy.ts`, `THIN_SAVE_MESSAGES`).
7. `components/our-story/OurStoryHubClient.tsx`, `our-story/learner/[id]/LearnerProfileClient.tsx` — learner-name templates and empty states.
8. `our-story/capabilities/page.tsx` — intro paragraph, error/empty copy.
9. `library/LibraryClient.tsx`, `explore/marketplace/MarketplaceShell.tsx`, `explore/activities/page.tsx` — tab empty states, coverage-gap line.
10. `module/[id]/*`, `planner/*`, `components/hearth/*`, `components/feedback/FeedbackModal.tsx`, `components/log/AttachToModuleModal.tsx` — light.

Shared short-label maps (`SUBJECT_LABELS` ×5 copies, `THREAD_LABELS` ×3, `DOMAIN_LABELS`, `TIER_LABELS`, `ROLE_LABELS`) should first be **deduplicated into one code module**; whether they then become a `labels` copy surface is a separate call.

## 6. Operational notes

- **Cache + webhook.** `fetchCopyOverrides` uses `sanityFetch` with the shared `sanity:content` tag and the 300 s self-heal revalidate. The existing publish webhook (`POST /api/revalidate/sanity`) already covers `siteCopy` — no new webhook. If copy seems stale beyond 5 minutes, that webhook is the thing to check (`docs/oncall-cheatsheet.md`).
- **Payload.** The root layout ships only the diff between Sanity and the code defaults to the browser. Until someone edits copy, that payload is `{}`.
- **Failure mode.** The loader logs one `console.warn` (`[site-copy] falling back to code defaults`) and returns `{}`; it never throws. There is no kill switch because the fallback *is* the kill switch.
- **Demo / dev-preview / offline routes** get the same provider; they also fall back to defaults when Sanity is unreachable.
- **Security.** Dashboard greeting headings render the family name inside `<strong>` via `dangerouslySetInnerHTML`; the name is HTML-escaped before interpolation. Copy values from Sanity are rendered as text everywhere else.
