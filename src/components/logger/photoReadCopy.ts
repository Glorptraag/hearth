// COPY PENDING DREW APPROVAL (pivot plan §3 gate, 26 Oct)
/**
 * Every parent-facing string for the Photo Read disclosure (P4, D-LP-4) and
 * its Settings toggle. Draft, written to the Logger v2 copy rules (spec §5.2:
 * none of "try this", "next time", "should", "sorry", "AI", "insight",
 * "score", "complete", or the arrow glyph). Pair with PR #233's label when that
 * lands.
 *
 * Three things the sheet must say (pivot plan W3.2): what is sent, that nothing
 * is kept beyond the run record, and how to turn it off.
 *
 * Accuracy note for review: the "not kept by Anthropic" line is true only once
 * zero data retention is in place for the API org (A3). Read stays off in
 * production until then, so the line describes the only state in which a
 * photo is ever read.
 */
// COPY PENDING DREW APPROVAL (pivot plan §3 gate, 26 Oct)
export const photoReadCopy = {
  sheet: {
    overline: 'Before your first photo',
    title: 'Want Hearth to read your photos?',
    intro:
      'Hearth can look at a photo you add and offer a short description of what’s in it, like the title on a worksheet or what’s on the table. It shows up as a draft after you save. You choose whether to use it.',
    whatIsSentTitle: 'What’s sent',
    whatIsSent:
      'One photo from the moment, made smaller and with its location removed, goes to Anthropic, the company that does the reading. Nothing else about your family goes with it.',
    whatIsKeptTitle: 'What’s kept',
    whatIsKept:
      'Anthropic doesn’t keep the photo after reading it. Hearth keeps the short description with the moment, and a log line saying a photo was read. Your photo stays in your Hearth, as it always does.',
    turnOffTitle: 'Turning it off',
    turnOff: 'You can turn this off any time in Settings, under Family Profile. Photos still save either way.',
    notYetAvailable:
      'Photo reading isn’t switched on for every family yet. Your answer is saved for when it is.',
    accept: 'Yes, read my photos',
    decline: 'Not now',
    closeLabel: 'Close without answering',
  },
  setting: {
    label: 'Photo reading',
    description:
      'Hearth reads a photo you add to a moment and offers a short description as a draft. The photo goes to Anthropic for the reading and isn’t kept there.',
    unanswered: 'You haven’t answered yet. Hearth will ask the first time you add a photo.',
    notYetAvailable: 'Not switched on for every family yet. Your choice is saved for when it is.',
    saveFailed: 'Couldn’t save that. Try again in a moment.',
    viewerNote: 'Only the people who manage this Hearth can change this.',
  },
} as const;
