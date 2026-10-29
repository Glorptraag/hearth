<!-- Version: read-v1 | Date: 2026-10-19 | Changes: Initial Photo Read prompt section (launch pivot W1.3). -->
# Photo Read: prompt section

The Read is a plain, literal description of what an entry's photo shows. It is not a separate model call: `buildReadPromptSection()` in `read-schema.ts` returns the text between the markers below, and `enrichEntry` adds it to its existing Haiku call as one more top-level JSON key (`photo_read`). The reply is checked by `parseReadOutput()`. A refusal or an invalid reply gives `null`. The parser never invents or repairs a Read.

**This file and `read-schema.ts` must match exactly.** `read-schema.test.ts` fails if the text between the markers differs from `buildReadPromptSection()`, or if the version in the header above differs from `READ_PROMPT_VERSION`. When you change the prompt, edit both files and bump the version in both.

Why the rules are what they are:
- **Describe only what is visible.** Skill, subject, outcome and DLO mapping happen in the rest of the enrichment, from the parent's words. The Read only says what the camera saw, so it can't make claims about learning.
- **No names, no guessed identity.** The photo may show a child the model can't tell apart from a sibling. `parseReadOutput` also blanks `doing` and drops any `seen` phrase that contains a known child name.
- **Headers only, never page body.** Worksheets and books are copyrighted. Transcribing a title is enough to match the Shelf; copying the body of a page is not allowed.
- **Low confidence means an empty `doing`.** An empty sentence is better than a wrong one.

<!-- BEGIN PROMPT -->
PHOTO READ (only when one or more photos are attached to this entry):
Add one more top-level key to your JSON, "photo_read". If no photo is attached, or you cannot or will not describe it, set "photo_read": null.

"photo_read": {
  "seen": ["string"],
  "doing": "string",
  "artefact": "worksheet|book|writing|drawing|build|nature|cooking|screen|other",
  "printedText": "string",
  "peopleVisible": 0,
  "confidence": "high|low"
}

PHOTO READ RULES:
- Describe only what is visible in the photo. Do not infer what happened before or after it was taken.
- seen: at most 8 short noun phrases (6 words or fewer each) for the main visible things, e.g. "times-table worksheet", "pencil", "wooden blocks".
- doing: one present-tense sentence of 20 words or fewer saying what is observably happening, e.g. "A child is writing numbers on a worksheet at a table." No evaluation (never "well", "carefully", "beautifully", "struggling"), no names.
- Never name a skill, subject, learning outcome, curriculum area, age, year level or quality of work. Those belong to the rest of this JSON, not to the Read.
- Never guess who anyone is. Say "a child" or "an adult", never a name, even if a name appears in the entry text or in the photo.
- artefact: the single best fit from the list. Use "other" when none fits.
- printedText: transcribe only a visible title, lesson name or page header, 12 words or fewer. Never transcribe the body of a page, book, worksheet or screen. Use "" when there is no clear header.
- peopleVisible: how many people can be seen, including partly (hands count). 0 when none.
- confidence: "high" only when the photo is clear and you are sure of the description. Otherwise "low". When confidence is "low", set doing to "".
- The Read must stay within about 250 output tokens.
<!-- END PROMPT -->
