<!-- Version: 1 | Date: 2026-05-09 | Changes: Initial brief. Defines what the Hearth runtime workstream in Claude Code needs to absorb to consume Methodology Overlay Bundle data on the family-app side. References the canonical spec at hearth-methodology-overlay-bundle-v1.md. -->

# Hearth Runtime Workstream Integration Brief — Methodology Overlay Bundle

> **Workstream:** Hearth runtime (family app, Next.js) in Claude Code
> **Authority:** `hearth-methodology-overlay-bundle-v1.md` (canonical spec)
> **Paired brief:** `hearth-kindler-methodology-integration-brief-v1.md` (generation side)
> **Priority:** HIGH — paired with the next Module Experience iteration

---

## What Hearth Runtime Is Absorbing

The Methodology Overlay Bundle is read at runtime as pure database data. No LLM calls. No template-time interpretation. The runtime's job is:

1. Read the `methodologyOverlays` field from the module document
2. Intersect with the family's selected practices
3. Render the overlay on the appropriate Module Experience surfaces
4. Compose with Pedagogy Lens Bundle data on shared surfaces (Logger prompts, Constellation thread weights)
5. Silently fall back when overlays are missing

This brief covers the runtime read paths, surface integration, fallback behaviour, and the files affected.

---

## 1. Read Paths

The family pedagogical profile already supplies the `practices: string[]` array (max 5, ordered by priority). The runtime intersects this with `module.methodologyOverlays` keys to determine which overlays to render.

```typescript
type MethodologyOverlay = {
  practiceKey: string;
  loggerPromptHint?: string | null;
  prepHint?: string | null;
  observationCue?: string | null;
  evidenceTagBias?: string[];
  corpusChunkIds?: string[];
  generatedAt?: string;
  generatedBy?: string;
};

function getActiveOverlays(
  module: Module,
  profile: FamilyPedagogicalProfile
): MethodologyOverlay[] {
  if (!profile.practices || profile.practices.length === 0) return [];
  if (!module.methodologyOverlays || module.methodologyOverlays.length === 0) {
    return [];
  }

  return profile.practices
    .map(practiceKey =>
      module.methodologyOverlays.find(o => o.practiceKey === practiceKey)
    )
    .filter((o): o is MethodologyOverlay => Boolean(o))
    .filter(hasAnySubstantiveField);
}

function hasAnySubstantiveField(o: MethodologyOverlay): boolean {
  return Boolean(
    o.loggerPromptHint ||
    o.prepHint ||
    o.observationCue ||
    (o.evidenceTagBias && o.evidenceTagBias.length > 0)
  );
}
```

The order of returned overlays follows the family's practice priority order. This matters for surface composition where multiple overlays stack (Logger prompt strip, Prep "How you might do this" section).

---

## 2. Surface Integration

### 2.1 Logger workspace

**Current file:** `hearth-logger-workspace-v3.html`
**New version:** `hearth-logger-workspace-v4.html`

In the description prompt strip (the area below the entry text area showing live AI insights and pedagogy lens copy), add a methodology row beneath the pedagogy lens copy.

Composition rule:
- Pedagogy lens copy: always rendered (with eclectic fallback if family has no pedagogy)
- Methodology row: rendered only if `getActiveOverlays(module, profile)` returns one or more overlays with `loggerPromptHint`
- Up to 3 hints shown, ordered by family practice priority. Overflow truncated silently in v1.
- Each hint appears as a sans-serif single-line row with a small practice-key pill (e.g. "narration", "nature-journaling") to its left.

If the entry has no `module_id` (free-form Logger entry not against a module), no methodology row is shown. Methodology overlays are module-bound by design.

### 2.2 Module Experience — Prep mode

**Current file:** `hearth-module-experience-v3.html`
**New version:** `hearth-module-experience-v4.html`

Add a new section below the existing pedagogy `facilitationNote`: **"How you might do this"**.

This section is populated from active overlays' `prepHint` fields, ordered by family practice priority.

Render rule:
- Section header: "How you might do this" (serif, 600 weight)
- One stacked card per active overlay with `prepHint`, each card showing:
  - Practice name (sans, label weight) — e.g. "Narration" or "Hands-on materials"
  - Prep hint prose (serif body, 35–60 words)
- If no overlays have `prepHint`, the section is hidden entirely (not shown empty).
- No limit on number of cards — a family with 5 practices all affording the module sees 5 cards. Surface design accommodates this naturally because cards are short.

### 2.3 Module Experience — Log mode

**Same file as 2.2** — `hearth-module-experience-v4.html`

In the prompt list above the description field (currently rendering pedagogy `observationCues`), append methodology `observationCue` items.

Composition rule:
- Pedagogy observation cues: rendered first (up to 3, per existing spec)
- Methodology observation cues: appended after, ordered by family practice priority
- Each methodology cue includes a small source pill ("via narration", "via nature-journaling") on the right edge to distinguish from pedagogy cues
- Total list capped at 5 items combined; methodology cues truncated first if cap is hit

### 2.4 Constellation node detail

**Current file:** `hearth-constellation-map-v2.jsx`
**New version:** `hearth-constellation-map-v3.jsx`

When viewing a module's Constellation node, the existing `evidencePriorities` rendering shows weighted capability threads from the pedagogy bundle. Add methodology `evidenceTagBias` weighting on top.

Composition rule:
```typescript
function getCompositeWeight(
  threadKey: string,
  pedagogyBundle: PedagogyLensBundle,
  activeOverlays: MethodologyOverlay[],
  practicePriorities: string[] // family.practices, ordered
): number {
  const pedagogyWeight = pedagogyBundle.evidencePriorities
    ?.find(p => p.threadKey === threadKey)?.weight ?? 0;

  const methodologyContribution = activeOverlays.reduce((sum, overlay) => {
    if (!overlay.evidenceTagBias?.includes(threadKey)) return sum;
    const priorityIndex = practicePriorities.indexOf(overlay.practiceKey);
    const priorityFactor = (5 - priorityIndex) / 5; // 1.0 → 0.2 across 5 practices
    return sum + 0.3 * priorityFactor; // bias contribution capped per practice
  }, 0);

  return pedagogyWeight + methodologyContribution;
}
```

The visual rendering (size, opacity, ordering) reflects the composite weight. Tooltip on a thread shows both pedagogy and methodology contributions when both are non-zero, with one-line interpretation if available.

### 2.5 Other surfaces (deferred)

Module library cards, dashboard summaries, and notifications do not consume methodology overlays in v1. These can be revisited if observed family use suggests value.

---

## 3. Fallback Behaviour

The methodology layer's silent fallback is the default when:

- The family has no practices selected (e.g., wizard skipped)
- The module has no methodology overlays (legacy modules created before Kindler v6)
- The module's `methodologyStatus` is `pending` (Kindler async job hasn't landed yet)
- All overlays for the family's selected practices are empty (`methodologyStatus: ready` but no substantive content for any active practice)

In all these cases, the runtime renders the Module Experience exactly as it did before this work — with pedagogy bundle surfaces only, and no methodology surfaces visible. There is no "your practices don't apply here" messaging. Silence is correct.

When the methodology overlay is `pending` and the family is mid-experience, the same silent fallback applies. The family may see a richer experience the next time they view the module, but no loading state is shown.

---

## 4. Files Hearth Runtime Needs to Update

| File | Change | New version |
|---|---|---|
| `hearth-logger-workspace-v3.html` | Add methodology row to prompt strip | `hearth-logger-workspace-v4.html` |
| `hearth-module-experience-v3.html` | Add "How you might do this" section in Prep; append methodology observation cues in Log mode | `hearth-module-experience-v4.html` |
| `hearth-constellation-map-v2.jsx` | Composite thread weighting from pedagogy + methodology contributions | `hearth-constellation-map-v3.jsx` |
| `hearth-pedagogy-engine-v2.jsx` | No change required — practice selection logic unchanged | unchanged |
| Family pedagogical profile reader / hook | Already exposes `practices`. Confirm import paths and types in the runtime codebase. | unchanged |
| Sanity GROQ queries for module fetch | Add `methodologyOverlays`, `methodologyAffordances`, `methodologyStatus` to module fetch projections | inline in component changes |
| Type definitions (`MethodologyOverlay`, etc.) | Add new types matching the Sanity schema in `kindler` brief Section 1 | inline |

Update `COMPONENT_REGISTRY.md` for each new component version, with the spec link to `hearth-methodology-overlay-bundle-v1.md`.

---

## 5. Sanity GROQ Projection Update

The module fetch query needs the new fields:

```javascript
*[_type == "module" && _id == $moduleId][0] {
  // ... existing fields ...

  // Pedagogy bundles (existing)
  lensStatus,
  pedagogyLensBundles,

  // Methodology overlays (new)
  methodologyStatus,
  methodologyAffordances,
  "methodologyOverlays": methodologyOverlays[] {
    practiceKey,
    loggerPromptHint,
    prepHint,
    observationCue,
    evidenceTagBias,
    generatedAt
  }
}
```

`corpusChunkIds` and `generatedBy` are not fetched at runtime — they are admin-only fields for traceability.

---

## 6. Performance Considerations

The methodology overlay read is part of the existing module fetch. No additional database query is required. Sanity GROQ projections grow modestly to include the new fields.

The runtime composition (intersecting family practices with overlays, ordering, capping) is pure JavaScript and runs in O(family_practices × module_overlays) which is at most 5 × 12 = 60 comparisons per render. Negligible.

The Constellation composite weighting is O(threads × active_overlays) — also negligible at realistic scale.

No caching changes are needed. The module fetch is already cached at the existing TTL.

---

## 7. Acceptance Criteria

A runtime implementation of this brief is complete when:

1. A family with selected practices opens a module with methodology overlays. The Logger entry surface for that module shows methodology prompt hints below the pedagogy lens copy, ordered by practice priority, capped at 3.

2. The Module Experience Prep mode shows a "How you might do this" section populated from active overlay `prepHint` fields, hidden entirely when no overlays apply.

3. The Module Experience Log mode shows methodology observation cues appended to pedagogy observation cues, with source pills distinguishing them, capped at 5 combined.

4. The Constellation node detail shows composite thread weighting reflecting both pedagogy `evidencePriorities` and methodology `evidenceTagBias` contributions, with tooltips that explain the contributions.

5. Silent fallback applies cleanly: a family with no practices, a module with no overlays, or all-empty overlays produces a Module Experience indistinguishable from the pre-methodology version.

6. No LLM calls are made at runtime for methodology rendering. All read paths complete from the existing module fetch.

7. The 5-minute rule is preserved on every methodology-touched surface.

8. All design system tokens used follow the canonical token rules — surfaces, ember/sage usage, typography hierarchy. Mont Blanc Dark Coffee compliance is maintained across all modified components.

9. Mobile-first behaviour is preserved on all touched surfaces. The new "How you might do this" section stacks cleanly on narrow viewports. The Logger methodology row collapses gracefully when the prompt strip is height-constrained.

---

## 8. Open Questions for Drew

1. Should the methodology source pill ("via narration") show in the Logger prompt row, the Module Experience Log mode, both, or neither? (v1 default: both, distinguished from pedagogy by visual treatment.)

2. When a methodology overlay is `pending` and the family is mid-experience, do we show a quiet "your methodology view is loading" hint, or stay fully silent? (v1 default: silent.)

3. Is the cap-at-5 on combined Logger observation cues right, or should it scale with screen size?

4. Should the Constellation tooltip distinguish pedagogy vs methodology contributions explicitly, or just show the composite weight without breakdown?

---

*Brief paired with `hearth-kindler-methodology-integration-brief-v1.md` and authority spec `hearth-methodology-overlay-bundle-v1.md`. Both must ship together.*
