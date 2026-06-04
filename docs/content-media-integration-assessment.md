# Content Media Integration — Honest Assessment

> 2026-06-04. Written during the alpha pack cleanup. Records what media a pack
> can and cannot rely on Hearth to produce, so editorial can tell the difference
> between "this pack is a draft because the words aren't done" and "this pack is
> blocked on media we have no way to generate."

## TL;DR

There is **no audio- or image-generation pipeline** in Hearth today.

| Capability assumed | Reality in the codebase | Status |
|---|---|---|
| Deepgram (audio) | **No code, no dependency, no env var.** Zero references in `src`, `scripts`, or `docs`. | ❌ Does not exist |
| Google Gemini (image generation) | **No code.** No image-generation of any kind. The architecture explicitly *avoids* Google/Gemini for content — see `docs/external-services-guide.md` ("Hearth carries Australian children's data and the parent contract explicitly avoids Google"). | ❌ Does not exist (and is a deliberate non-goal) |
| Audio synthesis (any) | A single narrow helper: `src/lib/ai/tts.ts` → `synthesizeJa()`, **Google Cloud Text-to-Speech, Japanese only** (`ja-JP-Neural2-B`), gated on `GOOGLE_TTS_API_KEY`. Wired to **nothing but `scripts/tts-smoke-test.ts`** — not the content pipeline, not asset creation, not runtime. | 🟡 Exists but unwired & language-scoped |
| Images / worksheets / audio assets in content | `asset` documents hold an **uploaded `file`** (and optional `thumbnail` image). They are authored and uploaded by hand in Sanity Studio — never generated. | ✅ Manual only |

So the working assumption that "we have Deepgram and Gemini integration for images
and audio" is **not borne out**. Whatever those packs assumed would be
auto-produced has to be produced by hand instead.

## What this means for the pack cleanup

A pack can be incomplete for two unrelated reasons, and they want different fixes:

1. **Placeholder materials (`[NEEDED]`).** The words/materials list still has
   holes. Fixable by editing in Sanity. These packs should be **unpublished at
   the pack level** and finished as drafts.
   → Detect: `npm run audit:content-readiness`.
   → Fix: `npm run retract:packs -- --with-needed-materials --commit`.

2. **Blocked on media we can't generate.** The pack references an `audio` asset,
   or an asset whose `file` was never uploaded. No pipeline will fill that in;
   someone has to record/produce and upload it.
   → Detect: surfaced as a warning by `npm run audit:content-readiness`.
   → Fix: produce the asset by hand, upload in Sanity, then re-publish.

The audit treats (1) as a hard failure (a live pack with `[NEEDED]` materials is
a dead-end for families) and (2) as a warning (a pack can legitimately ship while
its audio is still being recorded — that's an editorial call, not a bug).

## Detection scope (deliberate)

- `[NEEDED]` is matched **only in materials fields** — `pack.materials.description`,
  `module.materials.description`, and `activity.materials[].name` / `.alternative`.
  Instructions and facilitator guidance are intentionally **not** scanned, to
  avoid flagging prose. The shared predicate lives in
  `src/lib/content-readiness/` (unit-tested) so the audit and retract scripts can
  never disagree about what counts.
- Media dependency is detected as **audio-kind assets** and **assets missing an
  uploaded file** reachable through the pack's module → approach → activity →
  asset chain.

## If we ever do want generated media

This is out of scope for the cleanup, but for the record: any audio/image
generation would need to clear the same Australian children's-data bar the rest
of the stack is held to (`docs/external-services-guide.md`). The existing
`GOOGLE_TTS_API_KEY` path is the only precedent, and it is narrow (single
language, single voice, smoke-test only). Treat "add Deepgram / add image
generation" as a real project with a privacy review, not a config toggle.

## Related tooling

- `src/scripts/audit-content-readiness/` — read-only readiness audit (this doc's checks).
- `src/scripts/retract-packs/` — pack-level unpublish for not-ready packs.
- `src/scripts/promote-packs/` — the publish path (promote a draft pack's whole tree).
- `scripts/audit-published-packs.mjs` — finds empty / draft-only published packs.
- `src/lib/content-readiness/` — the shared, unit-tested predicates.
