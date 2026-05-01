# Hearth Decisions Log — v1

> **Purpose:** Append-only record of design and engineering decisions that need to outlive any single PR or session. One row per decision. Cross-link the document of record where the rule actually lives.
> **Format:** `S<n> — <Topic>: <one-line decision>. Document of record: <path>.`
> **Rule:** New decisions append at the bottom. Never edit a past entry — append a successor that supersedes it.

---

## Design System

### S14 — Icon library

**Decision:** Phosphor Icons (production), Lucide (prototypes).

Phosphor `regular` weight only. Five sizes: 14 / 16 / 18 / 22 / 32 (`--icon-xs` through `--icon-xl`). Default 18. Icons inherit `currentColor` — never `color` props or hex on icons. Custom illustrator marks match Phosphor stroke specs (1.5px @ 24px viewBox, round caps/joins, single-colour stroke).

Lucide stays in HTML prototypes for CDN convenience; mechanical name-swap migrates them to Phosphor when the prototype becomes production code (~80% identical names — full map in the rules doc).

App code imports from `@/components/icons` only, never directly from `@phosphor-icons/react`. The central index is the single swap point when custom marks land.

Existing components are not migrated up-front — they migrate as they're touched. First full migration: the Dashboard rebuild.

**Document of record:** `docs/hearth-icon-system-v1.md`
**Implementation:** `src/components/icons/index.tsx`
**Token spec:** `docs/hearth-canonical-design-tokens-v1.md` Appendix B

**Date:** 2026-04-30
