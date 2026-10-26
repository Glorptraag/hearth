/**
 * Every parent-facing string on the Notice (capture) side of the Logger.
 * Australian English. No forward prescription, no apology, no AI tells.
 */
export const noticeCopy = {
  title: 'Log a moment',
  draftSaved: (time: string) => `Draft saved · ${time}`,

  who: 'Who was learning?',
  multiChildNote: 'Saved to each child’s story.',
  noLearners: 'Add a child in Settings to start logging.',
  noLearnersAction: 'Open Settings',
  learnersFailed: 'We couldn’t load your children. Check your connection and try again.',
  learnersRetry: 'Try again',

  what: 'What happened?',
  whatPlaceholderFallback: 'A few words is plenty. What did you see or hear?',
  voiceStart: 'Start voice input',
  voiceStop: 'Stop voice input',
  voiceTranscribing: 'Transcribing voice input',
  listening: 'Listening…',
  transcribing: 'Transcribing…',
  voiceUnsupportedTitle: 'Voice needs microphone access in a recent browser',

  felt: (name: string) => `${name} — how did it feel?`,
  noticedPlaceholder: (name: string) => `Anything ${name} said, asked or noticed? (optional)`,
  noticedLabel: (name: string) => `What ${name} said, asked or noticed`,

  when: 'When?',
  today: 'Today',
  yesterday: 'Yesterday',
  anotherDay: 'Another day',
  pickDate: 'Pick the date',

  add: 'Add',
  /** The primary, photo-first action (W3.1). */
  addPhoto: 'Add a photo',
  addPhotoHint: 'A photo on its own is enough to save.',
  addingPhoto: 'Adding photo…',
  /** An added photo in the evidence list. */
  photoLabel: 'Photo',
  addMore: 'Or add',
  addWords: 'Their words',
  addLink: 'Link',
  remove: (kind: string) => `Remove ${kind}`,
  photosNeedConnection: 'Photos need a connection',
  photoUnreadable: 'That photo couldn’t be opened. Pick another one.',
  photoTooLarge: 'That photo is too large to add. Pick a smaller one.',
  photoUnavailable: 'Photos can’t be added just now. Your words still save.',
  photoFailed: 'Couldn’t add that photo. Check your connection and try again.',

  catchUp: 'Catching up on a few days?',
  batchLog: 'Batch log',
  importCsv: 'Import a CSV',

  save: 'Save',
  saving: 'Saving…',
  blockedNoLearner: 'Pick who was learning',
  blockedNothingNoticed: 'Add a few words or a photo',

  offlineBanner:
    'Offline — your draft is saved on this phone. Save will go through when you’re back online.',
  draftRestored: 'Picked up where you left off',
  draftDateReset: ' — we’ve set the date to today; change it if it was another day.',
  dismiss: 'Dismiss',
  startFresh: 'Start fresh',

  savedOffline: 'Saved on this phone — it’ll go through when you’re back online.',
  couldNotQueue:
    'You’re offline and this device couldn’t queue the moment. Your draft is safe — try again when you’re back online.',
  forbidden: 'Your account can view this family’s story but can’t add to it.',
  rateLimited: 'Hearth is catching its breath — try again in a minute.',
  saveFailed: 'Couldn’t save. Your draft is safe — try again.',

  voiceErrors: {
    permission: 'Microphone access is blocked — enable it in your browser settings.',
    network: 'Couldn’t reach the transcriber — check your connection and try again.',
    'no-speech': 'Didn’t catch any speech — try again, or type instead.',
    failed: 'Voice transcription failed — please try again, or type instead.',
    unsupported: 'Voice needs microphone access in a recent browser.',
  } as const,

  source: {
    hearthTitle: (hearthName: string) => `Logging from ${hearthName}`,
    hearthDetail: (title: string, date: string) => `${title} · ${date} · pre-filled from the shared record`,
    projectTitle: 'Logging a project stage',
    projectDetail: (stageNumber: number | null) => (stageNumber === null ? 'Project' : `Stage ${stageNumber}`),
    checkInTitle: (name: string | null, threadName: string | null) =>
      name && threadName ? `Checking in on ${name}’s ${threadName}` : name ? `Checking in on ${name}` : 'Checking in',
    checkInDetail: 'Jot what you noticed — we’ll look for it after you save.',
  },
} as const;
