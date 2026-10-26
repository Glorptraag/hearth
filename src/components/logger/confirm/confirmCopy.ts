/**
 * Every parent-facing string on the Confirm (post-save) surface. Every sentence
 * here is human-authored; the chips are the only model-derived content and
 * they carry provenance. No forward prescription, no apology, no auto-dismiss.
 */
export const confirmCopy = {
  region: 'Moment saved',
  overline: 'Moment captured',

  heading: {
    queued: 'Saved on this phone.',
    pending: 'Saved.',
    proposals: 'Saved. Here’s what we noticed.',
    nothing: 'Saved.',
    failed: 'Saved.',
  },
  sentence: {
    queued: 'It’ll go through when you’re back online.',
    pending: 'Reading it now…',
    /** Pending, when the save carried a photo and Photo Read is on for this family (W3.3). */
    pendingPhoto: 'Reading your photo now…',
    nothingSingle: 'Nothing to confirm from this one. It still counts.',
    nothingMulti: (names: string) => `Nothing to confirm from this one. It still counts for ${names}.`,
    nobodyNamed: (names: string) =>
      `Hearth couldn’t tell who did what here, so nothing is proposed. It still counts for ${names}.`,
    failed:
      'We couldn’t read this one just now. It’s safe in your Portfolio — you can try again from there.',
  },

  helper: 'Tap one if it rings true. Tap again to undo.',
  chipLabel: (threadName: string, tier: string, confirmed: boolean) =>
    confirmed ? `${threadName} · ${tier}` : `${threadName} · ${tier}?`,
  chipAria: (name: string, threadName: string, tier: string, confirmed: boolean) =>
    confirmed
      ? `${name}, ${threadName}, ${tier} — confirmed. Tap to undo`
      : `${name}, ${threadName}, ${tier} — tap to confirm you’ve seen this`,
  chipError: 'Couldn’t save that. Tap again to retry.',

  evidence: (n: number) => (n === 1 ? '1 piece of evidence' : `${n} pieces of evidence`),
  photo: (n: number) => (n === 1 ? '1 photo' : `${n} photos`),

  /**
   * The Photo Read draft row (W3.3, A1). The draft is model text, so it is
   * always labelled as a draft and only becomes the moment's words when the
   * parent takes it.
   */
  readDraft: {
    label: 'A draft from your photo',
    use: 'Use this',
    edit: 'Edit',
    editLabel: 'The words for this moment',
    saveEdited: 'Use these words',
    cancel: 'Cancel',
    accepted: 'Added to this moment.',
    error: 'Couldn’t save those words. Tap again to retry.',
  },

  /** The Working-from chip (W3.3, D-LP-6): a Shelf match on the photo's printed header. */
  workingFrom: {
    prompt: (label: string) => `Working from: ${label}?`,
    confirmed: (label: string) => `Working from: ${label}`,
    yes: 'Yes',
    change: 'Change',
    no: 'No',
    changeLegend: 'What were you working from?',
    resourceLabel: 'Resource',
    levelLabel: 'Level (if any)',
    levelNone: 'None',
    lessonLabel: 'Lesson number (if any)',
    save: 'Save',
    cancel: 'Cancel',
    error: 'Couldn’t save that. Tap again to retry.',
  },

  attachLink: 'From a module in your library? Link it',
  attached: (title: string) => `Linked to ${title}`,

  badgeAction: 'Have a look',

  openPortfolio: 'Open Portfolio',
  readAgain: 'Read it again',
  retryFailed: 'Couldn\u2019t read it again just now. It\u2019s safe in your Portfolio.',

  done: 'Done',
  logAnother: 'Log another',
} as const;

/** "Sam", "Sam and Lily", "Sam, Lily and Noah". */
export function joinNames(names: readonly string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
