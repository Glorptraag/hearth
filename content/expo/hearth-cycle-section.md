# Expo copy: the Hearth Cycle section

<!-- Status: draft · confirmedAt: null · confirmedBy: null · Source: docs/hearth-cycle-brief-v1.md §1, §2, §4.1, §10, §12; docs/hearth-cycle-build-plan-v1.md (expo copy step); pivot `src/app/(public)/expo/expoCopy.ts` -->

This is draft copy for the `/expo` page on the launch pivot branch. It sits **below** the existing hero, which stays as it is:

- Banner: "Any curriculum. Or none. Ready for the HEU."
- Verbs: "Snap. Confirm. Report."

The section's job is to show a stand visitor what sits underneath "Snap. Confirm. Report.": Hearth helps the parent teach, not just record. Nothing in this section changes the hero's promise.

## 1. `expoCopy` addition

Paste this as a new top-level key in `expoCopy` (pivot branch, `src/app/(public)/expo/expoCopy.ts`), after `verbs`. It follows the file's existing shape: plain strings, `heading` + `items`, and `as const` on the parent object.

```ts
  cycle: {
    heading: 'The Hearth Cycle',
    intro:
      'Recording is only half of it. Hearth helps you get ready for each session, notice what your child actually did, and choose what comes next. Every session makes the next one better.',
    stages: [
      {
        stage: 'Prepare',
        body: 'Pick one thing to watch for before you start. One thing, not a checklist.',
      },
      {
        stage: 'Learn',
        body: 'Use your curriculum, a library book or the backyard. Hearth fits around what you already do.',
      },
      {
        stage: 'Notice',
        body: 'Afterwards, a couple of taps: did it show up? Their own words are the best evidence there is.',
      },
      {
        stage: 'Turn',
        body: 'What you saw shapes the next session, and now and then Hearth offers a teaching idea to try.',
      },
    ],
    patterns: {
      heading: 'Four ways to shape a session',
      items: [
        {
          title: 'Read · Tell back',
          moves: 'Read once → Tell back → Write one line',
          line: 'They tell it back in their own words, and you keep one line of it.',
        },
        {
          title: 'Show · Try · Repeat',
          moves: 'Show → Try → Leave it out',
          line: 'Show it slowly with few words, then let them have a go and come back to it.',
        },
        {
          title: 'Explore · Notice · Name',
          moves: 'Explore → Notice → Name',
          line: 'Let them look first. The word lands better once they have noticed the thing.',
        },
        {
          title: 'Story · Draw · Recall',
          moves: 'Tell the story → Draw it (next day) → Say it back (day three)',
          line: 'What comes back on day three is what they have really kept.',
        },
      ],
    },
    note: 'We are building the Cycle with our founding families. Parts of it are in Hearth now, and the rest arrives as we build it together.',
  },
```

Checks this copy passes:

- **No outcome promise.** It doesn't say "you'll be a better teacher in three months" (brief §1). That claim would need substantiation under Australian Consumer Law, and we have none yet. "Every session makes the next one better" describes how the product works, not a result for the parent.
- **No feature promises.** Rhythms, morning cards and the Lesson Builder aren't built, and the build plan says none of the Cycle is built yet. The stage bodies describe the way of working. The `note` says plainly that the Cycle is being built with founding families, and it names no dates or features.
- **"Any curriculum. Or none." holds.** The Learn stage names curriculum, library books and the backyard, and the patterns are shapes, not content.
- **No freemium language**, no "AI", no "should", no streaks or scores, and no praise of the parent.

## 2. Rationale

The hero sells the outcome a registering family needs first: evidence and a report for the HEU. The Cycle section answers the next question a thoughtful parent asks at a stand ("Is this just a record-keeper?") without taking anything away from that promise. It shows what makes Hearth different (brief §1: "Every session makes the next one better"), and the four patterns make that concrete in a few seconds of reading. It's honest about what's built. The Cycle is presented as how Hearth works and where it's heading, and founding families are invited to shape it, which is also why the research card sits next to it at the stand. The patterns are shown neutrally, so a Charlotte Mason, Montessori or unschooling family can each see their own way of working in them without being told which tradition they belong to.

## 3. Stand card (A6 or DL, two-sided)

### Front

> **The Hearth Cycle**
>
> Prepare → Learn → Notice → Turn
>
> Every session makes the next one better.
>
> Any curriculum. Or none.
>
> [QR to /expo]

### Back: "How this session is built"

> **How this session is built**
>
> **A walk along the creek** · *Explore · Notice · Name*
>
> 1. **Explore.** Let Sam poke about at the creek's edge for a while. Hold back on teaching.
> 2. **Notice.** Ask "What do you notice about the water?" and follow whatever he points out.
> 3. **Name.** When he says it's quicker over the rocks, give him the word: current.
>
> **Watch for:** Sam uses a word for what he noticed, like "current", on his own.
>
> Afterwards, one question: *did it show up?* Saw it · Partly · Not yet · Didn't come up.
> Every answer is useful, including "Didn't come up".
>
> Hearth is built in Australia, for Australian home educators.

The back reuses the worked example from `content/lesson-patterns/pattern.explore-notice-name.yaml`, so the card and the pattern draft stay in step. If Drew changes one, change both.

## 4. Research card (for stand visitors)

A separate small card or clipboard sheet. It takes about two minutes. Each question fills a field in the profile-capture template (`docs/hearth-pilot-personas-v1.md` §6).

> **Help us build Hearth for families like yours**
>
> *About you (optional):* State or territory ____ · Registered? Yes / In progress / Not yet / Not needed · Children's ages (no names, please) ____
>
> **1. How long have you been home educating, and what got you started?**
>
> ______________________________________________
>
> **2. In your own words, how would you describe the way you teach?**
>
> ______________________________________________
>
> **3. What's the hardest part of home educating for you right now?**
>
> ______________________________________________
>
> ☐ **Yes, Hearth can keep my answers to help shape the app.** We store them under a first name or nickname only, never your surname or your children's names, and we use them only for research. You can ask us to delete them at any time.
>
> First name or nickname ____ · Email, only if you're happy for us to follow up ____

### Where the answers go (for Drew, not printed)

Only cards with the consent box ticked are kept. Unticked cards are shredded after the expo.

| Card field | Persona template field (§6) |
|---|---|
| State · Registered? | Jurisdiction + registration status |
| Children's ages | Children (ages only) |
| Q1 | Years homeschooling / what prompted the start |
| Q2 | Pedagogy self-description (their words, verbatim) |
| Q3 | Biggest anxiety (their words, verbatim) |

- Each consenting card becomes a `P<n>` block in `docs/hearth-pilot-personas-v1.md` §7, with source "expo stand card, 9 Nov 2026". Fill "Closest persona" and "Surprises" during transcription; leave the device and "tried before" fields blank unless the visitor said something about them.
- Any finding that confirms or challenges a persona or journey stage gets an `R<n>` entry in `docs/hearth-research-log.md`, citing the `P<n>`.
- Transcribe Q2 and Q3 word for word. They clear `[TO VALIDATE]` tags only when quoted exactly.
- Q1 also maps onto the onboarding starting-stage question (WF §7.6), which makes it a cheap first check of whether those four options match how parents describe themselves.
